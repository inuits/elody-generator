/**
 * elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]
 *   every filter of the declaration (filters.json), one candidate per document
 *   path with its proposed role (candidates.json, candidates.md); a translation
 *   bundle per --translations, the first that has a key wins (the client's, then base-graphql's)
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { loadDeclaration } from "../declarationFiles.js";
import { candidatesMarkdown, inventory } from "./inventory.js";

const usage = `usage:
  elody-ui analytics inventory DECLARATION --out DIR [--translations FILE ...]`;

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

  console.error(usage);
  return 2;
}
