/**
 * Gap batch 2 (podiumnet slice 2): what the detail and listing documents of
 * maintained clients do beyond the first declarations. relationValues read in
 * the detail fragment only, an initial value with an index, the card
 * thumbnail, a panel in several columns, a window element with an alias, a
 * column without a size, the form tab alias and an optional showsFormErrors,
 * a bulk modal without askForCloseConfirmation, hidden text filters with a
 * default, and sort values under the alias.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { normalizeDefinition } from "../src/compare.js";
import { migrateDeclaration } from "../src/migrate.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";
import { parse } from "graphql";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;

const label = `[ sh:path em:name ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.name" ]`;
const window = (panel: string, extra = "") =>
  `elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "info" ; ${extra} elody:panel ${panel} ] ] ]`;
const info = (extra = "") => `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "panel" ; elody:panelKind elody:MetadataPanel ; ${extra} elody:field em:name .`;

const entity = (body: string, more = "") => `${prefixes}
ui:ThingUi a elody:EntityUi ; elody:graphqlType "Thing" ; elody:emit "file" ;
  ${body} .
${more}`;

async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((warning) => warning.message)).toEqual([]);
  return renderEntityFile(entities[0], "src/ui/test.ui.ttl");
}

const fragment = (file: string, name: string): string => {
  const start = file.indexOf(`  fragment ${name} `);
  if (start === -1) return "";
  const end = file.indexOf("\n  }\n", start);
  return file.slice(start, end + 4);
};
const query = (file: string, name: string): string => {
  const start = file.indexOf(`  query ${name}`);
  if (start === -1) return "";
  const end = file.indexOf("\n  }\n", start);
  return file.slice(start, end + 4);
};

describe("relationValues per fragment", () => {
  it("is read in the detail fragment, not in the listing", async () => {
    const file = await render(
      entity(`sh:property ${label} ;
        elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "list" ; elody:entityTypes "asset" ; elody:relationType "hasAsset" ] ] ]`),
    );
    expect(fragment(file, "minimalThing")).not.toContain("relationValues");
    expect(fragment(file, "fullThing")).toContain("    relationValues\n");
  });

  it("is never derived for the listing: clients' cards do without, even with relations on them", async () => {
    const menu = await render(entity(`sh:property ${label} ; elody:contextMenu [ elody:includeBasicActions true ]`));
    expect(fragment(menu, "minimalThing")).not.toContain("relationValues");
    const relation = await render(entity(`sh:property ${label} , [ sh:path em:owner ; sh:order 2 ; sh:class em:Person ; elody:teaser false ]`));
    expect(fragment(relation, "minimalThing")).not.toContain("relationValues");
    const detailRelation = await render(
      entity(`sh:property ${label} , [ sh:path em:owner ; sh:order 2 ; sh:class em:Person ; elody:detailOnly true ] ; ${window("ui:Info")}`, info()),
    );
    expect(fragment(detailRelation, "minimalThing")).not.toContain("relationValues");
    expect(fragment(detailRelation, "fullThing")).toContain("    relationValues\n");
  });

  it("an explicit elody:relationValues true reads it in both", async () => {
    const file = await render(entity(`elody:relationValues true ; sh:property ${label} ; ${window("ui:Info")}`, info()));
    expect(fragment(file, "minimalThing")).toContain("    relationValues\n");
    expect(fragment(file, "fullThing")).toContain("    relationValues\n");
  });
});

describe("initial values", () => {
  it("render elody:index after the source", async () => {
    const file = await render(
      entity(
        `sh:property ${label} , [ sh:path em:type ; sh:order 2 ; elody:alias "typePillLabel" ; elody:source elody:TypePillLabelSource ; elody:index 0 ; shui:viewer elody:PillViewer ; elody:viewerArgument "auto" ; elody:detailOnly true ] ; ${window("ui:Info")}`,
        info(),
      ),
    );
    expect(fragment(file, "fullThing")).toContain('typePillLabel: keyValue(key: "type", source: typePillLabel, index: 0, formatter: "pill|auto")');
    expect(fragment(file, "minimalThing")).not.toContain("typePillLabel");
  });
});

describe("formatters on the detail page", () => {
  it("are read by default, not when elody:detailFormatters is false", async () => {
    const status = `[ sh:path em:status ; sh:order 2 ; shui:viewer elody:PillViewer ; elody:labelKey "metadata.labels.status" ]`;
    const kept = await render(entity(`sh:property ${label} , ${status} ; ${window("ui:Info")}`, info()));
    expect(fragment(kept, "fullThing")).toContain('status: keyValue(key: "status", source: metadata, formatter: "pill")');
    const raw = await render(entity(`elody:detailFormatters false ; sh:property ${label} , ${status} ; ${window("ui:Info")}`, info()));
    expect(fragment(raw, "fullThing")).toContain('status: keyValue(key: "status", source: metadata)\n');
    expect(fragment(raw, "minimalThing")).toContain('formatter: "pill"');
  });
});

describe("the card", () => {
  it("reads the thumbnail first, from an initial value or the primary media file", async () => {
    const fromValue = await render(entity(`elody:thumbnail [ elody:key "thumbnail" ] ; sh:property ${label}`));
    expect(fragment(fromValue, "minimalThing")).toContain('    teaserMetadata {\n      thumbnail {\n        key(input: "thumbnail")\n      }\n      name: metaData {');
    const fromMediafile = await render(entity(`elody:thumbnail [ elody:fromMediafile true ] ; sh:property ${label}`));
    expect(fragment(fromMediafile, "minimalThing")).toContain("      thumbnail {\n        filename(fromMediafile: true)\n      }\n");
  });

  it("keys a teaser field under the alias it is read by", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:original_filename ; sh:order 2 ; elody:alias "title" ; elody:labelKey "metadata.labels.filename" ]`));
    expect(fragment(file, "minimalThing")).toContain('title: metaData {\n        label(input: "metadata.labels.filename")\n        key(input: "title")');
  });

  it("sorts under the alias", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:original_filename ; sh:order 2 ; elody:alias "title" ; elody:labelKey "metadata.labels.filename" ; elody:sortable true ]`),
    );
    expect(fragment(file, "thingSortOptions")).toContain('label: "metadata.labels.filename"\n            value: "title"');
  });
});

describe("the detail page", () => {
  it("lays a panel out in several columns and names a window element", async () => {
    const file = await render(entity(`sh:property ${label} ; ${window("ui:Info", 'elody:alias "audit" ;')}`, info("elody:multipleColumns true ;")));
    const full = fragment(file, "fullThing");
    expect(full).toContain("audit: windowElement {");
    expect(full).toContain("isEditable(input: true)\n              canBeMultipleColumns(input: true)\n");
  });

  it("leaves the size out of a column that declares none", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "info" ; elody:panel ui:Info ] ] ]`, info()),
    );
    const full = fragment(file, "fullThing");
    expect(full).not.toContain("size(size:");
    expect(full).toContain("      column {\n        elements {");
  });
});

describe("forms and bulk operations", () => {
  const form = (submitExtra = "", formExtra = "") => `ui:Create a elody:Form ; rdfs:label "create" ; elody:queryName "GetThingCreateForm" ; ${formExtra}
    elody:shape [ sh:property [ sh:path em:name ; sh:name "Name"@en ; sh:order 1 ; sh:datatype xsd:string ; sh:maxCount 1 ] ] ;
    elody:submit [ rdfs:label "actions.labels.create" ; elody:actionQuery "CreateEntity" ; elody:creationType "thing" ; elody:icon "Create" ${submitExtra} ] .`;

  it("names the form tab after elody:alias, default name, and shows form errors only when asked", async () => {
    const plain = await render(entity(`sh:property ${label} ; elody:form ui:Create`, form()));
    expect(query(plain, "GetThingCreateForm")).toContain("      name: formTab {");
    expect(query(plain, "GetThingCreateForm")).not.toContain("showsFormErrors");
    const named = await render(entity(`sh:property ${label} ; elody:form ui:Create`, form("; elody:showsFormErrors true", 'elody:alias "thing" ;')));
    expect(query(named, "GetThingCreateForm")).toContain("      thing: formTab {");
    expect(query(named, "GetThingCreateForm")).toContain('creationType(input: thing)\n            showsFormErrors(input: true)');
  });

  it("emits askForCloseConfirmation only when the modal declares it", async () => {
    const operation = (modalExtra: string) =>
      `sh:property ${label} ; elody:bulkOperation [ rdfs:label "bulk-operations.csv" ; sh:order 1 ; elody:operationKind elody:ExportCsvOperation ; elody:modal [ elody:modalKind elody:BulkOperationsModal ${modalExtra} ] ]`;
    const silent = await render(entity(operation("")));
    expect(fragment(silent, "thingBulkOperations")).toMatch(/bulkOperationModal: \{\s*typeModal: BulkOperations\s*\}/);
    expect(fragment(silent, "thingBulkOperations")).not.toContain("askForCloseConfirmation");
    const asked = await render(entity(operation("; elody:closeConfirmation false")));
    expect(fragment(asked, "thingBulkOperations")).toContain("askForCloseConfirmation: false");
  });

  it("migrate makes showsFormErrors explicit on a legacy form, and again on an already migrated one", () => {
    const legacy = readFileSync(join(__dirname, "fixtures", "dishacled", "dishacled.legacy.ui.ttl"), "utf-8");
    const once = migrateDeclaration(legacy).ttl;
    expect(once.match(/elody:showsFormErrors true/g)?.length).toBeGreaterThan(0);
    // a declaration migrated before the term existed: the form is already an elody:Form node
    const stripped = once.replace(/ ;\n\s*elody:showsFormErrors true(?=\s*\])/g, "").replace(/\s*elody:showsFormErrors true ;/g, "");
    expect(stripped).not.toContain("showsFormErrors");
    const twice = migrateDeclaration(stripped).ttl;
    expect(twice.match(/elody:showsFormErrors true/g)?.length).toBe(once.match(/elody:showsFormErrors true/g)?.length);
  });
});

describe("filters", () => {
  it("render a hidden text filter with its default", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ sh:order 1 ; elody:alias "technical_origin" ; elody:key "elody:1|technical_origin" ; dash:hidden true ; sh:defaultValue "original" ; elody:filterKind elody:TextFilter ]`),
    );
    expect(fragment(file, "filtersForThing")).toContain(
      ['      technical_origin: advancedFilter(', "        type: text", '        key: ["elody:1|technical_origin"]', "      ) {", "        type", "        key", '        defaultValue(value: "original")', "        hidden(value: true)", "      }"].join("\n"),
    );
  });
});

describe("compare", () => {
  it("ignores an alias equal to the field name", () => {
    const aliased = parse("fragment a on A { thumbnail: thumbnail { key(input: \"t\") } }").definitions[0] as Parameters<typeof normalizeDefinition>[0];
    const plain = parse("fragment a on A { thumbnail { key(input: \"t\") } }").definitions[0] as Parameters<typeof normalizeDefinition>[0];
    expect(normalizeDefinition(aliased)).toBe(normalizeDefinition(plain));
  });
});

describe("the 0.3.0 fixture", () => {
  it("still conforms with the batch-2 terms", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "aliases-and-defaults.ui.ttl"), "utf-8");
    const report = await validateDeclaration(fixture);
    expect(report.issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const user = entities.find((entity) => entity.graphqlType === "User")!;
    expect(renderEntityFile(user, "x")).toContain("filename(fromMediafile: true)");
  });
});
