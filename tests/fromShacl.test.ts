/**
 * fromShacl keeps the ontology anchor: the entity UI is a sh:NodeShape with
 * the source node shape's sh:targetClass, so the declaration still says what
 * kind of thing the UI is about (and validates data of that class).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";

const shapes = readFileSync(join(__dirname, "..", "spec", "examples", "02-getting-started.shapes.ttl"), "utf-8");

describe("fromShacl on the spec's getting-started shapes", () => {
  it("carries sh:targetClass over to the entity UI", async () => {
    const { ttl } = await fromShacl(shapes, { id: "example02", documentName: "SpecExample02" });
    expect(ttl).toMatch(/ui:example02\s+a elody:EntityUi ;[\s\S]*?sh:targetClass schema:Person/);
  });

  it("writes every triple once", async () => {
    const { ttl } = await fromShacl(shapes, { id: "example02", documentName: "SpecExample02" });
    expect(ttl).not.toMatch(/a sh:PropertyGroup , sh:PropertyGroup/);
  });
});
