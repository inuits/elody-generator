/**
 * G-009, fragment names of the client's own: a sort options fragment under another name
 * (elody:sortFragmentName), and the extractor finding the detail, filters, sort and bulk fragments
 * of a type under whatever the client calls them in the type's own file.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("fragment names of the client's own", () => {
  it("renders the sort fragment under its declared name", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "legacy-dialect.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const mediafile = entities.find((e) => e.graphqlType === "MediaFileEntity")!;
    const out = renderEntityFile(mediafile, "x", entities);
    expect(out).toContain("fragment mediafileEntitySortOptions on MediaFileEntity {");
    expect(out).not.toContain("mediaFileSortOptions");
    const app = renderEntityFile(entities.find((e) => e.app)!, "x", entities);
    expect(app).toMatch(/query GetSortOptions\(\$entityType: String!\) \{[^]*\.\.\.mediafileEntitySortOptions/);
  });

  it("extracts the fragments of a type under the client's own names", () => {
    const files = [
      {
        path: "queries/entities/archivalCollection.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const archivalCollection = gql\`
  fragment minimalArchivalCollection on ArchivalCollection {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullArchiveCollection on ArchivalCollection {
    intialValues { title: keyValue(key: "title", source: metadata) description: keyValue(key: "description", source: metadata) }
    entityView { column { size(size: seventy) elements { windowElement { label(input: "Info")
      info: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label } panelType(input: metadata) isEditable(input: false) isCollapsed(input: false)
        description: metaData { label(input: "metadata.labels.description") key(input: "description") } } } } } }
  }
  fragment archiveCollectionSortOptions on ArchivalCollection {
    sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title" }]) { icon label value } }
  }
  fragment filtersForArchiveCollection on ArchivalCollection {
    advancedFilters { type: advancedFilter(type: type) { type defaultValue(value: "archivalCollection") hidden(value: true) } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|does not parse/.test(n))).toEqual([]);
    expect(ttl).toContain('elody:detailName "fullArchiveCollection" ;');
    expect(ttl).toContain('elody:sortFragmentName "archiveCollectionSortOptions" ;');
    expect(ttl).toContain('elody:filtersFragmentName "filtersForArchiveCollection" ;');
    expect(ttl).toContain("elody:detail");
  });
});
