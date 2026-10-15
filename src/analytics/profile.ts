/**
 * The data profile of an overlay: each path measured on a sample per entity
 * type (how often it is filled, how often it holds a list, which value types,
 * how many distinct values, the most common), weighted by how many documents
 * each type has; the creation dates counted per year; the candidates for the
 * entry library counted exactly. The profile then updates the overlay: a path
 * that holds a list in more than 1% of its documents becomes multi-valued, a
 * path filled in less than 5% of every type's documents is commented out.
 *
 * The store is behind ProfileSource, so the profile is tested without Mongo;
 * profileMongo.ts reads a local Mongo.
 */
import { readOverlay, type Overlay } from "./overlay.js";

export type ProfileSource = {
  /** documents per `type` in a collection */
  typeCounts(collection: string): Promise<Record<string, number>>;
  /** a random sample of a type's documents, at most `size`, the paths projected */
  sample(collection: string, type: string, paths: string[], size: number): Promise<Record<string, unknown>[]>;
  /** every value of a path over the documents of the types, exactly: how many documents carry each */
  distribution(collections: string[], types: string[], path: string): Promise<{ documents: number; values: [string, number][] }>;
  /** documents per year of a date path, `null` for those without one */
  yearly(collections: string[], types: string[], path: string): Promise<{ year: number | null; count: number }[]>;
  /** the values that name a user (an identifier of a document in the users collection) */
  lookup(collection: string, values: string[]): Promise<string[]>;
};

export type PathStats = {
  sampled: number;
  /** share of the sampled documents with a value */
  filled: number;
  /** share of the filled documents whose value is (or passes through) a list */
  arrays: number;
  /** value type → number of values */
  bsonTypes: Record<string, number>;
  /** distinct values in the sample */
  distinct: number;
  /** the ten most common values, with the documents that carry them */
  top: [string, number][];
};

export type Action = { kind: "keep" } | { kind: "multiValued"; reason: string } | { kind: "drop"; reason: string };

export type PathProfile = {
  path: string;
  label?: string;
  role?: string;
  /** not in the overlay: profiled because it was asked for (--extra) */
  extra: boolean;
  /** weighted by each type's documents */
  filled: number;
  arrays: number;
  maxFilled: { type: string; filled: number };
  distinct: number;
  top: [string, number][];
  perType: Record<string, PathStats>;
  action: Action;
};

export type LibraryCandidate = {
  path: string;
  /** documents of the cube's types */
  documents: number;
  /** of which with a value */
  filled: number;
  distinct: number;
  top: [string, number][];
  /** how many distinct values name a user of the users collection */
  usersFound?: number;
  /** the values' e-mail domains with their documents, when the values are e-mail addresses */
  domains?: [string, number][];
};

export type Profile = {
  generatedAt: string;
  sample: number;
  thresholds: { multiValuedAbove: number; dropBelow: number };
  types: { collection: string; type: string; documents: number; sampled: number }[];
  typesWithoutDocuments: string[];
  paths: PathProfile[];
  time?: { path: string; byYear: { year: number | null; count: number }[] };
  library: LibraryCandidate[];
};

export type ProfileOptions = {
  sample: number;
  /** paths profiled beside the overlay's */
  extras: string[];
  /** the candidates for the entry library, counted exactly */
  library: string[];
  usersCollection?: string;
  /** a path holding a list in more than this share of its filled documents is multi-valued (0.01) */
  multiValuedAbove?: number;
  /** a path filled in less than this share of every type's documents is dropped (0.05) */
  dropBelow?: number;
};

/** The values at a dotted path, descending through lists the way a Mongo query does; empty strings and nulls are no value. */
export function valuesAt(doc: unknown, path: string): { present: boolean; isArray: boolean; values: unknown[] } {
  let current: unknown[] = [doc];
  let isArray = false;
  for (const segment of path.split(".")) {
    const next: unknown[] = [];
    for (const node of current) {
      if (node === null || node === undefined || typeof node !== "object" || node instanceof Date) continue;
      const value = (node as Record<string, unknown>)[segment];
      if (Array.isArray(value)) {
        isArray = true;
        next.push(...value);
      } else if (value !== undefined) next.push(value);
    }
    current = next.flatMap((value) => (Array.isArray(value) ? ((isArray = true), value) : [value]));
  }
  const values = current.filter((value) => value !== null && value !== undefined && value !== "");
  return { present: values.length > 0, isArray: values.length > 0 && isArray, values };
}

