/**
 * The tracking plan: the usage events of the Elody platform and, per property,
 * the values a client's declaration allows. The events and when they are sent
 * are the platform's (the PWA sends them, the same for every client); the values
 * are the client's: the menu's routes and entity types, the filters a user
 * chooses (their document paths), the view modes, sort options, bulk operations,
 * context-menu actions and forms, each with the declarations that name it.
 *
 * `coverage` holds the events a usage tool saw against the plan: declared values
 * never seen (unused, or not tracked), and values or events seen that the
 * declaration does not have (drift).
 */
import type { UiBulkOperation, UiContextMenu, UiEntity, UiMenuItem } from "../model.js";
import type { FilterRecord } from "./inventory.js";

export type TrackedValue = { value: string; label?: string; declaredBy: string[]; entityTypes?: string[] };
export type TrackedProperty = { name: string; type: "string" | "number" | "list"; description: string; values?: TrackedValue[] };
/** `sent`: the PWA sends it today; `planned`: part of the plan, not sent yet */
export type TrackedEvent = { name: string; status: "sent" | "planned"; trigger: string; properties: TrackedProperty[] };
export type TrackingPlan = { client: string; events: TrackedEvent[] };

/** The values of one property, in the order first declared, each with every declaration that names it. */
class Values {
  private readonly byValue = new Map<string, TrackedValue>();
  add(value: string | undefined, owner: string, extra: { label?: string; entityType?: string } = {}): void {
    if (!value) return;
    const known = this.byValue.get(value) ?? { value, declaredBy: [] };
    if (!known.label && extra.label) known.label = extra.label;
    if (!known.declaredBy.includes(owner)) known.declaredBy.push(owner);
    if (extra.entityType && !known.entityTypes?.includes(extra.entityType)) known.entityTypes = [...(known.entityTypes ?? []), extra.entityType];
    this.byValue.set(value, known);
  }
  list(): TrackedValue[] {
    // the keys in a fixed order, whatever order they were filled in
    return [...this.byValue.values()].map(({ value, label, declaredBy, entityTypes }) => ({ value, ...(label ? { label } : {}), declaredBy, ...(entityTypes ? { entityTypes } : {}) }));
  }
}

const fixed = (...values: string[]): TrackedValue[] => values.map((value) => ({ value, declaredBy: ["platform"] }));

const menuItems = (items: UiMenuItem[]): UiMenuItem[] => items.flatMap((item) => [item, ...menuItems(item.subMenu?.items ?? [])]);

/** Every context menu and every list of bulk operations in a declaration, however deep it sits. */
function walk(node: unknown, visit: { menu(menu: UiContextMenu): void; operation(operation: UiBulkOperation): void }, seen = new WeakSet<object>()): void {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) return node.forEach((item) => walk(item, visit, seen));
  for (const [key, value] of Object.entries(node)) {
    // a picker's result references another type's declaration: that one is walked on its own
    if (key === "listing") continue;
    if (key === "contextMenu" && value && typeof value === "object") visit.menu(value as UiContextMenu);
    if (["bulkOperations", "bulkOperationsBase", "operations", "subOptions"].includes(key) && Array.isArray(value))
      for (const operation of value as UiBulkOperation[]) {
        visit.operation(operation);
        walk(operation, visit, seen);
      }
    else walk(value, visit, seen);
  }
}

