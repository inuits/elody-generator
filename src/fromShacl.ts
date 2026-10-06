/**
 * A plain SHACL 1.2 UI shapes graph → an Elody UI declaration (elody:EntityUi).
 *
 * The property shapes are reused as they are (sh:path, sh:name, sh:order,
 * sh:datatype, sh:in, sh:class, shui:editor …): they are the card, the detail
 * panels and the create form at once. The declaration only adds what Elody
 * needs around them: the entity UI, a view mode, the property groups as detail
 * panels (ungrouped properties in a "Details" group), and a create form. What
 * Elody cannot render is left out and listed in `notes`.
 */
import { DataFactory, Parser, type Quad, type Term } from "n3";
import { defaultOntology } from "./ontology.js";
import { shapeToForm, type SpecField } from "./shapeForm.js";
import { TurtleWriter } from "./turtle.js";
import { DASH, ELODY, RDF, RDFS, SH, SHUI, XSD, dash, elody, localName, rdf, rdfs, sh, shui } from "./vocab.js";

const { namedNode, blankNode, literal, quad } = DataFactory;

export type FromShaclOptions = {
  /** short id of the example, used for IRIs (ui:<id>-…) */
  id: string;
  /** base name of the generated documents, e.g. "SpecPerson" */
  documentName: string;
  /** label of the create form */
  title?: string;
  data?: string;
  focus?: string;
  nodeShape?: string;
  /** namespace of the generated nodes */
  namespace?: string;
};

export type FromShaclResult = {
  ttl: string;
  notes: string[];
  /** the focus node's values per metadata key, to show a filled-in detail page */
  sample: Record<string, string | string[] | { value: string; lang: string }[]>;
  fields: { key: string; label: string; inForm: boolean; inDetail: boolean; editor?: string; viewer?: string }[];
  /** the focus node's related nodes, as Elody relations on the sample entity */
  relations: { type: string; key: string; label: string }[];
};

const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Predicates whose named objects are shapes of their own, copied along with the referring shape. */
const NESTED = [sh("node"), sh("property")];

