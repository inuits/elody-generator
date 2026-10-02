/**
 * Create-form fields whose SHACL-UI editor has no Elody base field type
 * (EnumSelectEditor for sh:in, InstancesSelect/AutoComplete for sh:class)
 * become generated custom input fields: a definition the client registers
 * with ElodyInstance (customInputFields) and an extension of the
 * BaseFieldType enum, exactly how clients add dropdowns by hand today.
 * elody:documentName lets several declarations render the same GraphQL type.
 */
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderCreateForm, renderEntityFile, renderInputFieldsModule } from "../src/render.js";

const declaration = (field: string, extra = "") => `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ex: <urn:ex:> . @prefix ui: <urn:ui:> .
ui:T a elody:EntityUi ; elody:graphqlType "BaseEntity" ; elody:documentName "SpecAddress" ;
  elody:viewMode [ elody:mode elody:ListView ] ;
  sh:property [ sh:path ex:name ; shui:propertyRole shui:LabelRole ] ; elody:form ui:CreateAddress .
ui:CreateAddress a elody:Form ; elody:shape [ sh:property [ sh:path ex:region ; sh:name "Region"@en ; ${field} ] ] .
${extra}`;

describe("generated custom input fields", () => {
  it("sh:in becomes a dropdown with those options", async () => {
    const { entities, inputFields } = await readUiDeclaration(declaration(`sh:in ( "ACT" "NSW" ) ; sh:maxCount 1`));
    const field = entities[0].createForms[0].fields[0];
    expect(field.inputType).toBe("specAddressRegionField");
    expect(inputFields.specAddressRegionField).toEqual({
      type: "dropdown",
      options: [
        { label: "ACT", value: "ACT" },
        { label: "NSW", value: "NSW" },
      ],
    });
    expect(renderCreateForm(entities[0].createForms[0])).toContain("inputField(type: specAddressRegionField)");
  });

  it("sh:class becomes a relation dropdown on that type", async () => {
    const { inputFields } = await readUiDeclaration(declaration(`sh:class ex:Country ; sh:maxCount 1`));
    expect(inputFields.specAddressRegionField).toMatchObject({
      type: "dropdownSingleselectRelations",
      relationType: "hasRegion",
      advancedFilterInputForRetrievingOptions: [{ type: "type", value: "country" }],
    });
  });

  it("renders a module the client imports: definitions plus the BaseFieldType extension", async () => {
    const { inputFields } = await readUiDeclaration(declaration(`sh:in ( "A" )`));
    const module = renderInputFieldsModule(inputFields, "src/ui/x.ui.ttl");
    expect(module).toContain("export const generatedInputFields");
    expect(module).toContain("extend enum BaseFieldType {");
    expect(module).toContain("specAddressRegionField");
  });

  it("elody:documentName names fragments and documents instead of the GraphQL type", async () => {
    const { entities } = await readUiDeclaration(declaration(`sh:datatype xsd:string`));
    const file = renderEntityFile(entities[0], "src/ui/x.ui.ttl");
    expect(file).toContain("fragment minimalSpecAddress on BaseEntity {");
    expect(file).toContain("...minimalBaseEntity");
    expect(file).toContain("export const specAddressQueries = gql`");
  });
});
