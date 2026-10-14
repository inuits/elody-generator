/**
 * `expand`: a declaration with every default written out, as the meta-shapes
 * state them: `sh:defaultValue` on a property entry adds the constant where the
 * term is absent, `elody:defaultRule` on `elody:labelKey` adds the conventional
 * label key where a property shape carries no label text. The result is the
 * explicit graph a tool outside the generator reads; people write the short one.
 */
import { readFileSync } from "fs";
import { DataFactory, Parser, type Quad, type Quad_Subject } from "n3";
import { META_SHAPES_PATH } from "./ontology.js";
import { TurtleWriter } from "./turtle.js";
import { conventionalLabelKey, localName } from "./vocab.js";

const SH = "http://www.w3.org/ns/shacl#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const ELODY = "https://elody.eu/ns/ui#";
const { namedNode, literal, quad } = DataFactory;

export type ExpandResult = { ttl: string; added: number };

export function expandDeclaration(ttl: string): ExpandResult {
  const quads = new Parser().parse(ttl);
  const shapes = new Parser().parse(readFileSync(META_SHAPES_PATH, "utf-8"));
  const objects = (graph: Quad[], subject: string, predicate: string) => graph.filter((q) => q.subject.value === subject && q.predicate.value === predicate);
  const subjects = new Map<string, Quad_Subject>();
  for (const q of quads) if (!subjects.has(q.subject.value)) subjects.set(q.subject.value, q.subject);
  const seen = new Set<string>();
  let added = 0;
  const apply = (shape: string, node: string) => {
    if (seen.has(`${shape}|${node}`)) return;
    seen.add(`${shape}|${node}`);
    for (const entry of objects(shapes, shape, `${SH}property`).map((q) => q.object.value)) {
      const path = objects(shapes, entry, `${SH}path`)[0]?.object.value;
      if (!path) continue;
      const present = objects(quads, node, path);
      const subject = subjects.get(node) ?? namedNode(node);
      const constant = objects(shapes, entry, `${SH}defaultValue`)[0];
      if (constant && !present.length) {
        quads.push(quad(subject, namedNode(path), constant.object));
        added += 1;
      }
      const rule = objects(shapes, entry, `${ELODY}defaultRule`)[0];
      if (rule && path === `${ELODY}labelKey` && !present.length) {
        const key = objects(quads, node, `${SH}path`)[0]?.object.value;
        const text = objects(quads, node, `${SH}name`).length + objects(quads, node, `${RDFS}label`).length;
        if (key && !text) {
          // the key's own label (em:x elody:labelKey "...") before the convention
          const own = objects(quads, key, `${ELODY}labelKey`)[0]?.object.value;
          quads.push(quad(subject, namedNode(path), literal(own ?? conventionalLabelKey(localName(key)))));
          added += 1;
        }
      }
      const nested = objects(shapes, entry, `${SH}node`)[0]?.object.value;
      if (nested) for (const value of present) if (value.object.termType !== "Literal") apply(nested, value.object.value);
    }
  };
  for (const shape of new Set(shapes.filter((q) => q.predicate.value === `${RDF}type` && q.object.value === `${SH}NodeShape`).map((q) => q.subject.value)))
    for (const cls of objects(shapes, shape, `${SH}targetClass`))
      for (const typed of quads.filter((q) => q.predicate.value === `${RDF}type` && q.object.value === cls.object.value)) apply(shape, typed.subject.value);
  const prefixes: Record<string, string> = {};
  for (const match of ttl.matchAll(/@prefix\s+([\w-]*):\s*<([^>]+)>/g)) prefixes[match[1]] = match[2];
  return { ttl: new TurtleWriter(quads, prefixes).write(), added };
}
