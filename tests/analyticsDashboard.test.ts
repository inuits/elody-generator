/**
 * Dashboards are declarations of their own (ea:Dashboard): charts over named
 * datasets and the metrics those datasets carry. The renderer knows nothing of
 * SLAs or catalogues: the SLA layer and the overlay only provide datasets.
 * Two dashboards are the test: the SLA's and vlacc's Catalogusinvoer.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readDashboards, renderDashboards, validateDashboards } from "../src/analytics/dashboard.js";
import { generateAnalytics, overlayDatasets, uuidFor } from "../src/analytics/generate.js";
import { readOverlay } from "../src/analytics/overlay.js";
import { readSla, slaParts } from "../src/analytics/sla.js";

const fixtures = join(__dirname, "fixtures", "analytics");
const read = (name: string) => readFileSync(join(fixtures, name), "utf-8");
const slaTtl = read("sla.dashboard.ttl");
const [slaDashboard] = readDashboards(slaTtl);
const sla = slaParts(readSla(read("podiumnet.sla.ttl")), "podiumnet");
const files = renderDashboards([slaDashboard], sla.datasets, { client: "podiumnet", variables: sla.variables });
const yamlOf = (path: string) => files.get(path)!;
const uuidOf = (yaml: string) => /^uuid: "([0-9a-f-]{36})"$/m.exec(yaml)![1];

describe("dashboard declarations", () => {
  it("reads the items in their order, with their measures, groups and period", () => {
    expect(slaDashboard.title).toBe("SLA");
    expect(slaDashboard.slug).toBe("sla");
    expect(slaDashboard.items.map((item) => item.kind)).toEqual([
      "BigNumber", "BigNumber", "BigNumber", "Table", "Table", "TimeSeries", "TimeSeries", "TimeSeries", "Table", "Markdown",
    ]);
    expect(slaDashboard.items[3]).toMatchObject({
      key: "beschikbaarheid-per-maand",
      dataset: "uptime",
      groupBy: [{ label: "Maand", sql: "formatDateTime(checked_at, '%Y-%m')" }],
      measures: ["availability", "downtime_minutes", "checks", "availability_credit"],
      period: "AllTime",
      sortBy: "Maand",
      ascending: false,
      limit: 24,
      width: 6,
      height: 50,
    });
    expect(slaDashboard.items[6]).toMatchObject({ style: "StackedBar", timeGrain: "P1D", period: "Last90Days" });
  });

  it("conforms to the shapes, and says what is wrong", async () => {
    expect((await validateDashboards(slaTtl)).conforms).toBe(true);
    expect((await validateDashboards(read("catalogusinvoer.dashboard.ttl"))).conforms).toBe(true);
    const broken = slaTtl.replace('ea:dataset "uptime" ; ea:measure "availability" ;', 'ea:measure "availability" ;').replace("ea:width 12", "ea:width 13");
    const report = await validateDashboards(broken);
    expect(report.conforms).toBe(false);
    const messages = report.issues.map((issue) => issue.message).join("\n");
    expect(messages).toMatch(/ea:dataset/);
    expect(messages).toMatch(/ea:width/);
  });
});

describe("dashboard rendering", () => {
  it("writes the import bundle: database, the datasets, a chart per item and the dashboard", () => {
    expect([...files.keys()].filter((path) => !path.startsWith("superset/charts/")).sort()).toEqual([
      "superset/dashboards/sla.yaml",
      "superset/databases/clickhouse_sla.yaml",
      "superset/datasets/clickhouse_sla/requests.yaml",
      "superset/datasets/clickhouse_sla/uptime.yaml",
      "superset/metadata.yaml",
    ]);
    expect([...files.keys()].filter((path) => path.startsWith("superset/charts/"))).toHaveLength(9);
    expect(yamlOf("superset/metadata.yaml")).toContain('type: "Dashboard"');
  });

  it("refers to the datasets' saved metrics by name, and writes inline ones as SQL", () => {
    const perMonth = yamlOf("superset/charts/beschikbaarheid-per-maand.yaml");
    expect(perMonth).toContain('viz_type: "table"');
    expect(perMonth).toMatch(/metrics:\n  - "availability"\n  - "downtime_minutes"\n  - "checks"\n  - "availability_credit"\n/);
    expect(perMonth).toContain(`sqlExpression: "formatDateTime(checked_at, '%Y-%m')"`);
    expect(yamlOf("superset/charts/apdex-deze-maand.yaml")).toMatch(/^  metric: "apdex"$/m);
    // the dataset carries the metric with the SLA's T
    expect(yamlOf("superset/datasets/clickhouse_sla/requests.yaml")).toContain("countIf(duration_ms <= 1000)");
  });

  it("fills the placeholders from the providers' variables", () => {
    expect(yamlOf("superset/charts/apdex-deze-maand.yaml")).toContain('subheader: "doel ≥ 0,85 (T = 1 s)"');
    expect(yamlOf("superset/charts/requests-deze-maand-span-name.yaml")).toContain('slice_name: "Requests deze maand (POST /api/graphql)"');
    expect(yamlOf("superset/dashboards/sla.yaml")).toContain("Bron: Bijlage 3, Antwoordformulier SLA v1.1.");
  });

  it("lays the items out in rows of 12 columns, in their order", () => {
    const dashboard = yamlOf("superset/dashboards/sla.yaml");
    expect(dashboard.match(/type: "ROW"/g)).toHaveLength(5);
    for (const [path, yaml] of files) if (path.startsWith("superset/charts/")) expect(dashboard).toContain(`uuid: "${uuidOf(yaml)}"`);
  });

  it("gives every object a stable uuid, the same on every run", () => {
    const again = renderDashboards(readDashboards(slaTtl), sla.datasets, { client: "podiumnet", variables: sla.variables });
    expect([...again.entries()]).toEqual([...files.entries()]);
    expect(uuidOf(yamlOf("superset/dashboards/sla.yaml"))).toBe(uuidFor("podiumnet", "dashboard", "sla"));
  });

  it("refuses what it cannot resolve: a dataset, a metric or a placeholder", () => {
    const render = (ttl: string) => () => renderDashboards(readDashboards(ttl), sla.datasets, { client: "podiumnet", variables: sla.variables });
    expect(render(slaTtl.replace('ea:dataset "uptime" ; ea:measure "availability"', 'ea:dataset "nope" ; ea:measure "availability"'))).toThrow(/nope/);
    expect(render(slaTtl.replace('ea:measures ( "apdex" ) ;', 'ea:measures ( "apdexx" ) ;'))).toThrow(/apdexx.*Apdex per dag/);
    expect(render(slaTtl.replace("{apdex_goal} (T", "{apdex_doel} (T"))).toThrow(/apdex_doel/);
  });
});

describe("a dashboard over the overlay's datasets", () => {
  const overlay = readOverlay(read("vlacc.analytics.ttl"));
  const bundles = [JSON.parse(read("nl.json"))];
  const [catalogue] = readDashboards(read("catalogusinvoer.dashboard.ttl"));
  const rendered = renderDashboards([catalogue], overlayDatasets(overlay, bundles, "vlacc"), { client: "vlacc" });

  it("uses the same datasets as the overlay's own bundle", () => {
    const daily = rendered.get("superset/datasets/clickhouse_analytics/vlacc_entities_created_daily.yaml")!;
    const fromGenerate = generateAnalytics(overlay, { bundles }).get("superset/datasets/clickhouse_analytics/vlacc_entities_created_daily.yaml")!;
    expect(daily).toBe(fromGenerate);
  });

  it("draws a ranking as the top N of a dimension, as horizontal bars", () => {
    const perType = rendered.get("superset/charts/per-type.yaml")!;
    expect(perType).toContain('viz_type: "echarts_timeseries_bar"');
    expect(perType).toContain('orientation: "horizontal"');
    expect(perType).toContain('x_axis: "type"');
    expect(perType).toContain("row_limit: 15");
    expect(perType).toMatch(/^dataset_uuid: "[0-9a-f-]{36}"$/m);
  });
});
