/**
 * Batch 49: what is read and shown as lists on the type, the platform's context presets, and
 * operations several types share declared once. A compact declaration renders like its explicit
 * twin; the extractor writes the lists, the presets and the shared nodes; the clients still compare.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("batch 49: field lists, context presets and shared operations", () => {
  it("reads the lists as the flags, the preset as its context, the shared node from both types", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "lists-and-presets.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const book = entities.find((e) => e.graphqlType === "Book")!;
    const flags = Object.fromEntries(book.properties.map((p) => [p.key, `${p.detailOnly ? "detailOnly " : ""}${p.listingOnly ? "listingOnly " : ""}${p.readsValue ? "" : "noValue "}${p.teaser ? "card" : "nocard"}`.trim()]));
    expect(flags).toEqual({ title: "card", isbn: "nocard", summary: "listingOnly nocard", publicationYear: "detailOnly nocard", notes: "detailOnly noValue nocard" });
    const out = renderEntityFile(book, "x", entities);
    const listingValues = /fragment minimalBook on Book \{\s+intialValues \{([\s\S]*?)\}/.exec(out)?.[1] ?? "";
    expect(listingValues).toMatch(/title: keyValue[\s\S]*?isbn: keyValue[\s\S]*?summary: keyValue/);
    expect(listingValues).not.toMatch(/publicationYear|notes/);
    const detailValues = /fragment fullBook on Book \{\s+intialValues \{([\s\S]*?)\}/.exec(out)?.[1] ?? "";
    expect(detailValues).toMatch(/title: keyValue[\s\S]*?isbn: keyValue[\s\S]*?publicationYear: keyValue/);
    expect(detailValues).not.toMatch(/summary|notes/);
    expect(out).toMatch(/teaserMetadata \{\s+title: metaData/);
    expect(out).not.toMatch(/teaserMetadata \{[\s\S]*?isbn: metaData/);
    // the preset's context and the shared operation, on both types
    for (const entity of [book, entities.find((e) => e.graphqlType === "Author")!]) {
      const file = renderEntityFile(entity, "x", entities);
      expect(file).toMatch(/label: "bulk-operations.delete-selected"[\s\S]*?actionContext: \{\s+activeViewMode: readMode\s+entitiesSelectionType: someSelected\s+labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-someselected"/);
    }
  });

  it("extracts the lists, the preset and the shared node", () => {
    const type = (name: string, extra = "") => ({
      path: `queries/entities/${name.toLowerCase()}.queries.ts`,
      source: `import { gql } from "graphql-modules";\nexport const ${name.toLowerCase()} = gql\`
  fragment minimal${name} on ${name} {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) summary: keyValue(key: "summary", source: metadata) ${extra} }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment full${name} on ${name} {
    intialValues { title: keyValue(key: "title", source: metadata) year: keyValue(key: "year", source: metadata) notes: keyValue(key: "notes", source: metadata) }
    entityView { column { size(size: hundred) elements { info: windowElement { label(input: "window-element-labels.info") info: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: false) title: metaData { label(input: "metadata.labels.title") key(input: "title") } } } } } }
  }
  fragment ${name.toLowerCase()}BulkOperations on ${name} {
    bulkOperationOptions {
      options(input: [{ label: "bulk-operations.delete-selected", value: "deleteEntities", actionContext: { activeViewMode: readMode, entitiesSelectionType: someSelected, labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-someselected" }, bulkOperationModal: { typeModal: Delete, neededPermission: candelete } }]) {
        icon label value primary can actionContext { ...actionContext } bulkOperationModal { ...bulkOperationModal } subOptions { ...subOptions }
      }
    }
  }
\`;\n`,
    });
    const { ttl } = extractDeclaration([type("Book"), type("Author")], { namespace: "urn:ui:" });
    expect(ttl).toMatch(/elody:listingFields \( em:title em:isbn em:summary \) ;\n  elody:detailFields \( em:title em:year em:notes \) ;/);
    expect(ttl).toMatch(/elody:cardFields \( em:title \) ;/);
    expect(ttl).not.toMatch(/elody:detailOnly true|elody:listingOnly true|elody:teaser false/);
    expect(ttl).toMatch(/elody:context elody:ReadModeSomeSelectedContext/);
    expect(ttl).toMatch(/elody:bulkOperation\n    ui:DeleteSelectedOperation [;.]/);
    expect((ttl.match(/^ui:DeleteSelectedOperation\n  a elody:BulkOperation ;/gm) ?? []).length).toBe(1);
  });
});
