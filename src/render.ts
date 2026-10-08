/**
 * UI model -> GraphQL query documents. Pure string rendering; the model is
 * already resolved. Ported behaviour of the reference generator
 * (generateUiQueries.ts, mat2elody/dishacled), output byte-identical.
 */
import type * as M from "./model.js";

const pad = (depth: number) => " ".repeat(depth);
export const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
/** How a related entity is labelled when the declaration does not say (elody:valueLabelKey). */
export const DEFAULT_VALUE_LABEL_KEY = "title|name|label";
const stringList = (values: string[]) => `[${values.map((value) => `"${value}"`).join(", ")}]`;

/** The listing fragment leaves out the detail-only properties; the detail fragment reads them all. */
export function renderInitialValues(entity: M.UiEntity, indent: number, withFormatters = true, listing = false): string {
  return entity.properties
    .filter((property) => property.readsValue && (listing ? !property.detailOnly : !property.listingOnly))
    .map((property) => {
      const alias = property.alias ?? property.key;
      const index = property.index !== undefined ? `, index: ${property.index}` : "";
      const formatter = withFormatters && property.formatter ? `, formatter: "${property.formatter}"` : "";
      // elody:valueLabelKey "" reads the relation without a label key
      const labelKey = property.valueLabelKey === "" ? "" : `, metadataKeyAsLabel: "${property.valueLabelKey ?? DEFAULT_VALUE_LABEL_KEY}"`;
      if (property.relationType)
        return `${pad(indent)}${alias}: keyValue(key: "${property.relationType}", source: relations${labelKey}${index}${formatter})`;
      return `${pad(indent)}${alias}: keyValue(key: "${property.key}", source: ${property.source ?? "metadata"}${index}${formatter})`;
    })
    .join("\n");
}

/**
 * Whether a fragment reads relationValues: declared for both, else what each needs. The listing
 * fragment needs it for a relation it reads on the card or a context menu; the detail fragment for
 * any relation, a panel that lists related entities, or a list element.
 */
export function readsRelationValues(entity: M.UiEntity, fragment: "listing" | "detail"): boolean {
  if (entity.relationValues !== undefined) return entity.relationValues;
  // the listing reads them only when declared (clients' cards do without, even with relations on them);
  // the detail page reads them unless declared otherwise (nearly every client's does)
  return fragment === "detail";
}

/** Whether the type carries a bulk operations fragment: declared, else when it declares operations or asks for the document. */
export const carriesBulkOperations = (entity: M.UiEntity): boolean =>
  entity.bulkOperationsFragment ?? (entity.bulkOperations.length > 0 || entity.documents.includes("bulkOperations"));

/** The card's thumbnail (teaserMetadata.thumbnail), before the fields. */
export function renderThumbnail(entity: M.UiEntity, indent: number): string {
  const thumbnail = entity.thumbnail;
  if (!thumbnail) return "";
  const read = thumbnail.fromMediafile ? "filename(fromMediafile: true)" : `key(input: "${thumbnail.key ?? "thumbnail"}")`;
  return [`${pad(indent)}thumbnail {`, `${pad(indent + 2)}${read}`, `${pad(indent)}}`].join("\n");
}

export function renderTeaserFields(entity: M.UiEntity, indent: number): string {
  const fields = entity.properties.filter((property) => property.teaser);
  const thumbnail = renderThumbnail(entity, indent);
  // the thumbnail comes first unless sh:order places it after the n-th field
  const at = Math.min(Math.max(entity.thumbnail?.order ?? 0, 0), fields.length);
  const rendered = fields.map((property) => {
      const lines = [
        `${pad(indent)}${property.alias ?? property.key}: metaData {`,
        `${pad(indent + 2)}label(input: "${property.label ?? property.key}")`,
        `${pad(indent + 2)}key(input: "${property.alias ?? property.key}")`,
      ];
      if (property.multilingual) lines.push(`${pad(indent + 2)}isMultilingual(input: true)`);
      if (property.languageIn.length) lines.push(`${pad(indent + 2)}languageIn(input: ${stringList(property.languageIn)})`);
      if (property.colSpan !== undefined) lines.push(`${pad(indent + 2)}colSpan(input: "${property.colSpan}")`);
      if (property.unit) lines.push(`${pad(indent + 2)}unit(input: ${property.unit})`);
      lines.push(`${pad(indent)}}`);
      return lines.join("\n");
    });
  if (thumbnail) rendered.splice(at, 0, thumbnail);
  return rendered.join("\n");
}

const configLiteral = (value: M.UiConfigEntry["value"]): string =>
  Array.isArray(value)
    ? `[${value.map((entry) => `"${entry}"`).join(", ")}]`
    : typeof value === "string"
      ? `"${value}"`
      : String(value);

export function renderViewModes(entity: M.UiEntity, indent: number): string {
  const modes = entity.viewModes
    .map((viewMode) => {
      if (viewMode.config.length === 0) return `${pad(indent + 6)}{ viewMode: ${viewMode.mode} }`;
      const entries = viewMode.config
        .map((entry) => `${pad(indent + 10)}{ key: "${entry.key}", value: ${configLiteral(entry.value)} }`)
        .join("\n");
      return [
        `${pad(indent + 6)}{`,
        `${pad(indent + 8)}viewMode: ${viewMode.mode}`,
        `${pad(indent + 8)}config: [`,
        entries,
        `${pad(indent + 8)}]`,
        `${pad(indent + 6)}}`,
      ].join("\n");
    })
    .join("\n");

  return [
    `${pad(indent)}allowedViewModes {`,
    `${pad(indent + 2)}viewModes(`,
    `${pad(indent + 4)}input: [`,
    modes,
    `${pad(indent + 4)}]`,
    `${pad(indent + 2)}) {`,
    `${pad(indent + 4)}...viewModes`,
    `${pad(indent + 2)}}`,
    `${pad(indent)}}`,
  ].join("\n");
}

