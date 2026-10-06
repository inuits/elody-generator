/**
 * A read-only view over the triples of a declaration (and the ontology),
 * indexed by subject. Namespaces are normalised on load (see vocab.ts), and
 * every use of a legacy namespace is recorded as a warning so `check` can
 * report it.
 */
import { DataFactory, Parser, type Quad, type Term } from "n3";
import { ELODY_LEGACY, SHUI_LEGACY, normaliseIri, rdf, sh } from "./vocab.js";

export type Literal = string | number | boolean;

export type Warning = { subject?: string; message: string };

export class Reading {
  private bySubject = new Map<string, Quad[]>();
  private byObject = new Map<string, Quad[]>();
  readonly warnings: Warning[] = [];
  private legacyNamespaceSeen = false;

  constructor(quads: Quad[]) {
    for (const quad of quads) {
      const normalised = this.normalise(quad);
      const key = normalised.subject.value;
      const list = this.bySubject.get(key);
      if (list) list.push(normalised);
      else this.bySubject.set(key, [normalised]);
      const objectKey = normalised.object.value;
      const reverse = this.byObject.get(objectKey);
      if (reverse) reverse.push(normalised);
      else this.byObject.set(objectKey, [normalised]);
    }
  }

  static parse(ttl: string): Reading {
    return new Reading(new Parser().parse(ttl));
  }

  private normalise(quad: Quad): Quad {
    const fix = (term: Term): Term => {
      if (term.termType !== "NamedNode") return term;
      const next = normaliseIri(term.value);
      if (next !== term.value && !this.legacyNamespaceSeen) {
        this.legacyNamespaceSeen = true;
        this.warnings.push({
          message: term.value.startsWith(ELODY_LEGACY)
            ? `legacy namespace ${ELODY_LEGACY} read as elody.eu — update the prefix`
            : `legacy namespace ${SHUI_LEGACY} read as the draft form — update the prefix`,
        });
      }
      return next === term.value ? term : DataFactory.namedNode(next);
    };
    const subject = fix(quad.subject);
    const predicate = fix(quad.predicate);
    const object = fix(quad.object);
    if (subject === quad.subject && predicate === quad.predicate && object === quad.object) return quad;
    return DataFactory.quad(subject as never, predicate as never, object as never, quad.graph as never);
  }

  /** True when the source used a legacy namespace (elody.io or shacl-ui#). */
  get usedLegacyNamespace(): boolean {
    return this.legacyNamespaceSeen;
  }

  /** Every (normalised) quad. */
  quads(): Quad[] {
    return [...this.bySubject.values()].flat();
  }

  subjects(): string[] {
    return [...this.bySubject.keys()];
  }

  subjectsOfType(typeIri: string): string[] {
    const subjects: string[] = [];
    for (const [subject, quads] of this.bySubject)
      if (quads.some((quad) => quad.predicate.value === rdf("type") && quad.object.value === typeIri))
        subjects.push(subject);
    return subjects.sort();
  }

  hasType(subject: string, typeIri: string): boolean {
    return this.values(subject, rdf("type")).includes(typeIri);
  }

  types(subject: string): string[] {
    return this.values(subject, rdf("type"));
  }

  quadsOf(subject: string): Quad[] {
    return this.bySubject.get(subject) ?? [];
  }

  has(subject: string, predicate: string): boolean {
    return this.quadsOf(subject).some((quad) => quad.predicate.value === predicate);
  }

  values(subject: string, predicate: string): string[] {
    return this.quadsOf(subject)
      .filter((quad) => quad.predicate.value === predicate)
      .map((quad) => quad.object.value);
  }

  value(subject: string, predicate: string): string | undefined {
    return this.values(subject, predicate)[0];
  }

  /** The object term of the first matching triple. */
  term(subject: string, predicate: string): Term | undefined {
    return this.quadsOf(subject).find((quad) => quad.predicate.value === predicate)?.object;
  }

  /** Object IRIs / blank node ids only (no literals). */
  nodes(subject: string, predicate: string): string[] {
    return this.quadsOf(subject)
      .filter((quad) => quad.predicate.value === predicate && quad.object.termType !== "Literal")
      .map((quad) => quad.object.value);
  }

  node(subject: string, predicate: string): string | undefined {
    return this.nodes(subject, predicate)[0];
  }

  /** Literal values only, as strings. */
  literals(subject: string, predicate: string): string[] {
    return this.quadsOf(subject)
      .filter((quad) => quad.predicate.value === predicate && quad.object.termType === "Literal")
      .map((quad) => quad.object.value);
  }

  /** The first literal, typed by its datatype. */
  literal(subject: string, predicate: string): Literal | undefined {
    const quad = this.quadsOf(subject).find(
      (candidate) => candidate.predicate.value === predicate && candidate.object.termType === "Literal",
    );
    if (!quad) return undefined;
    const datatype = (quad.object as { datatype?: { value: string } }).datatype?.value ?? "";
    if (datatype.endsWith("#boolean")) return quad.object.value === "true";
    if (datatype.endsWith("#integer") || datatype.endsWith("#decimal") || datatype.endsWith("#double"))
      return Number(quad.object.value);
    return quad.object.value;
  }

  /** Subjects that reference `object` through `predicate`. */
  subjectsWith(predicate: string, object: string): string[] {
    return (this.byObject.get(object) ?? [])
      .filter((quad) => quad.predicate.value === predicate)
      .map((quad) => quad.subject.value);
  }

  /** The members of an RDF list, in order; a non-list node yields itself. */
  list(head: string | undefined): string[] {
    if (!head) return [];
    if (head === rdf("nil")) return [];
    const members: string[] = [];
    let cursor: string | undefined = head;
    const seen = new Set<string>();
    while (cursor && cursor !== rdf("nil") && !seen.has(cursor)) {
      seen.add(cursor);
      const first = this.value(cursor, rdf("first"));
      if (first === undefined) return members.length ? members : [head];
      members.push(first);
      cursor = this.value(cursor, rdf("rest"));
    }
    return members;
  }

  /** The members of an RDF list as terms (literal or IRI), or undefined when `head` is not a list. */
  listTerms(head: string | undefined): Term[] | undefined {
    if (!head) return undefined;
    if (head === rdf("nil")) return [];
    if (!this.has(head, rdf("first"))) return undefined;
    const members: Term[] = [];
    let cursor: string | undefined = head;
    const seen = new Set<string>();
    while (cursor && cursor !== rdf("nil") && !seen.has(cursor)) {
      seen.add(cursor);
      const first = this.term(cursor, rdf("first"));
      if (!first) break;
      members.push(first);
      cursor = this.value(cursor, rdf("rest"));
    }
    return members;
  }

  order(subject: string): number {
    return Number(this.value(subject, sh("order")) ?? 0);
  }

  /** Sort nodes by sh:order, stable. */
  byOrder(nodes: string[]): string[] {
    return [...nodes].sort((a, b) => this.order(a) - this.order(b));
  }

  warn(subject: string | undefined, message: string): void {
    if (!this.warnings.some((existing) => existing.subject === subject && existing.message === message))
      this.warnings.push({ subject, message });
  }
}
