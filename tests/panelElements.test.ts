/**
 * Widgets Elody implements as an element inside a detail panel rather than as
 * a metadata field. A panel lists metadata fields, rich-text elements and
 * entity lists side by side (WindowPanelContent), so a property keeps its
 * place among the others:
 *  - shui:HTMLViewer / shui:RichTextEditor (rdf:HTML) → wysiwygElement, the
 *    tiptap editor: read in view mode, edited in edit mode;
 *  - shui:ValueTableViewer → entityListElement: the related entities as a
 *    list, filtered on the relation, with the columns of the sh:node shape.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";

const example = (id: string) => readFileSync(join(__dirname, "..", "spec", "examples", `${id}.shapes.ttl`), "utf-8");
const convert = async (shapes: string, documentName = "SpecPanel") => {
  const result = await fromShacl(shapes, { id: "p", documentName });
  const { entities } = await readUiDeclaration(result.ttl);
  const file = renderEntityFile(entities[0], "x.ui.ttl");
  const view = file.slice(file.indexOf("entityView"));
  // the detail view only: up to the next fragment or document
  const detail = view.slice(0, view.search(/\n  (fragment|query) /));
  return { ...result, entity: entities[0], file, detail };
};
// one panel entry: from "key: <kind> {" to the closing brace at the same indentation
const block = (text: string, key: string, kind: string) => {
  const lines = text.split("\n");
  const first = lines.findIndex((line) => line.trim() === `${key}: ${kind} {`);
  if (first < 0) return "";
  const indent = lines[first].length - lines[first].trimStart().length;
  const last = lines.findIndex((line, index) => index > first && line === `${" ".repeat(indent)}}`);
  return lines.slice(first, last + 1).join("\n");
};

const PREFIXES = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`;

describe("HTML values: the rich-text element in the panel", () => {
  it("an rdf:HTML property is a wysiwygElement on its metadata key, not a metadata field (example 26)", async () => {
    const { detail } = await convert(example("26-RichTextEditor"));
    const element = block(detail, "definition", "wysiwygElement");
    expect(element).toContain('metadataKey(input: "definition")');
    expect(element).toMatch(/extensions\(input: \[starterKit\]\)/);
    // the PWA reads the element's configuration unguarded: every client passes one
    expect(element).toMatch(/wysiwygElementConfiguration \{\s+showLineNumbers\(input: false\)\s+\}/);
    expect(block(detail, "definition", "metaData")).toBe("");
  });

  it("a declared shui:HTMLViewer is the same element", async () => {
    const { detail, findings } = await convert(`${PREFIXES}
ex:S a sh:NodeShape ; sh:targetClass ex:Note ;
  sh:property [ sh:path ex:body ; sh:name "Body" ; sh:datatype xsd:string ; sh:maxCount 1 ; shui:viewer shui:HTMLViewer ] .`);
    expect(block(detail, "body", "wysiwygElement")).toContain('metadataKey(input: "body")');
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
  });

  it("is not a gap: edited on the detail page; the create form has no rich-text field", async () => {
    const { findings } = await convert(example("26-RichTextEditor"));
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
    expect(findings.find((f) => /rich-text/.test(f.message))?.kind).toBe("info");
  });
});

describe("shui:ValueTableViewer: the related entities as a list in the panel (example 31)", () => {
  it("is an entityListElement on the relation, at the property's place in the panel", async () => {
    const { detail } = await convert(example("31-ValueTableViewer"), "SpecE31");
    const list = block(detail, "isBroaderFor", "entityListElement");
    expect(list).toContain('relationType: label(input: "isBroaderFor")');
    expect(list).toContain("entityTypes(input: [concept])");
    expect(list).toContain('customQuery(input: "GetEntities")');
    expect(list).toContain('customQueryFilters(input: "SpecE31IsBroaderForListFilters")');
    expect(block(detail, "isBroaderFor", "metaData")).toBe("");
  });

  it("generates the list's filters: the related type, and the entities the relation points to", async () => {
    const { file } = await convert(example("31-ValueTableViewer"), "SpecE31");
    const filters = file.slice(file.indexOf("query SpecE31IsBroaderForListFilters"));
    expect(filters).toMatch(/defaultValue\(value: \["concept"\]\)/);
    expect(filters).toContain('defaultValue(value: "$entity.relationValues.isBroaderFor.key")');
  });

  it("takes the columns from the sh:node shape: the item itself and its type are Elody's list item, the rest its teaser", async () => {
    const { entity, findings } = await convert(example("31-ValueTableViewer"), "SpecE31");
    expect(entity.properties.find((p) => p.key === "type")).toMatchObject({ teaser: true, source: "root" });
    const altLabel = entity.properties.find((p) => p.key === "altLabel")!;
    expect(altLabel.teaser).toBe(true);
    expect(entity.properties.some((p) => p.key === "self")).toBe(false);
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
    expect(findings.find((f) => /ValueTableViewer/.test(f.message))?.kind).toBe("info");
  });
});
