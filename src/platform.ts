/**
 * The platform document (queries/<client>.queries.ts): the app-level operations and fragments every
 * client carries. Constants are rendered from this catalogue, with the flags a client varies them by;
 * the type-wide documents (fullEntity, getEntities, getAdvancedFilters, GetSortOptions, ...) are
 * derived from the declared types.
 */
import type * as M from "./model.js";
import { renderBulkOperationOptions, renderSortOptionsBlock, carriesBulkOperations, renderSortOptions, lowerFirst, bulkFragmentOf, sortFragmentOf } from "./render.js";

const LIST_VARIABLES = ["    $type: Entitytyping!", "    $limit: Int", "    $skip: Int", "    $searchValue: SearchFilter!", "    $advancedSearchValue: [FilterInput]", "    $advancedFilterInputs: [AdvancedFilterInput!]!", "    $searchInputType: SearchInputType"];
const LIST_ARGUMENTS = ["      type: $type", "      limit: $limit", "      skip: $skip", "      searchValue: $searchValue", "      advancedSearchValue: $advancedSearchValue", "      advancedFilterInputs: $advancedFilterInputs", "      searchInputType: $searchInputType"];

/** The platform documents whose text is a constant of the platform (a few flags aside). */
const CONSTANTS: Record<string, (app: M.UiApp) => string> = {
  typePillsIntialValues: () => `  fragment typePillsIntialValues on IntialValues {\n    type: keyValue(key: "type", source: typePillLabel, index: 0, formatter: "pill|auto")\n  }`,
  typePillsTeaserMetadata: () => `  fragment typePillsTeaserMetadata on teaserMetadata {\n    type: metaData {\n      label(input: "metadata.labels.type")\n      key(input: "type")\n    }\n  }`,
  getDirectories: () => `  query getDirectories($dir: String) {\n    Directories(dir: $dir) {\n      id\n      dir\n      has_subdirs\n      parent\n    }\n  }`,
  getFilterOptions: () => `  query getFilterOptions($input: [AdvancedFilterInput!]!, $limit: Int!, $entityType: String!) {\n    FilterOptions(input: $input, limit: $limit, entityType: $entityType) {\n      label\n      value\n    }\n  }`,
  getUserPermissions: () => `  query getUserPermissions {\n    UserPermissions {\n      payload\n    }\n  }`,
  postStartImport: (app) => `  mutation postStartImport($folder: String!) {\n    postStartImport(folder: $folder) {\n      message_id\n      status\n      count${app.importJobId ? "\n      job_id" : ""}\n    }\n  }`,
  linkMediafileToEntity: () => `  mutation linkMediafileToEntity($entityId: String!, $mediaFileInput: MediaFileInput!) {\n    linkMediafileToEntity(entityId: $entityId, mediaFileInput: $mediaFileInput) {\n      _id\n      filename\n      original_file_location\n      thumbnail_file_location\n      mimetype\n      metadata {\n        key\n        value\n      }\n    }\n  }`,
  patchMediaFileMetadata: () => `  mutation patchMediaFileMetadata($mediafileId: String!, $mediaFileInput: [MediaFileMetadataInput]!) {\n    patchMediaFileMetadata(MediafileId: $mediafileId, MediaFileMetadata: $mediaFileInput) {\n      _id\n      filename\n    }\n  }`,
  getMediaRelationedWithMediafFile: () => `  mutation getMediaRelationedWithMediafFile($mediaFileId: String!) {\n    getMediaRelationedWithMediafFile(mediaFileId: $mediaFileId) {\n      ...minimalLinkedMedia\n    }\n  }`,
  mutateEntityValues: (app) =>
    app.preferredLanguage
      ? `  mutation mutateEntityValues($id: String!, $formInput: EntityFormInput!, $collection: Collection!, $preferredLanguage: String) {\n    mutateEntityValues(id: $id, formInput: $formInput, collection: $collection, preferredLanguage: $preferredLanguage) {\n      ...fullEntity\n    }\n  }`
      : `  mutation mutateEntityValues($id: String!, $formInput: EntityFormInput!, $collection: Collection!) {\n    mutateEntityValues(id: $id, formInput: $formInput, collection: $collection) {\n      ...fullEntity\n    }\n  }`,
  deleteData: () => `  mutation deleteData($id: String!, $path: Collection!, $deleteMediafiles: Boolean!) {\n    deleteData(id: $id, path: $path, deleteMediafiles: $deleteMediafiles)\n  }`,
  bulkDeleteEntities: (app) =>
    app.bulkDeleteSkipsRelated
      ? `  mutation bulkDeleteEntities($ids: [String!]!, $path: Collection!, $deleteEntities: DeleteEntitiesInput, $skipItemsWithRelationDuringBulkDelete: [String!]) {\n    bulkDeleteEntities(ids: $ids, path: $path, deleteEntities: $deleteEntities, skipItemsWithRelationDuringBulkDelete: $skipItemsWithRelationDuringBulkDelete)\n  }`
      : `  mutation bulkDeleteEntities($ids: [String!]!, $path: Collection!, $deleteEntities: DeleteEntitiesInput) {\n    bulkDeleteEntities(ids: $ids, path: $path, deleteEntities: $deleteEntities)\n  }`,
  CreateEntity: () => `  mutation CreateEntity($entity: EntityInput!) {\n    CreateEntity(entity: $entity) {\n      ...fullEntity\n    }\n  }`,
  BulkAddRelations: () => `  mutation BulkAddRelations($entityIds: [String!]!, $relationEntityId: String!, $relationType: String!) {\n    bulkAddRelations(entityIds: $entityIds, relationEntityId: $relationEntityId, relationType: $relationType)\n  }`,
  AddEntityRelations: () => `  mutation AddEntityRelations($id: String!, $relations: [BaseRelationValuesInput!]!, $collection: Collection!) {\n    addEntityRelations(id: $id, relations: $relations, collection: $collection)\n  }`,
  GenerateTranscode: () => `  mutation GenerateTranscode($mediafileIds: [String!]!, $transcodeType: TranscodeType!, $masterEntityId: String) {\n    generateTranscode(mediafileIds: $mediafileIds, transcodeType: $transcodeType, masterEntityId: $masterEntityId)\n  }`,
  GetBulkOperationsRelationForm: (app) => {
    // the panel's header in the client's dialect, its fields of the client's own, with or without the panel union
    const header = app.panelHeaderLegacy
      ? [`label(input: "bulk-operations.bulk-edit.relation-types")`]
      : [`panelHeaderContent(panelHeaderContentInput: { label: "bulk-operations.bulk-edit.relation-types" }) {`, "  label", "}"];
    const fields = app.relationFormFields.flatMap((f) => [`${f.alias ?? f.key}: metaData {`, `  label(input: "${f.labelKey ?? f.key}")`, `  key(input: "${f.key}")`, `  inputField(type: ${f.clientInputField ?? "baseTextField"}) {`, "    ...inputfield", "  }", "}"]);
    const inner = [...header, "panelType(input: metadata)", "isEditable(input: true)", "isCollapsed(input: false)", ...fields];
    const panel = app.relationFormFlatPanel ? inner.map((l) => `        ${l}`) : ["        ... on WindowElementPanel {", ...inner.map((l) => `          ${l}`), "        }"];
    return ["  query GetBulkOperationsRelationForm {", "    BulkOperationsRelationForm {", `      label(input: "bulk-operations.bulk-edit.bulk-edit-title")`, "      relations: panels {", ...panel, "      }", "    }", "  }"].join("\n");
  },
  GetGeoFilterForMap: (app) => `  query GetGeoFilterForMap {\n    GeoFilterForMap {\n      advancedFilter(type: geo, key: "${app.geoFilterKey ?? "gps_coordinates"}") {\n        type\n        key\n        bucket\n        hidden(value: true)\n      }\n    }\n  }`,
  GetDropzoneEntityToCreate: (app) => `  query GetDropzoneEntityToCreate {\n    DropzoneEntityToCreate {\n      options(input: [${app.dropzoneOptions.map((o) => `{ icon: ${o.icon ?? "NoIcon"}, label: "${o.labelKey}", value: "${o.value}" }`).join(", ")}]) {\n        icon\n        label\n        value\n      }\n    }\n  }`,
  GetPaginationLimitOptions: (app) => `  query GetPaginationLimitOptions {\n    PaginationLimitOptions {\n      options(input: [${(app.paginationLimits ?? [20, 50, 100]).map((n) => `{ icon: ListOl, label: "${n}", value: ${n} }`).join(", ")}]) {\n        icon\n        label\n        value\n      }\n    }\n  }`,
  GetEntityPickerForm: () => `  query GetEntityPickerForm {\n    GetDynamicForm {\n      import: formTab {\n        formFields {\n          entityPicker: metaData {\n            label(input: "metadata.labels.entity-picker")\n            key(input: "entityPicker")\n            inputField(type: baseEntityPickerField) {\n              ...inputfield\n            }\n          }\n        }\n      }\n    }\n  }`,
  GetEntityPickerFormWithUploadTab: () => `  query GetEntityPickerFormWithUploadTab {\n    GetDynamicForm {\n      import: formTab {\n        formFields {\n          entityPicker: metaData {\n            label(input: "metadata.labels.entity-picker")\n            key(input: "entityPicker")\n            inputField(type: baseEntityPickerField) {\n              ...inputfield\n            }\n          }\n        }\n      }\n      upload: formTab {\n        formFields {\n          uploadContainer {\n            uploadFlow(input: mediafilesOnly)\n            fileUpload: uploadField {\n              label(input: "upload-fields.labels.file-upload")\n              uploadFieldSize(input: normal)\n              uploadFieldType(input: single)\n              inputField(type: baseFileUploadField) {\n                ...inputfield\n              }\n            }\n          }\n          uploadAction: action {\n            label(input: "actions.labels.upload")\n            icon(input: Upload)\n            actionType(input: upload)\n            showsFormErrors(input: true)\n            actionProgressIndicator {\n              type(input: progressSteps)\n              prepareStep: step {\n                label(input: "actions.progress-steps.prepare")\n                stepType(input: prepare)\n                status\n              }\n              uploadStep: step {\n                label(input: "actions.progress-steps.upload")\n                stepType(input: upload)\n                status\n              }\n            }\n          }\n        }\n      }\n    }\n  }`,
  GetBulkOperationCsvExportKeys: (app) => `  query GetBulkOperationCsvExportKeys($entityType: String!) {\n    BulkOperationCsvExportKeys(entityType: $entityType) {\n      options {\n        icon\n        label\n        value${app.csvExportKeysRequired ? "\n        required" : ""}\n      }\n    }\n  }`,
  GetPermissionMappingPerEntityType: () => `  query GetPermissionMappingPerEntityType($type: String!) {\n    PermissionMappingPerEntityType(type: $type)\n  }`,
  GetPermissionMappingCreate: () => `  query GetPermissionMappingCreate($entityType: String!) {\n    PermissionMappingCreate(entityType: $entityType)\n  }`,
  GetPermissionMappingEntityDetail: () => `  query GetPermissionMappingEntityDetail($id: String!, $entityType: String!) {\n    PermissionMappingEntityDetail(id: $id, entityType: $entityType) {\n      permission\n      hasPermission\n    }\n  }`,
  updateMetadataWithCsv: () => `  mutation updateMetadataWithCsv($entityType: String!, $csv: String!) {\n    updateMetadataWithCsv(entityType: $entityType, csv: $csv)\n  }`,
  getGraphData: () => `  query getGraphData($id: String!, $graph: GraphElementInput!) {\n    GraphData(id: $id, graph: $graph)\n  }`,
  GetEntityHistoryVersions: () => `  query GetEntityHistoryVersions($id: String!, $type: String!, $limit: Int, $skip: Int) {\n    EntityHistoryVersions(id: $id, type: $type, limit: $limit, skip: $skip) {\n      versionId\n      documentVersion\n      timestamp\n      editedBy\n    }\n  }`,
};

