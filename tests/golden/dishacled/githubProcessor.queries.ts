// GENERATED from src/ui/dishacled.ui.ttl — do not edit by hand.
// `pnpm run generate:ui` re-renders this file; the triples are the source.
import { gql } from "graphql-modules";

export const githubProcessorQueries = gql`
  fragment minimalGithubProcessor on GithubProcessor {
    dynamicFormConfig: processorConfig
    ports
    intialValues {
      ...typePillsIntialValues
      name: keyValue(key: "name", source: metadata)
      description: keyValue(key: "description", source: metadata)
      repository: keyValue(key: "repository", source: metadata)
      runtime: keyValue(key: "runtime", source: metadata, formatter: "pill|auto")
      url: keyValue(key: "url", source: metadata)
      owner: keyValue(key: "owner", source: metadata)
      language: keyValue(key: "language", source: metadata)
      stars: keyValue(key: "stars", source: metadata)
      defaultBranch: keyValue(key: "defaultBranch", source: metadata)
      shaclFiles: keyValue(key: "shaclFiles", source: metadata)
    }
    relationValues
    allowedViewModes {
      viewModes(
        input: [
          {
            viewMode: ViewModesList
            config: [
              { key: "multiLine", value: true }
              { key: "multiLineColumns", value: 3 }
            ]
          }
          { viewMode: ViewModesGrid }
          { viewMode: ViewModesPipeline }
        ]
      ) {
        ...viewModes
      }
    }
    teaserMetadata {
      ...typePillsTeaserMetadata
      forceShowContextMenuActions(input: true)
      contextMenuActions {
        ...basicContextMenuActions
        configure: doElodyAction {
          action(input: UpdateMetadata)
          formQuery(input: "ProcessorRelationConfig")
          formFlow(input: Update)
          formTitle(input: "modals.configureProcessor.title")
          label(input: "contextMenu.contextMenuElodyAction.configureProcessor")
          icon(input: "Settings")
          __typename
        }
        connect: doElodyAction {
          action(input: UpdateMetadata)
          formQuery(input: "ProcessorConnectionsConfig")
          formFlow(input: Update)
          formTitle(input: "modals.connectProcessor.title")
          label(input: "contextMenu.contextMenuElodyAction.connectProcessor")
          icon(input: "Link")
          __typename
        }
      }
      name: metaData {
        label(input: "metadata.labels.name")
        key(input: "name")
        colSpan(input: "2")
      }
      description: metaData {
        label(input: "metadata.labels.description")
        key(input: "description")
        colSpan(input: "3")
      }
    }
    ...minimalBaseEntity
  }

  fragment fullGithubProcessor on GithubProcessor {
    intialValues {
      name: keyValue(key: "name", source: metadata)
      description: keyValue(key: "description", source: metadata)
      repository: keyValue(key: "repository", source: metadata)
      runtime: keyValue(key: "runtime", source: metadata)
      url: keyValue(key: "url", source: metadata)
      owner: keyValue(key: "owner", source: metadata)
      language: keyValue(key: "language", source: metadata)
      stars: keyValue(key: "stars", source: metadata)
      defaultBranch: keyValue(key: "defaultBranch", source: metadata)
      shaclFiles: keyValue(key: "shaclFiles", source: metadata)
    }
    relationValues
    entityView {
      column {
        size(size: seventy)
        elements {
          windowElement {
            label(input: "window-element-labels.info-window")
            expandButtonOptions {
              shown(input: true)
            }
            repoInfo: panels {
              panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.repository-info" }) {
                label
              }
              panelType(input: metadata)
              isCollapsed(input: false)
              isEditable(input: false)
              name: metaData {
                label(input: "metadata.labels.name")
                key(input: "name")
              }
              repository: metaData {
                label(input: "metadata.labels.repository")
                key(input: "repository")
              }
              description: metaData {
                label(input: "metadata.labels.description")
                key(input: "description")
              }
              url: metaData {
                label(input: "metadata.labels.url")
                key(input: "url")
              }
              owner: metaData {
                label(input: "metadata.labels.owner")
                key(input: "owner")
              }
              language: metaData {
                label(input: "metadata.labels.language")
                key(input: "language")
              }
              stars: metaData {
                label(input: "metadata.labels.stars")
                key(input: "stars")
              }
              defaultBranch: metaData {
                label(input: "metadata.labels.default-branch")
                key(input: "defaultBranch")
              }
            }
            shaclInfo: panels {
              panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.shacl-files" }) {
                label
              }
              panelType(input: metadata)
              isCollapsed(input: false)
              isEditable(input: false)
              shaclFiles: metaData {
                label(input: "metadata.labels.shacl-files")
                key(input: "shaclFiles")
              }
            }
          }
        }
      }
      column2: column {
        size(size: thirty)
        elements {
          windowElement {
            label(input: "window-element-labels.import-config")
            expandButtonOptions {
              shown(input: true)
            }
            importConfig: panels {
              panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.import-configuration" }) {
                label
              }
              panelType(input: metadata)
              isCollapsed(input: false)
              isEditable(input: false)
              runtime: metaData {
                label(input: "metadata.labels.runtime")
                key(input: "runtime")
              }
            }
          }
        }
      }
    }
  }

  fragment githubProcessorSortOptions on GithubProcessor {
    sortOptions {
      options(
        input: [
          {
            icon: NoIcon
            label: "metadata.labels.name"
            value: "name"
          }
        ]
      ) {
        icon
        label
        value
      }
    }
  }

  fragment filtersForGithubProcessor on GithubProcessor {
    advancedFilters {
      type: advancedFilter(type: type) {
        type
        defaultValue(value: "githubProcessor")
        hidden(value: true)
      }
      name: advancedFilter(
        type: text
        key: ["elody:1|metadata.name.value"]
        label: "metadata.labels.name"
        isDisplayedByDefault: true
      ) {
        type
        key
        label
        isDisplayedByDefault
        tooltip(value: true)
      }
    }
  }

  fragment githubProcessorBulkOperations on GithubProcessor {
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

  query GetGithubProcessorEntities(
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
        ... on GithubProcessor {
          ...minimalGithubProcessor
        }
      }
    }
  }

  query GetGithubProcessorFilters($entityType: String!) {
    EntityTypeFilters(type: $entityType) {
      ... on GithubProcessor {
        ...filtersForGithubProcessor
      }
    }
  }

  query GetGithubProcessorSortOptions($entityType: String!) {
    EntityTypeSortOptions(entityType: $entityType) {
      ... on GithubProcessor {
        ...githubProcessorSortOptions
      }
    }
  }

  query GetGithubProcessorBulkOperations($entityType: String!) {
    BulkOperations(entityType: $entityType) {
      ... on GithubProcessor {
        ...githubProcessorBulkOperations
      }
    }
  }

  # Field-source document for a runtime SHACL form: the modal asks for
  # it by name (loadDocument), the resolver answers with the
  # shape-derived form definition.
  query ProcessorRelationConfig($id: String!) {
    ProcessorConfigForm(id: $id)
  }

  # Field-source document for a runtime SHACL form: the modal asks for
  # it by name (loadDocument), the resolver answers with the
  # shape-derived form definition.
  query ProcessorConnectionsConfig($id: String!, $parentEntityId: String) {
    ProcessorConnectionForm(id: $id, parentEntityId: $parentEntityId)
  }
`;
