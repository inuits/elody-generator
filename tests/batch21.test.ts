/**
 * G-020 (remainder): a file of shared fragments alone (values, panel fields and filters other
 * types spread), a card twin with a menu and a card-only field, and a menu fragment spread on a
 * result's card next to its listing fragment.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile, renderListQuery } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("shared fragments of their own", () => {
  it("conforms and renders the shared-fragments fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "shared-fragments.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const shared = entities.find((e) => e.fragmentsOnly)!;
    expect(shared.filePath).toBe("queries/entities/vlaccFragments.queries.ts");
    const file = renderEntityFile(shared, "x");
    // nothing of its own: no listing fragment, no documents
    expect(file).not.toContain("fragment minimalEntity");
    expect(file).not.toContain("query Get");
    expect(file).toContain('  fragment entityAuditIntialValues on IntialValues {\n    created_at: keyValue(key: "audit.created.at", source: root)\n    created_by: keyValue(key: "audit.created.by", source: root, formatter: "link|user")\n  }');
    expect(file).toContain('  fragment entityAuditTeaserMetadata on teaserMetadata {\n    created_at: metaData {\n      label(input: "metadata.labels.created-at")\n      key(input: "created_at")\n      unit(input: DATETIME_DEFAULT)\n    }');
    expect(file).toContain('  fragment entityAuditMetadata on WindowElementPanel {\n    created_at: metaData {\n      label(input: "metadata.labels.created-at")\n      key(input: "created_at")\n      unit(input: DATETIME_DEFAULT)\n    }\n    created_by: metaData {\n      label(input: "metadata.labels.created-by")\n      key(input: "created_by")\n    }\n  }');
    // a plain values field, a menu fragment spread in the card's menu, two type pills referenced by alias
    expect(file).toContain('relationKey: "refRelatedWorks")\n    lockedProperties\n  }');
    expect(file).toContain("      contextMenu {\n        ...basicContextMenuActions\n        ...linkAndDeleteEntityContextMenuActions\n      }");
    expect(file).toContain('  fragment typePillsIntialValues on IntialValues {\n    typePillParent: keyValue(key: "type", source: typePillLabel, index: 0, formatter: "pill")\n    typePillSub: keyValue(key: "type", source: typePillLabel, index: 1, formatter: "pill|auto")\n  }');
    expect(file).toContain('  fragment typePillsTeaserMetadata on teaserMetadata {\n    typePillSub: metaData {\n      label(input: "metadata.labels.sub-type")\n      key(input: "typePillSub")\n    }\n  }');
    expect(file).toContain('  fragment entityAuditFilters on AdvancedFilters {\n    created_at: advancedFilter(\n      type: date\n      key: ["vlacc:1|audit.created.at"]');
    expect(file).not.toContain("on AdvancedFilters {\n    advancedFilters {");
    // the card twin: a card-only field, a relation field edited on the card, and the menu after the fields
    expect(file).toContain('  fragment relatedWorksIntialValues on IntialValues {\n    relation: keyValue(key: "relation", source: relationMetadata, uuid: $userUuid, relationKey: "refRelatedWorks")\n    lockedProperties\n  }');
    expect(file).toMatch(/fragment relatedWorksTeaserMetadata on teaserMetadata \{\n    original_headtitle: metaData \{\n      label\(input: "metadata.labels.original-title"\)\n      key\(input: "original_headtitle"\)\n      colSpan\(input: "2"\)\n    \}\n    relation: relationMetaData \{[\s\S]*?inputField\(type: workRelationTypeField\)[\s\S]*?\n    buttons \{\n      contextMenu \{\n        \.\.\.basicContextMenuActions\n        \.\.\.linkAndDeleteEntityContextMenuActions\n      \}\n    \}\n  \}/);
    // the result's card menu next to its listing fragment
    const work = entities.find((e) => e.graphqlType === "Work")!;
    const list = renderEntityFile(work, "x");
    expect(list).toContain("        ... on ManifestationSerial {\n          ...minimalManifestationSerial\n          teaserMetadata {\n            buttons {\n              contextMenu {\n                ...linkAndDeleteEntityContextMenuActions\n              }\n            }\n          }\n        }");
  });

  it("extracts a shared file, a card twin's extras and a result's card menu back", () => {
    const files = [
      {
        path: "queries/entities/vlaccFragments.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const vlaccFragments = gql\`
  fragment entityAuditIntialValues on IntialValues {
    created_at: keyValue(key: "audit.created.at", source: root)
    created_by: keyValue(key: "audit.created.by", source: root, formatter: "link|user")
  }
  fragment entityAuditMetadata on WindowElementPanel {
    created_at: metaData { label(input: "metadata.labels.created-at") key(input: "created_at") unit(input: DATETIME_DEFAULT) }
    created_by: metaData { label(input: "metadata.labels.created-by") key(input: "created_by") }
  }
  fragment entityAuditFilters on AdvancedFilters {
    created_at: advancedFilter(type: date key: ["vlacc:1|audit.created.at"] label: "metadata.labels.created-at" showTimeForDateFilter: true isDisplayedByDefault: true) { type key label showTimeForDateFilter isDisplayedByDefault tooltip(value: true) }
    created_by: advancedFilter(type: selection key: ["vlacc:1|audit.created.by"] label: "metadata.labels.created-by" selectionOption: autocomplete isDisplayedByDefault: true filterOptionsMapping: { label: "intialValues.name" }
      advancedFilterInputForRetrievingOptions: [{ type: text key: ["vlacc:1|audit.created.by"] value: "*" match_exact: false } { type: selection key: "type" value: [asset, institution] } { type: type value: user }]) { ...advancedFilter }
  }
\`;\n`,
      },
      {
        path: "queries/entities/work.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment minimalWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment relatedWorksIntialValues on IntialValues {
    relation: keyValue(key: "relation", source: relationMetadata, uuid: $userUuid, relationKey: "refRelatedWorks")
    hidden_note: keyValue(key: "hidden_note", source: metadata)
  }
  fragment relatedWorksTeaserMetadata on teaserMetadata {
    original_headtitle: metaData { label(input: "metadata.labels.original-title") key(input: "original_headtitle") colSpan(input: "2") }
    relation: relationMetaData { label(input: "metadata.labels.work-work-relation-type") key(input: "relation") colSpan(input: "2") inputField(type: workRelationTypeField) { ...inputfield } __typename }
    buttons { contextMenu { ...basicContextMenuActions } }
  }
  fragment fullWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    entityView { column { elements { manifestations: entityListElement { label(input: "l") isCollapsed(input: false) entityTypes(input: [manifestation]) customQuery(input: "GetManifestationsInWork") } } } }
  }
  query GetManifestationsInWork($type: Entitytyping!, $limit: Int, $skip: Int, $searchValue: SearchFilter!, $advancedSearchValue: [FilterInput], $advancedFilterInputs: [AdvancedFilterInput!]!, $searchInputType: SearchInputType) {
    Entities(type: $type, limit: $limit, skip: $skip, searchValue: $searchValue, advancedSearchValue: $advancedSearchValue, advancedFilterInputs: $advancedFilterInputs, searchInputType: $searchInputType) {
      count limit
      results { id uuid type ... on ManifestationSerial { ...minimalManifestationSerial teaserMetadata { buttons { contextMenu { ...linkAndDeleteEntityContextMenuActions } } } } }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("does not parse") || n.includes("stays hand-written"))).toEqual([]);
    expect(ttl).toContain('ui:vlaccFragmentsUi\n  a elody:EntityUi ;\n  elody:graphqlType "Entity" ;\n  elody:documentName "vlaccFragments" ;\n  elody:emit "file" ;\n  elody:fragmentsOnly true ;\n  elody:filePath "queries/entities/vlaccFragments.queries.ts" ;');
    expect(ttl).toContain('elody:valuesFragment\n    [ elody:fragmentName "entityAuditIntialValues" ; elody:fieldAlias "created_at" , "created_by" ] ;');
    expect(ttl).toContain('elody:panelFragment\n    [ elody:fragmentName "entityAuditMetadata" ; elody:field em:created_at , em:created_by ] ;');
    expect(ttl).toMatch(/elody:filtersFragment\n    \[ elody:fragmentName "entityAuditFilters" ;\n    elody:filter\n\s+\[ rdfs:label "metadata.labels.created-at" ;/);
    expect(ttl).toMatch(/elody:valuesFragment\n    \[ elody:fragmentName "relatedWorksIntialValues" ; elody:cardFragmentName "relatedWorksTeaserMetadata" ; elody:field em:relation , em:hidden_note , em:original_headtitle ; elody:cardShows "relation" , "original_headtitle" ;\n    elody:contextMenu\n\s+\[ elody:includeBasicActions true ;\n\s+elody:menuInButtons true \] \] ;/);
    expect(ttl).toContain('elody:cardMenuSpread "linkAndDeleteEntityContextMenuActions"');
    expect(ttl).toContain('elody:optionsInput [ sh:order 1 ; elody:inputKind elody:SelectionFilter ; elody:key "type" ; elody:value ( "asset" "institution" ) ; elody:bareValues true ] ;');
    expect(ttl).toContain("elody:optionsTypeBare true ;");
  });
});
