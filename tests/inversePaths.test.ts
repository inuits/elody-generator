/**
 * Inverse paths (sh:path [ sh:inversePath ex:p ]) and relation-valued
 * properties. Elody stores every relation on both entities: writing hasX on
 * one side adds its mirror isXFor on the other (collection-api's relation
 * mapping). So the inverse of ex:member, seen from the person, is the person's
 * isMemberFor relation: read with keyValue(source: relations) and written with
 * a relation dropdown of that type. elody:relationType overrides the name.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile, renderInitialValues } from "../src/render.js";
import { shapeToForm } from "../src/shapeForm.js";
import { validateDeclaration } from "../src/validate.js";

const example = (name: string, part: "shapes" | "data") =>
  readFileSync(join(__dirname, "..", "spec", "examples", `${name}.${part}.ttl`), "utf-8");
const EX = "http://example.org/ns#";

describe("an inverse path is the mirrored Elody relation", () => {
  it("fromShacl keeps the inverse-path property instead of leaving it out", async () => {
    const { ttl, notes } = await fromShacl(example("07-edit-predicate-paths", "shapes"), { id: "e07", documentName: "SpecE07" });
    expect(ttl).toContain("sh:inversePath ex:member");
    expect(notes.join("\n")).not.toMatch(/inverse path, left out/);
    expect((await validateDeclaration(ttl)).conforms).toBe(true);
  });

  it("reads it as the relation isMemberFor, keyed by that relation type", async () => {
    const { ttl } = await fromShacl(example("07-edit-predicate-paths", "shapes"), { id: "e07", documentName: "SpecE07" });
    const { entities } = await readUiDeclaration(ttl);
    const department = entities[0].properties.find((p) => p.relationType)!;
    expect(department.key).toBe("isMemberFor");
    expect(department.relationType).toBe("isMemberFor");
    expect(renderInitialValues(entities[0], 0)).toContain(
      'isMemberFor: keyValue(key: "isMemberFor", source: relations, metadataKeyAsLabel: "label|title|name")',
    );
  });

  it("with sh:class it is a relation dropdown on that class in the create form", async () => {
    const { ttl } = await fromShacl(example("07-edit-predicate-paths", "shapes"), { id: "e07", documentName: "SpecE07" });
    const { entities, inputFields } = await readUiDeclaration(ttl);
    const field = entities[0].createForms[0].fields.find((f) => f.key === "isMemberFor")!;
    expect(inputFields[field.inputType]).toMatchObject({
      relationType: "isMemberFor",
      advancedFilterInputForRetrievingOptions: [{ type: "type", value: "department" }],
    });
  });

  it("without sh:class it is shown on the detail page but cannot be picked in the create form", async () => {
    const { ttl, notes } = await fromShacl(example("05-view-predicate-paths", "shapes"), {
      id: "e05",
      documentName: "SpecE05",
      data: example("05-view-predicate-paths", "data"),
      focus: `${EX}alice`,
    });
    const { entities } = await readUiDeclaration(ttl);
    expect(entities[0].properties.map((p) => p.key)).toContain("isMemberFor");
    expect(entities[0].createForms[0].fields.map((f) => f.key)).not.toContain("isMemberFor");
    expect(notes.join("\n")).toMatch(/Department.*sh:class/);
  });

  it("carries the spec data's related nodes as sample relations", async () => {
    const { relations } = await fromShacl(example("05-view-predicate-paths", "shapes"), {
      id: "e05",
      documentName: "SpecE05",
      data: example("05-view-predicate-paths", "data"),
      focus: `${EX}alice`,
    });
    expect(relations).toEqual([{ type: "isMemberFor", key: `${EX}researchDept`, label: "Research Department" }]);
  });

  it("no longer reports an inverse path as a gap", async () => {
    const result = await shapeToForm({ shapes: example("05-view-predicate-paths", "shapes"), nodeShape: `${EX}PersonShape` });
    const department = result.fields.find((field) => field.label === "Department")!;
    expect(department.gaps).toEqual([]);
  });
});

describe("relation types on property shapes", () => {
  const declaration = (path: string, extra = "") => `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <urn:ex:> . @prefix ui: <urn:ui:> .
ui:T a elody:EntityUi ; elody:graphqlType "BaseEntity" ; elody:documentName "SpecPerson" ;
  elody:viewMode [ elody:mode elody:ListView ] ;
  sh:property [ sh:path ex:name ] , [ sh:path ${path} ; sh:class ex:Department ${extra} ] .`;

  it("elody:relationType names the relation when the client uses another name", async () => {
    const { entities } = await readUiDeclaration(declaration("[ sh:inversePath ex:member ]", '; elody:relationType "belongsToDepartment"'));
    const field = entities[0].properties.find((p) => p.relationType)!;
    expect(field.relationType).toBe("belongsToDepartment");
    expect(field.key).toBe("belongsToDepartment");
  });

  it("elody:valueLabelKey picks the related entity's label metadata", async () => {
    const { entities } = await readUiDeclaration(declaration("[ sh:inversePath ex:member ]", '; elody:valueLabelKey "department_name"'));
    expect(renderInitialValues(entities[0], 0)).toContain('metadataKeyAsLabel: "department_name"');
  });

  it("a forward sh:class property is read from the relations too (hasDepartment)", async () => {
    const { entities } = await readUiDeclaration(declaration("ex:department"));
    const field = entities[0].properties.find((p) => p.key === "department")!;
    expect(field.relationType).toBe("hasDepartment");
    expect(renderEntityFile(entities[0], "x.ui.ttl")).toContain(
      'department: keyValue(key: "hasDepartment", source: relations, metadataKeyAsLabel: "label|title|name")',
    );
  });
});

describe("a property group without rdfs:label", () => {
  it("is labelled with its local name, as the spec's label resolution falls back to", async () => {
    const { ttl } = await fromShacl(example("31-ValueTableViewer", "shapes"), { id: "e31", documentName: "SpecE31" });
    expect(ttl).toMatch(/skos:HierarchicalRelationships[\s\S]*?rdfs:label "HierarchicalRelationships"/);
  });
});
