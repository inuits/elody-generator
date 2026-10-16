/**
 * elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
 *   every filter of the declaration (filters.json), one candidate per document
 *   path with its proposed role (candidates.json, candidates.md); a translation
 *   bundle per --translations, the first that has a key wins (the client's, then base-graphql's)
 * elody-ui analytics overlay CANDIDATES --out FILE [--client NAME] [--collection NAME ...] [--schema v1|v2]
 *   the selection overlay (a qb: cube) from the reviewed candidates; client,
 *   collections (users left out) and document schema default to client.json
 * elody-ui analytics validate OVERLAY
 *   the overlay against ontology/analytics.shapes.ttl
 * elody-ui analytics profile OVERLAY --mongo URI --out DIR [--db NAME] [--sample N] [--extra PATH ...]
 *                            [--library PATH ...] [--users COLLECTION] [--update]
 *   the overlay's paths measured on a local Mongo (profile.json, profile.md);
 *   --update writes the result back into the overlay (multi-valued, sparse paths
 *   commented out, types without documents dropped)
 * elody-ui analytics generate OVERLAY --out DIR [--translations FILE ...] [--client NAME] [--database NAME]
 *   the ClickHouse SQL, the dlt projection and the Superset bundle; the generated
 *   folders (clickhouse/, dlt/, superset/) are replaced
 * elody-ui analytics tracking DECLARATION --out DIR [--client NAME]
 *   the tracking plan: the platform's usage events and the values the
 *   declaration allows per property (tracking-plan.json, tracking-plan.md)
 * elody-ui analytics coverage PLAN --observed FILE --out DIR
 *   what a usage tool saw ({ event, property, value, count }, a JSON list or JSON lines)
 *   against the plan: declared values never seen, values and events not declared
 *   (coverage.json, coverage.md)
 *
 * What the command line leaves out comes from the client's client.json, found
 * above the declaration, overlay or output (client.ts): collections, schema,
 * database, translations.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { basename, dirname, join, relative } from "path";
import { loadDeclaration } from "../declarationFiles.js";
import { formatIssue } from "../validate.js";
import { candidatesMarkdown, inventory, type Candidate } from "./inventory.js";
import { readOverlay, renderOverlay, validateOverlay } from "./overlay.js";
import { findClientConfig } from "./client.js";
import { generateAnalytics } from "./generate.js";
import { applyProfile, profile, profileMarkdown } from "./profile.js";
import { mongoSource } from "./profileMongo.js";
import { coverage, coverageMarkdown, parseObserved, trackingPlan, trackingPlanMarkdown, type TrackingPlan } from "./tracking.js";
import { readUiDeclaration } from "../parse.js";

const usage = `usage:
  elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
  elody-ui analytics overlay   CANDIDATES --out FILE [--client NAME] [--collection NAME ...] [--schema v1|v2]
  elody-ui analytics validate  OVERLAY
  elody-ui analytics generate  OVERLAY --out DIR [--translations FILE ...] [--client NAME] [--database NAME]
  elody-ui analytics profile   OVERLAY --mongo URI --out DIR [--db NAME] [--sample N] [--extra PATH ...] [--library PATH ...] [--users COLLECTION] [--update]
  elody-ui analytics tracking  DECLARATION --out DIR [--client NAME]
  elody-ui analytics coverage  PLAN --observed FILE --out DIR`;

const options = (argv: string[], name: string): string[] => argv.flatMap((argument, index) => (argument === name && argv[index + 1] ? [argv[index + 1]] : []));
const positional = (argv: string[]): string[] => argv.filter((argument, index) => !argument.startsWith("--") && !argv[index - 1]?.startsWith("--"));
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
/** The translation bundles: --translations, else client.json's. */
const bundlesFor = (argv: string[], near: string) =>
  (options(argv, "--translations").length ? options(argv, "--translations") : findClientConfig(near)?.translations ?? []).map((path) => JSON.parse(readFileSync(path, "utf-8")));

