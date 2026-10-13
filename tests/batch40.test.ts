/**
 * G-045: a window fragment (panels several types spread into a window) and a fields fragment
 * composed of fields fragments around a field of its own.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("window fragments and composed fields fragments", () => {
  it("renders the fragment on WindowElement and the spreads around a field", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "window-fragment.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toMatch(/fragment manifestationIsbnGroupPanel on WindowElement \{\n\s+isbn_group: panels \{\n\s+panelHeaderContent\(panelHeaderContentInput: \{ label: "panel-labels.isbn" \}\) \{[^]*?repetitionConfig\(repetitionKey: "isbn_group"\)[^]*?isbn: metaData \{\n\s+label\(input: "metadata.labels.isbn"\)\n\s+key\(input: "isbn"\)\n\s+inputField\(type: baseTextField\)/);
    expect(out).toMatch(/fragment basicCreateManifestationFields on FormFields \{\n\s+\.\.\.basicCreateManifestationFieldsBeforeAuthors\n\s+refAuthors: metaData \{[^]*?\}\n\s+\.\.\.basicCreateManifestationFieldsAfterAuthors\n\s+\}/);
    expect(out).toMatch(/windowElement \{\n\s+label\(input: "Info"\)[^]*?\.\.\.manifestationIsbnGroupPanel/);
  });

  it("extracts both", () => {
    const files = [
      {
        path: "queries/entities/manifestation.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const manifestation = gql\`
  fragment minimalManifestation on Manifestation {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullManifestation on Manifestation {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) }
    entityView { column { size(size: seventy) elements { windowElement { label(input: "Info")
      info: panels { label(input: "panel-labels.info") panelType(input: metadata) isEditable(input: true) isCollapsed(input: false) title: metaData { label(input: "metadata.labels.title") key(input: "title") inputField(type: baseTextField) { ...inputfield } } }
      ...manifestationIsbnGroupPanel } } } }
  }
  fragment manifestationIsbnGroupPanel on WindowElement {
    isbn_group: panels { label(input: "panel-labels.isbn") panelType(input: metadata) isCollapsed(input: true) isEditable(input: true) canBeMultipleColumns(input: true) repetitionConfig(repetitionKey: "isbn_group") { repetitionKey }
      isbn: metaData { label(input: "metadata.labels.isbn") key(input: "isbn") inputField(type: baseTextField) { ...inputfield } } }
  }
  fragment basicCreateManifestationFields on FormFields {
    ...basicCreateManifestationFieldsBeforeAuthors
    refAuthors: metaData { label(input: "element-labels.people-corporations-manifestation-element") key(input: "refAuthors") inputField(type: createManifestationAuthorsTypeField) { ...inputfield } }
    ...basicCreateManifestationFieldsAfterAuthors
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toContain('  elody:windowFragment\n    [ elody:fragmentName "manifestationIsbnGroupPanel" ;\n    elody:panel ui:ManifestationUi-isbn_group ] ;');
    expect(ttl).toMatch(/ui:ManifestationUi-isbn_group\n  a elody:Panel ;[^]*?elody:repetitionKey "isbn_group" ;[^]*?elody:field em:isbn/);
    expect(ttl).toContain('    elody:fieldsSpread "basicCreateManifestationFieldsBeforeAuthors" ;\n    elody:fieldsSpreadAfter "basicCreateManifestationFieldsAfterAuthors" ;');
  });
});
