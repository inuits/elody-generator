/**
 * Retired dialect -> 0.1 vocabulary, mechanically, on the triples:
 * strings become ontology instances, name references become node references
 * (forms, pickers, custom bulk operation sets and form sources get IRIs in the
 * declaration's own namespace, keeping their query names), elody:hidden & co
 * become their sh:/shui:/dash: replacements, create-form fields become
 * property shapes under elody:shape. The result is written with the package's
 * Turtle writer (comments are not preserved) and is meant as the starting
 * point of a hand-tidied declaration.
 */
import { DataFactory, type NamedNode, type Quad, type Term } from "n3";
import { Ontology, defaultOntology } from "./ontology.js";
import { Reading } from "./reading.js";
import { TurtleWriter } from "./turtle.js";
import { DASH, SH, SHUI, XSD, compact, dash, elody, localName, rdf, sh, shui } from "./vocab.js";

const { namedNode, literal, quad: makeQuad } = DataFactory;

export type MigrationResult = { ttl: string; notes: string[] };

type Named = NamedNode;

export function migrateDeclaration(ttl: string, ontology: Ontology = defaultOntology()): MigrationResult {
  const reading = Reading.parse(ttl);
  const migration = new Migration(reading, ontology);
  const quads = migration.run();
  const prefixes = migration.prefixes();
  // keep the source's own prefixes (domain ontologies), never its legacy UI ones
  for (const match of ttl.matchAll(/@prefix\s+([\w-]*):\s*<([^>]+)>/g)) {
    const [, prefix, iri] = match;
    if (prefix in prefixes || Object.values(prefixes).includes(iri)) continue;
    if (iri === "https://elody.io/ns/ui#" || iri === "http://www.w3.org/ns/shacl-ui#") continue;
    prefixes[prefix] = iri;
  }
  return { ttl: new TurtleWriter(quads, prefixes).write(), notes: migration.notes };
}

class Migration {
  readonly notes: string[] = [];
  private out: Quad[] = [];
  private ns: string;
  private formNames = new Set<string>();
  private pickerNames = new Map<string, string>();
  private customOpsNames = new Set<string>();
  private formSourceNames = new Set<string>();
  private flowNames = new Set<string>();
  private pathByName = new Map<string, Map<string, string>>();

  constructor(
    private readonly r: Reading,
    private readonly o: Ontology,
  ) {
    const first = r.subjectsOfType(elody("EntityUi"))[0] ?? "";
    const cut = Math.max(first.lastIndexOf("#"), first.lastIndexOf("/"));
    this.ns = cut === -1 ? "urn:elody:ui#" : first.slice(0, cut + 1);
  }

  prefixes(): Record<string, string> {
    return { elody: elody(""), sh: SH, shui: SHUI, dash: DASH, rdfs: "http://www.w3.org/2000/01/rdf-schema#", xsd: XSD, ui: this.ns };
  }

  private note(message: string) {
    if (!this.notes.includes(message)) this.notes.push(message);
  }

  private mint(name: string): Named {
    return namedNode(`${this.ns}${name}`);
  }

  private add(subject: Term, predicate: string, object: Term) {
    this.out.push(makeQuad(subject as never, namedNode(predicate), object as never));
  }

  private bool = (value: boolean) => literal(value ? "true" : "false", namedNode(`${XSD}boolean`));
  private int = (value: number) => literal(String(value), namedNode(`${XSD}integer`));

  private instance(classIri: string, value: string, predicate: string): Term {
    const instance = this.o.instanceFor(classIri, value);
    if (!instance) {
      this.note(`${compact(predicate)} "${value}" has no ${compact(classIri)} instance; left as a string`);
      return literal(value);
    }
    return namedNode(instance);
  }