/** The filter matcher mapping document, under either name, in the current or the old form. */
const filterMatcherMapping = (app: M.UiApp): string => {
  const name = app.filterMatcherQueryName ?? "getFilterMatcherMapping";
  const keys = app.filterMatcherKeys ?? ["text", "date", "number", "selection", "boolean", "type"];
  if (app.filterMatcherLegacy) return `  query ${name} {\n    FilterMatcherMapping {\n${keys.map((k) => `      ${k}`).join("\n")}\n    }\n  }`;
  return `  query ${name} {\n    FilterMatcherMapping(keys: [${keys.map((k) => `"${k}"`).join(", ")}]) {\n      key\n      matchers\n    }\n  }`;
};

/** The names the catalogue knows: constants, the matcher mapping, and the type-wide documents. */
export const PLATFORM_DOCUMENTS = new Set([...Object.keys(CONSTANTS), "GetMenu", "getFilterMatcherMapping", "GetFilterMatcherMapping", "fullEntity", "getEntities", "getTenants", "getEntityById", "getAdvancedFilters", "GetAdvancedFilters", "GetSortOptions", "GetBulkOperations", "getPreviewComponents", "FetchMediafilesOfEntity", "SetPrimaryThumbnail", "SetPrimaryMediafile", "GetHistoryEntities"]);

