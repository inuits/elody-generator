// THIS FILE IS GENERATED, DO NOT EDIT!
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  StringOrInt: { input: any; output: any; }
};

export type ActionButton = {
  __typename?: 'ActionButton';
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  hideIf?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
  onResult: ActionButtonResult;
  query?: Maybe<Scalars['String']['output']>;
  variables?: Maybe<Scalars['JSON']['output']>;
};


export type ActionButtonCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActionButtonHideIfArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActionButtonIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ActionButtonLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ActionButtonOnResultArgs = {
  input?: InputMaybe<ActionButtonResult>;
};


export type ActionButtonQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ActionButtonVariablesArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
};

export enum ActionButtonResult {
  DownloadFile = 'DownloadFile',
  None = 'None',
  RefetchParent = 'RefetchParent'
}

export type ActionContext = {
  __typename?: 'ActionContext';
  activeViewMode?: Maybe<Array<Maybe<ActionContextViewModeTypes>>>;
  entitiesSelectionType?: Maybe<ActionContextEntitiesSelectionType>;
  labelForTooltip?: Maybe<Scalars['String']['output']>;
  matchMetadataValue?: Maybe<Array<Maybe<MatchMetadataValue>>>;
  maxSelectedItems?: Maybe<Scalars['Int']['output']>;
  minSelectedItems?: Maybe<Scalars['Int']['output']>;
  requiresSameType?: Maybe<Scalars['Boolean']['output']>;
};

export enum ActionContextEntitiesSelectionType {
  NoneSelected = 'noneSelected',
  SomeSelected = 'someSelected'
}

