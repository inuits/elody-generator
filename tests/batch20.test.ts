/**
 * G-026 (remainder): a value read over the parent's relations (source: parentRelations), a value
 * reached over several parent steps (parentRelations with two entries), and a list query that
 * declares the host's uuid as a nullable variable.
 */
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const ttl = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . @prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .
ui:ReadingUi a elody:EntityUi ; elody:graphqlType "Reading" ; elody:emit "file" ;
  sh:property
    [ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.title" ] ,
    [ sh:path em:refAuthors ; sh:order 2 ; elody:alias "work_refAuthors" ; elody:source elody:ParentRelationsSource ; elody:parentRelationType "refWork" ; elody:labelKey "metadata.labels.work-authors" ; elody:teaser false ] ,
    [ sh:path em:hoofdrubriek ; sh:order 3 ; elody:key "title" ; elody:alias "hoofdrubriek" ; elody:source elody:ParentMetadataSource ; elody:labelKey "metadata.labels.hoofdrubriek" ; elody:teaser false ;
      elody:parentRelation [ sh:order 1 ; elody:parentEntityType "zizo" ; elody:parentKey "vlacc:1|properties.ref_sub_zizos.value" ] ,
                           [ sh:order 2 ; elody:parentEntityType "zizo" ; elody:parentKey "vlacc:1|properties.ref_sub_zizos.value" ] ] ;
  elody:detail [ elody:column [ sh:order 1 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "l" ; elody:alias "refs" ; elody:collapsed false ; elody:entityTypes "externalSigla" ; elody:listQuery ui:GetExternalSiglaRefs ] ] ] .
ui:GetExternalSiglaRefs a elody:ListQuery ; elody:queryName "GetExternalSiglaRefs" ; elody:readsHost true ; elody:hostOptional true ;
  elody:result [ elody:graphqlType "ExternalSigla" ; sh:order 1 ; elody:listing ui:ExternalSiglaInRefsUi ] .
ui:ExternalSiglaInRefsUi a elody:EntityUi ; elody:graphqlType "ExternalSigla" ; elody:documentName "ExternalSiglaInRefs" ; elody:emit "inline" ;
  sh:property [ sh:path em:name ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.name" ] .`;

describe("parent relations and an optional host", () => {
  it("conforms and renders the parent's relations, two parent steps and a nullable host variable", async () => {
    expect((await validateDeclaration(ttl)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(ttl);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const reading = renderEntityFile(entities.find((e) => e.graphqlType === "Reading")!, "x");
    expect(reading).toContain('work_refAuthors: keyValue(key: "refAuthors", source: parentRelations, parentRelations: [{ relationType: "refWork" }])');
    expect(reading).toContain('hoofdrubriek: keyValue(key: "title", source: parentMetadata, parentRelations: [{ entityType: zizo, key: ["vlacc:1|properties.ref_sub_zizos.value"] }, { entityType: zizo, key: ["vlacc:1|properties.ref_sub_zizos.value"] }])');
    expect(reading).toContain("    $userUuid: String\n  ) {");
  });

  it("extracts them back", () => {
    const files = [
      {
        path: "queries/entities/reading.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const reading = gql\`
  fragment minimalReading on Reading {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullReading on Reading {
    intialValues {
      title: keyValue(key: "title", source: metadata)
      work_refAuthors: keyValue(key: "refAuthors", parentRelations: [{ relationType: "refWork" }], source: parentRelations)
      hoofdrubriek: keyValue(key: "title", parentRelations: [{ entityType: zizo, key: ["vlacc:1|properties.ref_sub_zizos.value"] }, { entityType: zizo, key: ["vlacc:1|properties.ref_sub_zizos.value"] }], source: parentMetadata)
    }
    entityView { column { elements { refs: entityListElement { label(input: "l") isCollapsed(input: false) entityTypes(input: [externalSigla]) customQuery(input: "GetExternalSiglaRefs") } } } }
  }
  query GetExternalSiglaRefs($type: Entitytyping!, $limit: Int, $skip: Int, $searchValue: SearchFilter!, $advancedSearchValue: [FilterInput], $advancedFilterInputs: [AdvancedFilterInput!]!, $searchInputType: SearchInputType, $userUuid: String) {
    Entities(type: $type, limit: $limit, skip: $skip, searchValue: $searchValue, advancedSearchValue: $advancedSearchValue, advancedFilterInputs: $advancedFilterInputs, searchInputType: $searchInputType) {
      count limit
      results { id uuid type ... on ExternalSigla { ...minimalBaseEntity intialValues { name: keyValue(key: "name", source: metadata) role: keyValue(key: "role", source: relationMetadata, uuid: $userUuid, relationKey: "hasSigla") } teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } } } }
    }
  }
\`;\n`,
      },
    ];
    const { ttl: out, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("left out") || n.includes("does not parse"))).toEqual([]);
    expect(out).toContain('elody:parentRelationType "refWork" ;');
    expect(out).toContain("elody:source elody:ParentRelationsSource ;");
    expect(out).toMatch(/elody:parentRelation \[ sh:order 1 ; elody:parentEntityType "zizo" ; elody:parentKey "vlacc:1\|properties\.ref_sub_zizos\.value" \] ;\s+elody:parentRelation \[ sh:order 2 ; elody:parentEntityType "zizo" ; elody:parentKey "vlacc:1\|properties\.ref_sub_zizos\.value" \] ;/);
    expect(out).toContain("elody:readsHost true ;\n  elody:hostOptional true ;");
  });
});
