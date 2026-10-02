/**
 * The retired dialect (strings, name references, elody:hidden & co) is still
 * read for one release: the dishacled declaration as it was written renders
 * byte-identically to the reference generator's output (golden files), and
 * every retired term is reported as a warning.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";

const fixtures = join(__dirname, "fixtures", "dishacled");
const golden = join(__dirname, "golden", "dishacled");
const legacy = readFileSync(join(fixtures, "dishacled.legacy.ui.ttl"), "utf-8");

describe("legacy dialect", () => {
  const { entities, warnings } = readUiDeclaration(legacy);

  it("finds the three declared types", () => {
    expect(entities.map((entity) => entity.graphqlType).sort()).toEqual(["Alert", "GithubProcessor", "Pipeline"]);
  });

  it.each(["alert", "githubProcessor", "pipeline"])("renders %s.queries.ts byte-identically to the reference", (name) => {
    const type = name.charAt(0).toUpperCase() + name.slice(1);
    const entity = entities.find((candidate) => candidate.graphqlType === type)!;
    const expected = readFileSync(join(golden, `${name}.queries.ts`), "utf-8");
    expect(renderEntityFile(entity, "src/ui/dishacled.ui.ttl")).toBe(expected);
  });

  it("warns about the legacy namespace and every retired term it meets", () => {
    const messages = warnings.map((warning) => warning.message);
    expect(messages.some((message) => message.includes("legacy namespace https://elody.io/ns/ui#"))).toBe(true);
    for (const term of ["elody:hidden", "elody:formatter", "elody:createForm", "elody:inputType", "elody:required", "elody:typeModal", "elody:actionType", "elody:panelType", "elody:editable", "elody:tooltip", "elody:defaultValue", "elody:repetitiveForm", "elody:pickerQuery", "elody:pickerList", "elody:value", "elody:filtersQueryName", "elody:type", "elody:searchInputType"])
      expect(messages.some((message) => message.startsWith(`${term} is retired`)), term).toBe(true);
    expect(messages.some((message) => message.includes("elody:mode takes an elody:ViewMode instance"))).toBe(true);
    expect(messages.some((message) => message.includes("elody:filterKind takes an elody:FilterKind instance"))).toBe(true);
  });
});
