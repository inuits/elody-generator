/**
 * base-graphql 0.10.30 (2026-10-09, refactor! 330863e) merged the keyValue arguments
 * metadataKeyAsLabel and rootKeyAsLabel into one input, keyAsLabel: { origin: metadata | root, key }.
 * The generator renders that input by default, still renders the two arguments for a client pinned
 * below 0.10.30 (the legacy dialect), reads both forms when extracting, and compares them as the same
 * thing, so a hand-written client on the old form still proves equal to what the declaration renders.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile, setDialect } from "../src/render.js";

const gqlFile = (name: string, body: string) => ({ path: name, source: `import { gql } from "graphql-modules";\n\nexport const q = gql\`\n${body}\n\`;\n` });

const fixture = async () => {
  const { fixturesDir } = await import("../src/ontology.js");
  return readUiDeclaration(readFileSync(join(fixturesDir(), "page-and-panel-overrides.ui.ttl"), "utf-8"));
};

describe("keyAsLabel (base-graphql 0.10.30)", () => {
  afterEach(() => setDialect({}));

  it("renders the keyAsLabel input by default", async () => {
    const { entities } = await fixture();
    const area = renderEntityFile(entities[0], "x");
    expect(area).toContain('refRegion: keyValue(key: "refRegion", source: relations, keyAsLabel: { origin: metadata, key: "name" })');
    expect(area).toContain('refMediafiles: keyValue(key: "refMediafiles", source: relations, keyAsLabel: { origin: root, key: "display_filename" })');
    expect(area).not.toContain("metadataKeyAsLabel");
    expect(area).not.toContain("rootKeyAsLabel");
  });

  it("renders the two legacy arguments for a client pinned below 0.10.30", async () => {
    setDialect({ keyAsLabel: "legacy" });
    const { entities } = await fixture();
    const area = renderEntityFile(entities[0], "x");
    expect(area).toContain('refRegion: keyValue(key: "refRegion", source: relations, metadataKeyAsLabel: "name")');
    expect(area).toContain('refMediafiles: keyValue(key: "refMediafiles", source: relations, rootKeyAsLabel: "display_filename")');
    expect(area).not.toContain("keyAsLabel: {");
  });

  it("compares the legacy arguments and the input as the same thing", () => {
    const legacy = readDefinitions([
      gqlFile(
        "entities/a.queries.ts",
        'fragment a on A { intialValues { r: keyValue(key: "hasR", source: relations, metadataKeyAsLabel: "title") m: keyValue(key: "hasM", source: relations, rootKeyAsLabel: "filename") } }',
      ),
    ]).definitions;
    const input = readDefinitions([
      gqlFile(
        "entities/a.queries.ts",
        'fragment a on A { intialValues { r: keyValue(key: "hasR", source: relations, keyAsLabel: { key: "title", origin: metadata }) m: keyValue(key: "hasM", source: relations, keyAsLabel: { origin: root, key: "filename" }) } }',
      ),
    ]).definitions;
    expect(compareDefinitions(legacy, input).definitions[0].status).toBe("equal");
    expect(compareDefinitions(input, legacy).definitions[0].status).toBe("equal");
    // another key is still another thing
    const other = readDefinitions([
      gqlFile(
        "entities/a.queries.ts",
        'fragment a on A { intialValues { r: keyValue(key: "hasR", source: relations, keyAsLabel: { origin: metadata, key: "name" }) m: keyValue(key: "hasM", source: relations, keyAsLabel: { origin: root, key: "filename" }) } }',
      ),
    ]).definitions;
    expect(compareDefinitions(legacy, other).definitions[0].status).not.toBe("equal");
  });

  it("extracts the input form into elody:valueLabelKey and elody:valueLabelRootKey", () => {
    const files = [
      gqlFile(
        "queries/entities/download.queries.ts",
        'fragment minimalDownload on Download { intialValues { title: keyValue(key: "title", source: metadata) download_url: keyValue(key: "hasMediafile", source: relations, keyAsLabel: { origin: root, key: "original_file_location" }) category: keyValue(key: "hasCategory", source: relations, keyAsLabel: { origin: metadata, key: "name" }) } ...minimalBaseEntity }',
      ),
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toContain('elody:valueLabelRootKey "original_file_location"');
    expect(ttl).toContain('elody:valueLabelKey "name"');
  });
});
