export * from "./model.js";
export * from "./vocab.js";
export { Reading, type Warning } from "./reading.js";
export { Ontology, defaultOntology, ONTOLOGY_PATH, VOCABULARY_PATH, BINDINGS_PATH, META_SHAPES_PATH } from "./ontology.js";
export { readUiDeclaration, parseUiDeclaration, pickerFiltersNameFor } from "./parse.js";
export * from "./render.js";
export { generate, findDeclaration, fileTargetFor, type GenerateOptions, type GenerateResult } from "./generate.js";
export { validateDeclaration, formatIssue, type ValidationReport, type ValidationIssue } from "./validate.js";
export { migrateDeclaration, type MigrationResult } from "./migrate.js";
export {
  compareClient,
  compareDefinitions,
  extractGqlDocuments,
  firstDifference,
  formatCompareReport,
  normalizeDefinition,
  normalizeNode,
  queryFiles,
  readDefinitions,
  readQueryFiles,
  type CompareOptions,
  type CompareReport,
  type Comparison,
  type Definition,
  type DefinitionResult,
  type FileResult,
  type Scope,
  type Status,
  type Summary,
} from "./compare.js";
export { extractDeclaration, extractDeclarationFiles, Extractor, type ExtractOptions, type ExtractResult, type ExtractFilesResult } from "./extract.js";
export { loadDeclaration, declarationFiles, declarationFileFor, declaredSubjects, isDeclarationDir } from "./declarationFiles.js";
export { readReference, renderReference, curie, type Reference } from "./reference.js";
export { expandDeclaration, type ExpandResult } from "./expand.js";
export { conventionalLabelKey } from "./vocab.js";
