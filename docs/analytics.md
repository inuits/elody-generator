# Analytics from the Elody declaration

`elody-ui analytics` turns a client's UI declaration into an analytics store:
which document paths are analysed, how they are read from Mongo, the ClickHouse
tables and views they land in, and the Superset datasets that show them. It is
the proof of concept of Redmine #167487 (under #139502), built for Open Vlacc
and run for podiumnet too. The plan is [analytics-plan.md](analytics-plan.md);
every decision taken along the way, with its reason, is in
[analytics-decisions.md](analytics-decisions.md).

```
UI declaration (TTL)            clients/<c>/ui/
  │  analytics inventory        every filter → one candidate per path, a proposed role, why
  ▼
overlay (TTL, W3C Data Cube)    clients/<c>/analytics/<c>.analytics.ttl   ← the model, reviewed by a person
  │  analytics profile          the paths measured on a local Mongo (a check, optionally written back)
  │  analytics generate
  ▼
generated/                      clickhouse/*.sql, dlt/projection.json, superset/ (import bundle)
  │  poc/analytics/pipeline.py  Mongo → dlt → ClickHouse raw table
  ▼
ClickHouse raw.<c>_entities → mart.<c>_entities_created_* → Superset datasets → dashboards
```

The code is in `src/analytics/`; the analytics vocabulary and its shapes in
`ontology/analytics.ttl` and `ontology/analytics.shapes.ttl`. The per-client
files are in `elody-declarations/clients/<c>/analytics/`, the local chain
(ClickHouse, Superset, the dlt pipeline, scripts) in
`elody-declarations/poc/analytics/`.

## Commands

Run from elody-declarations; what the command line leaves out comes from the
client's `client.json` (name, Mongo database and collections, document schema,
translation bundles), found above the path given.

| Command | Does |
|---|---|
| `elody-ui analytics inventory <ui dir> --out <dir>` | Reads every filter of the declaration (every node with `elody:filterKind`, those of filters fragments too), reduces each key to its document path (`vlacc:1\|properties.material_type.value` → `properties.material_type.value`), folds the filters per path and proposes a role. Writes `candidates.json`, `candidates.md` (the review table) and `filters.json` (every filter). |
| `elody-ui analytics overlay <candidates.json> --out <file>` | Writes a first overlay from the included candidates, the left-out ones as commented lines with their reason. A starting point; vlacc's overlay is modelled by hand since. |
| `elody-ui analytics validate <overlay>` | The overlay against `ontology/analytics.shapes.ttl`, plus one dimension per source path. |
| `elody-ui analytics profile <overlay> --mongo <uri> --out <dir> [--update]` | A sample per entity type from a **local** Mongo (any other host is refused): fill rate, lists, value types, distinct values, top values per path; creation dates per year and the entry-library candidates counted exactly. `--update` writes back: lists become `ea:multiValued`, paths filled in no type's 5% are commented out, types without documents dropped. |
| `elody-ui analytics generate <overlay> --out <dir>` | The ClickHouse SQL, the dlt projection and the Superset bundle (below). Replaces the three generated folders. |

## The role heuristic (inventory)

The first rule that matches wins; the reason is written next to each path.

| Rule | Role | Included |
|---|---|---|
| path `type`, or a TypeFilter | entity type | yes |
| DateFilter on `…created.at` | time | yes |
| any other DateFilter | time | no: one time dimension |
| `audit.updated.*` | audit | no: a raw-table column |
| last segment `identifiers`, `id`, `_id`, `isbn`, `ean`, `email`, `issn`, `code`, or ending on `number` | identifier | no |
| path contains `title`, `name`, `description`, `wording`, `subtitle` | text | no |
| `properties.ref_…`, `lookup.…`, `relation…` | relation | no |
| only TextFilters | identifier | no: free-text search |
| anything else (a SelectionFilter: the UI offers a pick list) | dimension | yes |

On vlacc it found 10 of the 13 dimensions a manual evaluation chose, with 7
false positives (and publication year, better kept as a number) (`elody-declarations/clients/vlacc/analytics/evaluation/manual-evaluation.md`).
It misses relations that are dimensions (target audience, language) and fields
no filter names (cataloguing source), and it cannot tell an authority record's
attribute from a catalogue dimension. Hence: the heuristic proposes, a person
models the overlay, the generator does the rest.

## The overlay

A `qb:DataStructureDefinition` per client, with the terms of `ea:`
(`https://elody.eu/ns/analytics#`, declared in `ontology/analytics.ttl`):

```turtle
vlacc:EntityActivity a qb:DataStructureDefinition ;
  ea:sourceCollection "bibliographic_entities_actual" , "entities_actual" ;
  ea:documentSchema "v2" ;
  ea:entityTypes "manifestation_word" , "reading" , … ;
  qb:component [ qb:dimension em:type ; ea:sourcePath "type" ; ea:role ea:EntityType ; ea:labelKey "metadata.labels.type" ] ;
  qb:component [ qb:dimension em:created_at ; ea:sourcePath "audit.created.at" ; ea:role ea:Time ; ea:labelKey "metadata.labels.created-at" ] ;
  qb:component [ qb:dimension em:material_type ; ea:sourcePath "properties.material_type.value" ; ea:labelKey "metadata.labels.material-type" ] ;
  qb:component [ qb:dimension em:target_audience ; ea:sourcePath "properties.ref_target_audiences.value" ;
    ea:via [ ea:targetType "target_audience" ; ea:labelPath "properties.title.value" ] ;
    ea:multiValued true ; ea:labelKey "metadata.labels.target-audience" ] ;
  qb:component [ qb:measure ea:entityCount ; qb:order 1 ] .
```

