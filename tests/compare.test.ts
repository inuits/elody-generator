/**
 * `compare`: the structural comparison between the GraphQL a client uses today
 * and the GraphQL generated from its declaration. Per definition (fragment or
 * operation, by name): equal, differs (with the path to the first difference),
 * missing (only in the client), extra (only generated) or out-of-scope (a gap).
 * Whitespace, comments, `__typename` and the quoting of string literals do not
 * count; field and argument order does.
 */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  compareClient,
  compareDefinitions,
  extractGqlDocuments,
  formatCompareReport,
  normalizeDefinition,
  queryFiles,
  readDefinitions,
} from "../src/compare.js";
import { parse } from "graphql";

const gqlFile = (name: string, body: string) => ({ path: name, source: `import { gql } from "graphql-modules";\n\nexport const q = gql\`\n${body}\n\`;\n` });
const definition = (body: string) => parse(body).definitions[0] as Parameters<typeof normalizeDefinition>[0];

describe("extractGqlDocuments", () => {
  it("returns every gql template literal of a TypeScript module, nothing else", () => {
    const source = [
      'import { gql } from "graphql-modules";',
      "const label = `not a document`;",
      "export const a = gql`",
      "  fragment a on A { id }",
      "`;",
      "export const b = gql`fragment b on B { id }`;",
    ].join("\n");
    expect(extractGqlDocuments(source).map((document) => document.trim())).toEqual([
      "fragment a on A { id }",
      "fragment b on B { id }",
    ]);
  });
});

describe("extractGqlDocuments: escapes", () => {
  it("cooks the escape sequences the way the gql tag receives them", () => {
    const source = "export const a = gql`\n  fragment a on A { label(input: \"a \\` b\") description(input: \"line\\nbreak\") }\n`;";
    expect(extractGqlDocuments(source)[0].trim()).toBe('fragment a on A { label(input: "a ` b") description(input: "line\nbreak") }');
  });
});

