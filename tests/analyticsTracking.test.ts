/**
 * The tracking plan: which usage events the PWA sends (or is to send), and for
 * each property the values a client's declaration allows. The events are the
 * platform's, the same for every client; the values come from the declaration:
 * the menu's routes and entity types, the filters' document paths, the view
 * modes, sort options, bulk operations, context-menu actions and forms.
 */
import { describe, expect, it } from "vitest";
import type { UiEntity } from "../src/model.js";
import type { FilterRecord } from "../src/analytics/inventory.js";
import { coverage, coverageMarkdown, parseObserved, trackingPlan, trackingPlanMarkdown, type TrackingPlan } from "../src/analytics/tracking.js";

const entity = (part: Partial<UiEntity> & { graphqlType: string }): UiEntity =>
  ({ iri: `urn:ui:${part.graphqlType}Ui`, viewModes: [], properties: [], filters: [], bulkOperations: [], customBulkOperations: [], createForms: [], repetitiveForms: [], pickers: [], listQueries: [], sortDocuments: [], bulkDocuments: [], ...part }) as UiEntity;

const app = entity({
  graphqlType: "App",
  app: {
    menu: [
      { alias: "entities", labelKey: "navigation.wem", route: "Home", order: 1, subMenu: { name: "sub", items: [
        { alias: "persons", labelKey: "navigation.persons", entityType: "person", route: "persons", order: 1 },
        { alias: "works", labelKey: "navigation.works", entityType: "work_word", route: "works", order: 2 },
      ] } },
      { alias: "new-person", labelKey: "navigation.new-person", order: 2, modal: { kind: "DynamicForm", form: "GetPersonCreateForm" } },
    ],
    sortOptions: [{ labelKey: "metadata.labels.title", value: "title", order: 1 }],
    bulkOperationsBase: [{ value: "delete", order: 1, can: [], label: "bulk-operations.delete" }],
  } as unknown as UiEntity["app"],
});

const person = entity({
  graphqlType: "Person",
  viewModes: [{ mode: "ListView", order: 1, config: [] }, { mode: "TableView", order: 2, config: [] }],
  bulkOperations: [{ value: "exportCsv", order: 1, can: [], subOptions: [{ value: "exportCsvAll", order: 1, can: [] }] }],
  contextMenu: { forceShow: false, includeBasicActions: true, actions: [{ alias: "merge", order: 1, actionType: "openModal", label: "context-menu.merge" }] },
  createForms: [{ queryName: "GetPersonCreateForm", label: "navigation.new-person", fields: [] }],
  sortDocuments: [{ queryName: "GetSortOptionsForPersons", options: [{ labelKey: "metadata.labels.name", value: "name", order: 1 }] }],
});

const work = entity({ graphqlType: "Work", viewModes: [{ mode: "ListView", order: 1, config: [] }] });

const filter = (path: string, owners: string[], extra: Partial<FilterRecord> = {}): FilterRecord => ({
  owners, path, key: `vlacc:1|${path}`, prefixed: true, filterKind: "SelectionFilter", hidden: false, defaultValues: [], optionTypes: [], ...extra,
});
const filters = [
  filter("properties.name.value", ["Person"]),
  filter("properties.title.value", ["Work"]),
  filter("properties.title.value", ["fragment:entityAuditFilters"]),
  // hidden filters and the type filter are set by the page, not chosen by the user
  filter("identifiers", ["Work"], { hidden: true }),
  { ...filter("type", ["Person"]), key: undefined, prefixed: false, filterKind: "TypeFilter" },
  // a type filter names entity types the menu may not: subtypes listed under one overview
  { ...filter("type", ["Work"]), key: undefined, prefixed: false, filterKind: "TypeFilter", defaultValues: ["work_word", "work_music"] },
];

const plan = trackingPlan({ client: "vlacc", entities: [app, person, work], filters });
const event = (name: string) => plan.events.find((e) => e.name === name)!;
const values = (name: string, property: string) => event(name).properties.find((p) => p.name === property)!.values!.map((v) => v.value);

