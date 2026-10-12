/**
 * G-019: a type's other card (a listing fragment under the client's own name), the signed-in user read
 * as a type, and the orphan documents of a type: an entities, filters, custom bulk operations or sort
 * options document nothing in the GraphQL references but the PWA uses.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("other cards and orphan documents", () => {
  it("conforms and renders the orphan-documents fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "orphan-documents.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const preview = entities.find((e) => e.documentName === "MediafileAsPreview")!;
    expect(preview.cardName).toBe("mediafileAsPreview");
    const previewFile = renderEntityFile(preview, "x");
    expect(previewFile).toContain("fragment mediafileAsPreview on MediaFileEntity {");
    expect(previewFile).not.toContain("minimalMediafileAsPreview");
    const user = renderEntityFile(entities.find((e) => e.graphqlType === "User")!, "x");
    expect(user).toMatch(/query getElodyUser \{\n\s+getElodyUser \{\n\s+\.\.\.minimalUser\n\s+\}\n\s+\}/);
    const comment = renderEntityFile(entities.find((e) => e.graphqlType === "Comment")!, "x");
    expect(comment).toContain("query GetCommentsPage(");
    expect(comment).toContain("query GetAdvancedFiltersForMyCommentsPage($entityType: String!)");
    expect(comment).not.toContain("query GetAdvancedFiltersForMyCommentsPage(\n");
    expect(comment).toContain("query GetBulkOperationsForSubComments {");
    expect(comment).toMatch(/match_exact: false\n\s+resolveDefaultValueToOptionIds: true\n/);
    expect(comment).toMatch(/hidden\(value: true\)\n\s+doNotOverrideDefaultValue\(value: true\)\n/);
    expect(comment).toMatch(/query GetSortOptionsForComments\(\$entityType: String!\) \{\n\s+EntityTypeSortOptions\(entityType: \$entityType\) \{\n\s+sortOptions \{\n\s+options\(\n\s+input: \[\n\s+\{\n\s+icon: NoIcon\n\s+label: "comments.last-activity"\n\s+value: "properties.last_activity_at.value"\n\s+primary: true\n\s+\}\n\s+\{\n\s+icon: NoIcon\n\s+label: "metadata.labels.status"\n\s+value: "properties.status.value"\n\s+\}\n\s+\]\n\s+\) \{\n\s+icon\n\s+label\n\s+value\n/);
  });

  it("extracts them back", () => {
    const files = [
      {
        path: "queries/entities/mediafile.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const mediafile = gql\`
  fragment minimalMediafile on MediaFileEntity {
    intialValues { filename: keyValue(key: "filename", source: root) }
    teaserMetadata { filename: metaData { label(input: "metadata.labels.filename") key(input: "filename") } }
    ...minimalBaseEntity
  }
  fragment mediafileAsPreview on MediaFileEntity {
    ...minimalBaseEntity
    intialValues { id original_filename: keyValue(key: "original_filename", source: root) mimetype: keyValue(key: "mimetype", source: root) }
    teaserMetadata { original_filename: metaData { label(input: "metadata.labels.filename") key(input: "original_filename") } }
    allowedViewModes { viewModes(input: [{ viewMode: ViewModesList }]) { ...viewModes } }
  }
\`;\n`,
      },
      {
        path: "queries/entities/user.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const user = gql\`
  fragment minimalUser on User {
    intialValues { email: keyValue(key: "email", source: metadata) }
    teaserMetadata { email: metaData { label(input: "metadata.labels.email") key(input: "email") } }
    ...minimalBaseEntity
  }
  query getElodyUser { getElodyUser { ...minimalUser } }
\`;\n`,
      },
      {
        path: "queries/entities/comment.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const comment = gql\`
  fragment minimalComment on Comment {
    intialValues { body: keyValue(key: "body", source: metadata) }
    teaserMetadata { body: metaData { label(input: "metadata.labels.body") key(input: "body") } }
    ...minimalBaseEntity
  }
  query GetSortOptionsForComments($entityType: String!) {
    EntityTypeSortOptions(entityType: $entityType) { sortOptions { options(input: [{ icon: NoIcon label: "comments.last-activity" value: "properties.last_activity_at.value" primary: true } { icon: NoIcon label: "metadata.labels.status" value: "properties.status.value" }]) { icon label value } } }
  }
  query GetCommentsPage($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) {
      count limit results { id uuid type ... on Comment { ...minimalComment } }
    }
  }
  query GetAdvancedFiltersForMyCommentsPage($entityType: String!) {
    EntityTypeFilters(type: $entityType) { advancedFilters { type: advancedFilter(type: selection, key: "type") { type key defaultValue(value: ["comment"]) hidden(value: true) } } }
  }
  query GetBulkOperationsForSubComments {
    CustomBulkOperations { bulkOperationOptions { options(input: [{ icon: Create label: "bulk-operations.add-new-relation" value: "addRelation" primary: true actionContext: { entitiesSelectionType: noneSelected labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected" } bulkOperationModal: { typeModal: DynamicForm formQueries: ["GetCommentCreateForm"] formRelationType: "ref_sub_comment" askForCloseConfirmation: true neededPermission: canupdate } }]) { icon label value primary actionContext { entitiesSelectionType labelForTooltip } bulkOperationModal { typeModal formQueries formRelationType askForCloseConfirmation neededPermission } } } }
  }
  query GetTokenSecret($id: String!) { Entity(id: $id, type: "token", collection: tokens) { id } }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("does not parse"))).toEqual(["comment.queries.ts: nothing references the query GetTokenSecret and it has no term; it stays hand-written"]);
    expect(ttl).toContain('elody:documentName "MediafileAsPreview" ;\n  elody:emit "file" ;\n  elody:cardName "mediafileAsPreview" ;');
    expect(ttl).toContain('elody:documents "currentUser" ;');
    expect(ttl).toContain('elody:listQuery ui:GetCommentsPage , ui:GetAdvancedFiltersForMyCommentsPage ;');
    expect(ttl).toContain('elody:customBulkOperations ui:GetBulkOperationsForSubComments ;');
    expect(ttl).toContain('elody:sortDocument [ elody:queryName "GetSortOptionsForComments" ;\n    elody:sortOption [ sh:order 1 ; elody:icon "NoIcon" ; elody:labelKey "comments.last-activity" ; elody:value "properties.last_activity_at.value" ; elody:primary true ] , [ sh:order 2 ; elody:icon "NoIcon" ; elody:labelKey "metadata.labels.status" ; elody:value "properties.status.value" ]');
    expect(ttl).toContain('ui:GetAdvancedFiltersForMyCommentsPage\n  a elody:ListQuery ;\n  elody:filtersQuery "GetAdvancedFiltersForMyCommentsPage" ;');
    expect(ttl).not.toContain('elody:queryName "GetAdvancedFiltersForMyCommentsPage"');
  });
});
