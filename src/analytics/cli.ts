/**
 * elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
 *   every filter of the declaration (filters.json), one candidate per document
 *   path with its proposed role (candidates.json, candidates.md); a translation
 *   bundle per --translations, the first that has a key wins (the client's, then base-graphql's)
 * elody-ui analytics overlay CANDIDATES --client NAME --out FILE [--collection NAME ...]
 *   the selection overlay (a qb: cube) from the reviewed candidates; the
 *   collections default to client.json's mongoCollections next to the overlay's
 *   folder (clients/<c>/analytics/x.ttl → clients/<c>/client.json), users left out
 * elody-ui analytics validate OVERLAY
 *   the overlay against ontology/analytics.shapes.ttl
 * elody-ui analytics profile OVERLAY --mongo URI --db NAME --out DIR [--sample N] [--extra PATH ...]
 *                            [--library PATH ...] [--users COLLECTION] [--update]
 *   the overlay's paths measured on a local Mongo (profile.json, profile.md);
 *   --update writes the result back into the overlay (multi-valued, sparse paths
 *   commented out, types without documents dropped)
 * elody-ui analytics generate OVERLAY --out DIR [--translations FILE ...] [--client NAME] [--database NAME]
 *   the ClickHouse SQL, the dlt projection and the Superset bundle; the generated
 *   folders (clickhouse/, dlt/, superset/) are replaced
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { basename, dirname, join, relative } from "path";
import { loadDeclaration } from "../declarationFiles.js";
import { formatIssue } from "../validate.js";
import { candidatesMarkdown, inventory, type Candidate } from "./inventory.js";
import { readOverlay, renderOverlay, validateOverlay } from "./overlay.js";
import { generateAnalytics } from "./generate.js";
import { applyProfile, profile, profileMarkdown } from "./profile.js";
import { mongoSource } from "./profileMongo.js";

const usage = `usage:
  elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
  elody-ui analytics overlay   CANDIDATES --client NAME --out FILE [--collection NAME ...]
  elody-ui analytics validate  OVERLAY
  elody-ui analytics generate  OVERLAY --out DIR [--translations FILE ...] [--client NAME] [--database NAME]
  elody-ui analytics profile   OVERLAY --mongo URI --db NAME --out DIR [--sample N] [--extra PATH ...] [--library PATH ...] [--users COLLECTION] [--update]`;

const options = (argv: string[], name: string): string[] => argv.flatMap((argument, index) => (argument === name && argv[index + 1] ? [argv[index + 1]] : []));
const positional = (argv: string[]): string[] => argv.filter((argument, index) => !argument.startsWith("--") && !argv[index - 1]?.startsWith("--"));
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

export async function analytics(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (command === "inventory") {
    const [declaration] = positional(rest);
    const [out] = options(rest, "--out");
    if (!declaration || !out) throw new Error(usage);
    const bundles = options(rest, "--translations").map((file) => JSON.parse(readFileSync(file, "utf-8")));
    const result = inventory(loadDeclaration(declaration), bundles);
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
    const [client] = options(rest, "--client");
    const [out] = options(rest, "--out");
    if (!file || !client || !out) throw new Error(usage);
    const candidates: Candidate[] = JSON.parse(readFileSync(file, "utf-8"));
    let collections = options(rest, "--collection");
    if (!collections.length) {
      const clientJson = join(dirname(dirname(out)), "client.json");
      if (!existsSync(clientJson)) throw new Error(`no --collection and no ${clientJson} to read mongoCollections from`);
      collections = (JSON.parse(readFileSync(clientJson, "utf-8")).mongoCollections ?? []).filter((name: string) => !/^users?_/.test(name));
    }
    const ttl = renderOverlay(candidates, { client, collections, source: relative(dirname(out), file) });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, ttl);
    const report = await validateOverlay(ttl);
    for (const issue of report.issues) console.error(formatIssue(issue));
    const overlay = readOverlay(ttl);
    console.log(`${out}: ${overlay.dimensions.length} dimension(s), ${overlay.entityTypes.length} entity type(s), ${collections.length} collection(s)${report.conforms ? ", conforms" : `, ${report.issues.length} issue(s)`}`);
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
    const files = generateAnalytics(readOverlay(ttl), {
      bundles: options(rest, "--translations").map((path) => JSON.parse(readFileSync(path, "utf-8"))),
      client: options(rest, "--client")[0],
      database: options(rest, "--database")[0],
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

  if (command === "profile") {
    const [file] = positional(rest);
    const [uri] = options(rest, "--mongo");
    const [db] = options(rest, "--db");
    const [out] = options(rest, "--out");
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