export async function analytics(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (command === "inventory") {
    const [declaration] = positional(rest);
    const [out] = options(rest, "--out");
    if (!declaration || !out) throw new Error(usage);
    const result = inventory(loadDeclaration(declaration), bundlesFor(rest, declaration));
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "filters.json"), json(result.filters));
    writeFileSync(join(out, "candidates.json"), json(result.candidates));
    writeFileSync(join(out, "candidates.md"), candidatesMarkdown(result.candidates));
    const included = result.candidates.filter((candidate) => candidate.include).length;
    console.log(`${out}: ${result.filters.length} filter(s), ${result.candidates.length} path(s), ${included} included`);
    return 0;
  }

  if (command === "overlay") {
    const [file] = positional(rest);
    const [out] = options(rest, "--out");
    const config = out ? findClientConfig(out) : undefined;
    const client = options(rest, "--client")[0] ?? config?.name;
    if (!file || !client || !out) throw new Error(usage);
    const candidates: Candidate[] = JSON.parse(readFileSync(file, "utf-8"));
    const collections = options(rest, "--collection").length ? options(rest, "--collection") : config?.collections ?? [];
    if (!collections.length) throw new Error("no --collection, and no mongoCollections in a client.json above the overlay");
    const schemaOption = options(rest, "--schema")[0];
    if (schemaOption && schemaOption !== "v1" && schemaOption !== "v2") throw new Error(`--schema: "v1" or "v2", not "${schemaOption}"`);
    const schema = (schemaOption as "v1" | "v2" | undefined) ?? config?.schema ?? "v2";
    const ttl = renderOverlay(candidates, { client, collections, schema, source: relative(dirname(out), file) });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, ttl);
    const report = await validateOverlay(ttl);
    for (const issue of report.issues) console.error(formatIssue(issue));
    const overlay = readOverlay(ttl);
    console.log(`${out}: ${overlay.dimensions.length} dimension(s), ${overlay.entityTypes.length} entity type(s), ${collections.length} collection(s), schema ${schema}${report.conforms ? ", conforms" : `, ${report.issues.length} issue(s)`}`);
    return report.conforms ? 0 : 1;
  }

  if (command === "validate") {
    const [file] = positional(rest);
    if (!file) throw new Error(usage);
    const report = await validateOverlay(readFileSync(file, "utf-8"));
    for (const issue of report.issues) console.error(formatIssue(issue));
    console.log(report.conforms ? `${file} conforms` : `${file}: ${report.issues.length} issue(s)`);
    return report.conforms ? 0 : 1;
  }

  if (command === "generate") {
    const [file] = positional(rest);
    const [out] = options(rest, "--out");
    if (!file || !out) throw new Error(usage);
    const ttl = readFileSync(file, "utf-8");
    const report = await validateOverlay(ttl);
    for (const issue of report.issues) console.error(formatIssue(issue));
    if (!report.conforms) return 1;
    const config = findClientConfig(file);
    const files = generateAnalytics(readOverlay(ttl), {
      bundles: bundlesFor(rest, file),
      client: options(rest, "--client")[0],
      database: options(rest, "--database")[0] ?? config?.mongoDb,
      source: basename(file),
    });
    for (const folder of ["clickhouse", "dlt", "superset"]) rmSync(join(out, folder), { recursive: true, force: true });
    for (const [path, content] of files) {
      mkdirSync(dirname(join(out, path)), { recursive: true });
      writeFileSync(join(out, path), content);
    }
    console.log(`${out}: ${files.size} file(s)`);
    return 0;
  }

  if (command === "tracking") {
    const [declaration] = positional(rest);
    const [out] = options(rest, "--out");
    const client = options(rest, "--client")[0] ?? (declaration ? findClientConfig(declaration)?.name : undefined);
    if (!declaration || !out || !client) throw new Error(usage);
    const ttl = loadDeclaration(declaration);
    const { entities } = await readUiDeclaration(ttl);
    const plan = trackingPlan({ client, entities, filters: inventory(ttl, []).filters });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "tracking-plan.json"), json(plan));
    writeFileSync(join(out, "tracking-plan.md"), trackingPlanMarkdown(plan));
    const counted = plan.events.map((event) => `${event.name} ${event.properties.reduce((sum, property) => sum + (property.values?.length ?? 0), 0)}`);
    console.log(`${out}: ${plan.events.length} event(s), values per event: ${counted.join(", ")}`);
    return 0;
  }

  if (command === "coverage") {
    const [file] = positional(rest);
    const [observedFile] = options(rest, "--observed");
    const [out] = options(rest, "--out");
    if (!file || !observedFile || !out) throw new Error(usage);
    const plan: TrackingPlan = JSON.parse(readFileSync(file, "utf-8"));
    const observed = parseObserved(readFileSync(observedFile, "utf-8"));
    const report = coverage(plan, observed);
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "coverage.json"), json(report));
    writeFileSync(join(out, "coverage.md"), coverageMarkdown(report));
    const declared = report.events.flatMap((event) => event.properties.flatMap((property) => property.values));
    console.log(`${out}: ${declared.filter((value) => value.count > 0).length} of ${declared.length} declared value(s) seen, ${report.unknownEvents.length} event(s) not in the plan`);
    return 0;
  }

  if (command === "profile") {
    const [file] = positional(rest);
    const [uri] = options(rest, "--mongo");
    const [out] = options(rest, "--out");
    const db = options(rest, "--db")[0] ?? (file ? findClientConfig(file)?.mongoDb : undefined);
    if (!file || !uri || !db || !out) throw new Error(usage);
    const sample = Number(options(rest, "--sample")[0] ?? 5000);
    const ttl = readFileSync(file, "utf-8");
    const { source, close } = await mongoSource(uri, db);
    try {
      const result = await profile(readOverlay(ttl), source, {
        sample,
        extras: options(rest, "--extra"),
        library: options(rest, "--library"),
        usersCollection: options(rest, "--users")[0],
      });
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, "profile.json"), json(result));
      writeFileSync(join(out, "profile.md"), profileMarkdown(result));
      console.log(`${out}: ${result.paths.length} path(s) over ${result.types.length} type(s)`);
      const { ttl: updated, changes } = applyProfile(ttl, result);
      for (const change of changes) console.log(`${rest.includes("--update") ? "" : "would change: "}${change}`);
      if (rest.includes("--update") && changes.length) {
        writeFileSync(file, updated);
        const report = await validateOverlay(updated);
        for (const issue of report.issues) console.error(formatIssue(issue));
        console.log(`${file}: ${changes.length} change(s)${report.conforms ? ", conforms" : `, ${report.issues.length} issue(s)`}`);
        return report.conforms ? 0 : 1;
      }
      return 0;
    } finally {
      await close();
    }
  }

  console.error(usage);
  return 2;
}
