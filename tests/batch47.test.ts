/**
 * Batch 47: a declaration as a directory of files laid out like the client's GraphQL. The
 * dishacled golden, extracted into files, loads as one graph, validates and compares equal to
 * the golden; a node declared in two files is refused; the file of a query file is its mirror.
 */
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { describe, expect, it } from "vitest";
import { compareClient, readQueryFiles } from "../src/compare.js";
import { declarationFileFor, declarationFiles, declaredSubjects, loadDeclaration } from "../src/declarationFiles.js";
import { extractDeclaration, extractDeclarationFiles } from "../src/extract.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const golden = join(__dirname, "golden", "dishacled-example");

describe("a declaration as files laid out like the queries", () => {
  it("maps a client query file to its declaration file", () => {
    expect(declarationFileFor("queries/entities/work.queries.ts")).toBe("entities/work.ui.ttl");
    expect(declarationFileFor("/abs/src/queries/entities/sub/area.queries.ts")).toBe("entities/sub/area.ui.ttl");
    expect(declarationFileFor("queries/vlacc.queries.ts")).toBe("vlacc.ui.ttl");
    expect(declarationFileFor("other/dir/thing.ts")).toBe("thing.ui.ttl");
  });

  it("reads the nodes a file declares", () => {
    expect(declaredSubjects("@prefix ui: <urn:x#> .\n\nui:AlertUi\n  a elody:EntityUi ;\n  elody:graphqlType \"Alert\" .\n\nui:GetAlerts\n  elody:queryName \"GetAlerts\" .\n")).toEqual(["ui:AlertUi", "ui:GetAlerts"]);
  });

  it("extracts the golden into files that load as one graph and compare equal to it", async () => {
    const files = readQueryFiles(golden);
    const single = extractDeclaration(files, { namespace: "https://dishacled.github.io/demo/ui#" });
    const split = extractDeclarationFiles(files, { namespace: "https://dishacled.github.io/demo/ui#" });
    expect([...split.files.keys()].every((file) => file.endsWith(".ui.ttl"))).toBe(true);
    expect(split.files.size).toBeGreaterThan(1);
    // the same nodes, each declared once
    const declaredSplit = [...split.files.values()].flatMap(declaredSubjects).sort();
    expect(declaredSplit).toEqual(declaredSubjects(single.ttl).sort());
    expect(new Set(declaredSplit).size).toBe(declaredSplit.length);

    const root = mkdtempSync(join(tmpdir(), "elody-split-"));
    const dir = join(root, "ui");
    for (const [file, ttl] of split.files) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      writeFileSync(join(dir, file), ttl);
    }
    expect(declarationFiles(dir)).toEqual([...split.files.keys()].sort((a, b) => (a.includes("/") === b.includes("/") ? a.localeCompare(b) : a.includes("/") ? 1 : -1)));
    const ttl = loadDeclaration(dir);
    expect((await validateDeclaration(ttl)).issues.map(formatIssue)).toEqual([]);

    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    cpSync(golden, join(root, "src", "queries", "entities"), { recursive: true });
    const fromDir = await compareClient({ client: "golden", declaration: dir, clientSrc: join(root, "src") });
    const singleFile = join(root, "single.ui.ttl");
    writeFileSync(singleFile, single.ttl);
    const fromFile = await compareClient({ client: "golden", declaration: singleFile, clientSrc: join(root, "src") });
    const statuses = (report: typeof fromDir) => report.definitions.map((d) => `${d.name}:${d.status}`).sort();
    expect(statuses(fromDir)).toEqual(statuses(fromFile));
    expect(fromDir.definitions.filter((d) => d.status === "differs")).toEqual([]);
  });

  it("refuses a node declared in two files", () => {
    const dir = mkdtempSync(join(tmpdir(), "elody-dup-"));
    const node = "@prefix ui: <urn:x#> .\n@prefix elody: <https://elody.eu/ns/ui#> .\n\nui:AlertUi\n  a elody:EntityUi .\n";
    writeFileSync(join(dir, "a.ui.ttl"), node);
    writeFileSync(join(dir, "b.ui.ttl"), node);
    expect(() => loadDeclaration(dir)).toThrow(/ui:AlertUi is declared in both a\.ui\.ttl and b\.ui\.ttl/);
  });
});
