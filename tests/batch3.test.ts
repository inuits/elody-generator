/**
 * Gap batch 3 (vliz): the input field a client registers itself for a
 * property (G-017), hand-written shared fragments spread into a block
 * (G-020), and selection filters that fetch their options from the entities
 * of a type (G-013).
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

const label = `[ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; sh:datatype xsd:string ; sh:maxCount 1 ; sh:minCount 1 ; elody:labelKey "metadata.labels.title" ]`;
const language = `[ sh:path em:language ; sh:order 2 ; sh:class em:Language ; elody:valueLabelKey "title" ; elody:clientInputField "languageTypeField" ; elody:labelKey "metadata.labels.language" ; elody:detailOnly true ]`;
const window = (panel: string) =>
  `elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width70 ; elody:element [ a elody:WindowElement ; sh:order 1 ; rdfs:label "window-element-labels.info-window" ; elody:expandButton true ; elody:panel ${panel} ] ] ]`;
const info = (extra = "", fields = "em:title , em:language") => `ui:Info a elody:Panel ; elody:alias "info" ; rdfs:label "panel-labels.keyword-info" ; elody:panelKind elody:MetadataPanel ; ${extra} elody:field ${fields} .`;

const entity = (body: string, more = "") => `${prefixes}
ui:KeywordUi a elody:EntityUi ; elody:graphqlType "Keyword" ; elody:emit "file" ;
  ${body} .
${more}`;

async function render(ttl: string): Promise<string> {
  const { entities, warnings, inputFields } = await readUiDeclaration(ttl);
  expect(warnings.map((warning) => warning.message)).toEqual([]);
  return renderEntityFile(entities[0], "src/ui/test.ui.ttl") + `\n// inputFields: ${Object.keys(inputFields).join(",")}`;
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

describe("elody:clientInputField", () => {
  it("edits the property with the client's field on the detail page and mints nothing", async () => {
    const file = await render(entity(`sh:property ${label} , ${language} ; ${window("ui:Info")}`, info()));
    const full = fragment(file, "fullKeyword");
    expect(full).toContain('language: keyValue(key: "hasLanguage", source: relations, metadataKeyAsLabel: "title")');
    expect(full).toContain("language: metaData {\n                label(input: \"metadata.labels.language\")\n                key(input: \"language\")\n                inputField(type: languageTypeField) {");
    expect(file.endsWith("// inputFields: ")).toBe(true);
  });

  it("is the create form's field too", async () => {
    const form = `ui:Create a elody:Form ; rdfs:label "navigation.create-keyword" ; elody:queryName "GetKeywordCreateForm" ; elody:alias "keyword" ;
      elody:shape [ sh:property ${label} , [ sh:path em:language ; sh:order 2 ; sh:class em:Language ; elody:clientInputField "languageTypeField" ; elody:labelKey "metadata.labels.language" ] ] ;
      elody:submit [ rdfs:label "actions.labels.create" ; elody:actionQuery "CreateEntity" ; elody:creationType "keyword" ; elody:icon "Create" ] .`;
    const file = await render(entity(`sh:property ${label} ; elody:form ui:Create`, form));
    expect(query(file, "GetKeywordCreateForm")).toContain("inputField(type: languageTypeField) {\n              ...inputfield\n            }");
    expect(file.endsWith("// inputFields: ")).toBe(true);
  });
});

describe("shared fragments spread into a block", () => {
  it("spreads into the listing and detail initial values, the card, the filters and a panel", async () => {
    const file = await render(
      entity(
        `elody:listingValuesSpread "vocabTeaserIntialValues" ; elody:detailValuesSpread "vocabIntialValues" , "entityAuditIntialValues" ; elody:cardSpread "vocabTeaserMetadata" ; elody:filtersSpread "entityAuditFilters" ;
         sh:property ${label} ; ${window("ui:Info")} ;
         elody:filter [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "keyword" ; elody:filterKind elody:TypeFilter ]`,
        info('elody:spread "vocabInfoMetadata" ;', "em:title"),
      ),
    );
    expect(fragment(file, "minimalKeyword")).toContain("    intialValues {\n      ...vocabTeaserIntialValues\n      title: keyValue(");
    expect(fragment(file, "minimalKeyword")).toContain("    teaserMetadata {\n      ...vocabTeaserMetadata\n      title: metaData {");
    expect(fragment(file, "fullKeyword")).toContain("    intialValues {\n      ...vocabIntialValues\n      ...entityAuditIntialValues\n      title: keyValue(");
    expect(fragment(file, "fullKeyword")).toContain("              }\n              ...vocabInfoMetadata\n            }");
    expect(fragment(file, "filtersForKeyword")).toContain("    advancedFilters {\n      ...entityAuditFilters\n      type: advancedFilter(type: type) {");
  });
});

describe("listing-only and unread fields", () => {
  it("reads a listing-only field in the listing fragment only, and an unread field nowhere", async () => {
    const file = await render(
      entity(
        `elody:detailValuesSpread "vocabIntialValues" ; sh:property ${label} ,
         [ sh:path em:thumbnail ; sh:order 2 ; elody:source elody:RootSource ; elody:listingOnly true ; elody:teaser false ] ,
         [ sh:path em:prefLabel ; sh:order 3 ; elody:labelKey "metadata.labels.pref-label" ; elody:readsValue false ; elody:detailOnly true ] ; ${window("ui:Info")}`,
        info("", "em:title , em:prefLabel"),
      ),
    );
    expect(fragment(file, "minimalKeyword")).toContain('thumbnail: keyValue(key: "thumbnail", source: root)');
    expect(fragment(file, "fullKeyword")).not.toContain("thumbnail");
    expect(fragment(file, "fullKeyword")).not.toContain("prefLabel: keyValue");
    expect(fragment(file, "fullKeyword")).toContain("prefLabel: metaData {");
  });
});

describe("form fields and filters with an alias of their own", () => {
  it("names a form field by elody:alias and keeps the key", async () => {
    const form = `ui:Create a elody:Form ; rdfs:label "create" ; elody:queryName "GetKeywordCreateForm" ;
      elody:shape [ sh:property [ sh:path em:person ; sh:order 1 ; elody:alias "owner" ; elody:clientInputField "ownerTypeField" ; elody:labelKey "metadata.labels.owner" ] ] ;
      elody:submit [ rdfs:label "actions.labels.create" ; elody:actionQuery "CreateEntity" ; elody:creationType "keyword" ; elody:icon "Create" ] .`;
    const file = await render(entity(`sh:property ${label} ; elody:form ui:Create`, form));
    expect(query(file, "GetKeywordCreateForm")).toContain('owner: metaData {\n            label(input: "metadata.labels.owner")\n            key(input: "person")');
  });

  it("renders parentKey on a text filter", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ rdfs:label "metadata.labels.title" ; sh:order 1 ; elody:alias "title" ; elody:parentFilterKey "metadata" ; elody:key "title" ; elody:displayedByDefault true ; elody:filterKind elody:TextFilter ]`),
    );
    expect(fragment(file, "filtersForKeyword")).toContain('        type: text\n        parentKey: "metadata"\n        key: ["title"]');
    expect(fragment(file, "filtersForKeyword")).toContain("        type\n        parentKey\n        key\n");
  });
});

describe("vliz: relations without a label key, string filter keys, media lists", () => {
  it("reads a relation without metadataKeyAsLabel when elody:valueLabelKey is empty", async () => {
    const file = await render(entity(`sh:property ${label} , [ sh:path em:mediafile ; sh:order 2 ; elody:relationType "hasMediafile" ; elody:valueLabelKey "" ; elody:teaser false ]`));
    expect(fragment(file, "minimalKeyword")).toContain('mediafile: keyValue(key: "hasMediafile", source: relations)\n');
  });

  it("keeps a text filter's key a string when elody:keyAsList is false", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ rdfs:label "metadata.labels.title" ; sh:order 1 ; elody:alias "title" ; elody:key "title" ; elody:keyAsList false ; elody:displayedByDefault true ; elody:filterKind elody:TextFilter ]`),
    );
    expect(fragment(file, "filtersForKeyword")).toContain('        key: "title"\n');
  });

  it("renders a media list with its kind and the relation its document is scoped by", async () => {
    const file = await render(
      entity(
        `sh:property ${label} ; elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width70 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "element-labels.mediafiles-element" ; elody:alias "Mediafiles" ; elody:mediaKind elody:MediaKindMedia ; elody:collapsed false ; elody:entityTypes "mediafile" ; elody:relationType "hasMediafile" ; elody:customQuery "GetMediafilesInVliz" ; elody:customQueryRelationType "isMediafileFor" ; elody:customQueryFilters "GetMediafilesInEntityFilters" ] ] ]`,
      ),
    );
    const full = fragment(file, "fullKeyword");
    expect(full).toContain('label(input: "element-labels.mediafiles-element")\n            type(input: media)\n            isCollapsed(input: false)');
    expect(full).toContain('customQuery(input: "GetMediafilesInVliz")\n            customQueryRelationType: label(input: "isMediafileFor")\n            customQueryFilters(input: "GetMediafilesInEntityFilters")');
  });

  it("reads relationValues on the detail page when a detail spread may bring relations", async () => {
    const file = await render(entity(`elody:detailValuesSpread "vocabIntialValues" ; sh:property ${label} ; ${window("ui:Info")}`, info("", "em:title")));
    expect(fragment(file, "fullKeyword")).toContain("    relationValues\n");
  });

  it("shows a panel field under the property's alias with its key", async () => {
    const file = await render(
      entity(`sh:property ${label} , [ sh:path em:base_url ; sh:order 2 ; elody:alias "baseUrl" ; elody:readsValue false ; elody:labelKey "metadata.labels.base-url" ; elody:detailOnly true ] ; ${window("ui:Info")}`, info("", "em:base_url")),
    );
    expect(fragment(file, "fullKeyword")).toContain('baseUrl: metaData {\n                label(input: "metadata.labels.base-url")\n                key(input: "base_url")');
  });
});

describe("a selection filter that fetches its options", () => {
  it("renders the option search and asks the inputs back", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter
        [ rdfs:label "metadata.labels.language" ; sh:order 1 ; elody:alias "language" ; elody:key "vliz:1|properties.has_language.value" ; elody:displayedByDefault true ;
          elody:optionsType "language" ; elody:optionsKey "vliz:1|properties.title.value" ; elody:optionsMatchExact false ; elody:filterKind elody:SelectionFilter ; elody:showTooltip true ]`),
    );
    expect(fragment(file, "filtersForKeyword")).toContain(
      [
        "      language: advancedFilter(",
        "        type: selection",
        '        key: ["vliz:1|properties.has_language.value"]',
        '        label: "metadata.labels.language"',
        "        isDisplayedByDefault: true",
        "        advancedFilterInputForRetrievingOptions: [",
        "          {",
        "            type: text",
        '            key: ["vliz:1|properties.title.value"]',
        '            value: "*"',
        "            match_exact: false",
        "          }",
        '          { type: type, value: "language" }',
        "        ]",
        "      ) {",
        "        type",
        "        key",
        "        label",
        "        isDisplayedByDefault",
        "        advancedFilterInputForRetrievingOptions {",
        "          type",
        "          value",
        "          key",
        "          match_exact",
        "        }",
        "        tooltip(value: true)",
        "      }",
      ].join("\n"),
    );
  });

  it("leaves match_exact out of the option search when not declared", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter
        [ rdfs:label "metadata.labels.access" ; sh:order 1 ; elody:alias "access" ; elody:key "dams:1|metadata.access.value" ; elody:displayedByDefault true ;
          elody:optionsType "asset" ; elody:optionsKey "dams:1|metadata.access.value" ; elody:optionsDistinctBy "metadata.access.value" ; elody:filterKind elody:SelectionFilter ]`),
    );
    const filters = fragment(file, "filtersForKeyword");
    expect(filters).toContain('            distinct_by: "metadata.access.value"\n          }');
    expect(filters).not.toContain("match_exact: ");
    expect(filters).toContain("          match_exact\n");
  });

  it("places the thumbnail among the card's fields by sh:order", async () => {
    const file = await render(entity(`elody:thumbnail [ elody:key "thumbnail" ; sh:order 1 ] ; sh:property ${label} , [ sh:path em:mimetype ; sh:order 2 ; elody:labelKey "metadata.labels.mimetype" ]`));
    expect(fragment(file, "minimalKeyword")).toContain('title: metaData {\n        label(input: "metadata.labels.title")\n        key(input: "title")\n      }\n      thumbnail {\n        key(input: "thumbnail")\n      }\n      mimetype: metaData');
  });

  it("renders distinct_by and match_exact when declared", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter
        [ rdfs:label "metadata.labels.status" ; sh:order 1 ; elody:alias "status" ; elody:key "dams:1|metadata.status.value" ; elody:displayedByDefault true ;
          elody:optionsType "asset" ; elody:optionsKey "dams:1|metadata.status.value" ; elody:optionsDistinctBy "metadata.status.value" ; elody:optionsMatchExact true ; elody:filterKind elody:SelectionFilter ]`),
    );
    const filters = fragment(file, "filtersForKeyword");
    expect(filters).toContain('            value: "*"\n            distinct_by: "metadata.status.value"\n            match_exact: true');
    expect(filters).toContain("          type\n          key\n          value\n          distinct_by\n          match_exact\n        }");
  });
});

describe("digipolis: option mappings, selection options, operators, sort options of the type only", () => {
  it("renders filterOptionsMapping, selectionOption and operator on a selection filter", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter
        [ rdfs:label "metadata.labels.access" ; sh:order 1 ; elody:alias "access" ; elody:key "dams:1|metadata.access.value" ; elody:displayedByDefault true ;
          elody:optionsLabel "intialValues.access" ; elody:optionsValue "intialValues.access" ; elody:selectionOption "autocomplete" ; elody:filterOperator "or" ;
          elody:optionsType "asset" ; elody:optionsKey "dams:1|metadata.access.value" ; elody:optionsDistinctBy "metadata.access.value" ; elody:filterKind elody:SelectionFilter ; elody:showTooltip true ]`),
    );
    const filters = fragment(file, "filtersForKeyword");
    expect(filters).toContain('        operator: or\n');
    expect(filters).toContain('        selectionOption: autocomplete\n');
    expect(filters).toContain('        filterOptionsMapping: {\n          label: "intialValues.access"\n          value: "intialValues.access"\n        }');
    expect(filters).toContain("        filterOptionsMapping {\n          label\n          value\n        }");
    expect(filters).toContain("        operator\n        label\n        selectionOption\n");
  });

  it("renders operator on a scoping selection filter", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ sh:order 1 ; elody:alias "relation" ; elody:key "dams:1|relations.isAssetFor.key" ; elody:filterOperator "or" ; dash:hidden true ; sh:defaultValue "$entity.id" ; elody:filterKind elody:SelectionFilter ]`),
    );
    expect(fragment(file, "filtersForKeyword")).toContain('relation: advancedFilter(type: selection, key: ["dams:1|relations.isAssetFor.key"], operator: or) {\n        type\n        key\n        operator\n');
  });

  it("renders showTimeForDateFilter on a date filter", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:filter [ rdfs:label "metadata.labels.created-at" ; sh:order 1 ; elody:alias "created_at" ; elody:key "vlacc:1|audit.created.at" ; elody:showTime true ; elody:displayedByDefault true ; elody:filterKind elody:DateFilter ; elody:showTooltip true ]`),
    );
    expect(fragment(file, "filtersForKeyword")).toContain("        showTimeForDateFilter: true\n        isDisplayedByDefault: true");
    expect(fragment(file, "filtersForKeyword")).toContain("        showTimeForDateFilter\n        isDisplayedByDefault\n");
  });

  it("excludes the platform's sort options when declared", async () => {
    const file = await render(entity(`elody:excludeBaseSortOptions true ; sh:property [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ; elody:sortable true ]`));
    expect(fragment(file, "keywordSortOptions")).toContain("        ]\n        excludeBaseSortOptions: true\n      ) {");
  });

  it("declares a picker without results: only its filters document is generated", async () => {
    const file = await render(
      entity(`sh:property ${label} ; elody:picker ui:GetAssetsPicker`, `ui:GetAssetsPicker a elody:Picker ; elody:queryName "GetAssetsPicker" ; elody:filter [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "asset" ; elody:filterKind elody:TypeFilter ] .`),
    );
    expect(query(file, "GetAssetsPicker(")).toBe("");
    expect(query(file, "GetAssetsPickerFilters")).toContain('defaultValue(value: "asset")');
  });

  it("reads relationValues on the detail page by default, not when elody:relationValues is false", async () => {
    const plain = await render(entity(`sh:property ${label} ; ${window("ui:Info")}`, info("", "em:title")));
    expect(fragment(plain, "fullKeyword")).toContain("    relationValues\n");
    const off = await render(entity(`elody:relationValues false ; sh:property ${label} ; ${window("ui:Info")}`, info("", "em:title")));
    expect(fragment(off, "fullKeyword")).not.toContain("relationValues");
  });
});

describe("the 0.3.0 fixture", () => {
  it("conforms with the batch-3 terms and renders them", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "aliases-and-defaults.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, inputFields } = await readUiDeclaration(fixture);
    const user = renderEntityFile(entities.find((entity) => entity.graphqlType === "User")!, "x");
    expect(user).toContain("...vocabTeaserIntialValues");
    expect(user).toContain("inputField(type: languageTypeField)");
    expect(user).toContain("advancedFilterInputForRetrievingOptions");
    expect(Object.keys(inputFields)).not.toContain("userLanguageField");
  });
});
