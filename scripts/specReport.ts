/**
 * Runs every vendored SHACL 1.2 UI spec example through shapeToForm and
 * writes a per-example verdict: can Elody render it, partly, or not.
 * usage: tsx scripts/specReport.ts [out.json]
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { shapeToForm, type SpecField } from "../src/shapeForm.js";

const dir = join(import.meta.dirname, "..", "spec", "examples");
const index: { id: string; section: string; title: string; hasData: boolean }[] = JSON.parse(readFileSync(join(dir, "index.json"), "utf-8"));
const focusFor: Record<string, string> = {
  "01-getting-started": "http://example.org/ns#alice", "03-getting-started": "http://example.org/ns#alice",
  "05-view-predicate-paths": "http://example.org/ns#alice", "06-view-complex-paths": "http://example.org/ns#alice",
  "07-edit-predicate-paths": "http://example.org/ns#alice", "08-edit-alternative-paths": "http://example.org/ns#book1",
  "09-edit-other-complex-paths": "http://example.org/ns#alice", "10-lang-resolution": "http://example.org/ns#alice",
  "11-label-resolution-local-name": "http://example.org/ns#alice", "12-label-resolution-local-name": "http://example.org/ns#book1",
};
const flat = (fields: SpecField[]): SpecField[] => fields.flatMap((f) => [f, ...flat(f.nested ?? []), ...flat(f.columns ?? [])]);
const short = (iri?: string) => iri?.replace("http://www.w3.org/ns/shacl-ui/", "shui:").replace("http://example.org/ns#", "ex:");

const rows = [];
for (const entry of index) {
  const shapes = readFileSync(join(dir, `${entry.id}.shapes.ttl`), "utf-8");
  const files = readdirSync(dir);
  const data = files.includes(`${entry.id}.data.ttl`) ? readFileSync(join(dir, `${entry.id}.data.ttl`), "utf-8") : undefined;
  // examples 01 and 03 are data-only; render them with the getting-started shapes (02)
  const shapesFor = ["01-getting-started", "03-getting-started"].includes(entry.id) ? readFileSync(join(dir, "02-getting-started.shapes.ttl"), "utf-8") : shapes;
  let form;
  try {
    form = await shapeToForm({ shapes: shapesFor, data, focus: focusFor[entry.id] && data ? focusFor[entry.id] : undefined });
  } catch (error) {
    rows.push({ ...entry, verdict: "error", error: String(error), fields: [], gaps: [] });
    continue;
  }
  const all = flat(form.fields);
  const gaps = [...form.gaps, ...all.flatMap((f) => f.gaps)];
  const shortfalls = gaps.filter((g) => g.level === "partial" || g.level === "unsupported");
  const verdict = shortfalls.some((g) => g.level === "unsupported") ? "no" : shortfalls.length ? "partial" : all.length || form.labelProperties.length ? "yes" : "n/a";
  rows.push({
    ...entry,
    verdict,
    labelProperties: form.labelProperties.map(short),
    fields: form.fields.map((f) => ({
      label: f.label, labelSource: f.labelSource, path: f.path.kind, order: f.order, group: f.group?.label,
      required: f.required, multiple: f.multiple,
      editor: short(f.editor?.widget), editorScore: f.editor?.score, editorFallback: f.editorFallback, viewer: short(f.viewer?.widget), viewerScore: f.viewer?.score,
      elody: f.elody, values: f.values.map((v) => v.label + (v.language ? "@" + v.language : "")),
      nested: f.nested?.map((n) => `${n.label} → ${short(n.editor?.widget)} → ${n.elody.inputFieldType ?? "—"}`),
      columns: f.columns?.map((c) => c.label),
      gaps: f.gaps,
    })),
    gaps: [...new Map(gaps.map((g) => [g.message, g])).values()],
  });
}
writeFileSync(process.argv[2] ?? "spec-report.json", JSON.stringify(rows, null, 2));
for (const r of rows)
  console.log(`${r.id.padEnd(34)} ${String(r.verdict).padEnd(8)} ${r.fields.map((f: any) => `${f.label}[${f.editor ?? "-"}→${f.elody?.inputFieldType ?? "✗"}]`).join(" ").slice(0, 150)}`);
