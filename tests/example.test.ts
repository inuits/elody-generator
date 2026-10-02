/**
 * examples/dishacled.ui.ttl — the dishacled declaration in the standard terms:
 * every detail panel is a sh:PropertyGroup (repoInfo after aligning the
 * component's sh:order with the panel), labels are sh:name per language.
 * Compared with the reference output, only the order of two intialValues lines
 * moves (repository before description); nothing on screen changes.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const example = readFileSync(join(__dirname, "..", "examples", "dishacled.ui.ttl"), "utf-8");
const golden = (dir: string, name: string) => readFileSync(join(__dirname, "golden", dir, `${name}.queries.ts`), "utf-8");

describe("the dishacled example", () => {
  it("conforms, without any explicit panel field list", async () => {
    expect((await validateDeclaration(example)).issues.map(formatIssue)).toEqual([]);
    expect(example).not.toMatch(/elody:field\s/);
  });

  it.each(["alert", "githubProcessor", "pipeline"])("renders %s.queries.ts as recorded", async (name) => {
    const { entities, warnings } = await readUiDeclaration(example);
    expect(warnings).toEqual([]);
    const entity = entities.find((e) => e.graphqlType === name.charAt(0).toUpperCase() + name.slice(1))!;
    expect(renderEntityFile(entity, "src/ui/dishacled.ui.ttl")).toBe(golden("dishacled-example", name));
  });

  it("differs from the reference only in the order of the component's intialValues", () => {
    const sorted = (text: string) => text.split("\n").sort().join("\n");
    for (const name of ["alert", "githubProcessor", "pipeline"])
      expect(sorted(golden("dishacled-example", name)), name).toBe(sorted(golden("dishacled", name)));
    expect(golden("dishacled-example", "alert")).toBe(golden("dishacled", "alert"));
    expect(golden("dishacled-example", "pipeline")).toBe(golden("dishacled", "pipeline"));
  });
});