export function renderSortOptions(entity: M.UiEntity, indent: number): string {
  // the sort options in their own order (elody:sortOrder), else the properties' order
  const sortable = entity.properties
    .filter((property) => property.sortable)
    .map((property, index) => ({ property, index }))
    .sort((a, b) => (a.property.sortOrder ?? a.index) - (b.property.sortOrder ?? b.index) || a.index - b.index)
    .map(({ property }) => property);
  if (sortable.length === 0) return "";

  const options = sortable
    .map((property) =>
      [
        `${pad(indent + 6)}{`,
        `${pad(indent + 8)}icon: NoIcon`,
        `${pad(indent + 8)}label: "${property.sortLabelKey ?? property.label ?? property.key}"`,
        `${pad(indent + 8)}value: "${property.alias ?? property.key}"`,
        `${pad(indent + 6)}}`,
      ].join("\n"),
    )
    .join("\n");

  const direction = sortable.find((property) => property.defaultSortDirection)?.defaultSortDirection;

  const lines = [
    `${pad(indent)}sortOptions {`,
    `${pad(indent + 2)}options(`,
    `${pad(indent + 4)}input: [`,
    options,
    `${pad(indent + 4)}]`,
    ...(entity.excludeBaseSortOptions ? [`${pad(indent + 4)}excludeBaseSortOptions: true`] : []),
    `${pad(indent + 2)}) {`,
    `${pad(indent + 4)}icon`,
    `${pad(indent + 4)}label`,
    `${pad(indent + 4)}value`,
    `${pad(indent + 2)}}`,
  ];
  if (direction) lines.push(`${pad(indent + 2)}isAsc(input: ${direction})`);
  lines.push(`${pad(indent)}}`);
  return lines.join("\n");
}

const filterDefaultLiteral = (filter: M.UiFilter): string => {
  if (filter.defaultValueAsList) return `[${filter.defaultValues.map((value) => `"${value}"`).join(", ")}]`;
  return `"${filter.defaultValues[0] ?? ""}"`;
};

export function renderFilters(entity: M.UiEntity, indent: number): string {
  return renderFilterList(entity.filters, indent, entity.spreads.filters);
}

/** The option search of a selection filter: a text search on the options key, scoped to the type. */
function renderFilterOptions(options: NonNullable<M.UiFilter["options"]>, indent: number): { args: string[]; fields: string[] } {
  const args = [
    `${pad(indent)}advancedFilterInputForRetrievingOptions: [`,
    `${pad(indent + 2)}{`,
    `${pad(indent + 4)}type: text`,
    `${pad(indent + 4)}key: ["${options.key}"]`,
    `${pad(indent + 4)}value: "*"`,
    ...(options.distinctBy ? [`${pad(indent + 4)}distinct_by: "${options.distinctBy}"`] : []),
    ...(options.matchExact !== undefined ? [`${pad(indent + 4)}match_exact: ${options.matchExact}`] : []),
    `${pad(indent + 2)}}`,
    `${pad(indent + 2)}{ type: type, value: "${options.type}" }`,
    `${pad(indent)}]`,
  ];
  // the inputs asked back: clients that search with distinct_by write type, key, value, distinct_by, match_exact;
  // the plain search is written type, value, key, match_exact (vliz, the most of them)
  const fields = [
    `${pad(indent)}advancedFilterInputForRetrievingOptions {`,
    `${pad(indent + 2)}type`,
    ...(options.distinctBy ? [`${pad(indent + 2)}key`, `${pad(indent + 2)}value`, `${pad(indent + 2)}distinct_by`] : [`${pad(indent + 2)}value`, `${pad(indent + 2)}key`]),
    `${pad(indent + 2)}match_exact`,
    `${pad(indent)}}`,
  ];
  return { args, fields };
}

