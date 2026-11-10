/**
 * The session overview (ea:SessionOverview) is a layer under a dashboard, like
 * the SLA: one row per browser tab, joined on the session id the PWA gives
 * both HyperDX's spans and OpenPanel's events. What counts as a page, a search
 * or a save is the client's and stands in its declaration, and so is the group
 * a user belongs to: the core only says who the user is (a pseudonym of their
 * id), the declaration says where the client's data model keeps its users and
 * their groups, and the overview links the two when it is read. Where HyperDX and
 * OpenPanel are differs per environment, so the links carry ${SETTINGS} that
 * elody-superset fills in. The SQL also runs on ClickHouse when its image is
 * present.
 */
import { execFileSync, spawnSync } from "child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { buildBundle } from "../src/analytics/bundle.js";
import { readDashboards, renderDashboards, validateDashboards } from "../src/analytics/dashboard.js";
import { countSql, readSessions, sessionParts, validateSessions } from "../src/analytics/sessions.js";

const fixtures = join(__dirname, "fixtures", "analytics");
const read = (name: string) => readFileSync(join(fixtures, name), "utf-8");
const ttl = read("podiumnet.sessions.ttl");
const overview = readSessions(ttl);
// with the group a user belongs to, from the client's data model
const grouped = ttl.replace('  ea:language "nl" ;\n', `  ea:language "nl" ;\n  ea:userGroup [\n    rdfs:label "Organisatie" ;\n    ea:users "users_actual" ; ea:membership "ref_organizations" ;\n    ea:groups "organizations_actual" ; ea:groupName "name" ] ;\n`);
const parts = sessionParts(overview, "podiumnet", "sessions.ttl");
const sql = parts.sql.get("001_sessions.sql")!;

describe("session overview: the declaration", () => {
  it("reads the browser's service, its error spans and what the client counts", () => {
    expect(overview).toMatchObject({
      subject: "https://elody.eu/analytics/podiumnet#Sessions",
      title: "Sessies",
      language: "nl",
      browserService: "pwa",
      browserErrors: ["console.error", "unhandledrejection"],
    });
    expect(overview.userGroup).toBeUndefined();
    expect(readSessions(grouped).userGroup).toEqual({
      label: "Organisatie",
      users: "users_actual",
      membership: "ref_organizations",
      groups: "organizations_actual",
      groupName: "name",
    });
    expect(overview.counts.map((count) => count.key)).toEqual(["pages", "searches", "filters", "forms", "bulk", "saves"]);
    expect(overview.counts[0]).toEqual({ key: "pages", label: "Pagina's", events: ["screen_view"] });
    expect(overview.counts[5]).toEqual({ key: "saves", label: "Opslagen", events: [], property: "kind", value: "mutation" });
  });

  it("conforms to the shapes, and says what is wrong", async () => {
    expect((await validateSessions(ttl)).conforms).toBe(true);
    const broken = ttl
      .replace('ea:browserService "pwa" ;', "")
      .replace('ea:key "pages"', 'ea:key "Pages!"')
      .replace('; ea:event "search" ]', "]")
      .replace('ea:key "saves"', 'ea:key "user_groups"');
    const report = await validateSessions(broken);
    expect(report.conforms).toBe(false);
    const messages = report.issues.map((issue) => issue.message).join("\n");
    expect(messages).toMatch(/browserService/);
    expect(messages).toMatch(/ea:key/);
    expect(messages).toMatch(/ea:event/);
    // a count may not take the name of one of the overview's own columns
    expect(messages).toMatch(/own columns/);
  });

  it("wants a user group whole: its title, the users, how they belong, the groups and their name", async () => {
    expect((await validateSessions(grouped)).conforms).toBe(true);
    const report = await validateSessions(grouped.replace('ea:groups "organizations_actual" ; ', "").replace('"users_actual"', '"users; DROP"'));
    const messages = report.issues.map((issue) => issue.message).join("\n");
    expect(messages).toMatch(/ea:groups/);
    expect(messages).toMatch(/ea:users/);
  });
});

