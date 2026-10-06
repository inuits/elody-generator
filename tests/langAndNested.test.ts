/**
 * Two SHACL UI features Elody already has a platform counterpart for:
 *
 * - language-tagged text (rdf:langString, shui:TextFieldWithLangEditor) is one
 *   multilingual value: the generator marks the field isMultilingual, so the
 *   PWA edits and shows it per language;
 * - a nested shape (sh:node, shui:DetailsEditor) is a value made of sub-values:
 *   the generator emits an inputFieldWithSubFields custom field whose sub-fields
 *   are the nested shape's property shapes.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderCreateForm, renderEntityFile } from "../src/render.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> . @prefix ex: <urn:ex:> .
`;

const person = `${prefixes}
ex:Person a sh:NodeShape ; sh:targetClass ex:PersonClass ;
  sh:property ex:Person-name , ex:Person-bio , ex:Person-title .
ex:Person-name a sh:PropertyShape ; sh:path ex:name ; sh:name "name"@en ; sh:datatype xsd:string ; sh:maxCount 1 ; sh:order 0 .
ex:Person-bio a sh:PropertyShape ; sh:path ex:bio ; sh:name "biography"@en ; sh:datatype rdf:langString ; sh:order 1 .
ex:Person-title a sh:PropertyShape ; sh:path ex:title ; sh:name "title"@en ; shui:editor shui:TextFieldWithLangEditor ; sh:order 2 .
`;

const product = readFileSync(join(__dirname, "..", "spec", "examples", "21-DetailsEditor.shapes.ttl"), "utf-8");

describe("language-tagged text is a multilingual field", () => {
  it("marks rdf:langString and the WithLang editors multilingual, plain strings not", async () => {
    const { ttl } = await fromShacl(person, { id: "person", documentName: "SpecPerson" });
    const { entities } = await readUiDeclaration(ttl);
    const byKey = Object.fromEntries(entities[0].properties.map((p) => [p.key, p]));
    expect(byKey.bio.multilingual).toBe(true);
    expect(byKey.title.multilingual).toBe(true);
    expect(byKey.name.multilingual).toBe(false);

    const form = entities[0].createForms[0];
    expect(form.fields.find((f) => f.key === "bio")?.multilingual).toBe(true);
    expect(form.fields.find((f) => f.key === "name")?.multilingual).toBe(false);
  });

  it("renders isMultilingual on the create-form field and the detail panel field", async () => {
    const { ttl } = await fromShacl(person, { id: "person", documentName: "SpecPerson" });
    const { entities } = await readUiDeclaration(ttl);
    const form = renderCreateForm(entities[0].createForms[0]);
    expect(form).toMatch(/bio: metaData \{[^}]*isMultilingual\(input: true\)/);
    expect(form).not.toMatch(/name: metaData \{[^}]*isMultilingual/);

    const file = renderEntityFile(entities[0], "src/ui/x.ui.ttl");
    const detail = file.slice(file.indexOf("entityView"));
    expect(detail).toMatch(/bio: metaData \{[^}]*isMultilingual\(input: true\)/);
  });
});

describe("a nested shape is a field with sub-fields", () => {
  it("fromShacl keeps the nested node shape and puts the field in the create form", async () => {
    const { ttl, notes } = await fromShacl(product, { id: "product", documentName: "SpecProduct" });
    expect(ttl).toContain("ex:ValueWithWeight");
    expect(ttl).toContain("ex:ValueWithWeight-numericValue");
    expect(notes.join("\n")).not.toMatch(/weight.*left out of the form/);
  });

  it("generates an inputFieldWithSubFields custom field from the nested property shapes", async () => {
    const { ttl } = await fromShacl(product, { id: "product", documentName: "SpecProduct" });
    const { entities, inputFields, warnings } = await readUiDeclaration(ttl);
    const field = entities[0].createForms[0].fields.find((f) => f.key === "weight");
    expect(field?.inputType).toBe("specProductWeightField");
    expect(inputFields.specProductWeightField).toEqual({
      type: "inputFieldWithSubFields",
      isMetadataField: true,
      subFields: [
        {
          label: "numeric value",
          key: "numericValue",
          inputField: { type: "number", validation: { value: ["required"] } },
        },
        {
          label: "unit",
          key: "unit",
          inputField: { type: "text", validation: { value: ["required"] } },
        },
      ],
    });
    // a relation inside a nested value has no Elody field: it is entered as its identifier
    expect(warnings.map((w) => w.message).join("\n")).toMatch(/unit.*sh:class.*identifier/);
  });

  it("gives the detail panel field the same input field, so the value shows as a table", async () => {
    const { ttl } = await fromShacl(product, { id: "product", documentName: "SpecProduct" });
    const { entities } = await readUiDeclaration(ttl);
    expect(entities[0].properties.find((p) => p.key === "weight")?.inputType).toBe("specProductWeightField");
    const file = renderEntityFile(entities[0], "src/ui/x.ui.ttl");
    const detail = file.slice(file.indexOf("entityView"));
    expect(detail).toMatch(/weight: metaData \{[\s\S]*?inputField\(type: specProductWeightField\) \{\s*\.\.\.inputfield/);
  });
});
