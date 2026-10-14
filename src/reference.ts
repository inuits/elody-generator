/**
 * The reference: what a declaration may say, generated from the vocabulary
 * (`elody-ui.ttl`: every term with its meaning), the meta-shapes
 * (`elody-ui.shapes.ttl`: which terms each kind of node carries, with their
 * type and cardinality) and the bindings (how Elody implements each
 * enumeration value, editor and viewer). One Markdown page per area, a page
 * of enumerations, a page of retired terms and an index, for the docs site.
 * With a declarations directory it also says how many clients use each term.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { Parser, type Quad } from "n3";
import { join } from "path";
import { BINDINGS_PATH, META_SHAPES_PATH, VOCABULARY_PATH } from "./ontology.js";

const ELODY = "https://elody.eu/ns/ui#";
const META = "https://elody.eu/ns/ui/shapes#";
const SH = "http://www.w3.org/ns/shacl#";
const SHUI = "http://www.w3.org/ns/shacl-ui/";
const DASH = "http://datashapes.org/dash#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const OWL = "http://www.w3.org/2002/07/owl#";
const XSD = "http://www.w3.org/2001/XMLSchema#";
const DCTERMS = "http://purl.org/dc/terms/";

const PREFIXES: [string, string][] = [
  ["elody", ELODY],
  ["meta", META],
  ["sh", SH],
  ["shui", SHUI],
  ["dash", DASH],
  ["rdf", RDF],
  ["rdfs", RDFS],
  ["owl", OWL],
  ["xsd", XSD],
  ["dcterms", DCTERMS],
];

/** a prefixed name for an IRI, or the IRI in angle brackets */
export function curie(iri: string): string {
  for (const [prefix, ns] of PREFIXES) if (iri.startsWith(ns)) return `${prefix}:${iri.slice(ns.length)}`;
  return `<${iri}>`;
}

/** The standard terms the shapes use, which the vocabulary does not define. */
const STANDARD: Record<string, string> = {
  "sh:path": "The property's path: the metadata key as an IRI in the key namespace (`em:title`).",
  "sh:name": "The human name of the property, documentation for the reader.",
  "sh:order": "The position among its siblings; order never comes from the position in the file.",
  "sh:datatype": "The value's datatype; a standard SHACL datatype picks the input field (`xsd:string` a text field, `xsd:boolean` a checkbox, `xsd:date` a date field).",
  "sh:minCount": "The least number of values; `1` makes a field required.",
  "sh:maxCount": "The most values; `1` makes a single-valued field.",
  "sh:defaultValue": "The value a filter or field starts with.",
  "sh:in": "The allowed values, as a list; the input field becomes a dropdown over them.",
  "sh:group": "The property group (a form section or detail panel) the property belongs to.",
  "sh:class": "The class of the related entities; the field becomes a relation picker on it.",
  "sh:node": "The node shape the values conform to.",
  "sh:nodeKind": "Whether the value is an IRI, a blank node or a literal.",
  "sh:property": "The property shapes of this node.",
  "sh:languageIn": "The languages to read labels and values in, in order of preference.",
  "sh:singleLine": "Whether a text is edited on one line.",
  "sh:description": "A longer description, shown as help text.",
  "rdfs:label": "The label: an i18n key, exactly as in GraphQL.",
  "rdfs:comment": "A comment for the reader.",
  "dash:hidden": "The filter or field is not shown; a hidden filter still applies its default value.",
  "dash:readOnly": "The panel or field cannot be edited.",
  "shui:editor": "The SHACL-UI editor: which input field edits the value (`shui:DatePickerEditor`, `shui:EnumSelectEditor`, ...).",
  "shui:viewer": "The SHACL-UI viewer: how the value is shown (`elody:PillViewer`, `shui:HTMLViewer`, ...).",
  "shui:propertyRole": "The role of the property: `shui:LabelRole` marks the title of the entity.",
  "shui:labelPreference": "The properties to read a label from, in order.",
  "shui:defaultOrder": "The order of properties nothing orders.",
};

