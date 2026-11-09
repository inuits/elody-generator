/**
 * The SLA declaration is a layer under a dashboard: it provides the ClickHouse
 * SQL (the sla database, the copy of the API's server spans, the backfill),
 * the datasets uptime and requests with the SLA's metrics (its goals, T and
 * service credits), and the placeholders a dashboard's texts use. A bundle
 * folder (the SLA, its dashboard) becomes what elody-superset applies.
 * The SQL also runs against an empty ClickHouse when its image is present.
 */
import { execFileSync, spawnSync } from "child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { buildBundle } from "../src/analytics/bundle.js";
import { creditSql, readSla, slaParts, validateSla } from "../src/analytics/sla.js";

const fixtures = join(__dirname, "fixtures", "analytics");
const ttl = readFileSync(join(fixtures, "podiumnet.sla.ttl"), "utf-8");
const sla = readSla(ttl);

describe("analytics sla: the declaration", () => {
  it("reads the goals, the credit tiers and the measured service", () => {
    expect(sla).toEqual({
      subject: "https://elody.eu/analytics/podiumnet#Sla",
      title: "SLA",
      source: "Bijlage 3, Antwoordformulier SLA v1.1",
      language: "nl",
      retentionDays: 400,
      availability: { goal: 0.999, tiers: [{ atLeast: 0.995, percent: 5 }, { atLeast: 0.99, percent: 10 }, { percent: 20 }] },
      performance: {
        service: "graphql",
        spanName: "POST /api/graphql",
        thresholdMs: 1000,
        goal: 0.85,
        tiers: [{ atLeast: 0.75, percent: 5 }, { percent: 10 }],
      },
    });
  });

  it("conforms to the shapes, and says what is missing", async () => {
    expect((await validateSla(ttl)).conforms).toBe(true);
    const broken = ttl.replace(/ea:apdexThresholdMs 1000 ;/, "").replace(/ea:creditPercent 20/, "ea:atLeast 0.9");
    const report = await validateSla(broken);
    expect(report.conforms).toBe(false);
    const messages = report.issues.map((issue) => issue.message).join("\n");
    expect(messages).toMatch(/apdexThresholdMs/);
    expect(messages).toMatch(/creditPercent/);
  });

});

describe("analytics sla: the layer under its dashboard", () => {
  const parts = slaParts(sla, "podiumnet");

  it("provides the SQL, the two datasets with the SLA's metrics, and the placeholders", () => {
    expect([...parts.sql.keys()]).toEqual(["001_sla.sql"]);
    expect(parts.datasets.map((dataset) => dataset.name)).toEqual(["uptime", "requests"]);
    expect(parts.datasets[0].metrics.map((metric) => metric.name)).toEqual(["availability", "downtime_minutes", "checks", "availability_credit"]);
    expect(parts.datasets[1].metrics.map((metric) => metric.name)).toEqual([
      "apdex", "requests", "satisfied", "tolerating", "frustrated", "satisfied_share", "frustrated_share", "apdex_credit", "p95_ms",
    ]);
    expect(parts.variables).toEqual({
      availability_goal: "99,90 %",
      apdex_goal: "0,85",
      apdex_t: "1 s",
      apdex_tolerating: "4 s",
      service: "graphql",
      span_name: "POST /api/graphql",
      source: "Bijlage 3, Antwoordformulier SLA v1.1",
    });
    expect(parts.manifest).toEqual({ requires: ["default.otel_traces"], readOnlyDatabases: ["sla"] });
  });

  it("puts the declaration's thresholds and tiers into the metrics", () => {
    expect(creditSql("avg(ok)", sla.availability, "nl")).toBe(
      "multiIf(avg(ok) >= 0.999, 'geen', avg(ok) >= 0.995, '5 %', avg(ok) >= 0.99, '10 %', '20 %')",
    );
    const metric = (dataset: number, name: string) => parts.datasets[dataset].metrics.find((entry) => entry.name === name)!;
    expect(metric(1, "satisfied")).toMatchObject({ label: "Tevreden (≤ 1 s)", sql: "countIf(duration_ms <= 1000)" });
    expect(metric(1, "tolerating").sql).toBe("countIf(duration_ms > 1000 AND duration_ms <= 4000)");
    expect(metric(1, "apdex_credit").sql).toContain(">= 0.85, 'geen'");
    expect(metric(0, "availability_credit").label).toBe("Service credit");
  });

  it("copies only the declared service's server spans, kept as long as the declaration says", () => {
    const sql = parts.sql.get("001_sla.sql")!;
    expect(sql).toContain("WHERE ServiceName = 'graphql' AND SpanKind = 'Server' AND SpanName = 'POST /api/graphql'");
    expect(sql).toContain("TTL checked_at + INTERVAL 400 DAY");
  });

  it("speaks English when the declaration does", () => {
    const english = slaParts({ ...sla, language: "en" }, "podiumnet");
    expect(english.variables.availability_goal).toBe("99.90%");
    expect(english.datasets[1].metrics.find((metric) => metric.name === "satisfied")!.label).toBe("Satisfied (≤ 1 s)");
    expect(creditSql("avg(ok)", sla.availability, "en")).toContain("'none'");
  });
});

