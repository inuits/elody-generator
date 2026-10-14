/**
 * Batch 50: the label key defined once on the key. A shape of that key that says none inherits it; a
 * shape's own wins; a key without one follows the convention. The extractor writes keys.ui.ttl for the
 * keys labelled the same everywhere, and leaves those labels off the shapes; expand writes them back.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { expandDeclaration } from "../src/expand.js";
import { extractDeclarationFiles } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("batch 50: a label key on the key itself", () => {
  it("inherits the key's label, lets a shape's own win, and falls back to the convention", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "key-labels.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const book = renderEntityFile(entities.find((e) => e.graphqlType === "Book")!, "x", entities);
    expect(book).toContain('label(input: "metadata.labels.title")');
    expect(book).toContain('label(input: "metadata.labels.isbn")');
    const author = renderEntityFile(entities.find((e) => e.graphqlType === "Author")!, "x", entities);
    expect(author).toContain('label(input: "metadata.labels.name")');
    expect(author).not.toContain('label(input: "metadata.labels.title")');
    // expand writes the key's label onto the shape that inherits it, not onto the one with its own
    const { ttl } = expandDeclaration(fixture);
    expect((ttl.match(/elody:labelKey "metadata\.labels\.title"/g) ?? []).length).toBe(2); // the key's own, and the Book shape's
    expect(ttl).toMatch(/elody:labelKey "metadata\.labels\.name"/);
  });

  it("extracts the keys labelled the same everywhere into keys.ui.ttl", () => {
    const type = (name: string) => ({
      path: `queries/entities/${name.toLowerCase()}.queries.ts`,
      source: `import { gql } from "graphql-modules";\nexport const ${name.toLowerCase()} = gql\`
  fragment minimal${name} on ${name} {
    intialValues { computed_title: keyValue(key: "computed_title", source: metadata) }
    teaserMetadata { computed_title: metaData { label(input: "metadata.labels.title") key(input: "computed_title") } }
    ...minimalBaseEntity
  }
  fragment full${name} on ${name} {
    intialValues { computed_title: keyValue(key: "computed_title", source: metadata) }
    entityView { column { size(size: hundred) elements { info: windowElement { label(input: "window-element-labels.info") info: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: false) computed_title: metaData { label(input: "metadata.labels.title") key(input: "computed_title") } } } } } }
  }
\`;\n`,
    });
    const { files } = extractDeclarationFiles([type("Book"), type("Author")], { namespace: "urn:ui:" });
    expect(files.get("keys.ui.ttl")).toContain('em:computed_title elody:labelKey "metadata.labels.title" .');
    expect(files.get("entities/book.ui.ttl")).not.toMatch(/elody:labelKey/);
    expect(files.get("entities/author.ui.ttl")).not.toMatch(/elody:labelKey/);
  });
});
