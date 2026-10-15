/**
 * G-027: the last validation rule, has_min_max_amount_of_relations with its relation and bounds.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("a relation count between bounds", () => {
  it("renders has_min_max_amount_of_relations", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "field-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities } = await readUiDeclaration(fixture);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toContain('validation(input: { value: has_min_max_amount_of_relations, has_min_max_amount_of_relations: { relationType: "refLabelGenres", min: 0, max: 1 } }) {');
  });

  it("extracts it", () => {
    const files = [
      {
        path: "queries/entities/work.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment minimalWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) refLabelGenres: keyValue(key: "refLabelGenres", source: relations, keyAsLabel: { origin: metadata, key: "title" }) }
    entityView { column { size(size: seventy) elements { windowElement { label(input: "Info") info: panels { label(input: "panel-labels.info") panelType(input: metadata) isEditable(input: true) isCollapsed(input: false)
      refLabelGenres: metaData { label(input: "metadata.labels.genres") key(input: "refLabelGenres") inputField(type: genresTypeField) { ...inputfield validation(input: { value: has_min_max_amount_of_relations has_min_max_amount_of_relations: { relationType: "refLabelGenres" min: 0 max: 1 } }) { ...validation } } } } } } } }
  }
\`;\n`,
      },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl).toContain('    elody:validationRule "has_min_max_amount_of_relations" ;\n    elody:validationRelationType "refLabelGenres" ;\n    elody:validationMin 0 ;\n    elody:validationMax 1 ;');
  });
});
