/**
 * *.ui.ttl -> the UI model. Reads the 0.1 vocabulary (instances, node
 * references, sh:/shui:/dash: terms) and, for one release, the retired dialect
 * (strings, name references, elody:hidden & co) with a warning per retired term
 * so `check` can report what to migrate.
 */
import type { Term } from "n3";
import { Scorer } from "./score.js";
import * as M from "./model.js";
import { Ontology, defaultOntology } from "./ontology.js";
import { Reading, type Literal, type Warning } from "./reading.js";
import { DASH, compact, dash, elody, localName, rdf, rdfs, sh, shui } from "./vocab.js";

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
};

export async function readUiDeclaration(ttl: string, ontology: Ontology = defaultOntology()): Promise<ParseResult> {
  const reading = Reading.parse(ttl);
  const editors = await scoreFormEditors(reading);
  const parse = new Parse(reading, ontology, editors);
  const entities = reading.subjectsOfType(elody("EntityUi")).map((subject) => parse.entity(subject));
  return { entities, warnings: reading.warnings, translations: parse.translations, inputFields: parse.inputFields };
}

export async function parseUiDeclaration(ttl: string, ontology: Ontology = defaultOntology()): Promise<M.UiEntity[]> {
  return (await readUiDeclaration(ttl, ontology)).entities;
}

/**
 * The SHACL 1.2 UI scoring system picks the editor of every create-form field
 * (the property shapes under an elody:Form's elody:shape). Fields without any
 * scored editor get none here; the parser falls back to a text field, which is
 * the renderer's choice the spec leaves open.
 */
async function scoreFormEditors(reading: Reading): Promise<Map<string, string>> {
  const fields = reading
    .subjectsOfType(elody("Form"))
    .flatMap((form) => reading.nodes(form, elody("shape")))
    .flatMap((shape) => reading.nodes(shape, sh("property")));
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
  "MediaFileElement", "SingleMediaFileElement", "MapElement", "GraphElement", "HierarchyListElement",
  "ManifestViewerElement", "EntityViewerElement", "ActionElement", "WysiwygElement", "CommentsElement",
].map((name) => elody(name));

const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

class Parse {
  readonly translations: Translations = {};
  readonly inputFields: Record<string, InputFieldDefinition> = {};
  private groupFields = new Map<string, string[]>();
  /** lower-cased GraphQL type of the entity being parsed, for minted label keys */
  private type = "";

  constructor(
    private readonly r: Reading,
    private readonly o: Ontology,
    private readonly scoredEditors: Map<string, string> = new Map(),
  ) {}

  // -- keys and labels (sh:name = label text, sh:path = key) ----------------------

