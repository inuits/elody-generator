/**
 * Batch 45: the last client-side leftovers of the gap list, proven as a round trip. Hand-written
 * GraphQL carrying a unit on a form field, a detail that spreads its listing, a filter asking a
 * bare parentKey back and refusing the old option fetch, a one-of validation, a conditional
 * bulk operation set with allowed conditions, a copied key from a relation, a single-entity read
 * with a fixed type and collection, and an entities document reading bare results, is extracted,
 * validated, generated again and compared equal to itself.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareClient } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const gql = (name: string, body: string) => ({ path: `queries/entities/${name}.queries.ts`, source: `import { gql } from "graphql-modules";\nexport const ${name} = gql\`\n${body}\n\`;\n` });

const files = [
  gql(
    "area",
    `
  fragment minimalArea on Area {
    intialValues { name: keyValue(key: "name", source: metadata) }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    ...minimalBaseEntity
  }
  fragment fullArea on Area {
    ...minimalArea
    entityView { column { size(size: fifty) elements {
      mapElement {
        label(input: "element-labels.map-element")
        isCollapsed(input: false)
        type(input: wktMap)
        center(input: "gps_coordinates")
        wkt: metaData { key(input: "map_location") }
        config(input: [{ key: "overlayWkt", value: { query: "GetAreaRefSitesWkt", entityType: "site", wktKey: "map_location" } }]) { key value }
      }
    } } }
  }
  query GetAreaRefSitesWkt($type: Entitytyping!, $limit: Int, $skip: Int, $searchValue: SearchFilter!, $advancedSearchValue: [FilterInput], $advancedFilterInputs: [AdvancedFilterInput!]!, $searchInputType: SearchInputType) {
    Entities(type: $type, limit: $limit, skip: $skip, searchValue: $searchValue, advancedSearchValue: $advancedSearchValue, advancedFilterInputs: $advancedFilterInputs, searchInputType: $searchInputType) {
      results {
        id
        intialValues {
          id: keyValue(key: "id", source: root)
          name: keyValue(key: "name", source: metadata)
          map_location: keyValue(key: "map_location", source: metadata)
        }
      }
    }
  }
`,
  ),
  gql(
    "expression",
    `
  fragment minimalExpression on Expression {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullExpression on Expression {
    intialValues { title: keyValue(key: "title", source: metadata) }
    entityView { column { size(size: fifty) elements {
      manifestations: entityListElement {
        label(input: "element-labels.manifestations")
        isCollapsed(input: false)
        entityTypes(input: [manifestation])
        relationType: label(input: "refExpressions")
        searchInputType(input: "AdvancedInputType")
        customQuery(input: "GetManifestations")
        customBulkOperations(input: "GetBulkOperationsForManifestationsInExpression")
        fetchDeepRelations {
          deepRelationsFetchStrategy(input: useMethodsAndFetch)
          entityTypes(input: [work_serial])
          routeConfig(input: [{ relation: "relationValues.refWork.key", key: ["vlacc:1|identifiers"], entityType: [work_serial] }]) { relation key entityType overviewPage }
          amountOfRecursions(input: 2)
        }
      }
    } } }
  }
  query GetBulkOperationsForManifestationsInExpression($work_type: String) {
    CustomBulkOperations {
      bulkOperationOptions {
        options(
          condition: $work_type
          input: [
            {
              icon: PlusCircle
              label: "bulk-operations.create-serial"
              value: "addRelation"
              primary: true
              allowCondition: ["work_serial"]
              actionContext: { entitiesSelectionType: noneSelected, labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected" }
              bulkOperationModal: { typeModal: DynamicForm, formQueries: ["GetManifestationSerialCreateForm"], formRelationType: "refExpressions", askForCloseConfirmation: true, neededPermission: cancreate, pageToNavigateToAfterCreation: detailPage }
            }
            {
              icon: PlusCircle
              label: "bulk-operations.create-map"
              value: "addRelation"
              primary: true
              allowCondition: ["work_map"]
              actionContext: { entitiesSelectionType: noneSelected, labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected" }
              bulkOperationModal: { typeModal: DynamicForm, formQueries: ["GetManifestationMapCreateForm"], formRelationType: "refExpressions", askForCloseConfirmation: true, neededPermission: cancreate, pageToNavigateToAfterCreation: detailPage }
            }
          ]
        ) {
          icon
          label
          value
          primary
          actionContext { ...actionContext }
          bulkOperationModal { ...bulkOperationModal }
          subOptions { ...subOptions }
        }
      }
    }
  }
`,
  ),
  gql(
    "token",
    `
  fragment minimalToken on Token {
    intialValues { name: keyValue(key: "name", source: metadata) }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    ...minimalBaseEntity
  }
  fragment fullToken on Token {
    intialValues { name: keyValue(key: "name", source: metadata) }
    entityView { column { size(size: fifty) elements {
      secret: windowElement {
        label(input: "element-labels.secret")
        panel: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.secret" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: false)
          _key: metaData {
            label(input: "metadata.labels.token-key")
            key(input: "_key")
            masked(input: true)
            revealQuery(input: "GetTokenSecret")
            copyToClipboard(input: true)
          }
          last_activity_at: metaData {
            label(input: "metadata.labels.last-activity")
            key(input: "last_activity_at")
            unit(input: DATETIME_DEFAULT)
          }
        }
      }
    } } }
  }
  query GetTokenSecret($id: String!) {
    Entity(id: $id, type: "token", collection: tokens) {
      id
      ... on Token {
        intialValues { _key: keyValue(key: "_key", source: metadata) }
      }
    }
  }
`,
  ),
  gql(
    "tenant",
    `
  fragment minimalTenant on Tenant {
    intialValues { name: keyValue(key: "name", source: metadata) }
    teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } }
    ...minimalBaseEntity
  }
  fragment fullTenant on Tenant {
    intialValues { name: keyValue(key: "name", source: metadata) }
    entityView { column { size(size: fifty) elements {
      info: windowElement {
        label(input: "element-labels.info")
        panel: panels {
          panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.info" }) { label }
          panelType(input: metadata)
          isCollapsed(input: false)
          isEditable(input: true)
          dateOfCreation: metaData {
            label(input: "metadata.labels.date-of-creation")
            key(input: "dateOfCreation")
            unit(input: DATE_DEFAULT)
            inputField(type: baseDateField) {
              validation(input: { value: has_one_of_required_metadata, has_one_of_required_metadata: { includedMetadataFields: ["dateOfCreation", "dateOfPublication"], amount: 1 } }) { ...validation }
              ...inputfield
            }
          }
          title: metaData {
            label(input: "metadata.labels.title")
            key(input: "title")
            inputField(type: baseTextField) {
              ...inputfield
            }
          }
        }
      }
    } } }
  }
  fragment tenantFilters on Tenant {
    advancedFilters {
      type: advancedFilter(type: type) { type defaultValue(value: "tenant") hidden(value: true) }
      title: advancedFilter(type: text, key: ["dams:1|metadata.title.value"], label: "metadata.labels.title", isDisplayedByDefault: true) {
        type
        parentKey
        key
        label
        isDisplayedByDefault
      }
      relation: advancedFilter(type: selection, parentKey: "relations", key: "isTenantFor", label: "metadata.labels.relation", isDisplayedByDefault: true, useOldWayToFetchOptions: false, advancedFilterInputForRetrievingOptions: [{ type: type, value: "user" }]) {
        type
        parentKey
        key
        label
        isDisplayedByDefault
        advancedFilterInputForRetrievingOptions { type value key match_exact metadata_key_as_label item_types }
      }
    }
  }
`,
  ),
];

describe("batch 45: the last client-side leftovers round-trip", () => {
  it("extracts, validates and regenerates them without a difference", async () => {
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|left out/.test(n)), notes.join("\n")).toEqual([]);
    expect((await validateDeclaration(ttl)).issues.map(formatIssue), ttl).toEqual([]);
    // the terms of the batch, as the extractor spells them
    expect(ttl).toContain("elody:bareResults true ;");
    expect(ttl).toContain('elody:allowCondition "work_serial" ;');
    expect(ttl).toContain('elody:conditionVariable "work_type" ;');
    expect(ttl).toContain('elody:rootType "token" ;');
    expect(ttl).toContain('elody:rootCollection "tokens" ;');
    expect(ttl).toMatch(/elody:unit elody:DatetimeDefault [;\]]/);
    expect(ttl).toContain('elody:asksBack "parentKey" ;');
    expect(ttl).toContain("elody:useOldWayToFetchOptions false ;");
    expect(ttl).toContain('elody:validationFields ( "dateOfCreation" "dateOfPublication" ) ;');
    expect(ttl).toContain("elody:detailSpreadsListing true ;");

    const root = mkdtempSync(join(tmpdir(), "elody-batch45-"));
    mkdirSync(join(root, "src", "queries", "entities"), { recursive: true });
    for (const file of files) writeFileSync(join(root, "src", file.path), file.source);
    const declaration = join(root, "extracted.ui.ttl");
    writeFileSync(declaration, ttl);
    const comparison = await compareClient({ client: "batch45", declaration, clientSrc: join(root, "src") });
    const byStatus = (status: string) => comparison.definitions.filter((d) => d.status === status).map((d) => `${d.name}${d.path ? `: ${d.path}` : ""}`);
    expect(byStatus("differs"), notes.join("\n")).toEqual([]);
    expect(byStatus("missing"), notes.join("\n")).toEqual([]);
    expect(byStatus("extra")).toEqual([]);
    for (const name of ["GetAreaRefSitesWkt", "GetBulkOperationsForManifestationsInExpression", "GetTokenSecret", "fullArea", "fullTenant", "tenantFilters"]) expect(byStatus("equal")).toContain(name);
  });
});
