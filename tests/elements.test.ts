/**
 * Every detail element of the Elody schema (EntityViewElements) has a class in
 * the ontology, linked to its GraphQL field by elody:schemaField. Elements the
 * generator cannot render yet are refused with a clear message instead of
 * silently falling back to a window element.
 */
import { describe, expect, it } from "vitest";
import { defaultOntology } from "../src/ontology.js";
import { readUiDeclaration } from "../src/parse.js";
import { validateDeclaration } from "../src/validate.js";
import { RDFS, elody } from "../src/vocab.js";

const SCHEMA_ELEMENTS = [
  "entityViewerElement", "markdownViewerElement", "manifestViewerElement", "entityListElement",
  "mediaFileElement", "singleMediaFileElement", "graphElement", "windowElement", "actionElement",
  "wysiwygElement", "mapElement", "hierarchyListElement", "commentsElement",
];

const o = defaultOntology();
const r = o.reading;
const elementClassFor = (field: string) => r.subjectsWith(elody("schemaField"), field)[0];

describe("detail elements in the ontology", () => {
  it.each(SCHEMA_ELEMENTS)("%s has an element class", (field) => {
    const cls = elementClassFor(field);
    expect(cls, field).toBeDefined();
    expect(r.values(cls, `${RDFS}subClassOf`)).toContain(elody("Element"));
    expect(r.value(cls, `${RDFS}comment`)).toBeTruthy();
  });

  it("keeps the shape element (ahead of master) linked as well", () => {
    expect(elementClassFor("shaclShapeElement")).toBe(elody("ShaclShapeElement"));
  });

  it.each([
    ["MapType", ["heatMap", "wktMap", "pointsMap"]],
    ["GraphType", ["bar", "bubble", "doughnut", "line", "pie", "polarArea", "radar", "scatter"]],
    ["TimeUnit", ["month", "hour", "dayOfYear", "dayOfWeek"]],
    ["MediaElementKind", ["map", "media"]],
    ["ElementAction", ["ocr", "download", "noActions"]],
    ["WysiwygExtension", ["color", "listItem", "textStyle", "starterKit", "bold", "italic", "paragraph", "doc", "text", "hardBreak", "elodyTaggingExtension"]],
  ])("enumerates every %s value as an instance", (cls, values) => {
    for (const value of values) expect(o.instanceFor(elody(cls), value), `${cls} ${value}`).toBeDefined();
  });
});

const declaration = (element: string) => `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
<urn:ui> a elody:EntityUi ; elody:graphqlType "Thing" ;
  elody:viewMode [ elody:mode elody:ListView ] ;
  sh:property [ sh:path <urn:p:title> ; sh:name "title" ; shui:propertyRole shui:LabelRole ] ;
  elody:detail [ elody:column [ elody:size elody:Width100 ; elody:element ${element} ] ] .`;

describe("declaring the new elements", () => {
  it("validates a map element with its kind and center", async () => {
    const report = await validateDeclaration(declaration(`[ a elody:MapElement ; rdfs:label "map" ; elody:mapType elody:PointsMap ; elody:center "51.05,3.72" ]`));
    expect(report.issues.map((issue) => issue.message)).toEqual([]);
  });

  it("validates a wysiwyg element and requires its metadata key", async () => {
    const ok = await validateDeclaration(declaration(`[ a elody:WysiwygElement ; rdfs:label "reading" ; elody:metadataKey "reading" ; elody:extension elody:StarterKitExtension ]`));
    expect(ok.conforms).toBe(true);
    const missing = await validateDeclaration(declaration(`[ a elody:WysiwygElement ; rdfs:label "reading" ]`));
    expect(missing.conforms).toBe(false);
  });

  it("validates a graph element and requires its chart kind", async () => {
    const ok = await validateDeclaration(declaration(`[ a elody:GraphElement ; rdfs:label "load" ; elody:graphType elody:LineGraph ; elody:datasource "measurements" ; elody:timeUnit elody:Hour ; elody:datapoints 24 ]`));
    expect(ok.issues.map((issue) => issue.message)).toEqual([]);
    const missing = await validateDeclaration(declaration(`[ a elody:GraphElement ; rdfs:label "load" ; elody:datasource "measurements" ]`));
    expect(missing.conforms).toBe(false);
  });

  it("refuses an element the generator cannot render yet, naming it", () => {
    expect(() => readUiDeclaration(declaration(`[ a elody:MapElement ; elody:mapType elody:PointsMap ]`))).toThrow(
      /elody:MapElement .* not rendered by the generator yet/,
    );
  });
});
