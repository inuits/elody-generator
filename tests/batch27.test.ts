/**
 * G-033: graph elements rendered — a chart over a data source with its series in order, an optional
 * filter, the time unit, the number of buckets and a unit conversion, on a detail page or in a preview.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("graph element", () => {
  it("conforms and renders the graph fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "graph.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "QuestionInstance")!, "x");
    expect(out).toMatch(/results: graphElement \{\n\s+label\(input: "graph-labels.results"\)\n\s+isCollapsed\(input: false\)\n\s+type\(input: bar\)\n\s+datasource\(input: "answers"\)\n\s+dataset\(input: \{ labels: \["basic=Aandeel \(%\)", "weighted=Gewogen aandeel \(%\)"\] \}\) \{\n\s+labels\n\s+\}\n\s+timeUnit\(input: hour\)\n\s+datapoints\(input: 0\)\n\s+\}/);
    expect(out).toMatch(/demographics: graphElement \{[\s\S]*?type\(input: line\)\n\s+datasource\(input: "demographics"\)\n\s+dataset\(input: \{ labels: \[\], filter: \{ key: "region", values: \["north", "south"\] \} \}\) \{\n\s+labels\n\s+\}\n\s+timeUnit\(input: month\)\n\s+datapoints\(input: 12\)\n\s+convert_to\(input: "percent"\)/);
  });

  it("extracts it back", () => {
    const files = [
      {
        path: "queries/entities/questionInstance.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const questionInstance = gql\`
  fragment minimalQuestionInstance on QuestionInstance {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullQuestionInstance on QuestionInstance {
    intialValues { title: keyValue(key: "title", source: metadata) }
    entityView {
      column {
        size(size: seventy)
        elements {
          results: graphElement {
            label(input: "graph-labels.results")
            isCollapsed(input: false)
            type(input: bar)
            datasource(input: "answers")
            dataset(input: { labels: ["basic=Aandeel (%)", "weighted=Gewogen aandeel (%)"] }) { labels }
            timeUnit(input: hour)
            datapoints(input: 0)
          }
          demographics: graphElement {
            label(input: "graph-labels.per-demographic")
            isCollapsed(input: false)
            type(input: bar)
            datasource(input: "demographics")
            dataset(input: { labels: [] }) { labels }
            timeUnit(input: hour)
            datapoints(input: 0)
          }
        }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("not rendered") || n.includes("holds nothing"))).toEqual([]);
    expect(ttl).toMatch(/\[ a elody:GraphElement ;\n\s+rdfs:label "graph-labels.results" ;\n\s+sh:order 1 ;\n\s+elody:collapsed false ;\n\s+elody:alias "results" ;\n\s+elody:graphType elody:BarGraph ;\n\s+elody:datasource "answers" ;\n\s+elody:datasetLabels \( "basic=Aandeel \(%\)" "weighted=Gewogen aandeel \(%\)" \) ;\n\s+elody:timeUnit elody:Hour ;\n\s+elody:datapoints 0 \]/);
    expect(ttl).toContain('elody:datasetLabels (  ) ;');
  });
});
