/**
 * Analytics, step 4: the overlay generates the store and the tools around it:
 * the raw ClickHouse table and the mart views, the dlt projection that loads
 * the table from Mongo, and the Superset datasets with Dutch labels. The
 * vlacc overlay is the snapshot; the SQL also runs against an empty
 * ClickHouse when its image is present.
 */
import { execFileSync, spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { columnsOf, generateAnalytics, toYaml, uuidFor } from "../src/analytics/generate.js";
import { readOverlay } from "../src/analytics/overlay.js";

const fixtures = join(__dirname, "fixtures", "analytics");
const overlay = readOverlay(readFileSync(join(fixtures, "vlacc.analytics.ttl"), "utf-8"));
const bundles = [JSON.parse(readFileSync(join(fixtures, "nl.json"), "utf-8"))];
const files = generateAnalytics(overlay, { bundles, source: "vlacc.analytics.ttl" });

describe("analytics generate", () => {
  it("writes the SQL, the dlt projection and the Superset bundle", () => {
    expect([...files.keys()].sort()).toEqual([
      "clickhouse/001_raw.sql",
      "clickhouse/010_mart.sql",
      "dlt/projection.json",
      "superset/databases/clickhouse_analytics.yaml",
      "superset/datasets/clickhouse_analytics/vlacc_entities_created_by_avi_read_level_code.yaml",
      "superset/datasets/clickhouse_analytics/vlacc_entities_created_by_genre_type.yaml",
      "superset/datasets/clickhouse_analytics/vlacc_entities_created_by_source_id_online_collection.yaml",
      "superset/datasets/clickhouse_analytics/vlacc_entities_created_daily.yaml",
      "superset/metadata.yaml",
    ]);
  });

  it("names a column after the property, labels it from the translations, and tells equal labels apart", () => {
    const columns = columnsOf(overlay, bundles);
    const byName = Object.fromEntries(columns.map((column) => [column.name, column]));
    expect(columns.slice(0, 6).map((column) => column.name)).toEqual(["id", "type", "created_at", "created_by", "updated_at", "updated_by"]);
    expect(byName.material_type).toMatchObject({ path: "properties.material_type.value", label: "Materiaaltype", multiValued: false, clickhouse: "LowCardinality(String)" });
    expect(byName.avi_read_level_code).toMatchObject({ multiValued: true, clickhouse: "Array(LowCardinality(String))" });
    expect(byName.created_at).toMatchObject({ label: "Aangemaakt op", clickhouse: "Nullable(DateTime64(3, 'Europe/Brussels'))" });
    expect(byName.updated_at).toMatchObject({ label: "Gewijzigd op", clickhouse: "DateTime64(3, 'Europe/Brussels')" });
    // "Type" is the entity type's; the genre's type is told apart by its column
    expect(byName.type.label).toBe("Type");
    expect(byName.genre_type.label).toBe("Type (genre_type)");
    expect(byName.target_audience.label).toBe("Doelgroep (target_audience)");
    expect(new Set(columns.map((column) => column.label)).size).toBe(columns.length);
  });

  it("gives every Superset object a stable uuid", () => {
    expect(uuidFor("vlacc", "dataset", "entities_created_daily")).toBe(uuidFor("vlacc", "dataset", "entities_created_daily"));
    expect(uuidFor("vlacc", "dataset", "entities_created_daily")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidFor("vlacc", "dataset", "a")).not.toBe(uuidFor("other", "dataset", "a"));
  });

  it("writes YAML that keeps strings strings", () => {
    expect(toYaml({ a: "yes", b: null, c: true, d: 1, e: [], f: {}, g: [{ h: "x", i: ["1"] }] })).toBe(
      'a: "yes"\nb: null\nc: true\nd: 1\ne: []\nf: {}\ng:\n- h: "x"\n  i:\n  - "1"\n',
    );
  });

  it("projects the overlay's paths for dlt, with the cursor's fallback", () => {
    const projection = JSON.parse(files.get("dlt/projection.json")!);
    expect(projection).toMatchObject({
      database: "vlacc",
      schema: "v2",
      mart: { daily: "mart.vlacc_entities_created_daily" },
      collections: ["bibliographic_entities_actual", "entities_actual"],
      filter: { type: { $in: expect.arrayContaining(["manifestation_word", "person"]) } },
      primaryKey: "id",
      incremental: { cursor: "audit.updated.at", fallback: "audit.created.at", column: "updated_at" },
      destination: { dataset: "raw", table: "vlacc_entities" },
    });
    expect(projection.projection).toMatchObject({ _id: 1, type: 1, "audit.created.at": 1, "properties.material_type.value": 1 });
    expect(projection.columns.find((column: { name: string }) => column.name === "avi_read_level_code")).toMatchObject({
      path: "properties.avi_read_level_code.value",
      source: { path: "properties.avi_read_level_code.value" },
      multiValued: true,
    });
  });

  it("names each client's views after it, read through one shared Superset database", () => {
    expect(files.get("clickhouse/010_mart.sql")).toContain("CREATE DATABASE IF NOT EXISTS mart;");
    expect(files.get("clickhouse/010_mart.sql")).toContain("CREATE OR REPLACE VIEW mart.vlacc_entities_created_daily AS");
    expect(files.get("clickhouse/010_mart.sql")).toContain("CREATE OR REPLACE VIEW mart.vlacc_entities_created_by_genre_type AS");
    const daily = files.get("superset/datasets/clickhouse_analytics/vlacc_entities_created_daily.yaml")!;
    expect(daily).toContain('table_name: "vlacc_entities_created_daily"');
    expect(daily).toContain('schema: "mart"');
    // the dataset's uuid stays the one of the unprefixed name: dashboards exported before keep finding it
    expect(daily).toContain(`uuid: "${uuidFor("vlacc", "dataset", "entities_created_daily")}"`);
    const other = generateAnalytics(overlay, { bundles, client: "other" });
    const database = (bundle: Map<string, string>) => /^uuid: "(.*)"$/m.exec(bundle.get("superset/databases/clickhouse_analytics.yaml")!)![1];
    expect(database(other)).toBe(database(files));
    expect(other.get("superset/datasets/clickhouse_analytics/other_entities_created_daily.yaml")).toContain('table_name: "other_entities_created_daily"');
  });

  it("reads a v1 client's paths where v1 stores them", () => {
    const v1 = readOverlay(
      readFileSync(join(fixtures, "vlacc.analytics.ttl"), "utf-8")
        .replace('ea:sourceCollection "bibliographic_entities_actual" , "entities_actual" ;', 'ea:sourceCollection "entities" ;\n  ea:documentSchema "v1" ;')
        .replace('ea:sourcePath "properties.material_type.value"', 'ea:sourcePath "metadata.material_type.value"'),
    );
    const projection = JSON.parse(generateAnalytics(v1, { bundles, client: "podiumnet" }).get("dlt/projection.json")!);
    const column = (name: string) => projection.columns.find((entry: { name: string }) => entry.name === name);
    expect(projection.schema).toBe("v1");
    expect(column("created_at").source).toEqual({ path: "date_created" });
    expect(column("updated_by").source).toEqual({ path: "last_editor" });
    expect(column("material_type")).toMatchObject({ path: "metadata.material_type.value", source: { list: "metadata", match: { field: "key", value: "material_type" }, path: "value" } });
    expect(projection.projection).toMatchObject({ _id: 1, type: 1, date_created: 1, date_updated: 1, metadata: 1 });
    expect(projection.projection["metadata.material_type.value"]).toBeUndefined();
    expect(projection.incremental).toMatchObject({ cursor: "date_updated", fallback: "date_created" });
  });

  it("matches the snapshots", async () => {
    for (const [file, content] of files) await expect(content).toMatchFileSnapshot(join(__dirname, "__snapshots__", "analytics", file));
  });
});

const IMAGE = "clickhouse/clickhouse-server:26.8";
const hasClickhouse = (() => {
  try {
    execFileSync("docker", ["image", "inspect", IMAGE], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasClickhouse)("analytics generate on ClickHouse", () => {
  it("creates the tables and views on an empty ClickHouse, and the views count", () => {
    const rows = `
INSERT INTO raw.vlacc_entities (id, type, created_at, created_by, updated_at, updated_by, material_type, avi_read_level_code)
VALUES ('1', 'manifestation_word', '2025-03-01 10:00:00', 'a@brugge.be', '2025-03-01 10:00:00', '', 'BOEK', []),
       ('1', 'manifestation_word', '2025-03-01 10:00:00', 'a@brugge.be', '2025-03-02 10:00:00', '', 'STRIP', []),
       ('2', 'easy_reading', '2025-03-01 12:00:00', '', '2025-03-01 12:00:00', '', '', ['AVI 1', 'AVI 2']),
       ('3', 'person', NULL, '', '1970-01-01 00:00:00', '', '', []);
SELECT type, material_type, sum(entity_count) FROM mart.vlacc_entities_created_daily GROUP BY ALL ORDER BY ALL FORMAT TSV;
SELECT avi_read_level_code, sum(entity_count) FROM mart.vlacc_entities_created_by_avi_read_level_code GROUP BY ALL ORDER BY ALL FORMAT TSV;
`;
    const sql = `${files.get("clickhouse/001_raw.sql")}\n${files.get("clickhouse/010_mart.sql")}\n${rows}`;
    const run = spawnSync("docker", ["run", "--rm", "-i", IMAGE, "clickhouse-local", "--multiquery"], { input: sql, encoding: "utf-8" });
    expect(run.stderr).toBe("");
    // the later version of entity 1 replaces the first; the entity without a creation date is not counted
    expect(run.stdout).toBe("easy_reading\t\t1\nmanifestation_word\tSTRIP\t1\nAVI 1\t1\nAVI 2\t1\n");
  }, 120_000);
});
