/**
 * The overlay generates the analytics store and the tools around it:
 *
 * - clickhouse/001_raw.sql   the raw table, one row per entity, its latest version kept
 * - clickhouse/010_mart.sql  the views the dashboards read, in the shared `mart` database and
 *                            named after the client (mart.<client>_entities_created_daily):
 *                            created per day × type × every single-valued dimension, and one
 *                            view per multi-valued dimension
 * - dlt/projection.json      what the dlt pipeline reads from Mongo and where it writes it; each
 *                            column carries where the client's schema stores it (storage.ts)
 * - superset/…               a Superset import bundle: the database and a dataset per view,
 *                            labelled in Dutch from the client's translations
 *
 * Column names are the snake_case local names of the overlay's properties.
 */
import { createHash } from "crypto";
import { localName } from "../vocab.js";
import { translate, type TranslationBundle } from "./inventory.js";
import type { Overlay } from "./overlay.js";
import { accessorOf, mongoRoot, type Accessor } from "./storage.js";

const TIMESTAMP = "DateTime64(3, 'Europe/Brussels')";

export type Column = {
  name: string;
  /** the logical path it is read from, as the declaration names it */
  path: string;
  /** where the client's document schema stores that path */
  source: Accessor;
  kind: "id" | "type" | "time" | "audit" | "dimension";
  multiValued: boolean;
  labelKey?: string;
  label: string;
  clickhouse: string;
  /** the dlt data type hint */
  dlt: "text" | "timestamp" | "json";
  /** a relation: the values are identifiers, resolved to the targets' labels on loading */
  lookup?: { targetTypes: string[]; match: "identifiers"; label: Accessor };
};

export type GenerateOptions = {
  bundles: TranslationBundle[];
  /** the client, else the cube's namespace (https://elody.eu/analytics/<client>#…) */
  client?: string;
  /** the Mongo database, else the client */
  database?: string;
  /** the overlay's file, named in each file's header */
  source?: string;
};

const snake = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9_]/g, "_").toLowerCase();