export function renderFilterList(filters: M.UiFilter[], indent: number, spreads: string[] = []): string {
  const entries = filters.map((filter) => {
    const aliased = filter.alias ? `${filter.alias}: ` : "";
    if (filter.kind === "type")
      return [
        `${pad(indent + 2)}${aliased}advancedFilter(type: type) {`,
        `${pad(indent + 4)}type`,
        `${pad(indent + 4)}defaultValue(value: ${filterDefaultLiteral(filter)})`,
        `${pad(indent + 4)}hidden(value: ${filter.hidden})`,
        `${pad(indent + 2)}}`,
      ].join("\n");

    // a scoping selection filter (no label, no option search) is compact; a visible one reads like the other kinds
    if (filter.kind === "selection" && !filter.label && !filter.options) {
      const key = filter.keyAsList ? `["${filter.key}"]` : `"${filter.key}"`;
      const parent = filter.parentKey ? `, parentKey: "${filter.parentKey}"` : "";
      const operator = filter.operator ? `, operator: ${filter.operator}` : "";
      const selection = [
        "type",
        ...(filter.parentKey ? ["parentKey"] : []),
        "key",
        ...(filter.operator ? ["operator"] : []),
        ...(filter.tooltip ? ["tooltip(value: true)"] : []),
        ...(filter.defaultValues.length > 0 || filter.defaultValueAsList ? [`defaultValue(value: ${filterDefaultLiteral(filter)})`] : []),
        ...(filter.hidden ? ["hidden(value: true)"] : []),
      ];
      return [
        `${pad(indent + 2)}${aliased}advancedFilter(type: selection${parent}, key: ${key}${operator}) {`,
        ...selection.map((field) => `${pad(indent + 4)}${field}`),
        `${pad(indent + 2)}}`,
      ].join("\n");
    }

    const options = filter.options ? renderFilterOptions(filter.options, indent + 4) : undefined;
    const mapping =
      filter.optionsLabel || filter.optionsValue
        ? [
            `${pad(indent + 4)}filterOptionsMapping: {`,
            ...(filter.optionsLabel ? [`${pad(indent + 6)}label: "${filter.optionsLabel}"`] : []),
            ...(filter.optionsValue ? [`${pad(indent + 6)}value: "${filter.optionsValue}"`] : []),
            `${pad(indent + 4)}}`,
          ]
        : [];
    const args = [
      `${pad(indent + 4)}type: ${filter.kind}`,
      ...(filter.parentKey ? [`${pad(indent + 4)}parentKey: "${filter.parentKey}"`] : []),
      ...(filter.key ? [`${pad(indent + 4)}key: ${filter.keyAsList ? `["${filter.key}"]` : `"${filter.key}"`}`] : []),
      ...(filter.operator ? [`${pad(indent + 4)}operator: ${filter.operator}`] : []),
      ...(filter.label ? [`${pad(indent + 4)}label: "${filter.label}"`] : []),
      ...(filter.selectionOption ? [`${pad(indent + 4)}selectionOption: ${filter.selectionOption}`] : []),
      ...(filter.showTime !== undefined ? [`${pad(indent + 4)}showTimeForDateFilter: ${filter.showTime}`] : []),
      ...(filter.displayedByDefault ? [`${pad(indent + 4)}isDisplayedByDefault: true`] : []),
      ...mapping,
      ...(options ? options.args : []),
    ];
    const selection = [
      `${pad(indent + 4)}type`,
      ...(filter.parentKey ? [`${pad(indent + 4)}parentKey`] : []),
      ...(filter.key ? [`${pad(indent + 4)}key`] : []),
      ...(filter.operator ? [`${pad(indent + 4)}operator`] : []),
      ...(filter.label ? [`${pad(indent + 4)}label`] : []),
      ...(filter.selectionOption ? [`${pad(indent + 4)}selectionOption`] : []),
      ...(filter.showTime !== undefined ? [`${pad(indent + 4)}showTimeForDateFilter`] : []),
      ...(filter.displayedByDefault ? [`${pad(indent + 4)}isDisplayedByDefault`] : []),
      ...(mapping.length ? [`${pad(indent + 4)}filterOptionsMapping {`, `${pad(indent + 6)}label`, `${pad(indent + 6)}value`, `${pad(indent + 4)}}`] : []),
      ...(options ? options.fields : []),
      ...(filter.tooltip ? [`${pad(indent + 4)}tooltip(value: true)`] : []),
      ...(filter.defaultValues.length > 0 || filter.defaultValueAsList ? [`${pad(indent + 4)}defaultValue(value: ${filterDefaultLiteral(filter)})`] : []),
      ...(filter.hidden ? [`${pad(indent + 4)}hidden(value: true)`] : []),
    ];
    return [`${pad(indent + 2)}${aliased}advancedFilter(`, ...args, `${pad(indent + 2)}) {`, ...selection, `${pad(indent + 2)}}`].join("\n");
  });

  const spread = spreads.map((name) => `${pad(indent + 2)}...${name}`);
  return [`${pad(indent)}advancedFilters {`, ...spread, ...entries, `${pad(indent)}}`].join("\n");
}

export function renderContextMenu(entity: M.UiEntity, indent: number): string {
  const menu = entity.contextMenu;
  if (!menu) return "";

  const lines: string[] = [];
  if (menu.forceShow) lines.push(`${pad(indent)}forceShowContextMenuActions(input: true)`);
  lines.push(`${pad(indent)}contextMenuActions {`);
  if (menu.includeBasicActions) lines.push(`${pad(indent + 2)}...basicContextMenuActions`);
  for (const action of menu.actions) {
    lines.push(`${pad(indent + 2)}${action.alias}: doElodyAction {`);
    lines.push(`${pad(indent + 4)}action(input: ${action.actionType})`);
    if (action.formQuery) lines.push(`${pad(indent + 4)}formQuery(input: "${action.formQuery}")`);
    if (action.formFlow) lines.push(`${pad(indent + 4)}formFlow(input: ${action.formFlow})`);
    if (action.formTitle) lines.push(`${pad(indent + 4)}formTitle(input: "${action.formTitle}")`);
    if (action.label) lines.push(`${pad(indent + 4)}label(input: "${action.label}")`);
    if (action.icon) lines.push(`${pad(indent + 4)}icon(input: "${action.icon}")`);
    lines.push(`${pad(indent + 4)}__typename`);
    lines.push(`${pad(indent + 2)}}`);
  }
  lines.push(`${pad(indent)}}`);
  return lines.join("\n");
}

