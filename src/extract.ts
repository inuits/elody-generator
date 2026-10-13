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
import { Kind, parse, print } from "graphql";
import type { ArgumentNode, FieldNode, FragmentDefinitionNode, InlineFragmentNode, ObjectValueNode, OperationDefinitionNode, SelectionNode, SelectionSetNode, ValueNode } from "graphql";
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
  valueLabelRootKey?: string;
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
  validationRule?: string;
  validationValue?: string;
  validationRelationType?: string;
  validationAmount?: number;
  validationExact?: boolean;
  cardKey?: string;
  cardField?: string;
  cardEditable?: boolean;
  relationKey?: string;
  readsHost?: boolean;
  relationDirection?: string;
  parentEntityType?: string;
  parentKey?: string;
  parentRelations?: { relationType?: string; entityType?: string; key?: string }[];
  detailLabelKey?: string;
  sortPrimary?: boolean;
  listingFormatter?: boolean;
  repeatableMetadataKey?: string;
  parentRelationType?: string;
  containsRelationPropertyKey?: string;
  containsRelationPropertyValue?: string;
  clientField?: string;
  readOnly: boolean;
  labelRole: boolean;
  /** isMultilingual: one value per language, edited with the language-aware editor */
  multilingual?: boolean;
  technicalOrigin?: string;
  readOnlyUnless?: string[];
  showOnlyInEditMode?: boolean;
  listingValueLabelKey?: string;
  listingValueLabelRootKey?: string;
  detailFormatter?: boolean;
  detailContainsRelation?: boolean;
  cardLineClamp?: string;
  panelLineClamp?: string;
  panelAlias?: string;
  highlightIfPrimaryThumbnail?: boolean;
  validationMessage?: string;
  virtualKeyboardLayouts?: string[];
  valueTranslationKey?: string;
  permitted?: string[];
  linkText?: string;
  copyToClipboard?: boolean;
  nonEditable?: boolean;
  tooltipKey?: string;
  panelShowsUnit?: boolean;
  panelWidget?: boolean;
  cardAlias?: string;
  cardValidates?: boolean;
  sortPages?: { routeName: string; entityType?: string }[];
};

