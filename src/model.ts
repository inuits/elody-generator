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
  sortable: boolean;
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
  /** a relation-valued property (sh:class, or an inverse path): the Elody relation it reads */
  relationType?: string;
  /** metadata key(s) labelling the related entity (metadataKeyAsLabel) */
  valueLabelKey?: string;
};

export type UiFilter = {
  alias: string;
  kind: string;
  order: number;
  key?: string;
  keyAsList: boolean;
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
  actionType: string;
  formQuery?: string;
  formFlow?: string;
  formTitle?: string;
  label?: string;
  icon?: string;
};

export type UiContextMenu = { forceShow: boolean; includeBasicActions: boolean; actions: UiAction[] };

export type UiBulkOpContext = { activeViewMode: string; selection: string; tooltip: string };

export type UiBulkOpModal = {
  typeModal: string;
  formQuery?: string;
  formRelationType?: string;
  closeConfirmation: boolean;
  permission?: string;
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
  label?: string;
  order: number;
  inputType: string;
  required: boolean;
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
  submit?: { label?: string; icon?: string; actionQuery?: string; creationType?: string };
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
  repeatable: boolean;
  refetchOnFinish: boolean;
  steps: UiRepetitiveStep[];
  finalize?: { fromStep: string; relationType: string };
};

export type UiPickerResult = { type: string; fragment: string; order: number };

export type UiPicker = {
  queryName: string;
  filtersQueryName: string;
  order: number;
  results: UiPickerResult[];
  filters: UiFilter[];
};

export type UiPanel = {
  alias: string;
  order: number;
  label?: string;
  panelType: string;
  collapsed: boolean;
  editable: boolean;
  fields: string[];
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
  customQueryFilters?: string;
  searchInputType?: string;
  customBulkOperations?: string;
  pickerList?: string;
  pickerFilters?: string;
};

export type UiColumn = { order: number; size: string; elements: UiElement[] };

export type UiDetail = { shapeDriven: boolean; fragmentFields: string[]; columns: UiColumn[] };

export type UiFormSource = { queryName: string; field: string; withParent: boolean };

export type UiEntity = {
  iri: string;
  graphqlType: string;
  /** base name of the generated fragments and documents; defaults to graphqlType */
  documentName?: string;
  targetClass?: string;
  emit: "file" | "regions";
  documents: string[];
  typePills: boolean;
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
};
