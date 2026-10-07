/**
 * shui:SubClassEditor: a class IRI, chosen from sh:rootClass and its
 * subclasses (rdfs:subClassOf*). A renderer offers the classes in the graphs
 * it is given; Elody reads them when generating, as it does for sh:in, and
 * renders a dropdown in tree order, the depth shown by indentation. The value
 * is the class IRI.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";

const PREFIXES = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`;
const HIERARCHY = `
ex:Animal rdfs:label "Animal"@en .
ex:Mammal rdfs:subClassOf ex:Animal ; rdfs:label "Mammal"@en .
ex:Dog rdfs:subClassOf ex:Mammal ; rdfs:label "Dog"@en .
ex:Cat rdfs:subClassOf ex:Mammal ; rdfs:label "Cat"@en .
ex:Bird rdfs:subClassOf ex:Animal ; rdfs:label "Bird"@en .
ex:Rock rdfs:label "Rock"@en .`;
const shape = (cardinality = "sh:maxCount 1 ;") => `${PREFIXES}
ex:PetShape a sh:NodeShape ; sh:targetClass ex:Pet ;
  sh:property [ sh:path ex:kind ; sh:name "Kind"@en ; ${cardinality}
    sh:rootClass ex:Animal ; shui:editor shui:SubClassEditor ] .`;

const convert = async (shapes: string, data?: string) => {
  const result = await fromShacl(shapes, { id: "s", documentName: "SpecPet", data });
  const declaration = await readUiDeclaration(result.ttl);
  return { ...result, ...declaration, entity: declaration.entities[0] };
};
const text = (translations: Record<string, Record<string, string>>, key: string) => translations.en?.[key] ?? key;

describe("shui:SubClassEditor", () => {
  it("is a dropdown of the root class and its subclasses, in tree order, the value the class IRI", async () => {
    const { entity, inputFields, translations } = await convert(shape() + HIERARCHY);
    const field = entity.createForms[0].fields.find((f) => f.key === "kind")!;
    const input = inputFields[field.inputType] as { type: string; options: { label: string; value: string }[] };
    expect(input.type).toBe("dropdown");
    expect(input.options.map((o) => o.value)).toEqual([
      "http://example.org/ns#Animal",
      "http://example.org/ns#Bird",
      "http://example.org/ns#Mammal",
      "http://example.org/ns#Cat",
      "http://example.org/ns#Dog",
    ]);
    // the depth shows in the label: the root flush left, each level indented
    const labels = input.options.map((o) => text(translations, o.label));
    expect(labels[0]).toBe("Animal");
    expect(labels[2]).toMatch(/^\S.*Mammal$|^\s+.*Mammal$/);
    expect(labels[3].indexOf("Cat")).toBeGreaterThan(labels[2].indexOf("Mammal"));
    expect(labels.some((label) => label.includes("Rock"))).toBe(false);
  });

  it("allows several classes without sh:maxCount 1", async () => {
    const { entity, inputFields } = await convert(shape("") + HIERARCHY);
    const field = entity.createForms[0].fields.find((f) => f.key === "kind")!;
    expect((inputFields[field.inputType] as { type: string }).type).toBe("dropdownMultiselectMetadata");
  });

  it("reads the hierarchy from the data graph too", async () => {
    const { entity, inputFields } = await convert(shape(), `${PREFIXES}${HIERARCHY}`);
    const field = entity.createForms[0].fields.find((f) => f.key === "kind")!;
    expect((inputFields[field.inputType] as { options: unknown[] }).options).toHaveLength(5);
  });

  it("example 27: no gap; only the root is offered, as the shapes carry no hierarchy", async () => {
    const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "27-SubClassEditor.shapes.ttl"), "utf-8");
    const { findings, entity, inputFields } = await convert(shapes);
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
    expect(findings.find((f) => /SubClassEditor/.test(f.message))?.kind).toBe("info");
    const field = entity.createForms[0].fields[0];
    expect((inputFields[field.inputType] as { options: { value: string }[] }).options.map((o) => o.value)).toEqual([
      "http://purl.obolibrary.org/obo/CL_0000000",
    ]);
  });
});