export function renderBulkOperationOptions(operations: M.UiBulkOperation[], indent: number): string {
  const entries = operations.map((operation) => {
    const lines = [`${pad(indent + 6)}{`];
    if (operation.icon) lines.push(`${pad(indent + 8)}icon: ${operation.icon}`);
    if (operation.label) lines.push(`${pad(indent + 8)}label: "${operation.label}"`);
    lines.push(`${pad(indent + 8)}value: "${operation.value}"`);
    if (operation.primary !== undefined) lines.push(`${pad(indent + 8)}primary: ${operation.primary}`);
    if (operation.can.length > 0)
      lines.push(`${pad(indent + 8)}can: [${operation.can.map((entry) => `"${entry}"`).join(", ")}]`);
    if (operation.context) {
      lines.push(`${pad(indent + 8)}actionContext: {`);
      lines.push(`${pad(indent + 10)}activeViewMode: ${operation.context.activeViewMode}`);
      lines.push(`${pad(indent + 10)}entitiesSelectionType: ${operation.context.selection}`);
      lines.push(`${pad(indent + 10)}labelForTooltip: "${operation.context.tooltip}"`);
      lines.push(`${pad(indent + 8)}}`);
    }
    if (operation.modal) {
      lines.push(`${pad(indent + 8)}bulkOperationModal: {`);
      lines.push(`${pad(indent + 10)}typeModal: ${operation.modal.typeModal}`);
      if (operation.modal.formQuery) lines.push(`${pad(indent + 10)}formQueries: ["${operation.modal.formQuery}"]`);
      if (operation.modal.formRelationType)
        lines.push(`${pad(indent + 10)}formRelationType: "${operation.modal.formRelationType}"`);
      if (operation.modal.closeConfirmation !== undefined)
        lines.push(`${pad(indent + 10)}askForCloseConfirmation: ${operation.modal.closeConfirmation}`);
      if (operation.modal.permission) lines.push(`${pad(indent + 10)}neededPermission: ${operation.modal.permission}`);
      lines.push(`${pad(indent + 8)}}`);
    }
    lines.push(`${pad(indent + 6)}}`);
    return lines.join("\n");
  });

  const input =
    operations.length === 0
      ? `${pad(indent + 2)}options(input: []) {`
      : [`${pad(indent + 2)}options(`, `${pad(indent + 4)}input: [`, ...entries, `${pad(indent + 4)}]`, `${pad(indent + 2)}) {`].join("\n");

  return [
    `${pad(indent)}bulkOperationOptions {`,
    input,
    `${pad(indent + 4)}icon`,
    `${pad(indent + 4)}label`,
    `${pad(indent + 4)}value`,
    `${pad(indent + 4)}primary`,
    `${pad(indent + 4)}can`,
    `${pad(indent + 4)}actionContext {`,
    `${pad(indent + 6)}...actionContext`,
    `${pad(indent + 4)}}`,
    `${pad(indent + 4)}bulkOperationModal {`,
    `${pad(indent + 6)}...bulkOperationModal`,
    `${pad(indent + 4)}}`,
    `${pad(indent + 2)}}`,
    `${pad(indent)}}`,
  ].join("\n");
}

export function renderCreateForm(form: M.UiCreateForm): string {
  const fieldBlocks = form.fields.map((field) => {
    const lines = [
      `          ${field.alias ?? field.key}: metaData {`,
      `            label(input: "${field.label ?? field.key}")`,
      `            key(input: "${field.key}")`,
      ...(field.multilingual ? ["            isMultilingual(input: true)"] : []),
      ...(field.languageIn.length ? [`            languageIn(input: ${stringList(field.languageIn)})`] : []),
      `            inputField(type: ${field.inputType}) {`,
      "              ...inputfield",
    ];
    if (field.required) {
      lines.push("              validation(input: { value: required }) {");
      lines.push("                ...validation");
      lines.push("              }");
    }
    lines.push("            }");
    lines.push("          }");
    return lines.join("\n");
  });

  // consecutive fields of one sh:PropertyGroup are wrapped in a form section
  const fields: string[] = [];
  for (let index = 0; index < form.fields.length; index++) {
    const section = form.fields[index].section;
    if (!section) {
      fields.push(fieldBlocks[index]);
      continue;
    }
    const inside: string[] = [];
    while (index < form.fields.length && form.fields[index].section?.alias === section.alias) {
      inside.push(fieldBlocks[index].split("\n").map((line) => `    ${line}`).join("\n"));
      index++;
    }
    index--;
    fields.push(
      [
        `          ${section.alias}Section: formSection {`,
        `            label(input: "${section.label ?? ""}")`,
        "            formFields {",
        ...inside,
        "            }",
        "          }",
      ].join("\n"),
    );
  }

  const submit = form.submit
    ? [
        "          createAction: action {",
        `            label(input: "${form.submit.label ?? ""}")`,
        `            icon(input: ${form.submit.icon ?? "NoIcon"})`,
        "            actionType(input: submit)",
        ...(form.submit.actionQuery !== undefined ? [`            actionQuery(input: "${form.submit.actionQuery}")`] : []),
        ...(form.submit.creationType ? [`            creationType(input: ${form.submit.creationType})`] : []),
        ...(form.submit.showsFormErrors ? ["            showsFormErrors(input: true)"] : []),
        "          }",
      ].join("\n")
    : "";

  return [
    `  query ${form.queryName} {`,
    "    GetDynamicForm {",
    // a form without a label has none; a tab aliased "formTab" is the plain field
    ...(form.label !== undefined ? [`      label(input: "${form.label}")`] : []),
    `      ${(form.tabAlias ?? "name") === "formTab" ? "formTab" : `${form.tabAlias ?? "name"}: formTab`} {`,
    "        formFields {",
    fields.join("\n"),
    ...(submit ? [submit] : []),
    "        }",
    "      }",
    "    }",
    "  }",
  ].join("\n");
}

