/**
 * Every example of the SHACL 1.2 UI spec, read as a plain shapes graph (no
 * elody: terms), turned into an Elody form: field order, labels, widgets,
 * nesting, and what Elody cannot render. The assertions are the outcomes the
 * spec text describes for each example.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { shapeToForm, type SpecForm } from "../src/shapeForm.js";

const dir = join(__dirname, "..", "spec", "examples");
const read = (file: string) => readFileSync(join(dir, file), "utf-8");
const ex = (name: string) => `http://example.org/ns#${name}`;
const form = (id: string, options: { focus?: string; languages?: string[]; nodeShape?: string } = {}): Promise<SpecForm> => {
  const data = readdirSync(dir).includes(`${id}.data.ttl`) ? read(`${id}.data.ttl`) : undefined;
  return shapeToForm({ shapes: read(`${id}.shapes.ttl`), data, ...options });
};

describe("spec examples → Elody form", () => {
  it("getting started: fields in sh:order inside their group, cardinality to required / multiple", async () => {
    const result = await form("02-getting-started");
    const names = result.fields.map((field) => field.label);
    expect(names.slice(0, 4)).toEqual(["honorificPrefix", "givenName", "additionalName", "familyName"]);
    const given = result.fields.find((field) => field.label === "givenName")!;
    expect(given.required).toBe(true);
    expect(given.multiple).toBe(false);
    expect(given.group?.iri).toBe(ex("PersonShapeNameGroup"));
    expect(result.fields.find((field) => field.label === "additionalName")!.multiple).toBe(true);
    expect(given.elody.inputFieldType).toBe("text");
  });

  it("predicate and inverse paths: the inverse path is recognised; only the IRI-as-entity caveat remains", async () => {
    const result = await form("05-view-predicate-paths", { focus: ex("alice") });
    const department = result.fields.find((field) => field.label === "Department")!;
    expect(department.path.kind).toBe("inverse");
    expect(department.values.map((value) => value.label)).toEqual(["Research Department"]);
    expect(department.gaps.map((gap) => gap.message)).toEqual([
      "shui:LabelViewer: Elody shows a linked resource as a relation to an Elody entity, not as an arbitrary IRI",
    ]);
  });

  it("alternative paths are not editable as one Elody field", async () => {
    const result = await form("08-edit-alternative-paths");
    expect(result.fields[0].path.kind).toBe("alternative");
    expect(result.fields[0].gaps.some((gap) => gap.level === "unsupported")).toBe(true);
  });

  it("language resolution follows the order of sh:languageIn", async () => {
    const result = await form("10-lang-resolution", { focus: ex("alice") });
    expect(result.fields[0].label).toBe("Nom");
    expect(result.fields[0].values[0].value).toBe("Alice");
    expect(result.fields[0].values[0].language).toBe("fr");
    expect(result.fields[0].editor!.widget).toBe("http://www.w3.org/ns/shacl-ui/TextFieldWithLangEditor");
    expect(result.fields[0].elody).toMatchObject({ inputFieldType: "text", multilingual: true });
  });

  it("label resolution: sh:name per language, value labels from rdfs:label", async () => {
    const result = await form("11-label-resolution-local-name", { focus: ex("alice"), languages: ["de"] });
    // neither property has sh:order: the spec's tie-break orders them by resolved label
    expect(result.fields.map((field) => field.label)).toEqual(["Employer", "Vorname"]);
    const employer = result.fields.find((field) => field.label === "Employer")!;
    expect(employer.values[0].label).toBe("ACME GmbH");
  });

  it("label resolution falls back to the local name, for the property and the value", async () => {
    const result = await form("12-label-resolution-local-name", { focus: ex("book1") });
    expect(result.fields[0].label).toBe("creator");
    expect(result.fields[0].labelSource).toBe("local name");
    expect(result.fields[0].values[0].label).toBe("author1");
  });

  it("ordering without shui:defaultOrder puts unordered properties last", async () => {
    expect((await form("13-patterns")).fields.map((field) => field.label)).toEqual(["id", "description", "label"]);
  });

  it("shui:defaultOrder gives unordered properties that order", async () => {
    const shapes = read("13-patterns.shapes.ttl") + "\nex:config a shui:Configuration ; shui:defaultOrder 0 .\n";
    const result = await shapeToForm({ shapes });
    expect(result.fields.map((field) => field.label)).toEqual(["id", "label", "description"]);
  });

  it("shui:searchQuery over a class is handled by Elody's live search; over an external endpoint it is not supported", async () => {
    const local = await form("15-search-query");
    expect(local.fields[0].searchQuery).toBe(true);
    expect(local.fields[0].gaps.map((gap) => gap.level)).toEqual(["handled"]);
    const external = await form("16-search-query");
    expect(external.fields[0].gaps.some((gap) => gap.level === "unsupported" && /SERVICE/.test(gap.message))).toBe(true);
  });

  it("DetailsEditor: a nested node shape becomes a nested Elody form", async () => {
    const result = await form("21-DetailsEditor");
    const nested = result.fields.find((field) => field.nested && field.nested.length > 0);
    expect(nested).toBeDefined();
    expect(nested!.elody.inputFieldType).toBe("inputFieldWithSubFields");
  });

  it("ValueTableViewer: columns come from the sh:node shape in sh:order", async () => {
    const result = await form("31-ValueTableViewer");
    const table = result.fields.find((field) => field.viewer?.widget.endsWith("ValueTableViewer"))!;
    expect(table.columns!.map((column) => column.label)).toEqual(["narrower concept", "type", "alt labels"]);
  });

  it("property roles: direct and qualified LabelRole are found, qualified ones by sh:order", async () => {
    expect((await form("32-property-roles")).labelProperties).toEqual(["http://www.w3.org/2004/02/skos/core#prefLabel"]);
    expect((await form("33-property-roles")).labelProperties).toEqual([
      "http://www.w3.org/2004/02/skos/core#prefLabel",
      "http://schema.org/name",
    ]);
  });

  it("a widget Elody does not have is reported, not silently replaced", async () => {
    const rich = await form("26-RichTextEditor");
    expect(rich.fields[0].editor!.widget).toBe("http://www.w3.org/ns/shacl-ui/RichTextEditor");
    expect(rich.fields[0].gaps.some((gap) => gap.level === "unsupported")).toBe(true);
  });
});

describe("complex paths are left out by choice", () => {
  it("explains the view/edit symmetry the spec allows", async () => {
    const { fromShacl } = await import("../src/fromShacl.js");
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "08-edit-alternative-paths.shapes.ttl"), "utf-8");
    const { notes } = await fromShacl(shapes, { id: "e08", documentName: "SpecE08" });
    expect(notes.join("\n")).toMatch(/alternative path, left out: Elody keeps view and edit symmetric/);
  });
});

describe("example 04: a configuration and a third-party editor", () => {
  const convert04 = async () => {
    const { fromShacl } = await import("../src/fromShacl.js");
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "04-global-configuration.shapes.ttl"), "utf-8");
    return fromShacl(shapes, { id: "e04", documentName: "SpecE04" });
  };

  it("keeps the field in the create form: the unknown editor is left out, the scoring picks another", async () => {
    const { readUiDeclaration } = await import("../src/parse.js");
    const { ttl, notes } = await convert04();
    expect(notes.join("\n")).not.toMatch(/left out of the form/);
    const { entities } = await readUiDeclaration(ttl);
    expect(entities[0].createForms[0]?.fields.map((f) => f.key)).toEqual(["name"]);
  });

  it("notes that shui:languagePreference is not applied", async () => {
    const { notes } = await convert04();
    expect(notes.join("\n")).toMatch(/shui:languagePreference/);
  });
});
