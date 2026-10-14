/**
 * G-007, the client's dialect: an app that heads its panels with label(input:), the baseGraphql
 * form before panelHeaderContent (elody:panelHeaderLegacy), and a detail fragment under the
 * client's own casing (elody:detailName, the twin of elody:cardName).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the client's dialect", () => {
  it("renders legacy panel headers and the client's own detail fragment name", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "legacy-dialect.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const mediafile = entities.find((e) => e.graphqlType === "MediaFileEntity")!;
    expect(mediafile.detailName).toBe("fullMediafile");
    expect(mediafile.panelHeaderLegacy).toBe(true);
    const out = renderEntityFile(mediafile, "x", entities);
    expect(out).toContain("fragment minimalMediaFile on MediaFileEntity {");
    expect(out).toContain("fragment fullMediafile on MediaFileEntity {");
    expect(out).toMatch(/omschrijving: panels \{\n\s+label\(input: "panel-labels.description"\)\n\s+panelType\(input: metadata\)/);
    expect(out).not.toContain("panelHeaderContent");
  });

  it("extracts the client's casing of the detail fragment and the legacy panel headers", () => {
    const files = [
      {
        path: "queries/entities/mediafile.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const mediafile = gql\`
  fragment minimalMediaFile on MediaFileEntity {
    intialValues { title: keyValue(key: "original_filename", source: root) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.filename") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullMediafile on MediaFileEntity {
    intialValues { title: keyValue(key: "original_filename", source: root) mimetype: keyValue(key: "mimetype", source: root) }
    entityView { column { size(size: thirty) elements { windowElement { label(input: "Metadata")
      omschrijving: panels { label(input: "panel-labels.description") panelType(input: metadata) isEditable(input: false) isCollapsed(input: false)
        mimetype: metaData { label(input: "metadata.labels.mimetype") key(input: "mimetype") } } } } } }
  }
\`;\n`,
      },
      {
        path: "queries/fixture.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const fixtureQueries = gql\`
  fragment fullEntity on Entity { id uuid type ... on MediaFileEntity { ...fullMediafile } }
  query getEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on MediaFileEntity { ...minimalMediaFile } } }
  }
  query getEntityById($id: String!, $type: String!) { Entity(id: $id, type: $type) { intialValues { canUpdate canDelete } ...fullEntity } }
  query GetMenu($name: String!) { Menu(name: $name) { menu { name } } }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes).toContain("MediaFile: panel omschrijving is headed with label(input:), the old form; the app declares elody:panelHeaderLegacy");
    expect(ttl).toContain('elody:detailName "fullMediafile" ;');
    expect(ttl).toMatch(/\n  elody:panelHeaderLegacy true [;.]\n/);
    // the platform's fullEntity spreads the detail under its declared name: no type entry overrides it
    expect(ttl).not.toContain("elody:typeEntry");
  });
});
