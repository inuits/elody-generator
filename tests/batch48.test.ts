/**
 * Batch 48: the compact form. What a declaration leaves out follows from the meta-shapes: the
 * conventional label key (elody:defaultRule), an open panel or element (sh:defaultValue false),
 * no sh:name. The writer leaves the defaults out and puts a short node on one line; `expand`
 * writes the defaults back; the reference shows them in a Default column.
 */
import { describe, expect, it } from "vitest";
import { expandDeclaration } from "../src/expand.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { readReference, renderReference } from "../src/reference.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";
import { conventionalLabelKey } from "../src/vocab.js";
import { readFileSync } from "fs";
import { join } from "path";

describe("batch 48: defaults and the compact form", () => {
  it("knows the conventional label key", () => {
    expect(conventionalLabelKey("title")).toBe("metadata.labels.title");
    expect(conventionalLabelKey("defaultBranch")).toBe("metadata.labels.default-branch");
    expect(conventionalLabelKey("original_headtitle")).toBe("metadata.labels.original-headtitle");
    expect(conventionalLabelKey("properties.original_headtitle.value")).toBe("metadata.labels.original-headtitle");
  });

  it("renders the compact fixture with the defaults applied", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "compact.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toContain('label(input: "metadata.labels.title")');
    expect(out).toContain('label(input: "metadata.labels.publication-year")');
    expect(out).toContain('label(input: "metadata.labels.book.isbn")');
    expect(out).toContain("isCollapsed(input: false)");
    expect(out).toContain("panelType(input: metadata)");
  });

  it("writes the defaults back with expand", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "compact.ui.ttl"), "utf-8");
    const { ttl, added } = expandDeclaration(fixture);
    expect(added).toBeGreaterThanOrEqual(4);
    expect(ttl).toMatch(/elody:labelKey "metadata\.labels\.title"/);
    expect(ttl).toMatch(/elody:labelKey "metadata\.labels\.publication-year"/);
    expect(ttl).not.toMatch(/elody:labelKey "metadata\.labels\.isbn"/);
    expect((ttl.match(/elody:collapsed false/g) ?? []).length).toBe(2);
    // the explicit graph renders the same documents
    const compact = await readUiDeclaration(fixture);
    const explicit = await readUiDeclaration(ttl);
    expect(renderEntityFile(explicit.entities[0], "x", explicit.entities)).toBe(renderEntityFile(compact.entities[0], "x", compact.entities));
  });

  it("extracts the compact form: no sh:name, conventional label keys and open panels left out, short nodes on one line", () => {
    const files = [
      {
        path: "queries/entities/book.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const book = gql\`
  fragment minimalBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } isbn: metaData { label(input: "metadata.labels.book.isbn") key(input: "isbn") } }
    ...minimalBaseEntity
  }
  fragment fullBook on Book {
    intialValues { title: keyValue(key: "title", source: metadata) isbn: keyValue(key: "isbn", source: metadata) }
    entityView { column { size(size: hundred) elements {
      info: windowElement {
        label(input: "window-element-labels.info")
        info: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: false)
          title: metaData { label(input: "metadata.labels.title") key(input: "title") }
          isbn: metaData { label(input: "metadata.labels.book.isbn") key(input: "isbn") }
        }
      }
    } } }
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).not.toMatch(/sh:name/);
    expect(ttl).not.toMatch(/elody:collapsed false/);
    expect(ttl).not.toMatch(/elody:labelKey "metadata\.labels\.title"/);
    expect(ttl).toMatch(/elody:labelKey "metadata\.labels\.book\.isbn"/);
    expect(ttl).toMatch(/^    \[ sh:path em:title ; sh:order 1 ; shui:propertyRole shui:LabelRole \] ,$/m);
  });

  it("shows the defaults in the reference", () => {
    const pages = renderReference(readReference());
    expect(pages.get("detail-page.md")).toMatch(/### Panel\n[\s\S]*?\| Term \| Type \| How many \| Default \| Meaning \|[\s\S]*?`elody:collapsed` \| `xsd:boolean` \| at most one \| `false` \|/);
    expect(pages.get("properties.md")).toMatch(/`elody:labelKey` \| `xsd:string` \| at most one \| metadata\.labels\.&lt;key&gt;/);
  });
});
