/**
 * Ontology 0.3.0: what hand-written client documents do that the first
 * declarations did not. A property read under another alias (title:
 * keyValue(key: "email")), a field read on the detail page only, sort options
 * with a label and an order of their own, relationValues and the bulk
 * operations fragment only when the type needs or declares them, a type
 * without view modes, and selection filters with a parent key, a tooltip or
 * an empty default list.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { migrateDeclaration } from "../src/migrate.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;

const label = `[ sh:path em:email ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.email" ]`;

const entity = (body: string, more = "") => `${prefixes}
ui:UserUi a elody:EntityUi ; elody:graphqlType "User" ; elody:emit "file" ;
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

describe("elody:alias on a property shape", () => {
  it("reads the value under the alias, the key unchanged", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:id ; sh:order 2 ; elody:alias "slug" ; elody:source elody:RootSource ; elody:teaser false ]`),
    );
    expect(fragment(file, "minimalUser")).toContain('slug: keyValue(key: "id", source: root)');
  });

  it("lets several property shapes share one sh:path under different aliases", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:email ; sh:order 2 ; elody:alias "title" ; elody:detailOnly true ] ;
        elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:WindowElement ; sh:order 1 ; elody:panel ui:Info ] ] ]`,
        `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "panel" ; elody:field em:email .`),
    );
    const full = fragment(file, "fullUser");
    expect(full).toContain('email: keyValue(key: "email", source: metadata)');
    expect(full).toContain('title: keyValue(key: "email", source: metadata)');
    // the panel shows the field once, under its key and with the labelled shape's label
    expect(full.match(/email: metaData/g)).toHaveLength(1);
    expect(full).toContain('label(input: "metadata.labels.email")');
  });

  it("uses the alias on the card too: the card reads the initial value under it", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:id ; sh:order 2 ; elody:alias "slug" ; elody:labelKey "metadata.labels.slug" ]`));
    expect(fragment(file, "minimalUser")).toContain('slug: metaData {\n        label(input: "metadata.labels.slug")\n        key(input: "slug")');
  });
});

describe("elody:detailOnly", () => {
  it("keeps the field out of the listing fragment's initial values and off the card", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:first_name ; sh:order 2 ; elody:labelKey "metadata.labels.firstName" ; elody:detailOnly true ] ;
        elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:WindowElement ; sh:order 1 ; elody:panel ui:Info ] ] ]`,
        `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "panel" ; elody:field em:first_name .`),
    );
    expect(fragment(file, "minimalUser")).not.toContain("first_name");
    expect(fragment(file, "fullUser")).toContain('first_name: keyValue(key: "first_name", source: metadata)');
  });
});

describe("relationValues", () => {
  it("is not read by default", async () => {
    expect(await render(entity(`sh:property ${label}`))).not.toContain("relationValues");
  });

  const detail = `elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:WindowElement ; sh:order 1 ; elody:panel ui:Info ] ] ]`;
  const info = `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "panel" ; elody:field em:email .`;

  it("is read on the detail page (a relation or not), not in the listing", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:tenant ; sh:order 2 ; sh:class em:Tenant ; elody:teaser false ] ; ${detail}`, info));
    expect(fragment(file, "fullUser")).toContain("    relationValues\n");
    expect(fragment(file, "minimalUser")).not.toContain("relationValues");
  });

  it("is read on the detail page when there is a context menu, not in the listing", async () => {
    const file = await render(entity(`sh:property ${label} ; elody:contextMenu [ elody:includeBasicActions true ] ; ${detail}`, info));
    expect(fragment(file, "fullUser")).toContain("    relationValues\n");
    expect(fragment(file, "minimalUser")).not.toContain("relationValues");
  });

  it("is read when a panel lists related entities", async () => {
    const file = await render(
      entity(`sh:property ${label} ;
        elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "list" ; elody:entityTypes "asset" ; elody:relationType "hasAsset" ] ] ]`),
    );
    expect(fragment(file, "fullUser")).toContain("    relationValues\n");
    // the card does not need it: the list is on the detail page
    expect(fragment(file, "minimalUser")).not.toContain("relationValues");
  });

  it("follows an explicit elody:relationValues", async () => {
    expect(await render(entity(`elody:relationValues true ; sh:property ${label}`))).toContain("    relationValues\n");
    const off = await render(entity(`elody:relationValues false ; sh:property ${label} , [ sh:path em:tenant ; sh:order 2 ; sh:class em:Tenant ; elody:teaser false ]`));
    expect(off).not.toContain("relationValues");
  });
});

describe("the bulk operations fragment", () => {
  it("is not emitted by default", async () => {
    expect(await render(entity(`sh:property ${label}`))).not.toContain("BulkOperations");
  });

  it("is emitted, empty, with elody:bulkOperations true", async () => {
    const file = await render(entity(`elody:bulkOperations true ; sh:property ${label}`));
    expect(fragment(file, "userBulkOperations")).toContain("options(input: []) {");
  });

  it("is emitted when an operation is declared or the document is asked for", async () => {
    const declared = await render(
      entity(`sh:property ${label} ; elody:bulkOperation [ rdfs:label "bulk-operations.edit" ; sh:order 1 ; elody:operationKind elody:EditOperation ]`),
    );
    expect(fragment(declared, "userBulkOperations")).toContain('value: "edit"');
    const asked = await render(entity(`elody:documents "bulkOperations" ; sh:property ${label}`));
    expect(fragment(asked, "userBulkOperations")).toContain("options(input: []) {");
    expect(asked).toContain("query GetUserBulkOperations(");
  });

  it("is suppressed with elody:bulkOperations false", async () => {
    const file = await render(entity(`elody:bulkOperations false ; elody:documents "bulkOperations" ; sh:property ${label}`));
    expect(file).not.toContain("BulkOperations");
  });
});

describe("a type without view modes", () => {
  it("has no allowedViewModes block and still validates", async () => {
    const ttl = entity(`sh:property ${label}`);
    expect(await render(ttl)).not.toContain("allowedViewModes");
    const report = await validateDeclaration(ttl);
    expect(report.issues.map(formatIssue)).toEqual([]);
  });
});

describe("selection filters", () => {
  it("render the parent key, the tooltip and an empty default list", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter
        [ sh:order 1 ; elody:alias "relation" ; elody:key "isTenantFor" ; elody:parentFilterKey "relations" ; dash:hidden true ;
          elody:defaultValueAsList true ; elody:showTooltip true ; elody:filterKind elody:SelectionFilter ; elody:keyAsList false ]`),
    );
    expect(fragment(file, "filtersForUser")).toContain(
      [
        '      relation: advancedFilter(type: selection, parentKey: "relations", key: "isTenantFor") {',
        "        type",
        "        parentKey",
        "        key",
        "        tooltip(value: true)",
        "        defaultValue(value: [])",
        "        hidden(value: true)",
        "      }",
      ].join("\n"),
    );
  });

  it("validate: a hidden filter with an empty default list conforms", async () => {
    const report = await validateDeclaration(
      entity(`sh:property ${label} ; elody:filter
        [ sh:order 1 ; elody:alias "relation" ; elody:key "isTenantFor" ; dash:hidden true ; elody:defaultValueAsList true ; elody:filterKind elody:SelectionFilter ]`),
    );
    expect(report.issues.map(formatIssue)).toEqual([]);
  });
});

describe("sort options of their own", () => {
  it("take elody:sortLabelKey and elody:sortOrder", async () => {
    const file = await render(
      entity(`sh:property
        [ sh:path em:email ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.email" ; elody:sortable true ; elody:sortLabelKey "metadata.labels.user.email" ; elody:sortOrder 2 ] ,
        [ sh:path em:name ; sh:order 2 ; elody:labelKey "metadata.labels.user.name" ; elody:sortable true ; elody:sortOrder 1 ; elody:detailOnly true ]`),
    );
    const sort = fragment(file, "userSortOptions");
    expect(sort.indexOf('label: "metadata.labels.user.name"')).toBeLessThan(sort.indexOf('label: "metadata.labels.user.email"'));
    expect(sort).toContain('label: "metadata.labels.user.email"\n            value: "email"');
  });
});

describe("migrate", () => {
  it("makes the old always-on defaults explicit so a legacy declaration renders the same", () => {
    const legacy = readFileSync(join(__dirname, "fixtures", "dishacled", "dishacled.legacy.ui.ttl"), "utf-8");
    const { ttl } = migrateDeclaration(legacy);
    expect(ttl.match(/elody:relationValues true/g)).toHaveLength(3);
    expect(ttl.match(/elody:bulkOperations true/g)).toHaveLength(3);
  });
});

describe("the 0.3.0 fixture of elody-ontology", () => {
  it("conforms here too", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "aliases-and-defaults.ui.ttl"), "utf-8");
    const report = await validateDeclaration(fixture);
    expect(report.issues.map(formatIssue)).toEqual([]);
  });
});
