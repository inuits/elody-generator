/**
 * The generator reads three standard terms instead of elody: constructs:
 *  1. sh:group + sh:PropertyGroup → a detail panel; fields in their own sh:order
 *  2. sh:name is the human label (per language); the metadata key comes from
 *     sh:path (or elody:key); elody:labelKey is the Elody translation key
 *  3. create-form widgets come from the SHACL 1.2 UI scoring system
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderCreateForm, renderDetailView, renderTeaserFields } from "../src/render.js";
import { validateDeclaration } from "../src/validate.js";

const PREFIXES = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ex: <urn:ex:> . @prefix ui: <urn:ui:> .`;

const thing = (extra = "") => `${PREFIXES}
ui:ThingUi a elody:EntityUi ; elody:graphqlType "Thing" ; elody:emit "file" ;
  elody:viewMode [ elody:mode elody:ListView ] ;
  sh:property
    [ sh:path ex:title ; sh:name "Title"@en , "Titel"@nl ; sh:order 1 ;
      shui:propertyRole shui:LabelRole ; sh:group ui:Info ] ,
    [ sh:path ex:repo ; sh:name "Repository"@en ; elody:labelKey "metadata.labels.repository" ;
      sh:order 3 ; sh:group ui:Info ] ,
    [ sh:path ex:owner ; elody:key "owner_name" ; sh:order 2 ; sh:group ui:Info ] ,
    [ sh:path ex:stars ; sh:order 4 ] ;
  elody:detail [ elody:column [ elody:size elody:Width100 ;
    elody:element [ a elody:WindowElement ; elody:panel ui:Info ] ] ] .
ui:Info a sh:PropertyGroup ; rdfs:label "Information"@en , "Informatie"@nl ; sh:order 1 ;
  elody:alias "info" ; elody:panelKind elody:MetadataPanel ; dash:readOnly true ; elody:collapsed false .
${extra}`;

describe("1 · sh:group and sh:PropertyGroup become panels", () => {
  it("renders the group as the panel, with its properties in their own sh:order", async () => {
    const { entities } = await readUiDeclaration(thing());
    const rendered = renderDetailView(entities[0], 4);
    expect(rendered).toContain("info: panels {");
    expect(rendered).toContain("isEditable(input: false)");
    const order = ["title", "owner_name", "repo"].map((key) => rendered.indexOf(`key(input: "${key}")`));
    expect(order.every((position, i) => position > -1 && (i === 0 || position > order[i - 1]))).toBe(true);
    expect(rendered).not.toContain('key(input: "stars")');
  });

  it("validates, and rejects a property in two groups (SHACL allows one sh:group)", async () => {
    expect((await validateDeclaration(thing())).issues.map((issue) => issue.message)).toEqual([]);
    const twice = thing().replace("sh:order 4 ]", "sh:order 4 ; sh:group ui:Info , ui:Other ]");
    expect((await validateDeclaration(twice)).conforms).toBe(false);
  });
});

describe("2 · sh:name is the label, sh:path the key", () => {
  it("takes the metadata key from the sh:path local name, or elody:key", async () => {
    const { entities } = await readUiDeclaration(thing());
    expect(entities[0].properties.map((property) => property.key)).toEqual(["title", "owner_name", "repo", "stars"]);
  });

  it("uses elody:labelKey as the translation key, and mints one from sh:name otherwise", async () => {
    const { entities, translations } = await readUiDeclaration(thing());
    const labels = Object.fromEntries(entities[0].properties.map((property) => [property.key, property.label]));
    expect(labels.repo).toBe("metadata.labels.repository");
    expect(labels.title).toBe("ui.thing.title");
    expect(translations).toMatchObject({
      en: { "ui.thing.title": "Title", "metadata.labels.repository": "Repository", "ui.thing.group.info": "Information" },
      nl: { "ui.thing.title": "Titel", "ui.thing.group.info": "Informatie" },
    });
    expect(renderTeaserFields(entities[0], 6)).toContain('label(input: "ui.thing.title")');
  });

  it("reads the old use (rdfs:label as translation key, sh:name as key) with warnings", async () => {
    const { entities, warnings } = await readUiDeclaration(`${PREFIXES}
      ui:T a elody:EntityUi ; elody:graphqlType "T" ; elody:viewMode [ elody:mode elody:ListView ] ;
        sh:property [ sh:name "legacy_key" ; rdfs:label "metadata.labels.x" ; shui:propertyRole shui:LabelRole ] .`);
    expect(entities[0].properties[0]).toMatchObject({ key: "legacy_key", label: "metadata.labels.x" });
    expect(warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/rdfs:label on a property shape/),
        expect.stringMatching(/sh:name used as the metadata key/),
      ]),
    );
  });

  it("generate writes the sh:name texts into the client's translation files, only where they differ", async () => {
    const root = mkdtempSync(join(tmpdir(), "elody-ui-labels-"));
    mkdirSync(join(root, "src", "ui"), { recursive: true });
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    mkdirSync(join(root, "src", "translations"));
    writeFileSync(join(root, "src", "ui", "thing.ui.ttl"), thing());
    const en = { en: { metadata: { labels: { repository: "Repository" } }, other: "kept" } };
    writeFileSync(join(root, "src", "translations", "en.json"), JSON.stringify(en, null, 2) + "\n");
    await generate({ root });
    const written = JSON.parse(readFileSync(join(root, "src", "translations", "en.json"), "utf-8"));
    expect(written.en.ui.thing.title).toBe("Title");
    expect(written.en.other).toBe("kept");
    expect(JSON.parse(readFileSync(join(root, "src", "translations", "nl.json"), "utf-8")).nl.ui.thing.title).toBe("Titel");
    expect((await generate({ root, check: true })).clean).toBe(true);
  });
});

describe("3 · create-form widgets from the scoring system", () => {
  const form = (field: string) => `${PREFIXES}
    ui:T a elody:EntityUi ; elody:graphqlType "T" ; elody:viewMode [ elody:mode elody:ListView ] ;
      sh:property [ sh:path ex:name ; shui:propertyRole shui:LabelRole ] ; elody:form ui:CreateT .
    ui:CreateT a elody:Form ; elody:shape [ sh:property [ sh:path ex:f ; ${field} ] ] .`;
  const fieldOf = async (field: string) => (await readUiDeclaration(form(field))).entities[0].createForms[0].fields[0];

  it("sh:singleLine false scores the text area (30)", async () => {
    expect((await fieldOf("sh:datatype xsd:string ; sh:singleLine false")).inputType).toBe("baseTextareaField");
  });

  it("an xsd:anyURI literal gets the default text field, as the spec scores no editor for it", async () => {
    const field = await fieldOf("sh:datatype xsd:anyURI");
    expect(field.inputType).toBe("baseTextField");
  });

  it("renders the field's label from sh:name through a minted key", async () => {
    const { entities } = await readUiDeclaration(form(`sh:datatype xsd:string ; sh:name "Field"@en`));
    expect(renderCreateForm(entities[0].createForms[0])).toContain('label(input: "ui.t.f")');
  });
});

describe("shui:defaultOrder in the declaration", () => {
  const ordered = (config: string) => `${PREFIXES}
    ui:T a elody:EntityUi ; elody:graphqlType "T" ; elody:viewMode [ elody:mode elody:ListView ] ;
      sh:property [ sh:path ex:description ; sh:order 5 ] , [ sh:path ex:id ; sh:order -10 ] ,
                  [ sh:path ex:label ; shui:propertyRole shui:LabelRole ] .
    ${config}`;

  it("puts properties without sh:order last when no default is configured", async () => {
    const { entities } = await readUiDeclaration(ordered(""));
    expect(entities[0].properties.map((p) => p.key)).toEqual(["id", "description", "label"]);
  });

  it("gives them shui:defaultOrder when the declaration configures it (spec example)", async () => {
    const { entities } = await readUiDeclaration(ordered("ui:config a shui:Configuration ; shui:defaultOrder 0 ."));
    expect(entities[0].properties.map((p) => p.key)).toEqual(["id", "label", "description"]);
  });
});