export type ActionContextInput = {
  activeViewMode?: InputMaybe<Array<InputMaybe<ActionContextViewModeTypes>>>;
  entitiesSelectionType?: InputMaybe<ActionContextEntitiesSelectionType>;
  labelForTooltip?: InputMaybe<Scalars['String']['input']>;
  matchMetadataValue?: InputMaybe<Array<InputMaybe<MatchMetadataValueInput>>>;
  maxSelectedItems?: InputMaybe<Scalars['Int']['input']>;
  minSelectedItems?: InputMaybe<Scalars['Int']['input']>;
  requiresSameType?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ActionContextViewModeTypes {
  EditMode = 'editMode',
  ReadMode = 'readMode'
}

export type ActionElement = {
  __typename?: 'ActionElement';
  actions?: Maybe<Array<Maybe<Actions>>>;
  label: Scalars['String']['output'];
};


export type ActionElementActionsArgs = {
  input?: InputMaybe<Array<InputMaybe<Actions>>>;
};


export type ActionElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type ActionProgress = {
  __typename?: 'ActionProgress';
  step?: Maybe<ActionProgressStep>;
  type: ActionProgressIndicatorType;
};


export type ActionProgressTypeArgs = {
  input: ActionProgressIndicatorType;
};

export enum ActionProgressIndicatorType {
  ProgressSteps = 'progressSteps',
  Spinner = 'spinner'
}

export type ActionProgressStep = {
  __typename?: 'ActionProgressStep';
  label: Scalars['String']['output'];
  status: ProgressStepStatus;
  stepType: ProgressStepType;
};


export type ActionProgressStepLabelArgs = {
  input: Scalars['String']['input'];
};


export type ActionProgressStepStepTypeArgs = {
  input: ProgressStepType;
};

export enum ActionType {
  BulkUpdateMetadata = 'bulkUpdateMetadata',
  Download = 'download',
  Endpoint = 'endpoint',
  NextFormTab = 'nextFormTab',
  Ocr = 'ocr',
  PreviousFormTab = 'previousFormTab',
  Submit = 'submit',
  SubmitAllFormTabs = 'submitAllFormTabs',
  SubmitWithExtraMetadata = 'submitWithExtraMetadata',
  SubmitWithUpload = 'submitWithUpload',
  UpdateMetadata = 'updateMetadata',
  Upload = 'upload',
  UploadCsvForReordening = 'uploadCsvForReordening',
  UploadWithMetadata = 'uploadWithMetadata',
  UploadWithOcr = 'uploadWithOcr'
}

export enum Actions {
  Download = 'download',
  NoActions = 'noActions',
  Ocr = 'ocr'
}

export type ActionsOnResult = {
  __typename?: 'ActionsOnResult';
  options: Array<DropdownOption>;
  type: ActionsOnResultTypes;
};


export type ActionsOnResultOptionsArgs = {
  input: Array<DropdownOptionInput>;
};


export type ActionsOnResultTypeArgs = {
  input: ActionsOnResultTypes;
};

export enum ActionsOnResultTypes {
  NoResult = 'NoResult'
}

export type AdvancedFilter = {
  __typename?: 'AdvancedFilter';
  advancedFilterInputForRetrievingOptions?: Maybe<Array<AdvancedFilterInputType>>;
  aggregation?: Maybe<Scalars['String']['output']>;
  allowedMatchers?: Maybe<Array<Maybe<Matchers>>>;
  bucket?: Maybe<Scalars['String']['output']>;
  context?: Maybe<Scalars['JSON']['output']>;
  defaultMatcher?: Maybe<Matchers>;
  defaultValue: Scalars['JSON']['output'];
  defaultValueMapping?: Maybe<Array<Maybe<ValueMapping>>>;
  distinctBy?: Maybe<Scalars['String']['output']>;
  doNotOverrideDefaultValue?: Maybe<Scalars['Boolean']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  facets?: Maybe<Array<FacetInputType>>;
  filterOptionsMapping?: Maybe<FilterOptionsMappingType>;
  hidden: Scalars['Boolean']['output'];
  includeDefaultValuesFromIntialValues?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  isDisplayedByDefault: Scalars['Boolean']['output'];
  itemTypes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  key?: Maybe<Scalars['JSON']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  limitConfig?: Maybe<AdvancedFilterLimitConfigType>;
  lookup?: Maybe<LookupInputType>;
  matchExact?: Maybe<Scalars['Boolean']['output']>;
  matcherLabels?: Maybe<Array<MatcherLabelType>>;
  matchersType?: Maybe<AdvancedFilterMatchersType>;
  max?: Maybe<Scalars['Int']['output']>;
  metadataKeyAsLabel?: Maybe<Scalars['String']['output']>;
  min?: Maybe<Scalars['Int']['output']>;
  minDropdownSearchCharacters?: Maybe<Scalars['Int']['output']>;
  operator?: Maybe<Operator>;
  options: Array<DropdownOption>;
  parentKey?: Maybe<Scalars['String']['output']>;
  relationKeys?: Maybe<Scalars['JSON']['output']>;
  selectionOption?: Maybe<AutocompleteSelectionOptions>;
  showTimeForDateFilter?: Maybe<Scalars['Boolean']['output']>;
  tooltip?: Maybe<Scalars['Boolean']['output']>;
  type: AdvancedFilterTypes;
  unit?: Maybe<Scalars['String']['output']>;
  useOldWayToFetchOptions?: Maybe<Scalars['Boolean']['output']>;
};


export type AdvancedFilterDefaultValueArgs = {
  value: Scalars['JSON']['input'];
};


export type AdvancedFilterDefaultValueMappingArgs = {
  value?: InputMaybe<Array<InputMaybe<ValueMappingInput>>>;
};


export type AdvancedFilterDoNotOverrideDefaultValueArgs = {
  value?: InputMaybe<Scalars['Boolean']['input']>;
};


export type AdvancedFilterHiddenArgs = {
  value?: InputMaybe<Scalars['Boolean']['input']>;
};


export type AdvancedFilterMinDropdownSearchCharactersArgs = {
  value?: InputMaybe<Scalars['Int']['input']>;
};


export type AdvancedFilterTooltipArgs = {
  value?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AdvancedFilterInput = {
  aggregation?: InputMaybe<Scalars['String']['input']>;
  bucket?: InputMaybe<Scalars['String']['input']>;
  defaultValueMapping?: InputMaybe<Array<InputMaybe<ValueMappingInput>>>;
  distinct_by?: InputMaybe<Scalars['String']['input']>;
  facets?: InputMaybe<Array<FacetInputInput>>;
  includeDefaultValuesFromIntialValues?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  inner_exact_matches?: InputMaybe<Scalars['JSON']['input']>;
  item_types?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key?: InputMaybe<Scalars['JSON']['input']>;
  lookup?: InputMaybe<LookupInput>;
  match_exact?: InputMaybe<Scalars['Boolean']['input']>;
  match_not?: InputMaybe<Scalars['Boolean']['input']>;
  metadata_key_as_label?: InputMaybe<Scalars['String']['input']>;
  operator?: InputMaybe<Operator>;
  parent_key?: InputMaybe<Scalars['String']['input']>;
  provide_value_options_for_key?: InputMaybe<Scalars['Boolean']['input']>;
  relation_keys?: InputMaybe<Scalars['JSON']['input']>;
  resolveDefaultValueToOptionIds?: InputMaybe<Scalars['Boolean']['input']>;
  returnIdAtIndex?: InputMaybe<Scalars['Int']['input']>;
  selectionOption?: InputMaybe<AutocompleteSelectionOptions>;
  type: AdvancedFilterTypes;
  value: Scalars['JSON']['input'];
};

export type AdvancedFilterInputType = {
  __typename?: 'AdvancedFilterInputType';
  aggregation?: Maybe<Scalars['String']['output']>;
  bucket?: Maybe<Scalars['String']['output']>;
  context?: Maybe<Scalars['JSON']['output']>;
  defaultValueMapping?: Maybe<Array<Maybe<ValueMapping>>>;
  distinct_by?: Maybe<Scalars['String']['output']>;
  includeDefaultValuesFromIntialValues?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  inner_exact_matches?: Maybe<Scalars['JSON']['output']>;
  item_types?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  key?: Maybe<Scalars['JSON']['output']>;
  lookup?: Maybe<LookupInputType>;
  match_exact?: Maybe<Scalars['Boolean']['output']>;
  match_not?: Maybe<Scalars['Boolean']['output']>;
  matchersType?: Maybe<AdvancedFilterMatchersType>;
  metadata_key_as_label?: Maybe<Scalars['String']['output']>;
  minDropdownSearchCharacters?: Maybe<Scalars['Int']['output']>;
  operator?: Maybe<Operator>;
  parent_key?: Maybe<Scalars['String']['output']>;
  resolveDefaultValueToOptionIds?: Maybe<Scalars['Boolean']['output']>;
  returnIdAtIndex?: Maybe<Scalars['Int']['output']>;
  selectionOption?: Maybe<AutocompleteSelectionOptions>;
  type: AdvancedFilterTypes;
  value: Scalars['JSON']['output'];
};

export type AdvancedFilterLimitConfigInput = {
  facetsLimit?: InputMaybe<Scalars['Int']['input']>;
  optionsLimit?: InputMaybe<Scalars['Int']['input']>;
};

export type AdvancedFilterLimitConfigType = {
  __typename?: 'AdvancedFilterLimitConfigType';
  facetsLimit?: Maybe<Scalars['Int']['output']>;
  optionsLimit?: Maybe<Scalars['Int']['output']>;
};

export enum AdvancedFilterMatchersType {
  Boolean = 'boolean',
  Date = 'date',
  Geo = 'geo',
  Number = 'number',
  Selection = 'selection',
  SelectionForMetadata = 'selectionForMetadata',
  SelectionForRelation = 'selectionForRelation',
  Text = 'text',
  Type = 'type'
}

export enum AdvancedFilterTypes {
  Boolean = 'boolean',
  Date = 'date',
  Geo = 'geo',
  Id = 'id',
  MetadataOnRelation = 'metadata_on_relation',
  Number = 'number',
  Selection = 'selection',
  Text = 'text',
  Type = 'type'
}

export type AdvancedFilters = {
  __typename?: 'AdvancedFilters';
  advancedFilter: AdvancedFilter;
};


export type AdvancedFiltersAdvancedFilterArgs = {
  advancedFilterInputForRetrievingOptions?: InputMaybe<Array<AdvancedFilterInput>>;
  aggregation?: InputMaybe<Scalars['String']['input']>;
  allowedMatchers?: InputMaybe<Array<InputMaybe<Matchers>>>;
  bucket?: InputMaybe<Scalars['String']['input']>;
  can?: InputMaybe<Array<Scalars['String']['input']>>;
  context?: InputMaybe<Scalars['JSON']['input']>;
  defaultMatcher?: InputMaybe<Matchers>;
  distinctBy?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  facets?: InputMaybe<Array<FacetInputInput>>;
  filterOptionsMapping?: InputMaybe<FilterOptionsMappingInput>;
  includeDefaultValuesFromIntialValues?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isDisplayedByDefault?: InputMaybe<Scalars['Boolean']['input']>;
  itemTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  key?: InputMaybe<Scalars['JSON']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  limitConfig?: InputMaybe<AdvancedFilterLimitConfigInput>;
  lookup?: InputMaybe<LookupInput>;
  matchExact?: InputMaybe<Scalars['Boolean']['input']>;
  matcherLabels?: InputMaybe<Array<MatcherLabelInput>>;
  matchersType?: InputMaybe<AdvancedFilterMatchersType>;
  max?: InputMaybe<Scalars['Int']['input']>;
  metadataKeyAsLabel?: InputMaybe<Scalars['String']['input']>;
  min?: InputMaybe<Scalars['Int']['input']>;
  minDropdownSearchCharacters?: InputMaybe<Scalars['Int']['input']>;
  operator?: InputMaybe<Operator>;
  options?: InputMaybe<Array<DropdownOptionInput>>;
  parentKey?: InputMaybe<Scalars['String']['input']>;
  selectionOption?: InputMaybe<AutocompleteSelectionOptions>;
  showTimeForDateFilter?: InputMaybe<Scalars['Boolean']['input']>;
  type: AdvancedFilterTypes;
  unit?: InputMaybe<Scalars['String']['input']>;
  useOldWayToFetchOptions?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum AdvancedInputType {
  MinMaxInput = 'MinMaxInput',
  SelectionInput = 'SelectionInput',
  TextInput = 'TextInput'
}

export type AdvancedSearchInput = {
  value?: InputMaybe<Array<InputMaybe<AdvancedInputType>>>;
};

export type AllowedViewModes = {
  __typename?: 'AllowedViewModes';
  viewModes?: Maybe<Array<Maybe<ViewModesWithConfig>>>;
};


export type AllowedViewModesViewModesArgs = {
  input?: InputMaybe<Array<InputMaybe<ViewModesWithConfigInput>>>;
};

export enum AutocompleteSelectionOptions {
  Auto = 'auto',
  Autocomplete = 'autocomplete',
  Checkboxlist = 'checkboxlist'
}

export type Award = Entity & {
  __typename?: 'Award';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type BaseEntity = Entity & {
  __typename?: 'BaseEntity';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum BaseFieldType {
  AudienceTypeTypeField = 'audienceTypeTypeField',
  AviReadLevelCodeTypeField = 'aviReadLevelCodeTypeField',
  BaseCheckbox = 'baseCheckbox',
  BaseColorField = 'baseColorField',
  BaseCsvUploadField = 'baseCsvUploadField',
  BaseDateField = 'baseDateField',
  BaseDateTimeField = 'baseDateTimeField',
  BaseEntityPickerField = 'baseEntityPickerField',
  BaseExcelUploadField = 'baseExcelUploadField',
  BaseFileSystemImportField = 'baseFileSystemImportField',
  BaseFileUploadField = 'baseFileUploadField',
  BaseMagazineWithCsvImportField = 'baseMagazineWithCsvImportField',
  BaseMagazineWithMetsImportField = 'baseMagazineWithMetsImportField',
  BaseMediafilesWithOcrImportField = 'baseMediafilesWithOcrImportField',
  BaseNumberField = 'baseNumberField',
  BaseResizableTextareaField = 'baseResizableTextareaField',
  BaseTextField = 'baseTextField',
  BaseTextareaField = 'baseTextareaField',
  BaseXmlUploadField = 'baseXmlUploadField',
  BibliographicTypeCreateTypeField = 'bibliographicTypeCreateTypeField',
  BibliographicTypeTypeField = 'bibliographicTypeTypeField',
  BoekenbankCodeWordingTypeField = 'boekenbankCodeWordingTypeField',
  BoekenbankExpressionAuthorsRelationField = 'boekenbankExpressionAuthorsRelationField',
  BoekenbankExpressionAuthorsTypeField = 'boekenbankExpressionAuthorsTypeField',
  BoekenbankGenresTypeField = 'boekenbankGenresTypeField',
  BoekenbankLanguageTypeField = 'boekenbankLanguageTypeField',
  BoekenbankManifestationAuthorsRelationField = 'boekenbankManifestationAuthorsRelationField',
  BoekenbankManifestationAuthorsTypeField = 'boekenbankManifestationAuthorsTypeField',
  BoekenbankMaterialTypeTypeField = 'boekenbankMaterialTypeTypeField',
  BoekenbankOtherGenresTypeField = 'boekenbankOtherGenresTypeField',
  BoekenbankPlacesTypeField = 'boekenbankPlacesTypeField',
  BoekenbankPublishersTypeField = 'boekenbankPublishersTypeField',
  BoekenbankReadingRecordTypeTypeField = 'boekenbankReadingRecordTypeTypeField',
  BoekenbankSeriesTypeField = 'boekenbankSeriesTypeField',
  BoekenbankTargetAudienceTypeField = 'boekenbankTargetAudienceTypeField',
  BoekenbankWorkAuthorsRelationField = 'boekenbankWorkAuthorsRelationField',
  BoekenbankWorkAuthorsTypeField = 'boekenbankWorkAuthorsTypeField',
  CantookExpressionAuthorsRelationField = 'cantookExpressionAuthorsRelationField',
  CantookExpressionAuthorsTypeField = 'cantookExpressionAuthorsTypeField',
  CantookImportStatusTypeField = 'cantookImportStatusTypeField',
  CantookLanguagesTypeField = 'cantookLanguagesTypeField',
  CantookPlacesTypeField = 'cantookPlacesTypeField',
  CantookPublishersTypeField = 'cantookPublishersTypeField',
  CantookStatusTypeField = 'cantookStatusTypeField',
  CantookTargetAudienceTypeField = 'cantookTargetAudienceTypeField',
  CantookWorkAuthorsRelationField = 'cantookWorkAuthorsRelationField',
  CantookWorkAuthorsTypeField = 'cantookWorkAuthorsTypeField',
  CodeTypeField = 'codeTypeField',
  CodeWordingTypeField = 'codeWordingTypeField',
  CommentCategoryTypeField = 'commentCategoryTypeField',
  CreateExpressionAuthorsTypeField = 'createExpressionAuthorsTypeField',
  CreateManifestationAuthorsTypeField = 'createManifestationAuthorsTypeField',
  CreateSeriesTypeField = 'createSeriesTypeField',
  CreateWorkAuthorsTypeField = 'createWorkAuthorsTypeField',
  CsvEntityTypeTypeField = 'csvEntityTypeTypeField',
  CsvUploadField = 'csvUploadField',
  CurrencyTypeField = 'currencyTypeField',
  DateTypeTypeField = 'dateTypeTypeField',
  DeelrubriekLevelTypeField = 'deelrubriekLevelTypeField',
  DomeinLevelTypeField = 'domeinLevelTypeField',
  DropdownMultiselectMetadataTypeField = 'dropdownMultiselectMetadataTypeField',
  EanGroupTypeField = 'eanGroupTypeField',
  EasyReadingRecordTypeTypeField = 'easyReadingRecordTypeTypeField',
  ExpressionFunctionTypeField = 'expressionFunctionTypeField',
  GeneralAnnotationGroupTypeField = 'generalAnnotationGroupTypeField',
  GenreTypeTypefield = 'genreTypeTypefield',
  GenresRefGenresTableTypeField = 'genresRefGenresTableTypeField',
  GenresTableTypeField = 'genresTableTypeField',
  GroeirubriekLevelTypeField = 'groeirubriekLevelTypeField',
  GroeirubriekTargetAudienceTypeField = 'groeirubriekTargetAudienceTypeField',
  HoofdrubriekLevelTypeField = 'hoofdrubriekLevelTypeField',
  IdOnlineCollectionGroupTypeField = 'idOnlineCollectionGroupTypeField',
  IsbnGroupTypeField = 'isbnGroupTypeField',
  IssnGroupTypeField = 'issnGroupTypeField',
  KastLevelTypeField = 'kastLevelTypeField',
  KijkwijzerWaardeTypeField = 'kijkwijzerWaardeTypeField',
  LabelGenreTypeField = 'labelGenreTypeField',
  LabelGenresTableTypeField = 'labelGenresTableTypeField',
  LanguageLevelTypeField = 'languageLevelTypeField',
  ListeningRecordTypeTypeField = 'listeningRecordTypeTypeField',
  LiteraryTypeForWorkMapTypeField = 'literaryTypeForWorkMapTypeField',
  LiteraryTypeTypeField = 'literaryTypeTypeField',
  ManifestationFunctionTypeField = 'manifestationFunctionTypeField',
  MaterialTypeInManifestationComputerFileTypeField = 'materialTypeInManifestationComputerFileTypeField',
  MaterialTypeInManifestationFootageTypeField = 'materialTypeInManifestationFootageTypeField',
  MaterialTypeInManifestationMapTypeField = 'materialTypeInManifestationMapTypeField',
  MaterialTypeInManifestationMixedMaterialTypeField = 'materialTypeInManifestationMixedMaterialTypeField',
  MaterialTypeInManifestationMusicTypeField = 'materialTypeInManifestationMusicTypeField',
  MaterialTypeInManifestationSerialTypeField = 'materialTypeInManifestationSerialTypeField',
  MaterialTypeInManifestationWordTypeField = 'materialTypeInManifestationWordTypeField',
  MuziekwebExpressionAuthorsRelationField = 'muziekwebExpressionAuthorsRelationField',
  MuziekwebExpressionAuthorsTypeField = 'muziekwebExpressionAuthorsTypeField',
  MuziekwebExpressionLanguageTypeField = 'muziekwebExpressionLanguageTypeField',
  MuziekwebExpressionLanguagesRelationField = 'muziekwebExpressionLanguagesRelationField',
  MuziekwebGenresRelationField = 'muziekwebGenresRelationField',
  MuziekwebGenresTypeField = 'muziekwebGenresTypeField',
  MuziekwebManifestationAuthorsTypeField = 'muziekwebManifestationAuthorsTypeField',
  MuziekwebMaterialTypeTypeField = 'muziekwebMaterialTypeTypeField',
  MuziekwebOtherGenresRelationField = 'muziekwebOtherGenresRelationField',
  MuziekwebPlacesTypeField = 'muziekwebPlacesTypeField',
  MuziekwebPublishersRelationField = 'muziekwebPublishersRelationField',
  MuziekwebPublishersTypeField = 'muziekwebPublishersTypeField',
  MuziekwebSeriesTypeField = 'muziekwebSeriesTypeField',
  MuziekwebTargetAudienceTypeField = 'muziekwebTargetAudienceTypeField',
  MuziekwebWorkAuthorsRelationField = 'muziekwebWorkAuthorsRelationField',
  MuziekwebWorkAuthorsTypeField = 'muziekwebWorkAuthorsTypeField',
  MuziekwebWorkLanguageTypeField = 'muziekwebWorkLanguageTypeField',
  NonPreferredTitleName = 'nonPreferredTitleName',
  OrientingRecordTypeTypeField = 'orientingRecordTypeTypeField',
  PegiWaardeTypeField = 'pegiWaardeTypeField',
  PlankLevelTypeField = 'plankLevelTypeField',
  PlatformTypeField = 'platformTypeField',
  PlayingRecordTypeTypeField = 'playingRecordTypeTypeField',
  PrecatStatusTypeField = 'precatStatusTypeField',
  PrivacyTypeField = 'privacyTypeField',
  PublicationFrequencyTypeField = 'publicationFrequencyTypeField',
  QualityMarksExpressionTypeField = 'qualityMarksExpressionTypeField',
  QualityMarksWorkTypeField = 'qualityMarksWorkTypeField',
  ReadingRecordTypeTypeField = 'readingRecordTypeTypeField',
  RecordVerifiedStatusTypeField = 'recordVerifiedStatusTypeField',
  RefAuthorsTypeField = 'refAuthorsTypeField',
  RefExpressionsTypeField = 'refExpressionsTypeField',
  RefGenresInWemTypeField = 'refGenresInWemTypeField',
  RefGenresTypeField = 'refGenresTypeField',
  RefLabelGenreTypeField = 'refLabelGenreTypeField',
  RefLanguagesTypeField = 'refLanguagesTypeField',
  RefOriginalPublishersTypeField = 'refOriginalPublishersTypeField',
  RefOtherGenreTypeField = 'refOtherGenreTypeField',
  RefPartnerTypeField = 'refPartnerTypeField',
  RefPlacesTypeField = 'refPlacesTypeField',
  RefPublishersTypeField = 'refPublishersTypeField',
  RefSisosTypeField = 'refSisosTypeField',
  RefSubZizosTypeField = 'refSubZizosTypeField',
  RefSubjectsTypeField = 'refSubjectsTypeField',
  RefTargetAudienceTypeField = 'refTargetAudienceTypeField',
  RefUniformTitlesTypeField = 'refUniformTitlesTypeField',
  RefWorkInEasyReadingTypeField = 'refWorkInEasyReadingTypeField',
  RefWorkInListeningTypeField = 'refWorkInListeningTypeField',
  RefWorkInOrientingTypeField = 'refWorkInOrientingTypeField',
  RefWorkInPlayingTypeField = 'refWorkInPlayingTypeField',
  RefWorkInReadingTypeField = 'refWorkInReadingTypeField',
  RefWorkInWatchingTypeField = 'refWorkInWatchingTypeField',
  RefWorksTypeField = 'refWorksTypeField',
  RefZizosTypeField = 'refZizosTypeField',
  RolesTypeField = 'rolesTypeField',
  RugLevelTypeField = 'rugLevelTypeField',
  RugTargetAudienceTypeField = 'rugTargetAudienceTypeField',
  SourceTypeField = 'sourceTypeField',
  SubjectTypeField = 'subjectTypeField',
  SubjectsTableTypeField = 'subjectsTableTypeField',
  SystemRequirementsTypeField = 'systemRequirementsTypeField',
  TokenRolesTypeField = 'tokenRolesTypeField',
  TokenStatusTypeField = 'tokenStatusTypeField',
  UploadTypeTypeField = 'uploadTypeTypeField',
  UserTypeField = 'userTypeField',
  WatchingRecordTypeTypeField = 'watchingRecordTypeTypeField',
  WorkFunctionTypeField = 'workFunctionTypeField',
  WorkRelationTypeField = 'workRelationTypeField',
  YearNumberingTypeField = 'yearNumberingTypeField',
  ZizoTargetAudienceTypeField = 'zizoTargetAudienceTypeField'
}

export enum BaseLibraryModes {
  BasicBaseLibrary = 'basicBaseLibrary',
  BasicBaseLibraryWithBorder = 'basicBaseLibraryWithBorder',
  NormalBaseLibrary = 'normalBaseLibrary',
  PreviewBaseLibrary = 'previewBaseLibrary'
}

export type BaseRelationValuesInput = {
  editStatus: EditStatus;
  inheritFrom?: InputMaybe<InheritFromInput>;
  is_ocr?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary_thumbnail?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  lang?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Array<InputMaybe<MetadataInput>>>;
  operation?: InputMaybe<Scalars['String']['input']>;
  roles?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sort?: InputMaybe<Scalars['JSON']['input']>;
  teaserMetadata?: InputMaybe<Array<InputMaybe<MetadataInput>>>;
  type: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type Boekenbank = Entity & {
  __typename?: 'Boekenbank';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type BreadCrumbRoute = {
  __typename?: 'BreadCrumbRoute';
  entityType?: Maybe<Array<Maybe<Entitytyping>>>;
  key?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  overviewPage?: Maybe<RouteNames>;
  relation?: Maybe<Scalars['String']['output']>;
};

export type BreadCrumbRouteInput = {
  entityType?: InputMaybe<Array<InputMaybe<Entitytyping>>>;
  key?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  overviewPage?: InputMaybe<RouteNames>;
  relation?: InputMaybe<Scalars['String']['input']>;
};

export enum BulkEditModes {
  Add = 'add',
  Remove = 'remove',
  Replace = 'replace'
}

export type BulkEditResult = {
  __typename?: 'BulkEditResult';
  failedIds: Array<Scalars['String']['output']>;
  succeededIds: Array<Scalars['String']['output']>;
};

export enum BulkNavigationPages {
  DetailPage = 'detailPage'
}

export type BulkOperationCsvExportKeys = {
  __typename?: 'BulkOperationCsvExportKeys';
  options: Array<DropdownOption>;
};

export type BulkOperationInputModal = {
  askForCloseConfirmation?: InputMaybe<Scalars['Boolean']['input']>;
  customQueryEntityPickerList?: InputMaybe<Scalars['String']['input']>;
  customQueryEntityPickerListFilters?: InputMaybe<Scalars['String']['input']>;
  enableImageCrop?: InputMaybe<Scalars['Boolean']['input']>;
  formQueries?: InputMaybe<Array<Scalars['String']['input']>>;
  formRelationType?: InputMaybe<Scalars['String']['input']>;
  keyToSaveCropCoordinates?: InputMaybe<Scalars['String']['input']>;
  neededPermission?: InputMaybe<Permission>;
  pageToNavigateToAfterCreation?: InputMaybe<BulkNavigationPages>;
  replaceExistingRelations?: InputMaybe<Scalars['Boolean']['input']>;
  selectionLimit?: InputMaybe<Scalars['Int']['input']>;
  skipItemsWithRelationDuringBulkDelete?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  survivorSuggestion?: InputMaybe<MergeSurvivorSuggestionConfigInput>;
  typeModal: TypeModals;
};

export type BulkOperationModal = {
  __typename?: 'BulkOperationModal';
  askForCloseConfirmation?: Maybe<Scalars['Boolean']['output']>;
  customQueryEntityPickerList?: Maybe<Scalars['String']['output']>;
  customQueryEntityPickerListFilters?: Maybe<Scalars['String']['output']>;
  enableImageCrop?: Maybe<Scalars['Boolean']['output']>;
  formQueries?: Maybe<Array<Scalars['String']['output']>>;
  formRelationType?: Maybe<Scalars['String']['output']>;
  keyToSaveCropCoordinates?: Maybe<Scalars['String']['output']>;
  neededPermission?: Maybe<Permission>;
  pageToNavigateToAfterCreation?: Maybe<BulkNavigationPages>;
  replaceExistingRelations?: Maybe<Scalars['Boolean']['output']>;
  selectionLimit?: Maybe<Scalars['Int']['output']>;
  skipItemsWithRelationDuringBulkDelete?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  survivorSuggestion?: Maybe<MergeSurvivorSuggestionConfig>;
  typeModal: TypeModals;
};

export type BulkOperationOptions = {
  __typename?: 'BulkOperationOptions';
  options: Array<DropdownOption>;
};


export type BulkOperationOptionsOptionsArgs = {
  condition?: InputMaybe<Scalars['String']['input']>;
  input: Array<DropdownOptionInput>;
};

export enum BulkOperationTypes {
  AddRelation = 'addRelation',
  BulkUpdateMetadata = 'bulkUpdateMetadata',
  CreateEntity = 'createEntity',
  DeleteEntities = 'deleteEntities',
  DeleteRelations = 'deleteRelations',
  DownloadMediafiles = 'downloadMediafiles',
  DownloadMediafilesDirectly = 'downloadMediafilesDirectly',
  Edit = 'edit',
  ExportCsv = 'exportCsv',
  ExportCsvOfMediafilesFromAsset = 'exportCsvOfMediafilesFromAsset',
  ExportXlsx = 'exportXlsx',
  MarkAsSeen = 'markAsSeen',
  MarkAsUnseen = 'markAsUnseen',
  MergeEntities = 'mergeEntities',
  OpenDropdown = 'openDropdown',
  ReorderEntities = 'reorderEntities',
  StartOcr = 'startOcr'
}

export type BulkOperations = {
  __typename?: 'BulkOperations';
  options: Array<DropdownOption>;
};


export type BulkOperationsOptionsArgs = {
  input: Array<DropdownOptionInput>;
};

export type Buttons = {
  __typename?: 'Buttons';
  button?: Maybe<ActionButton>;
  contextMenu?: Maybe<ContextMenuActions>;
};

export type Cantook = Entity & {
  __typename?: 'Cantook';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type CharacterReplacementSettings = {
  __typename?: 'CharacterReplacementSettings';
  characterToReplaceWith: Scalars['String']['output'];
  replacementCharactersRegex: Scalars['String']['output'];
};

export type CharacterReplacementSettingsInput = {
  characterToReplaceWith: Scalars['String']['input'];
  replacementCharactersRegex: Scalars['String']['input'];
};

export type CodeWording = Entity & {
  __typename?: 'CodeWording';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum Collection {
  Entities = 'entities',
  Jobs = 'jobs',
  Mediafiles = 'mediafiles',
  Tokens = 'tokens'
}

export type Column = {
  __typename?: 'Column';
  elements: EntityViewElements;
  size: ColumnSizes;
};


export type ColumnSizeArgs = {
  size?: InputMaybe<ColumnSizes>;
};

export type ColumnList = {
  __typename?: 'ColumnList';
  column: Column;
};

export enum ColumnSizes {
  Eighty = 'eighty',
  Fifty = 'fifty',
  Forty = 'forty',
  Hundred = 'hundred',
  Ninety = 'ninety',
  Seventy = 'seventy',
  Sixty = 'sixty',
  Ten = 'ten',
  Thirty = 'thirty',
  Twenty = 'twenty'
}

export type Comment = Entity & {
  __typename?: 'Comment';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type CommentCreateFields = {
  __typename?: 'CommentCreateFields';
  metaData: PanelMetaData;
};

export type CommentsElement = {
  __typename?: 'CommentsElement';
  composer: WysiwygElement;
  createFields?: Maybe<CommentCreateFields>;
  label: Scalars['String']['output'];
  parentEntityFilterKey: Scalars['String']['output'];
  readOnly?: Maybe<Scalars['Boolean']['output']>;
};


export type CommentsElementLabelArgs = {
  input: Scalars['String']['input'];
};


export type CommentsElementParentEntityFilterKeyArgs = {
  input: Scalars['String']['input'];
};

export type Conditional = {
  __typename?: 'Conditional';
  field: Scalars['String']['output'];
  ifAnyValue: Scalars['Boolean']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

export type ConditionalInput = {
  field: Scalars['String']['input'];
  ifAnyValue?: InputMaybe<Scalars['Boolean']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type ConfigItem = {
  __typename?: 'ConfigItem';
  key: Scalars['String']['output'];
  value: Scalars['JSON']['output'];
};

export type ConfigItemInput = {
  key: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
};

export type Context = Entity & {
  __typename?: 'Context';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ContextMenuActions = {
  __typename?: 'ContextMenuActions';
  doCustomAction?: Maybe<ContextMenuCustomAction>;
  doDownloadZipOfRelatedMediafilesAction?: Maybe<ContextMenuDownloadZipOfRelatedMediafilesAction>;
  doElodyAction?: Maybe<ContextMenuElodyAction>;
  doGeneralAction?: Maybe<ContextMenuGeneralAction>;
  doLinkAction?: Maybe<ContextMenuLinkAction>;
  doQueryAction?: Maybe<ContextMenuQueryAction>;
};

export type ContextMenuCustomAction = {
  __typename?: 'ContextMenuCustomAction';
  action: ContextMenuElodyActionEnum;
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  endpointMethod?: Maybe<Scalars['String']['output']>;
  endpointUrl?: Maybe<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type ContextMenuCustomActionActionArgs = {
  input?: InputMaybe<ContextMenuElodyActionEnum>;
};


export type ContextMenuCustomActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuCustomActionEndpointMethodArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuCustomActionEndpointUrlArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuCustomActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuCustomActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export enum ContextMenuDirection {
  Left = 'left',
  Right = 'right'
}

export type ContextMenuDownloadZipOfRelatedMediafilesAction = {
  __typename?: 'ContextMenuDownloadZipOfRelatedMediafilesAction';
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  endpointMethod: Scalars['String']['output'];
  endpointUrl: Scalars['String']['output'];
  filename?: Maybe<Scalars['String']['output']>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionEndpointMethodArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionEndpointUrlArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionFilenameArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuDownloadZipOfRelatedMediafilesActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type ContextMenuElodyAction = {
  __typename?: 'ContextMenuElodyAction';
  action: ContextMenuElodyActionEnum;
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  formFlow: ContextMenuFormFlow;
  formQuery?: Maybe<Scalars['String']['output']>;
  formTitle?: Maybe<Scalars['String']['output']>;
  hidden: Scalars['Boolean']['output'];
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
  showAsButton?: Maybe<Scalars['Boolean']['output']>;
};


export type ContextMenuElodyActionActionArgs = {
  input?: InputMaybe<ContextMenuElodyActionEnum>;
};


export type ContextMenuElodyActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuElodyActionFormFlowArgs = {
  input?: InputMaybe<ContextMenuFormFlow>;
};


export type ContextMenuElodyActionFormQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuElodyActionFormTitleArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuElodyActionHiddenArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuElodyActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuElodyActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuElodyActionShowAsButtonArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ContextMenuElodyActionEnum {
  CreateEntityFromExternalSource = 'CreateEntityFromExternalSource',
  DeleteEntity = 'DeleteEntity',
  DeleteRelation = 'DeleteRelation',
  DownloadQueryResult = 'DownloadQueryResult',
  EndpointCall = 'EndpointCall',
  ReplaceRelation = 'ReplaceRelation',
  Share = 'Share',
  UpdateMetadata = 'UpdateMetadata'
}

export enum ContextMenuFormFlow {
  Removal = 'Removal',
  Update = 'Update'
}

export type ContextMenuGeneralAction = {
  __typename?: 'ContextMenuGeneralAction';
  action: ContextMenuGeneralActionEnum;
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type ContextMenuGeneralActionActionArgs = {
  input?: InputMaybe<ContextMenuGeneralActionEnum>;
};


export type ContextMenuGeneralActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuGeneralActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuGeneralActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export enum ContextMenuGeneralActionEnum {
  SetPrimaryMediafile = 'SetPrimaryMediafile',
  SetPrimaryThumbnail = 'SetPrimaryThumbnail'
}

export type ContextMenuLinkAction = {
  __typename?: 'ContextMenuLinkAction';
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type ContextMenuLinkActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuLinkActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuLinkActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type ContextMenuQueryAction = {
  __typename?: 'ContextMenuQueryAction';
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  icon: Scalars['String']['output'];
  label: Scalars['String']['output'];
  query: Scalars['String']['output'];
  refreshAfterAction: Scalars['Boolean']['output'];
};


export type ContextMenuQueryActionCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ContextMenuQueryActionIconArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuQueryActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuQueryActionQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ContextMenuQueryActionRefreshAfterActionArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CopyFromParentConfig = {
  __typename?: 'CopyFromParentConfig';
  autoCopy?: Maybe<Scalars['Boolean']['output']>;
  copyAllLabel?: Maybe<Scalars['String']['output']>;
  excludeKeys?: Maybe<Array<Scalars['String']['output']>>;
  fromRelationType?: Maybe<Scalars['String']['output']>;
  keyMap?: Maybe<Array<CopyFromParentKeyMap>>;
  keys?: Maybe<Array<Scalars['String']['output']>>;
  labelPrefix?: Maybe<Scalars['String']['output']>;
  showCopyButtons?: Maybe<Scalars['Boolean']['output']>;
};

export type CopyFromParentConfigInput = {
  autoCopy?: InputMaybe<Scalars['Boolean']['input']>;
  copyAllLabel?: InputMaybe<Scalars['String']['input']>;
  excludeKeys?: InputMaybe<Array<Scalars['String']['input']>>;
  fromRelationType?: InputMaybe<Scalars['String']['input']>;
  keyMap?: InputMaybe<Array<CopyFromParentKeyMapInput>>;
  keys?: InputMaybe<Array<Scalars['String']['input']>>;
  labelPrefix?: InputMaybe<Scalars['String']['input']>;
  showCopyButtons?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CopyFromParentKeyMap = {
  __typename?: 'CopyFromParentKeyMap';
  fromKey: Scalars['String']['output'];
  fromRelationType?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
};

export type CopyFromParentKeyMapInput = {
  fromKey: Scalars['String']['input'];
  fromRelationType?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
};

export type CopyValueFromParentIntialValues = {
  __typename?: 'CopyValueFromParentIntialValues';
  autoCopy?: Maybe<Scalars['Boolean']['output']>;
  fromRelationType?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
};

export type CopyValueFromParentIntialValuesInput = {
  autoCopy?: InputMaybe<Scalars['Boolean']['input']>;
  fromRelationType?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
};

export type Corporation = Entity & {
  __typename?: 'Corporation';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum CreateableEntityTypes {
  Award = 'award',
  CodeWording = 'code_wording',
  Context = 'context',
  Corporation = 'corporation',
  EasyReading = 'easy_reading',
  Expression = 'expression',
  Genre = 'genre',
  Group = 'group',
  Listening = 'listening',
  Manifestation = 'manifestation',
  ManifestationComputerFile = 'manifestation_computer_file',
  ManifestationFootage = 'manifestation_footage',
  ManifestationMap = 'manifestation_map',
  ManifestationMixedMaterial = 'manifestation_mixed_material',
  ManifestationMusic = 'manifestation_music',
  ManifestationSerial = 'manifestation_serial',
  ManifestationWord = 'manifestation_word',
  Nomen = 'nomen',
  Orienting = 'orienting',
  Partner = 'partner',
  Person = 'person',
  Place = 'place',
  Playing = 'playing',
  Publisher = 'publisher',
  Reading = 'reading',
  Siso = 'siso',
  TargetAudience = 'target_audience',
  Time = 'time',
  Title = 'title',
  Token = 'token',
  Watching = 'watching',
  Work = 'work',
  WorkComputerFile = 'work_computer_file',
  WorkFootage = 'work_footage',
  WorkMap = 'work_map',
  WorkMixedMaterial = 'work_mixed_material',
  WorkMusic = 'work_music',
  WorkSerial = 'work_serial',
  WorkWord = 'work_word',
  Zizo = 'zizo',
  ZizoDeelrubriek = 'zizo_deelrubriek',
  ZizoDomein = 'zizo_domein',
  ZizoGroeirubriek = 'zizo_groeirubriek',
  ZizoHoofdrubriek = 'zizo_hoofdrubriek',
  ZizoKast = 'zizo_kast',
  ZizoPlank = 'zizo_plank',
  ZizoRug = 'zizo_rug'
}

export enum CustomFormatterTypes {
  Link = 'link',
  Pill = 'pill',
  RegexpMatch = 'regexpMatch'
}

export enum DamsIcons {
  AngleDoubleLeft = 'AngleDoubleLeft',
  AngleDoubleRight = 'AngleDoubleRight',
  AngleDown = 'AngleDown',
  AngleLeft = 'AngleLeft',
  AngleRight = 'AngleRight',
  AngleUp = 'AngleUp',
  Apps = 'Apps',
  ArchiveAlt = 'ArchiveAlt',
  ArrowCircleLeft = 'ArrowCircleLeft',
  ArrowCircleRight = 'ArrowCircleRight',
  AudioThumbnail = 'AudioThumbnail',
  Backward = 'Backward',
  Ban = 'Ban',
  BookOpen = 'BookOpen',
  Cancel = 'Cancel',
  Check = 'Check',
  CheckCircle = 'CheckCircle',
  CheckSquare = 'CheckSquare',
  Circle = 'Circle',
  Close = 'Close',
  CompressAlt = 'CompressAlt',
  Create = 'Create',
  Crop = 'Crop',
  Cross = 'Cross',
  CrossCircle = 'CrossCircle',
  Desktop = 'Desktop',
  DocumentInfo = 'DocumentInfo',
  Download = 'Download',
  DownloadAlt = 'DownloadAlt',
  Edit = 'Edit',
  EditAlt = 'EditAlt',
  EllipsisH = 'EllipsisH',
  EllipsisV = 'EllipsisV',
  ExclamationTriangle = 'ExclamationTriangle',
  ExpandAlt = 'ExpandAlt',
  Export = 'Export',
  Eye = 'Eye',
  FileAlt = 'FileAlt',
  FileExport = 'FileExport',
  Filter = 'Filter',
  Focus = 'Focus',
  FocusTarget = 'FocusTarget',
  Folder = 'Folder',
  Forward = 'Forward',
  Hdd = 'Hdd',
  History = 'History',
  Iiif = 'Iiif',
  Image = 'Image',
  ImagePlus = 'ImagePlus',
  InfoCircle = 'InfoCircle',
  Keyboard = 'Keyboard',
  KeyholeSquare = 'KeyholeSquare',
  Link = 'Link',
  ListOl = 'ListOl',
  ListUl = 'ListUl',
  LocationArrowAlt = 'LocationArrowAlt',
  Map = 'Map',
  Message = 'Message',
  Minus = 'Minus',
  Music = 'Music',
  NoIcon = 'NoIcon',
  NoImage = 'NoImage',
  Plus = 'Plus',
  PlusCircle = 'PlusCircle',
  Process = 'Process',
  QuestionCircle = 'QuestionCircle',
  Redo = 'Redo',
  Save = 'Save',
  SearchGlass = 'SearchGlass',
  SearchMinus = 'SearchMinus',
  SearchPlus = 'SearchPlus',
  Settings = 'Settings',
  SignOut = 'SignOut',
  Sitemap = 'Sitemap',
  Sort = 'Sort',
  SortDown = 'SortDown',
  SortUp = 'SortUp',
  SquareFull = 'SquareFull',
  Swatchbook = 'Swatchbook',
  Table = 'Table',
  Tag = 'Tag',
  Text = 'Text',
  Trash = 'Trash',
  Update = 'Update',
  Upload = 'Upload',
  User = 'User',
  UserCircle = 'UserCircle',
  VideoSlash = 'VideoSlash',
  WindowGrid = 'WindowGrid',
  WindowMaximize = 'WindowMaximize'
}

export enum DeepRelationsFetchStrategy {
  UseExistingBreadcrumbsInfo = 'useExistingBreadcrumbsInfo',
  UseMethodsAndFetch = 'useMethodsAndFetch'
}

export type DeleteEntitiesInput = {
  deleteMediafiles?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DeleteQueryOptions = {
  __typename?: 'DeleteQueryOptions';
  blockingRelationsLabel?: Maybe<Scalars['String']['output']>;
  customQueryBlockingEntityTypes?: Maybe<Array<Maybe<Entitytyping>>>;
  customQueryBlockingRelations?: Maybe<Scalars['String']['output']>;
  customQueryBlockingRelationsFilters?: Maybe<Scalars['String']['output']>;
  customQueryDeleteRelations?: Maybe<Scalars['String']['output']>;
  customQueryDeleteRelationsFilters?: Maybe<Scalars['String']['output']>;
  customQueryEntityTypes?: Maybe<Array<Maybe<Entitytyping>>>;
  deleteEntityLabel: Scalars['String']['output'];
  deleteRelationsLabel?: Maybe<Scalars['String']['output']>;
};


export type DeleteQueryOptionsBlockingRelationsLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type DeleteQueryOptionsCustomQueryBlockingEntityTypesArgs = {
  input?: InputMaybe<Array<InputMaybe<Entitytyping>>>;
};


export type DeleteQueryOptionsCustomQueryBlockingRelationsArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type DeleteQueryOptionsCustomQueryBlockingRelationsFiltersArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type DeleteQueryOptionsCustomQueryDeleteRelationsArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type DeleteQueryOptionsCustomQueryDeleteRelationsFiltersArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type DeleteQueryOptionsCustomQueryEntityTypesArgs = {
  input?: InputMaybe<Array<InputMaybe<Entitytyping>>>;
};


export type DeleteQueryOptionsDeleteEntityLabelArgs = {
  input: Scalars['String']['input'];
};


export type DeleteQueryOptionsDeleteRelationsLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type Directory = {
  __typename?: 'Directory';
  dir?: Maybe<Scalars['String']['output']>;
  has_subdirs?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  parent: Scalars['String']['output'];
};

export type DisplayCondition = {
  __typename?: 'DisplayCondition';
  key: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};


export type DisplayConditionKeyArgs = {
  input: Scalars['String']['input'];
};


export type DisplayConditionValueArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type Download = Entity & {
  __typename?: 'Download';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type DropdownOption = {
  __typename?: 'DropdownOption';
  actionContext?: Maybe<ActionContext>;
  active?: Maybe<Scalars['Boolean']['output']>;
  allowCondition?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  availableInPages?: Maybe<Array<Maybe<RouteMatching>>>;
  bulkOperationModal?: Maybe<BulkOperationModal>;
  can?: Maybe<Array<Scalars['String']['output']>>;
  icon?: Maybe<DamsIcons>;
  label: Scalars['String']['output'];
  primary?: Maybe<Scalars['Boolean']['output']>;
  primaryFallback?: Maybe<Scalars['Boolean']['output']>;
  required?: Maybe<Scalars['Boolean']['output']>;
  requiresAuth?: Maybe<Scalars['Boolean']['output']>;
  subOptions?: Maybe<Array<Maybe<DropdownOption>>>;
  value: Scalars['StringOrInt']['output'];
};


export type DropdownOptionActionContextArgs = {
  input?: InputMaybe<ActionContextInput>;
};


export type DropdownOptionAvailableInPagesArgs = {
  input?: InputMaybe<Array<InputMaybe<RouteMatchingInput>>>;
};


export type DropdownOptionBulkOperationModalArgs = {
  input?: InputMaybe<BulkOperationInputModal>;
};

export type DropdownOptionInput = {
  actionContext?: InputMaybe<ActionContextInput>;
  active?: InputMaybe<Scalars['Boolean']['input']>;
  allowCondition?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  availableInPages?: InputMaybe<Array<InputMaybe<RouteMatchingInput>>>;
  bulkOperationModal?: InputMaybe<BulkOperationInputModal>;
  can?: InputMaybe<Array<Scalars['String']['input']>>;
  icon?: InputMaybe<DamsIcons>;
  label: Scalars['String']['input'];
  primary?: InputMaybe<Scalars['Boolean']['input']>;
  primaryFallback?: InputMaybe<Scalars['Boolean']['input']>;
  requiresAuth?: InputMaybe<Scalars['Boolean']['input']>;
  subOptions?: InputMaybe<Array<InputMaybe<DropdownOptionInput>>>;
  value: Scalars['StringOrInt']['input'];
};

export type DropzoneEntityToCreate = {
  __typename?: 'DropzoneEntityToCreate';
  options: Array<DropdownOption>;
};


export type DropzoneEntityToCreateOptionsArgs = {
  input: Array<DropdownOptionInput>;
};

export type EasyReading = Entity & {
  __typename?: 'EasyReading';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type EditMetadataButton = {
  __typename?: 'EditMetadataButton';
  editmodeLabel?: Maybe<Scalars['String']['output']>;
  hasButton: Scalars['Boolean']['output'];
  hideIfMetadataNotPresent?: Maybe<Scalars['String']['output']>;
  readmodeLabel?: Maybe<Scalars['String']['output']>;
};

export type EditMetadataButtonInput = {
  editmodeLabel?: InputMaybe<Scalars['String']['input']>;
  hasButton: Scalars['Boolean']['input'];
  hideIfMetadataNotPresent?: InputMaybe<Scalars['String']['input']>;
  readmodeLabel?: InputMaybe<Scalars['String']['input']>;
};

export enum EditStatus {
  Changed = 'changed',
  Deleted = 'deleted',
  New = 'new',
  Unchanged = 'unchanged'
}

export enum ElodyServices {
  ApolloGraphql = 'apolloGraphql',
  Pwa = 'pwa'
}

export enum ElodyViewers {
  Audio = 'audio',
  Iiif = 'iiif',
  Pdf = 'pdf',
  Text = 'text',
  Video = 'video'
}

export type EndpointInformation = {
  __typename?: 'EndpointInformation';
  endpointName?: Maybe<Scalars['String']['output']>;
  method?: Maybe<Scalars['String']['output']>;
  responseAction?: Maybe<EndpointResponseActions>;
  variables?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type EndpointInformationInput = {
  endpointName?: InputMaybe<Scalars['String']['input']>;
  method?: InputMaybe<Scalars['String']['input']>;
  responseAction?: InputMaybe<EndpointResponseActions>;
  variables?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export enum EndpointResponseActions {
  DownloadResponse = 'downloadResponse',
  Notification = 'notification'
}

export type EntitiesResults = {
  __typename?: 'EntitiesResults';
  count?: Maybe<Scalars['Int']['output']>;
  facets?: Maybe<Scalars['JSON']['output']>;
  limit?: Maybe<Scalars['Int']['output']>;
  results?: Maybe<Array<Maybe<Entity>>>;
  sortKeys?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};


export type EntitiesResultsSortKeysArgs = {
  sortItems?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Entity = {
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type EntityButtonConfig = {
  __typename?: 'EntityButtonConfig';
  icon?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  mutation: Scalars['String']['output'];
  style?: Maybe<EntityButtonStyle>;
};

export type EntityButtonStyle = {
  __typename?: 'EntityButtonStyle';
  background?: Maybe<Scalars['String']['output']>;
  text?: Maybe<Scalars['String']['output']>;
};

export type EntityFormInput = {
  metadata: Array<MetadataValuesInput>;
  relations: Array<BaseRelationValuesInput>;
  updateOnlyRelations?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EntityInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  identifiers?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  metadata?: InputMaybe<Array<InputMaybe<MetadataFieldInput>>>;
  relations?: InputMaybe<Array<InputMaybe<BaseRelationValuesInput>>>;
  title?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type EntityListElement = {
  __typename?: 'EntityListElement';
  actionsOnResult?: Maybe<ActionsOnResult>;
  addEntitiesToForms?: Maybe<Scalars['Boolean']['output']>;
  baseLibraryMode?: Maybe<BaseLibraryModes>;
  can?: Maybe<Array<Scalars['String']['output']>>;
  cropMediafileCoordinatesKey?: Maybe<Scalars['String']['output']>;
  customBulkOperations?: Maybe<Scalars['String']['output']>;
  customQuery?: Maybe<Scalars['String']['output']>;
  customQueryEntityPickerList?: Maybe<Scalars['String']['output']>;
  customQueryEntityPickerListFilters?: Maybe<Scalars['String']['output']>;
  customQueryFilters?: Maybe<Scalars['String']['output']>;
  customQueryRelationType?: Maybe<Scalars['String']['output']>;
  disableLibraryBar?: Maybe<Scalars['Boolean']['output']>;
  displayCondition?: Maybe<DisplayCondition>;
  enableAdvancedFilters?: Maybe<Scalars['Boolean']['output']>;
  enableNavigation?: Maybe<Scalars['Boolean']['output']>;
  entityList?: Maybe<Array<Maybe<Entity>>>;
  entityListElement?: Maybe<EntityListElement>;
  entityTypes?: Maybe<Array<Maybe<Entitytyping>>>;
  fetchDeepRelations?: Maybe<FetchDeepRelations>;
  filtersNeedContext?: Maybe<Array<Maybe<EntitySubelement>>>;
  isCollapsed: Scalars['Boolean']['output'];
  label?: Maybe<Scalars['String']['output']>;
  relationType?: Maybe<Scalars['String']['output']>;
  searchInputType?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  viewMode?: Maybe<EntityListViewMode>;
};


export type EntityListElementAddEntitiesToFormsArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type EntityListElementBaseLibraryModeArgs = {
  input?: InputMaybe<BaseLibraryModes>;
};


export type EntityListElementCanArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type EntityListElementCropMediafileCoordinatesKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomBulkOperationsArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomQueryEntityPickerListArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomQueryEntityPickerListFiltersArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomQueryFiltersArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementCustomQueryRelationTypeArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementDisableLibraryBarArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type EntityListElementEnableAdvancedFiltersArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type EntityListElementEnableNavigationArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type EntityListElementEntityListArgs = {
  metaKey?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementEntityTypesArgs = {
  input?: InputMaybe<Array<InputMaybe<Entitytyping>>>;
};


export type EntityListElementFiltersNeedContextArgs = {
  input?: InputMaybe<Array<InputMaybe<EntitySubelement>>>;
};


export type EntityListElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type EntityListElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementRelationTypeArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementSearchInputTypeArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type EntityListElementTypeArgs = {
  input?: InputMaybe<MediaFileElementTypes>;
};


export type EntityListElementViewModeArgs = {
  input?: InputMaybe<EntityListViewMode>;
};

export enum EntityListViewMode {
  Dropdown = 'Dropdown',
  Library = 'Library'
}

export enum EntityPickerMode {
  Emit = 'emit',
  Save = 'save'
}

export type EntityPickerSearchConfig = {
  __typename?: 'EntityPickerSearchConfig';
  acceptedTypes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  metadataKeys?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  mode?: Maybe<EntityPickerSearchMode>;
  staticFilters?: Maybe<Scalars['JSON']['output']>;
};

export type EntityPickerSearchConfigInput = {
  acceptedTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  metadataKeys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  mode?: InputMaybe<EntityPickerSearchMode>;
  staticFilters?: InputMaybe<Array<InputMaybe<AdvancedFilterInput>>>;
};

export enum EntityPickerSearchMode {
  Filters = 'Filters',
  Search = 'Search'
}

export enum EntitySubelement {
  IntialValues = 'intialValues',
  RelationValues = 'relationValues'
}

export type EntityViewElements = {
  __typename?: 'EntityViewElements';
  actionElement?: Maybe<ActionElement>;
  commentsElement?: Maybe<CommentsElement>;
  entityListElement?: Maybe<EntityListElement>;
  entityViewerElement?: Maybe<EntityViewerElement>;
  graphElement?: Maybe<GraphElement>;
  hierarchyListElement?: Maybe<HierarchyListElement>;
  manifestViewerElement?: Maybe<ManifestViewerElement>;
  mapElement?: Maybe<MapElement>;
  markdownViewerElement?: Maybe<MarkdownViewerElement>;
  mediaFileElement?: Maybe<MediaFileElement>;
  singleMediaFileElement?: Maybe<SingleMediaFileElement>;
  windowElement?: Maybe<WindowElement>;
  wysiwygElement?: Maybe<WysiwygElement>;
};

export type EntityViewerElement = {
  __typename?: 'EntityViewerElement';
  entityId: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type EntityViewerElementEntityIdArgs = {
  metadataKey?: InputMaybe<Scalars['String']['input']>;
  relationType?: InputMaybe<Scalars['String']['input']>;
};


export type EntityViewerElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export enum Entitytyping {
  BaseEntity = 'BaseEntity',
  Award = 'award',
  Boekenbank = 'boekenbank',
  Cantook = 'cantook',
  CodeWording = 'code_wording',
  Comment = 'comment',
  Context = 'context',
  Corporation = 'corporation',
  EasyReading = 'easy_reading',
  Expression = 'expression',
  Genre = 'genre',
  Group = 'group',
  History = 'history',
  Home = 'home',
  Job = 'job',
  Language = 'language',
  Listening = 'listening',
  Manifestation = 'manifestation',
  ManifestationComputerFile = 'manifestation_computer_file',
  ManifestationFootage = 'manifestation_footage',
  ManifestationMap = 'manifestation_map',
  ManifestationMixedMaterial = 'manifestation_mixed_material',
  ManifestationMusic = 'manifestation_music',
  ManifestationSerial = 'manifestation_serial',
  ManifestationWord = 'manifestation_word',
  MediaFileEntity = 'mediaFileEntity',
  Mediafile = 'mediafile',
  Muziekweb = 'muziekweb',
  Nomen = 'nomen',
  Omnibus = 'omnibus',
  Orienting = 'orienting',
  Partner = 'partner',
  Person = 'person',
  Place = 'place',
  Playing = 'playing',
  Publisher = 'publisher',
  Reading = 'reading',
  SavedSearch = 'saved_search',
  ShareLink = 'shareLink',
  Siso = 'siso',
  TargetAudience = 'target_audience',
  Tenant = 'tenant',
  Time = 'time',
  Title = 'title',
  Token = 'token',
  User = 'user',
  Watching = 'watching',
  Work = 'work',
  WorkComputerFile = 'work_computer_file',
  WorkFootage = 'work_footage',
  WorkMap = 'work_map',
  WorkMixedMaterial = 'work_mixed_material',
  WorkMusic = 'work_music',
  WorkSerial = 'work_serial',
  WorkWord = 'work_word',
  Zizo = 'zizo',
  ZizoDeelrubriek = 'zizo_deelrubriek',
  ZizoDomein = 'zizo_domein',
  ZizoGroeirubriek = 'zizo_groeirubriek',
  ZizoHoofdrubriek = 'zizo_hoofdrubriek',
  ZizoKast = 'zizo_kast',
  ZizoPlank = 'zizo_plank',
  ZizoRug = 'zizo_rug'
}

export enum ErrorCodeType {
  Read = 'read',
  Write = 'write'
}

export type ExpandButtonOptions = {
  __typename?: 'ExpandButtonOptions';
  orientation?: Maybe<Orientations>;
  shown: Scalars['Boolean']['output'];
};


export type ExpandButtonOptionsOrientationArgs = {
  input?: InputMaybe<Orientations>;
};


export type ExpandButtonOptionsShownArgs = {
  input: Scalars['Boolean']['input'];
};

export type Expression = Entity & {
  __typename?: 'Expression';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type FacetInputInput = {
  facets?: InputMaybe<Array<FacetInputInput>>;
  key?: InputMaybe<Scalars['String']['input']>;
  lookups?: InputMaybe<Array<LookupInput>>;
  type?: InputMaybe<AdvancedFilterTypes>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type FacetInputType = {
  __typename?: 'FacetInputType';
  facets?: Maybe<Array<FacetInputType>>;
  key?: Maybe<Scalars['String']['output']>;
  lookups?: Maybe<Array<LookupInputType>>;
  type?: Maybe<AdvancedFilterTypes>;
  value?: Maybe<Scalars['JSON']['output']>;
};

export type FetchDeepRelations = {
  __typename?: 'FetchDeepRelations';
  amountOfRecursions?: Maybe<Scalars['Int']['output']>;
  deepRelationsFetchStrategy?: Maybe<DeepRelationsFetchStrategy>;
  entityTypes?: Maybe<Array<Maybe<Entitytyping>>>;
  routeConfig?: Maybe<Array<Maybe<BreadCrumbRoute>>>;
};


export type FetchDeepRelationsAmountOfRecursionsArgs = {
  input?: InputMaybe<Scalars['Int']['input']>;
};


export type FetchDeepRelationsDeepRelationsFetchStrategyArgs = {
  input?: InputMaybe<DeepRelationsFetchStrategy>;
};


export type FetchDeepRelationsEntityTypesArgs = {
  input?: InputMaybe<Array<InputMaybe<Entitytyping>>>;
};


export type FetchDeepRelationsRouteConfigArgs = {
  input?: InputMaybe<Array<InputMaybe<BreadCrumbRouteInput>>>;
};

export type FileProgress = {
  __typename?: 'FileProgress';
  steps?: Maybe<Array<Maybe<FileProgressStep>>>;
  type: ActionProgressIndicatorType;
};

export type FileProgressStep = {
  __typename?: 'FileProgressStep';
  label: Scalars['String']['output'];
  status: ProgressStepStatus;
  stepType: ProgressStepType;
};

export enum FileType {
  Alto = 'alto',
  Csv = 'csv',
  Gif = 'gif',
  Jpeg = 'jpeg',
  Jpg = 'jpg',
  Json = 'json',
  Mp3 = 'mp3',
  Mp4 = 'mp4',
  Pdf = 'pdf',
  Png = 'png',
  Svg = 'svg',
  Tif = 'tif',
  Tiff = 'tiff',
  Txt = 'txt',
  Xlsx = 'xlsx',
  Xml = 'xml'
}

export type FilterInput = {
  key: Scalars['String']['input'];
  minMaxInput?: InputMaybe<MinMaxInput>;
  multiSelectInput?: InputMaybe<MultiSelectInput>;
  selectionInput?: InputMaybe<SelectionInput>;
  textInput?: InputMaybe<TextInput>;
  type: AdvancedInputType;
};

export type FilterMatchers = {
  __typename?: 'FilterMatchers';
  key: Scalars['String']['output'];
  matchers: Array<Scalars['String']['output']>;
};

export type FilterOptionsMappingInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type FilterOptionsMappingType = {
  __typename?: 'FilterOptionsMappingType';
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type Filters = {
  query?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type Form = {
  __typename?: 'Form';
  copyFromParent: CopyFromParentConfig;
  formTab: FormTab;
  infoLabel?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  modalStyle: ModalStyle;
};


export type FormCopyFromParentArgs = {
  input: CopyFromParentConfigInput;
};


export type FormInfoLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type FormLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type FormModalStyleArgs = {
  input: ModalStyle;
};

export type FormAction = {
  __typename?: 'FormAction';
  actionProgressIndicator?: Maybe<ActionProgress>;
  actionQuery?: Maybe<Scalars['String']['output']>;
  actionType?: Maybe<ActionType>;
  creationType: Entitytyping;
  endpointInformation: EndpointInformation;
  icon?: Maybe<DamsIcons>;
  label: Scalars['String']['output'];
  showsFormErrors?: Maybe<Scalars['Boolean']['output']>;
};


export type FormActionActionQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type FormActionActionTypeArgs = {
  input?: InputMaybe<ActionType>;
};


export type FormActionCreationTypeArgs = {
  input?: InputMaybe<Entitytyping>;
};


export type FormActionEndpointInformationArgs = {
  input: EndpointInformationInput;
};


export type FormActionIconArgs = {
  input?: InputMaybe<DamsIcons>;
};


export type FormActionLabelArgs = {
  input: Scalars['String']['input'];
};


export type FormActionShowsFormErrorsArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export type FormFields = {
  __typename?: 'FormFields';
  action?: Maybe<FormAction>;
  formSection?: Maybe<FormSection>;
  metaData: PanelMetaData;
  uploadContainer?: Maybe<UploadContainer>;
};

/** A titled section of a form around its own form fields (a SHACL UI sh:PropertyGroup) */
export type FormSection = {
  __typename?: 'FormSection';
  formFields: FormFields;
  label: Scalars['String']['output'];
};


/** A titled section of a form around its own form fields (a SHACL UI sh:PropertyGroup) */
export type FormSectionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type FormTab = {
  __typename?: 'FormTab';
  copyFromParent: CopyFromParentConfig;
  formFields: FormFields;
  formKey?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  relationType?: Maybe<Scalars['String']['output']>;
};


export type FormTabCopyFromParentArgs = {
  input: CopyFromParentConfigInput;
};


export type FormTabFormKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type FormTabLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type FormTabRelationTypeArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type Formatters = LinkFormatter | PillFormatter | RegexpMatchFormatter;

export enum FrontendEntitytyping {
  BaseEntity = 'BaseEntity',
  Asset = 'asset',
  Context = 'context',
  EasyReading = 'easy_reading',
  Expressions = 'expressions',
  History = 'history',
  Home = 'home',
  Listening = 'listening',
  ManifestationComputerFile = 'manifestation_computer_file',
  ManifestationFootage = 'manifestation_footage',
  ManifestationMap = 'manifestation_map',
  ManifestationMixedMaterial = 'manifestation_mixed_material',
  ManifestationMusic = 'manifestation_music',
  ManifestationSerial = 'manifestation_serial',
  ManifestationWord = 'manifestation_word',
  Manifestations = 'manifestations',
  Omnibus = 'omnibus',
  Orienting = 'orienting',
  Playing = 'playing',
  Reading = 'reading',
  SavedSearch = 'saved_search',
  ShareLink = 'shareLink',
  Tenant = 'tenant',
  Watching = 'watching',
  WorkComputerFile = 'work_computer_file',
  WorkFootage = 'work_footage',
  WorkMap = 'work_map',
  WorkMixedMaterial = 'work_mixed_material',
  WorkMusic = 'work_music',
  WorkSerial = 'work_serial',
  WorkWord = 'work_word',
  Works = 'works',
  ZizoDeelrubriek = 'zizo_deelrubriek',
  ZizoDomein = 'zizo_domein',
  ZizoGroeirubriek = 'zizo_groeirubriek',
  ZizoHoofdrubriek = 'zizo_hoofdrubriek',
  ZizoKast = 'zizo_kast',
  ZizoPlank = 'zizo_plank',
  ZizoRug = 'zizo_rug'
}

export type Genre = Entity & {
  __typename?: 'Genre';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type GeoJsonFeature = {
  __typename?: 'GeoJsonFeature';
  value?: Maybe<Scalars['JSON']['output']>;
};


export type GeoJsonFeatureValueArgs = {
  coordinates: GeoJsonFeatureInput;
  id: GeoJsonFeatureInput;
  weight: GeoJsonFeatureInput;
};

export type GeoJsonFeatureInput = {
  defaultValue?: InputMaybe<Scalars['JSON']['input']>;
  key: Scalars['String']['input'];
  minimalValue?: InputMaybe<Scalars['JSON']['input']>;
  relationKey?: InputMaybe<Scalars['String']['input']>;
  source: KeyValueSource;
};

export type GraphDataset = {
  __typename?: 'GraphDataset';
  filter?: Maybe<GraphDatasetFilter>;
  labels: Array<Scalars['String']['output']>;
};

export type GraphDatasetFilter = {
  __typename?: 'GraphDatasetFilter';
  key?: Maybe<Scalars['String']['output']>;
  values?: Maybe<Array<Scalars['String']['output']>>;
};

export type GraphDatasetFilterInput = {
  key?: InputMaybe<Scalars['String']['input']>;
  values?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type GraphDatasetInput = {
  filter?: InputMaybe<GraphDatasetFilterInput>;
  labels: Array<Scalars['String']['input']>;
};

export type GraphElement = {
  __typename?: 'GraphElement';
  convert_to?: Maybe<Scalars['String']['output']>;
  datapoints: Scalars['Int']['output'];
  dataset: GraphDataset;
  datasource: Scalars['String']['output'];
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  timeUnit: TimeUnit;
  type: GraphType;
};


export type GraphElementConvert_ToArgs = {
  input: Scalars['String']['input'];
};


export type GraphElementDatapointsArgs = {
  input: Scalars['Int']['input'];
};


export type GraphElementDatasetArgs = {
  input: GraphDatasetInput;
};


export type GraphElementDatasourceArgs = {
  input: Scalars['String']['input'];
};


export type GraphElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type GraphElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type GraphElementTimeUnitArgs = {
  input: TimeUnit;
};


export type GraphElementTypeArgs = {
  input: GraphType;
};

export type GraphElementInput = {
  convert_to?: InputMaybe<Scalars['String']['input']>;
  datapoints: Scalars['Int']['input'];
  dataset: GraphDatasetInput;
  datasource: Scalars['String']['input'];
  timeUnit: TimeUnit;
};

export enum GraphType {
  Bar = 'bar',
  Bubble = 'bubble',
  Doughnut = 'doughnut',
  Line = 'line',
  Pie = 'pie',
  PolarArea = 'polarArea',
  Radar = 'radar',
  Scatter = 'scatter'
}

export type Group = Entity & {
  __typename?: 'Group';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type HiddenField = {
  __typename?: 'HiddenField';
  entityType?: Maybe<Entitytyping>;
  hidden?: Maybe<Scalars['Boolean']['output']>;
  inherited?: Maybe<Scalars['Boolean']['output']>;
  keyToExtractValue?: Maybe<Scalars['String']['output']>;
  relationToExtractKey?: Maybe<Scalars['String']['output']>;
  searchValueForFilter?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type HiddenFieldInput = {
  entityType?: InputMaybe<Entitytyping>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  inherited?: InputMaybe<Scalars['Boolean']['input']>;
  keyToExtractValue?: InputMaybe<Scalars['String']['input']>;
  relationToExtractKey?: InputMaybe<Scalars['String']['input']>;
  searchValueForFilter?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type HierarchyListElement = {
  __typename?: 'HierarchyListElement';
  can?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  centerCoordinatesKey: Scalars['String']['output'];
  customQuery: Scalars['String']['output'];
  entityTypeAsCenterPoint?: Maybe<Entitytyping>;
  hierarchyRelationList: Array<Maybe<HierarchyRelationList>>;
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
};


export type HierarchyListElementCanArgs = {
  input?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type HierarchyListElementCenterCoordinatesKeyArgs = {
  input: Scalars['String']['input'];
};


export type HierarchyListElementCustomQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type HierarchyListElementEntityTypeAsCenterPointArgs = {
  input?: InputMaybe<Entitytyping>;
};


export type HierarchyListElementHierarchyRelationListArgs = {
  input?: InputMaybe<Array<InputMaybe<HierarchyRelationListInput>>>;
};


export type HierarchyListElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type HierarchyListElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type HierarchyRelationList = {
  __typename?: 'HierarchyRelationList';
  entityType: Entitytyping;
  key: Scalars['String']['output'];
};

export type HierarchyRelationListInput = {
  entityType: Entitytyping;
  key: Scalars['String']['input'];
};

export type Home = Entity & {
  __typename?: 'Home';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ImportReturn = {
  __typename?: 'ImportReturn';
  count?: Maybe<Scalars['Int']['output']>;
  job_id?: Maybe<Scalars['String']['output']>;
  message_id?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
};

export type InfoPanel = {
  __typename?: 'InfoPanel';
  content?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type InheritFromInput = {
  entityType: Entitytyping;
  relationKey: Scalars['String']['input'];
  valueKey: Scalars['String']['input'];
};

export type InlineTrigger = {
  __typename?: 'InlineTrigger';
  character: Scalars['String']['output'];
  minCharacters?: Maybe<Scalars['Int']['output']>;
};

export type InlineTriggerInput = {
  character: Scalars['String']['input'];
  minCharacters?: InputMaybe<Scalars['Int']['input']>;
};

export type InputField = {
  __typename?: 'InputField';
  advancedFilterInputForRetrievingAllOptions?: Maybe<Array<AdvancedFilterInputType>>;
  advancedFilterInputForRetrievingOptions?: Maybe<Array<AdvancedFilterInputType>>;
  advancedFilterInputForRetrievingRelatedOptions?: Maybe<Array<AdvancedFilterInputType>>;
  advancedFilterInputForSearchingOptions?: Maybe<AdvancedFilterInputType>;
  autoAllSelectable?: Maybe<Scalars['Boolean']['output']>;
  autoSelectable?: Maybe<Scalars['Boolean']['output']>;
  canCreateEntityFromOption?: Maybe<Scalars['Boolean']['output']>;
  deferEntityCreation?: Maybe<Scalars['Boolean']['output']>;
  dependsOn?: Maybe<Scalars['String']['output']>;
  disabled?: Maybe<Scalars['Boolean']['output']>;
  entityPickerSearchConfig?: Maybe<EntityPickerSearchConfig>;
  entityType?: Maybe<Scalars['String']['output']>;
  fieldKeyToSave?: Maybe<Scalars['String']['output']>;
  fieldName?: Maybe<Scalars['String']['output']>;
  fileProgressSteps?: Maybe<FileProgress>;
  fileTypes?: Maybe<Array<Maybe<FileType>>>;
  fromRelationType?: Maybe<Scalars['String']['output']>;
  hasVirtualKeyboard?: Maybe<Scalars['Boolean']['output']>;
  isMetadataField?: Maybe<Scalars['Boolean']['output']>;
  lineClamp?: Maybe<Scalars['String']['output']>;
  maxAmountOfFiles?: Maybe<Scalars['Int']['output']>;
  maxFileSize?: Maybe<Scalars['String']['output']>;
  metadataKeyToCreateEntityFromOption?: Maybe<Scalars['String']['output']>;
  metadataOnRelationFieldConfig?: Maybe<MetadataOnRelationFieldConfig>;
  multiple?: Maybe<Scalars['Boolean']['output']>;
  options?: Maybe<Array<Maybe<DropdownOption>>>;
  optionsOrderByKey?: Maybe<Scalars['String']['output']>;
  readOnlyValueAsPlainText?: Maybe<Scalars['Boolean']['output']>;
  relationFilter?: Maybe<AdvancedFilterInputType>;
  relationType?: Maybe<Scalars['String']['output']>;
  resolveOptionsFilterOnModalParent?: Maybe<Scalars['Boolean']['output']>;
  subFields?: Maybe<Array<Maybe<SubField>>>;
  type: Scalars['String']['output'];
  uploadMultiple?: Maybe<Scalars['Boolean']['output']>;
  validation?: Maybe<Validation>;
  virtualKeyboardConfig?: Maybe<VirtualKeyboardConfig>;
  visibleIf?: Maybe<VisibleIf>;
};


export type InputFieldEntityPickerSearchConfigArgs = {
  input?: InputMaybe<EntityPickerSearchConfigInput>;
};


export type InputFieldFieldKeyToSaveArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type InputFieldFieldNameArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type InputFieldIsMetadataFieldArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type InputFieldValidationArgs = {
  input?: InputMaybe<ValidationInput>;
};


export type InputFieldVirtualKeyboardConfigArgs = {
  input?: InputMaybe<VirtualKeyboardConfigInput>;
};


export type InputFieldVisibleIfArgs = {
  input?: InputMaybe<VisibleIfInput>;
};

export enum InputFieldTypes {
  BaseEntityPickerField = 'baseEntityPickerField',
  BaseFileSystemImportField = 'baseFileSystemImportField',
  BaseMagazineWithCsvImportField = 'baseMagazineWithCsvImportField',
  BaseMagazineWithMetsImportField = 'baseMagazineWithMetsImportField',
  BaseMediafilesWithOcrImportField = 'baseMediafilesWithOcrImportField',
  Checkbox = 'checkbox',
  Color = 'color',
  CsvUpload = 'csvUpload',
  Date = 'date',
  Dropdown = 'dropdown',
  DropdownMultiselectMetadata = 'dropdownMultiselectMetadata',
  DropdownMultiselectRelations = 'dropdownMultiselectRelations',
  DropdownSingleselectMetadata = 'dropdownSingleselectMetadata',
  DropdownSingleselectRelations = 'dropdownSingleselectRelations',
  FileUpload = 'fileUpload',
  InputFieldWithSubFields = 'inputFieldWithSubFields',
  Number = 'number',
  Radio = 'radio',
  Range = 'range',
  ResizableTextarea = 'resizableTextarea',
  Text = 'text',
  Textarea = 'textarea',
  XmlUpload = 'xmlUpload'
}

export type IntialValues = {
  __typename?: 'IntialValues';
  canDelete: Scalars['Boolean']['output'];
  canUpdate: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  keyLabel?: Maybe<Scalars['JSON']['output']>;
  keyValue?: Maybe<Scalars['JSON']['output']>;
  lockedProperties: Array<Scalars['String']['output']>;
  relationMetadata?: Maybe<IntialValues>;
};


export type IntialValuesKeyLabelArgs = {
  key: Scalars['String']['input'];
  source: KeyValueSource;
};


export type IntialValuesKeyValueArgs = {
  asArray?: InputMaybe<Scalars['Boolean']['input']>;
  containsRelationPropertyKey?: InputMaybe<Scalars['String']['input']>;
  containsRelationPropertyValue?: InputMaybe<Scalars['String']['input']>;
  formatter?: InputMaybe<Scalars['String']['input']>;
  index?: InputMaybe<Scalars['Int']['input']>;
  key: Scalars['String']['input'];
  keyOnMetadata?: InputMaybe<Scalars['String']['input']>;
  metadataKeyAsLabel?: InputMaybe<Scalars['String']['input']>;
  nestedMetadataKeys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  parentRelations?: InputMaybe<Array<InputMaybe<ParentRelationsConfigInput>>>;
  relationDirection?: InputMaybe<RelationDirection>;
  relationEntityType?: InputMaybe<Scalars['String']['input']>;
  relationKey?: InputMaybe<Scalars['String']['input']>;
  repeatableMetadataKey?: InputMaybe<Scalars['String']['input']>;
  rootKeyAsLabel?: InputMaybe<Scalars['String']['input']>;
  source: KeyValueSource;
  technicalOrigin?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
};


export type IntialValuesRelationMetadataArgs = {
  type: Scalars['String']['input'];
};

export type Job = Entity & {
  __typename?: 'Job';
  _id?: Maybe<Scalars['String']['output']>;
  _key?: Maybe<Scalars['String']['output']>;
  _rev?: Maybe<Scalars['String']['output']>;
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  amount_of_jobs?: Maybe<Scalars['Int']['output']>;
  asset_id?: Maybe<Scalars['String']['output']>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  completed_jobs?: Maybe<Scalars['Int']['output']>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  end_time?: Maybe<Scalars['String']['output']>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  job_info?: Maybe<Scalars['String']['output']>;
  job_type?: Maybe<Scalars['String']['output']>;
  mapElement?: Maybe<MapElement>;
  mediafile_id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  parent_job_id?: Maybe<Scalars['String']['output']>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  start_time?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  sub_jobs?: Maybe<SubJobResults>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  user?: Maybe<Scalars['String']['output']>;
  uuid: Scalars['String']['output'];
};

export type JobPollResult = {
  __typename?: 'JobPollResult';
  hasJob: Scalars['Boolean']['output'];
  info?: Maybe<Scalars['String']['output']>;
  jobId?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export enum JobType {
  All = 'all',
  CsvImport = 'csv_import',
  CsvRead = 'csv_read',
  CsvRowImport = 'csv_row_import',
  UploadFile = 'upload_file',
  UploadTranscode = 'upload_transcode'
}

export type JobsResults = {
  __typename?: 'JobsResults';
  count?: Maybe<Scalars['Int']['output']>;
  limit?: Maybe<Scalars['Int']['output']>;
  next?: Maybe<Scalars['String']['output']>;
  results?: Maybe<Array<Maybe<Job>>>;
};

export type KeyAndValue = {
  __typename?: 'KeyAndValue';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type KeyValue = {
  __typename?: 'KeyValue';
  keyValue: Scalars['JSON']['output'];
};


export type KeyValueKeyValueArgs = {
  key: Scalars['String']['input'];
};

export enum KeyValueSource {
  Metadata = 'metadata',
  MetadataOrRelation = 'metadataOrRelation',
  ParentMetadata = 'parentMetadata',
  ParentRelations = 'parentRelations',
  ParentRoot = 'parentRoot',
  RelationMetadata = 'relationMetadata',
  RelationRootdata = 'relationRootdata',
  Relations = 'relations',
  RepeatableMetadata = 'repeatableMetadata',
  Root = 'root',
  TechnicalMetadata = 'technicalMetadata',
  TypePillLabel = 'typePillLabel'
}

export type Language = Entity & {
  __typename?: 'Language';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type LinkFormatter = {
  __typename?: 'LinkFormatter';
  background?: Maybe<Scalars['String']['output']>;
  customLabel?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<DamsIcons>;
  label: Scalars['String']['output'];
  link: Scalars['String']['output'];
  openInNewTab?: Maybe<Scalars['Boolean']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export enum ListItemCoverageTypes {
  AllListItems = 'AllListItems',
  OneListItem = 'OneListItem'
}

export type Listening = Entity & {
  __typename?: 'Listening';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type LookupInput = {
  as: Scalars['String']['input'];
  foreign_field: Scalars['String']['input'];
  from: Scalars['String']['input'];
  local_field: Scalars['String']['input'];
  resolve_to_source_ids?: InputMaybe<Scalars['Boolean']['input']>;
};

export type LookupInputType = {
  __typename?: 'LookupInputType';
  as: Scalars['String']['output'];
  foreign_field: Scalars['String']['output'];
  from: Scalars['String']['output'];
  local_field: Scalars['String']['output'];
  resolve_to_source_ids?: Maybe<Scalars['Boolean']['output']>;
};

export type ManifestViewerElement = {
  __typename?: 'ManifestViewerElement';
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  manifestUrl: Scalars['String']['output'];
  manifestVersion: Scalars['Int']['output'];
};


export type ManifestViewerElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type ManifestViewerElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type ManifestViewerElementManifestUrlArgs = {
  metadataKey: Scalars['String']['input'];
};


export type ManifestViewerElementManifestVersionArgs = {
  metadataKey: Scalars['String']['input'];
};

export type Manifestation = Entity & {
  __typename?: 'Manifestation';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationComputerFile = Entity & {
  __typename?: 'ManifestationComputerFile';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationFootage = Entity & {
  __typename?: 'ManifestationFootage';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationMap = Entity & {
  __typename?: 'ManifestationMap';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationMixedMaterial = Entity & {
  __typename?: 'ManifestationMixedMaterial';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationMusic = Entity & {
  __typename?: 'ManifestationMusic';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationSerial = Entity & {
  __typename?: 'ManifestationSerial';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ManifestationWord = Entity & {
  __typename?: 'ManifestationWord';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type MapElement = {
  __typename?: 'MapElement';
  center: Scalars['String']['output'];
  config?: Maybe<Array<Maybe<ConfigItem>>>;
  geoJsonFeature?: Maybe<GeoJsonFeature>;
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  mapFeatureMetadata?: Maybe<MapFeatureMetadata>;
  mapMetadata?: Maybe<MapMetadata>;
  metaData: PanelMetaData;
  type: Scalars['String']['output'];
};


export type MapElementCenterArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type MapElementConfigArgs = {
  input?: InputMaybe<Array<InputMaybe<ConfigItemInput>>>;
};


export type MapElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type MapElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type MapElementTypeArgs = {
  input?: InputMaybe<MapTypes>;
};

export type MapFeatureMetadata = {
  __typename?: 'MapFeatureMetadata';
  metaData: PanelMetaData;
};

export type MapMetadata = {
  __typename?: 'MapMetadata';
  value: Scalars['JSON']['output'];
};


export type MapMetadataValueArgs = {
  defaultValue?: InputMaybe<Scalars['JSON']['input']>;
  key: Scalars['String']['input'];
  relationKey?: InputMaybe<Scalars['String']['input']>;
  source: KeyValueSource;
};

export enum MapModes {
  Default = 'default',
  HeatMode = 'heatMode',
  Points = 'points'
}

export enum MapTypes {
  HeatMap = 'heatMap',
  PointsMap = 'pointsMap',
  WktMap = 'wktMap'
}

export enum MapViews {
  Satellite = 'satellite',
  Standard = 'standard'
}

export type MarkdownViewerElement = {
  __typename?: 'MarkdownViewerElement';
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  markdownContent: Scalars['String']['output'];
};


export type MarkdownViewerElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type MarkdownViewerElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type MarkdownViewerElementMarkdownContentArgs = {
  metadataKey: Scalars['String']['input'];
};

export type MatchMetadataValue = {
  __typename?: 'MatchMetadataValue';
  matchKey?: Maybe<Scalars['String']['output']>;
  matchValue?: Maybe<Scalars['String']['output']>;
};

export type MatchMetadataValueInput = {
  matchKey?: InputMaybe<Scalars['String']['input']>;
  matchValue?: InputMaybe<Scalars['String']['input']>;
};

export type MatcherLabelInput = {
  label: Scalars['String']['input'];
  matcher: Matchers;
};

export type MatcherLabelType = {
  __typename?: 'MatcherLabelType';
  label: Scalars['String']['output'];
  matcher: Matchers;
};

export enum Matchers {
  AnyMatcher = 'AnyMatcher',
  ContainsMatcher = 'ContainsMatcher',
  ContainsNotMatcher = 'ContainsNotMatcher',
  ExactAutoCompleteMatcher = 'ExactAutoCompleteMatcher',
  ExactInputMatcher = 'ExactInputMatcher',
  ExactMatcher = 'ExactMatcher',
  GeoMatcher = 'GeoMatcher',
  InBetweenMatcher = 'InBetweenMatcher',
  MaxIncludedMatcher = 'MaxIncludedMatcher',
  MinIncludedMatcher = 'MinIncludedMatcher',
  NoneMatcher = 'NoneMatcher',
  RegexMatcher = 'RegexMatcher'
}

export type Media = Entity & {
  __typename?: 'Media';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type MediaFile = {
  __typename?: 'MediaFile';
  _id: Scalars['String']['output'];
  entities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  filename?: Maybe<Scalars['String']['output']>;
  isPublic?: Maybe<Scalars['Boolean']['output']>;
  is_primary?: Maybe<Scalars['Boolean']['output']>;
  is_primary_thumbnail?: Maybe<Scalars['Boolean']['output']>;
  metadata?: Maybe<Array<Maybe<MediaFileMetadata>>>;
  mimetype?: Maybe<Scalars['String']['output']>;
  original_file_location?: Maybe<Scalars['String']['output']>;
  thumbnail_file_location?: Maybe<Scalars['String']['output']>;
  transcode_filename?: Maybe<Scalars['String']['output']>;
  user?: Maybe<Scalars['String']['output']>;
};

export type MediaFileElement = {
  __typename?: 'MediaFileElement';
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  metaData: PanelMetaData;
  type: Scalars['String']['output'];
};


export type MediaFileElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type MediaFileElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type MediaFileElementTypeArgs = {
  input?: InputMaybe<MediaFileElementTypes>;
};

export enum MediaFileElementTypes {
  Map = 'map',
  Media = 'media'
}

export type MediaFileEntity = Entity & {
  __typename?: 'MediaFileEntity';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type MediaFileInput = {
  _id?: InputMaybe<Scalars['String']['input']>;
  entities?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  filename?: InputMaybe<Scalars['String']['input']>;
  is_primary?: InputMaybe<Scalars['Boolean']['input']>;
  is_primary_thumbnail?: InputMaybe<Scalars['Boolean']['input']>;
  metadata?: InputMaybe<Array<InputMaybe<MediaFileMetadataInput>>>;
  mimetype?: InputMaybe<Scalars['String']['input']>;
  original_file_location?: InputMaybe<Scalars['String']['input']>;
  thumbnail_file_location?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export type MediaFileMetadata = {
  __typename?: 'MediaFileMetadata';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type MediaFileMetadataInput = {
  key?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type MediaFilePostReturn = {
  __typename?: 'MediaFilePostReturn';
  url?: Maybe<Scalars['String']['output']>;
};

export enum MediaTypeEntities {
  Asset = 'asset',
  Mediafile = 'mediafile'
}

export type Menu = {
  __typename?: 'Menu';
  menuItem?: Maybe<MenuItem>;
  name: Scalars['String']['output'];
};


export type MenuMenuItemArgs = {
  can?: InputMaybe<Array<Scalars['String']['input']>>;
  entityType?: InputMaybe<Entitytyping>;
  icon?: InputMaybe<MenuIcons>;
  isLoggedIn?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  requiresAuth?: InputMaybe<Scalars['Boolean']['input']>;
  typeLink?: InputMaybe<MenuTypeLinkInput>;
};

export enum MenuIcons {
  Anpr = 'Anpr',
  ArchiveAlt = 'ArchiveAlt',
  Bell = 'Bell',
  BookOpen = 'BookOpen',
  BrightnessPlus = 'BrightnessPlus',
  Building = 'Building',
  Car = 'Car',
  Channel = 'Channel',
  ChannelAdd = 'ChannelAdd',
  CloudBookmark = 'CloudBookmark',
  CloudDataConnection = 'CloudDataConnection',
  Cog = 'Cog',
  Comments = 'Comments',
  Compass = 'Compass',
  Create = 'Create',
  Database = 'Database',
  Desktop = 'Desktop',
  Download = 'Download',
  Draggabledots = 'Draggabledots',
  ExclamationTriangle = 'ExclamationTriangle',
  FileInfoAlt = 'FileInfoAlt',
  Focus = 'Focus',
  FocusTarget = 'FocusTarget',
  Folder = 'Folder',
  FolderPlus = 'FolderPlus',
  Font = 'Font',
  Globe = 'Globe',
  GripHorizontalLine = 'GripHorizontalLine',
  Hdd = 'Hdd',
  History = 'History',
  Home = 'Home',
  Image = 'Image',
  InfoCircle = 'InfoCircle',
  Iot = 'Iot',
  KeyholeSquare = 'KeyholeSquare',
  Label = 'Label',
  ListUl = 'ListUl',
  LocationArrowAlt = 'LocationArrowAlt',
  LocationPoint = 'LocationPoint',
  MapMarker = 'MapMarker',
  MapMarkerInfo = 'MapMarkerInfo',
  MapPin = 'MapPin',
  Palette = 'Palette',
  Police = 'Police',
  Process = 'Process',
  Processor = 'Processor',
  Settings = 'Settings',
  Swatchbook = 'Swatchbook',
  Update = 'Update',
  Upload = 'Upload',
  UserSquare = 'UserSquare',
  UsersAlt = 'UsersAlt'
}

export type MenuItem = {
  __typename?: 'MenuItem';
  can?: Maybe<Array<Scalars['String']['output']>>;
  entityType?: Maybe<Entitytyping>;
  icon?: Maybe<MenuIcons>;
  isLoggedIn?: Maybe<Scalars['Boolean']['output']>;
  label: Scalars['String']['output'];
  requiresAuth?: Maybe<Scalars['Boolean']['output']>;
  subMenu?: Maybe<Menu>;
  typeLink?: Maybe<MenuTypeLink>;
};


export type MenuItemSubMenuArgs = {
  name: Scalars['String']['input'];
};

export type MenuTypeLink = {
  __typename?: 'MenuTypeLink';
  modal?: Maybe<MenuTypeLinkModal>;
  route?: Maybe<MenuTypeLinkRoute>;
};

export type MenuTypeLinkInput = {
  modal?: InputMaybe<MenuTypeLinkInputModal>;
  route?: InputMaybe<MenuTypeLinkInputRoute>;
};

export type MenuTypeLinkInputModal = {
  askForCloseConfirmation?: InputMaybe<Scalars['Boolean']['input']>;
  formQuery?: InputMaybe<Scalars['String']['input']>;
  neededPermission?: InputMaybe<Permission>;
  typeModal: TypeModals;
};

export type MenuTypeLinkInputRoute = {
  destination: Scalars['String']['input'];
};

export type MenuTypeLinkModal = {
  __typename?: 'MenuTypeLinkModal';
  askForCloseConfirmation?: Maybe<Scalars['Boolean']['output']>;
  formQuery?: Maybe<Scalars['String']['output']>;
  neededPermission?: Maybe<Permission>;
  typeModal: TypeModals;
};

export type MenuTypeLinkRoute = {
  __typename?: 'MenuTypeLinkRoute';
  destination: Scalars['String']['output'];
};

export type MenuWrapper = {
  __typename?: 'MenuWrapper';
  menu: Menu;
};

export type MergeEvaluation = {
  __typename?: 'MergeEvaluation';
  details?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['String']['output'];
  immutableFields: Array<MergeImmutableField>;
  score: Scalars['Int']['output'];
  status: MergeEvaluationStatus;
  strategy: MergeSurvivorStrategy;
};

export enum MergeEvaluationStatus {
  Invalid = 'invalid',
  Unknown = 'unknown',
  Valid = 'valid'
}

export type MergeImmutableField = {
  __typename?: 'MergeImmutableField';
  identityValue?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
};

export type MergePreview = {
  __typename?: 'MergePreview';
  inboundReferenceCount: Scalars['Int']['output'];
};

export enum MergeSurvivorStrategy {
  IdentifierIntegrity = 'identifierIntegrity'
}

export type MergeSurvivorSuggestionConfig = {
  __typename?: 'MergeSurvivorSuggestionConfig';
  autoSelect?: Maybe<Scalars['Boolean']['output']>;
  hiddenVerdicts?: Maybe<Array<MergeEvaluationStatus>>;
  requireRecommendedSurvivor?: Maybe<Scalars['Boolean']['output']>;
  strategy: MergeSurvivorStrategy;
};

export type MergeSurvivorSuggestionConfigInput = {
  autoSelect?: InputMaybe<Scalars['Boolean']['input']>;
  hiddenVerdicts?: InputMaybe<Array<MergeEvaluationStatus>>;
  requireRecommendedSurvivor?: InputMaybe<Scalars['Boolean']['input']>;
  strategy: MergeSurvivorStrategy;
};

export type Metadata = {
  __typename?: 'Metadata';
  immutable?: Maybe<Scalars['Boolean']['output']>;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  lang?: Maybe<Scalars['String']['output']>;
  unit?: Maybe<Unit>;
  value: Scalars['JSON']['output'];
};


export type MetadataUnitArgs = {
  input?: InputMaybe<Unit>;
};

export type MetadataAndRelation = Metadata | MetadataRelation;

export type MetadataField = {
  __typename?: 'MetadataField';
  active?: Maybe<Scalars['Boolean']['output']>;
  config_key?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<Maybe<MetadataFieldOption>>>;
  order?: Maybe<Scalars['Int']['output']>;
  type: InputFieldTypes;
};

export type MetadataFieldInput = {
  key: Scalars['String']['input'];
  lang?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type MetadataFieldOption = {
  __typename?: 'MetadataFieldOption';
  label?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export type MetadataFieldOptionInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

export type MetadataFormInput = {
  Metadata?: InputMaybe<Array<InputMaybe<MetadataFieldInput>>>;
  relations?: InputMaybe<Array<InputMaybe<RelationInput>>>;
};

export type MetadataInput = {
  immutable?: InputMaybe<Scalars['Boolean']['input']>;
  key: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  lang?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type MetadataOnRelationFieldConfig = {
  __typename?: 'MetadataOnRelationFieldConfig';
  enabled: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
};

export type MetadataRelation = {
  __typename?: 'MetadataRelation';
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  linkedEntity?: Maybe<Entity>;
  metadataOnRelation?: Maybe<Array<Maybe<KeyAndValue>>>;
  type?: Maybe<Scalars['String']['output']>;
  value: Scalars['JSON']['output'];
};

export type MetadataValuesInput = {
  key: Scalars['String']['input'];
  lang?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type MinMaxAmountOfRelationsValidation = {
  __typename?: 'MinMaxAmountOfRelationsValidation';
  max: Scalars['Int']['output'];
  min: Scalars['Int']['output'];
  relationType: Scalars['String']['output'];
};

export type MinMaxAmountOfRelationsValidationInput = {
  max: Scalars['Int']['input'];
  min: Scalars['Int']['input'];
  relationType: Scalars['String']['input'];
};

export type MinMaxInput = {
  isRelation?: InputMaybe<Scalars['Boolean']['input']>;
  max?: InputMaybe<Scalars['Int']['input']>;
  min?: InputMaybe<Scalars['Int']['input']>;
};

export enum ModalStyle {
  Center = 'center',
  CenterWide = 'centerWide',
  Left = 'left',
  Right = 'right',
  RightWide = 'rightWide'
}

export type MultiSelectInput = {
  AndOrValue?: InputMaybe<Scalars['Boolean']['input']>;
  value?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  CreateEntity?: Maybe<Entity>;
  addEntityRelations?: Maybe<Scalars['String']['output']>;
  bulkAddRelations?: Maybe<Scalars['String']['output']>;
  bulkDeleteEntities?: Maybe<Scalars['String']['output']>;
  bulkEditEntities: BulkEditResult;
  bulkUpdateEntitiesWithJson: BulkEditResult;
  deleteData?: Maybe<Scalars['String']['output']>;
  generateTranscode?: Maybe<Scalars['String']['output']>;
  getAssetsRelationedWithMediafFile?: Maybe<Array<Maybe<Entity>>>;
  getMediaRelationedWithMediafFile?: Maybe<Array<Maybe<Media>>>;
  linkMediafileToEntity?: Maybe<MediaFile>;
  mergeEntities?: Maybe<Entity>;
  mutateEntityValues?: Maybe<Entity>;
  patchMediaFileMetadata?: Maybe<MediaFile>;
  postStartImport?: Maybe<ImportReturn>;
  setPrimaryMediafile: Entity;
  setPrimaryThumbnail: Entity;
  updateMetadataWithCsv?: Maybe<Scalars['String']['output']>;
};


export type MutationCreateEntityArgs = {
  entity: EntityInput;
};


export type MutationAddEntityRelationsArgs = {
  collection: Collection;
  id: Scalars['String']['input'];
  relations: Array<BaseRelationValuesInput>;
};


export type MutationBulkAddRelationsArgs = {
  entityIds: Array<Scalars['String']['input']>;
  relationEntityId: Scalars['String']['input'];
  relationType: Scalars['String']['input'];
};


export type MutationBulkDeleteEntitiesArgs = {
  deleteEntities?: InputMaybe<DeleteEntitiesInput>;
  ids: Array<Scalars['String']['input']>;
  path: Collection;
  skipItemsWithRelationDuringBulkDelete?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationBulkEditEntitiesArgs = {
  collection?: InputMaybe<Collection>;
  ids: Array<Scalars['String']['input']>;
  metadata: Array<MetadataValuesInput>;
  relationTypesToClear?: InputMaybe<Array<Scalars['String']['input']>>;
  relationsToAdd: Array<BaseRelationValuesInput>;
  relationsToRemove: Array<BaseRelationValuesInput>;
  relationsToReplace: Array<BaseRelationValuesInput>;
};


export type MutationBulkUpdateEntitiesWithJsonArgs = {
  documents: Array<Scalars['JSON']['input']>;
};


export type MutationDeleteDataArgs = {
  deleteMediafiles: Scalars['Boolean']['input'];
  id: Scalars['String']['input'];
  path: Collection;
};


export type MutationGenerateTranscodeArgs = {
  masterEntityId?: InputMaybe<Scalars['String']['input']>;
  mediafileIds: Array<Scalars['String']['input']>;
  transcodeType: TranscodeType;
};


export type MutationGetAssetsRelationedWithMediafFileArgs = {
  mediaFileId: Scalars['String']['input'];
};


export type MutationGetMediaRelationedWithMediafFileArgs = {
  mediaFileId: Scalars['String']['input'];
};


export type MutationLinkMediafileToEntityArgs = {
  entityId: Scalars['String']['input'];
  mediaFileInput: MediaFileInput;
};


export type MutationMergeEntitiesArgs = {
  collection: Collection;
  formInput: EntityFormInput;
  survivorId: Scalars['String']['input'];
  victimId: Scalars['String']['input'];
};


export type MutationMutateEntityValuesArgs = {
  collection: Collection;
  formInput: EntityFormInput;
  id: Scalars['String']['input'];
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
};


export type MutationPatchMediaFileMetadataArgs = {
  MediaFileMetadata: Array<InputMaybe<MediaFileMetadataInput>>;
  MediafileId: Scalars['String']['input'];
};


export type MutationPostStartImportArgs = {
  folder: Scalars['String']['input'];
};


export type MutationSetPrimaryMediafileArgs = {
  entityId: Scalars['String']['input'];
  mediafileId: Scalars['String']['input'];
};


export type MutationSetPrimaryThumbnailArgs = {
  entityId: Scalars['String']['input'];
  mediafileId: Scalars['String']['input'];
};


export type MutationUpdateMetadataWithCsvArgs = {
  csv: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
};

export type Muziekweb = Entity & {
  __typename?: 'Muziekweb';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Nomen = Entity & {
  __typename?: 'Nomen';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum OcrType {
  Alto = 'alto',
  ManualUpload = 'manualUpload',
  Pdf = 'pdf',
  Txt = 'txt'
}

export type Omnibus = Entity & {
  __typename?: 'Omnibus';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum Operator {
  And = 'and',
  Or = 'or'
}

export enum Orientations {
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
  Top = 'top'
}

export type Orienting = Entity & {
  __typename?: 'Orienting';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum PageStatus {
  Forbidden = 'Forbidden',
  NotFound = 'NotFound',
  Success = 'Success',
  Unauthorized = 'Unauthorized'
}

export type PaginationInfo = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type PaginationLimitOptions = {
  __typename?: 'PaginationLimitOptions';
  options: Array<DropdownOption>;
};


export type PaginationLimitOptionsOptionsArgs = {
  input: Array<DropdownOptionInput>;
};

export type PanelHeaderContent = {
  __typename?: 'PanelHeaderContent';
  label: Scalars['String']['output'];
  libraryData?: Maybe<PanelLibraryData>;
  panelStatus?: Maybe<PanelStatus>;
};

export type PanelHeaderContentInput = {
  label: Scalars['String']['input'];
  libraryData?: InputMaybe<PanelLibraryDataInput>;
  panelStatus?: InputMaybe<PanelStatusInput>;
};

export type PanelInfo = {
  __typename?: 'PanelInfo';
  inputField: InputField;
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};


export type PanelInfoInputFieldArgs = {
  type: BaseFieldType;
};


export type PanelInfoLabelArgs = {
  input: Scalars['String']['input'];
};


export type PanelInfoValueArgs = {
  input: Scalars['String']['input'];
};

export type PanelLibraryData = {
  __typename?: 'PanelLibraryData';
  dataKey: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  queryName: Scalars['String']['output'];
};

export type PanelLibraryDataInput = {
  dataKey: Scalars['String']['input'];
  label?: InputMaybe<Scalars['String']['input']>;
  queryName: Scalars['String']['input'];
};

export type PanelLink = {
  __typename?: 'PanelLink';
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  linkIcon?: Maybe<DamsIcons>;
  linkText?: Maybe<Scalars['String']['output']>;
};


export type PanelLinkKeyArgs = {
  input: Scalars['String']['input'];
};


export type PanelLinkLabelArgs = {
  input: Scalars['String']['input'];
};


export type PanelLinkLinkIconArgs = {
  input: DamsIcons;
};


export type PanelLinkLinkTextArgs = {
  input: Scalars['String']['input'];
};

export type PanelMetaData = {
  __typename?: 'PanelMetaData';
  colSpan: Scalars['String']['output'];
  copyToClipboard?: Maybe<Scalars['Boolean']['output']>;
  copyValueFromParent: CopyValueFromParentIntialValues;
  customValue?: Maybe<Scalars['String']['output']>;
  defaultValue?: Maybe<Scalars['String']['output']>;
  disabled?: Maybe<Scalars['Boolean']['output']>;
  hiddenField?: Maybe<HiddenField>;
  highlightIfPrimaryMediafile?: Maybe<Scalars['Boolean']['output']>;
  highlightIfPrimaryThumbnail?: Maybe<Scalars['Boolean']['output']>;
  infoPanel?: Maybe<InfoPanel>;
  inputField: InputField;
  isMultilingual?: Maybe<Scalars['Boolean']['output']>;
  key: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  /** SHACL UI sh:languageIn: the order in which language-tagged values are preferred */
  languageIn?: Maybe<Array<Scalars['String']['output']>>;
  lineClamp: Scalars['String']['output'];
  linkText?: Maybe<Scalars['String']['output']>;
  lockedTooltip?: Maybe<Scalars['String']['output']>;
  masked?: Maybe<Scalars['Boolean']['output']>;
  nonEditableField?: Maybe<Scalars['Boolean']['output']>;
  onlyForEntityTypes?: Maybe<Array<Entitytyping>>;
  permitted?: Maybe<Scalars['Boolean']['output']>;
  readOnly?: Maybe<Scalars['Boolean']['output']>;
  repetitionConfig?: Maybe<RepetitionConfig>;
  revealQuery?: Maybe<Scalars['String']['output']>;
  showOnlyInEditMode?: Maybe<Scalars['Boolean']['output']>;
  tooltip: Scalars['String']['output'];
  unit: Unit;
  valueTooltip?: Maybe<PanelMetadataValueTooltip>;
  valueTranslationKey?: Maybe<Scalars['String']['output']>;
};


export type PanelMetaDataColSpanArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataCopyToClipboardArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataCopyValueFromParentArgs = {
  input: CopyValueFromParentIntialValuesInput;
};


export type PanelMetaDataCustomValueArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataDefaultValueArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataDisabledArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataHiddenFieldArgs = {
  input: HiddenFieldInput;
};


export type PanelMetaDataHighlightIfPrimaryMediafileArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataHighlightIfPrimaryThumbnailArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataInfoPanelArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataInputFieldArgs = {
  type: BaseFieldType;
};


export type PanelMetaDataIsMultilingualArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataKeyArgs = {
  input: Scalars['String']['input'];
};


export type PanelMetaDataLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataLanguageInArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type PanelMetaDataLineClampArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataLinkTextArgs = {
  input: Scalars['String']['input'];
};


export type PanelMetaDataLockedTooltipArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataMaskedArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataNonEditableFieldArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataOnlyForEntityTypesArgs = {
  input?: InputMaybe<Array<Entitytyping>>;
};


export type PanelMetaDataPermittedArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type PanelMetaDataReadOnlyArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type PanelMetaDataRepetitionConfigArgs = {
  repetitionKey?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataRevealQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelMetaDataShowOnlyInEditModeArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelMetaDataTooltipArgs = {
  input: Scalars['String']['input'];
};


export type PanelMetaDataUnitArgs = {
  input: Unit;
};


export type PanelMetaDataValueTooltipArgs = {
  input?: InputMaybe<PanelMetadataValueTooltipInput>;
};


export type PanelMetaDataValueTranslationKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type PanelMetadataValueTooltip = {
  __typename?: 'PanelMetadataValueTooltip';
  type: PanelMetadataValueTooltipTypes;
  value?: Maybe<Scalars['String']['output']>;
};

export type PanelMetadataValueTooltipInput = {
  type: PanelMetadataValueTooltipTypes;
};

export enum PanelMetadataValueTooltipTypes {
  Plane = 'plane',
  Preview = 'preview'
}

export type PanelRelation = {
  __typename?: 'PanelRelation';
  label?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type PanelRelationMetaData = {
  __typename?: 'PanelRelationMetaData';
  colSpan: Scalars['String']['output'];
  infoPanel?: Maybe<InfoPanel>;
  inputField: InputField;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  linkText?: Maybe<Scalars['String']['output']>;
  showOnlyInEditMode?: Maybe<Scalars['Boolean']['output']>;
  unit: Unit;
};


export type PanelRelationMetaDataColSpanArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelRelationMetaDataInfoPanelArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type PanelRelationMetaDataInputFieldArgs = {
  type: BaseFieldType;
};


export type PanelRelationMetaDataKeyArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationMetaDataLabelArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationMetaDataLinkTextArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationMetaDataShowOnlyInEditModeArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelRelationMetaDataUnitArgs = {
  input: Unit;
};

export type PanelRelationRootData = {
  __typename?: 'PanelRelationRootData';
  colSpan: Scalars['String']['output'];
  infoPanel?: Maybe<InfoPanel>;
  inputField: InputField;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  linkText?: Maybe<Scalars['String']['output']>;
  showOnlyInEditMode?: Maybe<Scalars['Boolean']['output']>;
  unit: Unit;
};


export type PanelRelationRootDataColSpanArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelRelationRootDataInfoPanelArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type PanelRelationRootDataInputFieldArgs = {
  type: BaseFieldType;
};


export type PanelRelationRootDataKeyArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationRootDataLabelArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationRootDataLinkTextArgs = {
  input: Scalars['String']['input'];
};


export type PanelRelationRootDataShowOnlyInEditModeArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PanelRelationRootDataUnitArgs = {
  input: Unit;
};

export type PanelStatus = {
  __typename?: 'PanelStatus';
  statusInputField: InputField;
  statusMetadataKey: Scalars['String']['output'];
};

export type PanelStatusInput = {
  statusInputFieldType: BaseFieldType;
  statusMetadataKey: Scalars['String']['input'];
};

export type PanelThumbnail = {
  __typename?: 'PanelThumbnail';
  customUrl?: Maybe<Scalars['String']['output']>;
  filename?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};


export type PanelThumbnailCustomUrlArgs = {
  input: Scalars['String']['input'];
};


export type PanelThumbnailFilenameArgs = {
  fromMediafile?: InputMaybe<Scalars['Boolean']['input']>;
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PanelThumbnailHeightArgs = {
  input: Scalars['Int']['input'];
};


export type PanelThumbnailKeyArgs = {
  input: Scalars['String']['input'];
};


export type PanelThumbnailWidthArgs = {
  input: Scalars['Int']['input'];
};

export enum PanelType {
  BulkData = 'bulkData',
  Map = 'map',
  Mediainfo = 'mediainfo',
  Metadata = 'metadata',
  Relation = 'relation'
}

export type ParentRelationsConfigInput = {
  entityType?: InputMaybe<Entitytyping>;
  key?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relationType?: InputMaybe<Scalars['String']['input']>;
};

export type Partner = Entity & {
  __typename?: 'Partner';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum Permission {
  Cancreate = 'cancreate',
  Candelete = 'candelete',
  Canread = 'canread',
  Canupdate = 'canupdate'
}

export type PermissionMapping = {
  __typename?: 'PermissionMapping';
  hasPermission: Scalars['Boolean']['output'];
  permission: Permission;
};

export type PermissionRequestInfo = {
  __typename?: 'PermissionRequestInfo';
  body: Scalars['JSON']['output'];
  crud: Scalars['String']['output'];
  datasource: Scalars['String']['output'];
  uri: Scalars['String']['output'];
};

export type PermissionResult = {
  __typename?: 'PermissionResult';
  hasPermission: Scalars['Boolean']['output'];
  permission: Scalars['String']['output'];
};

export type Person = Entity & {
  __typename?: 'Person';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type PillFormatter = {
  __typename?: 'PillFormatter';
  background: Scalars['String']['output'];
  icon?: Maybe<DamsIcons>;
  spin?: Maybe<Scalars['Boolean']['output']>;
  text: Scalars['String']['output'];
};

export type Place = Entity & {
  __typename?: 'Place';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Playing = Entity & {
  __typename?: 'Playing';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type PreviewComponent = {
  __typename?: 'PreviewComponent';
  listItemsCoverage: ListItemCoverageTypes;
  metadataPreviewQuery?: Maybe<Scalars['String']['output']>;
  openByDefault?: Maybe<Scalars['Boolean']['output']>;
  previewConfiguration?: Maybe<PreviewConfiguration>;
  previewQuery?: Maybe<Scalars['String']['output']>;
  showCurrentPreviewFlow?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type: PreviewTypes;
};


export type PreviewComponentListItemsCoverageArgs = {
  input: ListItemCoverageTypes;
};


export type PreviewComponentMetadataPreviewQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PreviewComponentOpenByDefaultArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PreviewComponentPreviewQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PreviewComponentShowCurrentPreviewFlowArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PreviewComponentTitleArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type PreviewComponentTypeArgs = {
  input: PreviewTypes;
};

export type PreviewConfiguration = {
  __typename?: 'PreviewConfiguration';
  displayOpenDetailPageButton?: Maybe<Scalars['Boolean']['output']>;
  keepLastActiveItemHighlighted?: Maybe<Scalars['Boolean']['output']>;
};


export type PreviewConfigurationDisplayOpenDetailPageButtonArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type PreviewConfigurationKeepLastActiveItemHighlightedArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum PreviewTypes {
  ColumnList = 'ColumnList',
  History = 'History',
  Map = 'Map',
  MediaViewer = 'MediaViewer'
}

export enum ProgressStepStatus {
  Complete = 'complete',
  Empty = 'empty',
  Failed = 'failed',
  Incomplete = 'incomplete',
  Loading = 'loading',
  Paused = 'paused'
}

export enum ProgressStepType {
  Prepare = 'prepare',
  Upload = 'upload',
  Validate = 'validate'
}

export type Publisher = Entity & {
  __typename?: 'Publisher';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  AdvancedPermission: Scalars['JSON']['output'];
  AdvancedPermissions: Array<PermissionResult>;
  BulkOperationCsvExportKeys: BulkOperationCsvExportKeys;
  BulkOperations: Entity;
  BulkOperationsRelationForm: WindowElement;
  CreateLabelForManifestation: Scalars['JSON']['output'];
  CustomBulkOperations: Entity;
  CustomFormattersSettings: Scalars['JSON']['output'];
  Directories?: Maybe<Array<Maybe<Directory>>>;
  DownloadItemsInZip?: Maybe<Entity>;
  DropzoneEntityToCreate: DropzoneEntityToCreate;
  Entities?: Maybe<EntitiesResults>;
  EntitiesByAdvancedSearch: EntitiesResults;
  EntitiesHistory?: Maybe<EntitiesResults>;
  Entity?: Maybe<Entity>;
  EntityTypeFilters: Entity;
  EntityTypeSortOptions: Entity;
  FetchMediafilesOfEntity: Array<Maybe<MediaFileEntity>>;
  FilterMatcherMapping: Array<FilterMatchers>;
  FilterOptions: Array<DropdownOption>;
  GenerateOcrWithAsset?: Maybe<Scalars['JSON']['output']>;
  GeoFilterForMap?: Maybe<AdvancedFilters>;
  GetDynamicForm: Form;
  GetEntityDetailContextMenuActions: ContextMenuActions;
  GetPrimaryMediafileFromEntity?: Maybe<Entity>;
  GetRepetitiveForm?: Maybe<RepetitiveForm>;
  GraphData: Scalars['JSON']['output'];
  Job?: Maybe<Job>;
  Jobs?: Maybe<JobsResults>;
  Menu?: Maybe<MenuWrapper>;
  PaginationLimitOptions: PaginationLimitOptions;
  PermissionMapping: Scalars['JSON']['output'];
  PermissionMappingCreate: Scalars['Boolean']['output'];
  PermissionMappingEntityDetail: Array<PermissionMapping>;
  PermissionMappingPerEntityType: Scalars['Boolean']['output'];
  PreviewComponents?: Maybe<Entity>;
  PreviewElement?: Maybe<ColumnList>;
  Tenants?: Maybe<EntitiesResults>;
  User?: Maybe<User>;
  UserPermissions?: Maybe<UserPermissions>;
  WemOverview?: Maybe<Array<Maybe<Entity>>>;
  WemiPipeline?: Maybe<EntitiesResults>;
  getElodyUser?: Maybe<Entity>;
  getMediafile?: Maybe<MediaFile>;
  jobStatusForEntity: JobPollResult;
  mergeEvaluations: Array<MergeEvaluation>;
  mergePreview: MergePreview;
};


export type QueryAdvancedPermissionArgs = {
  childEntityId?: InputMaybe<Scalars['String']['input']>;
  parentEntityId?: InputMaybe<Scalars['String']['input']>;
  permission: Scalars['String']['input'];
};


export type QueryAdvancedPermissionsArgs = {
  childEntityId?: InputMaybe<Scalars['String']['input']>;
  parentEntityId?: InputMaybe<Scalars['String']['input']>;
  permissions: Array<Scalars['String']['input']>;
};


export type QueryBulkOperationCsvExportKeysArgs = {
  entityType: Scalars['String']['input'];
};


export type QueryBulkOperationsArgs = {
  entityType: Scalars['String']['input'];
};


export type QueryCreateLabelForManifestationArgs = {
  id: Scalars['String']['input'];
};


export type QueryDirectoriesArgs = {
  dir?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDownloadItemsInZipArgs = {
  basicCsv: Scalars['Boolean']['input'];
  downloadEntity: EntityInput;
  entities: Array<InputMaybe<Scalars['String']['input']>>;
  includeAssetCsv: Scalars['Boolean']['input'];
  mediafiles: Array<InputMaybe<Scalars['String']['input']>>;
};


export type QueryEntitiesArgs = {
  advancedFilterInputs: Array<AdvancedFilterInput>;
  advancedSearchValue?: InputMaybe<Array<InputMaybe<FilterInput>>>;
  exactCount?: InputMaybe<Scalars['Boolean']['input']>;
  fetchPolicy?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  searchInputType?: InputMaybe<SearchInputType>;
  searchValue: SearchFilter;
  skip?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Entitytyping>;
};


export type QueryEntitiesByAdvancedSearchArgs = {
  facet_by: Scalars['String']['input'];
  filter_by: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  per_page: Scalars['Int']['input'];
  q: Scalars['String']['input'];
  query_by?: InputMaybe<Scalars['String']['input']>;
  query_by_weights: Scalars['String']['input'];
  sort_by: Scalars['String']['input'];
};


export type QueryEntitiesHistoryArgs = {
  advancedFilterInputs: Array<AdvancedFilterInput>;
  advancedSearchValue?: InputMaybe<Array<InputMaybe<FilterInput>>>;
  fetchPolicy?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  searchInputType?: InputMaybe<SearchInputType>;
  searchValue: SearchFilter;
  skip?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Entitytyping>;
};


export type QueryEntityArgs = {
  collection?: InputMaybe<Collection>;
  id: Scalars['String']['input'];
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};


export type QueryEntityTypeFiltersArgs = {
  type: Scalars['String']['input'];
};


export type QueryEntityTypeSortOptionsArgs = {
  entityType: Scalars['String']['input'];
};


export type QueryFetchMediafilesOfEntityArgs = {
  entityIds: Array<Scalars['String']['input']>;
};


export type QueryFilterMatcherMappingArgs = {
  keys?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryFilterOptionsArgs = {
  entityType: Scalars['String']['input'];
  input: Array<AdvancedFilterInput>;
  limit: Scalars['Int']['input'];
};


export type QueryGenerateOcrWithAssetArgs = {
  assetId: Scalars['String']['input'];
  language: Scalars['String']['input'];
  operation: Array<Scalars['String']['input']>;
};


export type QueryGetPrimaryMediafileFromEntityArgs = {
  entityId: Scalars['String']['input'];
};


export type QueryGraphDataArgs = {
  graph: GraphElementInput;
  id: Scalars['String']['input'];
};


export type QueryJobArgs = {
  failed: Scalars['Boolean']['input'];
  id: Scalars['String']['input'];
};


export type QueryJobsArgs = {
  failed: Scalars['Boolean']['input'];
  filters?: InputMaybe<Filters>;
  paginationInfo?: InputMaybe<PaginationInfo>;
};


export type QueryMenuArgs = {
  name: Scalars['String']['input'];
};


export type QueryPermissionMappingArgs = {
  entities: Array<InputMaybe<Scalars['String']['input']>>;
};


export type QueryPermissionMappingCreateArgs = {
  entityType: Scalars['String']['input'];
};


export type QueryPermissionMappingEntityDetailArgs = {
  entityType: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


export type QueryPermissionMappingPerEntityTypeArgs = {
  type: Scalars['String']['input'];
};


export type QueryPreviewComponentsArgs = {
  entityType: Scalars['String']['input'];
};


export type QueryWemOverviewArgs = {
  id: Scalars['String']['input'];
};


export type QueryWemiPipelineArgs = {
  advancedFilterInputs: Array<AdvancedFilterInput>;
  advancedSearchValue?: InputMaybe<Array<InputMaybe<FilterInput>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  searchInputType?: InputMaybe<SearchInputType>;
  searchValue: SearchFilter;
  skip?: InputMaybe<Scalars['Int']['input']>;
  type: Entitytyping;
};


export type QueryGetMediafileArgs = {
  mediafileId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryJobStatusForEntityArgs = {
  id: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type QueryMergeEvaluationsArgs = {
  collection: Collection;
  ids: Array<Scalars['String']['input']>;
  strategy: MergeSurvivorStrategy;
};


export type QueryMergePreviewArgs = {
  collection: Collection;
  id: Scalars['String']['input'];
};

export type Reading = Entity & {
  __typename?: 'Reading';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type RegexpMatchFormatter = {
  __typename?: 'RegexpMatchFormatter';
  value: Scalars['String']['output'];
};

export enum RelationActions {
  AddRelation = 'addRelation',
  RemoveRelation = 'removeRelation'
}

export enum RelationDirection {
  FromEntity = 'fromEntity',
  FromRelatedEntity = 'fromRelatedEntity'
}

export type RelationField = {
  __typename?: 'RelationField';
  acceptedEntityTypes: Array<Maybe<Scalars['String']['output']>>;
  disabled?: Maybe<Scalars['Boolean']['output']>;
  key: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Array<Maybe<MetadataField>>>;
  relationType: Scalars['String']['output'];
  viewMode?: Maybe<RelationFieldViewMode>;
};

export enum RelationFieldViewMode {
  Big = 'big',
  Small = 'small'
}

export type RelationLookupInput = {
  metadataKey: Scalars['String']['input'];
  relationType: Scalars['String']['input'];
};

export enum RelationType {
  Frames = 'frames',
  Stories = 'stories'
}

export type RepetitionConfig = {
  __typename?: 'RepetitionConfig';
  repetitionKey?: Maybe<Scalars['String']['output']>;
};

export type RepetitiveCreatableType = {
  __typename?: 'RepetitiveCreatableType';
  createForm: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type RepetitiveCreatableTypeInput = {
  createForm: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
  label: Scalars['String']['input'];
};

export type RepetitiveFinalize = {
  __typename?: 'RepetitiveFinalize';
  creatableTypes?: Maybe<Array<RepetitiveCreatableType>>;
  createForm: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  prefillMetadata?: Maybe<Array<RepetitiveMetadataPrefill>>;
  relations: Array<RepetitiveFinalizeRelation>;
};


export type RepetitiveFinalizeCreatableTypesArgs = {
  input?: InputMaybe<Array<RepetitiveCreatableTypeInput>>;
};


export type RepetitiveFinalizeCreateFormArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveFinalizeEntityTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveFinalizeLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type RepetitiveFinalizeRelation = {
  __typename?: 'RepetitiveFinalizeRelation';
  createWhen: RepetitiveRelationTrigger;
  relationType: Scalars['String']['output'];
  toAllOf: Scalars['String']['output'];
};


export type RepetitiveFinalizeRelationCreateWhenArgs = {
  input: RepetitiveRelationTrigger;
};


export type RepetitiveFinalizeRelationRelationTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveFinalizeRelationToAllOfArgs = {
  input: Scalars['String']['input'];
};

export type RepetitiveForm = {
  __typename?: 'RepetitiveForm';
  finalize?: Maybe<RepetitiveFinalize>;
  finalizeOnHost?: Maybe<RepetitiveHostFinalize>;
  label?: Maybe<Scalars['String']['output']>;
  linear?: Maybe<Scalars['Boolean']['output']>;
  refetchOnFinish?: Maybe<Scalars['Boolean']['output']>;
  repeatable: Scalars['Boolean']['output'];
  returnsSelection?: Maybe<Scalars['Boolean']['output']>;
  routeToRoute?: Maybe<Scalars['String']['output']>;
  routeToStep?: Maybe<Scalars['String']['output']>;
  startOnFirstStep?: Maybe<Scalars['Boolean']['output']>;
  steps: Array<RepetitiveStep>;
};


export type RepetitiveFormLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveFormLinearArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveFormRefetchOnFinishArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveFormRepeatableArgs = {
  input: Scalars['Boolean']['input'];
};


export type RepetitiveFormReturnsSelectionArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveFormRouteToRouteArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveFormRouteToStepArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveFormStartOnFirstStepArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RepetitiveHostFinalize = {
  __typename?: 'RepetitiveHostFinalize';
  fromStep: Scalars['String']['output'];
  relationType: Scalars['String']['output'];
  replaceExisting?: Maybe<Scalars['Boolean']['output']>;
};


export type RepetitiveHostFinalizeFromStepArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveHostFinalizeRelationTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveHostFinalizeReplaceExistingArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RepetitiveMetadataPrefill = {
  __typename?: 'RepetitiveMetadataPrefill';
  key: Scalars['String']['output'];
  value: Scalars['JSON']['output'];
};


export type RepetitiveMetadataPrefillKeyArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveMetadataPrefillValueArgs = {
  input: Scalars['JSON']['input'];
};

export type RepetitiveRelationMetadataField = {
  __typename?: 'RepetitiveRelationMetadataField';
  asArray?: Maybe<Scalars['Boolean']['output']>;
  formMetadataKey: Scalars['String']['output'];
  relationMetadataKey: Scalars['String']['output'];
};

export type RepetitiveRelationMetadataFieldInput = {
  asArray?: InputMaybe<Scalars['Boolean']['input']>;
  formMetadataKey: Scalars['String']['input'];
  relationMetadataKey: Scalars['String']['input'];
};

export enum RepetitiveRelationTrigger {
  Always = 'always',
  OnCreate = 'onCreate',
  OnFinalize = 'onFinalize',
  OnSelect = 'onSelect'
}

export type RepetitiveStep = {
  __typename?: 'RepetitiveStep';
  acceptedTypes?: Maybe<Array<Scalars['String']['output']>>;
  creatableTypeFromParentKey?: Maybe<Scalars['String']['output']>;
  creatableTypes?: Maybe<Array<RepetitiveCreatableType>>;
  createForm: Scalars['String']['output'];
  entityPickerSearchConfig?: Maybe<EntityPickerSearchConfig>;
  entityType: Scalars['String']['output'];
  key: Scalars['String']['output'];
  label?: Maybe<Scalars['String']['output']>;
  maxSelection?: Maybe<Scalars['Int']['output']>;
  metadataOnly?: Maybe<Scalars['Boolean']['output']>;
  overviewFields?: Maybe<Array<RepetitiveStepOverviewField>>;
  pickerFiltersCollapsed?: Maybe<Scalars['Boolean']['output']>;
  pickerFiltersQuery?: Maybe<Scalars['String']['output']>;
  pickerQuery?: Maybe<Scalars['String']['output']>;
  relations?: Maybe<Array<RepetitiveStepRelation>>;
  scopeToRelationOf?: Maybe<RepetitiveStepScope>;
  showBackButton?: Maybe<Scalars['Boolean']['output']>;
  skipSearchIfPriorIsNew?: Maybe<Scalars['Boolean']['output']>;
  terminalActionLabel?: Maybe<Scalars['String']['output']>;
};


export type RepetitiveStepAcceptedTypesArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type RepetitiveStepCreatableTypeFromParentKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveStepCreatableTypesArgs = {
  input?: InputMaybe<Array<RepetitiveCreatableTypeInput>>;
};


export type RepetitiveStepCreateFormArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepEntityPickerSearchConfigArgs = {
  input?: InputMaybe<EntityPickerSearchConfigInput>;
};


export type RepetitiveStepEntityTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepKeyArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveStepMaxSelectionArgs = {
  input?: InputMaybe<Scalars['Int']['input']>;
};


export type RepetitiveStepMetadataOnlyArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveStepOverviewFieldsArgs = {
  input?: InputMaybe<Array<RepetitiveStepOverviewFieldInput>>;
};


export type RepetitiveStepPickerFiltersCollapsedArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveStepPickerFiltersQueryArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveStepPickerQueryArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepShowBackButtonArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveStepSkipSearchIfPriorIsNewArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type RepetitiveStepTerminalActionLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};

export type RepetitiveStepOverviewField = {
  __typename?: 'RepetitiveStepOverviewField';
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type RepetitiveStepOverviewFieldInput = {
  key: Scalars['String']['input'];
  label: Scalars['String']['input'];
};

export type RepetitiveStepRelation = {
  __typename?: 'RepetitiveStepRelation';
  createWhen: RepetitiveRelationTrigger;
  metadataFields?: Maybe<Array<RepetitiveRelationMetadataField>>;
  relationType: Scalars['String']['output'];
  to: Scalars['String']['output'];
};


export type RepetitiveStepRelationCreateWhenArgs = {
  input: RepetitiveRelationTrigger;
};


export type RepetitiveStepRelationMetadataFieldsArgs = {
  input?: InputMaybe<Array<RepetitiveRelationMetadataFieldInput>>;
};


export type RepetitiveStepRelationRelationTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepRelationToArgs = {
  input: Scalars['String']['input'];
};

export type RepetitiveStepScope = {
  __typename?: 'RepetitiveStepScope';
  filterKey?: Maybe<Scalars['String']['output']>;
  relationType: Scalars['String']['output'];
  step: Scalars['String']['output'];
};


export type RepetitiveStepScopeFilterKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type RepetitiveStepScopeRelationTypeArgs = {
  input: Scalars['String']['input'];
};


export type RepetitiveStepScopeStepArgs = {
  input: Scalars['String']['input'];
};

export type RequiredOneOfMetadataValidation = {
  __typename?: 'RequiredOneOfMetadataValidation';
  amount: Scalars['Int']['output'];
  includedMetadataFields: Array<Scalars['String']['output']>;
};

export type RequiredOneOfMetadataValidationInput = {
  amount: Scalars['Int']['input'];
  includedMetadataFields: Array<Scalars['String']['input']>;
};

export type RequiredOneOfRelationValidation = {
  __typename?: 'RequiredOneOfRelationValidation';
  amount: Scalars['Int']['output'];
  relationTypes: Array<Scalars['String']['output']>;
};

export type RequiredOneOfRelationValidationInput = {
  amount: Scalars['Int']['input'];
  relationTypes: Array<Scalars['String']['input']>;
};

export type RequiredRelationValidation = {
  __typename?: 'RequiredRelationValidation';
  amount: Scalars['Int']['output'];
  exact?: Maybe<Scalars['Boolean']['output']>;
  relationType: Scalars['String']['output'];
};

export type RequiredRelationValidationInput = {
  amount: Scalars['Int']['input'];
  exact?: InputMaybe<Scalars['Boolean']['input']>;
  relationType: Scalars['String']['input'];
};

export type RouteMatching = {
  __typename?: 'RouteMatching';
  entityType?: Maybe<Entitytyping>;
  routeName?: Maybe<RouteNames>;
};

export type RouteMatchingInput = {
  entityType?: InputMaybe<Entitytyping>;
  routeName?: InputMaybe<RouteNames>;
};

export enum RouteNames {
  AccessDenied = 'AccessDenied',
  Awards = 'Awards',
  Boekenbank = 'Boekenbank',
  Cantook = 'Cantook',
  CodeWordings = 'CodeWordings',
  Contexts = 'Contexts',
  Corporations = 'Corporations',
  EasyReadings = 'EasyReadings',
  EmbeddedViewer = 'EmbeddedViewer',
  Expressions = 'Expressions',
  Genres = 'Genres',
  Groups = 'Groups',
  History = 'History',
  Home = 'Home',
  HomePage = 'HomePage',
  Jobs = 'Jobs',
  Languages = 'Languages',
  Libraries = 'Libraries',
  Listenings = 'Listenings',
  ManifestationComputerFiles = 'ManifestationComputerFiles',
  ManifestationFootages = 'ManifestationFootages',
  ManifestationMaps = 'ManifestationMaps',
  ManifestationMixedMaterials = 'ManifestationMixedMaterials',
  ManifestationMusics = 'ManifestationMusics',
  ManifestationSerials = 'ManifestationSerials',
  ManifestationWords = 'ManifestationWords',
  Manifestations = 'Manifestations',
  Muziekweb = 'Muziekweb',
  MyComments = 'MyComments',
  Nomens = 'Nomens',
  NotFound = 'NotFound',
  Omnibusses = 'Omnibusses',
  Orientings = 'Orientings',
  Partners = 'Partners',
  Persons = 'Persons',
  Places = 'Places',
  Playings = 'Playings',
  Publishers = 'Publishers',
  Readings = 'Readings',
  SingleEntity = 'SingleEntity',
  SingleMediafile = 'SingleMediafile',
  Sisos = 'Sisos',
  TaggedComments = 'TaggedComments',
  TargetAudiences = 'TargetAudiences',
  Times = 'Times',
  Titles = 'Titles',
  Tokens = 'Tokens',
  Unauthorized = 'Unauthorized',
  Users = 'Users',
  Watchings = 'Watchings',
  WorkComputerFiles = 'WorkComputerFiles',
  WorkFootages = 'WorkFootages',
  WorkMaps = 'WorkMaps',
  WorkMixedMaterials = 'WorkMixedMaterials',
  WorkMusics = 'WorkMusics',
  WorkSerials = 'WorkSerials',
  WorkWords = 'WorkWords',
  Works = 'Works',
  Zizos = 'Zizos'
}

export enum SanitizeMode {
  Html = 'html',
  Link = 'link'
}

export type SavedSearch = Entity & {
  __typename?: 'SavedSearch';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type SearchFilter = {
  isAsc?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  order_by?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export enum SearchInputType {
  AdvancedInputType = 'AdvancedInputType',
  AdvancedSavedSearchType = 'AdvancedSavedSearchType',
  SimpleInputtype = 'SimpleInputtype'
}

export type SelectionInput = {
  AndOrValue?: InputMaybe<Scalars['Boolean']['input']>;
  value?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type ShareLink = Entity & {
  __typename?: 'ShareLink';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type SingleMediaFileElement = {
  __typename?: 'SingleMediaFileElement';
  isCollapsed: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  metaData: PanelMetaData;
  type: Scalars['String']['output'];
};


export type SingleMediaFileElementIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type SingleMediaFileElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type SingleMediaFileElementTypeArgs = {
  input?: InputMaybe<MediaFileElementTypes>;
};

export type Siso = Entity & {
  __typename?: 'Siso';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum SkeletonComponentType {
  Button = 'Button',
  ButtonWithProgress = 'ButtonWithProgress',
  Checkbox = 'Checkbox',
  DisabledButton = 'DisabledButton',
  Dropdown = 'Dropdown',
  DropzoneBig = 'DropzoneBig',
  DropzoneInfo = 'DropzoneInfo',
  DropzoneMedium = 'DropzoneMedium',
  DropzoneSmall = 'DropzoneSmall',
  EntityPicker = 'EntityPicker',
  Input = 'Input',
  Progress = 'Progress',
  RelationDropdown = 'RelationDropdown',
  Subtitle = 'Subtitle',
  Textarea = 'Textarea',
  Title = 'Title',
  UploadCsvTemplates = 'UploadCsvTemplates',
  UploadInfoLink = 'UploadInfoLink'
}

export type SortOptions = {
  __typename?: 'SortOptions';
  isAsc?: Maybe<SortingDirection>;
  options: Array<DropdownOption>;
};


export type SortOptionsIsAscArgs = {
  input: SortingDirection;
};


export type SortOptionsOptionsArgs = {
  excludeBaseSortOptions?: InputMaybe<Scalars['Boolean']['input']>;
  input: Array<DropdownOptionInput>;
};

export enum SortingDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type SubField = {
  __typename?: 'SubField';
  entitySourceKey?: Maybe<Scalars['String']['output']>;
  hidden?: Maybe<Scalars['Boolean']['output']>;
  inputField?: Maybe<InputField>;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type SubJobResults = {
  __typename?: 'SubJobResults';
  count?: Maybe<Scalars['Int']['output']>;
  results?: Maybe<Array<Maybe<Job>>>;
};

export type TagConfigurationByEntity = {
  __typename?: 'TagConfigurationByEntity';
  colorMetadataKey: Scalars['String']['output'];
  configurationEntityRelationType: Scalars['String']['output'];
  configurationEntityType: Entitytyping;
  metadataKeysToSetAsAttribute?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  secondaryAttributeToDetermineTagConfig?: Maybe<Scalars['String']['output']>;
  tagMetadataKey: Scalars['String']['output'];
};

export type TagConfigurationByEntityInput = {
  colorMetadataKey: Scalars['String']['input'];
  configurationEntityRelationType: Scalars['String']['input'];
  configurationEntityType: Entitytyping;
  metadataKeysToSetAsAttribute?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  secondaryAttributeToDetermineTagConfig?: InputMaybe<Scalars['String']['input']>;
  tagMetadataKey: Scalars['String']['input'];
};

export type TaggableEntityConfiguration = {
  __typename?: 'TaggableEntityConfiguration';
  createNewEntityFormQuery?: Maybe<Scalars['String']['output']>;
  guidedFlowButtonLabel?: Maybe<Scalars['String']['output']>;
  guidedFlowQuery?: Maybe<Scalars['String']['output']>;
  inlineTrigger?: Maybe<InlineTrigger>;
  metadataFilterForTagContent?: Maybe<Scalars['String']['output']>;
  metadataKeysToSetAsAttribute?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  relationType: Scalars['String']['output'];
  replaceCharacterFromTagSettings?: Maybe<Array<Maybe<CharacterReplacementSettings>>>;
  tag?: Maybe<Scalars['String']['output']>;
  tagConfigurationByEntity?: Maybe<TagConfigurationByEntity>;
  taggableEntityType: Entitytyping;
};

export type TaggableEntityConfigurationInput = {
  createNewEntityFormQuery?: InputMaybe<Scalars['String']['input']>;
  guidedFlowButtonLabel?: InputMaybe<Scalars['String']['input']>;
  guidedFlowQuery?: InputMaybe<Scalars['String']['input']>;
  inlineTrigger?: InputMaybe<InlineTriggerInput>;
  metadataFilterForTagContent?: InputMaybe<Scalars['String']['input']>;
  metadataKeysToSetAsAttribute?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relationType: Scalars['String']['input'];
  replaceCharacterFromTagSettings?: InputMaybe<Array<InputMaybe<CharacterReplacementSettingsInput>>>;
  tag?: InputMaybe<Scalars['String']['input']>;
  tagConfigurationByEntity?: InputMaybe<TagConfigurationByEntityInput>;
  taggableEntityType: Entitytyping;
};

export type TaggingExtensionConfiguration = {
  __typename?: 'TaggingExtensionConfiguration';
  customQuery: Scalars['String']['output'];
  taggableEntityConfiguration: Array<TaggableEntityConfiguration>;
};


export type TaggingExtensionConfigurationCustomQueryArgs = {
  input: Scalars['String']['input'];
};


export type TaggingExtensionConfigurationTaggableEntityConfigurationArgs = {
  configuration: Array<TaggableEntityConfigurationInput>;
};

export type TargetAudience = Entity & {
  __typename?: 'TargetAudience';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Tenant = Entity & {
  __typename?: 'Tenant';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type TextInput = {
  value?: InputMaybe<Scalars['String']['input']>;
};

export type Time = Entity & {
  __typename?: 'Time';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum TimeUnit {
  DayOfWeek = 'dayOfWeek',
  DayOfYear = 'dayOfYear',
  Hour = 'hour',
  Month = 'month'
}

export type Title = Entity & {
  __typename?: 'Title';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Token = Entity & {
  __typename?: 'Token';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum TranscodeType {
  Pdf = 'pdf'
}

export type TransliterationConfigItem = {
  __typename?: 'TransliterationConfigItem';
  insertSpaces?: Maybe<Scalars['Boolean']['output']>;
  label: Scalars['String']['output'];
  mapping?: Maybe<Scalars['JSON']['output']>;
};

export enum TypeModals {
  BulkOperations = 'BulkOperations',
  BulkOperationsDeleteEntities = 'BulkOperationsDeleteEntities',
  BulkOperationsDeleteRelations = 'BulkOperationsDeleteRelations',
  BulkOperationsEdit = 'BulkOperationsEdit',
  BulkOperationsMerge = 'BulkOperationsMerge',
  CommentThread = 'CommentThread',
  Confirm = 'Confirm',
  Delete = 'Delete',
  DynamicForm = 'DynamicForm',
  ElodyEntityTaggingModal = 'ElodyEntityTaggingModal',
  EntityDetailModal = 'EntityDetailModal',
  EntityEditModal = 'EntityEditModal',
  GuidedFlow = 'GuidedFlow',
  IiifOperationsModal = 'IiifOperationsModal',
  SaveSearch = 'SaveSearch',
  SaveSearchPicker = 'SaveSearchPicker',
  Search = 'Search',
  SearchAi = 'SearchAi'
}

export enum Unit {
  CoordinatesDefault = 'COORDINATES_DEFAULT',
  DatetimeDefault = 'DATETIME_DEFAULT',
  DatetimeDmy12 = 'DATETIME_DMY12',
  DatetimeDmy24 = 'DATETIME_DMY24',
  DatetimeMdy12 = 'DATETIME_MDY12',
  DatetimeMdy24 = 'DATETIME_MDY24',
  DateDefault = 'DATE_DEFAULT',
  Html = 'HTML',
  Image = 'IMAGE',
  ListDefault = 'LIST_DEFAULT',
  Percent = 'PERCENT',
  Px = 'PX',
  SecondsDefault = 'SECONDS_DEFAULT',
  Volt = 'VOLT'
}

export type UploadContainer = {
  __typename?: 'UploadContainer';
  uploadField: UploadField;
  uploadFlow: UploadFlow;
  uploadMetadata?: Maybe<PanelMetaData>;
};


export type UploadContainerUploadFlowArgs = {
  input: UploadFlow;
};

export enum UploadEntityTypes {
  Mediafile = 'mediafile'
}

export type UploadField = {
  __typename?: 'UploadField';
  addTypeToEndpoint?: Maybe<Scalars['Boolean']['output']>;
  dryRunUpload?: Maybe<Scalars['Boolean']['output']>;
  extraMediafileType?: Maybe<Scalars['String']['output']>;
  extractTypeFromKey?: Maybe<Scalars['String']['output']>;
  infoLabelUrl?: Maybe<Scalars['String']['output']>;
  inputField: InputField;
  label: Scalars['String']['output'];
  templateCsvs?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  uploadFieldSize: UploadFieldSize;
  uploadFieldType: UploadFieldType;
};


export type UploadFieldAddTypeToEndpointArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type UploadFieldDryRunUploadArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type UploadFieldExtraMediafileTypeArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type UploadFieldExtractTypeFromKeyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type UploadFieldInfoLabelUrlArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type UploadFieldInputFieldArgs = {
  type: BaseFieldType;
};


export type UploadFieldLabelArgs = {
  input: Scalars['String']['input'];
};


export type UploadFieldTemplateCsvsArgs = {
  input: Array<Scalars['String']['input']>;
};


export type UploadFieldUploadFieldSizeArgs = {
  input?: InputMaybe<UploadFieldSize>;
};


export type UploadFieldUploadFieldTypeArgs = {
  input: UploadFieldType;
};

export enum UploadFieldSize {
  Big = 'big',
  Normal = 'normal',
  Small = 'small'
}

export enum UploadFieldType {
  Batch = 'batch',
  EditMetadataWithCsv = 'editMetadataWithCsv',
  ReorderEntities = 'reorderEntities',
  Single = 'single'
}

export enum UploadFlow {
  CsvOnly = 'csvOnly',
  Excel = 'excel',
  MediafilesOnly = 'mediafilesOnly',
  MediafilesWithOcr = 'mediafilesWithOcr',
  MediafilesWithOptionalCsv = 'mediafilesWithOptionalCsv',
  MediafilesWithRequiredCsv = 'mediafilesWithRequiredCsv',
  OptionalMediafiles = 'optionalMediafiles',
  UpdateMetadata = 'updateMetadata',
  UploadCsvForReordening = 'uploadCsvForReordening',
  XmlMarc = 'xmlMarc'
}

export type User = Entity & {
  __typename?: 'User';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  email: Scalars['String']['output'];
  entityView: ColumnList;
  family_name: Scalars['String']['output'];
  given_name: Scalars['String']['output'];
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  mapElement?: Maybe<MapElement>;
  name: Scalars['String']['output'];
  preferred_username: Scalars['String']['output'];
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export enum UserContextRoles {
  CreateDamsObjects = 'create_dams_objects',
  DeleteDamsObjects = 'delete_dams_objects',
  EditDamsObjects = 'edit_dams_objects',
  ManageContexts = 'manage_contexts',
  ViewDamsObjects = 'view_dams_objects'
}

export type Validation = {
  __typename?: 'Validation';
  available_if?: Maybe<Conditional>;
  customValue?: Maybe<Scalars['String']['output']>;
  fastValidationMessage?: Maybe<Scalars['String']['output']>;
  has_min_max_amount_of_relations?: Maybe<MinMaxAmountOfRelationsValidation>;
  has_one_of_required_metadata?: Maybe<RequiredOneOfMetadataValidation>;
  has_one_of_required_relations?: Maybe<RequiredOneOfRelationValidation>;
  has_required_relation?: Maybe<RequiredRelationValidation>;
  regex?: Maybe<Scalars['String']['output']>;
  required_if?: Maybe<Conditional>;
  rules?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Array<Maybe<ValidationRules>>>;
};

export enum ValidationFields {
  IntialValues = 'intialValues',
  RelatedEntityData = 'relatedEntityData',
  RelationMetadata = 'relationMetadata',
  RelationRootdata = 'relationRootdata',
  RelationValues = 'relationValues',
  Relations = 'relations'
}

export type ValidationInput = {
  available_if?: InputMaybe<ConditionalInput>;
  customValue?: InputMaybe<Scalars['String']['input']>;
  fastValidationMessage?: InputMaybe<Scalars['String']['input']>;
  has_min_max_amount_of_relations?: InputMaybe<MinMaxAmountOfRelationsValidationInput>;
  has_one_of_required_metadata?: InputMaybe<RequiredOneOfMetadataValidationInput>;
  has_one_of_required_relations?: InputMaybe<RequiredOneOfRelationValidationInput>;
  has_required_relation?: InputMaybe<RequiredRelationValidationInput>;
  regex?: InputMaybe<Scalars['String']['input']>;
  required_if?: InputMaybe<ConditionalInput>;
  rules?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Array<InputMaybe<ValidationRules>>>;
};

export enum ValidationRules {
  Alpha = 'alpha',
  AlphaDash = 'alpha_dash',
  AlphaNum = 'alpha_num',
  AlphaSpaces = 'alpha_spaces',
  CustomValue = 'customValue',
  Email = 'email',
  ExistingDate = 'existing_date',
  HasMinMaxAmountOfRelations = 'has_min_max_amount_of_relations',
  HasOneOfRequiredMetadata = 'has_one_of_required_metadata',
  HasOneOfRequiredRelations = 'has_one_of_required_relations',
  HasRequiredRelation = 'has_required_relation',
  MaxDateToday = 'max_date_today',
  NoXss = 'no_xss',
  Numeric = 'numeric',
  Regex = 'regex',
  Required = 'required',
  Url = 'url'
}

export type ValueMapping = {
  __typename?: 'ValueMapping';
  mapping?: Maybe<Scalars['JSON']['output']>;
  value?: Maybe<Scalars['JSON']['output']>;
};

export type ValueMappingInput = {
  mapping?: InputMaybe<Scalars['JSON']['input']>;
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export enum ViewModes {
  Table = 'Table',
  ViewModesGrid = 'ViewModesGrid',
  ViewModesList = 'ViewModesList',
  ViewModesMap = 'ViewModesMap',
  /** @deprecated We use the new mediaviewer integrated in previews */
  ViewModesMedia = 'ViewModesMedia',
  ViewModesPipeline = 'ViewModesPipeline'
}

export type ViewModesWithConfig = {
  __typename?: 'ViewModesWithConfig';
  config?: Maybe<Array<Maybe<ConfigItem>>>;
  viewMode?: Maybe<ViewModes>;
};

export type ViewModesWithConfigInput = {
  config?: InputMaybe<Array<InputMaybe<ConfigItemInput>>>;
  viewMode?: InputMaybe<ViewModes>;
};

export type VirtualKeyboardConfig = {
  __typename?: 'VirtualKeyboardConfig';
  layouts?: Maybe<Scalars['JSON']['output']>;
};

export type VirtualKeyboardConfigInput = {
  layouts?: InputMaybe<Scalars['JSON']['input']>;
};

export enum VisibilityLevels {
  NotPublic = 'not_public',
  Private = 'private',
  Public = 'public'
}

export type VisibleIf = {
  __typename?: 'VisibleIf';
  dependsOn: Scalars['String']['output'];
  values: Array<Scalars['String']['output']>;
};

export type VisibleIfInput = {
  dependsOn: Scalars['String']['input'];
  values: Array<Scalars['String']['input']>;
};

export type Watching = Entity & {
  __typename?: 'Watching';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WindowElement = {
  __typename?: 'WindowElement';
  contextMenuActions?: Maybe<ContextMenuActions>;
  editMetadataButton?: Maybe<EditMetadataButton>;
  expandButtonOptions?: Maybe<ExpandButtonOptions>;
  label: Scalars['String']['output'];
  layout?: Maybe<WindowElementLayout>;
  lineClamp: Scalars['String']['output'];
  panels?: Maybe<WindowElementPanel>;
  windowElementStatus?: Maybe<WindowElementStatus>;
};


export type WindowElementEditMetadataButtonArgs = {
  input: EditMetadataButtonInput;
};


export type WindowElementLabelArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WindowElementLayoutArgs = {
  input?: InputMaybe<WindowElementLayout>;
};


export type WindowElementLineClampArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WindowElementWindowElementStatusArgs = {
  windowElementStatusInput?: InputMaybe<WindowElementStatusInput>;
};

export type WindowElementBulkDataPanel = {
  __typename?: 'WindowElementBulkDataPanel';
  intialValueKey: Scalars['String']['output'];
  label: Scalars['String']['output'];
};


export type WindowElementBulkDataPanelIntialValueKeyArgs = {
  input: Scalars['String']['input'];
};


export type WindowElementBulkDataPanelLabelArgs = {
  input: Scalars['String']['input'];
};

export enum WindowElementLayout {
  HorizontalGrid = 'HorizontalGrid',
  Vertical = 'Vertical'
}

export type WindowElementPanel = {
  __typename?: 'WindowElementPanel';
  bulkData?: Maybe<Scalars['JSON']['output']>;
  can?: Maybe<Scalars['String']['output']>;
  canBeMultipleColumns: Scalars['Boolean']['output'];
  displayCondition?: Maybe<DisplayCondition>;
  entityListElement?: Maybe<EntityListElement>;
  info: PanelInfo;
  isCollapsed: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  metaData: PanelMetaData;
  panelHeaderContent?: Maybe<PanelHeaderContent>;
  panelType: PanelType;
  relation?: Maybe<Array<Maybe<PanelRelation>>>;
  repetitionConfig?: Maybe<RepetitionConfig>;
  wysiwygElement?: Maybe<WysiwygElement>;
};


export type WindowElementPanelBulkDataArgs = {
  bulkDataSource: Scalars['String']['input'];
};


export type WindowElementPanelCanArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WindowElementPanelCanBeMultipleColumnsArgs = {
  input: Scalars['Boolean']['input'];
};


export type WindowElementPanelIsCollapsedArgs = {
  input: Scalars['Boolean']['input'];
};


export type WindowElementPanelIsEditableArgs = {
  input: Scalars['Boolean']['input'];
};


export type WindowElementPanelPanelHeaderContentArgs = {
  panelHeaderContentInput?: InputMaybe<PanelHeaderContentInput>;
};


export type WindowElementPanelPanelTypeArgs = {
  input: PanelType;
};


export type WindowElementPanelRepetitionConfigArgs = {
  repetitionKey?: InputMaybe<Scalars['String']['input']>;
};

export type WindowElementStatus = {
  __typename?: 'WindowElementStatus';
  label?: Maybe<Scalars['String']['output']>;
  statusInputField: InputField;
  statusMetadataKey: Scalars['String']['output'];
};

export type WindowElementStatusInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  statusInputFieldType: BaseFieldType;
  statusMetadataKey: Scalars['String']['input'];
};

export type Work = Entity & {
  __typename?: 'Work';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkComputerFile = Entity & {
  __typename?: 'WorkComputerFile';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkFootage = Entity & {
  __typename?: 'WorkFootage';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkMap = Entity & {
  __typename?: 'WorkMap';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkMixedMaterial = Entity & {
  __typename?: 'WorkMixedMaterial';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkMusic = Entity & {
  __typename?: 'WorkMusic';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkSerial = Entity & {
  __typename?: 'WorkSerial';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WorkWord = Entity & {
  __typename?: 'WorkWord';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type WysiwygElement = {
  __typename?: 'WysiwygElement';
  extensions: Array<Maybe<WysiwygExtensions>>;
  infoPanel?: Maybe<InfoPanel>;
  isMultilingual?: Maybe<Scalars['Boolean']['output']>;
  label: Scalars['String']['output'];
  lockedTooltip?: Maybe<Scalars['String']['output']>;
  metadataKey: Scalars['String']['output'];
  taggingConfiguration?: Maybe<TaggingExtensionConfiguration>;
  wysiwygElementConfiguration?: Maybe<WysiwygElementConfiguration>;
};


export type WysiwygElementExtensionsArgs = {
  input: Array<InputMaybe<WysiwygExtensions>>;
};


export type WysiwygElementInfoPanelArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type WysiwygElementIsMultilingualArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type WysiwygElementLabelArgs = {
  input: Scalars['String']['input'];
};


export type WysiwygElementLockedTooltipArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WysiwygElementMetadataKeyArgs = {
  input: Scalars['String']['input'];
};

export type WysiwygElementConfiguration = {
  __typename?: 'WysiwygElementConfiguration';
  customEditorStyles?: Maybe<Scalars['String']['output']>;
  showLineNumbers?: Maybe<Scalars['Boolean']['output']>;
  transliterationConfig?: Maybe<WysiwygTransliterationConfig>;
  virtualKeyboardLayouts?: Maybe<Scalars['JSON']['output']>;
};


export type WysiwygElementConfigurationCustomEditorStylesArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WysiwygElementConfigurationShowLineNumbersArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};


export type WysiwygElementConfigurationVirtualKeyboardLayoutsArgs = {
  input?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum WysiwygExtensions {
  Bold = 'bold',
  Color = 'color',
  Doc = 'doc',
  ElodyTaggingExtension = 'elodyTaggingExtension',
  HardBreak = 'hardBreak',
  Italic = 'italic',
  ListItem = 'listItem',
  Paragraph = 'paragraph',
  StarterKit = 'starterKit',
  Text = 'text',
  TextStyle = 'textStyle'
}

export type WysiwygTransliterationConfig = {
  __typename?: 'WysiwygTransliterationConfig';
  enabledByProperty?: Maybe<Scalars['String']['output']>;
  transliterationConfigItem?: Maybe<TransliterationConfigItem>;
};


export type WysiwygTransliterationConfigEnabledByPropertyArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type WysiwygTransliterationConfigTransliterationConfigItemArgs = {
  insertSpaces?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  mappingKey: Scalars['String']['input'];
};

export type Zizo = Entity & {
  __typename?: 'Zizo';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoDeelrubriek = Entity & {
  __typename?: 'ZizoDeelrubriek';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoDomein = Entity & {
  __typename?: 'ZizoDomein';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoGroeirubriek = Entity & {
  __typename?: 'ZizoGroeirubriek';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoHoofdrubriek = Entity & {
  __typename?: 'ZizoHoofdrubriek';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoKast = Entity & {
  __typename?: 'ZizoKast';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoPlank = Entity & {
  __typename?: 'ZizoPlank';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ZizoRug = Entity & {
  __typename?: 'ZizoRug';
  advancedFilters?: Maybe<AdvancedFilters>;
  allowedViewModes?: Maybe<AllowedViewModes>;
  bulkOperationOptions?: Maybe<BulkOperationOptions>;
  deleteQueryOptions?: Maybe<DeleteQueryOptions>;
  entityView: ColumnList;
  id: Scalars['String']['output'];
  intialValues: IntialValues;
  previewComponent?: Maybe<PreviewComponent>;
  relationValues?: Maybe<Scalars['JSON']['output']>;
  sortOptions?: Maybe<SortOptions>;
  teaserMetadata?: Maybe<TeaserMetadata>;
  type: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type RelationInput = {
  label?: InputMaybe<Scalars['String']['input']>;
  linkedEntityId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Array<InputMaybe<MetadataFieldInput>>>;
  relationType: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type TeaserMetadata = {
  __typename?: 'teaserMetadata';
  buttons?: Maybe<Buttons>;
  forceShowContextMenuActions?: Maybe<Scalars['Boolean']['output']>;
  link?: Maybe<PanelLink>;
  metaData?: Maybe<PanelMetaData>;
  relationMetaData?: Maybe<PanelRelationMetaData>;
  relationRootData?: Maybe<PanelRelationRootData>;
  thumbnail?: Maybe<PanelThumbnail>;
};


export type TeaserMetadataForceShowContextMenuActionsArgs = {
  input?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TeaserMetadataOptions = {
  key?: InputMaybe<Scalars['String']['input']>;
  unit?: InputMaybe<Unit>;
};

export type UserPermissions = {
  __typename?: 'userPermissions';
  payload?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
  Formatters:
    | ( LinkFormatter )
    | ( PillFormatter )
    | ( RegexpMatchFormatter )
  ;
  MetadataAndRelation:
    | ( Metadata )
    | ( Omit<MetadataRelation, 'linkedEntity'> & { linkedEntity?: Maybe<_RefType['Entity']> } )
  ;
};

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  Entity:
    | ( Omit<Award, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<BaseEntity, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Boekenbank, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Cantook, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<CodeWording, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Comment, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Context, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Corporation, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Download, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<EasyReading, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Expression, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Genre, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Group, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Home, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Job, 'entityView' | 'sub_jobs'> & { entityView: _RefType['ColumnList'], sub_jobs?: Maybe<_RefType['SubJobResults']> } )
    | ( Omit<Language, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Listening, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Manifestation, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationComputerFile, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationFootage, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationMap, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationMixedMaterial, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationMusic, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationSerial, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ManifestationWord, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Media, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<MediaFileEntity, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Muziekweb, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Nomen, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Omnibus, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Orienting, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Partner, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Person, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Place, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Playing, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Publisher, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Reading, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<SavedSearch, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ShareLink, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Siso, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<TargetAudience, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Tenant, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Time, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Title, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Token, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<User, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Watching, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Work, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkComputerFile, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkFootage, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkMap, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkMixedMaterial, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkMusic, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkSerial, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<WorkWord, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<Zizo, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoDeelrubriek, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoDomein, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoGroeirubriek, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoHoofdrubriek, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoKast, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoPlank, 'entityView'> & { entityView: _RefType['ColumnList'] } )
    | ( Omit<ZizoRug, 'entityView'> & { entityView: _RefType['ColumnList'] } )
  ;
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActionButton: ResolverTypeWrapper<ActionButton>;
  ActionButtonResult: ActionButtonResult;
  ActionContext: ResolverTypeWrapper<ActionContext>;
  ActionContextEntitiesSelectionType: ActionContextEntitiesSelectionType;
  ActionContextInput: ActionContextInput;
  ActionContextViewModeTypes: ActionContextViewModeTypes;
  ActionElement: ResolverTypeWrapper<ActionElement>;
  ActionProgress: ResolverTypeWrapper<ActionProgress>;
  ActionProgressIndicatorType: ActionProgressIndicatorType;
  ActionProgressStep: ResolverTypeWrapper<ActionProgressStep>;
  ActionType: ActionType;
  Actions: Actions;
  ActionsOnResult: ResolverTypeWrapper<ActionsOnResult>;
  ActionsOnResultTypes: ActionsOnResultTypes;
  AdvancedFilter: ResolverTypeWrapper<AdvancedFilter>;
  AdvancedFilterInput: AdvancedFilterInput;
  AdvancedFilterInputType: ResolverTypeWrapper<AdvancedFilterInputType>;
  AdvancedFilterLimitConfigInput: AdvancedFilterLimitConfigInput;
  AdvancedFilterLimitConfigType: ResolverTypeWrapper<AdvancedFilterLimitConfigType>;
  AdvancedFilterMatchersType: AdvancedFilterMatchersType;
  AdvancedFilterTypes: AdvancedFilterTypes;
  AdvancedFilters: ResolverTypeWrapper<AdvancedFilters>;
  AdvancedInputType: AdvancedInputType;
  AdvancedSearchInput: AdvancedSearchInput;
  AllowedViewModes: ResolverTypeWrapper<AllowedViewModes>;
  AutocompleteSelectionOptions: AutocompleteSelectionOptions;
  Award: ResolverTypeWrapper<Omit<Award, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  BaseEntity: ResolverTypeWrapper<Omit<BaseEntity, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  BaseFieldType: BaseFieldType;
  BaseLibraryModes: BaseLibraryModes;
  BaseRelationValuesInput: BaseRelationValuesInput;
  Boekenbank: ResolverTypeWrapper<Omit<Boekenbank, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BreadCrumbRoute: ResolverTypeWrapper<BreadCrumbRoute>;
  BreadCrumbRouteInput: BreadCrumbRouteInput;
  BulkEditModes: BulkEditModes;
  BulkEditResult: ResolverTypeWrapper<BulkEditResult>;
  BulkNavigationPages: BulkNavigationPages;
  BulkOperationCsvExportKeys: ResolverTypeWrapper<BulkOperationCsvExportKeys>;
  BulkOperationInputModal: BulkOperationInputModal;
  BulkOperationModal: ResolverTypeWrapper<BulkOperationModal>;
  BulkOperationOptions: ResolverTypeWrapper<BulkOperationOptions>;
  BulkOperationTypes: BulkOperationTypes;
  BulkOperations: ResolverTypeWrapper<BulkOperations>;
  Buttons: ResolverTypeWrapper<Buttons>;
  Cantook: ResolverTypeWrapper<Omit<Cantook, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  CharacterReplacementSettings: ResolverTypeWrapper<CharacterReplacementSettings>;
  CharacterReplacementSettingsInput: CharacterReplacementSettingsInput;
  CodeWording: ResolverTypeWrapper<Omit<CodeWording, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Collection: Collection;
  Column: ResolverTypeWrapper<Omit<Column, 'elements'> & { elements: ResolversTypes['EntityViewElements'] }>;
  ColumnList: ResolverTypeWrapper<Omit<ColumnList, 'column'> & { column: ResolversTypes['Column'] }>;
  ColumnSizes: ColumnSizes;
  Comment: ResolverTypeWrapper<Omit<Comment, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  CommentCreateFields: ResolverTypeWrapper<CommentCreateFields>;
  CommentsElement: ResolverTypeWrapper<CommentsElement>;
  Conditional: ResolverTypeWrapper<Conditional>;
  ConditionalInput: ConditionalInput;
  ConfigItem: ResolverTypeWrapper<ConfigItem>;
  ConfigItemInput: ConfigItemInput;
  Context: ResolverTypeWrapper<Omit<Context, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ContextMenuActions: ResolverTypeWrapper<ContextMenuActions>;
  ContextMenuCustomAction: ResolverTypeWrapper<ContextMenuCustomAction>;
  ContextMenuDirection: ContextMenuDirection;
  ContextMenuDownloadZipOfRelatedMediafilesAction: ResolverTypeWrapper<ContextMenuDownloadZipOfRelatedMediafilesAction>;
  ContextMenuElodyAction: ResolverTypeWrapper<ContextMenuElodyAction>;
  ContextMenuElodyActionEnum: ContextMenuElodyActionEnum;
  ContextMenuFormFlow: ContextMenuFormFlow;
  ContextMenuGeneralAction: ResolverTypeWrapper<ContextMenuGeneralAction>;
  ContextMenuGeneralActionEnum: ContextMenuGeneralActionEnum;
  ContextMenuLinkAction: ResolverTypeWrapper<ContextMenuLinkAction>;
  ContextMenuQueryAction: ResolverTypeWrapper<ContextMenuQueryAction>;
  CopyFromParentConfig: ResolverTypeWrapper<CopyFromParentConfig>;
  CopyFromParentConfigInput: CopyFromParentConfigInput;
  CopyFromParentKeyMap: ResolverTypeWrapper<CopyFromParentKeyMap>;
  CopyFromParentKeyMapInput: CopyFromParentKeyMapInput;
  CopyValueFromParentIntialValues: ResolverTypeWrapper<CopyValueFromParentIntialValues>;
  CopyValueFromParentIntialValuesInput: CopyValueFromParentIntialValuesInput;
  Corporation: ResolverTypeWrapper<Omit<Corporation, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  CreateableEntityTypes: CreateableEntityTypes;
  CustomFormatterTypes: CustomFormatterTypes;
  DamsIcons: DamsIcons;
  DeepRelationsFetchStrategy: DeepRelationsFetchStrategy;
  DeleteEntitiesInput: DeleteEntitiesInput;
  DeleteQueryOptions: ResolverTypeWrapper<DeleteQueryOptions>;
  Directory: ResolverTypeWrapper<Directory>;
  DisplayCondition: ResolverTypeWrapper<DisplayCondition>;
  Download: ResolverTypeWrapper<Omit<Download, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  DropdownOption: ResolverTypeWrapper<DropdownOption>;
  DropdownOptionInput: DropdownOptionInput;
  DropzoneEntityToCreate: ResolverTypeWrapper<DropzoneEntityToCreate>;
  EasyReading: ResolverTypeWrapper<Omit<EasyReading, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  EditMetadataButton: ResolverTypeWrapper<EditMetadataButton>;
  EditMetadataButtonInput: EditMetadataButtonInput;
  EditStatus: EditStatus;
  ElodyServices: ElodyServices;
  ElodyViewers: ElodyViewers;
  EndpointInformation: ResolverTypeWrapper<EndpointInformation>;
  EndpointInformationInput: EndpointInformationInput;
  EndpointResponseActions: EndpointResponseActions;
  EntitiesResults: ResolverTypeWrapper<Omit<EntitiesResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversTypes['Entity']>>> }>;
  Entity: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Entity']>;
  EntityButtonConfig: ResolverTypeWrapper<EntityButtonConfig>;
  EntityButtonStyle: ResolverTypeWrapper<EntityButtonStyle>;
  EntityFormInput: EntityFormInput;
  EntityInput: EntityInput;
  EntityListElement: ResolverTypeWrapper<Omit<EntityListElement, 'actionsOnResult' | 'entityList' | 'entityListElement'> & { actionsOnResult?: Maybe<ResolversTypes['ActionsOnResult']>, entityList?: Maybe<Array<Maybe<ResolversTypes['Entity']>>>, entityListElement?: Maybe<ResolversTypes['EntityListElement']> }>;
  EntityListViewMode: EntityListViewMode;
  EntityPickerMode: EntityPickerMode;
  EntityPickerSearchConfig: ResolverTypeWrapper<EntityPickerSearchConfig>;
  EntityPickerSearchConfigInput: EntityPickerSearchConfigInput;
  EntityPickerSearchMode: EntityPickerSearchMode;
  EntitySubelement: EntitySubelement;
  EntityViewElements: ResolverTypeWrapper<Omit<EntityViewElements, 'actionElement' | 'entityListElement' | 'windowElement'> & { actionElement?: Maybe<ResolversTypes['ActionElement']>, entityListElement?: Maybe<ResolversTypes['EntityListElement']>, windowElement?: Maybe<ResolversTypes['WindowElement']> }>;
  EntityViewerElement: ResolverTypeWrapper<EntityViewerElement>;
  Entitytyping: Entitytyping;
  ErrorCodeType: ErrorCodeType;
  ExpandButtonOptions: ResolverTypeWrapper<ExpandButtonOptions>;
  Expression: ResolverTypeWrapper<Omit<Expression, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  FacetInputInput: FacetInputInput;
  FacetInputType: ResolverTypeWrapper<FacetInputType>;
  FetchDeepRelations: ResolverTypeWrapper<FetchDeepRelations>;
  FileProgress: ResolverTypeWrapper<FileProgress>;
  FileProgressStep: ResolverTypeWrapper<FileProgressStep>;
  FileType: FileType;
  FilterInput: FilterInput;
  FilterMatchers: ResolverTypeWrapper<FilterMatchers>;
  FilterOptionsMappingInput: FilterOptionsMappingInput;
  FilterOptionsMappingType: ResolverTypeWrapper<FilterOptionsMappingType>;
  Filters: Filters;
  Form: ResolverTypeWrapper<Form>;
  FormAction: ResolverTypeWrapper<FormAction>;
  FormFields: ResolverTypeWrapper<FormFields>;
  FormSection: ResolverTypeWrapper<FormSection>;
  FormTab: ResolverTypeWrapper<FormTab>;
  Formatters: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['Formatters']>;
  FrontendEntitytyping: FrontendEntitytyping;
  Genre: ResolverTypeWrapper<Omit<Genre, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  GeoJsonFeature: ResolverTypeWrapper<GeoJsonFeature>;
  GeoJsonFeatureInput: GeoJsonFeatureInput;
  GraphDataset: ResolverTypeWrapper<GraphDataset>;
  GraphDatasetFilter: ResolverTypeWrapper<GraphDatasetFilter>;
  GraphDatasetFilterInput: GraphDatasetFilterInput;
  GraphDatasetInput: GraphDatasetInput;
  GraphElement: ResolverTypeWrapper<GraphElement>;
  GraphElementInput: GraphElementInput;
  GraphType: GraphType;
  Group: ResolverTypeWrapper<Omit<Group, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  HiddenField: ResolverTypeWrapper<HiddenField>;
  HiddenFieldInput: HiddenFieldInput;
  HierarchyListElement: ResolverTypeWrapper<HierarchyListElement>;
  HierarchyRelationList: ResolverTypeWrapper<HierarchyRelationList>;
  HierarchyRelationListInput: HierarchyRelationListInput;
  Home: ResolverTypeWrapper<Omit<Home, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ImportReturn: ResolverTypeWrapper<ImportReturn>;
  InfoPanel: ResolverTypeWrapper<InfoPanel>;
  InheritFromInput: InheritFromInput;
  InlineTrigger: ResolverTypeWrapper<InlineTrigger>;
  InlineTriggerInput: InlineTriggerInput;
  InputField: ResolverTypeWrapper<InputField>;
  InputFieldTypes: InputFieldTypes;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  IntialValues: ResolverTypeWrapper<IntialValues>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Job: ResolverTypeWrapper<Omit<Job, 'entityView' | 'sub_jobs'> & { entityView: ResolversTypes['ColumnList'], sub_jobs?: Maybe<ResolversTypes['SubJobResults']> }>;
  JobPollResult: ResolverTypeWrapper<JobPollResult>;
  JobType: JobType;
  JobsResults: ResolverTypeWrapper<Omit<JobsResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversTypes['Job']>>> }>;
  KeyAndValue: ResolverTypeWrapper<KeyAndValue>;
  KeyValue: ResolverTypeWrapper<KeyValue>;
  KeyValueSource: KeyValueSource;
  Language: ResolverTypeWrapper<Omit<Language, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  LinkFormatter: ResolverTypeWrapper<LinkFormatter>;
  ListItemCoverageTypes: ListItemCoverageTypes;
  Listening: ResolverTypeWrapper<Omit<Listening, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  LookupInput: LookupInput;
  LookupInputType: ResolverTypeWrapper<LookupInputType>;
  ManifestViewerElement: ResolverTypeWrapper<ManifestViewerElement>;
  Manifestation: ResolverTypeWrapper<Omit<Manifestation, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationComputerFile: ResolverTypeWrapper<Omit<ManifestationComputerFile, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationFootage: ResolverTypeWrapper<Omit<ManifestationFootage, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationMap: ResolverTypeWrapper<Omit<ManifestationMap, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationMixedMaterial: ResolverTypeWrapper<Omit<ManifestationMixedMaterial, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationMusic: ResolverTypeWrapper<Omit<ManifestationMusic, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationSerial: ResolverTypeWrapper<Omit<ManifestationSerial, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ManifestationWord: ResolverTypeWrapper<Omit<ManifestationWord, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  MapElement: ResolverTypeWrapper<MapElement>;
  MapFeatureMetadata: ResolverTypeWrapper<MapFeatureMetadata>;
  MapMetadata: ResolverTypeWrapper<MapMetadata>;
  MapModes: MapModes;
  MapTypes: MapTypes;
  MapViews: MapViews;
  MarkdownViewerElement: ResolverTypeWrapper<MarkdownViewerElement>;
  MatchMetadataValue: ResolverTypeWrapper<MatchMetadataValue>;
  MatchMetadataValueInput: MatchMetadataValueInput;
  MatcherLabelInput: MatcherLabelInput;
  MatcherLabelType: ResolverTypeWrapper<MatcherLabelType>;
  Matchers: Matchers;
  Media: ResolverTypeWrapper<Omit<Media, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  MediaFile: ResolverTypeWrapper<MediaFile>;
  MediaFileElement: ResolverTypeWrapper<MediaFileElement>;
  MediaFileElementTypes: MediaFileElementTypes;
  MediaFileEntity: ResolverTypeWrapper<Omit<MediaFileEntity, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  MediaFileInput: MediaFileInput;
  MediaFileMetadata: ResolverTypeWrapper<MediaFileMetadata>;
  MediaFileMetadataInput: MediaFileMetadataInput;
  MediaFilePostReturn: ResolverTypeWrapper<MediaFilePostReturn>;
  MediaTypeEntities: MediaTypeEntities;
  Menu: ResolverTypeWrapper<Menu>;
  MenuIcons: MenuIcons;
  MenuItem: ResolverTypeWrapper<MenuItem>;
  MenuTypeLink: ResolverTypeWrapper<MenuTypeLink>;
  MenuTypeLinkInput: MenuTypeLinkInput;
  MenuTypeLinkInputModal: MenuTypeLinkInputModal;
  MenuTypeLinkInputRoute: MenuTypeLinkInputRoute;
  MenuTypeLinkModal: ResolverTypeWrapper<MenuTypeLinkModal>;
  MenuTypeLinkRoute: ResolverTypeWrapper<MenuTypeLinkRoute>;
  MenuWrapper: ResolverTypeWrapper<MenuWrapper>;
  MergeEvaluation: ResolverTypeWrapper<MergeEvaluation>;
  MergeEvaluationStatus: MergeEvaluationStatus;
  MergeImmutableField: ResolverTypeWrapper<MergeImmutableField>;
  MergePreview: ResolverTypeWrapper<MergePreview>;
  MergeSurvivorStrategy: MergeSurvivorStrategy;
  MergeSurvivorSuggestionConfig: ResolverTypeWrapper<MergeSurvivorSuggestionConfig>;
  MergeSurvivorSuggestionConfigInput: MergeSurvivorSuggestionConfigInput;
  Metadata: ResolverTypeWrapper<Metadata>;
  MetadataAndRelation: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['MetadataAndRelation']>;
  MetadataField: ResolverTypeWrapper<MetadataField>;
  MetadataFieldInput: MetadataFieldInput;
  MetadataFieldOption: ResolverTypeWrapper<MetadataFieldOption>;
  MetadataFieldOptionInput: MetadataFieldOptionInput;
  MetadataFormInput: MetadataFormInput;
  MetadataInput: MetadataInput;
  MetadataOnRelationFieldConfig: ResolverTypeWrapper<MetadataOnRelationFieldConfig>;
  MetadataRelation: ResolverTypeWrapper<Omit<MetadataRelation, 'linkedEntity'> & { linkedEntity?: Maybe<ResolversTypes['Entity']> }>;
  MetadataValuesInput: MetadataValuesInput;
  MinMaxAmountOfRelationsValidation: ResolverTypeWrapper<MinMaxAmountOfRelationsValidation>;
  MinMaxAmountOfRelationsValidationInput: MinMaxAmountOfRelationsValidationInput;
  MinMaxInput: MinMaxInput;
  ModalStyle: ModalStyle;
  MultiSelectInput: MultiSelectInput;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Muziekweb: ResolverTypeWrapper<Omit<Muziekweb, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Nomen: ResolverTypeWrapper<Omit<Nomen, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  OcrType: OcrType;
  Omnibus: ResolverTypeWrapper<Omit<Omnibus, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Operator: Operator;
  Orientations: Orientations;
  Orienting: ResolverTypeWrapper<Omit<Orienting, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  PageStatus: PageStatus;
  PaginationInfo: PaginationInfo;
  PaginationLimitOptions: ResolverTypeWrapper<PaginationLimitOptions>;
  PanelHeaderContent: ResolverTypeWrapper<PanelHeaderContent>;
  PanelHeaderContentInput: PanelHeaderContentInput;
  PanelInfo: ResolverTypeWrapper<PanelInfo>;
  PanelLibraryData: ResolverTypeWrapper<PanelLibraryData>;
  PanelLibraryDataInput: PanelLibraryDataInput;
  PanelLink: ResolverTypeWrapper<PanelLink>;
  PanelMetaData: ResolverTypeWrapper<PanelMetaData>;
  PanelMetadataValueTooltip: ResolverTypeWrapper<PanelMetadataValueTooltip>;
  PanelMetadataValueTooltipInput: PanelMetadataValueTooltipInput;
  PanelMetadataValueTooltipTypes: PanelMetadataValueTooltipTypes;
  PanelRelation: ResolverTypeWrapper<PanelRelation>;
  PanelRelationMetaData: ResolverTypeWrapper<PanelRelationMetaData>;
  PanelRelationRootData: ResolverTypeWrapper<PanelRelationRootData>;
  PanelStatus: ResolverTypeWrapper<PanelStatus>;
  PanelStatusInput: PanelStatusInput;
  PanelThumbnail: ResolverTypeWrapper<PanelThumbnail>;
  PanelType: PanelType;
  ParentRelationsConfigInput: ParentRelationsConfigInput;
  Partner: ResolverTypeWrapper<Omit<Partner, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Permission: Permission;
  PermissionMapping: ResolverTypeWrapper<PermissionMapping>;
  PermissionRequestInfo: ResolverTypeWrapper<PermissionRequestInfo>;
  PermissionResult: ResolverTypeWrapper<PermissionResult>;
  Person: ResolverTypeWrapper<Omit<Person, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  PillFormatter: ResolverTypeWrapper<PillFormatter>;
  Place: ResolverTypeWrapper<Omit<Place, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Playing: ResolverTypeWrapper<Omit<Playing, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  PreviewComponent: ResolverTypeWrapper<PreviewComponent>;
  PreviewConfiguration: ResolverTypeWrapper<PreviewConfiguration>;
  PreviewTypes: PreviewTypes;
  ProgressStepStatus: ProgressStepStatus;
  ProgressStepType: ProgressStepType;
  Publisher: ResolverTypeWrapper<Omit<Publisher, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Reading: ResolverTypeWrapper<Omit<Reading, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  RegexpMatchFormatter: ResolverTypeWrapper<RegexpMatchFormatter>;
  RelationActions: RelationActions;
  RelationDirection: RelationDirection;
  RelationField: ResolverTypeWrapper<RelationField>;
  RelationFieldViewMode: RelationFieldViewMode;
  RelationLookupInput: RelationLookupInput;
  RelationType: RelationType;
  RepetitionConfig: ResolverTypeWrapper<RepetitionConfig>;
  RepetitiveCreatableType: ResolverTypeWrapper<RepetitiveCreatableType>;
  RepetitiveCreatableTypeInput: RepetitiveCreatableTypeInput;
  RepetitiveFinalize: ResolverTypeWrapper<RepetitiveFinalize>;
  RepetitiveFinalizeRelation: ResolverTypeWrapper<RepetitiveFinalizeRelation>;
  RepetitiveForm: ResolverTypeWrapper<RepetitiveForm>;
  RepetitiveHostFinalize: ResolverTypeWrapper<RepetitiveHostFinalize>;
  RepetitiveMetadataPrefill: ResolverTypeWrapper<RepetitiveMetadataPrefill>;
  RepetitiveRelationMetadataField: ResolverTypeWrapper<RepetitiveRelationMetadataField>;
  RepetitiveRelationMetadataFieldInput: RepetitiveRelationMetadataFieldInput;
  RepetitiveRelationTrigger: RepetitiveRelationTrigger;
  RepetitiveStep: ResolverTypeWrapper<RepetitiveStep>;
  RepetitiveStepOverviewField: ResolverTypeWrapper<RepetitiveStepOverviewField>;
  RepetitiveStepOverviewFieldInput: RepetitiveStepOverviewFieldInput;
  RepetitiveStepRelation: ResolverTypeWrapper<RepetitiveStepRelation>;
  RepetitiveStepScope: ResolverTypeWrapper<RepetitiveStepScope>;
  RequiredOneOfMetadataValidation: ResolverTypeWrapper<RequiredOneOfMetadataValidation>;
  RequiredOneOfMetadataValidationInput: RequiredOneOfMetadataValidationInput;
  RequiredOneOfRelationValidation: ResolverTypeWrapper<RequiredOneOfRelationValidation>;
  RequiredOneOfRelationValidationInput: RequiredOneOfRelationValidationInput;
  RequiredRelationValidation: ResolverTypeWrapper<RequiredRelationValidation>;
  RequiredRelationValidationInput: RequiredRelationValidationInput;
  RouteMatching: ResolverTypeWrapper<RouteMatching>;
  RouteMatchingInput: RouteMatchingInput;
  RouteNames: RouteNames;
  SanitizeMode: SanitizeMode;
  SavedSearch: ResolverTypeWrapper<Omit<SavedSearch, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  SearchFilter: SearchFilter;
  SearchInputType: SearchInputType;
  SelectionInput: SelectionInput;
  ShareLink: ResolverTypeWrapper<Omit<ShareLink, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  SingleMediaFileElement: ResolverTypeWrapper<SingleMediaFileElement>;
  Siso: ResolverTypeWrapper<Omit<Siso, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  SkeletonComponentType: SkeletonComponentType;
  SortOptions: ResolverTypeWrapper<SortOptions>;
  SortingDirection: SortingDirection;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  StringOrInt: ResolverTypeWrapper<Scalars['StringOrInt']['output']>;
  SubField: ResolverTypeWrapper<SubField>;
  SubJobResults: ResolverTypeWrapper<Omit<SubJobResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversTypes['Job']>>> }>;
  TagConfigurationByEntity: ResolverTypeWrapper<TagConfigurationByEntity>;
  TagConfigurationByEntityInput: TagConfigurationByEntityInput;
  TaggableEntityConfiguration: ResolverTypeWrapper<TaggableEntityConfiguration>;
  TaggableEntityConfigurationInput: TaggableEntityConfigurationInput;
  TaggingExtensionConfiguration: ResolverTypeWrapper<TaggingExtensionConfiguration>;
  TargetAudience: ResolverTypeWrapper<Omit<TargetAudience, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Tenant: ResolverTypeWrapper<Omit<Tenant, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  TextInput: TextInput;
  Time: ResolverTypeWrapper<Omit<Time, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  TimeUnit: TimeUnit;
  Title: ResolverTypeWrapper<Omit<Title, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  Token: ResolverTypeWrapper<Omit<Token, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  TranscodeType: TranscodeType;
  TransliterationConfigItem: ResolverTypeWrapper<TransliterationConfigItem>;
  TypeModals: TypeModals;
  Unit: Unit;
  UploadContainer: ResolverTypeWrapper<UploadContainer>;
  UploadEntityTypes: UploadEntityTypes;
  UploadField: ResolverTypeWrapper<UploadField>;
  UploadFieldSize: UploadFieldSize;
  UploadFieldType: UploadFieldType;
  UploadFlow: UploadFlow;
  User: ResolverTypeWrapper<Omit<User, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  UserContextRoles: UserContextRoles;
  Validation: ResolverTypeWrapper<Validation>;
  ValidationFields: ValidationFields;
  ValidationInput: ValidationInput;
  ValidationRules: ValidationRules;
  ValueMapping: ResolverTypeWrapper<ValueMapping>;
  ValueMappingInput: ValueMappingInput;
  ViewModes: ViewModes;
  ViewModesWithConfig: ResolverTypeWrapper<ViewModesWithConfig>;
  ViewModesWithConfigInput: ViewModesWithConfigInput;
  VirtualKeyboardConfig: ResolverTypeWrapper<VirtualKeyboardConfig>;
  VirtualKeyboardConfigInput: VirtualKeyboardConfigInput;
  VisibilityLevels: VisibilityLevels;
  VisibleIf: ResolverTypeWrapper<VisibleIf>;
  VisibleIfInput: VisibleIfInput;
  Watching: ResolverTypeWrapper<Omit<Watching, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WindowElement: ResolverTypeWrapper<Omit<WindowElement, 'editMetadataButton' | 'panels'> & { editMetadataButton?: Maybe<ResolversTypes['EditMetadataButton']>, panels?: Maybe<ResolversTypes['WindowElementPanel']> }>;
  WindowElementBulkDataPanel: ResolverTypeWrapper<WindowElementBulkDataPanel>;
  WindowElementLayout: WindowElementLayout;
  WindowElementPanel: ResolverTypeWrapper<Omit<WindowElementPanel, 'entityListElement'> & { entityListElement?: Maybe<ResolversTypes['EntityListElement']> }>;
  WindowElementStatus: ResolverTypeWrapper<WindowElementStatus>;
  WindowElementStatusInput: WindowElementStatusInput;
  Work: ResolverTypeWrapper<Omit<Work, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkComputerFile: ResolverTypeWrapper<Omit<WorkComputerFile, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkFootage: ResolverTypeWrapper<Omit<WorkFootage, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkMap: ResolverTypeWrapper<Omit<WorkMap, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkMixedMaterial: ResolverTypeWrapper<Omit<WorkMixedMaterial, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkMusic: ResolverTypeWrapper<Omit<WorkMusic, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkSerial: ResolverTypeWrapper<Omit<WorkSerial, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WorkWord: ResolverTypeWrapper<Omit<WorkWord, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  WysiwygElement: ResolverTypeWrapper<WysiwygElement>;
  WysiwygElementConfiguration: ResolverTypeWrapper<WysiwygElementConfiguration>;
  WysiwygExtensions: WysiwygExtensions;
  WysiwygTransliterationConfig: ResolverTypeWrapper<WysiwygTransliterationConfig>;
  Zizo: ResolverTypeWrapper<Omit<Zizo, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoDeelrubriek: ResolverTypeWrapper<Omit<ZizoDeelrubriek, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoDomein: ResolverTypeWrapper<Omit<ZizoDomein, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoGroeirubriek: ResolverTypeWrapper<Omit<ZizoGroeirubriek, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoHoofdrubriek: ResolverTypeWrapper<Omit<ZizoHoofdrubriek, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoKast: ResolverTypeWrapper<Omit<ZizoKast, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoPlank: ResolverTypeWrapper<Omit<ZizoPlank, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  ZizoRug: ResolverTypeWrapper<Omit<ZizoRug, 'entityView'> & { entityView: ResolversTypes['ColumnList'] }>;
  relationInput: RelationInput;
  teaserMetadata: ResolverTypeWrapper<TeaserMetadata>;
  teaserMetadataOptions: TeaserMetadataOptions;
  userPermissions: ResolverTypeWrapper<UserPermissions>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActionButton: ActionButton;
  ActionContext: ActionContext;
  ActionContextInput: ActionContextInput;
  ActionElement: ActionElement;
  ActionProgress: ActionProgress;
  ActionProgressStep: ActionProgressStep;
  ActionsOnResult: ActionsOnResult;
  AdvancedFilter: AdvancedFilter;
  AdvancedFilterInput: AdvancedFilterInput;
  AdvancedFilterInputType: AdvancedFilterInputType;
  AdvancedFilterLimitConfigInput: AdvancedFilterLimitConfigInput;
  AdvancedFilterLimitConfigType: AdvancedFilterLimitConfigType;
  AdvancedFilters: AdvancedFilters;
  AdvancedSearchInput: AdvancedSearchInput;
  AllowedViewModes: AllowedViewModes;
  Award: Omit<Award, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  BaseEntity: Omit<BaseEntity, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  BaseRelationValuesInput: BaseRelationValuesInput;
  Boekenbank: Omit<Boekenbank, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Boolean: Scalars['Boolean']['output'];
  BreadCrumbRoute: BreadCrumbRoute;
  BreadCrumbRouteInput: BreadCrumbRouteInput;
  BulkEditResult: BulkEditResult;
  BulkOperationCsvExportKeys: BulkOperationCsvExportKeys;
  BulkOperationInputModal: BulkOperationInputModal;
  BulkOperationModal: BulkOperationModal;
  BulkOperationOptions: BulkOperationOptions;
  BulkOperations: BulkOperations;
  Buttons: Buttons;
  Cantook: Omit<Cantook, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  CharacterReplacementSettings: CharacterReplacementSettings;
  CharacterReplacementSettingsInput: CharacterReplacementSettingsInput;
  CodeWording: Omit<CodeWording, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Column: Omit<Column, 'elements'> & { elements: ResolversParentTypes['EntityViewElements'] };
  ColumnList: Omit<ColumnList, 'column'> & { column: ResolversParentTypes['Column'] };
  Comment: Omit<Comment, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  CommentCreateFields: CommentCreateFields;
  CommentsElement: CommentsElement;
  Conditional: Conditional;
  ConditionalInput: ConditionalInput;
  ConfigItem: ConfigItem;
  ConfigItemInput: ConfigItemInput;
  Context: Omit<Context, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ContextMenuActions: ContextMenuActions;
  ContextMenuCustomAction: ContextMenuCustomAction;
  ContextMenuDownloadZipOfRelatedMediafilesAction: ContextMenuDownloadZipOfRelatedMediafilesAction;
  ContextMenuElodyAction: ContextMenuElodyAction;
  ContextMenuGeneralAction: ContextMenuGeneralAction;
  ContextMenuLinkAction: ContextMenuLinkAction;
  ContextMenuQueryAction: ContextMenuQueryAction;
  CopyFromParentConfig: CopyFromParentConfig;
  CopyFromParentConfigInput: CopyFromParentConfigInput;
  CopyFromParentKeyMap: CopyFromParentKeyMap;
  CopyFromParentKeyMapInput: CopyFromParentKeyMapInput;
  CopyValueFromParentIntialValues: CopyValueFromParentIntialValues;
  CopyValueFromParentIntialValuesInput: CopyValueFromParentIntialValuesInput;
  Corporation: Omit<Corporation, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  DeleteEntitiesInput: DeleteEntitiesInput;
  DeleteQueryOptions: DeleteQueryOptions;
  Directory: Directory;
  DisplayCondition: DisplayCondition;
  Download: Omit<Download, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  DropdownOption: DropdownOption;
  DropdownOptionInput: DropdownOptionInput;
  DropzoneEntityToCreate: DropzoneEntityToCreate;
  EasyReading: Omit<EasyReading, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  EditMetadataButton: EditMetadataButton;
  EditMetadataButtonInput: EditMetadataButtonInput;
  EndpointInformation: EndpointInformation;
  EndpointInformationInput: EndpointInformationInput;
  EntitiesResults: Omit<EntitiesResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversParentTypes['Entity']>>> };
  Entity: ResolversInterfaceTypes<ResolversParentTypes>['Entity'];
  EntityButtonConfig: EntityButtonConfig;
  EntityButtonStyle: EntityButtonStyle;
  EntityFormInput: EntityFormInput;
  EntityInput: EntityInput;
  EntityListElement: Omit<EntityListElement, 'actionsOnResult' | 'entityList' | 'entityListElement'> & { actionsOnResult?: Maybe<ResolversParentTypes['ActionsOnResult']>, entityList?: Maybe<Array<Maybe<ResolversParentTypes['Entity']>>>, entityListElement?: Maybe<ResolversParentTypes['EntityListElement']> };
  EntityPickerSearchConfig: EntityPickerSearchConfig;
  EntityPickerSearchConfigInput: EntityPickerSearchConfigInput;
  EntityViewElements: Omit<EntityViewElements, 'actionElement' | 'entityListElement' | 'windowElement'> & { actionElement?: Maybe<ResolversParentTypes['ActionElement']>, entityListElement?: Maybe<ResolversParentTypes['EntityListElement']>, windowElement?: Maybe<ResolversParentTypes['WindowElement']> };
  EntityViewerElement: EntityViewerElement;
  ExpandButtonOptions: ExpandButtonOptions;
  Expression: Omit<Expression, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  FacetInputInput: FacetInputInput;
  FacetInputType: FacetInputType;
  FetchDeepRelations: FetchDeepRelations;
  FileProgress: FileProgress;
  FileProgressStep: FileProgressStep;
  FilterInput: FilterInput;
  FilterMatchers: FilterMatchers;
  FilterOptionsMappingInput: FilterOptionsMappingInput;
  FilterOptionsMappingType: FilterOptionsMappingType;
  Filters: Filters;
  Form: Form;
  FormAction: FormAction;
  FormFields: FormFields;
  FormSection: FormSection;
  FormTab: FormTab;
  Formatters: ResolversUnionTypes<ResolversParentTypes>['Formatters'];
  Genre: Omit<Genre, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  GeoJsonFeature: GeoJsonFeature;
  GeoJsonFeatureInput: GeoJsonFeatureInput;
  GraphDataset: GraphDataset;
  GraphDatasetFilter: GraphDatasetFilter;
  GraphDatasetFilterInput: GraphDatasetFilterInput;
  GraphDatasetInput: GraphDatasetInput;
  GraphElement: GraphElement;
  GraphElementInput: GraphElementInput;
  Group: Omit<Group, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  HiddenField: HiddenField;
  HiddenFieldInput: HiddenFieldInput;
  HierarchyListElement: HierarchyListElement;
  HierarchyRelationList: HierarchyRelationList;
  HierarchyRelationListInput: HierarchyRelationListInput;
  Home: Omit<Home, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ImportReturn: ImportReturn;
  InfoPanel: InfoPanel;
  InheritFromInput: InheritFromInput;
  InlineTrigger: InlineTrigger;
  InlineTriggerInput: InlineTriggerInput;
  InputField: InputField;
  Int: Scalars['Int']['output'];
  IntialValues: IntialValues;
  JSON: Scalars['JSON']['output'];
  Job: Omit<Job, 'entityView' | 'sub_jobs'> & { entityView: ResolversParentTypes['ColumnList'], sub_jobs?: Maybe<ResolversParentTypes['SubJobResults']> };
  JobPollResult: JobPollResult;
  JobsResults: Omit<JobsResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversParentTypes['Job']>>> };
  KeyAndValue: KeyAndValue;
  KeyValue: KeyValue;
  Language: Omit<Language, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  LinkFormatter: LinkFormatter;
  Listening: Omit<Listening, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  LookupInput: LookupInput;
  LookupInputType: LookupInputType;
  ManifestViewerElement: ManifestViewerElement;
  Manifestation: Omit<Manifestation, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationComputerFile: Omit<ManifestationComputerFile, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationFootage: Omit<ManifestationFootage, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationMap: Omit<ManifestationMap, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationMixedMaterial: Omit<ManifestationMixedMaterial, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationMusic: Omit<ManifestationMusic, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationSerial: Omit<ManifestationSerial, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ManifestationWord: Omit<ManifestationWord, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  MapElement: MapElement;
  MapFeatureMetadata: MapFeatureMetadata;
  MapMetadata: MapMetadata;
  MarkdownViewerElement: MarkdownViewerElement;
  MatchMetadataValue: MatchMetadataValue;
  MatchMetadataValueInput: MatchMetadataValueInput;
  MatcherLabelInput: MatcherLabelInput;
  MatcherLabelType: MatcherLabelType;
  Media: Omit<Media, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  MediaFile: MediaFile;
  MediaFileElement: MediaFileElement;
  MediaFileEntity: Omit<MediaFileEntity, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  MediaFileInput: MediaFileInput;
  MediaFileMetadata: MediaFileMetadata;
  MediaFileMetadataInput: MediaFileMetadataInput;
  MediaFilePostReturn: MediaFilePostReturn;
  Menu: Menu;
  MenuItem: MenuItem;
  MenuTypeLink: MenuTypeLink;
  MenuTypeLinkInput: MenuTypeLinkInput;
  MenuTypeLinkInputModal: MenuTypeLinkInputModal;
  MenuTypeLinkInputRoute: MenuTypeLinkInputRoute;
  MenuTypeLinkModal: MenuTypeLinkModal;
  MenuTypeLinkRoute: MenuTypeLinkRoute;
  MenuWrapper: MenuWrapper;
  MergeEvaluation: MergeEvaluation;
  MergeImmutableField: MergeImmutableField;
  MergePreview: MergePreview;
  MergeSurvivorSuggestionConfig: MergeSurvivorSuggestionConfig;
  MergeSurvivorSuggestionConfigInput: MergeSurvivorSuggestionConfigInput;
  Metadata: Metadata;
  MetadataAndRelation: ResolversUnionTypes<ResolversParentTypes>['MetadataAndRelation'];
  MetadataField: MetadataField;
  MetadataFieldInput: MetadataFieldInput;
  MetadataFieldOption: MetadataFieldOption;
  MetadataFieldOptionInput: MetadataFieldOptionInput;
  MetadataFormInput: MetadataFormInput;
  MetadataInput: MetadataInput;
  MetadataOnRelationFieldConfig: MetadataOnRelationFieldConfig;
  MetadataRelation: Omit<MetadataRelation, 'linkedEntity'> & { linkedEntity?: Maybe<ResolversParentTypes['Entity']> };
  MetadataValuesInput: MetadataValuesInput;
  MinMaxAmountOfRelationsValidation: MinMaxAmountOfRelationsValidation;
  MinMaxAmountOfRelationsValidationInput: MinMaxAmountOfRelationsValidationInput;
  MinMaxInput: MinMaxInput;
  MultiSelectInput: MultiSelectInput;
  Mutation: Record<PropertyKey, never>;
  Muziekweb: Omit<Muziekweb, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Nomen: Omit<Nomen, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Omnibus: Omit<Omnibus, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Orienting: Omit<Orienting, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  PaginationInfo: PaginationInfo;
  PaginationLimitOptions: PaginationLimitOptions;
  PanelHeaderContent: PanelHeaderContent;
  PanelHeaderContentInput: PanelHeaderContentInput;
  PanelInfo: PanelInfo;
  PanelLibraryData: PanelLibraryData;
  PanelLibraryDataInput: PanelLibraryDataInput;
  PanelLink: PanelLink;
  PanelMetaData: PanelMetaData;
  PanelMetadataValueTooltip: PanelMetadataValueTooltip;
  PanelMetadataValueTooltipInput: PanelMetadataValueTooltipInput;
  PanelRelation: PanelRelation;
  PanelRelationMetaData: PanelRelationMetaData;
  PanelRelationRootData: PanelRelationRootData;
  PanelStatus: PanelStatus;
  PanelStatusInput: PanelStatusInput;
  PanelThumbnail: PanelThumbnail;
  ParentRelationsConfigInput: ParentRelationsConfigInput;
  Partner: Omit<Partner, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  PermissionMapping: PermissionMapping;
  PermissionRequestInfo: PermissionRequestInfo;
  PermissionResult: PermissionResult;
  Person: Omit<Person, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  PillFormatter: PillFormatter;
  Place: Omit<Place, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Playing: Omit<Playing, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  PreviewComponent: PreviewComponent;
  PreviewConfiguration: PreviewConfiguration;
  Publisher: Omit<Publisher, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Query: Record<PropertyKey, never>;
  Reading: Omit<Reading, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  RegexpMatchFormatter: RegexpMatchFormatter;
  RelationField: RelationField;
  RelationLookupInput: RelationLookupInput;
  RepetitionConfig: RepetitionConfig;
  RepetitiveCreatableType: RepetitiveCreatableType;
  RepetitiveCreatableTypeInput: RepetitiveCreatableTypeInput;
  RepetitiveFinalize: RepetitiveFinalize;
  RepetitiveFinalizeRelation: RepetitiveFinalizeRelation;
  RepetitiveForm: RepetitiveForm;
  RepetitiveHostFinalize: RepetitiveHostFinalize;
  RepetitiveMetadataPrefill: RepetitiveMetadataPrefill;
  RepetitiveRelationMetadataField: RepetitiveRelationMetadataField;
  RepetitiveRelationMetadataFieldInput: RepetitiveRelationMetadataFieldInput;
  RepetitiveStep: RepetitiveStep;
  RepetitiveStepOverviewField: RepetitiveStepOverviewField;
  RepetitiveStepOverviewFieldInput: RepetitiveStepOverviewFieldInput;
  RepetitiveStepRelation: RepetitiveStepRelation;
  RepetitiveStepScope: RepetitiveStepScope;
  RequiredOneOfMetadataValidation: RequiredOneOfMetadataValidation;
  RequiredOneOfMetadataValidationInput: RequiredOneOfMetadataValidationInput;
  RequiredOneOfRelationValidation: RequiredOneOfRelationValidation;
  RequiredOneOfRelationValidationInput: RequiredOneOfRelationValidationInput;
  RequiredRelationValidation: RequiredRelationValidation;
  RequiredRelationValidationInput: RequiredRelationValidationInput;
  RouteMatching: RouteMatching;
  RouteMatchingInput: RouteMatchingInput;
  SavedSearch: Omit<SavedSearch, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  SearchFilter: SearchFilter;
  SelectionInput: SelectionInput;
  ShareLink: Omit<ShareLink, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  SingleMediaFileElement: SingleMediaFileElement;
  Siso: Omit<Siso, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  SortOptions: SortOptions;
  String: Scalars['String']['output'];
  StringOrInt: Scalars['StringOrInt']['output'];
  SubField: SubField;
  SubJobResults: Omit<SubJobResults, 'results'> & { results?: Maybe<Array<Maybe<ResolversParentTypes['Job']>>> };
  TagConfigurationByEntity: TagConfigurationByEntity;
  TagConfigurationByEntityInput: TagConfigurationByEntityInput;
  TaggableEntityConfiguration: TaggableEntityConfiguration;
  TaggableEntityConfigurationInput: TaggableEntityConfigurationInput;
  TaggingExtensionConfiguration: TaggingExtensionConfiguration;
  TargetAudience: Omit<TargetAudience, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Tenant: Omit<Tenant, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  TextInput: TextInput;
  Time: Omit<Time, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Title: Omit<Title, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Token: Omit<Token, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  TransliterationConfigItem: TransliterationConfigItem;
  UploadContainer: UploadContainer;
  UploadField: UploadField;
  User: Omit<User, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  Validation: Validation;
  ValidationInput: ValidationInput;
  ValueMapping: ValueMapping;
  ValueMappingInput: ValueMappingInput;
  ViewModesWithConfig: ViewModesWithConfig;
  ViewModesWithConfigInput: ViewModesWithConfigInput;
  VirtualKeyboardConfig: VirtualKeyboardConfig;
  VirtualKeyboardConfigInput: VirtualKeyboardConfigInput;
  VisibleIf: VisibleIf;
  VisibleIfInput: VisibleIfInput;
  Watching: Omit<Watching, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WindowElement: Omit<WindowElement, 'editMetadataButton' | 'panels'> & { editMetadataButton?: Maybe<ResolversParentTypes['EditMetadataButton']>, panels?: Maybe<ResolversParentTypes['WindowElementPanel']> };
  WindowElementBulkDataPanel: WindowElementBulkDataPanel;
  WindowElementPanel: Omit<WindowElementPanel, 'entityListElement'> & { entityListElement?: Maybe<ResolversParentTypes['EntityListElement']> };
  WindowElementStatus: WindowElementStatus;
  WindowElementStatusInput: WindowElementStatusInput;
  Work: Omit<Work, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkComputerFile: Omit<WorkComputerFile, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkFootage: Omit<WorkFootage, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkMap: Omit<WorkMap, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkMixedMaterial: Omit<WorkMixedMaterial, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkMusic: Omit<WorkMusic, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkSerial: Omit<WorkSerial, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WorkWord: Omit<WorkWord, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  WysiwygElement: WysiwygElement;
  WysiwygElementConfiguration: WysiwygElementConfiguration;
  WysiwygTransliterationConfig: WysiwygTransliterationConfig;
  Zizo: Omit<Zizo, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoDeelrubriek: Omit<ZizoDeelrubriek, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoDomein: Omit<ZizoDomein, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoGroeirubriek: Omit<ZizoGroeirubriek, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoHoofdrubriek: Omit<ZizoHoofdrubriek, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoKast: Omit<ZizoKast, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoPlank: Omit<ZizoPlank, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  ZizoRug: Omit<ZizoRug, 'entityView'> & { entityView: ResolversParentTypes['ColumnList'] };
  relationInput: RelationInput;
  teaserMetadata: TeaserMetadata;
  teaserMetadataOptions: TeaserMetadataOptions;
  userPermissions: UserPermissions;
};

export type ActionButtonResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionButton'] = ResolversParentTypes['ActionButton']> = {
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ActionButtonCanArgs>>;
  hideIf?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ActionButtonHideIfArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ActionButtonIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ActionButtonLabelArgs>>;
  onResult?: Resolver<ResolversTypes['ActionButtonResult'], ParentType, ContextType, Partial<ActionButtonOnResultArgs>>;
  query?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ActionButtonQueryArgs>>;
  variables?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, Partial<ActionButtonVariablesArgs>>;
};

export type ActionContextResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionContext'] = ResolversParentTypes['ActionContext']> = {
  activeViewMode?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionContextViewModeTypes']>>>, ParentType, ContextType>;
  entitiesSelectionType?: Resolver<Maybe<ResolversTypes['ActionContextEntitiesSelectionType']>, ParentType, ContextType>;
  labelForTooltip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matchMetadataValue?: Resolver<Maybe<Array<Maybe<ResolversTypes['MatchMetadataValue']>>>, ParentType, ContextType>;
  maxSelectedItems?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  minSelectedItems?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  requiresSameType?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type ActionElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionElement'] = ResolversParentTypes['ActionElement']> = {
  actions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Actions']>>>, ParentType, ContextType, Partial<ActionElementActionsArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ActionElementLabelArgs>>;
};

export type ActionProgressResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionProgress'] = ResolversParentTypes['ActionProgress']> = {
  step?: Resolver<Maybe<ResolversTypes['ActionProgressStep']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ActionProgressIndicatorType'], ParentType, ContextType, RequireFields<ActionProgressTypeArgs, 'input'>>;
};

export type ActionProgressStepResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionProgressStep'] = ResolversParentTypes['ActionProgressStep']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<ActionProgressStepLabelArgs, 'input'>>;
  status?: Resolver<ResolversTypes['ProgressStepStatus'], ParentType, ContextType>;
  stepType?: Resolver<ResolversTypes['ProgressStepType'], ParentType, ContextType, RequireFields<ActionProgressStepStepTypeArgs, 'input'>>;
};

export type ActionsOnResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionsOnResult'] = ResolversParentTypes['ActionsOnResult']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<ActionsOnResultOptionsArgs, 'input'>>;
  type?: Resolver<ResolversTypes['ActionsOnResultTypes'], ParentType, ContextType, RequireFields<ActionsOnResultTypeArgs, 'input'>>;
};

export type AdvancedFilterResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvancedFilter'] = ResolversParentTypes['AdvancedFilter']> = {
  advancedFilterInputForRetrievingOptions?: Resolver<Maybe<Array<ResolversTypes['AdvancedFilterInputType']>>, ParentType, ContextType>;
  aggregation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  allowedMatchers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Matchers']>>>, ParentType, ContextType>;
  bucket?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  context?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  defaultMatcher?: Resolver<Maybe<ResolversTypes['Matchers']>, ParentType, ContextType>;
  defaultValue?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<AdvancedFilterDefaultValueArgs, 'value'>>;
  defaultValueMapping?: Resolver<Maybe<Array<Maybe<ResolversTypes['ValueMapping']>>>, ParentType, ContextType, Partial<AdvancedFilterDefaultValueMappingArgs>>;
  distinctBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  doNotOverrideDefaultValue?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<AdvancedFilterDoNotOverrideDefaultValueArgs>>;
  entityType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  facets?: Resolver<Maybe<Array<ResolversTypes['FacetInputType']>>, ParentType, ContextType>;
  filterOptionsMapping?: Resolver<Maybe<ResolversTypes['FilterOptionsMappingType']>, ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<AdvancedFilterHiddenArgs>>;
  includeDefaultValuesFromIntialValues?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  isDisplayedByDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  itemTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  limitConfig?: Resolver<Maybe<ResolversTypes['AdvancedFilterLimitConfigType']>, ParentType, ContextType>;
  lookup?: Resolver<Maybe<ResolversTypes['LookupInputType']>, ParentType, ContextType>;
  matchExact?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  matcherLabels?: Resolver<Maybe<Array<ResolversTypes['MatcherLabelType']>>, ParentType, ContextType>;
  matchersType?: Resolver<Maybe<ResolversTypes['AdvancedFilterMatchersType']>, ParentType, ContextType>;
  max?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  metadataKeyAsLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  min?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  minDropdownSearchCharacters?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, Partial<AdvancedFilterMinDropdownSearchCharactersArgs>>;
  operator?: Resolver<Maybe<ResolversTypes['Operator']>, ParentType, ContextType>;
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType>;
  parentKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  relationKeys?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  selectionOption?: Resolver<Maybe<ResolversTypes['AutocompleteSelectionOptions']>, ParentType, ContextType>;
  showTimeForDateFilter?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tooltip?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<AdvancedFilterTooltipArgs>>;
  type?: Resolver<ResolversTypes['AdvancedFilterTypes'], ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  useOldWayToFetchOptions?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type AdvancedFilterInputTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvancedFilterInputType'] = ResolversParentTypes['AdvancedFilterInputType']> = {
  aggregation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bucket?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  context?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  defaultValueMapping?: Resolver<Maybe<Array<Maybe<ResolversTypes['ValueMapping']>>>, ParentType, ContextType>;
  distinct_by?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  includeDefaultValuesFromIntialValues?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  inner_exact_matches?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  item_types?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  lookup?: Resolver<Maybe<ResolversTypes['LookupInputType']>, ParentType, ContextType>;
  match_exact?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  match_not?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  matchersType?: Resolver<Maybe<ResolversTypes['AdvancedFilterMatchersType']>, ParentType, ContextType>;
  metadata_key_as_label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  minDropdownSearchCharacters?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  operator?: Resolver<Maybe<ResolversTypes['Operator']>, ParentType, ContextType>;
  parent_key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resolveDefaultValueToOptionIds?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  returnIdAtIndex?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  selectionOption?: Resolver<Maybe<ResolversTypes['AutocompleteSelectionOptions']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AdvancedFilterTypes'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
};

export type AdvancedFilterLimitConfigTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvancedFilterLimitConfigType'] = ResolversParentTypes['AdvancedFilterLimitConfigType']> = {
  facetsLimit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  optionsLimit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type AdvancedFiltersResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvancedFilters'] = ResolversParentTypes['AdvancedFilters']> = {
  advancedFilter?: Resolver<ResolversTypes['AdvancedFilter'], ParentType, ContextType, RequireFields<AdvancedFiltersAdvancedFilterArgs, 'type'>>;
};

export type AllowedViewModesResolvers<ContextType = any, ParentType extends ResolversParentTypes['AllowedViewModes'] = ResolversParentTypes['AllowedViewModes']> = {
  viewModes?: Resolver<Maybe<Array<Maybe<ResolversTypes['ViewModesWithConfig']>>>, ParentType, ContextType, Partial<AllowedViewModesViewModesArgs>>;
};

export type AwardResolvers<ContextType = any, ParentType extends ResolversParentTypes['Award'] = ResolversParentTypes['Award']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BaseEntityResolvers<ContextType = any, ParentType extends ResolversParentTypes['BaseEntity'] = ResolversParentTypes['BaseEntity']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BoekenbankResolvers<ContextType = any, ParentType extends ResolversParentTypes['Boekenbank'] = ResolversParentTypes['Boekenbank']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BreadCrumbRouteResolvers<ContextType = any, ParentType extends ResolversParentTypes['BreadCrumbRoute'] = ResolversParentTypes['BreadCrumbRoute']> = {
  entityType?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entitytyping']>>>, ParentType, ContextType>;
  key?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  overviewPage?: Resolver<Maybe<ResolversTypes['RouteNames']>, ParentType, ContextType>;
  relation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type BulkEditResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BulkEditResult'] = ResolversParentTypes['BulkEditResult']> = {
  failedIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  succeededIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type BulkOperationCsvExportKeysResolvers<ContextType = any, ParentType extends ResolversParentTypes['BulkOperationCsvExportKeys'] = ResolversParentTypes['BulkOperationCsvExportKeys']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType>;
};

export type BulkOperationModalResolvers<ContextType = any, ParentType extends ResolversParentTypes['BulkOperationModal'] = ResolversParentTypes['BulkOperationModal']> = {
  askForCloseConfirmation?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  customQueryEntityPickerList?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  customQueryEntityPickerListFilters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enableImageCrop?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  formQueries?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  formRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keyToSaveCropCoordinates?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  neededPermission?: Resolver<Maybe<ResolversTypes['Permission']>, ParentType, ContextType>;
  pageToNavigateToAfterCreation?: Resolver<Maybe<ResolversTypes['BulkNavigationPages']>, ParentType, ContextType>;
  replaceExistingRelations?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  selectionLimit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  skipItemsWithRelationDuringBulkDelete?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  survivorSuggestion?: Resolver<Maybe<ResolversTypes['MergeSurvivorSuggestionConfig']>, ParentType, ContextType>;
  typeModal?: Resolver<ResolversTypes['TypeModals'], ParentType, ContextType>;
};

export type BulkOperationOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['BulkOperationOptions'] = ResolversParentTypes['BulkOperationOptions']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<BulkOperationOptionsOptionsArgs, 'input'>>;
};

export type BulkOperationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['BulkOperations'] = ResolversParentTypes['BulkOperations']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<BulkOperationsOptionsArgs, 'input'>>;
};

export type ButtonsResolvers<ContextType = any, ParentType extends ResolversParentTypes['Buttons'] = ResolversParentTypes['Buttons']> = {
  button?: Resolver<Maybe<ResolversTypes['ActionButton']>, ParentType, ContextType>;
  contextMenu?: Resolver<Maybe<ResolversTypes['ContextMenuActions']>, ParentType, ContextType>;
};

export type CantookResolvers<ContextType = any, ParentType extends ResolversParentTypes['Cantook'] = ResolversParentTypes['Cantook']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CharacterReplacementSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['CharacterReplacementSettings'] = ResolversParentTypes['CharacterReplacementSettings']> = {
  characterToReplaceWith?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  replacementCharactersRegex?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CodeWordingResolvers<ContextType = any, ParentType extends ResolversParentTypes['CodeWording'] = ResolversParentTypes['CodeWording']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ColumnResolvers<ContextType = any, ParentType extends ResolversParentTypes['Column'] = ResolversParentTypes['Column']> = {
  elements?: Resolver<ResolversTypes['EntityViewElements'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['ColumnSizes'], ParentType, ContextType, Partial<ColumnSizeArgs>>;
};

export type ColumnListResolvers<ContextType = any, ParentType extends ResolversParentTypes['ColumnList'] = ResolversParentTypes['ColumnList']> = {
  column?: Resolver<ResolversTypes['Column'], ParentType, ContextType>;
};

export type CommentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentCreateFieldsResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommentCreateFields'] = ResolversParentTypes['CommentCreateFields']> = {
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
};

export type CommentsElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['CommentsElement'] = ResolversParentTypes['CommentsElement']> = {
  composer?: Resolver<ResolversTypes['WysiwygElement'], ParentType, ContextType>;
  createFields?: Resolver<Maybe<ResolversTypes['CommentCreateFields']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<CommentsElementLabelArgs, 'input'>>;
  parentEntityFilterKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<CommentsElementParentEntityFilterKeyArgs, 'input'>>;
  readOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type ConditionalResolvers<ContextType = any, ParentType extends ResolversParentTypes['Conditional'] = ResolversParentTypes['Conditional']> = {
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ifAnyValue?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ConfigItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigItem'] = ResolversParentTypes['ConfigItem']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
};

export type ContextResolvers<ContextType = any, ParentType extends ResolversParentTypes['Context'] = ResolversParentTypes['Context']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContextMenuActionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuActions'] = ResolversParentTypes['ContextMenuActions']> = {
  doCustomAction?: Resolver<Maybe<ResolversTypes['ContextMenuCustomAction']>, ParentType, ContextType>;
  doDownloadZipOfRelatedMediafilesAction?: Resolver<Maybe<ResolversTypes['ContextMenuDownloadZipOfRelatedMediafilesAction']>, ParentType, ContextType>;
  doElodyAction?: Resolver<Maybe<ResolversTypes['ContextMenuElodyAction']>, ParentType, ContextType>;
  doGeneralAction?: Resolver<Maybe<ResolversTypes['ContextMenuGeneralAction']>, ParentType, ContextType>;
  doLinkAction?: Resolver<Maybe<ResolversTypes['ContextMenuLinkAction']>, ParentType, ContextType>;
  doQueryAction?: Resolver<Maybe<ResolversTypes['ContextMenuQueryAction']>, ParentType, ContextType>;
};

export type ContextMenuCustomActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuCustomAction'] = ResolversParentTypes['ContextMenuCustomAction']> = {
  action?: Resolver<ResolversTypes['ContextMenuElodyActionEnum'], ParentType, ContextType, Partial<ContextMenuCustomActionActionArgs>>;
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuCustomActionCanArgs>>;
  endpointMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ContextMenuCustomActionEndpointMethodArgs>>;
  endpointUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ContextMenuCustomActionEndpointUrlArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuCustomActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuCustomActionLabelArgs>>;
};

export type ContextMenuDownloadZipOfRelatedMediafilesActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuDownloadZipOfRelatedMediafilesAction'] = ResolversParentTypes['ContextMenuDownloadZipOfRelatedMediafilesAction']> = {
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionCanArgs>>;
  endpointMethod?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionEndpointMethodArgs>>;
  endpointUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionEndpointUrlArgs>>;
  filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionFilenameArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuDownloadZipOfRelatedMediafilesActionLabelArgs>>;
};

export type ContextMenuElodyActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuElodyAction'] = ResolversParentTypes['ContextMenuElodyAction']> = {
  action?: Resolver<ResolversTypes['ContextMenuElodyActionEnum'], ParentType, ContextType, Partial<ContextMenuElodyActionActionArgs>>;
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuElodyActionCanArgs>>;
  formFlow?: Resolver<ResolversTypes['ContextMenuFormFlow'], ParentType, ContextType, Partial<ContextMenuElodyActionFormFlowArgs>>;
  formQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ContextMenuElodyActionFormQueryArgs>>;
  formTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<ContextMenuElodyActionFormTitleArgs>>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<ContextMenuElodyActionHiddenArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuElodyActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuElodyActionLabelArgs>>;
  showAsButton?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<ContextMenuElodyActionShowAsButtonArgs>>;
};

export type ContextMenuGeneralActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuGeneralAction'] = ResolversParentTypes['ContextMenuGeneralAction']> = {
  action?: Resolver<ResolversTypes['ContextMenuGeneralActionEnum'], ParentType, ContextType, Partial<ContextMenuGeneralActionActionArgs>>;
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuGeneralActionCanArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuGeneralActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuGeneralActionLabelArgs>>;
};

export type ContextMenuLinkActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuLinkAction'] = ResolversParentTypes['ContextMenuLinkAction']> = {
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuLinkActionCanArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuLinkActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuLinkActionLabelArgs>>;
};

export type ContextMenuQueryActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContextMenuQueryAction'] = ResolversParentTypes['ContextMenuQueryAction']> = {
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<ContextMenuQueryActionCanArgs>>;
  icon?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuQueryActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuQueryActionLabelArgs>>;
  query?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ContextMenuQueryActionQueryArgs>>;
  refreshAfterAction?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<ContextMenuQueryActionRefreshAfterActionArgs>>;
};

export type CopyFromParentConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['CopyFromParentConfig'] = ResolversParentTypes['CopyFromParentConfig']> = {
  autoCopy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  copyAllLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  excludeKeys?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  fromRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  keyMap?: Resolver<Maybe<Array<ResolversTypes['CopyFromParentKeyMap']>>, ParentType, ContextType>;
  keys?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  labelPrefix?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  showCopyButtons?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type CopyFromParentKeyMapResolvers<ContextType = any, ParentType extends ResolversParentTypes['CopyFromParentKeyMap'] = ResolversParentTypes['CopyFromParentKeyMap']> = {
  fromKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CopyValueFromParentIntialValuesResolvers<ContextType = any, ParentType extends ResolversParentTypes['CopyValueFromParentIntialValues'] = ResolversParentTypes['CopyValueFromParentIntialValues']> = {
  autoCopy?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  fromRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CorporationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Corporation'] = ResolversParentTypes['Corporation']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeleteQueryOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeleteQueryOptions'] = ResolversParentTypes['DeleteQueryOptions']> = {
  blockingRelationsLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsBlockingRelationsLabelArgs>>;
  customQueryBlockingEntityTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entitytyping']>>>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryBlockingEntityTypesArgs>>;
  customQueryBlockingRelations?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryBlockingRelationsArgs>>;
  customQueryBlockingRelationsFilters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryBlockingRelationsFiltersArgs>>;
  customQueryDeleteRelations?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryDeleteRelationsArgs>>;
  customQueryDeleteRelationsFilters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryDeleteRelationsFiltersArgs>>;
  customQueryEntityTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entitytyping']>>>, ParentType, ContextType, Partial<DeleteQueryOptionsCustomQueryEntityTypesArgs>>;
  deleteEntityLabel?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<DeleteQueryOptionsDeleteEntityLabelArgs, 'input'>>;
  deleteRelationsLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DeleteQueryOptionsDeleteRelationsLabelArgs>>;
};

export type DirectoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Directory'] = ResolversParentTypes['Directory']> = {
  dir?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  has_subdirs?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DisplayConditionResolvers<ContextType = any, ParentType extends ResolversParentTypes['DisplayCondition'] = ResolversParentTypes['DisplayCondition']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<DisplayConditionKeyArgs, 'input'>>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<DisplayConditionValueArgs>>;
};

export type DownloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['Download'] = ResolversParentTypes['Download']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DropdownOptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['DropdownOption'] = ResolversParentTypes['DropdownOption']> = {
  actionContext?: Resolver<Maybe<ResolversTypes['ActionContext']>, ParentType, ContextType, Partial<DropdownOptionActionContextArgs>>;
  active?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  allowCondition?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  availableInPages?: Resolver<Maybe<Array<Maybe<ResolversTypes['RouteMatching']>>>, ParentType, ContextType, Partial<DropdownOptionAvailableInPagesArgs>>;
  bulkOperationModal?: Resolver<Maybe<ResolversTypes['BulkOperationModal']>, ParentType, ContextType, Partial<DropdownOptionBulkOperationModalArgs>>;
  can?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['DamsIcons']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  primary?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  primaryFallback?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  required?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  requiresAuth?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  subOptions?: Resolver<Maybe<Array<Maybe<ResolversTypes['DropdownOption']>>>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['StringOrInt'], ParentType, ContextType>;
};

export type DropzoneEntityToCreateResolvers<ContextType = any, ParentType extends ResolversParentTypes['DropzoneEntityToCreate'] = ResolversParentTypes['DropzoneEntityToCreate']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<DropzoneEntityToCreateOptionsArgs, 'input'>>;
};

export type EasyReadingResolvers<ContextType = any, ParentType extends ResolversParentTypes['EasyReading'] = ResolversParentTypes['EasyReading']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EditMetadataButtonResolvers<ContextType = any, ParentType extends ResolversParentTypes['EditMetadataButton'] = ResolversParentTypes['EditMetadataButton']> = {
  editmodeLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasButton?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hideIfMetadataNotPresent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readmodeLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EndpointInformationResolvers<ContextType = any, ParentType extends ResolversParentTypes['EndpointInformation'] = ResolversParentTypes['EndpointInformation']> = {
  endpointName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  method?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  responseAction?: Resolver<Maybe<ResolversTypes['EndpointResponseActions']>, ParentType, ContextType>;
  variables?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
};

export type EntitiesResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntitiesResults'] = ResolversParentTypes['EntitiesResults']> = {
  count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  facets?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  limit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  results?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entity']>>>, ParentType, ContextType>;
  sortKeys?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<EntitiesResultsSortKeysArgs>>;
};

export type EntityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Entity'] = ResolversParentTypes['Entity']> = {
  __resolveType: TypeResolveFn<'Award' | 'BaseEntity' | 'Boekenbank' | 'Cantook' | 'CodeWording' | 'Comment' | 'Context' | 'Corporation' | 'Download' | 'EasyReading' | 'Expression' | 'Genre' | 'Group' | 'Home' | 'Job' | 'Language' | 'Listening' | 'Manifestation' | 'ManifestationComputerFile' | 'ManifestationFootage' | 'ManifestationMap' | 'ManifestationMixedMaterial' | 'ManifestationMusic' | 'ManifestationSerial' | 'ManifestationWord' | 'Media' | 'MediaFileEntity' | 'Muziekweb' | 'Nomen' | 'Omnibus' | 'Orienting' | 'Partner' | 'Person' | 'Place' | 'Playing' | 'Publisher' | 'Reading' | 'SavedSearch' | 'ShareLink' | 'Siso' | 'TargetAudience' | 'Tenant' | 'Time' | 'Title' | 'Token' | 'User' | 'Watching' | 'Work' | 'WorkComputerFile' | 'WorkFootage' | 'WorkMap' | 'WorkMixedMaterial' | 'WorkMusic' | 'WorkSerial' | 'WorkWord' | 'Zizo' | 'ZizoDeelrubriek' | 'ZizoDomein' | 'ZizoGroeirubriek' | 'ZizoHoofdrubriek' | 'ZizoKast' | 'ZizoPlank' | 'ZizoRug', ParentType, ContextType>;
};

export type EntityButtonConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityButtonConfig'] = ResolversParentTypes['EntityButtonConfig']> = {
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mutation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  style?: Resolver<Maybe<ResolversTypes['EntityButtonStyle']>, ParentType, ContextType>;
};

export type EntityButtonStyleResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityButtonStyle'] = ResolversParentTypes['EntityButtonStyle']> = {
  background?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EntityListElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityListElement'] = ResolversParentTypes['EntityListElement']> = {
  actionsOnResult?: Resolver<Maybe<ResolversTypes['ActionsOnResult']>, ParentType, ContextType>;
  addEntitiesToForms?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<EntityListElementAddEntitiesToFormsArgs>>;
  baseLibraryMode?: Resolver<Maybe<ResolversTypes['BaseLibraryModes']>, ParentType, ContextType, Partial<EntityListElementBaseLibraryModeArgs>>;
  can?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType, Partial<EntityListElementCanArgs>>;
  cropMediafileCoordinatesKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCropMediafileCoordinatesKeyArgs>>;
  customBulkOperations?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomBulkOperationsArgs>>;
  customQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomQueryArgs>>;
  customQueryEntityPickerList?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomQueryEntityPickerListArgs>>;
  customQueryEntityPickerListFilters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomQueryEntityPickerListFiltersArgs>>;
  customQueryFilters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomQueryFiltersArgs>>;
  customQueryRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementCustomQueryRelationTypeArgs>>;
  disableLibraryBar?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<EntityListElementDisableLibraryBarArgs>>;
  displayCondition?: Resolver<Maybe<ResolversTypes['DisplayCondition']>, ParentType, ContextType>;
  enableAdvancedFilters?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<EntityListElementEnableAdvancedFiltersArgs>>;
  enableNavigation?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<EntityListElementEnableNavigationArgs>>;
  entityList?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entity']>>>, ParentType, ContextType, Partial<EntityListElementEntityListArgs>>;
  entityListElement?: Resolver<Maybe<ResolversTypes['EntityListElement']>, ParentType, ContextType>;
  entityTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entitytyping']>>>, ParentType, ContextType, Partial<EntityListElementEntityTypesArgs>>;
  fetchDeepRelations?: Resolver<Maybe<ResolversTypes['FetchDeepRelations']>, ParentType, ContextType>;
  filtersNeedContext?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntitySubelement']>>>, ParentType, ContextType, Partial<EntityListElementFiltersNeedContextArgs>>;
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<EntityListElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementLabelArgs>>;
  relationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementRelationTypeArgs>>;
  searchInputType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementSearchInputTypeArgs>>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<EntityListElementTypeArgs>>;
  viewMode?: Resolver<Maybe<ResolversTypes['EntityListViewMode']>, ParentType, ContextType, Partial<EntityListElementViewModeArgs>>;
};

export type EntityPickerSearchConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityPickerSearchConfig'] = ResolversParentTypes['EntityPickerSearchConfig']> = {
  acceptedTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  metadataKeys?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  mode?: Resolver<Maybe<ResolversTypes['EntityPickerSearchMode']>, ParentType, ContextType>;
  staticFilters?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
};

export type EntityViewElementsResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityViewElements'] = ResolversParentTypes['EntityViewElements']> = {
  actionElement?: Resolver<Maybe<ResolversTypes['ActionElement']>, ParentType, ContextType>;
  commentsElement?: Resolver<Maybe<ResolversTypes['CommentsElement']>, ParentType, ContextType>;
  entityListElement?: Resolver<Maybe<ResolversTypes['EntityListElement']>, ParentType, ContextType>;
  entityViewerElement?: Resolver<Maybe<ResolversTypes['EntityViewerElement']>, ParentType, ContextType>;
  graphElement?: Resolver<Maybe<ResolversTypes['GraphElement']>, ParentType, ContextType>;
  hierarchyListElement?: Resolver<Maybe<ResolversTypes['HierarchyListElement']>, ParentType, ContextType>;
  manifestViewerElement?: Resolver<Maybe<ResolversTypes['ManifestViewerElement']>, ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  markdownViewerElement?: Resolver<Maybe<ResolversTypes['MarkdownViewerElement']>, ParentType, ContextType>;
  mediaFileElement?: Resolver<Maybe<ResolversTypes['MediaFileElement']>, ParentType, ContextType>;
  singleMediaFileElement?: Resolver<Maybe<ResolversTypes['SingleMediaFileElement']>, ParentType, ContextType>;
  windowElement?: Resolver<Maybe<ResolversTypes['WindowElement']>, ParentType, ContextType>;
  wysiwygElement?: Resolver<Maybe<ResolversTypes['WysiwygElement']>, ParentType, ContextType>;
};

export type EntityViewerElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityViewerElement'] = ResolversParentTypes['EntityViewerElement']> = {
  entityId?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<EntityViewerElementEntityIdArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<EntityViewerElementLabelArgs>>;
};

export type ExpandButtonOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExpandButtonOptions'] = ResolversParentTypes['ExpandButtonOptions']> = {
  orientation?: Resolver<Maybe<ResolversTypes['Orientations']>, ParentType, ContextType, Partial<ExpandButtonOptionsOrientationArgs>>;
  shown?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ExpandButtonOptionsShownArgs, 'input'>>;
};

export type ExpressionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Expression'] = ResolversParentTypes['Expression']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FacetInputTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['FacetInputType'] = ResolversParentTypes['FacetInputType']> = {
  facets?: Resolver<Maybe<Array<ResolversTypes['FacetInputType']>>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lookups?: Resolver<Maybe<Array<ResolversTypes['LookupInputType']>>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['AdvancedFilterTypes']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
};

export type FetchDeepRelationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['FetchDeepRelations'] = ResolversParentTypes['FetchDeepRelations']> = {
  amountOfRecursions?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, Partial<FetchDeepRelationsAmountOfRecursionsArgs>>;
  deepRelationsFetchStrategy?: Resolver<Maybe<ResolversTypes['DeepRelationsFetchStrategy']>, ParentType, ContextType, Partial<FetchDeepRelationsDeepRelationsFetchStrategyArgs>>;
  entityTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entitytyping']>>>, ParentType, ContextType, Partial<FetchDeepRelationsEntityTypesArgs>>;
  routeConfig?: Resolver<Maybe<Array<Maybe<ResolversTypes['BreadCrumbRoute']>>>, ParentType, ContextType, Partial<FetchDeepRelationsRouteConfigArgs>>;
};

export type FileProgressResolvers<ContextType = any, ParentType extends ResolversParentTypes['FileProgress'] = ResolversParentTypes['FileProgress']> = {
  steps?: Resolver<Maybe<Array<Maybe<ResolversTypes['FileProgressStep']>>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ActionProgressIndicatorType'], ParentType, ContextType>;
};

export type FileProgressStepResolvers<ContextType = any, ParentType extends ResolversParentTypes['FileProgressStep'] = ResolversParentTypes['FileProgressStep']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ProgressStepStatus'], ParentType, ContextType>;
  stepType?: Resolver<ResolversTypes['ProgressStepType'], ParentType, ContextType>;
};

export type FilterMatchersResolvers<ContextType = any, ParentType extends ResolversParentTypes['FilterMatchers'] = ResolversParentTypes['FilterMatchers']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  matchers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type FilterOptionsMappingTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['FilterOptionsMappingType'] = ResolversParentTypes['FilterOptionsMappingType']> = {
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type FormResolvers<ContextType = any, ParentType extends ResolversParentTypes['Form'] = ResolversParentTypes['Form']> = {
  copyFromParent?: Resolver<ResolversTypes['CopyFromParentConfig'], ParentType, ContextType, RequireFields<FormCopyFromParentArgs, 'input'>>;
  formTab?: Resolver<ResolversTypes['FormTab'], ParentType, ContextType>;
  infoLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<FormInfoLabelArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<FormLabelArgs>>;
  modalStyle?: Resolver<ResolversTypes['ModalStyle'], ParentType, ContextType, RequireFields<FormModalStyleArgs, 'input'>>;
};

export type FormActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['FormAction'] = ResolversParentTypes['FormAction']> = {
  actionProgressIndicator?: Resolver<Maybe<ResolversTypes['ActionProgress']>, ParentType, ContextType>;
  actionQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<FormActionActionQueryArgs>>;
  actionType?: Resolver<Maybe<ResolversTypes['ActionType']>, ParentType, ContextType, Partial<FormActionActionTypeArgs>>;
  creationType?: Resolver<ResolversTypes['Entitytyping'], ParentType, ContextType, Partial<FormActionCreationTypeArgs>>;
  endpointInformation?: Resolver<ResolversTypes['EndpointInformation'], ParentType, ContextType, RequireFields<FormActionEndpointInformationArgs, 'input'>>;
  icon?: Resolver<Maybe<ResolversTypes['DamsIcons']>, ParentType, ContextType, Partial<FormActionIconArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<FormActionLabelArgs, 'input'>>;
  showsFormErrors?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<FormActionShowsFormErrorsArgs>>;
};

export type FormFieldsResolvers<ContextType = any, ParentType extends ResolversParentTypes['FormFields'] = ResolversParentTypes['FormFields']> = {
  action?: Resolver<Maybe<ResolversTypes['FormAction']>, ParentType, ContextType>;
  formSection?: Resolver<Maybe<ResolversTypes['FormSection']>, ParentType, ContextType>;
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
  uploadContainer?: Resolver<Maybe<ResolversTypes['UploadContainer']>, ParentType, ContextType>;
};

export type FormSectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['FormSection'] = ResolversParentTypes['FormSection']> = {
  formFields?: Resolver<ResolversTypes['FormFields'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<FormSectionLabelArgs>>;
};

export type FormTabResolvers<ContextType = any, ParentType extends ResolversParentTypes['FormTab'] = ResolversParentTypes['FormTab']> = {
  copyFromParent?: Resolver<ResolversTypes['CopyFromParentConfig'], ParentType, ContextType, RequireFields<FormTabCopyFromParentArgs, 'input'>>;
  formFields?: Resolver<ResolversTypes['FormFields'], ParentType, ContextType>;
  formKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<FormTabFormKeyArgs>>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<FormTabLabelArgs>>;
  relationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<FormTabRelationTypeArgs>>;
};

export type FormattersResolvers<ContextType = any, ParentType extends ResolversParentTypes['Formatters'] = ResolversParentTypes['Formatters']> = {
  __resolveType: TypeResolveFn<'LinkFormatter' | 'PillFormatter' | 'RegexpMatchFormatter', ParentType, ContextType>;
};

export type GenreResolvers<ContextType = any, ParentType extends ResolversParentTypes['Genre'] = ResolversParentTypes['Genre']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GeoJsonFeatureResolvers<ContextType = any, ParentType extends ResolversParentTypes['GeoJsonFeature'] = ResolversParentTypes['GeoJsonFeature']> = {
  value?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<GeoJsonFeatureValueArgs, 'coordinates' | 'id' | 'weight'>>;
};

export type GraphDatasetResolvers<ContextType = any, ParentType extends ResolversParentTypes['GraphDataset'] = ResolversParentTypes['GraphDataset']> = {
  filter?: Resolver<Maybe<ResolversTypes['GraphDatasetFilter']>, ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type GraphDatasetFilterResolvers<ContextType = any, ParentType extends ResolversParentTypes['GraphDatasetFilter'] = ResolversParentTypes['GraphDatasetFilter']> = {
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  values?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
};

export type GraphElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['GraphElement'] = ResolversParentTypes['GraphElement']> = {
  convert_to?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<GraphElementConvert_ToArgs, 'input'>>;
  datapoints?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<GraphElementDatapointsArgs, 'input'>>;
  dataset?: Resolver<ResolversTypes['GraphDataset'], ParentType, ContextType, RequireFields<GraphElementDatasetArgs, 'input'>>;
  datasource?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<GraphElementDatasourceArgs, 'input'>>;
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GraphElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<GraphElementLabelArgs>>;
  timeUnit?: Resolver<ResolversTypes['TimeUnit'], ParentType, ContextType, RequireFields<GraphElementTimeUnitArgs, 'input'>>;
  type?: Resolver<ResolversTypes['GraphType'], ParentType, ContextType, RequireFields<GraphElementTypeArgs, 'input'>>;
};

export type GroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['Group'] = ResolversParentTypes['Group']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HiddenFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['HiddenField'] = ResolversParentTypes['HiddenField']> = {
  entityType?: Resolver<Maybe<ResolversTypes['Entitytyping']>, ParentType, ContextType>;
  hidden?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  inherited?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  keyToExtractValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  relationToExtractKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  searchValueForFilter?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type HierarchyListElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['HierarchyListElement'] = ResolversParentTypes['HierarchyListElement']> = {
  can?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, Partial<HierarchyListElementCanArgs>>;
  centerCoordinatesKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<HierarchyListElementCenterCoordinatesKeyArgs, 'input'>>;
  customQuery?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<HierarchyListElementCustomQueryArgs>>;
  entityTypeAsCenterPoint?: Resolver<Maybe<ResolversTypes['Entitytyping']>, ParentType, ContextType, Partial<HierarchyListElementEntityTypeAsCenterPointArgs>>;
  hierarchyRelationList?: Resolver<Array<Maybe<ResolversTypes['HierarchyRelationList']>>, ParentType, ContextType, Partial<HierarchyListElementHierarchyRelationListArgs>>;
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<HierarchyListElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<HierarchyListElementLabelArgs>>;
};

export type HierarchyRelationListResolvers<ContextType = any, ParentType extends ResolversParentTypes['HierarchyRelationList'] = ResolversParentTypes['HierarchyRelationList']> = {
  entityType?: Resolver<ResolversTypes['Entitytyping'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type HomeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Home'] = ResolversParentTypes['Home']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ImportReturnResolvers<ContextType = any, ParentType extends ResolversParentTypes['ImportReturn'] = ResolversParentTypes['ImportReturn']> = {
  count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  job_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type InfoPanelResolvers<ContextType = any, ParentType extends ResolversParentTypes['InfoPanel'] = ResolversParentTypes['InfoPanel']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type InlineTriggerResolvers<ContextType = any, ParentType extends ResolversParentTypes['InlineTrigger'] = ResolversParentTypes['InlineTrigger']> = {
  character?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  minCharacters?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type InputFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['InputField'] = ResolversParentTypes['InputField']> = {
  advancedFilterInputForRetrievingAllOptions?: Resolver<Maybe<Array<ResolversTypes['AdvancedFilterInputType']>>, ParentType, ContextType>;
  advancedFilterInputForRetrievingOptions?: Resolver<Maybe<Array<ResolversTypes['AdvancedFilterInputType']>>, ParentType, ContextType>;
  advancedFilterInputForRetrievingRelatedOptions?: Resolver<Maybe<Array<ResolversTypes['AdvancedFilterInputType']>>, ParentType, ContextType>;
  advancedFilterInputForSearchingOptions?: Resolver<Maybe<ResolversTypes['AdvancedFilterInputType']>, ParentType, ContextType>;
  autoAllSelectable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  autoSelectable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  canCreateEntityFromOption?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  deferEntityCreation?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  dependsOn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  disabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  entityPickerSearchConfig?: Resolver<Maybe<ResolversTypes['EntityPickerSearchConfig']>, ParentType, ContextType, Partial<InputFieldEntityPickerSearchConfigArgs>>;
  entityType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fieldKeyToSave?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<InputFieldFieldKeyToSaveArgs>>;
  fieldName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<InputFieldFieldNameArgs>>;
  fileProgressSteps?: Resolver<Maybe<ResolversTypes['FileProgress']>, ParentType, ContextType>;
  fileTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['FileType']>>>, ParentType, ContextType>;
  fromRelationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasVirtualKeyboard?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isMetadataField?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<InputFieldIsMetadataFieldArgs>>;
  lineClamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  maxAmountOfFiles?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  maxFileSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadataKeyToCreateEntityFromOption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadataOnRelationFieldConfig?: Resolver<Maybe<ResolversTypes['MetadataOnRelationFieldConfig']>, ParentType, ContextType>;
  multiple?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  options?: Resolver<Maybe<Array<Maybe<ResolversTypes['DropdownOption']>>>, ParentType, ContextType>;
  optionsOrderByKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readOnlyValueAsPlainText?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  relationFilter?: Resolver<Maybe<ResolversTypes['AdvancedFilterInputType']>, ParentType, ContextType>;
  relationType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resolveOptionsFilterOnModalParent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  subFields?: Resolver<Maybe<Array<Maybe<ResolversTypes['SubField']>>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadMultiple?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  validation?: Resolver<Maybe<ResolversTypes['Validation']>, ParentType, ContextType, Partial<InputFieldValidationArgs>>;
  virtualKeyboardConfig?: Resolver<Maybe<ResolversTypes['VirtualKeyboardConfig']>, ParentType, ContextType, Partial<InputFieldVirtualKeyboardConfigArgs>>;
  visibleIf?: Resolver<Maybe<ResolversTypes['VisibleIf']>, ParentType, ContextType, Partial<InputFieldVisibleIfArgs>>;
};

export type IntialValuesResolvers<ContextType = any, ParentType extends ResolversParentTypes['IntialValues'] = ResolversParentTypes['IntialValues']> = {
  canDelete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canUpdate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  keyLabel?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<IntialValuesKeyLabelArgs, 'key' | 'source'>>;
  keyValue?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<IntialValuesKeyValueArgs, 'key' | 'source'>>;
  lockedProperties?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  relationMetadata?: Resolver<Maybe<ResolversTypes['IntialValues']>, ParentType, ContextType, RequireFields<IntialValuesRelationMetadataArgs, 'type'>>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JobResolvers<ContextType = any, ParentType extends ResolversParentTypes['Job'] = ResolversParentTypes['Job']> = {
  _id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  _key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  _rev?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  amount_of_jobs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  asset_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  completed_jobs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  end_time?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  job_info?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  job_type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  mediafile_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  parent_job_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  start_time?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sub_jobs?: Resolver<Maybe<ResolversTypes['SubJobResults']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobPollResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['JobPollResult'] = ResolversParentTypes['JobPollResult']> = {
  hasJob?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  info?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  jobId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type JobsResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['JobsResults'] = ResolversParentTypes['JobsResults']> = {
  count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  limit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  next?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  results?: Resolver<Maybe<Array<Maybe<ResolversTypes['Job']>>>, ParentType, ContextType>;
};

export type KeyAndValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['KeyAndValue'] = ResolversParentTypes['KeyAndValue']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type KeyValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['KeyValue'] = ResolversParentTypes['KeyValue']> = {
  keyValue?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<KeyValueKeyValueArgs, 'key'>>;
};

export type LanguageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Language'] = ResolversParentTypes['Language']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LinkFormatterResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkFormatter'] = ResolversParentTypes['LinkFormatter']> = {
  background?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  customLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['DamsIcons']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  openInNewTab?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ListeningResolvers<ContextType = any, ParentType extends ResolversParentTypes['Listening'] = ResolversParentTypes['Listening']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LookupInputTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['LookupInputType'] = ResolversParentTypes['LookupInputType']> = {
  as?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  foreign_field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  local_field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolve_to_source_ids?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type ManifestViewerElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestViewerElement'] = ResolversParentTypes['ManifestViewerElement']> = {
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<ManifestViewerElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<ManifestViewerElementLabelArgs>>;
  manifestUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<ManifestViewerElementManifestUrlArgs, 'metadataKey'>>;
  manifestVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<ManifestViewerElementManifestVersionArgs, 'metadataKey'>>;
};

export type ManifestationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Manifestation'] = ResolversParentTypes['Manifestation']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationComputerFileResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationComputerFile'] = ResolversParentTypes['ManifestationComputerFile']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationFootageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationFootage'] = ResolversParentTypes['ManifestationFootage']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationMapResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationMap'] = ResolversParentTypes['ManifestationMap']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationMixedMaterialResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationMixedMaterial'] = ResolversParentTypes['ManifestationMixedMaterial']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationMusicResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationMusic'] = ResolversParentTypes['ManifestationMusic']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationSerialResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationSerial'] = ResolversParentTypes['ManifestationSerial']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManifestationWordResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManifestationWord'] = ResolversParentTypes['ManifestationWord']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MapElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapElement'] = ResolversParentTypes['MapElement']> = {
  center?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MapElementCenterArgs>>;
  config?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigItem']>>>, ParentType, ContextType, Partial<MapElementConfigArgs>>;
  geoJsonFeature?: Resolver<Maybe<ResolversTypes['GeoJsonFeature']>, ParentType, ContextType>;
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MapElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MapElementLabelArgs>>;
  mapFeatureMetadata?: Resolver<Maybe<ResolversTypes['MapFeatureMetadata']>, ParentType, ContextType>;
  mapMetadata?: Resolver<Maybe<ResolversTypes['MapMetadata']>, ParentType, ContextType>;
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MapElementTypeArgs>>;
};

export type MapFeatureMetadataResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapFeatureMetadata'] = ResolversParentTypes['MapFeatureMetadata']> = {
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
};

export type MapMetadataResolvers<ContextType = any, ParentType extends ResolversParentTypes['MapMetadata'] = ResolversParentTypes['MapMetadata']> = {
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<MapMetadataValueArgs, 'key' | 'source'>>;
};

export type MarkdownViewerElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['MarkdownViewerElement'] = ResolversParentTypes['MarkdownViewerElement']> = {
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MarkdownViewerElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MarkdownViewerElementLabelArgs>>;
  markdownContent?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MarkdownViewerElementMarkdownContentArgs, 'metadataKey'>>;
};

export type MatchMetadataValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['MatchMetadataValue'] = ResolversParentTypes['MatchMetadataValue']> = {
  matchKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matchValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MatcherLabelTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MatcherLabelType'] = ResolversParentTypes['MatcherLabelType']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  matcher?: Resolver<ResolversTypes['Matchers'], ParentType, ContextType>;
};

export type MediaResolvers<ContextType = any, ParentType extends ResolversParentTypes['Media'] = ResolversParentTypes['Media']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaFileResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaFile'] = ResolversParentTypes['MediaFile']> = {
  _id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entities?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isPublic?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  is_primary?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  is_primary_thumbnail?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<Array<Maybe<ResolversTypes['MediaFileMetadata']>>>, ParentType, ContextType>;
  mimetype?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  original_file_location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  thumbnail_file_location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  transcode_filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MediaFileElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaFileElement'] = ResolversParentTypes['MediaFileElement']> = {
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MediaFileElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MediaFileElementLabelArgs>>;
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<MediaFileElementTypeArgs>>;
};

export type MediaFileEntityResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaFileEntity'] = ResolversParentTypes['MediaFileEntity']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MediaFileMetadataResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaFileMetadata'] = ResolversParentTypes['MediaFileMetadata']> = {
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MediaFilePostReturnResolvers<ContextType = any, ParentType extends ResolversParentTypes['MediaFilePostReturn'] = ResolversParentTypes['MediaFilePostReturn']> = {
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MenuResolvers<ContextType = any, ParentType extends ResolversParentTypes['Menu'] = ResolversParentTypes['Menu']> = {
  menuItem?: Resolver<Maybe<ResolversTypes['MenuItem']>, ParentType, ContextType, RequireFields<MenuMenuItemArgs, 'label'>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MenuItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['MenuItem'] = ResolversParentTypes['MenuItem']> = {
  can?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  entityType?: Resolver<Maybe<ResolversTypes['Entitytyping']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['MenuIcons']>, ParentType, ContextType>;
  isLoggedIn?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requiresAuth?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  subMenu?: Resolver<Maybe<ResolversTypes['Menu']>, ParentType, ContextType, RequireFields<MenuItemSubMenuArgs, 'name'>>;
  typeLink?: Resolver<Maybe<ResolversTypes['MenuTypeLink']>, ParentType, ContextType>;
};

export type MenuTypeLinkResolvers<ContextType = any, ParentType extends ResolversParentTypes['MenuTypeLink'] = ResolversParentTypes['MenuTypeLink']> = {
  modal?: Resolver<Maybe<ResolversTypes['MenuTypeLinkModal']>, ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['MenuTypeLinkRoute']>, ParentType, ContextType>;
};

export type MenuTypeLinkModalResolvers<ContextType = any, ParentType extends ResolversParentTypes['MenuTypeLinkModal'] = ResolversParentTypes['MenuTypeLinkModal']> = {
  askForCloseConfirmation?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  formQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  neededPermission?: Resolver<Maybe<ResolversTypes['Permission']>, ParentType, ContextType>;
  typeModal?: Resolver<ResolversTypes['TypeModals'], ParentType, ContextType>;
};

export type MenuTypeLinkRouteResolvers<ContextType = any, ParentType extends ResolversParentTypes['MenuTypeLinkRoute'] = ResolversParentTypes['MenuTypeLinkRoute']> = {
  destination?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MenuWrapperResolvers<ContextType = any, ParentType extends ResolversParentTypes['MenuWrapper'] = ResolversParentTypes['MenuWrapper']> = {
  menu?: Resolver<ResolversTypes['Menu'], ParentType, ContextType>;
};

export type MergeEvaluationResolvers<ContextType = any, ParentType extends ResolversParentTypes['MergeEvaluation'] = ResolversParentTypes['MergeEvaluation']> = {
  details?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  immutableFields?: Resolver<Array<ResolversTypes['MergeImmutableField']>, ParentType, ContextType>;
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['MergeEvaluationStatus'], ParentType, ContextType>;
  strategy?: Resolver<ResolversTypes['MergeSurvivorStrategy'], ParentType, ContextType>;
};

export type MergeImmutableFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['MergeImmutableField'] = ResolversParentTypes['MergeImmutableField']> = {
  identityValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MergePreviewResolvers<ContextType = any, ParentType extends ResolversParentTypes['MergePreview'] = ResolversParentTypes['MergePreview']> = {
  inboundReferenceCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MergeSurvivorSuggestionConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['MergeSurvivorSuggestionConfig'] = ResolversParentTypes['MergeSurvivorSuggestionConfig']> = {
  autoSelect?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hiddenVerdicts?: Resolver<Maybe<Array<ResolversTypes['MergeEvaluationStatus']>>, ParentType, ContextType>;
  requireRecommendedSurvivor?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  strategy?: Resolver<ResolversTypes['MergeSurvivorStrategy'], ParentType, ContextType>;
};

export type MetadataResolvers<ContextType = any, ParentType extends ResolversParentTypes['Metadata'] = ResolversParentTypes['Metadata']> = {
  immutable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lang?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['Unit']>, ParentType, ContextType, Partial<MetadataUnitArgs>>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MetadataAndRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataAndRelation'] = ResolversParentTypes['MetadataAndRelation']> = {
  __resolveType: TypeResolveFn<'Metadata' | 'MetadataRelation', ParentType, ContextType>;
};

export type MetadataFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataField'] = ResolversParentTypes['MetadataField']> = {
  active?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  config_key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  options?: Resolver<Maybe<Array<Maybe<ResolversTypes['MetadataFieldOption']>>>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['InputFieldTypes'], ParentType, ContextType>;
};

export type MetadataFieldOptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataFieldOption'] = ResolversParentTypes['MetadataFieldOption']> = {
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MetadataOnRelationFieldConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataOnRelationFieldConfig'] = ResolversParentTypes['MetadataOnRelationFieldConfig']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MetadataRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['MetadataRelation'] = ResolversParentTypes['MetadataRelation']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  linkedEntity?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType>;
  metadataOnRelation?: Resolver<Maybe<Array<Maybe<ResolversTypes['KeyAndValue']>>>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MinMaxAmountOfRelationsValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['MinMaxAmountOfRelationsValidation'] = ResolversParentTypes['MinMaxAmountOfRelationsValidation']> = {
  max?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  CreateEntity?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<MutationCreateEntityArgs, 'entity'>>;
  addEntityRelations?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationAddEntityRelationsArgs, 'collection' | 'id' | 'relations'>>;
  bulkAddRelations?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationBulkAddRelationsArgs, 'entityIds' | 'relationEntityId' | 'relationType'>>;
  bulkDeleteEntities?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationBulkDeleteEntitiesArgs, 'ids' | 'path'>>;
  bulkEditEntities?: Resolver<ResolversTypes['BulkEditResult'], ParentType, ContextType, RequireFields<MutationBulkEditEntitiesArgs, 'ids' | 'metadata' | 'relationsToAdd' | 'relationsToRemove' | 'relationsToReplace'>>;
  bulkUpdateEntitiesWithJson?: Resolver<ResolversTypes['BulkEditResult'], ParentType, ContextType, RequireFields<MutationBulkUpdateEntitiesWithJsonArgs, 'documents'>>;
  deleteData?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationDeleteDataArgs, 'deleteMediafiles' | 'id' | 'path'>>;
  generateTranscode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationGenerateTranscodeArgs, 'mediafileIds' | 'transcodeType'>>;
  getAssetsRelationedWithMediafFile?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entity']>>>, ParentType, ContextType, RequireFields<MutationGetAssetsRelationedWithMediafFileArgs, 'mediaFileId'>>;
  getMediaRelationedWithMediafFile?: Resolver<Maybe<Array<Maybe<ResolversTypes['Media']>>>, ParentType, ContextType, RequireFields<MutationGetMediaRelationedWithMediafFileArgs, 'mediaFileId'>>;
  linkMediafileToEntity?: Resolver<Maybe<ResolversTypes['MediaFile']>, ParentType, ContextType, RequireFields<MutationLinkMediafileToEntityArgs, 'entityId' | 'mediaFileInput'>>;
  mergeEntities?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<MutationMergeEntitiesArgs, 'collection' | 'formInput' | 'survivorId' | 'victimId'>>;
  mutateEntityValues?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<MutationMutateEntityValuesArgs, 'collection' | 'formInput' | 'id'>>;
  patchMediaFileMetadata?: Resolver<Maybe<ResolversTypes['MediaFile']>, ParentType, ContextType, RequireFields<MutationPatchMediaFileMetadataArgs, 'MediaFileMetadata' | 'MediafileId'>>;
  postStartImport?: Resolver<Maybe<ResolversTypes['ImportReturn']>, ParentType, ContextType, RequireFields<MutationPostStartImportArgs, 'folder'>>;
  setPrimaryMediafile?: Resolver<ResolversTypes['Entity'], ParentType, ContextType, RequireFields<MutationSetPrimaryMediafileArgs, 'entityId' | 'mediafileId'>>;
  setPrimaryThumbnail?: Resolver<ResolversTypes['Entity'], ParentType, ContextType, RequireFields<MutationSetPrimaryThumbnailArgs, 'entityId' | 'mediafileId'>>;
  updateMetadataWithCsv?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationUpdateMetadataWithCsvArgs, 'csv' | 'entityType'>>;
};

export type MuziekwebResolvers<ContextType = any, ParentType extends ResolversParentTypes['Muziekweb'] = ResolversParentTypes['Muziekweb']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NomenResolvers<ContextType = any, ParentType extends ResolversParentTypes['Nomen'] = ResolversParentTypes['Nomen']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OmnibusResolvers<ContextType = any, ParentType extends ResolversParentTypes['Omnibus'] = ResolversParentTypes['Omnibus']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrientingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Orienting'] = ResolversParentTypes['Orienting']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginationLimitOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaginationLimitOptions'] = ResolversParentTypes['PaginationLimitOptions']> = {
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<PaginationLimitOptionsOptionsArgs, 'input'>>;
};

export type PanelHeaderContentResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelHeaderContent'] = ResolversParentTypes['PanelHeaderContent']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  libraryData?: Resolver<Maybe<ResolversTypes['PanelLibraryData']>, ParentType, ContextType>;
  panelStatus?: Resolver<Maybe<ResolversTypes['PanelStatus']>, ParentType, ContextType>;
};

export type PanelInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelInfo'] = ResolversParentTypes['PanelInfo']> = {
  inputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType, RequireFields<PanelInfoInputFieldArgs, 'type'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelInfoLabelArgs, 'input'>>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelInfoValueArgs, 'input'>>;
};

export type PanelLibraryDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelLibraryData'] = ResolversParentTypes['PanelLibraryData']> = {
  dataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  queryName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PanelLinkResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelLink'] = ResolversParentTypes['PanelLink']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelLinkKeyArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelLinkLabelArgs, 'input'>>;
  linkIcon?: Resolver<Maybe<ResolversTypes['DamsIcons']>, ParentType, ContextType, RequireFields<PanelLinkLinkIconArgs, 'input'>>;
  linkText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelLinkLinkTextArgs, 'input'>>;
};

export type PanelMetaDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelMetaData'] = ResolversParentTypes['PanelMetaData']> = {
  colSpan?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<PanelMetaDataColSpanArgs>>;
  copyToClipboard?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataCopyToClipboardArgs>>;
  copyValueFromParent?: Resolver<ResolversTypes['CopyValueFromParentIntialValues'], ParentType, ContextType, RequireFields<PanelMetaDataCopyValueFromParentArgs, 'input'>>;
  customValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataCustomValueArgs>>;
  defaultValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataDefaultValueArgs>>;
  disabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataDisabledArgs>>;
  hiddenField?: Resolver<Maybe<ResolversTypes['HiddenField']>, ParentType, ContextType, RequireFields<PanelMetaDataHiddenFieldArgs, 'input'>>;
  highlightIfPrimaryMediafile?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataHighlightIfPrimaryMediafileArgs>>;
  highlightIfPrimaryThumbnail?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataHighlightIfPrimaryThumbnailArgs>>;
  infoPanel?: Resolver<Maybe<ResolversTypes['InfoPanel']>, ParentType, ContextType, Partial<PanelMetaDataInfoPanelArgs>>;
  inputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType, RequireFields<PanelMetaDataInputFieldArgs, 'type'>>;
  isMultilingual?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataIsMultilingualArgs>>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelMetaDataKeyArgs, 'input'>>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataLabelArgs>>;
  languageIn?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType, Partial<PanelMetaDataLanguageInArgs>>;
  lineClamp?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<PanelMetaDataLineClampArgs>>;
  linkText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelMetaDataLinkTextArgs, 'input'>>;
  lockedTooltip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataLockedTooltipArgs>>;
  masked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataMaskedArgs>>;
  nonEditableField?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataNonEditableFieldArgs>>;
  onlyForEntityTypes?: Resolver<Maybe<Array<ResolversTypes['Entitytyping']>>, ParentType, ContextType, Partial<PanelMetaDataOnlyForEntityTypesArgs>>;
  permitted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataPermittedArgs>>;
  readOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataReadOnlyArgs>>;
  repetitionConfig?: Resolver<Maybe<ResolversTypes['RepetitionConfig']>, ParentType, ContextType, Partial<PanelMetaDataRepetitionConfigArgs>>;
  revealQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataRevealQueryArgs>>;
  showOnlyInEditMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelMetaDataShowOnlyInEditModeArgs>>;
  tooltip?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelMetaDataTooltipArgs, 'input'>>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType, RequireFields<PanelMetaDataUnitArgs, 'input'>>;
  valueTooltip?: Resolver<Maybe<ResolversTypes['PanelMetadataValueTooltip']>, ParentType, ContextType, Partial<PanelMetaDataValueTooltipArgs>>;
  valueTranslationKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelMetaDataValueTranslationKeyArgs>>;
};

export type PanelMetadataValueTooltipResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelMetadataValueTooltip'] = ResolversParentTypes['PanelMetadataValueTooltip']> = {
  type?: Resolver<ResolversTypes['PanelMetadataValueTooltipTypes'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PanelRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelRelation'] = ResolversParentTypes['PanelRelation']> = {
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PanelRelationMetaDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelRelationMetaData'] = ResolversParentTypes['PanelRelationMetaData']> = {
  colSpan?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<PanelRelationMetaDataColSpanArgs>>;
  infoPanel?: Resolver<Maybe<ResolversTypes['InfoPanel']>, ParentType, ContextType, Partial<PanelRelationMetaDataInfoPanelArgs>>;
  inputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType, RequireFields<PanelRelationMetaDataInputFieldArgs, 'type'>>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelRelationMetaDataKeyArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelRelationMetaDataLabelArgs, 'input'>>;
  linkText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelRelationMetaDataLinkTextArgs, 'input'>>;
  showOnlyInEditMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelRelationMetaDataShowOnlyInEditModeArgs>>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType, RequireFields<PanelRelationMetaDataUnitArgs, 'input'>>;
};

export type PanelRelationRootDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelRelationRootData'] = ResolversParentTypes['PanelRelationRootData']> = {
  colSpan?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<PanelRelationRootDataColSpanArgs>>;
  infoPanel?: Resolver<Maybe<ResolversTypes['InfoPanel']>, ParentType, ContextType, Partial<PanelRelationRootDataInfoPanelArgs>>;
  inputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType, RequireFields<PanelRelationRootDataInputFieldArgs, 'type'>>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelRelationRootDataKeyArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<PanelRelationRootDataLabelArgs, 'input'>>;
  linkText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelRelationRootDataLinkTextArgs, 'input'>>;
  showOnlyInEditMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PanelRelationRootDataShowOnlyInEditModeArgs>>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType, RequireFields<PanelRelationRootDataUnitArgs, 'input'>>;
};

export type PanelStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelStatus'] = ResolversParentTypes['PanelStatus']> = {
  statusInputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType>;
  statusMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PanelThumbnailResolvers<ContextType = any, ParentType extends ResolversParentTypes['PanelThumbnail'] = ResolversParentTypes['PanelThumbnail']> = {
  customUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelThumbnailCustomUrlArgs, 'input'>>;
  filename?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PanelThumbnailFilenameArgs>>;
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, RequireFields<PanelThumbnailHeightArgs, 'input'>>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<PanelThumbnailKeyArgs, 'input'>>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, RequireFields<PanelThumbnailWidthArgs, 'input'>>;
};

export type PartnerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Partner'] = ResolversParentTypes['Partner']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PermissionMappingResolvers<ContextType = any, ParentType extends ResolversParentTypes['PermissionMapping'] = ResolversParentTypes['PermissionMapping']> = {
  hasPermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  permission?: Resolver<ResolversTypes['Permission'], ParentType, ContextType>;
};

export type PermissionRequestInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PermissionRequestInfo'] = ResolversParentTypes['PermissionRequestInfo']> = {
  body?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  crud?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  datasource?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PermissionResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['PermissionResult'] = ResolversParentTypes['PermissionResult']> = {
  hasPermission?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  permission?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PersonResolvers<ContextType = any, ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PillFormatterResolvers<ContextType = any, ParentType extends ResolversParentTypes['PillFormatter'] = ResolversParentTypes['PillFormatter']> = {
  background?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['DamsIcons']>, ParentType, ContextType>;
  spin?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlaceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Place'] = ResolversParentTypes['Place']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlayingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Playing'] = ResolversParentTypes['Playing']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PreviewComponentResolvers<ContextType = any, ParentType extends ResolversParentTypes['PreviewComponent'] = ResolversParentTypes['PreviewComponent']> = {
  listItemsCoverage?: Resolver<ResolversTypes['ListItemCoverageTypes'], ParentType, ContextType, RequireFields<PreviewComponentListItemsCoverageArgs, 'input'>>;
  metadataPreviewQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PreviewComponentMetadataPreviewQueryArgs>>;
  openByDefault?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PreviewComponentOpenByDefaultArgs>>;
  previewConfiguration?: Resolver<Maybe<ResolversTypes['PreviewConfiguration']>, ParentType, ContextType>;
  previewQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PreviewComponentPreviewQueryArgs>>;
  showCurrentPreviewFlow?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PreviewComponentShowCurrentPreviewFlowArgs>>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<PreviewComponentTitleArgs>>;
  type?: Resolver<ResolversTypes['PreviewTypes'], ParentType, ContextType, RequireFields<PreviewComponentTypeArgs, 'input'>>;
};

export type PreviewConfigurationResolvers<ContextType = any, ParentType extends ResolversParentTypes['PreviewConfiguration'] = ResolversParentTypes['PreviewConfiguration']> = {
  displayOpenDetailPageButton?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PreviewConfigurationDisplayOpenDetailPageButtonArgs>>;
  keepLastActiveItemHighlighted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<PreviewConfigurationKeepLastActiveItemHighlightedArgs>>;
};

export type PublisherResolvers<ContextType = any, ParentType extends ResolversParentTypes['Publisher'] = ResolversParentTypes['Publisher']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  AdvancedPermission?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<QueryAdvancedPermissionArgs, 'permission'>>;
  AdvancedPermissions?: Resolver<Array<ResolversTypes['PermissionResult']>, ParentType, ContextType, RequireFields<QueryAdvancedPermissionsArgs, 'permissions'>>;
  BulkOperationCsvExportKeys?: Resolver<ResolversTypes['BulkOperationCsvExportKeys'], ParentType, ContextType, RequireFields<QueryBulkOperationCsvExportKeysArgs, 'entityType'>>;
  BulkOperations?: Resolver<ResolversTypes['Entity'], ParentType, ContextType, RequireFields<QueryBulkOperationsArgs, 'entityType'>>;
  BulkOperationsRelationForm?: Resolver<ResolversTypes['WindowElement'], ParentType, ContextType>;
  CreateLabelForManifestation?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<QueryCreateLabelForManifestationArgs, 'id'>>;
  CustomBulkOperations?: Resolver<ResolversTypes['Entity'], ParentType, ContextType>;
  CustomFormattersSettings?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  Directories?: Resolver<Maybe<Array<Maybe<ResolversTypes['Directory']>>>, ParentType, ContextType, Partial<QueryDirectoriesArgs>>;
  DownloadItemsInZip?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<QueryDownloadItemsInZipArgs, 'basicCsv' | 'downloadEntity' | 'entities' | 'includeAssetCsv' | 'mediafiles'>>;
  DropzoneEntityToCreate?: Resolver<ResolversTypes['DropzoneEntityToCreate'], ParentType, ContextType>;
  Entities?: Resolver<Maybe<ResolversTypes['EntitiesResults']>, ParentType, ContextType, RequireFields<QueryEntitiesArgs, 'advancedFilterInputs' | 'searchValue'>>;
  EntitiesByAdvancedSearch?: Resolver<ResolversTypes['EntitiesResults'], ParentType, ContextType, RequireFields<QueryEntitiesByAdvancedSearchArgs, 'facet_by' | 'filter_by' | 'limit' | 'per_page' | 'q' | 'query_by_weights' | 'sort_by'>>;
  EntitiesHistory?: Resolver<Maybe<ResolversTypes['EntitiesResults']>, ParentType, ContextType, RequireFields<QueryEntitiesHistoryArgs, 'advancedFilterInputs' | 'searchValue'>>;
  Entity?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<QueryEntityArgs, 'id' | 'type'>>;
  EntityTypeFilters?: Resolver<ResolversTypes['Entity'], ParentType, ContextType, RequireFields<QueryEntityTypeFiltersArgs, 'type'>>;
  EntityTypeSortOptions?: Resolver<ResolversTypes['Entity'], ParentType, ContextType, RequireFields<QueryEntityTypeSortOptionsArgs, 'entityType'>>;
  FetchMediafilesOfEntity?: Resolver<Array<Maybe<ResolversTypes['MediaFileEntity']>>, ParentType, ContextType, RequireFields<QueryFetchMediafilesOfEntityArgs, 'entityIds'>>;
  FilterMatcherMapping?: Resolver<Array<ResolversTypes['FilterMatchers']>, ParentType, ContextType, Partial<QueryFilterMatcherMappingArgs>>;
  FilterOptions?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<QueryFilterOptionsArgs, 'entityType' | 'input' | 'limit'>>;
  GenerateOcrWithAsset?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<QueryGenerateOcrWithAssetArgs, 'assetId' | 'language' | 'operation'>>;
  GeoFilterForMap?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  GetDynamicForm?: Resolver<ResolversTypes['Form'], ParentType, ContextType>;
  GetEntityDetailContextMenuActions?: Resolver<ResolversTypes['ContextMenuActions'], ParentType, ContextType>;
  GetPrimaryMediafileFromEntity?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<QueryGetPrimaryMediafileFromEntityArgs, 'entityId'>>;
  GetRepetitiveForm?: Resolver<Maybe<ResolversTypes['RepetitiveForm']>, ParentType, ContextType>;
  GraphData?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<QueryGraphDataArgs, 'graph' | 'id'>>;
  Job?: Resolver<Maybe<ResolversTypes['Job']>, ParentType, ContextType, RequireFields<QueryJobArgs, 'failed' | 'id'>>;
  Jobs?: Resolver<Maybe<ResolversTypes['JobsResults']>, ParentType, ContextType, RequireFields<QueryJobsArgs, 'failed'>>;
  Menu?: Resolver<Maybe<ResolversTypes['MenuWrapper']>, ParentType, ContextType, RequireFields<QueryMenuArgs, 'name'>>;
  PaginationLimitOptions?: Resolver<ResolversTypes['PaginationLimitOptions'], ParentType, ContextType>;
  PermissionMapping?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<QueryPermissionMappingArgs, 'entities'>>;
  PermissionMappingCreate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryPermissionMappingCreateArgs, 'entityType'>>;
  PermissionMappingEntityDetail?: Resolver<Array<ResolversTypes['PermissionMapping']>, ParentType, ContextType, RequireFields<QueryPermissionMappingEntityDetailArgs, 'entityType' | 'id'>>;
  PermissionMappingPerEntityType?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryPermissionMappingPerEntityTypeArgs, 'type'>>;
  PreviewComponents?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<QueryPreviewComponentsArgs, 'entityType'>>;
  PreviewElement?: Resolver<Maybe<ResolversTypes['ColumnList']>, ParentType, ContextType>;
  Tenants?: Resolver<Maybe<ResolversTypes['EntitiesResults']>, ParentType, ContextType>;
  User?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  UserPermissions?: Resolver<Maybe<ResolversTypes['userPermissions']>, ParentType, ContextType>;
  WemOverview?: Resolver<Maybe<Array<Maybe<ResolversTypes['Entity']>>>, ParentType, ContextType, RequireFields<QueryWemOverviewArgs, 'id'>>;
  WemiPipeline?: Resolver<Maybe<ResolversTypes['EntitiesResults']>, ParentType, ContextType, RequireFields<QueryWemiPipelineArgs, 'advancedFilterInputs' | 'searchValue' | 'type'>>;
  getElodyUser?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType>;
  getMediafile?: Resolver<Maybe<ResolversTypes['MediaFile']>, ParentType, ContextType, Partial<QueryGetMediafileArgs>>;
  jobStatusForEntity?: Resolver<ResolversTypes['JobPollResult'], ParentType, ContextType, RequireFields<QueryJobStatusForEntityArgs, 'id' | 'type'>>;
  mergeEvaluations?: Resolver<Array<ResolversTypes['MergeEvaluation']>, ParentType, ContextType, RequireFields<QueryMergeEvaluationsArgs, 'collection' | 'ids' | 'strategy'>>;
  mergePreview?: Resolver<ResolversTypes['MergePreview'], ParentType, ContextType, RequireFields<QueryMergePreviewArgs, 'collection' | 'id'>>;
};

export type ReadingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Reading'] = ResolversParentTypes['Reading']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RegexpMatchFormatterResolvers<ContextType = any, ParentType extends ResolversParentTypes['RegexpMatchFormatter'] = ResolversParentTypes['RegexpMatchFormatter']> = {
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RelationFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['RelationField'] = ResolversParentTypes['RelationField']> = {
  acceptedEntityTypes?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType>;
  disabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<Array<Maybe<ResolversTypes['MetadataField']>>>, ParentType, ContextType>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  viewMode?: Resolver<Maybe<ResolversTypes['RelationFieldViewMode']>, ParentType, ContextType>;
};

export type RepetitionConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitionConfig'] = ResolversParentTypes['RepetitionConfig']> = {
  repetitionKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type RepetitiveCreatableTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveCreatableType'] = ResolversParentTypes['RepetitiveCreatableType']> = {
  createForm?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entityType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RepetitiveFinalizeResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveFinalize'] = ResolversParentTypes['RepetitiveFinalize']> = {
  creatableTypes?: Resolver<Maybe<Array<ResolversTypes['RepetitiveCreatableType']>>, ParentType, ContextType, Partial<RepetitiveFinalizeCreatableTypesArgs>>;
  createForm?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveFinalizeCreateFormArgs, 'input'>>;
  entityType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveFinalizeEntityTypeArgs, 'input'>>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveFinalizeLabelArgs>>;
  prefillMetadata?: Resolver<Maybe<Array<ResolversTypes['RepetitiveMetadataPrefill']>>, ParentType, ContextType>;
  relations?: Resolver<Array<ResolversTypes['RepetitiveFinalizeRelation']>, ParentType, ContextType>;
};

export type RepetitiveFinalizeRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveFinalizeRelation'] = ResolversParentTypes['RepetitiveFinalizeRelation']> = {
  createWhen?: Resolver<ResolversTypes['RepetitiveRelationTrigger'], ParentType, ContextType, RequireFields<RepetitiveFinalizeRelationCreateWhenArgs, 'input'>>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveFinalizeRelationRelationTypeArgs, 'input'>>;
  toAllOf?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveFinalizeRelationToAllOfArgs, 'input'>>;
};

export type RepetitiveFormResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveForm'] = ResolversParentTypes['RepetitiveForm']> = {
  finalize?: Resolver<Maybe<ResolversTypes['RepetitiveFinalize']>, ParentType, ContextType>;
  finalizeOnHost?: Resolver<Maybe<ResolversTypes['RepetitiveHostFinalize']>, ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveFormLabelArgs>>;
  linear?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveFormLinearArgs>>;
  refetchOnFinish?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveFormRefetchOnFinishArgs>>;
  repeatable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RepetitiveFormRepeatableArgs, 'input'>>;
  returnsSelection?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveFormReturnsSelectionArgs>>;
  routeToRoute?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveFormRouteToRouteArgs>>;
  routeToStep?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveFormRouteToStepArgs>>;
  startOnFirstStep?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveFormStartOnFirstStepArgs>>;
  steps?: Resolver<Array<ResolversTypes['RepetitiveStep']>, ParentType, ContextType>;
};

export type RepetitiveHostFinalizeResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveHostFinalize'] = ResolversParentTypes['RepetitiveHostFinalize']> = {
  fromStep?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveHostFinalizeFromStepArgs, 'input'>>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveHostFinalizeRelationTypeArgs, 'input'>>;
  replaceExisting?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveHostFinalizeReplaceExistingArgs>>;
};

export type RepetitiveMetadataPrefillResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveMetadataPrefill'] = ResolversParentTypes['RepetitiveMetadataPrefill']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveMetadataPrefillKeyArgs, 'input'>>;
  value?: Resolver<ResolversTypes['JSON'], ParentType, ContextType, RequireFields<RepetitiveMetadataPrefillValueArgs, 'input'>>;
};

export type RepetitiveRelationMetadataFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveRelationMetadataField'] = ResolversParentTypes['RepetitiveRelationMetadataField']> = {
  asArray?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  formMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  relationMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RepetitiveStepResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveStep'] = ResolversParentTypes['RepetitiveStep']> = {
  acceptedTypes?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType, Partial<RepetitiveStepAcceptedTypesArgs>>;
  creatableTypeFromParentKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveStepCreatableTypeFromParentKeyArgs>>;
  creatableTypes?: Resolver<Maybe<Array<ResolversTypes['RepetitiveCreatableType']>>, ParentType, ContextType, Partial<RepetitiveStepCreatableTypesArgs>>;
  createForm?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepCreateFormArgs, 'input'>>;
  entityPickerSearchConfig?: Resolver<Maybe<ResolversTypes['EntityPickerSearchConfig']>, ParentType, ContextType, Partial<RepetitiveStepEntityPickerSearchConfigArgs>>;
  entityType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepEntityTypeArgs, 'input'>>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepKeyArgs, 'input'>>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveStepLabelArgs>>;
  maxSelection?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, Partial<RepetitiveStepMaxSelectionArgs>>;
  metadataOnly?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveStepMetadataOnlyArgs>>;
  overviewFields?: Resolver<Maybe<Array<ResolversTypes['RepetitiveStepOverviewField']>>, ParentType, ContextType, Partial<RepetitiveStepOverviewFieldsArgs>>;
  pickerFiltersCollapsed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveStepPickerFiltersCollapsedArgs>>;
  pickerFiltersQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveStepPickerFiltersQueryArgs>>;
  pickerQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<RepetitiveStepPickerQueryArgs, 'input'>>;
  relations?: Resolver<Maybe<Array<ResolversTypes['RepetitiveStepRelation']>>, ParentType, ContextType>;
  scopeToRelationOf?: Resolver<Maybe<ResolversTypes['RepetitiveStepScope']>, ParentType, ContextType>;
  showBackButton?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveStepShowBackButtonArgs>>;
  skipSearchIfPriorIsNew?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<RepetitiveStepSkipSearchIfPriorIsNewArgs>>;
  terminalActionLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveStepTerminalActionLabelArgs>>;
};

export type RepetitiveStepOverviewFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveStepOverviewField'] = ResolversParentTypes['RepetitiveStepOverviewField']> = {
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RepetitiveStepRelationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveStepRelation'] = ResolversParentTypes['RepetitiveStepRelation']> = {
  createWhen?: Resolver<ResolversTypes['RepetitiveRelationTrigger'], ParentType, ContextType, RequireFields<RepetitiveStepRelationCreateWhenArgs, 'input'>>;
  metadataFields?: Resolver<Maybe<Array<ResolversTypes['RepetitiveRelationMetadataField']>>, ParentType, ContextType, Partial<RepetitiveStepRelationMetadataFieldsArgs>>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepRelationRelationTypeArgs, 'input'>>;
  to?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepRelationToArgs, 'input'>>;
};

export type RepetitiveStepScopeResolvers<ContextType = any, ParentType extends ResolversParentTypes['RepetitiveStepScope'] = ResolversParentTypes['RepetitiveStepScope']> = {
  filterKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<RepetitiveStepScopeFilterKeyArgs>>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepScopeRelationTypeArgs, 'input'>>;
  step?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RepetitiveStepScopeStepArgs, 'input'>>;
};

export type RequiredOneOfMetadataValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RequiredOneOfMetadataValidation'] = ResolversParentTypes['RequiredOneOfMetadataValidation']> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  includedMetadataFields?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type RequiredOneOfRelationValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RequiredOneOfRelationValidation'] = ResolversParentTypes['RequiredOneOfRelationValidation']> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  relationTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type RequiredRelationValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RequiredRelationValidation'] = ResolversParentTypes['RequiredRelationValidation']> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  exact?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RouteMatchingResolvers<ContextType = any, ParentType extends ResolversParentTypes['RouteMatching'] = ResolversParentTypes['RouteMatching']> = {
  entityType?: Resolver<Maybe<ResolversTypes['Entitytyping']>, ParentType, ContextType>;
  routeName?: Resolver<Maybe<ResolversTypes['RouteNames']>, ParentType, ContextType>;
};

export type SavedSearchResolvers<ContextType = any, ParentType extends ResolversParentTypes['SavedSearch'] = ResolversParentTypes['SavedSearch']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ShareLinkResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShareLink'] = ResolversParentTypes['ShareLink']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SingleMediaFileElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['SingleMediaFileElement'] = ResolversParentTypes['SingleMediaFileElement']> = {
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<SingleMediaFileElementIsCollapsedArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<SingleMediaFileElementLabelArgs>>;
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<SingleMediaFileElementTypeArgs>>;
};

export type SisoResolvers<ContextType = any, ParentType extends ResolversParentTypes['Siso'] = ResolversParentTypes['Siso']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SortOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['SortOptions'] = ResolversParentTypes['SortOptions']> = {
  isAsc?: Resolver<Maybe<ResolversTypes['SortingDirection']>, ParentType, ContextType, RequireFields<SortOptionsIsAscArgs, 'input'>>;
  options?: Resolver<Array<ResolversTypes['DropdownOption']>, ParentType, ContextType, RequireFields<SortOptionsOptionsArgs, 'input'>>;
};

export interface StringOrIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['StringOrInt'], any> {
  name: 'StringOrInt';
}

export type SubFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubField'] = ResolversParentTypes['SubField']> = {
  entitySourceKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hidden?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  inputField?: Resolver<Maybe<ResolversTypes['InputField']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SubJobResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubJobResults'] = ResolversParentTypes['SubJobResults']> = {
  count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  results?: Resolver<Maybe<Array<Maybe<ResolversTypes['Job']>>>, ParentType, ContextType>;
};

export type TagConfigurationByEntityResolvers<ContextType = any, ParentType extends ResolversParentTypes['TagConfigurationByEntity'] = ResolversParentTypes['TagConfigurationByEntity']> = {
  colorMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  configurationEntityRelationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  configurationEntityType?: Resolver<ResolversTypes['Entitytyping'], ParentType, ContextType>;
  metadataKeysToSetAsAttribute?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  secondaryAttributeToDetermineTagConfig?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tagMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TaggableEntityConfigurationResolvers<ContextType = any, ParentType extends ResolversParentTypes['TaggableEntityConfiguration'] = ResolversParentTypes['TaggableEntityConfiguration']> = {
  createNewEntityFormQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guidedFlowButtonLabel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  guidedFlowQuery?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inlineTrigger?: Resolver<Maybe<ResolversTypes['InlineTrigger']>, ParentType, ContextType>;
  metadataFilterForTagContent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadataKeysToSetAsAttribute?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  relationType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  replaceCharacterFromTagSettings?: Resolver<Maybe<Array<Maybe<ResolversTypes['CharacterReplacementSettings']>>>, ParentType, ContextType>;
  tag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tagConfigurationByEntity?: Resolver<Maybe<ResolversTypes['TagConfigurationByEntity']>, ParentType, ContextType>;
  taggableEntityType?: Resolver<ResolversTypes['Entitytyping'], ParentType, ContextType>;
};

export type TaggingExtensionConfigurationResolvers<ContextType = any, ParentType extends ResolversParentTypes['TaggingExtensionConfiguration'] = ResolversParentTypes['TaggingExtensionConfiguration']> = {
  customQuery?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<TaggingExtensionConfigurationCustomQueryArgs, 'input'>>;
  taggableEntityConfiguration?: Resolver<Array<ResolversTypes['TaggableEntityConfiguration']>, ParentType, ContextType, RequireFields<TaggingExtensionConfigurationTaggableEntityConfigurationArgs, 'configuration'>>;
};

export type TargetAudienceResolvers<ContextType = any, ParentType extends ResolversParentTypes['TargetAudience'] = ResolversParentTypes['TargetAudience']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TenantResolvers<ContextType = any, ParentType extends ResolversParentTypes['Tenant'] = ResolversParentTypes['Tenant']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Time'] = ResolversParentTypes['Time']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TitleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Title'] = ResolversParentTypes['Title']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['Token'] = ResolversParentTypes['Token']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransliterationConfigItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransliterationConfigItem'] = ResolversParentTypes['TransliterationConfigItem']> = {
  insertSpaces?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mapping?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
};

export type UploadContainerResolvers<ContextType = any, ParentType extends ResolversParentTypes['UploadContainer'] = ResolversParentTypes['UploadContainer']> = {
  uploadField?: Resolver<ResolversTypes['UploadField'], ParentType, ContextType>;
  uploadFlow?: Resolver<ResolversTypes['UploadFlow'], ParentType, ContextType, RequireFields<UploadContainerUploadFlowArgs, 'input'>>;
  uploadMetadata?: Resolver<Maybe<ResolversTypes['PanelMetaData']>, ParentType, ContextType>;
};

export type UploadFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['UploadField'] = ResolversParentTypes['UploadField']> = {
  addTypeToEndpoint?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<UploadFieldAddTypeToEndpointArgs>>;
  dryRunUpload?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<UploadFieldDryRunUploadArgs>>;
  extraMediafileType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<UploadFieldExtraMediafileTypeArgs>>;
  extractTypeFromKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<UploadFieldExtractTypeFromKeyArgs>>;
  infoLabelUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<UploadFieldInfoLabelUrlArgs>>;
  inputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType, RequireFields<UploadFieldInputFieldArgs, 'type'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<UploadFieldLabelArgs, 'input'>>;
  templateCsvs?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType, RequireFields<UploadFieldTemplateCsvsArgs, 'input'>>;
  uploadFieldSize?: Resolver<ResolversTypes['UploadFieldSize'], ParentType, ContextType, Partial<UploadFieldUploadFieldSizeArgs>>;
  uploadFieldType?: Resolver<ResolversTypes['UploadFieldType'], ParentType, ContextType, RequireFields<UploadFieldUploadFieldTypeArgs, 'input'>>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  family_name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  given_name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  mapElement?: Resolver<Maybe<ResolversTypes['MapElement']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  preferred_username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Validation'] = ResolversParentTypes['Validation']> = {
  available_if?: Resolver<Maybe<ResolversTypes['Conditional']>, ParentType, ContextType>;
  customValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fastValidationMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  has_min_max_amount_of_relations?: Resolver<Maybe<ResolversTypes['MinMaxAmountOfRelationsValidation']>, ParentType, ContextType>;
  has_one_of_required_metadata?: Resolver<Maybe<ResolversTypes['RequiredOneOfMetadataValidation']>, ParentType, ContextType>;
  has_one_of_required_relations?: Resolver<Maybe<ResolversTypes['RequiredOneOfRelationValidation']>, ParentType, ContextType>;
  has_required_relation?: Resolver<Maybe<ResolversTypes['RequiredRelationValidation']>, ParentType, ContextType>;
  regex?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  required_if?: Resolver<Maybe<ResolversTypes['Conditional']>, ParentType, ContextType>;
  rules?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<Array<Maybe<ResolversTypes['ValidationRules']>>>, ParentType, ContextType>;
};

export type ValueMappingResolvers<ContextType = any, ParentType extends ResolversParentTypes['ValueMapping'] = ResolversParentTypes['ValueMapping']> = {
  mapping?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
};

export type ViewModesWithConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ViewModesWithConfig'] = ResolversParentTypes['ViewModesWithConfig']> = {
  config?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigItem']>>>, ParentType, ContextType>;
  viewMode?: Resolver<Maybe<ResolversTypes['ViewModes']>, ParentType, ContextType>;
};

export type VirtualKeyboardConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['VirtualKeyboardConfig'] = ResolversParentTypes['VirtualKeyboardConfig']> = {
  layouts?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
};

export type VisibleIfResolvers<ContextType = any, ParentType extends ResolversParentTypes['VisibleIf'] = ResolversParentTypes['VisibleIf']> = {
  dependsOn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  values?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type WatchingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Watching'] = ResolversParentTypes['Watching']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WindowElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['WindowElement'] = ResolversParentTypes['WindowElement']> = {
  contextMenuActions?: Resolver<Maybe<ResolversTypes['ContextMenuActions']>, ParentType, ContextType>;
  editMetadataButton?: Resolver<Maybe<ResolversTypes['EditMetadataButton']>, ParentType, ContextType, RequireFields<WindowElementEditMetadataButtonArgs, 'input'>>;
  expandButtonOptions?: Resolver<Maybe<ResolversTypes['ExpandButtonOptions']>, ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<WindowElementLabelArgs>>;
  layout?: Resolver<Maybe<ResolversTypes['WindowElementLayout']>, ParentType, ContextType, Partial<WindowElementLayoutArgs>>;
  lineClamp?: Resolver<ResolversTypes['String'], ParentType, ContextType, Partial<WindowElementLineClampArgs>>;
  panels?: Resolver<Maybe<ResolversTypes['WindowElementPanel']>, ParentType, ContextType>;
  windowElementStatus?: Resolver<Maybe<ResolversTypes['WindowElementStatus']>, ParentType, ContextType, Partial<WindowElementWindowElementStatusArgs>>;
};

export type WindowElementBulkDataPanelResolvers<ContextType = any, ParentType extends ResolversParentTypes['WindowElementBulkDataPanel'] = ResolversParentTypes['WindowElementBulkDataPanel']> = {
  intialValueKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<WindowElementBulkDataPanelIntialValueKeyArgs, 'input'>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<WindowElementBulkDataPanelLabelArgs, 'input'>>;
};

export type WindowElementPanelResolvers<ContextType = any, ParentType extends ResolversParentTypes['WindowElementPanel'] = ResolversParentTypes['WindowElementPanel']> = {
  bulkData?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<WindowElementPanelBulkDataArgs, 'bulkDataSource'>>;
  can?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<WindowElementPanelCanArgs>>;
  canBeMultipleColumns?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WindowElementPanelCanBeMultipleColumnsArgs, 'input'>>;
  displayCondition?: Resolver<Maybe<ResolversTypes['DisplayCondition']>, ParentType, ContextType>;
  entityListElement?: Resolver<Maybe<ResolversTypes['EntityListElement']>, ParentType, ContextType>;
  info?: Resolver<ResolversTypes['PanelInfo'], ParentType, ContextType>;
  isCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WindowElementPanelIsCollapsedArgs, 'input'>>;
  isEditable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<WindowElementPanelIsEditableArgs, 'input'>>;
  metaData?: Resolver<ResolversTypes['PanelMetaData'], ParentType, ContextType>;
  panelHeaderContent?: Resolver<Maybe<ResolversTypes['PanelHeaderContent']>, ParentType, ContextType, Partial<WindowElementPanelPanelHeaderContentArgs>>;
  panelType?: Resolver<ResolversTypes['PanelType'], ParentType, ContextType, RequireFields<WindowElementPanelPanelTypeArgs, 'input'>>;
  relation?: Resolver<Maybe<Array<Maybe<ResolversTypes['PanelRelation']>>>, ParentType, ContextType>;
  repetitionConfig?: Resolver<Maybe<ResolversTypes['RepetitionConfig']>, ParentType, ContextType, Partial<WindowElementPanelRepetitionConfigArgs>>;
  wysiwygElement?: Resolver<Maybe<ResolversTypes['WysiwygElement']>, ParentType, ContextType>;
};

export type WindowElementStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['WindowElementStatus'] = ResolversParentTypes['WindowElementStatus']> = {
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  statusInputField?: Resolver<ResolversTypes['InputField'], ParentType, ContextType>;
  statusMetadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type WorkResolvers<ContextType = any, ParentType extends ResolversParentTypes['Work'] = ResolversParentTypes['Work']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkComputerFileResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkComputerFile'] = ResolversParentTypes['WorkComputerFile']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkFootageResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkFootage'] = ResolversParentTypes['WorkFootage']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkMapResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkMap'] = ResolversParentTypes['WorkMap']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkMixedMaterialResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkMixedMaterial'] = ResolversParentTypes['WorkMixedMaterial']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkMusicResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkMusic'] = ResolversParentTypes['WorkMusic']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkSerialResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkSerial'] = ResolversParentTypes['WorkSerial']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkWordResolvers<ContextType = any, ParentType extends ResolversParentTypes['WorkWord'] = ResolversParentTypes['WorkWord']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WysiwygElementResolvers<ContextType = any, ParentType extends ResolversParentTypes['WysiwygElement'] = ResolversParentTypes['WysiwygElement']> = {
  extensions?: Resolver<Array<Maybe<ResolversTypes['WysiwygExtensions']>>, ParentType, ContextType, RequireFields<WysiwygElementExtensionsArgs, 'input'>>;
  infoPanel?: Resolver<Maybe<ResolversTypes['InfoPanel']>, ParentType, ContextType, Partial<WysiwygElementInfoPanelArgs>>;
  isMultilingual?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<WysiwygElementIsMultilingualArgs>>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<WysiwygElementLabelArgs, 'input'>>;
  lockedTooltip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<WysiwygElementLockedTooltipArgs>>;
  metadataKey?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<WysiwygElementMetadataKeyArgs, 'input'>>;
  taggingConfiguration?: Resolver<Maybe<ResolversTypes['TaggingExtensionConfiguration']>, ParentType, ContextType>;
  wysiwygElementConfiguration?: Resolver<Maybe<ResolversTypes['WysiwygElementConfiguration']>, ParentType, ContextType>;
};

export type WysiwygElementConfigurationResolvers<ContextType = any, ParentType extends ResolversParentTypes['WysiwygElementConfiguration'] = ResolversParentTypes['WysiwygElementConfiguration']> = {
  customEditorStyles?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<WysiwygElementConfigurationCustomEditorStylesArgs>>;
  showLineNumbers?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<WysiwygElementConfigurationShowLineNumbersArgs>>;
  transliterationConfig?: Resolver<Maybe<ResolversTypes['WysiwygTransliterationConfig']>, ParentType, ContextType>;
  virtualKeyboardLayouts?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, Partial<WysiwygElementConfigurationVirtualKeyboardLayoutsArgs>>;
};

export type WysiwygTransliterationConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['WysiwygTransliterationConfig'] = ResolversParentTypes['WysiwygTransliterationConfig']> = {
  enabledByProperty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<WysiwygTransliterationConfigEnabledByPropertyArgs>>;
  transliterationConfigItem?: Resolver<Maybe<ResolversTypes['TransliterationConfigItem']>, ParentType, ContextType, RequireFields<WysiwygTransliterationConfigTransliterationConfigItemArgs, 'label' | 'mappingKey'>>;
};

export type ZizoResolvers<ContextType = any, ParentType extends ResolversParentTypes['Zizo'] = ResolversParentTypes['Zizo']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoDeelrubriekResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoDeelrubriek'] = ResolversParentTypes['ZizoDeelrubriek']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoDomeinResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoDomein'] = ResolversParentTypes['ZizoDomein']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoGroeirubriekResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoGroeirubriek'] = ResolversParentTypes['ZizoGroeirubriek']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoHoofdrubriekResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoHoofdrubriek'] = ResolversParentTypes['ZizoHoofdrubriek']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoKastResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoKast'] = ResolversParentTypes['ZizoKast']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoPlankResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoPlank'] = ResolversParentTypes['ZizoPlank']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ZizoRugResolvers<ContextType = any, ParentType extends ResolversParentTypes['ZizoRug'] = ResolversParentTypes['ZizoRug']> = {
  advancedFilters?: Resolver<Maybe<ResolversTypes['AdvancedFilters']>, ParentType, ContextType>;
  allowedViewModes?: Resolver<Maybe<ResolversTypes['AllowedViewModes']>, ParentType, ContextType>;
  bulkOperationOptions?: Resolver<Maybe<ResolversTypes['BulkOperationOptions']>, ParentType, ContextType>;
  deleteQueryOptions?: Resolver<Maybe<ResolversTypes['DeleteQueryOptions']>, ParentType, ContextType>;
  entityView?: Resolver<ResolversTypes['ColumnList'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  intialValues?: Resolver<ResolversTypes['IntialValues'], ParentType, ContextType>;
  previewComponent?: Resolver<Maybe<ResolversTypes['PreviewComponent']>, ParentType, ContextType>;
  relationValues?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sortOptions?: Resolver<Maybe<ResolversTypes['SortOptions']>, ParentType, ContextType>;
  teaserMetadata?: Resolver<Maybe<ResolversTypes['teaserMetadata']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TeaserMetadataResolvers<ContextType = any, ParentType extends ResolversParentTypes['teaserMetadata'] = ResolversParentTypes['teaserMetadata']> = {
  buttons?: Resolver<Maybe<ResolversTypes['Buttons']>, ParentType, ContextType>;
  forceShowContextMenuActions?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, Partial<TeaserMetadataForceShowContextMenuActionsArgs>>;
  link?: Resolver<Maybe<ResolversTypes['PanelLink']>, ParentType, ContextType>;
  metaData?: Resolver<Maybe<ResolversTypes['PanelMetaData']>, ParentType, ContextType>;
  relationMetaData?: Resolver<Maybe<ResolversTypes['PanelRelationMetaData']>, ParentType, ContextType>;
  relationRootData?: Resolver<Maybe<ResolversTypes['PanelRelationRootData']>, ParentType, ContextType>;
  thumbnail?: Resolver<Maybe<ResolversTypes['PanelThumbnail']>, ParentType, ContextType>;
};

export type UserPermissionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['userPermissions'] = ResolversParentTypes['userPermissions']> = {
  payload?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  ActionButton?: ActionButtonResolvers<ContextType>;
  ActionContext?: ActionContextResolvers<ContextType>;
  ActionElement?: ActionElementResolvers<ContextType>;
  ActionProgress?: ActionProgressResolvers<ContextType>;
  ActionProgressStep?: ActionProgressStepResolvers<ContextType>;
  ActionsOnResult?: ActionsOnResultResolvers<ContextType>;
  AdvancedFilter?: AdvancedFilterResolvers<ContextType>;
  AdvancedFilterInputType?: AdvancedFilterInputTypeResolvers<ContextType>;
  AdvancedFilterLimitConfigType?: AdvancedFilterLimitConfigTypeResolvers<ContextType>;
  AdvancedFilters?: AdvancedFiltersResolvers<ContextType>;
  AllowedViewModes?: AllowedViewModesResolvers<ContextType>;
  Award?: AwardResolvers<ContextType>;
  BaseEntity?: BaseEntityResolvers<ContextType>;
  Boekenbank?: BoekenbankResolvers<ContextType>;
  BreadCrumbRoute?: BreadCrumbRouteResolvers<ContextType>;
  BulkEditResult?: BulkEditResultResolvers<ContextType>;
  BulkOperationCsvExportKeys?: BulkOperationCsvExportKeysResolvers<ContextType>;
  BulkOperationModal?: BulkOperationModalResolvers<ContextType>;
  BulkOperationOptions?: BulkOperationOptionsResolvers<ContextType>;
  BulkOperations?: BulkOperationsResolvers<ContextType>;
  Buttons?: ButtonsResolvers<ContextType>;
  Cantook?: CantookResolvers<ContextType>;
  CharacterReplacementSettings?: CharacterReplacementSettingsResolvers<ContextType>;
  CodeWording?: CodeWordingResolvers<ContextType>;
  Column?: ColumnResolvers<ContextType>;
  ColumnList?: ColumnListResolvers<ContextType>;
  Comment?: CommentResolvers<ContextType>;
  CommentCreateFields?: CommentCreateFieldsResolvers<ContextType>;
  CommentsElement?: CommentsElementResolvers<ContextType>;
  Conditional?: ConditionalResolvers<ContextType>;
  ConfigItem?: ConfigItemResolvers<ContextType>;
  Context?: ContextResolvers<ContextType>;
  ContextMenuActions?: ContextMenuActionsResolvers<ContextType>;
  ContextMenuCustomAction?: ContextMenuCustomActionResolvers<ContextType>;
  ContextMenuDownloadZipOfRelatedMediafilesAction?: ContextMenuDownloadZipOfRelatedMediafilesActionResolvers<ContextType>;
  ContextMenuElodyAction?: ContextMenuElodyActionResolvers<ContextType>;
  ContextMenuGeneralAction?: ContextMenuGeneralActionResolvers<ContextType>;
  ContextMenuLinkAction?: ContextMenuLinkActionResolvers<ContextType>;
  ContextMenuQueryAction?: ContextMenuQueryActionResolvers<ContextType>;
  CopyFromParentConfig?: CopyFromParentConfigResolvers<ContextType>;
  CopyFromParentKeyMap?: CopyFromParentKeyMapResolvers<ContextType>;
  CopyValueFromParentIntialValues?: CopyValueFromParentIntialValuesResolvers<ContextType>;
  Corporation?: CorporationResolvers<ContextType>;
  DeleteQueryOptions?: DeleteQueryOptionsResolvers<ContextType>;
  Directory?: DirectoryResolvers<ContextType>;
  DisplayCondition?: DisplayConditionResolvers<ContextType>;
  Download?: DownloadResolvers<ContextType>;
  DropdownOption?: DropdownOptionResolvers<ContextType>;
  DropzoneEntityToCreate?: DropzoneEntityToCreateResolvers<ContextType>;
  EasyReading?: EasyReadingResolvers<ContextType>;
  EditMetadataButton?: EditMetadataButtonResolvers<ContextType>;
  EndpointInformation?: EndpointInformationResolvers<ContextType>;
  EntitiesResults?: EntitiesResultsResolvers<ContextType>;
  Entity?: EntityResolvers<ContextType>;
  EntityButtonConfig?: EntityButtonConfigResolvers<ContextType>;
  EntityButtonStyle?: EntityButtonStyleResolvers<ContextType>;
  EntityListElement?: EntityListElementResolvers<ContextType>;
  EntityPickerSearchConfig?: EntityPickerSearchConfigResolvers<ContextType>;
  EntityViewElements?: EntityViewElementsResolvers<ContextType>;
  EntityViewerElement?: EntityViewerElementResolvers<ContextType>;
  ExpandButtonOptions?: ExpandButtonOptionsResolvers<ContextType>;
  Expression?: ExpressionResolvers<ContextType>;
  FacetInputType?: FacetInputTypeResolvers<ContextType>;
  FetchDeepRelations?: FetchDeepRelationsResolvers<ContextType>;
  FileProgress?: FileProgressResolvers<ContextType>;
  FileProgressStep?: FileProgressStepResolvers<ContextType>;
  FilterMatchers?: FilterMatchersResolvers<ContextType>;
  FilterOptionsMappingType?: FilterOptionsMappingTypeResolvers<ContextType>;
  Form?: FormResolvers<ContextType>;
  FormAction?: FormActionResolvers<ContextType>;
  FormFields?: FormFieldsResolvers<ContextType>;
  FormSection?: FormSectionResolvers<ContextType>;
  FormTab?: FormTabResolvers<ContextType>;
  Formatters?: FormattersResolvers<ContextType>;
  Genre?: GenreResolvers<ContextType>;
  GeoJsonFeature?: GeoJsonFeatureResolvers<ContextType>;
  GraphDataset?: GraphDatasetResolvers<ContextType>;
  GraphDatasetFilter?: GraphDatasetFilterResolvers<ContextType>;
  GraphElement?: GraphElementResolvers<ContextType>;
  Group?: GroupResolvers<ContextType>;
  HiddenField?: HiddenFieldResolvers<ContextType>;
  HierarchyListElement?: HierarchyListElementResolvers<ContextType>;
  HierarchyRelationList?: HierarchyRelationListResolvers<ContextType>;
  Home?: HomeResolvers<ContextType>;
  ImportReturn?: ImportReturnResolvers<ContextType>;
  InfoPanel?: InfoPanelResolvers<ContextType>;
  InlineTrigger?: InlineTriggerResolvers<ContextType>;
  InputField?: InputFieldResolvers<ContextType>;
  IntialValues?: IntialValuesResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Job?: JobResolvers<ContextType>;
  JobPollResult?: JobPollResultResolvers<ContextType>;
  JobsResults?: JobsResultsResolvers<ContextType>;
  KeyAndValue?: KeyAndValueResolvers<ContextType>;
  KeyValue?: KeyValueResolvers<ContextType>;
  Language?: LanguageResolvers<ContextType>;
  LinkFormatter?: LinkFormatterResolvers<ContextType>;
  Listening?: ListeningResolvers<ContextType>;
  LookupInputType?: LookupInputTypeResolvers<ContextType>;
  ManifestViewerElement?: ManifestViewerElementResolvers<ContextType>;
  Manifestation?: ManifestationResolvers<ContextType>;
  ManifestationComputerFile?: ManifestationComputerFileResolvers<ContextType>;
  ManifestationFootage?: ManifestationFootageResolvers<ContextType>;
  ManifestationMap?: ManifestationMapResolvers<ContextType>;
  ManifestationMixedMaterial?: ManifestationMixedMaterialResolvers<ContextType>;
  ManifestationMusic?: ManifestationMusicResolvers<ContextType>;
  ManifestationSerial?: ManifestationSerialResolvers<ContextType>;
  ManifestationWord?: ManifestationWordResolvers<ContextType>;
  MapElement?: MapElementResolvers<ContextType>;
  MapFeatureMetadata?: MapFeatureMetadataResolvers<ContextType>;
  MapMetadata?: MapMetadataResolvers<ContextType>;
  MarkdownViewerElement?: MarkdownViewerElementResolvers<ContextType>;
  MatchMetadataValue?: MatchMetadataValueResolvers<ContextType>;
  MatcherLabelType?: MatcherLabelTypeResolvers<ContextType>;
  Media?: MediaResolvers<ContextType>;
  MediaFile?: MediaFileResolvers<ContextType>;
  MediaFileElement?: MediaFileElementResolvers<ContextType>;
  MediaFileEntity?: MediaFileEntityResolvers<ContextType>;
  MediaFileMetadata?: MediaFileMetadataResolvers<ContextType>;
  MediaFilePostReturn?: MediaFilePostReturnResolvers<ContextType>;
  Menu?: MenuResolvers<ContextType>;
  MenuItem?: MenuItemResolvers<ContextType>;
  MenuTypeLink?: MenuTypeLinkResolvers<ContextType>;
  MenuTypeLinkModal?: MenuTypeLinkModalResolvers<ContextType>;
  MenuTypeLinkRoute?: MenuTypeLinkRouteResolvers<ContextType>;
  MenuWrapper?: MenuWrapperResolvers<ContextType>;
  MergeEvaluation?: MergeEvaluationResolvers<ContextType>;
  MergeImmutableField?: MergeImmutableFieldResolvers<ContextType>;
  MergePreview?: MergePreviewResolvers<ContextType>;
  MergeSurvivorSuggestionConfig?: MergeSurvivorSuggestionConfigResolvers<ContextType>;
  Metadata?: MetadataResolvers<ContextType>;
  MetadataAndRelation?: MetadataAndRelationResolvers<ContextType>;
  MetadataField?: MetadataFieldResolvers<ContextType>;
  MetadataFieldOption?: MetadataFieldOptionResolvers<ContextType>;
  MetadataOnRelationFieldConfig?: MetadataOnRelationFieldConfigResolvers<ContextType>;
  MetadataRelation?: MetadataRelationResolvers<ContextType>;
  MinMaxAmountOfRelationsValidation?: MinMaxAmountOfRelationsValidationResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Muziekweb?: MuziekwebResolvers<ContextType>;
  Nomen?: NomenResolvers<ContextType>;
  Omnibus?: OmnibusResolvers<ContextType>;
  Orienting?: OrientingResolvers<ContextType>;
  PaginationLimitOptions?: PaginationLimitOptionsResolvers<ContextType>;
  PanelHeaderContent?: PanelHeaderContentResolvers<ContextType>;
  PanelInfo?: PanelInfoResolvers<ContextType>;
  PanelLibraryData?: PanelLibraryDataResolvers<ContextType>;
  PanelLink?: PanelLinkResolvers<ContextType>;
  PanelMetaData?: PanelMetaDataResolvers<ContextType>;
  PanelMetadataValueTooltip?: PanelMetadataValueTooltipResolvers<ContextType>;
  PanelRelation?: PanelRelationResolvers<ContextType>;
  PanelRelationMetaData?: PanelRelationMetaDataResolvers<ContextType>;
  PanelRelationRootData?: PanelRelationRootDataResolvers<ContextType>;
  PanelStatus?: PanelStatusResolvers<ContextType>;
  PanelThumbnail?: PanelThumbnailResolvers<ContextType>;
  Partner?: PartnerResolvers<ContextType>;
  PermissionMapping?: PermissionMappingResolvers<ContextType>;
  PermissionRequestInfo?: PermissionRequestInfoResolvers<ContextType>;
  PermissionResult?: PermissionResultResolvers<ContextType>;
  Person?: PersonResolvers<ContextType>;
  PillFormatter?: PillFormatterResolvers<ContextType>;
  Place?: PlaceResolvers<ContextType>;
  Playing?: PlayingResolvers<ContextType>;
  PreviewComponent?: PreviewComponentResolvers<ContextType>;
  PreviewConfiguration?: PreviewConfigurationResolvers<ContextType>;
  Publisher?: PublisherResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Reading?: ReadingResolvers<ContextType>;
  RegexpMatchFormatter?: RegexpMatchFormatterResolvers<ContextType>;
  RelationField?: RelationFieldResolvers<ContextType>;
  RepetitionConfig?: RepetitionConfigResolvers<ContextType>;
  RepetitiveCreatableType?: RepetitiveCreatableTypeResolvers<ContextType>;
  RepetitiveFinalize?: RepetitiveFinalizeResolvers<ContextType>;
  RepetitiveFinalizeRelation?: RepetitiveFinalizeRelationResolvers<ContextType>;
  RepetitiveForm?: RepetitiveFormResolvers<ContextType>;
  RepetitiveHostFinalize?: RepetitiveHostFinalizeResolvers<ContextType>;
  RepetitiveMetadataPrefill?: RepetitiveMetadataPrefillResolvers<ContextType>;
  RepetitiveRelationMetadataField?: RepetitiveRelationMetadataFieldResolvers<ContextType>;
  RepetitiveStep?: RepetitiveStepResolvers<ContextType>;
  RepetitiveStepOverviewField?: RepetitiveStepOverviewFieldResolvers<ContextType>;
  RepetitiveStepRelation?: RepetitiveStepRelationResolvers<ContextType>;
  RepetitiveStepScope?: RepetitiveStepScopeResolvers<ContextType>;
  RequiredOneOfMetadataValidation?: RequiredOneOfMetadataValidationResolvers<ContextType>;
  RequiredOneOfRelationValidation?: RequiredOneOfRelationValidationResolvers<ContextType>;
  RequiredRelationValidation?: RequiredRelationValidationResolvers<ContextType>;
  RouteMatching?: RouteMatchingResolvers<ContextType>;
  SavedSearch?: SavedSearchResolvers<ContextType>;
  ShareLink?: ShareLinkResolvers<ContextType>;
  SingleMediaFileElement?: SingleMediaFileElementResolvers<ContextType>;
  Siso?: SisoResolvers<ContextType>;
  SortOptions?: SortOptionsResolvers<ContextType>;
  StringOrInt?: GraphQLScalarType;
  SubField?: SubFieldResolvers<ContextType>;
  SubJobResults?: SubJobResultsResolvers<ContextType>;
  TagConfigurationByEntity?: TagConfigurationByEntityResolvers<ContextType>;
  TaggableEntityConfiguration?: TaggableEntityConfigurationResolvers<ContextType>;
  TaggingExtensionConfiguration?: TaggingExtensionConfigurationResolvers<ContextType>;
  TargetAudience?: TargetAudienceResolvers<ContextType>;
  Tenant?: TenantResolvers<ContextType>;
  Time?: TimeResolvers<ContextType>;
  Title?: TitleResolvers<ContextType>;
  Token?: TokenResolvers<ContextType>;
  TransliterationConfigItem?: TransliterationConfigItemResolvers<ContextType>;
  UploadContainer?: UploadContainerResolvers<ContextType>;
  UploadField?: UploadFieldResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Validation?: ValidationResolvers<ContextType>;
  ValueMapping?: ValueMappingResolvers<ContextType>;
  ViewModesWithConfig?: ViewModesWithConfigResolvers<ContextType>;
  VirtualKeyboardConfig?: VirtualKeyboardConfigResolvers<ContextType>;
  VisibleIf?: VisibleIfResolvers<ContextType>;
  Watching?: WatchingResolvers<ContextType>;
  WindowElement?: WindowElementResolvers<ContextType>;
  WindowElementBulkDataPanel?: WindowElementBulkDataPanelResolvers<ContextType>;
  WindowElementPanel?: WindowElementPanelResolvers<ContextType>;
  WindowElementStatus?: WindowElementStatusResolvers<ContextType>;
  Work?: WorkResolvers<ContextType>;
  WorkComputerFile?: WorkComputerFileResolvers<ContextType>;
  WorkFootage?: WorkFootageResolvers<ContextType>;
  WorkMap?: WorkMapResolvers<ContextType>;
  WorkMixedMaterial?: WorkMixedMaterialResolvers<ContextType>;
  WorkMusic?: WorkMusicResolvers<ContextType>;
  WorkSerial?: WorkSerialResolvers<ContextType>;
  WorkWord?: WorkWordResolvers<ContextType>;
  WysiwygElement?: WysiwygElementResolvers<ContextType>;
  WysiwygElementConfiguration?: WysiwygElementConfigurationResolvers<ContextType>;
  WysiwygTransliterationConfig?: WysiwygTransliterationConfigResolvers<ContextType>;
  Zizo?: ZizoResolvers<ContextType>;
  ZizoDeelrubriek?: ZizoDeelrubriekResolvers<ContextType>;
  ZizoDomein?: ZizoDomeinResolvers<ContextType>;
  ZizoGroeirubriek?: ZizoGroeirubriekResolvers<ContextType>;
  ZizoHoofdrubriek?: ZizoHoofdrubriekResolvers<ContextType>;
  ZizoKast?: ZizoKastResolvers<ContextType>;
  ZizoPlank?: ZizoPlankResolvers<ContextType>;
  ZizoRug?: ZizoRugResolvers<ContextType>;
  teaserMetadata?: TeaserMetadataResolvers<ContextType>;
  userPermissions?: UserPermissionsResolvers<ContextType>;
};

