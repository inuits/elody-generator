# Analytics POC — decisions

Decisions taken while executing [analytics-plan.md](analytics-plan.md)
(Redmine #167487). Where the plan named a default, the default was taken; what
the plan left open is recorded here with the choice made.

## Open decisions of the plan

| # | Decision | Taken |
|---|---|---|
| 1 | Entry library: `cataloging_source_agency` or `created_by` → group | open, prepared in step 3 |
| 2 | Where the code lives | elody-generator, `src/analytics/` (the default) |
| 3 | Source | Mongo directly for the POC (the default) |
| 4 | Deleted entities count as created | no, phase 1 (the default) |
| 5 | Overlay namespace | `https://elody.eu/ns/analytics#` (`ea:`) (the default) |

## Step 1 — inventory

- **Translations, more than one bundle.** The audit labels (`created-at`,
  `created-by`) are not in vlacc's `nl.json` but in base-graphql's
  (`modules/baseGraphql/translations/nl.json`). `--translations` may be given
  more than once; the first bundle that has a key wins, so the client's comes
  first and base-graphql's second.
- **Label key without `rdfs:label`.** The compact declaration leaves the
  conventional label key out; the inventory then derives it from the path
  (`conventionalLabelKey`, the generator's own rule) and says so
  (`labelSource: "conventional"`).
- **Owner.** Found by walking the graph up from the filter to the first
  `elody:EntityUi` (its `graphqlType`), `elody:filtersFragment`
  (`fragment:<name>`) or `elody:App` (`app`). A filter in a list query several
  types share has several owners.
- **Keyless filters.** A TypeFilter without `elody:key` filters on `type`;
  any other keyless filter is listed under its alias.
- **Role heuristic, additions to the plan's rules** (each is explainable in the
  `reason` column, the plan's rules keep their order):
  - a DateFilter is `time`, but only the creation date (`…created.at`) is
    included: the overlay has exactly one time dimension. `audit.updated.at`,
    `createdfrom`/`createduntil` are listed and left out.
  - `audit.updated.*` gets role `audit`, left out: who or when last changed
    is a column of the raw table (step 4), not a dimension of creations.
  - identifiers also: a last segment `issn` or `code`, or ending on `number`
    (`vlacc_number`, `authority_record_number`).
  - relations also: a path starting with `relation` (`relation1`,
    `relations.isUserFor.key`, `relation_other_genres`).
  - a path with SelectionFilters *and* TextFilters is a dimension; only a path
    with TextFilters alone is a free-text search (`identifier`).
- **Output in elody-declarations.** The inventory of vlacc is written to
  `clients/vlacc/analytics/inventory/`; `filters.json` (every filter, for
  debugging, 220 KB) is not committed.

Result on vlacc: 491 filters, 86 document paths, 25 included.

## Step 2 — overlay

- **Cube IRI.** The plan's `<#EntityActivity>` is a relative IRI, which only
  means something against a base. The overlay uses a prefix per client,
  `vlacc: <https://elody.eu/analytics/vlacc#>`, so the cube is
  `vlacc:EntityActivity` wherever the file is read.
- **Terms.** `ea:` is declared in `ontology/analytics.ttl` of this repo (not in
  elody-ontology): `ea:sourceCollection`, `ea:entityTypes`, `ea:sourcePath`,
  `ea:role` (`ea:Time`, `ea:EntityType`), `ea:multiValued`, `ea:entityCount`
  (a `qb:MeasureProperty`), plus `ea:labelKey`: the translation key of a
  dimension, which step 4 needs to label the Superset columns. Each component
  also carries the Dutch text as `rdfs:label "…"@nl` for whoever edits the file.
- **Property names.** `em:` + the last segment before `.value`; when that
  segment says nothing alone (`at`, `by`, `key`, `value`, `id`) the one before
  it too (`audit.created.at` → `em:created_at`). Paths whose names clash take
  one more segment until they differ.
- **Left-out paths in the file.** Every candidate with `include: false` is
  written as a commented `qb:component` line under `# left out — <role>`, with
  the reason; switching it on is removing the `#`. A left-out date gets no
  `ea:role`, so switching it on never makes a second time dimension.
- **Shapes.** `ontology/analytics.shapes.ttl` (SHACL Core): a cube names
  collections and entity types, has exactly one `ea:Time` and one
  `ea:EntityType` component and a measure; a component is a dimension or a
  measure; every dimension has one `ea:sourcePath`. "Every component has
  `ea:sourcePath`" is read as every *dimension*: the measure has no path. One
  dimension per source path is checked in code (`validateOverlay`): SHACL Core
  cannot compare values across nodes.
- **Collections.** `--collection` names them; without it the overlay command
  reads `mongoCollections` from the `client.json` two folders up from the
  overlay and leaves `users_*` out (`entities_actual`,
  `bibliographic_entities_actual` for vlacc).
- **Entity types.** Every value the declaration's filters on `type` name: the
  TypeFilters' `sh:defaultValue`s and those of the SelectionFilters on `type`
  (71 of the 129 filters on `type` are SelectionFilters; with TypeFilters
  alone the `work_*`/`manifestation_*` types were missing). 47 for vlacc,
  `user`, `token` and `comment` among them: step 3 drops the types without
  documents in the two collections.
- **No hand review yet.** The overlay is generated as is (25 dimensions);
  several are clearly noise for "entities created" (`life_dates`,
  `thread_tagged_*` on comments, `roles` on tokens). Step 3 drops what the data
  shows to be sparse (<5% filled); what is left is reviewed after that.
- **Tests.** elody-declarations `pnpm test` gains `tests/analytics.test.ts`
  (every `clients/*/analytics/*.analytics.ttl` conforms). Its 11 other failures
  exist on `main` as well (the meta-shape test reads the `ui/` directory as a
  file: `EISDIR`; digipolis, ugent-aicap and vliz differ from their moved
  client checkouts) and are untouched here. `pnpm check:all`: every
  declaration conforms, vlacc 601 of 601 equal.

## Step 3 — data profile

- **Driver.** `mongodb` (6.10) is a dev dependency and an optional peer
  dependency: only `analytics profile` needs it, loaded on demand, so the
  published generator does not pull it in.
- **Local only.** The profile refuses any host that is not `localhost`,
  `127.0.0.1`, `::1` or `*.localhost`, and every `mongodb+srv` URI. The
  container `elody-common-mongo-1` already held the production dump
  (3,391,419 bibliographic + 671,442 other entities), so nothing was restored.
- **Sample.** Per entity type, `$match` on the type, project the paths,
  `$sample` 5000. Shares overall are weighted by each type's documents.
  The time histogram and the entry-library candidates are counted exactly
  (an aggregation over all documents in scope).
- **Fill threshold per type.** "Drop below 5% filled" is read per type: a path
  is dropped when no type has it in 5% of its sample. A dimension that belongs
  to one type (AVI level on `easy_reading`, level on `zizo`) is filled in a
  fraction of a percent of all documents and still worth keeping.
- **Lists.** `ea:multiValued true` when more than 1% of the *filled*
  documents hold a list.
- **Update in place.** `--update` edits the overlay by line (the one-line
  components the overlay command writes): ` ; ea:multiValued true` before the
  `]`, a dropped component commented out under `# dropped by the profile:
  <why>`, types without documents removed from `ea:entityTypes`. Applying it
  twice changes nothing more. Without `--update` it prints what it would change.

Result on vlacc: 7 dimensions dropped (`language`, `subject`,
`properties.category`, `.roles`, `.status`, `.thread_tagged_groups`,
`.thread_tagged_users`: never filled, they belong to comments, tokens or
virtual filter keys), 3 made multi-valued (`avi_read_level_code`,
`genre_type`, `id_online_collection_group…source_id_online_collection`), 13
types without documents dropped (`comment`, `context`, `group`, `partner`,
`token`, `user` and the seven camel-cased `zizo*` types: the zizo levels are
`zizo` documents with `properties.level`). The overlay keeps 18 dimensions
over 34 types.

### Findings that matter for the next steps

1. **Creation dates are not all creation dates.** 728,349 documents were
   "created" in 2026. In `entities_actual` (persons, publishers, titles…)
   650k were created by `developers-uat@inuits.eu` in May and June 2026: the
   migration to Elody, which did not keep their original date. The
   bibliographic records kept theirs (back to 1983, the start of Vlacc;
   1983-05-20 is the placeholder of the oldest import). Counting "created per
   month" over 2026 counts the migration; the dashboard needs either a filter
   on the service accounts (`*@inuits.eu`) or a cut-off date. To decide with
   Cultuurconnect.
2. **60 dates are strings** (`"2010-09-29 00:00:00"`, in
   `bibliographic_entities_actual`), 1,134 documents have no creation date and
   3 are dated 2062. Step 4/5 must parse the strings (dlt) and keep the
   documents without a date out of the time series rather than at 1970.
3. **Mostly unattributed.** `audit.created.by` is filled in 17% of the
   documents; 98% of those are service accounts (`developers-uat@`,
   `developers@`, `jonasv@inuits.eu`). Library staff account for some 12,000
   records so far.

### Entry library (open decision 1), prepared

| | `properties.cataloging_source_agency.value` | `audit.created.by` | e-mail domain of `audit.created.by` |
|---|---|---|---|
| filled | 465,016 of 4,062,861 (11%) | 685,391 (17%) | as `created_by` |
| distinct values | 2: "Open Vlacc" (465,015), "Opeeng" (1) | 66 users | 14 domains: 12 libraries or cities, `cultuurconnect.be`, `inuits.eu` |
| a library? | no: the same value everywhere | a person, not a library; all 66 are in `users_actual` | yes for the city and library domains (`brugge.be`, `stad.gent`, `muntpunt.be`, `luisterpuntbibliotheek.be`, …); not for `cultuurconnect.be` or `inuits.eu` |
| via users / groups | — | `users_actual` has e-mail, name, username and roles only; `groups_actual` is empty, no `refUsers` relation: no library through a group | a domain → library table, kept by hand |

None gives a library for the 83% of documents without `created_by` (imports
and migrated records). The full counts are in
`elody-declarations/clients/vlacc/analytics/profile/profile.md`.

## Step 4 — generators

`elody-ui analytics generate OVERLAY --out DIR [--translations FILE ...]`
writes `clickhouse/001_raw.sql`, `clickhouse/010_mart.sql`,
`dlt/projection.json` and a Superset import bundle (`superset/metadata.yaml`,
`databases/`, `datasets/`). It validates the overlay first and replaces the
three generated folders, so a dimension dropped from the overlay leaves no
stale file. For vlacc the output is in
`elody-declarations/clients/vlacc/analytics/generated/`.

- **`created_at` is `Nullable`.** The plan has `DateTime64(3, 'Europe/Brussels')`;
  1,134 documents have no creation date (step 3). The views count only
  entities with one (`WHERE created_at IS NOT NULL`) rather than placing them
  at 1970.
- **`updated_at` is the row version and never null.** 669,760 documents of
  `entities_actual` have no `audit.updated.at`. `ReplacingMergeTree(updated_at)`
  needs a value, and so does the incremental cursor: the projection names
  `audit.created.at` as the cursor's fallback, and `updated_at` is
  `audit.updated.at`, else `audit.created.at`, else 1970-01-01. Recorded in
  `projection.json` (`incremental.fallback`, `notes`) for the pipeline of step 5.
- **The day column is `day`.** The mart views expose `toDate(created_at) AS
  day` (`Date`, in Europe/Brussels), the Superset datasets mark it `is_dttm`
  and `main_dttm_col` and label it with `created_at`'s label ("Aangemaakt op").
  Calling the alias `created_at` too would shadow the source column inside the
  view, which ClickHouse resolves to the alias.
- **View names as in the plan,** without the client: `mart.entities_created_daily`,
  `mart.entities_created_by_<dim>`; the raw table carries it
  (`raw.vlacc_entities`). A second client in the same ClickHouse needs a mart
  database per client; not needed for the POC.
- **`created_by` is a fixed column and a dimension** of the daily view (it is
  in the overlay). `updated_by` is a column of the raw table only.
- **Multi-valued views use `ARRAY JOIN`** (the plan's `arrayJoin`): an entity
  counts once per value and not at all without one. Summing such a view over
  its values counts an entity more than once; the dataset's description says so.
- **Empty values.** A missing single value is `''` in `LowCardinality(String)`,
  as the plan has it, not `NULL`; Superset shows it as an empty group.
- **Labels.** Translation key → the bundles (client first, base-graphql second)
  → the overlay's `rdfs:label` → the column name. Equal labels are told apart
  by the column (`Type` for `type`, `Type (genre_type)`; `Doelgroep` for
  `audience_type`, `Doelgroep (target_audience)`), so no two Superset columns
  read the same.
- **Superset.** Datasets are on the mart views; the metric `count` is
  `SUM(entity_count)` ("Aantal entiteiten"), since the views are aggregated.
  UUIDs are name-based (v5), so re-importing a regenerated bundle updates the
  same objects. The database file has the password masked (`XXXXXXXXXX`), as a
  Superset export does; it is given at import (step 5). The bundle has not been
  imported into a Superset yet: that is step 5.
- **Tests.** Snapshot tests on the vlacc overlay (copied to
  `tests/fixtures/analytics/` with the translation keys it uses); the SQL runs
  on an empty ClickHouse 26.8 (`clickhouse-local` in the
  `clickhouse/clickhouse-server:26.8` image, skipped when the image is absent),
  with a few rows: the later version of an entity replaces the first, an
  entity without a creation date is not counted, a list is counted per value.
- **YAML** is written by a small emitter (`toYaml`): strings always quoted, so
  values like `yes` or `1.0` stay strings; no YAML dependency added.

## Step 5 — the local chain

- **Where.** `elody-declarations/poc/analytics/`, next to the generated files
  it reads (`clients/vlacc/analytics/generated/`), on the same
  `feat/analytics-poc` branch; not in elody-common, whose root repository
  holds no client work.
- **Versions.** ClickHouse 26.8 (the latest LTS), Superset 6.1.0 (the latest
  stable, 2026-09-07) with `clickhouse-connect` 0.8.18 for `clickhousedb://`,
  dlt 1.30.0. Host ports 18123/19000 (ClickHouse) and 18088 (Superset) so
  nothing clashes with the Elody stack (port 9000 is taken).
- **pymongo 4.13.2.** pymongo 4.18 refuses MongoDB 4.0 (it needs 4.4, wire
  version 9); elody-common runs `mongo:4.0.0`. 4.13.2 works; a production
  connector on a newer Mongo can move up.
- **A dlt resource of its own, not the verified MongoDB source.** The resource
  reads `projection.json`: its type filter, projection and the incremental
  query with the creation date as fallback (`$or` on `audit.updated.at`, or
  no update date and `audit.created.at`). The verified source has no such
  fallback, and 670k entities have no update date.
- **Staging, then raw.** dlt loads with `write_disposition="merge"` on `id`
  into its own table (`default.dlt_vlacc___vlacc_entities`; dlt has no array
  type, a list goes in as JSON text). After each load the pipeline copies that
  load's rows (`_dlt_load_id`) into `raw.vlacc_entities`, turning the JSON into
  `Array(String)` and NULLs into `''`; ReplacingMergeTree keeps the latest
  version. The raw table stays exactly what step 4 generates.
- **`--reset`** removes the local pipeline state, every `dlt_vlacc*` table and
  the raw rows. Dropping the data table alone is not enough: dlt's own schema
  table still records it and the next merge fails on the missing table.
- **Superset import.** `scripts/load_superset.sh` zips the generated bundle with
  the ClickHouse URI set (the generated file masks the password, like a
  Superset export) and runs `superset import-datasources`; it fails when
  Superset logs an error (the CLI itself exits 0 on a failed import).
- **The dashboard** *Catalogusinvoer* was built once through the REST API
  (`scripts/create_dashboard.py`: a total, created per month, per type, per
  material type, per bibliographic type; native filters *Periode* on the day
  and *Type*) and exported with `scripts/export_dashboards.sh` to
  `poc/analytics/superset/dashboards/`: dashboards and charts only. The
  datasets and database stay the generated ones; the load script puts them
  next to the export when it imports, so there is one source for them.
- **ClickHouse must prefer column names to aliases.** Superset groups the time
  column by an expression it aliases with the column's own name
  (`dateTrunc('MONTH', toDateTime(day)) AS day`); ClickHouse reads the `day`
  inside as the alias and refuses the query (code 215). The POC sets
  `prefer_column_name_to_alias = 1` in the server's default profile
  (`poc/analytics/clickhouse/users.d/analytics.xml`). Any ClickHouse a
  Superset reads the mart from needs it.
- **A dashboard's layout names its charts by uuid.** The first export placed
  the charts in the wrong cells after re-import: the layout carried uuids of
  its own instead of the charts'. `create_dashboard.py` now reads each chart's
  uuid back from the API.
- **Bars keep the largest values.** A categorical bar chart with a row limit
  keeps the first rows of the query, not the largest: `order_desc` makes the
  query sort by the metric, and ascending display order puts the largest bar
  on top of a horizontal chart. Top 15 for type and material type.

### Result

- Full load: 4,062,861 entities from the two collections in 5 min 45 s (one
  dlt package); `raw.vlacc_entities FINAL`
  holds exactly the 4,062,861 the profile counted. A second run with nothing
  changed loads nothing (2.6 s). Loading a *changed* entity incrementally was
  not exercised: that would mean writing to the local Mongo dump.
- `scripts/verify.py`: manifestation_word, person and reading in 2024-06,
  2025-11 and 2026-05, ClickHouse and Mongo equal in all nine (person is 0
  before 2026 and 236,595 in May 2026: the migration of finding 1, step 3).
- The dashboard, imported from the YAML into an emptied Superset: total
  4,061,727 (the 1,134 entities without a creation date left out), created per
  month, top 15 per type and per material type, per bibliographic type;
  filtering on `manifestation_word` gives 890,599 and a monthly trend without
  the 2026 spike.
- Seen in the data along the way: material type has both `BOEK` (704,632) and
  `Boek` (2,949), literary type `Non-Fictie` and `Non-fictie`. Case variants
  of one value; a question for the catalogue, not for the chain.