/** The main declaration of each GraphQL type: not an app, an inline listing, a shared file or another card of the type. */
export function mainEntities(all: M.UiEntity[]): M.UiEntity[] {
  // a layout of an overview page (elody:detailAlone) is no type's main declaration either
  const candidates = all.filter((e) => !e.app && !e.cardName && !e.fragmentsOnly && !e.detailAlone && e.emit !== "inline");
  const seen = new Set<string>();
  const main: M.UiEntity[] = [];
  for (const entity of candidates) {
    if (seen.has(entity.graphqlType)) continue;
    const own = candidates.find((e) => e.graphqlType === entity.graphqlType && (e.documentName ?? e.graphqlType) === e.graphqlType) ?? entity;
    seen.add(entity.graphqlType);
    main.push(own);
  }
  return main;
}

const nameOf = (entity: M.UiEntity) => entity.documentName ?? entity.graphqlType;
/** the detail fragment's name: full<X>, or the client's own (elody:detailName) */
const detailOf = (entity: M.UiEntity) => entity.detailName ?? `full${nameOf(entity)}`;
const onType = (entity: M.UiEntity, spread: string, indent: number) => `${" ".repeat(indent)}... on ${entity.graphqlType} {\n${" ".repeat(indent + 2)}...${spread}\n${" ".repeat(indent)}}`;

