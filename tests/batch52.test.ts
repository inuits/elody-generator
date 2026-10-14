/**
 * Batch 52: a form's fields as a list of the type's properties. An item inherits the property's input
 * (and label, unit, ...) unless it says its own; the extractor writes the list when inheriting gives
 * the field back exactly, else the fields keep their shape; the round trip is equal.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareClient } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("batch 52: a form's fields from the type's properties", () => {
  it("inherits the input and label per item, honours the override, and renders the form", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "form-fields.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    const form = /query GetBookCreateForm[\s\S]*?\n  \}\n/.exec(out)?.[0] ?? "";
    // the type's text field and label; required from the override; a text field in place of the type's text area; a label of its own
    expect(form).toMatch(/title: metaData \{\s+label\(input: "metadata.labels.book-title"\)\s+key\(input: "title"\)\s+inputField\(type: baseTextField\)/);
    expect(form).toMatch(/isbn: metaData \{[\s\S]*?inputField\(type: baseTextField\) \{[\s\S]*?validation\(input: \{ value: required \}\)/);
    expect(form).toMatch(/notes: metaData \{[\s\S]*?inputField\(type: baseTextField\)/);
    expect(form).toMatch(/year: metaData \{\s+label\(input: "metadata.labels.publication-year"\)/);
    expect(form.indexOf("title: metaData")).toBeLessThan(form.indexOf("isbn: metaData"));
  });

  it("extracts the list, names the type it inherits from, and the round trip is equal", async () => {
    const files = [
      {
        path: "queries/entities/book.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const book = gql\`
  fragment minimalBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.book-title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) }
    entityView { column { size(size: hundred) elements { info: windowElement { label(input: "window-element-labels.info") info: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: true)
      title: metaData { label(input: "metadata.labels.book-title") key(input: "title") inputField(type: baseTextField) { ...inputfield } }
      isbn: metaData { label(input: "metadata.labels.isbn") key(input: "isbn") inputField(type: isbnTypeField) { ...inputfield } }
    } } } } }
  }
  query GetBookCreateForm {
    GetDynamicForm {
      label(input: "navigation.create-book")
      book: formTab {
        formFields {
          title: metaData { label(input: "metadata.labels.book-title") key(input: "title") inputField(type: baseTextField) { ...inputfield validation(input: { value: required }) { ...validation } } }
          isbn: metaData { label(input: "metadata.labels.isbn") key(input: "isbn") inputField(type: isbnTypeField) { ...inputfield } }
          createAction: action { label(input: "actions.labels.create") icon(input: Create) actionType(input: submit) actionQuery(input: "CreateEntity") creationType(input: book) showsFormErrors(input: true) }
        }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|left out/.test(n))).toEqual([]);
    expect(ttl).toMatch(/elody:fieldsFrom ui:BookUi ;\n  elody:fields \(\n    \[ sh:path em:title ; sh:minCount 1 \]\n    em:isbn\n  \) ;/);
    expect((await validateDeclaration(ttl)).issues.map(formatIssue)).toEqual([]);
    const root = mkdtempSync(join(tmpdir(), "elody-batch52-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    for (const file of files) writeFileSync(join(root, "src", file.path), file.source);
    const declaration = join(root, "extracted.ui.ttl");
    writeFileSync(declaration, ttl);
    const comparison = await compareClient({ client: "batch52", declaration, clientSrc: join(root, "src") });
    expect(comparison.definitions.filter((d) => d.status !== "equal").map((d) => `${d.name}: ${d.status} ${d.path ?? ""}`)).toEqual([]);
  });
});