type Term = {
  iri: string;
  name: string;
  kind: "class" | "datatype" | "object" | "retired" | "instance" | "other";
  label?: string;
  comment?: string;
  domain: string[];
  range?: string;
  instanceOf?: string;
  replacedBy?: string;
  /** bindings: the implementation facts on an enumeration value, editor or viewer */
  bindings: { predicate: string; value: string }[];
};

type ShapeProperty = {
  path: string;
  minCount?: number;
  maxCount?: number;
  datatype?: string;
  cls?: string;
  node?: string;
  nodeKind?: string;
  oneOf?: string[];
  message?: string;
  /** sh:defaultValue on the entry: the constant that applies when the term is left out; elody:defaultRule: how a value is derived */
  defaultValue?: string;
  defaultRule?: string;
  /** the # comment above the entry in the shapes file */
  note?: string;
};

type Shape = {
  iri: string;
  name: string;
  targetClasses: string[];
  /** a guard shape (sh:targetSubjectsOf): it checks one term wherever it appears, it is no kind of node */
  guard: boolean;
  properties: ShapeProperty[];
  messages: string[];
  note?: string;
  /** where this shape is reached from: shape name and term */
  usedBy: { shape: string; term: string }[];
};

export type Reference = {
  terms: Map<string, Term>;
  shapes: Map<string, Shape>;
  /** per term curie, the number of client declarations that use it */
  usage: Map<string, number>;
  clients: number;
  version: string;
};

const parse = (path: string): Quad[] => new Parser().parse(readFileSync(path, "utf-8"));

const literal = (quads: Quad[], subject: string, predicate: string): string | undefined => quads.find((q) => q.subject.value === subject && q.predicate.value === predicate)?.object.value;
const objects = (quads: Quad[], subject: string, predicate: string): string[] => quads.filter((q) => q.subject.value === subject && q.predicate.value === predicate).map((q) => q.object.value);
const rdfList = (quads: Quad[], head: string): string[] => {
  const items: string[] = [];
  let at: string | undefined = head;
  while (at && at !== `${RDF}nil`) {
    const first = literal(quads, at, `${RDF}first`);
    if (first !== undefined) items.push(first);
    at = literal(quads, at, `${RDF}rest`);
  }
  return items;
};

