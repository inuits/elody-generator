/**
 * G-001: the app's platform document — the constants the client carries, the type-wide documents
 * derived from the declared types (fullEntity, getEntities, getTenants, getEntityById,
 * getAdvancedFilters, GetSortOptions, GetBulkOperations, getPreviewComponents, FetchMediafilesOfEntity),
 * and the settings they vary by.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the platform document", () => {
  it("conforms and renders the app fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "app.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const app = entities.find((e) => e.app)!;
    expect(app.app?.documents).toContain("getEntities");
    const out = renderEntityFile(app, "x", entities);
    expect(out).toContain("export const fixtureQueries = gql`");
    expect(out).toMatch(/fragment fullEntity on Entity \{\n\s+id\n\s+uuid\n\s+type\n\s+\.\.\. on Pipeline \{\n\s+\.\.\.fullPipeline\n\s+\}\n\s+\}/);
    expect(out).toMatch(/results \{\n\s+id\n\s+uuid\n\s+type\n\s+\.\.\. on Pipeline \{\n\s+\.\.\.minimalPipeline\n\s+\}\n\s+\.\.\. on Tenant \{\n\s+\.\.\.minimalTenantCard\n\s+\}\n\s+\.\.\. on Job \{\n\s+\.\.\.minimalJob\n\s+\}/);
    expect(out).toMatch(/query getTenants \{[\s\S]*?\.\.\. on Tenant \{\n\s+\.\.\.minimalTenant/);
    expect(out).toMatch(/query getEntityById\(\$id: String!, \$type: String!\) \{\n\s+Entity\(id: \$id, type: \$type\) \{\n\s+intialValues \{\n\s+canUpdate\n\s+canDelete\n\s+\}\n\s+\.\.\.fullEntity/);
    expect(out).toMatch(/getAdvancedFilters\(\$entityType: String!\) \{\n\s+EntityTypeFilters\(type: \$entityType\) \{\n\s+\.\.\. on Pipeline \{\n\s+\.\.\.filtersForPipeline/);
    expect(out).toContain("$skipItemsWithRelationDuringBulkDelete: [String!]");
    expect(out).toMatch(/GetSortOptions\(\$entityType: String!\) \{\n\s+EntityTypeSortOptions\(entityType: \$entityType\) \{\n\s+\.\.\. on BaseEntity \{\n\s+sortOptions \{\n\s+options\(\n\s+input: \[\n\s+\{\n\s+icon: NoIcon\n\s+label: "metadata.labels.title"\n\s+value: "title"\n\s+\}\n\s+\]/);
    expect(out).not.toContain("pipelineSortOptions");
    expect(out).toMatch(/GetBulkOperations\(\$entityType: String!\) \{\n\s+BulkOperations\(entityType: \$entityType\) \{\n\s+\.\.\. on BaseEntity \{\n\s+bulkOperationOptions \{[\s\S]*?label: "bulk-operations.export-to-csv"[\s\S]*?\.\.\. on Pipeline \{\n\s+\.\.\.pipelineBulkOperations/);
    expect(out).toContain('options(input: [{ icon: ListOl, label: "20", value: 20 }, { icon: ListOl, label: "50", value: 50 }, { icon: ListOl, label: "100", value: 100 }])');
    expect(out).toContain('options(input: [{ icon: NoIcon, label: "navigation.media", value: "media" }])');
    expect(out).toMatch(/getPreviewComponents\(\$entityType: String!\) \{\n\s+PreviewComponents\(entityType: \$entityType\) \{\n\s+\.\.\. on Pipeline \{\n\s+\.\.\.previewForPipeline/);
    expect(out).toMatch(/FetchMediafilesOfEntity\(entityIds: \$entityIds\) \{\n\s+__typename\n\s+\}/);
    expect(out).toMatch(/query getFilterMatcherMapping \{\n\s+FilterMatcherMapping\(keys: \["text", "date", "number", "selection", "boolean", "type"\]\) \{\n\s+key\n\s+matchers/);
    expect(out).toMatch(/options \{\n\s+icon\n\s+label\n\s+value\n\s+required\n\s+\}/);
  });

  it("extracts the platform file as the app", () => {
    const files = [
      {
        path: "queries/entities/pipeline.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const pipeline = gql\`
  fragment minimalPipeline on Pipeline {
    intialValues { name: keyValue(key: "name", source: metadata) }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    ...minimalBaseEntity
  }
\`;\n`,
      },
      {
        path: "queries/fixture.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const fixtureQueries = gql\`
  fragment fullEntity on Entity { id uuid type ... on Pipeline { ...fullPipeline } }
  query getEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on Pipeline { ...minimalPipeline } } }
  }
  query getEntityById($id: String!, $type: String!) { Entity(id: $id, type: $type) { intialValues { canUpdate canDelete } ...fullEntity } }
  query getUserPermissions { UserPermissions { payload } }
  mutation bulkDeleteEntities($ids: [String!]!, $path: Collection!, $deleteEntities: DeleteEntitiesInput, $skipItemsWithRelationDuringBulkDelete: [String!]) {
    bulkDeleteEntities(ids: $ids, path: $path, deleteEntities: $deleteEntities, skipItemsWithRelationDuringBulkDelete: $skipItemsWithRelationDuringBulkDelete)
  }
  query GetPaginationLimitOptions { PaginationLimitOptions { options(input: [{ icon: ListOl, label: "25", value: 25 }, { icon: ListOl, label: "50", value: 50 }]) { icon label value } } }
  query GetDropzoneEntityToCreate { DropzoneEntityToCreate { options(input: [{ icon: NoIcon, label: "navigation.asset", value: "asset" }]) { icon label value } } }
  query GetSortOptions($entityType: String!) { EntityTypeSortOptions(entityType: $entityType) { ... on BaseEntity { sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title" }]) { icon label value } } } } }
  query GetBulkOperations($entityType: String!) { BulkOperations(entityType: $entityType) { ... on BaseEntity { bulkOperationOptions { options(input: [{ icon: Edit, label: "bulk-operations.edit", value: "edit" }]) { icon label value } } } } }
  query GetFilterMatcherMapping { FilterMatcherMapping(keys: ["text", "date"]) { key matchers } }
  query GetCommentsPage($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on Pipeline { ...minimalPipeline } } }
  }
  query GetMenu($name: String!) { Menu(name: $name) { menu { name } } }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.some((n) => n.includes("nothing references the query GetMenu"))).toBe(false);
    expect(ttl).toContain('ui:fixtureApp\n  a elody:App ;\n  elody:documentName "fixture" ;\n  elody:filePath "queries/fixture.queries.ts" ;\n  elody:platformDocument "fullEntity" , "getEntities" , "getEntityById" , "getUserPermissions" , "bulkDeleteEntities" , "GetPaginationLimitOptions" , "GetDropzoneEntityToCreate" , "GetSortOptions" , "GetBulkOperations" , "GetFilterMatcherMapping" , "GetMenu" ;\n  elody:paginationLimit ( 25 50 ) ;\n  elody:dropzoneOption [ sh:order 1 ; elody:icon "NoIcon" ; elody:labelKey "navigation.asset" ; elody:value "asset" ] ;\n  elody:bulkDeleteSkipsRelated true ;\n  elody:readsPermissions true ;\n  elody:filterMatcherQueryName "GetFilterMatcherMapping" ;\n  elody:filterMatcherKeys ( "text" "date" ) ;\n  elody:sortOption [ sh:order 1 ; elody:icon "NoIcon" ; elody:labelKey "metadata.labels.title" ; elody:value "title" ] ;');
    expect(ttl).toContain("elody:listQuery ui:GetCommentsPage ;");
    expect(ttl).toMatch(/elody:bulkOperation\n\s+\[ rdfs:label "bulk-operations.edit" ;/);
  });
});
