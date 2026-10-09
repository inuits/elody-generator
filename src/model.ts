/**
 * The UI model a declaration parses into and the renderers read. It is the
 * render contract: every string here is already resolved (enum literals,
 * document names), so the renderers know nothing about RDF.
 */
export type UiConfigEntry = { key: string; value: string | number | boolean | string[] };

export type UiViewMode = { mode: string; order: number; config: UiConfigEntry[] };

export type UiProperty = {
  key: string;
  path?: string;
  label?: string;
  order: number;
  colSpan?: number;
  unit?: string;
  formatter?: string;
  role?: string;
  teaser: boolean;
  /** elody:alias: the GraphQL field name the value is read under, when not the key */
  alias?: string;
  /** elody:clientInputField: the input field the client registers itself for editing this property */
  clientInputField?: string;
  /** elody:detailOnly: read on the detail page only, not in the listing fragment */
  detailOnly: boolean;
  /** elody:listingOnly: read in the listing fragment only */
  listingOnly: boolean;
  /** elody:readsValue false: no initial value is read (a spread or the platform provides it) */
  readsValue: boolean;
  sortable: boolean;
  /** elody:sortLabelKey / elody:sortOrder: the sort option's own label and position */
  sortLabelKey?: string;
  sortOrder?: number;
  defaultSortDirection?: string;
  source?: string;
  index?: number;
  hidden: boolean;
  readOnly: boolean;
  description?: string;
  /** language-tagged text: one value per language (isMultilingual) */
  multilingual: boolean;
  /** sh:languageIn: the order in which its language-tagged values are preferred */
  languageIn: string[];
  /** a field with its own input field on the detail page (a nested shape: inputFieldWithSubFields) */
  inputType?: string;
  /** the widget an editable panel edits it with (the create form's); none when read-only or not writable */
  editInputType?: string;
  /** sh:minCount 1: required when edited */
  required: boolean;
  /** elody:sortPrimary: the primary sort option; elody:listingFormatter false: the listing reads the value without its formatter */
  sortPrimary?: boolean;
  listingFormatter?: boolean;
  /** elody:detailLabelKey: the panel's label key when it differs from the card's */
  detailLabelKey?: string;
  /** elody:cardKey: the key the card field reads under when neither the key nor the alias (typePill) */
  cardKey?: string;
  /** elody:cardField / elody:cardEditable: the card shows the property as this field (relationRootData), with its input field */
  cardField?: string;
  cardEditable?: boolean;
  /** elody:relationKey, elody:readsHost (uuid: $userUuid), elody:relationDirection: a value read on a relation of the host entity */
  relationKey?: string;
  readsHost?: boolean;
  relationDirection?: string;
  /** elody:parentEntityType / elody:parentKey: the parent entity found by a key (parentRelations: [{ entityType, key }]) */
  parentEntityType?: string;
  parentKey?: string;
  /** elody:repeatableMetadataKey (source repeatableMetadata), elody:parentRelationType (source parentRoot) */
  repeatableMetadataKey?: string;
  parentRelationType?: string;
  /** elody:containsRelationPropertyKey / Value: only the relations whose property holds the value */
  containsRelationPropertyKey?: string;
  containsRelationPropertyValue?: string;
  /** elody:validationRule / elody:validationValue: a validation beyond required (url, customValue "min_value:1") */
  validationRule?: string;
  validationValue?: string;
  /** elody:validationRelationType / elody:validationAmount: the has_required_relation rule's relation and count */
  validationRelationType?: string;
  validationAmount?: number;
  validationExact?: boolean;
  /** a relation-valued property (sh:class, or an inverse path): the Elody relation it reads */
  relationType?: string;
  /** metadata key(s) labelling the related entity (metadataKeyAsLabel) */
  valueLabelKey?: string;
  /** elody:valueLabelRootKey: a root field labelling the related entity (rootKeyAsLabel) */
  valueLabelRootKey?: string;
  /**
   * An element in the detail panel in place of a metadata field (elody:panelElement):
   * the rich-text editor on the metadata key, or the list of the entities its relation points to.
   */
  panelElement?: { kind: "wysiwyg" } | { kind: "list"; entityType: string; relationType: string };
};

export type UiFilter = {
  alias: string;
  kind: string;
  order: number;
  key?: string;
  keyAsList: boolean;
  /** elody:parentFilterKey: the parentKey argument of a selection filter */
  parentKey?: string;
  /** elody:optionsType & co: a selection filter fetches its options from the entities of a type */
  options?: { type: string; key?: string; matchExact?: boolean; distinctBy?: string };
  /** elody:keys: several keys, in order (key: ["a", "b"]) */
  keys?: string[];
  /** elody:selectionSpread: a shared fragment as the filter's selection set (...advancedFilter) */
  selectionSpread?: string;
  /** elody:option: fixed options (options: [{ label, value }]) */
  staticOptions?: { label: string; value: string; order: number }[];
  /** elody:optionsLabel / elody:optionsValue: filterOptionsMapping */
  optionsLabel?: string;
  optionsValue?: string;
  /** elody:selectionOption: how the options are offered (autocomplete) */
  selectionOption?: string;
  /** elody:filterOperator: how the values combine (or, and) */
  operator?: string;
  /** elody:showTime: a date filter with (true) or without (false) the time of day; undefined leaves it unsaid */
  showTime?: boolean;
  /** elody:matchersType: which matchers the filter offers */
  matchersType?: string;
  /** elody:lookup: the join the filter needs */
  lookup?: { from: string; localField: string; foreignField: string; as: string };
  label?: string;
  defaultValues: string[];
  defaultValueAsList: boolean;
  hidden: boolean;
  displayedByDefault: boolean;
  tooltip: boolean;
};

