/**
 * elody-ui generate [--root DIR] [--declaration FILE] [--key-as-label input|legacy]
 * elody-ui check    [--root DIR] [--declaration FILE] [--key-as-label input|legacy]   drift + meta-shapes + retired terms
 * elody-ui validate FILE                                 meta-shapes only
 * elody-ui migrate  FILE [--out FILE] [--translations DIR]  retired dialect -> 0.1; label texts from the client bundles
 * elody-ui compare  DECLARATION CLIENT_SRC [--scope FILE] [--json FILE] [--name NAME]
 *                                                        the generated GraphQL against the client's, per definition
 * elody-ui extract  CLIENT_SRC --out FILE [--namespace IRI] a declaration proposal from the client's GraphQL
 * elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
 *                                                        every filter, one analytics candidate per document path
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { declarationFiles, loadDeclaration } from "./declarationFiles.js";
import { readReference, renderReference } from "./reference.js";
import { expandDeclaration } from "./expand.js";
import { basename, join, dirname } from "path";
import { compareClient, formatCompareReport, readQueryFiles } from "./compare.js";
import { extractDeclaration, extractDeclarationFiles } from "./extract.js";
import { findDeclaration, generate } from "./generate.js";
import type { Dialect } from "./render.js";
import { migrateDeclaration } from "./migrate.js";
import { formatIssue, validateDeclaration } from "./validate.js";
import { analytics } from "./analytics/cli.js";

const usage = `usage:
  elody-ui generate [--root DIR] [--declaration FILE] [--key-as-label input|legacy]
  elody-ui check    [--root DIR] [--declaration FILE] [--key-as-label input|legacy]
  elody-ui validate FILE
  elody-ui migrate  FILE [--out FILE] [--translations DIR]
  elody-ui compare  DECLARATION CLIENT_SRC [--scope FILE] [--json FILE] [--name NAME]
  elody-ui extract  CLIENT_SRC --out FILE [--namespace IRI]
  elody-ui reference --out DIR [--declarations DIR] [--base PATH]
  elody-ui expand   FILE|DIR [--out FILE]   # every default written out
  elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]`;

function option(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const root = option(rest, "--root") ?? process.cwd();
  // base-graphql >= 0.10.30 takes keyAsLabel: { origin, key }; a client pinned below it takes the two legacy arguments
  const keyAsLabel = option(rest, "--key-as-label");
  if (keyAsLabel && keyAsLabel !== "input" && keyAsLabel !== "legacy") {
    console.error(`--key-as-label: "input" or "legacy", not "${keyAsLabel}"`);
    return 2;
  }
  const dialect: Dialect = { keyAsLabel: keyAsLabel === "legacy" ? "legacy" : "input" };

  if (command === "generate") {
    const result = await generate({ root, declaration: option(rest, "--declaration"), log: console.log, dialect });
    if (!result.declaration) console.log("no src/ui/*.ui.ttl declaration: nothing to generate");
    for (const warning of result.warnings) console.warn(`warning: ${warning.message}`);
    return 0;
  }

  if (command === "check") {
    const declaration = option(rest, "--declaration") ?? findDeclaration(root);
    if (!declaration) {
      console.log("no src/ui/*.ui.ttl declaration: nothing to check");
      return 0;
    }
    const result = await generate({ root, declaration, check: true, log: console.error, dialect });
    let ok = result.clean;
    for (const warning of result.warnings) console.warn(`warning: ${warning.message}`);
    const report = await validateDeclaration(loadDeclaration(join(root, declaration)));
    for (const issue of report.issues) console.error(formatIssue(issue));
    ok = ok && report.conforms;
    console.log(
      ok
        ? `${declaration}: query documents up to date, declaration conforms`
        : `${declaration}: ${result.changed.length} document(s) out of date, ${report.issues.length} validation issue(s)`,
    );
    return ok ? 0 : 1;
  }

  if (command === "validate") {
    const file = rest.find((argument) => !argument.startsWith("--"));
    if (!file) throw new Error(usage);
    const report = await validateDeclaration(loadDeclaration(file));
    for (const issue of report.issues) console.error(formatIssue(issue));
    console.log(report.conforms ? `${file} conforms` : `${file}: ${report.issues.length} issue(s)`);
    return report.conforms ? 0 : 1;
  }

  if (command === "migrate") {
    const file = rest.find((argument) => !argument.startsWith("--"));
    if (!file) throw new Error(usage);
    const dir = option(rest, "--translations");
    const translations = dir
      ? Object.fromEntries(
          readdirSync(dir)
            .filter((name) => name.endsWith(".json"))
            .map((name) => [name.replace(/\.json$/, ""), JSON.parse(readFileSync(join(dir, name), "utf-8"))]),
        )
      : undefined;
    const result = migrateDeclaration(readFileSync(file, "utf-8"), undefined, { translations });
    const out = option(rest, "--out");
    if (out) writeFileSync(out, result.ttl);
    else process.stdout.write(result.ttl);
    for (const note of result.notes) console.error(`migrated: ${note}`);
    return 0;
  }

  if (command === "compare") {
    const [declaration, clientSrc] = rest.filter((argument, index) => !argument.startsWith("--") && !rest[index - 1]?.startsWith("--"));
    if (!declaration || !clientSrc) throw new Error(usage);
    const scopeFile = option(rest, "--scope");
    const scope = scopeFile ? JSON.parse(readFileSync(scopeFile, "utf-8")) : undefined;
    const report = await compareClient({
      client: option(rest, "--name") ?? basename(declaration).replace(/\.ui\.ttl$/, ""),
      declaration,
      clientSrc,
      scope,
    });
    const json = option(rest, "--json");
    if (json) writeFileSync(json, JSON.stringify(report, null, 2) + "\n");
    console.log(formatCompareReport(report));
    const { summary } = report;
    return summary.differs + summary.missing + summary.extra === 0 && report.errors.length === 0 ? 0 : 1;
  }

  if (command === "extract") {
    const [clientSrc] = rest.filter((argument, index) => !argument.startsWith("--") && !rest[index - 1]?.startsWith("--"));
    const out = option(rest, "--out");
    if (!clientSrc || !out) throw new Error(usage);
    // --out a directory (no .ttl suffix): one file per client query file, laid out like the queries, the notes in extract-notes.txt
    if (!out.endsWith(".ttl")) {
      const result = extractDeclarationFiles(readQueryFiles(clientSrc), { namespace: option(rest, "--namespace"), source: clientSrc });
      if (existsSync(out)) for (const stale of declarationFiles(out)) rmSync(join(out, stale));
      for (const [file, ttl] of result.files) {
        mkdirSync(dirname(join(out, file)), { recursive: true });
        writeFileSync(join(out, file), ttl);
      }
      writeFileSync(join(out, "extract-notes.txt"), result.notes.map((note) => `${note}\n`).join(""));
      console.log(`${out}: ${result.types.length} type(s) extracted into ${result.files.size} file(s), ${result.notes.length} note(s)`);
      for (const note of result.notes) console.error(`note: ${note}`);
      return 0;
    }
    const result = extractDeclaration(readQueryFiles(clientSrc), { namespace: option(rest, "--namespace"), source: clientSrc });
    writeFileSync(out, result.ttl);
    console.log(`${out}: ${result.types.length} type(s) extracted, ${result.notes.length} note(s)`);
    for (const note of result.notes) console.error(`note: ${note}`);
    return 0;
  }

  if (command === "expand") {
    const [file] = rest.filter((argument, index) => !argument.startsWith("--") && !rest[index - 1]?.startsWith("--"));
    if (!file) throw new Error(usage);
    const result = expandDeclaration(loadDeclaration(file));
    const out = option(rest, "--out");
    if (out) writeFileSync(out, result.ttl);
    else process.stdout.write(result.ttl);
    console.error(`${result.added} default(s) written out`);
    return 0;
  }

  if (command === "analytics") return analytics(rest);

  if (command === "reference") {
    const out = option(rest, "--out");
    if (!out) throw new Error(usage);
    const reference = readReference({ declarations: option(rest, "--declarations") });
    const pages = renderReference(reference, { basePath: option(rest, "--base") });
    mkdirSync(out, { recursive: true });
    for (const [file, content] of pages) writeFileSync(join(out, file), content);
    console.log(`${out}: ${pages.size} file(s) from ${reference.terms.size} terms and ${reference.shapes.size} shapes${reference.clients ? `, usage from ${reference.clients} client(s)` : ""}`);
    return 0;
  }

  console.error(usage);
  return 2;
}