export function renderRepetitiveForm(form: M.UiRepetitiveForm): string {
  const steps = form.steps.map((step) => {
    const lines = [`      ${step.key}: steps {`, `        key(input: "${step.key}")`, `        label(input: "${step.label ?? ""}")`];
    if (step.entityType) lines.push(`        entityType(input: "${step.entityType}")`);
    if (step.createForm) lines.push(`        createForm(input: "${step.createForm}")`);
    if (step.pickerQuery) lines.push(`        pickerQuery(input: "${step.pickerQuery}")`);
    if (step.pickerFiltersQuery) lines.push(`        pickerFiltersQuery(input: "${step.pickerFiltersQuery}")`);
    if (step.acceptedTypes.length > 0)
      lines.push(`        acceptedTypes(input: [${step.acceptedTypes.map((entry) => `"${entry}"`).join(", ")}])`);
    if (step.maxSelection !== undefined) lines.push(`        maxSelection(input: ${step.maxSelection})`);
    if (step.overviewFields.length > 0) {
      lines.push("        overviewFields(");
      lines.push("          input: [");
      for (const field of step.overviewFields)
        lines.push(`            { key: "${field.key}", label: "${field.label ?? field.key}" }`);
      lines.push("          ]");
      lines.push("        ) {");
      lines.push("          key");
      lines.push("          label");
      lines.push("        }");
    }
    lines.push("      }");
    return lines.join("\n");
  });

  const finalize = form.finalize
    ? [
        "      finalizeOnHost {",
        `        fromStep(input: "${form.finalize.fromStep}")`,
        `        relationType(input: "${form.finalize.relationType}")`,
        "      }",
      ].join("\n")
    : "";

  return [
    `  query ${form.queryName} {`,
    "    GetRepetitiveForm {",
    `      label(input: "${form.label ?? ""}")`,
    `      repeatable(input: ${form.repeatable})`,
    `      refetchOnFinish(input: ${form.refetchOnFinish})`,
    steps.join("\n"),
    ...(finalize ? [finalize] : []),
    "    }",
    "  }",
  ].join("\n");
}

/** The entities document of a picker or a list query (its results per type), and its filters document. */
export function renderPicker(picker: M.UiPicker): string {
  return renderListQueryDocuments(picker).join("\n\n");
}

/** The documents of a list element's list query: the entities document only when it declares results. */
export function renderListQueryDocuments(picker: M.UiPicker): string[] {
  return [...(picker.results.length ? [renderListQuery(picker)] : []), ...(picker.filters.length ? [renderListFilters(picker)] : [])];
}

export function renderListQuery(picker: M.UiPicker): string {
  const results = picker.results
    .map((result) => [`        ... on ${result.type} {`, `          ...${result.fragment}`, "        }"].join("\n"))
    .join("\n");

  const list = [
    `  query ${picker.queryName}(`,
    "    $type: Entitytyping!",
    "    $limit: Int",
    "    $skip: Int",
    "    $searchValue: SearchFilter!",
    "    $advancedSearchValue: [FilterInput]",
    "    $advancedFilterInputs: [AdvancedFilterInput!]!",
    "    $searchInputType: SearchInputType",
    "  ) {",
    "    Entities(",
    "      type: $type",
    "      limit: $limit",
    "      skip: $skip",
    "      searchValue: $searchValue",
    "      advancedSearchValue: $advancedSearchValue",
    "      advancedFilterInputs: $advancedFilterInputs",
    "      searchInputType: $searchInputType",
    "    ) {",
    "      count",
    "      limit",
    "      results {",
    "        id",
    "        uuid",
    "        type",
    results,
    "      }",
    "      __typename",
    "    }",
    "  }",
  ].join("\n");

  return list;
}

export function renderListFilters(picker: M.UiPicker): string {
  return [
    `  query ${picker.filtersQueryName}($entityType: String!) {`,
    "    EntityTypeFilters(type: $entityType) {",
    renderFilterList(picker.filters, 6),
    "    }",
    "  }",
  ].join("\n");
}

