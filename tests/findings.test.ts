/**
 * What fromShacl reports about a shapes graph, by kind. Only "gap" — a
 * SHACL UI feature Elody does not support — makes an example "rendered in
 * part". The others are not shortcomings:
 *  - notApplicable: a setting for applications that write RDF themselves
 *    (shui:timeZone, shui:defaultNamespace, shui:readOnlyGraph);
 *  - handled: a third-party widget Elody does not know is left out and the
 *    scoring picks another, as the spec intends (Elody's own widgets work the
 *    same way: shui:editor elody:ColorEditor);
 *  - choice: complex paths, left out to keep view and edit symmetric;
 *  - info: what Elody chose where the shapes leave it open.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";

const example = (id: string) => readFileSync(join(__dirname, "..", "spec", "examples", `${id}.shapes.ttl`), "utf-8");
const kindsOf = async (id: string) => {
  const { findings } = await fromShacl(example(id), { id: "e", documentName: "SpecE" });
  return findings;
};

describe("findings by kind", () => {
  it("example 04: configuration for RDF writers is not applicable, the third-party editor is handled", async () => {
    const findings = await kindsOf("04-global-configuration");
    const kind = (pattern: RegExp) => findings.find((f) => pattern.test(f.message))?.kind;
    expect(kind(/shui:timeZone/)).toBe("notApplicable");
    expect(kind(/shui:defaultNamespace/)).toBe("notApplicable");
    expect(kind(/MyCustomEditor/)).toBe("handled");
    expect(kind(/shui:languagePreference/)).toBe("info");
    expect(findings.filter((f) => f.kind === "gap")).toEqual([]);
  });

  it("a SHACL UI widget Elody does not implement is a gap", async () => {
    const findings = await kindsOf("27-SubClassEditor");
    expect(findings.some((f) => f.kind === "gap" && /SubClassEditor/.test(f.message))).toBe(true);
  });

  it("a complex path is left out by choice", async () => {
    const findings = await kindsOf("08-edit-alternative-paths");
    expect(findings.find((f) => /alternative path/.test(f.message))?.kind).toBe("choice");
  });

  it("keeps notes as the plain messages", async () => {
    const { notes, findings } = await fromShacl(example("04-global-configuration"), { id: "e", documentName: "SpecE" });
    expect(notes).toEqual(findings.map((f) => f.message));
  });
});

describe("shui:languagePreference", () => {
  const shapes = `
@prefix ex: <http://example.org/ns#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
ex:config a shui:Configuration ; shui:languagePreference ( "de" "fr" ) .
ex:PersonShape a sh:NodeShape ; sh:targetClass ex:Person ;
  sh:property [ sh:path ex:name ; sh:name "Nom"@fr ; sh:datatype xsd:string ; sh:maxCount 1 ] .`;

  it("is the fallback order of the label texts: a bundle without its own text gets the preferred one", async () => {
    const { ttl } = await fromShacl(shapes, { id: "p", documentName: "SpecPerson" });
    const { translations } = await readUiDeclaration(ttl);
    expect(translations.fr?.["ui.specPerson.name"]).toBe("Nom");
    expect(translations.de?.["ui.specPerson.name"]).toBe("Nom");
  });
});

describe("shui:searchQuery", () => {
  it("is handled when the field has sh:class: Elody's relation dropdown searches that type live (example 15)", async () => {
    const findings = await kindsOf("15-search-query");
    const search = findings.find((f) => /searchQuery/.test(f.message))!;
    expect(search.kind).toBe("handled");
    expect(search.message).toMatch(/relation dropdown searches Elody's own index/);
  });

  it("is a gap when it searches an external SPARQL endpoint (SERVICE) Elody does not query (example 16)", async () => {
    const findings = await kindsOf("16-search-query");
    const search = findings.find((f) => /searchQuery/.test(f.message))!;
    expect(search.kind).toBe("gap");
    expect(search.message).toMatch(/external SPARQL endpoint/);
    expect(search.message).not.toMatch(/relation dropdown/);
  });
});
