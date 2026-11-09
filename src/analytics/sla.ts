/**
 * The SLA declaration (an ea:ServiceLevelAgreement) is a layer under a
 * dashboard: it gives what the SLA dashboard draws, not the dashboard itself.
 *
 * - the ClickHouse SQL: sla.uptime (filled by elody-superset's uptime check),
 *   sla.requests (a materialized view over HyperDX's server spans of the
 *   declared service, backfilled once); every statement can run again
 * - the datasets uptime and requests, with the SLA's metrics: availability,
 *   Apdex with the declared T, the service credits from the declared tiers
 * - the placeholders a dashboard's texts use: {availability_goal}, {apdex_goal},
 *   {apdex_t}, {apdex_tolerating}, {service}, {span_name}, {source}
 *
 * The dashboard is a declaration of its own (dashboard.ts), next to the SLA in
 * the bundle's folder (bundle.ts).
 */
import { readFileSync } from "fs";
import rdfEnv from "@zazuko/env";
import { Parser, type Quad } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { Reading } from "../reading.js";
import type { ValidationIssue, ValidationReport } from "../validate.js";
import { rdfs } from "../vocab.js";
import { uuidFor } from "./generate.js";
import type { DatabaseDef, DatasetDef } from "./superset.js";
import { ANALYTICS_VOCABULARY_PATH, EA } from "./overlay.js";
import { join, dirname } from "path";

const ea = (local: string) => `${EA}${local}`;
const DCT_SOURCE = "http://purl.org/dc/terms/source";
const SLA_SHAPES_PATH = join(dirname(ANALYTICS_VOCABULARY_PATH), "sla.shapes.ttl");

export type Language = "nl" | "en";
export type CreditTier = { atLeast?: number; percent: number };
export type Goal = { goal: number; tiers: CreditTier[] };
export type Sla = {
  subject: string;
  title: string;
  source?: string;
  language: Language;
  retentionDays: number;
  availability: Goal;
  performance: Goal & { service: string; spanName: string; thresholdMs: number };
};


// --- reading

/** The tiers from the highest down; the floor (no ea:atLeast) last. */
function goalOf(reading: Reading, node: string): Goal {
  const tiers = reading.nodes(node, ea("creditTier")).map((tier) => {
    const atLeast = reading.literal(tier, ea("atLeast"));
    return { ...(atLeast === undefined ? {} : { atLeast: Number(atLeast) }), percent: Number(reading.literal(tier, ea("creditPercent"))) };
  });
  tiers.sort((a, b) => (b.atLeast ?? -1) - (a.atLeast ?? -1));
  return { goal: Number(reading.literal(node, ea("goal"))), tiers };
}

export function readSla(ttl: string): Sla {
  const reading = new Reading(new Parser().parse(ttl));
  const [subject] = reading.subjectsOfType(ea("ServiceLevelAgreement"));
  if (!subject) throw new Error("no ea:ServiceLevelAgreement in the declaration");
  const availability = reading.node(subject, ea("availability"));
  const performance = reading.node(subject, ea("performance"));
  if (!availability || !performance) throw new Error("an SLA has ea:availability and ea:performance");
  const source = reading.value(subject, DCT_SOURCE);
  return {
    subject,
    title: reading.value(subject, rdfs("label")) ?? "SLA",
    ...(source ? { source } : {}),
    language: reading.value(subject, ea("language")) === "en" ? "en" : "nl",
    retentionDays: Number(reading.literal(subject, ea("retentionDays"))),
    availability: goalOf(reading, availability),
    performance: {
      service: reading.value(performance, ea("service")) ?? "",
      spanName: reading.value(performance, ea("spanName")) ?? "",
      thresholdMs: Number(reading.literal(performance, ea("apdexThresholdMs"))),
      ...goalOf(reading, performance),
    },
  };
}

let shapesCache: Quad[] | undefined;
let vocabularyCache: Quad[] | undefined;

/** The declaration against ontology/sla.shapes.ttl. */
export async function validateSla(ttl: string): Promise<ValidationReport> {
  let quads: Quad[];
  try {
    quads = new Parser().parse(ttl);
  } catch (error) {
    return { conforms: false, issues: [{ focusNode: "", message: `does not parse: ${(error as Error).message}`, severity: "Violation" }] };
  }
  shapesCache ??= new Parser().parse(readFileSync(SLA_SHAPES_PATH, "utf-8"));
  vocabularyCache ??= new Parser().parse(readFileSync(ANALYTICS_VOCABULARY_PATH, "utf-8"));
  const validator = new SHACLValidator(rdfEnv.dataset(shapesCache as never[]), { factory: rdfEnv as never, importGraph: async () => rdfEnv.dataset() } as never);
  const report = await validator.validate(rdfEnv.dataset([...vocabularyCache, ...quads] as never[]));
  const issues: ValidationIssue[] = report.results.map((result) => ({
    focusNode: result.focusNode?.value ?? "",
    path: (result.path as { value?: string } | null)?.value,
    message: result.message.map((term) => term.value).join(" "),
    severity: result.severity?.value.split("#").pop() ?? "Violation",
    shape: (result.sourceShape as { value?: string } | null)?.value,
  }));
  return { conforms: issues.length === 0, issues };
}