type PanelFieldOverride = { key: string; labelKey?: string; alias?: string; widget?: boolean };
type Panel = { header?: boolean; alias: string; label?: string; kind?: string; collapsed: boolean; editable: boolean; editableDefault?: boolean; repetitionKey?: string; displayConditionKey?: string; bulkDataSource?: string; overrides: PanelFieldOverride[]; multipleColumns?: boolean; can?: string; fields: string[]; spreads: string[]; elements: Element[] };
type WindowStatus = { labelKey?: string; statusKey: string; statusInputField: string };
type Element =
  | { kind: "window"; alias?: string; label?: string; expandButton?: boolean; windowLayout?: string; editButton?: boolean; hideInHistory?: boolean; windowStatus?: WindowStatus; contextMenu?: Entity["contextMenu"]; panelSpreads: string[]; panels: Panel[] }
  | { kind: "shaclShape"; label?: string; fieldsKey?: string; collapsed: boolean }
  | { kind: "markdown"; label?: string; metadataKey?: string; collapsed: boolean }
  | { kind: "singleMedia"; label?: string; collapsed: boolean }
  | { kind: "entityViewer"; label?: string; relationType?: string; metadataKey?: string }
  | { kind: "map"; label?: string; collapsed: boolean; mapType?: string; center?: string; wktKey?: string; config: { key: string; value: ValueNode | undefined }[] }
  | { kind: "comments"; alias?: string; label?: string; parentFilterKey?: string; readOnly?: boolean; createFields: { key: string; labelKey?: string; inputType?: string }[]; composer?: { label?: string; metadataKey: string; extensions: string[]; editorStyles?: string; multilingual?: boolean; taggables: { tag?: string; entityType: string; relationType: string; filterKey?: string; triggerCharacter?: string; triggerMinCharacters?: number; flowQuery?: string; flowButtonLabel?: string }[] } }
  | {
      kind: "list";
      /** inside a panel: the position among the panel's items (fields and elements), from 1 */
      order?: number;
      alias?: string;
      addEntitiesToForms?: boolean;
      cropCoordinatesKey?: string;
      actionsOnResult?: { kind?: string; operations: Operation[] };
      label?: string;
      mediaKind?: string;
      customQueryRelationType?: string;
      listViewMode?: string;
      can?: string[];
      hideInHistory?: boolean;
      disableLibraryBar?: boolean;
      enableNavigation?: boolean;
      libraryMode?: string;
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
type Column = { alias?: string; size?: string; elements: Element[]; elementSpreads: string[] };
type PreviewLayout = { queryName: string; columns: Column[] };
type DeleteOptions = {
  deleteEntityLabel?: string;
  deleteRelationsQuery?: string;
  deleteRelationsFilters?: string;
  deleteRelationsTypes: string[];
  deleteRelationsLabel?: string;
  blockingRelationsQuery?: string;
  blockingRelationsFilters?: string;
  blockingRelationsTypes: string[];
  blockingRelationsLabel?: string;
};

type Lookup = { from: string; localField: string; foreignField: string; as: string; resolveToSourceIds?: boolean };
type ValueMapping = { values: string[]; mapping: string };
type Facet = { kind?: string; value?: string; key?: string; lookups: Lookup[]; facets: Facet[] };
type Filter = {
  order?: number;
  alias?: string;
  kind: string;
  key?: string;
  keys?: string[];
  keyAsList: boolean;
  parentKey?: string;
  aggregation?: string;
  label?: string;
  displayed: boolean;
  tooltip: boolean;
  defaults: string[];
  defaultAsList: boolean;
  hidden: boolean;
  keepDefaultValue?: boolean;
  options?: {
    type?: string;
    key?: string;
    keys?: string[];
    itemTypes?: string[];
    labelKey?: string;
    matchExact?: boolean;
    distinctBy?: string;
    operator?: string;
    typeOperator?: string;
    typeBare?: boolean;
    /** the inputs beyond the search and the type, in order */
    inputs?: { kind?: string; key: string; value: string | string[]; matchExact?: boolean; distinctBy?: string; resolveDefaultValueToOptionIds?: boolean; operator?: string; bareValues?: boolean; valueMappings?: ValueMapping[] }[];
  };
  itemTypes?: string[];
  defaultMatcher?: string;
  allowedMatchers?: string[];
  valueMappings?: ValueMapping[];
  facets?: Facet[];
  defaultBare?: boolean;
  staticOptions?: { label: string; value: string }[];
  selectionSpread?: string;
  optionsLabel?: string;
  optionsValue?: string;
  selectionOption?: string;
  operator?: string;
  showTime?: boolean;
  matchersType?: string;
  lookup?: Lookup;
};

type FormField = { key: string; alias?: string; label?: string; editor?: string; datatype?: string; single: boolean; required: boolean; validationRule?: string; validationValue?: string; validationRelationType?: string; validationAmount?: number; validationExact?: boolean; hidden?: boolean; clientField?: string; validationMessage?: string; tooltipKey?: string; defaultValue?: string; noWidget?: boolean; virtualKeyboardLayouts?: string[]; pickerSearch?: { mode: string; keys: string[]; acceptedTypes: string[] } };
type Form = { queryName: string; label?: string; tabAlias?: string; fields: FormField[]; fieldsSpreads: string[]; copyFromParent?: { autoCopy?: boolean; keyMap: { key: string; fromKey: string }[] }; submit?: { alias?: string; label?: string; icon?: string; actionQuery?: string; creationType?: string; showsFormErrors: boolean; submitAction?: string } };

type Operation = {
  order?: number;
  label?: string;
  icon?: string;
  kind?: string;
  primary?: boolean;
  can: string[];
  context?: { mode?: string; selection?: string; tooltip?: string; requiresSameType?: boolean; minSelectedItems?: number; maxSelectedItems?: number; matches?: { key: string; value: string }[] };
  modal?: {
    kind?: string;
    form?: string;
    /** several forms offered (formQueries with more than one name) */
    forms?: string[];
    relationType?: string;
    closeConfirmation?: boolean;
    permission?: string;
    pickerNode?: string;
    navigateAfterCreation?: string;
    skipRelatedItems?: string[];
    imageCrop?: boolean;
    cropCoordinatesKey?: string;
    replaceExistingRelations?: boolean;
    selectionLimit?: number;
    survivorSuggestion?: { strategy?: string; autoSelect?: boolean; requireRecommendedSurvivor?: boolean; hiddenVerdicts: string[] };
  };
  subOptions?: Operation[];
};

type FlowStep = {
  key: string;
  label?: string;
  entityType?: string;
  createForm?: string;
  /** the picker node declared for the step (its list and filters documents), when these files hold the list */
  pickerNode?: string;
  acceptedTypes: string[];
  maxSelection?: number;
  overviewFields: { key: string; label?: string }[];
  showBackButton?: boolean;
  skipSearchIfPriorIsNew?: boolean;
  pickerFiltersCollapsed?: boolean;
  metadataOnly?: boolean;
  terminalActionLabel?: string;
  scope?: { step: string; relationType: string; filterKey?: string };
  relations?: { to: string; relationType: string; createWhen?: string; metadataFields?: { formMetadataKey: string; relationMetadataKey: string; asArray?: boolean }[] }[];
  creatableTypes?: { label?: string; entityType: string; createForm: string }[];
};
type Flow = { queryName: string; label?: string; repeatable?: boolean; refetchOnFinish?: boolean; linear?: boolean; startOnFirstStep?: boolean; returnsSelection?: boolean; routeToStep?: string; routeToRoute?: string; steps: FlowStep[]; finalize?: { fromStep: string; relationType: string } };
/** an id-addressed document a modal loads by name (ProcessorConfigForm(id: $id)) */
type FormSource = { queryName: string; field: string; withParent: boolean };

type FieldsFragment = { name: string; fields: FormField[] };
type ElementsFragment = { name: string; elements: Element[] };
type ValuesFragment = { name: string; cardName?: string; fields: string[]; aliases: string[]; valuesFields: string[]; cardShows?: string[]; contextMenu?: Entity["contextMenu"] };

type ListQuery = { node?: string; name: string; filtersOnly?: boolean; filtersName?: string; filtersType?: string; relationValues?: boolean; readsHost?: boolean; hostOptional?: boolean; results: { type: string; fragments: string[]; listingNode?: string; cardMenuSpread?: string }[]; filters: Filter[] };
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
  readsPermissions?: boolean;
  /** id at the top of the listing fragment / among the listing's initial values */
  idField?: boolean;
  idValue?: boolean;
  /** allowedViewModes read in the detail fragment too */
  viewModesOnDetail?: boolean;
  /** the properties (keys) shown in the map view's popup (mapElement { mapFeatureMetadata }) */
  mapFeatureFields?: string[];
  /** the operations the lists offer on their result: their forms are opened too */
  resultOperations?: Operation[];
  /** the listing is split: minimal<X> spreads minimal<X>Core */
  listingCore?: boolean;
  deleteOptions?: DeleteOptions;
  detailFormatters?: boolean;
  excludeBaseSortOptions?: boolean;
  filtersFragmentName?: string;
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
  /** list queries the type's documents name without a list element (the delete flow's) */
  entityListQueries: string[];
  /** the guided flows (GetRepetitiveForm) and form sources in the file holding the listing fragment */
  flows: Flow[];
  formSources: FormSource[];
  /** a GraphQL interface the subtypes share: filters, sort options and bulk operations without a listing */
  interface?: boolean;
  /** a listing rendered inline in a list query's results (elody:emit "inline"), not a file */
  inline?: boolean;
  /** the fragments the file holds for the subtypes to spread */
  fieldsFragments: FieldsFragment[];
  elementsFragments: ElementsFragment[];
  valuesFragments: ValuesFragment[];
  panelFragments: { name: string; fields: string[] }[];
  filtersFragments: { name: string; filters: Filter[] }[];
  /** a file of shared fragments alone, and where it is written */
  fragmentsOnly?: boolean;
  filePath?: string;
  /** elody:cardName: the listing fragment's own name (another card of the type) */
  cardName?: string;
  /** elody:sortDocument: sort options documents of the type's own */
  sortDocuments: { queryName: string; options: { labelKey: string; value: string; primary?: boolean; icon?: string }[] }[];
  /** elody:preview: the previewFor<X> fragment and the layouts it names */
  preview?: { fragmentName?: string; kind?: string; coverage?: string; labelKey?: string; openByDefault?: boolean; showCurrentPreviewFlow?: boolean; keepLastActiveItemHighlighted?: boolean; displayOpenDetailPageButton?: boolean; layout?: PreviewLayout; metadataLayout?: PreviewLayout };
  operations?: Operation[];
  customOperations: { name: string; operations: Operation[] }[];
  listQueries: ListQuery[];
  contextMenu?: { forceShow: boolean; basic: boolean; inButtons?: boolean; spreads?: string[]; actions: { alias: string; form?: string; kind?: string; label?: string; icon?: string; formQuery?: string; formFlow?: string; formTitle?: string; can?: string[]; showAsButton?: boolean; endpointUrl?: string; endpointMethod?: string }[] };
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
  private readonly pickerNodes = new Map<string, string>();
  private readonly declaredCustomOps = new Set<string>();
  /** the listings synthesised for results selected inline, extracted after the file's types */
  readonly inlineNames: string[] = [];
  private readonly inlineSet = new Set<string>();
  /** the other cards of a type (fragment name by type name): fragments with a card the client names itself */
  private readonly cardVariants = new Map<string, string>();
  /** the preview layouts a previewFor<X> fragment names: not orphans */
  private readonly previewLayoutNames = new Set<string>();
  private readonly claimedPreviews = new Set<string>();

  /**
   * The results of a list document: per type its fragment spreads and, for fields selected inline,
   * a listing of that document alone (minimal<Type>In<Query>, emitted inline).
   */
  /** Whether a list document declares the host's uuid ($userUuid). */
  private queryReadsHost(query: OperationDefinitionNode | undefined): boolean {
    return (query?.variableDefinitions ?? []).some((v) => v.variable.name.value === "userUuid");
  }

  /** Whether the list document declares the host's uuid as a nullable variable ($userUuid: String). */
  private queryHostOptional(query: OperationDefinitionNode | undefined): boolean {
    const variable = (query?.variableDefinitions ?? []).find((v) => v.variable.name.value === "userUuid");
    return variable !== undefined && variable.type.kind !== Kind.NON_NULL_TYPE;
  }

  /** Whether a list document reads relationValues on every result (outside the per-type selections). */
  private resultsRelationValues(query: OperationDefinitionNode | undefined): boolean {
    const entities = query ? fields(query.selectionSet).find((f) => f.name.value === "Entities") : undefined;
    return fields(child(entities, "results")?.selectionSet).some((f) => f.name.value === "relationValues");
  }

  private resultsOf(query: OperationDefinitionNode | undefined, queryName: string, file: string): ListQuery["results"] {
    if (!query) return [];
    const entities = fields(query.selectionSet).find((f) => f.name.value === "Entities");
    const inline = (child(entities, "results")?.selectionSet?.selections ?? []).filter((s): s is InlineFragmentNode => s.kind === Kind.INLINE_FRAGMENT);
    return inline.map((on) => {
      const type = on.typeCondition?.name.value ?? "";
      let own = on.selectionSet.selections.filter((x) => x.kind !== Kind.FRAGMENT_SPREAD && !(x.kind === Kind.FIELD && x.name.value === "__typename"));
      const result: ListQuery["results"][number] = { type, fragments: spreads(on.selectionSet) };
      // a menu fragment on the card next to the listing fragment: teaserMetadata { buttons { contextMenu { ...X } } }
      const teaser = own.length === 1 && own[0].kind === Kind.FIELD && own[0].name.value === "teaserMetadata" ? own[0] : undefined;
      const menu = teaser ? child(child(teaser, "buttons"), "contextMenu") : undefined;
      if (teaser && menu && fields(teaser.selectionSet).length === 1 && fields(child(teaser, "buttons")?.selectionSet).length === 1 && spreads(menu.selectionSet).length === 1 && fields(menu.selectionSet).length === 0) {
        result.cardMenuSpread = spreads(menu.selectionSet)[0];
        own = [];
      }
      if (own.length) {
        let name = `${type}In${queryName}`;
        for (let n = 2; this.definitions.has(`minimal${name}`); n++) name = `${type}In${queryName}${n}`;
        const node: FragmentDefinitionNode = { kind: Kind.FRAGMENT_DEFINITION, name: { kind: Kind.NAME, value: `minimal${name}` }, typeCondition: on.typeCondition!, directives: [], selectionSet: { kind: Kind.SELECTION_SET, selections: own } };
        this.definitions.set(`minimal${name}`, { name: `minimal${name}`, kind: "fragment", file, node, normalized: "" });
        this.inlineNames.push(name);
        this.inlineSet.add(name);
        result.listingNode = `${name}Ui`;
      }
      return result;
    });
  }
  /** the form sources found in any file: an action naming one references it as a source, not a form */
  private readonly formSourceNames = new Set<string>();
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
    this.registerCardVariants();
    return [...this.definitions.values()]
      .filter((d) => d.kind === "fragment" && d.name.startsWith("minimal") && d.name !== "minimalBaseEntity" && !d.name.startsWith("minimalLinked"))
      .map((d) => d.name.slice("minimal".length))
      .filter((name) => (this.fragment(`minimal${name}`)?.typeCondition.name.value ?? "").length > 0)
      // a listing core (minimal<X>Core) belongs to the type that spreads it, not a type of its own
      .filter((name) => !(name.endsWith("Core") && this.fragment(`minimal${name.slice(0, -"Core".length)}`)))
      .concat(this.interfaceTypes());
  }

  /** The columns of a layout: the detail's entityView, or a preview's PreviewElement. */
  private columnsOf(view: FieldNode | undefined, where: string, entity: Entity, byAlias: Map<string, Property>): Column[] {
    const columns: Column[] = [];
    for (const [columnIndex, column] of fields(view?.selectionSet).filter((f) => f.name.value === "column").entries()) {
      const size = this.instance("ColumnSize", scalar(child(column, "size") ? argument(child(column, "size")!, "size") : undefined), `${where} column`);
      // a column alias of its own (tipsColumn); column, column2, ... are what the generator names them
      const positional = columnIndex === 0 ? "column" : `column${columnIndex + 1}`;
      const given = column.alias?.value ?? "column";
      const columnAlias = given !== positional ? given : undefined;
      const elements = this.elementsOf(child(column, "elements")?.selectionSet, where, entity, byAlias);
      const elementSpreads = spreads(child(column, "elements")?.selectionSet);
      if (elements.length || elementSpreads.length) columns.push({ alias: columnAlias, size, elements, elementSpreads });
      else this.note(`${where}: a column holds nothing the generator renders; left out`);
    }
    return columns;
  }

  /** A fragment on a type that shows a card under a name of its own (mediafileAsPreview): read as a listing of the type, declared with elody:cardName. */
  private registerCardVariants(): void {
    const shared = ["IntialValues", "teaserMetadata", "WindowElementPanel", "AdvancedFilters", "FormFields", "EntityViewElements", "Entity"];
    for (const d of [...this.definitions.values()]) {
      if (d.kind !== "fragment" || /^(minimal|full|filtersFor|preview)/.test(d.name) || /(Filters|SortOptions|BulkOperations|Fields|Element|IntialValues|TeaserMetadata)$/.test(d.name)) continue;
      const fragment = d.node as FragmentDefinitionNode;
      if (shared.includes(fragment.typeCondition.name.value)) continue;
      if (!child(fragment, "teaserMetadata") || child(fragment, "entityView")) continue;
      const name = d.name.charAt(0).toUpperCase() + d.name.slice(1);
      if (this.definitions.has(`minimal${name}`)) continue;
      this.definitions.set(`minimal${name}`, { ...d, name: `minimal${name}`, node: { ...fragment, name: { kind: Kind.NAME, value: `minimal${name}` } } });
      this.cardVariants.set(name, d.name);
    }
  }

  /** The GraphQL interfaces the subtypes share: filters, sort options or bulk operations named after a type without a listing fragment. */
  private interfaceTypes(): string[] {
    const names = new Set<string>();
    for (const d of this.definitions.values()) {
      if (d.kind !== "fragment") continue;
      const m = /^filtersFor(\w+)$/.exec(d.name) ?? /^(\w+)(BulkOperations|SortOptions)$/.exec(d.name);
      if (!m) continue;
      const name = m[1].charAt(0).toUpperCase() + m[1].slice(1);
      const on = (d.node as FragmentDefinitionNode).typeCondition.name.value;
      if (on === name && !this.fragment(`minimal${name}`)) names.add(name);
    }
    return [...names];
  }

  /** The fragment a type's file is known by: its listing, or for an interface its filters, bulk operations or sort options. */
  private anchorOf(name: string): FragmentDefinitionNode | undefined {
    const low = name.charAt(0).toLowerCase() + name.slice(1);
    return this.fragment(`minimal${name}`) ?? this.fragment(`filtersFor${name}`) ?? this.fragment(`${low}BulkOperations`) ?? this.fragment(`${low}SortOptions`);
  }

  entity(name: string): Entity {
    const minimal = this.fragment(`minimal${name}`);
    const full = this.fragment(`full${name}`);
    const anchor = this.anchorOf(name)!;
    const graphqlType = anchor.typeCondition.name.value;
    // a split listing: minimal<X> spreads minimal<X>Core, which holds the values and the card
    const coreName = `minimal${name}Core`;
    const core = minimal && spreads(minimal.selectionSet).includes(coreName) ? this.fragment(coreName) : undefined;
    const listing = core ?? minimal;
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
      flows: [],
      formSources: [],
      entityListQueries: [],
      fieldsFragments: [],
      elementsFragments: [],
      valuesFragments: [],
      panelFragments: [],
      filtersFragments: [],
      sortDocuments: [],
    };
    const where = name;
    if (!minimal) entity.interface = true;
    if (this.inlineSet.has(name)) entity.inline = true;
    if (this.cardVariants.has(name)) entity.cardName = this.cardVariants.get(name);

    // initial values: the detail fragment's order, the listing's values first when the detail lacks them
    const minimalValues = child(listing, "intialValues");
    if (core) entity.listingCore = true;
    const fullValues = full ? child(full, "intialValues") : undefined;
    const byAlias = new Map<string, Property>();
    const add = (field: FieldNode, listing: boolean) => {
      const a = alias(field);
      const key = str(field, "key") ?? a;
      const source = str(field, "source");
      let property = byAlias.get(a);
      // the listing reads another value under the detail page's alias (title: the label here, a relation there): two shapes
      if (property && listing && property.inDetail && !property.inListing && (property.key !== (source === "relations" ? a : key) || property.relationType !== (source === "relations" ? key : undefined)))
        property = undefined;
      if (!property) {
        property = {
          key: source === "relations" ? a : key,
          alias: undefined,
          source: source && source !== "metadata" && source !== "relations" ? source : undefined,
          relationType: source === "relations" ? key : undefined,
          valueLabelKey: source === "relations" && !str(field, "rootKeyAsLabel") ? (str(field, "metadataKeyAsLabel") ?? "") : undefined,
          valueLabelRootKey: str(field, "rootKeyAsLabel"),
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
        if (!byAlias.has(a)) byAlias.set(a, property);
        entity.properties.push(property);
      }
      const formatter = str(field, "formatter");
      if (formatter) property.formatter = formatter;
      const origin = str(field, "technicalOrigin");
      if (origin) property.technicalOrigin = origin;
      if (listing && property.inDetail) {
        // the listing reads the value the detail page created: what it reads otherwise is said per page
        const listingLabelKey = source === "relations" && !str(field, "rootKeyAsLabel") ? (str(field, "metadataKeyAsLabel") ?? "") : undefined;
        const listingRootKey = str(field, "rootKeyAsLabel");
        if (source === "relations" && listingRootKey !== property.valueLabelRootKey) property.listingValueLabelRootKey = listingRootKey ?? "";
        if (source === "relations" && listingLabelKey !== property.valueLabelKey && (listingLabelKey !== undefined || property.valueLabelKey !== undefined) && !(listingRootKey && property.valueLabelKey === undefined))
          property.listingValueLabelKey = listingLabelKey ?? "";
        const contains = str(field, "containsRelationPropertyKey");
        if (contains && !property.containsRelationPropertyKey) {
          property.containsRelationPropertyKey = contains;
          property.containsRelationPropertyValue = str(field, "containsRelationPropertyValue");
          property.detailContainsRelation = false;
        }
      }
      // what the value is read with beyond its key
      const repeatable = str(field, "repeatableMetadataKey");
      if (repeatable !== undefined) property.repeatableMetadataKey = repeatable;
      const parents = list(argument(field, "parentRelations")).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
      const parent = parents[0];
      if (parent) {
        property.parentRelationType = scalar(objectField(parent, "relationType"));
        property.parentEntityType = scalar(objectField(parent, "entityType"));
        property.parentKey = scalar(list(objectField(parent, "key"))[0]);
      }
      // several steps to the parent: one node per step
      if (parents.length > 1)
        property.parentRelations = parents.map((step) => ({ relationType: scalar(objectField(step, "relationType")), entityType: scalar(objectField(step, "entityType")), key: scalar(list(objectField(step, "key"))[0]) }));
      // a value on a relation of the host entity: relationKey, uuid: $userUuid, relationDirection
      const relationKey = str(field, "relationKey");
      if (relationKey !== undefined) property.relationKey = relationKey;
      const uuid = argument(field, "uuid");
      if (uuid) {
        if (uuid.kind === Kind.VARIABLE && uuid.name.value === "userUuid") property.readsHost = true;
        else this.note(`${where}: value ${a} reads uuid from something other than $userUuid; left out`);
      }
      const direction = str(field, "relationDirection");
      if (direction !== undefined) property.relationDirection = direction;
      const containsKey = str(field, "containsRelationPropertyKey");
      if (containsKey !== undefined) {
        property.containsRelationPropertyKey = containsKey;
        property.containsRelationPropertyValue = str(field, "containsRelationPropertyValue");
      }
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
    // the permissions read with the detail values (canUpdate, canDelete)
    for (const field of fields(fullValues?.selectionSet))
      if (field.name.value !== "keyValue") {
        if (["canUpdate", "canDelete"].includes(field.name.value)) entity.readsPermissions = true;
        else this.note(`${where}: detail value ${alias(field)} is not a keyValue; left out`);
      }
    // a formatter in the listing only: the detail page reads the raw value
    for (const a of listingFormatted) {
      const property = byAlias.get(a);
      if (property?.inDetail && !detailFormatted.has(a)) property.detailFormatter = false;
    }
    // the reverse: a formatter on the detail page only
    for (const a of detailFormatted) {
      const property = byAlias.get(a);
      if (property?.inListing && !listingFormatted.has(a)) property.listingFormatter = false;
    }
    for (const field of fields(minimalValues?.selectionSet))
      if (field.name.value === "id" && !field.alias) entity.idValue = true;
      else if (field.name.value !== "keyValue") this.note(`${where}: initial value ${alias(field)} is not a keyValue; left out`);
    // (a value read in the listing only is said with elody:listingOnly; a value read on the detail page only with elody:detailOnly)
    entity.spreads.listingValues = spreads(minimalValues?.selectionSet).filter((s) => s !== "typePillsIntialValues");
    entity.spreads.detailValues = spreads(fullValues?.selectionSet);
    entity.typePills = spreads(minimalValues?.selectionSet).includes("typePillsIntialValues");

    // the card
    const teaser = child(listing, "teaserMetadata");
    const cardIndex = new Map<Property, number>();
    for (const field of fields(teaser?.selectionSet)) {
      if (["metaData", "relationRootData", "relationMetaData"].includes(field.name.value)) {
        const key = input(child(field, "key")) ?? alias(field);
        // the value read under the card field's alias, when there is one (title: metaData { key(input: "key") } shows the title alias of key)
        const candidates = entity.properties.filter((p) => p.key === key || (p.alias ?? p.key) === key);
        let property =
          candidates.find((p) => p.inListing && (p.alias ?? p.key) === alias(field)) ?? candidates.find((p) => (p.alias ?? p.key) === alias(field)) ?? byAlias.get(key) ?? byAlias.get(alias(field));
        if (!property && entity.inline) {
          // an inline listing shows a card over values a spread fragment reads: the field is shown, its value not read here
          property = { key, alias: alias(field) !== key ? alias(field) : undefined, inListing: true, inDetail: false, readsValue: false, teaser: true, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
          entity.properties.push(property);
          byAlias.set(alias(field), property);
        }
        if (!property) {
          this.note(`${where}: card field ${alias(field)} reads no initial value; left out`);
          continue;
        }
        // the card reads under a key of its own (typePill, a raw key under a title alias)
        if (key !== (property.alias ?? property.key)) property.cardKey = key;
        property.teaser = true;
        // found by its key but shown under another alias: the card's own alias
        if (key === property.key && alias(field) !== (property.alias ?? property.key) && alias(field) !== key) property.cardAlias = alias(field);
        if (!cardIndex.has(property)) cardIndex.set(property, cardIndex.size);
        property.labelKey = input(child(field, "label"));
        const clamp = input(child(field, "lineClamp"));
        if (clamp) property.cardLineClamp = clamp;
        const translation = input(child(field, "valueTranslationKey"));
        if (translation) property.valueTranslationKey = translation;
        if (child(field, "highlightIfPrimaryThumbnail")) property.highlightIfPrimaryThumbnail = input(child(field, "highlightIfPrimaryThumbnail")) === "true";
        this.applyCardField(property, field, key, where);
      } else if (field.name.value === "thumbnail") {
        const filename = child(field, "filename");
        const before = fields(teaser?.selectionSet).slice(0, fields(teaser?.selectionSet).indexOf(field)).filter((f) => f.name.value === "metaData").length;
        entity.thumbnail = { ...(filename && scalar(argument(filename, "fromMediafile")) === "true" ? { fromMediafile: true } : { key: input(child(field, "key")) ?? "thumbnail" }), order: before };
      } else if (field.name.value === "contextMenuActions") entity.contextMenu = { ...this.contextMenu(field, where)!, forceShow: entity.contextMenu?.forceShow ?? false };
      else if (field.name.value === "buttons" && child(field, "contextMenu"))
        // the newer form of the card's menu: buttons { contextMenu { ... } }
        entity.contextMenu = { ...this.contextMenu(child(field, "contextMenu")!, where)!, inButtons: true, forceShow: entity.contextMenu?.forceShow ?? false };
      else if (field.name.value === "forceShowContextMenuActions") {
        entity.contextMenu ??= { forceShow: false, basic: false, actions: [] };
        entity.contextMenu.forceShow = true;
      } else this.note(`${where}: card field ${alias(field)} (${field.name.value}) is not a metaData field; left out`);
    }
    entity.spreads.card = spreads(teaser?.selectionSet).filter((s) => s !== "typePillsTeaserMetadata");
    for (const property of entity.properties) if (!property.inListing) property.teaser = false;
    // the card's fields come first, in the card's order (the initial values are read by name, the card is shown in order)
    entity.properties.sort((a, b) => {
      const ia = cardIndex.get(a) ?? -1;
      const ib = cardIndex.get(b) ?? -1;
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    for (const field of [...fields(listing?.selectionSet), ...(core ? fields(minimal?.selectionSet) : [])]) {
      if (["intialValues", "relationValues", "allowedViewModes", "teaserMetadata"].includes(field.name.value)) continue;
      if (alias(field) === "dynamicFormConfig") entity.dynamicFormConfig = field.name.value;
      else if (alias(field) === "ports") entity.ports = field.name.value;
      else if (field.name.value === "id" && !field.alias) entity.idField = true;
      else if (field.name.value === "mapElement") this.mapFeatures(field, where, entity);
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
    entity.columns.push(...this.columnsOf(view, where, entity, byAlias));
    // the preview: the previewFor<X> fragment and the layouts it names
    // its fragment is previewFor<X>, else a previewFor* fragment on the GraphQL type no other type claimed
    const previewFragment =
      this.fragment(`previewFor${name}`) ??
      [...this.definitions.values()].find((d) => d.kind === "fragment" && /^previewFor/.test(d.name) && (d.node as FragmentDefinitionNode).typeCondition.name.value === graphqlType && !this.claimedPreviews.has(d.name))?.node as FragmentDefinitionNode | undefined;
    const component = previewFragment ? child(previewFragment, "previewComponent") : undefined;
    if (component && previewFragment) {
      this.claimedPreviews.add(previewFragment.name.value);
      const previewWhere = `${where} previewFor${name}`;
      const configuration = child(component, "previewConfiguration");
      const flag = (field: FieldNode | undefined, name: string) => (child(field, name) ? input(child(field, name)) !== "false" : undefined);
      for (const f of fields(component.selectionSet))
        if (!["type", "listItemsCoverage", "title", "previewQuery", "openByDefault", "metadataPreviewQuery", "showCurrentPreviewFlow", "previewConfiguration"].includes(f.name.value)) this.note(`${previewWhere}: field ${f.name.value} has no term; left out`);
      for (const f of fields(configuration?.selectionSet))
        if (!["keepLastActiveItemHighlighted", "displayOpenDetailPageButton"].includes(f.name.value)) this.note(`${previewWhere}: configuration field ${f.name.value} has no term; left out`);
      const layout = (queryName: string | undefined): PreviewLayout | undefined => {
        if (!queryName) return undefined;
        const query = this.operation(queryName);
        if (!query) {
          this.note(`${previewWhere}: layout ${queryName} is not in these files; the name stays`);
          return { queryName, columns: [] };
        }
        this.previewLayoutNames.add(queryName);
        return { queryName, columns: this.columnsOf(child(query, "PreviewElement"), `${where} ${queryName}`, entity, byAlias) };
      };
      entity.preview = {
        fragmentName: previewFragment.name.value !== `previewFor${name}` ? previewFragment.name.value : undefined,
        kind: this.instance("PreviewKind", input(child(component, "type")), previewWhere),
        coverage: this.instance("ListItemCoverage", input(child(component, "listItemsCoverage")), previewWhere),
        labelKey: input(child(component, "title")),
        openByDefault: flag(component, "openByDefault"),
        showCurrentPreviewFlow: flag(component, "showCurrentPreviewFlow"),
        keepLastActiveItemHighlighted: flag(configuration, "keepLastActiveItemHighlighted"),
        displayOpenDetailPageButton: flag(configuration, "displayOpenDetailPageButton"),
        layout: layout(input(child(component, "previewQuery"))),
        metadataLayout: layout(input(child(component, "metadataPreviewQuery"))),
      };
    }
    if (full)
      for (const field of fields(full.selectionSet)) {
        if (["intialValues", "relationValues", "entityView"].includes(field.name.value)) continue;
        if (field.name.value === "allowedViewModes") {
          entity.viewModesOnDetail = true;
          continue;
        }
        if (field.name.value === "shapeFields") entity.shapeDriven = true;
        else if (field.name.value === "deleteQueryOptions") entity.deleteOptions = this.deleteOptions(field, where, entity);
        else entity.fragmentFields.push(alias(field));
      }

    // relationValues: the generator derives them for the detail page (a relation, a list, a context menu), never for the
    // listing; say it when the client has them elsewhere
    const listingHas = [...fields(listing?.selectionSet), ...fields(minimal?.selectionSet)].some((f) => f.name.value === "relationValues");
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
      if (scalar(objectField(entry, "primary")) === "true") property.sortPrimary = true;
      if (label && label !== property.labelKey) property.sortLabelKey = label;
      const pages = list(objectField(entry, "availableInPages")).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
      if (pages.length) property.sortPages = pages.map((page) => ({ routeName: scalar(objectField(page, "routeName")) ?? "", entityType: scalar(objectField(page, "entityType")) }));
      sortedAliases.push(value);
      position += 1;
    }
    if (options && scalar(argument(options, "excludeBaseSortOptions")) === "true") entity.excludeBaseSortOptions = true;
    for (const entry of list(options ? argument(options, "input") : undefined))
      if (entry.kind === Kind.OBJECT)
        for (const extra of entry.fields.map((f) => f.name.value).filter((n) => !["icon", "label", "value", "primary", "availableInPages"].includes(n)))
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
    if (filters && filters.name.value !== `filtersFor${name}`) entity.filtersFragmentName = filters.name.value;
    if (filters) {
      const block = child(filters, "advancedFilters");
      entity.filters = this.filters(block, where);
      entity.spreads.filters = spreads(block?.selectionSet);
    }
    const form = this.operation(`Get${name}CreateForm`);
    if (form) entity.form = this.formWithFields(this.form(form, `Get${name}CreateForm`, where), where);
    const bulk = this.fragment(`${name.charAt(0).toLowerCase() + name.slice(1)}BulkOperations`);
    if (bulk) entity.operations = this.operations(child(child(bulk, "bulkOperationOptions"), "options"), where, entity);
    // the forms the operations open: declared when these files hold them as dynamic forms
    const opened = Extractor.flattenOperations([...(entity.operations ?? []), ...entity.customOperations.flatMap((c) => c.operations), ...(entity.resultOperations ?? [])])
      .flatMap((op) => op.modal?.forms ?? (op.modal?.form ? [op.modal.form] : []))
      .filter((form) => form !== entity.form?.queryName);
    for (const formName of new Set(opened)) {
      const query = this.operation(formName);
      if (query && fields(query.selectionSet).some((f) => f.name.value === "GetDynamicForm") && !entity.forms.some((f) => f.queryName === formName)) {
        const opened = this.formWithFields(this.form(query, formName, where), where);
        if (opened) entity.forms.push(opened);
      }
    }
    // the type's other create forms: every Get*CreateForm dynamic form in the file that holds its listing fragment
    // (a listing variant of a type, minimal<X>InHomeScreen, leaves them to the type itself)
    const file = entity.documentName === entity.graphqlType ? this.definitions.get(anchor.name.value)?.file : undefined;
    for (const definition of this.definitions.values()) {
      if (definition.kind !== "query" || definition.file !== file || !/Form$/.test(definition.name)) continue;
      if (definition.name === entity.form?.queryName || entity.forms.some((f) => f.queryName === definition.name)) continue;
      const query = definition.node as OperationDefinitionNode;
      if (!fields(query.selectionSet).some((f) => f.name.value === "GetDynamicForm")) continue;
      const extra = this.formWithFields(this.form(query, definition.name, where), where);
      if (extra) entity.forms.push(extra);
    }
    // the guided flows and the form sources of the same file
    for (const definition of this.definitions.values()) {
      if (definition.kind !== "query" || definition.file !== file) continue;
      const query = definition.node as OperationDefinitionNode;
      const top = fields(query.selectionSet);
      if (top.some((f) => f.name.value === "GetRepetitiveForm")) entity.flows.push(this.flow(query, definition.name, where, entity));
      else if (top.length === 1 && (query.variableDefinitions ?? []).some((v) => v.variable.name.value === "id") && !top[0].selectionSet) {
        const withParent = (query.variableDefinitions ?? []).some((v) => v.variable.name.value === "parentEntityId");
        entity.formSources.push({ queryName: definition.name, field: top[0].name.value, withParent });
        this.formSourceNames.add(definition.name);
      }
    }
    this.sharedFragmentsOf(file, where, entity, byAlias, add);
    for (const [suffix, document] of [["Entities", "entities"], ["Filters", "filters"], ["SortOptions", "sortOptions"], ["BulkOperations", "bulkOperations"]] as const)
      if (this.operation(`Get${name}${suffix}`)) entity.documents.push(document);
    // the signed-in user read as this type
    const user = this.operation("getElodyUser");
    if (user && spreads(child(user, "getElodyUser")?.selectionSet).includes(`minimal${name}`)) entity.documents.push("currentUser");
    return entity;
  }

  private configLiteral(value: ValueNode | undefined): string {
    if (!value) return '""';
    if (value.kind === Kind.LIST) return value.values.map((v) => this.configLiteral(v)).join(" , ");
    if (value.kind === Kind.OBJECT) return `[ elody:config ${value.fields.map((f) => `[ elody:key ${q(f.name.value)} ; elody:value ${this.configLiteral(f.value)} ]`).join(" , ")} ]`;
    if (value.kind === Kind.ENUM) {
      // an enum value: the elody: instance bound to it, else the literal with a note
      const instance = this.o.instanceForAny(value.value);
      if (instance) return `elody:${localName(instance)}`;
      this.note(`config value ${value.value} is an enum no elody: instance is bound to; declared as a string`);
      return q(value.value);
    }
    if (value.kind === Kind.BOOLEAN) return String(value.value);
    if (value.kind === Kind.INT || value.kind === Kind.FLOAT) return value.value;
    return q(scalar(value) ?? "");
  }

  /**
   * validation(input: { value: required }) is sh:minCount 1; another rule (url, customValue with its
   * customValue, ...) is elody:validationRule / elody:validationValue. The value may be a list.
   */
  /** A lookup input object (a filter's join, a facet's). */
  private lookupOf(lookup: ObjectValueNode): Lookup {
    const resolve = scalar(objectField(lookup, "resolve_to_source_ids"));
    return { from: scalar(objectField(lookup, "from")) ?? "", localField: scalar(objectField(lookup, "local_field")) ?? "", foreignField: scalar(objectField(lookup, "foreign_field")) ?? "", as: scalar(objectField(lookup, "as")) ?? "", resolveToSourceIds: resolve === "true" ? true : undefined };
  }

  /** defaultValueMapping: [{ value: [...], mapping: "..." }] */
  private valueMappings(value: ValueNode | undefined): ValueMapping[] | undefined {
    const entries = list(value).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
    if (!entries.length) return undefined;
    return entries.map((m) => ({ values: list(objectField(m, "value")).map((v) => scalar(v) ?? ""), mapping: scalar(objectField(m, "mapping")) ?? "" }));
  }

  /** facets: [{ type, value, key, lookups: [...], facets: [...] }], recursive */
  private facets(value: ValueNode | undefined): Facet[] | undefined {
    const entries = list(value).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
    if (!entries.length) return undefined;
    return entries.map((f) => ({
      kind: this.instance("FilterKind", scalar(objectField(f, "type")), "facet"),
      value: scalar(objectField(f, "value")),
      key: scalar(objectField(f, "key")),
      lookups: list(objectField(f, "lookups")).filter((l): l is ObjectValueNode => l.kind === Kind.OBJECT).map((l) => this.lookupOf(l)),
      facets: this.facets(objectField(f, "facets")) ?? [],
    }));
  }

  private validation(validation: FieldNode | undefined, where: string): { required: boolean; rule?: string; value?: string; relationType?: string; amount?: number; exact?: boolean; message?: string } {
    if (!validation) return { required: false };
    const input = argument(validation, "input");
    const raw = input?.kind === Kind.OBJECT ? objectField(input, "value") : undefined;
    const rules = raw ? (raw.kind === Kind.LIST ? [...raw.values] : [raw]).map((v) => scalar(v) ?? "") : [];
    const custom = input?.kind === Kind.OBJECT ? (scalar(objectField(input, "customValue")) ?? scalar(objectField(input, "regex"))) : undefined;
    const others = rules.filter((rule) => rule !== "required");
    if (!rules.length) this.note(`${where}: validation without a value; left out`);
    if (others.length > 1) this.note(`${where}: validation ${others.join(", ")}: only the first rule is declared`);
    // has_required_relation carries its relation and count in an object of its own
    const relation = input?.kind === Kind.OBJECT ? objectField(input, "has_required_relation") : undefined;
    const amount = relation?.kind === Kind.OBJECT ? scalar(objectField(relation, "amount")) : undefined;
    return {
      required: rules.includes("required"),
      rule: others[0],
      value: custom,
      message: input?.kind === Kind.OBJECT ? scalar(objectField(input, "fastValidationMessage")) : undefined,
      relationType: relation?.kind === Kind.OBJECT ? scalar(objectField(relation, "relationType")) : undefined,
      amount: amount === undefined ? undefined : Number(amount),
      exact: relation?.kind === Kind.OBJECT && scalar(objectField(relation, "exact")) !== undefined ? scalar(objectField(relation, "exact")) === "true" : undefined,
    };
  }

  private contextMenu(field: FieldNode, where: string): Entity["contextMenu"] {
    const menu: NonNullable<Entity["contextMenu"]> = { forceShow: false, basic: spreads(field.selectionSet).includes("basicContextMenuActions"), actions: [] };
    const others = spreads(field.selectionSet).filter((s) => s !== "basicContextMenuActions");
    if (others.length) menu.spreads = others;
    for (const action of fields(field.selectionSet)) {
      // a link action follows the entity's link: label and icon only; a general or custom action names its form
      if (!["doElodyAction", "doLinkAction", "doGeneralAction", "doCustomAction"].includes(action.name.value)) {
        if (action.name.value !== "__typename") this.note(`${where}: context menu action ${action.name.value} has no term; left out`);
        continue;
      }
      menu.actions.push({
        alias: alias(action),
        form: action.name.value === "doElodyAction" ? undefined : action.name.value,
        endpointUrl: input(child(action, "endpointUrl")),
        endpointMethod: input(child(action, "endpointMethod")),
        kind: action.name.value === "doLinkAction" ? undefined : this.instance("ActionKind", input(child(action, "action")), `${where} context menu`),
        label: input(child(action, "label")),
        icon: input(child(action, "icon")),
        formQuery: input(child(action, "formQuery")),
        formFlow: input(child(action, "formFlow")),
        formTitle: input(child(action, "formTitle")),
        can: child(action, "can") ? list(argument(child(action, "can")!, "input")).map((v) => scalar(v) ?? "") : undefined,
        showAsButton: input(child(action, "showAsButton")) === undefined ? undefined : input(child(action, "showAsButton")) === "true",
      });
    }
    return menu;
  }

  /** mapElement { mapFeatureMetadata { ... } } in the listing: the properties shown in the map view's popup. */
  private mapFeatures(element: FieldNode, where: string, entity: Entity): void {
    const keys: string[] = [];
    for (const field of fields(child(element, "mapFeatureMetadata")?.selectionSet)) {
      if (field.name.value !== "metaData") {
        this.note(`${where}: map feature field ${alias(field)} (${field.name.value}) is not a metaData field; left out`);
        continue;
      }
      const key = input(child(field, "key")) ?? alias(field);
      let property = entity.properties.find((p) => p.key === key && !p.alias) ?? entity.properties.find((p) => p.key === key);
      if (!property) {
        property = { key, inListing: false, inDetail: true, readsValue: false, teaser: false, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
        if (alias(field) !== key) property.alias = alias(field);
        entity.properties.push(property);
      }
      const label = input(child(field, "label"));
      if (label && !property.labelKey) property.labelKey = label;
      keys.push(key);
    }
    for (const extra of fields(element.selectionSet).filter((f) => f.name.value !== "mapFeatureMetadata")) this.note(`${where}: listing map element field ${extra.name.value} has no term; left out`);
    if (keys.length) entity.mapFeatureFields = keys;
  }

  /** the properties some panel already showed: a later panel showing them otherwise says so for itself */
  private panelSeen = new Set<Property>();

  /** The elements of a column or of a shared elements fragment. */
  private elementsOf(selectionSet: SelectionSetNode | undefined, where: string, entity: Entity, byAlias: Map<string, Property>): Element[] {
    const elements: Element[] = [];
    for (const element of fields(selectionSet)) {
      if (element.name.value === "windowElement") elements.push(this.window(element, where, entity, byAlias));
      else if (element.name.value === "entityListElement") elements.push(this.list(element, where, entity));
      else if (element.name.value === "shaclShapeElement")
        elements.push({ kind: "shaclShape", label: input(child(element, "label")), fieldsKey: input(child(element, "fieldsKey")), collapsed: input(child(element, "isCollapsed")) === "true" });
      else if (element.name.value === "markdownViewerElement") {
        const content = child(element, "markdownContent");
        elements.push({ kind: "markdown", label: input(child(element, "label")), metadataKey: content ? str(content, "metadataKey") : undefined, collapsed: input(child(element, "isCollapsed")) === "true" });
      } else if (element.name.value === "singleMediaFileElement")
        elements.push({ kind: "singleMedia", label: input(child(element, "label")), collapsed: input(child(element, "isCollapsed")) === "true" });
      else if (element.name.value === "entityViewerElement") {
        const id = child(element, "entityId");
        elements.push({ kind: "entityViewer", label: input(child(element, "label")), relationType: id ? str(id, "relationType") : undefined, metadataKey: id ? str(id, "metadataKey") : undefined });
      }
      else if (element.name.value === "mapElement") {
        const wkt = fields(element.selectionSet).find((f) => f.name.value === "metaData");
        const configField = child(element, "config");
        for (const f of fields(element.selectionSet))
          if (!["label", "isCollapsed", "type", "center", "metaData", "config"].includes(f.name.value)) this.note(`${where}: map element field ${alias(f)} has no term; left out`);
        elements.push({
          kind: "map",
          label: input(child(element, "label")),
          collapsed: input(child(element, "isCollapsed")) === "true",
          mapType: this.instance("MapType", input(child(element, "type")), `${where} map element`),
          center: input(child(element, "center")),
          wktKey: wkt ? input(child(wkt, "key")) : undefined,
          config: list(configField ? argument(configField, "input") : undefined)
            .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
            .map((entry) => ({ key: scalar(objectField(entry, "key")) ?? "", value: objectField(entry, "value") })),
        });
      } else if (element.name.value === "commentsElement") elements.push(this.comments(element, where));
      else this.note(`${where}: detail element ${element.name.value} is not rendered by the generator; left out`);
    }
    return elements;
  }

  /** A comments element: its composer (extensions, taggables, editor styles) and the fields a comment is created with. */
  private comments(element: FieldNode, where: string): Element {
    const w = `${where} comments element ${alias(element)}`;
    for (const f of fields(element.selectionSet)) if (!["label", "parentEntityFilterKey", "readOnly", "createFields", "composer"].includes(f.name.value)) this.note(`${w}: field ${f.name.value} has no term; left out`);
    const createFields = fields(child(element, "createFields")?.selectionSet).map((field) => {
      const widget = child(field, "inputField");
      return { key: input(child(field, "key")) ?? alias(field), labelKey: input(child(field, "label")), inputType: widget ? str(widget, "type") : undefined };
    });
    const composerField = child(element, "composer");
    let composer: Extract<Element, { kind: "comments" }>["composer"];
    if (composerField) {
      for (const f of fields(composerField.selectionSet)) if (!["label", "metadataKey", "extensions", "isMultilingual", "taggingConfiguration", "wysiwygElementConfiguration"].includes(f.name.value)) this.note(`${w}: composer field ${f.name.value} has no term; left out`);
      const extensionsField = child(composerField, "extensions");
      const extensions = list(extensionsField ? argument(extensionsField, "input") : undefined).map((v) => this.instance("WysiwygExtension", scalar(v), `${w} extension`) ?? "");
      const tagging = child(child(composerField, "taggingConfiguration"), "taggableEntityConfiguration");
      const configuration = child(composerField, "wysiwygElementConfiguration");
      for (const f of fields(configuration?.selectionSet)) if (f.name.value !== "customEditorStyles") this.note(`${w}: composer configuration field ${f.name.value} has no term; left out`);
      const taggables = list(tagging ? argument(tagging, "configuration") : undefined)
        .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
        .map((entry) => {
          for (const f of entry.fields) if (!["tag", "taggableEntityType", "relationType", "metadataFilterForTagContent", "inlineTrigger", "guidedFlowQuery", "guidedFlowButtonLabel"].includes(f.name.value)) this.note(`${w}: taggable field ${f.name.value} has no term; left out`);
          const trigger = objectField(entry, "inlineTrigger");
          const min = trigger?.kind === Kind.OBJECT ? scalar(objectField(trigger, "minCharacters")) : undefined;
          return {
            tag: scalar(objectField(entry, "tag")),
            entityType: scalar(objectField(entry, "taggableEntityType")) ?? "",
            relationType: scalar(objectField(entry, "relationType")) ?? "",
            filterKey: scalar(objectField(entry, "metadataFilterForTagContent")),
            triggerCharacter: trigger?.kind === Kind.OBJECT ? scalar(objectField(trigger, "character")) : undefined,
            triggerMinCharacters: min !== undefined ? Number(min) : undefined,
            flowQuery: scalar(objectField(entry, "guidedFlowQuery")),
            flowButtonLabel: scalar(objectField(entry, "guidedFlowButtonLabel")),
          };
        });
      composer = {
        label: input(child(composerField, "label")),
        metadataKey: input(child(composerField, "metadataKey")) ?? "",
        extensions: extensions.filter(Boolean),
        editorStyles: configuration ? input(child(configuration, "customEditorStyles")) : undefined,
        multilingual: input(child(composerField, "isMultilingual")) === "true" ? true : undefined,
        taggables,
      };
    }
    return {
      kind: "comments",
      alias: element.alias?.value,
      label: input(child(element, "label")),
      parentFilterKey: input(child(element, "parentEntityFilterKey")),
      readOnly: child(element, "readOnly") ? true : undefined,
      createFields,
      composer,
    };
  }

  private window(element: FieldNode, where: string, entity: Entity, byAlias: Map<string, Property>): Element {
    const panels: Panel[] = [];
    for (const panel of fields(element.selectionSet)) {
      if (panel.name.value !== "panels") {
        if (!["label", "layout", "expandButtonOptions", "editMetadataButton", "hideInHistory", "windowElementStatus", "contextMenuActions"].includes(panel.name.value)) this.note(`${where}: window element field ${panel.name.value} has no term; left out`);
        continue;
      }
      const header = child(panel, "panelHeaderContent");
      const headerLabel = header ? scalar(objectField(argument(header, "panelHeaderContentInput") as ObjectValueNode, "label")) : input(child(panel, "label"));
      if (!header && child(panel, "label")) this.note(`${where}: panel ${alias(panel)} is headed with label(input:), the old form; declared as panelHeaderContent`);
      const repetition = child(panel, "repetitionConfig");
      const condition = child(panel, "displayCondition");
      const result: Panel = {
        alias: alias(panel),
        label: headerLabel,
        header: !header && !child(panel, "label") ? false : undefined,
        can: input(child(panel, "can")),
        kind: this.instance("PanelKind", input(child(panel, "panelType")), `${where} panel ${alias(panel)}`),
        collapsed: input(child(panel, "isCollapsed")) === "true",
        editable: input(child(panel, "isEditable")) !== "false",
        editableDefault: input(child(panel, "isEditable")) === undefined ? true : undefined,
        repetitionKey: repetition ? str(repetition, "repetitionKey") : undefined,
        displayConditionKey: condition ? input(child(condition, "key")) : undefined,
        bulkDataSource: child(panel, "bulkData") ? str(child(panel, "bulkData")!, "bulkDataSource") : undefined,
        overrides: [],
        multipleColumns: input(child(panel, "canBeMultipleColumns")) === undefined ? undefined : input(child(panel, "canBeMultipleColumns")) === "true",
        fields: [],
        spreads: spreads(panel.selectionSet),
        elements: [],
      };
      for (const field of fields(panel.selectionSet)) {
        if (field.name.value === "entityListElement") {
          // a list of related entities among the panel's fields, at its position among them
          const element = this.list(field, where, entity) as Extract<Element, { kind: "list" }>;
          element.order = result.fields.length + result.elements.length + 1;
          result.elements.push(element);
          continue;
        }
        if (field.name.value !== "metaData") {
          if (!["panelHeaderContent", "label", "panelType", "isCollapsed", "isEditable", "canBeMultipleColumns", "can", "repetitionConfig", "displayCondition", "bulkData"].includes(field.name.value))
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
        if (input(child(field, "isMultilingual")) === "true") property.multilingual = true;
        const unit = input(child(field, "unit"));
        if (unit && !property.unit) property.unit = this.instance("Unit", unit, `${where} ${key}`);
        if (!unit && property.unit && property.teaser) property.panelShowsUnit = false;
        const tooltip = input(child(field, "tooltip"));
        if (tooltip) property.tooltipKey = tooltip;
        // the first panel showing the key sets how panels show it; a later panel showing it otherwise says so for itself
        const override = (): PanelFieldOverride => {
          let o = result.overrides.find((x) => x.key === key);
          if (!o) result.overrides.push((o = { key }));
          return o;
        };
        const shownAs = property.panelAlias ?? property.alias ?? property.key;
        if (this.panelSeen.has(property)) {
          if (alias(field) !== shownAs) override().alias = alias(field);
        } else if (alias(field) !== key && alias(field) !== (property.alias ?? property.key)) property.panelAlias = alias(field);
        const clamp = input(child(field, "lineClamp"));
        if (clamp) property.panelLineClamp = clamp;
        const translation = input(child(field, "valueTranslationKey"));
        if (translation) property.valueTranslationKey = translation;
        const linkText = input(child(field, "linkText"));
        if (linkText) property.linkText = linkText;
        if (child(field, "copyToClipboard")) property.copyToClipboard = input(child(field, "copyToClipboard")) === "true";
        if (child(field, "nonEditableField")) property.nonEditable = input(child(field, "nonEditableField")) === "true";
        const permitted = child(field, "permitted");
        if (permitted) property.permitted = list(argument(permitted, "input")).map((v) => scalar(v) ?? "");
        const readOnly = child(field, "readOnly");
        if (readOnly) property.readOnlyUnless = list(argument(readOnly, "input")).map((v) => scalar(v) ?? "");
        if (child(field, "showOnlyInEditMode")) property.showOnlyInEditMode = input(child(field, "showOnlyInEditMode")) === "true";
        const label = input(child(field, "label"));
        if (this.panelSeen.has(property)) {
          if (label && label !== (property.detailLabelKey ?? property.labelKey)) override().labelKey = label;
        } else if (label && !property.labelKey) property.labelKey = label;
        else if (label && property.labelKey && label !== property.labelKey) property.detailLabelKey = label;
        const widget = child(field, "inputField");
        if (widget) {
          if (!result.editable) property.panelWidget = true;
          else if (property.readOnly) {
            // another editable panel showed it without a widget: this one has it
            override().widget = true;
          }
          const type = str(widget, "type") ?? "baseTextField";
          const base = BASE_FIELDS[type];
          if (base) {
            property.editor = base.editor;
            property.datatype = base.datatype;
          } else property.clientField = type;
          const validation = this.validation(child(widget, "validation"), `${where} panel ${alias(panel)} field ${key}`);
          if (validation.required) property.required = true;
          if (validation.rule) {
            property.validationRule = validation.rule;
            property.validationValue = validation.value;
            property.validationRelationType = validation.relationType;
            property.validationAmount = validation.amount;
            property.validationExact = validation.exact;
          }
          if (validation.message) property.validationMessage = validation.message;
          const keyboardField = child(widget, "virtualKeyboardConfig");
          const keyboard = keyboardField ? argument(keyboardField, "input") : undefined;
          if (keyboard?.kind === Kind.OBJECT) property.virtualKeyboardLayouts = list(objectField(keyboard, "layouts")).map((v) => scalar(v) ?? "");
        } else if (result.editable) {
          // shown without a widget in an editable panel: read-only, unless another panel edits it
          if (property.editor || property.clientField) override().widget = false;
          else property.readOnly = true;
        }
        this.panelSeen.add(property);
        // the panel references the property shape by its path, which is the key (an aliased value keeps its key)
        result.fields.push(property.key);
      }
      panels.push(result);
    }
    const shown = input(child(child(element, "expandButtonOptions"), "shown"));
    const statusField = child(element, "windowElementStatus");
    const statusInput = statusField ? argument(statusField, "windowElementStatusInput") : undefined;
    const windowStatus: WindowStatus | undefined =
      statusInput?.kind === Kind.OBJECT
        ? { labelKey: scalar(objectField(statusInput, "label")), statusKey: scalar(objectField(statusInput, "statusMetadataKey")) ?? "", statusInputField: scalar(objectField(statusInput, "statusInputFieldType")) ?? "" }
        : undefined;
    return {
      kind: "window",
      alias: element.alias?.value,
      label: input(child(element, "label")),
      expandButton: child(element, "expandButtonOptions") ? shown !== "false" : undefined,
      windowLayout: child(element, "layout") ? this.instance("WindowLayout", input(child(element, "layout")), `${where} window element`) : undefined,
      editButton: child(element, "editMetadataButton") !== undefined,
      hideInHistory: input(child(element, "hideInHistory")) === "true",
      windowStatus,
      contextMenu: child(element, "contextMenuActions") ? this.contextMenu(child(element, "contextMenuActions")!, where) : undefined,
      panelSpreads: spreads(element.selectionSet),
      panels,
    };
  }

  private list(element: FieldNode, where: string, entity: Entity): Element {
    const known = ["label", "isCollapsed", "type", "entityTypes", "relationType", "searchInputType", "customQuery", "customQueryRelationType", "customQueryFilters", "customBulkOperations", "customQueryEntityPickerList", "customQueryEntityPickerListFilters", "viewMode", "can", "hideInHistory", "disableLibraryBar", "enableNavigation", "baseLibraryMode", "addEntitiesToForms", "cropMediafileCoordinatesKey", "actionsOnResult"];
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
    // the list's own label: the unaliased label field (relationType: label(...) is the relation, not the label)
    const ownLabel = fields(element.selectionSet).find((f) => f.name.value === "label" && (!f.alias || f.alias.value === "label"));
    const actions = child(element, "actionsOnResult");
    const actionsOnResult = actions
      ? { kind: this.instance("ResultKind", input(child(actions, "type")), `${where} list ${alias(element)} actions on result`), operations: this.operations(child(actions, "options"), where, entity) }
      : undefined;
    if (actionsOnResult) (entity.resultOperations ??= []).push(...actionsOnResult.operations);
    const addEntities = input(child(element, "addEntitiesToForms"));
    return {
      kind: "list",
      alias: element.alias?.value,
      addEntitiesToForms: addEntities === undefined ? undefined : addEntities === "true",
      cropCoordinatesKey: input(child(element, "cropMediafileCoordinatesKey")),
      actionsOnResult,
      label: ownLabel ? input(ownLabel) : undefined,
      mediaKind: this.instance("MediaElementKind", input(child(element, "type")), `${where} list ${alias(element)}`),
      customQueryRelationType: scoped ? input(scoped) : undefined,
      listViewMode: input(child(element, "viewMode")),
      can: list(child(element, "can") ? argument(child(element, "can")!, "input") : undefined).map((v) => scalar(v) ?? ""),
      hideInHistory: input(child(element, "hideInHistory")) === "true",
      disableLibraryBar: input(child(element, "disableLibraryBar")) === "true",
      enableNavigation: input(child(element, "enableNavigation")) === undefined ? undefined : input(child(element, "enableNavigation")) === "true",
      libraryMode: input(child(element, "baseLibraryMode")),
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
    // one node per list and filters document pair: the same list with other filters is another picker
    const known = entity.pickers.find((p) => p.name === name && (p.filtersName ?? "") === (filtersName ?? ""));
    if (known) return known.node ?? name;
    // a picker several types use keeps one node: the first type declares it, the others reference it
    const shared = this.pickerNodes.get(`${name}|${filtersName ?? ""}`);
    if (shared) return shared;
    const query = this.operation(name);
    const results = this.resultsOf(query, name, this.definitions.get(name)?.file ?? "");
    if (!query) this.note(`${where}: picker ${name} is not in these files; declared without results`);
    const filters = filtersName ? this.operation(filtersName) : undefined;
    const { block, filtersType } = this.advancedFiltersOf(filters);
    const node = this.mint(name, `${name}Picker`);
    this.pickerNodes.set(`${name}|${filtersName ?? ""}`, node);
    entity.pickers.push({ node, name, filtersName, filtersType, relationValues: results.length ? this.resultsRelationValues(query) || undefined : undefined, readsHost: results.length ? this.queryReadsHost(query) || undefined : undefined, hostOptional: results.length && this.queryHostOptional(query) ? true : undefined, results, filters: block ? this.filters(block, `${where} ${filtersName}`) : [] });
    return node;
  }

  /** The advancedFilters block of a filters document, on EntityTypeFilters itself or inside its inline fragment on a type. */
  private advancedFiltersOf(filters: OperationDefinitionNode | undefined): { block?: FieldNode; filtersType?: string } {
    const typeFilters = filters ? fields(filters.selectionSet).find((f) => f.name.value === "EntityTypeFilters") : undefined;
    const direct = child(typeFilters, "advancedFilters");
    if (direct) return { block: direct };
    const inline = typeFilters?.selectionSet?.selections.find((s): s is InlineFragmentNode => s.kind === Kind.INLINE_FRAGMENT);
    if (!inline) return {};
    return { block: child({ selectionSet: inline.selectionSet }, "advancedFilters"), filtersType: inline.typeCondition?.name.value };
  }

  /** The node of a list query: one per query and filters document; the entities document goes with the first node of a query. */
  private listQuery(name: string, filtersName: string | undefined, where: string, entity: Entity): string {
    const pair = `${name}|${filtersName ?? ""}`;
    const known = this.listQueryNodes.get(pair);
    if (known) return known;
    const node = this.mint(name, filtersName ?? `${name}List`);
    this.listQueryNodes.set(pair, node);
    const query = this.operation(name);
    let results: ListQuery["results"] = [];
    if (query && !this.queriesWithResults.has(name)) {
      results = this.resultsOf(query, name, this.definitions.get(name)?.file ?? "");
      if (results.length) this.queriesWithResults.add(name);
    }
    const filters = filtersName ? this.operation(filtersName) : undefined;
    const { block, filtersType } = this.advancedFiltersOf(filters);
    entity.listQueries.push({ node, name, filtersName, filtersType, relationValues: results.length ? this.resultsRelationValues(query) || undefined : undefined, readsHost: results.length ? this.queryReadsHost(query) || undefined : undefined, hostOptional: results.length && this.queryHostOptional(query) ? true : undefined, results, filters: block ? this.filters(block, `${where} ${filtersName}`) : [] });
    if (filtersName && !filters) this.note(`${where}: filters document ${filtersName} is not in these files; the list query declares no filters and the name stays`);
    return node;
  }

  private customOperations(name: string, where: string, entity: Entity) {
    // a set several types' elements name is declared once, under the first type
    if (entity.customOperations.some((c) => c.name === name) || this.declaredCustomOps.has(name)) return;
    const query = this.operation(name);
    if (!query) {
      this.note(`${where}: custom bulk operations ${name} are not in these files; the element names them, nothing is generated`);
      this.stubs.add(name);
      return;
    }
    const custom = fields(query.selectionSet).find((f) => f.name.value === "CustomBulkOperations");
    const options = child(child(custom, "bulkOperationOptions"), "options");
    const operations = this.operations(options, `${where} ${name}`, entity);
    const declaredEmpty = list(options ? argument(options, "input") : undefined).length === 0;
    if (operations.length || declaredEmpty) {
      entity.customOperations.push({ name, operations });
      this.declaredCustomOps.add(name);
    }
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
        keys: keyValue?.kind === Kind.LIST && keyValue.values.length > 1 ? keyValue.values.map((v) => scalar(v) ?? "") : undefined,
        keyAsList: keyValue?.kind === Kind.LIST,
        parentKey: str(field, "parentKey"),
        aggregation: str(field, "aggregation"),
        label: str(field, "label"),
        displayed: str(field, "isDisplayedByDefault") === "true",
        tooltip: child(field, "tooltip") !== undefined,
        defaults: list(defaultValue).map((v) => scalar(v) ?? ""),
        defaultAsList: defaultValue?.kind === Kind.LIST,
        defaultBare: defaultValue?.kind === Kind.BOOLEAN ? true : undefined,
        itemTypes: argument(field, "itemTypes") ? list(argument(field, "itemTypes")).map((v) => scalar(v) ?? "") : undefined,
        defaultMatcher: str(field, "defaultMatcher"),
        allowedMatchers: argument(field, "allowedMatchers") ? list(argument(field, "allowedMatchers")).map((v) => scalar(v) ?? "") : undefined,
        valueMappings: child(field, "defaultValueMapping") ? this.valueMappings(argument(child(field, "defaultValueMapping")!, "value")) : undefined,
        facets: argument(field, "facets") ? this.facets(argument(field, "facets")) : undefined,
        hidden: child(field, "hidden") !== undefined && input(child(field, "hidden")) !== "false",
        keepDefaultValue: child(field, "doNotOverrideDefaultValue") !== undefined && input(child(field, "doNotOverrideDefaultValue")) !== "false" ? true : undefined,
      };
      const mapping = argument(field, "filterOptionsMapping");
      if (mapping?.kind === Kind.OBJECT) {
        filter.optionsLabel = scalar(objectField(mapping, "label"));
        filter.optionsValue = scalar(objectField(mapping, "value"));
      }
      filter.selectionOption = str(field, "selectionOption");
      filter.operator = str(field, "operator");
      filter.showTime = str(field, "showTimeForDateFilter") === undefined ? undefined : str(field, "showTimeForDateFilter") === "true";
      filter.matchersType = str(field, "matchersType");
      const lookup = argument(field, "lookup");
      if (lookup?.kind === Kind.OBJECT)
        filter.lookup = this.lookupOf(lookup);
      const retrieving = argument(field, "advancedFilterInputForRetrievingOptions");
      if (retrieving) {
        const inputs = list(retrieving).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT);
        // the search: the first text input over "*"; the type input; every other input is a further one
        const text = inputs.find((o) => scalar(objectField(o, "type")) === "text" && scalar(objectField(o, "value")) === "*");
        let type = inputs.find((o) => scalar(objectField(o, "type")) === "type");
        // a type input followed by further inputs keeps its place among them
        if (type && inputs.indexOf(type) < inputs.length - 1) type = undefined;
        const typeValue = type ? scalar(objectField(type, "value")) : undefined;
        const flag = (o: ObjectValueNode, name: string) => ((v) => (v === undefined ? undefined : v === "true"))(scalar(objectField(o, name)));
        const others = inputs.filter((o) => o !== text && o !== type);
        if (typeValue || text || others.length)
          filter.options = {
            type: typeValue,
            key: text ? scalar(list(objectField(text, "key"))[0]) : undefined,
            keys: text && list(objectField(text, "key")).length > 1 ? list(objectField(text, "key")).map((v) => scalar(v) ?? "") : undefined,
            itemTypes: text && objectField(text, "item_types") ? list(objectField(text, "item_types")).map((v) => scalar(v) ?? "") : undefined,
            labelKey: text ? scalar(objectField(text, "metadata_key_as_label")) : undefined,
            matchExact: text ? flag(text, "match_exact") : undefined,
            distinctBy: text ? scalar(objectField(text, "distinct_by")) : undefined,
            operator: text ? scalar(objectField(text, "operator")) : undefined,
            typeOperator: type ? scalar(objectField(type, "operator")) : undefined,
            typeBare: type && objectField(type, "value")?.kind === Kind.ENUM ? true : undefined,
            inputs: others.length
              ? others.map((o) => {
                  const value = objectField(o, "value");
                  return {
                    kind: this.instance("FilterKind", scalar(objectField(o, "type")), `${where} filter ${alias(field)} option input`),
                    key: scalar(list(objectField(o, "key"))[0]) ?? "",
                    value: value?.kind === Kind.LIST ? list(value).map((v) => scalar(v) ?? "") : (scalar(value) ?? ""),
                    bareValues: (value?.kind === Kind.LIST ? list(value) : value ? [value] : []).some((v) => v.kind === Kind.ENUM) ? true : undefined,
                    valueMappings: objectField(o, "defaultValueMapping") ? this.valueMappings(objectField(o, "defaultValueMapping")) : undefined,
                    matchExact: flag(o, "match_exact"),
                    distinctBy: scalar(objectField(o, "distinct_by")),
                    resolveDefaultValueToOptionIds: flag(o, "resolveDefaultValueToOptionIds"),
                    operator: scalar(objectField(o, "operator")),
                  };
                })
              : undefined,
          };
        else this.note(`${where}: filter ${alias(field)} fetches its options without any input; its option source is left out`);
      }
      // a shared fragment as the selection set (...advancedFilter)
      const selectionSpreads = spreads(field.selectionSet);
      if (selectionSpreads.length) filter.selectionSpread = selectionSpreads[0];
      if (selectionSpreads.length > 1) this.note(`${where}: filter ${alias(field)} spreads ${selectionSpreads.join(", ")}; only the first is declared`);
      const fixed = argument(field, "options");
      if (fixed)
        filter.staticOptions = list(fixed)
          .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
          .map((option) => ({ label: scalar(objectField(option, "label")) ?? "", value: scalar(objectField(option, "value")) ?? "" }));
      for (const a of field.arguments ?? [])
        if (!["type", "key", "label", "isDisplayedByDefault", "parentKey", "aggregation", "advancedFilterInputForRetrievingOptions", "filterOptionsMapping", "selectionOption", "operator", "showTimeForDateFilter", "matchersType", "lookup", "options", "itemTypes", "defaultMatcher", "allowedMatchers", "facets"].includes(a.name.value))
          this.note(`${where}: filter ${alias(field)} argument ${a.name.value} has no term; left out`);
      result.push(filter);
    }
    return result;
  }

  /** A guided flow (GetRepetitiveForm): its steps, each with a form and a picker, and what finalizes it. */
  private flow(query: OperationDefinitionNode, queryName: string, where: string, entity: Entity): Flow {
    const root = fields(query.selectionSet).find((f) => f.name.value === "GetRepetitiveForm")!;
    for (const field of fields(root.selectionSet))
      if (!["label", "repeatable", "refetchOnFinish", "linear", "startOnFirstStep", "returnsSelection", "routeToStep", "routeToRoute", "steps", "finalizeOnHost"].includes(field.name.value)) this.note(`${where}: guided flow ${queryName} field ${field.name.value} has no term; left out`);
    const steps = fields(root.selectionSet)
      .filter((f) => f.name.value === "steps")
      .map((step): FlowStep => {
        const known = ["key", "label", "entityType", "createForm", "pickerQuery", "pickerFiltersQuery", "acceptedTypes", "maxSelection", "overviewFields", "showBackButton", "skipSearchIfPriorIsNew", "pickerFiltersCollapsed", "terminalActionLabel", "scopeToRelationOf", "relations", "creatableTypes", "metadataOnly"];
        for (const field of fields(step.selectionSet)) if (!known.includes(field.name.value)) this.note(`${where}: guided flow ${queryName} step ${alias(step)} field ${field.name.value} has no term; left out`);
        const pickerQuery = input(child(step, "pickerQuery"));
        const overview = child(step, "overviewFields");
        const max = input(child(step, "maxSelection"));
        const flag = (name: string) => (child(step, name) ? input(child(step, name)) === "true" : undefined);
        const scope = child(step, "scopeToRelationOf");
        const relations = fields(step.selectionSet).filter((f) => f.name.value === "relations");
        const creatable = child(step, "creatableTypes");
        return {
          showBackButton: flag("showBackButton"),
          skipSearchIfPriorIsNew: flag("skipSearchIfPriorIsNew"),
          pickerFiltersCollapsed: flag("pickerFiltersCollapsed"),
          metadataOnly: flag("metadataOnly"),
          terminalActionLabel: input(child(step, "terminalActionLabel")),
          scope: scope ? { step: input(child(scope, "step")) ?? "", relationType: input(child(scope, "relationType")) ?? "", filterKey: input(child(scope, "filterKey")) } : undefined,
          relations: relations.length
            ? relations.map((relation) => {
                const metadata = child(relation, "metadataFields");
                return {
                  to: input(child(relation, "to")) ?? "",
                  relationType: input(child(relation, "relationType")) ?? "",
                  createWhen: input(child(relation, "createWhen")),
                  metadataFields: metadata
                    ? list(argument(metadata, "input"))
                        .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
                        .map((field) => ({ formMetadataKey: scalar(objectField(field, "formMetadataKey")) ?? "", relationMetadataKey: scalar(objectField(field, "relationMetadataKey")) ?? "", asArray: objectField(field, "asArray") ? scalar(objectField(field, "asArray")) === "true" : undefined }))
                    : undefined,
                };
              })
            : undefined,
          creatableTypes: creatable
            ? list(argument(creatable, "input"))
                .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
                .map((type) => ({ label: scalar(objectField(type, "label")), entityType: scalar(objectField(type, "entityType")) ?? "", createForm: scalar(objectField(type, "createForm")) ?? "" }))
            : undefined,
          key: input(child(step, "key")) ?? alias(step),
          label: input(child(step, "label")),
          entityType: input(child(step, "entityType")),
          createForm: input(child(step, "createForm")),
          pickerNode: pickerQuery ? this.picker(pickerQuery, input(child(step, "pickerFiltersQuery")), `${where} ${queryName}`, entity) : undefined,
          acceptedTypes: list(child(step, "acceptedTypes") ? argument(child(step, "acceptedTypes")!, "input") : undefined).map((v) => scalar(v) ?? ""),
          maxSelection: max === undefined ? undefined : Number(max),
          overviewFields: list(overview ? argument(overview, "input") : undefined)
            .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
            .map((entry) => ({ key: scalar(objectField(entry, "key")) ?? "", label: scalar(objectField(entry, "label")) })),
        };
      });
    const finalize = child(root, "finalizeOnHost");
    return {
      queryName,
      label: input(child(root, "label")),
      repeatable: child(root, "repeatable") ? input(child(root, "repeatable")) === "true" : undefined,
      refetchOnFinish: child(root, "refetchOnFinish") ? input(child(root, "refetchOnFinish")) === "true" : undefined,
      linear: child(root, "linear") ? input(child(root, "linear")) === "true" : undefined,
      startOnFirstStep: child(root, "startOnFirstStep") ? input(child(root, "startOnFirstStep")) === "true" : undefined,
      returnsSelection: child(root, "returnsSelection") ? input(child(root, "returnsSelection")) === "true" : undefined,
      routeToStep: input(child(root, "routeToStep")),
      routeToRoute: input(child(root, "routeToRoute")),
      steps,
      finalize: finalize ? { fromStep: input(child(finalize, "fromStep")) ?? "", relationType: input(child(finalize, "relationType")) ?? "" } : undefined,
    };
  }

  /** deleteQueryOptions: the labels and documents of the delete flow. */
  private deleteOptions(block: FieldNode, where: string, entity: Entity): DeleteOptions {
    const value = (name: string) => input(child(block, name));
    const types = (name: string) => list(child(block, name) ? argument(child(block, name)!, "input") : undefined).map((v) => scalar(v) ?? "");
    const known = ["deleteEntityLabel", "customQueryDeleteRelations", "customQueryDeleteRelationsFilters", "customQueryEntityTypes", "deleteRelationsLabel", "customQueryBlockingRelations", "customQueryBlockingRelationsFilters", "customQueryBlockingEntityTypes", "blockingRelationsLabel"];
    for (const field of fields(block.selectionSet)) if (!known.includes(field.name.value)) this.note(`${where}: deleteQueryOptions field ${field.name.value} has no term; left out`);
    // the documents the flow names are list queries of the type: their filters documents are declared
    for (const [query, filters] of [["customQueryDeleteRelations", "customQueryDeleteRelationsFilters"], ["customQueryBlockingRelations", "customQueryBlockingRelationsFilters"]])
      if (value(query) && value(filters) && this.operation(value(filters)!)) {
        const node = this.listQuery(value(query)!, value(filters), where, entity);
        if (!entity.entityListQueries.includes(node)) entity.entityListQueries.push(node);
      }
    return {
      deleteEntityLabel: value("deleteEntityLabel"),
      deleteRelationsQuery: value("customQueryDeleteRelations"),
      deleteRelationsFilters: value("customQueryDeleteRelationsFilters"),
      deleteRelationsTypes: types("customQueryEntityTypes"),
      deleteRelationsLabel: value("deleteRelationsLabel"),
      blockingRelationsQuery: value("customQueryBlockingRelations"),
      blockingRelationsFilters: value("customQueryBlockingRelationsFilters"),
      blockingRelationsTypes: types("customQueryBlockingEntityTypes"),
      blockingRelationsLabel: value("blockingRelationsLabel"),
    };
  }

  /** A form without a field the vocabulary knows (an upload container only) cannot be declared: it stays hand-written. */
  private formWithFields(form: Form, where: string): Form | undefined {
    if (form.fields.length || form.fieldsSpreads.length) return form;
    this.note(`${where}: form ${form.queryName} has no field the vocabulary can declare; it stays hand-written`);
    this.stubs.add(form.queryName);
    return undefined;
  }

  private form(query: OperationDefinitionNode, queryName: string, where: string): Form {
    const dynamic = fields(query.selectionSet).find((f) => f.name.value === "GetDynamicForm");
    const tab = fields(dynamic?.selectionSet).find((f) => f.name.value === "formTab");
    // a tab without an alias is the plain formTab field; said as the alias "formTab"
    const form: Form = { queryName, label: input(child(dynamic, "label")), tabAlias: tab?.alias?.value ?? (tab ? "formTab" : undefined), fields: [], fieldsSpreads: spreads(child(tab, "formFields")?.selectionSet) };
    // copyFromParent: prefilled from the entity the form is opened on
    const copy = child(tab, "copyFromParent");
    const copyInput = copy ? argument(copy, "input") : undefined;
    if (copyInput?.kind === Kind.OBJECT) {
      const auto = scalar(objectField(copyInput, "autoCopy"));
      form.copyFromParent = {
        autoCopy: auto === undefined ? undefined : auto === "true",
        keyMap: list(objectField(copyInput, "keyMap"))
          .filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT)
          .map((entry) => ({ key: scalar(objectField(entry, "key")) ?? "", fromKey: scalar(objectField(entry, "fromKey")) ?? "" })),
      };
    }
    for (const field of fields(tab?.selectionSet))
      if (!["formFields", "copyFromParent"].includes(field.name.value)) this.note(`${where}: form ${queryName} tab field ${field.name.value} has no term; left out`);
    for (const field of fields(child(tab, "formFields")?.selectionSet)) {
      if (field.name.value === "metaData") form.fields.push(this.formField(field, `${where} form ${queryName}`));
      else if (field.name.value === "action") {
        form.submit = {
          alias: alias(field) !== "createAction" ? alias(field) : undefined,
          label: input(child(field, "label")),
          icon: input(child(field, "icon")),
          actionQuery: input(child(field, "actionQuery")),
          creationType: input(child(field, "creationType")),
          showsFormErrors: input(child(field, "showsFormErrors")) === "true",
        };
        const kind = input(child(field, "actionType"));
        if (kind && kind !== "submit") form.submit.submitAction = kind;
      } else this.note(`${where}: form ${queryName} field ${alias(field)} (${field.name.value}) has no term; left out`);
    }
    return form;
  }

  /** One form field: its widget, validation and hidden flag. */
  private formField(field: FieldNode, where: string): FormField {
    const widget = child(field, "inputField");
    const type = widget ? (str(widget, "type") ?? "baseTextField") : "baseTextField";
    const base = BASE_FIELDS[type];
    const key = input(child(field, "key")) ?? alias(field);
    const multilingual = input(child(field, "isMultilingual")) === "true";
    const validation = this.validation(child(widget, "validation"), `${where} field ${key}`);
    const keyboardField = child(widget, "virtualKeyboardConfig");
    const keyboard = keyboardField ? argument(keyboardField, "input") : undefined;
    const searchField = child(widget, "entityPickerSearchConfig");
    const search = searchField ? argument(searchField, "input") : undefined;
    return {
      key,
      alias: alias(field) !== key ? alias(field) : undefined,
      label: input(child(field, "label")),
      editor: multilingual ? (base?.editor === "shui:TextAreaEditor" ? "shui:TextAreaWithLangEditor" : "shui:TextFieldWithLangEditor") : base?.editor,
      datatype: base?.datatype,
      single: true,
      required: validation.required,
      validationRule: validation.rule,
      validationValue: validation.value,
      validationRelationType: validation.relationType,
      validationAmount: validation.amount,
      validationExact: validation.exact,
      hidden: child(field, "hiddenField") ? true : undefined,
      clientField: base ? undefined : type,
      validationMessage: validation.message,
      tooltipKey: input(child(field, "tooltip")),
      defaultValue: input(child(field, "defaultValue")),
      noWidget: widget ? undefined : true,
      virtualKeyboardLayouts: keyboard?.kind === Kind.OBJECT ? list(objectField(keyboard, "layouts")).map((v) => scalar(v) ?? "") : undefined,
      pickerSearch:
        search?.kind === Kind.OBJECT
          ? { mode: scalar(objectField(search, "mode")) ?? "Search", keys: list(objectField(search, "metadataKeys")).map((v) => scalar(v) ?? ""), acceptedTypes: list(objectField(search, "acceptedTypes")).map((v) => scalar(v) ?? "") }
          : undefined,
    };
  }

  private operations(options: FieldNode | undefined, where: string, entity: Entity): Operation[] {
    return this.operationsOf(list(options ? argument(options, "input") : undefined), where, entity);
  }

  /** The operations in a list of input objects (the options, or the subOptions of one of them). */
  private operationsOf(entries: ValueNode[], where: string, entity: Entity): Operation[] {
    const result: Operation[] = [];
    for (const entry of entries) {
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
        const same = scalar(objectField(context, "requiresSameType"));
        const minItems = scalar(objectField(context, "minSelectedItems"));
        const maxItems = scalar(objectField(context, "maxSelectedItems"));
        operation.context = {
          mode: this.instance("InteractionMode", scalar(list(mode)[0]), `${where} bulk operation`),
          selection: this.instance("SelectionState", scalar(objectField(context, "entitiesSelectionType")), `${where} bulk operation`),
          tooltip: scalar(objectField(context, "labelForTooltip")),
          requiresSameType: same === undefined ? undefined : same === "true",
          minSelectedItems: minItems === undefined ? undefined : Number(minItems),
          maxSelectedItems: maxItems === undefined ? undefined : Number(maxItems),
        };
        const matches = list(objectField(context, "matchMetadataValue")).filter((m): m is ObjectValueNode => m.kind === Kind.OBJECT);
        if (matches.length) operation.context.matches = matches.map((m) => ({ key: scalar(objectField(m, "matchKey")) ?? "", value: scalar(objectField(m, "matchValue")) ?? "" }));
        for (const extra of context.fields.map((f) => f.name.value).filter((n) => !["activeViewMode", "entitiesSelectionType", "labelForTooltip", "requiresSameType", "minSelectedItems", "maxSelectedItems", "matchMetadataValue"].includes(n)))
          this.note(`${where}: bulk operation context field ${extra} has no term; left out`);
      }
      const modal = objectField(entry, "bulkOperationModal");
      if (modal?.kind === Kind.OBJECT) {
        const forms = objectField(modal, "formQueries") ?? objectField(modal, "formQuery");
        if (objectField(modal, "formQuery")) this.note(`${where}: a bulk operation modal uses formQuery (singular), the old form; declared as a form reference`);
        const close = scalar(objectField(modal, "askForCloseConfirmation"));
        const pickerList = scalar(objectField(modal, "customQueryEntityPickerList"));
        const formNames = list(forms).map((f) => scalar(f)).filter((f): f is string => f !== undefined);
        const flag = (name: string) => ((v) => (v === undefined ? undefined : v === "true"))(scalar(objectField(modal, name)));
        const skipped = list(objectField(modal, "skipItemsWithRelationDuringBulkDelete")).map((v) => scalar(v) ?? "");
        const limit = scalar(objectField(modal, "selectionLimit"));
        const suggestion = objectField(modal, "survivorSuggestion");
        operation.modal = {
          kind: this.instance("ModalKind", scalar(objectField(modal, "typeModal")), `${where} bulk operation`),
          form: formNames[0],
          forms: formNames.length > 1 ? formNames : undefined,
          skipRelatedItems: skipped.length ? skipped : undefined,
          imageCrop: flag("enableImageCrop"),
          cropCoordinatesKey: scalar(objectField(modal, "keyToSaveCropCoordinates")),
          replaceExistingRelations: flag("replaceExistingRelations"),
          selectionLimit: limit === undefined ? undefined : Number(limit),
          survivorSuggestion:
            suggestion?.kind === Kind.OBJECT
              ? {
                  strategy: this.instance("SurvivorStrategy", scalar(objectField(suggestion, "strategy")), `${where} survivor suggestion`),
                  autoSelect: ((v) => (v === undefined ? undefined : v === "true"))(scalar(objectField(suggestion, "autoSelect"))),
                  requireRecommendedSurvivor: ((v) => (v === undefined ? undefined : v === "true"))(scalar(objectField(suggestion, "requireRecommendedSurvivor"))),
                  hiddenVerdicts: list(objectField(suggestion, "hiddenVerdicts"))
                    .map((v) => this.instance("MergeVerdict", scalar(v), `${where} survivor suggestion`))
                    .filter((v): v is string => v !== undefined),
                }
              : undefined,
          relationType: scalar(objectField(modal, "formRelationType")),
          closeConfirmation: close === undefined ? undefined : close === "true",
          permission: this.instance("Permission", scalar(objectField(modal, "neededPermission")), `${where} bulk operation`),
          pickerNode: pickerList ? this.picker(pickerList, scalar(objectField(modal, "customQueryEntityPickerListFilters")), `${where} bulk operation`, entity) : undefined,
          navigateAfterCreation: scalar(objectField(modal, "pageToNavigateToAfterCreation")),
        };
        for (const f of modal.fields)
          if (!["typeModal", "formQueries", "formQuery", "formRelationType", "askForCloseConfirmation", "neededPermission", "customQueryEntityPickerList", "customQueryEntityPickerListFilters", "pageToNavigateToAfterCreation", "skipItemsWithRelationDuringBulkDelete", "enableImageCrop", "keyToSaveCropCoordinates", "replaceExistingRelations", "selectionLimit", "survivorSuggestion"].includes(f.name.value))
            this.note(`${where}: bulk operation modal field ${f.name.value} has no term; left out`);
      }
      // the operations offered under this one (a dropdown)
      const subs = list(objectField(entry, "subOptions"));
      if (subs.length) operation.subOptions = this.operationsOf(subs, where, entity);
      for (const f of entry.fields.map((f) => f.name.value).filter((n) => !["icon", "label", "value", "primary", "can", "actionContext", "bulkOperationModal", "subOptions"].includes(n)))
        this.note(`${where}: bulk operation field ${f} has no term; left out`);
      result.push(operation);
    }
    return result;
  }

  /** An operation and, recursively, the ones under it. */
  private static flattenOperations(operations: Operation[]): Operation[] {
    return operations.flatMap((op) => [op, ...Extractor.flattenOperations(op.subOptions ?? [])]);
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
    if (p.valueLabelRootKey) lines.push(`    elody:valueLabelRootKey ${q(p.valueLabelRootKey)} ;`);
    if (p.editor || p.datatype || p.clientField) lines.push(`    sh:maxCount 1 ;`);
    if (p.required) lines.push(`    sh:minCount 1 ;`);
    if (p.cardKey) lines.push(`    elody:cardKey ${q(p.cardKey)} ;`);
    if (p.cardField) lines.push(`    elody:cardField ${q(p.cardField)} ;`);
    if (p.cardEditable) lines.push(`    elody:cardEditable true ;`);
    if (p.relationKey) lines.push(`    elody:relationKey ${q(p.relationKey)} ;`);
    if (p.readsHost) lines.push(`    elody:readsHost true ;`);
    if (p.relationDirection) lines.push(`    elody:relationDirection ${q(p.relationDirection)} ;`);
    if (p.parentEntityType) lines.push(`    elody:parentEntityType ${q(p.parentEntityType)} ;`);
    if (p.parentKey) lines.push(`    elody:parentKey ${q(p.parentKey)} ;`);
    for (const [i, step] of (p.parentRelations ?? []).entries())
      lines.push(`    elody:parentRelation [ sh:order ${i + 1}${step.relationType ? ` ; elody:parentRelationType ${q(step.relationType)}` : ""}${step.entityType ? ` ; elody:parentEntityType ${q(step.entityType)}` : ""}${step.key ? ` ; elody:parentKey ${q(step.key)}` : ""} ] ;`);
    if (p.detailLabelKey) lines.push(`    elody:detailLabelKey ${q(p.detailLabelKey)} ;`);
    if (p.sortPrimary) lines.push(`    elody:sortPrimary true ;`);
    if (p.listingFormatter === false) lines.push(`    elody:listingFormatter false ;`);
    if (p.repeatableMetadataKey !== undefined) lines.push(`    elody:repeatableMetadataKey ${q(p.repeatableMetadataKey)} ;`);
    if (p.parentRelationType) lines.push(`    elody:parentRelationType ${q(p.parentRelationType)} ;`);
    if (p.containsRelationPropertyKey) lines.push(`    elody:containsRelationPropertyKey ${q(p.containsRelationPropertyKey)} ;`);
    if (p.containsRelationPropertyValue !== undefined) lines.push(`    elody:containsRelationPropertyValue ${q(p.containsRelationPropertyValue)} ;`);
    if (p.validationRule) lines.push(`    elody:validationRule ${q(p.validationRule)} ;`);
    if (p.validationValue !== undefined) lines.push(`    elody:validationValue ${q(p.validationValue)} ;`);
    if (p.validationRelationType) lines.push(`    elody:validationRelationType ${q(p.validationRelationType)} ;`);
    if (p.validationAmount !== undefined) lines.push(`    elody:validationAmount ${p.validationAmount} ;`);
    if (p.validationExact !== undefined) lines.push(`    elody:validationExact ${p.validationExact} ;`);
    if (p.technicalOrigin) lines.push(`    elody:technicalOrigin ${q(p.technicalOrigin)} ;`);
    for (const unless of p.readOnlyUnless ?? []) lines.push(`    elody:readOnlyUnless ${q(unless)} ;`);
    if (p.showOnlyInEditMode !== undefined) lines.push(`    elody:showOnlyInEditMode ${p.showOnlyInEditMode} ;`);
    if (p.listingValueLabelKey !== undefined) lines.push(`    elody:listingValueLabelKey ${q(p.listingValueLabelKey)} ;`);
    if (p.listingValueLabelRootKey !== undefined) lines.push(`    elody:listingValueLabelRootKey ${q(p.listingValueLabelRootKey)} ;`);
    if (p.detailFormatter === false) lines.push(`    elody:detailFormatter false ;`);
    if (p.detailContainsRelation === false) lines.push(`    elody:detailContainsRelation false ;`);
    if (p.cardLineClamp) lines.push(`    elody:cardLineClamp ${q(p.cardLineClamp)} ;`);
    if (p.panelLineClamp) lines.push(`    elody:panelLineClamp ${q(p.panelLineClamp)} ;`);
    if (p.panelAlias) lines.push(`    elody:panelAlias ${q(p.panelAlias)} ;`);
    if (p.highlightIfPrimaryThumbnail !== undefined) lines.push(`    elody:highlightIfPrimaryThumbnail ${p.highlightIfPrimaryThumbnail} ;`);
    if (p.validationMessage) lines.push(`    elody:validationMessage ${q(p.validationMessage)} ;`);
    if (p.virtualKeyboardLayouts?.length) lines.push(`    elody:virtualKeyboardLayouts ( ${p.virtualKeyboardLayouts.map(q).join(" ")} ) ;`);
    if (p.valueTranslationKey) lines.push(`    elody:valueTranslationKey ${q(p.valueTranslationKey)} ;`);
    for (const permitted of p.permitted ?? []) lines.push(`    elody:permitted ${q(permitted)} ;`);
    if (p.linkText) lines.push(`    elody:linkText ${q(p.linkText)} ;`);
    if (p.copyToClipboard !== undefined) lines.push(`    elody:copyToClipboard ${p.copyToClipboard} ;`);
    if (p.nonEditable !== undefined) lines.push(`    elody:nonEditable ${p.nonEditable} ;`);
    if (p.tooltipKey) lines.push(`    elody:tooltipKey ${q(p.tooltipKey)} ;`);
    if (p.panelShowsUnit === false) lines.push(`    elody:panelShowsUnit false ;`);
    if (p.panelWidget) lines.push(`    elody:panelWidget true ;`);
    if (p.cardAlias) lines.push(`    elody:cardAlias ${q(p.cardAlias)} ;`);
    if (p.cardValidates === false) lines.push(`    elody:cardValidates false ;`);
    for (const page of p.sortPages ?? []) lines.push(`    elody:sortPage [ elody:routeName ${q(page.routeName)}${page.entityType ? ` ; elody:routeEntityType ${q(page.entityType)}` : ""} ] ;`);
    if (p.labelRole) lines.push(`    shui:propertyRole shui:LabelRole ;`);
    const editor = p.multilingual ? (p.editor === "shui:TextAreaEditor" ? "shui:TextAreaWithLangEditor" : "shui:TextFieldWithLangEditor") : p.editor;
    if (editor) lines.push(`    shui:editor ${editor} ;`);
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

  private lookupNode(lookup: Lookup): string {
    return `[ elody:lookupFrom ${q(lookup.from)} ; elody:lookupLocalField ${q(lookup.localField)} ; elody:lookupForeignField ${q(lookup.foreignField)} ; elody:lookupAs ${q(lookup.as)}${lookup.resolveToSourceIds ? " ; elody:lookupResolveToSourceIds true" : ""} ]`;
  }

  private facetNode(facet: Facet, order: number): string {
    const parts = [`sh:order ${order}`, ...(facet.kind ? [`elody:inputKind ${facet.kind}`] : []), ...(facet.value !== undefined ? [`elody:value ${q(facet.value)}`] : []), ...(facet.key !== undefined ? [`elody:key ${q(facet.key)}`] : []), ...facet.lookups.map((l) => `elody:lookup ${this.lookupNode(l)}`), ...facet.facets.map((f, i) => `elody:facet ${this.facetNode(f, i + 1)}`)];
    return `[ ${parts.join(" ; ")} ]`;
  }

  private filter(f: Filter): string {
    const lines: string[] = ["    ["];
    if (f.label) lines.push(`    rdfs:label ${q(f.label)} ;`);
    lines.push(`    sh:order ${f.order} ;`);
    if (f.alias) lines.push(`    elody:alias ${q(f.alias)} ;`);
    if (f.keys) lines.push(`    elody:keys ( ${f.keys.map(q).join(" ")} ) ;`);
    else if (f.key !== undefined) lines.push(`    elody:key ${q(f.key)} ;`);
    if (f.parentKey) lines.push(`    elody:parentFilterKey ${q(f.parentKey)} ;`);
    if (f.aggregation) lines.push(`    elody:filterAggregation ${q(f.aggregation)} ;`);
    if (f.hidden) lines.push(`    dash:hidden true ;`);
    if (f.keepDefaultValue) lines.push(`    elody:keepDefaultValue true ;`);
    for (const value of f.defaults) lines.push(`    sh:defaultValue ${f.defaultBare ? value : q(value)} ;`);
    for (const t of f.itemTypes ?? []) lines.push(`    elody:itemTypes ${q(t)} ;`);
    if (f.defaultMatcher) lines.push(`    elody:defaultMatcher ${q(f.defaultMatcher)} ;`);
    if (f.allowedMatchers?.length) lines.push(`    elody:allowedMatchers ( ${f.allowedMatchers.map(q).join(" ")} ) ;`);
    for (const [i, m] of (f.valueMappings ?? []).entries()) lines.push(`    elody:valueMapping [ sh:order ${i + 1} ; elody:value ( ${m.values.map(q).join(" ")} ) ; elody:mapping ${q(m.mapping)} ] ;`);
    for (const [i, facet] of (f.facets ?? []).entries()) lines.push(`    elody:facet ${this.facetNode(facet, i + 1)} ;`);
    if (f.defaultAsList) lines.push(`    elody:defaultValueAsList true ;`);
    if (f.displayed) lines.push(`    elody:displayedByDefault true ;`);
    if (f.optionsLabel) lines.push(`    elody:optionsLabel ${q(f.optionsLabel)} ;`);
    if (f.optionsValue) lines.push(`    elody:optionsValue ${q(f.optionsValue)} ;`);
    if (f.selectionOption) lines.push(`    elody:selectionOption ${q(f.selectionOption)} ;`);
    if (f.operator) lines.push(`    elody:filterOperator ${q(f.operator)} ;`);
    if (f.showTime !== undefined) lines.push(`    elody:showTime ${f.showTime} ;`);
    if (f.matchersType) lines.push(`    elody:matchersType ${q(f.matchersType)} ;`);
    if (f.lookup)
      lines.push(`    elody:lookup ${this.lookupNode(f.lookup)} ;`);
    if (f.selectionSpread) lines.push(`    elody:selectionSpread ${q(f.selectionSpread)} ;`);
    for (const [i, option] of (f.staticOptions ?? []).entries())
      lines.push(`    elody:option [ sh:order ${i + 1} ; elody:labelKey ${q(option.label)} ; elody:value ${q(option.value)} ] ;`);
    if (f.options) {
      if (f.options.type !== undefined) lines.push(`    elody:optionsType ${q(f.options.type)} ;`);
      if (f.options.keys) lines.push(`    elody:optionsKeys ( ${f.options.keys.map(q).join(" ")} ) ;`);
      else if (f.options.key !== undefined) lines.push(`    elody:optionsKey ${q(f.options.key)} ;`);
      for (const t of f.options.itemTypes ?? []) lines.push(`    elody:optionsItemTypes ${q(t)} ;`);
      if (f.options.labelKey) lines.push(`    elody:optionsLabelKey ${q(f.options.labelKey)} ;`);
      if (f.options.matchExact !== undefined) lines.push(`    elody:optionsMatchExact ${f.options.matchExact} ;`);
      if (f.options.distinctBy) lines.push(`    elody:optionsDistinctBy ${q(f.options.distinctBy)} ;`);
      if (f.options.operator) lines.push(`    elody:optionsOperator ${q(f.options.operator)} ;`);
      if (f.options.typeOperator) lines.push(`    elody:optionsTypeOperator ${q(f.options.typeOperator)} ;`);
      if (f.options.typeBare) lines.push(`    elody:optionsTypeBare true ;`);
      for (const [i, input] of (f.options.inputs ?? []).entries()) {
        const parts = [`sh:order ${i + 1}`, `elody:inputKind ${input.kind ?? "elody:TextFilter"}`, ...(input.key ? [`elody:key ${q(input.key)}`] : []), `elody:value ${Array.isArray(input.value) ? `( ${input.value.map(q).join(" ")} )` : q(input.value)}`];
        if (input.distinctBy) parts.push(`elody:inputDistinctBy ${q(input.distinctBy)}`);
        if (input.resolveDefaultValueToOptionIds) parts.push("elody:inputResolveDefaultValueToOptionIds true");
        if (input.matchExact !== undefined) parts.push(`elody:inputMatchExact ${input.matchExact}`);
        if (input.operator) parts.push(`elody:inputOperator ${q(input.operator)}`);
        if (input.bareValues) parts.push(`elody:bareValues true`);
        for (const [j, m] of (input.valueMappings ?? []).entries()) parts.push(`elody:valueMapping [ sh:order ${j + 1} ; elody:value ( ${m.values.map(q).join(" ")} ) ; elody:mapping ${q(m.mapping)} ]`);
        lines.push(`    elody:optionsInput [ ${parts.join(" ; ")} ] ;`);
      }
    }
    lines.push(`    elody:filterKind ${f.kind} ;`);
    if (!f.keyAsList && f.key !== undefined && !f.keys) lines.push(`    elody:keyAsList false ;`);
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
        `      [ ${op.context.mode ? `elody:activeViewMode ${op.context.mode} ; ` : ""}elody:selection ${op.context.selection ?? "elody:NoneSelected"} ;`,
        ...(op.context.requiresSameType !== undefined ? [`      elody:requiresSameType ${op.context.requiresSameType} ;`] : []),
        ...(op.context.minSelectedItems !== undefined ? [`      elody:minSelectedItems ${op.context.minSelectedItems} ;`] : []),
        ...(op.context.maxSelectedItems !== undefined ? [`      elody:maxSelectedItems ${op.context.maxSelectedItems} ;`] : []),
        ...(op.context.matches ?? []).map((m) => `      elody:matchMetadataValue [ elody:matchKey ${q(m.key)} ; elody:matchValue ${q(m.value)} ] ;`),
        `      elody:tooltipLabel ${q(op.context.tooltip ?? "")} ] ;`,
      );
    if (op.modal) {
      const modal = [`      [ elody:modalKind ${op.modal.kind ?? "elody:DynamicFormModal"} ;`];
      if (op.modal.forms) {
        modal.push(`      elody:forms ( ${op.modal.forms.map((f) => `ui:${f}`).join(" ")} ) ;`);
        for (const f of op.modal.forms) if (!forms.has(f)) stubs.add(f);
      } else if (op.modal.form) {
        modal.push(`      elody:form ui:${op.modal.form} ;`);
        if (!forms.has(op.modal.form)) stubs.add(op.modal.form);
      }
      if (op.modal.relationType) modal.push(`      elody:formRelationType ${q(op.modal.relationType)} ;`);
      if (op.modal.closeConfirmation !== undefined) modal.push(`      elody:closeConfirmation ${op.modal.closeConfirmation} ;`);
      if (op.modal.permission) modal.push(`      elody:permission ${op.modal.permission} ;`);
      if (op.modal.pickerNode) modal.push(`      elody:picker ui:${op.modal.pickerNode} ;`);
      if (op.modal.navigateAfterCreation) modal.push(`      elody:navigateAfterCreation ${q(op.modal.navigateAfterCreation)} ;`);
      for (const t of op.modal.skipRelatedItems ?? []) modal.push(`      elody:skipRelatedItems ${q(t)} ;`);
      if (op.modal.imageCrop !== undefined) modal.push(`      elody:imageCrop ${op.modal.imageCrop} ;`);
      if (op.modal.cropCoordinatesKey) modal.push(`      elody:cropCoordinatesKey ${q(op.modal.cropCoordinatesKey)} ;`);
      if (op.modal.replaceExistingRelations !== undefined) modal.push(`      elody:replaceExistingRelations ${op.modal.replaceExistingRelations} ;`);
      if (op.modal.selectionLimit !== undefined) modal.push(`      elody:selectionLimit ${op.modal.selectionLimit} ;`);
      const suggestion = op.modal.survivorSuggestion;
      if (suggestion) {
        const parts = [`elody:survivorStrategy ${suggestion.strategy ?? "elody:IdentifierIntegrityStrategy"}`];
        if (suggestion.autoSelect !== undefined) parts.push(`elody:autoSelectSurvivor ${suggestion.autoSelect}`);
        if (suggestion.requireRecommendedSurvivor !== undefined) parts.push(`elody:requireRecommendedSurvivor ${suggestion.requireRecommendedSurvivor}`);
        for (const v of suggestion.hiddenVerdicts) parts.push(`elody:hiddenVerdict ${v}`);
        modal.push(`      elody:survivorSuggestion [ ${parts.join(" ; ")} ] ;`);
      }
      modal[modal.length - 1] = modal[modal.length - 1].replace(/ ;$/, " ] ;");
      lines.push(`    elody:modal`, ...modal);
    }
    if (op.subOptions?.length) {
      op.subOptions.forEach((sub, i) => (sub.order = i + 1));
      lines.push(`    elody:subOperation`, op.subOptions.map((sub) => this.writeOperation(sub, stubs, forms).replace(/^/gm, "  ")).join(" ,\n") + " ;");
    }
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ]");
    lines[0] = `    [ ${lines[0].trim()}`;
    return lines.join("\n");
  }

  /** The fragments a file holds for other types to spread: on FormFields, on EntityViewElements, on IntialValues (+ teaserMetadata), on WindowElementPanel, on AdvancedFilters. */
  private sharedFragmentsOf(file: string | undefined, where: string, entity: Entity, byAlias: Map<string, Property>, add: (field: FieldNode, listing: boolean) => void): void {
    // the fragments the file holds for other types to spread: on FormFields, on EntityViewElements, on IntialValues (+ teaserMetadata)
    const cardTwins = new Map<string, FragmentDefinitionNode>();
    for (const definition of this.definitions.values()) {
      if (definition.kind !== "fragment" || definition.file !== file) continue;
      const fragment = definition.node as FragmentDefinitionNode;
      if (fragment.typeCondition.name.value === "teaserMetadata") cardTwins.set(definition.name, fragment);
    }
    for (const definition of this.definitions.values()) {
      if (definition.kind !== "fragment" || definition.file !== file) continue;
      const fragment = definition.node as FragmentDefinitionNode;
      const on = fragment.typeCondition.name.value;
      if (on === "FormFields") {
        const sharedFields = fields(fragment.selectionSet).filter((f) => f.name.value === "metaData").map((f) => this.formField(f, `${where} fragment ${definition.name}`));
        for (const f of fields(fragment.selectionSet)) if (f.name.value !== "metaData") this.note(`${where}: fragment ${definition.name} field ${f.name.value} has no term; left out`);
        entity.fieldsFragments.push({ name: definition.name, fields: sharedFields });
      } else if (on === "EntityViewElements") {
        const elements = this.elementsOf(fragment.selectionSet, `${where} ${definition.name}`, entity, byAlias);
        if (elements.length) entity.elementsFragments.push({ name: definition.name, elements });
        else this.note(`${where}: fragment ${definition.name} holds nothing the generator renders; it stays hand-written`);
      } else if (on === "WindowElementPanel") {
        // panel fields other types spread into a panel
        const keys: string[] = [];
        for (const field of fields(fragment.selectionSet)) {
          if (field.name.value !== "metaData") {
            this.note(`${where}: fragment ${definition.name} field ${alias(field)} (${field.name.value}) has no term; left out`);
            continue;
          }
          const key = input(child(field, "key")) ?? alias(field);
          let property = entity.properties.find((p) => p.key === key && !p.alias) ?? entity.properties.find((p) => p.key === key);
          if (!property) {
            property = { key, inListing: false, inDetail: true, readsValue: false, teaser: false, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
            if (alias(field) !== key) property.alias = alias(field);
            entity.properties.push(property);
            if (!byAlias.has(alias(field))) byAlias.set(alias(field), property);
          }
          const label = input(child(field, "label"));
          if (label && !property.labelKey) property.labelKey = label;
          else if (label && property.labelKey && label !== property.labelKey) property.detailLabelKey = label;
          const unit = input(child(field, "unit"));
          if (unit && !property.unit) property.unit = this.instance("Unit", unit, `${where} ${key}`);
          const widget = child(field, "inputField");
          if (widget) {
            property.panelWidget = true;
            const type = str(widget, "type") ?? "baseTextField";
            const base = BASE_FIELDS[type];
            if (base) {
              property.editor = property.editor ?? base.editor;
              property.datatype = property.datatype ?? base.datatype;
            } else property.clientField = property.clientField ?? type;
            const validation = this.validation(child(widget, "validation"), `${where} ${definition.name} field ${key}`);
            if (validation.required) property.required = true;
            if (validation.rule) {
              property.validationRule = validation.rule;
              property.validationValue = validation.value;
              property.validationRelationType = validation.relationType;
              property.validationAmount = validation.amount;
              property.validationExact = validation.exact;
            }
          }
          keys.push(property.key);
        }
        if (keys.length) entity.panelFragments.push({ name: definition.name, fields: keys });
      } else if (on === "AdvancedFilters") {
        // filters other types spread into theirs
        const block: FieldNode = { kind: Kind.FIELD, name: { kind: Kind.NAME, value: "advancedFilters" }, selectionSet: fragment.selectionSet };
        const filters = this.filters(block, `${where} ${definition.name}`);
        if (filters.length) entity.filtersFragments.push({ name: definition.name, filters });
      } else if (on === "IntialValues") {
        const keys: string[] = [];
        const aliases: string[] = [];
        const valuesFields: string[] = [];
        for (const field of fields(fragment.selectionSet)) {
          if (field.name.value !== "keyValue") {
            // a plain field of IntialValues (lockedProperties)
            if (!field.arguments?.length && !field.selectionSet && !field.alias) valuesFields.push(field.name.value);
            else this.note(`${where}: fragment ${definition.name} field ${alias(field)} is not a keyValue; left out`);
            continue;
          }
          const before = new Set(entity.properties);
          add(field, false);
          const property = entity.properties.find((p) => (p.alias ?? p.key) === alias(field) && !before.has(p)) ?? byAlias.get(alias(field));
          if (property) {
            // read by the fragment only: neither the listing nor the detail page of this type
            if (!before.has(property)) property.inDetail = false;
            if (property.alias) aliases.push(property.alias);
            else keys.push(property.key);
          }
        }
        const read = (p: Property) => keys.includes(p.key) || (p.alias !== undefined && aliases.includes(p.alias));
        // the twin on teaserMetadata (relatedWorksIntialValues / relatedWorksTeaserMetadata) labels the same fields on a card
        const twinName = definition.name.replace(/TeaserIntialValues$/, "IntialValues").replace(/IntialValues$/, "TeaserMetadata");
        // vocabIntialValues and vocabTeaserIntialValues both name vocabTeaserMetadata: the latter owns the twin
        const owner = /TeaserIntialValues$/.test(definition.name) ? definition.name : definition.name.replace(/IntialValues$/, "TeaserIntialValues");
        const twin = twinName !== definition.name && (owner === definition.name || !this.definitions.has(owner)) ? cardTwins.get(twinName) : undefined;
        let menu: Entity["contextMenu"];
        let cardShows: string[] | undefined;
        if (twin) {
          const shown = new Set<string>();
          cardTwins.delete(twinName);
          for (const field of fields(twin.selectionSet)) {
            if (field.name.value === "buttons" && child(field, "contextMenu")) {
              menu = { ...this.contextMenu(child(field, "contextMenu")!, `${where} ${twinName}`)!, inButtons: true, forceShow: false };
              continue;
            }
            if (!["metaData", "relationRootData", "relationMetaData"].includes(field.name.value)) {
              this.note(`${where}: fragment ${twinName} field ${alias(field)} (${field.name.value}) has no term; left out`);
              continue;
            }
            const key = input(child(field, "key")) ?? alias(field);
            // the card field's key(input:) names the value alias; else its own alias; else the key
            let property =
              entity.properties.find((p) => read(p) && (p.alias ?? p.key) === key) ??
              entity.properties.find((p) => read(p) && (p.alias ?? p.key) === alias(field)) ??
              entity.properties.find((p) => read(p) && p.key === key);
            if (!property) {
              // shown on the card alone: no value of its own
              property = { key, inListing: false, inDetail: false, readsValue: false, teaser: false, sortable: false, single: true, required: false, readOnly: false, labelRole: false };
              if (alias(field) !== key) property.alias = alias(field);
              entity.properties.push(property);
              if (!byAlias.has(alias(field))) byAlias.set(alias(field), property);
              if (property.alias) aliases.push(property.alias);
              else keys.push(property.key);
            }
            property.labelKey = input(child(field, "label")) ?? property.labelKey;
            if (key !== (property.alias ?? property.key)) property.cardKey = key;
            this.applyCardField(property, field, key, where);
            shown.add(property.alias ?? property.key);
          }
          // the card shows some of the values only
          const all = entity.properties.filter((p) => read(p)).map((p) => p.alias ?? p.key);
          if (all.some((v) => !shown.has(v))) cardShows = all.filter((v) => shown.has(v));
        }
        entity.valuesFragments.push({ name: definition.name, cardName: twin ? twinName : undefined, fields: keys, aliases, valuesFields, cardShows, contextMenu: menu });
      }
    }
    for (const name of cardTwins.keys()) this.note(`${where}: fragment ${name} on teaserMetadata has no IntialValues twin; left out`);
  }

  /** A file holding shared fragments alone (no type of its own): declared as a fragments-only entity named after the file. */
  /**
   * The orphan documents: queries nothing in these files references and no type claimed. An entities, filters,
   * custom bulk operations or sort options document is declared on the type whose file holds it (a file without
   * a type gets a fragments-only declaration); the rest is noted.
   */
  orphans(entities: Entity[]): Entity[] {
    const texts = new Map<string, string>();
    for (const d of this.definitions.values()) texts.set(d.name, print(d.node));
    const referenced = (name: string) => {
      const word = new RegExp(`(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)`);
      for (const [other, text] of texts) if (other !== name && word.test(text)) return true;
      return false;
    };
    const handled = new Set<string>();
    for (const entity of entities) {
      for (const suffix of ["Entities", "Filters", "SortOptions", "BulkOperations", "CreateForm"]) handled.add(`Get${entity.documentName}${suffix}`);
      if (entity.form) handled.add(entity.form.queryName);
      for (const form of entity.forms) handled.add(form.queryName);
      for (const flow of entity.flows) handled.add(flow.queryName);
      for (const source of entity.formSources) handled.add(source.queryName);
      for (const custom of entity.customOperations) handled.add(custom.name);
      for (const lq of [...entity.listQueries, ...entity.pickers]) {
        handled.add(lq.name);
        if (lq.filtersName) handled.add(lq.filtersName);
      }
      if (entity.documents.includes("currentUser")) handled.add("getElodyUser");
    }
    for (const name of [...this.declaredCustomOps, ...this.formSourceNames, ...this.previewLayoutNames]) handled.add(name);
    const added: Entity[] = [];
    const ownerOf = (file: string): Entity => {
      const own = entities.find((e) => e.documentName === e.graphqlType && !e.fragmentsOnly && this.definitions.get(this.anchorOf(e.documentName)?.name.value ?? "")?.file === file);
      if (own) return own;
      const shared = [...entities, ...added].find((e) => e.fragmentsOnly && e.filePath === file);
      if (shared) return shared;
      const fresh = this.sharedFile(file);
      added.push(fresh);
      return fresh;
    };
    const taken = new Set<string>();
    for (const d of [...this.definitions.values()]) {
      // the platform document (queries/<client>.queries.ts) is the PWA's, not a type's: its documents are not swept
      if (d.kind !== "query" || !/(^|\/)queries\/entities\//.test(d.file) || handled.has(d.name) || taken.has(d.name) || referenced(d.name)) continue;
      const query = d.node as OperationDefinitionNode;
      const top = fields(query.selectionSet)[0]?.name.value;
      const sortField = top === "EntityTypeSortOptions" ? child(fields(query.selectionSet)[0], "sortOptions") : undefined;
      const sortOptionsField = sortField ? child(sortField, "options") : undefined;
      const sortEntries = sortOptionsField ? list(argument(sortOptionsField, "input")).filter((v): v is ObjectValueNode => v.kind === Kind.OBJECT) : [];
      const declarable = top === "Entities" || top === "EntityTypeFilters" || top === "CustomBulkOperations" || sortEntries.length > 0;
      if (!declarable) {
        this.note(`${d.file.replace(/^.*\//, "")}: nothing references the query ${d.name} and it has no term; it stays hand-written`);
        continue;
      }
      const owner = ownerOf(d.file);
      const where = `${owner.documentName} orphan`;
      if (top === "Entities") {
        // its filters document, by name, when that is an orphan too
        const candidates = [`${d.name}Filters`, d.name.replace("List", "Filters"), d.name.replace("Entities", "Filters")];
        const filters = candidates.find((c) => c !== d.name && this.definitions.get(c)?.kind === "query" && !handled.has(c) && !referenced(c));
        const node = this.listQuery(d.name, filters, where, owner);
        if (filters) taken.add(filters);
        if (!owner.entityListQueries.includes(node)) owner.entityListQueries.push(node);
        this.note(`${where}: nothing references the entities document ${d.name}; declared on the type as a list query`);
      } else if (top === "EntityTypeFilters") {
        const node = this.listQuery(d.name, d.name, where, owner);
        const lq = owner.listQueries.find((l) => l.node === node);
        if (lq) lq.filtersOnly = true;
        if (!owner.entityListQueries.includes(node)) owner.entityListQueries.push(node);
        this.note(`${where}: nothing references the filters document ${d.name}; declared on the type as a list query with filters alone`);
      } else if (top === "CustomBulkOperations") {
        this.customOperations(d.name, where, owner);
        this.note(`${where}: nothing references the custom bulk operations ${d.name}; declared on the type`);
      } else if (sortEntries.length) {
        owner.sortDocuments.push({
          queryName: d.name,
          options: sortEntries.map((entry) => ({ labelKey: scalar(objectField(entry, "label")) ?? "", value: scalar(objectField(entry, "value")) ?? "", primary: objectField(entry, "primary") ? scalar(objectField(entry, "primary")) === "true" : undefined, icon: scalar(objectField(entry, "icon")) })),
        });
        this.note(`${where}: nothing references the sort options document ${d.name}; declared on the type as a sort document`);
      }
    }
    return added;
  }

  sharedFile(file: string): Entity {
    const name = file.replace(/^.*\//, "").replace(/\.queries\.ts$/, "");
    const entity: Entity = {
      documentName: name,
      graphqlType: "Entity",
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
      flows: [],
      formSources: [],
      entityListQueries: [],
      fieldsFragments: [],
      elementsFragments: [],
      valuesFragments: [],
      panelFragments: [],
      filtersFragments: [],
      sortDocuments: [],
      fragmentsOnly: true,
      filePath: file,
    };
    const byAlias = new Map<string, Property>();
    // a value read by a shared fragment: its key, source and labels, nothing of a page
    const add = (field: FieldNode, _listing: boolean) => {
      const a = alias(field);
      const key = str(field, "key") ?? a;
      const source = str(field, "source");
      if (byAlias.has(a)) return;
      const property: Property = {
        key: source === "relations" ? a : key,
        source: source && source !== "metadata" && source !== "relations" ? source : undefined,
        relationType: source === "relations" ? key : undefined,
        valueLabelKey: source === "relations" && !str(field, "rootKeyAsLabel") ? (str(field, "metadataKeyAsLabel") ?? "") : undefined,
        valueLabelRootKey: str(field, "rootKeyAsLabel"),
        index: str(field, "index") !== undefined ? Number(str(field, "index")) : undefined,
        formatter: str(field, "formatter"),
        relationKey: str(field, "relationKey"),
        readsHost: argument(field, "uuid")?.kind === Kind.VARIABLE ? true : undefined,
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
    };
    this.sharedFragmentsOf(file, name, entity, byAlias, add);
    return entity;
  }

  /** The files holding shared fragments and no type of their own. */
  sharedFiles(): string[] {
    const anchored = new Set([...this.definitions.values()].filter((d) => d.kind === "fragment" && d.name.startsWith("minimal")).map((d) => d.file));
    const shared = new Set<string>();
    for (const d of this.definitions.values()) {
      if (d.kind !== "fragment" || anchored.has(d.file)) continue;
      const on = (d.node as FragmentDefinitionNode).typeCondition.name.value;
      if (["IntialValues", "teaserMetadata", "WindowElementPanel", "AdvancedFilters", "FormFields", "EntityViewElements"].includes(on)) shared.add(d.file);
    }
    return [...shared].sort();
  }

  /** What a card field says beyond its label: the unit, the column span, the field it is shown as, its widget. */
  private applyCardField(property: Property, field: FieldNode, key: string, where: string): void {
    if (input(child(field, "isMultilingual")) === "true") property.multilingual = true;
    const unit = input(child(field, "unit"));
    if (unit) property.unit = this.instance("Unit", unit, `${where} ${key}`);
    const colSpan = input(child(field, "colSpan"));
    if (colSpan) property.colSpan = Number(colSpan);
    if (field.name.value !== "metaData") property.cardField = field.name.value;
    // a card edited in place: the input field sits on the card field
    const widget = child(field, "inputField");
    if (widget) {
      property.cardEditable = true;
      const type = str(widget, "type") ?? "baseTextField";
      const base = BASE_FIELDS[type];
      if (base) {
        property.editor = property.editor ?? base.editor;
        property.datatype = property.datatype ?? base.datatype;
      } else property.clientField = property.clientField ?? type;
      const validation = this.validation(child(widget, "validation"), `${where} card field ${key}`);
      if (validation.required) property.required = true;
      if (validation.rule) {
        property.validationRule = validation.rule;
        property.validationValue = validation.value;
      }
      if (!child(widget, "validation")) property.cardValidates = false;
    }
  }

  /** The lines of an elody:contextMenu node (the card's or a window's), the first one opening the bracket. */
  private contextMenuNode(contextMenu: NonNullable<Entity["contextMenu"]>): string[] {
    const menu: string[] = [];
    if (contextMenu.forceShow) menu.push(`    elody:forceShow true ;`);
    if (contextMenu.basic) menu.push(`    elody:includeBasicActions true ;`);
    if (contextMenu.inButtons) menu.push(`    elody:menuInButtons true ;`);
    for (const spread of contextMenu.spreads ?? []) menu.push(`    elody:menuSpread ${q(spread)} ;`);
    const actions = contextMenu.actions.map((action, i) => {
      const a = [`      [ sh:order ${i + 1} ;`, `      elody:alias ${q(action.alias)} ;`];
      if (action.form) a.push(`      elody:actionForm ${q(action.form)} ;`);
      if (action.label) a.push(`      rdfs:label ${q(action.label)} ;`);
      if (action.kind) a.push(`      elody:actionKind ${action.kind} ;`);
      if (action.icon) a.push(`      elody:icon ${q(action.icon)} ;`);
      if (action.formFlow) a.push(`      elody:formFlow ${q(action.formFlow)} ;`);
      if (action.formTitle) a.push(`      elody:formTitle ${q(action.formTitle)} ;`);
      if (action.endpointUrl) a.push(`      elody:endpointUrl ${q(action.endpointUrl)} ;`);
      if (action.endpointMethod) a.push(`      elody:endpointMethod ${q(action.endpointMethod)} ;`);
      if (action.showAsButton !== undefined) a.push(`      elody:showAsButton ${action.showAsButton} ;`);
      for (const can of action.can ?? []) a.push(`      elody:can ${q(can)} ;`);
      if (action.formQuery && this.formSourceNames.has(action.formQuery)) a.push(`      elody:formSourceRef ui:${action.formQuery} ;`);
      else if (action.formQuery) {
        a.push(`      elody:form ui:${action.formQuery} ;`);
        this.stubs.add(action.formQuery);
      }
      a[a.length - 1] = a[a.length - 1].replace(/ ;$/, " ]");
      return a.join("\n");
    });
    if (actions.length) menu.push(`    elody:action`, actions.join(" ,\n") + " ;");
    if (!menu.length) return [];
    menu[menu.length - 1] = menu[menu.length - 1].replace(/ ;$/, " ] ;");
    return [`    [ ${menu[0].trim()}`, ...menu.slice(1)];
  }

  /** The node of a list element (in a column or a panel), at the given indentation. */
  private listElementNode(element: Extract<Element, { kind: "list" }>, order: number, pad: string, forms: Set<string>): string {
    // a list without a label (one inside a panel) carries none
    const l = [`${pad}[ a elody:ListElement ;`, ...(element.label !== undefined ? [`${pad}rdfs:label ${q(element.label)} ;`] : []), `${pad}sh:order ${order} ;`];
    if (element.alias) l.push(`${pad}elody:alias ${q(element.alias)} ;`);
    if (element.mediaKind) l.push(`${pad}elody:mediaKind ${element.mediaKind} ;`);
    l.push(`${pad}elody:collapsed ${element.collapsed} ;`);
    for (const type of element.entityTypes) l.push(`${pad}elody:entityTypes ${q(type)} ;`);
    if (element.relationType) l.push(`${pad}elody:relationType ${q(element.relationType)} ;`);
    if (element.customQueryRelationType) l.push(`${pad}elody:customQueryRelationType ${q(element.customQueryRelationType)} ;`);
    if (element.listViewMode) l.push(`${pad}elody:listViewMode ${q(element.listViewMode)} ;`);
    for (const can of element.can ?? []) l.push(`${pad}elody:can ${q(can)} ;`);
    if (element.hideInHistory) l.push(`${pad}elody:hideInHistory true ;`);
    if (element.disableLibraryBar) l.push(`${pad}elody:disableLibraryBar true ;`);
    if (element.enableNavigation !== undefined) l.push(`${pad}elody:enableNavigation ${element.enableNavigation} ;`);
    if (element.libraryMode) l.push(`${pad}elody:libraryMode ${q(element.libraryMode)} ;`);
    if (element.searchInput) l.push(`${pad}elody:searchInput ${element.searchInput} ;`);
    if (element.listQuery) l.push(`${pad}elody:listQuery ui:${element.listQuery} ;`);
    else {
      if (element.customQuery) l.push(`${pad}elody:customQuery ${q(element.customQuery)} ;`);
      if (element.customQueryFilters) l.push(`${pad}elody:customQueryFilters ${q(element.customQueryFilters)} ;`);
    }
    if (element.customBulkOperations) l.push(`${pad}elody:customBulkOperations ui:${element.customBulkOperations} ;`);
    if (element.picker) l.push(`${pad}elody:picker ui:${element.picker} ;`);
    if (element.cropCoordinatesKey) l.push(`${pad}elody:cropCoordinatesKey ${q(element.cropCoordinatesKey)} ;`);
    if (element.addEntitiesToForms !== undefined) l.push(`${pad}elody:addEntitiesToForms ${element.addEntitiesToForms} ;`);
    if (element.actionsOnResult) {
      const ops = element.actionsOnResult.operations;
      ops.forEach((op, i) => (op.order = i + 1));
      l.push(`${pad}elody:actionsOnResult [ elody:resultKind ${element.actionsOnResult.kind ?? "elody:NoResult"} ;`);
      if (ops.length) l.push(`${pad}  elody:operation`, ops.map((op) => this.writeOperation(op, this.stubs, forms).replace(/^/gm, `${pad}  `)).join(" ,\n") + " ] ;");
      else l[l.length - 1] = l[l.length - 1].replace(/ ;$/, " ] ;");
    }
    l[l.length - 1] = l[l.length - 1].replace(/ ;$/, " ]");
    return l.join("\n");
  }

  /** The node of one detail element (a window with its panels, a list, ...), numbered in its column or fragment. */
  private elementNode(element: Element, e: number, name: string, panelNodes: string[], panelIds: Set<string>, forms: Set<string>): string {
          if (element.kind === "window") {
      const panels = element.panels.map((panel) => {
        let id = `ui:${name}Ui-${panel.alias}`;
        // two windows may both hold an unaliased panel: the second gets a numbered id
        for (let n = 2; panelIds.has(id); n++) id = `ui:${name}Ui-${panel.alias}-${n}`;
        panelIds.add(id);
        const p: string[] = [`${id}`, `  a elody:Panel ;`, ...(panel.header === false ? [] : [`  rdfs:label ${q(panel.label ?? "")} ;`]), `  sh:order 1 ;`, `  elody:alias ${q(panel.alias)} ;`];
        if (panel.header === false) p.push(`  elody:panelHeader false ;`);
        p.push(`  elody:collapsed ${panel.collapsed} ;`);
        if (!panel.editable) p.push(`  dash:readOnly true ;`);
        if (panel.editableDefault) p.push(`  elody:editableDefault true ;`);
        if (panel.multipleColumns !== undefined) p.push(`  elody:multipleColumns ${panel.multipleColumns} ;`);
        if (panel.can) p.push(`  elody:can ${q(panel.can)} ;`);
        if (panel.repetitionKey) p.push(`  elody:repetitionKey ${q(panel.repetitionKey)} ;`);
        if (panel.displayConditionKey) p.push(`  elody:displayConditionKey ${q(panel.displayConditionKey)} ;`);
        if (panel.bulkDataSource) p.push(`  elody:bulkDataSource ${q(panel.bulkDataSource)} ;`);
        for (const o of panel.overrides) {
          const parts = [`elody:field em:${o.key}`, ...(o.labelKey ? [`elody:labelKey ${q(o.labelKey)}`] : []), ...(o.alias ? [`elody:alias ${q(o.alias)}`] : []), ...(o.widget !== undefined ? [`elody:panelWidget ${o.widget}`] : [])];
          p.push(`  elody:panelField [ ${parts.join(" ; ")} ] ;`);
        }
        for (const s of panel.spreads) p.push(`  elody:spread ${q(s)} ;`);
        if (panel.kind) p.push(`  elody:panelKind ${panel.kind} ;`);
        if (panel.fields.length) p.push(`  elody:field ${panel.fields.map((f) => `em:${f}`).join(" , ")} ;`);
        if (panel.elements.length)
          p.push(`  elody:element`, panel.elements.map((element, i) => (element.kind === "list" ? this.listElementNode(element, element.order ?? i + 1, "    ", forms) : "")).filter(Boolean).join(" ,\n") + " ;");
        p[p.length - 1] = p[p.length - 1].replace(/ ;$/, " .");
        panelNodes.push(p.join("\n"));
        return id;
      });
      const w = [`      [ a elody:WindowElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`];
      if (element.alias) w.push(`      elody:alias ${q(element.alias)} ;`);
      if (element.expandButton !== undefined) w.push(`      elody:expandButton ${element.expandButton} ;`);
      if (element.windowLayout) w.push(`      elody:windowLayout ${element.windowLayout} ;`);
      if (element.editButton) w.push(`      elody:editButton true ;`);
      if (element.hideInHistory) w.push(`      elody:hideInHistory true ;`);
      if (element.windowStatus) {
        const status = element.windowStatus;
        const parts = [...(status.labelKey ? [`elody:labelKey ${q(status.labelKey)}`] : []), `elody:statusKey ${q(status.statusKey)}`, `elody:statusInputField ${q(status.statusInputField)}`];
        w.push(`      elody:windowStatus [ ${parts.join(" ; ")} ] ;`);
      }
      for (const spread of element.panelSpreads) w.push(`      elody:panelSpread ${q(spread)} ;`);
      if (element.contextMenu) {
        const menu = this.contextMenuNode(element.contextMenu);
        if (menu.length) w.push(`      elody:contextMenu`, ...menu.map((line) => `    ${line}`));
      }
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
    if (element.kind === "entityViewer")
      return [`      [ a elody:EntityViewerElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`, element.relationType ? `      elody:relationType ${q(element.relationType)} ]` : `      elody:metadataKey ${q(element.metadataKey ?? "")} ]`].join("\n");
    if (element.kind === "singleMedia")
      return [`      [ a elody:SingleMediaFileElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`, `      elody:collapsed ${element.collapsed} ]`].join("\n");
    if (element.kind === "comments") {
      const s = [`      [ a elody:CommentsElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`];
      if (element.alias) s.push(`      elody:alias ${q(element.alias)} ;`);
      if (element.parentFilterKey) s.push(`      elody:parentFilterKey ${q(element.parentFilterKey)} ;`);
      if (element.readOnly) s.push(`      dash:readOnly true ;`);
      for (const [i, field] of element.createFields.entries())
        s.push(`      elody:createField [ sh:order ${i + 1} ; elody:key ${q(field.key)}${field.labelKey ? ` ; elody:labelKey ${q(field.labelKey)}` : ""}${field.inputType ? ` ; elody:clientInputField ${q(field.inputType)}` : ""} ] ;`);
      const c = element.composer;
      if (c) {
        const lines = [`      elody:composer [ a elody:WysiwygElement ;`, ...(c.label ? [`        rdfs:label ${q(c.label)} ;`] : []), `        elody:metadataKey ${q(c.metadataKey)} ;`];
        if (c.extensions.length) lines.push(`        elody:extensions ( ${c.extensions.join(" ")} ) ;`);
        if (c.editorStyles) lines.push(`        elody:editorStyles ${q(c.editorStyles)} ;`);
        if (c.multilingual) lines.push(`        elody:multilingual true ;`);
        for (const [i, t] of c.taggables.entries()) {
          const parts = [`sh:order ${i + 1}`, ...(t.tag ? [`elody:tag ${q(t.tag)}`] : []), `elody:entityType ${q(t.entityType)}`, `elody:relationType ${q(t.relationType)}`];
          if (t.filterKey) parts.push(`elody:tagFilterKey ${q(t.filterKey)}`);
          if (t.triggerCharacter) parts.push(`elody:triggerCharacter ${q(t.triggerCharacter)}`);
          if (t.triggerMinCharacters !== undefined) parts.push(`elody:triggerMinCharacters ${t.triggerMinCharacters}`);
          if (t.flowQuery) parts.push(`elody:flow ui:${t.flowQuery}`);
          if (t.flowButtonLabel) parts.push(`elody:flowButtonLabel ${q(t.flowButtonLabel)}`);
          lines.push(`        elody:taggable [ ${parts.join(" ; ")} ] ;`);
        }
        lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ] ;");
        s.push(...lines);
      }
      s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
      return s.join("\n");
    }
    if (element.kind === "map") {
      const s = [`      [ a elody:MapElement ;`, `      rdfs:label ${q(element.label ?? "")} ;`, `      sh:order ${e + 1} ;`, `      elody:collapsed ${element.collapsed} ;`];
      if (element.mapType) s.push(`      elody:mapType ${element.mapType} ;`);
      if (element.center) s.push(`      elody:center ${q(element.center)} ;`);
      if (element.wktKey) s.push(`      elody:wktKey ${q(element.wktKey)} ;`);
      if (element.config.length) s.push(`      elody:config ${element.config.map((entry) => `[ elody:key ${q(entry.key)} ; elody:value ${this.configLiteral(entry.value)} ]`).join(" , ")} ;`);
      s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
      return s.join("\n");
    }
    return this.listElementNode(element, e + 1, "      ", forms);
  }

  /** The property shape of one form field. */
  private formFieldNode(field: FormField, i: number): string {
        const s = [`      [ sh:path em:${field.key} ;`];
    if (field.label) s.push(`      sh:name ${q(field.label.split(".").pop() ?? field.key)}@en ;`);
    s.push(`      sh:order ${i + 1} ;`);
    if (field.alias) s.push(`      elody:alias ${q(field.alias)} ;`);
    if (field.datatype) s.push(`      sh:datatype ${field.datatype} ;`);
    s.push(`      sh:maxCount 1 ;`);
    if (field.required) s.push(`      sh:minCount 1 ;`);
    if (field.validationRule) s.push(`      elody:validationRule ${q(field.validationRule)} ;`);
    if (field.validationValue !== undefined) s.push(`      elody:validationValue ${q(field.validationValue)} ;`);
    if (field.validationRelationType) s.push(`      elody:validationRelationType ${q(field.validationRelationType)} ;`);
    if (field.validationAmount !== undefined) s.push(`      elody:validationAmount ${field.validationAmount} ;`);
    if (field.validationExact !== undefined) s.push(`      elody:validationExact ${field.validationExact} ;`);
    if (field.hidden) s.push(`      dash:hidden true ;`);
    if (field.tooltipKey) s.push(`      elody:tooltipKey ${q(field.tooltipKey)} ;`);
    if (field.validationMessage) s.push(`      elody:validationMessage ${q(field.validationMessage)} ;`);
    if (field.defaultValue !== undefined) s.push(`      sh:defaultValue ${q(field.defaultValue)} ;`);
    if (field.noWidget) s.push(`      elody:noWidget true ;`);
    if (field.virtualKeyboardLayouts?.length) s.push(`      elody:virtualKeyboardLayouts ( ${field.virtualKeyboardLayouts.map(q).join(" ")} ) ;`);
    if (field.pickerSearch) {
      const search = field.pickerSearch;
      const parts = [`elody:pickerSearchMode ${q(search.mode)}`, ...(search.keys.length ? [`elody:keys ( ${search.keys.map(q).join(" ")} )`] : []), ...search.acceptedTypes.map((t) => `elody:acceptedTypes ${q(t)}`)];
      s.push(`      elody:pickerSearch [ ${parts.join(" ; ")} ] ;`);
    }
    if (field.editor && !field.noWidget) s.push(`      shui:editor ${field.editor} ;`);
    if (field.clientField) s.push(`      elody:clientInputField ${q(field.clientField)} ;`);
    if (field.label) s.push(`      elody:labelKey ${q(field.label)} ;`);
    s[s.length - 1] = s[s.length - 1].replace(/ ;$/, " ]");
    return s.join("\n");
  }

  private writeEntity(entity: Entity, formNodes: Set<string>): string {
    const name = entity.documentName;
    const node = `ui:${name}Ui`;
    const out: string[] = [`${node}`, `  a elody:EntityUi ;`, `  elody:graphqlType ${q(entity.graphqlType)} ;`];
    if (entity.documentName !== entity.graphqlType) out.push(`  elody:documentName ${q(entity.documentName)} ;`);
    out.push(`  elody:emit ${entity.inline ? '"inline"' : '"file"'} ;`);
    if (entity.fragmentsOnly) out.push(`  elody:fragmentsOnly true ;`);
    if (entity.filePath) out.push(`  elody:filePath ${q(entity.filePath)} ;`);
    if (entity.cardName) out.push(`  elody:cardName ${q(entity.cardName)} ;`);
    if (entity.documents.length) out.push(`  elody:documents ${entity.documents.map(q).join(" , ")} ;`);
    if (entity.typePills) out.push(`  elody:typePills true ;`);
    if (entity.relationValues !== undefined) out.push(`  elody:relationValues ${entity.relationValues} ;`);
    if (entity.readsPermissions) out.push(`  elody:readsPermissions true ;`);
    if (entity.mapFeatureFields?.length) out.push(`  elody:mapFeatureField ${entity.mapFeatureFields.map((f) => `em:${f}`).join(" , ")} ;`);
    if (entity.idField) out.push(`  elody:idField true ;`);
    if (entity.viewModesOnDetail) out.push(`  elody:viewModesOnDetail true ;`);
    if (entity.idValue) out.push(`  elody:idValue true ;`);
    if (entity.interface) out.push(`  elody:interface true ;`);
    if (entity.listingCore) out.push(`  elody:listingCore true ;`);
    if (entity.entityListQueries.length) out.push(`  elody:listQuery ${entity.entityListQueries.map((n) => `ui:${n}`).join(" , ")} ;`);
    if (entity.deleteOptions) {
      const d = entity.deleteOptions;
      const parts = [
        ...(d.deleteEntityLabel !== undefined ? [`elody:deleteEntityLabel ${q(d.deleteEntityLabel)}`] : []),
        ...(d.deleteRelationsQuery ? [`elody:deleteRelationsQuery ${q(d.deleteRelationsQuery)}`] : []),
        ...(d.deleteRelationsFilters ? [`elody:deleteRelationsFilters ${q(d.deleteRelationsFilters)}`] : []),
        ...(d.deleteRelationsTypes.length ? [`elody:deleteRelationsTypes ( ${d.deleteRelationsTypes.map(q).join(" ")} )`] : []),
        ...(d.deleteRelationsLabel !== undefined ? [`elody:deleteRelationsLabel ${q(d.deleteRelationsLabel)}`] : []),
        ...(d.blockingRelationsQuery ? [`elody:blockingRelationsQuery ${q(d.blockingRelationsQuery)}`] : []),
        ...(d.blockingRelationsFilters ? [`elody:blockingRelationsFilters ${q(d.blockingRelationsFilters)}`] : []),
        ...(d.blockingRelationsTypes.length ? [`elody:blockingRelationsTypes ( ${d.blockingRelationsTypes.map(q).join(" ")} )`] : []),
        ...(d.blockingRelationsLabel !== undefined ? [`elody:blockingRelationsLabel ${q(d.blockingRelationsLabel)}`] : []),
      ];
      out.push(`  elody:deleteOptions`, `    [ ${parts.join(" ;\n      ")} ] ;`);
    }
    if (entity.detailFormatters === false) out.push(`  elody:detailFormatters false ;`);
    if (entity.excludeBaseSortOptions) out.push(`  elody:excludeBaseSortOptions true ;`);
    if (entity.filtersFragmentName) out.push(`  elody:filtersFragmentName ${q(entity.filtersFragmentName)} ;`);
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
      if (!entity.inline) this.note(`${name}: no initial values; a placeholder property is declared`);
      properties.push({ key: "title", order: 1, inListing: true, inDetail: true, readsValue: !entity.inline, teaser: !entity.inline, sortable: false, single: true, required: false, readOnly: false, labelRole: true });
    }
    out.push(`  sh:property`, properties.map((p) => this.property(p)).join(" ,\n") + " ;");

    // the detail layout
    const panelNodes: string[] = [];
    const panelIds = new Set<string>();
    // the fragments the file holds for other types
    for (const fragment of entity.fieldsFragments) {
      const shapes = fragment.fields.map((field, i) => this.formFieldNode(field, i));
      out.push(`  elody:fieldsFragment`, `    [ elody:fragmentName ${q(fragment.name)} ;`, `    elody:shape`, ...(shapes.length ? [`      [ sh:property`, shapes.join(" ,\n").replace(/^/gm, "  ") + " ] ] ;"] : ["      [ ] ] ;"]));
    }
    for (const fragment of entity.elementsFragments) {
      const nodes = fragment.elements.map((element, e) => this.elementNode(element, e, name, panelNodes, panelIds, formNodes));
      out.push(`  elody:elementsFragment`, `    [ elody:fragmentName ${q(fragment.name)} ;`, `    elody:element`, nodes.join(" ,\n") + " ] ;");
    }
    for (const fragment of entity.valuesFragments) {
      const refs = [
        ...(fragment.fields.length ? [`elody:field ${fragment.fields.map((f) => `em:${f}`).join(" , ")}`] : []),
        ...(fragment.aliases.length ? [`elody:fieldAlias ${fragment.aliases.map(q).join(" , ")}`] : []),
        ...(fragment.valuesFields.length ? [`elody:valuesField ${fragment.valuesFields.map(q).join(" , ")}`] : []),
        ...(fragment.cardShows?.length ? [`elody:cardShows ${fragment.cardShows.map(q).join(" , ")}`] : []),
      ];
      const head = `    [ elody:fragmentName ${q(fragment.name)} ;${fragment.cardName ? ` elody:cardFragmentName ${q(fragment.cardName)} ;` : ""} ${refs.join(" ; ")}`;
      const menu = fragment.contextMenu ? this.contextMenuNode(fragment.contextMenu) : [];
      if (menu.length) out.push(`  elody:valuesFragment`, `${head} ;`, `    elody:contextMenu`, ...menu.map((line) => `  ${line}`).slice(0, -1), `  ${menu[menu.length - 1].replace(/ \] ;$/, " ] ] ;")}`);
      else out.push(`  elody:valuesFragment`, `${head} ] ;`);
    }
    for (const fragment of entity.panelFragments) out.push(`  elody:panelFragment`, `    [ elody:fragmentName ${q(fragment.name)} ; elody:field ${fragment.fields.map((f) => `em:${f}`).join(" , ")} ] ;`);
    for (const fragment of entity.filtersFragments) {
      fragment.filters.forEach((f, index) => (f.order = index + 1));
      out.push(`  elody:filtersFragment`, `    [ elody:fragmentName ${q(fragment.name)} ;`, `    elody:filter`, fragment.filters.map((f) => this.filter(f).replace(/^/gm, "  ")).join(" ,\n") + " ] ;");
    }
    const extra: string[] = [];
    const columnNodes = (columnList: Column[]) =>
      columnList.map((column, c) => {
        const lines = [`    [ sh:order ${c + 1} ;`];
        if (column.alias) lines.push(`    elody:alias ${q(column.alias)} ;`);
        if (column.size) lines.push(`    elody:size ${column.size} ;`);
        for (const spread of column.elementSpreads) lines.push(`    elody:elementSpread ${q(spread)} ;`);
        const elements = column.elements.map((element, e) => this.elementNode(element, e, name, panelNodes, panelIds, formNodes));
        if (elements.length) lines.push(`    elody:element`, elements.join(" ,\n") + " ]");
        else lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " ]");
        return lines.join("\n");
      });
    if (entity.preview) {
      const p = entity.preview;
      const parts = [`elody:previewKind ${p.kind ?? "elody:ColumnListPreview"}`, `elody:coverage ${p.coverage ?? "elody:OneListItem"}`];
      if (p.fragmentName) parts.push(`elody:fragmentName ${q(p.fragmentName)}`);
      if (p.labelKey) parts.push(`elody:labelKey ${q(p.labelKey)}`);
      if (p.openByDefault !== undefined) parts.push(`elody:openByDefault ${p.openByDefault}`);
      if (p.showCurrentPreviewFlow !== undefined) parts.push(`elody:showCurrentPreviewFlow ${p.showCurrentPreviewFlow}`);
      if (p.keepLastActiveItemHighlighted !== undefined) parts.push(`elody:keepLastActiveItemHighlighted ${p.keepLastActiveItemHighlighted}`);
      if (p.displayOpenDetailPageButton !== undefined) parts.push(`elody:displayOpenDetailPageButton ${p.displayOpenDetailPageButton}`);
      if (p.layout) parts.push(`elody:previewLayout ui:${p.layout.queryName}`);
      if (p.metadataLayout) parts.push(`elody:metadataPreviewLayout ui:${p.metadataLayout.queryName}`);
      out.push(`  elody:preview [ ${parts.join(" ; ")} ] ;`);
      for (const layout of [p.layout, p.metadataLayout]) {
        if (!layout) continue;
        const lines = [`ui:${layout.queryName}`, `  a elody:PreviewLayout ;`, `  elody:queryName ${q(layout.queryName)} ;`];
        if (layout.columns.length) lines.push(`  elody:column`, columnNodes(layout.columns).join(" ,\n") + " .");
        else lines[lines.length - 1] = lines[lines.length - 1].replace(/ ;$/, " .");
        extra.push(lines.join("\n"));
      }
    }
    if (entity.columns.length) {
      const columns = columnNodes(entity.columns);
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
      const menu = this.contextMenuNode(entity.contextMenu);
      if (menu.length) out.push(`  elody:contextMenu`, ...menu);
    }


    // form, bulk operations, custom bulk operations
    const allForms = [...(entity.form ? [entity.form] : []), ...entity.forms];
    if (allForms.length) out.push(`  elody:form ${allForms.map((f) => `ui:${f.queryName}`).join(" , ")} ;`);
    if (entity.flows.length) out.push(`  elody:guidedFlow ${entity.flows.map((f) => `ui:${f.queryName}`).join(" , ")} ;`);
    if (entity.formSources.length) out.push(`  elody:formSource ${entity.formSources.map((f) => `ui:${f.queryName}`).join(" , ")} ;`);
    for (const flow of entity.flows) {
      const lines = [`ui:${flow.queryName}`, `  a elody:GuidedFlow ;`, ...(flow.label !== undefined ? [`  rdfs:label ${q(flow.label)} ;`] : []), `  elody:queryName ${q(flow.queryName)} ;`];
      if (flow.repeatable !== undefined) lines.push(`  elody:repeatable ${flow.repeatable} ;`);
      if (flow.refetchOnFinish !== undefined) lines.push(`  elody:refetchOnFinish ${flow.refetchOnFinish} ;`);
      if (flow.linear !== undefined) lines.push(`  elody:linear ${flow.linear} ;`);
      if (flow.startOnFirstStep !== undefined) lines.push(`  elody:startOnFirstStep ${flow.startOnFirstStep} ;`);
      if (flow.returnsSelection !== undefined) lines.push(`  elody:returnsSelection ${flow.returnsSelection} ;`);
      if (flow.routeToStep) lines.push(`  elody:routeToStep ${q(flow.routeToStep)} ;`);
      if (flow.routeToRoute) lines.push(`  elody:routeToRoute ${q(flow.routeToRoute)} ;`);
      if (flow.finalize) lines.push(`  elody:finalize [ elody:fromStep ${q(flow.finalize.fromStep)} ; elody:relationType ${q(flow.finalize.relationType)} ] ;`);
      const steps = flow.steps.map((step, i) => {
        const st = [`    [ sh:order ${i + 1} ;`, `    elody:key ${q(step.key)} ;`];
        if (step.label !== undefined) st.push(`    rdfs:label ${q(step.label)} ;`);
        if (step.entityType) st.push(`    elody:entityType ${q(step.entityType)} ;`);
        if (step.createForm) {
          st.push(`    elody:form ui:${step.createForm} ;`);
          if (!formNodes.has(step.createForm)) this.stubs.add(step.createForm);
        }
        if (step.pickerNode) st.push(`    elody:picker ui:${step.pickerNode} ;`);
        for (const type of step.acceptedTypes) st.push(`    elody:acceptedTypes ${q(type)} ;`);
        if (step.maxSelection !== undefined) st.push(`    elody:maxSelection ${step.maxSelection} ;`);
        if (step.overviewFields.length)
          st.push(`    elody:overviewField ${step.overviewFields.map((f, j) => `[ sh:order ${j + 1} ; elody:key ${q(f.key)}${f.label !== undefined ? ` ; rdfs:label ${q(f.label)}` : ""} ]`).join(" , ")} ;`);
        if (step.showBackButton !== undefined) st.push(`    elody:showBackButton ${step.showBackButton} ;`);
        if (step.skipSearchIfPriorIsNew !== undefined) st.push(`    elody:skipSearchIfPriorIsNew ${step.skipSearchIfPriorIsNew} ;`);
        if (step.pickerFiltersCollapsed !== undefined) st.push(`    elody:pickerFiltersCollapsed ${step.pickerFiltersCollapsed} ;`);
        if (step.metadataOnly !== undefined) st.push(`    elody:metadataOnly ${step.metadataOnly} ;`);
        if (step.terminalActionLabel) st.push(`    elody:terminalActionLabel ${q(step.terminalActionLabel)} ;`);
        if (step.scope) st.push(`    elody:scopeToRelationOf [ elody:fromStep ${q(step.scope.step)} ; elody:relationType ${q(step.scope.relationType)}${step.scope.filterKey ? ` ; elody:filterKey ${q(step.scope.filterKey)}` : ""} ] ;`);
        for (const [j, relation] of (step.relations ?? []).entries()) {
          const metadata = (relation.metadataFields ?? []).map((field, k) => `[ sh:order ${k + 1} ; elody:formMetadataKey ${q(field.formMetadataKey)} ; elody:relationMetadataKey ${q(field.relationMetadataKey)}${field.asArray !== undefined ? ` ; elody:asArray ${field.asArray}` : ""} ]`);
          st.push(`    elody:stepRelation [ sh:order ${j + 1} ; elody:to ${q(relation.to)} ; elody:relationType ${q(relation.relationType)}${relation.createWhen ? ` ; elody:createWhen ${q(relation.createWhen)}` : ""}${metadata.length ? ` ;\n      elody:metadataField ${metadata.join(" , ")}` : ""} ] ;`);
        }
        for (const [j, type] of (step.creatableTypes ?? []).entries()) {
          st.push(`    elody:creatableType [ sh:order ${j + 1}${type.label !== undefined ? ` ; elody:labelKey ${q(type.label)}` : ""} ; elody:entityType ${q(type.entityType)} ; elody:form ui:${type.createForm} ] ;`);
          if (!formNodes.has(type.createForm)) this.stubs.add(type.createForm);
        }
        st[st.length - 1] = st[st.length - 1].replace(/ ;$/, " ]");
        return st.join("\n");
      });
      lines.push(`  elody:step`, steps.join(" ,\n") + " .");
      extra.push(lines.join("\n"));
    }
    for (const source of entity.formSources)
      extra.push([`ui:${source.queryName}`, `  a elody:FormSource ;`, `  elody:queryName ${q(source.queryName)} ;`, `  elody:resolverField ${q(source.field)} ;`, ...(source.withParent ? [`  elody:withParent true ;`] : [])].join("\n").replace(/ ;$/, " ."));
    for (const f of allForms) {
      // a form several types open is written once
      if (formNodes.has(f.queryName)) continue;
      formNodes.add(f.queryName);
      const lines = [`ui:${f.queryName}`, `  a elody:Form ;`, ...(f.label !== undefined ? [`  rdfs:label ${q(f.label)} ;`] : []), `  elody:queryName ${q(f.queryName)} ;`];
      if (f.tabAlias && f.tabAlias !== "name") lines.push(`  elody:alias ${q(f.tabAlias)} ;`);
      for (const spread of f.fieldsSpreads) lines.push(`  elody:fieldsSpread ${q(spread)} ;`);
      if (f.copyFromParent) {
        const parts = [
          ...(f.copyFromParent.autoCopy !== undefined ? [`elody:autoCopy ${f.copyFromParent.autoCopy}`] : []),
          ...(f.copyFromParent.keyMap.length ? [`elody:copyKey ${f.copyFromParent.keyMap.map((entry, i) => `[ sh:order ${i + 1} ; elody:key ${q(entry.key)} ; elody:fromKey ${q(entry.fromKey)} ]`).join(" , ")}`] : []),
        ];
        lines.push(`  elody:copyFromParent [ ${parts.join(" ; ")} ] ;`);
      }
      const shapeFields = f.fields.map((field, i) => this.formFieldNode(field, i));
      lines.push(`  elody:shape`, ...(shapeFields.length ? [`    [ sh:property`, shapeFields.join(" ,\n") + " ] ;"] : ["    [ ] ;"]));
      if (f.submit) {
        const s = [`    [ rdfs:label ${q(f.submit.label ?? "")} ;`];
        if (f.submit.alias) s.push(`    elody:alias ${q(f.submit.alias)} ;`);
        if (f.submit.actionQuery) s.push(`    elody:actionQuery ${q(f.submit.actionQuery)} ;`);
        if (f.submit.creationType) s.push(`    elody:creationType ${q(f.submit.creationType)} ;`);
        if (f.submit.icon) s.push(`    elody:icon ${q(f.submit.icon)} ;`);
        if (f.submit.submitAction) s.push(`    elody:submitAction ${q(f.submit.submitAction)} ;`);
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
    for (const document of entity.sortDocuments) {
      out.push(
        `  elody:sortDocument [ elody:queryName ${q(document.queryName)} ;`,
        `    elody:sortOption ${document.options.map((o, i) => `[ sh:order ${i + 1}${o.icon ? ` ; elody:icon ${q(o.icon)}` : ""} ; elody:labelKey ${q(o.labelKey)} ; elody:value ${q(o.value)}${o.primary ? " ; elody:primary true" : ""} ]`).join(" , ")} ] ;`,
      );
    }
    for (const lq of [...entity.listQueries, ...entity.pickers.map((p) => ({ ...p, picker: true }))]) {
      // a filters document alone: the node is named after it, no entities document
      const lines = [`ui:${lq.node ?? lq.name}`, `  a ${"picker" in lq ? "elody:Picker" : "elody:ListQuery"} ;`, ...(lq.filtersOnly ? [] : [`  elody:queryName ${q(lq.name)} ;`])];
      if (lq.filtersName) lines.push(`  elody:filtersQuery ${q(lq.filtersName)} ;`);
      if (lq.filtersType) lines.push(`  elody:filtersType ${q(lq.filtersType)} ;`);
      if (lq.relationValues) lines.push(`  elody:relationValues true ;`);
      if (lq.readsHost) lines.push(`  elody:readsHost true ;`);
      if (lq.hostOptional) lines.push(`  elody:hostOptional true ;`);
      if (lq.results.length)
        lines.push(
          `  elody:result`,
          lq.results
            .map((r, i) => `    [ elody:graphqlType ${q(r.type)} ; sh:order ${i + 1}${r.fragments.map((f) => ` ; elody:fragment ${q(f)}`).join("")}${r.cardMenuSpread ? ` ; elody:cardMenuSpread ${q(r.cardMenuSpread)}` : ""}${r.listingNode ? ` ; elody:listing ui:${r.listingNode}` : ""} ]`)
            .join(" ,\n") + " ;",
        );
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
  // the files holding shared fragments alone, declared as fragments-only entities
  for (const file of extractor.sharedFiles()) entities.push(extractor.sharedFile(file));
  // the orphan documents: declared on the type whose file holds them (a file without a type gets a declaration of its own)
  entities.push(...extractor.orphans(entities));
  // the listings synthesised for results selected inline, declared after the types that led to them
  for (let name = extractor.inlineNames.shift(); name !== undefined; name = extractor.inlineNames.shift()) entities.push(extractor.entity(name));
  const ttl = extractor.write(entities, options);
  return { ttl, notes: extractor.notes, types };
}
