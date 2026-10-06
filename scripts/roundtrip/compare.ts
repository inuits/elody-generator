/**
 * Value-preservation round trip, last step (host): the entity after the
 * write-back must equal the stored entity with only the edits applied —
 * every other value kept, unbounded values and languages included, each in
 * its own type (SHACL 1.2 UI feature 30; values conform to sh:datatype).
 *
 * usage: tsx compare.ts <outDir>   (exit 1 on any difference)
 */
import { readFileSync } from "fs";
import { join } from "path";

const here = import.meta.dirname;
const out = process.argv[2] ?? join(here, "out");
type Item = { key: string; value: unknown; lang?: string };
const read = (path: string) => JSON.parse(readFileSync(path, "utf-8"));
const stored: Item[] = read(join(out, "stored.json")).metadata;
const after: Item[] = read(join(out, "after.json")).metadata;
const edits: Record<string, unknown> = read(join(here, "edits.json"));

// the values of a property are a set (RDF): a list value is compared without its order
const canonical = (value: unknown) => (Array.isArray(value) ? [...value].map((v) => JSON.stringify(v)).sort() : value);
const norm = (items: Item[], key: string) =>
  items
    .filter((item) => item.key === key)
    .map((item) => JSON.stringify({ value: canonical(item.value), lang: item.lang ?? null }))
    .sort();
const expected = stored.map((item) => (item.key in edits ? { ...item, value: edits[item.key] } : item));
const keys = [...new Set([...expected, ...after].map((item) => item.key))];
const problems: string[] = [];
for (const key of keys) {
  const want = norm(expected, key);
  const got = norm(after, key);
  if (JSON.stringify(want) !== JSON.stringify(got)) problems.push(`${key}\n    expected ${want.join(" ")}\n    got      ${got.join(" ")}`);
}
for (const key of keys) console.log(`${problems.some((p) => p.startsWith(`${key}\n`)) ? "✗" : "✓"} ${key}`);
if (problems.length) {
  console.log(`\n${problems.length} value(s) not preserved:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("\nall values preserved");