  run(): Quad[] {
    const r = this.r;
    const entities = r.subjectsOfType(elody("EntityUi"));
    // first pass: collect the names that become nodes, and property paths per entity
    for (const entity of entities) {
      for (const form of r.nodes(entity, elody("createForm"))) {
        const name = r.value(form, elody("queryName"));
        if (name) this.formNames.add(name);
      }
      for (const picker of r.nodes(entity, elody("picker"))) {
        const name = r.value(picker, elody("queryName"));
        const filters = r.value(picker, elody("filtersQueryName"));
        if (name) this.pickerNames.set(name, filters ?? "");
      }
      for (const set of r.nodes(entity, elody("customBulkOperations"))) {
        const name = r.value(set, elody("queryName"));
        if (name) this.customOpsNames.add(name);
      }
      for (const source of r.nodes(entity, elody("formSource"))) {
        const name = r.value(source, elody("queryName"));
        if (name) this.formSourceNames.add(name);
      }
      for (const flow of [...r.nodes(entity, elody("repetitiveForm")), ...r.nodes(entity, elody("guidedFlow"))]) {
        const name = r.value(flow, elody("queryName"));
        if (name) this.flowNames.add(name);
      }
      const paths = new Map<string, string>();
      for (const property of r.nodes(entity, sh("property"))) {
        const name = r.value(property, sh("name"));
        const path = r.node(property, sh("path"));
        if (name && path) paths.set(name, path);
      }
      this.pathByName.set(entity, paths);
    }
    for (const entity of entities) this.entity(entity);
    return this.out;
  }

  private entity(entity: string) {
    const r = this.r;
    const subject = namedNode(entity);
    const paths = this.pathByName.get(entity)!;
    for (const quad of r.quadsOf(entity)) {
      const p = quad.predicate.value;
      const o = quad.object;
      if (p === elody("viewMode")) this.add(subject, p, this.viewMode(o.value));
      else if (p === sh("property")) this.add(subject, p, this.property(o.value));
      else if (p === elody("filter")) this.add(subject, p, this.filter(o.value));
      else if (p === elody("contextMenu")) this.add(subject, p, this.contextMenu(o.value));
      else if (p === elody("detail")) this.add(subject, p, this.detail(o.value, paths));
      else if (p === elody("formSource")) this.add(subject, p, this.formSource(o.value));
      else if (p === elody("bulkOperation")) this.add(subject, p, this.bulkOperation(o.value));
      else if (p === elody("customBulkOperations")) this.add(subject, p, this.customOps(o.value));
      else if (p === elody("createForm")) this.add(subject, elody("form"), this.form(o.value, paths));
      else if (p === elody("repetitiveForm") || p === elody("guidedFlow"))
        this.add(subject, elody("guidedFlow"), this.flow(o.value));
      else if (p === elody("picker")) this.add(subject, p, this.picker(o.value));
      else this.add(subject, p, o);
    }
  }

  /** Copy every triple of `node` except the handled predicates. */
  private copyRest(from: string, to: Term, handled: Set<string>) {
    for (const quad of this.r.quadsOf(from))
      if (!handled.has(quad.predicate.value)) this.add(to, quad.predicate.value, this.deepCopy(quad.object));
  }

  /** Blank-node objects (nested nodes, RDF lists) are copied with all their triples. */
  private deepCopy(term: Term): Term {
    if (term.termType !== "BlankNode") return term;
    const copy = this.blank();
    this.copyRest(term.value, copy, new Set());
    return copy;
  }

  private blank(): Term {
    return DataFactory.blankNode();
  }

  private viewMode(node: string): Term {
    const out = this.blank();
    const handled = new Set([elody("mode"), elody("config")]);
    const mode = this.r.term(node, elody("mode"));
    if (mode?.termType === "Literal") this.add(out, elody("mode"), this.instance(elody("ViewMode"), mode.value, elody("mode")));
    else if (mode) this.add(out, elody("mode"), mode);
    for (const entry of this.r.nodes(node, elody("config"))) {
      const copy = this.blank();
      this.copyRest(entry, copy, new Set());
      this.add(out, elody("config"), copy);
    }
    this.copyRest(node, out, handled);
    return out;
  }

