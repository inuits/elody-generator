/**
 * `extract`: a declaration proposal from a client's hand-written GraphQL, the
 * reverse of `render`. Reads the query files the way `compare` does and, per
 * type (every `minimal<X>` fragment), writes an `elody:EntityUi` in the
 * current terms: properties from the initial values and the card, the detail
 * layout with its panels and lists, the filters, the sort options, the create
 * form, the bulk operations, the custom bulk operations and the list queries.
 * What it cannot say becomes a note at the top of the file (a gap in the
 * making) and is left out, so the result validates and the comparison shows
 * exactly what is missing. The proposal is a starting point: it is meant to be
 * read and tidied, not committed as it comes.
 */
import { Kind, parse } from "graphql";
import type { ArgumentNode, FieldNode, FragmentDefinitionNode, ObjectValueNode, OperationDefinitionNode, SelectionNode, SelectionSetNode, ValueNode } from "graphql";
import { readDefinitions, type Definition, type QueryFile } from "./compare.js";
import { Ontology, defaultOntology } from "./ontology.js";
import { elody } from "./vocab.js";

export type ExtractOptions = {
  /** the namespace of the minted nodes (ui:) */
  namespace?: string;
  /** the namespace of the metadata keys (em:) */
  keyNamespace?: string;
  /** a comment line for the file header */
  source?: string;
  ontology?: Ontology;
};

export type ExtractResult = { ttl: string; notes: string[]; types: string[] };

// -- AST helpers ---------------------------------------------------------------

const fields = (set: SelectionSetNode | undefined): FieldNode[] => (set?.selections ?? []).filter((s): s is FieldNode => s.kind === Kind.FIELD);
const spreads = (set: SelectionSetNode | undefined): string[] =>
  (set?.selections ?? []).filter((s) => s.kind === Kind.FRAGMENT_SPREAD).map((s) => (s as { name: { value: string } }).name.value);
const child = (node: { selectionSet?: SelectionSetNode } | undefined, name: string): FieldNode | undefined =>
  fields(node?.selectionSet).find((f) => f.name.value === name);
const alias = (field: FieldNode) => field.alias?.value ?? field.name.value;
const argument = (field: FieldNode, name: string): ValueNode | undefined => field.arguments?.find((a) => a.name.value === name)?.value;
const scalar = (value: ValueNode | undefined): string | undefined => {
  if (!value) return undefined;
  if (value.kind === Kind.STRING || value.kind === Kind.ENUM) return value.value;
  if (value.kind === Kind.INT || value.kind === Kind.FLOAT) return value.value;
  if (value.kind === Kind.BOOLEAN) return String(value.value);
  return undefined;
};
const str = (field: FieldNode, name: string) => scalar(argument(field, name));
const input = (field: FieldNode | undefined) => (field ? scalar(argument(field, "input")) : undefined);
const list = (value: ValueNode | undefined): ValueNode[] => (value?.kind === Kind.LIST ? [...value.values] : value ? [value] : []);
const objectField = (object: ObjectValueNode, name: string): ValueNode | undefined => object.fields.find((f) => f.name.value === name)?.value;

const q = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const localName = (iri: string) => iri.slice(Math.max(iri.lastIndexOf("#"), iri.lastIndexOf("/")) + 1);
const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// -- the model the proposal is written from ------------------------------------

type Property = {
  key: string;
  order?: number;
  group?: string;
  alias?: string;
  source?: string;
  index?: number;
  formatter?: string;
  relationType?: string;
  valueLabelKey?: string;
  inListing: boolean;
  inDetail: boolean;
  /** no initial value is read for it: a spread or the platform provides it */
  readsValue: boolean;
  teaser: boolean;
  labelKey?: string;
  unit?: string;
  colSpan?: number;
  sortable: boolean;
  sortLabelKey?: string;
  sortOrder?: number;
  sortDirection?: string;
  editor?: string;
  datatype?: string;
  single: boolean;
  required: boolean;
  clientField?: string;
  readOnly: boolean;
  labelRole: boolean;
};

type Panel = { alias: string; label?: string; kind?: string; collapsed: boolean; editable: boolean; multipleColumns: boolean; fields: string[]; spreads: string[] };
type Element =
  | { kind: "window"; alias?: string; label?: string; expandButton: boolean; panels: Panel[] }
  | { kind: "shaclShape"; label?: string; fieldsKey?: string; collapsed: boolean }
  | { kind: "markdown"; label?: string; metadataKey?: string; collapsed: boolean }
  | {
      kind: "list";
      alias?: string;
      label?: string;
      mediaKind?: string;
      customQueryRelationType?: string;
      collapsed: boolean;
      entityTypes: string[];
      relationType?: string;
      searchInput?: string;
      customQuery?: string;
      customQueryFilters?: string;
      customBulkOperations?: string;
      picker?: string;
      /** the declared list query node this element loads, when these files hold its documents */
      listQuery?: string;
    };
type Column = { size?: string; elements: Element[] };

type Filter = {
  order?: number;
  alias?: string;
  kind: string;
  key?: string;
  keyAsList: boolean;
  parentKey?: string;
  label?: string;
  displayed: boolean;
  tooltip: boolean;
  defaults: string[];
  defaultAsList: boolean;
  hidden: boolean;
  options?: { type: string; key: string; matchExact?: boolean; distinctBy?: string };
  optionsLabel?: string;
  optionsValue?: string;
  selectionOption?: string;
  operator?: string;
  showTime?: boolean;
};

type FormField = { key: string; alias?: string; label?: string; editor?: string; datatype?: string; single: boolean; required: boolean; clientField?: string };
type Form = { queryName: string; label?: string; tabAlias?: string; fields: FormField[]; submit?: { label?: string; icon?: string; actionQuery?: string; creationType?: string; showsFormErrors: boolean } };

type Operation = {
  order?: number;
  label?: string;
  icon?: string;
  kind?: string;
  primary?: boolean;
  can: string[];
  context?: { mode?: string; selection?: string; tooltip?: string };
  modal?: { kind?: string; form?: string; relationType?: string; closeConfirmation?: boolean; permission?: string };
};

type ListQuery = { node?: string; name: string; filtersName?: string; results: { type: string; fragment: string }[]; filters: Filter[] };
type Picker = ListQuery;

type Entity = {
  documentName: string;
  graphqlType: string;
  properties: Property[];
  viewModes: string[];
  thumbnail?: { key?: string; fromMediafile?: boolean; order?: number };
  typePills: boolean;
  spreads: { listingValues: string[]; detailValues: string[]; card: string[]; filters: string[] };
  relationValues?: boolean;
  detailFormatters?: boolean;
  excludeBaseSortOptions?: boolean;
  documents: string[];
  columns: Column[];
  shapeDriven: boolean;
  fragmentFields: string[];
  dynamicFormConfig?: string;
  ports?: string;
  pickers: Picker[];
  filters: Filter[];
  form?: Form;
  /** the forms the bulk operations and actions open, when these files hold them */
  forms: Form[];
  operations?: Operation[];
  customOperations: { name: string; operations: Operation[] }[];
  listQueries: ListQuery[];
  contextMenu?: { forceShow: boolean; basic: boolean; actions: { alias: string; kind?: string; label?: string; icon?: string; formQuery?: string; formFlow?: string; formTitle?: string }[] };
};

// -- the input field types a client uses --------------------------------------

const BASE_FIELDS: Record<string, { editor?: string; datatype?: string }> = {
  baseTextField: { datatype: "xsd:string" },
  baseTextareaField: { editor: "shui:TextAreaEditor", datatype: "xsd:string" },
  baseDateField: { editor: "shui:DatePickerEditor" },
  baseDateTimeField: { editor: "shui:DateTimePickerEditor" },
  baseNumberField: { editor: "shui:NumberFieldEditor", datatype: "xsd:integer" },
  baseCheckbox: { editor: "shui:BooleanEditor", datatype: "xsd:boolean" },
};