export function trackingPlan(input: { client: string; entities: UiEntity[]; filters: FilterRecord[] }): TrackingPlan {
  const routes = new Values();
  const entityTypes = new Values();
  const filterPaths = new Values();
  const viewModes = new Values();
  const sorts = new Values();
  const operations = new Values();
  const actions = new Values();
  const actionTypes = new Values();
  const forms = new Values();

  for (const entity of input.entities) {
    const owner = entity.graphqlType;
    for (const item of menuItems(entity.app?.menu ?? [])) {
      routes.add(item.route, owner, { label: item.labelKey, entityType: item.entityType });
      entityTypes.add(item.entityType, owner);
      forms.add(item.modal?.form, owner, { label: item.labelKey });
    }
    for (const option of entity.app?.sortOptions ?? []) sorts.add(option.value, owner, { label: option.labelKey });
    for (const document of entity.sortDocuments ?? []) for (const option of document.options) sorts.add(option.value, owner, { label: option.labelKey });
    for (const mode of entity.viewModes ?? []) viewModes.add(mode.mode, owner);
    for (const form of [...(entity.createForms ?? []), ...(entity.repetitiveForms ?? [])]) forms.add(form.queryName, owner, { label: form.label });
    walk(entity, {
      menu: (menu) =>
        menu.actions?.forEach((action) => {
          actions.add(action.alias, owner, { label: action.label });
          actionTypes.add(action.actionType, owner);
        }),
      operation: (operation) => operations.add(operation.value, owner, { label: operation.label }),
    });
  }
  for (const filter of input.filters)
    for (const owner of filter.owners) {
      // the filters a user chooses: the page sets the hidden ones and the type filter
      if (!filter.hidden && filter.filterKind !== "TypeFilter") filterPaths.add(filter.path, owner);
      // the entity types the menu does not name: subtypes a type filter lists, types an option is limited to
      for (const type of [...(filter.filterKind === "TypeFilter" ? filter.defaultValues : []), ...filter.optionTypes]) entityTypes.add(type, owner);
    }
  // an entity's own page: /<entity type>/<id>
  for (const type of entityTypes.list()) for (const owner of type.declaredBy) routes.add(type.value, owner, { entityType: type.value });

  const entityType = (description: string): TrackedProperty => ({ name: "entity_type", type: "string", description, values: entityTypes.list() });
  const outcome: TrackedProperty = { name: "outcome", type: "string", description: "whether it succeeded", values: fixed("ok", "error") };
  const form: TrackedProperty = { name: "form", type: "string", description: "the form's query (elody:queryName)", values: forms.list() };

  return {
    client: input.client,
    events: [
      { name: "screen_view", status: "sent", trigger: "every route the PWA shows (OpenPanel's page views); the path carries the route", properties: [{ name: "route", type: "string", description: "the path's first segment: a menu route, or the entity type of an entity's page", values: routes.list() }] },
      {
        name: "search",
        status: "sent",
        trigger: "a search is run: the header's search bar, or an overview's own search box; clearing one is not a search",
        properties: [
          { name: "query_length", type: "number", description: "the query's length: the query itself is never sent" },
          { name: "scope", type: "string", description: "where the search was run", values: fixed("header", "library") },
          entityType("the overview searched in (library scope)"),
        ],
      },
      {
        name: "filters_applied",
        status: "sent",
        trigger: "filters are applied to an overview",
        properties: [
          { name: "filters", type: "list", description: "the applied filters' document paths (the key without <client>:<version>|), joined with commas", values: filterPaths.list() },
          { name: "count", type: "number", description: "how many filters were applied" },
        ],
      },
      {
        name: "mutation",
        status: "sent",
        trigger: "every GraphQL mutation; sent under the mutation's operation name, with kind mutation",
        properties: [{ name: "kind", type: "string", description: "always mutation", values: fixed("mutation") }, outcome, entityType("the type of the entity the mutation is on, when it names one")],
      },
      { name: "view_mode_changed", status: "sent", trigger: "the user switches an overview's view mode", properties: [{ name: "view_mode", type: "string", description: "the view mode switched to", values: viewModes.list() }, entityType("the overview's entity type")] },
      { name: "sort_changed", status: "sent", trigger: "the user sorts an overview", properties: [{ name: "sort", type: "string", description: "the sort option chosen", values: sorts.list() }, entityType("the overview's entity type")] },
      {
        name: "bulk_operation",
        status: "sent",
        trigger: "the user runs a bulk operation on a selection",
        properties: [{ name: "operation", type: "string", description: "the operation's value", values: operations.list() }, { name: "selected", type: "number", description: "how many items were selected" }, entityType("the overview's entity type")],
      },
      { name: "context_action", status: "sent", trigger: "the user picks an action from a context menu", properties: [{ name: "action", type: "string", description: "the action's alias", values: actions.list() }, { name: "action_type", type: "string", description: "the action's kind (elody:actionKind), when it has one", values: actionTypes.list() }, entityType("the entity's type")] },
      { name: "form_opened", status: "sent", trigger: "a form opens (a create form, a repetitive form, a menu item's form)", properties: [form, entityType("the entity type the form creates or is opened on")] },
      { name: "form_submitted", status: "sent", trigger: "a form is submitted", properties: [form, outcome, entityType("the entity type the form creates or is opened on")] },
    ],
  };
}

const cell = (text: string | undefined) => (text ?? "").replace(/\|/g, "\\|");

export function trackingPlanMarkdown(plan: TrackingPlan): string {
  const lines = [
    `# Tracking plan: ${plan.client}`,
    "",
    "Generated from the client's UI declaration (`elody-ui analytics tracking`): the platform's usage events, and per property the values the declaration allows. *sent*: the PWA sends it today; *planned*: not yet.",
    "",
  ];
  for (const event of plan.events) {
    lines.push(`## \`${event.name}\` (${event.status})`, "", event.trigger, "", "| property | type | description |", "|---|---|---|");
    for (const property of event.properties) lines.push(`| \`${property.name}\` | ${property.type} | ${cell(property.description)} |`);
    for (const property of event.properties)
      if (property.values?.length && !property.values.every((value) => value.declaredBy.includes("platform"))) {
        lines.push("", `\`${property.name}\`: ${property.values.length} value(s)`, "", "| value | label | declared by |", "|---|---|---|");
        for (const value of property.values) lines.push(`| \`${cell(value.value)}\` | ${cell(value.label)} | ${cell(value.declaredBy.join(", "))} |`);
      }
    lines.push("");
  }
  return lines.join("\n");
}

