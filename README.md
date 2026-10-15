# elody-generator

Generates what an Elody client needs from declarations written in the terms
of [`elody-ontology`](../elody-ontology). Today: UI declarations (`*.ui.ttl`)
become the GraphQL query documents the PWA renders (`*.queries.ts`), and plain
SHACL 1.2 UI shapes become UI declarations (`fromShacl`). Next: the backend
object configuration, from the same ontology. Redmine epic #165964, story
#165966 (T1 generator, T6 ontology).

A UI declaration uses the W3C **SHACL 1.2 UI** vocabulary (`shui:`) and
**DASH** wherever a standard term exists, and the **`elody:` vocabulary**
(elody-ontology, `ui/`) for what only the platform knows.

| Layer   | Says                              | Examples |
|---------|-----------------------------------|----------|
| `sh:`   | what a property **is**            | `sh:path`, `sh:datatype`, `sh:class`, `sh:minCount`, `sh:order`, `sh:name`, `sh:description`, `sh:defaultValue` |
| `shui:` | how it is **edited / viewed**     | `shui:editor`, `shui:viewer`, `shui:propertyRole shui:LabelRole` |
| `dash:` | what shui does not say            | `dash:hidden`, `dash:readOnly`, `dash:DescriptionRole` |
| `elody:`| what only the platform knows      | listings, view modes, panels, filters, actions, flows; Elody widgets as `shui:Editor` / `shui:Viewer` instances |

## Contents

- The **vocabulary** and its **meta-shapes** live in Elody's ontology
  repository, [`elody-ontology`](../elody-ontology) next to this one at the root of
  elody-common: `ui/elody-ui.ttl` (namespace `https://elody.eu/ns/ui#`, imports
  shui + dash) says what a declaration may say; `ui/elody-ui.shapes.ttl` says
  what a valid declaration looks like. It is a dependency
  (`github:inuits/elody-ontology#v0.6.0`, pinned to the tag). The generator
  reads it through `ELODY_ONTOLOGY` when set (to try an unreleased change in a
  checkout), else the installed `elody-ontology` package, else the checkout at
  the root of elody-common.
- `ontology/elody-ui.bindings.ttl` — the **implementation bindings**: how Elody
  implements the vocabulary. The GraphQL literal of each enumeration instance
  (`elody:enumValue`), the widget of each editor and viewer
  (`elody:inputFieldType`, `elody:formFieldType`, `elody:formatterValue`,
  `elody:panelElement`), the schema field of each detail element
  (`elody:schemaField`), the documents of the platform forms. They follow
  baseGraphql and the PWA, so they change with this generator rather than with
  the vocabulary. Together with the vocabulary they are the only
  editor→widget mapping: the generator has no table of its own. Validation
  reads the vocabulary alone.
- `src/` — reader, parser, renderers, `generate | check | validate | migrate`.
- `examples/dishacled.ui.ttl` — the dishacled declaration migrated to 0.1.
- `scripts/validate_pyshacl.py` — the pySHACL check for CI.

## Commands

```bash
elody-ui generate [--root DIR]     # src/ui/ (one *.ui.ttl, or files laid out like the queries) -> src/queries/entities/*.queries.ts
                  [--key-as-label legacy]  # the two metadataKeyAsLabel/rootKeyAsLabel arguments for a client pinned below base-graphql 0.10.30 (default: the keyAsLabel input)
elody-ui check    [--root DIR]     # drift + meta-shapes; exit 1 on either
elody-ui validate FILE.ui.ttl|DIR  # meta-shapes only
elody-ui migrate  FILE.ui.ttl --out NEW.ui.ttl   # retired dialect -> 0.1
elody-ui compare  FILE.ui.ttl|DIR CLIENT/src [--scope scope.json] [--json report.json]
                                   # the generated GraphQL against the client's, per definition
elody-ui extract  CLIENT/src --out FILE.ui.ttl|DIR [--namespace IRI]
elody-ui reference --out DIR [--declarations DIR] [--base PATH]   # the reference pages (Markdown) from the vocabulary, the meta-shapes and the bindings; usage counts from clients/*/ui   # DIR: one file per query file (entities/<type>.ui.ttl, <client>.ui.ttl) + extract-notes.txt
elody-ui expand   FILE.ui.ttl|DIR [--out FILE]   # every default of the meta-shapes written out (sh:defaultValue, elody:defaultRule)
                                   # a declaration proposal from the client's GraphQL (the reverse)
```

