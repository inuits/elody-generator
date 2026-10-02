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

  it("the migrated file reads without retired-term warnings", async () => {
    const { warnings } = await readUiDeclaration(migrated.ttl);
    expect(warnings.map((warning) => warning.message)).toEqual([]);
  });

  it.each(["alert", "githubProcessor", "pipeline"])("renders %s.queries.ts identically after migration", async (name) => {
    const { entities } = await readUiDeclaration(migrated.ttl);
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

describe("migration to the standard terms (sh:name, sh:path, sh:group)", () => {
  const translations = { en: { metadata: { labels: { name: "Name", description: "Description" } }, "panel-labels": { "pipeline-info": "Pipeline info" } } };
  const migrated = migrateDeclaration(legacy, undefined, { translations });

  it("turns panels whose field order follows sh:order into sh:PropertyGroups", () => {
    expect(migrated.ttl).toMatch(/ui:PipelineUi-info\s+a sh:PropertyGroup/);
    expect(migrated.ttl).toMatch(/sh:group ui:PipelineUi-info/);
  });

  it("keeps an explicit field list where the panel's order differs, and says so", () => {
    expect(migrated.ttl).not.toMatch(/ui:ComponentUi-repoInfo/);
    expect(migrated.notes.some((note) => note.includes('panel "repoInfo"'))).toBe(true);
  });

  it("moves translation keys to elody:labelKey and fills sh:name per language from the client's bundle", () => {
    // on property shapes (filters and overview fields are elody: nodes and keep rdfs:label as their key)
    expect(migrated.ttl).not.toMatch(/sh:path [^;\]]*;[^\]]*rdfs:label "metadata\.labels/);
    expect(migrated.ttl).toMatch(/elody:labelKey "metadata\.labels\.name"/);
    expect(migrated.ttl).toMatch(/sh:name "Name"@en/);
    expect(migrated.ttl).toMatch(/rdfs:label "Pipeline info"@en/);
  });

  it("still renders every document identically", async () => {
    const { entities, warnings } = await readUiDeclaration(migrated.ttl);
    expect(warnings).toEqual([]);
    for (const name of ["alert", "githubProcessor", "pipeline"]) {
      const type = name.charAt(0).toUpperCase() + name.slice(1);
      expect(renderEntityFile(entities.find((e) => e.graphqlType === type)!, "src/ui/dishacled.ui.ttl"), name).toBe(
        readFileSync(join(golden, `${name}.queries.ts`), "utf-8"),
      );
    }
    expect((await validateDeclaration(migrated.ttl)).issues.map(formatIssue)).toEqual([]);
  });
});

describe("migrating an already migrated declaration", () => {
  const once = migrateDeclaration(legacy, undefined, {
    translations: { en: { metadata: { labels: { name: "Name" } } } },
  });

  it("is idempotent", () => {
    expect(migrateDeclaration(once.ttl).ttl).toBe(once.ttl);
  });

  it("turns a panel that references its fields by sh:path into a group once the order matches", async () => {
    // swap repository (3) and description (2) on the component, as a client would to align card and panel
    const swapped = once.ttl
      .replace(/(sh:path em:description ;[^\]]*?sh:order )2( ;[^\]]*?sh:group|\s*;)/, "$13$2")
      .replace(/(sh:path em:repository ;[^\]]*?sh:order )3/, "$12");
    const again = migrateDeclaration(swapped);
    expect(again.ttl).toMatch(/ui:ComponentUi-repoInfo\s+a sh:PropertyGroup/);
    expect(again.notes.some((note) => note.includes('"repoInfo"'))).toBe(false);
    const { entities } = await readUiDeclaration(again.ttl);
    const component = entities.find((entity) => entity.graphqlType === "GithubProcessor")!;
    const panel = component.detail!.columns[0].elements[0].panels.find((p) => p.alias === "repoInfo")!;
    expect(panel.fields).toEqual(["name", "repository", "description", "url", "owner", "language", "stars", "defaultBranch"]);
  });
});
