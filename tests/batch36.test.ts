/**
 * G-006, the listing without ...minimalBaseEntity: a client that never spreads the shared base card
 * in a type's listing fragment (elody:withoutBaseEntity).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("a listing without the base card", () => {
  it("leaves ...minimalBaseEntity out when declared so", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "legacy-dialect.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "MediaFileEntity")!, "x", entities);
    expect(out).toContain("fragment minimalMediaFile on MediaFileEntity {");
    expect(out).not.toContain("minimalBaseEntity");
    // the card shows the link text too (elody:cardLinkText)
    expect(out).toMatch(/teaserMetadata \{\n\s+title: metaData \{\n\s+label\(input: "metadata.labels.filename"\)\n\s+key\(input: "title"\)\n\s+linkText\(input: "metadata.labels.download-link"\)/);
  });

  it("extracts the card's link text and splits a value read with a technical origin on the detail only", () => {
    const files = [
      {
        path: "queries/entities/download.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const download = gql\`
  fragment minimalDownload on Download {
    intialValues { title: keyValue(key: "title", source: metadata) download_url: keyValue(key: "hasMediafile", source: relations, rootKeyAsLabel: "original_file_location") }
    teaserMetadata {
      title: metaData { label(input: "metadata.labels.title") key(input: "title") }
      download_url: metaData { label(input: "metadata.labels.url") key(input: "download_url") linkText(input: "metadata.labels.download-link") }
    }
    ...minimalBaseEntity
  }
  fragment fullDownload on Download {
    intialValues { title: keyValue(key: "title", source: metadata) download_url: keyValue(key: "hasMediafile", source: relations, rootKeyAsLabel: "original_file_location", technicalOrigin: "download") }
    entityView { column { size(size: thirty) elements { windowElement { label(input: "Info")
      info: panels { label(input: "panel-labels.info") panelType(input: metadata) isEditable(input: false) isCollapsed(input: false)
        download_url: metaData { label(input: "metadata.labels.url") key(input: "download_url") linkText(input: "metadata.labels.download-link") } } } } } }
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toContain("    elody:cardLinkText true ;");
    expect(ttl.split('elody:technicalOrigin "download"').length).toBe(2);
    expect(ttl.split("sh:path em:download_url").length).toBe(3);
    expect(ttl).toMatch(/elody:listingOnly true [;\]]/);
  });

  it("extracts the absence of the base card", () => {
    const files = [
      {
        path: "queries/entities/mediafile.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const mediafile = gql\`
  fragment minimalMediaFile on MediaFileEntity {
    intialValues { title: keyValue(key: "original_filename", source: root) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.filename") key(input: "title") } }
  }
  fragment minimalAsset on Asset {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toMatch(/elody:documentName "MediaFile" ;\n  elody:emit "file" ;\n  elody:withoutBaseEntity true ;/);
    expect(ttl.split("elody:withoutBaseEntity").length).toBe(2);
  });
});