export function renderDetailView(entity: M.UiEntity, indent: number): string {
  const detail = entity.detail;
  if (!detail || detail.columns.length === 0) return "";

  // a panel shows a field once, under its key: the shape without an alias describes it, an aliased twin only reads it
  const propertyByKey = new Map<string, M.UiProperty>();
  for (const property of [...entity.properties.filter((p) => !p.alias), ...entity.properties.filter((p) => p.alias)])
    if (!propertyByKey.has(property.key)) propertyByKey.set(property.key, property);

  const renderPanel = (panel: M.UiPanel, depth: number): string => {
    const lines = [
      `${pad(depth)}${panel.alias}: panels {`,
      `${pad(depth + 2)}panelHeaderContent(panelHeaderContentInput: { label: "${panel.label ?? ""}" }) {`,
      `${pad(depth + 4)}label`,
      `${pad(depth + 2)}}`,
      `${pad(depth + 2)}panelType(input: ${panel.panelType})`,
      `${pad(depth + 2)}isCollapsed(input: ${panel.collapsed})`,
      `${pad(depth + 2)}isEditable(input: ${panel.editable})`,
      ...(panel.multipleColumns ? [`${pad(depth + 2)}canBeMultipleColumns(input: true)`] : []),
    ];
    for (const key of panel.fields) {
      const property = propertyByKey.get(key);
      if (!property) throw new Error(`panel "${panel.alias}" references undeclared property "${key}"`);
      if (property.panelElement) {
        lines.push(renderPanelElement(entity, property, depth + 2));
        continue;
      }
      lines.push(`${pad(depth + 2)}${property.alias ?? key}: metaData {`);
      lines.push(`${pad(depth + 4)}label(input: "${property.label ?? property.key}")`);
      lines.push(`${pad(depth + 4)}key(input: "${key}")`);
      if (property.multilingual) lines.push(`${pad(depth + 4)}isMultilingual(input: true)`);
      if (property.languageIn.length) lines.push(`${pad(depth + 4)}languageIn(input: ${stringList(property.languageIn)})`);
      // an editable panel edits a field with the create form's widget; a nested value always shows its table
      const inputType = property.inputType ?? (panel.editable ? property.editInputType : undefined);
      if (inputType) {
        lines.push(`${pad(depth + 4)}inputField(type: ${inputType}) {`);
        lines.push(`${pad(depth + 6)}...inputfield`);
        if (property.required && panel.editable) {
          lines.push(`${pad(depth + 6)}validation(input: { value: required }) {`);
          lines.push(`${pad(depth + 8)}...validation`);
          lines.push(`${pad(depth + 6)}}`);
        }
        lines.push(`${pad(depth + 4)}}`);
      }
      lines.push(`${pad(depth + 2)}}`);
    }
    for (const spread of panel.spreads) lines.push(`${pad(depth + 2)}...${spread}`);
    lines.push(`${pad(depth)}}`);
    return lines.join("\n");
  };

  const renderElement = (element: M.UiElement, depth: number): string => {
    if (element.kind === "list") {
      const alias = element.alias ? `${element.alias}: ` : "";
      const lines = [
        `${pad(depth)}${alias}entityListElement {`,
        `${pad(depth + 2)}label(input: "${element.label ?? ""}")`,
        ...(element.mediaKind ? [`${pad(depth + 2)}type(input: ${element.mediaKind})`] : []),
        `${pad(depth + 2)}isCollapsed(input: ${element.collapsed ?? false})`,
      ];
      if (element.entityTypes.length > 0) lines.push(`${pad(depth + 2)}entityTypes(input: [${element.entityTypes.join(", ")}])`);
      if (element.relationType) lines.push(`${pad(depth + 2)}relationType: label(input: "${element.relationType}")`);
      if (element.customQuery) lines.push(`${pad(depth + 2)}customQuery(input: "${element.customQuery}")`);
      if (element.customQueryRelationType) lines.push(`${pad(depth + 2)}customQueryRelationType: label(input: "${element.customQueryRelationType}")`);
      if (element.customQueryFilters) lines.push(`${pad(depth + 2)}customQueryFilters(input: "${element.customQueryFilters}")`);
      if (element.searchInputType) lines.push(`${pad(depth + 2)}searchInputType(input: "${element.searchInputType}")`);
      if (element.customBulkOperations)
        lines.push(`${pad(depth + 2)}customBulkOperations(input: "${element.customBulkOperations}")`);
      if (element.pickerList) lines.push(`${pad(depth + 2)}customQueryEntityPickerList(input: "${element.pickerList}")`);
      if (element.pickerFilters)
        lines.push(`${pad(depth + 2)}customQueryEntityPickerListFilters(input: "${element.pickerFilters}")`);
      lines.push(`${pad(depth)}}`);
      return lines.join("\n");
    }
    if (element.kind === "markdown")
      return [
        `${pad(depth)}markdownViewerElement {`,
        `${pad(depth + 2)}label(input: "${element.label ?? ""}")`,
        `${pad(depth + 2)}isCollapsed(input: ${element.collapsed ?? false})`,
        `${pad(depth + 2)}markdownContent(metadataKey: "${element.metadataKey ?? ""}")`,
        `${pad(depth)}}`,
      ].join("\n");
    if (element.kind === "shaclShape")
      return [
        `${pad(depth)}shaclShapeElement {`,
        `${pad(depth + 2)}label(input: "${element.label ?? ""}")`,
        `${pad(depth + 2)}fieldsKey(input: "${element.fieldsKey ?? "shapeFields"}")`,
        `${pad(depth + 2)}isCollapsed(input: ${element.collapsed ?? false})`,
        `${pad(depth)}}`,
      ].join("\n");

    const lines = [`${pad(depth)}${element.alias ? `${element.alias}: ` : ""}windowElement {`, `${pad(depth + 2)}label(input: "${element.label ?? ""}")`];
    if (element.expandButton) {
      lines.push(`${pad(depth + 2)}expandButtonOptions {`);
      lines.push(`${pad(depth + 4)}shown(input: true)`);
      lines.push(`${pad(depth + 2)}}`);
    }
    for (const panel of element.panels) lines.push(renderPanel(panel, depth + 2));
    lines.push(`${pad(depth)}}`);
    return lines.join("\n");
  };

  const columns = detail.columns.map((column, index) => {
    const alias = index === 0 ? "column" : `column${index + 1}: column`;
    return [
      `${pad(indent + 2)}${alias} {`,
      ...(column.size ? [`${pad(indent + 4)}size(size: ${column.size})`] : []),
      `${pad(indent + 4)}elements {`,
      ...column.elements.map((element) => renderElement(element, indent + 6)),
      `${pad(indent + 4)}}`,
      `${pad(indent + 2)}}`,
    ].join("\n");
  });

  return [`${pad(indent)}entityView {`, ...columns, `${pad(indent)}}`].join("\n");
}

// -- whole-file emission -----------------------------------------------------

/** The name of the filters document of a panel list (elody:panelElement elody:ListElement). */
export const panelListFiltersName = (entity: M.UiEntity, property: M.UiProperty) =>
  `${entity.documentName ?? entity.graphqlType}${upperFirst(property.key)}ListFilters`;