A declaration is one file or a directory of files read as one graph, laid out
like the queries (`entities/work.ui.ttl` for `queries/entities/work.queries.ts`,
`<client>.ui.ttl` for the platform file); a node declared in two files is
refused. A client **without** `src/ui/*.ui.ttl` is untouched by `generate` and passes
`check`: nothing to read, nothing written. That is the per-client switch.
Per entity, `elody:emit "file"` generates the whole document and `"regions"`
splices generated blocks between `# >>> generated:<id>` / `# <<< generated:<id>`
markers in a hand-written file.

## Compare: is the generated GraphQL the client's GraphQL?

`elody-ui compare` generates the declaration into a scratch root and reads
both sides the way the graphql-service's codegen does: every `*.queries.ts`
below the directory, the `gql` template literals extracted and parsed with
graphql-js. Per definition (fragment or operation, by name) the verdict is
`equal`, `differs` (with the path to the first difference), `missing` (the
client has it, the generator does not), `extra` (generated, no such client
definition) or `out-of-scope` (excluded by the scope file, with the gap id
that explains why). Whitespace, comments, `__typename` and the quoting of a
string literal do not count, nor where a fragment is spread. The order of
fields counts where it decides what the user sees: the fields on the card,
in a panel, in a form, the filters, the elements of a column, the values of
an input list (sort options, view modes, bulk operations). Where the PWA
reads an object by name it does not: the initial values, the settings of an
element, a panel or a filter, the fields asked back for a bulk option,
arguments and input objects. What the generated document asks back beyond
the client's (a field without arguments in such a set) does not count
either: the PWA reads by name what it needs. An entity that emits `regions` is generated
into a copy of the client's file, so its hand-written parts compare equal by
construction. The report is text on stdout and, with `--json`, the full
result; exit 1 when anything differs, is missing or extra. The scope file:

```json
{ "outOfScope": { "getTenants": "G-003" }, "outOfScopeFiles": { "queries/flows.queries.ts": "G-007" },
  "outOfScopeGenerated": { "filtersForTenant": "G-009" } }
```

`tests/compare.test.ts` proves the comparer on the dishacled golden: every
definition of `examples/dishacled.ui.ttl` compares equal to
`tests/golden/dishacled-example/`. The declarations of the clients, their
scope files and the gap backlog live in
[`elody-declarations`](../elody-declarations).

## Extract: a declaration from the client's GraphQL

`elody-ui extract` is the reverse of `render`: from a client's query files it
writes an `elody:EntityUi` per `minimal<X>` fragment in the current terms:
the properties from the initial values and the card (aliases, sources,
viewers, detail-only, sort options), the detail layout with its panels, lists
and pickers, the filters (option sources included), the create form, the
bulk operations, the custom bulk operations and the list queries. What the
vocabulary cannot say is left out and listed as a note at the top of the
file, so the proposal validates and `compare` shows exactly what is missing.
`tests/extract.test.ts` round-trips the dishacled golden: extracted and
generated again, every covered document compares equal and nothing differs.
The proposal is a starting point to read and tidy, not a result to commit as
it comes.

The extractor writes the **compact form**: a short node on one line, and
nothing the meta-shapes already state as a default. A property shape without
`elody:labelKey` and without label text is labelled `metadata.labels.<key>`
(the key in kebab-case, `elody:defaultRule`); `elody:collapsed` defaults to
`false` (`sh:defaultValue`); `sh:name` is not written. What a type reads and
shows is three lists (`elody:listingFields`, `elody:detailFields`,
`elody:cardFields`) when that is shorter than a flag per property; a bulk
operation's context is one of the platform's presets
(`elody:ReadModeSomeSelectedContext`, ...) when it matches; an operation
several types declare identically is one named node in `_shared.ui.ttl`,
referenced from each; a label key every shape of a key carries is declared
once on the key in `keys.ui.ttl`; two shapes of one key (an alias twin) are
named property shapes, `ui:<Type>Ui-field-<alias>`, that the lists name by
node; a form's fields are a list of the type's properties (`elody:fields`,
`elody:fieldsFrom`), each inheriting its input and label unless it says its
own. An explicit declaration is as valid and renders the
same; `elody-ui expand` writes every default back for a tool that needs the
explicit graph.

