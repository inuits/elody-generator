# Brief: elody-declarations — every client as a TTL declaration

Hand-over document for a new work session. Epic #165964 (TTL declaration).

## Goal

A repo `elody-declarations` with one TTL UI declaration per client. `elody-generator`
turns it into GraphQL that is **provably equal** to the hand-written GraphQL the client
uses today. Whatever cannot be expressed in TTL becomes a **gap** in a backlog, and that
backlog drives the work on the ontology and the generator.

End result:

1. `elody-declarations/clients/<client>/ui/`: one declaration per client, as files laid out like its queries (how to write one, coming from the GraphQL: `elody-declarations/docs/from-graphql-to-ttl.md`), valid
   against the meta-shapes of `elody-ontology`.
2. A comparison report per client and per document: equal, differs, or out of scope
   (with a gap reference).
3. `gaps.md`: the gap backlog across all clients, sorted by how often a construct occurs.
4. One command (later CI) that runs generate + validate + compare for every client.

"Converted perfectly" means: every query document of the client is generated and
equal, or explicitly excluded with a gap that explains why.

## What exists

| Repo | Location | Role |
|---|---|---|
| `elody-ontology` | root of elody-common, github `inuits/elody-ontology`, `main`, tag `v0.6.0` | Vocabulary `ui/elody-ui.ttl` (`https://elody.eu/ns/ui#`), meta-shapes `ui/elody-ui.shapes.ttl`, `scripts/check.py` (rdflib + pyshacl). Versioning rules: see its README (new term = minor; retired term = minor + `dcterms:isReplacedBy`). |
| `elody-generator` | root of elody-common, github `inuits/elody-generator`, `main` | CLI `elody-ui generate \| check \| validate \| migrate`. Code: `src/parse.ts` (declaration → UI model), `src/render.ts` (model → GraphQL), `src/fromShacl.ts`, `src/generate.ts` (writes `*.queries.ts`, `src/ui/generatedFields.ts`, translations, `src/ui/sparqlSources.json`), `src/migrate.ts` (legacy dialect → current). Bindings (enum literals, PWA widgets, schema fields) live in `ontology/elody-ui.bindings.ttl`. 198 vitest tests. |
| Golden test | `elody-generator/tests` | The DiSHACLed declaration renders **byte-identical** to the hand-written GraphQL. This proves the approach; reuse the pattern for every client. |
| Execution harness | `elody-generator/scripts/showcase-execute.cts`, `scripts/roundtrip/graphql.cts` | Executes GraphQL documents with the real baseGraphql resolvers inside the dashboard container (`docker cp` to `/tmp`, `tsx`, env `BASEGRAPHQL`). Reuse it for the behavioural comparison. |
| Emit modes | generator | `file`: generates a whole file. `regions`: generates only between `# >>> generated:<id>` markers. Use `regions` for clients that keep some hand-written parts. |

Vocabulary resolution in the generator: `ELODY_ONTOLOGY` first, then
`node_modules/elody-ontology`, then `../elody-ontology`. To test an ontology change
before it is tagged, point `ELODY_ONTOLOGY` at the local checkout.

## Inventory (local, 2026-10-08)

A client's GraphQL lives in
`clients/<client>/client-frontend/inuits-dams-graphql-service/src/queries/*.queries.ts`.
Next to it: `*Schema.schema.ts`, `*Resolver.ts`, `sources/forms.ts`,
`sources/typeCollectionMapping.ts` and translations.

Data lives in the Mongo container `elody-common-mongo-1` (use the `mongo` shell, not
`mongosh`).

| Client | queries.ts | Lines | Fragments | Operations | Branch | Mongo DB | Schema | Locale |
|---|---|---|---|---|---|---|---|---|
| amvb-dams | 4 | 839 | 8 | 36 | master | amvb | ? | nl |
| hairoad-elody | 8 | 2,739 | 34 | 52 | master | hairoad (2,223) | ? | nl |
| mat2elody | 12 | 3,387 | 51 | 68 | main | mat2elody (3) | ? | en |
| dishacled-wp3-prototype-elody | 13 | 4,181 | 60 | 68 | main | dishacled-wp3-prototype-elody (36) | ? | en |
| podiumnet | 9 | 4,366 | 44 | 71 | main | podiumnet (15) | ? | en |
| coghent-dams | 20 | 4,622 | 61 | 64 | master | **none** | — | nl |
| askforceone | 12 | 4,707 | 59 | 48 | main | askforceone (336) | v1 `metadata` | nl |
| digipolis-dams | 12 | 8,794 | 55 | 106 | master | digipolis-asset-engine (empty) | — | nl |
| ugent-aicap | 29 | 16,471 | 150 | 168 | master | **none** | — | en |
| vliz-dams | 37 | 16,702 | 156 | 134 | main | vliz (868 entities, 12k mediafiles) | v2 `properties` | nl |
| vlacc-dams | 57 | 49,700 | 255 | 347 | **detached HEAD** | vlacc (prod dump, 3.39M + 671k) | v2 `properties` | nl |