describe("trackingPlan", () => {
  it("lists the platform's events, each sent today or planned (all sent, since the PWA sends every one)", () => {
    expect(plan.client).toBe("vlacc");
    expect(plan.events.map((e) => [e.name, e.status])).toEqual([
      ["screen_view", "sent"],
      ["search", "sent"],
      ["filters_applied", "sent"],
      ["mutation", "sent"],
      ["view_mode_changed", "sent"],
      ["sort_changed", "sent"],
      ["bulk_operation", "sent"],
      ["context_action", "sent"],
      ["form_opened", "sent"],
      ["form_submitted", "sent"],
    ]);
  });

  it("takes the pages from the menu, then an entity's detail page (/<entity type>/<id>) per entity type", () => {
    expect(event("screen_view").properties.find((p) => p.name === "route")!.values).toEqual([
      { value: "Home", label: "navigation.wem", declaredBy: ["App"] },
      { value: "persons", label: "navigation.persons", declaredBy: ["App"], entityTypes: ["person"] },
      { value: "works", label: "navigation.works", declaredBy: ["App"], entityTypes: ["work_word"] },
      { value: "person", declaredBy: ["App"], entityTypes: ["person"] },
      { value: "work_word", declaredBy: ["App", "Work"], entityTypes: ["work_word"] },
      { value: "work_music", declaredBy: ["Work"], entityTypes: ["work_music"] },
    ]);
  });

  it("takes the entity types from the menu and from the type filters", () => {
    expect(values("search", "entity_type")).toEqual(["person", "work_word", "work_music"]);
    expect(values("search", "scope")).toEqual(["header", "library"]);
  });

  it("offers the filters a user chooses: their document paths, folded, hidden and type filters left out", () => {
    expect(event("filters_applied").properties.find((p) => p.name === "filters")!.values).toEqual([
      { value: "properties.name.value", declaredBy: ["Person"] },
      { value: "properties.title.value", declaredBy: ["Work", "fragment:entityAuditFilters"] },
    ]);
  });

  it("collects view modes, sort options, bulk operations, actions and forms where they are declared", () => {
    expect(event("view_mode_changed").properties.find((p) => p.name === "view_mode")!.values).toEqual([
      { value: "ListView", declaredBy: ["Person", "Work"] },
      { value: "TableView", declaredBy: ["Person"] },
    ]);
    expect(values("sort_changed", "sort")).toEqual(["title", "name"]);
    expect(values("bulk_operation", "operation")).toEqual(["delete", "exportCsv", "exportCsvAll"]);
    expect(event("context_action").properties.find((p) => p.name === "action")!.values).toEqual([
      { value: "merge", label: "context-menu.merge", declaredBy: ["Person"] },
    ]);
    // the alias is often generic (doElodyAction): the action's kind says what it does
    expect(values("context_action", "action_type")).toEqual(["openModal"]);
    expect(event("form_opened").properties.find((p) => p.name === "form")!.values).toEqual([
      { value: "GetPersonCreateForm", label: "navigation.new-person", declaredBy: ["App", "Person"] },
    ]);
    expect(values("form_submitted", "outcome")).toEqual(["ok", "error"]);
  });

  it("writes a readable plan", () => {
    const md = trackingPlanMarkdown(plan);
    expect(md).toContain("# Tracking plan: vlacc");
    expect(md).toContain("## `filters_applied` (sent)");
    expect(md).toContain("| `properties.title.value` |  | Work, fragment:entityAuditFilters |");
  });
});

describe("coverage", () => {
  const small: TrackingPlan = trackingPlan({ client: "vlacc", entities: [app, person, work], filters });
  const report = coverage(small, [
    { event: "search", property: "entity_type", value: "person", count: 12 },
    { event: "search", property: "entity_type", value: "reading", count: 3 },
    // a list property arrives joined with commas
    { event: "filters_applied", property: "filters", value: "properties.name.value,properties.title.value", count: 2 },
    { event: "filters_applied", property: "filters", value: "properties.name.value", count: 5 },
    { event: "entity_saved", property: "entity_type", value: "person", count: 9 },
  ]);
  const of = (name: string, property: string) => report.events.find((e) => e.name === name)!.properties.find((p) => p.name === property)!;

  it("counts what was seen of each declared value", () => {
    expect(of("filters_applied", "filters").values).toEqual([
      { value: "properties.name.value", count: 7 },
      { value: "properties.title.value", count: 2 },
    ]);
    expect(of("search", "entity_type").values).toEqual([
      { value: "person", count: 12 },
      { value: "work_word", count: 0 },
      { value: "work_music", count: 0 },
    ]);
  });

  it("names the values seen that the declaration does not have", () => {
    expect(of("search", "entity_type").undeclared).toEqual([{ value: "reading", count: 3 }]);
  });

  it("names the events seen that the plan does not have", () => {
    expect(report.unknownEvents).toEqual([{ event: "entity_saved", count: 9 }]);
  });

  it("writes the declared values never seen as such", () => {
    const md = coverageMarkdown(report);
    expect(md).toContain("never seen: `work_word`, `work_music`");
    expect(md).toContain("not declared: `reading` (3)");
    expect(md).toContain("`entity_saved` (9)");
  });
});

describe("parseObserved", () => {
  const rows = [{ event: "search", property: "scope", value: "library", count: 4 }, { event: "search", property: "scope", value: "header", count: 1 }];

  it("reads a JSON list", () => {
    expect(parseObserved(JSON.stringify(rows))).toEqual(rows);
  });

  it("reads JSON lines, as ClickHouse writes them (counts as strings)", () => {
    const lines = rows.map((row) => JSON.stringify({ ...row, count: String(row.count) })).join("\n") + "\n";
    expect(parseObserved(lines)).toEqual(rows);
  });
});
