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