describe("session overview: the layer under its dashboard", () => {
  it("counts by event name, by a property's value, or both", () => {
    expect(countSql({ key: "pages", label: "", events: ["screen_view"] })).toBe("countIf(name = 'screen_view')");
    expect(countSql({ key: "x", label: "", events: ["a", "b"] })).toBe("countIf(name IN ('a', 'b'))");
    expect(countSql({ key: "saves", label: "", events: [], property: "kind", value: "mutation" })).toBe("countIf(properties['kind'] = 'mutation')");
    expect(countSql({ key: "x", label: "", events: ["a"], property: "kind", value: "m" })).toBe("countIf(name = 'a' AND properties['kind'] = 'm')");
  });

  it("gives one view over HyperDX's spans and OpenPanel's events, which the read-only user reads without reading those", () => {
    expect([...parts.sql.keys()]).toEqual(["001_sessions.sql"]);
    expect(sql).toMatch(/^-- Generated by `elody-ui analytics bundle` from sessions.ttl; do not edit./);
    expect(sql).toContain("CREATE DATABASE IF NOT EXISTS usage;");
    expect(sql).toContain("CREATE OR REPLACE VIEW usage.sessions\nDEFINER = CURRENT_USER SQL SECURITY DEFINER AS");
    expect(sql).toContain("FROM default.otel_traces");
    expect(sql).toContain("FROM openpanel.events");
    expect(sql).toContain("WHERE service = 'pwa' AND tab_session != ''");
    expect(sql).toContain("countIf(span IN ('console.error', 'unhandledrejection')) AS browser_errors");
    expect(sql).toContain("countIf(properties['kind'] = 'mutation') AS saves");
    expect(parts.manifest.requires).toEqual(["default.otel_traces", "openpanel.events"]);
    expect(parts.manifest.readOnlyDatabases).toEqual(["usage"]);
  });

  it("leaves where HyperDX and OpenPanel are to the environment, as settings", () => {
    expect(parts.manifest.settings).toEqual(["HYPERDX_SESSION_SOURCE", "HYPERDX_URL", "OPENPANEL_ORG", "OPENPANEL_URL"]);
    expect(sql).toContain("'<a href=\"${HYPERDX_URL}/sessions?sessionSource=${HYPERDX_SESSION_SOURCE}&sid='");
    expect(sql).toContain("'<a href=\"${OPENPANEL_URL}/${OPENPANEL_ORG}/'");
    // every ${…} in the SQL is a declared setting
    const used = [...new Set([...sql.matchAll(/\$\{([A-Z_]+)\}/g)].map((match) => match[1]))].sort();
    expect(used).toEqual(parts.manifest.settings);
  });

  it("gives the dataset sessions, with the client's counts as columns under their labels", () => {
    const [dataset] = parts.datasets;
    expect(dataset).toMatchObject({ name: "sessions", schema: "usage", time: "started" });
    expect(dataset.database.uri).toBe("clickhousedb://superset:XXXXXXXXXX@clickhouse:8123/usage");
    expect(dataset.columns.map((column) => column.name)).toEqual([
      "session", "started", "ended", "minutes", "user", "pages", "searches", "filters", "forms", "bulk", "saves",
      "browser_errors", "backend_traces", "backend_errors", "replay", "events",
    ]);
    expect(sql).not.toContain("MongoDB");
    expect(parts.manifest.readOnlyDatabases).toEqual(["usage"]);
    const label = (name: string) => dataset.columns.find((column) => column.name === name)!.label;
    expect(label("forms")).toBe("Formulieren");
    expect(label("started")).toBe("Begin");
    expect(label("replay")).toBe("Replay (HyperDX)");
    expect(sessionParts({ ...overview, language: "en" }, "podiumnet").datasets[0].columns.find((column) => column.name === "started")!.label).toBe("Start");
  });

  it("links a user to their groups through the client's data model, when the declaration says where", () => {
    const withGroup = sessionParts(readSessions(grouped), "podiumnet");
    const groupSql = withGroup.sql.get("001_sessions.sql")!;
    const columns = withGroup.datasets[0].columns;
    expect(columns.map((column) => column.name).slice(4, 7)).toEqual(["user", "user_groups", "pages"]);
    expect(columns.find((column) => column.name === "user_groups")!.label).toBe("Organisatie");
    // the client's own collections, read where they are (the instance's MongoDB), not copied
    expect(groupSql).toContain("CREATE OR REPLACE TABLE elody_source.users\n(\n    identifiers Array(String),\n    properties  String\n)\nENGINE = MongoDB(elody_mongo, collection = 'users_actual');");
    expect(groupSql).toContain("ENGINE = MongoDB(elody_mongo, collection = 'organizations_actual');");
    // the same pseudonym as the PWA and graphql give a user: of every identifier, one of which is their id
    expect(groupSql).toContain("lower(substring(hex(SHA256(concat('elody:', identifier))), 1, 16)) AS pseudonym");
    expect(groupSql).toContain("JSONExtractArrayRaw(properties, 'ref_organizations')");
    expect(groupSql).toContain("JSONExtractString(properties, 'name', 1, 'value')");
    // the read-only user reads the overview, never the users themselves
    expect(withGroup.manifest.readOnlyDatabases).toEqual(["usage"]);
    expect(groupSql).not.toMatch(/teamId|elody\.library/);
  });

  it("refuses a name that does not fit in SQL", () => {
    expect(() => sessionParts({ ...overview, browserService: "pwa' OR 1=1" }, "podiumnet")).toThrow(/browserService/);
    expect(() => sessionParts({ ...overview, counts: [{ key: "x", label: "X", events: ["a'b"] }] }, "podiumnet")).toThrow(/event/);
  });
});

