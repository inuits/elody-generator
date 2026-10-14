/**
 * `extract`: a declaration proposal from hand-written GraphQL, the reverse
 * of `render`. The proof is the round trip: the dishacled golden, extracted
 * and generated again, compares equal for every document the extractor
 * covers, and nothing differs. What it does not cover (pickers, guided flows,
 * form sources) is missing and named in the notes, never wrong.
 */
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareClient, readQueryFiles } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const golden = join(__dirname, "golden", "dishacled-example");

describe("extract: the dishacled golden round trip", () => {
  it("extracts a declaration that validates and regenerates the golden's documents without a difference", async () => {
    const { ttl, notes, types } = extractDeclaration(readQueryFiles(golden), { namespace: "https://dishacled.github.io/demo/ui#" });
    expect(types.sort()).toEqual(["Alert", "GithubProcessor", "Pipeline"]);
    const report = await validateDeclaration(ttl);
    expect(report.issues.map(formatIssue), ttl).toEqual([]);

    const root = mkdtempSync(join(tmpdir(), "elody-extract-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    cpSync(golden, join(root, "src", "queries", "entities"), { recursive: true });
    const declaration = join(root, "extracted.ui.ttl");
    writeFileSync(declaration, ttl);
    const comparison = await compareClient({ client: "golden", declaration, clientSrc: join(root, "src") });
    const differs = comparison.definitions.filter((d) => d.status === "differs").map((d) => `${d.name}: ${d.path}`);
    expect(differs, notes.join("\n")).toEqual([]);
    expect(comparison.definitions.filter((d) => d.status === "extra").map((d) => d.name)).toEqual([]);
    const equal = comparison.definitions.filter((d) => d.status === "equal").map((d) => d.name);
    for (const name of ["minimalAlert", "fullAlert", "minimalGithubProcessor", "fullGithubProcessor", "githubProcessorSortOptions", "filtersForGithubProcessor", "githubProcessorBulkOperations", "GetGithubProcessorEntities", "GetGithubProcessorFilters", "minimalPipeline", "fullPipeline", "pipelineBulkOperations", "GetPipelineCreateForm", "GetProcessorOnPipelineOperations", "GetEntityPickerListForProcessorsInPipeline", "GetEntityPickerFiltersForProcessorsInPipeline", "GetRepetitiveFormForComponent", "ProcessorRelationConfig", "ProcessorConnectionsConfig", "GetPipelineConnections", "GetPipelineValidation"])
      expect(equal, `${name} not equal; notes:\n${notes.join("\n")}`).toContain(name);
    // what is missing is what the extractor does not cover yet, and it says so
    const missing = comparison.definitions.filter((d) => d.status === "missing").map((d) => d.name);
    for (const name of missing) expect(name, "an uncovered document").toMatch(/Picker|ListFilters|GetAlertEntities|GetGithubProcessorEntities|GetPipelineEntities|GetGithubProcessorFilters|GetGithubProcessorSortOptions|GetGithubProcessorBulkOperations|GetPipeline|Runner|Processor/);
  });
});

describe("extract: what hand-written documents say", () => {
  const file = (body: string) => [{ path: "queries/entities/user.queries.ts", source: `import { gql } from "graphql-modules";\nexport const user = gql\`\n${body}\n\`;\n` }];

  it("reads aliases, detail-only fields, sort labels, client fields and panels", () => {
    const { ttl, notes } = extractDeclaration(
      file(`
  fragment minimalUser on User {
    intialValues {
      email: keyValue(key: "email", source: metadata)
      slug: keyValue(key: "id", source: root)
    }
    allowedViewModes { viewModes(input: [{ viewMode: Table }]) { ...viewModes } }
    teaserMetadata { email: metaData { label(input: "metadata.labels.email") key(input: "email") } }
    ...minimalBaseEntity
  }
  fragment fullUser on User {
    intialValues {
      email: keyValue(key: "email", source: metadata)
      first_name: keyValue(key: "first_name", source: metadata)
      language: keyValue(key: "hasLanguage", source: relations, metadataKeyAsLabel: "title")
      title: keyValue(key: "email", source: metadata)
    }
    relationValues
    entityView { column { size(size: seventy) elements { windowElement {
      label(input: "window-element-labels.info-window")
      expandButtonOptions { shown(input: true) }
      userInfo: panels {
        panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.user-panel" }) { label }
        panelType(input: metadata) isCollapsed(input: false) isEditable(input: true)
        first_name: metaData { label(input: "metadata.labels.first-name") key(input: "first_name") inputField(type: baseTextField) { ...inputfield validation(input: { value: required }) { ...validation } } }
        language: metaData { label(input: "metadata.labels.language") key(input: "language") inputField(type: languageTypeField) { ...inputfield } }
        email: metaData { label(input: "metadata.labels.email") key(input: "email") }
      } } } } }
  }
  fragment userSortOptions on User {
    sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.user.email", value: "email" }]) { icon label value } isAsc(input: asc) }
  }
  fragment filtersForUser on User {
    advancedFilters {
      type: advancedFilter(type: type) { type defaultValue(value: "user") hidden(value: true) }
      language: advancedFilter(type: selection key: ["vliz:1|properties.has_language.value"] label: "metadata.labels.language" isDisplayedByDefault: true
        advancedFilterInputForRetrievingOptions: [{ type: text key: ["vliz:1|properties.title.value"] value: "*" match_exact: false operator: or } { type: selection key: ["vliz:1|properties.level.value"] value: ["Rug", "Groeirubriek"] distinct_by: "properties.level.value" match_exact: true } { type: text key: ["vliz:1|properties.audience.value"] value: "ZIZO jeugd" match_exact: true operator: or } { type: type, value: "language", operator: and }]) {
        type key label isDisplayedByDefault advancedFilterInputForRetrievingOptions { type key value match_exact } tooltip(value: true)
      }
    }
  }`),
    );
    expect(notes, ttl).toEqual([]);
    expect(ttl).toContain('elody:alias "slug"');
    // a value read in the listing alone: the flag, or the type's lists (and its twin declared by name)
    expect(ttl).toMatch(/elody:listingOnly true|elody:listingFields \(/);
    expect(ttl).toContain('elody:alias "title"');
    expect(ttl).toMatch(/elody:detailOnly true|elody:detailFields \(/);
    expect(ttl).toContain('elody:sortLabelKey "metadata.labels.user.email"');
    expect(ttl).toContain("elody:defaultSortDirection elody:Ascending");
    expect(ttl).toContain('elody:clientInputField "languageTypeField"');
    expect(ttl).toContain('elody:relationType "hasLanguage"');
    expect(ttl).toContain("dash:readOnly true");
    expect(ttl).toContain("elody:mode elody:TableView");
    expect(ttl).toContain('elody:optionsType "language"');
    expect(ttl).toContain('elody:optionsOperator "or" ;');
    expect(ttl).toContain('elody:optionsTypeOperator "and" ;');
    expect(ttl).toContain('elody:optionsInput [ sh:order 1 ; elody:inputKind elody:SelectionFilter ; elody:key "vliz:1|properties.level.value" ; elody:value ( "Rug" "Groeirubriek" ) ; elody:inputDistinctBy "properties.level.value" ; elody:inputMatchExact true ] ;');
    expect(ttl).toContain('elody:optionsInput [ sh:order 2 ; elody:inputKind elody:TextFilter ; elody:key "vliz:1|properties.audience.value" ; elody:value "ZIZO jeugd" ; elody:inputMatchExact true ; elody:inputOperator "or" ] ;');
    expect(ttl).toContain("elody:field em:first_name , em:language , em:email");
    // relationValues on the detail page only, which the generator derives: nothing to say
    expect(ttl).not.toContain("elody:relationValues");
  });
});

describe("extract: askforceone constructs", () => {
  const file = (body: string) => [{ path: "queries/entities/badge.queries.ts", source: `import { gql } from "graphql-modules";\nexport const badge = gql\`\n${body}\n\`;\n` }];

  it("keeps the card's order for an aliased title, splits a title read differently per page, and reads validations, permissions, options, aliases", () => {
    const { ttl, notes } = extractDeclaration(
      file(`
  fragment minimalBadge on Badge {
    intialValues {
      title: keyValue(key: "key", source: metadata)
      level: keyValue(key: "level", source: metadata)
      tenant: keyValue(key: "isIn", source: relations, metadataKeyAsLabel: "name")
    }
    teaserMetadata {
      tenant: metaData { label(input: "metadata.labels.tenant") key(input: "tenant") }
      title: metaData { label(input: "metadata.labels.key") key(input: "key") }
      level: metaData { label(input: "metadata.labels.level") key(input: "level") }
    }
    ...minimalBaseEntity
  }
  fragment fullBadge on Badge {
    intialValues {
      canUpdate
      canDelete
      key: keyValue(key: "key", source: metadata)
      title: keyValue(key: "isIn", source: relations, metadataKeyAsLabel: "name")
      level: keyValue(key: "level", source: metadata)
    }
    relationValues
    entityView { badgeColumn: column { size(size: seventy) elements { windowElement {
      label(input: "window-element-labels.badge")
      badge: panels {
        panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.badge" }) { label }
        panelType(input: metadata) isCollapsed(input: false) isEditable(input: true) can(input: "update:badge")
        key: metaData { label(input: "metadata.labels.key") key(input: "key") inputField(type: baseTextField) { ...inputfield validation(input: { value: [required, regex], regex: "^[a-z]+$" }) { ...validation } } }
        level: metaData { label(input: "metadata.labels.level") key(input: "level") inputField(type: baseNumberField) { ...inputfield validation(input: { value: [customValue], customValue: "min_value:1" }) { ...validation } } }
      }
    }
    instances: entityListElement { label(input: "l") isCollapsed(input: false) entityTypes(input: [badgeInstance]) customQuery(input: "GetEntities") customQueryFilters(input: "GetInstancesOfBadgeFilters") }
    } } }
  }
  fragment filtersForBadge on Badge {
    advancedFilters {
      usageState: advancedFilter(type: selection key: ["elody:1|metadata.usageState.value"] label: "metadata.labels.usage-state" isDisplayedByDefault: true
        options: [{ label: "metadata.options.usage-state.USED", value: "USED" }]) { type key label isDisplayedByDefault options { label value } }
      tenant: advancedFilter(type: selection key: ["elody:1|relations.isIn.key"] label: "metadata.labels.tenant" isDisplayedByDefault: true selectionOption: checkboxlist
        filterOptionsMapping: { label: "intialValues.title", value: "intialValues.id" } advancedFilterInputForRetrievingOptions: [{ type: type, value: "tenant" }]) {
        type key label isDisplayedByDefault selectionOption filterOptionsMapping { label value } advancedFilterInputForRetrievingOptions { type key value match_exact }
      }
    }
  }
  query GetInstancesOfBadgeFilters($entityType: String!) {
    EntityTypeFilters(type: $entityType) { ... on BadgeInstance { advancedFilters {
      type: advancedFilter(type: type) { type defaultValue(value: "badgeInstance") hidden(value: true) }
    } } }
  }`),
    );
    expect(notes, ttl).toEqual([]);
    // the card's order: tenant, title (the alias of key), level; the detail-only key and relation title follow
    // a property shape is one line when it fits (the compact writer), else one predicate per line
    // a twin declared by name follows the type's node in the file: sort the shapes by their order
    const paths = [...ttl.matchAll(/sh:path em:(\w+) ;\s*sh:order (\d+)/g)].map((m) => `${m[1]}:${m[2]}`).sort((a, b) => Number(a.split(":")[1]) - Number(b.split(":")[1]));
    expect(paths.slice(0, 3)).toEqual(["tenant:1", "key:2", "level:3"]);
    // the relation read under title on the detail page keeps title as its path; the listing's title is the alias of key
    // the title read as a relation on the detail page: a twin declared by name, kept out of the listing by the type's lists
    expect(ttl, ttl.split("\n").filter((l) => /em:title|field-title|Fields \(/.test(l)).join("\n")).toMatch(/sh:path em:title ;\s*sh:order \d+ ;(?:[^\]\n]|\n  )*?elody:relationType "isIn"/);
    expect(ttl).toMatch(/elody:detailOnly true|elody:listingFields \(/);
    expect(ttl).toMatch(/sh:path em:key ;\s*sh:order \d+ ;\s*elody:alias "title"/);
    expect(ttl).toContain("elody:readsPermissions true");
    expect(ttl).toMatch(/elody:validationRule "regex" ;\s+elody:validationValue "\^\[a\-z\]\+\$"/);
    expect(ttl).toMatch(/elody:validationRule "customValue" ;\s+elody:validationValue "min_value:1"/);
    expect(ttl).toContain('elody:can "update:badge"');
    expect(ttl).toContain('elody:alias "badgeColumn"');
    expect(ttl).toContain('elody:option [ sh:order 1 ; elody:labelKey "metadata.options.usage-state.USED" ; elody:value "USED" ]');
    expect(ttl).toContain('elody:optionsType "tenant"');
    expect(ttl).not.toContain("elody:optionsKey");
    expect(ttl).toContain('elody:filtersType "BadgeInstance"');
  });
});

describe("extract: vlacc constructs", () => {
  const file = (body: string) => [{ path: "queries/entities/work.queries.ts", source: `import { gql } from "graphql-modules";\nexport const work = gql\`\n${body}\n\`;\n` }];

  it("reads a split listing, a home-page listing of its own, card keys, value extras, selection and element spreads", () => {
    const files = file(`
  fragment minimalWorkCore on Work {
    intialValues {
      ...typePillsIntialValues
      typePillLabel: keyValue(key: "type", source: typePillLabel, index: 0, formatter: "pill|auto")
      title: keyValue(key: "title", source: metadata)
      isbns: keyValue(key: "isbn_group", source: repeatableMetadata, repeatableMetadataKey: "isbn")
      navigate_to_id: keyValue(key: "id", source: parentRoot, parentRelations: [{ relationType: "refParentEntity" }])
      refAuthors: keyValue(key: "refAuthors", source: relations, metadataKeyAsLabel: "name", containsRelationPropertyKey: "main_author", containsRelationPropertyValue: "true")
    }
    teaserMetadata {
      ...typePillsTeaserMetadata
      typePillLabel: metaData { label(input: "metadata.labels.type") key(input: "typePill") }
      title: metaData { label(input: "metadata.labels.title") key(input: "title") }
    }
    ...minimalBaseEntity
  }
  fragment minimalWork on Work {
    ...minimalWorkCore
    allowedViewModes { viewModes(input: [{ viewMode: Table }]) { ...viewModes } }
  }
  fragment minimalWorkInHomeScreen on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    allowedViewModes { viewModes(input: [{ viewMode: ViewModesList }]) { ...viewModes } }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullWork on Work {
    intialValues { title: keyValue(key: "title", source: metadata) }
    deleteQueryOptions {
      deleteEntityLabel(input: "d.work")
      customQueryDeleteRelations(input: "GetAuthorsInWorkDeleteQuery")
      customQueryDeleteRelationsFilters(input: "GetAuthorsInDetailFilters")
      customQueryEntityTypes(input: [person, corporation])
      deleteRelationsLabel(input: "d.authors")
    }
    relationValues
    entityView { column2: column { size(size: fifty) elements {
      windowElement { label(input: "w") hideInHistory(input: true) expandButtonOptions { shown(input: false) } windowElementStatus(windowElementStatusInput: { label: "metadata.labels.status" statusMetadataKey: "status_field" statusInputFieldType: recordVerifiedStatusTypeField }) { ...windowElementStatus } panels { panelType(input: metadata) isCollapsed(input: true) Awards: entityListElement { isCollapsed(input: false) entityTypes(input: [award]) relationType: label(input: "refAwards") customQuery(input: "GetAwardsInDetail") customQueryFilters(input: "GetAwardsInEntityFilters") addEntitiesToForms(input: true) actionsOnResult { type(input: NoResult) options(input: [{ icon: PlusCircle, label: "bulk-operations.create-award", value: "addRelation", primary: true, actionContext: { entitiesSelectionType: noneSelected, labelForTooltip: "t" }, bulkOperationModal: { typeModal: DynamicForm, formQueries: ["GetBasicWorkCreateForm"], formRelationType: "refAwards", askForCloseConfirmation: true, neededPermission: cancreate } }]) { icon label value primary actionContext { entitiesSelectionType labelForTooltip } bulkOperationModal { ...bulkOperationModal } } } } } }
      other: windowElement { label(input: "o") panels { panelType(input: metadata) isCollapsed(input: false) title: metaData { label(input: "metadata.labels.title") key(input: "title") } } }
      windowElement { label(input: "w") info: panels { panelHeaderContent(panelHeaderContentInput: { label: "p" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: true) title: metaData { label(input: "metadata.labels.title") key(input: "title") } } }
      ...entityHistoryVersionList
    } } }
  }
  fragment filtersForWork on Work {
    advancedFilters {
      title: advancedFilter(type: text key: ["vlacc:1|metadata.title.value"] label: "metadata.labels.title" isDisplayedByDefault: true) { ...advancedFilter }
    }
  }
  fragment workBulkOperations on Work {
    bulkOperationOptions { options(input: [{ icon: Edit, label: "bulk-operations.edit", value: "edit", actionContext: { entitiesSelectionType: someSelected, labelForTooltip: "t", requiresSameType: true, minSelectedItems: 2, maxSelectedItems: 2 } }
      { label: "bulk-operations.merge", value: "mergeEntities", primary: false, actionContext: { entitiesSelectionType: someSelected, matchMetadataValue: [{ matchKey: "ocr_locked", matchValue: "false" }], labelForTooltip: "t" }, bulkOperationModal: { typeModal: BulkOperationsMerge, formQueries: ["GetFullWorkCreateForm", "GetBasicWorkCreateForm"], askForCloseConfirmation: true, neededPermission: canupdate, skipItemsWithRelationDuringBulkDelete: ["isAssetFor"], enableImageCrop: true, keyToSaveCropCoordinates: "coordinates", replaceExistingRelations: true, selectionLimit: 1, survivorSuggestion: { strategy: identifierIntegrity, autoSelect: true, requireRecommendedSurvivor: true, hiddenVerdicts: [invalid] } } }
      { icon: PlusCircle, label: "bulk-operations.create", value: "openDropdown", primary: true, subOptions: [{ icon: PlusCircle, label: "bulk-operations.create-word", value: "createEntity", bulkOperationModal: { typeModal: DynamicForm, formQueries: ["GetFullWorkCreateForm"], askForCloseConfirmation: true, neededPermission: cancreate, pageToNavigateToAfterCreation: detailPage } }] }]) { icon label value subOptions { ...subOptions } } }
  }
  fragment workSortOptions on Work {
    sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title", primary: true }]) { icon label value } isAsc(input: asc) }
  }
  query GetFullWorkCreateForm {
    GetDynamicForm { label(input: "navigation.create-work") Work: formTab { formFields {
      ...basicCreateWorkFields
      record_type: metaData { label(input: "metadata.labels.record-type") key(input: "record_type") inputField(type: baseTextField) { ...inputfield validation(input: { value: required }) { ...validation } } }
      createAction: action { label(input: "actions.labels.create") icon(input: Create) actionType(input: submit) actionQuery(input: "CreateEntity") creationType(input: work) }
    } } }
  }
  query GetBasicWorkCreateForm {
    GetDynamicForm { label(input: "navigation.create-work") Work: formTab {
      copyFromParent(input: { autoCopy: true, keyMap: [{ key: "ref_languages", fromKey: "ref_work_languages" }] }) { ...copyFromParent }
      formFields {
      ...basicCreateWorkFields
      is_omnibus: metaData { label(input: "metadata.labels.is-omnibus") key(input: "is_omnibus") inputField(type: baseCheckbox) { ...inputfield } hiddenField(input: { hidden: true }) { ...hiddenField } }
      refWork: metaData { label(input: "metadata.labels.work") key(input: "refWork") inputField(type: refWorkInReadingTypeField) { validation(input: { value: [has_required_relation], has_required_relation: { relationType: "refWork", amount: 1 } }) { ...validation } ...inputfield } }
      createAction: action { label(input: "actions.labels.create") icon(input: Create) actionType(input: submit) actionQuery(input: "CreateEntity") creationType(input: work) }
    } } }
  }`);
    const { ttl, notes, types } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(types.sort()).toEqual(["Work", "WorkInHomeScreen"]);
    expect(notes, ttl).toEqual([]);
    expect(ttl).toContain("elody:listingCore true");
    expect(ttl).toContain('elody:documentName "WorkInHomeScreen"');
    expect(ttl).toContain('elody:cardKey "typePill"');
    expect(ttl).toMatch(/elody:source elody:RepeatableMetadataSource [;\]]/);
    expect(ttl).toContain('elody:repeatableMetadataKey "isbn"');
    expect(ttl).toContain('elody:source elody:ParentRootSource');
    expect(ttl).toContain('elody:parentRelationType "refParentEntity"');
    expect(ttl).toMatch(/elody:containsRelationPropertyKey "main_author" ;\s+elody:containsRelationPropertyValue "true"/);
    expect(ttl).toContain('elody:selectionSpread "advancedFilter"');
    expect(ttl).toContain('elody:elementSpread "entityHistoryVersionList"');
    expect(ttl).toContain('elody:alias "column2"');
    // a list inside a panel without a label of its own: relationType: label(...) is not its label
    expect(ttl).toMatch(/elody:alias "Awards" ;\n(?:.*\n)*?    elody:relationType "refAwards"/);
    expect(ttl).not.toContain('rdfs:label "refAwards"');
    expect(ttl).toContain("ui:WorkUi-panels\n"); expect(ttl).toContain("ui:WorkUi-panels-2\n");
    expect(ttl).toMatch(/ui:WorkUi-panels\n(?:.*\n)*?  elody:element\n    \[ a elody:ListElement ;(?:.*\n)*?    elody:alias "Awards"/);
    expect(ttl).toContain("elody:hideInHistory true");
    expect(ttl).toContain("elody:expandButton false");
    expect(ttl).toMatch(/\[ elody:deleteEntityLabel "d\.work" ;\s+  elody:deleteRelationsQuery "GetAuthorsInWorkDeleteQuery" ;\s+  elody:deleteRelationsFilters "GetAuthorsInDetailFilters" ;\s+  elody:deleteRelationsTypes \( "person" "corporation" \) ;\s+  elody:deleteRelationsLabel "d\.authors" \]/);
    expect(ttl).toContain("[ elody:selection elody:SomeSelected ;");
    expect(ttl).not.toContain("elody:activeViewMode");
    expect(ttl).toMatch(/elody:requiresSameType true ;\s+  elody:minSelectedItems 2 ;\s+  elody:maxSelectedItems 2 ;/);
    expect(ttl).toContain("elody:sortPrimary true");
    expect(ttl).toMatch(/elody:operationKind elody:OpenDropdownOperation ;\n    elody:primary true ;\n    elody:subOperation\n      \[ rdfs:label "bulk-operations.create-word" ;/);
    expect(ttl).toContain('elody:navigateAfterCreation "detailPage"');
    expect(ttl).toContain('elody:matchMetadataValue [ elody:matchKey "ocr_locked" ; elody:matchValue "false" ] ;');
    expect(ttl).toContain('elody:windowStatus [ elody:labelKey "metadata.labels.status" ; elody:statusKey "status_field" ; elody:statusInputField "recordVerifiedStatusTypeField" ] ;');
    expect(ttl).toContain("elody:addEntitiesToForms true ;");
    expect(ttl).toMatch(/elody:actionsOnResult \[ elody:resultKind elody:NoResult ;\n\s+elody:operation\n\s+\[ rdfs:label "bulk-operations.create-award" ;/);
    expect(ttl).toContain("elody:forms ( ui:GetFullWorkCreateForm ui:GetBasicWorkCreateForm ) ;");
    expect(ttl).toMatch(/elody:skipRelatedItems "isAssetFor" ;\s+  elody:imageCrop true ;\s+  elody:cropCoordinatesKey "coordinates" ;\s+  elody:replaceExistingRelations true ;\s+  elody:selectionLimit 1 ;/);
    expect(ttl).toContain("elody:survivorSuggestion [ elody:survivorStrategy elody:IdentifierIntegrityStrategy ; elody:autoSelectSurvivor true ; elody:requireRecommendedSurvivor true ; elody:hiddenVerdict elody:InvalidVerdict ] ]");
    expect(notes.filter((n) => n.includes("has no term"))).toEqual([]);
    // every Get*CreateForm of the type's file is a form of the type, spreads said
    expect(ttl).toContain("elody:form ui:GetFullWorkCreateForm , ui:GetBasicWorkCreateForm");
    expect(ttl).toContain('elody:copyFromParent [ elody:autoCopy true ; elody:copyKey [ sh:order 1 ; elody:key "ref_languages" ; elody:fromKey "ref_work_languages" ] ] ;');
    expect(ttl).toContain("dash:hidden true");
    expect(ttl).toMatch(/elody:validationRule "has_required_relation" ;\s+  elody:validationRelationType "refWork" ;\s+  elody:validationAmount 1 ;/);
  });
});

describe("extract: an interface and the fragments its file holds", () => {
  it("declares the interface from its filters, the fields, elements and values fragments, and the subtype apart", () => {
    const files = [
      { path: "queries/entities/works/work.queries.ts", source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment workSortOptions on Work { sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title" }]) { icon label value } } }
  fragment filtersForWork on Work { advancedFilters { title: advancedFilter(type: text key: ["vlacc:1|metadata.title.value"] label: "metadata.labels.title" isDisplayedByDefault: true) { type key label isDisplayedByDefault } } }
  fragment basicCreateWorkFields on FormFields {
    original_headtitle: metaData { label(input: "metadata.labels.headtitle") key(input: "original_headtitle") inputField(type: baseTextField) { ...inputfield validation(input: { value: required }) { ...validation } } }
  }
  fragment workTitleDataIntialValues on IntialValues {
    refUniformTitles: keyValue(key: "refUniformTitles", source: relations, metadataKeyAsLabel: "title")
    parallel_title_group: keyValue(key: "parallel_title_group", source: metadata)
  }
  fragment workTitleDataTeaserMetadata on teaserMetadata {
    refUniformTitles: metaData { label(input: "metadata.labels.uniform-title") key(input: "refUniformTitles") }
    parallel_title_group: metaData { label(input: "metadata.labels.parallel-title") key(input: "parallel_title_group") }
  }
  fragment workTitleDataWindowElement on EntityViewElements {
    titleData: windowElement { label(input: "window-element-labels.title-data") titleData: panels { panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.title-data" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: false)
      refUniformTitles: metaData { label(input: "metadata.labels.uniform-title") key(input: "refUniformTitles") }
      parallel_title_group: metaData { label(input: "metadata.labels.parallel-title") key(input: "parallel_title_group") } } }
  }
\`;\n` },
      { path: "queries/entities/works/workWord.queries.ts", source: `import { gql } from "graphql-modules";\nexport const workWord = gql\`
  fragment minimalWorkWord on WorkWord { intialValues { title: keyValue(key: "title", source: metadata) } teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } } ...minimalBaseEntity }
  fragment fullWorkWord on WorkWord { intialValues { title: keyValue(key: "title", source: metadata) ...workTitleDataIntialValues } relationValues entityView { column { elements { ...workTitleDataWindowElement } } } }
  query GetFullWorkWordCreateForm { GetDynamicForm { label(input: "navigation.create-work") Work: formTab { formFields { ...basicCreateWorkFields createAction: action { label(input: "actions.labels.create") icon(input: Create) actionType(input: submit) actionQuery(input: "CreateEntity") creationType(input: work_word) } } } } }
\`;\n` },
    ];
    const { ttl, notes, types } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes, ttl).toEqual([]);
    expect(types.sort()).toEqual(["Work", "WorkWord"]);
    expect(ttl).toContain("elody:interface true");
    expect(ttl).toContain('elody:fragmentName "basicCreateWorkFields" ;');
    expect(ttl).toMatch(/elody:elementsFragment\n    \[ elody:fragmentName "workTitleDataWindowElement" ;\n    elody:element\n      \[ a elody:WindowElement/);
    expect(ttl).toContain('[ elody:fragmentName "workTitleDataIntialValues" ; elody:cardFragmentName "workTitleDataTeaserMetadata" ; elody:field em:refUniformTitles , em:parallel_title_group ]');
    expect(ttl).toContain('elody:fieldsSpread "basicCreateWorkFields"');
    expect(ttl).toContain('elody:elementSpread "workTitleDataWindowElement"');
    expect(ttl).toContain('elody:detailValuesSpread "workTitleDataIntialValues"');
  });

  it("declares a custom bulk operations set two types' elements name once, with a modal picker and the delete flow's filters", () => {
    const list = (type: string) => `fragment minimal${type} on ${type} { intialValues { title: keyValue(key: "title", source: metadata) } teaserMetadata { title: metaData { label(input: "l") key(input: "title") } } ...minimalBaseEntity }
  fragment full${type} on ${type} { intialValues { title: keyValue(key: "title", source: metadata) }
    deleteQueryOptions { deleteEntityLabel(input: "d") customQueryDeleteRelations(input: "GetAuthorsInWorkDeleteQuery") customQueryDeleteRelationsFilters(input: "GetAuthorsInDetailFilters") }
    relationValues entityView { column { elements { Subjects: entityListElement { label(input: "s") isCollapsed(input: false) entityTypes(input: [person]) customQuery(input: "GetSubjects") customBulkOperations(input: "GetBulkOperationsForSubjectsInWork") } } } } }`;
    const files = [
      { path: "queries/entities/works/work.queries.ts", source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  query GetBulkOperationsForSubjectsInWork { CustomBulkOperations { bulkOperationOptions { options(input: [
    { icon: PlusCircle, label: "add", value: "addRelation", primary: true, bulkOperationModal: { typeModal: EntityPicker, customQueryEntityPickerList: "GetEntityPickerListForSubjectsInWork", customQueryEntityPickerListFilters: "GetEntityPickerFiltersForSubjectsInWork" } }
    { icon: Minus, label: "remove", value: "removeRelation" } ]) { icon label value } } } }
  query GetEntityPickerFiltersForSubjectsInWork($entityType: String!) { EntityTypeFilters(type: $entityType) { advancedFilters { type: advancedFilter(type: type) { type defaultValue(value: "person") hidden(value: true) } } } }
  query GetAuthorsInDetailFilters($entityType: String!) { EntityTypeFilters(type: $entityType) { advancedFilters { type: advancedFilter(type: type) { type defaultValue(value: "person") hidden(value: true) } } } }
\`;\n` },
      { path: "queries/entities/works/workWord.queries.ts", source: `import { gql } from "graphql-modules";\nexport const a = gql\`\n${list("WorkWord")}\n\`;\n` },
      { path: "queries/entities/works/workMap.queries.ts", source: `import { gql } from "graphql-modules";\nexport const b = gql\`\n${list("WorkMap")}\n\`;\n` },
    ];
    const { ttl } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(ttl.match(/^ui:GetBulkOperationsForSubjectsInWork$/gm)?.length).toBe(1);
    expect(ttl.match(/elody:primary true/g)?.length).toBe(1);
    expect(ttl).toContain("elody:picker ui:GetEntityPickerListForSubjectsInWork ;");
    expect(ttl).toContain("elody:listQuery ui:GetAuthorsInWorkDeleteQuery ;");
    expect(ttl.match(/^ui:GetAuthorsInWorkDeleteQuery$/gm)?.length).toBe(1);
  });
});

describe("extract: results selected inline", () => {
  it("declares a listing of the document alone, emitted inline, next to the spreads", () => {
    const files = [
      { path: "queries/entities/work.queries.ts", source: `import { gql } from "graphql-modules";\nexport const work = gql\`
  fragment minimalWork on Work { intialValues { title: keyValue(key: "title", source: metadata) } teaserMetadata { title: metaData { label(input: "l") key(input: "title") } } ...minimalBaseEntity }
  fragment fullWork on Work { intialValues { title: keyValue(key: "title", source: metadata) } relationValues entityView { column { elements {
    Authors: entityListElement { label(input: "a") isCollapsed(input: false) entityTypes(input: [person]) relationType: label(input: "refAuthors") customQuery(input: "GetAuthors") customQueryFilters(input: "GetAuthorsInWorkFilters") } } } } }
  query GetAuthors($type: Entitytyping!, $limit: Int, $skip: Int, $searchValue: SearchFilter!, $advancedSearchValue: [FilterInput], $advancedFilterInputs: [AdvancedFilterInput!]!, $searchInputType: SearchInputType, $userUuid: String!) {
    Entities(type: $type, limit: $limit, skip: $skip, searchValue: $searchValue, advancedSearchValue: $advancedSearchValue, advancedFilterInputs: $advancedFilterInputs, searchInputType: $searchInputType) {
      count limit results { id uuid type
        ... on Person { intialValues { name: keyValue(key: "name", source: metadata) main_author: keyValue(key: "main_author", source: relationMetadata, uuid: $userUuid, relationKey: "refAuthors") roles: keyValue(key: "roles", source: relationRootdata, uuid: $userUuid, relationKey: "isUserFor") } relationValues allowedViewModes { viewModes(input: [{ viewMode: ViewModesList }]) { ...viewModes } } teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } roles: relationRootData { label(input: "metadata.labels.roles") key(input: "roles") inputField(type: rolesTypeField) { ...inputfield } } } }
        ... on Corporation { ...minimalCorporation __typename teaserMetadata { buttons { contextMenu { ...basicContextMenuActions doLinkAction { label(input: "l") icon(input: "AngleRight") __typename } } } name: metaData { label(input: "metadata.labels.name") key(input: "name") } } }
      } __typename } }
  query GetAuthorsInWorkFilters($entityType: String!) { EntityTypeFilters(type: $entityType) { advancedFilters { type: advancedFilter(type: type) { type defaultValue(value: "person") hidden(value: true) } } } }
\`;\n` },
    ];
    const { ttl, notes, types } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes, ttl).toEqual([]);
    expect(types).toEqual(["Work"]);
    expect(ttl).toContain('[ elody:graphqlType "Person" ; sh:order 1 ; elody:listing ui:PersonInGetAuthorsUi ]');
    expect(ttl).toContain('[ elody:graphqlType "Corporation" ; sh:order 2 ; elody:fragment "minimalCorporation" ; elody:listing ui:CorporationInGetAuthorsUi ]');
    expect(ttl).toMatch(/ui:PersonInGetAuthorsUi\n  a elody:EntityUi ;\n  elody:graphqlType "Person" ;\n  elody:documentName "PersonInGetAuthors" ;\n  elody:emit "inline" ;/);
    expect(ttl).toMatch(/elody:source elody:RelationMetadataSource [;\]]/);
    expect(ttl).toMatch(/elody:relationKey "refAuthors" ;\s+elody:readsHost true [;\]]/);
    expect(ttl).toMatch(/elody:cardField "relationRootData" ;\s+elody:cardEditable true ;/);
    expect(ttl).toContain('elody:clientInputField "rolesTypeField"');
    expect(ttl).toMatch(/ui:CorporationInGetAuthorsUi\n(?:.*\n)*?.*elody:readsValue false/);
    expect(ttl).toMatch(/ui:CorporationInGetAuthorsUi\n(?:.*\n)*?  elody:contextMenu\n    \[ elody:includeBasicActions true ;\n    elody:menuInButtons true ;/);
    expect(ttl).toMatch(/elody:alias "doLinkAction" ;\s+  elody:actionForm "doLinkAction" ;/);
  });
});