  private property(node: string): Term {
    const out = this.blank();
    const r = this.r;
    const handled = new Set([
      elody("formatter"), elody("hidden"), elody("editable"), elody("unit"), elody("defaultSortDirection"),
      elody("source"), dash("propertyRole"), elody("tooltip"),
    ]);
    const formatter = r.value(node, elody("formatter"));
    if (formatter) {
      const [name, argument] = formatter.split("|");
      const viewer = this.o.viewerFor(name);
      if (viewer) {
        this.add(out, shui("viewer"), namedNode(viewer));
        if (argument) this.add(out, elody("viewerArgument"), literal(argument));
      } else this.note(`formatter "${formatter}" has no viewer in the ontology; dropped`);
    }
    if (r.has(node, elody("hidden"))) this.add(out, dash("hidden"), this.bool(r.literal(node, elody("hidden")) === true));
    if (r.has(node, elody("editable"))) this.add(out, dash("readOnly"), this.bool(r.literal(node, elody("editable")) === false));
    const unit = r.value(node, elody("unit"));
    if (unit) this.add(out, elody("unit"), this.instance(elody("Unit"), unit, elody("unit")));
    const direction = r.value(node, elody("defaultSortDirection"));
    if (direction) this.add(out, elody("defaultSortDirection"), this.instance(elody("SortDirection"), direction, elody("defaultSortDirection")));
    const source = r.value(node, elody("source"));
    if (source) this.add(out, elody("source"), this.instance(elody("ValueSource"), source, elody("source")));
    const role = r.value(node, dash("propertyRole"));
    if (role === dash("LabelRole")) this.add(out, shui("propertyRole"), namedNode(shui("LabelRole")));
    else if (role) this.add(out, dash("propertyRole"), namedNode(role));
    const tooltip = r.value(node, elody("tooltip"));
    if (tooltip !== undefined) this.add(out, sh("description"), literal(tooltip));
    this.copyRest(node, out, handled);
    return out;
  }

  private filter(node: string): Term {
    const out = this.blank();
    const r = this.r;
    const handled = new Set([elody("filterKind"), elody("hidden"), elody("defaultValue"), elody("tooltip")]);
    const kind = r.term(node, elody("filterKind"));
    if (kind?.termType === "Literal") this.add(out, elody("filterKind"), this.instance(elody("FilterKind"), kind.value, elody("filterKind")));
    else if (kind) this.add(out, elody("filterKind"), kind);
    if (r.has(node, elody("hidden"))) this.add(out, dash("hidden"), this.bool(r.literal(node, elody("hidden")) === true));
    for (const value of r.literals(node, elody("defaultValue"))) this.add(out, sh("defaultValue"), literal(value));
    if (r.has(node, elody("tooltip"))) this.add(out, elody("showTooltip"), this.bool(r.literal(node, elody("tooltip")) === true));
    this.copyRest(node, out, handled);
    return out;
  }

  private formReference(name: string): Term {
    if (this.formNames.has(name)) return this.mint(name);
    const platform = this.o.reading.subjectsWith(elody("queryName"), name).find((s) => this.o.reading.hasType(s, elody("PlatformForm")));
    if (platform) return namedNode(platform);
    this.note(`form "${name}" is not declared here nor a platform form; referenced as ui:${name}`);
    return this.mint(name);
  }

  private contextMenu(node: string): Term {
    const out = this.blank();
    const r = this.r;
    for (const action of r.nodes(node, elody("action"))) {
      const copy = this.blank();
      const handled = new Set([elody("actionType"), elody("formQuery")]);
      const kind = r.value(action, elody("actionType"));
      if (kind) this.add(copy, elody("actionKind"), this.instance(elody("ActionKind"), kind, elody("actionType")));
      const query = r.value(action, elody("formQuery"));
      if (query) {
        if (this.formSourceNames.has(query)) this.add(copy, elody("formSourceRef"), this.mint(query));
        else this.add(copy, elody("form"), this.formReference(query));
      }
      this.copyRest(action, copy, handled);
      this.add(out, elody("action"), copy);
    }
    this.copyRest(node, out, new Set([elody("action")]));
    return out;
  }

