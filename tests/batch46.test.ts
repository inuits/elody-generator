/**
 * Batch 46: an overview page of the client's own (vlacc's WEM overview). A root field of the
 * client's schema reads entities by id; each type is laid out by fragments on Entity that carry a
 * detail alone, some of them partial: they add fields to windows and panels another fragment
 * declares, and GraphQL merges them by alias. Extracted, validated, generated again and compared
 * equal to itself.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareClient } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const gql = (name: string, body: string) => ({ path: `queries/entities/${name}.queries.ts`, source: `import { gql } from "graphql-modules";\nexport const ${name} = gql\`\n${body}\n\`;\n` });

export const overviewFiles = [
  gql(
    "book",
    `
  fragment minimalBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) }
    entityView { column { size(size: hundred) elements {
      info: windowElement {
        label(input: "window-element-labels.info")
        panel: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: true)
          title: metaData { label(input: "metadata.labels.title") key(input: "title") inputField(type: baseTextField) { ...inputfield } }
        }
      }
    } } }
  }
`,
  ),
  gql(
    "overview",
    `
  fragment overviewBook on Entity {
    intialValues {
      title: keyValue(key: "title", source: metadata)
      refAuthors: keyValue(key: "refAuthors", source: relations, metadataKeyAsLabel: "name")
    }
    relationValues
    entityView { column { size(size: hundred) elements {
      bookWindow: windowElement {
        label(input: "window-element-labels.book")
        info: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.meta-data" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: true)
          canBeMultipleColumns(input: true)
          title: metaData { label(input: "metadata.labels.title") key(input: "title") inputField(type: baseTextField) { ...inputfield validation(input: { value: required }) { ...validation } } }
        }
        relations: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.relations" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: true)
          canBeMultipleColumns(input: false)
          refAuthors: metaData { label(input: "metadata.labels.authors") key(input: "refAuthors") inputField(type: createBookAuthorsTypeField) { ...inputfield } }
        }
      }
    } } }
  }
  fragment overviewBookGenre on Entity {
    intialValues { genre: keyValue(key: "genre", source: metadata) }
    entityView { column { elements {
      bookWindow: windowElement {
        info: panels {
          genre: metaData { label(input: "metadata.labels.genre") key(input: "genre") inputField(type: genreTypeField) { ...inputfield } }
        }
      }
    } } }
  }
  query GetBookOverview($id: String!) {
    BookOverview(id: $id) {
      id
      uuid
      type
      intialValues {
        canUpdate
        canDelete
      }
      ... on Book {
        ...overviewBook
      }
      ... on Novel {
        ...overviewBook
        ...overviewBookGenre
      }
    }
  }
`,
  ),
];

describe("batch 46: an overview page of the client's own round-trips", () => {
  it("extracts, validates and regenerates it without a difference", async () => {
    const { ttl, notes } = extractDeclaration(overviewFiles, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|left out|stays hand-written/.test(n)), notes.join("\n")).toEqual([]);
    expect((await validateDeclaration(ttl)).issues.map(formatIssue), ttl).toEqual([]);
    expect(ttl).toContain('elody:rootField "BookOverview" ;');
    expect(ttl).toContain('elody:rootValues ( "canUpdate" "canDelete" ) ;');
    expect(ttl).toContain('elody:detailName "overviewBook" ;');
    expect(ttl).toContain("elody:detailAlone true ;");
    expect(ttl).toContain("elody:partial true ;");
    expect(ttl).toMatch(/\[ elody:graphqlType "Novel" ; sh:order 2 ; elody:fragment "overviewBook" ; elody:fragment "overviewBookGenre" \]/);

    const root = mkdtempSync(join(tmpdir(), "elody-batch46-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    for (const file of overviewFiles) writeFileSync(join(root, "src", file.path), file.source);
    const declaration = join(root, "extracted.ui.ttl");
    writeFileSync(declaration, ttl);
    const comparison = await compareClient({ client: "batch46", declaration, clientSrc: join(root, "src") });
    const byStatus = (status: string) => comparison.definitions.filter((d) => d.status === status).map((d) => `${d.name}${d.path ? `: ${d.path}` : ""}`);
    expect(byStatus("differs"), notes.join("\n")).toEqual([]);
    expect(byStatus("missing"), notes.join("\n")).toEqual([]);
    expect(byStatus("extra")).toEqual([]);
    for (const name of ["overviewBook", "overviewBookGenre", "GetBookOverview", "minimalBook", "fullBook"]) expect(byStatus("equal")).toContain(name);
  });
});
