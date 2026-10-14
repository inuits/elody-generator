/**
 * G-039 / G-040: several create forms per type spreading a shared fields fragment
 * (elody:fieldsSpread), and shared nodes (a form, a picker, a custom bulk operations set)
 * emitted once, with the first type that references them.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;
const label = `[ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ]`;
const shared = `
ui:CreateWork a elody:Form ; elody:queryName "GetFullWorkCreateForm" ; rdfs:label "navigation.create-work" ; elody:alias "Work" ; elody:fieldsSpread "basicCreateWorkFields" ;
  elody:submit [ rdfs:label "actions.labels.create" ; elody:icon "Create" ; elody:actionQuery "CreateEntity" ; elody:creationType "work" ] ;
  elody:shape [ sh:property [ sh:path em:record_type ; sh:name "record type"@en ; sh:order 1 ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ] .
ui:CreateWorkBasic a elody:Form ; elody:queryName "GetBasicWorkCreateForm" ; elody:alias "Work" ; elody:fieldsSpread "basicCreateWorkFields" ; elody:submit [ elody:actionQuery "CreateEntity" ] ; elody:shape [ ] .
ui:Authors a elody:Picker ; elody:queryName "GetEntityPickerListForAuthors" ; elody:result [ elody:graphqlType "Person" ; sh:order 1 ; elody:fragment "minimalPerson" ] .
ui:AuthorOps a elody:CustomBulkOperations ; elody:queryName "GetBulkOperationsForAuthors" .`;

describe("several create forms per type", () => {
  it("spreads the shared fields fragment first and allows a form of spreads only", async () => {
    const { entities, warnings } = await readUiDeclaration(`${prefixes}\nui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ; sh:property ${label} ; elody:form ui:CreateWork , ui:CreateWorkBasic .\n${shared}`);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const file = renderEntityFile(entities[0], "x");
    expect(file).toContain('  query GetFullWorkCreateForm {\n    GetDynamicForm {\n      label(input: "navigation.create-work")\n      Work: formTab {\n        formFields {\n          ...basicCreateWorkFields\n          record_type: metaData {');
    expect(file).toContain("  query GetBasicWorkCreateForm {\n    GetDynamicForm {\n      Work: formTab {\n        formFields {\n          ...basicCreateWorkFields\n          createAction: action {");
    // the submit action under an alias of its own
    const { entities: aliased } = await readUiDeclaration(`${prefixes}\nui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ; sh:property ${label} ; elody:form ui:F .\nui:F a elody:Form ; elody:queryName "GetAuthorsInWorkRelationMetadataFieldsForm" ; elody:alias "Fields" ; elody:submit [ elody:alias "confirmAction" ; rdfs:label "actions.labels.confirm" ; elody:actionQuery "CreateEntity" ] ; elody:shape [ sh:property [ sh:path em:role ; sh:order 1 ; sh:datatype xsd:string ] ] .`);
    expect(renderEntityFile(aliased[0], "x")).toContain("          confirmAction: action {");
  });
});

describe("shared nodes are emitted once", () => {
  it("renders a form, a picker and a custom bulk operations set two types share in the first type's file only", async () => {
    const ttl = `${prefixes}
ui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ; sh:property ${label} ; elody:form ui:CreateWork ; elody:picker ui:Authors ; elody:customBulkOperations ui:AuthorOps .
ui:ExpressionUi a elody:EntityUi ; elody:graphqlType "Expression" ; elody:emit "file" ; sh:property ${label} ; elody:form ui:CreateWork ; elody:picker ui:Authors ; elody:customBulkOperations ui:AuthorOps .
${shared}`;
    const { entities, warnings } = await readUiDeclaration(ttl);
    expect(warnings.map((w) => w.message)).toEqual([]);
    // the first parsed type carries them, whichever that is: exactly one of the two files holds each
    const files = entities.map((entity) => renderEntityFile(entity, "x"));
    for (const name of ["query GetFullWorkCreateForm", "query GetEntityPickerListForAuthors", "query GetBulkOperationsForAuthors"])
      expect(files.filter((file) => file.includes(name)).length, name).toBe(1);
  });

  it("conforms and renders the fixture's two forms", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "listing-core.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities } = await readUiDeclaration(fixture);
    const work = renderEntityFile(entities[0], "x");
    expect(work).toContain("query GetFullWorkCreateForm");
    expect(work).toContain("query GetBasicWorkCreateForm");
  });

  it("renders copyFromParent, a hidden form field, a required relation's details and an empty sort option list", async () => {
    const { entities } = await readUiDeclaration(`${prefixes}
ui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ; elody:excludeBaseSortOptions true ; sh:property ${label} ; elody:form ui:F .
ui:F a elody:Form ; elody:queryName "GetWorkFromSourceCreateForm" ; elody:alias "Work" ;
  elody:copyFromParent [ elody:autoCopy true ; elody:copyKey [ sh:order 1 ; elody:key "ref_languages" ; elody:fromKey "ref_work_languages" ] , [ sh:order 2 ; elody:key "ref_authors" ; elody:fromKey "ref_work_authors" ] ] ;
  elody:submit [ elody:actionQuery "CreateEntity" ] ;
  elody:shape [ sh:property [ sh:path em:is_omnibus ; sh:order 1 ; sh:maxCount 1 ; sh:datatype xsd:boolean ; dash:hidden true ] ,
    [ sh:path em:refWork ; sh:order 2 ; sh:maxCount 1 ; elody:clientInputField "refWorkInReadingTypeField" ; elody:validationRule "has_required_relation" ; elody:validationRelationType "refWork" ; elody:validationAmount 1 ; elody:validationExact true ] ] .`);
    const file = renderEntityFile(entities[0], "x");
    expect(file).toContain('      Work: formTab {\n        copyFromParent(input: { autoCopy: true, keyMap: [{ key: "ref_languages", fromKey: "ref_work_languages" }, { key: "ref_authors", fromKey: "ref_work_authors" }] }) {\n          ...copyFromParent\n        }\n        formFields {');
    expect(file).toContain("            inputField(type: baseCheckbox) {\n              ...inputfield\n            }\n            hiddenField(input: { hidden: true }) {\n              ...hiddenField\n            }");
    expect(file).toContain('validation(input: { value: has_required_relation, has_required_relation: { relationType: "refWork", amount: 1, exact: true } }) {');
    expect(file).toContain("    sortOptions {\n      options(\n        input: [\n\n        ]\n        excludeBaseSortOptions: true");
  });

  it("emits a filters document two list queries share once", async () => {
    const { entities } = await readUiDeclaration(`${prefixes}
ui:AUi a elody:EntityUi ; elody:graphqlType "A" ; elody:emit "file" ; sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "l" ; elody:alias "Nurs" ; elody:collapsed false ; elody:entityTypes "nur" ; elody:listQuery ui:Q1 ] ] ] .
ui:BUi a elody:EntityUi ; elody:graphqlType "B" ; elody:emit "file" ; sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "l" ; elody:alias "Nurs" ; elody:collapsed false ; elody:entityTypes "nur" ; elody:listQuery ui:Q2 ] ] ] .
ui:Q1 a elody:ListQuery ; elody:queryName "GetNur" ; elody:filtersQuery "GetNurInWorkFilters" ; elody:filter [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "nur" ; elody:filterKind elody:TypeFilter ] .
ui:Q2 a elody:ListQuery ; elody:queryName "GetNurInWork" ; elody:filtersQuery "GetNurInWorkFilters" ; elody:filter [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "nur" ; elody:filterKind elody:TypeFilter ] .`);
    const files = entities.map((entity) => renderEntityFile(entity, "x"));
    expect(files.filter((file) => file.includes("query GetNurInWorkFilters")).length).toBe(1);
  });
});