export type UiAction = {
  alias: string;
  order: number;
  /** the field the action is emitted as (elody:actionForm); default doElodyAction */
  form?: string;
  /** the platform action (elody:actionKind); none on a link action */
  actionType: string;
  formQuery?: string;
  formFlow?: string;
  formTitle?: string;
  label?: string;
  icon?: string;
};

/** elody:menuInButtons renders the menu as buttons { contextMenu { ... } } (the newer form) */
export type UiContextMenu = { forceShow: boolean; includeBasicActions: boolean; inButtons?: boolean; actions: UiAction[] };

export type UiBulkOpContext = { activeViewMode?: string; selection: string; tooltip: string; requiresSameType?: boolean; minSelectedItems?: number; maxSelectedItems?: number };

export type UiBulkOpModal = {
  typeModal: string;
  formQuery?: string;
  formRelationType?: string;
  /** askForCloseConfirmation, only when declared */
  closeConfirmation?: boolean;
  permission?: string;
  /** elody:picker on the modal: the entity picker it opens (customQueryEntityPickerList / ...Filters) */
  pickerList?: string;
  pickerFilters?: string;
};

export type UiBulkOperation = {
  value: string;
  order: number;
  icon?: string;
  label?: string;
  primary?: boolean;
  can: string[];
  context?: UiBulkOpContext;
  modal?: UiBulkOpModal;
};

export type UiCustomBulkOperations = { queryName: string; operations: UiBulkOperation[] };

export type UiCreateFormField = {
  key: string;
  /** elody:alias: the GraphQL alias of the form field, when not the key */
  alias?: string;
  label?: string;
  order: number;
  inputType: string;
  required: boolean;
  validationRule?: string;
  validationValue?: string;
  validationRelationType?: string;
  validationAmount?: number;
  validationExact?: boolean;
  /** dash:hidden: the field is in the form but hidden (hiddenField) */
  hidden?: boolean;
  /** the shui editor the input type was derived from (explicit or inferred) */
  editor?: string;
  multilingual: boolean;
  languageIn: string[];
  /** the sh:PropertyGroup the field belongs to: a titled section of the form */
  section?: { alias: string; label?: string };
};

export type UiCreateForm = {
  queryName: string;
  label?: string;
  fields: UiCreateFormField[];
  /** elody:fieldsSpread: shared fields fragments spread before the fields */
  fieldsSpreads?: string[];
  /** elody:copyFromParent: prefill from the entity the form is opened on */
  copyFromParent?: { autoCopy?: boolean; keyMap: { key: string; fromKey: string }[] };
  /** the form tab's GraphQL alias (elody:alias on the form); default "name" */
  tabAlias?: string;
  /** the submit action; elody:alias names it (default createAction) */
  submit?: { alias?: string; label?: string; icon?: string; actionQuery?: string; creationType?: string; showsFormErrors?: boolean };
};

export type UiRepetitiveStep = {
  key: string;
  order: number;
  label?: string;
  entityType?: string;
  createForm?: string;
  pickerQuery?: string;
  pickerFiltersQuery?: string;
  acceptedTypes: string[];
  maxSelection?: number;
  overviewFields: { key: string; label?: string; order: number }[];
};

export type UiRepetitiveForm = {
  queryName: string;
  label?: string;
  /** repeatable / refetchOnFinish; unsaid leaves the field out */
  repeatable?: boolean;
  refetchOnFinish?: boolean;
  steps: UiRepetitiveStep[];
  finalize?: { fromStep: string; relationType: string };
};

/** A result type of a list query or picker: fragments spread on it and/or a listing rendered inline (an EntityUi with elody:emit "inline") */
export type UiPickerResult = { type: string; fragments: string[]; listingIri?: string; listing?: UiEntity; order: number };

export type UiPicker = {
  queryName: string;
  filtersQueryName: string;
  order: number;
  results: UiPickerResult[];
  filters: UiFilter[];
  /** elody:filtersType: the type the filters document narrows to (... on X { advancedFilters }) */
  filtersType?: string;
  /** elody:relationValues on the list query: relationValues read on every result */
  relationValues?: boolean;
  /** elody:readsHost on the list query: the document declares $userUuid */
  readsHost?: boolean;
  /** false when an earlier type already emitted the document of that name */
  emitList?: boolean;
  emitFilters?: boolean;
};