/** The # comment lines right above each `[ sh:path X` entry and each `meta:X a sh:NodeShape` line in the shapes file. */
function shapeNotes(text: string): { properties: Map<string, string>; shapes: Map<string, string> } {
  const properties = new Map<string, string>();
  const shapes = new Map<string, string>();
  const lines = text.split("\n");
  let shape = "";
  let pending: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const head = /^meta:(\w+) a sh:NodeShape/.exec(line);
    if (head) {
      shape = head[1];
      if (pending.length && !/^-+/.test(pending[0])) shapes.set(shape, pending.join(" "));
      pending = [];
      continue;
    }
    if (line.startsWith("#")) {
      const comment = line.replace(/^#\s?/, "");
      if (/^-{3,}/.test(comment) || /-{3,}$/.test(comment)) pending = [];
      else pending.push(comment);
      continue;
    }
    const entry = /^\[ sh:path (\S+)/.exec(line);
    if (entry && shape) {
      if (pending.length) properties.set(`${shape}|${entry[1]}`, pending.join(" "));
      pending = [];
      continue;
    }
    if (line === "") pending = [];
  }
  return { properties, shapes };
}

/** Read the vocabulary, the meta-shapes and the bindings into the reference model. */
export function readReference(options: { declarations?: string } = {}): Reference {
  const vocab = parse(VOCABULARY_PATH);
  const shapesQuads = parse(META_SHAPES_PATH);
  const bindings = existsSync(BINDINGS_PATH) ? parse(BINDINGS_PATH) : [];
  const notes = shapeNotes(readFileSync(META_SHAPES_PATH, "utf-8"));
  const version = literal(vocab, ELODY.slice(0, -1), `${OWL}versionInfo`) ?? "";

  const terms = new Map<string, Term>();
  const subjects = [...new Set(vocab.filter((q) => q.subject.termType === "NamedNode" && q.subject.value.startsWith(ELODY)).map((q) => q.subject.value))];
  for (const iri of subjects) {
    const types = objects(vocab, iri, `${RDF}type`);
    const kind: Term["kind"] = types.includes(`${OWL}DeprecatedProperty`)
      ? "retired"
      : types.includes(`${OWL}Class`)
        ? "class"
        : types.includes(`${OWL}DatatypeProperty`)
          ? "datatype"
          : types.includes(`${OWL}ObjectProperty`)
            ? "object"
            : types.some((t) => t.startsWith(ELODY))
              ? "instance"
              : "other";
    terms.set(iri, {
      iri,
      name: curie(iri),
      kind,
      label: literal(vocab, iri, `${RDFS}label`),
      comment: literal(vocab, iri, `${RDFS}comment`),
      domain: objects(vocab, iri, `${RDFS}domain`),
      range: literal(vocab, iri, `${RDFS}range`),
      instanceOf: kind === "instance" ? types.find((t) => t.startsWith(ELODY)) : undefined,
      replacedBy: literal(vocab, iri, `${DCTERMS}isReplacedBy`),
      bindings: bindings
        .filter((q) => q.subject.value === iri && q.predicate.value.startsWith(ELODY))
        .map((q) => ({ predicate: curie(q.predicate.value), value: q.object.termType === "NamedNode" ? curie(q.object.value) : q.object.value })),
    });
  }

  const shapes = new Map<string, Shape>();
  const shapeIris = [...new Set(shapesQuads.filter((q) => q.predicate.value === `${RDF}type` && q.object.value === `${SH}NodeShape` && q.subject.termType === "NamedNode").map((q) => q.subject.value))];
  for (const iri of shapeIris) {
    const name = iri.slice(META.length);
    const properties = objects(shapesQuads, iri, `${SH}property`).map((node): ShapeProperty => {
      const path = literal(shapesQuads, node, `${SH}path`) ?? "";
      const min = literal(shapesQuads, node, `${SH}minCount`);
      const max = literal(shapesQuads, node, `${SH}maxCount`);
      const inList = literal(shapesQuads, node, `${SH}in`);
      return {
        path,
        minCount: min === undefined ? undefined : Number(min),
        maxCount: max === undefined ? undefined : Number(max),
        datatype: literal(shapesQuads, node, `${SH}datatype`),
        cls: literal(shapesQuads, node, `${SH}class`),
        node: literal(shapesQuads, node, `${SH}node`),
        nodeKind: literal(shapesQuads, node, `${SH}nodeKind`),
        oneOf: inList ? rdfList(shapesQuads, inList) : undefined,
        message: literal(shapesQuads, node, `${SH}message`),
        defaultValue: ((q) => (q ? (q.object.termType === "NamedNode" ? curie(q.object.value) : q.object.value) : undefined))(shapesQuads.find((q) => q.subject.value === node && q.predicate.value === `${SH}defaultValue`)),
        defaultRule: literal(shapesQuads, node, `${ELODY}defaultRule`),
        note: notes.properties.get(`${name}|${curie(path)}`),
      };
    });
    // the shape's own constraints (sh:or, sh:xone) with their messages
    const messages = objects(shapesQuads, iri, `${SH}message`);
    shapes.set(iri, { iri, name, targetClasses: objects(shapesQuads, iri, `${SH}targetClass`), guard: objects(shapesQuads, iri, `${SH}targetSubjectsOf`).length > 0, properties, messages, note: notes.shapes.get(name), usedBy: [] });
  }
  for (const shape of shapes.values())
    for (const property of shape.properties) if (property.node && shapes.has(property.node)) shapes.get(property.node)!.usedBy.push({ shape: shape.name, term: curie(property.path) });

  const usage = new Map<string, number>();
  let clients = 0;
  if (options.declarations && existsSync(options.declarations)) {
    for (const client of readdirSync(options.declarations).sort()) {
      const dir = join(options.declarations, client, "ui");
      if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
      clients += 1;
      const seen = new Set<string>();
      const walk = (at: string) => {
        for (const name of readdirSync(at)) {
          const path = join(at, name);
          if (statSync(path).isDirectory()) walk(path);
          else if (name.endsWith(".ui.ttl")) for (const match of readFileSync(path, "utf-8").matchAll(/\b(elody|sh|shui|dash|rdfs):([A-Za-z]\w*)\b/g)) seen.add(`${match[1]}:${match[2]}`);
        }
      };
      walk(dir);
      for (const term of seen) usage.set(term, (usage.get(term) ?? 0) + 1);
    }
  }
  return { terms, shapes, usage, clients, version };
}

// -- rendering -----------------------------------------------------------------

/** The pages: a title, a slug, a line for the index, and the shapes it starts from; nested shapes follow the first page that reaches them. */
const PAGES: { slug: string; title: string; summary: string; roots: string[] }[] = [
  { slug: "entity-ui", title: "The type: EntityUi", summary: "One node per GraphQL type: what it emits, its view modes, card and context menu, and what hangs off it.", roots: ["EntityUiShape", "ViewModeSelectionShape", "ConfigEntryShape", "ContextMenuShape", "ActionShape", "ThumbnailShape", "DetailCardShape"] },
  { slug: "properties", title: "Properties", summary: "The property shapes: one per value the type reads, shows and edits; where it is read, how it is shown, how it is validated.", roots: ["PropertyShapeShape", "InfoPanelShape", "HiddenValueFromShape", "CopyValueFromParentShape", "PropertyGroupShape"] },
  { slug: "detail-page", title: "The detail page", summary: "The layout: columns, their elements (windows, lists, media, maps, graphs, ...) and the panels inside a window.", roots: ["DetailLayoutShape", "ColumnShape", "ElementShape", "PanelShape", "PanelFieldShape", "WindowStatusShape", "ActionsOnResultShape", "ParentRelationShape", "MediaElementShape", "MapElementShape", "GraphElementShape", "HierarchyListElementShape", "ManifestViewerElementShape", "EntityViewerElementShape", "ActionElementShape", "WysiwygElementShape", "CommentsElementShape"] },
  { slug: "filters", title: "Filters", summary: "The advanced filters of a type: their kind, keys, defaults, option search and facets.", roots: ["FilterShape", "FilterOptionShape", "LookupShape", "ValueMappingShape", "FacetShape", "VisibleFilterLabelShape", "OptionsInputShape", "MetadataMatchShape"] },
  { slug: "bulk-operations", title: "Bulk operations", summary: "The operations offered on a listing or a list element, the context they show in and the modal they open.", roots: ["BulkOperationShape", "BulkOperationContextShape", "BulkOperationModalShape", "SurvivorSuggestionShape", "CustomBulkOperationsShape", "DeleteOptionsShape"] },
  { slug: "forms", title: "Forms", summary: "Create and edit forms: tabs, fields over a SHACL shape, uploads, actions and progress, and runtime form sources.", roots: ["FormShape", "FormTabShape", "FormFieldsShape", "FormFieldShape", "UploadShape", "UploadFieldShape", "FormActionShape", "EndpointShape", "ProgressShape", "ProgressStepShape", "FormSourceShape"] },
  { slug: "guided-flows", title: "Guided flows", summary: "Step-by-step flows (GetRepetitiveForm): steps with a picker or a form, what each step scopes to, and what finalizes the flow.", roots: ["GuidedFlowShape", "FlowStepShape", "StepScopeShape", "StepRelationShape", "RelationMetadataFieldShape", "CreatableTypeShape", "PickerSearchShape", "SortPageShape"] },
  { slug: "list-queries", title: "List queries, pickers and sort documents", summary: "The documents a list element or an entity picker reads: results per type, filters, and the sort options of a page.", roots: ["ListQueryShape", "PickerShape", "PickerResultShape", "SortDocumentShape", "SortOptionShape"] },
  { slug: "previews", title: "Previews", summary: "The preview of an entity in a list: its layout and columns.", roots: ["PreviewShape", "PreviewLayoutShape"] },
  { slug: "fragments", title: "Shared fragments", summary: "Fragments several types spread: fields, windows, elements, panels, filters and values, and keys copied from a parent.", roots: ["FieldsFragmentShape", "WindowFragmentShape", "ElementsFragmentShape", "PanelFragmentShape", "FiltersFragmentShape", "ValuesFragmentShape", "CopyFromParentShape", "CopyKeyShape"] },
  { slug: "app", title: "The app", summary: "The client's platform file: the platform documents it carries, their settings, the menu and the type entries.", roots: ["AppShape"] },
];
const OTHER = { slug: "other", title: "Other nodes", summary: "Kinds of node no area above reaches.", roots: [] as string[] };

const esc = (text: string): string => text.replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{\{/g, "{ {").replace(/\n/g, " ");
const code = (text: string): string => `\`${text.replace(/\|/g, "\\|")}\``;
const humanize = (name: string): string => name.replace(/Shape$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const slugOf = (heading: string): string => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Section = {
  key: string;
  title: string;
  page: string;
  anchor: string;
  shape?: Shape;
  /** the classes whose vocabulary terms the section lists (the shape's target classes, its twin class, or a class alone) */
  classes: string[];
};

/** The sections: one per kind of node (a shape, or a class with terms of its own and no shape), each on a page. */
function sections(reference: Reference): Section[] {
  const byName = new Map([...reference.shapes.values()].filter((s) => !s.guard).map((s) => [s.name, s]));
  const page = new Map<string, string>();
  // every page claims its own roots first, then the nested shapes nothing claimed, in page order
  for (const p of PAGES) for (const root of p.roots) if (byName.has(root) && !page.has(root)) page.set(root, p.slug);
  for (const p of PAGES) {
    const queue = [...p.roots];
    const visited = new Set<string>();
    while (queue.length) {
      const name = queue.shift()!;
      const shape = byName.get(name);
      if (!shape || visited.has(name)) continue;
      visited.add(name);
      if (!page.has(name)) page.set(name, p.slug);
      if (page.get(name) !== p.slug) continue;
      for (const property of shape.properties) if (property.node) queue.push(property.node.slice(META.length));
    }
  }
  for (const name of byName.keys()) if (!page.has(name)) page.set(name, OTHER.slug);
  const result: Section[] = [];
  const covered = new Set<string>();
  for (const shape of byName.values()) {
    const twin = `${ELODY}${shape.name.replace(/Shape$/, "")}`;
    const classes = [...shape.targetClasses, ...(reference.terms.get(twin)?.kind === "class" ? [twin] : [])];
    for (const cls of classes) covered.add(cls);
    const title = humanize(shape.name);
    result.push({ key: shape.name, title, page: page.get(shape.name)!, anchor: slugOf(title), shape, classes });
  }
  // a class with terms of its own and no shape: a section on the page of the shape that names it (rdf:type sh:in, sh:class), else "other"
  const domains = new Set([...reference.terms.values()].flatMap((t) => (t.kind === "datatype" || t.kind === "object" ? t.domain : [])));
  for (const cls of [...domains].sort()) {
    const term = reference.terms.get(cls);
    if (!term || term.kind !== "class" || covered.has(cls)) continue;
    // the shape that names the class: by rdf:type sh:in or sh:class, else by a property whose vocabulary range is the class
    const naming =
      [...byName.values()].find((s) => s.properties.some((p) => p.oneOf?.includes(cls) || p.cls === cls)) ??
      [...byName.values()].find((s) => s.properties.some((p) => reference.terms.get(p.path)?.range === cls)) ??
      [...byName.values()].find((s) => [...s.targetClasses, `${ELODY}${s.name.replace(/Shape$/, "")}`].some((c) => [...reference.terms.values()].some((t) => t.range === cls && t.domain.includes(c))));
    const title = humanize(cls.slice(ELODY.length));
    result.push({ key: cls, title, page: naming ? page.get(naming.name)! : OTHER.slug, anchor: slugOf(title), classes: [cls] });
    covered.add(cls);
  }
  // sections in page order, the page's roots first, then the rest in the order they were reached
  const order = new Map([...PAGES, OTHER].flatMap((p, i) => p.roots.map((r, j) => [r, i * 1000 + j] as [string, number])));
  const pageIndex = new Map([...PAGES, OTHER].map((p, i) => [p.slug, i]));
  return result.sort((a, b) => pageIndex.get(a.page)! - pageIndex.get(b.page)! || (order.get(a.key) ?? 999999) - (order.get(b.key) ?? 999999));
}

const link = (section: Section | undefined, fromPage: string, text?: string): string => (section ? `[${text ?? section.title}](${section.page === fromPage ? "" : `./${section.page}.md`}#${section.anchor})` : (text ?? "?"));

function typeOfRange(range: string | undefined, reference: Reference, byClass: Map<string, Section>, fromPage: string): string {
  if (!range) return "";
  if (range === `${RDF}List`) return "a list";
  if (range.startsWith(XSD)) return code(curie(range));
  const term = reference.terms.get(range);
  if (term?.kind === "class" && [...reference.terms.values()].some((t) => t.instanceOf === range)) return `an [${curie(range)}](./enumerations.md#${slugOf(curie(range))}) value`;
  if (term?.kind === "class") return `a ${link(byClass.get(range), fromPage, humanize(range.slice(ELODY.length)))} node`;
  return code(curie(range));
}

function typeOfProperty(property: ShapeProperty, reference: Reference, byShape: Map<string, Section>, byClass: Map<string, Section>, fromPage: string): string {
  if (property.maxCount === 0) return "retired";
  if (property.oneOf) return `one of ${property.oneOf.map((v) => (v.startsWith("http") ? (byClass.get(v) ? link(byClass.get(v), fromPage, code(curie(v))) : code(curie(v))) : code(JSON.stringify(v)))).join(", ")}`;
  if (property.node) return `a ${link(byShape.get(property.node.slice(META.length)), fromPage)} node`;
  if (property.cls) {
    const name = curie(property.cls);
    if ([...reference.terms.values()].some((t) => t.instanceOf === property.cls)) return `an [${name}](./enumerations.md#${slugOf(name)}) value`;
    return `a reference to a ${link(byClass.get(property.cls), fromPage, humanize(property.cls.slice(ELODY.length)))} node`;
  }
  if (property.datatype) return code(curie(property.datatype));
  if (property.nodeKind) return property.nodeKind.endsWith("IRI") ? "a reference by name" : "a node";
  return typeOfRange(reference.terms.get(property.path)?.range, reference, byClass, fromPage);
}

function cardinality(property: ShapeProperty): string {
  if (property.maxCount === 0) return "—";
  const required = (property.minCount ?? 0) >= 1;
  const single = property.maxCount === 1;
  if (required && single) return "exactly one";
  if (required) return "one or more";
  if (single) return "at most one";
  return "any number";
}

function meaning(property: ShapeProperty, reference: Reference): string {
  const name = curie(property.path);
  if (property.maxCount === 0) return esc(property.message ?? `${name} is retired`);
  const term = reference.terms.get(property.path);
  const parts: string[] = [];
  if (term?.comment) parts.push(esc(term.comment));
  else if (STANDARD[name]) parts.push(STANDARD[name]);
  if (property.note) parts.push(`*${esc(property.note)}*`);
  if (!parts.length && property.message) parts.push(esc(property.message));
  return parts.join(" ");
}

function renderSection(section: Section, reference: Reference, byShape: Map<string, Section>, byClass: Map<string, Section>): string[] {
  const out: string[] = [`### ${section.title}`, ""];
  const descriptions: string[] = [];
  for (const cls of section.classes) {
    const term = reference.terms.get(cls);
    descriptions.push(term?.comment ? `${code(curie(cls))}: ${esc(term.comment)}` : `Nodes of type ${code(curie(cls))}.`);
  }
  if (!descriptions.length && section.shape?.note) descriptions.push(esc(section.shape.note));
  if (descriptions.length) out.push(...descriptions, "");
  if (section.shape?.usedBy.length) {
    const refs = [...new Map(section.shape.usedBy.map((u) => [`${u.shape}|${u.term}`, u])).values()].map((u) => `${code(u.term)} of ${link(byShape.get(u.shape), section.page, humanize(u.shape))}`);
    out.push(`Declared under ${refs.join(", ")}.`, "");
  }
  if (section.shape?.messages.length) out.push(...section.shape.messages.map((m) => `::: info Constraint\n${esc(m)}\n:::`), "");
  const usage = reference.clients > 0;
  // a Default column when a term of the section has a default (sh:defaultValue) or a rule (elody:defaultRule)
  const defaults = (section.shape?.properties ?? []).some((p) => p.defaultValue !== undefined || p.defaultRule);
  out.push(`| Term | Type | How many |${defaults ? " Default |" : ""} Meaning |${usage ? " Used by |" : ""}`, `|---|---|---|${defaults ? "---|" : ""}---|${usage ? "---|" : ""}`);
  const used = (name: string) => (usage ? ` ${reference.usage.get(name) ? `${reference.usage.get(name)} of ${reference.clients}` : "—"} |` : "");
  const dflt = (property?: ShapeProperty) => (defaults ? ` ${property?.defaultValue !== undefined ? code(property.defaultValue) : property?.defaultRule ? esc(property.defaultRule) : ""} |` : "");
  const listed = new Set<string>();
  for (const property of section.shape?.properties ?? []) {
    const name = curie(property.path);
    listed.add(property.path);
    out.push(`| ${code(name)} | ${typeOfProperty(property, reference, byShape, byClass, section.page)} | ${cardinality(property)} |${dflt(property)} ${meaning(property, reference)} |${used(name)}`);
  }
  // the vocabulary's terms on these classes the shape does not constrain: listed too, unchecked
  const vocabOnly = [...reference.terms.values()].filter((t) => (t.kind === "datatype" || t.kind === "object") && !listed.has(t.iri) && t.domain.some((d) => section.classes.includes(d))).sort((a, b) => a.name.localeCompare(b.name));
  for (const term of vocabOnly) out.push(`| ${code(term.name)} | ${typeOfRange(term.range, reference, byClass, section.page)} | unchecked |${dflt()} ${esc(term.comment ?? "")} |${used(term.name)}`);
  out.push("");
  return out;
}

// the pages are wide tables: no outline aside, a page class the docs theme styles
const frontMatter = (title: string) => ["---", `title: ${JSON.stringify(title)}`, "aside: false", "pageClass: reference", "---", ""];

/** Render the reference as Markdown pages: file → content, plus `sidebar.json` items. */
export function renderReference(reference: Reference, options: { basePath?: string } = {}): Map<string, string> {
  const base = options.basePath ?? "";
  const all = sections(reference);
  const byShape = new Map(all.filter((s) => s.shape).map((s) => [s.shape!.name, s]));
  const byClass = new Map(all.flatMap((s) => s.classes.map((c) => [c, s] as [string, Section])));
  const pages = new Map<string, string>();
  const intro = ["::: info Generated", `Generated by \`elody-ui reference\` from the Elody UI vocabulary ${reference.version} (\`elody-ui.ttl\`), its meta-shapes (\`elody-ui.shapes.ttl\`) and the generator's bindings. Edit the ontology, not this page.`, ":::", ""];
  const pageList = [...PAGES, OTHER];
  for (const page of pageList) {
    const own = all.filter((s) => s.page === page.slug);
    if (!own.length) continue;
    const lines = [...frontMatter(page.title), `# ${page.title}`, "", ...intro, page.summary, "", `Each section is one kind of node: the terms it may carry, the type of each value, how many values it takes and what it means. "unchecked" marks a term the vocabulary defines on this kind of node that the meta-shapes do not constrain yet.${reference.clients ? ' "Used by" counts the client declarations that use the term.' : ""}`, ""];
    for (const section of own) lines.push(...renderSection(section, reference, byShape, byClass));
    pages.set(`${page.slug}.md`, lines.join("\n"));
  }

  // enumerations: every class with values, its values and their bindings
  const enumLines = [...frontMatter("Enumerations"), "# Enumerations", "", ...intro, "A declaration names a value by its term (`elody:mode elody:ListView`), never by the string the GraphQL schema uses; the binding says what Elody renders it as.", ""];
  const classes = [...reference.terms.values()].filter((t) => t.kind === "class" && [...reference.terms.values()].some((i) => i.instanceOf === t.iri));
  for (const cls of classes.sort((a, b) => a.name.localeCompare(b.name))) {
    const values = [...reference.terms.values()].filter((i) => i.instanceOf === cls.iri);
    enumLines.push(`### ${cls.name}`, "");
    if (cls.comment) enumLines.push(esc(cls.comment), "");
    const bindingKeys = [...new Set(values.flatMap((v) => v.bindings.map((b) => b.predicate)))];
    enumLines.push(`| Value | Label | Meaning |${bindingKeys.map((k) => ` ${k} |`).join("")}`, `|---|---|---|${bindingKeys.map(() => "---|").join("")}`);
    for (const value of values) enumLines.push(`| ${code(value.name)} | ${esc(value.label ?? "")} | ${esc(value.comment ?? "")} |${bindingKeys.map((k) => ` ${value.bindings.filter((b) => b.predicate === k).map((b) => code(b.value)).join(", ")} |`).join("")}`);
    enumLines.push("");
  }
  pages.set("enumerations.md", enumLines.join("\n"));

  // retired terms
  const retired = [...reference.terms.values()].filter((t) => t.kind === "retired").sort((a, b) => a.name.localeCompare(b.name));
  pages.set("retired.md", [...frontMatter("Retired terms"), "# Retired terms", "", ...intro, "A retired term fails validation; its replacement is named. The generator's `migrate` command rewrites a declaration that uses one.", "", "| Term | Replaced by | Why |", "|---|---|---|", ...retired.map((t) => `| ${code(t.name)} | ${t.replacedBy ? code(curie(t.replacedBy)) : "—"} | ${esc(t.comment ?? "")} |`), ""].join("\n"));

  // the index: the pages, the counts, the terms on every node, and the terms no section lists
  const listedTerms = new Set<string>();
  for (const section of all) {
    for (const p of section.shape?.properties ?? []) listedTerms.add(p.path);
    for (const t of reference.terms.values()) if ((t.kind === "datatype" || t.kind === "object") && t.domain.some((d) => section.classes.includes(d))) listedTerms.add(t.iri);
  }
  const common = [...reference.terms.values()].filter((t) => (t.kind === "datatype" || t.kind === "object") && t.domain.includes(`${OWL}Thing`)).sort((a, b) => a.name.localeCompare(b.name));
  for (const t of common) listedTerms.add(t.iri);
  const unlisted = [...reference.terms.values()].filter((t) => (t.kind === "datatype" || t.kind === "object") && !listedTerms.has(t.iri)).sort((a, b) => a.name.localeCompare(b.name));
  const count = (kind: Term["kind"]) => [...reference.terms.values()].filter((t) => t.kind === kind).length;
  const index = [...frontMatter("Reference"), "# Reference", "", ...intro, `The Elody UI vocabulary ${reference.version}: ${count("datatype") + count("object")} properties and ${count("class")} classes, ${count("instance")} enumeration values, ${count("retired")} retired terms, checked by ${[...reference.shapes.values()].filter((s) => !s.guard).length} meta-shapes. The pages follow the shapes: each kind of node, with the terms it carries.`, "", "| Page | What it covers |", "|---|---|", ...pageList.filter((p) => pages.has(`${p.slug}.md`)).map((p) => `| [${p.title}](${base}${p.slug}) | ${p.summary} |`), `| [Enumerations](${base}enumerations) | Every class with values: view modes, filter kinds, editors and viewers, ... with Elody's binding for each. |`, `| [Retired terms](${base}retired) | Terms a declaration may no longer use, and their replacements. |`, ""];
  if (common.length) index.push("## Terms on any node", "", "| Term | Type | Meaning |", "|---|---|---|", ...common.map((t) => `| ${code(t.name)} | ${typeOfRange(t.range, reference, byClass, "index")} | ${esc(t.comment ?? "")} |`), "");
  if (unlisted.length) index.push("## Terms no section lists", "", "Defined in the vocabulary on a class no section covers: a gap in the meta-shapes, or a candidate for retirement.", "", "| Term | Domain | Meaning |", "|---|---|---|", ...unlisted.map((t) => `| ${code(t.name)} | ${t.domain.map((d) => code(curie(d))).join(", ") || "—"} | ${esc(t.comment ?? "")} |`), "");
  pages.set("index.md", index.join("\n"));

  const sidebar = [{ text: "Overview", link: `${base}` }, ...pageList.filter((p) => pages.has(`${p.slug}.md`)).map((p) => ({ text: p.title, link: `${base}${p.slug}` })), { text: "Enumerations", link: `${base}enumerations` }, { text: "Retired terms", link: `${base}retired` }];
  pages.set("sidebar.json", JSON.stringify(sidebar, null, 2) + "\n");
  return pages;
}
