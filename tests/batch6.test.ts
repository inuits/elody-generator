/**
 * Gap batch 6 (vlacc's structure): a listing split into a core and a wrapper, a card key of
 * its own, values read from a repeatable group or the parent entity, a relation filtered on a
 * property, a filter whose selection set is a shared fragment, a column spreading a shared
 * element, a bulk operation offered in every view mode, and no empty card block.
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
const entity = (body: string, more = "") => `${prefixes}\nui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ;\n  ${body} .\n${more}`;
async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((w) => w.message)).toEqual([]);
  return renderEntityFile(entities[0], "x");
}

describe("vlacc structure", () => {
  it("splits the listing into a core and a wrapper when declared", async () => {
    const file = await render(entity(`sh:property ${label} ; elody:listingCore true ; elody:viewMode [ sh:order 1 ; elody:mode elody:TableView ]`));
    expect(file).toContain("  fragment minimalWorkCore on Work {\n    intialValues {\n      title: keyValue");
    expect(file).toContain('        key(input: "title")\n      }\n    }\n    ...minimalBaseEntity\n  }\n\n  fragment minimalWork on Work {\n    ...minimalWorkCore\n    allowedViewModes {');
    expect(file).not.toContain("fragment minimalWork on Work {\n    intialValues");
  });

  it("leaves the card block out when nothing is shown", async () => {
    const file = await render(entity(`sh:property [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:teaser false ]`));
    expect(file).not.toContain("teaserMetadata {");
  });

  it("reads a card field under its own key", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:type ; sh:order 2 ; elody:alias "typePillLabel" ; elody:cardKey "typePill" ; elody:source elody:TypePillLabelSource ; elody:index 0 ; elody:labelKey "metadata.labels.type" ]`));
    expect(file).toContain('typePillLabel: keyValue(key: "type", source: typePillLabel, index: 0)');
    expect(file).toContain('typePillLabel: metaData {\n        label(input: "metadata.labels.type")\n        key(input: "typePill")');
  });

  it("reads values from a repeatable group, the parent entity and a relation filtered on a property", async () => {
    const file = await render(
      entity(`sh:property ${label} ,
        [ sh:path em:isbn_group ; sh:order 2 ; elody:alias "isbns" ; elody:source elody:RepeatableMetadataSource ; elody:repeatableMetadataKey "isbn" ; elody:labelKey "metadata.labels.isbn" ] ,
        [ sh:path em:id ; sh:order 3 ; elody:alias "navigate_to_id" ; elody:source elody:ParentRootSource ; elody:parentRelationType "refParentEntity" ; elody:teaser false ] ,
        [ sh:path em:refAuthors ; sh:order 4 ; elody:relationType "refAuthors" ; elody:valueLabelKey "name" ; elody:containsRelationPropertyKey "main_author" ; elody:containsRelationPropertyValue "true" ; elody:labelKey "metadata.labels.main-author" ]`),
    );
    expect(file).toContain('isbns: keyValue(key: "isbn_group", source: repeatableMetadata, repeatableMetadataKey: "isbn")');
    expect(file).toContain('navigate_to_id: keyValue(key: "id", source: parentRoot, parentRelations: [{ relationType: "refParentEntity" }])');
    expect(file).toContain('refAuthors: keyValue(key: "refAuthors", source: relations, metadataKeyAsLabel: "name", containsRelationPropertyKey: "main_author", containsRelationPropertyValue: "true")');
  });

  it("renders a filter's selection set as the shared fragment, keeping the fields with arguments", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ sh:order 1 ; elody:alias "title" ; rdfs:label "metadata.labels.title" ; elody:key "vlacc:1|metadata.title.value" ; elody:displayedByDefault true ; elody:filterKind elody:TextFilter ; elody:selectionSpread "advancedFilter" ; sh:defaultValue "$entity.intialValues.title" ]`),
    );
    expect(file).toContain('      ) {\n        ...advancedFilter\n        defaultValue(value: "$entity.intialValues.title")\n      }');
    expect(file).not.toContain("        isDisplayedByDefault\n");
  });

  it("spreads a shared element in a column and offers a bulk operation in every view mode", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:elementSpread "entityHistoryVersionList" ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ] ;
         elody:bulkOperation [ sh:order 1 ; rdfs:label "bulk-operations.edit" ; elody:icon "Edit" ; elody:operationKind elody:EditOperation ; elody:context [ elody:selection elody:SomeSelected ; elody:tooltipLabel "t" ] ]`,
        `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`,
      ),
    );
    expect(file).toContain("          }\n          ...entityHistoryVersionList\n        }");
    expect(file).toContain('actionContext: {\n              entitiesSelectionType: someSelected\n              labelForTooltip: "t"\n            }');
  });

  it("conforms and renders the 0.3.0 listing-core fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "listing-core.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities[0], "x");
    expect(work).toContain("fragment minimalWorkCore on Work");
    expect(work).toContain("...advancedFilter");
    expect(work).toContain("...entityHistoryVersionList");
  });
});
