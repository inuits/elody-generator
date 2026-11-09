/**
 * Superset's import format (version 1.0.0): the YAML of a database, a dataset,
 * a chart and a dashboard, as `superset export` writes them and `superset
 * import` (elody-superset's setup) reads them. Objects are tied together by
 * uuid; the generators give name-based ones, so a new bundle updates the same
 * objects.
 */
import { toYaml, type Yaml } from "./generate.js";

export type DatabaseDef = {
  /** the file's name under databases/, and the folder of its datasets */
  key: string;
  name: string;
  /** with the password masked (XXXXXXXXXX): the import fills it in */
  uri: string;
  uuid: string;
};

export type DatasetColumn = { name: string; label?: string | null; type: string; time?: boolean; groupable?: boolean; description?: string | null };
export type DatasetMetric = { name: string; label: string; sql: string; format?: string | null; description?: string | null; kind?: string | null };

export type DatasetDef = {
  /** the name a dashboard's charts use (ea:dataset): the table's or view's */
  name: string;
  schema: string;
  /** the time column (main_dttm_col) */
  time: string;
  description: string | null;
  uuid: string;
  columns: DatasetColumn[];
  metrics: DatasetMetric[];
  database: DatabaseDef;
};

export const metadataYaml = () => toYaml({ version: "1.0.0", type: "Dashboard", timestamp: "1970-01-01T00:00:00+00:00" });

export function databaseYaml(database: DatabaseDef): string {
  return toYaml({
    database_name: database.name,
    sqlalchemy_uri: database.uri,
    cache_timeout: null,
    expose_in_sqllab: true,
    allow_run_async: false,
    allow_ctas: false,
    allow_cvas: false,
    allow_dml: false,
    allow_file_upload: false,
    extra: { allows_virtual_table_explore: true },
    uuid: database.uuid,
    version: "1.0.0",
  });
}

export function datasetYaml(dataset: DatasetDef): string {
  return toYaml({
    table_name: dataset.name,
    main_dttm_col: dataset.time,
    description: dataset.description,
    default_endpoint: null,
    offset: 0,
    cache_timeout: null,
    schema: dataset.schema,
    sql: null,
    params: null,
    template_params: null,
    filter_select_enabled: true,
    fetch_values_predicate: null,
    extra: null,
    normalize_columns: false,
    always_filter_main_dttm: false,
    uuid: dataset.uuid,
    metrics: dataset.metrics.map((metric) => ({
      metric_name: metric.name,
      verbose_name: metric.label,
      metric_type: metric.kind ?? null,
      expression: metric.sql,
      description: metric.description ?? null,
      d3format: metric.format ?? null,
      currency: null,
      extra: {},
      warning_text: null,
    })),
    columns: dataset.columns.map((column) => ({
      column_name: column.name,
      verbose_name: column.label ?? null,
      is_dttm: column.time ?? false,
      is_active: true,
      type: column.type,
      advanced_data_type: null,
      groupby: column.groupable ?? true,
      filterable: column.groupable ?? true,
      expression: null,
      description: column.description ?? null,
      python_date_format: null,
      extra: {},
    })),
    version: "1.0.0",
    database_uuid: dataset.database.uuid,
  });
}

export function chartYaml(chart: { title: string; params: { [key: string]: Yaml }; uuid: string; datasetUuid: string }): string {
  return toYaml({
    slice_name: chart.title,
    description: null,
    certified_by: null,
    certification_details: null,
    viz_type: chart.params.viz_type as string,
    params: chart.params,
    query_context: null,
    cache_timeout: null,
    uuid: chart.uuid,
    version: "1.0.0",
    dataset_uuid: chart.datasetUuid,
  });
}

export function dashboardYaml(dashboard: { title: string; slug: string; uuid: string; position: { [key: string]: Yaml } }): string {
  return toYaml({
    dashboard_title: dashboard.title,
    description: null,
    css: "",
    slug: dashboard.slug,
    certified_by: null,
    certification_details: null,
    published: true,
    uuid: dashboard.uuid,
    position: dashboard.position,
    metadata: {
      color_scheme: "supersetColors",
      refresh_frequency: 0,
      native_filter_configuration: [],
      expanded_slices: {},
      label_colors: {},
      timed_refresh_immune_slices: [],
      cross_filters_enabled: false,
    },
    version: "1.0.0",
  });
}