| Term | Means |
|---|---|
| `ea:sourceCollection` | a Mongo collection read |
| `ea:documentSchema` | `"v2"` (values at the path) or `"v1"` (audit at the top, metadata and relations as lists); v2 when absent |
| `ea:entityTypes` | the `type`s counted |
| `ea:sourcePath` | the logical path of a dimension, as the declaration's filter key without its prefix |
| `ea:role` | `ea:Time` (exactly one) or `ea:EntityType` (exactly one) |
| `ea:multiValued` | the path holds a list: an `Array` column and a view of its own |
| `ea:via` | the path holds identifiers of other entities: the dimension is their label (`ea:targetType`, `ea:labelPath`) |
| `ea:labelKey` | the translation key of the dimension's label |
| `ea:entityCount` | the measure: the number of entities |

The column of a dimension is the snake_case local name of its property
(`em:material_type` → `material_type`).

## Where a path is stored (`storage.ts`)

The overlay keeps logical paths; the document schema decides where they live.
v2 stores a value at its path. v1 keeps the audit at the top (`date_created`,
`created_by`, `date_updated`, `last_editor`), `metadata.<key>.<path>` in the
elements of the `metadata` list with that key, `relations.<type>.<path>` in the
relations of that type. The profile, the Mongo aggregations and the projection
all use this one table; the pipeline executes the accessor each column carries.

## What is generated

| File | Content |
|---|---|
| `clickhouse/001_raw.sql` | `raw.<c>_entities`: `id`, `type`, `created_at` (nullable), `created_by`, `updated_at` (the row version: the update date, else the creation date, else 1970), `updated_by`, a column per dimension (`LowCardinality(String)`, or `Array(LowCardinality(String))` for a list), `ingested_at`; `ReplacingMergeTree(updated_at) ORDER BY (type, id)` |
| `clickhouse/010_mart.sql` | `mart.<c>_entities_created_daily` (day × type × created_by × every single-valued dimension → `entity_count`, from `FINAL`, entities without a creation date left out) and `mart.<c>_entities_created_by_<dim>` per list dimension (`ARRAY JOIN`) |
| `dlt/projection.json` | collections, type filter, Mongo projection, per column its logical path, storage accessor, ClickHouse and dlt type, lookup; the incremental cursor and its fallback; the daily view's name |
| `superset/…` | an import bundle: one shared ClickHouse database and a dataset per view, columns labelled from the client's translations (equal labels told apart by the column), the time column, metric `count` = `SUM(entity_count)` "Aantal entiteiten", name-based uuids |

## The local chain (`elody-declarations/poc/analytics`)

ClickHouse 26.8 and Superset 6.1.0 in docker compose; `pipeline.py` (dlt 1.30,
pymongo 4.13 for MongoDB 4.0) loads a client's entities into a dlt staging
table (merge on `id`, incremental on the update date with the creation date as
fallback), resolves `ea:via` relations to labels, and copies each load into the
raw table. `scripts/load_superset.sh` imports every client's bundle and the
exported dashboards; `scripts/create_dashboard.py` builds a client's entry
dashboard once (then `scripts/export_dashboards.sh`); `scripts/verify.py`
compares ClickHouse with Mongo per type and month. Start-up is in its README.

## A new client

1. `client.json` with `schema`, `mongoDb`, `mongoCollections`, `translations`.
2. `inventory` → `overlay`, then model the overlay by hand with someone who
   knows the data; `profile` to check it.
3. `generate`, `pipeline.py --reset`, `load_superset.sh`,
   `create_dashboard.py`, `export_dashboards.sh`, `verify.py`.

## Deliberately not done

- **Audit log** (#139250): deletions, change history, activity per user; phase 2.
- **Row-level security** per library: waits on the entry-library decision.
- **The connector entity in Elody** and a self-service layer to choose dimensions.
- **Data quality** in the warehouse (SHACL reports, missing-field models), **dbt**:
  the marts are plain ClickHouse views generated from the overlay.
- **The Elody API as source**: the POC reads Mongo directly; the API is the
  production path.
- **Matomo / usage tracking, Kubernetes deployment, scheduling, Superset's
  production metadata store (PostgreSQL), Keycloak login.**
- **Changes to elody-ontology or to existing `*.ui.ttl`**: the dimensions are
  marked in the overlay, not yet in the declaration (`qb:DimensionProperty` on
  the keys, `elody:analysed` on the types).
- **Schema migration**: adding a dimension to a loaded client needs
  `pipeline.py --reset` (a full reload); there is no `ALTER TABLE` step.
