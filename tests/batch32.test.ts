/**
 * G-012, the client's dialect continued: an app that opens bulk operation modals with formQuery
 * (singular), the BulkOperationInputModal of baseGraphql before formQueries
 * (elody:bulkModalFormQueryLegacy), and a bulk operations fragment under the client's own casing
 * (elody:bulkFragmentName).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the client's bulk modal dialect", () => {
  it("renders formQuery (singular) and the client's own bulk fragment name", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "legacy-dialect.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const mediafile = entities.find((e) => e.graphqlType === "MediaFileEntity")!;
    expect(mediafile.bulkModalFormQueryLegacy).toBe(true);
    const out = renderEntityFile(mediafile, "x", entities);
    expect(out).toContain("fragment mediafileBulkOperations on MediaFileEntity {");
    expect(out).toMatch(/bulkOperationModal: \{\n\s+typeModal: DynamicForm\n\s+formQuery: "GetMediafileCreateForm"\n\s+askForCloseConfirmation: true\n\s+neededPermission: cancreate\n/);
    expect(out).not.toContain("formQueries");
    // the platform's GetBulkOperations spreads the fragment under its declared name
    const app = renderEntityFile(entities.find((e) => e.app)!, "x", entities);
    expect(app).toMatch(/query GetBulkOperations\(\$entityType: String!\) \{[^]*\.\.\.mediafileBulkOperations/);
  });

  it("extracts the client's casing of the bulk fragment and the legacy modal form", () => {
    const files = [
      {
        path: "queries/entities/mediafile.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const mediafile = gql\`
  fragment minimalMediaFile on MediaFileEntity {
    intialValues { title: keyValue(key: "original_filename", source: root) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.filename") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment mediafileBulkOperations on MediaFileEntity {
    bulkOperationOptions {
      options(input: [{ icon: Create label: "bulk-operations.create-mediafile" value: "createEntity" primary: true
        actionContext: { activeViewMode: readMode entitiesSelectionType: noneSelected labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected" }
        bulkOperationModal: { typeModal: DynamicForm formQuery: "GetMediafileCreateForm" askForCloseConfirmation: true neededPermission: cancreate } }]) {
        icon label value primary can actionContext { ...actionContext } bulkOperationModal { ...bulkOperationModal }
      }
    }
  }
\`;\n`,
      },
      {
        path: "queries/fixture.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const fixtureQueries = gql\`
  fragment fullEntity on Entity { id uuid type }
  query getEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on MediaFileEntity { ...minimalMediaFile } } }
  }
  query GetBulkOperations($entityType: String!) { BulkOperations(entityType: $entityType) { ... on MediaFileEntity { ...mediafileBulkOperations } } }
  query GetMenu($name: String!) { Menu(name: $name) { menu { name } } }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes).toContain("MediaFile: a bulk operation modal uses formQuery (singular), the old form; the app declares elody:bulkModalFormQueryLegacy");
    expect(ttl).toContain('elody:bulkFragmentName "mediafileBulkOperations" ;');
    expect(ttl).toMatch(/\n  elody:bulkModalFormQueryLegacy true [;.]\n/);
    expect(ttl).not.toContain("elody:typeEntry");
  });
});
