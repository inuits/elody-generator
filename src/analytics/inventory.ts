/**
 * The filter inventory: every filter a declaration declares, read straight
 * from the graph (so the filters of an elody:filtersFragment come along too),
 * reduced to one candidate per document path with a proposed analytics role.
 * The role is a heuristic that says why (`reason`); a person reviews the
 * candidates before the overlay is generated from them.
 */
import { Parser, type Quad } from "n3";
import { Reading } from "../reading.js";
import { conventionalLabelKey, dash, elody, rdfs, sh } from "../vocab.js";

export type FilterKind = "TypeFilter" | "DateFilter" | "SelectionFilter" | "TextFilter" | string;

export type Role = "entity_type" | "time" | "dimension" | "identifier" | "text" | "relation" | "audit";

/** One filter as declared: a node of the graph. */
export type FilterRecord = {
  /** graphqlType of the EntityUi, `fragment:<name>` for a filters fragment, `app` for the App */
  owners: string[];
  /** the nearest list or filters query the filter belongs to, when one names it */
  query?: string;
  alias?: string;
  /** elody:key as declared; a TypeFilter without one filters on `type` */
  key?: string;
  /** the document path: the key without its `<client>:<version>|` prefix */
  path: string;
  /** false when the key carries no `<client>:<version>|` prefix (`type`, `createdfrom`) */
  prefixed: boolean;
  filterKind: FilterKind;
  labelKey?: string;
  optionsKey?: string;
  optionsDistinctBy?: string;
  hidden: boolean;
  defaultValues: string[];
  /** the type values of an elody:optionsInput on `type`, when there is one */
  optionTypes: string[];
};

/** One document path, every filter on it folded together. */
export type Candidate = {
  path: string;
  role: Role;
  reason: string;
  include: boolean;
  labelKey: string;
  /** `declared` when a filter names it (rdfs:label), `conventional` when derived from the path */
  labelSource: "declared" | "conventional";
  labelNl?: string;
  filterKinds: FilterKind[];
  occurrences: number;
  entityTypes: string[];
  aliases: string[];
  prefixed: boolean;
  /** every filter on the path is dash:hidden */
  hidden: boolean;
  /** the type values the filters name: TypeFilter defaults, options limited to a type */
  typeValues: string[];
};

export type Inventory = { filters: FilterRecord[]; candidates: Candidate[] };

/** Label texts by translation key, one bundle per language file; the first bundle that has a key wins. */
export type TranslationBundle = Record<string, unknown>;

const KEY_PREFIX = /^([A-Za-z][\w-]*):(\d+)\|(.*)$/;

/** `vlacc:1|properties.material_type.value` → `properties.material_type.value`; a key without the prefix stays as it is. */
export function normaliseKey(key: string): { path: string; prefixed: boolean } {
  const match = KEY_PREFIX.exec(key);
  return match ? { path: match[3], prefixed: true } : { path: key, prefixed: false };
}