describe("readDefinitions", () => {
  it("collects fragments and operations by name, with their file and kind", () => {
    const { definitions, duplicates, errors } = readDefinitions([
      gqlFile("a.queries.ts", "fragment minimalA on A { id }\nquery getA { A { ...minimalA } }"),
      gqlFile("b.queries.ts", "mutation saveB($id: String!) { saveB(id: $id) }"),
    ]);
    expect(definitions.map((d) => [d.name, d.kind, d.file])).toEqual([
      ["minimalA", "fragment", "a.queries.ts"],
      ["getA", "query", "a.queries.ts"],
      ["saveB", "mutation", "b.queries.ts"],
    ]);
    expect(duplicates).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("reports a name defined in two files and keeps the first", () => {
    const { definitions, duplicates } = readDefinitions([
      gqlFile("a.queries.ts", "fragment shared on A { id }"),
      gqlFile("b.queries.ts", "fragment shared on A { uuid }"),
    ]);
    expect(definitions.map((d) => d.file)).toEqual(["a.queries.ts"]);
    expect(duplicates).toEqual([{ name: "shared", files: ["a.queries.ts", "b.queries.ts"] }]);
  });

  it("reports a file that does not parse instead of throwing", () => {
    const { definitions, errors } = readDefinitions([gqlFile("broken.queries.ts", "fragment { nope")]);
    expect(definitions).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBe("broken.queries.ts");
  });
});

describe("normalizeDefinition", () => {
  it("ignores whitespace, comments and __typename", () => {
    const sparse = definition("fragment a on A { id # the id\n\n  name {   first  __typename } __typename }");
    const dense = definition("fragment a on A{id name{first}}");
    expect(normalizeDefinition(sparse)).toBe(normalizeDefinition(dense));
  });

  it("treats a block string and a quoted string with the same text as equal", () => {
    const block = definition('fragment a on A { label(input: """metadata.title""") }');
    const quoted = definition('fragment a on A { label(input: "metadata.title") }');
    expect(normalizeDefinition(block)).toBe(normalizeDefinition(quoted));
  });

  it("ignores where a fragment is spread in a selection set", () => {
    const first = definition("fragment a on A { ...base x { y ...inner z } }");
    const last = definition("fragment a on A { x { ...inner y z } ...base }");
    expect(normalizeDefinition(first)).toBe(normalizeDefinition(last));
  });

  it("keeps the order where it decides what the user sees: card, panel, form fields, filters, elements", () => {
    const same = (a: string, b: string) => normalizeDefinition(definition(a)) === normalizeDefinition(definition(b));
    expect(same("fragment a on A { teaserMetadata { x: metaData { key(input: \"x\") } y: metaData { key(input: \"y\") } } }", "fragment a on A { teaserMetadata { y: metaData { key(input: \"y\") } x: metaData { key(input: \"x\") } } }")).toBe(false);
    expect(same("fragment a on A { entityView { column { elements { windowElement { label(input: \"w\") p: panels { x: metaData { key(input: \"x\") } y: metaData { key(input: \"y\") } } } } } } }", "fragment a on A { entityView { column { elements { windowElement { label(input: \"w\") p: panels { y: metaData { key(input: \"y\") } x: metaData { key(input: \"x\") } } } } } } }")).toBe(false);
    expect(same("query F { GetDynamicForm { t: formTab { formFields { x: metaData { key(input: \"x\") } y: metaData { key(input: \"y\") } } } } }", "query F { GetDynamicForm { t: formTab { formFields { y: metaData { key(input: \"y\") } x: metaData { key(input: \"x\") } } } } }")).toBe(false);
    expect(same("fragment a on A { advancedFilters { x: advancedFilter(type: text) { type } y: advancedFilter(type: text) { type } } }", "fragment a on A { advancedFilters { y: advancedFilter(type: text) { type } x: advancedFilter(type: text) { type } } }")).toBe(false);
    expect(same("fragment a on A { entityView { column { elements { a: entityListElement { label(input: \"a\") } b: entityListElement { label(input: \"b\") } } } } }", "fragment a on A { entityView { column { elements { b: entityListElement { label(input: \"b\") } a: entityListElement { label(input: \"a\") } } } } }")).toBe(false);
    // the values of an input list keep their order (sort options, view modes, bulk operations)
    expect(same("fragment a on A { sortOptions { options(input: [{ value: \"x\" }, { value: \"y\" }]) { value } } }", "fragment a on A { sortOptions { options(input: [{ value: \"y\" }, { value: \"x\" }]) { value } } }")).toBe(false);
  });

  it("ignores the order where the PWA reads an object by name: initial values, settings, arguments, input objects", () => {
    const same = (a: string, b: string) => normalizeDefinition(definition(a)) === normalizeDefinition(definition(b));
    expect(same("fragment a on A { intialValues { x: keyValue(key: \"x\") y: keyValue(key: \"y\") } }", "fragment a on A { intialValues { y: keyValue(key: \"y\") x: keyValue(key: \"x\") } }")).toBe(true);
    expect(same("fragment a on A { x: keyValue(key: \"k\", source: metadata) }", "fragment a on A { x: keyValue(source: metadata, key: \"k\") }")).toBe(true);
    expect(same("fragment a on A { intialValues { x } relationValues entityView { column { size(size: ten) elements { e: entityListElement { label(input: \"l\") searchInputType(input: \"s\") customQuery(input: \"q\") } } } } }", "fragment a on A { relationValues intialValues { x } entityView { column { elements { e: entityListElement { label(input: \"l\") customQuery(input: \"q\") searchInputType(input: \"s\") } } size(size: ten) } } }")).toBe(true);
    expect(same("fragment a on A { advancedFilters { t: advancedFilter(type: text) { type hidden(value: true) defaultValue(value: \"o\") } } }", "fragment a on A { advancedFilters { t: advancedFilter(type: text) { type defaultValue(value: \"o\") hidden(value: true) } } }")).toBe(true);
    expect(same("fragment a on A { entityView { column { elements { windowElement { label(input: \"w\") p: panels { isEditable(input: true) isCollapsed(input: false) x: metaData { key(input: \"x\") } } } } } } }", "fragment a on A { entityView { column { elements { windowElement { label(input: \"w\") p: panels { isCollapsed(input: false) x: metaData { key(input: \"x\") } isEditable(input: true) } } } } } }")).toBe(true);
    expect(same("fragment a on A { bulkOperationOptions { options(input: [{ icon: I, primary: true, label: \"l\" }]) { icon label primary } } }", "fragment a on A { bulkOperationOptions { options(input: [{ primary: true, icon: I, label: \"l\" }]) { primary icon label } } }")).toBe(true);
  });
});

describe("compareDefinitions", () => {
  const client = readDefinitions([
    gqlFile(
      "entities/alert.queries.ts",
      [
        "fragment minimalAlert on Alert { intialValues { message: keyValue(key: \"message\", source: metadata) created: keyValue(key: \"created\", source: metadata) } }",
        "fragment fullAlert on Alert { entityView { column { size: fifty } } }",
        "query getAlerts { Entities { ...minimalAlert } }",
      ].join("\n"),
    ),
    gqlFile("client.queries.ts", "query getTenants { Tenants { id } }"),
  ]).definitions;

  it("reports equal, differs with a path, missing and extra", () => {
    const generated = readDefinitions([
      gqlFile(
        "entities/alert.queries.ts",
        [
          "fragment minimalAlert on Alert { intialValues { message: keyValue(key: \"message\", source: metadata) created: keyValue(key: \"created\", source: metadata) } }",
          "fragment fullAlert on Alert { entityView { column { size: hundred } } }",
          "fragment extraAlert on Alert { id }",
        ].join("\n"),
      ),
    ]).definitions;
    const report = compareDefinitions(client, generated);
    const byName = Object.fromEntries(report.definitions.map((result) => [result.name, result]));
    expect(byName.minimalAlert.status).toBe("equal");
    expect(byName.fullAlert.status).toBe("differs");
    expect(byName.fullAlert.path).toBe('entityView > column > size > name > value: "fifty" vs "hundred"');
    expect(byName.getAlerts.status).toBe("missing");
    expect(byName.getTenants.status).toBe("missing");
    expect(byName.extraAlert.status).toBe("extra");
    expect(byName.extraAlert.generatedFile).toBe("entities/alert.queries.ts");
    expect(report.summary).toEqual({ total: 5, equal: 1, differs: 1, missing: 2, extra: 1, outOfScope: 0, percentEqual: 20 });
  });

  it("names a reordering as such, with both orders", () => {
    const card = (order: string) => gqlFile("entities/card.queries.ts", `fragment minimalCard on Card { teaserMetadata { ${order} } }`);
    const a = readDefinitions([card('x: metaData { key(input: "x") } y: metaData { key(input: "y") }')]).definitions;
    const b = readDefinitions([card('y: metaData { key(input: "y") } x: metaData { key(input: "x") }')]).definitions;
    const result = compareDefinitions(a, b).definitions.find((r) => r.name === "minimalCard")!;
    expect(result.status).toBe("differs");
    expect(result.path).toBe("teaserMetadata > order: [x, y] vs [y, x]");
  });

  it("says what the generated selection adds or lacks before descending into it", () => {
    const generated = readDefinitions([
      gqlFile(
        "entities/alert.queries.ts",
        "fragment minimalAlert on Alert { relationValues intialValues { message: keyValue(key: \"message\", source: metadata) } ...minimalBaseEntity }",
      ),
    ]).definitions;
    const result = compareDefinitions(client, generated).definitions.find((r) => r.name === "minimalAlert")!;
    expect(result.path).toBe("generated adds [relationValues, ...minimalBaseEntity]");
  });

  it("names an argument that differs", () => {
    const generated = readDefinitions([
      gqlFile(
        "entities/alert.queries.ts",
        "fragment minimalAlert on Alert { intialValues { message: keyValue(key: \"msg\", source: metadata) created: keyValue(key: \"created\", source: metadata) } }",
      ),
    ]).definitions;
    const result = compareDefinitions(client, generated).definitions.find((r) => r.name === "minimalAlert")!;
    expect(result.path).toBe('intialValues > message > @key > value: "message" vs "msg"');
  });

  it("puts a definition or a whole file out of scope with its gap, and counts them apart", () => {
    const report = compareDefinitions(client, [], {
      outOfScope: { getAlerts: "G-001" },
      outOfScopeFiles: { "client.queries.ts": "G-002" },
    });
    const byName = Object.fromEntries(report.definitions.map((result) => [result.name, result]));
    expect(byName.getAlerts).toMatchObject({ status: "out-of-scope", gap: "G-001" });
    expect(byName.getTenants).toMatchObject({ status: "out-of-scope", gap: "G-002" });
    expect(byName.minimalAlert.status).toBe("missing");
    expect(report.summary).toMatchObject({ total: 4, missing: 2, outOfScope: 2, percentEqual: 0 });
  });

  it("puts a generated definition the client lacks out of scope with its gap", () => {
    const generated = readDefinitions([gqlFile("entities/alert.queries.ts", "fragment filtersForAlert on Alert { id }")]).definitions;
    const report = compareDefinitions([], generated, { outOfScopeGenerated: { filtersForAlert: "G-009" } });
    expect(report.definitions[0]).toMatchObject({ status: "out-of-scope", gap: "G-009", generatedFile: "entities/alert.queries.ts" });
    expect(report.summary).toMatchObject({ total: 1, extra: 0, outOfScope: 1 });
  });

  it("rolls the results up per client file", () => {
    const report = compareDefinitions(client, [], { outOfScopeFiles: { "client.queries.ts": "G-002" } });
    expect(report.files).toEqual([
      { file: "client.queries.ts", status: "out-of-scope", definitions: 1, equal: 0, differs: 0, missing: 0, extra: 0, outOfScope: 1 },
      { file: "entities/alert.queries.ts", status: "missing", definitions: 3, equal: 0, differs: 0, missing: 3, extra: 0, outOfScope: 0 },
    ]);
  });
});

describe("formatCompareReport", () => {
  it("summarises per file and per status, with the first difference", () => {
    const generated = readDefinitions([
      gqlFile("entities/alert.queries.ts", "fragment fullAlert on Alert { entityView { column { size: hundred } } }"),
    ]).definitions;
    const client = readDefinitions([
      gqlFile("entities/alert.queries.ts", "fragment fullAlert on Alert { entityView { column { size: fifty } } }"),
    ]).definitions;
    const text = formatCompareReport({ client: "demo", declaration: "demo.ui.ttl", ...compareDefinitions(client, generated) });
    expect(text).toContain("demo: 0 of 1 equal (0%)");
    expect(text).toContain("entities/alert.queries.ts: differs");
    expect(text).toContain('fullAlert: differs at entityView > column > size > name > value: "fifty" vs "hundred"');
  });
});

describe("queryFiles", () => {
  it("finds every *.queries.ts below a directory, sorted, as relative paths", () => {
    const root = mkdtempSync(join(tmpdir(), "elody-compare-"));
    mkdirSync(join(root, "queries", "entities", "runners"), { recursive: true });
    writeFileSync(join(root, "queries", "b.queries.ts"), "");
    writeFileSync(join(root, "queries", "entities", "runners", "a.queries.ts"), "");
    writeFileSync(join(root, "queries", "entities", "other.ts"), "");
    expect(queryFiles(root)).toEqual(["queries/b.queries.ts", "queries/entities/runners/a.queries.ts"]);
  });
});

describe("compareClient: the dishacled golden", () => {
  it("generates the declaration and finds every golden definition equal", async () => {
    const root = mkdtempSync(join(tmpdir(), "elody-compare-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    cpSync(join(__dirname, "golden", "dishacled-example"), join(root, "src", "queries", "entities"), { recursive: true });
    const declaration = join(__dirname, "..", "examples", "dishacled.ui.ttl");
    const report = await compareClient({ client: "dishacled", declaration, clientSrc: join(root, "src") });
    expect(report.summary.differs).toBe(0);
    expect(report.summary.missing).toBe(0);
    expect(report.summary.extra).toBe(0);
    expect(report.summary.percentEqual).toBe(100);
    expect(report.summary.total).toBeGreaterThan(10);
    expect(report.files.map((file) => [file.file, file.status])).toEqual([
      ["queries/entities/alert.queries.ts", "equal"],
      ["queries/entities/githubProcessor.queries.ts", "equal"],
      ["queries/entities/pipeline.queries.ts", "equal"],
    ]);
  });

  it("sees a hand edit in the client as a difference", async () => {
    const root = mkdtempSync(join(tmpdir(), "elody-compare-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    cpSync(join(__dirname, "golden", "dishacled-example"), join(root, "src", "queries", "entities"), { recursive: true });
    const file = join(root, "src", "queries", "entities", "alert.queries.ts");
    writeFileSync(file, readFileSync(file, "utf-8").replace('key: "message"', 'key: "msg"'));
    const declaration = join(__dirname, "..", "examples", "dishacled.ui.ttl");
    const report = await compareClient({ client: "dishacled", declaration, clientSrc: join(root, "src") });
    expect(report.summary.differs).toBeGreaterThan(0);
    expect(report.definitions.filter((r) => r.status === "differs").map((r) => r.clientFile)).toContain(
      "queries/entities/alert.queries.ts",
    );
  });
});
