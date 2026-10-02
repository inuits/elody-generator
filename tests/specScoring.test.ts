/**
 * The SHACL 1.2 UI score function, run on the official scoring graph, gives
 * the scores the spec lists per built-in widget.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { DataFactory } from "n3";
import { describe, expect, it } from "vitest";
import { Scorer } from "../src/score.js";

const { namedNode, literal } = DataFactory;
const ex = (name: string) => namedNode(`http://example.org/ns#${name}`);
const shui = (name: string) => `http://www.w3.org/ns/shacl-ui/${name}`;
const xsd = (name: string) => namedNode(`http://www.w3.org/2001/XMLSchema#${name}`);
const example = (file: string) => readFileSync(join(__dirname, "..", "spec", "examples", file), "utf-8");

const scorerFor = (file: string) => Scorer.fromTurtle(example(file));
const scoreOf = (results: { widget: string; score: number }[], widget: string) =>
  results.find((result) => result.widget === shui(widget))?.score;

describe("score function on the spec's widget examples", () => {
  it("BooleanEditor: 10 from sh:datatype, 20 with a boolean value", async () => {
    const scorer = await scorerFor("18-BooleanEditor.shapes.ttl");
    expect(scoreOf(await scorer.editors(ex("Person-married")), "BooleanEditor")).toBe(10);
    expect(scoreOf(await scorer.editors(ex("Person-married"), literal("true", xsd("boolean"))), "BooleanEditor")).toBe(20);
  });

  it("DatePickerEditor / DateTimePickerEditor: 10 from sh:datatype", async () => {
    expect((await (await scorerFor("19-DatePickerEditor.shapes.ttl")).editors(ex("Person-dateOfBirth")))[0].widget).toBe(shui("DatePickerEditor"));
    expect((await (await scorerFor("20-DateTimePickerEditor.shapes.ttl")).editors(ex("Customer-lastVisitTime")))[0].widget).toBe(shui("DateTimePickerEditor"));
  });

  it("EnumSelectEditor: 30 for sh:in", async () => {
    const results = await (await scorerFor("22-EnumSelectEditor.shapes.ttl")).editors(ex("AustralianAddressShape-addressRegion"));
    expect(results[0]).toMatchObject({ widget: shui("EnumSelectEditor"), score: 30 });
  });

  it("an explicit shui:editor scores 40 and wins", async () => {
    for (const [file, shape, widget] of [
      ["23-InstancesSelectEditor.shapes.ttl", "Person-homeCountry", "InstancesSelectEditor"],
      ["24-IRIEditor.shapes.ttl", "Thing-seeAlso", "IRIEditor"],
      ["25-NumberFieldEditor.shapes.ttl", "Product-price", "NumberFieldEditor"],
      ["27-SubClassEditor.shapes.ttl", "Drug-impactedCell", "SubClassEditor"],
    ]) {
      const results = await (await scorerFor(file)).editors(ex(shape));
      expect(results[0], widget).toMatchObject({ widget: shui(widget), score: 40 });
    }
  });

  it("sh:class alone: InstancesSelectEditor is applicable but discouraged (0), AutoComplete needs sh:nodeKind sh:IRI", async () => {
    const results = await (await scorerFor("17-AutoCompleteEditor.shapes.ttl")).editors(ex("Person-bornIn"));
    expect(scoreOf(results, "InstancesSelectEditor")).toBe(0);
    expect(scoreOf(results, "AutoCompleteEditor")).toBeUndefined();
  });

  it("TextAreaEditor with sh:singleLine false: 30, also without a value (the matcher then checks only the shape)", async () => {
    const scorer = await scorerFor("28-TextAreaEditor.shapes.ttl");
    const empty = await scorer.editors(ex("Country-description"));
    expect(empty[0]).toMatchObject({ widget: shui("TextAreaEditor"), score: 30 });
    expect(scoreOf(await scorer.editors(ex("Country-description"), literal("A long text")), "TextAreaEditor")).toBe(30);
  });

  it("TextFieldEditor: 10 from xsd:string; TextFieldWithLangEditor: 10 from rdf:langString", async () => {
    expect(scoreOf(await (await scorerFor("29-TextFieldEditor.shapes.ttl")).editors(ex("Country-code")), "TextFieldEditor")).toBe(10);
    expect(scoreOf(await (await scorerFor("30-TextFieldWithLangEditor.shapes.ttl")).editors(ex("Concept-prefLabel")), "TextFieldWithLangEditor")).toBe(10);
  });

  it("RichTextEditor: 10 from sh:datatype rdf:HTML", async () => {
    const results = await (await scorerFor("26-RichTextEditor.shapes.ttl")).editors(ex("Concept-definition"));
    expect(results[0]).toMatchObject({ widget: shui("RichTextEditor"), score: 10 });
  });

  it("ValueTableViewer: 40 when declared", async () => {
    const results = await (await scorerFor("31-ValueTableViewer.shapes.ttl")).viewers(ex("Concept-broader-inverse"));
    expect(results[0]).toMatchObject({ widget: shui("ValueTableViewer"), score: 40 });
  });

  it("scoring graph preparation: a custom declared editor scores 40", async () => {
    const results = await (await scorerFor("04-global-configuration.shapes.ttl")).editors(ex("PersonShapeName"));
    expect(results[0]).toMatchObject({ widget: "http://example.org/ns#MyCustomEditor", score: 40 });
  });

  it("viewers from the value: LiteralViewer 1 for any literal, HyperlinkViewer 20 for xsd:anyURI", async () => {
    const scorer = await scorerFor("29-TextFieldEditor.shapes.ttl");
    expect(scoreOf(await scorer.viewers(ex("Country-code"), literal("BE")), "LiteralViewer")).toBe(1);
    expect(scoreOf(await scorer.viewers(ex("Country-code"), literal("https://x.org", xsd("anyURI"))), "HyperlinkViewer")).toBe(20);
  });
});

describe("SHACL 1.2 constructs in the scoring graph", () => {
  it("a language-tagged value scores TextFieldWithLangEditor 30 (sh:datatype with a list of datatypes)", async () => {
    const scorer = await scorerFor("30-TextFieldWithLangEditor.shapes.ttl");
    const results = await scorer.editors(ex("Concept-prefLabel"), literal("Hond", "nl"));
    expect(results[0]).toMatchObject({ widget: shui("TextFieldWithLangEditor"), score: 30 });
  });
});
