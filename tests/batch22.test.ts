/**
 * G-013 (remainder): what a filter and its option search may still say — several keys, item types
 * and a label key on the search, item types on a relation filter, matchers on a text filter, a
 * typed boolean default, a lookup resolving to source ids, value mappings, and facets.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("filter extras", () => {
  it("conforms and renders the filter-extras fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "filter-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const arms = renderEntityFile(entities[0], "x");
    expect(arms).toMatch(/key: \["vlacc:1\|properties.title.value", "vlacc:1\|properties.code.value"\]\n\s+value: "\*"\n\s+metadata_key_as_label: "metadata.title.value"\n\s+item_types: \["arms"\]/);
    expect(arms).toMatch(/match_exact\n\s+metadata_key_as_label\n\s+item_types\n\s+\}/);
    expect(arms).toContain('itemTypes: ["media"]');
    expect(arms).toMatch(/relation: advancedFilter\([\s\S]*?\) \{\n\s+type\n\s+key\n\s+itemTypes\n/);
    expect(arms).toMatch(/defaultMatcher: ExactInputMatcher\n\s+allowedMatchers: \[ExactInputMatcher, ContainsMatcher\]/);
    expect(arms).toMatch(/\n\s+defaultMatcher\n\s+allowedMatchers\n/);
    expect(arms).toContain("defaultValue(value: true)");
    expect(arms).toMatch(/as: "lookup.virtual_relations.ref_related_genres"\n\s+resolve_to_source_ids: true\n\s+\}/);
    expect(arms).toMatch(/\n\s+as\n\s+resolve_to_source_ids\n\s+\}/);
    expect(arms).toMatch(/defaultValueMapping\(value: \[\{ value: \["DG-KQD42TMNG", "DG-UBAM588R0"\], mapping: "jeugd" \}, \{ value: \["DG-34QL78W90"\], mapping: "volwassenen" \}\]\) \{\n\s+value\n\s+mapping\n\s+\}/);
    expect(arms).toContain('defaultValueMapping: [{ value: ["DG-KQD42TMNG"], mapping: "jeugd" }]');
    expect(arms).toContain('facets: [{ type: type, value: "area", facets: [{ lookups: [{ from: "regions_actual", local_field: "properties.ref_region.value", foreign_field: "id", as: "lookup.virtual_relations.ref_region" }], key: "lookup.virtual_relations.ref_region.id" }] }]');
    expect(arms).toMatch(/\n\s+facets \{\n\s+\.\.\.facetFields\n\s+\}/);
  });

  it("extracts them back", () => {
    const files = [
      {
        path: "queries/entities/arms.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const arms = gql\`
  fragment minimalArms on Arms {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment filtersForArms on Arms {
    advancedFilters {
      language: advancedFilter(type: selection key: ["elody:1|relations.hasLanguage.key"] label: "metadata.labels.language" isDisplayedByDefault: true
        advancedFilterInputForRetrievingOptions: [{ type: text key: ["a", "b"] value: "*" metadata_key_as_label: "metadata.title.value" item_types: ["arms"] }]) { type key label isDisplayedByDefault advancedFilterInputForRetrievingOptions { type key value metadata_key_as_label item_types } }
      relation: advancedFilter(type: selection key: ["vliz:1|properties.has_album.value"] itemTypes: ["media"]) { type key itemTypes defaultValue(value: "") hidden(value: true) }
      search_terms: advancedFilter(type: text key: ["cantook:1|search_terms"] label: "metadata.labels.search-terms" isDisplayedByDefault: true defaultMatcher: ExactInputMatcher allowedMatchers: [ExactInputMatcher]) { type key label isDisplayedByDefault defaultMatcher allowedMatchers }
      is_omnibus: advancedFilter(type: text key: ["vlacc:1|properties.is_omnibus.value"]) { type key defaultValue(value: true) hidden(value: true) }
      relation2: advancedFilter(lookup: { from: "entities_actual" local_field: "id" foreign_field: "properties.ref_related_genres.value" as: "lookup.virtual_relations.ref_related_genres" resolve_to_source_ids: true } type: selection key: ["vlacc:1|x"] operator: or) { lookup { from local_field foreign_field as resolve_to_source_ids } type key operator defaultValue(value: []) hidden(value: true) }
      audience_type: advancedFilter(type: selection key: ["vlacc:1|properties.audience_type.value"]
        advancedFilterInputForRetrievingOptions: [{ type: type, value: "genre", operator: and } { type: selection key: ["vlacc:1|properties.audience_type.value"] value: "$entity.x" defaultValueMapping: [{ value: ["DG-1"], mapping: "jeugd" }] match_exact: true operator: and }]) {
        ...advancedFilter hidden(value: true) defaultValue(value: "$entity.x") defaultValueMapping(value: [{ value: ["DG-1", "DG-2"], mapping: "jeugd" }]) { value mapping } }
      ref_region: advancedFilter(type: selection key: ["aicap:1|properties.ref_region.value"] label: "metadata.labels.region" isDisplayedByDefault: true
        advancedFilterInputForRetrievingOptions: [{ type: text key: ["aicap:1|properties.name.value"] value: "*" match_exact: false } { type: type, value: "region" }]
        facets: [{ type: type, value: "area", facets: [{ lookups: [{ from: "regions_actual", local_field: "properties.ref_region.value", foreign_field: "id", as: "lookup.virtual_relations.ref_region" }], key: "lookup.virtual_relations.ref_region.id" }] }]) { type key label isDisplayedByDefault facets { ...facetFields } }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("does not parse"))).toEqual([]);
    expect(ttl).toContain('elody:optionsKeys ( "a" "b" ) ;\n    elody:optionsItemTypes "arms" ;\n    elody:optionsLabelKey "metadata.title.value" ;');
    expect(ttl).toContain('elody:itemTypes "media" ;');
    expect(ttl).toContain('elody:defaultMatcher "ExactInputMatcher" ;\n    elody:allowedMatchers ( "ExactInputMatcher" ) ;');
    expect(ttl).toContain("sh:defaultValue true ;");
    expect(ttl).toContain("elody:lookupResolveToSourceIds true ]");
    expect(ttl).toContain('elody:valueMapping [ sh:order 1 ; elody:value ( "DG-1" "DG-2" ) ; elody:mapping "jeugd" ] ;');
    expect(ttl).toContain('elody:valueMapping [ sh:order 1 ; elody:value ( "DG-1" ) ; elody:mapping "jeugd" ] ]');
    expect(ttl).toContain('elody:facet [ sh:order 1 ; elody:inputKind elody:TypeFilter ; elody:value "area" ; elody:facet [ sh:order 1 ; elody:key "lookup.virtual_relations.ref_region.id" ; elody:lookup [ elody:lookupFrom "regions_actual" ; elody:lookupLocalField "properties.ref_region.value" ; elody:lookupForeignField "id" ; elody:lookupAs "lookup.virtual_relations.ref_region" ] ] ] ;');
  });
});
