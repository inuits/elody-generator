/**
 * G-029 leftovers: a lookup on a filter's option search, a filter's matcher labels, and a list
 * element's deep relations.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("option lookups, matcher labels and deep relations", () => {
  it("renders them", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "field-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toContain('lookup: { from: "secondary_entities_actual", local_field: "properties.ref_support.value", foreign_field: "id", as: "lookup.virtual_relations.ref_support" }');
    expect(out).toMatch(/matcherLabels: \[\{ matcher: AnyMatcher, label: "metadata.labels.yes" \}, \{ matcher: NoneMatcher, label: "metadata.labels.no" \}\]/);
    expect(out).toMatch(/matcherLabels \{\n\s+matcher\n\s+label\n\s+\}/);
    expect(out).toMatch(/advancedFilterInputForRetrievingOptions \{[^]*?lookup \{\n\s+from\n\s+local_field\n\s+foreign_field\n\s+as\n\s+\}/);
    expect(out).toMatch(/fetchDeepRelations \{\n\s+deepRelationsFetchStrategy\(input: useMethodsAndFetch\)\n\s+entityTypes\(input: \[work_serial, work_map\]\)\n\s+routeConfig\(input: \[\{ relation: "relationValues.refWork.key", key: \["vlacc:1\|identifiers"\], entityType: \[work_serial, work_map\] \}\]\) \{\n\s+relation\n\s+key\n\s+entityType\n\s+overviewPage\n\s+\}\n\s+amountOfRecursions\(input: 2\)\n\s+\}/);
  });

  it("extracts them", () => {
    const files = [
      {
        path: "queries/entities/work.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment minimalWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    entityView { column { size(size: seventy) elements {
      Works: entityListElement { label(input: "element-labels.works") isCollapsed(input: false) entityTypes(input: [work]) relationType: label(input: "refWork") searchInputType(input: "AdvancedInputType")
        fetchDeepRelations { deepRelationsFetchStrategy(input: useMethodsAndFetch) entityTypes(input: [work_serial]) routeConfig(input: [{ relation: "relationValues.refWork.key" key: ["vlacc:1|identifiers"] entityType: [work_serial] }]) { relation key entityType overviewPage } amountOfRecursions(input: 2) } }
    } } }
  }
  fragment filtersForWork on Work {
    advancedFilters {
      ref_support: advancedFilter(type: selection matchersType: selectionForRelation key: ["aicap:1|properties.ref_support.value"] label: "metadata.labels.support" matcherLabels: [{ matcher: AnyMatcher, label: "metadata.labels.yes" }] filterOptionsMapping: { label: "intialValues.name" }
        advancedFilterInputForRetrievingOptions: [{ lookup: { from: "secondary_entities_actual" local_field: "properties.ref_support.value" foreign_field: "id" as: "lookup.virtual_relations.ref_support" } type: text key: ["aicap:1|properties.name.value"] value: "*" distinct_by: "properties.name.value" } { type: type, value: "support" }]) {
        type matchersType key label matcherLabels { matcher label } filterOptionsMapping { label value } advancedFilterInputForRetrievingOptions { type key value distinct_by lookup { from local_field foreign_field as } } }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term/.test(n))).toEqual([]);
    expect(ttl).toContain('    elody:matcherLabel [ sh:order 1 ; elody:matcher "AnyMatcher" ; elody:labelKey "metadata.labels.yes" ] ;');
    expect(ttl).toContain('    elody:optionsLookup [ elody:lookupFrom "secondary_entities_actual" ; elody:lookupLocalField "properties.ref_support.value" ; elody:lookupForeignField "id" ; elody:lookupAs "lookup.virtual_relations.ref_support" ] ;');
    expect(ttl).toMatch(/elody:fetchDeepRelations \[ elody:strategy "useMethodsAndFetch" ; elody:entityTypes "work_serial" ; elody:recursions 2 ; elody:deepRoute \[ sh:order 1 ; elody:relation "relationValues.refWork.key" ; elody:keys \( "vlacc:1\|identifiers" \) ; elody:entityTypes "work_serial" \] \] ;/);
  });
});
