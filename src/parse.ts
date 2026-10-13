/**
 * *.ui.ttl -> the UI model. Reads the 0.1 vocabulary (instances, node
 * references, sh:/shui:/dash: terms) and, for one release, the retired dialect
 * (strings, name references, elody:hidden & co) with a warning per retired term
 * so `check` can report what to migrate.
 */
import { Parser, type Quad, type Term } from "n3";
import { expandExternalSources, type SparqlSourceJson } from "./externalSources.js";
import { Scorer } from "./score.js";
import * as M from "./model.js";
import { Ontology, defaultOntology } from "./ontology.js";
import { Reading, type Literal, type Warning } from "./reading.js";
import { DASH, ELODY_LEGACY, compact, dash, elody, localName, rdf, rdfs, sh, shui } from "./vocab.js";

/** Label texts per language and translation key, from sh:name / rdfs:label literals. */
export type Translations = Record<string, Record<string, string>>;

/** A custom input field definition, as a client registers it with ElodyInstance (customInputFields). */
export type InputFieldDefinition = Record<string, unknown>;

export type ParseResult = {
  entities: M.UiEntity[];
  warnings: Warning[];
  translations: Translations;
  /** generated custom input fields, by BaseFieldType name */
  inputFields: Record<string, InputFieldDefinition>;
  /** the linked-data sources the declaration reads (collection-api's SPARQL_SOURCES), by Elody type */
  sources: Record<string, SparqlSourceJson>;
};

export async function readUiDeclaration(ttl: string, ontology: Ontology = defaultOntology()): Promise<ParseResult> {
  const quads = new Parser().parse(ttl);
  // properties whose values a linked-data source holds, spelled out in declaration terms first
  const reading = new Reading([...quads, ...expandExternalSources(quads)]);
  const editors = await scoreEditors(reading);
  const parse = new Parse(reading, ontology, editors);
  const entities = reading.subjectsOfType(elody("EntityUi")).map((subject) => parse.entity(subject));
  // a result rendered from an inline listing references that EntityUi: resolved once every type is parsed
  const byIri = new Map(entities.map((entity) => [entity.iri, entity]));
  for (const entity of entities)
    for (const query of [...entity.pickers, ...entity.listQueries])
      for (const result of query.results)
        if (result.listingIri) {
          result.listing = byIri.get(result.listingIri);
          if (!result.listing) reading.warn(result.listingIri, `elody:listing references no EntityUi (result ${result.type} of ${query.queryName})`);
        }
  const sources = Object.fromEntries(
    reading
      .subjectsOfType(elody("EntityUi"))
      .filter((subject) => reading.node(subject, elody("readsFrom")))
      .map((subject) => [parse.typeKeyOf(subject), parse.sourceOf(subject)]),
  );
  return { entities, warnings: reading.warnings, translations: parse.translations, inputFields: parse.inputFields, sources };
}

export async function parseUiDeclaration(ttl: string, ontology: Ontology = defaultOntology()): Promise<M.UiEntity[]> {
  return (await readUiDeclaration(ttl, ontology)).entities;
}

/**
 * The SHACL 1.2 UI scoring system picks the editor of every property shape:
 * the create-form fields (under an elody:Form's elody:shape), the entity's
 * properties and the property shapes of nested node shapes. Shapes without
 * any scored editor get none here; the parser falls back to a text field,
 * which is the renderer's choice the spec leaves open.
 */
async function scoreEditors(reading: Reading): Promise<Map<string, string>> {
  const fields = [
    ...new Set(
      reading
        .quads()
        .filter((q) => q.predicate.value === sh("property") && q.object.termType !== "Literal")
        .map((q) => q.object.value),
    ),
  ];
  const editors = new Map<string, string>();
  if (!fields.length) return editors;
  const scorer = await Scorer.create({ shapes: reading.quads() });
  for (const field of fields) {
    const term = reading.quadsOf(field)[0]?.subject;
    if (!term) continue;
    const best = (await scorer.editors(term))[0];
    if (best) editors.set(field, best.widget);
  }
  return editors;
}

/** Derive a picker's filters document name from its listing document name. */
export const pickerFiltersNameFor = (queryName: string): string =>
  queryName.includes("List") ? queryName.replace("List", "Filters") : `${queryName}Filters`;

/** Element classes the ontology defines but the generator cannot render yet. */
const UNRENDERED_ELEMENTS = [
  "MediaFileElement", "HierarchyListElement",
  "ManifestViewerElement", "ActionElement", "WysiwygElement",
].map((name) => elody(name));

const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Basic filtering (RFC 4647 §3.3.1): en-US matches the preferred language en. */
const languageMatches = (tag: string, preferred: string) => {
  const t = tag.toLowerCase(), p = preferred.toLowerCase();
  return t === p || t.startsWith(`${p}-`);
};

class Parse {
  readonly translations: Translations = {};
  readonly inputFields: Record<string, InputFieldDefinition> = {};
  private groupFields = new Map<string, string[]>();
  /** the list queries the entity being parsed emits, by node */
  private listQueries = new Map<string, M.UiPicker>();
  /** list queries already emitted by an earlier type: a shared one is emitted once */
  private readonly emittedListQueries = new Set<string>();
  /** forms, pickers, custom bulk operations and guided flows already emitted by an earlier type: a shared node goes with the first */
  private readonly emittedNodes = new Set<string>();

  /** Whether this entity emits the document: the first type referencing a shared document does, the others only name it. */
  private emitsOnce(name: string): boolean {
    if (this.emittedNodes.has(name)) return false;
    this.emittedNodes.add(name);
    return true;
  }
  /** keys of the entity's properties without sh:group, in the spec's order */
  private ungroupedFields: string[] = [];
  /** lower-cased GraphQL type of the entity being parsed, for minted label keys */
  private type = "";

  /**
   * A declaration in the retired dialect (the old namespace, or any retired term): it was written
   * when the generator always read relationValues and always emitted the bulk operations fragment,
   * so those stay its defaults until it is migrated (migrate makes them explicit).
   */
  private readonly legacy: boolean;

  constructor(
    private readonly r: Reading,
    private readonly o: Ontology,
    private readonly scoredEditors: Map<string, string> = new Map(),
  ) {
    this.legacy = r.quads().some((quad) => quad.predicate.value.startsWith(ELODY_LEGACY) || o.isDeprecated(quad.predicate.value));
  }

  // -- keys and labels (sh:name = label text, sh:path = key) ----------------------

