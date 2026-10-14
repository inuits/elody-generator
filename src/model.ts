/**
 * The UI model a declaration parses into and the renderers read. It is the
 * render contract: every string here is already resolved (enum literals,
 * document names), so the renderers know nothing about RDF.
 */
/** a config value: a scalar, a list of strings, an enum (an elody: instance, rendered bare), or an object of string values (elody:value holding elody:config entries) */
export type UiConfigValue = string | number | boolean | string[] | { enum: string } | Record<string, string>;
export type UiConfigEntry = { key: string; value: UiConfigValue };

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
  /** elody:parentRelation nodes: several steps to the parent (parentRelations with more than one entry); wins over the flat terms */
  parentRelations?: { relationType?: string; entityType?: string; key?: string }[];
  /** elody:repeatableMetadataKey (source repeatableMetadata), elody:parentRelationType (source parentRoot) */
  repeatableMetadataKey?: string;
  parentRelationType?: string;
  /** elody:containsRelationPropertyKey / Value: only the relations whose property holds the value */
  containsRelationPropertyKey?: string;
  containsRelationPropertyValue?: string;
  /** elody:lineClamp, elody:valueTranslationKey: on the card and in the panel; elody:permitted, elody:linkText, elody:copyToClipboard,
   * elody:nonEditable, elody:tooltipKey, elody:panelShowsUnit, elody:panelWidget: in the panel; elody:cardAlias, elody:cardValidates: on the card */
  /** elody:technicalOrigin: keyValue technicalOrigin: "download" */
  technicalOrigin?: string;
  /** elody:readOnlyUnless / elody:showOnlyInEditMode on the panel field */
  readOnlyUnless?: string[];
  showOnlyInEditMode?: boolean;
  /** elody:listingValueLabelKey / elody:listingValueLabelRootKey: the listing labels the relation otherwise than the detail page */
  listingValueLabelKey?: string;
  listingValueLabelRootKey?: string;
  /** elody:detailFormatter false: the raw value on the detail page; elody:detailContainsRelation false: no contains filter there */
  detailFormatter?: boolean;
  detailContainsRelation?: boolean;
  cardLineClamp?: string;
  /** elody:cardLinkText: the card field shows the link text too */
  cardLinkText?: boolean;
  /** elody:cardCopyToClipboard: the card field offers copying its value */
  cardCopyToClipboard?: boolean;
  panelLineClamp?: string;
  panelAlias?: string;
  highlightIfPrimaryThumbnail?: boolean;
  /** elody:validationMessage: fastValidationMessage in the validation input */
  validationMessage?: string;
  /** elody:virtualKeyboardLayouts on a property edited in a panel */
  virtualKeyboardLayouts?: string[];
  valueTranslationKey?: string;
  permitted?: string[];
  linkText?: string;
  copyToClipboard?: boolean;
  /** elody:extensions, elody:showLineNumbers: a rich text panel element's editor extensions and configuration */
  extensions?: string[];
  showLineNumbers?: boolean;
  editorStyles?: string;
  /** elody:taggingQuery, elody:taggable: a rich text panel element's tagging */
  taggingQuery?: string;
  taggables?: UiTaggable[];
  /** elody:transliteration: the rich text element's transliteration configuration */
  transliteration?: { enabledByProperty?: string; items: { alias: string; labelKey?: string; mappingKey: string; insertSpaces?: boolean; order: number }[] };
  /** elody:cardCustomValue: a constant shown on the card in place of the value */
  cardCustomValue?: string;
  /** elody:masked, elody:revealQuery: a secret shown masked, revealed by a query */
  masked?: boolean;
  revealQuery?: string;
  /** elody:infoPanel: an explanation next to the field */
  infoPanel?: { title?: string; content?: string };
  nonEditable?: boolean;
  tooltipKey?: string;
  panelShowsUnit?: boolean;
  panelWidget?: boolean;
  cardAlias?: string;
  cardValidates?: boolean;
  /** elody:sortPage: the pages the sort option is offered on (availableInPages) */
  sortPages?: { routeName: string; entityType?: string }[];
  /** elody:validationRule / elody:validationValue: a validation beyond required (url, customValue "min_value:1") */
  validationRule?: string;
  validationValue?: string;
  /** elody:validationRelationType / elody:validationAmount: the has_required_relation rule's relation and count */
  validationRelationType?: string;
  validationAmount?: number;
  /** elody:validationMin / elody:validationMax: the has_min_max_amount_of_relations rule's bounds */
  validationMin?: number;
  validationMax?: number;
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
  panelElement?: { kind: "wysiwyg"; /** inferred from the editor (rdf:HTML), not a declared viewer: the spec's defaults apply */ inferred?: boolean } | { kind: "list"; entityType: string; relationType: string };
};