/** One row of what a usage tool saw: how often an event carried a value of a property. */
export type Observed = { event: string; property: string; value: string; count: number };
/** What a usage tool saw: a JSON list, or JSON lines as ClickHouse writes them (where a count can be a string). */
export function parseObserved(text: string): Observed[] {
  const rows: Record<string, unknown>[] = text.trimStart().startsWith("[") ? JSON.parse(text) : text.split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line));
  return rows.map((row) => ({ event: String(row.event), property: String(row.property), value: String(row.value), count: Number(row.count) }));
}

export type CountedValue = { value: string; count: number };
export type PropertyCoverage = { name: string; values: CountedValue[]; undeclared: CountedValue[] };
export type EventCoverage = { name: string; status: TrackedEvent["status"]; properties: PropertyCoverage[] };
export type Coverage = { client: string; events: EventCoverage[]; unknownEvents: { event: string; count: number }[] };

export function coverage(plan: TrackingPlan, observed: Observed[]): Coverage {
  const counts = new Map<string, Map<string, number>>();
  const key = (event: string, property: string) => `${event}\u0000${property}`;
  const types = new Map(plan.events.flatMap((event) => event.properties.map((property) => [key(event.name, property.name), property.type] as const)));
  for (const row of observed) {
    const at = key(row.event, row.property);
    const values = types.get(at) === "list" ? row.value.split(",").map((value) => value.trim()).filter(Boolean) : [row.value];
    const tally = counts.get(at) ?? new Map<string, number>();
    for (const value of values) tally.set(value, (tally.get(value) ?? 0) + row.count);
    counts.set(at, tally);
  }
  const byCount = (a: CountedValue, b: CountedValue) => b.count - a.count || a.value.localeCompare(b.value);
  const events = plan.events.map((event) => ({
    name: event.name,
    status: event.status,
    properties: event.properties
      .filter((property) => property.values)
      .map((property) => {
        const tally = counts.get(key(event.name, property.name)) ?? new Map<string, number>();
        const declared = new Set(property.values!.map((value) => value.value));
        return {
          name: property.name,
          values: property.values!.map((value) => ({ value: value.value, count: tally.get(value.value) ?? 0 })),
          undeclared: [...tally].filter(([value]) => !declared.has(value)).map(([value, count]) => ({ value, count })).sort(byCount),
        };
      }),
  }));
  const planned = new Set(plan.events.map((event) => event.name));
  // an event's count: the most any one of its properties was seen
  const unknown = new Map<string, Map<string, number>>();
  for (const row of observed)
    if (!planned.has(row.event)) {
      const perProperty = unknown.get(row.event) ?? new Map<string, number>();
      perProperty.set(row.property, (perProperty.get(row.property) ?? 0) + row.count);
      unknown.set(row.event, perProperty);
    }
  const unknownEvents = [...unknown].map(([event, perProperty]) => ({ event, count: Math.max(...perProperty.values()) })).sort((a, b) => b.count - a.count || a.event.localeCompare(b.event));
  return { client: plan.client, events, unknownEvents };
}

export function coverageMarkdown(report: Coverage): string {
  const code = (values: CountedValue[], withCount: boolean) => values.map((value) => `\`${value.value}\`${withCount ? ` (${value.count})` : ""}`).join(", ");
  const lines = [`# Tracking coverage: ${report.client}`, "", "What the usage events showed against the tracking plan.", ""];
  for (const event of report.events) {
    lines.push(`## \`${event.name}\` (${event.status})`, "");
    for (const property of event.properties) {
      const seen = property.values.filter((value) => value.count > 0).sort((a, b) => b.count - a.count);
      const never = property.values.filter((value) => value.count === 0);
      lines.push(`- \`${property.name}\`: ${seen.length} of ${property.values.length} declared value(s) seen${seen.length ? `: ${code(seen, true)}` : ""}`);
      if (never.length) lines.push(`  - never seen: ${code(never, false)}`);
      if (property.undeclared.length) lines.push(`  - not declared: ${code(property.undeclared, true)}`);
    }
    lines.push("");
  }
  lines.push("## Events not in the plan", "", ...(report.unknownEvents.length ? report.unknownEvents.map((event) => `- \`${event.event}\` (${event.count})`) : ["none"]), "");
  return lines.join("\n");
}