describe("a dashboard of rows", () => {
  const dashboardTtl = read("sessions.dashboard.ttl");
  const [dashboard] = readDashboards(dashboardTtl);
  const files = renderDashboards([dashboard], parts.datasets, { client: "podiumnet", variables: parts.variables });

  it("reads ea:Rows with its columns, and conforms to the shapes", async () => {
    expect(dashboard.items[0]).toMatchObject({ kind: "Rows", dataset: "sessions", sortBy: "started", ascending: false, search: true });
    expect(dashboard.items[0].columns.slice(0, 3)).toEqual(["started", "ended", "minutes"]);
    expect((await validateDashboards(dashboardTtl)).conforms).toBe(true);
    const report = await validateDashboards(dashboardTtl.replace(/ea:columns \([^)]*\) ;/, ""));
    expect(report.issues.map((issue) => issue.message).join("\n")).toMatch(/ea:columns/);
  });

  it("draws the rows as they are, newest first, with their links as links", () => {
    const chart = files.get("superset/charts/sessies.yaml")!;
    expect(chart).toMatch(/^viz_type: "?table"?$/m);
    expect(chart).toMatch(/query_mode: "?raw"?$/m);
    expect(chart).toMatch(/allow_render_html: true$/m);
    expect(chart).toMatch(/all_columns:\n\s+- "?started"?\n\s+- "?ended"?\n/);
    expect(chart).toContain('[\\"started\\",false]');
    expect(files.get("superset/datasets/clickhouse_usage/sessions.yaml")).toMatch(/verbose_name: "?Formulieren"?$/m);
  });

  it("refuses a column the dataset does not have", () => {
    const broken = readDashboards(dashboardTtl.replace('"minutes"', '"hours"'));
    expect(() => renderDashboards(broken, parts.datasets, { client: "podiumnet" })).toThrow(/hours is no column of dataset sessions/);
  });
});

describe("analytics bundle: the sessions folder", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "bundle-")), "sessions");
  mkdirSync(dir);
  writeFileSync(join(dir, "sessions.ttl"), ttl);
  writeFileSync(join(dir, "sessions.dashboard.ttl"), read("sessions.dashboard.ttl"));
  const bundle = buildBundle(dir, { client: "podiumnet" });

  it("names in the manifest the settings the environment has to give", () => {
    expect(JSON.parse(bundle.get("manifest.json")!)).toEqual({
      requires: ["default.otel_traces", "openpanel.events"],
      readOnlyUser: { name: "superset", databases: ["usage"] },
      passwords: { "databases/clickhouse_usage.yaml": "readOnlyUser" },
      settings: ["HYPERDX_SESSION_SOURCE", "HYPERDX_URL", "OPENPANEL_ORG", "OPENPANEL_URL"],
      dashboards: ["/superset/dashboard/sessies/"],
    });
    expect(bundle.has("clickhouse/001_sessions.sql")).toBe(true);
  });
});

