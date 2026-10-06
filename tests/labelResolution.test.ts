/**
 * SHACL 1.2 UI label resolution (feature 4).
 *
 * Property labels: the label properties (shui:labelPreference, default
 * sh:name) on the property shape, then on the predicate in the data graph,
 * then in the shapes graph, then the predicate's local name. Elody resolves
 * them when generating: fromShacl carries the label triples about the
 * predicates into the declaration, the generator writes the texts into the
 * translation bundles.
 *
 * Value-node labels: a value that is an IRI is labelled by the LabelRole
 * property of its node shape, then by the label properties (default
 * rdfs:label), then by its local name. For a related Elody entity the
 * generator turns that chain into metadata keys (metadataKeyAsLabel); for
 * the IRIs of an sh:in list it resolves the labels from the shapes graph.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderInitialValues } from "../src/render.js";

const prefixes = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
`;
const person = (property: string, extra = "") => `${prefixes}
ex:PersonShape a sh:NodeShape ; sh:targetClass ex:Person ;
  sh:property [ sh:path ex:name ; sh:name "name"@en ; sh:order 0 ] , [ ${property} ; sh:order 1 ] .
${extra}`;
const read = async (shapes: string, data?: string) => {
  const { ttl } = await fromShacl(shapes, { id: "p", documentName: "SpecPerson", data, nodeShape: "http://example.org/ns#PersonShape" });
  return readUiDeclaration(ttl);
};
const second = async (shapes: string, data?: string) => {
  const parsed = await read(shapes, data);
  return { ...parsed, property: parsed.entities[0].properties.find((p) => p.key !== "name")! };
};

describe("property labels", () => {
  it("take the predicate's label in the shapes graph when the property shape has none", async () => {
    const { property, translations } = await second(
      person("sh:path ex:givenName", 'ex:givenName sh:name "Given name"@en , "Voornaam"@nl .'),
    );
    expect(property.label).toBe("ui.specPerson.givenName");
    expect(translations.en?.["ui.specPerson.givenName"]).toBe("Given name");
    expect(translations.nl?.["ui.specPerson.givenName"]).toBe("Voornaam");
  });

  it("use the configured label properties (shui:labelPreference) on the predicate", async () => {
    const { property, translations } = await second(
      person(
        "sh:path ex:givenName",
        `ex:givenName rdfs:label "Given name"@en .
         ex:config a shui:Configuration ; shui:labelPreference ( rdfs:label ) .`,
      ),
    );
    expect(property.label).toBe("ui.specPerson.givenName");
    expect(translations.en?.["ui.specPerson.givenName"]).toBe("Given name");
  });

  it("do not read rdfs:label on the predicate unless it is configured (the default is sh:name)", async () => {
    const { property } = await second(person("sh:path ex:givenName", 'ex:givenName rdfs:label "Given name"@en .'));
    expect(property.label).toBeUndefined(); // rendered as the local name
  });

  it("use shui:labelPreference on the property shape itself, instead of sh:name", async () => {
    const { property, translations } = await second(
      person(
        'sh:path ex:givenName ; sh:name "Given"@en ; skos:prefLabel "Voornaam"@nl',
        "ex:config a shui:Configuration ; shui:labelPreference ( skos:prefLabel ) .",
      ),
    );
    expect(property.label).toBe("ui.specPerson.givenName");
    expect(translations.nl?.["ui.specPerson.givenName"]).toBe("Voornaam");
    expect(translations.en?.["ui.specPerson.givenName"]).toBeUndefined();
  });

  it("take the predicate's label from the data graph", async () => {
    const { property, translations } = await second(
      person("sh:path ex:givenName"),
      `${prefixes} ex:givenName sh:name "Given name (data)"@en .`,
    );
    expect(property.label).toBe("ui.specPerson.givenName");
    expect(translations.en?.["ui.specPerson.givenName"]).toBe("Given name (data)");
  });

  it("fall back to the predicate's local name for an inverse path", async () => {
    const { property } = await second(person("sh:path [ sh:inversePath ex:member ] ; sh:class ex:Department"));
    expect(property.key).toBe("isMemberFor");
    expect(property.label).toBe("member");
  });
});

describe("value-node labels of related entities", () => {
  const department = `
ex:DepartmentShape a sh:NodeShape ; sh:targetClass ex:Department ;
  sh:property [ sh:path ex:deptName ; shui:propertyRole shui:LabelRole ] .`;

  it("start with the LabelRole property of the related class's node shape", async () => {
    const { entities } = await read(person("sh:path [ sh:inversePath ex:member ] ; sh:class ex:Department", department));
    expect(renderInitialValues(entities[0], 0)).toContain('metadataKeyAsLabel: "deptName|label|title|name"');
  });

  it("then use the label properties (default rdfs:label), then Elody's title and name", async () => {
    const { entities } = await read(person("sh:path [ sh:inversePath ex:member ] ; sh:class ex:Department"));
    expect(renderInitialValues(entities[0], 0)).toContain('metadataKeyAsLabel: "label|title|name"');
  });

  it("follow shui:labelPreference", async () => {
    const { entities } = await read(
      person(
        "sh:path ex:department ; sh:class ex:Department",
        "ex:config a shui:Configuration ; shui:labelPreference ( skos:prefLabel dcterms:title ) .",
      ),
    );
    expect(renderInitialValues(entities[0], 0)).toContain('metadataKeyAsLabel: "prefLabel|title|name"');
  });
});

describe("value-node labels of sh:in options", () => {
  it("resolve IRI options from the shapes graph, else their local name", async () => {
    const { inputFields, translations } = await read(
      person(
        "sh:path ex:status ; sh:in ( ex:Draft ex:Published ) ; sh:maxCount 1",
        'ex:Draft rdfs:label "Draft"@en , "Ontwerp"@nl .',
      ),
    );
    expect(inputFields.specPersonStatusField.options).toEqual([
      { label: "ui.specPerson.status.Draft", value: "http://example.org/ns#Draft" },
      { label: "Published", value: "http://example.org/ns#Published" },
    ]);
    expect(translations.nl?.["ui.specPerson.status.Draft"]).toBe("Ontwerp");
  });

  it("keep literal options as they are", async () => {
    const { inputFields } = await read(person('sh:path ex:size ; sh:in ( "S" "M" ) ; sh:maxCount 1'));
    expect(inputFields.specPersonSizeField.options).toEqual([
      { label: "S", value: "S" },
      { label: "M", value: "M" },
    ]);
  });

  it("do not turn a SHACL 1.2 node expression (sh:in [ sh:select … ]) into options", async () => {
    const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "16-search-query.shapes.ttl"), "utf-8");
    const { ttl } = await fromShacl(shapes, { id: "e16", documentName: "SpecE16" });
    const { inputFields, warnings, entities } = await readUiDeclaration(ttl);
    expect(JSON.stringify(inputFields)).not.toMatch(/n3-|_:/);
    expect(entities[0].createForms[0]?.fields.find((f) => f.key === "creator")?.inputType).toBe("baseTextField");
    expect(warnings.map((w) => w.message).join("\n")).toMatch(/node expression/);
  });
});
