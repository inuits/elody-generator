/**
 * `generate` renders a client's declaration into its query documents;
 * `check` reports drift instead of writing. Per entity, `elody:emit "file"`
 * renders the whole document, `"regions"` splices the declarative sections
 * between markers in a hand-written file. A client without a declaration is
 * untouched: nothing to read, nothing written.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import type { UiEntity } from "./model.js";
import { Ontology, defaultOntology } from "./ontology.js";
import { readUiDeclaration } from "./parse.js";
import type { Warning } from "./reading.js";
import {
  lowerFirst,
  renderEntityFile,
  renderInputFieldsModule,
  renderInitialValues,
  renderSortOptions,
  renderTeaserFields,
  renderViewModes,
  replaceRegion,
} from "./render.js";

export type GenerateOptions = {
  root: string;
  /** declaration path relative to root; default: the first src/ui/*.ui.ttl */
  declaration?: string;
  check?: boolean;
  ontology?: Ontology;
  log?: (line: string) => void;
};

export type GenerateResult = {
  declaration?: string;
  entities: UiEntity[];
  warnings: Warning[];
  /** files written (generate) or out of date (check) */
  changed: string[];
  clean: boolean;
};

export const DECLARATION_DIR = "src/ui";

export function findDeclaration(root: string): string | undefined {
  const dir = join(root, DECLARATION_DIR);
  if (!existsSync(dir)) return undefined;
  const found = readdirSync(dir)
    .filter((name) => name.endsWith(".ui.ttl"))
    .sort();
  return found.length ? join(DECLARATION_DIR, found[0]) : undefined;
}

export const fileTargetFor = (graphqlType: string): string =>
  `src/queries/entities/${lowerFirst(graphqlType)}.queries.ts`;

/** Set `value` at a dotted key inside a nested translation object; true when it changed. */
function setNested(target: Record<string, unknown>, dotted: string, value: string): boolean {
  const parts = dotted.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    if (next === undefined) node = node[part] = {} as Record<string, unknown>;
    else if (typeof next === "object" && next !== null) node = next as Record<string, unknown>;
    else throw new Error(`translation key ${dotted} collides with the text at ${part}`);
  }
  const last = parts[parts.length - 1];
  if (node[last] === value) return false;
  node[last] = value;
  return true;
}

export const TRANSLATIONS_DIR = "src/translations";

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { root, check = false, log = () => {} } = options;
  const ontology = options.ontology ?? defaultOntology();
  const declaration = options.declaration ?? findDeclaration(root);
  if (!declaration) return { entities: [], warnings: [], changed: [], clean: true };

  const ttl = readFileSync(join(root, declaration), "utf-8");
  const { entities, warnings, translations, inputFields, sources } = await readUiDeclaration(ttl, ontology);
  const changed: string[] = [];

  const apply = (file: string, next: string) => {
    const path = join(root, file);
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === next) return;
    changed.push(file);
    if (check) log(`${file} is out of date with ${declaration}`);
    else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, next);
      log(`updated ${file}`);
    }
  };

  for (const entity of entities) {
    const file = fileTargetFor(entity.documentName ?? entity.graphqlType);
    if (entity.emit === "file") {
      apply(file, renderEntityFile(entity, declaration));
      continue;
    }
    const path = join(root, file);
    if (!existsSync(path)) throw new Error(`${entity.graphqlType} emits regions but ${file} does not exist`);
    const prefix = lowerFirst(entity.graphqlType);
    let patched = readFileSync(path, "utf-8");
    patched = replaceRegion(patched, `${prefix}-initial-values`, renderInitialValues(entity, 6));
    patched = replaceRegion(patched, `${prefix}-view-modes`, renderViewModes(entity, 4));
    patched = replaceRegion(patched, `${prefix}-teaser-fields`, renderTeaserFields(entity, 6));
    patched = replaceRegion(patched, `${prefix}-sort-options`, renderSortOptions(entity, 4));
    apply(file, patched);
  }

  if (Object.keys(inputFields).length)
    apply(join(DECLARATION_DIR, "generatedFields.ts"), renderInputFieldsModule(inputFields, declaration));

  // the linked-data sources the fields read, for collection-api (its SPARQL_SOURCES names this file)
  if (Object.keys(sources).length)
    apply(join(DECLARATION_DIR, "sparqlSources.json"), JSON.stringify(sources, null, 2) + "\n");

  // the label texts of the declaration go into the client's translation bundles
  for (const [language, entries] of Object.entries(translations)) {
    const file = join(TRANSLATIONS_DIR, `${language}.json`);
    const path = join(root, file);
    const bundle = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : { [language]: {} };
    bundle[language] ??= {};
    let changedBundle = false;
    for (const [key, text] of Object.entries(entries)) changedBundle = setNested(bundle[language], key, text) || changedBundle;
    if (changedBundle) apply(file, JSON.stringify(bundle, null, 2) + "\n");
  }

  return { declaration: relative(root, join(root, declaration)), entities, warnings, changed, clean: changed.length === 0 };
}
