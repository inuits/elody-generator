/**
 * The build switch: a client without src/ui/*.ui.ttl is untouched; with one,
 * `generate` writes the documents and `check` reports drift.
 */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { generate } from "../src/generate.js";
import { migrateDeclaration } from "../src/migrate.js";

const legacy = readFileSync(join(__dirname, "fixtures", "dishacled", "dishacled.legacy.ui.ttl"), "utf-8");

const client = (withDeclaration: boolean) => {
  const root = mkdtempSync(join(tmpdir(), "elody-ui-"));
  mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
  writeFileSync(join(root, "src", "queries", "entities", "handwritten.queries.ts"), "// hand-written\n");
  if (withDeclaration) {
    mkdirSync(join(root, "src", "ui"));
    writeFileSync(join(root, "src", "ui", "dishacled.ui.ttl"), migrateDeclaration(legacy).ttl);
  }
  return root;
};

describe("generate / check", () => {
  it("leaves a client without a declaration untouched", () => {
    const root = client(false);
    const result = generate({ root });
    expect(result.declaration).toBeUndefined();
    expect(readdirSync(join(root, "src", "queries", "entities"))).toEqual(["handwritten.queries.ts"]);
  });

  it("writes the documents, then check is clean", () => {
    const root = client(true);
    const written = generate({ root });
    expect(written.changed.sort()).toEqual([
      "src/queries/entities/alert.queries.ts",
      "src/queries/entities/githubProcessor.queries.ts",
      "src/queries/entities/pipeline.queries.ts",
    ]);
    for (const name of ["alert", "githubProcessor", "pipeline"])
      expect(readFileSync(join(root, "src/queries/entities", `${name}.queries.ts`), "utf-8")).toBe(
        readFileSync(join(__dirname, "golden", "dishacled", `${name}.queries.ts`), "utf-8"),
      );
    expect(generate({ root, check: true }).clean).toBe(true);
  });

  it("check fails on a hand edit of a generated document", () => {
    const root = client(true);
    generate({ root });
    const file = join(root, "src/queries/entities/alert.queries.ts");
    writeFileSync(file, readFileSync(file, "utf-8") + "\n# edited\n");
    const result = generate({ root, check: true });
    expect(result.clean).toBe(false);
    expect(result.changed).toEqual(["src/queries/entities/alert.queries.ts"]);
  });
});
export { cpSync };