## Compatibility levels (epic #165964)

- **L0** — plain SHACL Core renders. Every widget choice (create forms in the
  generator, `shapeToForm`) comes from the spec's scoring system on the
  official scoring graph (`tests/specScoring.test.ts`, `tests/specExamples.test.ts`).
- **L1** — an explicit `shui:editor` / `shui:viewer` wins, Elody editors
  included (`tests/editors.test.ts`).
- **L2** — round-trip: not yet (T2).
- **L3** — the ontology + meta-shapes in this package; the migrated dishacled
  declaration conforms in both validators (`tests/migrate.test.ts`).

## Retired terms

Read for one release with a warning; `validate` / `check` fail on them;
`migrate` rewrites them.

| Retired | Use |
|---|---|
| `elody:hidden` | `dash:hidden` |
| `elody:editable` | `dash:readOnly` |
| `elody:required` | `sh:minCount 1` |
| `elody:inputType` | `sh:datatype` / `sh:class` / `sh:node` / `sh:in`, or `shui:editor` |
| `elody:defaultValue` | `sh:defaultValue` |
| `elody:tooltip` | `elody:showTooltip` (filter), `elody:tooltipLabel` (bulk op context), `sh:description` (property) |
| `elody:formatter "pill\|auto"` | `shui:viewer elody:PillViewer ; elody:viewerArgument "auto"` |
| `elody:createForm [ … elody:field … ]` | an `elody:Form` with `elody:shape` (fields are property shapes), referenced by `elody:form` |
| `elody:formQuery "Name"` | `elody:form ui:Name` (or `elody:formSourceRef`) |
| `elody:actionType`, `elody:typeModal`, `elody:panelType`, `elody:searchInputType`, `elody:value` (bulk op) | `elody:actionKind`, `elody:modalKind`, `elody:panelKind`, `elody:searchInput`, `elody:operationKind` with an instance |
| `elody:repetitiveForm` | `elody:guidedFlow` |
| `elody:pickerQuery`, `elody:pickerList`, `elody:pickerFilters`, `elody:pickerFiltersQuery`, `elody:filtersQueryName` | `elody:picker ui:Name` (filters document name derived) |
| `elody:type` (picker result) | `elody:graphqlType` |
| `elody:mode "ViewModesList"`, `elody:filterKind "text"` | `elody:mode elody:ListView`, `elody:filterKind elody:TextFilter` |
| `dash:propertyRole dash:LabelRole` | `shui:propertyRole shui:LabelRole` |
| namespace `https://elody.io/ns/ui#` | `https://elody.eu/ns/ui#` |

## Plain SHACL-UI shapes (`shapeToForm`)

`shapeToForm` takes any SHACL 1.2 UI shapes graph, with no `elody:` terms,
and returns the form Elody would render: field order (groups,
`shui:defaultOrder`, tie-break on label), labels (`sh:languageIn`,
`shui:languagePreference`, local-name fallback), property roles (direct and
qualified), nested shapes, the `shui:ValueTableViewer` columns, and per field
the widget the spec's **scoring system** picks (`src/score.ts`, run on the
official scoring graph vendored in `spec/widgets/`) mapped to an Elody widget.
Whatever Elody cannot render is listed as a gap on the field.

`tests/specExamples.test.ts` runs every example of the spec (`spec/examples/`);
`scripts/specReport.ts` writes the per-example verdict.

## Labels, keys and groups (standard terms)

- `sh:name` is the label **text**, one per language. The metadata key is the
  local name of `sh:path`, or `elody:key` where it differs.