/**
 * A property shown as an element inside a panel: the rich-text editor on its metadata key, or the
 * entities its relation points to, listed with Elody's own entity query and a generated filter.
 */
function renderPanelElement(entity: M.UiEntity, property: M.UiProperty, depth: number): string {
  const element = property.panelElement!;
  const label = property.label ?? property.key;
  if (element.kind === "wysiwyg") {
    const lines = [
      `${pad(depth)}${property.key}: wysiwygElement {`,
      `${pad(depth + 2)}label(input: "${label}")`,
      `${pad(depth + 2)}metadataKey(input: "${property.key}")`,
      `${pad(depth + 2)}extensions(input: [starterKit])`,
      // the PWA reads the configuration unguarded (virtualKeyboardLayouts, showLineNumbers)
      `${pad(depth + 2)}wysiwygElementConfiguration {`,
      `${pad(depth + 4)}showLineNumbers(input: false)`,
      `${pad(depth + 2)}}`,
    ];
    if (property.multilingual) lines.push(`${pad(depth + 2)}isMultilingual(input: true)`);
    lines.push(`${pad(depth)}}`);
    return lines.join("\n");
  }
  return [
    `${pad(depth)}${property.key}: entityListElement {`,
    `${pad(depth + 2)}label(input: "${label}")`,
    `${pad(depth + 2)}isCollapsed(input: false)`,
    `${pad(depth + 2)}entityTypes(input: [${element.entityType}])`,
    `${pad(depth + 2)}relationType: label(input: "${element.relationType}")`,
    `${pad(depth + 2)}viewMode(input: Library)`,
    `${pad(depth + 2)}customQuery(input: "GetEntities")`,
    `${pad(depth + 2)}customQueryFilters(input: "${panelListFiltersName(entity, property)}")`,
    `${pad(depth)}}`,
  ].join("\n");
}

/** The filters of a panel list: the related type, and the entities the relation on this entity points to. */
function renderPanelListFilters(entity: M.UiEntity, property: M.UiProperty): string {
  const element = property.panelElement as { entityType: string; relationType: string };
  return [
    `  query ${panelListFiltersName(entity, property)}($entityType: String!) {`,
    "    EntityTypeFilters(type: $entityType) {",
    "      advancedFilters {",
    "        type: advancedFilter(type: type) {",
    "          type",
    `          defaultValue(value: ["${element.entityType}"])`,
    "          hidden(value: true)",
    "        }",
    '        relation: advancedFilter(type: selection, key: ["elody:1|identifiers"]) {',
    "          type",
    "          key",
    `          defaultValue(value: "$entity.relationValues.${element.relationType}.key")`,
    "          hidden(value: true)",
    "        }",
    "      }",
    "    }",
    "  }",
  ].join("\n");
}