export type UiFilter = {
  alias: string;
  kind: string;
  order: number;
  key?: string;
  keyAsList: boolean;
  /** elody:parentFilterKey: the parentKey argument of a selection filter */
  parentKey?: string;
  /** elody:filterAggregation: aggregation: "size" on a number filter */
  aggregation?: string;
  /** elody:optionsType & co: a selection filter fetches its options from the entities of a type */
  /** type left out: the search is scoped by its inputs alone */
  options?: {
    type?: string;
    key?: string;
    /** elody:optionsKeys: several keys on the search; elody:optionsItemTypes, elody:optionsLabelKey on the search too */
    keys?: string[];
    itemTypes?: string[];
    labelKey?: string;
    matchExact?: boolean;
    distinctBy?: string;
    operator?: string;
    typeOperator?: string;
    /** elody:optionsTypeBare: the type written as an enum value */
    typeBare?: boolean;
    inputs?: UiOptionsInput[];
  };
  /** elody:itemTypes, elody:defaultMatcher, elody:allowedMatchers, elody:valueMapping, elody:facet on the filter */
  itemTypes?: string[];
  defaultMatcher?: string;
  allowedMatchers?: string[];
  valueMappings?: UiValueMapping[];
  facets?: UiFacet[];
  /** sh:defaultValue a typed boolean: written bare */
  defaultValueBare?: boolean;
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
  /** elody:optionsLimit: how many options are fetched at most (limitConfig) */
  optionsLimit?: number;
  /** elody:filterOperator: how the values combine (or, and) */
  operator?: string;
  /** elody:showTime: a date filter with (true) or without (false) the time of day; undefined leaves it unsaid */
  showTime?: boolean;
  /** elody:matchersType: which matchers the filter offers */
  matchersType?: string;
  /** elody:lookup: the join the filter needs */
  lookup?: UiLookup;
  label?: string;
  defaultValues: string[];
  defaultValueAsList: boolean;
  hidden: boolean;
  /** elody:keepDefaultValue: doNotOverrideDefaultValue(value: true) */
  keepDefaultValue?: boolean;
  /** elody:includeDefaultsFrom: includeDefaultValuesFromIntialValues */
  includeDefaultsFrom?: string[];
  /** elody:matchExact: matchExact on the filter itself */
  matchExact?: boolean;
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
  /** elody:can / elody:showAsButton on the action */
  can?: string[];
  showAsButton?: boolean;
  /** elody:endpointUrl / elody:endpointMethod on a custom action (doCustomAction) */
  endpointUrl?: string;
  endpointMethod?: string;
};

/** elody:detailCard: the card (teaserMetadata) read on the detail page: the keys of the fields it shows, and its menu */
export type UiDetailCard = { fields: string[]; contextMenu?: UiContextMenu };

/** elody:menuInButtons renders the menu as buttons { contextMenu { ... } } (the newer form) */
export type UiContextMenu = { forceShow: boolean; includeBasicActions: boolean; inButtons?: boolean; /** elody:menuAfterFields: the older form placed after the card's fields */ afterFields?: boolean; actions: UiAction[]; /** elody:menuSpread: hand-written action fragments spread in the menu */ spreads?: string[] };

export type UiLookup = { from: string; localField: string; foreignField: string; as: string; /** elody:lookupResolveToSourceIds */ resolveToSourceIds?: boolean };
/** elody:valueMapping: values the default is mapped from (defaultValueMapping) */
export type UiValueMapping = { values: string[]; mapping: string; order: number };
/** elody:facet: a facet of a filter (facets), recursive */
export type UiFacet = { kind?: string; value?: string; key?: string; lookups: UiLookup[]; facets: UiFacet[]; order: number };
/** elody:optionsInput: a further input of a selection filter's option search; value a string or a list */
export type UiOptionsInput = { kind: string; key: string; value: string | string[]; matchExact?: boolean; distinctBy?: string; /** elody:inputResolveDefaultValueToOptionIds */ resolveDefaultValueToOptionIds?: boolean; operator?: string; order: number; /** elody:bareValues: the values are enum values, written unquoted */ bareValues?: boolean; valueMappings?: UiValueMapping[] };

