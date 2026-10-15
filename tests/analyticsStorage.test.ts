/**
 * Analytics: where a logical path is stored. The declaration names a value by
 * its logical path (`audit.created.at`, `metadata.status.value`); the document
 * schema of the client decides where that value lives. v2 stores it at the
 * path; v1 keeps the audit at the top (date_created, created_by, date_updated,
 * last_editor), metadata as a list of { key, value } and relations as a list
 * of { type, key }.
 */
import { describe, expect, it } from "vitest";
import { accessorOf, mongoExpression, mongoRoot, readValues } from "../src/analytics/storage.js";

const v1 = {
  type: "asset",
  date_created: new Date("2025-12-17T11:05:13Z"),
  created_by: "developers@inuits.eu",
  last_editor: "someone@podiumnet.be",
  metadata: [
    { key: "title", value: "Test" },
    { key: "status", value: "Concept" },
    { key: "assetType", value: "Foto" },
    { key: "assetType", value: "Video" },
    { key: "genres", value: ["dans", "theater"] },
  ],
  relations: [
    { type: "isIn", key: "p-1" },
    { type: "isIn", key: "p-2" },
    { type: "hasTag", key: "t-1" },
  ],
};

describe("analytics storage", () => {
  it("leaves a v2 path as it is", () => {
    expect(accessorOf("properties.material_type.value", "v2")).toEqual({ path: "properties.material_type.value" });
    expect(accessorOf("audit.created.at", "v2")).toEqual({ path: "audit.created.at" });
    expect(accessorOf("type", "v1")).toEqual({ path: "type" });
  });

  it("maps v1's audit to the fields collection-api writes", () => {
    expect(accessorOf("audit.created.at", "v1")).toEqual({ path: "date_created" });
    expect(accessorOf("audit.created.by", "v1")).toEqual({ path: "created_by" });
    expect(accessorOf("audit.updated.at", "v1")).toEqual({ path: "date_updated" });
    expect(accessorOf("audit.updated.by", "v1")).toEqual({ path: "last_editor" });
  });

  it("reads v1 metadata and relations as list elements matched on their key or type", () => {
    expect(accessorOf("metadata.status.value", "v1")).toEqual({ list: "metadata", match: { field: "key", value: "status" }, path: "value" });
    expect(accessorOf("metadata.status", "v1")).toEqual({ list: "metadata", match: { field: "key", value: "status" }, path: "value" });
    expect(accessorOf("relations.isIn.key", "v1")).toEqual({ list: "relations", match: { field: "type", value: "isIn" }, path: "key" });
    expect(readValues(v1, accessorOf("metadata.status.value", "v1"))).toEqual({ present: true, isArray: false, values: ["Concept"] });
    // a key given twice, or a value that is a list, is a list
    expect(readValues(v1, accessorOf("metadata.assetType.value", "v1"))).toEqual({ present: true, isArray: true, values: ["Foto", "Video"] });
    expect(readValues(v1, accessorOf("metadata.genres.value", "v1"))).toEqual({ present: true, isArray: true, values: ["dans", "theater"] });
    expect(readValues(v1, accessorOf("relations.isIn.key", "v1")).values).toEqual(["p-1", "p-2"]);
    expect(readValues(v1, accessorOf("metadata.missing.value", "v1")).present).toBe(false);
    expect(readValues(v1, accessorOf("audit.updated.by", "v1")).values).toEqual(["someone@podiumnet.be"]);
    expect(readValues({ type: "x" }, accessorOf("metadata.status.value", "v1")).present).toBe(false);
  });

  it("projects the field that holds the value, and reads it in an aggregation", () => {
    expect(mongoRoot(accessorOf("metadata.status.value", "v1"))).toBe("metadata");
    expect(mongoRoot(accessorOf("properties.material_type.value", "v2"))).toBe("properties.material_type.value");
    expect(mongoExpression(accessorOf("properties.material_type.value", "v2"))).toBe("$properties.material_type.value");
    expect(mongoExpression(accessorOf("metadata.status.value", "v1"))).toEqual({
      $map: { input: { $filter: { input: { $ifNull: ["$metadata", []] }, as: "item", cond: { $eq: ["$$item.key", "status"] } } }, as: "item", in: "$$item.value" },
    });
  });
});
