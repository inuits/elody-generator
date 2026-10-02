/**
 * `generate` renders a client's declaration into its query documents;
 * `check` reports drift instead of writing. Per entity, `elody:emit "file"`
 * renders the whole document, `"regions"` splices the declarative sections
 * between markers in a hand-written file. A client without a declaration is
 * untouched: nothing to read, nothing written.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, relative } from "path";
import type { UiEntity } from "./model.js";
import { Ontology, defaultOntology } from "./ontology.js";
import { readUiDeclaration } from "./parse.js";
import type { Warning } from "./reading.js";
import {
  lowerFirst,
  renderEntityFile,
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

export function generate(options: GenerateOptions): GenerateResult {
  const { root, check = false, log = () => {} } = options;
  const ontology = options.ontology ?? defaultOntology();
  const declaration = options.declaration ?? findDeclaration(root);
  if (!declaration) return { entities: [], warnings: [], changed: [], clean: true };

  const ttl = readFileSync(join(root, declaration), "utf-8");
  const { entities, warnings } = readUiDeclaration(ttl, ontology);
  const changed: string[] = [];

  const apply = (file: string, next: string) => {
    const path = join(root, file);
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === next) return;
    changed.push(file);
    if (check) log(`${file} is out of date with ${declaration}`);
    else {
      writeFileSync(path, next);
      log(`updated ${file}`);
    }
  };

  for (const entity of entities) {
    const file = fileTargetFor(entity.graphqlType);
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

  return { declaration: relative(root, join(root, declaration)), entities, warnings, changed, clean: changed.length === 0 };
}
