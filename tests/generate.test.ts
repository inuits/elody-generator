/**
 * The build switch: a client without src/ui/*.ui.ttl is untouched; with one,
 * `generate` writes the documents and `check` reports drift.
 */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate.js";
import { migrateDeclaration } from "../src/migrate.js";

const legacy = readFileSync(join(__dirname, "fixtures", "dishacled", "dishacled.legacy.ui.ttl"), "utf-8");

const client = (withDeclaration: boolean) => {
  const root = mkdtempSync(join(tmpdir(), "elody-ui-"));
  mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
  writeFileSync(join(root, "src", "queries", "entities", "handwritten.queries.ts"), "// hand-written\n");
  if (withDeclaration) {
    mkdirSync(join(root, "src", "ui"));
    writeFileSync(join(root, "src", "ui", "dishacled.ui.ttl"), migrateDeclaration(legacy).ttl);
  }
  return root;
};

describe("generate / check", () => {
  it("leaves a client without a declaration untouched", async () => {
    const root = client(false);
    const result = await generate({ root });
    expect(result.declaration).toBeUndefined();
    expect(readdirSync(join(root, "src", "queries", "entities"))).toEqual(["handwritten.queries.ts"]);
  });

  it("writes the documents, then check is clean", async () => {
    const root = client(true);
    const written = await generate({ root });
    expect(written.changed.sort()).toEqual([
      "src/queries/entities/alert.queries.ts",
      "src/queries/entities/githubProcessor.queries.ts",
      "src/queries/entities/pipeline.queries.ts",
    ]);
    for (const name of ["alert", "githubProcessor", "pipeline"])
      expect(readFileSync(join(root, "src/queries/entities", `${name}.queries.ts`), "utf-8")).toBe(
        readFileSync(join(__dirname, "golden", "dishacled", `${name}.queries.ts`), "utf-8"),
      );
    expect((await generate({ root, check: true })).clean).toBe(true);
  });

  it("check fails on a hand edit of a generated document", async () => {
    const root = client(true);
    await generate({ root });
    const file = join(root, "src/queries/entities/alert.queries.ts");
    writeFileSync(file, readFileSync(file, "utf-8") + "\n# edited\n");
    const result = await generate({ root, check: true });
    expect(result.clean).toBe(false);
    expect(result.changed).toEqual(["src/queries/entities/alert.queries.ts"]);
  });
});

describe("generate: linked-data sources", () => {
  it("writes the sources collection-api reads (SPARQL_SOURCES) next to the declaration", async () => {
    const { fromShacl } = await import("../src/fromShacl.js");
    const shapes = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> .
@prefix elody: <https://elody.eu/ns/ui#> . @prefix obo: <http://purl.obolibrary.org/obo/> .
ex:DrugShape a sh:NodeShape ; sh:targetClass ex:Drug ;
  sh:property [ sh:path ex:name ; sh:name "Name"@en ; sh:maxCount 1 ] ,
    [ sh:path ex:impactedCell ; sh:name "Impacted cell"@en ; sh:maxCount 1 ;
      sh:rootClass obo:CL_0000000 ; shui:editor shui:SubClassEditor ;
      elody:classSource <https://ubergraph.apps.renci.org/sparql> ] .`;
    const { ttl } = await fromShacl(shapes, { id: "drug", documentName: "Drug" });
    const root = mkdtempSync(join(tmpdir(), "elody-ui-"));
    mkdirSync(join(root, "src", "ui"), { recursive: true });
    writeFileSync(join(root, "src", "ui", "drug.ui.ttl"), ttl);
    const result = await generate({ root });
    expect(result.changed).toContain("src/ui/sparqlSources.json");
    const sources = JSON.parse(readFileSync(join(root, "src", "ui", "sparqlSources.json"), "utf-8"));
    expect(Object.keys(sources)).toEqual(["drugImpactedCell"]);
    expect(sources.drugImpactedCell.endpoint).toBe("https://ubergraph.apps.renci.org/sparql");
    expect(result.changed).toContain("src/queries/entities/drugImpactedCell.queries.ts");
    expect((await generate({ root, check: true })).clean).toBe(true);
  });
});
export { cpSync };
