/**
 * The SHACL 1.2 UI scoring system, as specified:
 * https://w3c.github.io/data-shapes/shacl12-ui/#scoring-system
 *
 * - scoring graph: the official widget files (spec/widgets), plus whatever a
 *   caller adds (e.g. Elody widgets)
 * - preparation: a widget declared with shui:editor / shui:viewer that has no
 *   shui:WidgetScore gets one with shui:defaultWidgetScore (default 40)
 * - matcher / accept / score functions, validating with SHACL Core
 *   (rdf-validate-shacl) exactly as the spec's validation function says
 */
import { readdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import rdf from "@zazuko/env";
import SHACLValidator from "rdf-validate-shacl";
import { DataFactory, Parser, type Quad, type Term } from "n3";

const { namedNode, blankNode, literal, quad } = DataFactory;
const SH = "http://www.w3.org/ns/shacl#";
const SHUI = "http://www.w3.org/ns/shacl-ui/";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const XSD_INTEGER = "http://www.w3.org/2001/XMLSchema#integer";

const here = dirname(fileURLToPath(import.meta.url));
export const SPEC_WIDGETS_DIR = join(here, "..", "spec", "widgets");

export type WidgetResult = { widget: string; score: number; scoreNode: string };
export type WidgetKind = "editor" | "viewer";

const parse = (ttl: string): Quad[] => new Parser().parse(ttl);

/**
 * SHACL 1.2 allows a list as the value of sh:datatype ("one of these"); the
 * SHACL Core validator only knows a single datatype. Rewrite
 *   S sh:datatype ( a b )   into   S sh:or ( [ sh:datatype a ] [ sh:datatype b ] )
 * which means the same for a node shape.
 */
export function downgradeDatatypeLists(quads: Quad[]): Quad[] {
  const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  const index = new Index(quads);
  const out: Quad[] = [];
  for (const q of quads) {
    if (q.predicate.value !== `${SH}datatype` || q.object.termType !== "BlankNode" || !index.object(q.object.value, `${RDF}first`)) {
      out.push(q);
      continue;
    }
    const members: Term[] = [];
    let cursor: Term | undefined = q.object;
    while (cursor && cursor.value !== `${RDF}nil`) {
      const first = index.object(cursor.value, `${RDF}first`);
      if (!first) break;
      members.push(first);
      cursor = index.object(cursor.value, `${RDF}rest`);
    }
    const alternatives = members.map((datatype) => {
      const node = blankNode();
      out.push(quad(node, namedNode(`${SH}datatype`), datatype as never));
      return node;
    });
    let list: Term = namedNode(`${RDF}nil`);
    for (const node of alternatives.reverse()) {
      const cell = blankNode();
      out.push(quad(cell, namedNode(`${RDF}first`), node), quad(cell, namedNode(`${RDF}rest`), list as never));
      list = cell;
    }
    out.push(quad(q.subject, namedNode(`${SH}or`), list as never));
  }
  return out;
}

/** The official scoring graph: every widget file plus the shapes they reference. */
export function officialScoringGraph(dir = SPEC_WIDGETS_DIR): Quad[] {
  const files = [
    join(dir, "score-shapes.ttl"),
    ...["editors", "viewers"].flatMap((sub) =>
      readdirSync(join(dir, sub)).filter((name) => name.endsWith(".ttl")).map((name) => join(dir, sub, name)),
    ),
  ];
  return downgradeDatatypeLists(files.flatMap((file) => parse(readFileSync(file, "utf-8"))));
}

class Index {
  private bySubject = new Map<string, Quad[]>();
  private subjectsSet = new Set<string>();
  constructor(readonly quads: Quad[]) {
    for (const q of quads) {
      const key = q.subject.value;
      this.subjectsSet.add(key);
      (this.bySubject.get(key) ?? this.bySubject.set(key, []).get(key)!).push(q);
    }
  }
  objects(subject: string, predicate: string): Term[] {
    return (this.bySubject.get(subject) ?? []).filter((q) => q.predicate.value === predicate).map((q) => q.object);
  }
  object(subject: string, predicate: string): Term | undefined {
    return this.objects(subject, predicate)[0];
  }
  subjectsOf(predicate: string, object?: string): Term[] {
    const seen = new Map<string, Term>();
    for (const q of this.quads)
      if (q.predicate.value === predicate && (object === undefined || q.object.value === object)) seen.set(q.subject.value, q.subject);
    return [...seen.values()];
  }
  isSubject(term: Term): boolean {
    return this.subjectsSet.has(term.value);
  }
}

export class Scorer {
  private scoring: Index;
  private shapes: Index;
  private data: Index;
  private validator: SHACLValidator;
  private shapesDataset;
  private dataDataset;
  private kinds = new Map<string, WidgetKind>();

  private constructor(scoringQuads: Quad[], shapesQuads: Quad[], dataQuads: Quad[], defaultWidgetScore: number) {
    this.shapes = new Index(shapesQuads);
    this.data = new Index(dataQuads);
    const prepared = Scorer.prepare(scoringQuads, this.shapes, defaultWidgetScore, this.kinds);
    this.scoring = new Index(prepared);
    this.validator = new SHACLValidator(rdf.dataset(prepared as never[]), {
      factory: rdf as never,
      importGraph: async () => rdf.dataset(),
    } as never);
    this.shapesDataset = rdf.dataset(shapesQuads as never[]);
    this.dataDataset = rdf.dataset(dataQuads as never[]);
    for (const widget of this.scoring.subjectsOf(RDF_TYPE)) {
      const types = this.scoring.objects(widget.value, RDF_TYPE).map((t) => t.value);
      if (types.some((t) => /Editor$/.test(t))) this.kinds.set(widget.value, "editor");
      else if (types.some((t) => /Viewer$/.test(t))) this.kinds.set(widget.value, "viewer");
    }
  }

  static async create(options: { shapes: Quad[]; data?: Quad[]; scoring?: Quad[] }): Promise<Scorer> {
    const shapes = new Index(options.shapes);
    const config = shapes.subjectsOf(RDF_TYPE, `${SHUI}Configuration`)[0];
    const configured = config ? shapes.object(config.value, `${SHUI}defaultWidgetScore`) : undefined;
    const scorer = new Scorer(
      options.scoring ?? officialScoringGraph(),
      options.shapes,
      options.data ?? [],
      configured ? Number(configured.value) : 40,
    );
    await (scorer.validator as unknown as { loadOwlImports(): Promise<void> }).loadOwlImports();
    return scorer;
  }

  static fromTurtle(shapes: string, data?: string): Promise<Scorer> {
    return Scorer.create({ shapes: parse(shapes), data: data ? parse(data) : [] });
  }

  /** Scoring graph preparation (spec §Scoring Graph Preparation). */
  private static prepare(scoring: Quad[], shapes: Index, defaultScore: number, kinds: Map<string, WidgetKind>): Quad[] {
    const out = [...scoring];
    const scored = new Set(new Index(scoring).subjectsOf(RDF_TYPE, `${SHUI}WidgetScore`).flatMap((s) =>
      new Index(scoring).objects(s.value, `${SHUI}widget`).map((w) => w.value),
    ));
    const isShape = (subject: string) =>
      shapes.objects(subject, RDF_TYPE).some((t) => t.value === `${SH}NodeShape` || t.value === `${SH}PropertyShape`) ||
      shapes.objects(subject, `${SH}path`).length > 0;
    for (const [predicate, kind] of [[`${SHUI}editor`, "editor"], [`${SHUI}viewer`, "viewer"]] as const) {
      const declared = new Set<string>();
      for (const q of shapes.quads)
        if (q.predicate.value === predicate && q.object.termType === "NamedNode" && isShape(q.subject.value)) declared.add(q.object.value);
      for (const widget of declared) {
        if (!kinds.has(widget)) kinds.set(widget, kind);
        if (scored.has(widget)) continue;
        const score = blankNode();
        const shape = blankNode();
        const property = blankNode();
        out.push(
          quad(score, namedNode(RDF_TYPE), namedNode(`${SHUI}WidgetScore`)),
          quad(score, namedNode(`${SHUI}widget`), namedNode(widget)),
          quad(score, namedNode(`${SHUI}score`), literal(String(defaultScore), namedNode(XSD_INTEGER))),
          quad(score, namedNode(`${SHUI}shapesGraphShape`), shape),
          quad(shape, namedNode(RDF_TYPE), namedNode(`${SH}NodeShape`)),
          quad(shape, namedNode(`${SH}property`), property),
          quad(property, namedNode(`${SH}path`), namedNode(predicate)),
          quad(property, namedNode(`${SH}hasValue`), namedNode(widget)),
        );
        scored.add(widget);
      }
    }
    return out;
  }

  /** Validation function (spec §Validation Function). */
  private conforms(focus: Term, target: "shapes" | "data", shapeNode: Term | undefined): boolean {
    if (!shapeNode) return true;
    const index = target === "shapes" ? this.shapes : this.data;
    if (focus.termType !== "Literal" && !index.isSubject(focus)) return false;
    try {
      const v = this.validator as unknown as {
        setDataGraph(d: unknown): void;
        nodeConformsToShape(f: Term, s: Term): boolean;
      };
      v.setDataGraph(target === "shapes" ? this.shapesDataset : this.dataDataset);
      return v.nodeConformsToShape(focus, shapeNode);
    } catch {
      return false;
    }
  }

  /** Matcher function (spec §Matcher Function). */
  private matches(matcher: string, shapeNode: Term, focus: Term | undefined): boolean {
    const shapesGraphShape = this.scoring.object(matcher, `${SHUI}shapesGraphShape`);
    const dataGraphShape = this.scoring.object(matcher, `${SHUI}dataGraphShape`);
    if (!focus && dataGraphShape && !shapesGraphShape) return false;
    if (!this.conforms(shapeNode, "shapes", shapesGraphShape)) return false;
    if (!focus) return true;
    return this.conforms(focus, "data", dataGraphShape);
  }

  /** Accept function (spec §Accept Function). */
  private accepts(widget: string, shapeNode: Term, focus: Term | undefined): boolean {
    const matcher = this.scoring.subjectsOf(`${SHUI}widget`, widget).find((m) =>
      this.scoring.objects(m.value, RDF_TYPE).some((t) => t.value === `${SHUI}WidgetAcceptMatcher`),
    );
    return matcher ? this.matches(matcher.value, shapeNode, focus) : true;
  }

  /** Score function (spec §Score Function): every accepted match, best first. */
  async score(shapeNode: Term, focus?: Term): Promise<WidgetResult[]> {
    const scores = this.scoring
      .subjectsOf(RDF_TYPE, `${SHUI}WidgetScore`)
      .map((node) => ({
        node: node.value,
        widget: this.scoring.object(node.value, `${SHUI}widget`)!.value,
        score: Number(this.scoring.object(node.value, `${SHUI}score`)!.value),
      }))
      .sort((a, b) => b.score - a.score || (a.widget < b.widget ? -1 : a.widget > b.widget ? 1 : 0));
    const results: WidgetResult[] = [];
    for (const s of scores) {
      if (!this.matches(s.node, shapeNode, focus)) continue;
      if (!this.accepts(s.widget, shapeNode, focus)) continue;
      results.push({ widget: s.widget, score: s.score, scoreNode: s.node });
    }
    // widget selection: one entry per widget, its best score (spec §Widget Selection)
    const best = new Map<string, WidgetResult>();
    for (const result of results) if (!best.has(result.widget)) best.set(result.widget, result);
    return [...best.values()];
  }

  kindOf(widget: string): WidgetKind | undefined {
    return this.kinds.get(widget);
  }

  async editors(shapeNode: Term, focus?: Term): Promise<WidgetResult[]> {
    return (await this.score(shapeNode, focus)).filter((r) => this.kindOf(r.widget) === "editor");
  }

  async viewers(shapeNode: Term, focus?: Term): Promise<WidgetResult[]> {
    return (await this.score(shapeNode, focus)).filter((r) => this.kindOf(r.widget) === "viewer");
  }
}