export class Extractor {
  readonly notes: string[] = [];
  private readonly definitions: Map<string, Definition>;
  private readonly o: Ontology;
  private readonly stubs = new Set<string>();
  /** list query nodes by query and filters document: one node per pair, the entities document with the first */
  private readonly listQueryNodes = new Map<string, string>();
  private readonly queriesWithResults = new Set<string>();
  /** every node minted so far: a list query, a picker, a form or a custom operations set never share a name */
  private readonly nodes = new Set<string>();

  private mint(preferred: string, fallback: string): string {
    const node = !this.nodes.has(preferred) ? preferred : !this.nodes.has(fallback) ? fallback : `${preferred}_${this.nodes.size}`;
    this.nodes.add(node);
    return node;
  }

  constructor(definitions: Definition[], ontology: Ontology) {
    this.definitions = new Map(definitions.map((d) => [d.name, d]));
    this.o = ontology;
  }

  private note(message: string) {
    if (!this.notes.includes(message)) this.notes.push(message);
  }

  private fragment(name: string): FragmentDefinitionNode | undefined {
    const definition = this.definitions.get(name);
    return definition?.kind === "fragment" ? (definition.node as FragmentDefinitionNode) : undefined;
  }

  private operation(name: string): OperationDefinitionNode | undefined {
    const definition = this.definitions.get(name);
    return definition && definition.kind !== "fragment" ? (definition.node as OperationDefinitionNode) : undefined;
  }

  /** The elody: instance of `classIri`'s enumeration for a GraphQL literal, as a prefixed name. */
  private instance(className: string, value: string | undefined, where: string): string | undefined {
    if (value === undefined) return undefined;
    const iri = this.o.instanceFor(elody(className), value);
    if (!iri) this.note(`${where}: "${value}" is not a known elody:${className}; left out`);
    return iri ? `elody:${localName(iri)}` : undefined;
  }

  // -- types ------------------------------------------------------------------

  types(): string[] {
    return [...this.definitions.values()]
      .filter((d) => d.kind === "fragment" && d.name.startsWith("minimal") && d.name !== "minimalBaseEntity" && !d.name.startsWith("minimalLinked"))
      .map((d) => d.name.slice("minimal".length))
      .filter((name) => (this.fragment(`minimal${name}`)?.typeCondition.name.value ?? "").length > 0);
  }

