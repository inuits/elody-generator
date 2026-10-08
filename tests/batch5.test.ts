/**
 * Gap batch 5 (askforceone): a validation rule beyond required, the permissions read with
 * the detail values, a filters document that narrows to a type, a selection filter with fixed
 * options or with options fetched by type only, a column alias, a panel permission, and no
 * empty detail values block. In `compare`, a one-element list equals its element (GraphQL
 * coerces a bare value into a list).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;
const label = `[ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ]`;
const entity = (body: string, more = "") => `${prefixes}\nui:TipUi a elody:EntityUi ; elody:graphqlType "Tip" ; elody:emit "file" ;\n  ${body} .\n${more}`;
async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((w) => w.message)).toEqual([]);
  return renderEntityFile(entities[0], "x");
}
const gqlFile = (path: string, body: string) => ({ path, source: `import { gql } from "graphql-modules";\nexport const x = gql\`\n${body}\n\`;\n` });

describe("askforceone", () => {
  it("renders a validation rule with its argument on a form field and on a panel field", async () => {
    const file = await render(
      entity(
        `sh:property ${label} , [ sh:path em:link ; sh:order 2 ; sh:maxCount 1 ; sh:datatype xsd:string ; elody:validationRule "url" ] ,
          [ sh:path em:readMinutes ; sh:order 3 ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:integer ; shui:editor shui:NumberFieldEditor ; elody:validationRule "customValue" ; elody:validationValue "min_value:1" ] ;
         elody:form ui:CreateTip ;
         elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:TipPanel ] ] ]`,
        `ui:TipPanel a elody:Panel ; elody:alias "tip" ; rdfs:label "p" ; elody:field em:link , em:readMinutes .
         ui:CreateTip a elody:Form ; elody:queryName "GetTipCreateForm" ; elody:alias "tip" ; elody:submit [ elody:actionQuery "CreateEntity" ] ;
           elody:shape [ sh:property [ sh:path em:link ; sh:order 1 ; sh:datatype xsd:string ; elody:validationRule "url" ] ,
             [ sh:path em:readMinutes ; sh:order 2 ; sh:minCount 1 ; sh:datatype xsd:integer ; elody:validationRule "customValue" ; elody:validationValue "min_value:1" ] ] .`,
      ),
    );
    expect(file).toContain("validation(input: { value: url }) {");
    expect(file).toContain('validation(input: { value: [required, customValue], customValue: "min_value:1" }) {');
    // a regex rule carries its pattern under regex
    const slug = await render(entity(`sh:property ${label} , [ sh:path em:slug ; sh:order 2 ; sh:maxCount 1 ; sh:datatype xsd:string ; elody:validationRule "regex" ; elody:validationValue "^[a-z0-9-]+$" ] ; elody:form ui:F`,
      `ui:F a elody:Form ; elody:queryName "GetTipCreateForm" ; elody:alias "tip" ; elody:submit [ elody:actionQuery "CreateEntity" ] ; elody:shape [ sh:property [ sh:path em:slug ; sh:order 1 ; sh:datatype xsd:string ; elody:validationRule "regex" ; elody:validationValue "^[a-z0-9-]+$" ] ] .`));
    expect(slug).toContain('validation(input: { value: regex, regex: "^[a-z0-9-]+$" }) {');
    // the panel edits the field with the same validation
    const panel = file.slice(file.indexOf("tip: panels {"));
    expect(panel).toContain("validation(input: { value: url })");
    expect(panel).toContain('validation(input: { value: [required, customValue], customValue: "min_value:1" })');
  });

  it("reads canUpdate and canDelete with the detail values when declared", async () => {
    const file = await render(entity(`sh:property ${label} ; elody:readsPermissions true ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ]`, `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`));
    const full = file.slice(file.indexOf("fragment fullTip"));
    expect(full).toContain("    intialValues {\n      canUpdate\n      canDelete\n      title: keyValue");
    expect(file.slice(0, file.indexOf("fragment fullTip"))).not.toContain("canUpdate");
  });

  it("leaves the detail values block out when nothing is read on the detail page", async () => {
    const file = await render(entity(`sh:property [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:listingOnly true ] ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ]`, `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`));
    const full = file.slice(file.indexOf("fragment fullTip"));
    expect(full).not.toContain("intialValues {");
    expect(full).toContain("fragment fullTip on Tip {\n    relationValues\n");
  });

  it("narrows a list query's filters document to the declared type", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "l" ; elody:alias "instances" ; elody:collapsed false ; elody:entityTypes "tipInstance" ; elody:listQuery ui:GetInstancesOfTip ] ] ]`,
        `ui:GetInstancesOfTip a elody:ListQuery ; elody:queryName "GetEntities" ; elody:filtersQuery "GetInstancesOfTipFilters" ; elody:filtersType "TipInstance" ;
           elody:filter [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "tipInstance" ; elody:filterKind elody:TypeFilter ] .`,
      ),
    );
    expect(file).toContain(
      [
        "  query GetInstancesOfTipFilters($entityType: String!) {",
        "    EntityTypeFilters(type: $entityType) {",
        "      ... on TipInstance {",
        "        advancedFilters {",
        "          type: advancedFilter(type: type) {",
        "            type",
        '            defaultValue(value: "tipInstance")',
        "            hidden(value: true)",
        "          }",
        "        }",
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  });

  it("renders a selection filter's fixed options and asks them back", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ sh:order 1 ; elody:alias "usageState" ; rdfs:label "metadata.labels.usage-state" ; elody:key "elody:1|metadata.usageState.value" ; elody:displayedByDefault true ; elody:filterKind elody:SelectionFilter ; elody:showTooltip true ;
        elody:option [ sh:order 2 ; elody:labelKey "metadata.options.usage-state.USED" ; elody:value "USED" ] , [ sh:order 1 ; elody:labelKey "metadata.options.usage-state.NOT_USED" ; elody:value "NOT_USED" ] ]`),
    );
    expect(file).toContain('        options: [\n          { label: "metadata.options.usage-state.NOT_USED", value: "NOT_USED" }\n          { label: "metadata.options.usage-state.USED", value: "USED" }\n        ]\n      ) {');
    expect(file).toContain("        options {\n          label\n          value\n        }\n        tooltip(value: true)");
  });

  it("fetches a selection filter's options by type only when no search key is declared", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ sh:order 1 ; elody:alias "tenant" ; rdfs:label "metadata.labels.tenant" ; elody:key "elody:1|relations.isIn.key" ; elody:displayedByDefault true ; elody:filterKind elody:SelectionFilter ;
        elody:selectionOption "checkboxlist" ; elody:optionsLabel "intialValues.title" ; elody:optionsValue "intialValues.id" ; elody:optionsType "tenant" ]`),
    );
    expect(file).toContain('        advancedFilterInputForRetrievingOptions: [\n          { type: type, value: "tenant" }\n        ]\n      ) {');
    expect(file).not.toContain("type: text");
    expect(file).toContain("        advancedFilterInputForRetrievingOptions {\n          type\n          value\n          key\n          match_exact\n        }");
  });

  it("renders a column under its alias and a panel's permission", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:alias "tipColumn" ; elody:size elody:Width70 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:TipPanel ] ] ]`,
        `ui:TipPanel a elody:Panel ; elody:alias "tip" ; rdfs:label "p" ; elody:can "update:tip" ; elody:field em:title .`,
      ),
    );
    expect(file).toContain("      tipColumn: column {\n        size(size: seventy)");
    expect(file).toContain('              isEditable(input: true)\n              can(input: "update:tip")');
  });

  it("conforms and renders the 0.3.0 validation-and-options fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "validation-and-options.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const tip = renderEntityFile(entities[0], "x");
    expect(tip).toContain("... on TipInstance {");
    expect(tip).toContain("canUpdate");
    expect(tip).toContain('can(input: "update:tip")');
    expect(tip).toContain("tipColumn: column {");
  });
});

describe("compare: list coercion", () => {
  it("counts a one-element list as its element, both ways, and a longer list as a difference", () => {
    const bare = readDefinitions([gqlFile("entities/a.queries.ts", 'query F { GetDynamicForm { formTab { formFields { k: metaData { inputField(type: baseTextField) { validation(input: { value: required }) { ...validation } } } } } } }')]).definitions;
    const listed = readDefinitions([gqlFile("entities/a.queries.ts", 'query F { GetDynamicForm { formTab { formFields { k: metaData { inputField(type: baseTextField) { validation(input: { value: [required] }) { ...validation } } } } } } }')]).definitions;
    expect(compareDefinitions(listed, bare).definitions[0].status).toBe("equal");
    expect(compareDefinitions(bare, listed).definitions[0].status).toBe("equal");
    const two = readDefinitions([gqlFile("entities/a.queries.ts", 'query F { GetDynamicForm { formTab { formFields { k: metaData { inputField(type: baseTextField) { validation(input: { value: [required, url] }) { ...validation } } } } } } }')]).definitions;
    expect(compareDefinitions(two, bare).definitions[0].status).toBe("differs");
  });
});
