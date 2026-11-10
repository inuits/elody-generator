/**
 * The session overview (an ea:SessionOverview) is a layer under a dashboard,
 * like the SLA: one row per browser tab, joined on the session id the PWA gives
 * both HyperDX's spans (SpanAttributes session_id) and OpenPanel's events
 * (properties session_id).
 *
 * - what is the client's stands in the declaration: its browser's service, the
 *   spans that are a browser error, what it counts (pages, searches, saves…)
 *   from which OpenPanel events, and the group a user belongs to (ea:userGroup:
 *   a library, an organisation). The core only says who the user is, by a
 *   pseudonym of their id; the declaration says where the client's data model
 *   keeps its users and their groups, and the overview links the two when it
 *   is read, from the instance's own MongoDB (the connection elody_mongo)
 * - the ClickHouse SQL: the view usage.sessions over default.otel_traces and
 *   openpanel.events, which the read-only user reads as its definer, so not
 *   those tables themselves
 * - the dataset sessions, with the counts as columns under their labels, and
 *   a link to the tab's replay (HyperDX) and its events (OpenPanel)
 * - where HyperDX and OpenPanel are differs per environment: the links carry
 *   ${SETTINGS}, named in the bundle's manifest, which elody-superset fills in
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import rdfEnv from "@zazuko/env";
import { Parser, type Quad } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { Reading } from "../reading.js";
import type { ValidationIssue, ValidationReport } from "../validate.js";
import { rdfs } from "../vocab.js";
import { uuidFor } from "./generate.js";
import { ANALYTICS_VOCABULARY_PATH, EA } from "./overlay.js";
import type { DatabaseDef, DatasetColumn, DatasetDef } from "./superset.js";

const ea = (local: string) => `${EA}${local}`;
const SESSIONS_SHAPES_PATH = join(dirname(ANALYTICS_VOCABULARY_PATH), "sessions.shapes.ttl");

export type Language = "nl" | "en";
/** what a column counts: OpenPanel events by name, by a property's value, or both */
export type Count = { key: string; label: string; events: string[]; property?: string; value?: string };
/**
 * Where the client's data model keeps the group a user belongs to. Elody keeps
 * an entity's values as properties.<key>[{ value }]: a user's membership holds
 * the ids of their groups, a group's groupName its name.
 */
export type UserGroup = {
  /** the column's title */
  label: string;
  /** the collection of the users */
  users: string;
  /** the user's property with the ids of their groups */
  membership: string;
  /** the collection of the groups */
  groups: string;
  /** the group's property that is its name */
  groupName: string;
};

export type SessionOverview = {
  subject: string;
  title: string;
  language: Language;
  /** the group a user belongs to, in the client's data model; no column without it */
  userGroup?: UserGroup;
  browserService: string;
  browserErrors: string[];
  counts: Count[];
};

// --- reading

export function readSessions(ttl: string): SessionOverview {
  const reading = new Reading(new Parser().parse(ttl));
  const [subject] = reading.subjectsOfType(ea("SessionOverview"));
  if (!subject) throw new Error("no ea:SessionOverview in the declaration");
  const counts = (reading.listTerms(reading.node(subject, ea("counts"))) ?? []).map((term): Count => {
    const property = reading.value(term.value, ea("property"));
    const value = reading.value(term.value, ea("value"));
    return {
      key: reading.value(term.value, ea("key")) ?? "",
      label: reading.value(term.value, rdfs("label")) ?? "",
      events: reading.values(term.value, ea("event")).sort(),
      ...(property === undefined ? {} : { property }),
      ...(value === undefined ? {} : { value }),
    };
  });
  const group = reading.node(subject, ea("userGroup"));
  return {
    subject,
    title: reading.value(subject, rdfs("label")) ?? "Sessions",
    language: reading.value(subject, ea("language")) === "en" ? "en" : "nl",
    ...(group === undefined
      ? {}
      : {
          userGroup: {
            label: reading.value(group, rdfs("label")) ?? "",
            users: reading.value(group, ea("users")) ?? "",
            membership: reading.value(group, ea("membership")) ?? "",
            groups: reading.value(group, ea("groups")) ?? "",
            groupName: reading.value(group, ea("groupName")) ?? "",
          },
        }),
    browserService: reading.value(subject, ea("browserService")) ?? "",
    browserErrors: reading.values(subject, ea("browserError")).sort(),
    counts,
  };
}

