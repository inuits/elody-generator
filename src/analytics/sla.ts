/**
 * The SLA declaration (an ea:ServiceLevelAgreement, next to the client's
 * analytics overlay) generates what Superset reports the SLA from:
 *
 * - clickhouse/001_sla.sql   the sla database: sla.uptime (filled by
 *                            elody-superset's uptime check), sla.requests (a
 *                            materialized view over HyperDX's server spans of
 *                            the declared service, backfilled once); every
 *                            statement can run again at every start
 * - superset/…               a Superset dashboard import bundle: the connection
 *                            (as the read-only user), the two datasets, the
 *                            charts and the dashboard, with stable uuids so a
 *                            new bundle updates the same objects
 * - manifest.json            what elody-superset does around the bundle: the
 *                            tables to wait for, the read-only ClickHouse user
 *                            and which connection gets its password
 *
 * The goals, Apdex's T and the service credits come from the declaration; the
 * generic code that applies the bundle is elody-superset's.
 */
import { readFileSync } from "fs";
import rdfEnv from "@zazuko/env";
import { Parser, type Quad } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { Reading } from "../reading.js";
import type { ValidationIssue, ValidationReport } from "../validate.js";
import { rdfs } from "../vocab.js";
import { toYaml, uuidFor, type Yaml } from "./generate.js";
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

export type SlaOptions = { client: string; source?: string };

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

// --- the words of the dashboard

