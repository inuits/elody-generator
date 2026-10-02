/**
 * A small Turtle writer for declarations: named subjects as blocks, blank
 * nodes referenced once inlined as `[ ... ]`, RDF lists as `( ... )`,
 * predicates in a stable order. Comments of the source are not preserved —
 * a migrated file is a starting point to tidy by hand.
 */
import type { Quad, Term } from "n3";
import { DASH, ELODY, RDF, RDFS, SH, SHUI, XSD, rdf } from "./vocab.js";

type Prefixes = Record<string, string>;

const DEFAULT_PREFIXES: Prefixes = {
  elody: ELODY,
  sh: SH,
  shui: SHUI,
  dash: DASH,
  rdf: RDF,
  rdfs: RDFS,
  xsd: XSD,
};

const PREDICATE_ORDER = [
  rdf("type"),
  `${ELODY}graphqlType`,
  `${ELODY}emit`,
  `${ELODY}documents`,
  `${SH}targetClass`,
  `${SH}path`,
  `${SH}name`,
  `${RDFS}label`,
  `${SH}order`,
  `${ELODY}alias`,
  `${ELODY}queryName`,
  `${ELODY}key`,
];

export class TurtleWriter {
  private bySubject = new Map<string, Quad[]>();
  private referenceCount = new Map<string, number>();
  private listHeads = new Set<string>();

  constructor(
    quads: Quad[],
    private readonly prefixes: Prefixes = DEFAULT_PREFIXES,
  ) {
    for (const quad of quads) {
      const list = this.bySubject.get(quad.subject.value) ?? [];
      list.push(quad);
      this.bySubject.set(quad.subject.value, list);
      if (quad.object.termType === "BlankNode")
        this.referenceCount.set(quad.object.value, (this.referenceCount.get(quad.object.value) ?? 0) + 1);
      if (quad.predicate.value === rdf("first")) this.listHeads.add(quad.subject.value);
    }
  }

  write(): string {
    const header = Object.entries(this.prefixes)
      .map(([prefix, iri]) => `@prefix ${(prefix + ":").padEnd(7)} <${iri}> .`)
      .join("\n");
    const blocks: string[] = [];
    for (const subject of this.bySubject.keys()) {
      if (subject.startsWith("_:") || this.isBlank(subject)) {
        if ((this.referenceCount.get(subject) ?? 0) !== 0) continue;
        if (this.listHeads.has(subject)) continue;
        blocks.push(`[]${this.predicates(subject, 1)} .`);
        continue;
      }
      blocks.push(`${this.term({ termType: "NamedNode", value: subject } as Term)}${this.predicates(subject, 1)} .`);
    }
    return `${header}\n\n${blocks.join("\n\n")}\n`;
  }

  private isBlank(id: string): boolean {
    return !/^[a-z][a-z0-9+.-]*:/i.test(id) || id.startsWith("n3-");
  }

  private predicates(subject: string, depth: number): string {
    const quads = this.bySubject.get(subject) ?? [];
    const groups = new Map<string, Term[]>();
    for (const quad of quads) {
      if (quad.predicate.value === rdf("first") || quad.predicate.value === rdf("rest")) continue;
      const objects = groups.get(quad.predicate.value) ?? [];
      objects.push(quad.object);
      groups.set(quad.predicate.value, objects);
    }
    const ordered = [...groups.keys()].sort((a, b) => {
      const ia = PREDICATE_ORDER.indexOf(a);
      const ib = PREDICATE_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return 0;
    });
    const indent = "  ".repeat(depth);
    const lines = ordered.map((predicate) => {
      const objects = groups.get(predicate)!;
      const rendered = objects.map((object) => this.object(object, depth));
      const name = predicate === rdf("type") ? "a" : this.term({ termType: "NamedNode", value: predicate } as Term);
      const multiline = rendered.some((value) => value.includes("\n")) || rendered.join(", ").length > 80;
      return multiline
        ? `${indent}${name}\n${rendered.map((value) => `${indent}  ${value}`).join(" ,\n")}`
        : `${indent}${name} ${rendered.join(" , ")}`;
    });
    return lines.length ? `\n${lines.join(" ;\n")}` : "";
  }

  private object(term: Term, depth: number): string {
    if (term.termType === "BlankNode" || (term.termType === "NamedNode" && this.isBlank(term.value))) {
      if (this.listHeads.has(term.value) || term.value === rdf("nil")) return this.list(term.value, depth);
      const body = this.predicates(term.value, depth + 1);
      return body ? `[ ${body.trimStart()} ]` : "[]";
    }
    return this.term(term);
  }

  private list(head: string, depth: number): string {
    const members: string[] = [];
    let cursor: string | undefined = head;
    while (cursor && cursor !== rdf("nil")) {
      const quads: Quad[] = this.bySubject.get(cursor) ?? [];
      const first = quads.find((quad: Quad) => quad.predicate.value === rdf("first"));
      if (!first) break;
      members.push(this.object(first.object, depth));
      cursor = quads.find((quad: Quad) => quad.predicate.value === rdf("rest"))?.object.value;
    }
    return `( ${members.join(" ")} )`;
  }

  term(term: Term): string {
    if (term.termType === "Literal") {
      const literal = term as Term & { datatype?: { value: string }; language?: string };
      const datatype = literal.datatype?.value ?? "";
      if (datatype === `${XSD}boolean` || datatype === `${XSD}integer` || datatype === `${XSD}decimal`) return term.value;
      const escaped = term.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      if (literal.language) return `"${escaped}"@${literal.language}`;
      if (datatype && datatype !== `${XSD}string`) return `"${escaped}"^^${this.term({ termType: "NamedNode", value: datatype } as Term)}`;
      return `"${escaped}"`;
    }
    if (term.termType === "NamedNode") {
      for (const [prefix, iri] of Object.entries(this.prefixes))
        if (term.value.startsWith(iri)) {
          const local = term.value.slice(iri.length);
          if (/^[A-Za-z_][\w.-]*$/.test(local) && !local.endsWith(".")) return `${prefix}:${local}`;
        }
      return `<${term.value}>`;
    }
    return term.value;
  }
}