const IMAGE = "clickhouse/clickhouse-server:25.8";
const hasClickhouse = (() => {
  try {
    execFileSync("docker", ["image", "inspect", IMAGE], { stdio: "ignore", timeout: 20_000 });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasClickhouse)("session overview on ClickHouse", () => {
  it("joins a tab's spans and events into one row, with its counts and links", () => {
    const setup = `
CREATE TABLE default.otel_traces (Timestamp DateTime64(9), TraceId String, ServiceName LowCardinality(String), SpanName LowCardinality(String),
  StatusCode LowCardinality(String), SpanAttributes Map(LowCardinality(String), String), ResourceAttributes Map(LowCardinality(String), String))
  ENGINE = MergeTree ORDER BY Timestamp;
CREATE DATABASE openpanel;
CREATE TABLE openpanel.events (name LowCardinality(String), session_id String, project_id String, profile_id String, groups Array(String),
  properties Map(String, String), created_at DateTime64(3)) ENGINE = MergeTree ORDER BY created_at;
INSERT INTO default.otel_traces VALUES
  ('2026-11-10 10:00:00', 't1', 'pwa', 'HTTP POST', 'Unset', {'session_id': 'tab-1', 'userId': 'd53f7ed38c209fc1'}, {'rum.sessionId': 'replay-1'}),
  ('2026-11-10 10:00:05', 't2', 'pwa', 'console.error', 'Unset', {'session_id': 'tab-1'}, {'rum.sessionId': 'replay-1'}),
  ('2026-11-10 10:00:01', 't1', 'graphql', 'POST /api/graphql', 'Error', {}, {}),
  ('2026-11-10 10:00:02', 't1', 'collection', 'GET /entities', 'Unset', {}, {}),
  ('2026-11-10 11:00:00', 't9', 'pwa', 'click', 'Unset', {'session_id': 'tab-2'}, {});
INSERT INTO openpanel.events VALUES
  ('screen_view', 'op-1', 'podiumnet-dev', 'd53f7ed38c209fc1', ['inuits.eu'], {'session_id': 'tab-1'}, '2026-11-10 10:00:03'),
  ('screen_view', 'op-1', 'podiumnet-dev', 'd53f7ed38c209fc1', ['inuits.eu'], {'session_id': 'tab-1'}, '2026-11-10 10:02:00'),
  ('mutateEntityValues', 'op-1', 'podiumnet-dev', 'd53f7ed38c209fc1', ['inuits.eu'], {'session_id': 'tab-1', 'kind': 'mutation'}, '2026-11-10 10:03:00'),
  ('form_opened', 'op-1', 'podiumnet-dev', 'd53f7ed38c209fc1', ['inuits.eu'], {'session_id': 'tab-1'}, '2026-11-10 10:03:30');
`;
    const groupedSql = sessionParts(readSessions(grouped), "podiumnet").sql.get("001_sessions.sql")!;
    const filled = groupedSql
      // no MongoDB here: the same tables in memory, with what the collections hold
      .replace(/ENGINE = MongoDB\(elody_mongo, collection = 'users_actual'\);/, "ENGINE = Memory;\nINSERT INTO elody_source.users VALUES (['an@arsenaal.be', 'kc-1'], '{\"ref_organizations\":[{\"value\":\"ORG-2\"},{\"value\":\"ORG-1\"}]}');")
      .replace(/ENGINE = MongoDB\(elody_mongo, collection = 'organizations_actual'\);/, "ENGINE = Memory;\nINSERT INTO elody_source.groups VALUES ('ORG-1', '{\"name\":[{\"value\":\"Arsenaal\"}]}'), ('ORG-2', '{\"name\":[{\"value\":\"Compagnie X\"}]}');")
      .replaceAll("${HYPERDX_URL}", "https://hyperdx.example.test")
      .replaceAll("${HYPERDX_SESSION_SOURCE}", "src1")
      .replaceAll("${OPENPANEL_URL}", "https://openpanel.example.test")
      .replaceAll("${OPENPANEL_ORG}", "elody")
      // clickhouse-local has no users to define a view as
      .replace("DEFINER = CURRENT_USER SQL SECURITY DEFINER AS", "AS");
    const check =
      "SELECT session, toString(started), minutes, user, user_groups, pages, forms, saves, browser_errors, backend_traces, backend_errors, replay, events FROM usage.sessions ORDER BY started FORMAT TSVRaw;";
    // the setup applies the file at every start: twice here
    const run = spawnSync("docker", ["run", "--rm", "-i", IMAGE, "clickhouse-local", "--multiquery"], { input: `${setup}\n${filled}\n${filled}\n${check}`, encoding: "utf-8" });
    expect(run.stderr).toBe("");
    const [first, second] = run.stdout.replace(/\n$/, "").split("\n").map((line) => line.split("\t"));
    // the user by the pseudonym of their id (kc-1), and with it their organisations from the data model
    expect(first.slice(0, 11)).toEqual(["tab-1", "2026-11-10 10:00:00", "3.5", "d53f7ed38c209fc1", "Arsenaal, Compagnie X", "2", "1", "1", "1", "1", "1"]);
    expect(first[11]).toMatch(/^<a href="https:\/\/hyperdx\.example\.test\/sessions\?sessionSource=src1&sid=replay-1&sfrom=\d+&sto=\d+&from=\d+&to=\d+" target="_blank">replay<\/a>$/);
    expect(first[12]).toBe('<a href="https://openpanel.example.test/elody/podiumnet-dev/sessions/op-1" target="_blank">events</a>');
    // a tab HyperDX saw but OpenPanel did not: a row without counts or links
    expect(second.slice(0, 2)).toEqual(["tab-2", "2026-11-10 11:00:00"]);
    expect(second.slice(11)).toEqual(["", ""]);
  }, 120_000);
});