describe("analytics bundle: a folder of declarations", () => {
  const dir = mkdtempSync(join(tmpdir(), "bundle-"));
  const bundleDir = join(dir, "sla");
  mkdirSync(bundleDir);
  writeFileSync(join(bundleDir, "sla.ttl"), ttl);
  writeFileSync(join(bundleDir, "sla.dashboard.ttl"), readFileSync(join(fixtures, "sla.dashboard.ttl"), "utf-8"));
  const bundle = buildBundle(bundleDir, { client: "podiumnet" });

  it("writes the SQL, the manifest and the Superset import bundle", () => {
    expect([...bundle.keys()].filter((path) => !path.startsWith("superset/")).sort()).toEqual(["clickhouse/001_sla.sql", "manifest.json"]);
    expect(bundle.get("clickhouse/001_sla.sql")).toMatch(/^-- Generated by `elody-ui analytics bundle` from sla.ttl; do not edit./);
    expect(bundle.has("superset/dashboards/sla.yaml")).toBe(true);
  });

  it("names in the manifest the tables it waits for, the read-only user, its connections and the dashboards", () => {
    expect(JSON.parse(bundle.get("manifest.json")!)).toEqual({
      requires: ["default.otel_traces"],
      readOnlyUser: { name: "superset", databases: ["sla"] },
      passwords: { "databases/clickhouse_sla.yaml": "readOnlyUser" },
      dashboards: ["/superset/dashboard/sla/"],
    });
  });

  it("refuses a folder without a dashboard", () => {
    const empty = join(dir, "empty");
    mkdirSync(empty);
    writeFileSync(join(empty, "sla.ttl"), ttl);
    expect(() => buildBundle(empty, { client: "podiumnet" })).toThrow(/no ea:Dashboard/);
  });

  it("refuses a service or span name that does not fit in SQL", () => {
    expect(() => slaParts({ ...sla, performance: { ...sla.performance, service: "graphql' OR 1=1" } }, "podiumnet")).toThrow(/service/);
  });
});

const IMAGE = "clickhouse/clickhouse-server:25.8";
const hasClickhouse = (() => {
  try {
    execFileSync("docker", ["image", "inspect", IMAGE], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasClickhouse)("analytics sla on ClickHouse", () => {
  it("backfills the spans once, then copies new ones as they arrive", () => {
    const traces = `
CREATE TABLE default.otel_traces (Timestamp DateTime64(9), ServiceName LowCardinality(String), SpanKind LowCardinality(String),
  SpanName LowCardinality(String), Duration UInt64, SpanAttributes Map(LowCardinality(String), String)) ENGINE = MergeTree ORDER BY Timestamp;
INSERT INTO default.otel_traces VALUES
  (now64() - 60, 'graphql', 'Server', 'POST /api/graphql', 500000000, {'graphql.operation.name': 'GetMenu', 'graphql.operation.type': 'query', 'http.status_code': '200'}),
  (now64() - 50, 'graphql', 'Internal', 'parse', 1000000, {}),
  (now64() - 40, 'collection', 'Server', 'POST /api/graphql', 1000000, {});
`;
    const sql = slaParts(sla, "podiumnet").sql.get("001_sla.sql")!;
    const later = `INSERT INTO default.otel_traces VALUES (now64(), 'graphql', 'Server', 'POST /api/graphql', 2500000000, {'graphql.operation.name': 'Save'});`;
    const check = "SELECT operation, duration_ms FROM sla.requests ORDER BY at FORMAT TSV;";
    // the setup runs at every start: the second run must not copy the spans again
    const run = spawnSync("docker", ["run", "--rm", "-i", IMAGE, "clickhouse-local", "--multiquery"], {
      input: `${traces}\n${sql}\n${sql}\n${later}\n${check}`,
      encoding: "utf-8",
    });
    expect(run.stderr).toBe("");
    expect(run.stdout).toBe("GetMenu\t500\nSave\t2500\n");
  }, 120_000);
});
