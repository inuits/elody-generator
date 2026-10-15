/**
 * G-028: a value read differently per page (the listing labels a relation otherwise, reads it with
 * or without the formatter or the contains filter), a field shown differently per panel (its own
 * label key, alias or widget), the allowed view modes in the detail fragment too, a bulk-data panel
 * and an entity viewer element.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("per-page reads and per-panel fields", () => {
  it("conforms and renders the page-and-panel-overrides fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "page-and-panel-overrides.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const area = renderEntityFile(entities[0], "x");
    const listing = area.slice(area.indexOf("fragment minimalArea"), area.indexOf("fragment fullArea"));
    const detail = area.slice(area.indexOf("fragment fullArea"));
    // the relation labelled otherwise per page, the formatter and the contains filter on one page only
    expect(listing).toContain('refRegion: keyValue(key: "refRegion", source: relations, keyAsLabel: { origin: metadata, key: "name" })');
    expect(detail).toContain('refRegion: keyValue(key: "refRegion", source: relations, formatter: "link|region")');
    expect(listing).toContain('refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "display_filename" })');
    expect(detail).toContain('refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "filename" })');
    expect(listing).toContain('status: keyValue(key: "status", source: metadata, formatter: "pill")');
    expect(detail).toContain('status: keyValue(key: "status", source: metadata)');
    expect(listing).toContain('refAuthors: keyValue(key: "refAuthors", source: relations, keyAsLabel: { origin: metadata, key: "name" }, containsRelationPropertyKey: "main_author", containsRelationPropertyValue: "true")');
    expect(detail).toContain('refAuthors: keyValue(key: "refAuthors", source: relations, keyAsLabel: { origin: metadata, key: "name" })');
    // the view modes on the detail page too
    expect(detail).toContain("    allowedViewModes {");
    // the panels: the first shows vlacc_number plainly without a widget, the second under its own label and alias
    const info = detail.slice(detail.indexOf("info: panels {"), detail.indexOf("ids: panels {"));
    expect(info).toMatch(/vlacc_number: metaData \{\n\s+label\(input: "metadata.labels.vlacc-nr"\)\n\s+key\(input: "vlacc_number"\)\n\s+showOnlyInEditMode\(input: false\)\n\s+readOnly\(input: \["update:area:field:vlacc_number"\]\)\n\s+\}/);
    expect(info).toMatch(/name: metaData \{\n\s+label\(input: "metadata.labels.name"\)\n\s+key\(input: "name"\)\n\s+inputField\(type: baseTextField\)/);
    const ids = detail.slice(detail.indexOf("ids: panels {"), detail.indexOf("technical_metadata: panels {"));
    expect(ids).toMatch(/vlacc_number_system: metaData \{\n\s+label\(input: "metadata.labels.vlacc-number"\)\n\s+key\(input: "vlacc_number"\)\n[\s\S]*?inputField\(type: baseTextField\)/);
    const tech = detail.slice(detail.indexOf("technical_metadata: panels {"));
    expect(tech).toContain("panelType(input: bulkData)");
    expect(tech).toContain('bulkData(bulkDataSource: "technical_metadata")');
    expect(detail).toContain('entityViewerElement {\n            label(input: "Shared entity")\n            entityId(relationType: "hasInstitution")\n          }');
    // the window's own menu and the fragments spread among its panels; a value read for a technical origin
    expect(detail).toMatch(/windowElement \{\n\s+label\(input: "w"\)\n\s+contextMenuActions \{\n\s+refreshData: doCustomAction \{\n\s+action\(input: EndpointCall\)/);
    expect(detail).toMatch(/\.\.\.areaIdsGroupPanel\n\s+\}\n\s+entityViewerElement/);
    expect(detail).toContain('download_url: keyValue(key: "hasMediafile", source: relations, keyAsLabel: { origin: root, key: "original_file_location" }, technicalOrigin: "download")');
  });

  it("extracts the per-page and per-panel differences back", () => {
    const files = [
      {
        path: "queries/entities/area.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const area = gql\`
  fragment minimalArea on Area {
    intialValues {
      name: keyValue(key: "name", source: metadata)
      refRegion: keyValue(key: "refRegion", source: relations, keyAsLabel: { origin: metadata, key: "name" })
      refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "display_filename" })
      status: keyValue(key: "status", source: metadata, formatter: "pill")
      refAuthors: keyValue(key: "refAuthors", source: relations, keyAsLabel: { origin: metadata, key: "name" }, containsRelationPropertyKey: "main_author", containsRelationPropertyValue: "true")
      category: keyValue(key: "hasCategory", source: relations)
    }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    ...minimalBaseEntity
  }
  fragment fullArea on Area {
    intialValues {
      name: keyValue(key: "name", source: metadata)
      refRegion: keyValue(key: "refRegion", source: relations, formatter: "link|region")
      refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "filename" })
      status: keyValue(key: "status", source: metadata)
      refAuthors: keyValue(key: "refAuthors", source: relations, keyAsLabel: { origin: metadata, key: "name" })
      category: keyValue(key: "hasCategory", source: relations, keyAsLabel: { origin: metadata, key: "title" })
      vlacc_number: keyValue(key: "vlacc_number", source: metadata)
      download_url: keyValue(key: "hasMediafile", source: relations, keyAsLabel: { origin: root, key: "original_file_location" }, technicalOrigin: "download")
    }
    allowedViewModes { viewModes(input: [{ viewMode: ViewModesList }]) { ...viewModes } }
    entityView { column { elements {
      windowElement { label(input: "w")
        contextMenuActions { refreshData: doCustomAction { label(input: "contextMenu.refresh-data") action(input: EndpointCall) can(input: ["create:area"]) endpointUrl(input: "api/entities/$id/sync-origins") endpointMethod(input: "POST") icon(input: "Bolt") __typename } }
        ...areaIdsGroupPanel
        info: panels { panelHeaderContent(panelHeaderContentInput: { label: "p" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: true)
          name: metaData { label(input: "metadata.labels.name") key(input: "name") inputField(type: baseTextField) { ...inputfield } }
          vlacc_number: metaData { label(input: "metadata.labels.vlacc-nr") key(input: "vlacc_number") showOnlyInEditMode(input: false) readOnly(input: ["update:area:field:vlacc_number"]) } }
        ids: panels { panelHeaderContent(panelHeaderContentInput: { label: "i" }) { label } panelType(input: metadata) isCollapsed(input: true) isEditable(input: true)
          vlacc_number_system: metaData { label(input: "metadata.labels.vlacc-number") key(input: "vlacc_number") inputField(type: baseTextField) { ...inputfield } } }
        technical_metadata: panels { panelHeaderContent(panelHeaderContentInput: { label: "t" }) { label } panelType(input: bulkData) isEditable(input: false) isCollapsed(input: false) bulkData(bulkDataSource: "technical_metadata") } }
      entityViewerElement { label(input: "Shared entity") entityId(relationType: "hasInstitution") }
    } } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("not rendered") || n.includes("does not parse"))).toEqual([]);
    expect(ttl).toMatch(/elody:valueLabelKey "" ;\s+elody:listingFormatter false ;\s+elody:listingValueLabelKey "name" [;\]]/);
    expect(ttl).toMatch(/elody:valueLabelRootKey "filename" ;\s+elody:listingValueLabelRootKey "display_filename" [;\]]/);
    expect(ttl).toContain("elody:listingFormatter false");
    expect(ttl).toMatch(/elody:detailFormatter false [;\]]/);
    expect(ttl).toMatch(/elody:detailContainsRelation false [;\]]/);
    expect(ttl).toMatch(/elody:valueLabelKey "title" ;\s+elody:listingValueLabelKey "" [;\]]/);
    expect(ttl).not.toContain("elody:detailFormatters false");
    expect(ttl).toContain("elody:viewModesOnDetail true ;");
    expect(ttl).toContain('elody:bulkDataSource "technical_metadata" ;');
    expect(ttl).toMatch(/elody:technicalOrigin "download" [;\]]/);
    expect(ttl).toMatch(/elody:readOnlyUnless "update:area:field:vlacc_number" ;\s+elody:showOnlyInEditMode false [;\]]/);
    expect(ttl).toContain('elody:panelSpread "areaIdsGroupPanel" ;');
    expect(ttl).toMatch(/elody:contextMenu\n\s+\[ elody:action\n\s+\[ sh:order 1 ;\n\s+elody:alias "refreshData" ;\n\s+elody:actionForm "doCustomAction" ;/);
    expect(ttl).toContain('elody:panelField [ elody:field em:vlacc_number ; elody:labelKey "metadata.labels.vlacc-number" ; elody:alias "vlacc_number_system" ; elody:panelWidget true ] ;');
    expect(ttl).toMatch(/\[ a elody:EntityViewerElement ;\n\s+rdfs:label "Shared entity" ;\n\s+sh:order 2 ;\n\s+elody:relationType "hasInstitution" \]/);
  });
});