  private bulkOperation(node: string): Term {
    const out = this.blank();
    const r = this.r;
    const handled = new Set([elody("value"), elody("context"), elody("modal")]);
    const value = r.value(node, elody("value"));
    if (value) this.add(out, elody("operationKind"), this.instance(elody("BulkOperationKind"), value, elody("value")));
    const context = r.node(node, elody("context"));
    if (context) {
      const copy = this.blank();
      const mode = r.value(context, elody("activeViewMode"));
      if (mode) this.add(copy, elody("activeViewMode"), this.instance(elody("InteractionMode"), mode, elody("activeViewMode")));
      const selection = r.value(context, elody("selection"));
      if (selection) this.add(copy, elody("selection"), this.instance(elody("SelectionState"), selection, elody("selection")));
      const tooltip = r.value(context, elody("tooltip"));
      if (tooltip !== undefined) this.add(copy, elody("tooltipLabel"), literal(tooltip));
      this.copyRest(context, copy, new Set([elody("activeViewMode"), elody("selection"), elody("tooltip")]));
      this.add(out, elody("context"), copy);
    }
    const modal = r.node(node, elody("modal"));
    if (modal) {
      const copy = this.blank();
      const kind = r.value(modal, elody("typeModal"));
      if (kind) this.add(copy, elody("modalKind"), this.instance(elody("ModalKind"), kind, elody("typeModal")));
      const query = r.value(modal, elody("formQuery"));
      if (query) this.add(copy, elody("form"), this.formReference(query));
      const permission = r.value(modal, elody("permission"));
      if (permission) this.add(copy, elody("permission"), this.instance(elody("Permission"), permission, elody("permission")));
      this.copyRest(modal, copy, new Set([elody("typeModal"), elody("formQuery"), elody("permission")]));
      this.add(out, elody("modal"), copy);
    }
    this.copyRest(node, out, handled);
    return out;
  }

  private customOps(node: string): Term {
    const name = this.r.value(node, elody("queryName"));
    const out: Term = name ? this.mint(name) : this.blank();
    for (const op of this.r.nodes(node, elody("operation"))) this.add(out, elody("operation"), this.bulkOperation(op));
    this.copyRest(node, out, new Set([elody("operation")]));
    return out;
  }

  private form(node: string, paths: Map<string, string>): Term {
    const r = this.r;
    const name = r.value(node, elody("queryName"));
    const out: Term = name ? this.mint(name) : this.blank();
    this.add(out, rdf("type"), namedNode(elody("Form")));
    const shape = this.blank();
    this.add(out, elody("shape"), shape);
    for (const field of r.byOrder(r.nodes(node, elody("field")))) {
      const copy = this.blank();
      const fieldName = r.value(field, sh("name"));
      const path = fieldName ? paths.get(fieldName) : undefined;
      if (path) this.add(copy, sh("path"), namedNode(path));
      else this.note(`form field "${fieldName}" has no property shape with that sh:name; no sh:path set`);
      const inputType = r.value(field, elody("inputType")) ?? "baseTextField";
      if (inputType === "baseTextField") this.add(copy, sh("datatype"), namedNode(`${XSD}string`));
      else {
        const editor = this.o.editorForFormFieldType(inputType);
        if (editor) this.add(copy, shui("editor"), namedNode(editor));
        else this.note(`input type "${inputType}" has no editor in the ontology; dropped`);
      }
      if (r.literal(field, elody("required")) === true) this.add(copy, sh("minCount"), this.int(1));
      this.copyRest(field, copy, new Set([elody("inputType"), elody("required")]));
      this.add(shape, sh("property"), copy);
    }
    this.copyRest(node, out, new Set([elody("field")]));
    return out;
  }

  private flow(node: string): Term {
    const r = this.r;
    const name = r.value(node, elody("queryName"));
    const out: Term = name ? this.mint(name) : this.blank();
    for (const step of r.nodes(node, elody("step"))) {
      const copy = this.blank();
      const handled = new Set([elody("createForm"), elody("pickerQuery"), elody("pickerFiltersQuery")]);
      const form = r.value(step, elody("createForm"));
      if (form) this.add(copy, elody("form"), this.formReference(form));
      const picker = r.value(step, elody("pickerQuery"));
      if (picker) this.add(copy, elody("picker"), this.mint(picker));
      this.copyRest(step, copy, handled);
      this.add(out, elody("step"), copy);
    }
    this.copyRest(node, out, new Set([elody("step")]));
    return out;
  }

