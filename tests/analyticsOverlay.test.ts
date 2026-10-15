/**
 * Analytics, step 2: the selection overlay. A W3C Data Cube structure
 * generated from the reviewed candidates: one dimension per included path,
 * the entity type and the time dimension marked by their role, the left-out
 * paths as commented components a person can switch on. The analytics
 * shapes check what the later steps rely on.
 */
import { describe, expect, it } from "vitest";
import type { Candidate } from "../src/analytics/inventory.js";
import { propertyNames, readOverlay, renderOverlay, validateOverlay } from "../src/analytics/overlay.js";

const candidate = (path: string, role: Candidate["role"], include: boolean, more: Partial<Candidate> = {}): Candidate => ({
  path,
  role,
  reason: include ? "a SelectionFilter" : "left out",
  include,
  labelKey: `metadata.labels.${path}`,
  labelSource: "declared",
  filterKinds: ["SelectionFilter"],
  occurrences: 1,
  entityTypes: ["Manifestation"],
  aliases: [],
  prefixed: true,
  hidden: false,
  typeValues: [],
  ...more,
});

const candidates: Candidate[] = [
  candidate("type", "entity_type", true, { filterKinds: ["TypeFilter"], labelNl: "Type", typeValues: ["work_word", "manifestation_word", "user"] }),
  candidate("audit.created.at", "time", true, { filterKinds: ["DateFilter"], labelKey: "metadata.labels.created-at", labelNl: "Aangemaakt op" }),
  candidate("audit.updated.at", "time", false, { filterKinds: ["DateFilter"] }),
  candidate("audit.created.by", "dimension", true, { labelKey: "metadata.labels.created-by", labelNl: "Aangemaakt door" }),
  candidate("properties.material_type.value", "dimension", true, { labelKey: "metadata.labels.material-type", labelNl: "Materiaaltype" }),
  candidate("properties.id_online_collection_group.value.source_id_online_collection", "dimension", true),
  candidate("properties.ref_authors.value", "relation", false),
];

const options = { client: "vlacc", collections: ["entities_actual", "bibliographic_entities_actual"], schema: "v2" as const, source: "candidates.json" };

describe("analytics overlay", () => {
  const ttl = renderOverlay(candidates, options);
  const overlay = readOverlay(ttl);

  it("names each property after the path's last meaningful segment, unique", () => {
    const names = propertyNames(candidates.map((entry) => entry.path));
    expect(names.get("type")).toBe("type");
    expect(names.get("audit.created.at")).toBe("created_at");
    expect(names.get("audit.updated.at")).toBe("updated_at");
    expect(names.get("audit.created.by")).toBe("created_by");
    expect(names.get("properties.material_type.value")).toBe("material_type");
    expect(names.get("properties.id_online_collection_group.value.source_id_online_collection")).toBe("source_id_online_collection");
    // v1 keeps metadata under `metadata.`: the same name as v2's `properties.`
    expect(propertyNames(["metadata.assetType.value"]).get("metadata.assetType.value")).toBe("asset_type");
    const clash = propertyNames(["properties.status.value", "properties.record.value.status"]);
    expect(new Set(clash.values()).size).toBe(2);
  });

  it("holds the included paths only, as dimensions with their source path", () => {
    expect(overlay.cube).toBe("https://elody.eu/analytics/vlacc#EntityActivity");
    expect(overlay.sourceCollections).toEqual(["bibliographic_entities_actual", "entities_actual"]);
    expect(overlay.schema).toBe("v2");
    expect(ttl).toContain('ea:documentSchema "v2"');
    expect(overlay.entityTypes).toEqual(["manifestation_word", "user", "work_word"]);
    expect(overlay.dimensions.map((dimension) => dimension.sourcePath)).toEqual([
      "type",
      "audit.created.at",
      "audit.created.by",
      "properties.id_online_collection_group.value.source_id_online_collection",
      "properties.material_type.value",
    ]);
    expect(overlay.dimensions[0]).toMatchObject({ property: "https://elody.io/ns/metadata#type", role: "EntityType", labelKey: "metadata.labels.type" });
    expect(overlay.dimensions[1]).toMatchObject({ property: "https://elody.io/ns/metadata#created_at", role: "Time", multiValued: false });
    expect(overlay.measures).toEqual(["https://elody.eu/ns/analytics#entityCount"]);
  });

  it("lists the left-out paths as commented components, ready to switch on", () => {
    expect(ttl).toContain('#   qb:component [ qb:dimension em:ref_authors ; ea:sourcePath "properties.ref_authors.value"');
    const switchedOn = ttl.replace('#   qb:component [ qb:dimension em:ref_authors', '  qb:component [ qb:dimension em:ref_authors');
    expect(readOverlay(switchedOn).dimensions.map((dimension) => dimension.sourcePath)).toContain("properties.ref_authors.value");
  });

  it("says the client's document schema; an overlay that does not is v2", async () => {
    const v1 = renderOverlay(candidates, { ...options, client: "podiumnet", schema: "v1" });
    expect(readOverlay(v1).schema).toBe("v1");
    expect((await validateOverlay(v1)).conforms).toBe(true);
    expect(readOverlay(ttl.replace(' ;\n  ea:documentSchema "v2"', "")).schema).toBe("v2");
    expect((await validateOverlay(ttl.replace('ea:documentSchema "v2"', 'ea:documentSchema "v3"'))).conforms).toBe(false);
  });

  it("conforms to the analytics shapes", async () => {
    const report = await validateOverlay(ttl);
    expect(report.issues).toEqual([]);
    expect(report.conforms).toBe(true);
  });

  it("refuses an overlay without a time dimension, with two, or a dimension without a source path", async () => {
    const noTime = ttl.replace(" ; ea:role ea:Time", "");
    expect((await validateOverlay(noTime)).conforms).toBe(false);
    const twoTimes = ttl.replace('ea:sourcePath "audit.created.by"', 'ea:sourcePath "audit.created.by" ; ea:role ea:Time');
    expect((await validateOverlay(twoTimes)).conforms).toBe(false);
    const noPath = ttl.replace(' ; ea:sourcePath "audit.created.by"', "");
    expect((await validateOverlay(noPath)).conforms).toBe(false);
    const twoTypes = ttl.replace('ea:sourcePath "audit.created.by"', 'ea:sourcePath "audit.created.by" ; ea:role ea:EntityType');
    expect((await validateOverlay(twoTypes)).conforms).toBe(false);
  });

  it("refuses two dimensions on one source path", async () => {
    const twice = ttl.replace('ea:sourcePath "audit.created.by"', 'ea:sourcePath "properties.material_type.value"');
    const report = await validateOverlay(twice);
    expect(report.conforms).toBe(false);
    expect(report.issues.map((issue) => issue.message).join()).toContain("properties.material_type.value");
  });
});