A `?` means: determine it in WP0. Clients without data get the structural comparison
only. The other DBs (`ipres`, `pza`, `dams`) belong to none of the clients above; ignore
them.

## Approach

### 1. Compare at two levels

**Structural** (the hard requirement), as a new command
`elody-ui compare <declaration> <client-src>` in elody-generator:

- Parse both sides with `graphql-js` into an AST. Work per definition: every fragment
  and every operation, by name.
- Normalise: no whitespace, no comments, no `__typename`. Equal string literals count as
  equal even with different quotes.
- **Field and argument order still counts.** The order drives the order in the UI.
- Result per definition: `equal`, `differs` (with a path to the first difference),
  `missing` (only in the client) or `extra` (only in the generated output). Output is
  JSON plus a short text summary.
- Read the client's `*.queries.ts` the way the graphql-service does: extract the `gql`
  tags from TypeScript. Check how the graphql-service loads them: they are discovered
  automatically and fragments are referenced by name, so do not import them as TS
  modules.

**Behavioural** (confirmation, only for clients with data):

- For each entity type, execute both the hand-written and the generated document against
  the baseGraphql resolvers. Follow the `showcase-execute.cts` pattern, with real
  entities from the local Mongo.
- Compare the JSON. When the documents are structurally equal, the JSON must be
  identical; if it is not, the comparer has a bug. Useful side effect: a structural
  difference that turns out equal in behaviour (e.g. a field that resolves empty anyway)
  is a candidate for a looser normalisation. The user decides that, not the session.

### 2. Write the declarations

- Per client, write a `.ui.ttl` by hand or semi-automatically from the existing GraphQL.
  A **reverse tool** (`elody-ui extract`: GraphQL → TTL proposal) is allowed as an aid.
  The declaration in the repo must stay readable and idiomatic (`sh:` → `shui:` →
  `dash:` → `elody:`, in that order of preference).
- Every declaration must pass `elody-ui validate` against the meta-shapes.
- Clients **never have their own widgets**. A "custom field" is a configured Elody
  component and must follow from SHACL or an `elody:` property, never from a client
  `shui:Editor`.

### 3. Collect gaps

When something cannot be expressed, do not bend the generator for a single client.
Record a gap in `gaps.md` with:

- id;
- construct (with a GraphQL snippet as an example);
- clients and counts;
- category: `vocabulary` (an `elody:` term is missing), `binding` (a mapping in
  `elody-ui.bindings.ttl` is missing), `generator` (the render is missing), `drift`
  (the client uses an old baseGraphql form), `client-specific` (stays in a hand-written
  region) or `noise` (a meaningless difference, e.g. a duplicated field);
- proposal;
- status.

The document becomes `out-of-scope` in the comparison, referencing the gap id.

Resolve gaps in batches, always TDD:

1. first a fixture in `elody-ontology/tests/fixtures/ui/` and/or a test in
   elody-generator;
2. then the term or the render;
3. then compare all clients again (regression).

## Work packages