  private picker(node: string): Term {
    const r = this.r;
    const name = r.value(node, elody("queryName"));
    const out: Term = name ? this.mint(name) : this.blank();
    const filters = r.value(node, elody("filtersQueryName"));
    const derived = name ? (name.includes("List") ? name.replace("List", "Filters") : `${name}Filters`) : undefined;
    const handled = new Set([elody("filtersQueryName"), elody("result"), elody("filter")]);
    if (filters && filters !== derived) {
      this.note(`picker "${name}": filters document "${filters}" is not derivable from the listing name; kept as elody:filtersQueryName (retired) — rename to "${derived}"`);
      this.add(out, elody("filtersQueryName"), literal(filters));
    }
    for (const result of r.nodes(node, elody("result"))) {
      const copy = this.blank();
      const type = r.value(result, elody("type"));
      if (type) this.add(copy, elody("graphqlType"), literal(type));
      this.copyRest(result, copy, new Set([elody("type")]));
      this.add(out, elody("result"), copy);
    }
    for (const filter of r.nodes(node, elody("filter"))) this.add(out, elody("filter"), this.filter(filter));
    this.copyRest(node, out, handled);
    return out;
  }

  private formSource(node: string): Term {
    const r = this.r;
    const name = r.value(node, elody("queryName"));
    const out: Term = name ? this.mint(name) : this.blank();
    const field = r.value(node, elody("field"));
    if (field) this.add(out, elody("resolverField"), literal(field));
    this.copyRest(node, out, new Set([elody("field")]));
    return out;
  }

  private detail(node: string, paths: Map<string, string>): Term {
    const out = this.blank();
    const r = this.r;
    for (const column of r.nodes(node, elody("column"))) {
      const copy = this.blank();
      const size = r.value(column, elody("size"));
      if (size) this.add(copy, elody("size"), this.instance(elody("ColumnSize"), size, elody("size")));
      for (const element of r.nodes(column, elody("element"))) this.add(copy, elody("element"), this.element(element, paths));
      this.copyRest(column, copy, new Set([elody("size"), elody("element")]));
      this.add(out, elody("column"), copy);
    }
    this.copyRest(node, out, new Set([elody("column")]));
    return out;
  }

  private element(node: string, paths: Map<string, string>): Term {
    const out = this.blank();
    const r = this.r;
    const handled = new Set([elody("searchInputType"), elody("customBulkOperations"), elody("pickerList"), elody("pickerFilters"), elody("panel")]);
    const search = r.value(node, elody("searchInputType"));
    if (search) this.add(out, elody("searchInput"), this.instance(elody("SearchInputKind"), search, elody("searchInputType")));
    const custom = r.term(node, elody("customBulkOperations"));
    if (custom?.termType === "Literal") this.add(out, elody("customBulkOperations"), this.mint(custom.value));
    else if (custom) this.add(out, elody("customBulkOperations"), custom);
    const pickerList = r.value(node, elody("pickerList"));
    if (pickerList) this.add(out, elody("picker"), this.mint(pickerList));
    for (const panel of r.nodes(node, elody("panel"))) {
      const copy = this.blank();
      const panelHandled = new Set([elody("panelType"), elody("editable"), elody("field")]);
      const kind = r.value(panel, elody("panelType"));
      if (kind) this.add(copy, elody("panelKind"), this.instance(elody("PanelKind"), kind, elody("panelType")));
      if (r.has(panel, elody("editable"))) this.add(copy, dash("readOnly"), this.bool(r.literal(panel, elody("editable")) === false));
      for (const quad of r.quadsOf(panel).filter((q) => q.predicate.value === elody("field"))) {
        if (quad.object.termType !== "Literal") {
          this.add(copy, elody("field"), quad.object);
          continue;
        }
        const path = paths.get(quad.object.value);
        if (path) this.add(copy, elody("field"), namedNode(path));
        else {
          this.note(`panel field "${quad.object.value}" has no property shape with that sh:name; kept as a string`);
          this.add(copy, elody("field"), quad.object);
        }
      }
      this.copyRest(panel, copy, panelHandled);
      this.add(out, elody("panel"), copy);
    }
    this.copyRest(node, out, handled);
    return out;
  }
}

export { localName };