const WORDS = {
  nl: {
    none: "geen",
    goal: "doel",
    month: "Maand",
    availability: "Beschikbaarheid (%)",
    availabilityThisMonth: "Beschikbaarheid deze maand (%)",
    availabilityPerMonth: "Beschikbaarheid per maand",
    availabilityPerDay: "Beschikbaarheid per dag (%)",
    downtime: "Downtime (min)",
    checks: "Checks",
    credit: "Service credit",
    apdexThisMonth: "Apdex deze maand",
    apdexPerMonth: "Apdex per maand",
    apdexPerDay: "Apdex per dag",
    requests: "Requests",
    requestsThisMonth: (span: string) => `Requests deze maand (${span})`,
    measuredForApdex: "gemeten voor de Apdex",
    satisfiedShare: "Tevreden (%)",
    frustratedShare: "Ontevreden (%)",
    responseTimesPerDay: "Responstijden per dag",
    satisfied: (t: string) => `Tevreden (≤ ${t})`,
    tolerating: (t: string) => `Getolereerd (≤ ${t})`,
    frustrated: (t: string) => `Ontevreden (> ${t})`,
    slowest: "Traagste operaties deze maand",
    about: (sla: Sla, t: string, t4: string, availability: string, apdex: string) => `### Hoe deze SLA gemeten wordt

**Beschikbaarheid** (doel ${availability}): elke minuut een opvraging van het
health endpoint van deze omgeving over het internet. Een antwoord anders dan
200 binnen 10 seconden telt als een minuut downtime.

**Performantie** (doel Apdex ≥ ${apdex}): elke request van de service
\`${sla.performance.service}\` (\`${sla.performance.spanName}\`). Tevreden tot ${t},
getolereerd tot ${t4}, daarboven ontevreden. Apdex = (tevreden + getolereerd / 2)
/ alle requests.

**Service credits** per maand staan in de tabellen per maand. Gepland
onderhoud en overmacht trekken we er niet automatisch af.

**Reactie- en oplostijden per prioriteit** komen uit de servicedesk, niet uit
deze metingen.${sla.source ? `\n\nBron: ${sla.source}.` : ""}
`,
  },
  en: {
    none: "none",
    goal: "goal",
    month: "Month",
    availability: "Availability (%)",
    availabilityThisMonth: "Availability this month (%)",
    availabilityPerMonth: "Availability per month",
    availabilityPerDay: "Availability per day (%)",
    downtime: "Downtime (min)",
    checks: "Checks",
    credit: "Service credit",
    apdexThisMonth: "Apdex this month",
    apdexPerMonth: "Apdex per month",
    apdexPerDay: "Apdex per day",
    requests: "Requests",
    requestsThisMonth: (span: string) => `Requests this month (${span})`,
    measuredForApdex: "measured for the Apdex",
    satisfiedShare: "Satisfied (%)",
    frustratedShare: "Frustrated (%)",
    responseTimesPerDay: "Response times per day",
    satisfied: (t: string) => `Satisfied (≤ ${t})`,
    tolerating: (t: string) => `Tolerating (≤ ${t})`,
    frustrated: (t: string) => `Frustrated (> ${t})`,
    slowest: "Slowest operations this month",
    about: (sla: Sla, t: string, t4: string, availability: string, apdex: string) => `### How this SLA is measured

**Availability** (goal ${availability}): every minute a request of this
environment's health endpoint over the internet. Anything but a 200 within 10
seconds counts as a minute of downtime.

**Performance** (goal Apdex ≥ ${apdex}): every request of the service
\`${sla.performance.service}\` (\`${sla.performance.spanName}\`). Satisfied up to ${t},
tolerating up to ${t4}, frustrated above. Apdex = (satisfied + tolerating / 2)
/ all requests.

**Service credits** per month are in the monthly tables. Planned maintenance
and force majeure are not subtracted automatically.

**Response and resolution times per priority** come from the service desk,
not from these measurements.${sla.source ? `\n\nSource: ${sla.source}.` : ""}
`,
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

const header = (source?: string) => `-- Generated by \`elody-ui analytics sla\`${source ? ` from ${source}` : ""}; do not edit.`;

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

// --- Superset

const DATABASE = "clickhouse_sla";
const READ_ONLY_USER = "superset";
// Superset's "Last quarter" ends at midnight: the last 90 days up to now
const LAST_90_DAYS = 'DATEADD(DATETIME("now"), -90, day) : now';

type Chart = { key: string; title: string; dataset: "uptime" | "requests"; width: number; height: number; params: { [key: string]: Yaml } };

const metric = (label: string, sql: string): Yaml => ({ expressionType: "SQL", sqlExpression: sql, label });
const period = (column: string, comparator: string): Yaml => ({ expressionType: "SIMPLE", subject: column, operator: "TEMPORAL_RANGE", comparator, clause: "WHERE" });

function charts(sla: Sla): Chart[] {
  const { language } = sla;
  const words = WORDS[language];
  const t = sla.performance.thresholdMs;
  const satisfied = `countIf(duration_ms <= ${t})`;
  const tolerating = `countIf(duration_ms > ${t} AND duration_ms <= ${4 * t})`;
  const frustrated = `countIf(duration_ms > ${4 * t})`;
  const apdexSql = `round((${satisfied} + ${tolerating} / 2) / count(), 3)`;
  const availabilitySql = "round(100 * avg(ok), 3)";
  const apdex = metric("Apdex", apdexSql);
  const month: Record<string, string> = { checked_at: "formatDateTime(checked_at, '%Y-%m')", at: "formatDateTime(at, '%Y-%m')" };
  const availabilityGoal = percent(sla.availability.goal, language);
  const apdexGoal = decimal(sla.performance.goal, 2, language);
  const tText = seconds(t, language);
  const t4Text = seconds(4 * t, language);

  const bigNumber = (label: string, sql: string, column: string, subheader: string) => ({
    viz_type: "big_number_total",
    metric: metric(label, sql),
    adhoc_filters: [period(column, "Current month")],
    subheader,
    header_font_size: 0.3,
    subheader_font_size: 0.125,
    y_axis_format: ",.3f",
  });
  const perMonth = (column: string, metrics: Yaml[]) => ({
    viz_type: "table",
    query_mode: "aggregate",
    groupby: [{ expressionType: "SQL", sqlExpression: month[column], label: words.month }],
    metrics,
    adhoc_filters: [period(column, "No filter")],
    order_by_cols: [JSON.stringify([words.month, false])],
    row_limit: 24,
    server_pagination: false,
  });
  const perDay = (column: string, viz: string, metrics: Yaml[], extra: { [key: string]: Yaml } = {}) => ({
    viz_type: viz,
    x_axis: column,
    time_grain_sqla: "P1D",
    metrics,
    groupby: [],
    adhoc_filters: [period(column, LAST_90_DAYS)],
    row_limit: 10000,
    rich_tooltip: true,
    show_legend: true,
    ...extra,
  });

  return [
    { key: "availability-this-month", title: words.availabilityThisMonth, dataset: "uptime", width: 4, height: 30,
      params: bigNumber(words.availability, availabilitySql, "checked_at", `${words.goal} ${availabilityGoal}`) },
    { key: "apdex-this-month", title: words.apdexThisMonth, dataset: "requests", width: 4, height: 30,
      params: bigNumber("Apdex", apdexSql, "at", `${words.goal} ≥ ${apdexGoal} (T = ${tText})`) },
    { key: "requests-this-month", title: words.requestsThisMonth(sla.performance.spanName), dataset: "requests", width: 4, height: 30,
      params: { ...bigNumber(words.requests, "count()", "at", words.measuredForApdex), y_axis_format: ",d" } },
    { key: "availability-per-month", title: words.availabilityPerMonth, dataset: "uptime", width: 6, height: 50,
      params: perMonth("checked_at", [
        metric(words.availability, availabilitySql),
        metric(words.downtime, "countIf(ok = 0)"),
        metric(words.checks, "count()"),
        metric(words.credit, creditSql("avg(ok)", sla.availability, language)),
      ]) },
    { key: "apdex-per-month", title: words.apdexPerMonth, dataset: "requests", width: 6, height: 50,
      params: perMonth("at", [
        apdex,
        metric(words.requests, "count()"),
        metric(words.satisfiedShare, `round(100 * ${satisfied} / count(), 1)`),
        metric(words.frustratedShare, `round(100 * ${frustrated} / count(), 1)`),
        metric(words.credit, creditSql(apdexSql, sla.performance, language)),
      ]) },
    { key: "apdex-per-day", title: words.apdexPerDay, dataset: "requests", width: 6, height: 50,
      params: perDay("at", "echarts_timeseries_line", [apdex]) },
    { key: "response-times-per-day", title: words.responseTimesPerDay, dataset: "requests", width: 6, height: 50,
      params: perDay("at", "echarts_timeseries_bar", [
        metric(words.satisfied(tText), satisfied),
        metric(words.tolerating(t4Text), tolerating),
        metric(words.frustrated(t4Text), frustrated),
      ], { stack: "Stack" }) },
    { key: "availability-per-day", title: words.availabilityPerDay, dataset: "uptime", width: 6, height: 50,
      params: perDay("checked_at", "echarts_timeseries_bar", [metric(words.availability, availabilitySql)]) },
    { key: "slowest-operations", title: words.slowest, dataset: "requests", width: 6, height: 50,
      params: {
        viz_type: "table",
        query_mode: "aggregate",
        groupby: ["operation", "kind"],
        metrics: [apdex, metric(words.requests, "count()"), metric("p95 (ms)", "round(quantile(0.95)(duration_ms))")],
        timeseries_limit_metric: apdex,
        order_desc: false,
        adhoc_filters: [period("at", "Current month")],
        row_limit: 50,
        server_pagination: false,
        include_search: true,
      } },
  ];
}

const COLUMNS: Record<Chart["dataset"], { time: string; columns: [string, string][] }> = {
  uptime: { time: "checked_at", columns: [["checked_at", "DateTime"], ["target", "LowCardinality(String)"], ["ok", "UInt8"], ["status", "UInt16"], ["duration_ms", "UInt32"]] },
  requests: {
    time: "at",
    columns: [["at", "DateTime64(3)"], ["operation", "LowCardinality(String)"], ["kind", "LowCardinality(String)"], ["duration_ms", "UInt32"], ["status", "UInt16"], ["library", "LowCardinality(String)"]],
  },
};

function supersetFiles(sla: Sla, client: string): Map<string, string> {
  const files = new Map<string, string>();
  const uuid = (kind: string, name: string) => uuidFor(client, `sla/${kind}`, name);
  const databaseUuid = uuid("database", DATABASE);
  files.set("superset/metadata.yaml", toYaml({ version: "1.0.0", type: "Dashboard", timestamp: "1970-01-01T00:00:00+00:00" }));
  files.set(
    `superset/databases/${DATABASE}.yaml`,
    toYaml({
      database_name: "ClickHouse SLA",
      sqlalchemy_uri: `clickhousedb://${READ_ONLY_USER}:XXXXXXXXXX@clickhouse:8123/sla`,
      cache_timeout: null,
      expose_in_sqllab: true,
      allow_run_async: false,
      allow_ctas: false,
      allow_cvas: false,
      allow_dml: false,
      allow_file_upload: false,
      extra: { allows_virtual_table_explore: true },
      uuid: databaseUuid,
      version: "1.0.0",
    }),
  );
  for (const [table, { time, columns }] of Object.entries(COLUMNS))
    files.set(
      `superset/datasets/${DATABASE}/${table}.yaml`,
      toYaml({
        table_name: table,
        main_dttm_col: time,
        description: null,
        default_endpoint: null,
        offset: 0,
        cache_timeout: null,
        schema: "sla",
        sql: null,
        params: null,
        template_params: null,
        filter_select_enabled: true,
        fetch_values_predicate: null,
        extra: null,
        normalize_columns: false,
        always_filter_main_dttm: false,
        uuid: uuid("dataset", table),
        metrics: [],
        columns: columns.map(([name, type]) => ({
          column_name: name,
          verbose_name: null,
          is_dttm: name === time,
          is_active: true,
          type,
          advanced_data_type: null,
          groupby: true,
          filterable: true,
          expression: null,
          description: null,
          python_date_format: null,
          extra: {},
        })),
        version: "1.0.0",
        database_uuid: databaseUuid,
      }),
    );

  const slug = "sla";
  const position: { [key: string]: Yaml } = {
    DASHBOARD_VERSION_KEY: "v2",
    ROOT_ID: { type: "ROOT", id: "ROOT_ID", children: ["GRID_ID"] },
    HEADER_ID: { type: "HEADER", id: "HEADER_ID", meta: { text: sla.title } },
  };
  const rows: string[] = [];
  let row = "";
  let width = 12;
  charts(sla).forEach((chart, index) => {
    const chartUuid = uuid("chart", chart.key);
    files.set(
      `superset/charts/${chart.key}.yaml`,
      toYaml({
        slice_name: chart.title,
        description: null,
        certified_by: null,
        certification_details: null,
        viz_type: chart.params.viz_type as string,
        params: { ...chart.params, datasource: `${chart.dataset}__table` },
        query_context: null,
        cache_timeout: null,
        uuid: chartUuid,
        version: "1.0.0",
        dataset_uuid: uuid("dataset", chart.dataset),
      }),
    );
    // rows of charts whose widths add up to 12
    if (width + chart.width > 12) {
      row = `ROW-${rows.length}`;
      rows.push(row);
      position[row] = { type: "ROW", id: row, children: [], parents: ["ROOT_ID", "GRID_ID"], meta: { background: "BACKGROUND_TRANSPARENT" } };
      width = 0;
    }
    const key = `CHART-${chart.key}`;
    ((position[row] as { children: Yaml[] }).children).push(key);
    position[key] = {
      type: "CHART",
      id: key,
      children: [],
      parents: ["ROOT_ID", "GRID_ID", row],
      meta: { chartId: index + 1, width: chart.width, height: chart.height, sliceName: chart.title, uuid: chartUuid },
    };
    width += chart.width;
  });
  // how it is measured, under the charts
  const words = WORDS[sla.language];
  const aboutRow = `ROW-${rows.length}`;
  rows.push(aboutRow);
  position[aboutRow] = { type: "ROW", id: aboutRow, children: ["MARKDOWN-about"], parents: ["ROOT_ID", "GRID_ID"], meta: { background: "BACKGROUND_TRANSPARENT" } };
  position["MARKDOWN-about"] = {
    type: "MARKDOWN",
    id: "MARKDOWN-about",
    children: [],
    parents: ["ROOT_ID", "GRID_ID", aboutRow],
    meta: {
      width: 12,
      height: 40,
      code: words.about(sla, seconds(sla.performance.thresholdMs, sla.language), seconds(4 * sla.performance.thresholdMs, sla.language), percent(sla.availability.goal, sla.language), decimal(sla.performance.goal, 2, sla.language)),
    },
  };
  position.GRID_ID = { type: "GRID", id: "GRID_ID", children: rows, parents: ["ROOT_ID"] };
  files.set(
    `superset/dashboards/${slug}.yaml`,
    toYaml({
      dashboard_title: sla.title,
      description: null,
      css: "",
      slug,
      certified_by: null,
      certification_details: null,
      published: true,
      uuid: uuid("dashboard", slug),
      position,
      metadata: { color_scheme: "supersetColors", refresh_frequency: 0, native_filter_configuration: [], expanded_slices: {}, label_colors: {}, timed_refresh_immune_slices: [], cross_filters_enabled: false },
      version: "1.0.0",
    }),
  );
  return files;
}

/** Every generated file, by its path under the output directory. */
export function generateSla(sla: Sla, options: SlaOptions): Map<string, string> {
  if (!/^[A-Za-z0-9_.-]+$/.test(sla.performance.service)) throw new Error(`the SLA's service is not a service name: ${JSON.stringify(sla.performance.service)}`);
  if (!/^[A-Za-z0-9 _./-]+$/.test(sla.performance.spanName)) throw new Error(`the SLA's span name does not fit in SQL: ${JSON.stringify(sla.performance.spanName)}`);
  const manifest = {
    requires: ["default.otel_traces"],
    readOnlyUser: { name: READ_ONLY_USER, databases: ["sla"] },
    passwords: { [`databases/${DATABASE}.yaml`]: "readOnlyUser" },
    dashboards: ["/superset/dashboard/sla/"],
  };
  return new Map([
    ["clickhouse/001_sla.sql", clickhouseSql(sla, options.source)],
    ["manifest.json", JSON.stringify(manifest, null, 2) + "\n"],
    ...supersetFiles(sla, options.client),
  ]);
}
