/**
 * A bundle is a folder of declarations (clients/<client>/analytics/dashboards/
 * <name>/*.ttl): one or more ea:Dashboard, and the layers that give their
 * datasets: an ea:ServiceLevelAgreement (sla.ts), and with --overlay the
 * overlay's mart views (generate.ts). It becomes what elody-superset applies:
 *
 * - clickhouse/*.sql   the layers' SQL, applied in name order at every start
 * - superset/…         the dashboards' import bundle
 * - manifest.json      the tables to wait for, the read-only ClickHouse user
 *                      and its databases, the connections that get its
 *                      password, the dashboards' addresses
 */
import { readdirSync, readFileSync } from "fs";
import { basename, join } from "path";
import type { TranslationBundle } from "./inventory.js";
import { readDashboards, renderDashboards } from "./dashboard.js";
import { overlayDatasets } from "./generate.js";
import type { Overlay } from "./overlay.js";
import { readSla, slaParts } from "./sla.js";
import type { DatasetDef } from "./superset.js";

export type BundleOptions = {
  client: string;
  /** the overlay whose mart views the dashboards may draw */
  overlay?: { overlay: Overlay; bundles: TranslationBundle[] };
};

const READ_ONLY_USER = "superset";

/** Every file of the bundle, by its path under the output folder. */
export function buildBundle(dir: string, options: BundleOptions): Map<string, string> {
  const declarations = readdirSync(dir)
    .filter((name) => name.endsWith(".ttl"))
    .sort()
    .map((name) => ({ name, ttl: readFileSync(join(dir, name), "utf-8") }));
  const sql = new Map<string, string>();
  const datasets: DatasetDef[] = [];
  const variables: Record<string, string> = {};
  const requires = new Set<string>();
  const readOnlyDatabases = new Set<string>();

  for (const { name, ttl } of declarations) {
    if (!/ServiceLevelAgreement/.test(ttl)) continue;
    const parts = slaParts(readSla(ttl), options.client, name);
    for (const [file, content] of parts.sql) sql.set(file, content);
    datasets.push(...parts.datasets);
    Object.assign(variables, parts.variables);
    parts.manifest.requires.forEach((table) => requires.add(table));
    parts.manifest.readOnlyDatabases.forEach((database) => readOnlyDatabases.add(database));
  }
  if (options.overlay) {
    // the bundle's connection reads as the read-only user, not as default
    for (const dataset of overlayDatasets(options.overlay.overlay, options.overlay.bundles, options.client))
      datasets.push({ ...dataset, database: { ...dataset.database, uri: `clickhousedb://${READ_ONLY_USER}:XXXXXXXXXX@clickhouse:8123/mart` } });
    readOnlyDatabases.add("mart");
  }

  const dashboards = declarations.flatMap(({ ttl }) => readDashboards(ttl));
  if (!dashboards.length) throw new Error(`${dir}: no ea:Dashboard in the bundle's declarations`);
  const superset = renderDashboards(dashboards, datasets, { client: options.client, variables });
  const passwords = Object.fromEntries(
    [...superset.keys()]
      .filter((path) => path.startsWith("superset/databases/"))
      .map((path) => [path.replace(/^superset\//, ""), "readOnlyUser"]),
  );
  const manifest = {
    requires: [...requires].sort(),
    readOnlyUser: { name: READ_ONLY_USER, databases: [...readOnlyDatabases].sort() },
    passwords,
    dashboards: dashboards.map((dashboard) => `/superset/dashboard/${dashboard.slug}/`),
  };
  return new Map([
    ...[...sql].map(([file, content]) => [`clickhouse/${file}`, content] as [string, string]),
    ["manifest.json", JSON.stringify(manifest, null, 2) + "\n"],
    ...superset,
  ]);
}

/** The bundle's name: its folder's. */
export const bundleName = (dir: string) => basename(dir.replace(/\/+$/, ""));
