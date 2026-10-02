# Vendored from the SHACL 1.2 UI specification

Fetched 2026-10-02 from the W3C Data Shapes WG (Editor's Draft).

- `widgets/` — the official scoring graph: one file per built-in editor and
  viewer (`shui:WidgetScore`, `shui:WidgetAcceptMatcher`), `score-shapes.ttl`
  (the shapes those matchers reference), and the vocabulary `shacl-ui.ttl`.
  Source: https://github.com/w3c/data-shapes/tree/gh-pages/shacl12-ui/widgets
- `examples/` — every Turtle example in https://w3c.github.io/data-shapes/shacl12-ui/,
  split into `NN-<section>.shapes.ttl` and, when the spec gives one,
  `NN-<section>.data.ttl`. The spec omits prefixes; a common prefix header is
  prepended. Widget snippets that end in `; ...` are closed with ` .`.
  `index.json` lists section and title per example.

Refresh both when the draft changes; `tests/specExamples.test.ts` pins what
Elody does with each example.
