// GENERATED from src/ui/dishacled.ui.ttl — do not edit by hand.
// `pnpm run generate:ui` re-renders this file; the triples are the source.
import { gql } from "graphql-modules";

export const alertQueries = gql`
  fragment minimalAlert on Alert {
    intialValues {
      message: keyValue(key: "message", source: metadata)
      created: keyValue(key: "created", source: metadata)
      subject: keyValue(key: "subject", source: metadata)
      uuid: keyValue(key: "uuid", source: metadata)
    }
    relationValues
    allowedViewModes {
      viewModes(
        input: [
          { viewMode: ViewModesList }
        ]
      ) {
        ...viewModes
      }
    }
    teaserMetadata {
      message: metaData {
        label(input: "metadata.labels.alert.message")
        key(input: "message")
        colSpan(input: "2")
      }
      created: metaData {
        label(input: "metadata.labels.alert.created")
        key(input: "created")
        unit(input: DATETIME_DMY24)
      }
      subject: metaData {
        label(input: "metadata.labels.alert.subject")
        key(input: "subject")
      }
    }
    ...minimalBaseEntity
  }

  fragment fullAlert on Alert {
    shapeFields
    intialValues {
      message: keyValue(key: "message", source: metadata)
      created: keyValue(key: "created", source: metadata)
      subject: keyValue(key: "subject", source: metadata)
      uuid: keyValue(key: "uuid", source: metadata)
    }
    relationValues
    entityView {
      column {
        size(size: hundred)
        elements {
          shaclShapeElement {
            label(input: "panel-labels.alert-shape")
            fieldsKey(input: "shapeFields")
            isCollapsed(input: false)
          }
        }
      }
    }
  }

  fragment alertSortOptions on Alert {
    sortOptions {
      options(
        input: [
          {
            icon: NoIcon
            label: "metadata.labels.alert.created"
            value: "created"
          }
        ]
      ) {
        icon
        label
        value
      }
      isAsc(input: desc)
    }
  }

  fragment filtersForAlert on Alert {
    advancedFilters {
      type: advancedFilter(type: type) {
        type
        defaultValue(value: "alert")
        hidden(value: true)
      }
    }
  }

  fragment alertBulkOperations on Alert {
    bulkOperationOptions {
      options(input: []) {
        icon
        label
        value
        primary
        can
        actionContext {
          ...actionContext
        }
        bulkOperationModal {
          ...bulkOperationModal
        }
      }
    }
  }

  query GetAlertEntities(
    $type: Entitytyping!
    $limit: Int
    $skip: Int
    $searchValue: SearchFilter!
    $advancedSearchValue: [FilterInput]
    $advancedFilterInputs: [AdvancedFilterInput!]!
    $searchInputType: SearchInputType
  ) {
    Entities(
      type: $type
      limit: $limit
      skip: $skip
      searchValue: $searchValue
      advancedSearchValue: $advancedSearchValue
      advancedFilterInputs: $advancedFilterInputs
      searchInputType: $searchInputType
    ) {
      count
      limit
      results {
        id
        uuid
        type
        ... on Alert {
          ...minimalAlert
        }
      }
    }
  }
`;
