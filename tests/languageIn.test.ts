/**
 * sh:languageIn as a language preference (SHACL 1.2 UI, Language Resolution):
 * implementations MUST prefer literals in the order of sh:languageIn, before
 * the application's language. Two places in Elody:
 *
 * - field labels are resolved when generating: every translation bundle gets
 *   the label text in the sh:languageIn order first, then its own language;
 * - values are resolved in the PWA: the field carries languageIn, and the
 *   multilingual field shows the first declared language that has a value.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderCreateForm, renderEntityFile } from "../src/render.js";

const example = (part: "shapes" | "data") =>
  readFileSync(join(__dirname, "..", "spec", "examples", `10-lang-resolution.${part}.ttl`), "utf-8");
const convert = () =>
  fromShacl(example("shapes"), { id: "e10", documentName: "SpecE10", data: example("data"), focus: "http://example.org/ns#alice" });

describe("sh:languageIn", () => {
  it("makes the field multilingual and carries the language order", async () => {
    const { entities } = await readUiDeclaration((await convert()).ttl);
    const name = entities[0].properties.find((p) => p.key === "name")!;
    expect(name.multilingual).toBe(true);
    expect(name.languageIn).toEqual(["fr", "en"]);
    expect(entities[0].createForms[0].fields.find((f) => f.key === "name")?.languageIn).toEqual(["fr", "en"]);
  });

  it("renders languageIn on the detail panel, the teaser and the create form", async () => {
    const { entities } = await readUiDeclaration((await convert()).ttl);
    const file = renderEntityFile(entities[0], "x.ui.ttl");
    const detail = file.slice(file.indexOf("entityView"));
    expect(detail).toMatch(/name: metaData \{[^}]*languageIn\(input: \["fr", "en"\]\)/);
    const teaser = file.slice(file.indexOf("teaserMetadata"), file.indexOf("entityView"));
    expect(teaser).toMatch(/name: metaData \{[^}]*languageIn\(input: \["fr", "en"\]\)/);
    expect(renderCreateForm(entities[0].createForms[0])).toMatch(/name: metaData \{[^}]*languageIn\(input: \["fr", "en"\]\)/);
  });

  it("resolves the label in every bundle in the sh:languageIn order first", async () => {
    const { translations } = await readUiDeclaration((await convert()).ttl);
    expect(translations.fr?.["ui.specE10.name"]).toBe("Nom");
    // the English bundle too: the shape prefers French over the interface language
    expect(translations.en?.["ui.specE10.name"]).toBe("Nom");
  });

  it("leaves labels per language without sh:languageIn", async () => {
    const shapes = example("shapes").replace(/sh:languageIn \( "fr" "en" \) ;/, "");
    const { ttl } = await fromShacl(shapes, { id: "e10", documentName: "SpecE10" });
    const { translations, entities } = await readUiDeclaration(ttl);
    expect(translations.en?.["ui.specE10.name"]).toBe("Name");
    expect(translations.fr?.["ui.specE10.name"]).toBe("Nom");
    expect(entities[0].properties[0].languageIn).toEqual([]);
  });

  it("keeps every language of the spec data as one multilingual sample value", async () => {
    const { sample } = await convert();
    expect(sample.name).toEqual([
      { value: "Alice", lang: "en" },
      { value: "Alice", lang: "fr" },
    ]);
  });

  it("no longer notes that Elody ignores the language order", async () => {
    const { notes } = await convert();
    expect(notes.join("\n")).not.toMatch(/languageIn/);
  });
});