// --- the words of the metrics

const WORDS = {
  nl: {
    none: "geen",
    availability: "Beschikbaarheid (%)",
    downtime: "Downtime (min)",
    checks: "Checks",
    credit: "Service credit",
    requests: "Requests",
    satisfied: (t: string) => `Tevreden (≤ ${t})`,
    tolerating: (t: string) => `Getolereerd (≤ ${t})`,
    frustrated: (t: string) => `Ontevreden (> ${t})`,
    satisfiedShare: "Tevreden (%)",
    frustratedShare: "Ontevreden (%)",
  },
  en: {
    none: "none",
    availability: "Availability (%)",
    downtime: "Downtime (min)",
    checks: "Checks",
    credit: "Service credit",
    requests: "Requests",
    satisfied: (t: string) => `Satisfied (≤ ${t})`,
    tolerating: (t: string) => `Tolerating (≤ ${t})`,
    frustrated: (t: string) => `Frustrated (> ${t})`,
    satisfiedShare: "Satisfied (%)",
    frustratedShare: "Frustrated (%)",
  },
};

const decimal = (value: number, digits: number, language: Language) => {
  const text = value.toFixed(digits);
  return language === "nl" ? text.replace(".", ",") : text;
};
const percent = (share: number, language: Language) => (language === "nl" ? `${decimal(share * 100, 2, language)} %` : `${decimal(share * 100, 2, language)}%`);
const seconds = (ms: number, language: Language) => (ms % 1000 === 0 ? `${ms / 1000} s` : `${decimal(ms / 1000, 1, language)} s`);

/** The month's service credit as SQL: none at or above the goal, else the first tier the value reaches. */
export function creditSql(value: string, goal: Goal, language: Language): string {
  const words = WORDS[language];
  const label = (credit: number) => (language === "nl" ? `'${credit} %'` : `'${credit}%'`);
  const parts = [`${value} >= ${goal.goal}`, `'${words.none}'`];
  for (const tier of goal.tiers.filter((entry) => entry.atLeast !== undefined)) parts.push(`${value} >= ${tier.atLeast}`, label(tier.percent));
  const floor = goal.tiers.find((entry) => entry.atLeast === undefined);
  parts.push(floor ? label(floor.percent) : `'${words.none}'`);
  return `multiIf(${parts.join(", ")})`;
}

// --- ClickHouse

const header = (source?: string) => `-- Generated by \`elody-ui analytics bundle\`${source ? ` from ${source}` : ""}; do not edit.`;

function requestsSelect(sla: Sla): string {
  return [
    "SELECT Timestamp AS at, SpanAttributes['graphql.operation.name'] AS operation,",
    "    SpanAttributes['graphql.operation.type'] AS kind, toUInt32(intDiv(Duration, 1000000)) AS duration_ms,",
    "    toUInt16OrZero(SpanAttributes['http.status_code']) AS status, SpanAttributes['elody.library'] AS library",
    "FROM default.otel_traces",
    `WHERE ServiceName = '${sla.performance.service}' AND SpanKind = 'Server' AND SpanName = '${sla.performance.spanName}'`,
  ].join("\n");
}

function clickhouseSql(sla: Sla, source?: string): string {
  const retention = sla.retentionDays;
  const select = requestsSelect(sla);
  const backfilled = "(SELECT count() FROM sla.setup WHERE step = 'backfill requests') = 0";
  return `${header(source)}
-- The SLA's measurements, kept ${retention} days: HyperDX keeps its spans 30 days,
-- the SLA is measured per month and per year. Every statement can run again:
-- elody-superset applies this file at every start.
CREATE DATABASE IF NOT EXISTS sla;

-- Availability: one row per check of the health endpoint (elody-superset uptime)
CREATE TABLE IF NOT EXISTS sla.uptime
(
    checked_at  DateTime,
    target      LowCardinality(String),
    ok          UInt8,
    status      UInt16,
    duration_ms UInt32
)
ENGINE = MergeTree
ORDER BY (target, checked_at)
TTL checked_at + INTERVAL ${retention} DAY;

-- Performance: every request of ${sla.performance.service} (${sla.performance.spanName})
CREATE TABLE IF NOT EXISTS sla.requests
(
    at          DateTime64(3),
    operation   LowCardinality(String),
    kind        LowCardinality(String),
    duration_ms UInt32,
    status      UInt16,
    library     LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY at
TTL toDateTime(at) + INTERVAL ${retention} DAY;

ALTER TABLE sla.uptime MODIFY TTL checked_at + INTERVAL ${retention} DAY;

ALTER TABLE sla.requests MODIFY TTL toDateTime(at) + INTERVAL ${retention} DAY;

-- New spans as they arrive; the query follows the declaration
CREATE MATERIALIZED VIEW IF NOT EXISTS sla.requests_mv TO sla.requests AS
${select};

ALTER TABLE sla.requests_mv MODIFY QUERY
${select};

-- The spans from before the view existed, once
CREATE TABLE IF NOT EXISTS sla.setup
(
    step String,
    at   DateTime DEFAULT now()
)
ENGINE = MergeTree
ORDER BY step;

INSERT INTO sla.requests
${select}
    AND Timestamp < (SELECT if(count() = 0, now64(3), min(at)) FROM sla.requests)
    AND ${backfilled};

INSERT INTO sla.setup (step) SELECT 'backfill requests' WHERE ${backfilled};
`;
}

