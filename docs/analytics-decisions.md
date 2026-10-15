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