export type UiPanel = {
  alias: string;
  order: number;
  label?: string;
  panelType: string;
  collapsed: boolean;
  editable: boolean;
  /** elody:multipleColumns: canBeMultipleColumns(input: true|false); undefined leaves it unsaid */
  multipleColumns?: boolean;
  /** elody:can: the permission editing the panel needs (can(input: "update:feedback")) */
  can?: string;
  /** elody:spread: hand-written fragments on WindowElementPanel spread after the fields */
  spreads: string[];
  fields: string[];
  /** elody:element on the panel: list elements shown after the fields */
  elements: UiElement[];
};

export type UiElementKind = "shaclShape" | "window" | "list" | "markdown";

export type UiElement = {
  kind: UiElementKind;
  order: number;
  alias?: string;
  label?: string;
  fieldsKey?: string;
  metadataKey?: string;
  collapsed?: boolean;
  expandButton?: boolean;
  panels: UiPanel[];
  entityTypes: string[];
  relationType?: string;
  customQuery?: string;
  /** elody:customQueryRelationType: the relation the list's document is scoped by on the related side */
  customQueryRelationType?: string;
  /** elody:mediaKind on a list element: a list of media files (type(input: media)) */
  mediaKind?: string;
  customQueryFilters?: string;
  /** elody:listViewMode: viewMode(input: Library) */
  listViewMode?: string;
  /** elody:can on a list: the permissions the list needs */
  can: string[];
  /** elody:editButton on a window: the edit-metadata button */
  editButton?: boolean;
  /** elody:hideInHistory, elody:disableLibraryBar, elody:enableNavigation, elody:libraryMode */
  hideInHistory?: boolean;
  disableLibraryBar?: boolean;
  enableNavigation?: boolean;
  libraryMode?: string;
  searchInputType?: string;
  customBulkOperations?: string;
  pickerList?: string;
  pickerFilters?: string;
};

export type UiColumn = { order: number; alias?: string; size?: string; elements: UiElement[]; /** elody:elementSpread: shared elements spread in the column */ elementSpreads: string[] };

export type UiDetail = { shapeDriven: boolean; fragmentFields: string[]; columns: UiColumn[] };

export type UiDeleteOptions = {
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

/** elody:FieldsFragment: a named fragment on FormFields */
export type UiFieldsFragment = { name: string; fields: UiCreateFormField[] };
/** elody:ElementsFragment: a named fragment on EntityViewElements */
export type UiElementsFragment = { name: string; elements: UiElement[] };
/** elody:ValuesFragment: a named fragment on IntialValues over some of the type's properties, with an optional card twin */
export type UiValuesFragment = { name: string; cardName?: string; fields: string[] };

export type UiFormSource = { queryName: string; field: string; withParent: boolean };

export type UiEntity = {
  iri: string;
  graphqlType: string;
  /** base name of the generated fragments and documents; defaults to graphqlType */
  documentName?: string;
  targetClass?: string;
  emit: "file" | "regions" | "inline";
  documents: string[];
  typePills: boolean;
  /** elody:relationValues: read relationValues; undefined derives it from what the type needs */
  relationValues?: boolean;
  /** elody:bulkOperations: carry the bulk operations fragment; undefined derives it */
  bulkOperationsFragment?: boolean;
  /** elody:detailFormatters: the detail fragment reads values with their formatters too (default true) */
  detailFormatters?: boolean;
  /** elody:excludeBaseSortOptions: only the declared sort options */
  excludeBaseSortOptions: boolean;
  /** elody:filtersFragmentName: the filters fragment's name when not filtersFor<Type> */
  filtersFragmentName?: string;
  /** elody:readsPermissions: the detail values read canUpdate and canDelete */
  readsPermissions?: boolean;
  /** elody:listingCore: the listing fragment is split into minimal<Type>Core (values, card) and minimal<Type> (spread + view modes) */
  listingCore?: boolean;
  /** elody:deleteOptions: the deleteQueryOptions block of the detail fragment */
  deleteOptions?: UiDeleteOptions;
  /** elody:interface: a GraphQL interface the subtypes share: no listing or detail fragment, only the shared ones */
  interface?: boolean;
  /** the fragments the type's file holds for its subtypes to spread */
  fieldsFragments: UiFieldsFragment[];
  elementsFragments: UiElementsFragment[];
  valuesFragments: UiValuesFragment[];
  /** elody:thumbnail: the card's picture, from an initial value or the primary media file; sh:order places it among the card's fields */
  thumbnail?: { key?: string; fromMediafile?: boolean; order?: number };
  /** hand-written shared fragments spread into a block (elody:listingValuesSpread & co) */
  spreads: { listingValues: string[]; detailValues: string[]; card: string[]; filters: string[] };
  dynamicFormConfigField?: string;
  portsField?: string;
  viewModes: UiViewMode[];
  properties: UiProperty[];
  filters: UiFilter[];
  contextMenu?: UiContextMenu;
  detail?: UiDetail;
  formSources: UiFormSource[];
  bulkOperations: UiBulkOperation[];
  customBulkOperations: UiCustomBulkOperations[];
  createForms: UiCreateForm[];
  repetitiveForms: UiRepetitiveForm[];
  pickers: UiPicker[];
  /** the list queries (elody:listQuery) this type's file emits: entities document (when it has results) and filters document */
  listQueries: UiPicker[];
};
