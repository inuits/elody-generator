/**
 * G-025 (remainder): a window's status, a list's actions on its result, addEntitiesToForms, the
 * crop coordinates key on a media list, a single media element, a map element with its config,
 * and the map feature fields of the listing.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const fixture = async (name: string) => {
  const { VOCABULARY_PATH } = await import("../src/ontology.js");
  const ttl = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", name), "utf-8");
  expect((await validateDeclaration(ttl)).issues.map(formatIssue)).toEqual([]);
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((w) => w.message)).toEqual([]);
  return renderEntityFile(entities[0], "x");
};

describe("window status, actions on result and map feature fields", () => {
  it("renders the listing-core fixture's window status, actions on result and map feature fields", async () => {
    const work = await fixture("listing-core.ui.ttl");
    expect(work).toContain(
      [
        "            expandButtonOptions {",
        "              shown(input: false)",
        "            }",
        "            hideInHistory(input: true)",
        '            windowElementStatus(windowElementStatusInput: { label: "metadata.labels.status", statusMetadataKey: "status_field", statusInputFieldType: recordVerifiedStatusTypeField }) {',
        "              ...windowElementStatus",
        "            }",
        "            info: panels {",
      ].join("\n"),
    );
    expect(work).toContain(
      [
        '            customQueryFilters(input: "GetSubjectsInWorkFilters")',
        "            addEntitiesToForms(input: true)",
        "            actionsOnResult {",
        "              type(input: NoResult)",
        "              options(",
        "                input: [",
        "                  {",
        "                    icon: PlusCircle",
        '                    label: "bulk-operations.create-person"',
        '                    value: "addRelation"',
        "                    primary: true",
        "                    actionContext: {",
        "                      entitiesSelectionType: noneSelected",
        '                      labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"',
        "                    }",
        "                    bulkOperationModal: {",
        "                      typeModal: DynamicForm",
        '                      formQueries: ["GetBasicWorkCreateForm"]',
        '                      formRelationType: "refSubjects"',
        "                      askForCloseConfirmation: true",
        "                      neededPermission: cancreate",
        "                    }",
        "                  }",
        "                ]",
        "              ) {",
        "                icon",
        "                label",
        "                value",
        "                primary",
        "                can",
        "                actionContext {",
        "                  entitiesSelectionType",
        "                  activeViewMode",
        "                  matchMetadataValue {",
        "                    matchKey",
        "                    matchValue",
        "                  }",
        "                  labelForTooltip",
        "                  requiresSameType",
        "                  minSelectedItems",
        "                  maxSelectedItems",
        "                }",
        "                bulkOperationModal {",
        "                  ...bulkOperationModal",
        "                }",
        "                subOptions {",
        "                  ...subOptions",
        "                }",
        "              }",
        "            }",
        "          }",
      ].join("\n"),
    );
    // the map feature fields after the card, before the base spread
    expect(work).toContain(
      [
        "    mapElement {",
        "      mapFeatureMetadata {",
        "        status_field: metaData {",
        '          label(input: "metadata.labels.status")',
        '          key(input: "status_field")',
        "        }",
        "        refAuthors: metaData {",
        '          label(input: "metadata.labels.main-author")',
        '          key(input: "refAuthors")',
        "        }",
        "      }",
        "    }",
        "    ...minimalBaseEntity",
      ].join("\n"),
    );
  });

  it("renders a single media element, a map element with an object config value and a media list's crop key", async () => {
    const tip = await fixture("validation-and-options.ui.ttl");
    expect(tip).toContain(
      [
        "          singleMediaFileElement {",
        '            label(input: "element-labels.media-element")',
        "            isCollapsed(input: false)",
        "          }",
        "          mapElement {",
        '            label(input: "element-labels.map-element")',
        "            isCollapsed(input: false)",
        "            type(input: wktMap)",
        '            center(input: "gps_coordinates")',
        "            wkt: metaData {",
        '              key(input: "map_location")',
        "            }",
        '            config(input: [{ key: "overlayWkt", value: { query: "GetTipSitesWkt", entityType: "site" } }]) {',
        "              key",
        "              value",
        "            }",
        "          }",
        "          mediafiles: entityListElement {",
      ].join("\n"),
    );
    expect(tip).toContain('            relationType: label(input: "refMediafiles")\n            cropMediafileCoordinatesKey(input: "coordinates")\n');
    // enum config values of the map view mode render bare
    expect(tip).toContain('{ key: "mapType", value: wktMap }');
    expect(tip).toContain('{ key: "mapView", value: satellite }');
    expect(tip).toContain('{ key: "mapMode", value: points }');
    expect(tip).toContain('{ key: "useFilters", value: false }');
  });

  it("places a panel's list element at its sh:order position among the fields", async () => {
    const ttl = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . @prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .
ui:TipUi a elody:EntityUi ; elody:graphqlType "Tip" ; elody:emit "file" ;
  sh:property [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ] , [ sh:path em:note ; sh:order 2 ; elody:labelKey "metadata.labels.note" ] ;
  elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "w" ; elody:panel ui:P ] ] ] .
ui:P a elody:Panel ; elody:alias "p" ; rdfs:label "p" ; elody:field em:title , em:note ;
  elody:element [ a elody:ListElement ; sh:order 2 ; elody:alias "Media" ; elody:collapsed false ; elody:entityTypes "media" ; elody:relationType "hasMedia" ] .`;
    const { entities, warnings } = await readUiDeclaration(ttl);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const tip = renderEntityFile(entities[0], "x");
    const title = tip.indexOf("title: metaData {", tip.indexOf("p: panels {"));
    const media = tip.indexOf("Media: entityListElement {");
    const note = tip.indexOf("note: metaData {", tip.indexOf("p: panels {"));
    expect(title).toBeGreaterThan(-1);
    expect(media).toBeGreaterThan(title);
    expect(note).toBeGreaterThan(media);
  });

  it("extracts the media, map and crop constructs back", () => {
    const files = [
      {
        path: "queries/entities/area.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const area = gql\`
  fragment minimalArea on Area {
    intialValues { id: keyValue(key: "id", source: root) name: keyValue(key: "name", source: metadata) }
    allowedViewModes { viewModes(input: [{ viewMode: ViewModesList } { viewMode: ViewModesMap config: [{ key: "mapType", value: wktMap } { key: "mapView", value: satellite } { key: "useFilters", value: false }] }]) { ...viewModes } }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    mapElement { mapFeatureMetadata { id: metaData { label(input: "metadata.labels.id") key(input: "id") } name: metaData { label(input: "metadata.labels.name") key(input: "name") } } }
    ...minimalBaseEntity
  }
  fragment fullArea on Area {
    intialValues { id: keyValue(key: "id", source: root) name: keyValue(key: "name", source: metadata) }
    entityView { column { size(size: fifty) elements {
      singleMediaFileElement { label(input: "element-labels.media-element") isCollapsed(input: false) }
      mapElement { label(input: "element-labels.map-element") isCollapsed(input: false) type(input: wktMap) center(input: "gps_coordinates") wkt: metaData { key(input: "map_location") }
        config(input: [{ key: "overlayWkt" value: { query: "GetAreaRefSitesWkt" entityType: "site" } }]) { key value } }
      mediafiles: entityListElement { label(input: "element-labels.media-element") isCollapsed(input: false) type(input: media) entityTypes(input: [mediafile]) relationType: label(input: "refMediafiles") cropMediafileCoordinatesKey(input: "coordinates") customQuery(input: "GetMediafilesInEntity") }
      windowElement { label(input: "w") p: panels { panelHeaderContent(panelHeaderContentInput: { label: "p" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: true)
        name: metaData { label(input: "metadata.labels.name") key(input: "name") }
        Media: entityListElement { label(input: "element-labels.media-element") isCollapsed(input: false) entityTypes(input: [media]) relationType: label(input: "hasMedia") }
        id: metaData { label(input: "metadata.labels.id") key(input: "id") } } }
    } } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("not rendered"))).toEqual([]);
    expect(ttl).toContain("elody:mapFeatureField em:id , em:name ;");
    expect(ttl).toMatch(/\[ a elody:SingleMediaFileElement ;\n\s+rdfs:label "element-labels.media-element" ;\n\s+sh:order 1 ;\n\s+elody:collapsed false \]/);
    expect(ttl).toMatch(/elody:mapType elody:WktMap ;\n\s+elody:center "gps_coordinates" ;\n\s+elody:wktKey "map_location" ;\n\s+elody:config \[ elody:key "overlayWkt" ; elody:value \[ elody:config \[ elody:key "query" ; elody:value "GetAreaRefSitesWkt" \] , \[ elody:key "entityType" ; elody:value "site" \] \] \] \]/);
    expect(ttl).toMatch(/elody:cropCoordinatesKey "coordinates" [;\]]/);
    expect(ttl).toContain('elody:viewMode\n    [ sh:order 1 ; elody:mode elody:ListView ] ,\n    [ sh:order 2 ; elody:mode elody:MapView ; elody:config [ elody:key "mapType" ; elody:value elody:WktMap ] , [ elody:key "mapView" ; elody:value elody:SatelliteView ] , [ elody:key "useFilters" ; elody:value false ] ]');
    expect(ttl).toMatch(/\[ a elody:ListElement ;\n\s+rdfs:label "element-labels.media-element" ;\n\s+sh:order 2 ;\n\s+elody:alias "Media"/);
  });
});