| WP | Content | Done when |
|---|---|---|
| **WP0** Inventory | Per client: all definitions (name, file, kind), schema v1/v2, locale, and which entity types have data. Record which baseGraphql version each client expects. | `inventory.json` per client and an overview table in the README. |
| **WP1** Repo | `elody-declarations` at the root of elody-common, like `elody-ontology` and `elody-generator`: a local git repo, `/elody-declarations` in elody-common's `.gitignore`, and a line in `repositories.txt`. A remote only once the user creates it. Dependencies: `elody-generator` and `elody-ontology` by tag or local checkout. | `pnpm test` runs (empty). |
| **WP2** `compare` | Structural comparer in elody-generator with tests: equal, order, missing, extra, string quotes, comments. Then a self-test: the DiSHACLed declaration against the DiSHACLed client. | The DiSHACLed golden gives 100% `equal` via `compare`. |
| **WP3** Behaviour | A harness that executes both document sets in the dashboard container and compares the JSON. | Works for dishacled and podiumnet. |
| **WP4** Small clients | amvb → hairoad → mat2elody → dishacled → podiumnet → askforceone. | Every client 100% `equal` or `out-of-scope` with a gap. |
| **WP5** Gap batch 1 | Resolve the most frequent gaps in ontology, bindings and generator. New ontology version (0.3.0) following the versioning rules. | All previously green clients stay green. |
| **WP6** Medium clients | coghent → digipolis → ugent-aicap → vliz. | As WP4. |
| **WP7** VLACC | Per entity type (WEMI, persons, series, …), not all at once. Use `regions` where flows (guided flows, bulk ops) stay hand-written. | A report per type. |
| **WP8** One command + CI | `pnpm check:all`: validate + generate + compare for every client, plus a summary table (% `equal` per client). GitLab/GitHub CI once there is a remote. | The command runs green locally. |
| **WP9** Learnings | A short report: which ontology terms were missing, which are never used, which drift patterns exist between clients, and what that means for the backend object configuration (the next phase of elody-ontology). | `LEARNINGS.md`. |

## Constraints

- **Client repos are read-only.** The session changes nothing in `clients/*`,
  `modules/*` or `inuits-dams-pwa`. The comparison works on an export or on the checkout
  as it is.
- **Do not switch shared checkouts.** If another branch is needed, use a git worktree in
  the scratchpad. vlacc is on a detached HEAD: record the commit (`git rev-parse HEAD`)
  and compare against exactly that commit.
- **TDD**: test first, then code (see CLAUDE.md).
- Code, commits and comments in English. Conventional commits, lowercase.
- **Do not push without asking.** Ask before every push and every new remote.
- **Docker via OrbStack** (`open -a OrbStack`, context `orbstack`), never Docker Desktop.
  Run tests in containers when the local `node_modules` misbehave.
- Ontology changes go through a branch in `elody-ontology` with a fixture, and
  `python scripts/check.py` must be green. Bindings go to elody-generator, not to the
  ontology.

## Pitfalls (already encountered)

- **Version drift.** DiSHACLed `main` lags behind the current baseGraphql. The working
  stack is graphql-service `feat/rdf-ui-declaration` + baseGraphql and PWA
  `feat/runtime-config-forms` + mediafileModule `d8c23ce`. Other clients may drift too.
  Compare against what the client **uses today**, not against what the generator would
  ideally produce. Drift is a gap (`drift`), not a generator bug.
- **Dashboard containers mount only `modules/`**, not the client src. To execute:
  `docker cp` to `/tmp` in the container (see `scripts/showcase.sh`).
- **Generated custom fields** must be registered (`src/ui/generatedFields.ts`). If they
  are missing, execution fails silently.
- **`Entitytyping` enum**: unknown types fail at execution. `showcase-execute.cts`
  extends the enum; do the same here.
- **Feature flag** `features.relationLabelsInPreferredLanguage` in baseGraphql is off by
  default. Keep it **off** in the behavioural comparison unless the client turns it on;
  otherwise you compare labels in a different language.
- **v1 vs v2.** askforceone uses v1 (`metadata`); vliz and vlacc use v2 (`properties`,
  relations in `properties.has_*`/`ref_*`). The declaration must set the `source`
  correctly (`metadata` / `properties` / root).
- **Wildcard `*`** as a search term means: no search. baseGraphql paging can produce a
  negative `skip`. Both are already fixed in the generator; keep them covered by tests.
- **Unquoted heredocs** mangle escapes (`\b` becomes a control character). Write files
  with the Write tool or a `'EOF'` heredoc.

## Start prompt for the new session

> Read `elody-generator/docs/declarations-brief.md`. Start with WP0 and WP1, then WP2
> (the `compare` command, TDD, with the DiSHACLed golden as the first acceptance test).
> Change nothing in clients/, modules/ or inuits-dams-pwa. Ask before every push. After
> WP2, report the DiSHACLed comparison and a plan for amvb.
