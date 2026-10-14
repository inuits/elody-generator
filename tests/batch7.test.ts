/**
 * Gap batch 7 (vlacc's detail extras): the primary sort option, a formatter on the detail page
 * only, hideInHistory / disableLibraryBar / enableNavigation / baseLibraryMode on elements, an
 * expand button declared hidden, the deleteQueryOptions block, a filter over several keys, and
 * a bulk operation's selection constraints.
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
const label = `[ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ; elody:sortable true ; elody:sortPrimary true ]`;
const entity = (body: string, more = "") => `${prefixes}\nui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ; elody:emit "file" ;\n  ${body} .\n${more}`;
async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((w) => w.message)).toEqual([]);
  return renderEntityFile(entities[0], "x");
}

describe("vlacc detail extras", () => {
  it("marks the primary sort option and leaves a formatter off the listing when declared", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:status_field ; sh:order 2 ; elody:labelKey "metadata.labels.status" ; shui:viewer elody:PillViewer ; elody:listingFormatter false ] ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ]`, `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`));
    expect(file).toContain('value: "title"\n            primary: true');
    const listing = file.slice(0, file.indexOf("fragment fullWork"));
    const detail = file.slice(file.indexOf("fragment fullWork"));
    expect(listing).toContain('status_field: keyValue(key: "status_field", source: metadata)');
    expect(detail).toContain('status_field: keyValue(key: "status_field", source: metadata, formatter: "pill")');
  });

  it("labels a panel field with its own key when declared", async () => {
    const file = await render(entity(`sh:property [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ; elody:detailLabelKey "metadata.labels.time" ] ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ]`, `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`));
    expect(file).toContain('title: metaData {\n        label(input: "metadata.labels.title")\n        key(input: "title")');
    expect(file).toContain('title: metaData {\n                label(input: "metadata.labels.time")\n                key(input: "title")');
  });

  it("renders element flags, a hidden expand button and the delete options", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ;
         elody:deleteOptions [ elody:deleteEntityLabel "d.work" ; elody:deleteRelationsQuery "GetAuthorsInWorkDeleteQuery" ; elody:deleteRelationsFilters "GetAuthorsInDetailFilters" ;
           elody:deleteRelationsTypes ( "person" "corporation" ) ; elody:deleteRelationsLabel "d.authors" ; elody:blockingRelationsQuery "GetExpressionsBlockingRelations" ;
           elody:blockingRelationsFilters "GetExpressionsInWorkFilters" ; elody:blockingRelationsTypes ( "reading" ) ; elody:blockingRelationsLabel "d.expressions" ] ;
         elody:detail [ elody:column [ sh:order 1 ;
           elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:hideInHistory true ; elody:expandButton false ; elody:panel ui:P ] ,
             [ a elody:ListElement ; sh:order 2 ; rdfs:label "l" ; elody:alias "Subjects" ; elody:collapsed false ; elody:entityTypes "person" ; elody:disableLibraryBar true ; elody:enableNavigation false ; elody:libraryMode "basicBaseLibraryWithBorder" ; elody:hideInHistory true ; elody:customQuery "GetSubjects" ] ] ,
           [ sh:order 2 ; elody:elementSpread "entityHistoryVersionList" ] ]`,
        `ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title .`,
      ),
    );
    expect(file).toContain('deleteQueryOptions {\n      deleteEntityLabel(input: "d.work")\n      customQueryDeleteRelations(input: "GetAuthorsInWorkDeleteQuery")\n      customQueryDeleteRelationsFilters(input: "GetAuthorsInDetailFilters")\n      customQueryEntityTypes(input: [person, corporation])\n      deleteRelationsLabel(input: "d.authors")\n      customQueryBlockingRelations(input: "GetExpressionsBlockingRelations")\n      customQueryBlockingRelationsFilters(input: "GetExpressionsInWorkFilters")\n      customQueryBlockingEntityTypes(input: [reading])\n      blockingRelationsLabel(input: "d.expressions")\n    }');
    expect(file).toContain("expandButtonOptions {\n              shown(input: false)\n            }\n            hideInHistory(input: true)");
    expect(file).toContain("isCollapsed(input: false)\n            enableNavigation(input: false)\n            disableLibraryBar(input: true)\n            hideInHistory(input: true)\n            baseLibraryMode(input: basicBaseLibraryWithBorder)");
    expect(file).toContain("column2: column {\n        elements {\n          ...entityHistoryVersionList\n        }");
  });

  it("renders a filter over several keys and a bulk operation's selection constraints", async () => {
    const file = await render(
      entity(`sh:property ${label} ;
        elody:filter [ sh:order 1 ; elody:alias "name" ; rdfs:label "metadata.labels.name" ; elody:keys ( "vlacc:1|properties.name.value" "vlacc:1|properties.non_preferred_name.value" ) ; elody:filterOperator "or" ; elody:displayedByDefault true ; elody:filterKind elody:TextFilter ] ;
        elody:bulkOperation [ sh:order 1 ; rdfs:label "merge" ; elody:icon "Merge" ; elody:operationKind elody:MergeEntitiesOperation ;
          elody:context [ elody:selection elody:SomeSelected ; elody:tooltipLabel "t" ; elody:requiresSameType true ; elody:minSelectedItems 2 ; elody:maxSelectedItems 2 ] ]`),
    );
    expect(file).toContain('key: ["vlacc:1|properties.name.value", "vlacc:1|properties.non_preferred_name.value"]\n        operator: or');
    expect(file).toContain("entitiesSelectionType: someSelected\n              requiresSameType: true\n              minSelectedItems: 2\n              maxSelectedItems: 2");
  });

  it("conforms and renders the extended listing-core fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "listing-core.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities[0], "x");
    expect(work).toContain("deleteQueryOptions {");
    expect(work).toContain("primary: true");
    expect(work).toContain('key: ["vlacc:1|properties.name.value", "vlacc:1|properties.non_preferred_name.value"]');
  });

  it("renders a list element inside a panel after its fields (G-024)", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ]`,
        `ui:P a elody:Panel ; elody:alias "awards" ; rdfs:label "metadata.labels.awards" ; elody:collapsed true ; elody:field em:title ;
           elody:element [ a elody:ListElement ; sh:order 2 ; elody:alias "Awards" ; elody:collapsed false ; elody:entityTypes "award" ; elody:relationType "refAwards" ; elody:disableLibraryBar true ; elody:customQuery "GetAwardsInDetail" ; elody:customQueryFilters "GetAwardsInEntityFilters" ] .`,
      ),
    );
    expect(file).toContain('                }\n              }\n              Awards: entityListElement {\n                isCollapsed(input: false)\n                disableLibraryBar(input: true)\n                entityTypes(input: [award])\n                relationType: label(input: "refAwards")\n                customQuery(input: "GetAwardsInDetail")\n                customQueryFilters(input: "GetAwardsInEntityFilters")\n              }\n            }');
  });
});