export const clientOf = (overlay: Overlay): string => /\/analytics\/([^/#]+)#/.exec(overlay.cube)?.[1] ?? localName(overlay.cube);

/** The raw table's columns: the entity's bookkeeping first, then the overlay's dimensions; labels unique. */
export function columnsOf(overlay: Overlay, bundles: TranslationBundle[]): Column[] {
  const byPath = new Map(overlay.dimensions.map((dimension) => [dimension.sourcePath, dimension]));
  const time = overlay.dimensions.find((dimension) => dimension.role === "Time");
  const type = overlay.dimensions.find((dimension) => dimension.role === "EntityType");
  const label = (key: string | undefined, fallback: string, overlayLabel?: string) => (key && translate(key, bundles)) || overlayLabel || fallback;
  const fixed = (name: string, path: string, kind: Column["kind"], clickhouse: string, dlt: Column["dlt"], labelKey: string): Column => {
    const dimension = byPath.get(path);
    const key = dimension?.labelKey ?? labelKey;
    return { name, path, source: accessorOf(path, overlay.schema), kind, multiValued: false, labelKey: key, label: label(key, name, dimension?.label), clickhouse, dlt };
  };
  const columns: Column[] = [
    { ...fixed("id", "_id", "id", "String", "text", "metadata.labels.id"), source: { path: "_id" } },
    fixed("type", type?.sourcePath ?? "type", "type", "LowCardinality(String)", "text", "metadata.labels.type"),
    fixed("created_at", time?.sourcePath ?? "audit.created.at", "time", `Nullable(${TIMESTAMP})`, "timestamp", "metadata.labels.created-at"),
    fixed("created_by", "audit.created.by", "audit", "String", "text", "metadata.labels.created-by"),
    fixed("updated_at", "audit.updated.at", "audit", TIMESTAMP, "timestamp", "metadata.labels.updated-at"),
    fixed("updated_by", "audit.updated.by", "audit", "String", "text", "metadata.labels.updated-by"),
  ];
  const taken = new Set(columns.map((column) => column.name));
  const fixedPaths = new Set(columns.map((column) => column.path));
  for (const dimension of overlay.dimensions) {
    if (dimension.role || fixedPaths.has(dimension.sourcePath)) continue;
    let name = snake(localName(dimension.property));
    while (taken.has(name)) name = `${name}_`;
    taken.add(name);
    columns.push({
      name,
      path: dimension.sourcePath,
      source: accessorOf(dimension.sourcePath, overlay.schema),
      kind: "dimension",
      multiValued: dimension.multiValued,
      labelKey: dimension.labelKey,
      label: label(dimension.labelKey, name, dimension.label),
      clickhouse: dimension.multiValued ? "Array(LowCardinality(String))" : "LowCardinality(String)",
      dlt: dimension.multiValued ? "json" : "text",
      ...(dimension.via
        ? { lookup: { targetTypes: dimension.via.targetTypes, match: "identifiers" as const, label: accessorOf(dimension.via.labelPath, overlay.schema) } }
        : {}),
    });
  }
  // two columns with one label read the same in Superset: the later ones say which column they are
  const seen = new Set<string>();
  for (const column of columns) {
    if (seen.has(column.label)) column.label = `${column.label} (${column.name})`;
    seen.add(column.label);
  }
  return columns;
}

const quote = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

const header = (source?: string) => `-- Generated by \`elody-ui analytics generate\`${source ? ` from ${source}` : ""}; do not edit.`;

function rawSql(columns: Column[], table: string, source?: string): string {
  const width = Math.max(...columns.map((column) => column.name.length));
  const lines = columns.map((column) => `    ${column.name.padEnd(width)} ${column.clickhouse}${column.kind === "id" ? "" : ` COMMENT ${quote(column.path)}`},`);
  return [
    header(source),
    "-- One row per entity; a reload inserts a newer version, ReplacingMergeTree keeps the latest (read with FINAL).",
    "CREATE DATABASE IF NOT EXISTS raw;",
    "",
    `CREATE TABLE IF NOT EXISTS raw.${table}`,
    "(",
    ...lines,
    `    ${"ingested_at".padEnd(width)} DateTime DEFAULT now()`,
    ")",
    "ENGINE = ReplacingMergeTree(updated_at)",
    "ORDER BY (type, id);",
    "",
  ].join("\n");
}

export const DAILY_VIEW = "entities_created_daily";
export const byView = (column: Column) => `entities_created_by_${column.name}`;

const MART = "mart";
/** A view's name: the client's prefix, so clients share the mart and Superset's dataset names stay unique. */
const viewName = (client: string, base: string) => `${client}_${base}`;

function martSql(columns: Column[], table: string, client: string, source?: string): string {
  const single = columns.filter((column) => column.kind === "dimension" && !column.multiValued).map((column) => column.name);
  const multi = columns.filter((column) => column.multiValued);
  const keys = ["day", "type", "created_by", ...single];
  const day = "toDate(assumeNotNull(created_at)) AS day";
  const view = (name: string, select: string[], from: string[], group: string[]) => [
    `CREATE OR REPLACE VIEW ${MART}.${viewName(client, name)} AS`,
    "SELECT",
    ...[...select, "count() AS entity_count"].map((line, index, all) => `    ${line}${index < all.length - 1 ? "," : ""}`),
    ...from,
    "WHERE created_at IS NOT NULL",
    `GROUP BY ${group.join(", ")};`,
    "",
  ];
  return [
    header(source),
    "-- Entities created per day; an entity without a creation date is not counted.",
    `CREATE DATABASE IF NOT EXISTS ${MART};`,
    "",
    ...view(DAILY_VIEW, [day, ...keys.slice(1)], [`FROM raw.${table} FINAL`], keys),
    ...multi.flatMap((column) => [
      `-- ${column.label}: holds a list, one row per value (an entity counts once per value, not at all without one).`,
      ...view(byView(column), [day, "type", column.name], [`FROM raw.${table} FINAL`, `ARRAY JOIN ${column.name}`], ["day", "type", column.name]),
    ]),
  ].join("\n");
}

function projection(overlay: Overlay, columns: Column[], options: { client: string; database: string; table: string; source?: string }) {
  const storedAt = (name: string) => {
    const accessor = columns.find((column) => column.name === name)!.source;
    if (!("path" in accessor) || "list" in accessor) throw new Error(`${name} must be stored at a path to serve as the incremental cursor`);
    return accessor.path;
  };
  return {
    $comment: `Generated by \`elody-ui analytics generate\`${options.source ? ` from ${options.source}` : ""}; do not edit.`,
    client: options.client,
    database: options.database,
    schema: overlay.schema,
    collections: overlay.sourceCollections,
    filter: { type: { $in: overlay.entityTypes } },
    projection: Object.fromEntries([...new Set(["type", ...columns.map((column) => mongoRoot(column.source))])].map((root) => [root, 1])),
    columns: columns.map((column) => ({
      name: column.name,
      path: column.path,
      source: column.source,
      type: column.dlt,
      clickhouse: column.clickhouse,
      ...(column.multiValued ? { multiValued: true } : {}),
      ...(column.kind === "id" ? { cast: "string" } : {}),
      ...(column.lookup ? { lookup: column.lookup } : {}),
    })),
    primaryKey: "id",
    incremental: {
      cursor: storedAt("updated_at"),
      // most authority records were never changed in Elody: their creation date stands in, and is the row's version
      fallback: storedAt("created_at"),
      column: "updated_at",
    },
    notes: [
      "A date may be a string (\"2010-09-29 00:00:00\"): parse it as Europe/Brussels.",
      "updated_at is the version of the row: the update date, else the creation date, else 1970-01-01.",
      "A multi-valued column is a list of strings; a single value is wrapped in one.",
      "A column with a lookup holds identifiers of entities of its target types: load it as their labels (an identifier without a target stays as it is).",
    ],
    destination: { dataset: "raw", table: options.table },
    mart: { daily: `${MART}.${viewName(options.client, DAILY_VIEW)}` },
  };
}

// --- Superset

const NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8"; // RFC 4122 URL namespace

/** A name-based (v5) uuid, so a regenerated bundle updates the same Superset objects. */
export function uuidFor(client: string, kind: string, name: string): string {
  const namespace = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(namespace).update(`https://elody.eu/analytics/${client}/${kind}/${name}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type Yaml = string | number | boolean | null | Yaml[] | { [key: string]: Yaml };

/** Block YAML; strings are always double-quoted (JSON strings are YAML), so `yes` or `1.0` stay strings. */
export function toYaml(value: Yaml, indent = ""): string {
  const scalar = (item: Yaml): string | undefined => {
    if (item === null) return "null";
    if (typeof item === "string") return JSON.stringify(item);
    if (typeof item === "number" || typeof item === "boolean") return String(item);
    if (Array.isArray(item) && !item.length) return "[]";
    if (!Array.isArray(item) && typeof item === "object" && !Object.keys(item).length) return "{}";
    return undefined;
  };
  if (Array.isArray(value))
    return value
      .map((item) => {
        const inline = scalar(item);
        if (inline !== undefined) return `${indent}- ${inline}\n`;
        const body = toYaml(item, `${indent}  `);
        return `${indent}- ${body.slice(indent.length + 2)}`;
      })
      .join("");
  if (value && typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) => {
        const inline = scalar(item);
        return inline !== undefined ? `${indent}${key}: ${inline}\n` : `${indent}${key}:\n${toYaml(item, Array.isArray(item) ? indent : `${indent}  `)}`;
      })
      .join("");
  return `${indent}${scalar(value)}\n`;
}

const SUPERSET_DATABASE = "clickhouse_analytics";

function supersetColumn(name: string, label: string, type: string, options: { dttm?: boolean; groupby?: boolean; description?: string } = {}): Yaml {
  return {
    column_name: name,
    verbose_name: label,
    is_dttm: options.dttm ?? false,
    is_active: true,
    type,
    advanced_data_type: null,
    groupby: options.groupby ?? true,
    filterable: options.groupby ?? true,
    expression: null,
    description: options.description ?? null,
    python_date_format: null,
    extra: {},
  };
}

// one connection for every client: each client's views are a schema (a ClickHouse database) of it
const SHARED = "elody";

function dataset(client: string, view: string, description: string, columns: Yaml[]): Yaml {
  return {
    table_name: viewName(client, view),
    main_dttm_col: "day",
    description,
    default_endpoint: null,
    offset: 0,
    cache_timeout: null,
    schema: MART,
    sql: null,
    params: null,
    template_params: null,
    filter_select_enabled: true,
    fetch_values_predicate: null,
    extra: null,
    normalize_columns: false,
    always_filter_main_dttm: false,
    uuid: uuidFor(client, "dataset", view),
    metrics: [
      {
        metric_name: "count",
        verbose_name: "Aantal entiteiten",
        metric_type: "sum",
        expression: "SUM(entity_count)",
        description: "Het aantal aangemaakte entiteiten.",
        d3format: ",d",
        currency: null,
        extra: {},
        warning_text: null,
      },
    ],
    columns,
    version: "1.0.0",
    database_uuid: uuidFor(SHARED, "database", SUPERSET_DATABASE),
  };
}

function superset(columns: Column[], client: string): Map<string, string> {
  const files = new Map<string, string>();
  const byName = new Map(columns.map((column) => [column.name, column]));
  const time = byName.get("created_at")!;
  const dimension = (column: Column) => supersetColumn(column.name, column.label, column.multiValued ? "String" : "LowCardinality(String)", { description: column.path });
  const day = supersetColumn("day", time.label, "Date", { dttm: true, description: `the day of ${time.path}` });
  const count = supersetColumn("entity_count", "Aantal (per rij)", "UInt64", { groupby: false });
  files.set("superset/metadata.yaml", toYaml({ version: "1.0.0", type: "SqlaTable", timestamp: "1970-01-01T00:00:00+00:00" }));
  files.set(
    `superset/databases/${SUPERSET_DATABASE}.yaml`,
    toYaml({
      database_name: "Analytics (ClickHouse)",
      sqlalchemy_uri: "clickhousedb://default:XXXXXXXXXX@clickhouse:8123/default",
      cache_timeout: null,
      expose_in_sqllab: true,
      allow_run_async: false,
      allow_ctas: false,
      allow_cvas: false,
      allow_dml: false,
      allow_file_upload: false,
      extra: { allows_virtual_table_explore: true },
      uuid: uuidFor(SHARED, "database", SUPERSET_DATABASE),
      version: "1.0.0",
    }),
  );
  const single = columns.filter((column) => column.kind === "type" || column.name === "created_by" || (column.kind === "dimension" && !column.multiValued));
  files.set(
    `superset/datasets/${SUPERSET_DATABASE}/${viewName(client, DAILY_VIEW)}.yaml`,
    toYaml(dataset(client, DAILY_VIEW, "Aangemaakte entiteiten per dag, type en kenmerk.", [day, ...single.map(dimension), count])),
  );
  for (const column of columns.filter((entry) => entry.multiValued))
    files.set(
      `superset/datasets/${SUPERSET_DATABASE}/${viewName(client, byView(column))}.yaml`,
      toYaml(dataset(client, byView(column), `Aangemaakte entiteiten per dag, type en ${column.label.toLowerCase()}; een entiteit telt eenmaal per waarde.`, [day, dimension(byName.get("type")!), dimension(column), count])),
    );
  return files;
}

/** Every generated file, by its path under the output directory. */
export function generateAnalytics(overlay: Overlay, options: GenerateOptions): Map<string, string> {
  const client = options.client ?? clientOf(overlay);
  const table = `${client}_entities`;
  const columns = columnsOf(overlay, options.bundles);
  return new Map([
    ["clickhouse/001_raw.sql", rawSql(columns, table, options.source)],
    ["clickhouse/010_mart.sql", martSql(columns, table, client, options.source)],
    ["dlt/projection.json", JSON.stringify(projection(overlay, columns, { client, database: options.database ?? client, table, source: options.source }), null, 2) + "\n"],
    ...superset(columns, client),
  ]);
}