/** Every filter of the declaration: each node with an elody:filterKind. */
export function readFilters(ttl: string): FilterRecord[] {
  const reading = new Reading(new Parser().parse(ttl));
  const incoming = new Map<string, Quad[]>();
  for (const quad of reading.quads()) {
    if (quad.object.termType === "Literal") continue;
    const list = incoming.get(quad.object.value);
    if (list) list.push(quad);
    else incoming.set(quad.object.value, [quad]);
  }

  // up the graph from the filter to whatever declares it: an EntityUi, a filters fragment or the App
  const ownersOf = (start: string): { owners: string[]; query?: string } => {
    const owners = new Set<string>();
    let query: string | undefined;
    const seen = new Set<string>([start]);
    let frontier = [start];
    while (frontier.length) {
      const next: string[] = [];
      for (const node of frontier) {
        query ??= reading.value(node, elody("filtersQuery")) ?? reading.value(node, elody("queryName"));
        for (const quad of incoming.get(node) ?? []) {
          const parent = quad.subject.value;
          if (seen.has(parent)) continue;
          seen.add(parent);
          if (quad.predicate.value === elody("filtersFragment")) {
            owners.add(`fragment:${reading.value(node, elody("fragmentName")) ?? "?"}`);
            continue;
          }
          if (reading.hasType(parent, elody("EntityUi"))) {
            owners.add(reading.value(parent, elody("graphqlType")) ?? parent);
            continue;
          }
          if (reading.hasType(parent, elody("App"))) {
            owners.add("app");
            continue;
          }
          next.push(parent);
        }
      }
      frontier = next;
    }
    return { owners: [...owners].sort(), query };
  };

  const filters: FilterRecord[] = [];
  for (const quad of reading.quads()) {
    if (quad.predicate.value !== elody("filterKind")) continue;
    const node = quad.subject.value;
    const filterKind = quad.object.value.replace(elody(""), "");
    const key = reading.value(node, elody("key"));
    const { path, prefixed } = key ? normaliseKey(key) : { path: filterKind === "TypeFilter" ? "type" : reading.value(node, elody("alias")) ?? "?", prefixed: false };
    const optionTypes = reading
      .nodes(node, elody("optionsInput"))
      .filter((input) => reading.value(input, elody("key")) === "type")
      .flatMap((input) => reading.values(input, elody("value")).flatMap((head) => reading.list(head)));
    filters.push({
      ...ownersOf(node),
      alias: reading.value(node, elody("alias")),
      key,
      path,
      prefixed,
      filterKind,
      labelKey: reading.value(node, rdfs("label")),
      optionsKey: reading.value(node, elody("optionsKey")),
      optionsDistinctBy: reading.value(node, elody("optionsDistinctBy")),
      hidden: reading.literal(node, dash("hidden")) === true,
      defaultValues: reading.values(node, sh("defaultValue")),
      optionTypes,
    });
  }
  return filters.sort((a, b) => a.path.localeCompare(b.path) || a.owners.join().localeCompare(b.owners.join()));
}

const IDENTIFIER_SEGMENTS = new Set(["identifiers", "id", "_id", "isbn", "ean", "email", "issn", "code"]);
const TEXT_WORDS = ["title", "name", "description", "wording", "subtitle"];

/** The path's meaningful segments: the v2 `properties.` and `.value` dropped. */
export const pathSegments = (path: string): string[] => path.replace(/^properties\./, "").replace(/\.value$/, "").split(".");

/** The proposed role of a path and why; a reviewer overrides `include` where it is wrong. */
export function proposeRole(path: string, kinds: FilterKind[]): { role: Role; reason: string; include: boolean } {
  const has = (kind: FilterKind) => kinds.includes(kind);
  const last = pathSegments(path).at(-1)!.toLowerCase();
  if (path === "type" || has("TypeFilter")) return { role: "entity_type", reason: path === "type" ? "the path is `type`" : "a TypeFilter", include: true };
  if (has("DateFilter")) {
    // one time dimension per cube: the creation date; the others are bookkeeping
    if (/(^|\.)created\.at$/.test(path)) return { role: "time", reason: "a DateFilter on the creation date", include: true };
    return { role: "time", reason: "a DateFilter, but not the creation date: one time dimension per cube", include: false };
  }
  if (/^audit\.updated\./.test(path)) return { role: "audit", reason: "who or when last changed: a column of the raw table, not a dimension of creations", include: false };
  if (IDENTIFIER_SEGMENTS.has(last)) return { role: "identifier", reason: `the path ends on \`${last}\``, include: false };
  if (/(^|_)number$/.test(last)) return { role: "identifier", reason: "the path ends on `number`", include: false };
  const word = TEXT_WORDS.find((candidate) => path.toLowerCase().includes(candidate));
  if (word) return { role: "text", reason: `the path contains \`${word}\``, include: false };
  if (/^properties\.ref_/.test(path) || /^lookup\./.test(path)) return { role: "relation", reason: "a relation (`properties.ref_` or `lookup.`): left out in phase 1", include: false };
  if (/^relations?([._\d]|$)/.test(path)) return { role: "relation", reason: "a relation (`relation…`): left out in phase 1", include: false };
  if (kinds.every((kind) => kind === "TextFilter")) return { role: "identifier", reason: "only TextFilters: a free-text search, not a dimension", include: false };
  return { role: "dimension", reason: "a SelectionFilter", include: true };
}

