/**
 * Dashboard declarations (ea:Dashboard, ontology/dashboard.shapes.ttl): the
 * charts and texts of a Superset dashboard over named datasets. The renderer
 * knows no domain: a layer under the dashboard (the SLA, the overlay) gives
 * the datasets, their metrics and the {placeholders} its texts may use.
 *
 * An item is drawn as:
 * - ea:BigNumber   big_number_total: ea:measure over ea:period
 * - ea:Table       table (aggregate): ea:groupBy × ea:measures, sorted by ea:sortBy
 * - ea:TimeSeries  echarts_timeseries_line/_bar over the dataset's time column
 * - ea:Ranking     horizontal echarts_timeseries_bar: the top ea:limit of ea:dimension
 * - ea:Markdown    a text block
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import rdfEnv from "@zazuko/env";
import { Parser, type Quad, type Term } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { Reading } from "../reading.js";
import type { ValidationIssue, ValidationReport } from "../validate.js";
import { rdfs } from "../vocab.js";
import { uuidFor, type Yaml } from "./generate.js";
import { ANALYTICS_VOCABULARY_PATH, EA } from "./overlay.js";
import { chartYaml, dashboardYaml, databaseYaml, datasetYaml, metadataYaml, type DatasetDef } from "./superset.js";

const ea = (local: string) => `${EA}${local}`;
const DASHBOARD_SHAPES_PATH = join(dirname(ANALYTICS_VOCABULARY_PATH), "dashboard.shapes.ttl");

export type Inline = { label: string; sql: string };
/** a dataset metric's or column's name, or an inline SQL expression */
export type Ref = string | Inline;
export type Kind = "BigNumber" | "Table" | "TimeSeries" | "Ranking" | "Markdown";
export type Period = "CurrentMonth" | "Last90Days" | "AllTime";

export type Item = {
  kind: Kind;
  key: string;
  title?: string;
  dataset?: string;
  measures: Ref[];
  groupBy: Ref[];
  period: Period;
  dimension?: string;
  subheader?: string;
  format?: string;
  style?: "Line" | "Bar" | "StackedBar";
  timeGrain?: string;
  sortBy?: string;
  ascending?: boolean;
  limit?: number;
  search?: boolean;
  text?: string;
  width: number;
  height: number;
};

export type Dashboard = { subject: string; title: string; slug: string; items: Item[] };

export type RenderOptions = {
  client: string;
  /** what {name} in a title, subheader, label or text stands for */
  variables?: Record<string, string>;
};

const KINDS: Kind[] = ["BigNumber", "Table", "TimeSeries", "Ranking", "Markdown"];

export const slugOf = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// --- reading

function refOf(reading: Reading, term: Term): Ref {
  if (term.termType === "Literal") return term.value;
  return { label: reading.value(term.value, rdfs("label")) ?? "", sql: reading.value(term.value, ea("sql")) ?? "" };
}

function refs(reading: Reading, subject: string, predicate: string): Ref[] {
  const head = reading.term(subject, predicate);
  if (!head) return [];
  if (head.termType === "Literal") return [head.value];
  const members = reading.listTerms(head.value);
  return members ? members.map((term) => refOf(reading, term)) : [refOf(reading, head)];
}

function readItem(reading: Reading, node: string, index: number): Item {
  const kind = KINDS.find((candidate) => reading.types(node).includes(ea(candidate)));
  if (!kind) throw new Error(`item ${index + 1} has no kind (a ea:BigNumber, ea:Table, ea:TimeSeries, ea:Ranking or ea:Markdown)`);
  const title = reading.value(node, rdfs("label"));
  const literal = (local: string) => reading.literal(node, ea(local));
  const number = (local: string) => (literal(local) === undefined ? undefined : Number(literal(local)));
  const local = (local: string) => reading.node(node, ea(local))?.replace(EA, "");
  const measure = reading.term(node, ea("measure"));
  return {
    kind,
    key: reading.value(node, ea("key")) ?? (title ? slugOf(title) : `${kind.toLowerCase()}-${index + 1}`),
    ...(title === undefined ? {} : { title }),
    ...(reading.value(node, ea("dataset")) === undefined ? {} : { dataset: reading.value(node, ea("dataset")) }),
    measures: measure ? [refOf(reading, measure)] : refs(reading, node, ea("measures")),
    groupBy: refs(reading, node, ea("groupBy")),
    period: (local("period") as Period | undefined) ?? "AllTime",
    ...Object.fromEntries(
      (
        [
          ["dimension", reading.value(node, ea("dimension"))],
          ["subheader", reading.value(node, ea("subheader"))],
          ["format", reading.value(node, ea("format"))],
          ["style", local("style")],
          ["timeGrain", reading.value(node, ea("timeGrain"))],
          ["sortBy", reading.value(node, ea("sortBy"))],
          ["ascending", literal("ascending")],
          ["limit", number("limit")],
          ["search", literal("search")],
          ["text", reading.value(node, ea("text"))],
        ] as [string, unknown][]
      ).filter(([, value]) => value !== undefined),
    ),
    width: number("width") ?? 6,
    height: number("height") ?? 50,
  };
}

