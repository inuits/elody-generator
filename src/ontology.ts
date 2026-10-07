/**
 * The elody: ontology as the generator's single source of terms, read from two
 * files: the vocabulary (elody-ontology, ui/: what a declaration may
 * say, retired terms with their replacements) and the implementation bindings
 * kept here (ontology/elody-ui.bindings.ttl: the GraphQL literal of each
 * enumeration instance, the widget of each editor and viewer, platform forms).
 */
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Reading } from "./reading.js";
import { DCTERMS, OWL, SHUI, compact, elody, rdfs } from "./vocab.js";

const moduleRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The UI vocabulary's directory in elody-ontology: ELODY_ONTOLOGY when set, else
 * the installed package, else the checkout next to this one at the root of
 * elody-common.
 */
function vocabularyDir(): string {
  const chosen = process.env.ELODY_ONTOLOGY;
  if (chosen) {
    // a directory named on purpose is the one meant: no silent fallback
    if (!existsSync(join(chosen, "ui", "elody-ui.ttl"))) throw new Error(`ELODY_ONTOLOGY=${chosen} has no ui/elody-ui.ttl`);
    return join(chosen, "ui");
  }
  const candidates = [join(moduleRoot, "node_modules", "elody-ontology"), join(moduleRoot, "..", "elody-ontology")];
  const found = candidates.find((dir) => existsSync(join(dir, "ui", "elody-ui.ttl")));
  if (!found) throw new Error(`elody-ontology not found (looked in ${candidates.join(", ")}): install it or set ELODY_ONTOLOGY`);
  return join(found, "ui");
}

/** The vocabulary: what a declaration may say (elody-ontology, ui/). */
export const VOCABULARY_PATH = join(vocabularyDir(), "elody-ui.ttl");
/** The meta-shapes a declaration must conform to (elody-ontology, ui/). */
export const META_SHAPES_PATH = join(vocabularyDir(), "elody-ui.shapes.ttl");
/** How Elody implements the vocabulary: GraphQL literals, widgets, schema fields (this module). */
export const BINDINGS_PATH = join(moduleRoot, "ontology", "elody-ui.bindings.ttl");
/** @deprecated the vocabulary alone; use VOCABULARY_PATH (the generator reads it with BINDINGS_PATH). */
export const ONTOLOGY_PATH = VOCABULARY_PATH;

export class Ontology {
  readonly reading: Reading;

  constructor(ttl: string) {
    this.reading = Reading.parse(ttl);
  }

  /** The vocabulary and the bindings, read as one graph. */
  static load(paths: string[] = [VOCABULARY_PATH, BINDINGS_PATH]): Ontology {
    return new Ontology(paths.map((path) => readFileSync(path, "utf-8")).join("\n"));
  }

  /** The GraphQL literal of an enumeration instance; throws for an unknown IRI. */
  enumValue(iri: string): string {
    const value = this.reading.value(iri, elody("enumValue"));
    if (value === undefined) throw new Error(`${compact(iri)} is not an enumeration instance of the elody: ontology`);
    return value;
  }

  isInstanceOf(iri: string, classIri: string): boolean {
    return this.reading.hasType(iri, classIri);
  }

  /** Elody InputFieldTypes value of a shui:/elody: editor (runtime metadata forms). */
  inputFieldType(editorIri: string): string | undefined {
    return this.reading.value(editorIri, elody("inputFieldType"));
  }

  /** Elody BaseFieldType value of an editor (create forms, GetDynamicForm). */
  formFieldType(editorIri: string): string | undefined {
    return this.reading.value(editorIri, elody("formFieldType"));
  }

  /** The Elody field a single-value editor becomes when the property may hold several values. */
  multipleValuesInputFieldType(editorIri: string): string | undefined {
    return this.reading.value(editorIri, elody("multipleValuesInputFieldType"));
  }

  /** The element a widget is inside a detail panel (rich text, a list of related entities), if any. */
  panelElement(widgetIri: string | undefined): "wysiwyg" | "list" | undefined {
    const element = widgetIri ? this.reading.value(widgetIri, elody("panelElement")) : undefined;
    return element === elody("WysiwygElement") ? "wysiwyg" : element === elody("ListElement") ? "list" : undefined;
  }

  /** Whether an editor edits language-tagged text (one multilingual value in Elody). */
  multilingual(editorIri: string | undefined): boolean {
    return editorIri !== undefined && this.reading.literal(editorIri, elody("multilingual")) === true;
  }

  /** Editor whose create-form field type is `value`, preferring the shui: one. */
  editorForFormFieldType(value: string): string | undefined {
    const candidates = this.reading.subjectsWith(elody("formFieldType"), value);
    return candidates.find((candidate) => candidate.startsWith(SHUI)) ?? candidates[0];
  }

  /** Elody formatter name of a viewer ("" for the plain literal viewer). */
  formatterValue(viewerIri: string): string | undefined {
    return this.reading.value(viewerIri, elody("formatterValue"));
  }

  /** Viewer whose formatter name is `value`, preferring the elody: one. */
  viewerFor(formatter: string): string | undefined {
    const candidates = this.reading.subjectsWith(elody("formatterValue"), formatter);
    return candidates.find((candidate) => candidate.startsWith(elody(""))) ?? candidates[0];
  }

  /** The instance of `classIri` whose enumValue is `value` (the reverse of enumValue). */
  instanceFor(classIri: string, value: string): string | undefined {
    return this.reading
      .subjectsWith(elody("enumValue"), value)
      .find((candidate) => this.reading.hasType(candidate, classIri));
  }

  isDeprecated(iri: string): boolean {
    return this.reading.hasType(iri, `${OWL}DeprecatedProperty`);
  }

  deprecatedTerms(): string[] {
    return this.reading.subjectsOfType(`${OWL}DeprecatedProperty`);
  }

  replacementOf(iri: string): string[] {
    return this.reading.values(iri, `${DCTERMS}isReplacedBy`);
  }

  /** The query name of a platform form referenced by IRI, if the ontology declares it. */
  platformFormQueryName(iri: string): string | undefined {
    return this.reading.hasType(iri, elody("PlatformForm")) ? this.reading.value(iri, elody("queryName")) : undefined;
  }

  /** Every elody: term the ontology defines (classes, properties, instances). */
  terms(): string[] {
    return this.reading.subjects().filter((subject) => subject.startsWith(elody("")));
  }

  comment(iri: string): string | undefined {
    return this.reading.value(iri, rdfs("comment"));
  }
}

let cached: Ontology | undefined;
export const defaultOntology = (): Ontology => (cached ??= Ontology.load());
