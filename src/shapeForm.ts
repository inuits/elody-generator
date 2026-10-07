/**
 * A plain SHACL (1.2 UI) shapes graph → the form Elody would render, following
 * the spec's normative rules: widget scoring, label and language resolution,
 * ordering with groups and shui:defaultOrder, property roles, nested shapes,
 * and the ValueTableViewer's columns. Every place Elody cannot render what the
 * shape asks is recorded as a gap on the field.
 */
import { DataFactory, Parser, type Quad, type Term } from "n3";
import { Ontology, defaultOntology } from "./ontology.js";
import { Scorer, type WidgetResult } from "./score.js";

const { namedNode } = DataFactory;
const SH = "http://www.w3.org/ns/shacl#";
const SHUI = "http://www.w3.org/ns/shacl-ui/";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const RDF_TYPE = `${RDF}type`;

/**
 * partial / unsupported: a SHACL UI feature Elody covers in part or not;
 * notApplicable: a setting for applications that write RDF themselves;
 * handled: a third-party widget Elody does not know, left to the scoring as the spec intends.
 */
export type Gap = { level: "partial" | "unsupported" | "notApplicable" | "handled"; message: string };
export type SpecValue = { value: string; label: string; language?: string };
export type SpecPath = { kind: "predicate" | "inverse" | "alternative" | "complex"; iris: string[] };

export type SpecField = {
  shape: string;
  path: SpecPath;
  label: string;
  labelSource: "sh:name" | "label preference" | "predicate label" | "local name" | "path";
  order: number | null;
  group?: { iri: string; label: string; order: number | null };
  required: boolean;
  multiple: boolean;
  editor?: WidgetResult;
  /** true when no widget scored and Elody's default (a text field) is used, as the spec leaves to the renderer */
  editorFallback: boolean;
  viewer?: WidgetResult;
  /** what Elody renders: its field type, formatter, and the multilingual wrapper for language-tagged text */
  elody: { inputFieldType?: string; formatter?: string; multilingual?: boolean; panelElement?: "wysiwyg" | "list" };
  searchQuery: boolean;
  values: SpecValue[];
  nested?: SpecField[];
  columns?: SpecField[];
  gaps: Gap[];
};

export type SpecForm = {
  nodeShape?: string;
  fields: SpecField[];
  labelProperties: string[];
  configuration: { languagePreference: string[]; labelPreference: string[]; defaultOrder: number | null; other: string[] };
  gaps: Gap[];
};

export type ShapeToFormOptions = {
  shapes: string;
  /** already parsed shapes (blank-node ids must match the caller's) */
  shapeQuads?: Quad[];
  data?: string;
  focus?: string;
  nodeShape?: string;
  /** application language preference (after sh:languageIn and shui:languagePreference) */
  languages?: string[];
  ontology?: Ontology;
};

class Graph {
  readonly bySubject = new Map<string, Quad[]>();
  constructor(readonly quads: Quad[]) {
    for (const q of quads) (this.bySubject.get(q.subject.value) ?? this.bySubject.set(q.subject.value, []).get(q.subject.value)!).push(q);
  }
  objects(s: string, p: string): Term[] {
    return (this.bySubject.get(s) ?? []).filter((q) => q.predicate.value === p).map((q) => q.object);
  }
  object(s: string, p: string): Term | undefined {
    return this.objects(s, p)[0];
  }
  subjects(p: string, o?: string): Term[] {
    const out = new Map<string, Term>();
    for (const q of this.quads) if (q.predicate.value === p && (o === undefined || q.object.value === o)) out.set(q.subject.value, q.subject);
    return [...out.values()];
  }
  list(head: Term | undefined): Term[] {
    const out: Term[] = [];
    let cursor = head;
    while (cursor && cursor.value !== `${RDF}nil`) {
      const first = this.object(cursor.value, `${RDF}first`);
      if (!first) break;
      out.push(first);
      cursor = this.object(cursor.value, `${RDF}rest`);
    }
    return out;
  }
}

const localName = (iri: string) => iri.slice(Math.max(iri.lastIndexOf("#"), iri.lastIndexOf("/")) + 1);
const short = (iri: string) => iri.replace(SHUI, "shui:").replace(SH, "sh:");

