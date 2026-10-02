// GENERATED from src/ui/dishacled.ui.ttl — do not edit by hand.
// `pnpm run generate:ui` re-renders this file; the triples are the source.
import { gql } from "graphql-modules";

export const pipelineQueries = gql`
  fragment minimalPipeline on Pipeline {
    intialValues {
      name: keyValue(key: "name", source: metadata)
      description: keyValue(key: "description", source: metadata)
    }
    relationValues
    allowedViewModes {
      viewModes(
        input: [
          { viewMode: ViewModesList }
          { viewMode: ViewModesGrid }
        ]
      ) {
        ...viewModes
      }
    }
    teaserMetadata {
      name: metaData {
        label(input: "metadata.labels.name")
        key(input: "name")
      }
    }
    ...minimalBaseEntity
  }

  fragment fullPipeline on Pipeline {
    intialValues {
      name: keyValue(key: "name", source: metadata)
      description: keyValue(key: "description", source: metadata)
    }
    relationValues
    pipelineConnections
    pipelineValidation
    entityView {
      column {
        size(size: hundred)
        elements {
          windowElement {
            label(input: "window-element-labels.info-window")
            expandButtonOptions {
              shown(input: true)
            }
            info: panels {
              panelHeaderContent(panelHeaderContentInput: { label: "panel-labels.pipeline-info" }) {
                label
              }
              panelType(input: metadata)
              isCollapsed(input: false)
              isEditable(input: false)
              name: metaData {
                label(input: "metadata.labels.name")
                key(input: "name")
              }
              description: metaData {
                label(input: "metadata.labels.description")
                key(input: "description")
              }
            }
          }
          processors: entityListElement {
            label(input: "element-labels.processor-element")
            isCollapsed(input: false)
            entityTypes(input: [githubProcessor])
            relationType: label(input: "hasProcessor")
            customQuery(input: "GetEntities")
            customQueryFilters(input: "GetRelatedProcessorFilter")
            searchInputType(input: "AdvancedInputType")
            customBulkOperations(input: "GetProcessorOnPipelineOperations")
            customQueryEntityPickerList(input: "GetEntityPickerListForProcessorsInPipeline")
            customQueryEntityPickerListFilters(input: "GetEntityPickerFiltersForProcessorsInPipeline")
          }
        }
      }
    }
  }

  fragment pipelineSortOptions on Pipeline {
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

  fragment filtersForPipeline on Pipeline {
    advancedFilters {
      type: advancedFilter(type: type) {
        type
        defaultValue(value: "pipeline")
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

  fragment pipelineBulkOperations on Pipeline {
    bulkOperationOptions {
      options(
        input: [
          {
            icon: Create
            label: "bulk-operations.create-pipeline"
            value: "createEntity"
            primary: true
            actionContext: {
              activeViewMode: readMode
              entitiesSelectionType: noneSelected
              labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
            }
            bulkOperationModal: {
              typeModal: DynamicForm
              formQueries: ["GetPipelineCreateForm"]
              formRelationType: "isPipelineFor"
              askForCloseConfirmation: true
              neededPermission: cancreate
            }
          }
        ]
      ) {
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

  query GetPipelineCreateForm {
    GetDynamicForm {
      label(input: "navigation.create-pipeline")
      name: formTab {
        formFields {
          name: metaData {
            label(input: "metadata.labels.name")
            key(input: "name")
            inputField(type: baseTextField) {
              ...inputfield
              validation(input: { value: required }) {
                ...validation
              }
            }
          }
          description: metaData {
            label(input: "metadata.labels.description")
            key(input: "description")
            inputField(type: baseTextField) {
              ...inputfield
            }
          }
          createAction: action {
            label(input: "actions.labels.create")
            icon(input: Create)
            actionType(input: submit)
            actionQuery(input: "CreateEntity")
            creationType(input: pipeline)
            showsFormErrors(input: true)
          }
        }
      }
    }
  }

  query GetRunnerOnPipelineBulkOperations {
    CustomBulkOperations {
      bulkOperationOptions {
        options(
          input: [
            {
              icon: PlusCircle
              label: "bulk-operations.create-jsrunner"
              value: "createEntity"
              can: ["update:pipeline:has-runner"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: noneSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
              }
              bulkOperationModal: {
                typeModal: DynamicForm
                formQueries: ["GetJsRunnerCreateForm"]
                formRelationType: "isRunnerFor"
                askForCloseConfirmation: true
                neededPermission: cancreate
              }
            }
            {
              icon: PlusCircle
              label: "bulk-operations.create-jvmrunner"
              value: "createEntity"
              can: ["update:pipeline:has-runner"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: noneSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
              }
              bulkOperationModal: {
                typeModal: DynamicForm
                formQueries: ["GetJvmRunnerCreateForm"]
                formRelationType: "isRunnerFor"
                askForCloseConfirmation: true
                neededPermission: cancreate
              }
            }
            {
              icon: PlusCircle
              label: "bulk-operations.create-pyrunner"
              value: "createEntity"
              can: ["update:pipeline:has-runner"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: noneSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
              }
              bulkOperationModal: {
                typeModal: DynamicForm
                formQueries: ["GetPyRunnerCreateForm"]
                formRelationType: "isRunnerFor"
                askForCloseConfirmation: true
                neededPermission: cancreate
              }
            }
            {
              icon: PlusCircle
              label: "bulk-operations.existing-runner"
              value: "addRelation"
              can: ["update:pipeline:has-runner"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: noneSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
              }
              bulkOperationModal: {
                typeModal: DynamicForm
                formQueries: ["GetEntityPickerForm"]
                askForCloseConfirmation: true
                neededPermission: canupdate
              }
            }
            {
              label: "bulk-operations.delete-selected"
              value: "deleteEntities"
              primary: false
              can: ["update:pipeline:has-runner"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: someSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-someselected"
              }
              bulkOperationModal: {
                typeModal: BulkOperationsDeleteEntities
                formQueries: ["GetBulkRemovingMediafilesInDetailForm"]
                askForCloseConfirmation: false
              }
            }
          ]
        ) {
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
  }

  query GetProcessorOnPipelineOperations {
    CustomBulkOperations {
      bulkOperationOptions {
        options(
          input: [
            {
              icon: PlusCircle
              label: "bulk-operations.add-processor"
              value: "addRelation"
              can: ["update:pipeline:has-processor"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: noneSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"
              }
              bulkOperationModal: {
                typeModal: DynamicForm
                formQueries: ["GetEntityPickerForm"]
                askForCloseConfirmation: true
                neededPermission: canupdate
              }
            }
            {
              label: "bulk-operations.delete-selected"
              value: "deleteEntities"
              primary: false
              can: ["update:pipeline:has-processor"]
              actionContext: {
                activeViewMode: readMode
                entitiesSelectionType: someSelected
                labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-someselected"
              }
              bulkOperationModal: {
                typeModal: BulkOperationsDeleteEntities
                formQueries: ["GetBulkRemovingMediafilesInDetailForm"]
                askForCloseConfirmation: false
              }
            }
          ]
        ) {
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
  }

  query GetRepetitiveFormForComponent {
    GetRepetitiveForm {
      label(input: "repetitiveForm.add-component-title")
      repeatable(input: true)
      refetchOnFinish(input: true)
      component: steps {
        key(input: "component")
        label(input: "repetitiveForm.step-component")
        entityType(input: "githubProcessor")
        createForm(input: "GetPipelineCreateForm")
        pickerQuery(input: "GetEntityPickerListForProcessorsInPipeline")
        pickerFiltersQuery(input: "GetEntityPickerFiltersForProcessorsInPipeline")
        acceptedTypes(input: ["githubProcessor"])
        maxSelection(input: 1)
        overviewFields(
          input: [
            { key: "name", label: "metadata.labels.name" }
            { key: "description", label: "metadata.labels.description" }
          ]
        ) {
          key
          label
        }
      }
      finalizeOnHost {
        fromStep(input: "component")
        relationType(input: "hasProcessor")
      }
    }
  }

  query GetEntityPickerListForRunnersInPipeline(
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
        ... on JsRunner {
          ...minimalJsRunner
        }
        ... on PyRunner {
          ...minimalPyRunner
        }
        ... on JvmRunner {
          ...minimalJvmRunner
        }
      }
      __typename
    }
  }

  query GetEntityPickerFiltersForRunnersInPipeline($entityType: String!) {
    EntityTypeFilters(type: $entityType) {
      advancedFilters {
        type: advancedFilter(type: selection, key: "type") {
          type
          key
          defaultValue(value: ["jsRunner", "pyRunner", "jvmRunner"])
          hidden(value: true)
        }
      }
    }
  }

  query GetEntityPickerListForProcessorsInPipeline(
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
      __typename
    }
  }

  query GetEntityPickerFiltersForProcessorsInPipeline($entityType: String!) {
    EntityTypeFilters(type: $entityType) {
      advancedFilters {
        type: advancedFilter(type: type) {
          type
          defaultValue(value: "githubProcessor")
          hidden(value: true)
        }
        suggestion: advancedFilter(type: selection, key: ["suggest_for_pipeline"]) {
          type
          key
          defaultValue(value: "$parentIds")
          hidden(value: true)
        }
        shapeScope: advancedFilter(type: selection, key: ["suggest_for_shape"]) {
          type
          key
          defaultValue(value: "$portShapeIris")
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
  }

  # Field-source document for a runtime SHACL form: the modal asks for
  # it by name (loadDocument), the resolver answers with the
  # shape-derived form definition.
  query GetPipelineConnections($id: String!) {
    PipelineConnections(id: $id)
  }

  # Field-source document for a runtime SHACL form: the modal asks for
  # it by name (loadDocument), the resolver answers with the
  # shape-derived form definition.
  query GetPipelineValidation($id: String!) {
    PipelineValidation(id: $id)
  }
`;
