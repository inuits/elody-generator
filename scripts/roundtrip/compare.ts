/**
 * Value-preservation round trip, last step (host): after the write-back the
 * stored data must equal the original with only the edits applied — every
 * other value kept, unbounded values and languages included, each in its own
 * type (SHACL 1.2 UI feature 30) — and every relation must hold on both
 * entities: the book's relations of an edited type are the new selection,
 * the others are untouched, and each related entity carries the mirror
 * (feature 32: inverse paths applied).
 *
 * usage: tsx compare.ts <outDir>   (exit 1 on any difference)
 */
import { readFileSync } from "fs";
import { join } from "path";

const here = import.meta.dirname;
const out = process.argv[2] ?? join(here, "out");
type Item = { key: string; value: unknown; lang?: string };
type Relation = { key: string; type: string };
const read = (path: string) => JSON.parse(readFileSync(path, "utf-8"));
const stored = read(join(out, "stored.json"));
const after = read(join(out, "after.json"));
const ids: Record<string, string> = read(join(out, "ids.json"));
const name = (id: string) => Object.keys(ids).find((key) => ids[key] === id) ?? id;
const { relations: relationEdits = {}, ...edits } = read(join(here, "edits.json")) as {
  relations?: Record<string, string[]>;
} & Record<string, unknown>;

const problems: string[] = [];
const check = (label: string, want: string[], got: string[]) => {
  const ok = JSON.stringify(want) === JSON.stringify(got);
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) problems.push(`${label}\n    expected ${want.join(" ")}\n    got      ${got.join(" ")}`);
};

// -- metadata of the book --------------------------------------------------------------
// the values of a property are a set (RDF): a list value is compared without its order
const canonical = (value: unknown) => (Array.isArray(value) ? [...value].map((v) => JSON.stringify(v)).sort() : value);
const norm = (items: Item[], key: string) =>
  items
    .filter((item) => item.key === key)
    .map((item) => JSON.stringify({ value: canonical(item.value), lang: item.lang ?? null }))
    .sort();
// collection-api's GET also lists relations among the metadata ({ key: <id>, type }): not metadata
const metadataOf = (entity: { metadata: (Item & { type?: string })[] }) => entity.metadata.filter((item) => !("type" in item));
const storedMetadata: Item[] = metadataOf(stored);
const afterMetadata: Item[] = metadataOf(after.book);
const expected = storedMetadata.map((item) => (item.key in edits ? { ...item, value: edits[item.key] } : item));
for (const key of [...new Set([...expected, ...afterMetadata].map((item) => item.key))])
  check(key, norm(expected, key), norm(afterMetadata, key));

// -- relations, on both sides --------------------------------------------------------------
const mirror = (type: string) => {
  const isFor = /^is(.*)For$/.exec(type);
  if (isFor) return `has${isFor[1]}`;
  const has = /^has(.*)$/.exec(type);
  return has ? `is${has[1]}For` : type;
};
const relationsOf = (entity: { relations?: Relation[] }, to: string[]) =>
  (entity.relations ?? [])
    .filter((relation) => to.includes(relation.key))
    .map((relation) => `${relation.type}→${name(relation.key)}`)
    .sort();
const related = Object.keys(ids).filter((key) => key !== "book");
const storedBook: Relation[] = (stored.relations ?? []).filter((r: Relation) => related.some((n) => ids[n] === r.key));
const wantBook = [
  ...storedBook.filter((relation) => !(relation.type in relationEdits)).map((relation) => `${relation.type}→${name(relation.key)}`),
  ...Object.entries(relationEdits).flatMap(([type, names]) => names.map((n) => `${type}→${n}`)),
].sort();
check("relations of the book", wantBook, relationsOf(after.book, related.map((n) => ids[n])));
for (const n of related) {
  const want = wantBook
    .filter((entry) => entry.endsWith(`→${n}`))
    .map((entry) => `${mirror(entry.split("→")[0])}→book`)
    .sort();
  check(`relations of ${n}`, want, relationsOf(after[n], [ids.book]));
}

if (problems.length) {
  console.log(`\n${problems.length} not preserved:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("\nall values and relations preserved");