export async function shapeToForm(options: ShapeToFormOptions): Promise<SpecForm> {
  const shapeQuads = options.shapeQuads ?? new Parser().parse(options.shapes);
  const dataQuads = options.data ? new Parser().parse(options.data) : [];
  const shapes = new Graph(shapeQuads);
  const data = new Graph(dataQuads);
  const ontology = options.ontology ?? defaultOntology();
  const scorer = await Scorer.create({ shapes: shapeQuads, data: dataQuads });

  // -- global configuration --------------------------------------------------------
  const config = shapes.subjects(RDF_TYPE, `${SHUI}Configuration`)[0];
  const languagePreference = config ? shapes.list(shapes.object(config.value, `${SHUI}languagePreference`)).map((t) => t.value) : [];
  const labelPreference = config ? shapes.list(shapes.object(config.value, `${SHUI}labelPreference`)).map((t) => t.value) : [];
  const defaultOrderTerm = config ? shapes.object(config.value, `${SHUI}defaultOrder`) : undefined;
  const defaultOrder = defaultOrderTerm ? Number(defaultOrderTerm.value) : null;
  const other = config
    ? ["timeZone", "defaultNamespace", "readOnlyGraph"].filter((name) => shapes.object(config.value, `${SHUI}${name}`))
    : [];
  const formGaps: Gap[] = other.map((name) => ({
    level: "notApplicable",
    message: `shui:${name} has no Elody counterpart (Elody stores documents, not triples) and is ignored`,
  }));

  // -- language and label resolution -------------------------------------------------
  const pick = (literals: Term[], languageIn: string[]): Term | undefined => {
    const prefs = [...languageIn, ...languagePreference, ...(options.languages ?? [])];
    const lang = (t: Term) => ((t as Term & { language?: string }).language ?? "").toLowerCase();
    for (const pref of prefs) {
      const p = pref.toLowerCase();
      const hit = literals.find((t) => (p === "" ? lang(t) === "" : lang(t) === p || lang(t).startsWith(`${p}-`)));
      if (hit) return hit;
    }
    return literals.find((t) => lang(t) === "") ?? literals[0];
  };
  const languageInOf = (shape: string) => shapes.list(shapes.object(shape, `${SH}languageIn`)).map((t) => t.value);

  const labelRoleShapes = (): { path: string; order: number; qualified: boolean }[] => {
    const out: { path: string; order: number; qualified: boolean }[] = [];
    for (const q of shapes.quads) {
      if (q.predicate.value !== `${SHUI}propertyRole`) continue;
      const path = shapes.object(q.subject.value, `${SH}path`);
      if (!path || path.termType !== "NamedNode") continue;
      if (q.object.value === `${SHUI}LabelRole`) out.push({ path: path.value, order: Number.MAX_SAFE_INTEGER, qualified: false });
      else if (shapes.object(q.object.value, `${SHUI}propertyRole`)?.value === `${SHUI}LabelRole`)
        out.push({ path: path.value, order: Number(shapes.object(q.object.value, `${SH}order`)?.value ?? Number.MAX_SAFE_INTEGER), qualified: true });
    }
    return out.sort((a, b) => Number(b.qualified) - Number(a.qualified) || a.order - b.order);
  };
  const labelRoles = labelRoleShapes();

  const valueLabel = (value: Term, languageIn: string[]): SpecValue => {
    if (value.termType === "Literal")
      return { value: value.value, label: value.value, language: (value as Term & { language?: string }).language || undefined };
    for (const role of labelRoles) {
      const hit = pick(data.objects(value.value, role.path), languageIn);
      if (hit) return { value: value.value, label: hit.value };
    }
    for (const predicate of labelPreference.length ? labelPreference : [RDFS_LABEL]) {
      const hit = pick(data.objects(value.value, predicate), languageIn) ?? pick(shapes.objects(value.value, predicate), languageIn);
      if (hit) return { value: value.value, label: hit.value };
    }
    return { value: value.value, label: value.termType === "NamedNode" ? localName(value.value) : "" };
  };

  // -- paths -----------------------------------------------------------------------
  const pathOf = (shape: string): SpecPath => {
    const p = shapes.object(shape, `${SH}path`);
    if (!p) return { kind: "complex", iris: [] };
    if (p.termType === "NamedNode") return { kind: "predicate", iris: [p.value] };
    const inverse = shapes.object(p.value, `${SH}inversePath`);
    if (inverse?.termType === "NamedNode") return { kind: "inverse", iris: [inverse.value] };
    const alternative = shapes.object(p.value, `${SH}alternativePath`);
    if (alternative) return { kind: "alternative", iris: shapes.list(alternative).map((t) => t.value) };
    return { kind: "complex", iris: [] };
  };
  const valuesAt = (focus: string | undefined, path: SpecPath): Term[] => {
    if (!focus) return [];
    if (path.kind === "predicate" || path.kind === "alternative") return path.iris.flatMap((iri) => data.objects(focus, iri));
    if (path.kind === "inverse") return data.subjects(path.iris[0], focus);
    return [];
  };

  // -- one field -------------------------------------------------------------------
  const field = async (shape: string, focus: string | undefined, depth: number): Promise<SpecField> => {
    const path = pathOf(shape);
    const languageIn = languageInOf(shape);
    const gaps: Gap[] = [];

    let label: string;
    let labelSource: SpecField["labelSource"];
    const nameProps = labelPreference.length ? labelPreference : [`${SH}name`];
    const named = nameProps.map((p) => pick(shapes.objects(shape, p), languageIn)).find(Boolean);
    if (named) {
      label = named.value;
      labelSource = labelPreference.length ? "label preference" : "sh:name";
    } else if (path.kind === "predicate" || path.kind === "inverse") {
      const predicateLabel =
        nameProps.map((p) => pick(data.objects(path.iris[0], p), languageIn)).find(Boolean) ??
        nameProps.map((p) => pick(shapes.objects(path.iris[0], p), languageIn)).find(Boolean);
      label = predicateLabel?.value ?? localName(path.iris[0]);
      labelSource = predicateLabel ? "predicate label" : "local name";
    } else {
      label = path.iris.map(localName).join(" | ") || "(path)";
      labelSource = "path";
    }

    const orderTerm = shapes.object(shape, `${SH}order`);
    const groupTerm = shapes.object(shape, `${SH}group`);
    const minCount = Number(shapes.object(shape, `${SH}minCount`)?.value ?? 0);
    const maxCountTerm = shapes.object(shape, `${SH}maxCount`);
    const values = valuesAt(focus, path);
    const firstValue = values[0];

    let editor = (await scorer.editors(namedOrBlank(shape), firstValue))[0];
    const editorFallback = !editor;
    if (!editor) editor = { widget: `${SHUI}TextFieldEditor`, score: 0, scoreNode: "" };
    const viewer = (await scorer.viewers(namedOrBlank(shape), firstValue))[0];

    const elody: SpecField["elody"] = {};
    elody.inputFieldType = ontology.inputFieldType(editor.widget);
    if (/WithLangEditor$/.test(editor.widget)) elody.multilingual = true;
    // a widget Elody implements as an element in the detail panel (rich text, a list of related entities)
    const panelElement = ontology.panelElement(editor.widget) ?? (viewer ? ontology.panelElement(viewer.widget) : undefined);
    if (panelElement) elody.panelElement = panelElement;
    if (elody.inputFieldType === undefined && !ontology.panelElement(editor.widget))
      gaps.push({ level: editor.widget.startsWith(SHUI) ? "unsupported" : "handled", message: `Elody has no widget for ${short(editor.widget)}` });
    if (viewer) {
      const formatter = ontology.formatterValue(viewer.widget);
      if (formatter !== undefined) elody.formatter = formatter || undefined;
      else if (ontology.panelElement(viewer.widget)) {
        // an element in the detail panel, see elody:panelElement
      }
      else if ([`${SHUI}LabelViewer`, `${SHUI}IRIViewer`].includes(viewer.widget))
        gaps.push({ level: "partial", message: `${short(viewer.widget)}: Elody shows a linked resource as a relation to an Elody entity, not as an arbitrary IRI` });
      else gaps.push({ level: viewer.widget.startsWith(SHUI) ? "unsupported" : "handled", message: `Elody has no viewer for ${short(viewer.widget)}` });
    }

    // an inverse path is the mirrored Elody relation (is<X>For), stored on this entity by collection-api
    if (path.kind === "alternative" || path.kind === "complex")
      gaps.push({ level: "unsupported", message: `${path.kind} path: an Elody field reads and writes one metadata key` });
    const searchQueries = shapes.objects(shape, `${SHUI}searchQuery`);
    const searchQuery = searchQueries.length > 0;
    if (searchQuery) {
      // an extension a renderer MAY evaluate: over a class, Elody's live search of that type serves its purpose
      const external = searchQueries.some((q) => /\bSERVICE\b/i.test(q.value));
      const hasClass = shapes.objects(shape, `${SH}class`).length > 0;
      if (external) gaps.push({ level: "unsupported", message: "shui:searchQuery searches an external SPARQL endpoint (SERVICE); Elody does not query it" });
      else if (hasClass) gaps.push({ level: "handled", message: "shui:searchQuery: Elody searches its own index of the class live, as the query intends" });
      else gaps.push({ level: "unsupported", message: "shui:searchQuery without sh:class: Elody has no type to search" });
    }

    // nested shapes: DetailsEditor and the ValueTableViewer's columns
    const nodeShape = shapes.object(shape, `${SH}node`)?.value ?? classShape(shapes.object(shape, `${SH}class`)?.value);
    let nested: SpecField[] | undefined;
    let columns: SpecField[] | undefined;
    if (nodeShape && depth < 5) {
      const children = await fieldsOf(nodeShape, editor?.widget === `${SHUI}DetailsEditor` ? firstValue?.value : undefined, depth + 1);
      if (editor?.widget === `${SHUI}DetailsEditor` || shapes.object(shape, `${SH}node`)) nested = children;
      if (viewer?.widget === `${SHUI}ValueTableViewer`) columns = children;
    }
    if (nested && nested.length && elody.inputFieldType === undefined && editor?.widget !== `${SHUI}DetailsEditor`) {
      // an explicit nested shape but another editor won: Elody still nests it
      elody.inputFieldType = ontology.inputFieldType(`${SHUI}DetailsEditor`);
    }

    return {
      shape,
      path,
      label,
      labelSource,
      order: orderTerm ? Number(orderTerm.value) : defaultOrder,
      group: groupTerm
        ? {
            iri: groupTerm.value,
            label: pick(shapes.objects(groupTerm.value, RDFS_LABEL), [])?.value ?? localName(groupTerm.value),
            order: shapes.object(groupTerm.value, `${SH}order`) ? Number(shapes.object(groupTerm.value, `${SH}order`)!.value) : defaultOrder,
          }
        : undefined,
      required: minCount >= 1,
      multiple: !maxCountTerm || Number(maxCountTerm.value) > 1,
      editor,
      editorFallback,
      viewer,
      elody,
      searchQuery,
      values: values.map((v) => valueLabel(v, languageIn)).sort((a, b) => languageRank(a.language, languageIn) - languageRank(b.language, languageIn)),
      nested,
      columns,
      gaps,
    };
  };

  const languageRank = (language: string | undefined, languageIn: string[]) => {
    const prefs = [...languageIn, ...languagePreference, ...(options.languages ?? [])];
    const i = prefs.findIndex((p) => (language ?? "") === p || (language ?? "").startsWith(`${p}-`));
    return i === -1 ? prefs.length : i;
  };

  const namedOrBlank = (id: string): Term =>
    (shapeQuads.find((q) => q.subject.value === id)?.subject as Term) ?? namedNode(id);

  const classShape = (cls: string | undefined) =>
    cls ? shapes.subjects(`${SH}targetClass`, cls)[0]?.value : undefined;

  // -- ordering (spec §Grouping, Ordering, and Layout Hints) ----------------------------
  const compare = (a: { order: number | null; label: string; id: string }, b: { order: number | null; label: string; id: string }) => {
    if (a.order !== null && b.order === null) return -1;
    if (a.order === null && b.order !== null) return 1;
    if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  };

  const order = (fields: SpecField[]): SpecField[] => {
    const groups = new Map<string, SpecField[]>();
    const items: { order: number | null; label: string; id: string; fields: SpecField[] }[] = [];
    for (const f of fields) {
      if (!f.group) items.push({ order: f.order, label: f.label, id: f.shape, fields: [f] });
      else (groups.get(f.group.iri) ?? groups.set(f.group.iri, []).get(f.group.iri)!).push(f);
    }
    for (const [iri, members] of groups)
      items.push({
        order: members[0].group!.order,
        label: members[0].group!.label,
        id: iri,
        fields: members.sort((a, b) => compare({ order: a.order, label: a.label, id: a.shape }, { order: b.order, label: b.label, id: b.shape })),
      });
    return items.sort(compare).flatMap((item) => item.fields);
  };

  const fieldsOf = async (node: string, focus: string | undefined, depth: number): Promise<SpecField[]> => {
    const props = shapes.objects(node, `${SH}property`).map((t) => t.value);
    const out: SpecField[] = [];
    for (const p of props) out.push(await field(p, focus, depth));
    return order(out);
  };

  // -- which shape renders -----------------------------------------------------------
  let nodeShape = options.nodeShape;
  if (!nodeShape && options.focus) {
    const types = data.objects(options.focus, RDF_TYPE).map((t) => t.value);
    nodeShape = types.map((t) => shapes.subjects(`${SH}targetClass`, t)[0]?.value).find(Boolean);
  }
  if (!nodeShape) {
    const nested = new Set(shapes.quads.filter((q) => q.predicate.value === `${SH}node`).map((q) => q.object.value));
    const candidates = shapes.subjects(`${SH}property`).map((t) => t.value).filter((s) => !nested.has(s) && !shapes.object(s, `${SH}path`));
    nodeShape = candidates.sort()[0];
  }

  let fields: SpecField[];
  if (nodeShape) fields = await fieldsOf(nodeShape, options.focus, 0);
  else {
    // standalone property shapes (the spec's widget snippets)
    const referenced = new Set(shapes.quads.filter((q) => q.predicate.value === `${SH}property`).map((q) => q.object.value));
    const standalone = shapes.subjects(`${SH}path`).map((t) => t.value).filter((s) => !referenced.has(s));
    const out: SpecField[] = [];
    for (const s of standalone) out.push(await field(s, options.focus, 0));
    fields = order(out);
  }

  return {
    nodeShape,
    fields,
    labelProperties: labelRoles.map((role) => role.path),
    configuration: { languagePreference, labelPreference, defaultOrder, other },
    gaps: formGaps,
  };
}