  entity(name: string): Entity {
    const minimal = this.fragment(`minimal${name}`)!;
    const full = this.fragment(`full${name}`);
    const graphqlType = minimal.typeCondition.name.value;
    const entity: Entity = {
      documentName: name,
      graphqlType,
      properties: [],
      viewModes: [],
      typePills: false,
      spreads: { listingValues: [], detailValues: [], card: [], filters: [] },
      documents: [],
      columns: [],
      shapeDriven: false,
      fragmentFields: [],
      pickers: [],
      filters: [],
      customOperations: [],
      listQueries: [],
      forms: [],
    };
    const where = name;

    // initial values: the detail fragment's order, the listing's values first when the detail lacks them
    const minimalValues = child(minimal, "intialValues");
    const fullValues = full ? child(full, "intialValues") : undefined;
    const byAlias = new Map<string, Property>();
    const add = (field: FieldNode, listing: boolean) => {
      const a = alias(field);
      const key = str(field, "key") ?? a;
      const source = str(field, "source");
      let property = byAlias.get(a);
      if (!property) {
        property = {
          key: source === "relations" ? a : key,
          alias: undefined,
          source: source && source !== "metadata" && source !== "relations" ? source : undefined,
          relationType: source === "relations" ? key : undefined,
          valueLabelKey: source === "relations" ? (str(field, "metadataKeyAsLabel") ?? "") : undefined,
          index: str(field, "index") !== undefined ? Number(str(field, "index")) : undefined,
          inListing: false,
          inDetail: false,
          readsValue: true,
          teaser: false,
          sortable: false,
          single: true,
          required: false,
          readOnly: false,
          labelRole: false,
        };
        if (source !== "relations" && key !== a) property.alias = a;
        byAlias.set(a, property);
        entity.properties.push(property);
      }
      const formatter = str(field, "formatter");
      if (formatter) property.formatter = formatter;
      if (listing) {
        property.inListing = true;
        if (formatter) listingFormatted.add(a);
      } else {
        property.inDetail = true;
        if (formatter) detailFormatted.add(a);
      }
    };
    const listingFormatted = new Set<string>();
    const detailFormatted = new Set<string>();
    for (const field of fields(fullValues?.selectionSet)) if (field.name.value === "keyValue") add(field, false);
    for (const field of fields(minimalValues?.selectionSet)) if (field.name.value === "keyValue") add(field, true);
    // the card's fields come first, in the card's order (the initial values are read by name, the card is shown in order)
    const cardOrder = fields(child(minimal, "teaserMetadata")?.selectionSet)
      .filter((f) => f.name.value === "metaData")
      .map((f) => input(child(f, "key")) ?? alias(f));
    entity.properties.sort((a, b) => {
      const ia = cardOrder.indexOf(a.alias ?? a.key);
      const ib = cardOrder.indexOf(b.alias ?? b.key);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    for (const a of listingFormatted) if (byAlias.get(a)?.inDetail && !detailFormatted.has(a)) entity.detailFormatters = false;
    for (const field of fields(minimalValues?.selectionSet)) if (field.name.value !== "keyValue") this.note(`${where}: initial value ${alias(field)} is not a keyValue; left out`);
    // (a value read in the listing only is said with elody:listingOnly; a value read on the detail page only with elody:detailOnly)
    entity.spreads.listingValues = spreads(minimalValues?.selectionSet).filter((s) => s !== "typePillsIntialValues");
    entity.spreads.detailValues = spreads(fullValues?.selectionSet);
    entity.typePills = spreads(minimalValues?.selectionSet).includes("typePillsIntialValues");

    // the card
    const teaser = child(minimal, "teaserMetadata");
    for (const field of fields(teaser?.selectionSet)) {
      if (field.name.value === "metaData") {
        const key = input(child(field, "key")) ?? alias(field);
        const property = byAlias.get(key) ?? byAlias.get(alias(field));
        if (!property) {
          this.note(`${where}: card field ${alias(field)} reads no initial value; left out`);
          continue;
        }
        if (alias(field) !== (property.alias ?? property.key)) this.note(`${where}: card field ${alias(field)} shows the value ${key}; the card will show it under ${property.alias ?? property.key}`);
        property.teaser = true;
        property.labelKey = input(child(field, "label"));
        const unit = input(child(field, "unit"));
        if (unit) property.unit = this.instance("Unit", unit, `${where} ${key}`);
        const colSpan = input(child(field, "colSpan"));
        if (colSpan) property.colSpan = Number(colSpan);
      } else if (field.name.value === "thumbnail") {
        const filename = child(field, "filename");
        const before = fields(teaser?.selectionSet).slice(0, fields(teaser?.selectionSet).indexOf(field)).filter((f) => f.name.value === "metaData").length;
        entity.thumbnail = { ...(filename && scalar(argument(filename, "fromMediafile")) === "true" ? { fromMediafile: true } : { key: input(child(field, "key")) ?? "thumbnail" }), order: before };
      } else if (field.name.value === "contextMenuActions") entity.contextMenu = { ...this.contextMenu(field, where)!, forceShow: entity.contextMenu?.forceShow ?? false };
      else if (field.name.value === "forceShowContextMenuActions") {
        entity.contextMenu ??= { forceShow: false, basic: false, actions: [] };
        entity.contextMenu.forceShow = true;
      } else this.note(`${where}: card field ${alias(field)} (${field.name.value}) is not a metaData field; left out`);
    }
    entity.spreads.card = spreads(teaser?.selectionSet).filter((s) => s !== "typePillsTeaserMetadata");
    for (const property of entity.properties) if (!property.inListing) property.teaser = false;

    for (const field of fields(minimal.selectionSet)) {
      if (["intialValues", "relationValues", "allowedViewModes", "teaserMetadata"].includes(field.name.value)) continue;
      if (alias(field) === "dynamicFormConfig") entity.dynamicFormConfig = field.name.value;
      else if (alias(field) === "ports") entity.ports = field.name.value;
      else this.note(`${where}: listing fragment field ${field.name.value} has no term; left out`);
    }

    // view modes
    const viewModes = child(child(minimal, "allowedViewModes"), "viewModes");
    for (const entry of list(viewModes ? argument(viewModes, "input") : undefined)) {
      const value = entry.kind === Kind.OBJECT ? scalar(objectField(entry, "viewMode")) : scalar(entry);
      const mode = this.instance("ViewMode", value, `${where} view mode`);
      const config = entry.kind === Kind.OBJECT ? list(objectField(entry, "config")) : [];
      const entries = config
        .filter((c): c is ObjectValueNode => c.kind === Kind.OBJECT)
        .map((c) => ({ key: scalar(objectField(c, "key")) ?? "", value: objectField(c, "value") }));
      if (mode) entity.viewModes.push(entries.length ? `${mode} ; elody:config ${entries.map((e) => `[ elody:key ${q(e.key)} ; elody:value ${this.configLiteral(e.value)} ]`).join(" , ")}` : mode);
    }

    // the detail layout
    const view = full ? child(full, "entityView") : undefined;
    for (const column of fields(view?.selectionSet)) {
      if (column.name.value !== "column") continue;
      const size = this.instance("ColumnSize", scalar(child(column, "size") ? argument(child(column, "size")!, "size") : undefined), `${where} column`);
      const elements: Element[] = [];
      for (const element of fields(child(column, "elements")?.selectionSet)) {
        if (element.name.value === "windowElement") elements.push(this.window(element, where, entity, byAlias));
        else if (element.name.value === "entityListElement") elements.push(this.list(element, where, entity));
        else if (element.name.value === "shaclShapeElement")
          elements.push({ kind: "shaclShape", label: input(child(element, "label")), fieldsKey: input(child(element, "fieldsKey")), collapsed: input(child(element, "isCollapsed")) === "true" });
        else if (element.name.value === "markdownViewerElement") {
          const content = child(element, "markdownContent");
          elements.push({ kind: "markdown", label: input(child(element, "label")), metadataKey: content ? str(content, "metadataKey") : undefined, collapsed: input(child(element, "isCollapsed")) === "true" });
        } else this.note(`${where}: detail element ${element.name.value} is not rendered by the generator; left out`);
      }
      if (elements.length) entity.columns.push({ size, elements });
      else this.note(`${where}: a column holds nothing the generator renders; left out`);
    }
    if (full)
      for (const field of fields(full.selectionSet)) {
        if (["intialValues", "relationValues", "entityView"].includes(field.name.value)) continue;
        if (field.name.value === "shapeFields") entity.shapeDriven = true;
        else entity.fragmentFields.push(alias(field));
      }

    // relationValues: the generator derives them for the detail page (a relation, a list, a context menu), never for the
    // listing; say it when the client has them elsewhere
    const listingHas = fields(minimal.selectionSet).some((f) => f.name.value === "relationValues");
    const detailHas = full ? fields(full.selectionSet).some((f) => f.name.value === "relationValues") : false;
    if (listingHas) {
      entity.relationValues = true;
      if (full && !detailHas) this.note(`${where}: the listing reads relationValues but the detail page does not; both will read them`);
    } else if (full && !detailHas) entity.relationValues = false;

    // sort options
    const sort = this.fragment(`${name.charAt(0).toLowerCase() + name.slice(1)}SortOptions`);
    const options = child(child(sort, "sortOptions"), "options");
    let position = 0;
    const sortedAliases: string[] = [];
    for (const entry of list(options ? argument(options, "input") : undefined)) {
      if (entry.kind !== Kind.OBJECT) continue;
      const value = scalar(objectField(entry, "value")) ?? "";
      const label = scalar(objectField(entry, "label"));
      let property = byAlias.get(value) ?? entity.properties.find((p) => p.key === value);
      if (!property) {
        property = { key: value, inListing: false, inDetail: true, readsValue: false, teaser: false, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
        entity.properties.push(property);
        byAlias.set(value, property);
      }
      property.sortable = true;
      if (label && label !== property.labelKey) property.sortLabelKey = label;
      sortedAliases.push(value);
      position += 1;
    }
    if (options && scalar(argument(options, "excludeBaseSortOptions")) === "true") entity.excludeBaseSortOptions = true;
    for (const entry of list(options ? argument(options, "input") : undefined))
      if (entry.kind === Kind.OBJECT)
        for (const extra of entry.fields.map((f) => f.name.value).filter((n) => !["icon", "label", "value"].includes(n)))
          this.note(`${where}: sort option field ${extra} has no term; left out`);
    const direction = input(child(child(sort, "sortOptions"), "isAsc"));
    if (direction && sortedAliases.length) {
      const first = byAlias.get(sortedAliases[0]) ?? entity.properties.find((p) => p.key === sortedAliases[0]);
      if (first) first.sortDirection = this.instance("SortDirection", direction, `${where} sort`);
    }
    // sort order differs from the properties' order: say it
    const naturally = entity.properties.filter((p) => p.sortable).map((p) => p.alias ?? p.key);
    if (naturally.join(",") !== sortedAliases.join(",")) sortedAliases.forEach((a, index) => {
      const property = byAlias.get(a) ?? entity.properties.find((p) => p.key === a);
      if (property) property.sortOrder = index + 1;
    });

    // the label role: the title, else the first card field, else the first property
    const title = entity.properties.find((p) => p.key === "title" && !p.alias) ?? entity.properties.find((p) => (p.alias ?? p.key) === "title") ?? entity.properties.find((p) => p.teaser) ?? entity.properties[0];
    if (title) title.labelRole = true;

    // filters, form, bulk operations
    const filters = this.fragment(`filtersFor${name}`) ?? this.fragment(`${name.charAt(0).toLowerCase() + name.slice(1)}Filters`);
    if (filters) {
      const block = child(filters, "advancedFilters");
      entity.filters = this.filters(block, where);
      entity.spreads.filters = spreads(block?.selectionSet);
    }
    const form = this.operation(`Get${name}CreateForm`);
    if (form) entity.form = this.form(form, `Get${name}CreateForm`, where);
    const bulk = this.fragment(`${name.charAt(0).toLowerCase() + name.slice(1)}BulkOperations`);
    if (bulk) entity.operations = this.operations(child(child(bulk, "bulkOperationOptions"), "options"), where);
    // the forms the operations open: declared when these files hold them as dynamic forms
    const opened = [...(entity.operations ?? []), ...entity.customOperations.flatMap((c) => c.operations)]
      .map((op) => op.modal?.form)
      .filter((form): form is string => form !== undefined && form !== entity.form?.queryName);
    for (const formName of new Set(opened)) {
      const query = this.operation(formName);
      if (query && fields(query.selectionSet).some((f) => f.name.value === "GetDynamicForm") && !entity.forms.some((f) => f.queryName === formName))
        entity.forms.push(this.form(query, formName, where));
    }
    for (const [suffix, document] of [["Entities", "entities"], ["Filters", "filters"], ["SortOptions", "sortOptions"], ["BulkOperations", "bulkOperations"]] as const)
      if (this.operation(`Get${name}${suffix}`)) entity.documents.push(document);
    return entity;
  }

  private configLiteral(value: ValueNode | undefined): string {
    if (!value) return '""';
    if (value.kind === Kind.LIST) return value.values.map((v) => this.configLiteral(v)).join(" , ");
    if (value.kind === Kind.BOOLEAN) return String(value.value);
    if (value.kind === Kind.INT || value.kind === Kind.FLOAT) return value.value;
    return q(scalar(value) ?? "");
  }

  /** validation(input: { value: required }) is sh:minCount 1; other validations have no term. */
  private required(validation: FieldNode | undefined, where: string): boolean {
    if (!validation) return false;
    const value = argument(validation, "input");
    const kind = value?.kind === Kind.OBJECT ? scalar(objectField(value, "value")) : undefined;
    if (kind === "required") return true;
    this.note(`${where}: validation ${kind ?? "?"} has no term; left out`);
    return false;
  }

  private contextMenu(field: FieldNode, where: string): Entity["contextMenu"] {
    const menu: NonNullable<Entity["contextMenu"]> = { forceShow: false, basic: spreads(field.selectionSet).includes("basicContextMenuActions"), actions: [] };
    for (const action of fields(field.selectionSet)) {
      if (action.name.value !== "doElodyAction") {
        if (action.name.value !== "__typename") this.note(`${where}: context menu action ${action.name.value} has no term; left out`);
        continue;
      }
      menu.actions.push({
        alias: alias(action),
        kind: this.instance("ActionKind", input(child(action, "action")), `${where} context menu`),
        label: input(child(action, "label")),
        icon: input(child(action, "icon")),
        formQuery: input(child(action, "formQuery")),
        formFlow: input(child(action, "formFlow")),
        formTitle: input(child(action, "formTitle")),
      });
    }
    return menu;
  }

  private window(element: FieldNode, where: string, entity: Entity, byAlias: Map<string, Property>): Element {
    const panels: Panel[] = [];
    for (const panel of fields(element.selectionSet)) {
      if (panel.name.value !== "panels") {
        if (!["label", "expandButtonOptions"].includes(panel.name.value)) this.note(`${where}: window element field ${panel.name.value} has no term; left out`);
        continue;
      }
      const header = child(panel, "panelHeaderContent");
      const headerLabel = header ? scalar(objectField(argument(header, "panelHeaderContentInput") as ObjectValueNode, "label")) : input(child(panel, "label"));
      if (!header && child(panel, "label")) this.note(`${where}: panel ${alias(panel)} is headed with label(input:), the old form; declared as panelHeaderContent`);
      const result: Panel = {
        alias: alias(panel),
        label: headerLabel,
        kind: this.instance("PanelKind", input(child(panel, "panelType")), `${where} panel ${alias(panel)}`),
        collapsed: input(child(panel, "isCollapsed")) === "true",
        editable: input(child(panel, "isEditable")) !== "false",
        multipleColumns: input(child(panel, "canBeMultipleColumns")) === "true",
        fields: [],
        spreads: spreads(panel.selectionSet),
      };
      for (const field of fields(panel.selectionSet)) {
        if (field.name.value !== "metaData") {
          if (!["panelHeaderContent", "label", "panelType", "isCollapsed", "isEditable", "canBeMultipleColumns"].includes(field.name.value))
            this.note(`${where}: panel ${alias(panel)} field ${alias(field)} (${field.name.value}) has no term; left out`);
          continue;
        }
        const key = input(child(field, "key")) ?? alias(field);
        // the panel edits the metadata key: the shape with that key (not an aliased shape of another key)
        let property = entity.properties.find((p) => p.key === key && !p.alias) ?? entity.properties.find((p) => p.key === key);
        if (!property) {
          // shown in the panel, its value read by a spread (or not at all): no initial value for it
          property = { key, inListing: false, inDetail: true, readsValue: false, teaser: false, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
          if (alias(field) !== key) property.alias = alias(field);
          entity.properties.push(property);
          if (!byAlias.has(alias(field))) byAlias.set(alias(field), property);
        }
        const label = input(child(field, "label"));
        if (label && !property.labelKey) property.labelKey = label;
        else if (label && property.labelKey && label !== property.labelKey) this.note(`${where}: panel field ${key} is labelled ${label}, the card ${property.labelKey}; the card's label is kept`);
        const widget = child(field, "inputField");
        if (widget) {
          const type = str(widget, "type") ?? "baseTextField";
          const base = BASE_FIELDS[type];
          if (base) {
            property.editor = base.editor;
            property.datatype = base.datatype;
          } else property.clientField = type;
          if (this.required(child(widget, "validation"), `${where} panel ${alias(panel)} field ${key}`)) property.required = true;
        } else if (result.editable) property.readOnly = true;
        // the panel references the property shape by its path, which is the key (an aliased value keeps its key)
        result.fields.push(property.key);
      }
      panels.push(result);
    }
    return { kind: "window", alias: element.alias?.value, label: input(child(element, "label")), expandButton: child(element, "expandButtonOptions") !== undefined, panels };
  }

  private list(element: FieldNode, where: string, entity: Entity): Element {
    const known = ["label", "isCollapsed", "type", "entityTypes", "relationType", "searchInputType", "customQuery", "customQueryRelationType", "customQueryFilters", "customBulkOperations", "customQueryEntityPickerList", "customQueryEntityPickerListFilters"];
    for (const field of fields(element.selectionSet))
      if (!known.includes(alias(field)) && !known.includes(field.name.value)) this.note(`${where}: list element ${alias(element)} field ${alias(field)} has no term; left out`);
    const types = child(element, "entityTypes");
    const customQuery = input(child(element, "customQuery"));
    const customQueryFilters = input(child(element, "customQueryFilters"));
    const customBulkOperations = input(child(element, "customBulkOperations"));
    // a declared list query only when these files hold the query or its filters document; else the names stay strings
    const declared = customQuery !== undefined && (this.operation(customQuery) !== undefined || (customQueryFilters !== undefined && this.operation(customQueryFilters) !== undefined));
    const listQueryNode = customQuery && declared ? this.listQuery(customQuery, customQueryFilters, where, entity) : undefined;
    if (customBulkOperations) this.customOperations(customBulkOperations, where, entity);
    const pickerList = input(child(element, "customQueryEntityPickerList"));
    const pickerFilters = input(child(element, "customQueryEntityPickerListFilters"));
    const pickerNode = pickerList ? this.picker(pickerList, pickerFilters, where, entity) : undefined;
    const relation = fields(element.selectionSet).find((f) => alias(f) === "relationType");
    const scoped = fields(element.selectionSet).find((f) => alias(f) === "customQueryRelationType");
    return {
      kind: "list",
      alias: element.alias?.value,
      label: input(child(element, "label")),
      mediaKind: this.instance("MediaElementKind", input(child(element, "type")), `${where} list ${alias(element)}`),
      customQueryRelationType: scoped ? input(scoped) : undefined,
      collapsed: input(child(element, "isCollapsed")) === "true",
      entityTypes: list(types ? argument(types, "input") : undefined).map((v) => scalar(v) ?? ""),
      relationType: relation ? input(relation) : undefined,
      searchInput: this.instance("SearchInputKind", input(child(element, "searchInputType")), `${where} list ${alias(element)}`),
      customQuery,
      customQueryFilters,
      customBulkOperations,
      picker: pickerNode,
      listQuery: listQueryNode,
    };
  }

  /** An entity picker's documents: the list (results per type) and the scoping filters. */
  private picker(name: string, filtersName: string | undefined, where: string, entity: Entity): string {
    const known = entity.pickers.find((p) => p.name === name);
    if (known) return known.node ?? name;
    const query = this.operation(name);
    const results: Picker["results"] = [];
    const entities = query ? fields(query.selectionSet).find((f) => f.name.value === "Entities") : undefined;
    for (const on of child(entities, "results")?.selectionSet?.selections ?? [])
      if (on.kind === Kind.INLINE_FRAGMENT) results.push({ type: on.typeCondition?.name.value ?? "", fragment: spreads(on.selectionSet)[0] ?? "" });
    if (!query) this.note(`${where}: picker ${name} is not in these files; declared without results`);
    const filters = filtersName ? this.operation(filtersName) : undefined;
    const block = filters ? child(fields(filters.selectionSet).find((f) => f.name.value === "EntityTypeFilters"), "advancedFilters") : undefined;
    const node = this.mint(name, `${name}Picker`);
    entity.pickers.push({ node, name, filtersName, results, filters: block ? this.filters(block, `${where} ${filtersName}`) : [] });
    return node;
  }

  /** The node of a list query: one per query and filters document; the entities document goes with the first node of a query. */
  private listQuery(name: string, filtersName: string | undefined, where: string, entity: Entity): string {
    const pair = `${name}|${filtersName ?? ""}`;
    const known = this.listQueryNodes.get(pair);
    if (known) return known;
    const node = this.mint(name, filtersName ?? `${name}List`);
    this.listQueryNodes.set(pair, node);
    const query = this.operation(name);
    const results: ListQuery["results"] = [];
    if (query && !this.queriesWithResults.has(name)) {
      const entities = fields(query.selectionSet).find((f) => f.name.value === "Entities");
      const inline = (child(entities, "results")?.selectionSet?.selections ?? []).filter((s) => s.kind === Kind.INLINE_FRAGMENT);
      const spreadOnly = inline.every((s) => s.kind === Kind.INLINE_FRAGMENT && s.selectionSet.selections.every((x) => x.kind === Kind.FRAGMENT_SPREAD));
      if (spreadOnly && inline.length) {
        for (const on of inline)
          if (on.kind === Kind.INLINE_FRAGMENT) results.push({ type: on.typeCondition?.name.value ?? "", fragment: spreads(on.selectionSet)[0] ?? "" });
        this.queriesWithResults.add(name);
      } else this.note(`${where}: list query ${name} selects its results inline; only its filters document is declared`);
    }
    const filters = filtersName ? this.operation(filtersName) : undefined;
    const block = filters ? child(fields(filters.selectionSet).find((f) => f.name.value === "EntityTypeFilters"), "advancedFilters") : undefined;
    entity.listQueries.push({ node, name, filtersName, results, filters: block ? this.filters(block, `${where} ${filtersName}`) : [] });
    if (filtersName && !filters) this.note(`${where}: filters document ${filtersName} is not in these files; the list query declares no filters and the name stays`);
    return node;
  }

  private customOperations(name: string, where: string, entity: Entity) {
    if (entity.customOperations.some((c) => c.name === name)) return;
    const query = this.operation(name);
    if (!query) {
      this.note(`${where}: custom bulk operations ${name} are not in these files; the element names them, nothing is generated`);
      this.stubs.add(name);
      return;
    }
    const custom = fields(query.selectionSet).find((f) => f.name.value === "CustomBulkOperations");
    const operations = this.operations(child(child(custom, "bulkOperationOptions"), "options"), `${where} ${name}`);
    if (operations.length) entity.customOperations.push({ name, operations });
    else {
      this.note(`${where}: custom bulk operations ${name} declare no operation the vocabulary knows; the element names them, nothing is generated`);
      this.stubs.add(name);
    }
  }

  private filters(block: FieldNode | undefined, where: string): Filter[] {
    const result: Filter[] = [];
    for (const field of fields(block?.selectionSet)) {
      if (field.name.value !== "advancedFilter") continue;
      const kindValue = str(field, "type");
      const kind = this.instance("FilterKind", kindValue, `${where} filter ${alias(field)}`);
      if (!kind) continue;
      const keyValue = argument(field, "key");
      const defaults = child(field, "defaultValue");
      const defaultValue = defaults ? argument(defaults, "value") : undefined;
      const filter: Filter = {
        alias: field.alias?.value,
        kind,
        key: keyValue ? (scalar(keyValue) ?? scalar(list(keyValue)[0])) : undefined,
        keyAsList: keyValue?.kind === Kind.LIST,
        parentKey: str(field, "parentKey"),
        label: str(field, "label"),
        displayed: str(field, "isDisplayedByDefault") === "true",
        tooltip: child(field, "tooltip") !== undefined,
        defaults: list(defaultValue).map((v) => scalar(v) ?? ""),
        defaultAsList: defaultValue?.kind === Kind.LIST,
        hidden: child(field, "hidden") !== undefined && input(child(field, "hidden")) !== "false",
      };
      const mapping = argument(field, "filterOptionsMapping");
      if (mapping?.kind === Kind.OBJECT) {
        filter.optionsLabel = scalar(objectField(mapping, "label"));
        filter.optionsValue = scalar(objectField(mapping, "value"));
      }
      filter.selectionOption = str(field, "selectionOption");
      filter.operator = str(field, "operator");
      filter.showTime = str(field, "showTimeForDateFilter") === "true";
      const retrieving = argument(field, "advancedFilterInputForRetrievingOptions");
      if (retrieving) {
        const inputs = list(retrieving).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
        const text = inputs.find((o) => scalar(objectField(o, "type")) === "text");
        const type = inputs.find((o) => scalar(objectField(o, "type")) === "type");
        const typeValue = type ? scalar(objectField(type, "value")) : undefined;
        if (text && typeValue)
          filter.options = {
            type: typeValue,
            key: scalar(list(objectField(text, "key"))[0]) ?? "",
            matchExact: scalar(objectField(text, "match_exact")) === undefined ? undefined : scalar(objectField(text, "match_exact")) === "true",
            distinctBy: scalar(objectField(text, "distinct_by")),
          };
        else this.note(`${where}: filter ${alias(field)} fetches its options in a way the vocabulary cannot say (no text search scoped to one type); its option source is left out`);
      }
      for (const a of field.arguments ?? [])
        if (!["type", "key", "label", "isDisplayedByDefault", "parentKey", "advancedFilterInputForRetrievingOptions", "filterOptionsMapping", "selectionOption", "operator", "showTimeForDateFilter"].includes(a.name.value))
          this.note(`${where}: filter ${alias(field)} argument ${a.name.value} has no term; left out`);
      result.push(filter);
    }
    return result;
  }

  private form(query: OperationDefinitionNode, queryName: string, where: string): Form {
    const dynamic = fields(query.selectionSet).find((f) => f.name.value === "GetDynamicForm");
    const tab = fields(dynamic?.selectionSet).find((f) => f.name.value === "formTab");
    const form: Form = { queryName, label: input(child(dynamic, "label")), tabAlias: tab?.alias?.value, fields: [] };
    for (const field of fields(child(tab, "formFields")?.selectionSet)) {
      if (field.name.value === "metaData") {
        const widget = child(field, "inputField");
        const type = widget ? (str(widget, "type") ?? "baseTextField") : "baseTextField";
        const base = BASE_FIELDS[type];
        const key = input(child(field, "key")) ?? alias(field);
        form.fields.push({
          key,
          alias: alias(field) !== key ? alias(field) : undefined,
          label: input(child(field, "label")),
          editor: base?.editor,
          datatype: base?.datatype,
          single: true,
          required: this.required(child(widget, "validation"), `${where} form ${queryName} field ${key}`),
          clientField: base ? undefined : type,
        });
      } else if (field.name.value === "action") {
        form.submit = {
          label: input(child(field, "label")),
          icon: input(child(field, "icon")),
          actionQuery: input(child(field, "actionQuery")),
          creationType: input(child(field, "creationType")),
          showsFormErrors: input(child(field, "showsFormErrors")) === "true",
        };
        const kind = input(child(field, "actionType"));
        if (kind && kind !== "submit") this.note(`${where}: form ${queryName} submits with ${kind}; declared as a plain submit`);
      } else this.note(`${where}: form ${queryName} field ${alias(field)} (${field.name.value}) has no term; left out`);
    }
    return form;
  }

  private operations(options: FieldNode | undefined, where: string): Operation[] {
    const result: Operation[] = [];
    for (const entry of list(options ? argument(options, "input") : undefined)) {
      if (entry.kind !== Kind.OBJECT) continue;
      const operation: Operation = {
        label: scalar(objectField(entry, "label")),
        icon: scalar(objectField(entry, "icon")),
        kind: this.instance("BulkOperationKind", scalar(objectField(entry, "value")), `${where} bulk operation`),
        can: list(objectField(entry, "can")).map((v) => scalar(v) ?? ""),
      };
      const primary = scalar(objectField(entry, "primary"));
      if (primary !== undefined) operation.primary = primary === "true";
      const context = objectField(entry, "actionContext");
      if (context?.kind === Kind.OBJECT) {
        const mode = objectField(context, "activeViewMode");
        if (mode?.kind === Kind.LIST) this.note(`${where}: a bulk operation's activeViewMode is a list; the first one is declared`);
        operation.context = {
          mode: this.instance("InteractionMode", scalar(list(mode)[0]), `${where} bulk operation`),
          selection: this.instance("SelectionState", scalar(objectField(context, "entitiesSelectionType")), `${where} bulk operation`),
          tooltip: scalar(objectField(context, "labelForTooltip")),
        };
      }
      const modal = objectField(entry, "bulkOperationModal");
      if (modal?.kind === Kind.OBJECT) {
        const forms = objectField(modal, "formQueries") ?? objectField(modal, "formQuery");
        if (objectField(modal, "formQuery")) this.note(`${where}: a bulk operation modal uses formQuery (singular), the old form; declared as a form reference`);
        const close = scalar(objectField(modal, "askForCloseConfirmation"));
        operation.modal = {
          kind: this.instance("ModalKind", scalar(objectField(modal, "typeModal")), `${where} bulk operation`),
          form: scalar(list(forms)[0]),
          relationType: scalar(objectField(modal, "formRelationType")),
          closeConfirmation: close === undefined ? undefined : close === "true",
          permission: this.instance("Permission", scalar(objectField(modal, "neededPermission")), `${where} bulk operation`),
        };
        for (const f of modal.fields)
          if (!["typeModal", "formQueries", "formQuery", "formRelationType", "askForCloseConfirmation", "neededPermission"].includes(f.name.value))
            this.note(`${where}: bulk operation modal field ${f.name.value} has no term; left out`);
      }
      result.push(operation);
    }
    return result;
  }

  // -- writing ----------------------------------------------------------------

  write(entities: Entity[], options: ExtractOptions): string {
    const em = options.keyNamespace ?? "https://elody.io/ns/metadata#";
    const ui = options.namespace ?? "urn:elody:extract#";
    const out: string[] = [
      "@prefix elody:  <https://elody.eu/ns/ui#> .",
      "@prefix sh:     <http://www.w3.org/ns/shacl#> .",
      "@prefix shui:   <http://www.w3.org/ns/shacl-ui/> .",
      "@prefix dash:   <http://datashapes.org/dash#> .",
      "@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .",
      "@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .",
      `@prefix ui:     <${ui}> .`,
      `@prefix em:     <${em}> .`,
      "",
      `# Extracted by elody-ui extract${options.source ? ` from ${options.source}` : ""}: a proposal in the current terms, to be read and tidied.`,
    ];
    if (this.notes.length) {
      out.push("# What the vocabulary cannot say was left out:");
      for (const note of this.notes) out.push(`#   - ${note}`);
    }
    out.push("");
    const formNodes = new Set<string>();
    for (const entity of entities) out.push(this.writeEntity(entity, formNodes), "");
    for (const stub of this.stubs)
      if (!formNodes.has(stub)) out.push(`# a document declared elsewhere (the platform document, or hand-written)`, `ui:${stub}`, `  elody:queryName ${q(stub)} .`, "");
    return out.join("\n");
  }

  private property(p: Property): string {
    const lines = [`    [ sh:path em:${p.key} ;`];
    if (p.labelKey && !p.alias) lines.push(`    sh:name ${q(p.labelKey.split(".").pop() ?? p.key)}@en ;`);
    lines.push(`    sh:order ${p.order} ;`);
    if (p.group) lines.push(`    sh:group ${p.group} ;`);
    if (p.alias) lines.push(`    elody:alias ${q(p.alias)} ;`);
    if (p.datatype) lines.push(`    sh:datatype ${p.datatype} ;`);
    if (p.relationType) lines.push(`    elody:relationType ${q(p.relationType)} ;`);
    if (p.valueLabelKey !== undefined) lines.push(`    elody:valueLabelKey ${q(p.valueLabelKey)} ;`);
    if (p.editor || p.datatype || p.clientField) lines.push(`    sh:maxCount 1 ;`);
    if (p.required) lines.push(`    sh:minCount 1 ;`);
    if (p.labelRole) lines.push(`    shui:propertyRole shui:LabelRole ;`);
    if (p.editor) lines.push(`    shui:editor ${p.editor} ;`);
    if (p.clientField) lines.push(`    elody:clientInputField ${q(p.clientField)} ;`);
    if (p.readOnly) lines.push(`    dash:readOnly true ;`);
    if (p.formatter) {
      const [name, argument] = p.formatter.split("|");
      const viewer = this.o.viewerFor(name);
      if (viewer) lines.push(`    shui:viewer ${viewer.includes("elody.eu") ? "elody" : "shui"}:${localName(viewer)} ;`);
      else this.note(`formatter ${p.formatter} has no viewer in the bindings; left out`);
      if (viewer && argument) lines.push(`    elody:viewerArgument ${q(argument)} ;`);
    }
    if (p.source) {
      const source = this.instance("ValueSource", p.source, `property ${p.key}`);
      if (source) lines.push(`    elody:source ${source} ;`);
    }
    if (p.index !== undefined) lines.push(`    elody:index ${p.index} ;`);
    if (p.labelKey) lines.push(`    elody:labelKey ${q(p.labelKey)} ;`);
    if (p.unit) lines.push(`    elody:unit ${p.unit} ;`);
    if (p.colSpan !== undefined) lines.push(`    elody:colSpan ${p.colSpan} ;`);
    if (p.sortable) lines.push(`    elody:sortable true ;`);
    if (p.sortLabelKey) lines.push(`    elody:sortLabelKey ${q(p.sortLabelKey)} ;`);
    if (p.sortOrder !== undefined) lines.push(`    elody:sortOrder ${p.sortOrder} ;`);
    if (p.sortDirection) lines.push(`    elody:defaultSortDirection ${p.sortDirection} ;`);
    if (!p.teaser && p.inListing) lines.push(`    elody:teaser false ;`);
    if (!p.inListing) lines.push(`    elody:detailOnly true ;`);
    if (p.inListing && !p.inDetail && p.readsValue) lines.push(`    elody:listingOnly true ;`);
    if (!p.readsValue) lines.push(`    elody:readsValue false ;`);
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ]");
    return lines.join("\n");
  }

  private filter(f: Filter): string {
    const lines: string[] = ["    ["];
    if (f.label) lines.push(`    rdfs:label ${q(f.label)} ;`);
    lines.push(`    sh:order ${f.order} ;`);
    if (f.alias) lines.push(`    elody:alias ${q(f.alias)} ;`);
    if (f.key !== undefined) lines.push(`    elody:key ${q(f.key)} ;`);
    if (f.parentKey) lines.push(`    elody:parentFilterKey ${q(f.parentKey)} ;`);
    if (f.hidden) lines.push(`    dash:hidden true ;`);
    for (const value of f.defaults) lines.push(`    sh:defaultValue ${q(value)} ;`);
    if (f.defaultAsList) lines.push(`    elody:defaultValueAsList true ;`);
    if (f.displayed) lines.push(`    elody:displayedByDefault true ;`);
    if (f.optionsLabel) lines.push(`    elody:optionsLabel ${q(f.optionsLabel)} ;`);
    if (f.optionsValue) lines.push(`    elody:optionsValue ${q(f.optionsValue)} ;`);
    if (f.selectionOption) lines.push(`    elody:selectionOption ${q(f.selectionOption)} ;`);
    if (f.operator) lines.push(`    elody:filterOperator ${q(f.operator)} ;`);
    if (f.showTime) lines.push(`    elody:showTime true ;`);
    if (f.options) {
      lines.push(`    elody:optionsType ${q(f.options.type)} ;`, `    elody:optionsKey ${q(f.options.key)} ;`);
      if (f.options.matchExact !== undefined) lines.push(`    elody:optionsMatchExact ${f.options.matchExact} ;`);
      if (f.options.distinctBy) lines.push(`    elody:optionsDistinctBy ${q(f.options.distinctBy)} ;`);
    }
    lines.push(`    elody:filterKind ${f.kind} ;`);
    if (!f.keyAsList && f.key !== undefined) lines.push(`    elody:keyAsList false ;`);
    if (f.tooltip) lines.push(`    elody:showTooltip true ;`);
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ]");
    lines[0] = `    [ ${lines[1].trim()}`;
    lines.splice(1, 1);
    return lines.join("\n");
  }

  private writeOperation(op: Operation, stubs: Set<string>, forms: Set<string>): string {
    const lines: string[] = [];
    if (op.label) lines.push(`    rdfs:label ${q(op.label)} ;`);
    lines.push(`    sh:order ${op.order} ;`);
    if (op.icon) lines.push(`    elody:icon ${q(op.icon)} ;`);
    if (op.kind) lines.push(`    elody:operationKind ${op.kind} ;`);
    if (op.primary !== undefined) lines.push(`    elody:primary ${op.primary} ;`);
    for (const can of op.can) lines.push(`    elody:can ${q(can)} ;`);
    if (op.context)
      lines.push(
        `    elody:context`,
        `      [ elody:activeViewMode ${op.context.mode ?? "elody:ReadMode"} ;`,
        `      elody:selection ${op.context.selection ?? "elody:NoneSelected"} ;`,
        `      elody:tooltipLabel ${q(op.context.tooltip ?? "")} ] ;`,
      );
    if (op.modal) {
      const modal = [`      [ elody:modalKind ${op.modal.kind ?? "elody:DynamicFormModal"} ;`];
      if (op.modal.form) {
        modal.push(`      elody:form ui:${op.modal.form} ;`);
        if (!forms.has(op.modal.form)) stubs.add(op.modal.form);
      }
      if (op.modal.relationType) modal.push(`      elody:formRelationType ${q(op.modal.relationType)} ;`);
      if (op.modal.closeConfirmation !== undefined) modal.push(`      elody:closeConfirmation ${op.modal.closeConfirmation} ;`);
      if (op.modal.permission) modal.push(`      elody:permission ${op.modal.permission} ;`);
      modal[modal.length - 1] = modal[modal.length - 1].replace(/ ;$/, " ] ;");
      lines.push(`    elody:modal`, ...modal);
    }
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ]");
    lines[0] = `    [ ${lines[0].trim()}`;
    return lines.join("\n");
  }

  private writeEntity(entity: Entity, formNodes: Set<string>): string {
    const name = entity.documentName;
    const node = `ui:${name}Ui`;
    const out: string[] = [`${node}`, `  a elody:EntityUi ;`, `  elody:graphqlType ${q(entity.graphqlType)} ;`];
    if (entity.documentName !== entity.graphqlType) out.push(`  elody:documentName ${q(entity.documentName)} ;`);
    out.push(`  elody:emit "file" ;`);
    if (entity.documents.length) out.push(`  elody:documents ${entity.documents.map(q).join(" , ")} ;`);
    if (entity.typePills) out.push(`  elody:typePills true ;`);
    if (entity.relationValues !== undefined) out.push(`  elody:relationValues ${entity.relationValues} ;`);
    if (entity.detailFormatters === false) out.push(`  elody:detailFormatters false ;`);
    if (entity.excludeBaseSortOptions) out.push(`  elody:excludeBaseSortOptions true ;`);
    if (entity.thumbnail)
      out.push(`  elody:thumbnail [ ${entity.thumbnail.fromMediafile ? "elody:fromMediafile true" : `elody:key ${q(entity.thumbnail.key ?? "thumbnail")}`}${entity.thumbnail.order ? ` ; sh:order ${entity.thumbnail.order}` : ""} ] ;`);
    for (const s of entity.spreads.listingValues) out.push(`  elody:listingValuesSpread ${q(s)} ;`);
    for (const s of entity.spreads.detailValues) out.push(`  elody:detailValuesSpread ${q(s)} ;`);
    for (const s of entity.spreads.card) out.push(`  elody:cardSpread ${q(s)} ;`);
    for (const s of entity.spreads.filters) out.push(`  elody:filtersSpread ${q(s)} ;`);

    // properties, numbered in their order
    const properties = entity.properties;
    properties.forEach((p, index) => (p.order = index + 1));
    if (!properties.length) {
      this.note(`${name}: no initial values; a placeholder property is declared`);
      properties.push({ key: "title", order: 1, inListing: true, inDetail: true, readsValue: true, teaser: true, sortable: false, single: true, required: false, readOnly: false, labelRole: true });
    }
    out.push(`  sh:property`, properties.map((p) => this.property(p)).join(" ,\n") + " ;");

    // the detail layout
    const panelNodes: string[] = [];
    if (entity.columns.length) {
      const columns = entity.columns.map((column, c) => {
        const lines = [`    [ sh:order ${c + 1} ;`];
        if (column.size) lines.push(`    elody:size ${column.size} ;`);
        const elements = column.elements.map((element, e) => {
          if (element.kind === "window") {
            const panels = element.panels.map((panel) => {
              const id = `ui:${name}Ui-${panel.alias}`;
              const p: string[] = [`${id}`, `  a elody:Panel ;`, `  rdfs:label ${q(panel.label ?? "")} ;`, `  sh:order 1 ;`, `  elody:alias ${q(panel.alias)} ;`];
              p.push(`  elody:collapsed ${panel.collapsed} ;`);
              if (!panel.editable) p.push(`  dash:readOnly true ;`);
              if (panel.multipleColumns) p.push(`  elody:multipleColumns true ;`);
              for (const s of panel.spreads) p.push(`  elody:spread ${q(s)} ;`);
              p.push(`  elody:panelKind ${panel.kind ?? "elody:MetadataPanel"} ;`);
              if (panel.fields.length) p.push(`  elody:field ${panel.fields.map((f) => `em:${f}`).join(" , ")} ;`);
              p[p.length - 1] = p[p.length - 1].replace(/ ;$/, " .");
              panelNodes.push(p.join("\n"));
              return id;
            });
            const w = [`      [ a elody:WindowElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`];
            if (element.alias) w.push(`      elody:alias ${q(element.alias)} ;`);
            if (element.expandButton) w.push(`      elody:expandButton true ;`);
            if (panels.length) w.push(`      elody:panel ${panels.join(" , ")} ;`);
            w[w.length - 1] = w[w.length - 1].replace(/ ;$/, " ]");
            return w.join("\n");
          }
          if (element.kind === "shaclShape") {
            const s = [`      [ a elody:ShaclShapeElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`, `      elody:collapsed ${element.collapsed} ;`];
            if (element.fieldsKey) s.push(`      elody:fieldsKey ${q(element.fieldsKey)} ;`);
            s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
            return s.join("\n");
          }
          if (element.kind === "markdown") {
            const s = [`      [ a elody:MarkdownElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`, `      elody:collapsed ${element.collapsed} ;`];
            if (element.metadataKey) s.push(`      elody:metadataKey ${q(element.metadataKey)} ;`);
            s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
            return s.join("\n");
          }
          const l = [`      [ a elody:ListElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`];
          if (element.alias) l.push(`      elody:alias ${q(element.alias)} ;`);
          if (element.mediaKind) l.push(`      elody:mediaKind ${element.mediaKind} ;`);
          l.push(`      elody:collapsed ${element.collapsed} ;`);
          for (const type of element.entityTypes) l.push(`      elody:entityTypes ${q(type)} ;`);
          if (element.relationType) l.push(`      elody:relationType ${q(element.relationType)} ;`);
          if (element.customQueryRelationType) l.push(`      elody:customQueryRelationType ${q(element.customQueryRelationType)} ;`);
          if (element.searchInput) l.push(`      elody:searchInput ${element.searchInput} ;`);
          if (element.listQuery) l.push(`      elody:listQuery ui:${element.listQuery} ;`);
          else {
            if (element.customQuery) l.push(`      elody:customQuery ${q(element.customQuery)} ;`);
            if (element.customQueryFilters) l.push(`      elody:customQueryFilters ${q(element.customQueryFilters)} ;`);
          }
          if (element.customBulkOperations) l.push(`      elody:customBulkOperations ui:${element.customBulkOperations} ;`);
          if (element.picker) l.push(`      elody:picker ui:${element.picker} ;`);
          l[l.length - 1] = l[l.length - 1].replace(/ ;$/, " ]");
          return l.join("\n");
        });
        lines.push(`    elody:element`, elements.join(" ,\n") + " ]");
        return lines.join("\n");
      });
      const detail = [`    [ elody:column`, columns.join(" ,\n").replace(/^/gm, "  ")];
      if (entity.shapeDriven) detail.push(`    ; elody:shapeDriven true`);
      if (entity.fragmentFields.length) detail.push(`    ; elody:fragmentField ${entity.fragmentFields.map(q).join(" , ")}`);
      detail[detail.length - 1] += " ] ;";
      out.push(`  elody:detail`, ...detail);
    }
    if (entity.dynamicFormConfig) out.push(`  elody:dynamicFormConfig ${q(entity.dynamicFormConfig)} ;`);
    if (entity.ports) out.push(`  elody:ports ${q(entity.ports)} ;`);
    if (entity.pickers.length) out.push(`  elody:picker ${entity.pickers.map((p) => `ui:${p.node ?? p.name}`).join(" , ")} ;`);

    // filters
    const filters = entity.filters;
    filters.forEach((f, index) => (f.order = index + 1));
    if (filters.length) out.push(`  elody:filter`, filters.map((f) => this.filter(f)).join(" ,\n") + " ;");

    // view modes
    if (entity.viewModes.length) out.push(`  elody:viewMode`, entity.viewModes.map((mode, i) => `    [ sh:order ${i + 1} ; elody:mode ${mode} ]`).join(" ,\n") + " ;");

    // context menu
    if (entity.contextMenu) {
      const menu: string[] = [];
      if (entity.contextMenu.forceShow) menu.push(`    elody:forceShow true ;`);
      if (entity.contextMenu.basic) menu.push(`    elody:includeBasicActions true ;`);
      const actions = entity.contextMenu.actions.map((action, i) => {
        const a = [`      [ sh:order ${i + 1} ;`, `      elody:alias ${q(action.alias)} ;`];
        if (action.label) a.push(`      rdfs:label ${q(action.label)} ;`);
        if (action.kind) a.push(`      elody:actionKind ${action.kind} ;`);
        if (action.icon) a.push(`      elody:icon ${q(action.icon)} ;`);
        if (action.formFlow) a.push(`      elody:formFlow ${q(action.formFlow)} ;`);
        if (action.formTitle) a.push(`      elody:formTitle ${q(action.formTitle)} ;`);
        if (action.formQuery) {
          a.push(`      elody:form ui:${action.formQuery} ;`);
          this.stubs.add(action.formQuery);
        }
        a[a.length - 1] = a[a.length - 1].replace(/ ;$/, " ]");
        return a.join("\n");
      });
      if (actions.length) menu.push(`    elody:action`, actions.join(" ,\n") + " ;");
      if (menu.length) {
        menu[menu.length - 1] = menu[menu.length - 1].replace(/ ;$/, " ] ;");
        out.push(`  elody:contextMenu`, `    [ ${menu[0].trim()}`, ...menu.slice(1));
      }
    }

    // form, bulk operations, custom bulk operations
    const extra: string[] = [];
    const allForms = [...(entity.form ? [entity.form] : []), ...entity.forms];
    if (allForms.length) out.push(`  elody:form ${allForms.map((f) => `ui:${f.queryName}`).join(" , ")} ;`);
    for (const f of allForms) {
      formNodes.add(f.queryName);
      const lines = [`ui:${f.queryName}`, `  a elody:Form ;`, `  rdfs:label ${q(f.label ?? "")} ;`, `  elody:queryName ${q(f.queryName)} ;`];
      if (f.tabAlias && f.tabAlias !== "name") lines.push(`  elody:alias ${q(f.tabAlias)} ;`);
      const shapeFields = f.fields.map((field, i) => {
        const s = [`      [ sh:path em:${field.key} ;`];
        if (field.label) s.push(`      sh:name ${q(field.label.split(".").pop() ?? field.key)}@en ;`);
        s.push(`      sh:order ${i + 1} ;`);
        if (field.alias) s.push(`      elody:alias ${q(field.alias)} ;`);
        if (field.datatype) s.push(`      sh:datatype ${field.datatype} ;`);
        s.push(`      sh:maxCount 1 ;`);
        if (field.required) s.push(`      sh:minCount 1 ;`);
        if (field.editor) s.push(`      shui:editor ${field.editor} ;`);
        if (field.clientField) s.push(`      elody:clientInputField ${q(field.clientField)} ;`);
        if (field.label) s.push(`      elody:labelKey ${q(field.label)} ;`);
        s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
        return s.join("\n");
      });
      lines.push(`  elody:shape`, `    [ sh:property`, shapeFields.join(" ,\n") + " ] ;");
      if (f.submit) {
        const s = [`    [ rdfs:label ${q(f.submit.label ?? "")} ;`];
        if (f.submit.actionQuery) s.push(`    elody:actionQuery ${q(f.submit.actionQuery)} ;`);
        if (f.submit.creationType) s.push(`    elody:creationType ${q(f.submit.creationType)} ;`);
        if (f.submit.icon) s.push(`    elody:icon ${q(f.submit.icon)} ;`);
        if (f.submit.showsFormErrors) s.push(`    elody:showsFormErrors true ;`);
        s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ] ;");
        lines.push(`  elody:submit`, ...s);
      }
      lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " .");
      extra.push(lines.join("\n"));
    }
    if (entity.operations) {
      const ops = entity.operations;
      ops.forEach((op, i) => (op.order = i + 1));
      if (ops.length) out.push(`  elody:bulkOperation`, ops.map((op) => this.writeOperation(op, this.stubs, formNodes)).join(" ,\n") + " ;");
      else out.push(`  elody:bulkOperations true ;`);
    }
    if (entity.customOperations.length) {
      out.push(`  elody:customBulkOperations ${entity.customOperations.map((c) => `ui:${c.name}`).join(" , ")} ;`);
      for (const custom of entity.customOperations) {
        const ops = custom.operations;
        ops.forEach((op, i) => (op.order = i + 1));
        const lines = [`ui:${custom.name}`, `  elody:queryName ${q(custom.name)} ;`];
        if (ops.length) lines.push(`  elody:operation`, ops.map((op) => this.writeOperation(op, this.stubs, formNodes)).join(" ,\n") + " .");
        else lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " .");
        extra.push(lines.join("\n"));
      }
    }
    for (const lq of [...entity.listQueries, ...entity.pickers.map((p) => ({ ...p, picker: true }))]) {
      const lines = [`ui:${lq.node ?? lq.name}`, `  a ${"picker" in lq ? "elody:Picker" : "elody:ListQuery"} ;`, `  elody:queryName ${q(lq.name)} ;`];
      if (lq.filtersName) lines.push(`  elody:filtersQuery ${q(lq.filtersName)} ;`);
      if (lq.results.length) lines.push(`  elody:result`, lq.results.map((r, i) => `    [ elody:graphqlType ${q(r.type)} ; sh:order ${i + 1} ; elody:fragment ${q(r.fragment)} ]`).join(" ,\n") + " ;");
      const filters = lq.filters;
      filters.forEach((f, i) => (f.order = i + 1));
      if (filters.length) lines.push(`  elody:filter`, filters.map((f) => this.filter(f)).join(" ,\n") + " ;");
      lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " .");
      extra.push(lines.join("\n"));
    }

    out[out.length - 1] = out[out.length - 1].replace(/ ;$/, " .");
    return [out.join("\n"), ...panelNodes, ...extra].join("\n\n");
  }
}

/** A declaration proposal for every type the query files define. */
export function extractDeclaration(files: QueryFile[], options: ExtractOptions = {}): ExtractResult {
  const ontology = options.ontology ?? defaultOntology();
  const { definitions, errors } = readDefinitions(files);
  const extractor = new Extractor(definitions, ontology);
  for (const error of errors) extractor.notes.push(`${error.file} does not parse: ${error.message}`);
  const types = extractor.types();
  const entities = types.map((name) => extractor.entity(name));
  const ttl = extractor.write(entities, options);
  return { ttl, notes: extractor.notes, types };
}