/** elody:matchMetadataValue: a metadata key and the value it must hold (matchMetadataValue) */
export type UiMetadataMatch = { key: string; value: string };

export type UiBulkOpContext = { activeViewMode?: string; selection: string; tooltip: string; requiresSameType?: boolean; minSelectedItems?: number; maxSelectedItems?: number; matchMetadataValue?: UiMetadataMatch[] };

/** elody:survivorSuggestion on a merge modal (survivorSuggestion), enum values resolved */
export type UiSurvivorSuggestion = { strategy: string; autoSelect?: boolean; requireRecommendedSurvivor?: boolean; hiddenVerdicts?: string[] };

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
  /** elody:navigateAfterCreation: pageToNavigateToAfterCreation */
  navigateAfterCreation?: string;
  /** elody:forms: several forms offered (formQueries with several names); wins over formQuery */
  formQueries?: string[];
  /** elody:skipRelatedItems: skipItemsWithRelationDuringBulkDelete */
  skipRelatedItems?: string[];
  /** elody:imageCrop / elody:cropCoordinatesKey: enableImageCrop / keyToSaveCropCoordinates */
  imageCrop?: boolean;
  cropCoordinatesKey?: string;
  replaceExistingRelations?: boolean;
  selectionLimit?: number;
  survivorSuggestion?: UiSurvivorSuggestion;
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
  /** elody:subOperation: the operations offered under this one (subOptions) */
  subOptions?: UiBulkOperation[];
};

export type UiCustomBulkOperations = { queryName: string; operations: UiBulkOperation[] };

export type UiCreateFormField = {
  /** elody:showOnlyInEditMode, elody:valueTranslationKey, elody:onlyForEntityTypes on a form field */
  showOnlyInEditMode?: boolean;
  valueTranslationKey?: string;
  onlyForEntityTypes?: string[];
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
  /** elody:validationMin / elody:validationMax: the has_min_max_amount_of_relations rule's bounds */
  validationMin?: number;
  validationMax?: number;
  validationExact?: boolean;
  /** dash:hidden: the field is in the form but hidden (hiddenField) */
  hidden?: boolean;
  /** elody:hiddenValueFrom: the hidden field's value from a related entity */
  hiddenValueFrom?: { entityType?: string; relationType?: string; key?: string; inherited?: boolean };
  /** elody:copyValueFromParent: a button copying a related entity's value into the field */
  copyValueFromParent?: { labelKey?: string; key: string; relationType?: string };
  /** elody:infoPanel: an explanation next to the field */
  infoPanel?: { title?: string; content?: string };
  /** the shui editor the input type was derived from (explicit or inferred) */
  editor?: string;
  multilingual: boolean;
  languageIn: string[];
  /** the sh:PropertyGroup the field belongs to: a titled section of the form */
  section?: { alias: string; label?: string };
  /** elody:tooltipKey, sh:defaultValue, elody:noWidget, elody:virtualKeyboardLayouts, elody:pickerSearch */
  tooltipKey?: string;
  defaultValue?: string;
  noWidget?: boolean;
  validationMessage?: string;
  virtualKeyboardLayouts?: string[];
  pickerSearch?: { mode: string; keys: string[]; acceptedTypes: string[]; staticFilters?: UiOptionsInput[] };
};