// --- the layer

const DATABASE = "clickhouse_sla";
const READ_ONLY_USER = "superset";

export type SlaParts = {
  /** ClickHouse SQL files by name, applied in name order */
  sql: Map<string, string>;
  datasets: DatasetDef[];
  variables: Record<string, string>;
  manifest: { requires: string[]; readOnlyDatabases: string[] };
};

export function slaParts(sla: Sla, client: string, source?: string): SlaParts {
  if (!/^[A-Za-z0-9_.-]+$/.test(sla.performance.service)) throw new Error(`the SLA's service is not a service name: ${JSON.stringify(sla.performance.service)}`);
  if (!/^[A-Za-z0-9 _./-]+$/.test(sla.performance.spanName)) throw new Error(`the SLA's span name does not fit in SQL: ${JSON.stringify(sla.performance.spanName)}`);
  const { language } = sla;
  const words = WORDS[language];
  const t = sla.performance.thresholdMs;
  const satisfied = `countIf(duration_ms <= ${t})`;
  const tolerating = `countIf(duration_ms > ${t} AND duration_ms <= ${4 * t})`;
  const frustrated = `countIf(duration_ms > ${4 * t})`;
  const apdex = `round((${satisfied} + ${tolerating} / 2) / count(), 3)`;
  const tText = seconds(t, language);
  const t4Text = seconds(4 * t, language);
  const database: DatabaseDef = {
    key: DATABASE,
    name: "ClickHouse SLA",
    uri: `clickhousedb://${READ_ONLY_USER}:XXXXXXXXXX@clickhouse:8123/sla`,
    uuid: uuidFor(client, "database", DATABASE),
  };
  const dataset = (name: string, time: string, columns: [string, string][], metrics: DatasetDef["metrics"]): DatasetDef => ({
    name,
    schema: "sla",
    time,
    description: null,
    uuid: uuidFor(client, "dataset", `sla/${name}`),
    columns: columns.map(([column, type]) => ({ name: column, type, time: column === time })),
    metrics,
    database,
  });
  return {
    sql: new Map([["001_sla.sql", clickhouseSql(sla, source)]]),
    datasets: [
      dataset("uptime", "checked_at", [["checked_at", "DateTime"], ["target", "LowCardinality(String)"], ["ok", "UInt8"], ["status", "UInt16"], ["duration_ms", "UInt32"]], [
        { name: "availability", label: words.availability, sql: "round(100 * avg(ok), 3)", format: ",.3f" },
        { name: "downtime_minutes", label: words.downtime, sql: "countIf(ok = 0)", format: ",d" },
        { name: "checks", label: words.checks, sql: "count()", format: ",d" },
        { name: "availability_credit", label: words.credit, sql: creditSql("avg(ok)", sla.availability, language) },
      ]),
      dataset(
        "requests",
        "at",
        [["at", "DateTime64(3)"], ["operation", "LowCardinality(String)"], ["kind", "LowCardinality(String)"], ["duration_ms", "UInt32"], ["status", "UInt16"], ["library", "LowCardinality(String)"]],
        [
          { name: "apdex", label: "Apdex", sql: apdex, format: ",.3f" },
          { name: "requests", label: words.requests, sql: "count()", format: ",d" },
          { name: "satisfied", label: words.satisfied(tText), sql: satisfied, format: ",d" },
          { name: "tolerating", label: words.tolerating(t4Text), sql: tolerating, format: ",d" },
          { name: "frustrated", label: words.frustrated(t4Text), sql: frustrated, format: ",d" },
          { name: "satisfied_share", label: words.satisfiedShare, sql: `round(100 * ${satisfied} / count(), 1)` },
          { name: "frustrated_share", label: words.frustratedShare, sql: `round(100 * ${frustrated} / count(), 1)` },
          { name: "apdex_credit", label: words.credit, sql: creditSql(apdex, sla.performance, language) },
          { name: "p95_ms", label: "p95 (ms)", sql: "round(quantile(0.95)(duration_ms))", format: ",d" },
        ],
      ),
    ],
    variables: {
      availability_goal: percent(sla.availability.goal, language),
      apdex_goal: decimal(sla.performance.goal, 2, language),
      apdex_t: tText,
      apdex_tolerating: t4Text,
      service: sla.performance.service,
      span_name: sla.performance.spanName,
      source: sla.source ?? sla.title,
    },
    manifest: { requires: ["default.otel_traces"], readOnlyDatabases: ["sla"] },
  };
}
