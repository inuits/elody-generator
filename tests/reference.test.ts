/**
 * The reference: every kind of node the meta-shapes check gets a section, every property of the
 * vocabulary is listed somewhere (or named as unlisted on the index), links between pages resolve,
 * and the sidebar is what the docs site imports.
 */
import { describe, expect, it } from "vitest";
import { curie, readReference, renderReference } from "../src/reference.js";

describe("the generated reference", () => {
  const reference = readReference();
  const pages = renderReference(reference, { basePath: "/ref/" });

  it("names terms by prefix", () => {
    expect(curie("https://elody.eu/ns/ui#alias")).toBe("elody:alias");
    expect(curie("http://www.w3.org/ns/shacl#order")).toBe("sh:order");
    expect(curie("http://example.org/x")).toBe("<http://example.org/x>");
  });

  it("reads the vocabulary, the shapes and the bindings", () => {
    expect(reference.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(reference.terms.get("https://elody.eu/ns/ui#EntityUi")?.kind).toBe("class");
    expect(reference.terms.get("https://elody.eu/ns/ui#graphqlType")?.kind).toBe("datatype");
    expect(reference.terms.get("https://elody.eu/ns/ui#ListView")?.instanceOf).toBe("https://elody.eu/ns/ui#ViewMode");
    expect(reference.terms.get("https://elody.eu/ns/ui#ListView")?.bindings).toContainEqual({ predicate: "elody:enumValue", value: "ViewModesList" });
    const entityUi = reference.shapes.get("https://elody.eu/ns/ui/shapes#EntityUiShape")!;
    expect(entityUi.targetClasses).toEqual(["https://elody.eu/ns/ui#EntityUi"]);
    expect(entityUi.properties.find((p) => curie(p.path) === "elody:graphqlType")).toMatchObject({ minCount: 1, maxCount: 1 });
    expect(reference.shapes.get("https://elody.eu/ns/ui/shapes#PanelShape")!.usedBy.map((u) => u.shape)).toContain("ElementShape");
    // the # comment above an entry in the shapes file travels with it
    expect(reference.shapes.get("https://elody.eu/ns/ui/shapes#PanelShape")!.properties.find((p) => curie(p.path) === "elody:panelKind")?.note).toMatch(/platform's default/);
  });

  it("renders a page per area, the enumerations, the retired terms and the index", () => {
    for (const file of ["index.md", "entity-ui.md", "properties.md", "detail-page.md", "filters.md", "bulk-operations.md", "forms.md", "guided-flows.md", "list-queries.md", "fragments.md", "app.md", "enumerations.md", "retired.md", "sidebar.json"]) expect([...pages.keys()], file).toContain(file);
    expect(pages.get("detail-page.md")).toMatch(/### Panel\n/);
    expect(pages.get("detail-page.md")).toMatch(/### List Element\n/);
    expect(pages.get("filters.md")).toMatch(/### Filter\n/);
    expect(pages.get("enumerations.md")).toMatch(/### elody:ViewMode\n[\s\S]*`elody:ListView`/);
    expect(pages.get("retired.md")).toMatch(/`elody:hidden`/);
    const sidebar = JSON.parse(pages.get("sidebar.json")!) as { text: string; link: string }[];
    expect(sidebar[0]).toEqual({ text: "Overview", link: "/ref/" });
    expect(sidebar.map((s) => s.link)).toContain("/ref/filters");
  });

  it("lists every property of the vocabulary somewhere", () => {
    const text = [...pages.values()].join("\n");
    const missing = [...reference.terms.values()].filter((t) => (t.kind === "datatype" || t.kind === "object") && !text.includes(`\`${t.name}\``)).map((t) => t.name);
    expect(missing).toEqual([]);
  });

  it("links only to sections that exist", () => {
    const anchors = new Map<string, Set<string>>();
    for (const [file, content] of pages) {
      if (!file.endsWith(".md")) continue;
      anchors.set(file, new Set([...content.matchAll(/^### (.+)$/gm)].map((m) => m[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))));
    }
    const broken: string[] = [];
    for (const [file, content] of pages) {
      if (!file.endsWith(".md")) continue;
      for (const match of content.matchAll(/\]\((?:\.\/([a-z-]+\.md))?#([a-z0-9-]+)\)/g)) {
        const target = match[1] ?? file;
        if (!anchors.get(target)?.has(match[2])) broken.push(`${file}: ${match[0]}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