/** elody:UploadField: a file input of an upload container */
export type UiUploadField = { alias: string; label?: string; size?: string; kind: string; inputType: string; required?: boolean; dryRun?: boolean; addTypeToEndpoint?: boolean; extractTypeFromKey?: string; templateCsvs?: string[]; infoLabelUrl?: string; extraMediafileType?: string; order: number };
/** elody:Upload: the upload container of a form tab, at its position among the tab's items */
export type UiUpload = { flow: string; fields: UiUploadField[]; order?: number };
/** elody:formAction: an action button of a tab beyond the submit */
export type UiFormAction = { alias: string; label?: string; icon?: string; kind?: string; actionQuery?: string; creationType?: string; showsFormErrors?: boolean; endpoint?: { name?: string; method?: string; variables: string[]; responseAction?: string }; progress?: { kind: string; steps: { alias: string; label?: string; kind: string; order: number }[] }; order?: number };
/** elody:tab: a further tab of a form */
export type UiFormTab = { alias?: string; fields: UiCreateFormField[]; fieldsSpreads?: string[]; copyFromParent?: UiCreateForm["copyFromParent"]; upload?: UiUpload; actions: UiFormAction[] };

export type UiCreateForm = {
  queryName: string;
  label?: string;
  /** elody:infoLabel, elody:modalStyle: the information above the form, the modal it opens in */
  infoLabel?: string;
  modalStyle?: string;
  /** elody:upload: the first tab's upload container; elody:formAction: its actions; elody:tab: further tabs */
  upload?: UiUpload;
  actions?: UiFormAction[];
  tabs?: UiFormTab[];
  fields: UiCreateFormField[];
  /** elody:fieldsSpread: shared fields fragments spread before the fields */
  fieldsSpreads?: string[];
  /** elody:copyFromParent: prefill from the entity the form is opened on */
  copyFromParent?: { autoCopy?: boolean; keyMap: { key: string; fromKey: string }[] };
  /** the form tab's GraphQL alias (elody:alias on the form); default "name" */
  tabAlias?: string;
  /** the submit action; elody:alias names it (default createAction) */
  submit?: { alias?: string; label?: string; icon?: string; actionQuery?: string; creationType?: string; showsFormErrors?: boolean; /** elody:submitAction: actionType when not submit */ submitAction?: string };
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
  /** elody:showBackButton, elody:skipSearchIfPriorIsNew, elody:pickerFiltersCollapsed, elody:terminalActionLabel */
  showBackButton?: boolean;
  skipSearchIfPriorIsNew?: boolean;
  pickerFiltersCollapsed?: boolean;
  metadataOnly?: boolean;
  terminalActionLabel?: string;
  /** elody:scopeToRelationOf: the search scoped to a prior step's relation */
  scope?: { step: string; relationType: string; filterKey?: string };
  /** elody:stepRelation: the relations the flow creates from this step */
  relations?: { to: string; toAllOf?: string[]; relationType: string; createWhen?: string; order: number; metadataFields?: { formMetadataKey: string; relationMetadataKey: string; asArray?: boolean; order: number }[] }[];
  /** elody:creatableType: the types the step may create, with their forms */
  creatableTypes?: { label?: string; entityType: string; createForm: string; order: number }[];
  /** elody:prefillMetadata: metadata the step's form is prefilled with */
  prefills?: { key: string; value: string; bare: boolean; order: number }[];
};

export type UiRepetitiveForm = {
  queryName: string;
  label?: string;
  /** repeatable / refetchOnFinish; unsaid leaves the field out */
  repeatable?: boolean;
  refetchOnFinish?: boolean;
  /** elody:linear, elody:startOnFirstStep, elody:returnsSelection, elody:routeToStep, elody:routeToRoute */
  linear?: boolean;
  startOnFirstStep?: boolean;
  returnsSelection?: boolean;
  routeToStep?: string;
  routeToRoute?: string;
  steps: UiRepetitiveStep[];
  /** elody:finalizeStep: the step that ends the flow (finalize), without a key of its own */
  finalizeStep?: UiRepetitiveStep;
  finalize?: { fromStep: string; relationType: string; replaceExisting?: boolean };
};

/** A result type of a list query or picker: fragments spread on it and/or a listing rendered inline (an EntityUi with elody:emit "inline") */
export type UiPickerResult = { type: string; fragments: string[]; listingIri?: string; listing?: UiEntity; order: number; /** elody:cardMenuSpread: a menu fragment on the result's card */ cardMenuSpread?: string };