export async function fromShacl(shapes: string, options: FromShaclOptions): Promise<FromShaclResult> {
  const ns = options.namespace ?? "https://elody.eu/examples/shacl-ui#";
  const ontology = defaultOntology();
  const source = new Parser().parse(shapes);
  const form = await shapeToForm({ shapes, shapeQuads: source, data: options.data, focus: options.focus, nodeShape: options.nodeShape });
  // a create form starts empty: its widgets are scored without a value, as the generator does
  const empty = options.focus ? await shapeToForm({ shapes, shapeQuads: source, nodeShape: options.nodeShape }) : form;
  const emptyEditor = new Map(empty.fields.map((field) => [field.shape, field.editor?.widget ?? ""]));
  const notes: string[] = [];
  const out: Quad[] = [];
  const seen = new Set<string>();
  const add = (s: Term, p: string, o: Term) => {
    const id = `${s.termType}:${s.value} ${p} ${o.termType}:${o.value}:${(o as Term & { language?: string }).language ?? ""}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(quad(s as never, namedNode(p), o as never));
  };
  const ui = (name: string) => namedNode(`${ns}${options.id}-${name}`);

  // -- copy a node (and its blank-node tree) from the source ------------------------------
  const bySubject = new Map<string, Quad[]>();
  for (const q of source) (bySubject.get(q.subject.value) ?? bySubject.set(q.subject.value, []).get(q.subject.value)!).push(q);
  const copied = new Map<string, Term>();
  const copy = (id: string, as: Term, skip: (q: Quad) => boolean = () => false): Term => {
    if (copied.has(id)) return copied.get(id)!;
    copied.set(id, as);
    for (const q of bySubject.get(id) ?? []) {
      if (skip(q)) continue;
      const o = q.object;
      const object = o.termType === "BlankNode" ? copy(o.value, blankNode()) : o;
      // a nested node shape and its property shapes travel with the property that uses them
      if (o.termType === "NamedNode" && NESTED.includes(q.predicate.value) && bySubject.has(o.value)) copy(o.value, o);
      add(as, q.predicate.value, object);
    }
    return as;
  };

  const entity = namedNode(`${ns}${options.id}`);
  add(entity, rdf("type"), namedNode(elody("EntityUi")));
  add(entity, elody("graphqlType"), literal("BaseEntity"));
  add(entity, elody("documentName"), literal(options.documentName));
  add(entity, elody("emit"), literal("file"));
  // the ontology anchor: what kind of thing this UI is about (elody:EntityUi is a sh:NodeShape)
  if (form.nodeShape)
    for (const q of bySubject.get(form.nodeShape) ?? [])
      if (q.predicate.value === sh("targetClass")) add(entity, sh("targetClass"), q.object);
  const viewMode = blankNode();
  add(entity, elody("viewMode"), viewMode);
  add(viewMode, elody("mode"), namedNode(elody("ListView")));

  for (const gap of form.gaps) notes.push(gap.message);

  // the global configuration is part of the shapes graph: it travels with the declaration
  for (const q of source)
    if (q.predicate.value === rdf("type") && q.object.value === shui("Configuration")) copy(q.subject.value, q.subject);

  // -- which properties Elody can carry -----------------------------------------------
  const usable: SpecField[] = [];
  for (const field of form.fields) {
    if (field.path.kind !== "predicate" && field.path.kind !== "inverse") {
      notes.push(`"${field.label}": ${field.path.kind} path, left out (an Elody field reads one metadata key or one relation)`);
      continue;
    }
    usable.push(field);
  }
  if (!usable.length) notes.push("no property Elody can carry: the declaration has no fields");

  const hasClass = (field: SpecField) => (bySubject.get(field.shape) ?? []).some((q) => q.predicate.value === sh("class"));
  // the Elody key of a field: the path's local name, or for an inverse path the mirrored relation (is<X>For)
  const keyOf = (field: SpecField) =>
    field.path.kind === "inverse" ? `is${upperFirst(localName(field.path.iris[0]))}For` : localName(field.path.iris[0]);
  // relation-valued: an inverse path, or a predicate path whose values are instances of a class
  const relationTypeOf = (field: SpecField) =>
    field.path.kind === "inverse" ? keyOf(field) : hasClass(field) ? `has${upperFirst(keyOf(field))}` : undefined;

  const formEditable = (field: SpecField) => {
    if (field.path.kind === "inverse") return hasClass(field);
    const editor = emptyEditor.get(field.shape) ?? field.editor?.widget ?? "";
    if (ontology.formFieldType(editor) !== undefined) return true;
    if (editor === `${SHUI}EnumSelectEditor`) return true;
    // a nested shape: a field with sub-fields (inputFieldWithSubFields)
    if (editor === `${SHUI}DetailsEditor` && bySubject.get(field.shape)?.some((q) => q.predicate.value === sh("node"))) return true;
    if ([`${SHUI}InstancesSelectEditor`, `${SHUI}AutoCompleteEditor`].includes(editor) && bySubject.get(field.shape)?.some((q) => q.predicate.value === sh("class")))
      return true;
    return false;
  };

  const hasLabelRole = usable.some((field) =>
    (bySubject.get(field.shape) ?? []).some((q) => q.predicate.value === shui("propertyRole")),
  );
  // several direct LabelRoles (RDF 1.2 annotations {| sh:order n |} assert the plain triple):
  // write them in the RDF 1.1 qualified form, in the precedence the spec resolves
  const directLabelRole = (shape: string) =>
    (bySubject.get(shape) ?? []).some((q) => q.predicate.value === shui("propertyRole") && q.object.value === shui("LabelRole"));
  const qualify = usable.filter((field) => directLabelRole(field.shape)).length > 1;
  if (qualify) notes.push("several shapes carry a LabelRole with RDF 1.2 annotations; written as qualified roles (shui:propertyRole [ shui:propertyRole shui:LabelRole ; sh:order n ])");

  // -- property shapes: reused, with only what the Elody profile needs changed ------------------------
  const propertyTerm = new Map<string, Term>();
  for (const [index, field] of usable.entries()) {
    const key = keyOf(field);
    const named = !field.shape.startsWith("_:") && !/^n3-|^b\d+/.test(field.shape) && /[:/#]/.test(field.shape);
    const term = named ? namedNode(field.shape) : ui(key);
    const editor = (bySubject.get(field.shape) ?? []).find((q) => q.predicate.value === shui("editor"))?.object.value;
    const viewer = (bySubject.get(field.shape) ?? []).find((q) => q.predicate.value === shui("viewer"))?.object.value;
    copy(field.shape, term, (q) => {
      if (q.predicate.value === rdfs("label")) return true; // the profile reads label texts from sh:name
      if (q.predicate.value === sh("group")) return true; // re-added below (groups are copied as panels)
      if (qualify && q.predicate.value === shui("propertyRole") && q.object.value === shui("LabelRole")) return true;
      if (q.predicate.value === shui("editor") && ontology.formFieldType(q.object.value) === undefined && ontology.inputFieldType(q.object.value) === undefined) return true;
      if (q.predicate.value === shui("viewer") && ontology.formatterValue(q.object.value) === undefined) return true;
      return false;
    });
    if (field.searchQuery)
      notes.push(`"${field.label}": shui:searchQuery (SPARQL) left out; the relation dropdown searches Elody's own index`);
    if (editor && ontology.formFieldType(editor) === undefined && ontology.inputFieldType(editor) === undefined)
      notes.push(`"${field.label}": Elody has no ${editor.replace(SHUI, "shui:").replace(/^.*[#/]/, (m) => (editor.startsWith(SHUI) ? m : ""))}; the declared editor is left out and the spec's scoring picks one`);
    if (viewer && ontology.formatterValue(viewer) === undefined)
      notes.push(`"${field.label}": Elody has no ${viewer.replace(SHUI, "shui:")}; shown as plain text`);
    if (!hasLabelRole && index === 0) {
      add(term, shui("propertyRole"), namedNode(shui("LabelRole")));
      notes.push(`"${field.label}" is used as the card title (the shapes declare no shui:LabelRole)`);
    }
    if (qualify && directLabelRole(field.shape)) {
      const precedence = form.labelProperties.indexOf(field.path.iris[0]);
      const role = blankNode();
      add(term, shui("propertyRole"), role);
      add(role, shui("propertyRole"), namedNode(shui("LabelRole")));
      add(role, sh("order"), literal(String(precedence < 0 ? 99 : precedence), namedNode(`${XSD}integer`)));
    }
    add(entity, sh("property"), term);
    propertyTerm.set(field.shape, term);
  }

  // -- groups → detail panels -------------------------------------------------------------------
  const groups: { term: Term; order: number }[] = [];
  const groupTerm = new Map<string, Term>();
  for (const field of usable) {
    const term = propertyTerm.get(field.shape)!;
    let g: Term;
    if (field.group) {
      g = groupTerm.get(field.group.iri) ?? namedNode(field.group.iri);
      if (!groupTerm.has(field.group.iri)) {
        groupTerm.set(field.group.iri, g);
        copy(field.group.iri, g);
        // no label in the shapes: the spec's label resolution ends at the local name
        if (!(bySubject.get(field.group.iri) ?? []).some((q) => q.predicate.value === rdfs("label")))
          add(g, rdfs("label"), literal(localName(field.group.iri)));
        add(g, rdf("type"), namedNode(sh("PropertyGroup")));
        add(g, elody("alias"), literal(lowerFirst(localName(field.group.iri))));
        groups.push({ term: g, order: field.group.order ?? Number.MAX_SAFE_INTEGER });
      }
    } else {
      // an ungrouped property stays ungrouped (a plain field in the create form);
      // the detail page shows it in a "Details" panel that collects ungrouped properties
      g = groupTerm.get("details") ?? ui("details");
      if (!groupTerm.has("details")) {
        groupTerm.set("details", g);
        add(g, rdf("type"), namedNode(sh("PropertyGroup")));
        add(g, rdfs("label"), literal("Details", "en"));
        add(g, rdfs("label"), literal("Details", "nl"));
        add(g, elody("alias"), literal("details"));
        add(g, elody("showsUngrouped"), literal("true", namedNode(`${XSD}boolean`)));
        groups.push({ term: g, order: Number.MAX_SAFE_INTEGER - 1 });
      }
      continue;
    }
    add(term, sh("group"), g);
  }
  for (const group of groups) {
    add(group.term, elody("panelKind"), namedNode(elody("MetadataPanel")));
    add(group.term, dash("readOnly"), literal("true", namedNode(`${XSD}boolean`)));
    add(group.term, elody("collapsed"), literal("false", namedNode(`${XSD}boolean`)));
    if (group.order === Number.MAX_SAFE_INTEGER - 1) {
      const orders = usable.filter((f) => !f.group && f.order !== null).map((f) => f.order!);
      add(group.term, sh("order"), literal(String(orders.length ? Math.min(...orders) : 0), namedNode(`${XSD}integer`)));
    }
  }
  if (groups.length) {
    const detail = blankNode(), column = blankNode(), element = blankNode();
    add(entity, elody("detail"), detail);
    add(detail, elody("column"), column);
    add(column, elody("size"), namedNode(elody("Width100")));
    add(column, elody("element"), element);
    add(element, rdf("type"), namedNode(elody("WindowElement")));
    add(element, rdfs("label"), literal(options.title ?? options.documentName));
    for (const group of groups) add(element, elody("panel"), group.term);
  }

  // -- create form: the same property shapes ------------------------------------------------------------
  const formFields = usable.filter((field) => {
    const ok = formEditable(field);
    if (!ok && field.path.kind === "inverse")
      notes.push(`"${field.label}": inverse path without sh:class; shown on the detail page, left out of the form (picking a value needs the related type)`);
    else if (!ok) notes.push(`"${field.label}": ${(emptyEditor.get(field.shape) ?? field.editor?.widget ?? "").replace(SHUI, "shui:")} has no create-form field in Elody; left out of the form`);
    return ok;
  });
  if (formFields.length) {
    const formNode = ui("create");
    add(entity, elody("form"), formNode);
    add(formNode, rdf("type"), namedNode(elody("Form")));
    add(formNode, elody("queryName"), literal(`${options.documentName}CreateForm`));
    add(formNode, rdfs("label"), literal(options.title ?? options.documentName));
    const formShape = blankNode();
    add(formNode, elody("shape"), formShape);
    for (const field of formFields) add(formShape, sh("property"), propertyTerm.get(field.shape)!);
    const submit = blankNode();
    add(formNode, elody("submit"), submit);
    add(submit, rdfs("label"), literal("actions.labels.create"));
    add(submit, elody("icon"), literal("Create"));
    add(submit, elody("actionQuery"), literal("CreateEntity"));
    add(submit, elody("creationType"), literal("BaseEntity"));
  }

  // -- sample values from the spec's data graph -----------------------------------------------------------
  const sample: FromShaclResult["sample"] = {};
  const relations: FromShaclResult["relations"] = [];
  for (const field of usable) {
    if (!field.values.length) continue;
    const relationType = relationTypeOf(field);
    if (relationType) {
      for (const value of field.values) relations.push({ type: relationType, key: value.value, label: value.label });
      continue;
    }
    const key = keyOf(field);
    // language-tagged values are one multilingual value: every language, tagged
    if (field.values.some((value) => value.language)) {
      sample[key] = field.values
        .filter((value) => value.language)
        .map((value) => ({ value: value.label, lang: value.language! }))
        .sort((a, b) => a.lang.localeCompare(b.lang));
      continue;
    }
    const labels = field.values.map((value) => value.label);
    sample[key] = labels.length === 1 ? labels[0] : labels;
  }

  const prefixes: Record<string, string> = { elody: ELODY, sh: SH, shui: SHUI, dash: DASH, rdf: RDF, rdfs: RDFS, xsd: XSD, ui: ns };
  for (const match of shapes.matchAll(/@prefix\s+([\w-]*):\s*<([^>]+)>/g))
    if (!(match[1] in prefixes) && !Object.values(prefixes).includes(match[2])) prefixes[match[1]] = match[2];

  return {
    ttl: new TurtleWriter(out, prefixes).write(),
    notes,
    sample,
    relations,
    fields: usable.map((field) => ({
      key: keyOf(field),
      label: field.label,
      inForm: formFields.includes(field),
      inDetail: true,
      editor: field.editor?.widget,
      viewer: field.viewer?.widget,
    })),
  };
}