export function bsonType(value: unknown): string {
  if (value instanceof Date) return "date";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "bool";
  if (value && typeof value === "object") return (value as { _bsontype?: string })._bsontype?.toLowerCase() ?? "object";
  return typeof value;
}

const keyOf = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : typeof value === "object" && value !== null && !("_bsontype" in value) ? JSON.stringify(value) : String(value);

const topOf = (counts: Map<string, number>, size: number): [string, number][] =>
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, size);

function statsOf(docs: Record<string, unknown>[], path: string): PathStats & { counts: Map<string, number> } {
  let present = 0;
  let arrays = 0;
  const bsonTypes: Record<string, number> = {};
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const found = valuesAt(doc, path);
    if (!found.present) continue;
    present += 1;
    if (found.isArray) arrays += 1;
    for (const value of found.values) bsonTypes[bsonType(value)] = (bsonTypes[bsonType(value)] ?? 0) + 1;
    for (const key of new Set(found.values.map(keyOf))) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    sampled: docs.length,
    filled: docs.length ? present / docs.length : 0,
    arrays: present ? arrays / present : 0,
    bsonTypes,
    distinct: counts.size,
    top: topOf(counts, 10),
    counts,
  };
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

export async function profile(overlay: Overlay, source: ProfileSource, options: ProfileOptions): Promise<Profile> {
  const multiValuedAbove = options.multiValuedAbove ?? 0.01;
  const dropBelow = options.dropBelow ?? 0.05;
  const wanted = new Set(overlay.entityTypes);

  const types: Profile["types"] = [];
  for (const collection of overlay.sourceCollections) {
    const counts = await source.typeCounts(collection);
    for (const type of Object.keys(counts).sort()) if (wanted.has(type) && counts[type] > 0) types.push({ collection, type, documents: counts[type], sampled: 0 });
  }
  const withDocuments = new Set(types.map((entry) => entry.type));
  const typesWithoutDocuments = overlay.entityTypes.filter((type) => !withDocuments.has(type));

  const dimensions = new Map(overlay.dimensions.map((dimension) => [dimension.sourcePath, dimension]));
  const paths = [...dimensions.keys(), ...options.extras.filter((path) => !dimensions.has(path))];

  const samples = new Map<string, Record<string, unknown>[]>();
  for (const entry of types) {
    const docs = await source.sample(entry.collection, entry.type, paths, options.sample);
    entry.sampled = docs.length;
    samples.set(entry.type, docs);
  }
  const total = types.reduce((sum, entry) => sum + entry.documents, 0);

  const profiles: PathProfile[] = paths.map((path) => {
    const perType: Record<string, PathStats> = {};
    let filledDocs = 0;
    let arrayDocs = 0;
    const merged = new Map<string, number>();
    let maxFilled = { type: "", filled: 0 };
    for (const entry of types) {
      const { counts, ...stats } = statsOf(samples.get(entry.type) ?? [], path);
      perType[entry.type] = stats;
      const weight = stats.sampled ? entry.documents / stats.sampled : 0;
      filledDocs += stats.filled * entry.documents;
      arrayDocs += stats.arrays * stats.filled * entry.documents;
      for (const [key, count] of counts) merged.set(key, (merged.get(key) ?? 0) + count * weight);
      if (stats.filled > maxFilled.filled) maxFilled = { type: entry.type, filled: stats.filled };
    }
    const dimension = dimensions.get(path);
    const arrays = filledDocs ? arrayDocs / filledDocs : 0;
    const action: Action =
      dimension?.role || !dimension
        ? { kind: "keep" }
        : maxFilled.filled === 0
          ? { kind: "drop", reason: "filled in no type's sample" }
          : maxFilled.filled < dropBelow
          ? { kind: "drop", reason: `at most ${percent(maxFilled.filled)} filled (${maxFilled.type})` }
          : arrays > multiValuedAbove && !dimension.multiValued
            ? { kind: "multiValued", reason: `${percent(arrays)} of the filled documents hold a list` }
            : { kind: "keep" };
    return {
      path,
      label: dimension?.label,
      role: dimension?.role,
      extra: !dimension,
      filled: total ? filledDocs / total : 0,
      arrays,
      maxFilled,
      distinct: merged.size,
      top: topOf(new Map([...merged].map(([key, count]) => [key, Math.round(count)])), 10),
      perType,
      action,
    };
  });

  const scope = [...withDocuments];
  const timePath = overlay.dimensions.find((dimension) => dimension.role === "Time")?.sourcePath;
  const time = timePath
    ? { path: timePath, byYear: (await source.yearly(overlay.sourceCollections, scope, timePath)).sort((a, b) => (a.year ?? -1) - (b.year ?? -1)) }
    : undefined;

  const library: LibraryCandidate[] = [];
  for (const path of options.library) {
    const { documents, values } = await source.distribution(overlay.sourceCollections, scope, path);
    const candidate: LibraryCandidate = {
      path,
      documents,
      filled: values.reduce((sum, [, count]) => sum + count, 0),
      distinct: values.length,
      top: [...values].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 15),
    };
    if (values.some(([value]) => value.includes("@"))) {
      const domains = new Map<string, number>();
      for (const [value, count] of values) {
        const domain = value.includes("@") ? value.split("@").pop()!.toLowerCase() : "(no e-mail)";
        domains.set(domain, (domains.get(domain) ?? 0) + count);
      }
      candidate.domains = topOf(domains, 25);
    }
    if (options.usersCollection) candidate.usersFound = (await source.lookup(options.usersCollection, values.map(([value]) => value))).length;
    library.push(candidate);
  }

  return {
    generatedAt: new Date().toISOString(),
    sample: options.sample,
    thresholds: { multiValuedAbove, dropBelow },
    types,
    typesWithoutDocuments,
    paths: profiles,
    time,
    library,
  };
}