export type UiPreviewLayout = { queryName: string; columns: UiColumn[]; /** false when an earlier type already emitted the document of that name */ emit: boolean };
export type UiPreview = {
  /** elody:fragmentName: the fragment's own name when it is not previewFor<X> */
  fragmentName?: string;
  kind: string;
  coverage: string;
  labelKey?: string;
  openByDefault?: boolean;
  showCurrentPreviewFlow?: boolean;
  keepLastActiveItemHighlighted?: boolean;
  displayOpenDetailPageButton?: boolean;
  layout?: UiPreviewLayout;
  metadataLayout?: UiPreviewLayout;
};
/** elody:MenuItem: an item of the app's menu */
export type UiMenuItem = { alias: string; labelKey: string; entityType?: string; icon?: string; isLoggedIn?: boolean; requiresAuth?: boolean; can?: string[]; route?: string; modal?: { kind: string; form?: string; closeConfirmation?: boolean; permission?: string }; subMenu?: { name: string; items: UiMenuItem[] }; order: number };

/** elody:App: the platform document's settings */
export type UiApp = {
  /** elody:menuItem: the menu (GetMenu) */
  menu: UiMenuItem[];
  /** elody:panelHeaderLegacy: the client heads panels with label(input:), the older baseGraphql form */
  panelHeaderLegacy?: boolean;
  /** elody:bulkModalFormQueryLegacy: the client opens bulk modals with formQuery (singular), the older baseGraphql form */
  bulkModalFormQueryLegacy?: boolean;
  /** elody:relationFormFlatPanel: the bulk-edit relation form's panel without the WindowElementPanel inline fragment */
  relationFormFlatPanel?: boolean;
  /** elody:relationFormField: the client's own fields in the bulk-edit relation form's panel */
  relationFormFields: { alias?: string; key: string; labelKey?: string; clientInputField?: string; order: number }[];
  /** elody:geoFilterKey: the key the map's geo filter buckets on (GetGeoFilterForMap) */
  geoFilterKey?: string;
  documents: string[];
  paginationLimits?: number[];
  dropzoneOptions: { icon?: string; labelKey: string; value: string; order: number }[];
  bulkDeleteSkipsRelated?: boolean;
  csvExportKeysRequired?: boolean;
  preferredLanguage?: boolean;
  readsPermissions?: boolean;
  importJobId?: boolean;
  filterMatcherQueryName?: string;
  filterMatcherKeys?: string[];
  filterMatcherLegacy?: boolean;
  sortOptions: { labelKey: string; value: string; primary?: boolean; icon?: string; order: number }[];
  /** elody:typeEntry: a type added to, spread otherwise in, or left out of a type-wide document */
  typeEntries: { document: string; graphqlType: string; fragment?: string; operations?: UiBulkOperation[]; excluded?: boolean; /** elody:bare: listed without a fragment */ bare?: boolean }[];
  /** relationValues read on every result of getEntities */
  relationValues?: boolean;
  /** the base bulk operations (... on BaseEntity), the entity's elody:bulkOperation nodes */
  bulkOperationsBase?: UiBulkOperation[];
};
export type UiSortDocument = { queryName: string; options: { labelKey: string; value: string; primary?: boolean; icon?: string; order: number }[] };

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
  /** elody:readsHost on the list query: the document declares $userUuid; elody:hostOptional: as a nullable String */
  readsHost?: boolean;
  hostOptional?: boolean;
  /** false when an earlier type already emitted the document of that name */
  emitList?: boolean;
  emitFilters?: boolean;
  /** elody:facets: the entities document reads facets; elody:filtersSpread: fragments spread in the filters document */
  facets?: boolean;
  filtersSpreads: string[];
  /** elody:queryRoot elody:SingleEntityRoot: one entity by id and type instead of a page of entities */
  rootKind?: "entity";
};

