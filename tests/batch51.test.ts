/**
 * Batch 51: two shapes of one key (a twin) declared by name, so the type's lists can name one and not
 * the other. The fixture renders the listing with the aliased twin and the detail with the plain one;
 * the extractor writes the twins as named shapes and lists them by node, and the round trip is equal.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { compareClient } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("batch 51: twin shapes declared by name", () => {
  it("renders the fixture with each twin where its list names it", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "named-shapes.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    const listing = /fragment minimalTenant on Tenant \{\s+intialValues \{([\s\S]*?)\}/.exec(out)?.[1] ?? "";
    expect(listing).toMatch(/id: keyValue[\s\S]*?title: keyValue\(key: "name"/);
    expect(listing).not.toMatch(/name: keyValue\(key: "name"|title: keyValue\(key: "title"/);
    const detail = /fragment fullTenant on Tenant \{\s+intialValues \{([\s\S]*?)\}/.exec(out)?.[1] ?? "";
    expect(detail).toMatch(/id: keyValue[\s\S]*?name: keyValue\(key: "name"[\s\S]*?title: keyValue\(key: "title"/);
    expect(detail).not.toMatch(/title: keyValue\(key: "name"/);
  });

  it("extracts a twin as named shapes listed by node, and the round trip is equal", async () => {
    const files = [
      {
        path: "queries/entities/tenant.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const tenant = gql\`
  fragment minimalTenant on Tenant {
    intialValues { id: keyValue(key: "id", source: root) title: keyValue(key: "name", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "name") } }
    ...minimalBaseEntity
  }
  fragment fullTenant on Tenant {
    intialValues { id: keyValue(key: "id", source: root) name: keyValue(key: "name", source: metadata) title: keyValue(key: "title", source: metadata) }
    entityView { column { size(size: hundred) elements { info: windowElement { label(input: "window-element-labels.info") info: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: false) name: metaData { label(input: "metadata.labels.name") key(input: "name") } } } } } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|left out/.test(n))).toEqual([]);
    const twinLines = ttl.split("\n").filter((l) => /field-|Fields \(/.test(l)).join("\n");
    expect(ttl, twinLines).toMatch(/^    ui:TenantUi-field-title ,$/m);
    expect(ttl, twinLines).toMatch(/^    ui:TenantUi-field-name [,;]$/m);
    expect(ttl).toMatch(/^ui:TenantUi-field-title a sh:PropertyShape ;\n  sh:path em:name ;/m);
    expect(ttl).toMatch(/elody:listingFields \( [^)]*ui:TenantUi-field-title[^)]*\)/);
    expect(ttl).not.toMatch(/elody:listingFields \( [^)]*ui:TenantUi-field-name/);
    expect((await validateDeclaration(ttl)).issues.map(formatIssue)).toEqual([]);
    const root = mkdtempSync(join(tmpdir(), "elody-batch51-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    for (const file of files) writeFileSync(join(root, "src", file.path), file.source);
    const declaration = join(root, "extracted.ui.ttl");
    writeFileSync(declaration, ttl);
    const comparison = await compareClient({ client: "batch51", declaration, clientSrc: join(root, "src") });
    expect(comparison.definitions.filter((d) => d.status !== "equal").map((d) => `${d.name}: ${d.status} ${d.path ?? ""}`)).toEqual([]);
  });
});