const ENTITY_TYPES = /(\n[ \t]*ea:entityTypes)\s+("[^]*?")\s*;/;

/** The overlay updated from the profile, by line: the generated one-line components; what it changed, one line each. */
export function applyProfile(ttl: string, result: Profile): { ttl: string; changes: string[] } {
  const changes: string[] = [];
  let lines = ttl.split("\n");
  const active = (path: string) => lines.findIndex((line) => /^\s*qb:component \[/.test(line) && line.includes(`ea:sourcePath "${path}"`));
  for (const entry of result.paths) {
    if (entry.action.kind === "keep") continue;
    const index = active(entry.path);
    if (index === -1) continue;
    if (entry.action.kind === "multiValued") {
      if (/ea:multiValued/.test(lines[index])) continue;
      lines[index] = lines[index].replace(/ \] ;\s*$/, " ; ea:multiValued true ] ;");
      changes.push(`${entry.path}: multi-valued, ${entry.action.reason}`);
    } else {
      const indent = /^\s*/.exec(lines[index])![0];
      lines = [...lines.slice(0, index), `${indent}# dropped by the profile: ${entry.action.reason}`, `#${lines[index].replace(/^\s{0,2}/, "   ")}`, ...lines.slice(index + 1)];
      changes.push(`${entry.path}: dropped, ${entry.action.reason}`);
    }
  }
  let text = lines.join("\n");
  const empty = new Set(result.typesWithoutDocuments);
  const match = ENTITY_TYPES.exec(text);
  if (match && empty.size) {
    const current = [...match[2].matchAll(/"([^"]*)"/g)].map((found) => found[1]);
    const kept = current.filter((type) => !empty.has(type));
    if (kept.length !== current.length) {
      const rows: string[] = [];
      for (let index = 0; index < kept.length; index += 6) rows.push(kept.slice(index, index + 6).map((type) => `"${type}"`).join(" , "));
      text = text.replace(ENTITY_TYPES, `$1\n${rows.map((row, index) => `    ${row}${index === rows.length - 1 ? " ;" : " ,"}`).join("\n")}`);
      changes.push(`ea:entityTypes: dropped ${current.filter((type) => empty.has(type)).join(", ")} (no documents)`);
    }
  }
  readOverlay(text); // still an overlay
  return { ttl: text, changes };
}

const share = (value: number) => (value === 0 ? "0%" : value < 0.01 ? "<1%" : percent(value));
const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
const values = (top: [string, number][], size = 5) => top.slice(0, size).map(([value, count]) => `${cell(value.length > 30 ? `${value.slice(0, 29)}…` : value)} (${count.toLocaleString("en")})`).join(", ");
const count = (value: number) => value.toLocaleString("en");