export function renderEntityFile(entity: M.UiEntity, declaration: string): string {
  const onType = entity.graphqlType;
  // fragment and document names: elody:documentName when several declarations share a GraphQL type
  const type = entity.documentName ?? entity.graphqlType;
  const low = lowerFirst(type);
  const fragments: string[] = [];

  const minimal: string[] = [`  fragment minimal${type} on ${onType} {`];
  if (entity.dynamicFormConfigField)
    minimal.push(
      entity.dynamicFormConfigField === "dynamicFormConfig"
        ? "    dynamicFormConfig"
        : `    dynamicFormConfig: ${entity.dynamicFormConfigField}`,
    );
  if (entity.portsField) minimal.push(entity.portsField === "ports" ? "    ports" : `    ports: ${entity.portsField}`);
  minimal.push("    intialValues {");
  if (entity.typePills) minimal.push("      ...typePillsIntialValues");
  for (const spread of entity.spreads.listingValues) minimal.push(`      ...${spread}`);
  minimal.push(renderInitialValues(entity, 6, true, true));
  minimal.push("    }");
  if (readsRelationValues(entity, "listing")) minimal.push("    relationValues");
  if (entity.viewModes.length > 0) minimal.push(renderViewModes(entity, 4));
  minimal.push("    teaserMetadata {");
  if (entity.typePills) minimal.push("      ...typePillsTeaserMetadata");
  for (const spread of entity.spreads.card) minimal.push(`      ...${spread}`);
  const contextMenu = renderContextMenu(entity, 6);
  if (contextMenu) minimal.push(contextMenu);
  minimal.push(renderTeaserFields(entity, 6));
  minimal.push("    }");
  minimal.push("    ...minimalBaseEntity");
  minimal.push("  }");
  fragments.push(minimal.join("\n"));

  if (entity.detail) {
    const full: string[] = [`  fragment full${type} on ${onType} {`];
    if (entity.detail.shapeDriven) full.push("    shapeFields");
    full.push("    intialValues {");
    for (const spread of entity.spreads.detailValues) full.push(`      ...${spread}`);
    full.push(renderInitialValues(entity, 6, entity.detailFormatters !== false));
    full.push("    }");
    if (readsRelationValues(entity, "detail")) full.push("    relationValues");
    for (const field of entity.detail.fragmentFields) full.push(`    ${field}`);
    full.push(renderDetailView(entity, 4));
    full.push("  }");
    fragments.push(full.join("\n"));
  }

  const sort = renderSortOptions(entity, 4);
  if (sort) fragments.push([`  fragment ${low}SortOptions on ${onType} {`, sort, "  }"].join("\n"));

  if (entity.filters.length > 0)
    fragments.push([`  fragment filtersFor${type} on ${onType} {`, renderFilters(entity, 4), "  }"].join("\n"));

  const bulkOperations = carriesBulkOperations(entity);
  if (bulkOperations)
    fragments.push(
      [`  fragment ${low}BulkOperations on ${onType} {`, renderBulkOperationOptions(entity.bulkOperations, 4), "  }"].join("\n"),
    );

  const documents: string[] = [];
  if (entity.documents.includes("entities"))
    documents.push(
      [
        `  query Get${type}Entities(`,
        "    $type: Entitytyping!",
        "    $limit: Int",
        "    $skip: Int",
        "    $searchValue: SearchFilter!",
        "    $advancedSearchValue: [FilterInput]",
        "    $advancedFilterInputs: [AdvancedFilterInput!]!",
        "    $searchInputType: SearchInputType",
        "  ) {",
        "    Entities(",
        "      type: $type",
        "      limit: $limit",
        "      skip: $skip",
        "      searchValue: $searchValue",
        "      advancedSearchValue: $advancedSearchValue",
        "      advancedFilterInputs: $advancedFilterInputs",
        "      searchInputType: $searchInputType",
        "    ) {",
        "      count",
        "      limit",
        "      results {",
        "        id",
        "        uuid",
        "        type",
        `        ... on ${onType} {`,
        `          ...minimal${type}`,
        "        }",
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  if (entity.documents.includes("filters"))
    documents.push(
      [
        `  query Get${type}Filters($entityType: String!) {`,
        "    EntityTypeFilters(type: $entityType) {",
        `      ... on ${onType} {`,
        `        ...filtersFor${type}`,
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  if (entity.documents.includes("sortOptions"))
    documents.push(
      [
        `  query Get${type}SortOptions($entityType: String!) {`,
        "    EntityTypeSortOptions(entityType: $entityType) {",
        `      ... on ${onType} {`,
        `        ...${low}SortOptions`,
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  if (bulkOperations && entity.documents.includes("bulkOperations"))
    documents.push(
      [
        `  query Get${type}BulkOperations($entityType: String!) {`,
        "    BulkOperations(entityType: $entityType) {",
        `      ... on ${onType} {`,
        `        ...${low}BulkOperations`,
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );

  for (const form of entity.createForms) documents.push(renderCreateForm(form));

  for (const custom of entity.customBulkOperations)
    documents.push(
      [`  query ${custom.queryName} {`, "    CustomBulkOperations {", renderBulkOperationOptions(custom.operations, 6), "    }", "  }"].join("\n"),
    );

  for (const form of entity.repetitiveForms) documents.push(renderRepetitiveForm(form));

  for (const picker of entity.pickers) documents.push(...renderListQueryDocuments(picker));

  for (const listQuery of entity.listQueries) documents.push(...renderListQueryDocuments(listQuery));

  for (const property of entity.properties)
    if (property.panelElement?.kind === "list") documents.push(renderPanelListFilters(entity, property));

  for (const source of entity.formSources) {
    const params = source.withParent ? "($id: String!, $parentEntityId: String)" : "($id: String!)";
    const args = source.withParent ? "(id: $id, parentEntityId: $parentEntityId)" : "(id: $id)";
    documents.push(
      [
        "  # Field-source document for a runtime SHACL form: the modal asks for",
        "  # it by name (loadDocument), the resolver answers with the",
        "  # shape-derived form definition.",
        `  query ${source.queryName}${params} {`,
        `    ${source.field}${args}`,
        "  }",
      ].join("\n"),
    );
  }

  return [
    `// GENERATED from ${declaration} — do not edit by hand.`,
    "// `pnpm run generate:ui` re-renders this file; the triples are the source.",
    'import { gql } from "graphql-modules";',
    "",
    `export const ${low}Queries = gql\``,
    [...fragments, ...documents].join("\n\n"),
    "`;",
    "",
  ].join("\n");
}

// -- splicing into hand-written files ------------------------------------------

export const startMarker = (id: string, declaration: string) =>
  `# >>> generated:${id} from ${declaration} — do not edit by hand`;
export const endMarker = (id: string) => `# <<< generated:${id}`;

export function replaceRegion(source: string, id: string, content: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => new RegExp(`# >>> generated:${id}(\\s|$)`).test(line));
  const end = lines.findIndex((line) => line.includes(endMarker(id)));
  if (start === -1 || end === -1 || end < start) throw new Error(`region "${id}" not found`);
  return [...lines.slice(0, start + 1), ...(content ? [content] : []), ...lines.slice(end)].join("\n");
}

// -- generated custom input fields ----------------------------------------------

/** The module a client imports: field definitions for ElodyInstance and the BaseFieldType extension. */
export function renderInputFieldsModule(fields: Record<string, unknown>, declaration: string): string {
  const names = Object.keys(fields).sort();
  const definitions = names.map((name) => `  ${name}: ${JSON.stringify(fields[name])},`).join("\n");
  return [
    `// GENERATED from ${declaration} — do not edit by hand.`,
    "// Register with ElodyInstance: customInputFields: generatedInputFields,",
    "// and add generatedInputFieldsSchema to the client's type definitions.",
    'import { gql } from "graphql-modules";',
    "",
    "export const generatedInputFields: Record<string, any> = {",
    definitions,
    "};",
    "",
    "export const generatedInputFieldsSchema = gql`",
    "  extend enum BaseFieldType {",
    ...names.map((name) => `    ${name}`),
    "  }",
    "`;",
    "",
  ].join("\n");
}
