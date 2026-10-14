/**
 * G-034 (remainder): an option search with further inputs (a value a key must hold, as a string
 * or a list) and operators on the search, the inputs and the type input.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("option search inputs", () => {
  it("conforms and renders the inputs between the search and the type, with their operators", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "validation-and-options.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const tip = renderEntityFile(entities[0], "x");
    expect(tip).toContain(
      [
        "        advancedFilterInputForRetrievingOptions: [",
        "          {",
        "            type: text",
        '            key: ["elody:1|properties.code.value"]',
        '            value: "*"',
        '            distinct_by: "properties.code.value"',
        "            match_exact: false",
        "            operator: or",
        "          }",
        "          {",
        "            type: selection",
        '            key: ["elody:1|properties.level.value"]',
        '            value: ["Rug", "Groeirubriek"]',
        '            distinct_by: "properties.level.value"',
        "            match_exact: true",
        "          }",
        "          {",
        "            type: text",
        '            key: ["elody:1|properties.target_audience.value"]',
        '            value: "ZIZO jeugd"',
        "            match_exact: true",
        "            operator: or",
        "          }",
        '          { type: type, value: "zizo", operator: and }',
        "        ]",
      ].join("\n"),
    );
    // scoped by an input over the key "type" instead of a type input
    expect(tip).toContain(
      [
        "          {",
        "            type: text",
        '            key: ["elody:1|properties.life_dates.value"]',
        '            value: "*"',
        '            distinct_by: "properties.life_dates.value"',
        "            match_exact: false",
        "          }",
        "          {",
        "            type: selection",
        '            key: ["type"]',
        '            value: ["person", "corporation"]',
        "          }",
        "        ]",
      ].join("\n"),
    );
  });

  it("extracts an option search without a type input as the search and its inputs", () => {
    const files = [
      {
        path: "queries/entities/person.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const person = gql\`
  fragment minimalPerson on Person { id uuid type teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } } }
  fragment filtersForPerson on Person {
    advancedFilters {
      life_dates: advancedFilter(type: selection key: ["vlacc:1|properties.life_dates.value"] label: "metadata.labels.life-dates" selectionOption: auto isDisplayedByDefault: true
        filterOptionsMapping: { label: "intialValues.life_dates" value: "intialValues.life_dates" }
        advancedFilterInputForRetrievingOptions: [{ type: text key: ["vlacc:1|properties.life_dates.value"] value: "*" distinct_by: "properties.life_dates.value" match_exact: false } { type: selection, key: "type", value: ["person", "corporation"] }]) { ...advancedFilter }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("cannot say"))).toEqual([]);
    expect(ttl).not.toContain("elody:optionsType");
    expect(ttl).toContain('elody:optionsKey "vlacc:1|properties.life_dates.value" ;');
    expect(ttl).toContain('elody:optionsInput [ sh:order 1 ; elody:inputKind elody:SelectionFilter ; elody:key "type" ; elody:value ( "person" "corporation" ) ] ;');
  });
});
