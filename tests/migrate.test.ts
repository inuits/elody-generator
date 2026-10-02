/**
 * Migration proof: the retired dishacled declaration, migrated to the 0.1
 * vocabulary, (1) conforms to the meta-shapes, (2) produces no retired-term
 * warnings, and (3) renders byte-identically to the reference output.
 * The un-migrated file must fail validation.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { migrateDeclaration } from "../src/migrate.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const legacy = readFileSync(join(__dirname, "fixtures", "dishacled", "dishacled.legacy.ui.ttl"), "utf-8");
const golden = join(__dirname, "golden", "dishacled");

describe("migrateDeclaration on dishacled", () => {
  const migrated = migrateDeclaration(legacy);

  it("the legacy file fails the meta-shapes", async () => {
    const report = await validateDeclaration(legacy);
    expect(report.conforms).toBe(false);
  });

  it("the migrated file conforms to the meta-shapes", async () => {
    const report = await validateDeclaration(migrated.ttl);
    expect(report.issues.map(formatIssue)).toEqual([]);
    expect(report.conforms).toBe(true);
  });

  it("the migrated file reads without retired-term warnings", () => {
    const { warnings } = readUiDeclaration(migrated.ttl);
    expect(warnings.map((warning) => warning.message)).toEqual([]);
  });

  it.each(["alert", "githubProcessor", "pipeline"])("renders %s.queries.ts identically after migration", (name) => {
    const { entities } = readUiDeclaration(migrated.ttl);
    const type = name.charAt(0).toUpperCase() + name.slice(1);
    const entity = entities.find((candidate) => candidate.graphqlType === type)!;
    expect(renderEntityFile(entity, "src/ui/dishacled.ui.ttl")).toBe(
      readFileSync(join(golden, `${name}.queries.ts`), "utf-8"),
    );
  });
});

describe("the retired dialect fails validation term by term", () => {
  it("names every retired term and the legacy namespace", async () => {
    const report = await validateDeclaration(legacy);
    const messages = report.issues.map((issue) => issue.message);
    expect(messages[0]).toMatch(/legacy namespace https:\/\/elody\.io\/ns\/ui#/);
    for (const term of ["elody:hidden", "elody:formatter", "elody:createForm", "elody:inputType", "elody:required", "elody:typeModal", "elody:actionType", "elody:panelType", "elody:editable", "elody:tooltip", "elody:defaultValue", "elody:repetitiveForm", "elody:pickerQuery", "elody:pickerList", "elody:filtersQueryName", "elody:type", "elody:searchInputType", "elody:formQuery"])
      expect(messages.some((message) => message.startsWith(`${term} is retired`)), term).toBe(true);
    expect(messages.some((message) => message.startsWith("elody:mode takes an elody:ViewMode instance"))).toBe(true);
    expect(messages.some((message) => message.startsWith("elody:filterKind takes an elody:FilterKind instance"))).toBe(true);
  });
});
