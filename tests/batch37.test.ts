/**
 * G-001, the platform document's variants: the bulk-edit relation form in the client's dialect
 * (flat panel, a field of the client's own), the mediafiles read bare, the filters document under
 * its other spelling, the history listing, the map's geo filter; and compare counting an identical
 * selection given twice once.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the platform document's variants", () => {
  it("renders the relation form flat with a client field, the bare mediafiles, the other spellings", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "platform-variants.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const app = renderEntityFile(entities.find((e) => e.app)!, "x", entities);
    expect(app).toMatch(/relations: panels \{\n\s+panelHeaderContent\(panelHeaderContentInput: \{ label: "bulk-operations.bulk-edit.relation-types" \}\) \{\n\s+label\n\s+\}\n\s+panelType\(input: metadata\)\n\s+isEditable\(input: true\)\n\s+isCollapsed\(input: false\)\n\s+institution: metaData \{\n\s+label\(input: "metadata.labels.owner"\)\n\s+key\(input: "owner"\)\n\s+inputField\(type: institutionTypeField\)/);
    expect(app).not.toContain("WindowElementPanel");
    expect(app).toMatch(/FetchMediafilesOfEntity\(entityIds: \$entityIds\) \{\n\s+id\n\s+\}/);
    expect(app).toMatch(/query GetAdvancedFilters\(\$entityType: String!\) \{\n\s+EntityTypeFilters\(type: \$entityType\) \{\n\s+\.\.\. on Work \{\n\s+\.\.\.filtersForWork/);
    expect(app).toMatch(/EntitiesHistory\([^]*?results \{\n\s+id\n\s+uuid\n\s+type\n\s+\.\.\. on Work \{\n\s+\.\.\.fullWork/);
    expect(app).toContain('advancedFilter(type: geo, key: "gps_coordinates")');
  });

  it("extracts the relation form's dialect, the bare mediafiles and the geo filter key", () => {
    const files = [
      {
        path: "queries/entities/work.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment minimalWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
\`;\n`,
      },
      {
        path: "queries/fixture.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const fixtureQueries = gql\`
  fragment fullEntity on Entity { id uuid type }
  query getEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on Work { ...minimalWork } } }
  }
  query GetBulkOperationsRelationForm { BulkOperationsRelationForm { label(input: "bulk-operations.bulk-edit.bulk-edit-title") relations: panels {
    panelHeaderContent(panelHeaderContentInput: { label: "bulk-operations.bulk-edit.relation-types" }) { label } panelType(input: metadata) isEditable(input: true) isCollapsed(input: false)
    institution: metaData { label(input: "metadata.labels.owner") key(input: "owner") inputField(type: institutionTypeField) { ...inputfield } } } } }
  query FetchMediafilesOfEntity($entityIds: [String!]!) { FetchMediafilesOfEntity(entityIds: $entityIds) { id } }
  query GetGeoFilterForMap { GeoFilterForMap { advancedFilter(type: geo, key: "gps_coordinates") { type key bucket hidden(value: true) } } }
  query GetMenu($name: String!) { Menu(name: $name) { menu { name } } }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toContain("  elody:relationFormFlatPanel true ;");
    expect(ttl).toContain('  elody:relationFormField [ sh:order 1 ; elody:alias "institution" ; elody:key "owner" ; elody:labelKey "metadata.labels.owner" ; elody:clientInputField "institutionTypeField" ] ;');
    expect(ttl).toContain('  elody:geoFilterKey "gps_coordinates" ;');
    expect(ttl).toContain('[ elody:platformDocument "FetchMediafilesOfEntity" ; elody:graphqlType "MediaFileEntity" ; elody:bare true ]');
  });

  it("counts an identical selection given twice once", () => {
    const client = readDefinitions([{ path: "queries/x.queries.ts", source: `export const x = gql\`fragment minimalWork on Work { teaserMetadata { title: metaData { label(input: "t") key(input: "title") key(input: "title") label(input: "t") } } }
      query GetBulkOperations($entityType: String!) { BulkOperations(entityType: $entityType) { ... on Work { bulkOperationOptions { options(input: []) { icon actionContext { ...actionContext ...actionContext } } } } } }\`;` }]).definitions;
    const generated = readDefinitions([{ path: "queries/x.queries.ts", source: `export const x = gql\`fragment minimalWork on Work { teaserMetadata { title: metaData { label(input: "t") key(input: "title") } } }
      query GetBulkOperations($entityType: String!) { BulkOperations(entityType: $entityType) { ... on Work { bulkOperationOptions { options(input: []) { icon actionContext { ...actionContext } } } } } }\`;` }]).definitions;
    expect(compareDefinitions(client, generated).definitions.map((d) => d.status)).toEqual(["equal", "equal"]);
  });
});