let shapesCache: Quad[] | undefined;
let vocabularyCache: Quad[] | undefined;

/** The declaration against ontology/sessions.shapes.ttl. */
export async function validateSessions(ttl: string): Promise<ValidationReport> {
  let quads: Quad[];
  try {
    quads = new Parser().parse(ttl);
  } catch (error) {
    return { conforms: false, issues: [{ focusNode: "", message: `does not parse: ${(error as Error).message}`, severity: "Violation" }] };
  }
  shapesCache ??= new Parser().parse(readFileSync(SESSIONS_SHAPES_PATH, "utf-8"));
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

// --- the words of the overview's own columns

const WORDS = {
  nl: {
    session: "Sessie", started: "Begin", ended: "Einde", minutes: "Minuten", user: "Gebruiker (pseudoniem)",
    browser_errors: "Fouten browser", backend_traces: "Backend-traces", backend_errors: "Fouten backend", replay: "Replay (HyperDX)", events: "Events (OpenPanel)",
  },
  en: {
    session: "Session", started: "Start", ended: "End", minutes: "Minutes", user: "User (pseudonym)",
    browser_errors: "Browser errors", backend_traces: "Backend traces", backend_errors: "Backend errors", replay: "Replay (HyperDX)", events: "Events (OpenPanel)",
  },
};

// --- ClickHouse

// a name goes inside a SQL string: nothing that ends it
const NAME = /^[A-Za-z0-9 _./:-]+$/;
const quoted = (name: string) => `'${name}'`;
const among = (column: string, names: string[]) => (names.length === 1 ? `${column} = ${quoted(names[0])}` : `${column} IN (${names.map(quoted).join(", ")})`);

/** A count as SQL over OpenPanel's events. */
export function countSql(count: Count): string {
  const conditions = [
    ...(count.events.length ? [among("name", count.events)] : []),
    ...(count.property !== undefined ? [`properties[${quoted(count.property)}] = ${quoted(count.value ?? "")}`] : []),
  ];
  return `countIf(${conditions.join(" AND ")})`;
}

// The client's own collections, read where they are: the instance's MongoDB,
// through the connection the chart gives ClickHouse (the named collection
// elody_mongo). In a database of their own, which the read-only user does not get.
const SOURCE_DATABASE = "elody_source";
const CONNECTION = "elody_mongo";

function sourceSql(group: UserGroup): string {
  return `
-- The group a user belongs to, from the client's data model: its users and its
-- groups, read where they are (the instance's MongoDB), not copied.
CREATE DATABASE IF NOT EXISTS ${SOURCE_DATABASE};

CREATE OR REPLACE TABLE ${SOURCE_DATABASE}.users
(
    identifiers Array(String),
    properties  String
)
ENGINE = MongoDB(${CONNECTION}, collection = ${quoted(group.users)});

CREATE OR REPLACE TABLE ${SOURCE_DATABASE}.groups
(
    id         String,
    properties String
)
ENGINE = MongoDB(${CONNECTION}, collection = ${quoted(group.groups)});
`;
}

function groupCtes(group: UserGroup): string {
  return `,
    -- a user's pseudonym is the hash the PWA and graphql make of their id: of
    -- every identifier of a user, one of which is that id
    members AS (
        SELECT
            lower(substring(hex(SHA256(concat('elody:', identifier))), 1, 16)) AS pseudonym,
            JSONExtractString(link, 'value') AS group_id
        FROM ${SOURCE_DATABASE}.users
        ARRAY JOIN identifiers AS identifier
        ARRAY JOIN JSONExtractArrayRaw(properties, ${quoted(group.membership)}) AS link
    ),
    named AS (
        SELECT id AS group_id, JSONExtractString(properties, ${quoted(group.groupName)}, 1, 'value') AS group_name
        FROM ${SOURCE_DATABASE}.groups
    ),
    user_groups AS (
        SELECT pseudonym, arrayStringConcat(arraySort(groupUniqArray(group_name)), ', ') AS names
        FROM members
        INNER JOIN named USING (group_id)
        GROUP BY pseudonym
    )`;
}

/** Where HyperDX and OpenPanel are, per environment: elody-superset fills them in. */
const SETTINGS = ["HYPERDX_SESSION_SOURCE", "HYPERDX_URL", "OPENPANEL_ORG", "OPENPANEL_URL"];

function clickhouseSql(overview: SessionOverview, source?: string): string {
  const errors = overview.browserErrors.length ? `countIf(${among("span", overview.browserErrors)})` : "0";
  const counted = overview.counts.map((count) => `            ${countSql(count)} AS ${count.key}`).join(",\n");
  const columns = overview.counts.map((count) => `    u.${count.key} AS ${count.key},`).join("\n");
  const group = overview.userGroup;
  return `-- Generated by \`elody-ui analytics bundle\`${source ? ` from ${source}` : ""}; do not edit.
-- One row per browser tab (the PWA's session id): what OpenPanel saw it do,
-- what HyperDX saw go wrong, and a link to each. A view: nothing is copied, so
-- it reaches as far back as HyperDX and OpenPanel keep their own data. Every
-- statement can run again: elody-superset applies this file at every start,
-- with the settings of its environment filled in.
CREATE DATABASE IF NOT EXISTS usage;
${group ? sourceSql(group) : ""}
-- Read as its definer: Superset's read-only user reads the view, not HyperDX's
-- spans, OpenPanel's events or the client's users themselves.
CREATE OR REPLACE VIEW usage.sessions
DEFINER = CURRENT_USER SQL SECURITY DEFINER AS
WITH
    spans AS (
        SELECT
            Timestamp AS ts,
            TraceId AS trace_id,
            ServiceName AS service,
            SpanName AS span,
            CAST(StatusCode, 'String') AS status,
            SpanAttributes['session_id'] AS tab_session,
            ResourceAttributes['rum.sessionId'] AS replay_session,
            -- who: the browser names them as HyperDX does, the backend through the elody.* baggage
            if(SpanAttributes['elody.user'] != '', SpanAttributes['elody.user'], SpanAttributes['userId']) AS pseudonym
        FROM default.otel_traces
    ),
    -- only the browser's spans carry the tab's session; the backend's join them by trace
    browser AS (
        SELECT
            tab_session,
            anyIf(replay_session, replay_session != '') AS replay,
            min(ts) AS first_span,
            max(ts) AS last_span,
            anyIf(pseudonym, pseudonym != '') AS span_user,
            ${errors} AS browser_errors,
            groupUniqArray(trace_id) AS traces
        FROM spans
        WHERE service = ${quoted(overview.browserService)} AND tab_session != ''
        GROUP BY tab_session
    ),
    backend AS (
        SELECT
            b.tab_session AS backend_session,
            uniqExact(s.trace_id) AS backend_traces,
            countIf(s.status = 'Error') AS backend_errors
        FROM (SELECT tab_session, arrayJoin(traces) AS trace_id FROM browser) AS b
        INNER JOIN (SELECT trace_id, status FROM spans WHERE service != ${quoted(overview.browserService)}) AS s ON s.trace_id = b.trace_id
        GROUP BY backend_session
    ),
    used AS (
        SELECT
            properties['session_id'] AS used_session,
            -- OpenPanel starts a session of its own after 30 minutes idle: link to the first
            argMin(session_id, created_at) AS openpanel_session,
            any(project_id) AS openpanel_project,
            min(created_at) AS first_event,
            max(created_at) AS last_event,
            -- before login an event has the device as profile and no group
            anyIf(profile_id, notEmpty(groups)) AS event_user,
${counted}
        FROM openpanel.events
        WHERE properties['session_id'] != ''
        GROUP BY used_session
    )${group ? groupCtes(group) : ""}
SELECT${group ? `
    s.* EXCEPT (replay, events),
    g.names AS user_groups,
    s.replay AS replay,
    s.events AS events
FROM (
SELECT` : ""}
    if(u.used_session != '', u.used_session, b.tab_session) AS session,
    multiIf(b.tab_session = '', toDateTime(u.first_event), u.used_session = '', toDateTime(b.first_span), least(toDateTime(u.first_event), toDateTime(b.first_span))) AS started,
    multiIf(b.tab_session = '', toDateTime(u.last_event), u.used_session = '', toDateTime(b.last_span), greatest(toDateTime(u.last_event), toDateTime(b.last_span))) AS ended,
    round(dateDiff('second', started, ended) / 60, 1) AS minutes,
    if(u.event_user != '', u.event_user, b.span_user) AS user,
${columns}
    b.browser_errors AS browser_errors,
    k.backend_traces AS backend_traces,
    k.backend_errors AS backend_errors,
    if(b.replay = '', '', concat(
        '<a href="\${HYPERDX_URL}/sessions?sessionSource=\${HYPERDX_SESSION_SOURCE}&sid=', b.replay,
        -- HyperDX looks for the session within the window it is given: four hours either side
        '&sfrom=', toString(toUnixTimestamp64Milli(b.first_span) - 14400000),
        '&sto=', toString(toUnixTimestamp64Milli(b.first_span) + 14400000),
        '&from=', toString(toUnixTimestamp64Milli(b.first_span) - 14400000),
        '&to=', toString(toUnixTimestamp64Milli(b.first_span) + 14400000),
        '" target="_blank">replay</a>')) AS replay,
    if(u.openpanel_session = '', '', concat(
        '<a href="\${OPENPANEL_URL}/\${OPENPANEL_ORG}/', u.openpanel_project, '/sessions/', u.openpanel_session,
        '" target="_blank">events</a>')) AS events
FROM used AS u
FULL OUTER JOIN browser AS b ON b.tab_session = u.used_session
LEFT JOIN backend AS k ON k.backend_session = b.tab_session${group ? `
) AS s
LEFT JOIN user_groups AS g ON g.pseudonym = s.user` : ""};
`;
}

// --- the layer

const DATABASE = "clickhouse_usage";
const READ_ONLY_USER = "superset";

export type SessionParts = {
  /** ClickHouse SQL files by name, applied in name order */
  sql: Map<string, string>;
  datasets: DatasetDef[];
  variables: Record<string, string>;
  manifest: { requires: string[]; readOnlyDatabases: string[]; settings: string[] };
};

export function sessionParts(overview: SessionOverview, client: string, source?: string): SessionParts {
  if (!/^[A-Za-z0-9_.-]+$/.test(overview.browserService)) throw new Error(`the overview's browserService is not a service name: ${JSON.stringify(overview.browserService)}`);
  for (const name of overview.browserErrors) if (!NAME.test(name)) throw new Error(`the overview's browserError does not fit in SQL: ${JSON.stringify(name)}`);
  for (const [part, value] of Object.entries(overview.userGroup ?? {})) {
    if (part !== "label" && !/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`the user group's ${part} is not a collection or property name: ${JSON.stringify(value)}`);
  }
  for (const count of overview.counts) {
    if (!/^[a-z][a-z0-9_]*$/.test(count.key)) throw new Error(`a count's key is not a column name: ${JSON.stringify(count.key)}`);
    for (const name of count.events) if (!NAME.test(name)) throw new Error(`the event of count ${count.key} does not fit in SQL: ${JSON.stringify(name)}`);
    for (const name of [count.property, count.value]) if (name !== undefined && !NAME.test(name)) throw new Error(`the property or value of count ${count.key} does not fit in SQL: ${JSON.stringify(name)}`);
    if (!count.events.length && count.property === undefined) throw new Error(`count ${count.key} counts nothing: give it an event or a property`);
  }
  const words = WORDS[overview.language];
  const database: DatabaseDef = {
    key: DATABASE,
    name: "ClickHouse usage",
    uri: `clickhousedb://${READ_ONLY_USER}:XXXXXXXXXX@clickhouse:8123/usage`,
    uuid: uuidFor(client, "database", DATABASE),
  };
  const own = (name: keyof typeof words, type: string): DatasetColumn => ({ name, label: words[name], type, time: name === "started" || name === "ended" });
  const columns: DatasetColumn[] = [
    own("session", "String"),
    own("started", "DateTime"),
    own("ended", "DateTime"),
    own("minutes", "Float64"),
    own("user", "String"),
    ...(overview.userGroup === undefined ? [] : [{ name: "user_groups", label: overview.userGroup.label, type: "String" }]),
    ...overview.counts.map((count) => ({ name: count.key, label: count.label, type: "UInt64" })),
    own("browser_errors", "UInt64"),
    own("backend_traces", "UInt64"),
    own("backend_errors", "UInt64"),
    own("replay", "String"),
    own("events", "String"),
  ];
  return {
    sql: new Map([["001_sessions.sql", clickhouseSql(overview, source)]]),
    datasets: [
      {
        name: "sessions",
        schema: "usage",
        time: "started",
        description: null,
        uuid: uuidFor(client, "dataset", "usage/sessions"),
        columns,
        metrics: [],
        database,
      },
    ],
    variables: {},
    manifest: { requires: ["default.otel_traces", "openpanel.events"], readOnlyDatabases: ["usage"], settings: SETTINGS },
  };
}
