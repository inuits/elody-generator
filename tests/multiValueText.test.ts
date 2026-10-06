/**
 * Text with several values. A property without sh:maxCount 1 may hold more
 * than one value (vlacc's memos, VIAF numbers and non-preferred names are
 * lists of strings). SHACL UI repeats a single-value editor such as
 * shui:TextFieldEditor once per value; Elody's counterpart is one field that
 * holds a list of free-text values (dropdownMultiselectMetadata, new values
 * typed in), generated per property like an sh:in dropdown. The ontology
 * states which Elody field a text editor uses for several values.
 */
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";

const shapes = (property: string) => `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
ex:PersonShape a sh:NodeShape ; sh:targetClass ex:Person ;
  sh:property [ sh:path ex:name ; sh:datatype xsd:string ; sh:maxCount 1 ; sh:order 0 ] , [ ${property} ; sh:order 1 ] .`;
const second = async (property: string) => {
  const { ttl } = await fromShacl(shapes(property), { id: "p", documentName: "SpecPerson" });
  const parsed = await readUiDeclaration(ttl);
  const field = parsed.entities[0].createForms[0].fields.find((f) => f.key !== "name")!;
  return { ...parsed, field, entity: parsed.entities[0] };
};
const LIST_OF_TEXTS = { type: "dropdownMultiselectMetadata", isMetadataField: true, canCreateEntityFromOption: true, multiple: true };

describe("text with several values", () => {
  it("is a list-of-texts field when sh:maxCount is absent", async () => {
    const { field, inputFields } = await second("sh:path ex:memo ; sh:datatype xsd:string");
    expect(field.inputType).toBe("specPersonMemoField");
    expect(inputFields.specPersonMemoField).toEqual(LIST_OF_TEXTS);
  });

  it("also when sh:maxCount allows more than one", async () => {
    const { field } = await second("sh:path ex:memo ; sh:datatype xsd:string ; sh:maxCount 3");
    expect(field.inputType).toBe("specPersonMemoField");
  });

  it("also with an explicit shui:TextFieldEditor (a single-value editor, repeated per value)", async () => {
    const { field } = await second("sh:path ex:memo ; sh:datatype xsd:string ; shui:editor shui:TextFieldEditor");
    expect(field.inputType).toBe("specPersonMemoField");
  });

  it("stays a text field with sh:maxCount 1", async () => {
    const { field, inputFields } = await second("sh:path ex:memo ; sh:datatype xsd:string ; sh:maxCount 1");
    expect(field.inputType).toBe("baseTextField");
    expect(inputFields.specPersonMemoField).toBeUndefined();
  });

  it("leaves language-tagged text to the multilingual field", async () => {
    const { field } = await second("sh:path ex:memo ; sh:datatype rdf:langString");
    expect(field.inputType).toBe("baseTextField");
    expect(field.multilingual).toBe(true);
  });

  it("is the same field on the editable detail panel", async () => {
    const { entity } = await second("sh:path ex:memo ; sh:datatype xsd:string");
    const file = renderEntityFile(entity, "x.ui.ttl");
    expect(file.slice(file.indexOf("entityView"))).toMatch(/memo: metaData \{[\s\S]*?inputField\(type: specPersonMemoField\)/);
  });
});

describe("generated field names", () => {
  it("camel-case a metadata key with underscores", async () => {
    const { field, inputFields } = await second("sh:path ex:internal_memo ; sh:datatype xsd:string");
    expect(field.inputType).toBe("specPersonInternalMemoField");
    expect(inputFields.specPersonInternalMemoField).toBeDefined();
  });
});
