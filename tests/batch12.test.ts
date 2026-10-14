/**
 * G-014: a list query's results selected inline. A result may spread fragments and/or render an
 * inline listing: an EntityUi with elody:emit "inline", rendered inside the result instead of as
 * a file. Spreads in a selection set compare in any order.
 */
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { generate } from "../src/generate.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const gqlFile = (path: string, body: string) => ({ path, source: `import { gql } from "graphql-modules";\nexport const x = gql\`\n${body}\n\`;\n` });

describe("results rendered from an inline listing", () => {
  it("conforms and renders the listing inside the result, next to a spread", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "inline-listing.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities.find((e) => e.graphqlType === "Work")!, "x");
    expect(work).toContain(
      ["        ... on Person {", "          intialValues {", '            name: keyValue(key: "name", source: metadata)', '            life_dates: keyValue(key: "life_dates", source: metadata)'].join("\n"),
    );
    expect(work).toContain("          }\n          relationValues\n          allowedViewModes {");
    // the buttons form of the menu follows the fields; a link action has no action kind
    expect(work).toContain('        ... on Corporation {\n          ...minimalCorporation\n          teaserMetadata {\n            name: metaData {\n              label(input: "metadata.labels.name")\n              key(input: "name")\n            }\n            buttons {\n              contextMenu {\n                doLinkAction {\n                  label(input: "contextMenu.contextMenuLinkAction.followLink")\n                  icon(input: "AngleRight")\n                  __typename\n                }\n              }\n            }\n          }\n        }');
    expect(work).toContain("        uuid\n        type\n        relationValues\n        ... on Person {");
    // the inline listings are not files of their own
    const root = mkdtempSync(join(tmpdir(), "elody-inline-"));
    mkdirSync(join(root, "src", "ui"), { recursive: true });
    writeFileSync(join(root, "src", "ui", "x.ui.ttl"), fixture);
    await generate({ root });
    expect(readdirSync(join(root, "src", "queries", "entities"))).toEqual(["work.queries.ts"]);
  });

  it("compares spreads in any order", () => {
    const a = readDefinitions([gqlFile("entities/a.queries.ts", "fragment minimalA on A { ...minimalBaseEntity ...minimalACore }")]).definitions;
    const b = readDefinitions([gqlFile("entities/a.queries.ts", "fragment minimalA on A { ...minimalACore ...minimalBaseEntity }")]).definitions;
    expect(compareDefinitions(a, b).definitions[0].status).toBe("equal");
  });
});
