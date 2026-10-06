/**
 * The SHACL 1.2 UI spec examples through the whole Elody pipeline, step 1 (host):
 *   spec shapes (+ data) → fromShacl → Elody declaration (.ui.ttl)
 *   → validate (meta-shapes) → generate → GraphQL documents + custom input fields.
 * Step 2 (scripts/showcase-execute.cts, in the dashboard container) executes the
 * documents against baseGraphql's real resolvers.
 *
 * usage: tsx scripts/showcase.ts [outDir]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { Parser } from "n3";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const root = join(import.meta.dirname, "..");
const out = process.argv[2] ?? join(root, "showcase-out");
const dir = join(root, "spec", "examples");
const index: { id: string; section: string; title: string }[] = JSON.parse(readFileSync(join(dir, "index.json"), "utf-8"));
const files = readdirSync(dir);
const read = (name: string) => readFileSync(join(dir, name), "utf-8");

// the focus node of a data example: the subject typed with a class the shapes target,
// else the subject the most properties are about
const focusOf = (shapes: string, data: string): string | undefined => {
  const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  const targets = new Set(new Parser().parse(shapes).filter((q) => q.predicate.value === "http://www.w3.org/ns/shacl#targetClass").map((q) => q.object.value));
  const quads = new Parser().parse(data);
  const typed = quads.find((q) => q.predicate.value === RDF_TYPE && targets.has(q.object.value));
  if (typed) return typed.subject.value;
  // a node shape named after its class (ex:PersonShape → ex:Person)
  const shapeNames = new Parser().parse(shapes)
    .filter((q) => q.predicate.value === "http://www.w3.org/ns/shacl#property")
    .map((q) => q.subject.value.replace(/^.*[#/]/, "").replace(/Shape$/, ""));
  const named = quads.find((q) => q.predicate.value === RDF_TYPE && shapeNames.includes(q.object.value.replace(/^.*[#/]/, "")));
  if (named) return named.subject.value;
  const counts = new Map<string, number>();
  for (const q of quads) if (q.subject.termType === "NamedNode") counts.set(q.subject.value, (counts.get(q.subject.value) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
};
const DATA_ONLY = new Set(["01-getting-started", "03-getting-started"]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const manifest = [];
for (const entry of index) {
  const n = entry.id.slice(0, 2);
  const documentName = `SpecExample${n}`;
  // 01/03 are data for the shapes of 02; 14 is the shui:defaultOrder configuration for the shapes of 13
  const shapes = DATA_ONLY.has(entry.id)
    ? read("02-getting-started.shapes.ttl")
    : entry.id === "14-patterns"
      ? `${read("13-patterns.shapes.ttl")}\n${read("14-patterns.shapes.ttl").split("\n").filter((line) => !line.startsWith("@prefix")).join("\n")}`
      : read(`${entry.id}.shapes.ttl`);
  const data = files.includes(`${entry.id}.data.ttl`) ? read(`${entry.id}.data.ttl`) : undefined;
  const focus = data ? focusOf(shapes, data) : undefined;
  const target = join(out, entry.id);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, "shapes.ttl"), shapes);
  if (data) writeFileSync(join(target, "data.ttl"), data);

  const converted = await fromShacl(shapes, { id: `example${n}`, documentName, title: entry.title || entry.section, data, focus });
  const row: Record<string, unknown> = { ...entry, documentName, notes: converted.notes, fields: converted.fields, sample: converted.sample };
  if (!converted.fields.length) {
    row.status = "no-fields";
    manifest.push(row);
    continue;
  }
  writeFileSync(join(target, "declaration.ui.ttl"), converted.ttl);
  const report = await validateDeclaration(converted.ttl);
  row.conforms = report.conforms;
  row.issues = report.issues.map(formatIssue);
  const parsed = await readUiDeclaration(converted.ttl);
  row.warnings = parsed.warnings.map((w) => w.message);
  const entity = parsed.entities[0];
  const file = renderEntityFile(entity, `examples/${entry.id}/declaration.ui.ttl`);
  const graphql = file.slice(file.indexOf("gql`") + 4, file.lastIndexOf("`;")).trim();
  writeFileSync(join(target, "documents.graphql"), graphql + "\n");
  writeFileSync(join(target, "inputFields.json"), JSON.stringify(parsed.inputFields, null, 2));
  writeFileSync(join(target, "translations.json"), JSON.stringify(parsed.translations, null, 2));
  writeFileSync(join(target, "sample.json"), JSON.stringify(converted.sample, null, 2));
  writeFileSync(join(target, "relations.json"), JSON.stringify(converted.relations, null, 2));
  row.status = "generated";
  row.hasForm = entity.createForms.length > 0;
  row.hasDetail = Boolean(entity.detail);
  row.formQuery = entity.createForms[0]?.queryName;
  row.inputFields = Object.keys(parsed.inputFields);
  manifest.push(row);
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
for (const row of manifest as any[])
  console.log(`${row.id.padEnd(32)} ${String(row.status).padEnd(10)} ${row.conforms === false ? "INVALID " : ""}form=${row.hasForm ?? "-"} detail=${row.hasDetail ?? "-"} custom=${(row.inputFields ?? []).join(",")}`);