  /** The metadata key of a property shape: elody:key, else the sh:path local name, else (old use) sh:name. */
  private keyOf(node: string): string {
    const r = this.r;
    const explicit = r.value(node, elody("key"));
    if (explicit) return explicit;
    // an inverse path is keyed by the relation it reads (there is no metadata key of its own)
    if (this.inversePredicate(node)) return this.relationTypeOf(node)!;
    const path = r.node(node, sh("path"));
    if (path && !path.startsWith("_:") && !path.startsWith("n3-") && /[:/#]/.test(path)) return localName(path);
    const name = r.literals(node, sh("name"))[0];
    if (name !== undefined) {
      r.warn(node, "sh:name used as the metadata key: give the property an sh:path (or elody:key); sh:name is the label text");
      return name;
    }
    return "";
  }

  /** shui:labelPreference of the global configuration: the label properties, in order. */
  private get labelPreference(): string[] {
    const config = this.r.subjectsOfType(shui("Configuration"))[0];
    return config ? this.r.list(this.r.node(config, shui("labelPreference"))) : [];
  }

  /** shui:languagePreference of the global configuration, without "" (no language tag). */
  private get languagePreference(): string[] {
    const config = this.r.subjectsOfType(shui("Configuration"))[0];
    return config ? this.r.list(this.r.node(config, shui("languagePreference"))).filter((language) => language !== "") : [];
  }

  /** The predicate of a predicate or inverse path. */
  private predicateOf(node: string): string | undefined {
    const path = this.r.node(node, sh("path"));
    if (path && !path.startsWith("_:") && !path.startsWith("n3-") && /[:/#]/.test(path)) return path;
    return this.inversePredicate(node);
  }

  /**
   * SHACL 1.2 UI property label: the label properties (shui:labelPreference,
   * default sh:name) on the property shape, then on its predicate (the data and
   * shapes graphs fromShacl carried into the declaration), then the predicate's
   * local name. That last step is the key for a predicate path, which the
   * renderer shows already; an inverse path, keyed by its relation, gets it here.
   */
  private propertyLabel(node: string, key: string, minted: string): string | undefined {
    const predicate = this.predicateOf(node);
    const label = this.labelOf(node, this.labelPreference.length ? this.labelPreference : [sh("name")], minted, key, predicate ? [predicate] : []);
    if (label !== undefined) return label;
    return predicate && localName(predicate) !== key ? localName(predicate) : undefined;
  }

  /**
   * SHACL 1.2 UI value-node label of a related entity, as metadata keys in
   * preference order (metadataKeyAsLabel): the LabelRole property of the
   * related class's node shape, the label properties (shui:labelPreference,
   * default rdfs:label), then Elody's own title and name.
   */
  private valueLabelKeyOf(node: string): string {
    const r = this.r;
    const explicit = r.value(node, elody("valueLabelKey"));
    // an empty key reads the relation without a label key
    if (explicit !== undefined) return explicit;
    // a resource of a linked-data source is titled by its label
    if (r.node(node, elody("optionsFrom"))) return "title";
    const cls = r.node(node, sh("class"));
    let roleKey: string | undefined;
    for (const shape of cls ? r.subjectsWith(sh("targetClass"), cls) : []) {
      const roles = r
        .nodes(shape, sh("property"))
        .map((property) => {
          const role = r.node(property, shui("propertyRole"));
          if (role === shui("LabelRole")) return { property, order: Number.MAX_SAFE_INTEGER };
          if (role && r.node(role, shui("propertyRole")) === shui("LabelRole")) return { property, order: r.order(role) };
          return undefined;
        })
        .filter((found): found is { property: string; order: number } => found !== undefined)
        .sort((a, b) => a.order - b.order);
      if (roles.length) {
        roleKey = this.keyOf(roles[0].property);
        break;
      }
    }
    const preferred = (this.labelPreference.length ? this.labelPreference : [rdfs("label")]).map(localName);
    return [...new Set([roleKey, ...preferred, "title", "name"].filter((key): key is string => Boolean(key)))].join("|");
  }

  /** An sh:in option that is an IRI, labelled by value-node label resolution from the declaration. */
  private iriOption(iri: string, key: string): { label: string; value: string } {
    const preferred = this.labelPreference.length ? this.labelPreference : [rdfs("label")];
    const label = this.labelOf(iri, preferred, `ui.${this.type}.${key}.${localName(iri)}`);
    return { label: label ?? localName(iri), value: iri };
  }

  /**
   * The properties an editable panel shows get the create form's widget
   * (a relation-valued one its relation dropdown, which needs sh:class); a
   * read-only property (dash:readOnly) none. Only those: a widget is also a
   * generated custom input field the client registers.
   */
  private withEditWidgets(detail: M.UiDetail | undefined, parsed: { node: string; property: M.UiProperty }[], fragments: M.UiElementsFragment[] = []): M.UiDetail | undefined {
    // the panels of the detail columns and of the elements fragments the file holds
    const elements = [...(detail?.columns.flatMap((column) => column.elements) ?? []), ...fragments.flatMap((fragment) => fragment.elements)];
    if (!elements.length) {
      for (const { node, property } of parsed) if ((property.cardEditable || property.panelWidget) && !property.editInputType) property.editInputType = this.editWidget(node);
      return detail;
    }
    const edited = new Set(elements.flatMap((element) => element.panels.filter((panel) => panel.editable).flatMap((panel) => panel.fields)));
    // a card edited in place carries the property's widget too
    for (const { node, property } of parsed) if (property.cardEditable && !property.editInputType) property.editInputType = this.editWidget(node);
    for (const { node, property } of parsed)
      if (!property.panelElement && !property.editInputType && (edited.has(property.key) || property.panelWidget || this.overriddenWithWidget(elements).has(property.key))) property.editInputType = this.editWidget(node);
    return detail;
  }

  /** The keys an elody:panelField shows with a widget of its own (elody:panelWidget true) in some panel. */
  private overriddenWithWidget(elements: M.UiElement[]): Set<string> {
    return new Set(elements.flatMap((element) => element.panels.flatMap((panel) => (panel.fieldOverrides ?? []).filter((o) => o.widget === true).map((o) => o.key))));
  }

  /** The create form's widget for a property, to edit it on the detail page; none when Elody cannot write it. */
  private editWidget(node: string): string | undefined {
    // the client registers the field itself
    const client = this.r.value(node, elody("clientInputField"));
    if (client) return client;
    // a typed-in IRI is a table of relations, which the detail page would show
    // instead of the related entity's label: it is entered in the create form only
    if (this.inversePredicate(node) && !this.r.node(node, sh("class"))) return undefined;
    try {
      return this.formField(node).inputType;
    } catch {
      return undefined;
    }
  }

  /** sh:languageIn of a property shape, in its order (the spec gives the order a meaning). */
  private languageInOf(node: string): string[] {
    const list = this.r.node(node, sh("languageIn"));
    return list ? this.r.list(list) : [];
  }

  /** ex:p of sh:path [ sh:inversePath ex:p ], if the property shape has one. */
  private inversePredicate(node: string): string | undefined {
    const path = this.r.node(node, sh("path"));
    if (!path || !(path.startsWith("_:") || path.startsWith("n3-") || !/[:/#]/.test(path))) return undefined;
    return this.r.node(path, sh("inversePath"));
  }

  /**
   * The Elody relation a relation-valued property reads and writes:
   * elody:relationType, else has<X> for sh:path ex:x with sh:class, else
   * is<X>For for sh:path [ sh:inversePath ex:x ] — the mirror collection-api
   * stores on this entity when the other one gets has<X>.
   */
  private relationTypeOf(node: string): string | undefined {
    const explicit = this.r.value(node, elody("relationType"));
    if (explicit) return explicit;
    const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    const inverse = this.inversePredicate(node);
    if (inverse) return `is${cap(localName(inverse))}For`;
    if (this.r.node(node, sh("class")) || this.r.node(node, elody("optionsFrom"))) return `has${cap(this.keyOf(node))}`;
    return undefined;
  }

  private addTranslation(language: string, key: string, text: string) {
    (this.translations[language] ??= {})[key] = text;
  }

  /**
   * The label a renderer shows, as an Elody translation key: elody:labelKey, else
   * (old use) rdfs:label on a property shape, else a key minted from `minted`
   * when the label text is language-tagged. The tagged texts land in
   * `translations` under that key. An untagged text is the label itself.
   *
   * The texts are those of the first label property (in `textPredicates`'
   * order) that `node` has, else that the `fallbackSubjects` have, in order:
   * the steps of SHACL 1.2 UI label resolution.
   */
  private labelOf(
    node: string,
    textPredicate: string | string[],
    minted: string,
    legacyKey?: string,
    fallbackSubjects: string[] = [],
  ): string | undefined {
    const r = this.r;
    const predicates = Array.isArray(textPredicate) ? textPredicate : [textPredicate];
    let texts: Quad[] = [];
    for (const subject of [node, ...fallbackSubjects]) {
      for (const predicate of predicates) {
        texts = r.quadsOf(subject).filter((q) => q.predicate.value === predicate && q.object.termType === "Literal");
        if (texts.length) break;
      }
      if (texts.length) break;
    }
    const tagged = texts.filter((q) => (q.object as Term & { language?: string }).language);
    let key = r.value(node, elody("labelKey"));
    if (!key && predicates.includes(sh("name")) && r.has(node, rdfs("label"))) {
      r.warn(node, "rdfs:label on a property shape is read as an Elody translation key: use elody:labelKey, and sh:name for the label text");
      key = r.value(node, rdfs("label"));
    }
    if (!key && tagged.length) key = minted;
    const languageIn = this.languageInOf(node);
    const preferred = this.languagePreference;
    if (key && (languageIn.length || preferred.length) && tagged.length) {
      // SHACL 1.2 UI language resolution: the label in the sh:languageIn order first, then the
      // bundle's own language (the application's), then shui:languagePreference as the fallback
      const textIn = (language: string) =>
        tagged.find((q) => languageMatches((q.object as Term & { language: string }).language, language))?.object.value;
      const bundles = new Set([...tagged.map((q) => (q.object as Term & { language: string }).language), ...languageIn, ...preferred]);
      for (const bundle of bundles) {
        const text = [...languageIn, bundle, ...preferred].map(textIn).find((found) => found !== undefined);
        if (text !== undefined) this.addTranslation(bundle, key, text);
      }
    } else for (const q of tagged) if (key) this.addTranslation((q.object as Term & { language: string }).language, key, q.object.value);
    if (key) return key;
    const plain = texts.find((q) => !(q.object as Term & { language?: string }).language)?.object.value;
    return plain === legacyKey ? undefined : plain;
  }

  /**
   * A create-form field whose editor has no Elody base field type becomes a
   * generated custom input field (registered by the client, like vlacc's
   * dropdowns): sh:in → a dropdown with those options; sh:class → a relation
   * dropdown on that type. Anything else is not expressible in a create form.
   */
  private customField(node: string, editor: string, key: string): string {
    const r = this.r;
    const single = Number(r.value(node, sh("maxCount")) ?? 0) === 1;
    const name = this.fieldName(key);
    if (this.isNested(node, editor)) return this.nestedField(node, key);
    if (editor === shui("EnumSelectEditor")) {
      const members = r.listTerms(r.node(node, sh("in")));
      if (!members) {
        r.warn(node, `${key}: sh:in is a SHACL 1.2 node expression; Elody does not evaluate it, the field is a text field`);
        return "baseTextField";
      }
      this.inputFields[name] = {
        type: single ? "dropdown" : "dropdownMultiselectMetadata",
        options: members.map((member) =>
          member.termType === "Literal" ? { label: member.value, value: member.value } : this.iriOption(member.value, key),
        ),
      };
      return name;
    }
    if (editor === shui("SubClassEditor")) {
      const root = r.node(node, sh("rootClass"));
      if (!root) throw new Error(`${key}: shui:SubClassEditor needs sh:rootClass`);
      this.inputFields[name] = {
        type: single ? "dropdown" : "dropdownMultiselectMetadata",
        options: this.classTree(root).map(({ iri, depth }) => this.classOption(iri, key, depth)),
      };
      return name;
    }
    const cls = r.node(node, sh("class"));
    if (cls && (editor === shui("InstancesSelectEditor") || editor === shui("AutoCompleteEditor"))) {
      const relationType = this.relationTypeOf(node) ?? `has${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      const type = lowerFirst(localName(cls));
      this.inputFields[name] = {
        type: single ? "dropdownSingleselectRelations" : "dropdownMultiselectRelations",
        relationType,
        advancedFilterInputForRetrievingOptions: [{ type: "type", value: type }],
        relationFilter: this.relationFilter(relationType, type),
      };
      return name;
    }
    throw new Error(`${compact(editor)} has no create-form field type in the ontology and no generated custom field`);
  }

  /**
   * A class and its subclasses (rdfs:subClassOf*) in the declaration's graph, in tree order:
   * each class followed by its subclasses, siblings by label, every class once.
   */
  private classTree(root: string): { iri: string; depth: number }[] {
    const subclasses = new Map<string, string[]>();
    for (const q of this.r.quads())
      if (q.predicate.value === rdfs("subClassOf") && q.object.termType === "NamedNode" && q.subject.termType === "NamedNode")
        (subclasses.get(q.object.value) ?? subclasses.set(q.object.value, []).get(q.object.value)!).push(q.subject.value);
    const name = (iri: string) => (this.r.value(iri, rdfs("label")) ?? localName(iri)).toLowerCase();
    const tree: { iri: string; depth: number }[] = [];
    const seen = new Set<string>();
    const visit = (iri: string, depth: number) => {
      if (seen.has(iri)) return;
      seen.add(iri);
      tree.push({ iri, depth });
      for (const sub of [...(subclasses.get(iri) ?? [])].sort((a, b) => name(a).localeCompare(name(b)))) visit(sub, depth + 1);
    };
    visit(root, 0);
    return tree;
  }

  /** A class as a dropdown option, its depth in the tree shown as indentation in every language. */
  private classOption(iri: string, key: string, depth: number): { label: string; value: string } {
    const option = this.iriOption(iri, key);
    if (depth === 0) return option;
    const indent = `${"\u00a0\u00a0\u00a0".repeat(depth - 1)}\u2514\u00a0`;
    let minted = false;
    for (const bundle of Object.values(this.translations))
      if (bundle[option.label] !== undefined && !bundle[option.label].startsWith(indent)) {
        bundle[option.label] = indent + bundle[option.label];
        minted = true;
      }
    return minted ? option : { ...option, label: indent + option.label };
  }

  /** The Elody type of an entity UI: its document name, lower-camel. */
  typeKeyOf(entity: string): string {
    return lowerFirst(this.r.value(entity, elody("documentName")) ?? localName(entity));
  }

  /** The source description collection-api reads for an entity UI that reads from a linked-data source. */
  sourceOf(entity: string): SparqlSourceJson {
    const r = this.r;
    const source = r.node(entity, elody("readsFrom"))!;
    const value = (predicate: string) => r.value(source, elody(predicate)) || undefined;
    const fields: Record<string, string> = {};
    for (const property of r.nodes(entity, sh("property"))) {
      const key = this.keyOf(property);
      const path = r.node(property, sh("path"));
      fields[key] = path && /[:/#]/.test(path) ? path : key === "iri" ? "@iri" : "@id";
    }
    const json: SparqlSourceJson = { endpoint: value("endpoint")!, selectQuery: value("selectQuery")!, fields };
    for (const key of ["searchQuery", "identifierEncoding", "identifierPrefix", "language", "userAgent"] as const) {
      const found = value(key);
      if (found) json[key] = found;
    }
    return json;
  }

  /**
   * A relation to resources of a linked-data source (elody:optionsFrom): a dropdown on the source's
   * Elody type that searches it for what is typed.
   */
  private sourceField(node: string, key: string, entity: string): string {
    const type = this.typeKeyOf(entity);
    const name = this.fieldName(key);
    const single = Number(this.r.value(node, sh("maxCount")) ?? 0) === 1;
    const relationType = this.relationTypeOf(node)!;
    this.inputFields[name] = {
      type: single ? "dropdownSingleselectRelations" : "dropdownMultiselectRelations",
      relationType,
      advancedFilterInputForRetrievingOptions: [{ type: "type", value: type }],
      relationFilter: this.relationFilter(relationType, type),
      advancedFilterInputForSearchingOptions: {
        type: "text",
        key: ["elody:1|metadata.title.value"],
        value: "*",
        match_exact: false,
        item_types: [type],
      },
    };
    return name;
  }

  /** What a relation dropdown shows as chosen: the entities this entity's relation points to. */
  private relationFilter(relationType: string, type: string) {
    return {
      type: "selection",
      key: ["elody:1|identifiers"],
      value: `$relationValues.${relationType}.key`,
      match_exact: true,
      item_types: [type],
    };
  }

  /** The name of a generated custom input field: <type><Key>Field, the key camel-cased (internal_memo → InternalMemo). */
  private fieldName(key: string): string {
    const camel = key.replace(/[_-]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
    return `${this.type}${camel.charAt(0).toUpperCase()}${camel.slice(1)}Field`;
  }

  /**
   * A relation whose key is typed in (Elody's counterpart of shui:IRIEditor):
   * a table of relations, one row per value, the IRI in the key column
   * (inputFieldWithSubFields with a relationType; the column that is not a
   * metadata field is the relation's key).
   */
  private typedRelationField(node: string, key: string): string {
    const name = this.fieldName(key);
    this.inputFields[name] = {
      type: "inputFieldWithSubFields",
      isMetadataField: false,
      relationType: this.relationTypeOf(node),
      subFields: [{ label: "IRI", key: "key", inputField: { type: "text", isMetadataField: false } }],
    };
    return name;
  }

  /** No sh:maxCount 1: the property may hold several values. */
  private mayHoldSeveral(node: string): boolean {
    const max = this.r.value(node, sh("maxCount"));
    return max === undefined || Number(max) > 1;
  }

  /**
   * A single-value editor on a property with several values: one field that
   * holds the list (SHACL UI repeats the editor per value), generated per
   * property like an sh:in dropdown, with values typed in freely.
   */
  private severalValuesField(node: string, key: string, inputFieldType: string): string {
    const name = this.fieldName(key);
    this.inputFields[name] = { type: inputFieldType, isMetadataField: true, canCreateEntityFromOption: true, multiple: true };
    return name;
  }

  /** A nested shape: the DetailsEditor on a property shape with sh:node. */
  private isNested(node: string, editor: string | undefined): boolean {
    return editor === shui("DetailsEditor") && this.r.node(node, sh("node")) !== undefined;
  }

  /**
   * A nested shape becomes an inputFieldWithSubFields custom field: the value
   * is a list of objects under the metadata key, one sub-field per property
   * shape of the nested node shape (in the spec's order). The same field
   * serves the create form and the detail panel.
   */
  private nestedField(node: string, key: string): string {
    const r = this.r;
    const name = this.fieldName(key);
    if (this.inputFields[name]) return name;
    const shape = r.node(node, sh("node"))!;
    const subs = this.specOrder(r.nodes(shape, sh("property")).map((sub) => ({ node: sub, label: this.keyOf(sub) })));
    this.inputFields[name] = {
      type: "inputFieldWithSubFields",
      isMetadataField: true,
      subFields: subs.map(({ node: sub }) => {
        const subKey = this.keyOf(sub);
        const inputField = this.subInputField(sub, `${key}.${subKey}`);
        if (Number(r.value(sub, sh("minCount")) ?? 0) >= 1) inputField.validation = { value: ["required"] };
        return {
          label: this.propertyLabel(sub, subKey, `ui.${this.type}.${key}.${subKey}`) ?? subKey,
          key: subKey,
          inputField,
        };
      }),
    };
    return name;
  }

  /** The input field of one column of a nested value; what a table cell cannot hold is entered as text. */
  private subInputField(sub: string, path: string): Record<string, unknown> {
    const r = this.r;
    const editor = this.scoredEditors.get(sub) ?? shui("TextFieldEditor");
    if (editor === shui("EnumSelectEditor")) {
      const values = r.list(r.node(sub, sh("in")));
      return { type: "dropdownSingleselectMetadata", options: values.map((value) => ({ label: value, value })) };
    }
    if (r.node(sub, sh("class"))) {
      r.warn(sub, `${path}: sh:class inside a nested value has no Elody field; the related resource is entered as its identifier`);
      return { type: "text" };
    }
    if (editor === shui("DetailsEditor")) {
      r.warn(sub, `${path}: a nested shape inside a nested value is not supported; entered as text`);
      return { type: "text" };
    }
    const type = this.o.inputFieldType(editor);
    if (!type) {
      r.warn(sub, `${path}: ${compact(editor)} has no Elody input field; entered as text`);
      return { type: "text" };
    }
    return { type };
  }

  /** shui:defaultOrder of the declaration's global configuration, if any. */
  private get defaultOrder(): number | null {
    const config = this.r.subjectsOfType(shui("Configuration"))[0];
    const value = config ? this.r.literal(config, shui("defaultOrder")) : undefined;
    return typeof value === "number" ? value : value !== undefined ? Number(value) : null;
  }

  /** Spec ordering: by sh:order (or shui:defaultOrder), unordered last, ties by label then identifier. */
  private specOrder<T extends { node: string; label: string }>(items: T[]): T[] {
    const fallback = this.defaultOrder;
    const order = (node: string) => (this.r.has(node, sh("order")) ? this.r.order(node) : fallback);
    return [...items].sort((a, b) => {
      const oa = order(a.node), ob = order(b.node);
      if (oa !== null && ob === null) return -1;
      if (oa === null && ob !== null) return 1;
      if (oa !== null && ob !== null && oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label) || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0);
    });
  }

  // -- warnings ----------------------------------------------------------------

  private retired(node: string, predicate: string): void {
    const replacement = this.o.replacementOf(predicate).map(compact).join(" / ");
    this.r.warn(node, `${compact(predicate)} is retired${replacement ? `: use ${replacement}` : ""}`);
  }

  private stringInsteadOfInstance(node: string, predicate: string, classIri: string): void {
    this.r.warn(node, `${compact(predicate)} takes an ${compact(classIri)} instance, not a string`);
  }

  private stringInsteadOfNode(node: string, predicate: string): void {
    this.r.warn(node, `${compact(predicate)} references a node, not a document name`);
  }

  // -- value helpers -----------------------------------------------------------

  /** An enumeration value: an ontology instance under `predicate`, or (retired) a string under it or under `legacy`. */
  private enumValue(node: string, predicate: string, classIri: string, legacy?: string): string | undefined {
    const term = this.r.term(node, predicate);
    if (term?.termType === "NamedNode") {
      if (!this.o.isInstanceOf(term.value, classIri))
        throw new Error(`${compact(term.value)} is not an ${compact(classIri)} instance (on ${compact(predicate)})`);
      return this.o.enumValue(term.value);
    }
    if (term?.termType === "Literal") {
      this.stringInsteadOfInstance(node, predicate, classIri);
      return term.value;
    }
    if (legacy && this.r.has(node, legacy)) {
      this.retired(node, legacy);
      return this.r.value(node, legacy);
    }
    return undefined;
  }

  private literalOrLegacy(node: string, predicate: string, legacy: string): Literal | undefined {
    if (this.r.has(node, predicate)) return this.r.literal(node, predicate);
    if (this.r.has(node, legacy)) {
      this.retired(node, legacy);
      return this.r.literal(node, legacy);
    }
    return undefined;
  }

  /** The document name of a referenced node: elody:queryName, a platform form, or the IRI's local name. */
  private queryNameOf(node: string, kind: string): string {
    const platform = this.o.platformFormQueryName(node);
    if (platform) return platform;
    const explicit = this.r.value(node, elody("queryName"));
    if (explicit) return explicit;
    if (node.startsWith("_:") || node.startsWith("n3-") || !/[:/#]/.test(node))
      throw new Error(`a ${kind} referenced by node needs an IRI or an elody:queryName`);
    return localName(node);
  }

  /** A reference to a form: a node under `predicate`, or (retired) a name under `legacy`. */
  private formRef(node: string, predicate: string, legacy?: string): string | undefined {
    const term = this.r.term(node, predicate);
    if (term?.termType === "Literal") {
      this.stringInsteadOfNode(node, predicate);
      return term.value;
    }
    if (term) return this.queryNameOf(term.value, "form");
    if (legacy && this.r.has(node, legacy)) {
      this.retired(node, legacy);
      return this.r.value(node, legacy);
    }
    return undefined;
  }

  private pickerNames(node: string): { list: string; filters: string } {
    const list = this.queryNameOf(node, "picker");
    const declared = this.r.value(node, elody("filtersQuery"));
    if (declared) return { list, filters: declared };
    if (this.r.has(node, elody("filtersQueryName"))) {
      this.retired(node, elody("filtersQueryName"));
      return { list, filters: this.r.value(node, elody("filtersQueryName"))! };
    }
    return { list, filters: pickerFiltersNameFor(list) };
  }

  /** elody:deleteOptions: the deleteQueryOptions block. */
  private deleteOptions(node: string | undefined): M.UiDeleteOptions | undefined {
    if (!node) return undefined;
    const r = this.r;
    return {
      deleteEntityLabel: r.value(node, elody("deleteEntityLabel")) || undefined,
      deleteRelationsQuery: r.value(node, elody("deleteRelationsQuery")) || undefined,
      deleteRelationsFilters: r.value(node, elody("deleteRelationsFilters")) || undefined,
      deleteRelationsTypes: r.list(r.node(node, elody("deleteRelationsTypes"))),
      deleteRelationsLabel: r.value(node, elody("deleteRelationsLabel")) || undefined,
      blockingRelationsQuery: r.value(node, elody("blockingRelationsQuery")) || undefined,
      blockingRelationsFilters: r.value(node, elody("blockingRelationsFilters")) || undefined,
      blockingRelationsTypes: r.list(r.node(node, elody("blockingRelationsTypes"))),
      blockingRelationsLabel: r.value(node, elody("blockingRelationsLabel")) || undefined,
    };
  }

  /** elody:thumbnail: the card's picture, read from an initial value (elody:key) or the primary media file. */
  private thumbnail(node: string | undefined): M.UiEntity["thumbnail"] {
    if (!node) return undefined;
    const key = this.r.value(node, elody("key"));
    const fromMediafile = this.r.literal(node, elody("fromMediafile")) === true;
    const order = this.r.literal(node, elody("order")) ?? this.r.literal(node, sh("order"));
    return { ...(fromMediafile ? { fromMediafile: true } : { key }), ...(typeof order === "number" ? { order } : {}) };
  }

  /** A boolean the declaration may leave out: true, false or undefined. */
  private optionalFlag(node: string, predicate: string): boolean | undefined {
    const value = this.r.literal(node, predicate);
    return typeof value === "boolean" ? value : undefined;
  }

  private hidden(node: string): boolean {
    if (this.r.has(node, dash("hidden"))) return this.r.literal(node, dash("hidden")) === true;
    if (this.r.has(node, elody("hidden"))) {
      this.retired(node, elody("hidden"));
      return this.r.literal(node, elody("hidden")) === true;
    }
    return false;
  }

  // -- entity ------------------------------------------------------------------

  entity(subject: string): M.UiEntity {
    const r = this.r;
    this.listQueries = new Map();
    this.type = lowerFirst(String(r.value(subject, elody("documentName")) ?? r.value(subject, elody("graphqlType")) ?? ""));
    const nodes = r.nodes(subject, sh("property"));
    const parsed = nodes.map((node) => ({ node, property: this.property(node) }));
    const ordered = this.specOrder(parsed.map((p) => ({ ...p, label: p.property.key })));
    const properties = ordered.map((p) => p.property);
    const pathToKey = new Map(properties.filter((p) => p.path).map((p) => [p.path!, p.key]));
    // sh:group → the keys of its properties, in the spec's order within the group
    this.groupFields = new Map();
    this.ungroupedFields = [];
    for (const { node, property } of ordered) {
      const group = r.node(node, sh("group"));
      if (group) (this.groupFields.get(group) ?? this.groupFields.set(group, []).get(group)!).push(property.key);
      else this.ungroupedFields.push(property.key);
    }

    const elementsFragments: M.UiElementsFragment[] = r
      .nodes(subject, elody("elementsFragment"))
      .map((node) => ({ node, name: String(r.value(node, elody("fragmentName")) ?? "") }))
      .filter(({ name }) => this.emitsOnce(`fragment:${name}`))
      .map(({ node, name }) => ({ name, elements: r.byOrder(r.nodes(node, elody("element"))).map((element) => this.element(element, pathToKey)) }));
    // the list queries the type names without a list element (the delete flow's documents)
    for (const node of r.nodes(subject, elody("listQuery")))
      if (!this.emittedListQueries.has(node)) {
        this.emittedListQueries.add(node);
        this.listQueries.set(node, this.picker(node));
      }

    return {
      iri: subject,
      graphqlType: String(r.value(subject, elody("graphqlType")) ?? ""),
      documentName: r.value(subject, elody("documentName")) || undefined,
      targetClass: r.value(subject, sh("targetClass")),
      emit: r.value(subject, elody("emit")) === "file" ? "file" : r.value(subject, elody("emit")) === "inline" ? "inline" : "regions",
      documents: r.literals(subject, elody("documents")),
      typePills: r.literal(subject, elody("typePills")) === true,
      relationValues: this.optionalFlag(subject, elody("relationValues")) ?? (this.legacy ? true : undefined),
      bulkOperationsFragment: this.optionalFlag(subject, elody("bulkOperations")) ?? (this.legacy ? true : undefined),
      thumbnail: this.thumbnail(r.node(subject, elody("thumbnail"))),
      excludeBaseSortOptions: r.literal(subject, elody("excludeBaseSortOptions")) === true,
      filtersFragmentName: r.value(subject, elody("filtersFragmentName")) || undefined,
      readsPermissions: r.literal(subject, elody("readsPermissions")) === true,
      idField: r.literal(subject, elody("idField")) === true || undefined,
      viewModesOnDetail: r.literal(subject, elody("viewModesOnDetail")) === true || undefined,
      idValue: r.literal(subject, elody("idValue")) === true || undefined,
      mapFeatureFields: r.nodes(subject, elody("mapFeatureField")).length
        ? r.nodes(subject, elody("mapFeatureField")).map((path) => {
            const key = pathToKey.get(path);
            if (!key) throw new Error(`elody:mapFeatureField references ${compact(path)}, which no property shape declares as sh:path`);
            return key;
          })
        : undefined,
      listingCore: r.literal(subject, elody("listingCore")) === true,
      deleteOptions: this.deleteOptions(r.node(subject, elody("deleteOptions"))),
      interface: r.literal(subject, elody("interface")) === true,
      fieldsFragments: r
        .nodes(subject, elody("fieldsFragment"))
        .map((node) => ({ node, name: String(r.value(node, elody("fragmentName")) ?? "") }))
        .filter(({ name }) => this.emitsOnce(`fragment:${name}`))
        .map(({ node, name }) => ({ name, fields: this.formFields(r.nodes(r.node(node, elody("shape")) ?? "", sh("property"))) })),
      elementsFragments,
      fragmentsOnly: r.literal(subject, elody("fragmentsOnly")) === true || undefined,
      filePath: r.value(subject, elody("filePath")) || undefined,
      cardName: r.value(subject, elody("cardName")) || undefined,
      sortDocuments: r
        .nodes(subject, elody("sortDocument"))
        .filter((node) => this.emitsOnce(`sort:${this.queryNameOf(node, "sort options document")}`))
        .map((node) => ({
          queryName: this.queryNameOf(node, "sort options document"),
          options: r.byOrder(r.nodes(node, elody("sortOption"))).map((option) => ({
            labelKey: String(r.value(option, elody("labelKey")) ?? ""),
            value: String(r.value(option, elody("value")) ?? ""),
            primary: this.optionalFlag(option, elody("primary")),
            icon: r.value(option, elody("icon")) || undefined,
            order: r.order(option),
          })),
        })),
      panelFragments: r
        .nodes(subject, elody("panelFragment"))
        .map((node) => ({ node, name: String(r.value(node, elody("fragmentName")) ?? "") }))
        .filter(({ name }) => this.emitsOnce(`fragment:${name}`))
        .map(({ node, name }) => ({
          name,
          fields: r.nodes(node, elody("field")).map((path) => {
            const key = pathToKey.get(path);
            if (!key) throw new Error(`panel fragment "${name}" references ${compact(path)}, which no property shape declares as sh:path`);
            return key;
          }),
        })),
      filtersFragments: r
        .nodes(subject, elody("filtersFragment"))
        .map((node) => ({ node, name: String(r.value(node, elody("fragmentName")) ?? "") }))
        .filter(({ name }) => this.emitsOnce(`fragment:${name}`))
        .map(({ node, name }) => ({ name, filters: r.byOrder(r.nodes(node, elody("filter"))).map((filter) => this.filter(filter)) })),
      valuesFragments: r
        .nodes(subject, elody("valuesFragment"))
        .map((node) => ({ node, name: String(r.value(node, elody("fragmentName")) ?? "") }))
        .filter(({ name }) => this.emitsOnce(`fragment:${name}`))
        .map(({ node, name }) => ({
          name,
          cardName: r.value(node, elody("cardFragmentName")) || undefined,
          contextMenu: this.contextMenu(r.node(node, elody("contextMenu"))),
          aliases: r.literals(node, elody("fieldAlias")).length ? r.literals(node, elody("fieldAlias")) : undefined,
          valuesFields: r.literals(node, elody("valuesField")).length ? r.literals(node, elody("valuesField")) : undefined,
          cardShows: r.literals(node, elody("cardShows")).length ? r.literals(node, elody("cardShows")) : undefined,
          fields: r.nodes(node, elody("field")).map((path) => {
            const key = pathToKey.get(path);
            if (!key) throw new Error(`values fragment "${name}" references ${compact(path)}, which no property shape declares as sh:path`);
            return key;
          }),
        })),
      spreads: {
        listingValues: r.literals(subject, elody("listingValuesSpread")),
        detailValues: r.literals(subject, elody("detailValuesSpread")),
        card: r.literals(subject, elody("cardSpread")),
        filters: r.literals(subject, elody("filtersSpread")),
      },
      // the legacy generator read the raw values on the detail page
      detailFormatters: this.optionalFlag(subject, elody("detailFormatters")) ?? (this.legacy ? false : undefined),
      dynamicFormConfigField: r.value(subject, elody("dynamicFormConfig")) || undefined,
      portsField: r.value(subject, elody("ports")) || undefined,
      viewModes: r.byOrder(r.nodes(subject, elody("viewMode"))).map((node) => this.viewMode(node)),
      properties,
      filters: r.byOrder(r.nodes(subject, elody("filter"))).map((node) => this.filter(node)),
      contextMenu: this.contextMenu(r.node(subject, elody("contextMenu"))),
      detail: this.withEditWidgets(this.detail(r.node(subject, elody("detail")), pathToKey), parsed, elementsFragments),
      preview: this.preview(r.node(subject, elody("preview")), pathToKey),
      formSources: r.nodes(subject, elody("formSource")).map((node) => this.formSource(node)),
      bulkOperations: r.byOrder(r.nodes(subject, elody("bulkOperation"))).map((node) => this.bulkOperation(node)),
      customBulkOperations: r.nodes(subject, elody("customBulkOperations")).filter((node) => this.emitsOnce(`custom:${this.queryNameOf(node, "custom bulk operations set")}`)).map((node) => ({
        queryName: this.queryNameOf(node, "custom bulk operations set"),
        operations: r.byOrder(r.nodes(node, elody("operation"))).map((op) => this.bulkOperation(op)),
      })),
      createForms: this.createForms(subject),
      repetitiveForms: this.guidedFlows(subject),
      pickers: r.byOrder(r.nodes(subject, elody("picker"))).map((node) => this.picker(node)),
      listQueries: [...this.listQueries.values()],
    };
  }

  private viewMode(node: string): M.UiViewMode {
    const r = this.r;
    return {
      mode: this.enumValue(node, elody("mode"), elody("ViewMode")) ?? "",
      order: r.order(node),
      config: this.configEntries(node),
    };
  }

  private property(node: string): M.UiProperty {
    const r = this.r;
    const colSpan = r.literal(node, elody("colSpan"));
    const index = r.literal(node, elody("index"));
    const role = r.value(node, shui("propertyRole")) ?? r.value(node, dash("propertyRole"));
    const readOnly = r.has(node, elody("editable"))
      ? (this.retired(node, elody("editable")), r.literal(node, elody("editable")) === false)
      : r.literal(node, dash("readOnly")) === true;
    const key = this.keyOf(node);
    const editor = this.scoredEditors.get(node);
    const panelElement = this.panelElementOf(node, editor);
    const detailOnly = r.literal(node, elody("detailOnly")) === true;
    const sortOrder = r.literal(node, elody("sortOrder"));
    return {
      key,
      alias: r.value(node, elody("alias")) || undefined,
      clientInputField: r.value(node, elody("clientInputField")) || undefined,
      detailOnly,
      listingOnly: r.literal(node, elody("listingOnly")) === true,
      readsValue: r.literal(node, elody("readsValue")) !== false,
      sortLabelKey: r.value(node, elody("sortLabelKey")) || undefined,
      sortOrder: typeof sortOrder === "number" ? sortOrder : undefined,
      path: r.node(node, sh("path")),
      label: this.propertyLabel(node, key, `ui.${this.type}.${key}`),
      order: r.order(node),
      colSpan: typeof colSpan === "number" ? colSpan : undefined,
      unit: this.enumValue(node, elody("unit"), elody("Unit")),
      technicalOrigin: r.value(node, elody("technicalOrigin")) || undefined,
      readOnlyUnless: r.literals(node, elody("readOnlyUnless")).length ? r.literals(node, elody("readOnlyUnless")) : undefined,
      showOnlyInEditMode: this.optionalFlag(node, elody("showOnlyInEditMode")),
      listingValueLabelKey: r.has(node, elody("listingValueLabelKey")) ? String(r.value(node, elody("listingValueLabelKey")) ?? "") : undefined,
      listingValueLabelRootKey: r.has(node, elody("listingValueLabelRootKey")) ? String(r.value(node, elody("listingValueLabelRootKey")) ?? "") : undefined,
      detailFormatter: this.optionalFlag(node, elody("detailFormatter")),
      detailContainsRelation: this.optionalFlag(node, elody("detailContainsRelation")),
      cardLineClamp: r.value(node, elody("cardLineClamp")) || undefined,
      panelLineClamp: r.value(node, elody("panelLineClamp")) || undefined,
      panelAlias: r.value(node, elody("panelAlias")) || undefined,
      highlightIfPrimaryThumbnail: this.optionalFlag(node, elody("highlightIfPrimaryThumbnail")),
      validationMessage: r.value(node, elody("validationMessage")) || undefined,
      virtualKeyboardLayouts: r.node(node, elody("virtualKeyboardLayouts")) ? r.list(r.node(node, elody("virtualKeyboardLayouts"))) : undefined,
      valueTranslationKey: r.value(node, elody("valueTranslationKey")) || undefined,
      permitted: r.literals(node, elody("permitted")).length ? r.literals(node, elody("permitted")) : undefined,
      linkText: r.value(node, elody("linkText")) || undefined,
      copyToClipboard: this.optionalFlag(node, elody("copyToClipboard")),
      nonEditable: this.optionalFlag(node, elody("nonEditable")),
      tooltipKey: r.value(node, elody("tooltipKey")) || undefined,
      panelShowsUnit: this.optionalFlag(node, elody("panelShowsUnit")),
      panelWidget: this.optionalFlag(node, elody("panelWidget")),
      cardAlias: r.value(node, elody("cardAlias")) || undefined,
      cardValidates: this.optionalFlag(node, elody("cardValidates")),
      sortPages: r.nodes(node, elody("sortPage")).length
        ? r.nodes(node, elody("sortPage")).map((page) => ({ routeName: String(r.value(page, elody("routeName")) ?? ""), entityType: r.value(page, elody("routeEntityType")) || undefined }))
        : undefined,
      formatter: panelElement ? undefined : this.formatter(node),
      role,
      teaser: r.literal(node, elody("teaser")) !== false && !detailOnly,
      sortable: r.literal(node, elody("sortable")) === true,
      defaultSortDirection: this.enumValue(node, elody("defaultSortDirection"), elody("SortDirection")),
      source: this.enumValue(node, elody("source"), elody("ValueSource")),
      index: typeof index === "number" ? index : undefined,
      hidden: this.hidden(node),
      readOnly,
      description: r.value(node, sh("description")),
      multilingual: this.o.multilingual(editor) || this.languageInOf(node).length > 0,
      languageIn: this.languageInOf(node),
      inputType: editor && this.isNested(node, editor) ? this.nestedField(node, key) : undefined,
      relationType: editor && this.isNested(node, editor) ? undefined : this.relationTypeOf(node),
      valueLabelKey: this.relationTypeOf(node) ? this.valueLabelKeyOf(node) : undefined,
      valueLabelRootKey: r.value(node, elody("valueLabelRootKey")) || undefined,
      // set by entity() for the properties an editable panel shows
      editInputType: undefined,
      required: Number(r.value(node, sh("minCount")) ?? 0) >= 1,
      validationRule: r.value(node, elody("validationRule")) || undefined,
      validationValue: r.value(node, elody("validationValue")) || undefined,
      validationRelationType: r.value(node, elody("validationRelationType")) || undefined,
      validationAmount: typeof r.literal(node, elody("validationAmount")) === "number" ? (r.literal(node, elody("validationAmount")) as number) : undefined,
      validationExact: this.optionalFlag(node, elody("validationExact")),
      cardKey: r.value(node, elody("cardKey")) || undefined,
      cardField: r.value(node, elody("cardField")) || undefined,
      cardEditable: r.literal(node, elody("cardEditable")) === true,
      relationKey: r.value(node, elody("relationKey")) || undefined,
      readsHost: r.literal(node, elody("readsHost")) === true,
            relationDirection: r.value(node, elody("relationDirection")) || undefined,
      parentEntityType: r.value(node, elody("parentEntityType")) || undefined,
      parentRelations: r.nodes(node, elody("parentRelation")).length
        ? r.byOrder(r.nodes(node, elody("parentRelation"))).map((step) => ({
            relationType: r.value(step, elody("parentRelationType")) || undefined,
            entityType: r.value(step, elody("parentEntityType")) || undefined,
            key: r.value(step, elody("parentKey")) || undefined,
          }))
        : undefined,
      parentKey: r.value(node, elody("parentKey")) || undefined,
      detailLabelKey: r.value(node, elody("detailLabelKey")) || undefined,
      sortPrimary: r.literal(node, elody("sortPrimary")) === true,
      listingFormatter: this.optionalFlag(node, elody("listingFormatter")),
      repeatableMetadataKey: r.value(node, elody("repeatableMetadataKey")) || undefined,
      parentRelationType: r.value(node, elody("parentRelationType")) || undefined,
      containsRelationPropertyKey: r.value(node, elody("containsRelationPropertyKey")) || undefined,
      containsRelationPropertyValue: r.value(node, elody("containsRelationPropertyValue")),
      panelElement,
    };
  }

  /**
   * A widget Elody implements as an element in the detail panel (elody:panelElement): the declared
   * viewer's, else the scored editor's. A list needs the relation and the related type: sh:class,
   * else the sh:targetClass of the sh:node shape that gives its columns.
   */
  private panelElementOf(node: string, editor: string | undefined): M.UiProperty["panelElement"] {
    const r = this.r;
    const kind = this.o.panelElement(r.node(node, shui("viewer"))) ?? this.o.panelElement(editor);
    if (kind === "wysiwyg") return { kind };
    if (kind !== "list") return undefined;
    const shape = r.node(node, sh("node"));
    const type = r.node(node, sh("class")) ?? (shape ? r.node(shape, sh("targetClass")) : undefined);
    const relationType = this.relationTypeOf(node) ?? (type ? `has${upperFirst(this.keyOf(node))}` : undefined);
    if (!type || !relationType) throw new Error(`${compact(node)}: a list of related entities needs sh:class or an sh:node shape with sh:targetClass`);
    return { kind, entityType: lowerFirst(localName(type)), relationType };
  }

  private formatter(node: string): string | undefined {
    const viewer = this.r.node(node, shui("viewer"));
    if (viewer) {
      const value = this.o.formatterValue(viewer);
      if (value === undefined) throw new Error(`${compact(viewer)} is not a viewer Elody implements`);
      const argument = this.r.value(node, elody("viewerArgument"));
      return value ? (argument ? `${value}|${argument}` : value) : undefined;
    }
    if (this.r.has(node, elody("formatter"))) {
      this.retired(node, elody("formatter"));
      return this.r.value(node, elody("formatter"));
    }
    return undefined;
  }

  private filter(node: string): M.UiFilter {
    const r = this.r;
    let defaultValues = r.literals(node, sh("defaultValue"));
    if (defaultValues.length === 0 && r.has(node, elody("defaultValue"))) {
      this.retired(node, elody("defaultValue"));
      defaultValues = r.literals(node, elody("defaultValue"));
    }
    let tooltip = r.literal(node, elody("showTooltip")) === true;
    if (!tooltip && r.has(node, elody("tooltip"))) {
      this.retired(node, elody("tooltip"));
      tooltip = r.literal(node, elody("tooltip")) === true;
    }
    return {
      alias: String(r.value(node, elody("alias")) ?? ""),
      kind: this.enumValue(node, elody("filterKind"), elody("FilterKind")) ?? "text",
      order: r.order(node),
      key: r.value(node, elody("key")),
      keyAsList: r.literal(node, elody("keyAsList")) !== false,
      parentKey: r.value(node, elody("parentFilterKey")) || undefined,
      aggregation: r.value(node, elody("filterAggregation")) || undefined,
      optionsLabel: r.value(node, elody("optionsLabel")) || undefined,
      optionsValue: r.value(node, elody("optionsValue")) || undefined,
      selectionOption: r.value(node, elody("selectionOption")) || undefined,
      operator: r.value(node, elody("filterOperator")) || undefined,
      showTime: this.optionalFlag(node, elody("showTime")),
      matchersType: r.value(node, elody("matchersType")) || undefined,
      lookup: r.node(node, elody("lookup")) ? this.lookup(r.node(node, elody("lookup"))!) : undefined,
      itemTypes: r.literals(node, elody("itemTypes")).length ? r.literals(node, elody("itemTypes")) : undefined,
      defaultMatcher: r.value(node, elody("defaultMatcher")) || undefined,
      allowedMatchers: r.node(node, elody("allowedMatchers")) ? r.list(r.node(node, elody("allowedMatchers"))) : undefined,
      valueMappings: this.valueMappings(node),
      facets: r.nodes(node, elody("facet")).length ? r.byOrder(r.nodes(node, elody("facet"))).map((facet) => this.facet(facet)) : undefined,
      defaultValueBare: typeof r.literal(node, sh("defaultValue")) === "boolean" ? true : undefined,
      options: r.has(node, elody("optionsType")) || r.has(node, elody("optionsKey")) || r.has(node, elody("optionsKeys")) || r.has(node, elody("optionsInput"))
        ? {
            type: r.value(node, elody("optionsType")) || undefined,
            key: r.value(node, elody("optionsKey")) || undefined,
            matchExact: this.optionalFlag(node, elody("optionsMatchExact")),
            distinctBy: r.value(node, elody("optionsDistinctBy")) || undefined,
            operator: r.value(node, elody("optionsOperator")) || undefined,
            typeOperator: r.value(node, elody("optionsTypeOperator")) || undefined,
            typeBare: this.optionalFlag(node, elody("optionsTypeBare")),
            keys: r.node(node, elody("optionsKeys")) ? r.list(r.node(node, elody("optionsKeys"))) : undefined,
            itemTypes: r.literals(node, elody("optionsItemTypes")).length ? r.literals(node, elody("optionsItemTypes")) : undefined,
            labelKey: r.value(node, elody("optionsLabelKey")) || undefined,
            inputs: r.nodes(node, elody("optionsInput")).length ? r.byOrder(r.nodes(node, elody("optionsInput"))).map((input) => this.optionsInput(input)) : undefined,
          }
        : undefined,
      selectionSpread: r.value(node, elody("selectionSpread")) || undefined,
      keys: r.node(node, elody("keys")) ? r.list(r.node(node, elody("keys"))) : undefined,
      staticOptions: r.nodes(node, elody("option")).length
        ? r.byOrder(r.nodes(node, elody("option"))).map((option) => ({ label: String(r.value(option, elody("labelKey")) ?? ""), value: String(r.value(option, elody("value")) ?? ""), order: r.order(option) }))
        : undefined,
      label: r.value(node, rdfs("label")),
      defaultValues,
      defaultValueAsList: r.literal(node, elody("defaultValueAsList")) === true,
      hidden: this.hidden(node),
      keepDefaultValue: this.optionalFlag(node, elody("keepDefaultValue")),
      displayedByDefault: r.literal(node, elody("displayedByDefault")) === true,
      tooltip,
    };
  }

  private contextMenu(node: string | undefined): M.UiContextMenu | undefined {
    if (!node) return undefined;
    const r = this.r;
    return {
      forceShow: r.literal(node, elody("forceShow")) === true,
      includeBasicActions: r.literal(node, elody("includeBasicActions")) === true,
      inButtons: r.literal(node, elody("menuInButtons")) === true,
      spreads: r.literals(node, elody("menuSpread")).length ? r.literals(node, elody("menuSpread")) : undefined,
      actions: r.byOrder(r.nodes(node, elody("action"))).map((action): M.UiAction => {
        const source = r.node(action, elody("formSourceRef"));
        return {
          alias: String(r.value(action, elody("alias")) ?? ""),
          order: r.order(action),
          form: r.value(action, elody("actionForm")) || undefined,
          actionType: this.enumValue(action, elody("actionKind"), elody("ActionKind"), elody("actionType")) ?? "",
          formQuery: source
            ? this.queryNameOf(source, "form source")
            : this.formRef(action, elody("form"), elody("formQuery")),
          formFlow: r.value(action, elody("formFlow")),
          formTitle: r.value(action, elody("formTitle")),
          label: r.value(action, rdfs("label")),
          icon: r.value(action, elody("icon")),
          can: r.literals(action, elody("can")).length ? r.literals(action, elody("can")) : undefined,
          showAsButton: this.optionalFlag(action, elody("showAsButton")),
          endpointUrl: r.value(action, elody("endpointUrl")) || undefined,
          endpointMethod: r.value(action, elody("endpointMethod")) || undefined,
        };
      }),
    };
  }

  private bulkOperation(node: string): M.UiBulkOperation {
    const r = this.r;
    const contextNode = r.node(node, elody("context"));
    const modalNode = r.node(node, elody("modal"));
    const primary = r.literal(node, elody("primary"));
    let context: M.UiBulkOpContext | undefined;
    if (contextNode) {
      let tooltip = r.value(contextNode, elody("tooltipLabel"));
      if (tooltip === undefined && r.has(contextNode, elody("tooltip"))) {
        this.retired(contextNode, elody("tooltip"));
        tooltip = r.value(contextNode, elody("tooltip"));
      }
      const minItems = r.literal(contextNode, elody("minSelectedItems"));
      const maxItems = r.literal(contextNode, elody("maxSelectedItems"));
      context = {
        activeViewMode: this.enumValue(contextNode, elody("activeViewMode"), elody("InteractionMode")),
        selection: this.enumValue(contextNode, elody("selection"), elody("SelectionState")) ?? "",
        tooltip: tooltip ?? "",
        requiresSameType: this.optionalFlag(contextNode, elody("requiresSameType")),
        minSelectedItems: typeof minItems === "number" ? minItems : undefined,
        maxSelectedItems: typeof maxItems === "number" ? maxItems : undefined,
      };
      const matches = r.byOrder(r.nodes(contextNode, elody("matchMetadataValue")));
      if (matches.length) context.matchMetadataValue = matches.map((m) => ({ key: r.value(m, elody("matchKey")) ?? "", value: r.value(m, elody("matchValue")) ?? "" }));
    }
    return {
      value: this.enumValue(node, elody("operationKind"), elody("BulkOperationKind"), elody("value")) ?? "",
      order: r.order(node),
      icon: r.value(node, elody("icon")),
      label: r.value(node, rdfs("label")),
      primary: typeof primary === "boolean" ? primary : undefined,
      can: r.literals(node, elody("can")),
      context,
      subOptions: r.nodes(node, elody("subOperation")).length ? r.byOrder(r.nodes(node, elody("subOperation"))).map((sub) => this.bulkOperation(sub)) : undefined,
      modal: modalNode
        ? {
            typeModal: this.enumValue(modalNode, elody("modalKind"), elody("ModalKind"), elody("typeModal")) ?? "",
            formQuery: this.formRef(modalNode, elody("form"), elody("formQuery")),
            formRelationType: r.value(modalNode, elody("formRelationType")),
            closeConfirmation: this.optionalFlag(modalNode, elody("closeConfirmation")),
            permission: this.enumValue(modalNode, elody("permission"), elody("Permission")),
            navigateAfterCreation: r.value(modalNode, elody("navigateAfterCreation")) || undefined,
            ...this.modalSettings(modalNode),
            ...(r.node(modalNode, elody("picker")) ? (({ list, filters }) => ({ pickerList: list, pickerFilters: filters }))(this.pickerNames(r.node(modalNode, elody("picker"))!)) : {}),
          }
        : undefined,
    };
  }

  /** elody:optionsInput: a further input of the option search; its value a string or an RDF list. */
  private optionsInput(node: string): M.UiOptionsInput {
    const r = this.r;
    const valueTerm = r.term(node, elody("value"));
    const value = valueTerm && valueTerm.termType !== "Literal" ? r.list(valueTerm.value) : (valueTerm?.value ?? "");
    return {
      kind: this.enumValue(node, elody("inputKind"), elody("FilterKind")) ?? "text",
      key: r.value(node, elody("key")) ?? "",
      value,
      matchExact: this.optionalFlag(node, elody("inputMatchExact")),
      distinctBy: r.value(node, elody("inputDistinctBy")) || undefined,
      resolveDefaultValueToOptionIds: this.optionalFlag(node, elody("inputResolveDefaultValueToOptionIds")),
      operator: r.value(node, elody("inputOperator")) || undefined,
      bareValues: this.optionalFlag(node, elody("bareValues")),
      valueMappings: this.valueMappings(node),
      order: r.order(node),
    };
  }

  /** elody:lookup node: the join a filter or a facet needs. */
  private lookup(node: string): M.UiLookup {
    const r = this.r;
    return {
      from: String(r.value(node, elody("lookupFrom")) ?? ""),
      localField: String(r.value(node, elody("lookupLocalField")) ?? ""),
      foreignField: String(r.value(node, elody("lookupForeignField")) ?? ""),
      as: String(r.value(node, elody("lookupAs")) ?? ""),
      resolveToSourceIds: this.optionalFlag(node, elody("lookupResolveToSourceIds")),
    };
  }

  /** elody:valueMapping nodes: the values a default is mapped from. */
  private valueMappings(node: string): M.UiValueMapping[] | undefined {
    const r = this.r;
    const nodes = r.nodes(node, elody("valueMapping"));
    if (!nodes.length) return undefined;
    return r.byOrder(nodes).map((mapping) => ({ values: r.node(mapping, elody("value")) ? r.list(r.node(mapping, elody("value"))) : [], mapping: String(r.value(mapping, elody("mapping")) ?? ""), order: r.order(mapping) }));
  }

  /** elody:facet node, with its lookups and facets. */
  private facet(node: string): M.UiFacet {
    const r = this.r;
    return {
      kind: this.enumValue(node, elody("inputKind"), elody("FilterKind")),
      value: r.value(node, elody("value")) || undefined,
      key: r.value(node, elody("key")) || undefined,
      lookups: r.nodes(node, elody("lookup")).map((lookup) => this.lookup(lookup)),
      facets: r.byOrder(r.nodes(node, elody("facet"))).map((facet) => this.facet(facet)),
      order: r.order(node),
    };
  }

  /** The modal settings of batch 15: several forms, skipped relations, image crop, relation replacement, selection limit, survivor suggestion. */
  private modalSettings(modalNode: string): Partial<M.UiBulkOpModal> {
    const r = this.r;
    const out: Partial<M.UiBulkOpModal> = {};
    const forms = r.listTerms(r.node(modalNode, elody("forms")));
    if (forms?.length) out.formQueries = forms.map((term) => (term.termType === "Literal" ? term.value : this.queryNameOf(term.value, "form")));
    const skipped = r.literals(modalNode, elody("skipRelatedItems"));
    if (skipped.length) out.skipRelatedItems = skipped;
    out.imageCrop = this.optionalFlag(modalNode, elody("imageCrop"));
    out.cropCoordinatesKey = r.value(modalNode, elody("cropCoordinatesKey")) || undefined;
    out.replaceExistingRelations = this.optionalFlag(modalNode, elody("replaceExistingRelations"));
    const limit = r.literal(modalNode, elody("selectionLimit"));
    if (typeof limit === "number") out.selectionLimit = limit;
    const suggestion = r.node(modalNode, elody("survivorSuggestion"));
    if (suggestion) {
      const verdicts = r.nodes(suggestion, elody("hiddenVerdict")).map((v) => this.o.enumValue(v) ?? v);
      out.survivorSuggestion = {
        strategy: this.enumValue(suggestion, elody("survivorStrategy"), elody("SurvivorStrategy")) ?? "",
        autoSelect: this.optionalFlag(suggestion, elody("autoSelectSurvivor")),
        requireRecommendedSurvivor: this.optionalFlag(suggestion, elody("requireRecommendedSurvivor")),
        hiddenVerdicts: verdicts.length ? verdicts : undefined,
      };
    }
    return out;
  }

  /** elody:copyFromParent: the form's copyFromParent block. */
  private copyFromParent(node: string | undefined): M.UiCreateForm["copyFromParent"] {
    if (!node) return undefined;
    const r = this.r;
    return {
      autoCopy: this.optionalFlag(node, elody("autoCopy")),
      keyMap: r.byOrder(r.nodes(node, elody("copyKey"))).map((entry) => ({ key: String(r.value(entry, elody("key")) ?? ""), fromKey: String(r.value(entry, elody("fromKey")) ?? "") })),
    };
  }

  private createForms(subject: string): M.UiCreateForm[] {
    const r = this.r;
    const declared = r
      .nodes(subject, elody("form"))
      .filter((node) => r.hasType(node, elody("Form")))
      .filter((node) => this.emitsOnce(`form:${this.queryNameOf(node, "form")}`))
      .map((node): M.UiCreateForm => {
        const shape = r.node(node, elody("shape"));
        if (!shape) throw new Error(`form ${compact(node)} has no elody:shape`);
        return {
          queryName: this.queryNameOf(node, "form"),
          tabAlias: r.value(node, elody("alias")) || undefined,
          label: r.value(node, rdfs("label")),
          fieldsSpreads: r.literals(node, elody("fieldsSpread")),
          copyFromParent: this.copyFromParent(r.node(node, elody("copyFromParent"))),
          fields: this.formFields(r.nodes(shape, sh("property"))),
          submit: this.submit(r.node(node, elody("submit"))),
        };
      });
    const legacy = r.nodes(subject, elody("createForm")).map((node): M.UiCreateForm => {
      this.retired(node, elody("createForm"));
      return {
        queryName: String(r.value(node, elody("queryName")) ?? ""),
        label: r.value(node, rdfs("label")),
        fields: r.byOrder(r.nodes(node, elody("field"))).map((field) => this.legacyFormField(field)),
        submit: this.submit(r.node(node, elody("submit"))),
      };
    });
    return [...declared, ...legacy];
  }

  /**
   * The fields of a create form in the spec's order: its sh:PropertyGroups and
   * ungrouped properties are one sequence (by the group's and the property's
   * sh:order); within a group, its properties in order. A grouped field
   * carries its section (alias and label, as the detail panel's).
   */
  private formFields(nodes: string[]): M.UiCreateFormField[] {
    const r = this.r;
    const members = new Map<string, string[]>();
    const units: { node: string; label: string; group: boolean }[] = [];
    for (const node of nodes) {
      const group = r.node(node, sh("group"));
      if (!group) units.push({ node, label: this.keyOf(node), group: false });
      else if (members.has(group)) members.get(group)!.push(node);
      else {
        members.set(group, [node]);
        units.push({ node: group, label: this.groupAlias(group), group: true });
      }
    }
    return this.specOrder(units).flatMap((unit) => {
      if (!unit.group) return [this.formField(unit.node)];
      const alias = this.groupAlias(unit.node);
      const section = { alias, label: this.labelOf(unit.node, rdfs("label"), `ui.${this.type}.group.${alias}`) };
      return this.specOrder(members.get(unit.node)!.map((node) => ({ node, label: this.keyOf(node) }))).map((field) => ({
        ...this.formField(field.node),
        section,
      }));
    });
  }

  private groupAlias(group: string): string {
    return String(this.r.value(group, elody("alias")) ?? lowerFirst(localName(group)));
  }

  private submit(node: string | undefined): M.UiCreateForm["submit"] {
    if (!node) return undefined;
    const r = this.r;
    return {
      alias: r.value(node, elody("alias")) || undefined,
      label: r.value(node, rdfs("label")),
      icon: r.value(node, elody("icon")),
      actionQuery: r.value(node, elody("actionQuery")),
      creationType: r.value(node, elody("creationType")),
      // the legacy dialect always showed form errors
      showsFormErrors: this.optionalFlag(node, elody("showsFormErrors")) ?? (this.legacy ? true : undefined),
      submitAction: r.value(node, elody("submitAction")) || undefined,
    };
  }

  /** A form field as a property shape: the widget is the one the SHACL 1.2 UI scoring system picks. */
  private formField(node: string): M.UiCreateFormField {
    const r = this.r;
    const editor = this.scoredEditors.get(node) ?? shui("TextFieldEditor");
    const key0 = this.keyOf(node);
    let inputType: string;
    const optionsFrom = r.node(node, elody("optionsFrom"));
    const clientField = r.value(node, elody("clientInputField"));
    if (clientField) inputType = clientField;
    else if (optionsFrom) inputType = this.sourceField(node, key0, optionsFrom);
    else if (this.inversePredicate(node) && !r.node(node, sh("class")))
      // no type to search: the IRI is typed in, as shui:IRIEditor does
      inputType = this.typedRelationField(node, key0);
    else {
      const formFieldType = this.o.formFieldType(editor);
      const several = this.o.multipleValuesInputFieldType(editor);
      if (several && this.mayHoldSeveral(node) && !this.o.multilingual(editor) && this.languageInOf(node).length === 0)
        inputType = this.severalValuesField(node, key0, several);
      else if (formFieldType) inputType = formFieldType;
      else if (this.relationTypeOf(node) && r.node(node, sh("class")) && !this.isNested(node, editor))
        // a relation-valued field without an Elody form widget is a relation dropdown
        inputType = this.customField(node, [shui("InstancesSelectEditor"), shui("AutoCompleteEditor")].includes(editor) ? editor : shui("InstancesSelectEditor"), key0);
      else inputType = this.customField(node, editor, key0);
    }
    let required = Number(r.value(node, sh("minCount")) ?? 0) >= 1;
    if (!required && r.has(node, elody("required"))) {
      this.retired(node, elody("required"));
      required = r.literal(node, elody("required")) === true;
    }
    const key = key0;
    return {
      key,
      alias: r.value(node, elody("alias")) || undefined,
      label: this.propertyLabel(node, key, `ui.${this.type}.${key}`),
      order: r.order(node),
      inputType,
      required,
      validationRule: r.value(node, elody("validationRule")) || undefined,
      validationValue: r.value(node, elody("validationValue")) || undefined,
      validationRelationType: r.value(node, elody("validationRelationType")) || undefined,
      validationAmount: typeof r.literal(node, elody("validationAmount")) === "number" ? (r.literal(node, elody("validationAmount")) as number) : undefined,
      validationExact: this.optionalFlag(node, elody("validationExact")),
      tooltipKey: r.value(node, elody("tooltipKey")) || undefined,
      defaultValue: r.value(node, sh("defaultValue")) || undefined,
      noWidget: this.optionalFlag(node, elody("noWidget")),
      validationMessage: r.value(node, elody("validationMessage")) || undefined,
      virtualKeyboardLayouts: r.node(node, elody("virtualKeyboardLayouts")) ? r.list(r.node(node, elody("virtualKeyboardLayouts"))) : undefined,
      pickerSearch: r.node(node, elody("pickerSearch"))
        ? ((search) => ({
            mode: String(r.value(search, elody("pickerSearchMode")) ?? "Search"),
            keys: r.node(search, elody("keys")) ? r.list(r.node(search, elody("keys"))) : [],
            acceptedTypes: r.literals(search, elody("acceptedTypes")),
          }))(r.node(node, elody("pickerSearch"))!)
        : undefined,
      hidden: this.hidden(node) || undefined,
      editor,
      multilingual: this.o.multilingual(editor) || this.languageInOf(node).length > 0,
      languageIn: this.languageInOf(node),
    };
  }

  private legacyFormField(node: string): M.UiCreateFormField {
    const r = this.r;
    if (r.has(node, elody("inputType"))) this.retired(node, elody("inputType"));
    if (r.has(node, elody("required"))) this.retired(node, elody("required"));
    const inputType = String(r.value(node, elody("inputType")) ?? "baseTextField");
    return {
      key: String(r.value(node, sh("name")) ?? ""),
      label: r.value(node, rdfs("label")),
      order: r.order(node),
      inputType,
      required: r.literal(node, elody("required")) === true,
      editor: this.o.editorForFormFieldType(inputType),
      multilingual: false,
      languageIn: [],
    };
  }

  private guidedFlows(subject: string): M.UiRepetitiveForm[] {
    const r = this.r;
    const legacy = r.nodes(subject, elody("repetitiveForm"));
    if (legacy.length) this.retired(subject, elody("repetitiveForm"));
    return [...r.nodes(subject, elody("guidedFlow")), ...legacy]
      .filter((node) => this.emitsOnce(`flow:${this.queryNameOf(node, "guided flow")}`))
      .map((node): M.UiRepetitiveForm => {
      const finalizeNode = r.node(node, elody("finalize"));
      return {
        queryName: this.queryNameOf(node, "guided flow"),
        label: r.value(node, rdfs("label")),
        repeatable: this.optionalFlag(node, elody("repeatable")),
        refetchOnFinish: this.optionalFlag(node, elody("refetchOnFinish")),
        linear: this.optionalFlag(node, elody("linear")),
        startOnFirstStep: this.optionalFlag(node, elody("startOnFirstStep")),
        returnsSelection: this.optionalFlag(node, elody("returnsSelection")),
        routeToStep: r.value(node, elody("routeToStep")) || undefined,
        routeToRoute: r.value(node, elody("routeToRoute")) || undefined,
        steps: r.byOrder(r.nodes(node, elody("step"))).map((step) => this.step(step)),
        finalize: finalizeNode
          ? {
              fromStep: String(r.value(finalizeNode, elody("fromStep")) ?? ""),
              relationType: String(r.value(finalizeNode, elody("relationType")) ?? ""),
            }
          : undefined,
      };
    });
  }

  private step(step: string): M.UiRepetitiveStep {
    const r = this.r;
    const pickerNode = r.node(step, elody("picker"));
    let pickerQuery: string | undefined;
    let pickerFiltersQuery: string | undefined;
    if (pickerNode) ({ list: pickerQuery, filters: pickerFiltersQuery } = this.pickerNames(pickerNode));
    else {
      if (r.has(step, elody("pickerQuery"))) this.retired(step, elody("pickerQuery"));
      if (r.has(step, elody("pickerFiltersQuery"))) this.retired(step, elody("pickerFiltersQuery"));
      pickerQuery = r.value(step, elody("pickerQuery"));
      pickerFiltersQuery = r.value(step, elody("pickerFiltersQuery"));
    }
    const maxSelection = r.literal(step, elody("maxSelection"));
    const scopeNode = r.node(step, elody("scopeToRelationOf"));
    return {
      key: String(r.value(step, elody("key")) ?? ""),
      order: r.order(step),
      label: r.value(step, rdfs("label")),
      entityType: r.value(step, elody("entityType")),
      createForm: this.formRef(step, elody("form"), elody("createForm")),
      pickerQuery,
      pickerFiltersQuery,
      acceptedTypes: r.literals(step, elody("acceptedTypes")),
      maxSelection: typeof maxSelection === "number" ? maxSelection : undefined,
      overviewFields: r.byOrder(r.nodes(step, elody("overviewField"))).map((field) => ({
        key: String(r.value(field, elody("key")) ?? ""),
        label: r.value(field, rdfs("label")),
        order: r.order(field),
      })),
      showBackButton: this.optionalFlag(step, elody("showBackButton")),
      skipSearchIfPriorIsNew: this.optionalFlag(step, elody("skipSearchIfPriorIsNew")),
      pickerFiltersCollapsed: this.optionalFlag(step, elody("pickerFiltersCollapsed")),
      metadataOnly: this.optionalFlag(step, elody("metadataOnly")),
      terminalActionLabel: r.value(step, elody("terminalActionLabel")) || undefined,
      scope: scopeNode
        ? { step: String(r.value(scopeNode, elody("fromStep")) ?? ""), relationType: String(r.value(scopeNode, elody("relationType")) ?? ""), filterKey: r.value(scopeNode, elody("filterKey")) || undefined }
        : undefined,
      relations: r.nodes(step, elody("stepRelation")).length
        ? r.byOrder(r.nodes(step, elody("stepRelation"))).map((relation) => ({ to: String(r.value(relation, elody("to")) ?? ""), relationType: String(r.value(relation, elody("relationType")) ?? ""), createWhen: r.value(relation, elody("createWhen")) || undefined, order: r.order(relation),
            metadataFields: r.nodes(relation, elody("metadataField")).length
              ? r.byOrder(r.nodes(relation, elody("metadataField"))).map((field) => ({ formMetadataKey: String(r.value(field, elody("formMetadataKey")) ?? ""), relationMetadataKey: String(r.value(field, elody("relationMetadataKey")) ?? ""), asArray: this.optionalFlag(field, elody("asArray")), order: r.order(field) }))
              : undefined }))
        : undefined,
      creatableTypes: r.nodes(step, elody("creatableType")).length
        ? r.byOrder(r.nodes(step, elody("creatableType"))).map((type) => ({ label: r.value(type, elody("labelKey")) || undefined, entityType: String(r.value(type, elody("entityType")) ?? ""), createForm: this.formRef(type, elody("form")) ?? "", order: r.order(type) }))
        : undefined,
    };
  }

  private picker(node: string): M.UiPicker {
    const r = this.r;
    const names = this.pickerNames(node);
    return {
      queryName: names.list,
      filtersQueryName: names.filters,
      relationValues: r.literal(node, elody("relationValues")) === true,
      readsHost: r.literal(node, elody("readsHost")) === true,
      hostOptional: r.literal(node, elody("hostOptional")) === true || undefined,
      // the document of a name goes with the first node that renders it: one with results, one with filters
      emitList: r.nodes(node, elody("result")).length ? this.emitsOnce(`document:${names.list}`) : false,
      emitFilters: r.nodes(node, elody("filter")).length ? this.emitsOnce(`document:${names.filters}`) : false,
      order: r.order(node),
      results: r.byOrder(r.nodes(node, elody("result"))).map((result): M.UiPickerResult => {
        let type = r.value(result, elody("graphqlType"));
        if (type === undefined && r.has(result, elody("type"))) {
          this.retired(result, elody("type"));
          type = r.value(result, elody("type"));
        }
        return {
          type: type ?? "",
          fragments: r.literals(result, elody("fragment")),
          listingIri: r.node(result, elody("listing")),
          cardMenuSpread: r.value(result, elody("cardMenuSpread")) || undefined,
          order: r.order(result),
        };
      }),
      filters: r.byOrder(r.nodes(node, elody("filter"))).map((filter) => this.filter(filter)),
      filtersType: r.value(node, elody("filtersType")) || undefined,
    };
  }

  private formSource(node: string): M.UiFormSource {
    const r = this.r;
    let field = r.value(node, elody("resolverField"));
    if (field === undefined && r.has(node, elody("field"))) {
      this.r.warn(node, "elody:field on a form source is retired: use elody:resolverField");
      field = r.value(node, elody("field"));
    }
    return {
      queryName: this.queryNameOf(node, "form source"),
      field: field ?? "",
      withParent: r.literal(node, elody("withParent")) === true,
    };
  }

  /** elody:preview: the preview of the type, with the layouts it loads (each a column list like the detail's). */
  private preview(node: string | undefined, pathToKey: Map<string, string>): M.UiPreview | undefined {
    if (!node) return undefined;
    const r = this.r;
    const layout = (layoutNode: string | undefined): M.UiPreviewLayout | undefined => {
      if (!layoutNode) return undefined;
      const queryName = this.queryNameOf(layoutNode, "preview layout");
      const columns = this.detail(layoutNode, pathToKey)?.columns ?? [];
      return { queryName, columns, emit: columns.length > 0 && this.emitsOnce(`document:${queryName}`) };
    };
    return {
      fragmentName: r.value(node, elody("fragmentName")) || undefined,
      kind: this.enumValue(node, elody("previewKind"), elody("PreviewKind")) ?? "ColumnList",
      coverage: this.enumValue(node, elody("coverage"), elody("ListItemCoverage")) ?? "OneListItem",
      labelKey: r.value(node, elody("labelKey")) || undefined,
      openByDefault: this.optionalFlag(node, elody("openByDefault")),
      showCurrentPreviewFlow: this.optionalFlag(node, elody("showCurrentPreviewFlow")),
      keepLastActiveItemHighlighted: this.optionalFlag(node, elody("keepLastActiveItemHighlighted")),
      displayOpenDetailPageButton: this.optionalFlag(node, elody("displayOpenDetailPageButton")),
      layout: layout(r.node(node, elody("previewLayout"))),
      metadataLayout: layout(r.node(node, elody("metadataPreviewLayout"))),
    };
  }

  private detail(node: string | undefined, pathToKey: Map<string, string>): M.UiDetail | undefined {
    if (!node) return undefined;
    const r = this.r;
    return {
      shapeDriven: r.literal(node, elody("shapeDriven")) === true,
      fragmentFields: r.literals(node, elody("fragmentField")),
      columns: r.byOrder(r.nodes(node, elody("column"))).map((column): M.UiColumn => ({
        order: r.order(column),
        alias: r.value(column, elody("alias")) || undefined,
        size: this.enumValue(column, elody("size"), elody("ColumnSize")),
        elementSpreads: r.literals(column, elody("elementSpread")),
        elements: r.byOrder(r.nodes(column, elody("element"))).map((element) => this.element(element, pathToKey)),
      })),
    };
  }

  private element(element: string, pathToKey: Map<string, string>): M.UiElement {
    const r = this.r;
    const types = r.types(element);
    const unrendered = types.find((type) => UNRENDERED_ELEMENTS.includes(type));
    if (unrendered)
      throw new Error(`${compact(unrendered)} is in the ontology but not rendered by the generator yet; keep this element in hand-written GraphQL ("regions" mode)`);
    const kind: M.UiElementKind = types.includes(elody("ShaclShapeElement"))
      ? "shaclShape"
      : types.includes(elody("ListElement"))
        ? "list"
        : types.includes(elody("MarkdownElement"))
          ? "markdown"
          : types.includes(elody("SingleMediaFileElement"))
            ? "singleMedia"
            : types.includes(elody("MapElement"))
              ? "map"
              : types.includes(elody("EntityViewerElement"))
                ? "entityViewer"
                : types.includes(elody("CommentsElement"))
                  ? "comments"
                  : types.includes(elody("GraphElement"))
                    ? "graph"
                    : "window";

    const kindOf = kind;
    const labelsTerm = r.term(element, elody("datasetLabels"));
    const filterNode = r.node(element, elody("datasetFilter"));
    const datapoints = r.literal(element, elody("datapoints"));
    let customBulkOperations: string | undefined;
    const customTerm = r.term(element, elody("customBulkOperations"));
    if (customTerm?.termType === "Literal") {
      this.stringInsteadOfNode(element, elody("customBulkOperations"));
      customBulkOperations = customTerm.value;
    } else if (customTerm) customBulkOperations = this.queryNameOf(customTerm.value, "custom bulk operations set");

    // the declared documents the list loads (G-014 / G-015): customQuery and customQueryFilters come from them
    let customQuery = r.value(element, elody("customQuery"));
    let customQueryFilters = r.value(element, elody("customQueryFilters"));
    const listQueryNode = r.node(element, elody("listQuery"));
    if (listQueryNode) {
      const names = this.pickerNames(listQueryNode);
      customQuery ??= names.list;
      customQueryFilters ??= names.filters;
      if (!this.emittedListQueries.has(listQueryNode)) {
        this.emittedListQueries.add(listQueryNode);
        this.listQueries.set(listQueryNode, this.picker(listQueryNode));
      }
    }

    let pickerList: string | undefined;
    let pickerFilters: string | undefined;
    const pickerNode = r.node(element, elody("picker"));
    if (pickerNode) ({ list: pickerList, filters: pickerFilters } = this.pickerNames(pickerNode));
    else {
      if (r.has(element, elody("pickerList"))) this.retired(element, elody("pickerList"));
      if (r.has(element, elody("pickerFilters"))) this.retired(element, elody("pickerFilters"));
      pickerList = r.value(element, elody("pickerList"));
      pickerFilters = r.value(element, elody("pickerFilters"));
    }

    const statusNode = r.node(element, elody("windowStatus"));
    const actionsNode = r.node(element, elody("actionsOnResult"));
    return {
      kind,
      order: r.order(element),
      alias: r.value(element, elody("alias")),
      label: r.value(element, rdfs("label")),
      entityTypes: r.literals(element, elody("entityTypes")),
      relationType: r.value(element, elody("relationType")),
      customQuery,
      customQueryRelationType: r.value(element, elody("customQueryRelationType")) || undefined,
      listViewMode: r.value(element, elody("listViewMode")) || undefined,
      can: r.literals(element, elody("can")),
      editButton: r.literal(element, elody("editButton")) === true,
      hideInHistory: r.literal(element, elody("hideInHistory")) === true,
      disableLibraryBar: r.literal(element, elody("disableLibraryBar")) === true,
      enableNavigation: this.optionalFlag(element, elody("enableNavigation")),
      libraryMode: r.value(element, elody("libraryMode")) || undefined,
      mediaKind: this.enumValue(element, elody("mediaKind"), elody("MediaElementKind")),
      customQueryFilters,
      searchInputType: this.enumValue(element, elody("searchInput"), elody("SearchInputKind"), elody("searchInputType")),
      customBulkOperations,
      pickerList,
      pickerFilters,
      fieldsKey: r.value(element, elody("fieldsKey")),
      metadataKey: r.value(element, elody("metadataKey")),
      collapsed: r.literal(element, elody("collapsed")) === true,
      expandButton: this.optionalFlag(element, elody("expandButton")),
      windowLayout: this.enumValue(element, elody("windowLayout"), elody("WindowLayout")),
      panels: r.byOrder(r.nodes(element, elody("panel"))).map((panel) => this.panel(panel, pathToKey)),
      contextMenu: this.contextMenu(r.node(element, elody("contextMenu"))),
      panelSpreads: r.literals(element, elody("panelSpread")).length ? r.literals(element, elody("panelSpread")) : undefined,
      windowStatus: statusNode
        ? {
            labelKey: r.value(statusNode, elody("labelKey")) || undefined,
            statusKey: String(r.value(statusNode, elody("statusKey")) ?? ""),
            statusInputField: String(r.value(statusNode, elody("statusInputField")) ?? ""),
          }
        : undefined,
      actionsOnResult: actionsNode
        ? {
            resultKind: this.enumValue(actionsNode, elody("resultKind"), elody("ResultKind")) ?? "NoResult",
            operations: r.byOrder(r.nodes(actionsNode, elody("operation"))).map((op) => this.bulkOperation(op)),
          }
        : undefined,
      addEntitiesToForms: this.optionalFlag(element, elody("addEntitiesToForms")),
      cropCoordinatesKey: r.value(element, elody("cropCoordinatesKey")) || undefined,
      graphType: this.enumValue(element, elody("graphType"), elody("GraphType")),
      datasource: r.value(element, elody("datasource")) || undefined,
      datasetLabels: labelsTerm ? r.list(labelsTerm.value) : r.literals(element, elody("datasetLabel")).length ? r.literals(element, elody("datasetLabel")) : kindOf === "graph" ? [] : undefined,
      datasetFilter: filterNode ? { key: String(r.value(filterNode, elody("key")) ?? ""), values: r.literals(filterNode, elody("value")) } : undefined,
      timeUnit: this.enumValue(element, elody("timeUnit"), elody("TimeUnit")),
      datapoints: typeof datapoints === "number" ? datapoints : undefined,
      convertTo: r.value(element, elody("convertTo")) || undefined,
      parentFilterKey: r.value(element, elody("parentFilterKey")) || undefined,
      readOnly: r.literal(element, dash("readOnly")) === true || undefined,
      createFields: r.nodes(element, elody("createField")).length
        ? r.byOrder(r.nodes(element, elody("createField"))).map((field) => ({ key: String(r.value(field, elody("key")) ?? ""), labelKey: r.value(field, elody("labelKey")) || undefined, inputType: r.value(field, elody("clientInputField")) || undefined, order: r.order(field) }))
        : undefined,
      composer: this.composer(r.node(element, elody("composer"))),
      mapType: this.enumValue(element, elody("mapType"), elody("MapType")),
      center: r.value(element, elody("center")) || undefined,
      wktKey: r.value(element, elody("wktKey")) || undefined,
      config: r.nodes(element, elody("config")).length ? this.configEntries(element) : undefined,
    };
  }

  /** elody:composer: the rich-text editor of a comments element, with what it can tag. */
  private composer(node: string | undefined): M.UiComposer | undefined {
    if (!node) return undefined;
    const r = this.r;
    const listTerm = r.term(node, elody("extensions"));
    const extensions = listTerm ? r.list(listTerm.value).map((iri) => this.o.enumValue(iri) ?? iri) : r.nodes(node, elody("extension")).map((iri) => this.o.enumValue(iri) ?? iri);
    return {
      label: r.value(node, rdfs("label")) || undefined,
      metadataKey: String(r.value(node, elody("metadataKey")) ?? ""),
      extensions,
      editorStyles: r.value(node, elody("editorStyles")) || undefined,
      multilingual: this.optionalFlag(node, elody("multilingual")),
      taggables: r.byOrder(r.nodes(node, elody("taggable"))).map((taggable) => {
        const flow = r.node(taggable, elody("flow"));
        const min = r.literal(taggable, elody("triggerMinCharacters"));
        return {
          tag: r.value(taggable, elody("tag")) || undefined,
          entityType: String(r.value(taggable, elody("entityType")) ?? ""),
          relationType: String(r.value(taggable, elody("relationType")) ?? ""),
          filterKey: r.value(taggable, elody("tagFilterKey")) || undefined,
          triggerCharacter: r.value(taggable, elody("triggerCharacter")) || undefined,
          triggerMinCharacters: typeof min === "number" ? min : undefined,
          flowQuery: flow ? this.queryNameOf(flow, "guided flow") : undefined,
          flowButtonLabel: r.value(taggable, elody("flowButtonLabel")) || undefined,
          order: r.order(taggable),
        };
      }),
    };
  }

  /** elody:config entries of a node: a value is a literal, an RDF list, or a node of entries (an object). */
  private configEntries(node: string): M.UiConfigEntry[] {
    const r = this.r;
    return r.nodes(node, elody("config")).map((entry): M.UiConfigEntry => {
      const term = r.term(entry, elody("value"));
      let value: M.UiConfigEntry["value"];
      if (term?.termType === "NamedNode") value = { enum: this.o.enumValue(term.value) ?? localName(term.value) };
      else if (term && term.termType !== "Literal") {
        const members = r.listTerms(term.value);
        value = members ? members.map((m) => m.value) : Object.fromEntries(this.configEntries(term.value).map((e) => [e.key, String(e.value)]));
      } else value = r.literal(entry, elody("value")) ?? "";
      return { key: String(r.value(entry, elody("key")) ?? ""), value };
    });
  }

  /** elody:panelField nodes: how this panel shows a field otherwise than the property shape says. */
  private fieldOverrides(panel: string, pathToKey: Map<string, string>): M.UiPanel["fieldOverrides"] {
    const r = this.r;
    const nodes = r.nodes(panel, elody("panelField"));
    if (!nodes.length) return undefined;
    return nodes.map((node) => {
      const path = r.node(node, elody("field"));
      const key = path ? pathToKey.get(path) : undefined;
      if (!key) throw new Error(`panel "${r.value(panel, elody("alias"))}" has an elody:panelField whose elody:field no property shape declares as sh:path`);
      return { key, labelKey: r.value(node, elody("labelKey")) || undefined, alias: r.value(node, elody("alias")) || undefined, widget: this.optionalFlag(node, elody("panelWidget")) };
    });
  }

  private panel(panel: string, pathToKey: Map<string, string>): M.UiPanel {
    const r = this.r;
    let editable: boolean;
    if (r.has(panel, elody("editable"))) {
      this.retired(panel, elody("editable"));
      editable = r.literal(panel, elody("editable")) === true;
    } else editable = r.literal(panel, dash("readOnly")) !== true;

    const alias = String(r.value(panel, elody("alias")) ?? "");
    if (r.hasType(panel, sh("PropertyGroup")))
      return {
        alias,
        order: r.order(panel),
        label: this.labelOf(panel, rdfs("label"), `ui.${this.type}.group.${alias}`),
        header: this.optionalFlag(panel, elody("panelHeader")),
        panelType: this.enumValue(panel, elody("panelKind"), elody("PanelKind"), elody("panelType")),
        collapsed: r.literal(panel, elody("collapsed")) === true,
        editable,
        editableDefault: this.optionalFlag(panel, elody("editableDefault")),
        repetitionKey: r.value(panel, elody("repetitionKey")) || undefined,
        displayConditionKey: r.value(panel, elody("displayConditionKey")) || undefined,
        bulkDataSource: r.value(panel, elody("bulkDataSource")) || undefined,
        fieldOverrides: this.fieldOverrides(panel, pathToKey),
        multipleColumns: this.optionalFlag(panel, elody("multipleColumns")),
        can: r.value(panel, elody("can")) || undefined,
        spreads: r.literals(panel, elody("spread")),
        fields: [
          ...(this.groupFields.get(panel) ?? []),
          ...(r.literal(panel, elody("showsUngrouped")) === true ? this.ungroupedFields : []),
        ],
        elements: r.byOrder(r.nodes(panel, elody("element"))).map((element) => this.element(element, pathToKey)),
      };

    const fields = r.quadsOf(panel)
      .filter((quad) => quad.predicate.value === elody("field"))
      .map((quad): string => {
        const term: Term = quad.object;
        if (term.termType === "Literal") {
          this.r.warn(panel, "a panel field is referenced by name; reference the property shape by its sh:path IRI");
          return term.value;
        }
        const key = pathToKey.get(term.value);
        if (!key) throw new Error(`panel "${r.value(panel, elody("alias"))}" references ${compact(term.value)}, which no property shape declares as sh:path`);
        return key;
      });

    return {
      alias: String(r.value(panel, elody("alias")) ?? ""),
      order: r.order(panel),
      label: r.value(panel, rdfs("label")),
      header: this.optionalFlag(panel, elody("panelHeader")),
      panelType: this.enumValue(panel, elody("panelKind"), elody("PanelKind"), elody("panelType")),
      collapsed: r.literal(panel, elody("collapsed")) === true,
      editable,
      editableDefault: this.optionalFlag(panel, elody("editableDefault")),
      repetitionKey: r.value(panel, elody("repetitionKey")) || undefined,
      displayConditionKey: r.value(panel, elody("displayConditionKey")) || undefined,
      bulkDataSource: r.value(panel, elody("bulkDataSource")) || undefined,
      fieldOverrides: this.fieldOverrides(panel, pathToKey),
      multipleColumns: this.optionalFlag(panel, elody("multipleColumns")),
      can: r.value(panel, elody("can")) || undefined,
      spreads: r.literals(panel, elody("spread")),
      fields,
      elements: r.byOrder(r.nodes(panel, elody("element"))).map((element) => this.element(element, pathToKey)),
    };
  }
}

export { localName, rdf, DASH };