/** The (type, fragment) pairs of a type-wide document: derived from the types, then the app's entries applied. */
function pairs(document: string, app: M.UiApp, derivedPairs: { graphqlType: string; spread: string }[]): { graphqlType: string; spread?: string; operations?: M.UiBulkOperation[] }[] {
  const result: { graphqlType: string; spread?: string; operations?: M.UiBulkOperation[] }[] = [...derivedPairs];
  for (const entry of app.typeEntries.filter((e) => e.document === document)) {
    const at = result.findIndex((p) => p.graphqlType === entry.graphqlType);
    if (entry.excluded) {
      if (at >= 0) result.splice(at, 1);
    } else if (entry.fragment || entry.operations || entry.bare) {
      // a bare entry lists the type without a fragment: the document reads only its own fields
      const pair = { graphqlType: entry.graphqlType, spread: entry.fragment, operations: entry.operations };
      if (at >= 0) result[at] = pair;
      else result.push(pair);
    }
  }
  return result;
}
const inline = (list: { graphqlType: string; spread?: string; operations?: M.UiBulkOperation[] }[], indent: number, legacyFormQuery = false) =>
  list.filter((p) => p.spread || p.operations).map((p) =>
    p.operations
      ? [`${" ".repeat(indent)}... on ${p.graphqlType} {`, renderBulkOperationOptions(p.operations, indent + 2, legacyFormQuery), `${" ".repeat(indent)}}`].join("\n")
      : `${" ".repeat(indent)}... on ${p.graphqlType} {\n${" ".repeat(indent + 2)}...${p.spread}\n${" ".repeat(indent)}}`,
  );