export function profileMarkdown(result: Profile): string {
  const population = result.types.reduce((sum, entry) => sum + entry.documents, 0);
  const actionText = (action: Action) => (action.kind === "keep" ? "keep" : `**${action.kind === "drop" ? "drop" : "multi-valued"}**: ${action.reason}`);
  const lines = [
    "# Analytics data profile",
    "",
    `Generated by \`elody-ui analytics profile\` on ${result.generatedAt.slice(0, 10)}: a sample of at most ${count(result.sample)} documents per type, weighted by each type's documents. ` +
      `A path holding a list in more than ${percent(result.thresholds.multiValuedAbove)} of its filled documents is multi-valued; ` +
      `one filled in less than ${percent(result.thresholds.dropBelow)} of every type's documents is dropped.`,
    "",
    "## Population",
    "",
    `${count(population)} documents of ${result.types.length} types.` +
      (result.typesWithoutDocuments.length ? ` Overlay types without documents in these collections: ${result.typesWithoutDocuments.join(", ")}.` : ""),
    "",
    "| collection | type | documents | sampled |",
    "|---|---|---|---|",
    ...result.types.map((entry) => `| ${entry.collection} | ${entry.type} | ${count(entry.documents)} | ${count(entry.sampled)} |`),
    "",
    "## Paths",
    "",
    "Filled and lists are shares of all documents in scope; *best type* is the type where the path is filled most.",
    "",
    "| path | label | filled | best type | lists | value types | distinct (sample) | most common | action |",
    "|---|---|---|---|---|---|---|---|---|",
    ...result.paths.map((entry) => {
      const typesSeen: Record<string, number> = {};
      for (const stats of Object.values(entry.perType)) for (const [type, n] of Object.entries(stats.bsonTypes)) typesSeen[type] = (typesSeen[type] ?? 0) + n;
      return `| \`${entry.path}\`${entry.extra ? " ⁺" : ""} | ${cell(entry.label ?? "")}${entry.role ? ` (${entry.role})` : ""} | ${share(entry.filled)} | ${entry.maxFilled.type ? `${entry.maxFilled.type} ${share(entry.maxFilled.filled)}` : "—"} | ${share(entry.arrays)} | ${Object.keys(typesSeen).sort().join(", ")} | ${count(entry.distinct)} | ${values(entry.top)} | ${actionText(entry.action)} |`;
    }),
    "",
    "⁺ not in the overlay, profiled on request.",
    "",
    "### Filled per type",
    "",
    "Only the types where the path is filled in at least 5% of the sample.",
    "",
    ...result.paths.filter((entry) => !entry.role).map((entry) => {
      const filledTypes = Object.entries(entry.perType).filter(([, stats]) => stats.filled >= 0.05).sort((a, b) => b[1].filled - a[1].filled);
      return `- \`${entry.path}\`: ${filledTypes.length ? filledTypes.map(([type, stats]) => `${type} ${share(stats.filled)}${stats.arrays > 0.01 ? ` (lists ${share(stats.arrays)})` : ""}`).join(", ") : "none"}`;
    }),
    "",
  ];
  if (result.time) {
    const max = Math.max(...result.time.byYear.map((entry) => entry.count));
    lines.push(
      `## Creation dates (\`${result.time.path}\`)`,
      "",
      "Documents per year of creation, exact.",
      "",
      "| year | documents | |",
      "|---|---|---|",
      ...result.time.byYear.map((entry) => `| ${entry.year ?? "none"} | ${count(entry.count)} | ${"█".repeat(Math.max(entry.count ? 1 : 0, Math.round((entry.count / max) * 30)))} |`),
      "",
    );
  }
  if (result.library.length) {
    lines.push(
      "## Entry library",
      "",
      "The candidates for *which library entered the record* (open decision 1 of the plan), counted exactly over the documents in scope. Prepared, not decided.",
      "",
      "| | " + result.library.map((entry) => `\`${entry.path}\``).join(" | ") + " |",
      "|---|" + result.library.map(() => "---|").join(""),
      `| documents in scope | ${result.library.map((entry) => count(entry.documents)).join(" | ")} |`,
      `| filled | ${result.library.map((entry) => `${count(entry.filled)} (${share(entry.documents ? entry.filled / entry.documents : 0)})`).join(" | ")} |`,
      `| distinct values | ${result.library.map((entry) => count(entry.distinct)).join(" | ")} |`,
      `| values that are a user | ${result.library.map((entry) => (entry.usersFound === undefined ? "—" : `${count(entry.usersFound)} of ${count(entry.distinct)}`)).join(" | ")} |`,
      `| most common | ${result.library.map((entry) => values(entry.top, 8)).join(" | ")} |`,
      `| e-mail domains | ${result.library.map((entry) => (entry.domains ? values(entry.domains, 10) : "—")).join(" | ")} |`,
      "",
    );
  }
  return lines.join("\n");
}