/** The text of a translation key, from the first bundle that has it; a bundle may be wrapped in its language (`{ nl: {...} }`). */
export function translate(key: string, bundles: TranslationBundle[]): string | undefined {
  for (const bundle of bundles) {
    const roots = Object.keys(bundle).length === 1 && typeof Object.values(bundle)[0] === "object" ? [Object.values(bundle)[0], bundle] : [bundle];
    for (const root of roots) {
      let cursor: unknown = root;
      for (const part of key.split(".")) cursor = cursor && typeof cursor === "object" ? (cursor as Record<string, unknown>)[part] : undefined;
      if (typeof cursor === "string") return cursor;
    }
  }
  return undefined;
}

const mostCommon = (values: string[]): string | undefined => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
};

const unique = (values: string[]): string[] => [...new Set(values)].sort();

/** One candidate per path, in path order. */
export function candidatesOf(filters: FilterRecord[], bundles: TranslationBundle[] = []): Candidate[] {
  const byPath = new Map<string, FilterRecord[]>();
  for (const filter of filters) byPath.set(filter.path, [...(byPath.get(filter.path) ?? []), filter]);
  return [...byPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, group]) => {
      const filterKinds = unique(group.map((filter) => filter.filterKind));
      const declaredLabel = mostCommon(group.flatMap((filter) => (filter.labelKey ? [filter.labelKey] : [])));
      const labelKey = declaredLabel ?? conventionalLabelKey(path);
      const typeValues = unique(
        group.flatMap((filter) => [
          ...filter.optionTypes,
          ...(filter.filterKind === "TypeFilter" || filter.path === "type" ? filter.defaultValues.filter((value) => !value.startsWith("$")) : []),
        ]),
      );
      return {
        path,
        ...proposeRole(path, filterKinds),
        labelKey,
        labelSource: declaredLabel ? "declared" : "conventional",
        labelNl: translate(labelKey, bundles),
        filterKinds,
        occurrences: group.length,
        entityTypes: unique(group.flatMap((filter) => filter.owners)),
        aliases: unique(group.flatMap((filter) => (filter.alias ? [filter.alias] : []))),
        prefixed: group.some((filter) => filter.prefixed),
        hidden: group.every((filter) => filter.hidden),
        typeValues,
      } satisfies Candidate;
    });
}

export function inventory(ttl: string, bundles: TranslationBundle[] = []): Inventory {
  const filters = readFilters(ttl);
  return { filters, candidates: candidatesOf(filters, bundles) };
}

const cell = (value: string) => value.replace(/\|/g, "\\|");
const list = (values: string[], max = 6) => (values.length > max ? `${values.slice(0, max).join(", ")}, … (${values.length})` : values.join(", "));

/** The candidates as a review table: included first, then by role and path. */
export function candidatesMarkdown(candidates: Candidate[], source?: string): string {
  const roles: Role[] = ["entity_type", "time", "dimension", "audit", "relation", "identifier", "text"];
  const sorted = [...candidates].sort(
    (a, b) => Number(b.include) - Number(a.include) || roles.indexOf(a.role) - roles.indexOf(b.role) || a.path.localeCompare(b.path),
  );
  const rows = sorted.map((candidate) =>
    [
      candidate.include ? "✓" : "",
      `\`${candidate.path}\`${candidate.prefixed ? "" : " ⁰"}`,
      candidate.role,
      candidate.reason,
      candidate.labelNl ?? `*${candidate.labelKey}*`,
      candidate.filterKinds.join(", "),
      String(candidate.occurrences),
      list(candidate.entityTypes),
    ]
      .map(cell)
      .join(" | "),
  );
  const included = candidates.filter((candidate) => candidate.include).length;
  return [
    "# Analytics candidates",
    "",
    `${source ? `From \`${source}\`: ` : ""}${candidates.length} document paths, ${included} included. Generated by \`elody-ui analytics inventory\`; edit \`include\` in candidates.json, not here.`,
    "",
    "⁰ the key has no `<client>:<version>|` prefix. A label in *italics* is a translation key without a Dutch text.",
    "",
    "| include | path | role | reason | label nl | filterKind | # | entity types |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row} |`),
    "",
  ].join("\n");
}