/** The type-wide documents, derived from the main declaration of every type. */
function derived(name: string, app: M.UiApp, all: M.UiEntity[]): string | undefined {
  const main = mainEntities(all);
  const cards = main.filter((e) => !e.interface);
  const details = main.filter((e) => e.detail && !e.interface);
  const tenant = main.find((e) => e.graphqlType === "Tenant");
  const mediafile = main.find((e) => e.graphqlType === "MediaFileEntity");
  switch (name) {
    case "fullEntity":
      return [`  fragment fullEntity on Entity {`, "    id", "    uuid", "    type", ...inline(pairs(name, app, details.map((e) => ({ graphqlType: e.graphqlType, spread: detailOf(e) }))), 4), "  }"].join("\n");
    case "getEntities":
      return [`  query getEntities(`, ...LIST_VARIABLES, ...(app.preferredLanguage ? ["    $preferredLanguage: String"] : []), "  ) {", "    Entities(", ...LIST_ARGUMENTS, ...(app.preferredLanguage ? ["      preferredLanguage: $preferredLanguage"] : []), "    ) {", "      count", "      limit", "      results {", "        id", "        uuid", "        type", ...(app.relationValues ? ["        relationValues"] : []), ...inline(pairs(name, app, cards.map((e) => ({ graphqlType: e.graphqlType, spread: e.cardName ?? `minimal${nameOf(e)}` }))), 8), "      }", "    }", "  }"].join("\n");
    case "getTenants":
      return [`  query getTenants {`, "    Tenants {", "      count", "      limit", "      results {", "        id", "        uuid", "        type", ...(tenant ? [onType(tenant, `minimal${nameOf(tenant)}`, 8)] : []), "      }", "    }", "  }"].join("\n");
    case "getEntityById":
      return app.preferredLanguage
        ? `  query getEntityById($id: String!, $type: String!, $preferredLanguage: String) {\n    Entity(id: $id, type: $type, preferredLanguage: $preferredLanguage) {\n${app.readsPermissions ? "      intialValues {\n        canUpdate\n        canDelete\n      }\n" : ""}      ...fullEntity\n    }\n  }`
        : `  query getEntityById($id: String!, $type: String!) {\n    Entity(id: $id, type: $type) {\n${app.readsPermissions ? "      intialValues {\n        canUpdate\n        canDelete\n      }\n" : ""}      ...fullEntity\n    }\n  }`;
    case "getAdvancedFilters":
    case "GetAdvancedFilters":
      return [`  query ${name}($entityType: String!) {`, "    EntityTypeFilters(type: $entityType) {", ...inline(pairs(name, app, main.filter((e) => e.filters.length > 0).map((e) => ({ graphqlType: e.graphqlType, spread: e.filtersFragmentName ?? `filtersFor${nameOf(e)}` }))), 6), "    }", "  }"].join("\n");
    case "GetSortOptions": {
      const base = app.sortOptions.length ? ["      ... on BaseEntity {", renderSortOptionsBlock(app.sortOptions.map((o) => ({ icon: o.icon, labelKey: o.labelKey, value: o.value, primary: o.primary })), 8, false), "      }"] : [];
      return [`  query GetSortOptions($entityType: String!) {`, "    EntityTypeSortOptions(entityType: $entityType) {", ...base, ...inline(pairs(name, app, main.filter((e) => renderSortOptions(e, 4) !== "").map((e) => ({ graphqlType: e.graphqlType, spread: sortFragmentOf(e) }))), 6), "    }", "  }"].join("\n");
    }
    case "GetBulkOperations": {
      const base = ["      ... on BaseEntity {", renderBulkOperationOptions(app.bulkOperationsBase ?? [], 8, app.bulkModalFormQueryLegacy), "      }"];
      return [`  query GetBulkOperations($entityType: String!) {`, "    BulkOperations(entityType: $entityType) {", ...base, ...inline(pairs(name, app, main.filter((e) => carriesBulkOperations(e)).map((e) => ({ graphqlType: e.graphqlType, spread: bulkFragmentOf(e) }))), 6, app.bulkModalFormQueryLegacy), "    }", "  }"].join("\n");
    }
    case "getPreviewComponents": {
      const previews = pairs(name, app, main.filter((e) => e.preview).map((e) => ({ graphqlType: e.graphqlType, spread: e.preview!.fragmentName ?? `previewFor${nameOf(e)}` })));
      return [`  query getPreviewComponents($entityType: String!) {`, "    PreviewComponents(entityType: $entityType) {", ...(previews.length ? inline(previews, 6) : ["      __typename"]), "    }", "  }"].join("\n");
    }
    case "FetchMediafilesOfEntity":
    {
      const shown = pairs(name, app, mediafile ? [{ graphqlType: "MediaFileEntity", spread: `minimal${nameOf(mediafile)}` }] : []);
      return [`  query FetchMediafilesOfEntity($entityIds: [String!]!) {`, "    FetchMediafilesOfEntity(entityIds: $entityIds) {", ...(shown.length ? ["      id", ...shown.filter((p) => p.spread).map((p) => `      ...${p.spread}`)] : ["      __typename"]), "    }", "  }"].join("\n");
    }
    case "GetHistoryEntities":
      // the history listing: the latest versions first, the detail of every type the app lists (elody:typeEntry)
      return [`  query GetHistoryEntities($limit: Int, $skip: Int, $advancedFilterInputs: [AdvancedFilterInput!]!, $type: Entitytyping!) {`, "    EntitiesHistory(", "      type: $type", "      limit: $limit", "      skip: $skip", "      searchInputType: AdvancedInputType", `      searchValue: { value: "", key: "date_updated", order_by: "date_updated", isAsc: false }`, "      advancedFilterInputs: $advancedFilterInputs", "    ) {", "      count", "      results {", "        id", "        uuid", "        type", ...inline(pairs(name, app, []), 8), "      }", "    }", "  }"].join("\n");
    case "SetPrimaryThumbnail":
    case "SetPrimaryMediafile": {
      const media = pairs(name, app, main.filter((e) => ["Media", "Asset"].includes(e.graphqlType) && e.detail).map((e) => ({ graphqlType: e.graphqlType, spread: detailOf(e) })));
      return [`  mutation ${name}($entityId: String!, $mediafileId: String!) {`, `    ${lowerFirst(name)}(entityId: $entityId, mediafileId: $mediafileId) {`, ...(media.length ? inline(media, 6) : ["      __typename"]), "    }", "  }"].join("\n");
    }
  }
  return undefined;
}

