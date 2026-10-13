/**
 * G-014 leftovers: the card's menu in its older form placed after the fields (elody:menuAfterFields),
 * and the operator of a type filter.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the card's menu after its fields", () => {
  it("renders contextMenuActions after the card fields when declared so", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "legacy-dialect.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "MediaFileEntity")!, "x", entities);
    expect(out).toMatch(/teaserMetadata \{\n\s+title: metaData \{[^]*?\}\n\s+contextMenuActions \{\n\s+doLinkAction \{/);
  });

  it("extracts the menu's position and a type filter's operator", () => {
    const files = [
      {
        path: "queries/entities/asset.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const asset = gql\`
  fragment minimalAsset on Asset {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata {
      title: metaData { label(input: "metadata.labels.title") key(input: "title") }
      contextMenuActions { doLinkAction { label(input: "contextMenu.contextMenuLinkAction.followLink") icon(input: "AngleRight") __typename } }
    }
    ...minimalBaseEntity
  }
  fragment filtersForAsset on Asset {
    advancedFilters { type: advancedFilter(type: type, operator: and) { type defaultValue(value: "asset") hidden(value: true) } }
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toMatch(/\[ elody:menuAfterFields true ;/);
    expect(ttl).toMatch(/elody:filterOperator "and" ;\n\s+elody:filterKind elody:TypeFilter/);
  });
});