- `elody:labelKey` is the Elody translation key the label is shown under.
  Without it the generator mints `ui.<type>.<key>`. `generate` writes the
  `sh:name` texts into `src/translations/<lang>.json` under that key, only where
  a value is missing or differs.
- `sh:group` → `sh:PropertyGroup` is a detail panel: `elody:panel ui:Info` on a
  window element, the group carries `elody:alias`, `elody:panelKind`,
  `dash:readOnly`, `elody:collapsed` and its label in `rdfs:label` (text) /
  `elody:labelKey`. Its fields are the properties in that group, in their own
  `sh:order`. An `elody:Panel` with an explicit `elody:field` list remains for a
  panel whose order differs from the properties' order.
- Old use (`rdfs:label` as a property's translation key, `sh:name` as the key)
  is read with a warning; `elody-ui migrate --translations src/translations`
  rewrites it and fills `sh:name` per language from the client's bundles.

## What a type reads and carries (ontology 0.6.0)

- `elody:alias` on a property shape reads the value under another GraphQL
  field name (`title: keyValue(key: "email")`); several shapes may share one
  `sh:path` under different aliases. A panel shows the field once, described
  by the shape without an alias.
- `elody:detailOnly true` keeps a field out of the listing fragment's initial
  values and off the card; the detail fragment reads every property. The same
  once per type: `elody:listingFields`, `elody:detailFields` and
  `elody:cardFields` list what is read and shown, and the flags follow (an
  explicit flag wins).
- `elody:sortLabelKey` and `elody:sortOrder` give a sort option its own label
  and position; without them the sortable properties sort in their own order
  under their labels.
- `relationValues` is read when a property reads a relation, a panel lists
  related entities or the card has a context menu, else not;
  `elody:relationValues true|false` overrides. The bulk operations fragment is
  emitted when an `elody:bulkOperation` is declared or `elody:documents` names
  `bulkOperations`, else not; `elody:bulkOperations true|false` overrides. A
  declaration in the retired dialect keeps the old always-on defaults, and
  `migrate` makes them explicit.
- A type may declare no `elody:viewMode`: no `allowedViewModes` block.
- A selection filter renders `elody:parentFilterKey`, `elody:showTooltip` and
  an empty default list (`elody:defaultValueAsList true` without values).
- A list element declares the documents it loads with `elody:listQuery`: an
  `elody:ListQuery` with `elody:queryName`, the result fragment per type
  (`elody:result`) and the scoping filters; the generator emits the entities
  document (like a picker's) and the filters document (`elody:filtersQuery`,
  default the query name with `Filters`) and sets `customQuery` and
  `customQueryFilters`. Without results only the filters document is emitted:
  the entities document stays hand-written. A list query two types share is
  emitted with the first. A filter without `elody:alias` is emitted unaliased.

The vocabulary is read from `ELODY_ONTOLOGY` when set, else from the installed
package or the checkout next to this one, whichever is the newer version
(so an untagged ontology change in `../elody-ontology` is picked up).

## Detail elements

All thirteen element kinds of the schema (`EntityViewElements`) have a class,
linked to their GraphQL field by `elody:schemaField`. The generator renders
four of them (window, list, markdown, shape); declaring one of the other ten
(media, single media, map, graph, hierarchy list, IIIF manifest, embedded
entity, action, rich text, comments) validates, but `generate` refuses it with
a message until its renderer exists. Keep those in hand-written GraphQL
(`"regions"` mode) meanwhile.

## Not implemented (documented)

`shui:RichTextEditor`, `shui:SubClassEditor`, `shui:BlankNodeEditor`,
`shui:HTMLViewer`, SPARQL-driven terms (`shui:searchQuery`, `sh:values`).
A declaration naming one of them fails validation.

## Develop

```bash
pnpm install
pnpm test        # vitest
pnpm build       # tsc -> dist/
```

The golden files in `tests/golden/dishacled/` are the output of the reference
generator (`generateUiQueries.ts`, mat2elody / dishacled `feat/rdf-ui-declaration`)
for the dishacled declaration; this package reproduces them byte for byte.
