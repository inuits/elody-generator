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
    for (const name of ["minimalAlert", "fullAlert", "minimalGithubProcessor", "fullGithubProcessor", "githubProcessorSortOptions", "filtersForGithubProcessor", "githubProcessorBulkOperations", "GetGithubProcessorEntities", "GetGithubProcessorFilters", "minimalPipeline", "fullPipeline", "pipelineBulkOperations", "GetPipelineCreateForm", "GetProcessorOnPipelineOperations", "GetEntityPickerListForProcessorsInPipeline", "GetEntityPickerFiltersForProcessorsInPipeline"])
      expect(equal, `${name} not equal; notes:\n${notes.join("\n")}`).toContain(name);
    // what is missing is what the extractor does not cover yet, and it says so
    const missing = comparison.definitions.filter((d) => d.status === "missing").map((d) => d.name);
    for (const name of missing) expect(name, "an uncovered document").toMatch(/Picker|Repetitive|Connections|Validation|Config|ListFilters|GetAlertEntities|GetGithubProcessorEntities|GetPipelineEntities|GetGithubProcessorFilters|GetGithubProcessorSortOptions|GetGithubProcessorBulkOperations|GetPipeline|Runner|Processor/);
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
        advancedFilterInputForRetrievingOptions: [{ type: text key: ["vliz:1|properties.title.value"] value: "*" match_exact: false } { type: type, value: "language" }]) {
        type key label isDisplayedByDefault advancedFilterInputForRetrievingOptions { type key value match_exact } tooltip(value: true)
      }
    }
  }`),
    );
    expect(notes, ttl).toEqual([]);
    expect(ttl).toContain('elody:alias "slug"');
    expect(ttl).toContain("elody:listingOnly true");
    expect(ttl).toContain('elody:alias "title"');
    expect(ttl).toContain("elody:detailOnly true");
    expect(ttl).toContain('elody:sortLabelKey "metadata.labels.user.email"');
    expect(ttl).toContain("elody:defaultSortDirection elody:Ascending");
    expect(ttl).toContain('elody:clientInputField "languageTypeField"');
    expect(ttl).toContain('elody:relationType "hasLanguage"');
    expect(ttl).toContain("dash:readOnly true");
    expect(ttl).toContain("elody:mode elody:TableView");
    expect(ttl).toContain('elody:optionsType "language"');
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
    const paths = [...ttl.matchAll(/sh:path em:(\w+) ;\n(?:.*\n)*?.*sh:order (\d+) ;/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(paths.slice(0, 3)).toEqual(["tenant:1", "key:2", "level:3"]);
    // the relation read under title on the detail page keeps title as its path; the listing's title is the alias of key
    expect(ttl).toMatch(/sh:path em:title ;\n(?:.*\n)*?    elody:relationType "isIn" ;\n(?:.*\n)*?    elody:detailOnly true/);
    expect(ttl).toMatch(/sh:path em:key ;\n(?:.*\n)*?    elody:alias "title" ;\n(?:.*\n)*?    elody:listingOnly true/);
    expect(ttl).toContain("elody:readsPermissions true");
    expect(ttl).toContain('elody:validationRule "regex" ;\n    elody:validationValue "^[a-z]+$"');
    expect(ttl).toContain('elody:validationRule "customValue" ;\n    elody:validationValue "min_value:1"');
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
      windowElement { label(input: "w") hideInHistory(input: true) expandButtonOptions { shown(input: false) } panels { panelType(input: metadata) isCollapsed(input: true) Awards: entityListElement { isCollapsed(input: false) entityTypes(input: [award]) relationType: label(input: "refAwards") customQuery(input: "GetAwardsInDetail") customQueryFilters(input: "GetAwardsInEntityFilters") } } }
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
    bulkOperationOptions { options(input: [{ icon: Edit, label: "bulk-operations.edit", value: "edit", actionContext: { entitiesSelectionType: someSelected, labelForTooltip: "t", requiresSameType: true, minSelectedItems: 2, maxSelectedItems: 2 } }]) { icon label value } }
  }
  fragment workSortOptions on Work {
    sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title", primary: true }]) { icon label value } isAsc(input: asc) }
  }`);
    const { ttl, notes, types } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(types.sort()).toEqual(["Work", "WorkInHomeScreen"]);
    expect(notes, ttl).toEqual([]);
    expect(ttl).toContain("elody:listingCore true");
    expect(ttl).toContain('elody:documentName "WorkInHomeScreen"');
    expect(ttl).toContain('elody:cardKey "typePill"');
    expect(ttl).toContain('elody:source elody:RepeatableMetadataSource ;');
    expect(ttl).toContain('elody:repeatableMetadataKey "isbn"');
    expect(ttl).toContain('elody:source elody:ParentRootSource');
    expect(ttl).toContain('elody:parentRelationType "refParentEntity"');
    expect(ttl).toContain('elody:containsRelationPropertyKey "main_author" ;\n    elody:containsRelationPropertyValue "true"');
    expect(ttl).toContain('elody:selectionSpread "advancedFilter"');
    expect(ttl).toContain('elody:elementSpread "entityHistoryVersionList"');
    expect(ttl).toContain('elody:alias "column2"');
    expect(ttl).toContain("ui:WorkUi-panels\n"); expect(ttl).toContain("ui:WorkUi-panels-2\n");
    expect(ttl).toMatch(/ui:WorkUi-panels\n(?:.*\n)*?  elody:element\n    \[ a elody:ListElement ;(?:.*\n)*?    elody:alias "Awards"/);
    expect(ttl).toContain("elody:hideInHistory true");
    expect(ttl).toContain("elody:expandButton false");
    expect(ttl).toContain('[ elody:deleteEntityLabel "d.work" ;\n      elody:deleteRelationsQuery "GetAuthorsInWorkDeleteQuery" ;\n      elody:deleteRelationsFilters "GetAuthorsInDetailFilters" ;\n      elody:deleteRelationsTypes ( "person" "corporation" ) ;\n      elody:deleteRelationsLabel "d.authors" ]');
    expect(ttl).toContain("[ elody:selection elody:SomeSelected ;");
    expect(ttl).not.toContain("elody:activeViewMode");
    expect(ttl).toContain("elody:requiresSameType true ;\n      elody:minSelectedItems 2 ;\n      elody:maxSelectedItems 2 ;");
    expect(ttl).toContain("elody:sortPrimary true");
  });
});