export function readDashboards(ttl: string): Dashboard[] {
  const reading = new Reading(new Parser().parse(ttl));
  return reading.subjectsOfType(ea("Dashboard")).map((subject) => {
    const head = reading.node(subject, ea("items"));
    const items = (reading.listTerms(head) ?? []).map((term, index) => readItem(reading, term.value, index));
    const keys = items.map((item) => item.key);
    const twice = keys.find((key, index) => keys.indexOf(key) !== index);
    if (twice) throw new Error(`two items of ${subject} are called "${twice}": give one an ea:key`);
    return { subject, title: reading.value(subject, rdfs("label")) ?? "", slug: reading.value(subject, ea("slug")) ?? "", items };
  });
}

let shapesCache: Quad[] | undefined;
let vocabularyCache: Quad[] | undefined;

/** The declaration against ontology/dashboard.shapes.ttl. */
export async function validateDashboards(ttl: string): Promise<ValidationReport> {
  let quads: Quad[];
  try {
    quads = new Parser().parse(ttl);
  } catch (error) {
    return { conforms: false, issues: [{ focusNode: "", message: `does not parse: ${(error as Error).message}`, severity: "Violation" }] };
  }
  shapesCache ??= new Parser().parse(readFileSync(DASHBOARD_SHAPES_PATH, "utf-8"));
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

// --- rendering

// Superset's "Last quarter" ends at midnight: the last 90 days up to now
const COMPARATORS: Record<Period, string> = {
  CurrentMonth: "Current month",
  Last90Days: 'DATEADD(DATETIME("now"), -90, day) : now',
  AllTime: "No filter",
};

function fill(text: string, variables: Record<string, string>, where: string): string {
  return text.replace(/\{([a-z0-9_]+)\}/g, (_, name: string) => {
    if (!(name in variables)) throw new Error(`${where}: no value for {${name}} (known: ${Object.keys(variables).join(", ") || "none"})`);
    return variables[name];
  });
}

function chartParams(item: Item, dataset: DatasetDef, fillText: (text: string) => string): { [key: string]: Yaml } {
  const where = `${item.title ?? item.key}`;
  const measure = (ref: Ref): Yaml => {
    if (typeof ref !== "string") return { expressionType: "SQL", sqlExpression: ref.sql, label: fillText(ref.label) };
    if (!dataset.metrics.some((metric) => metric.name === ref)) throw new Error(`${ref} is no metric of dataset ${dataset.name} (in ${where})`);
    return ref;
  };
  const group = (ref: Ref): Yaml => {
    if (typeof ref !== "string") return { expressionType: "SQL", sqlExpression: ref.sql, label: fillText(ref.label) };
    if (!dataset.columns.some((column) => column.name === ref)) throw new Error(`${ref} is no column of dataset ${dataset.name} (in ${where})`);
    return ref;
  };
  const period = [{ expressionType: "SIMPLE", subject: dataset.time, operator: "TEMPORAL_RANGE", comparator: COMPARATORS[item.period], clause: "WHERE" }];
  const label = (ref: Ref) => (typeof ref === "string" ? ref : fillText(ref.label));
  switch (item.kind) {
    case "BigNumber":
      return {
        viz_type: "big_number_total",
        metric: measure(item.measures[0]),
        adhoc_filters: period,
        subheader: fillText(item.subheader ?? ""),
        header_font_size: 0.3,
        subheader_font_size: 0.125,
        y_axis_format: item.format ?? ",.3f",
      };
    case "Table":
      return {
        viz_type: "table",
        query_mode: "aggregate",
        groupby: item.groupBy.map(group),
        metrics: item.measures.map(measure),
        adhoc_filters: period,
        ...(item.sortBy
          ? item.measures.some((ref) => label(ref) === item.sortBy)
            ? { timeseries_limit_metric: measure(item.measures.find((ref) => label(ref) === item.sortBy)!), order_desc: !(item.ascending ?? false) }
            : { order_by_cols: [JSON.stringify([item.sortBy, item.ascending ?? true])] }
          : {}),
        row_limit: item.limit ?? 1000,
        server_pagination: false,
        include_search: item.search ?? false,
      };
    case "TimeSeries":
      return {
        viz_type: item.style === "Line" ? "echarts_timeseries_line" : "echarts_timeseries_bar",
        x_axis: dataset.time,
        time_grain_sqla: item.timeGrain ?? "P1D",
        metrics: item.measures.map(measure),
        groupby: [],
        adhoc_filters: period,
        row_limit: 10000,
        rich_tooltip: true,
        show_legend: true,
        ...(item.style === "StackedBar" ? { stack: "Stack" } : {}),
        ...(item.format ? { y_axis_format: item.format } : {}),
      };
    case "Ranking": {
      const metric = measure(item.measures[0]);
      return {
        viz_type: "echarts_timeseries_bar",
        x_axis: group(item.dimension!) as string,
        x_axis_sort: typeof metric === "string" ? metric : label(item.measures[0]),
        x_axis_sort_asc: true,
        order_desc: true,
        metrics: [metric],
        groupby: [],
        adhoc_filters: period,
        orientation: "horizontal",
        row_limit: item.limit ?? 15,
        y_axis_format: item.format ?? ",d",
      };
    }
    default:
      throw new Error(`${item.kind} is not a chart`);
  }
}

/** Every dashboard as an import bundle (superset/…): the datasets its charts use, their databases, the charts, the dashboards. */
export function renderDashboards(dashboards: Dashboard[], datasets: DatasetDef[], options: RenderOptions): Map<string, string> {
  const variables = options.variables ?? {};
  const byName = new Map<string, DatasetDef>();
  for (const dataset of datasets) {
    if (byName.has(dataset.name)) throw new Error(`two datasets are called ${dataset.name}`);
    byName.set(dataset.name, dataset);
  }
  const files = new Map<string, string>([["superset/metadata.yaml", metadataYaml()]]);
  const used = new Set<string>();
  for (const dashboard of dashboards) {
    const uuid = (kind: string, key: string) => uuidFor(options.client, kind, `${dashboard.slug}/${key}`);
    const position: { [key: string]: Yaml } = {
      DASHBOARD_VERSION_KEY: "v2",
      ROOT_ID: { type: "ROOT", id: "ROOT_ID", children: ["GRID_ID"] },
      HEADER_ID: { type: "HEADER", id: "HEADER_ID", meta: { text: fill(dashboard.title, variables, dashboard.slug) } },
    };
    const rows: string[] = [];
    let row = "";
    let width = 12;
    dashboard.items.forEach((item, index) => {
      const fillText = (text: string) => fill(text, variables, `${dashboard.slug}: ${item.title ?? item.key}`);
      // rows of items whose widths add up to 12
      if (width + item.width > 12) {
        row = `ROW-${rows.length}`;
        rows.push(row);
        position[row] = { type: "ROW", id: row, children: [], parents: ["ROOT_ID", "GRID_ID"], meta: { background: "BACKGROUND_TRANSPARENT" } };
        width = 0;
      }
      width += item.width;
      const children = (position[row] as { children: Yaml[] }).children;
      if (item.kind === "Markdown") {
        const key = `MARKDOWN-${item.key}`;
        children.push(key);
        position[key] = { type: "MARKDOWN", id: key, children: [], parents: ["ROOT_ID", "GRID_ID", row], meta: { width: item.width, height: item.height, code: fillText(item.text ?? "") } };
        return;
      }
      const dataset = byName.get(item.dataset ?? "");
      if (!dataset) throw new Error(`${dashboard.slug}: ${item.title} draws dataset ${item.dataset}, which no layer gives (known: ${[...byName.keys()].join(", ")})`);
      used.add(dataset.name);
      const title = fillText(item.title ?? item.key);
      const chartUuid = uuid("chart", item.key);
      const params = { ...chartParams(item, dataset, fillText), datasource: `${dataset.name}__table` };
      files.set(`superset/charts/${item.key}.yaml`, chartYaml({ title, params, uuid: chartUuid, datasetUuid: dataset.uuid }));
      const key = `CHART-${item.key}`;
      children.push(key);
      position[key] = {
        type: "CHART",
        id: key,
        children: [],
        parents: ["ROOT_ID", "GRID_ID", row],
        meta: { chartId: index + 1, width: item.width, height: item.height, sliceName: title, uuid: chartUuid },
      };
    });
    position.GRID_ID = { type: "GRID", id: "GRID_ID", children: rows, parents: ["ROOT_ID"] };
    files.set(
      `superset/dashboards/${dashboard.slug}.yaml`,
      dashboardYaml({ title: fill(dashboard.title, variables, dashboard.slug), slug: dashboard.slug, uuid: uuidFor(options.client, "dashboard", dashboard.slug), position }),
    );
  }
  for (const name of used) {
    const dataset = byName.get(name)!;
    files.set(`superset/databases/${dataset.database.key}.yaml`, databaseYaml(dataset.database));
    files.set(`superset/datasets/${dataset.database.key}/${dataset.name}.yaml`, datasetYaml(dataset));
  }
  return files;
}
