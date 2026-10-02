/**
 * UI model -> GraphQL query documents. Pure string rendering; the model is
 * already resolved. Ported behaviour of the reference generator
 * (generateUiQueries.ts, mat2elody/dishacled), output byte-identical.
 */
import type * as M from "./model.js";

const pad = (depth: number) => " ".repeat(depth);
export const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

export function renderInitialValues(entity: M.UiEntity, indent: number, withFormatters = true): string {
  return entity.properties
    .map((property) => {
      const formatter = withFormatters && property.formatter ? `, formatter: "${property.formatter}"` : "";
      return `${pad(indent)}${property.key}: keyValue(key: "${property.key}", source: metadata${formatter})`;
    })
    .join("\n");
}

export function renderTeaserFields(entity: M.UiEntity, indent: number): string {
  return entity.properties
    .filter((property) => property.teaser)
    .map((property) => {
      const lines = [
        `${pad(indent)}${property.key}: metaData {`,
        `${pad(indent + 2)}label(input: "${property.label ?? property.key}")`,
        `${pad(indent + 2)}key(input: "${property.key}")`,
      ];
      if (property.colSpan !== undefined) lines.push(`${pad(indent + 2)}colSpan(input: "${property.colSpan}")`);
      if (property.unit) lines.push(`${pad(indent + 2)}unit(input: ${property.unit})`);
      lines.push(`${pad(indent)}}`);
      return lines.join("\n");
    })
    .join("\n");
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
  const sortable = entity.properties.filter((property) => property.sortable);
  if (sortable.length === 0) return "";

  const options = sortable
    .map((property) =>
      [
        `${pad(indent + 6)}{`,
        `${pad(indent + 8)}icon: NoIcon`,
        `${pad(indent + 8)}label: "${property.label ?? property.key}"`,
        `${pad(indent + 8)}value: "${property.key}"`,
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
  return renderFilterList(entity.filters, indent);
}

export function renderFilterList(filters: M.UiFilter[], indent: number): string {
  const entries = filters.map((filter) => {
    if (filter.kind === "type")
      return [
        `${pad(indent + 2)}${filter.alias}: advancedFilter(type: type) {`,
        `${pad(indent + 4)}type`,
        `${pad(indent + 4)}defaultValue(value: ${filterDefaultLiteral(filter)})`,
        `${pad(indent + 4)}hidden(value: ${filter.hidden})`,
        `${pad(indent + 2)}}`,
      ].join("\n");

    if (filter.kind === "selection") {
      const key = filter.keyAsList ? `["${filter.key}"]` : `"${filter.key}"`;
      const selection = [
        "type",
        "key",
        ...(filter.defaultValues.length > 0 ? [`defaultValue(value: ${filterDefaultLiteral(filter)})`] : []),
        ...(filter.hidden ? ["hidden(value: true)"] : []),
      ];
      return [
        `${pad(indent + 2)}${filter.alias}: advancedFilter(type: selection, key: ${key}) {`,
        ...selection.map((field) => `${pad(indent + 4)}${field}`),
        `${pad(indent + 2)}}`,
      ].join("\n");
    }

    const args = [
      `type: ${filter.kind}`,
      ...(filter.key ? [`key: ["${filter.key}"]`] : []),
      ...(filter.label ? [`label: "${filter.label}"`] : []),
      ...(filter.displayedByDefault ? ["isDisplayedByDefault: true"] : []),
    ];
    const selection = [
      "type",
      ...(filter.key ? ["key"] : []),
      ...(filter.label ? ["label"] : []),
      ...(filter.displayedByDefault ? ["isDisplayedByDefault"] : []),
      ...(filter.tooltip ? ["tooltip(value: true)"] : []),
    ];
    return [
      `${pad(indent + 2)}${filter.alias}: advancedFilter(`,
      ...args.map((argument) => `${pad(indent + 4)}${argument}`),
      `${pad(indent + 2)}) {`,
      ...selection.map((field) => `${pad(indent + 4)}${field}`),
      `${pad(indent + 2)}}`,
    ].join("\n");
  });

  return [`${pad(indent)}advancedFilters {`, ...entries, `${pad(indent)}}`].join("\n");
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
  const fields = form.fields.map((field) => {
    const lines = [
      `          ${field.key}: metaData {`,
      `            label(input: "${field.label ?? field.key}")`,
      `            key(input: "${field.key}")`,
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

  const submit = form.submit
    ? [
        "          createAction: action {",
        `            label(input: "${form.submit.label ?? ""}")`,
        `            icon(input: ${form.submit.icon ?? "NoIcon"})`,
        "            actionType(input: submit)",
        `            actionQuery(input: "${form.submit.actionQuery ?? ""}")`,
        `            creationType(input: ${form.submit.creationType ?? ""})`,
        "            showsFormErrors(input: true)",
        "          }",
      ].join("\n")
    : "";

  return [
    `  query ${form.queryName} {`,
    "    GetDynamicForm {",
    `      label(input: "${form.label ?? ""}")`,
    "      name: formTab {",
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

export function renderPicker(picker: M.UiPicker): string {
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

  const filters = [
    `  query ${picker.filtersQueryName}($entityType: String!) {`,
    "    EntityTypeFilters(type: $entityType) {",
    renderFilterList(picker.filters, 6),
    "    }",
    "  }",
  ].join("\n");

  return `${list}\n\n${filters}`;
}

export function renderDetailView(entity: M.UiEntity, indent: number): string {
  const detail = entity.detail;
  if (!detail || detail.columns.length === 0) return "";

  const propertyByKey = new Map(entity.properties.map((property) => [property.key, property]));

  const renderPanel = (panel: M.UiPanel, depth: number): string => {
    const lines = [
      `${pad(depth)}${panel.alias}: panels {`,
      `${pad(depth + 2)}panelHeaderContent(panelHeaderContentInput: { label: "${panel.label ?? ""}" }) {`,
      `${pad(depth + 4)}label`,
      `${pad(depth + 2)}}`,
      `${pad(depth + 2)}panelType(input: ${panel.panelType})`,
      `${pad(depth + 2)}isCollapsed(input: ${panel.collapsed})`,
      `${pad(depth + 2)}isEditable(input: ${panel.editable})`,
    ];
    for (const key of panel.fields) {
      const property = propertyByKey.get(key);
      if (!property) throw new Error(`panel "${panel.alias}" references undeclared property "${key}"`);
      lines.push(`${pad(depth + 2)}${key}: metaData {`);
      lines.push(`${pad(depth + 4)}label(input: "${property.label ?? property.key}")`);
      lines.push(`${pad(depth + 4)}key(input: "${key}")`);
      lines.push(`${pad(depth + 2)}}`);
    }
    lines.push(`${pad(depth)}}`);
    return lines.join("\n");
  };

  const renderElement = (element: M.UiElement, depth: number): string => {
    if (element.kind === "list") {
      const alias = element.alias ? `${element.alias}: ` : "";
      const lines = [
        `${pad(depth)}${alias}entityListElement {`,
        `${pad(depth + 2)}label(input: "${element.label ?? ""}")`,
        `${pad(depth + 2)}isCollapsed(input: ${element.collapsed ?? false})`,
      ];
      if (element.entityTypes.length > 0) lines.push(`${pad(depth + 2)}entityTypes(input: [${element.entityTypes.join(", ")}])`);
      if (element.relationType) lines.push(`${pad(depth + 2)}relationType: label(input: "${element.relationType}")`);
      if (element.customQuery) lines.push(`${pad(depth + 2)}customQuery(input: "${element.customQuery}")`);
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

    const lines = [`${pad(depth)}windowElement {`, `${pad(depth + 2)}label(input: "${element.label ?? ""}")`];
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
      `${pad(indent + 4)}size(size: ${column.size})`,
      `${pad(indent + 4)}elements {`,
      ...column.elements.map((element) => renderElement(element, indent + 6)),
      `${pad(indent + 4)}}`,
      `${pad(indent + 2)}}`,
    ].join("\n");
  });

  return [`${pad(indent)}entityView {`, ...columns, `${pad(indent)}}`].join("\n");
}

// -- whole-file emission -----------------------------------------------------

export function renderEntityFile(entity: M.UiEntity, declaration: string): string {
  const type = entity.graphqlType;
  const low = lowerFirst(type);
  const fragments: string[] = [];

  const minimal: string[] = [`  fragment minimal${type} on ${type} {`];
  if (entity.dynamicFormConfigField)
    minimal.push(
      entity.dynamicFormConfigField === "dynamicFormConfig"
        ? "    dynamicFormConfig"
        : `    dynamicFormConfig: ${entity.dynamicFormConfigField}`,
    );
  if (entity.portsField) minimal.push(entity.portsField === "ports" ? "    ports" : `    ports: ${entity.portsField}`);
  minimal.push("    intialValues {");
  if (entity.typePills) minimal.push("      ...typePillsIntialValues");
  minimal.push(renderInitialValues(entity, 6));
  minimal.push("    }");
  minimal.push("    relationValues");
  minimal.push(renderViewModes(entity, 4));
  minimal.push("    teaserMetadata {");
  if (entity.typePills) minimal.push("      ...typePillsTeaserMetadata");
  const contextMenu = renderContextMenu(entity, 6);
  if (contextMenu) minimal.push(contextMenu);
  minimal.push(renderTeaserFields(entity, 6));
  minimal.push("    }");
  minimal.push("    ...minimalBaseEntity");
  minimal.push("  }");
  fragments.push(minimal.join("\n"));

  if (entity.detail) {
    const full: string[] = [`  fragment full${type} on ${type} {`];
    if (entity.detail.shapeDriven) full.push("    shapeFields");
    full.push("    intialValues {");
    full.push(renderInitialValues(entity, 6, false));
    full.push("    }");
    full.push("    relationValues");
    for (const field of entity.detail.fragmentFields) full.push(`    ${field}`);
    full.push(renderDetailView(entity, 4));
    full.push("  }");
    fragments.push(full.join("\n"));
  }

  const sort = renderSortOptions(entity, 4);
  if (sort) fragments.push([`  fragment ${low}SortOptions on ${type} {`, sort, "  }"].join("\n"));

  if (entity.filters.length > 0)
    fragments.push([`  fragment filtersFor${type} on ${type} {`, renderFilters(entity, 4), "  }"].join("\n"));

  fragments.push(
    [`  fragment ${low}BulkOperations on ${type} {`, renderBulkOperationOptions(entity.bulkOperations, 4), "  }"].join("\n"),
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
        `        ... on ${type} {`,
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
        `      ... on ${type} {`,
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
        `      ... on ${type} {`,
        `        ...${low}SortOptions`,
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  if (entity.documents.includes("bulkOperations"))
    documents.push(
      [
        `  query Get${type}BulkOperations($entityType: String!) {`,
        "    BulkOperations(entityType: $entityType) {",
        `      ... on ${type} {`,
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

  for (const picker of entity.pickers) documents.push(renderPicker(picker));

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