/** One menu item with its asked-back fields, its link and its sub-menu, at a depth. */
function renderMenuItem(item: M.UiMenuItem, indent: number): string[] {
  const pad = " ".repeat(indent);
  const args = [`label: "${item.labelKey}"`];
  // every setting is asked back; what a client does not ask back does not count
  const asked = ["label", "entityType", "icon", "isLoggedIn", "requiresAuth", "can"];
  if (item.entityType) args.push(`entityType: ${item.entityType}`);
  if (item.icon) args.push(`icon: ${item.icon}`);
  if (item.isLoggedIn !== undefined) args.push(`isLoggedIn: ${item.isLoggedIn}`);
  if (item.requiresAuth !== undefined) args.push(`requiresAuth: ${item.requiresAuth}`);
  if (item.can?.length) args.push(`can: [${item.can.map((c) => `"${c}"`).join(", ")}]`);
  if (item.route !== undefined) args.push(`typeLink: { route: { destination: "${item.route}" } }`);
  else if (item.modal) {
    const m = [`typeModal: ${item.modal.kind}`, ...(item.modal.form ? [`formQuery: "${item.modal.form}"`] : []), ...(item.modal.closeConfirmation !== undefined ? [`askForCloseConfirmation: ${item.modal.closeConfirmation}`] : []), ...(item.modal.permission ? [`neededPermission: ${item.modal.permission}`] : [])];
    args.push(`typeLink: { modal: { ${m.join(", ")} } }`);
  }
  const lines = [`${pad}${item.alias}: menuItem(`, ...args.map((a) => `${pad}  ${a}`), `${pad}) {`, ...asked.map((a) => `${pad}  ${a}`)];
  // the link asked back: a route's destination, or the modal through the platform's fragment and its fields (what is asked back more does not count)
  if (item.route !== undefined) lines.push(`${pad}  typeLink {`, `${pad}    route {`, `${pad}      destination`, `${pad}    }`, `${pad}  }`);
  else if (item.modal) lines.push(`${pad}  typeLink {`, `${pad}    modal {`, `${pad}      ...menuModalLink`, `${pad}      typeModal`, `${pad}      formQuery`, `${pad}      askForCloseConfirmation`, `${pad}      neededPermission`, `${pad}    }`, `${pad}  }`);
  if (item.subMenu) lines.push(`${pad}  subMenu(name: "${item.subMenu.name}") {`, `${pad}    name`, ...item.subMenu.items.flatMap((sub) => renderMenuItem(sub, indent + 4)), `${pad}  }`);
  lines.push(`${pad}}`);
  return lines;
}

/** The menu document: the app's items, each asking its settings and link back. */
function renderMenu(app: M.UiApp): string {
  return [`  query GetMenu($name: String!) {`, "    Menu(name: $name) {", "      menu {", "        name", ...app.menu.flatMap((item) => renderMenuItem(item, 8)), "      }", "    }", "  }"].join("\n");
}

/** The platform documents the app names, in the catalogue's order, each rendered once. */
export function renderPlatformDocuments(app: M.UiApp, all: M.UiEntity[]): { fragments: string[]; documents: string[]; unknown: string[] } {
  const fragments: string[] = [];
  const documents: string[] = [];
  const unknown: string[] = [];
  for (const name of app.documents) {
    const text = name === "GetMenu" ? renderMenu(app) : name === "getFilterMatcherMapping" || name === "GetFilterMatcherMapping" ? filterMatcherMapping({ ...app, filterMatcherQueryName: name }) : CONSTANTS[name] ? CONSTANTS[name](app) : derived(name, app, all);
    if (!text) unknown.push(name);
    else if (text.startsWith("  fragment ")) fragments.push(text);
    else documents.push(text);
  }
  return { fragments, documents, unknown };
}
