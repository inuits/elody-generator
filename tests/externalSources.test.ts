/**
 * Values a field finds in a linked-data source, live (examples 16 and the live
 * shui:SubClassEditor). The generator gives each such property:
 *  - a source description for collection-api (SPARQL_SOURCES): the endpoint,
 *    the query naming the candidates and the one finding them for a search
 *    term, as the shapes state them;
 *  - a searchable relation dropdown on the source's Elody type;
 *  - a small entity UI for that type (its title is the resource's label), so a
 *    chosen value shows by its label and opens.
 *
 * shui:searchQuery (and sh:in [ sh:select ]) whose pattern lies in one SERVICE
 * block run against that endpoint. A shui:SubClassEditor reads its class tree
 * live when elody:classSource names an endpoint; without it the tree is read
 * when generating.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { Parser, Writer } from "n3";
import { expandExternalSources } from "../src/externalSources.js";
import { validateDeclaration } from "../src/validate.js";

const example = (id: string) => readFileSync(join(__dirname, "..", "spec", "examples", `${id}.shapes.ttl`), "utf-8");
const LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const convert = async (shapes: string, documentName: string) => {
  const result = await fromShacl(shapes, { id: "x", documentName });
  return { ...result, ...(await readUiDeclaration(result.ttl)) };
};
const formField = (declaration: Awaited<ReturnType<typeof convert>>, key: string) => {
  const field = declaration.entities[0].createForms[0].fields.find((f) => f.key === key)!;
  return declaration.inputFields[field.inputType] as Record<string, unknown>;
};

describe("shui:searchQuery against a SPARQL endpoint (example 16)", () => {
  it("describes the source: the endpoint of the SERVICE block, both queries without it, IRIs as identifiers", async () => {
    const { sources } = await convert(example("16-search-query"), "SpecE16");
    const source = sources.specE16Creator;
    expect(source.endpoint).toBe("http://example.com/sparql");
    expect(source.selectQuery).toMatch(/PREFIX ex: <http:\/\/example\.com\/>/);
    expect(source.selectQuery).toMatch(/\?value a ex:Person/);
    expect(source.searchQuery).toMatch(/\?value text:query \(\$searchTerm \$uiLanguage\)/);
    for (const query of [source.selectQuery, source.searchQuery]) expect(query).not.toMatch(/SERVICE/);
    expect(source.identifierEncoding).toBe("iri");
    expect(source.fields).toEqual({ title: LABEL, iri: "@iri" });
  });

  it("is a searchable relation dropdown on the source's type", async () => {
    const declaration = await convert(example("16-search-query"), "SpecE16");
    const input = formField(declaration, "creator");
    expect(input.type).toBe("dropdownMultiselectRelations");
    expect(input.relationType).toBe("hasCreator");
    expect(input.advancedFilterInputForRetrievingOptions).toEqual([{ type: "type", value: "specE16Creator" }]);
    expect(input.advancedFilterInputForSearchingOptions).toEqual({
      type: "text",
      key: ["elody:1|metadata.title.value"],
      value: "*",
      match_exact: false,
      item_types: ["specE16Creator"],
    });
    // shown and edited: only the resources this entity's relation points to
    expect(input.relationFilter).toEqual({
      type: "selection",
      key: ["elody:1|identifiers"],
      value: "$relationValues.hasCreator.key",
      match_exact: true,
      item_types: ["specE16Creator"],
    });
  });

  it("a relation dropdown on sh:class is limited to the entity's own relations too", async () => {
    const shapes = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
ex:S a sh:NodeShape ; sh:targetClass ex:Book ; sh:property [ sh:path ex:author ; sh:name "Author" ; sh:class ex:Person ; sh:maxCount 1 ] .`;
    const declaration = await convert(shapes, "SpecBook");
    expect(formField(declaration, "author").relationFilter).toEqual({
      type: "selection",
      key: ["elody:1|identifiers"],
      value: "$relationValues.hasAuthor.key",
      match_exact: true,
      item_types: ["person"],
    });
  });

  it("gives the source's type an entity UI titled by the resource's label", async () => {
    const { entities } = await convert(example("16-search-query"), "SpecE16");
    const option = entities.find((e) => e.documentName === "SpecE16Creator")!;
    const file = renderEntityFile(option, "x");
    expect(file).toContain('title: keyValue(key: "title", source: metadata)');
    expect(file).toContain('iri: keyValue(key: "iri", source: metadata');
  });

  it("shows a chosen value on the detail page by its title", async () => {
    const { entities } = await convert(example("16-search-query"), "SpecE16");
    const creator = entities[0].properties.find((p) => p.key === "creator")!;
    expect(creator.relationType).toBe("hasCreator");
    expect(creator.valueLabelKey).toBe("title");
  });

  it("is not a gap any more", async () => {
    const { findings } = await convert(example("16-search-query"), "SpecE16");
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
    expect(findings.find((f) => /searchQuery/.test(f.message))?.message).toMatch(/http:\/\/example\.com\/sparql/);
  });

  it("stays a gap when the query mixes the endpoint with patterns of its own", async () => {
    const shapes = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> .
ex:S a sh:NodeShape ; sh:targetClass ex:Book ; sh:property [ sh:path ex:author ; sh:name "Author" ;
  shui:searchQuery """SELECT ?value WHERE { ?value ex:local ?x . SERVICE <http://example.com/sparql> { ?value ex:name $searchTerm } }""" ] .`;
    const { findings, sources } = await convert(shapes, "SpecMixed");
    expect(Object.keys(sources)).toEqual([]);
    expect(findings.some((f) => f.kind === "gap" && /searchQuery/.test(f.message))).toBe(true);
  });
});

describe("shui:SubClassEditor read live (elody:classSource)", () => {
  const shapes = (cardinality: string) => `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> . @prefix shui: <http://www.w3.org/ns/shacl-ui/> .
@prefix elody: <https://elody.eu/ns/ui#> . @prefix obo: <http://purl.obolibrary.org/obo/> .
ex:DrugShape a sh:NodeShape ; sh:targetClass ex:Drug ;
  sh:property [ sh:path ex:impactedCell ; sh:name "Impacted cell"@en ; ${cardinality}
    sh:rootClass obo:CL_0000000 ; shui:editor shui:SubClassEditor ;
    elody:classSource <https://ubergraph.apps.renci.org/sparql> ] .`;

  it("reads the root and its subclasses from the endpoint, and searches them by label", async () => {
    const { sources } = await convert(shapes("sh:maxCount 1 ;"), "SpecDrug");
    const source = sources.specDrugImpactedCell;
    expect(source.endpoint).toBe("https://ubergraph.apps.renci.org/sparql");
    expect(source.selectQuery).toContain("rdfs:subClassOf* <http://purl.obolibrary.org/obo/CL_0000000>");
    expect(source.searchQuery).toContain("$searchTerm");
    expect(source.searchQuery).toContain("rdfs:subClassOf* <http://purl.obolibrary.org/obo/CL_0000000>");
    expect(source.identifierEncoding).toBe("iri");
  });

  it("is a searchable relation dropdown, one class with sh:maxCount 1", async () => {
    const declaration = await convert(shapes("sh:maxCount 1 ;"), "SpecDrug");
    const input = formField(declaration, "impactedCell");
    expect(input.type).toBe("dropdownSingleselectRelations");
    expect(input.options).toBeUndefined();
    expect(input.advancedFilterInputForRetrievingOptions).toEqual([{ type: "type", value: "specDrugImpactedCell" }]);
  });

  it("gives the source's type its own GraphQL type when the entity has one (BaseEntity stays BaseEntity)", async () => {
    const { ttl } = await fromShacl(shapes("sh:maxCount 1 ;"), { id: "x", documentName: "SpecDrug" });
    const own = await readUiDeclaration(ttl.replace('elody:graphqlType "BaseEntity"', 'elody:graphqlType "Drug"'));
    expect(own.entities.find((e) => e.documentName === "SpecDrugImpactedCell")!.graphqlType).toBe("SpecDrugImpactedCell");
    const shared = await readUiDeclaration(ttl);
    expect(shared.entities.find((e) => e.documentName === "SpecDrugImpactedCell")!.graphqlType).toBe("BaseEntity");
  });

  it("notes that the tree is read live", async () => {
    const { findings } = await convert(shapes(""), "SpecDrug");
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
    expect(findings.find((f) => /SubClassEditor/.test(f.message))?.message).toMatch(/live/);
  });
});

describe("the spelled-out declaration", () => {
  it("conforms to the meta-shapes, so a source can also be declared by hand", async () => {
    const { ttl } = await fromShacl(example("16-search-query"), { id: "x", documentName: "SpecE16" });
    const quads = new Parser().parse(ttl);
    const spelled = new Writer().quadsToString([...quads, ...expandExternalSources(quads)]);
    const report = await validateDeclaration(spelled);
    expect(report.issues.map((issue) => issue.message)).toEqual([]);
    expect(report.conforms).toBe(true);
  });
});