export type UiPanel = {
  /** elody:panelHeader false: no header (no panelHeaderContent) */
  header?: boolean;
  alias: string;
  order: number;
  label?: string;
  /** elody:panelKind; none leaves panelType unsaid */
  panelType?: string;
  collapsed: boolean;
  editable: boolean;
  /** elody:editableDefault: isEditable left unsaid */
  editableDefault?: boolean;
  /** elody:repetitionKey / elody:displayConditionKey */
  repetitionKey?: string;
  displayConditionKey?: string;
  /** elody:bulkDataSource: bulkData(bulkDataSource: ...) */
  bulkDataSource?: string;
  /** elody:panelField: a field shown otherwise in this panel */
  fieldOverrides?: { key: string; labelKey?: string; alias?: string; widget?: boolean; /** elody:panelAsField: a panel element shown as a plain field here */ asField?: boolean }[];
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

export type UiElementKind = "shaclShape" | "window" | "list" | "markdown" | "singleMedia" | "map" | "entityViewer" | "comments" | "hierarchy" | "graph";

/** elody:Taggable: what a rich-text editor can tag */
export type UiTaggable = {
  tag?: string;
  entityType: string;
  relationType: string;
  filterKey?: string;
  triggerCharacter?: string;
  triggerMinCharacters?: number;
  flowQuery?: string;
  flowButtonLabel?: string;
  /** elody:form: the form creating a new entity to tag (createNewEntityFormQuery) */
  createFormQuery?: string;
  /** elody:replaceCharacters: replacements applied to tagged content */
  replaceCharacters?: { regex: string; replacement: string; order: number }[];
  /** elody:attributeKeys: metadata keys set as attributes of the tag */
  attributeKeys?: string[];
  /** elody:tagConfigurationByEntity: tags configured by a related entity */
  tagConfigurationByEntity?: { entityType?: string; relationType?: string; tagKey?: string; colorKey?: string; attributeKeys?: string[]; secondaryAttribute?: string };
  order: number;
};
/** elody:composer: the rich-text editor of a comments element */
export type UiComposer = { label?: string; metadataKey: string; extensions: string[]; editorStyles?: string; multilingual?: boolean; taggables: UiTaggable[]; /** elody:taggingQuery: the list query the tagging searches */ taggingQuery?: string };

/** elody:windowStatus: the status edited in a window's header (windowElementStatus) */
export type UiWindowStatus = { labelKey?: string; statusKey: string; statusInputField: string };
/** elody:actionsOnResult: operations a list offers on its result (actionsOnResult) */
export type UiActionsOnResult = { resultKind: string; operations: UiBulkOperation[] };

export type UiElement = {
  kind: UiElementKind;
  order: number;
  alias?: string;
  label?: string;
  fieldsKey?: string;
  metadataKey?: string;
  collapsed?: boolean;
  expandButton?: boolean;
  /** elody:windowLayout: how the window lays out its panels (layout) */
  windowLayout?: string;
  /** elody:hierarchyLevel, elody:centerEntityType, elody:centerCoordinatesKey: a hierarchy list's tree */
  hierarchyLevels?: { key: string; entityType: string; order: number }[];
  centerEntityType?: string;
  centerCoordinatesKey?: string;
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
  /** elody:displayConditionKey / elody:displayConditionValue: the element shows when the entity's key holds the value */
  displayCondition?: { key: string; value?: string };
  searchInputType?: string;
  customBulkOperations?: string;
  pickerList?: string;
  pickerFilters?: string;
  windowStatus?: UiWindowStatus;
  /** elody:contextMenu on a window (contextMenuActions); elody:panelSpread: fragments spread among its panels */
  contextMenu?: UiContextMenu;
  panelSpreads?: string[];
  actionsOnResult?: UiActionsOnResult;
  /** elody:addEntitiesToForms on a list */
  addEntitiesToForms?: boolean;
  /** elody:cropCoordinatesKey on a media list (cropMediafileCoordinatesKey) */
  cropCoordinatesKey?: string;
  /** a comments element: elody:parentFilterKey, dash:readOnly, elody:createField, elody:composer */
  parentFilterKey?: string;
  readOnly?: boolean;
  createFields?: { key: string; labelKey?: string; inputType?: string; order: number }[];
  composer?: UiComposer;
  /** a graph element: elody:graphType, elody:datasource, elody:datasetLabels, elody:datasetFilter, elody:timeUnit, elody:datapoints, elody:convertTo */
  graphType?: string;
  datasource?: string;
  datasetLabels?: string[];
  datasetFilter?: { key: string; values: string[] };
  timeUnit?: string;
  datapoints?: number;
  convertTo?: string;
  /** a map element: elody:mapType, elody:center, elody:wktKey, elody:config */
  mapType?: string;
  center?: string;
  wktKey?: string;
  config?: UiConfigEntry[];
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
export type UiFieldsFragment = { name: string; fields: UiCreateFormField[]; /** elody:fieldsSpread / elody:fieldsSpreadAfter: fields fragments spread before and after its own fields */ spreads?: string[]; spreadsAfter?: string[] };
/** elody:WindowFragment: a named fragment on WindowElement holding panels */
export type UiWindowFragment = { name: string; panels: UiPanel[] };
/** elody:ElementsFragment: a named fragment on EntityViewElements */
export type UiElementsFragment = { name: string; elements: UiElement[] };
/** elody:ValuesFragment: a named fragment on IntialValues over some of the type's properties, with an optional card twin */
export type UiValuesFragment = {
  name: string;
  cardName?: string;
  /** elody:field: property shapes by key; elody:fieldAlias: by alias (several shapes over one key); read in that order */
  fields: string[];
  aliases?: string[];
  /** elody:valuesField: plain fields of IntialValues read next to the keyValues */
  valuesFields?: string[];
  /** elody:cardShows: the values (alias, else key) the card twin shows; absent = all */
  cardShows?: string[];
  /** elody:contextMenu: the menu on the card twin */
  contextMenu?: UiContextMenu;
};
/** elody:panelFragment: panel fields other types spread (on WindowElementPanel) */
export type UiPanelFragment = { name: string; fields: string[] };
/** elody:filtersFragment: filters other types spread (on AdvancedFilters) */
export type UiFiltersFragment = { name: string; filters: UiFilter[] };

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
  /** elody:mapFeatureField: the properties (keys) shown in the map view's popup (mapElement { mapFeatureMetadata }) */
  mapFeatureFields?: string[];
  /** elody:idField: id at the top of the listing fragment; elody:idValue: id among the listing's initial values */
  idField?: boolean;
  idValue?: boolean;
  /** elody:viewModesOnDetail: the allowed view modes read in the detail fragment too */
  viewModesOnDetail?: boolean;
  /** elody:listingCore: the listing fragment is split into minimal<Type>Core (values, card) and minimal<Type> (spread + view modes) */
  listingCore?: boolean;
  /** elody:deleteOptions: the deleteQueryOptions block of the detail fragment */
  deleteOptions?: UiDeleteOptions;
  /** elody:interface: a GraphQL interface the subtypes share: no listing or detail fragment, only the shared ones */
  interface?: boolean;
  /** the fragments the type's file holds for its subtypes to spread */
  fieldsFragments: UiFieldsFragment[];
  elementsFragments: UiElementsFragment[];
  windowFragments: UiWindowFragment[];
  valuesFragments: UiValuesFragment[];
  panelFragments: UiPanelFragment[];
  filtersFragments: UiFiltersFragment[];
  /** elody:fragmentsOnly: a file of shared fragments alone; elody:filePath: where it is written, relative to src/ */
  fragmentsOnly?: boolean;
  filePath?: string;
  /** elody:cardName: the listing fragment's own name when the client does not call it minimal<X> (another card of the type) */
  cardName?: string;
  /** elody:withoutBaseEntity: the listing fragment does not spread ...minimalBaseEntity */
  withoutBaseEntity?: boolean;
  /** elody:detailName: the detail fragment's own name when the client does not call it full<X> */
  detailName?: string;
  /** elody:bulkFragmentName: the bulk operations fragment's own name when the client does not call it <x>BulkOperations */
  bulkFragmentName?: string;
  /** elody:sortFragmentName: the sort options fragment's own name when the client does not call it <x>SortOptions */
  sortFragmentName?: string;
  /** elody:sortDocument: sort options documents of the type's own, options inline */
  sortDocuments: UiSortDocument[];
  /** elody:bulkDocument: bulk operations documents of the type's or the app's own */
  bulkDocuments: { queryName: string; operations: UiBulkOperation[] }[];
  /** elody:preview: how the type is previewed from a list, and the layouts the preview loads */
  preview?: UiPreview;
  /** elody:App: this declaration is the app's, the platform document rendered from the types */
  app?: UiApp;
  /** the app's dialect, copied onto every declaration: panels headed with label(input:) */
  panelHeaderLegacy?: boolean;
  /** the app's dialect, copied onto every declaration: bulk modals opened with formQuery (singular) */
  bulkModalFormQueryLegacy?: boolean;
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
  /** elody:detailCard: the card the detail fragment carries as well */
  detailCard?: UiDetailCard;
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
