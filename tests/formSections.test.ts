/**
 * Property groups in the create form. SHACL 1.2 UI groups a form's properties
 * by sh:group; groups and ungrouped properties share one sequence (sh:order
 * of the group and of the property). Elody renders a group as a titled
 * section (baseGraphql FormSection); an ungrouped property stays a plain field.
 *
 * fromShacl keeps ungrouped properties ungrouped: the detail page's "Details"
 * panel shows them through elody:showsUngrouped instead of a made-up sh:group.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderCreateForm, renderEntityFile } from "../src/render.js";
import { validateDeclaration } from "../src/validate.js";

const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "02-getting-started.shapes.ttl"), "utf-8");
const convert = () => fromShacl(shapes, { id: "e02", documentName: "SpecE02" });

describe("property groups in the create form", () => {
  it("puts the grouped fields in a section, in the spec's order", async () => {
    const { entities } = await readUiDeclaration((await convert()).ttl);
    const fields = entities[0].createForms[0].fields;
    expect(fields.map((f) => [f.key, f.section?.alias])).toEqual([
      ["honorificPrefix", "personShapeNameGroup"],
      ["givenName", "personShapeNameGroup"],
      ["additionalName", "personShapeNameGroup"],
      ["familyName", "personShapeNameGroup"],
      ["birthDate", undefined],
    ]);
    expect(fields[0].section?.label).toBe("Name");
  });

  it("renders a formSection around the group's fields", async () => {
    const { entities } = await readUiDeclaration((await convert()).ttl);
    const form = renderCreateForm(entities[0].createForms[0]);
    expect(form).toContain("personShapeNameGroupSection: formSection {");
    expect(form).toMatch(/formSection \{\s*label\(input: "Name"\)\s*formFields \{\s*honorificPrefix: metaData \{/);
    // the ungrouped field follows the section, outside it
    const section = form.indexOf("formSection {");
    const birthDate = form.indexOf("birthDate: metaData {");
    const sectionEnd = form.indexOf("familyName: metaData {");
    expect(birthDate).toBeGreaterThan(sectionEnd);
    expect(section).toBeLessThan(sectionEnd);
  });

  it("orders groups and ungrouped fields as one sequence", async () => {
    // the group after the ungrouped field: sh:order 10 on the group
    const later = shapes.replace(/ex:PersonShapeNameGroup a sh:PropertyGroup ;\n    sh:order 0 ;/, "ex:PersonShapeNameGroup a sh:PropertyGroup ;\n    sh:order 10 ;");
    const { ttl } = await fromShacl(later, { id: "e02", documentName: "SpecE02" });
    const { entities } = await readUiDeclaration(ttl);
    expect(entities[0].createForms[0].fields.map((f) => f.key)).toEqual([
      "birthDate",
      "honorificPrefix",
      "givenName",
      "additionalName",
      "familyName",
    ]);
  });

  it("renders a form without groups without sections", async () => {
    const plain = shapes.replace(/\n\s*sh:group ex:PersonShapeNameGroup ;/g, "");
    const { ttl } = await fromShacl(plain, { id: "e02", documentName: "SpecE02" });
    const { entities } = await readUiDeclaration(ttl);
    expect(renderCreateForm(entities[0].createForms[0])).not.toContain("formSection");
  });
});

describe("ungrouped properties stay ungrouped", () => {
  it("fromShacl gives them no sh:group and shows them in the Details panel", async () => {
    const { ttl } = await convert();
    expect(ttl).toMatch(/elody:showsUngrouped true/);
    expect(ttl).not.toMatch(/sh:path schema:birthDate[^.]*sh:group/);
    expect((await validateDeclaration(ttl)).conforms).toBe(true);

    const { entities } = await readUiDeclaration(ttl);
    const panels = entities[0].detail!.columns[0].elements[0].panels;
    expect(panels.map((p) => [p.alias, p.fields])).toEqual([
      ["personShapeNameGroup", ["honorificPrefix", "givenName", "additionalName", "familyName"]],
      ["details", ["birthDate"]],
    ]);
    expect(renderEntityFile(entities[0], "x.ui.ttl")).toContain("details: panels {");
  });
});

describe("the spec report", () => {
  it("no longer reports sh:group as a gap", async () => {
    const { shapeToForm } = await import("../src/shapeForm.js");
    const result = await shapeToForm({ shapes, nodeShape: "http://example.org/ns#PersonShape" });
    expect(result.fields.flatMap((field) => field.gaps.map((gap) => gap.message)).join("\n")).not.toMatch(/sh:group/);
  });
});
