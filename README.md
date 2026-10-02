# ui-declaration-module

TTL UI declarations for Elody clients, and the generator that turns them into
the GraphQL query documents (`*.queries.ts`). Redmine epic #165964, story
#165966 (T1 generator, T6 ontology).

A declaration uses the W3C **SHACL 1.2 UI** vocabulary (`shui:`) and **DASH**
wherever a standard term exists, and the **`elody:` ontology** in this package
for what only the platform knows.

| Layer   | Says                              | Examples |
|---------|-----------------------------------|----------|
| `sh:`   | what a property **is**            | `sh:path`, `sh:datatype`, `sh:class`, `sh:minCount`, `sh:order`, `sh:name`, `sh:description`, `sh:defaultValue` |
| `shui:` | how it is **edited / viewed**     | `shui:editor`, `shui:viewer`, `shui:propertyRole shui:LabelRole` |
| `dash:` | what shui does not say            | `dash:hidden`, `dash:readOnly`, `dash:DescriptionRole` |
| `elody:`| what only the platform knows      | listings, view modes, panels, filters, actions, flows; Elody widgets as `shui:Editor` / `shui:Viewer` instances |

## Contents

- `ontology/elody-ui.ttl` — the ontology, namespace `https://elody.eu/ns/ui#`
  (imports shui + dash). Every term has a domain, a range and a comment saying
  why no standard term carries the meaning. Enumerations are instances with an
  `elody:enumValue` (the GraphQL literal); editors carry `elody:inputFieldType`
  / `elody:formFieldType`, viewers `elody:formatterValue`. The ontology is the
  only editor→widget mapping: the generator has no table of its own.
- `ontology/elody-ui.shapes.ttl` — meta-shapes: what a valid declaration
  looks like. SHACL Core only, so `rdf-validate-shacl` and pySHACL agree.
  Retired terms fail, each with its replacement in the message.
- `src/` — reader, parser, renderers, `generate | check | validate | migrate`.
- `examples/dishacled.ui.ttl` — the dishacled declaration migrated to 0.1.
- `scripts/validate_pyshacl.py` — the pySHACL check for CI.

## Commands

```bash
elody-ui generate [--root DIR]     # src/ui/*.ui.ttl -> src/queries/entities/*.queries.ts
elody-ui check    [--root DIR]     # drift + meta-shapes; exit 1 on either
elody-ui validate FILE.ui.ttl      # meta-shapes only
elody-ui migrate  FILE.ui.ttl --out NEW.ui.ttl   # retired dialect -> 0.1
```

A client **without** `src/ui/*.ui.ttl` is untouched by `generate` and passes
`check`: nothing to read, nothing written. That is the per-client switch.
Per entity, `elody:emit "file"` generates the whole document and `"regions"`
splices generated blocks between `# >>> generated:<id>` / `# <<< generated:<id>`
markers in a hand-written file.

## Compatibility levels (epic #165964)

- **L0** — plain SHACL Core renders: the editor is inferred from
  `sh:datatype` / `sh:class` / `sh:node` / `sh:in` / `sh:nodeKind` /
  `sh:singleLine`, same outcome as the spec's scoring (`tests/editors.test.ts`).
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
