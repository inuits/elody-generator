/**
 * Gap batch 4 (ugent-aicap): the edit button on a window, a list's view mode
 * and permissions, a filter's lookup and matchers type, a relation labelled
 * by a root field, a filters fragment named by the client, an empty custom
 * operations set, and parse errors of files out of scope.
 */
import { describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;
const label = `[ sh:path em:name ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.name" ]`;
const entity = (body: string, more = "") => `${prefixes}\nui:SiteUi a elody:EntityUi ; elody:graphqlType "Site" ; elody:emit "file" ;\n  ${body} .\n${more}`;
async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((w) => w.message)).toEqual([]);
  return renderEntityFile(entities[0], "x");
}

describe("ugent-aicap", () => {
  it("renders the edit button on a window and a list's view mode and permissions", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width50 ; elody:element
        [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:editButton true ; elody:panel ui:Info ] ,
        [ a elody:ListElement ; sh:order 2 ; rdfs:label "navigation.inscriptions" ; elody:alias "siteRefInscriptions" ; elody:collapsed false ; elody:entityTypes "inscription" ; elody:listViewMode "Library" ; elody:can "read:mediafile:overview" ; elody:customQuery "GetEntities" ; elody:customQueryFilters "GetSiteRefInscriptionsFilter" ] ] ]`,
        `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "p" ; elody:field em:name .`),
    );
    expect(file).toContain('label(input: "w")\n            editMetadataButton(input: { hasButton: true }) {\n              ...editMetadataButton\n            }');
    expect(file).toContain('entityTypes(input: [inscription])\n            viewMode(input: Library)\n            can(input: ["read:mediafile:overview"])');
  });

  it("renders a filter's lookup and matchers type, and a relation labelled by a root field", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:refMediafiles ; sh:order 2 ; elody:relationType "refMediafiles" ; elody:valueLabelRootKey "display_filename" ; elody:teaser false ] ;
        elody:filtersFragmentName "siteFilters" ;
        elody:filter [ rdfs:label "metadata.labels.id" ; sh:order 1 ; elody:alias "id" ; elody:key "aicap:1|id" ; elody:matchersType "selectionForMetadata" ; elody:displayedByDefault true ; elody:filterKind elody:SelectionFilter ] ,
          [ sh:order 2 ; elody:alias "relation" ; elody:key "aicap:1|lookup.virtual_relations.ref_areas.identifiers" ; dash:hidden true ; sh:defaultValue "$entity.id" ; elody:filterKind elody:SelectionFilter ;
            elody:lookup [ elody:lookupFrom "areas_actual" ; elody:lookupLocalField "id" ; elody:lookupForeignField "properties.ref_mediafiles.value" ; elody:lookupAs "lookup.virtual_relations.ref_areas" ] ]`),
    );
    expect(file).toContain('refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "display_filename" })');
    expect(file).toContain("fragment siteFilters on Site {");
    expect(file).toContain("        type: selection\n        matchersType: selectionForMetadata\n");
    expect(file).toContain('        lookup: {\n          from: "areas_actual"\n          local_field: "id"\n          foreign_field: "properties.ref_mediafiles.value"\n          as: "lookup.virtual_relations.ref_areas"\n        }');
    expect(file).toContain("        lookup {\n          from\n          local_field\n          foreign_field\n          as\n        }");
  });

  it("renders a panel field's unit", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:gps ; sh:order 2 ; elody:unit elody:CoordinatesDefault ; elody:labelKey "metadata.labels.gps" ; elody:detailOnly true ] ;
        elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width50 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:Info ] ] ]`,
        `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "p" ; elody:field em:gps .`),
    );
    expect(file).toContain('key(input: "gps")\n                unit(input: COORDINATES_DEFAULT)');
  });

  it("renders canBeMultipleColumns false when declared so", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width50 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:Info ] ] ]`,
        `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "p" ; elody:multipleColumns false ; elody:field em:name .`),
    );
    expect(file).toContain("canBeMultipleColumns(input: false)");
  });

  it("declares an empty custom operations set", async () => {
    const file = await render(entity(`sh:property ${label} ; elody:customBulkOperations ui:Ops`, `ui:Ops elody:queryName "GetSiteRefSitesBulkOperations" .`));
    expect(file).toContain("  query GetSiteRefSitesBulkOperations {\n    CustomBulkOperations {\n      bulkOperationOptions {\n        options(input: []) {");
  });

  it("compare: a file out of scope does not count, parse errors included", () => {
    const client = readDefinitions([{ path: "queries/entities/broken.queries.ts", source: "export const q = gql`fragment x { `;" }]);
    expect(client.errors).toHaveLength(1);
    const report = compareDefinitions(client.definitions, [], { outOfScopeFiles: { "queries/entities/broken.queries.ts": "G-030" } });
    expect(report.summary.total).toBe(0);
  });
});
