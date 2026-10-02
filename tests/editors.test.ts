/**
 * SHACL 1.2 UI on the form side. L0: plain SHACL Core infers the widget
 * (same outcome as the spec's scoring). L1: an explicit shui:editor wins,
 * including Elody editors that specialise a standard one.
 */
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";

const declaration = (fields: string) => `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> . @prefix ex: <urn:ex:> .
ex:Ui a elody:EntityUi ; elody:graphqlType "Thing" ;
  elody:viewMode [ elody:mode elody:ListView ] ;
  sh:property [ sh:path ex:name ; sh:name "name" ; shui:propertyRole shui:LabelRole ] ;
  elody:form ex:CreateThing .
ex:CreateThing a elody:Form ; elody:shape [ ${fields} ] .
`;

const fieldOf = (shape: string) => {
  const { entities } = readUiDeclaration(declaration(`sh:property [ sh:name "f" ; ${shape} ]`));
  return entities[0].createForms[0].fields[0];
};

describe("L0 — the widget is inferred from SHACL Core", () => {
  it.each([
    ["sh:datatype xsd:string", "baseTextField", "TextFieldEditor"],
    ["sh:datatype xsd:string ; sh:singleLine false", "baseTextareaField", "TextAreaEditor"],
    ["sh:datatype rdf:langString", "baseTextField", "TextFieldWithLangEditor"],
    ["sh:datatype xsd:integer", "baseNumberField", "NumberFieldEditor"],
    ["sh:datatype xsd:decimal", "baseNumberField", "NumberFieldEditor"],
    ["sh:datatype xsd:boolean", "baseCheckbox", "BooleanEditor"],
    ["sh:datatype xsd:date", "baseDateField", "DatePickerEditor"],
    ["sh:datatype xsd:dateTime", "baseDateTimeField", "DateTimePickerEditor"],
    ["sh:nodeKind sh:IRI", "baseTextField", "IRIEditor"],
    ["sh:datatype xsd:anyURI", "baseTextField", "IRIEditor"],
  ])("%s → %s", (shape, fieldType, editor) => {
    const field = fieldOf(shape);
    expect(field.inputType).toBe(fieldType);
    expect(field.editor).toBe(`http://www.w3.org/ns/shacl-ui/${editor}`);
  });

  it("keeps the time of an xsd:dateTime (the runtime path mapped it to date)", () => {
    expect(fieldOf("sh:datatype xsd:dateTime").inputType).toBe("baseDateTimeField");
  });

  it("sh:minCount 1 makes the field required", () => {
    expect(fieldOf("sh:datatype xsd:string ; sh:minCount 1").required).toBe(true);
    expect(fieldOf("sh:datatype xsd:string").required).toBe(false);
  });

  it("orders fields by sh:order", () => {
    const { entities } = readUiDeclaration(
      declaration(`sh:property [ sh:name "b" ; sh:order 2 ; sh:datatype xsd:string ] , [ sh:name "a" ; sh:order 1 ; sh:datatype xsd:string ]`),
    );
    expect(entities[0].createForms[0].fields.map((field) => field.key)).toEqual(["a", "b"]);
  });
});

describe("L1 — an explicit shui:editor wins", () => {
  it("overrides the inferred widget", () => {
    expect(fieldOf("sh:datatype xsd:string ; shui:editor shui:TextAreaEditor").inputType).toBe("baseTextareaField");
  });

  it("accepts an Elody editor (a shui:Editor subclass instance)", () => {
    expect(fieldOf("shui:editor elody:ColorEditor").inputType).toBe("baseColorField");
    expect(fieldOf("sh:class <urn:ex:Person> ; shui:editor elody:EntityPickerEditor").inputType).toBe("baseEntityPickerField");
  });

  it("reads the legacy shui# namespace and warns", () => {
    const { entities, warnings } = readUiDeclaration(
      declaration(`sh:property [ sh:name "f" ; <http://www.w3.org/ns/shacl-ui#editor> <http://www.w3.org/ns/shacl-ui#BooleanEditor> ]`),
    );
    expect(entities[0].createForms[0].fields[0].inputType).toBe("baseCheckbox");
    expect(warnings.some((warning) => warning.message.includes("shacl-ui#"))).toBe(true);
  });

  it("refuses an editor Elody does not implement", () => {
    expect(() => fieldOf("shui:editor shui:RichTextEditor")).toThrow(/RichTextEditor/);
  });
});

describe("viewers", () => {
  it("shui:viewer + elody:viewerArgument render as the Elody formatter", () => {
    const { entities } = readUiDeclaration(`
      @prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> .
      <urn:ui> a elody:EntityUi ; elody:graphqlType "T" ; elody:viewMode [ elody:mode elody:ListView ] ;
        sh:property [ sh:name "kind" ; shui:viewer elody:PillViewer ; elody:viewerArgument "auto" ] ,
                    [ sh:name "home" ; shui:viewer shui:HyperlinkViewer ] .`);
    expect(entities[0].properties.map((property) => property.formatter)).toEqual(["pill|auto", "link"]);
  });
});