  /** The metadata key of a property shape: elody:key, else the sh:path local name, else (old use) sh:name. */
  private keyOf(node: string): string {
    const r = this.r;
    const explicit = r.value(node, elody("key"));
    if (explicit) return explicit;
    const path = r.node(node, sh("path"));
    if (path && !path.startsWith("_:") && !path.startsWith("n3-") && /[:/#]/.test(path)) return localName(path);
    const name = r.literals(node, sh("name"))[0];
    if (name !== undefined) {
      r.warn(node, "sh:name used as the metadata key: give the property an sh:path (or elody:key); sh:name is the label text");
      return name;
    }
    return "";
  }

  private addTranslation(language: string, key: string, text: string) {
    (this.translations[language] ??= {})[key] = text;
  }

  /**
   * The label a renderer shows, as an Elody translation key: elody:labelKey, else
   * (old use) rdfs:label on a property shape, else a key minted from `minted`
   * when the label text is language-tagged. The tagged texts land in
   * `translations` under that key. An untagged text is the label itself.
   */
  private labelOf(node: string, textPredicate: string, minted: string, legacyKey?: string): string | undefined {
    const r = this.r;
    const texts = r.quadsOf(node).filter((q) => q.predicate.value === textPredicate && q.object.termType === "Literal");
    const tagged = texts.filter((q) => (q.object as Term & { language?: string }).language);
    let key = r.value(node, elody("labelKey"));
    if (!key && textPredicate === sh("name") && r.has(node, rdfs("label"))) {
      r.warn(node, "rdfs:label on a property shape is read as an Elody translation key: use elody:labelKey, and sh:name for the label text");
      key = r.value(node, rdfs("label"));
    }
    if (!key && tagged.length) key = minted;
    for (const q of tagged) if (key) this.addTranslation((q.object as Term & { language: string }).language, key, q.object.value);
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
    const name = `${this.type}${key.charAt(0).toUpperCase()}${key.slice(1)}Field`;
    if (editor === shui("EnumSelectEditor")) {
      const values = r.list(r.node(node, sh("in")));
      this.inputFields[name] = {
        type: single ? "dropdown" : "dropdownMultiselectMetadata",
        options: values.map((value) => ({ label: value, value })),
      };
      return name;
    }
    const cls = r.node(node, sh("class"));
    if (cls && (editor === shui("InstancesSelectEditor") || editor === shui("AutoCompleteEditor"))) {
      this.inputFields[name] = {
        type: single ? "dropdownSingleselectRelations" : "dropdownMultiselectRelations",
        relationType: `has${key.charAt(0).toUpperCase()}${key.slice(1)}`,
        advancedFilterInputForRetrievingOptions: [{ type: "type", value: lowerFirst(localName(cls)) }],
      };
      return name;
    }
    throw new Error(`${compact(editor)} has no create-form field type in the ontology and no generated custom field`);
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
    if (this.r.has(node, elody("filtersQueryName"))) {
      this.retired(node, elody("filtersQueryName"));
      return { list, filters: this.r.value(node, elody("filtersQueryName"))! };
    }
    return { list, filters: pickerFiltersNameFor(list) };
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
    this.type = lowerFirst(String(r.value(subject, elody("documentName")) ?? r.value(subject, elody("graphqlType")) ?? ""));
    const nodes = r.nodes(subject, sh("property"));
    const parsed = nodes.map((node) => ({ node, property: this.property(node) }));
    const ordered = this.specOrder(parsed.map((p) => ({ ...p, label: p.property.key })));
    const properties = ordered.map((p) => p.property);
    const pathToKey = new Map(properties.filter((p) => p.path).map((p) => [p.path!, p.key]));
    // sh:group → the keys of its properties, in the spec's order within the group
    this.groupFields = new Map();
    for (const { node, property } of ordered) {
      const group = r.node(node, sh("group"));
      if (group) (this.groupFields.get(group) ?? this.groupFields.set(group, []).get(group)!).push(property.key);
    }

    return {
      iri: subject,
      graphqlType: String(r.value(subject, elody("graphqlType")) ?? ""),
      documentName: r.value(subject, elody("documentName")) || undefined,
      targetClass: r.value(subject, sh("targetClass")),
      emit: r.value(subject, elody("emit")) === "file" ? "file" : "regions",
      documents: r.literals(subject, elody("documents")),
      typePills: r.literal(subject, elody("typePills")) === true,
      dynamicFormConfigField: r.value(subject, elody("dynamicFormConfig")) || undefined,
      portsField: r.value(subject, elody("ports")) || undefined,
      viewModes: r.byOrder(r.nodes(subject, elody("viewMode"))).map((node) => this.viewMode(node)),
      properties,
      filters: r.byOrder(r.nodes(subject, elody("filter"))).map((node) => this.filter(node)),
      contextMenu: this.contextMenu(r.node(subject, elody("contextMenu"))),
      detail: this.detail(r.node(subject, elody("detail")), pathToKey),
      formSources: r.nodes(subject, elody("formSource")).map((node) => this.formSource(node)),
      bulkOperations: r.byOrder(r.nodes(subject, elody("bulkOperation"))).map((node) => this.bulkOperation(node)),
      customBulkOperations: r.nodes(subject, elody("customBulkOperations")).map((node) => ({
        queryName: this.queryNameOf(node, "custom bulk operations set"),
        operations: r.byOrder(r.nodes(node, elody("operation"))).map((op) => this.bulkOperation(op)),
      })),
      createForms: this.createForms(subject),
      repetitiveForms: this.guidedFlows(subject),
      pickers: r.byOrder(r.nodes(subject, elody("picker"))).map((node) => this.picker(node)),
    };
  }

  private viewMode(node: string): M.UiViewMode {
    const r = this.r;
    return {
      mode: this.enumValue(node, elody("mode"), elody("ViewMode")) ?? "",
      order: r.order(node),
      config: r.nodes(node, elody("config")).map((entry): M.UiConfigEntry => {
        const term = r.term(entry, elody("value"));
        const value =
          term && term.termType !== "Literal" ? r.list(term.value) : (r.literal(entry, elody("value")) ?? "");
        return { key: String(r.value(entry, elody("key")) ?? ""), value };
      }),
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
    return {
      key,
      path: r.node(node, sh("path")),
      label: this.labelOf(node, sh("name"), `ui.${this.type}.${key}`, key),
      order: r.order(node),
      colSpan: typeof colSpan === "number" ? colSpan : undefined,
      unit: this.enumValue(node, elody("unit"), elody("Unit")),
      formatter: this.formatter(node),
      role,
      teaser: r.literal(node, elody("teaser")) !== false,
      sortable: r.literal(node, elody("sortable")) === true,
      defaultSortDirection: this.enumValue(node, elody("defaultSortDirection"), elody("SortDirection")),
      source: this.enumValue(node, elody("source"), elody("ValueSource")),
      index: typeof index === "number" ? index : undefined,
      hidden: this.hidden(node),
      readOnly,
      description: r.value(node, sh("description")),
    };
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
      label: r.value(node, rdfs("label")),
      defaultValues,
      defaultValueAsList: r.literal(node, elody("defaultValueAsList")) === true,
      hidden: this.hidden(node),
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
      actions: r.byOrder(r.nodes(node, elody("action"))).map((action): M.UiAction => {
        const source = r.node(action, elody("formSourceRef"));
        return {
          alias: String(r.value(action, elody("alias")) ?? ""),
          order: r.order(action),
          actionType: this.enumValue(action, elody("actionKind"), elody("ActionKind"), elody("actionType")) ?? "",
          formQuery: source
            ? this.queryNameOf(source, "form source")
            : this.formRef(action, elody("form"), elody("formQuery")),
          formFlow: r.value(action, elody("formFlow")),
          formTitle: r.value(action, elody("formTitle")),
          label: r.value(action, rdfs("label")),
          icon: r.value(action, elody("icon")),
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
      context = {
        activeViewMode: this.enumValue(contextNode, elody("activeViewMode"), elody("InteractionMode")) ?? "",
        selection: this.enumValue(contextNode, elody("selection"), elody("SelectionState")) ?? "",
        tooltip: tooltip ?? "",
      };
    }
    return {
      value: this.enumValue(node, elody("operationKind"), elody("BulkOperationKind"), elody("value")) ?? "",
      order: r.order(node),
      icon: r.value(node, elody("icon")),
      label: r.value(node, rdfs("label")),
      primary: typeof primary === "boolean" ? primary : undefined,
      can: r.literals(node, elody("can")),
      context,
      modal: modalNode
        ? {
            typeModal: this.enumValue(modalNode, elody("modalKind"), elody("ModalKind"), elody("typeModal")) ?? "",
            formQuery: this.formRef(modalNode, elody("form"), elody("formQuery")),
            formRelationType: r.value(modalNode, elody("formRelationType")),
            closeConfirmation: r.literal(modalNode, elody("closeConfirmation")) === true,
            permission: this.enumValue(modalNode, elody("permission"), elody("Permission")),
          }
        : undefined,
    };
  }

  private createForms(subject: string): M.UiCreateForm[] {
    const r = this.r;
    const declared = r
      .nodes(subject, elody("form"))
      .filter((node) => r.hasType(node, elody("Form")))
      .map((node): M.UiCreateForm => {
        const shape = r.node(node, elody("shape"));
        if (!shape) throw new Error(`form ${compact(node)} has no elody:shape`);
        return {
          queryName: this.queryNameOf(node, "form"),
          label: r.value(node, rdfs("label")),
          fields: this.specOrder(r.nodes(shape, sh("property")).map((node) => ({ node, label: this.keyOf(node) }))).map((field) => this.formField(field.node)),
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

  private submit(node: string | undefined): M.UiCreateForm["submit"] {
    if (!node) return undefined;
    const r = this.r;
    return {
      label: r.value(node, rdfs("label")),
      icon: r.value(node, elody("icon")),
      actionQuery: r.value(node, elody("actionQuery")),
      creationType: r.value(node, elody("creationType")),
    };
  }

  /** A form field as a property shape: the widget is the one the SHACL 1.2 UI scoring system picks. */
  private formField(node: string): M.UiCreateFormField {
    const r = this.r;
    const editor = this.scoredEditors.get(node) ?? shui("TextFieldEditor");
    const key0 = this.keyOf(node);
    const inputType = this.o.formFieldType(editor) ?? this.customField(node, editor, key0);
    let required = Number(r.value(node, sh("minCount")) ?? 0) >= 1;
    if (!required && r.has(node, elody("required"))) {
      this.retired(node, elody("required"));
      required = r.literal(node, elody("required")) === true;
    }
    const key = key0;
    return {
      key,
      label: this.labelOf(node, sh("name"), `ui.${this.type}.${key}`, key),
      order: r.order(node),
      inputType,
      required,
      editor,
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
    };
  }

  private guidedFlows(subject: string): M.UiRepetitiveForm[] {
    const r = this.r;
    const legacy = r.nodes(subject, elody("repetitiveForm"));
    if (legacy.length) this.retired(subject, elody("repetitiveForm"));
    return [...r.nodes(subject, elody("guidedFlow")), ...legacy].map((node): M.UiRepetitiveForm => {
      const finalizeNode = r.node(node, elody("finalize"));
      return {
        queryName: this.queryNameOf(node, "guided flow"),
        label: r.value(node, rdfs("label")),
        repeatable: r.literal(node, elody("repeatable")) === true,
        refetchOnFinish: r.literal(node, elody("refetchOnFinish")) === true,
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
    };
  }

  private picker(node: string): M.UiPicker {
    const r = this.r;
    const names = this.pickerNames(node);
    return {
      queryName: names.list,
      filtersQueryName: names.filters,
      order: r.order(node),
      results: r.byOrder(r.nodes(node, elody("result"))).map((result): M.UiPickerResult => {
        let type = r.value(result, elody("graphqlType"));
        if (type === undefined && r.has(result, elody("type"))) {
          this.retired(result, elody("type"));
          type = r.value(result, elody("type"));
        }
        return {
          type: type ?? "",
          fragment: String(r.value(result, elody("fragment")) ?? ""),
          order: r.order(result),
        };
      }),
      filters: r.byOrder(r.nodes(node, elody("filter"))).map((filter) => this.filter(filter)),
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

  private detail(node: string | undefined, pathToKey: Map<string, string>): M.UiDetail | undefined {
    if (!node) return undefined;
    const r = this.r;
    return {
      shapeDriven: r.literal(node, elody("shapeDriven")) === true,
      fragmentFields: r.literals(node, elody("fragmentField")),
      columns: r.byOrder(r.nodes(node, elody("column"))).map((column): M.UiColumn => ({
        order: r.order(column),
        size: this.enumValue(column, elody("size"), elody("ColumnSize")) ?? "hundred",
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
          : "window";

    let customBulkOperations: string | undefined;
    const customTerm = r.term(element, elody("customBulkOperations"));
    if (customTerm?.termType === "Literal") {
      this.stringInsteadOfNode(element, elody("customBulkOperations"));
      customBulkOperations = customTerm.value;
    } else if (customTerm) customBulkOperations = this.queryNameOf(customTerm.value, "custom bulk operations set");

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

    return {
      kind,
      order: r.order(element),
      alias: r.value(element, elody("alias")),
      label: r.value(element, rdfs("label")),
      entityTypes: r.literals(element, elody("entityTypes")),
      relationType: r.value(element, elody("relationType")),
      customQuery: r.value(element, elody("customQuery")),
      customQueryFilters: r.value(element, elody("customQueryFilters")),
      searchInputType: this.enumValue(element, elody("searchInput"), elody("SearchInputKind"), elody("searchInputType")),
      customBulkOperations,
      pickerList,
      pickerFilters,
      fieldsKey: r.value(element, elody("fieldsKey")),
      metadataKey: r.value(element, elody("metadataKey")),
      collapsed: r.literal(element, elody("collapsed")) === true,
      expandButton: r.literal(element, elody("expandButton")) === true,
      panels: r.byOrder(r.nodes(element, elody("panel"))).map((panel) => this.panel(panel, pathToKey)),
    };
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
        panelType: this.enumValue(panel, elody("panelKind"), elody("PanelKind"), elody("panelType")) ?? "metadata",
        collapsed: r.literal(panel, elody("collapsed")) === true,
        editable,
        fields: this.groupFields.get(panel) ?? [],
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
      panelType: this.enumValue(panel, elody("panelKind"), elody("PanelKind"), elody("panelType")) ?? "metadata",
      collapsed: r.literal(panel, elody("collapsed")) === true,
      editable,
      fields,
    };
  }
}

export { localName, rdf, DASH };
