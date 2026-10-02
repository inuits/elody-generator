/**
 * The elody: ontology as the generator's single source of terms: enumeration
 * instances and their GraphQL literals, editors and viewers with their Elody
 * widget names, retired terms with their replacements, platform forms.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Reading } from "./reading.js";
import { DCTERMS, OWL, RDF, SH, SHUI, XSD, compact, elody, rdfs, shui } from "./vocab.js";

const here = dirname(fileURLToPath(import.meta.url));
export const ONTOLOGY_PATH = join(here, "..", "ontology", "elody-ui.ttl");
export const META_SHAPES_PATH = join(here, "..", "ontology", "elody-ui.shapes.ttl");

export type EditorFacts = {
  datatype?: string;
  hasClass: boolean;
  hasNode: boolean;
  hasIn: boolean;
  nodeKind?: string;
  singleLine?: boolean;
};

export class Ontology {
  readonly reading: Reading;

  constructor(ttl: string) {
    this.reading = Reading.parse(ttl);
  }

  static load(path = ONTOLOGY_PATH): Ontology {
    return new Ontology(readFileSync(path, "utf-8"));
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

  /**
   * The shui editor the spec's inference picks for a property shape without an
   * explicit editor (SHACL 1.2 UI scoring, same outcome): enumeration, nested
   * shape, class, datatype, node kind, single line.
   */
  inferEditor(facts: EditorFacts): string {
    if (facts.hasIn) return shui("EnumSelectEditor");
    if (facts.hasNode) return shui("DetailsEditor");
    if (facts.hasClass) return shui("InstancesSelectEditor");
    const datatype = facts.datatype ?? "";
    if (datatype === `${RDF}langString`)
      return facts.singleLine === false ? shui("TextAreaWithLangEditor") : shui("TextFieldWithLangEditor");
    const numeric = ["integer", "decimal", "double", "float", "int", "long", "nonNegativeInteger", "positiveInteger"];
    if (numeric.some((name) => datatype === `${XSD}${name}`)) return shui("NumberFieldEditor");
    if (datatype === `${XSD}boolean`) return shui("BooleanEditor");
    if (datatype === `${XSD}date`) return shui("DatePickerEditor");
    if (datatype === `${XSD}dateTime`) return shui("DateTimePickerEditor");
    if (datatype === `${XSD}anyURI` || (!datatype && facts.nodeKind === `${SH}IRI`)) return shui("IRIEditor");
    if (facts.singleLine === false) return shui("TextAreaEditor");
    return shui("TextFieldEditor");
  }
}

let cached: Ontology | undefined;
export const defaultOntology = (): Ontology => (cached ??= Ontology.load());
