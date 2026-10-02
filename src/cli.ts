/**
 * elody-ui generate [--root DIR] [--declaration FILE]
 * elody-ui check    [--root DIR] [--declaration FILE]   drift + meta-shapes + retired terms
 * elody-ui validate FILE                                 meta-shapes only
 * elody-ui migrate  FILE [--out FILE]                    retired dialect -> 0.1 vocabulary
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { findDeclaration, generate } from "./generate.js";
import { migrateDeclaration } from "./migrate.js";
import { formatIssue, validateDeclaration } from "./validate.js";

const usage = `usage:
  elody-ui generate [--root DIR] [--declaration FILE]
  elody-ui check    [--root DIR] [--declaration FILE]
  elody-ui validate FILE
  elody-ui migrate  FILE [--out FILE]`;

function option(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const root = option(rest, "--root") ?? process.cwd();

  if (command === "generate") {
    const result = generate({ root, declaration: option(rest, "--declaration"), log: console.log });
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
    const result = generate({ root, declaration, check: true, log: console.error });
    let ok = result.clean;
    for (const warning of result.warnings) console.warn(`warning: ${warning.message}`);
    const report = await validateDeclaration(readFileSync(join(root, declaration), "utf-8"));
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
    const report = await validateDeclaration(readFileSync(file, "utf-8"));
    for (const issue of report.issues) console.error(formatIssue(issue));
    console.log(report.conforms ? `${file} conforms` : `${file}: ${report.issues.length} issue(s)`);
    return report.conforms ? 0 : 1;
  }

  if (command === "migrate") {
    const file = rest.find((argument) => !argument.startsWith("--"));
    if (!file) throw new Error(usage);
    const result = migrateDeclaration(readFileSync(file, "utf-8"));
    const out = option(rest, "--out");
    if (out) writeFileSync(out, result.ttl);
    else process.stdout.write(result.ttl);
    for (const note of result.notes) console.error(`migrated: ${note}`);
    return 0;
  }

  console.error(usage);
  return 2;
}
