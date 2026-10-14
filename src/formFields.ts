/**
 * `elody:fields` on a form, a form tab or a fields fragment: the fields as a
 * list of the type's properties (`em:name`), each taking its input from the
 * type's property shape, or an override (`[ sh:path em:name ; sh:minCount 1 ]`)
 * that adds to or replaces what it inherits. Spelled out, before parsing, as
 * the `elody:shape [ sh:property ... ]` the parser reads: the field's order is
 * its position in the list; the input-defining terms (sh:datatype,
 * shui:editor, elody:clientInputField, sh:class) are inherited as a group when
 * the override names none of them; the label key, unit, value label key,
 * relation type and sh:maxCount each when the override lacks them. Nothing
 * else of the property flows into the form (not sh:minCount, not a validation).
 * The type is named by `elody:fieldsFrom`; without it an item inherits nothing.
 */
import { DataFactory, type Quad } from "n3";
import { elody, rdf, sh, shui } from "./vocab.js";

const { blankNode, namedNode, literal, quad } = DataFactory;

/** the input-defining terms, inherited together when the override names none */
export const INPUT_TERMS = [sh("datatype"), shui("editor"), elody("clientInputField"), sh("class")];
/** the terms inherited one by one when the override lacks them */
export const SINGLE_TERMS = [elody("labelKey"), elody("unit"), elody("valueLabelKey"), elody("relationType"), sh("maxCount")];

export function expandFormFields(quads: Quad[]): Quad[] {
  const objects = (subject: string, predicate: string) => quads.filter((q) => q.subject.value === subject && q.predicate.value === predicate);
  const subjectsOf = (predicate: string, object: string) => quads.filter((q) => q.predicate.value === predicate && q.object.value === object).map((q) => q.subject.value);
  const listOf = (head: string): string[] => {
    const items: string[] = [];
    let at: string | undefined = head;
    const seen = new Set<string>();
    while (at && at !== rdf("nil") && !seen.has(at)) {
      seen.add(at);
      const first = objects(at, rdf("first"))[0];
      if (!first) break;
      items.push(first.object.value);
      at = objects(at, rdf("rest"))[0]?.object.value;
    }
    return items;
  };
  // the type whose property shapes the fields take their input from: named by elody:fieldsFrom (a tab's form names it); unnamed, nothing is inherited
  const ownerOf = (node: string): string | undefined => objects(node, elody("fieldsFrom"))[0]?.object.value ?? subjectsOf(elody("tab"), node).map(ownerOf).find(Boolean);
  const added: Quad[] = [];
  let counter = 0;
  for (const holder of [...new Set(quads.filter((q) => q.predicate.value === elody("fields")).map((q) => q.subject.value))]) {
    const items = listOf(objects(holder, elody("fields"))[0].object.value);
    const owner = ownerOf(holder);
    const properties = owner ? objects(owner, sh("property")).map((q) => q.object.value) : [];
    const propertyFor = (path: string) => {
      const candidates = properties.filter((p) => objects(p, sh("path"))[0]?.object.value === path);
      return candidates.find((p) => !objects(p, elody("alias")).length) ?? candidates[0];
    };
    const shape = blankNode(`fields${counter++}`);
    added.push(quad(holder.startsWith("_:") ? blankNode(holder.slice(2)) : namedNode(holder), namedNode(elody("shape")), shape));
    items.forEach((item, index) => {
      const field = blankNode(`field${counter++}`);
      const isOverride = item.startsWith("_:") || item.startsWith("n3-");
      const path = isOverride ? objects(item, sh("path"))[0]?.object.value : item;
      if (!path) return;
      added.push(quad(shape, namedNode(sh("property")), field), quad(field, namedNode(sh("path")), namedNode(path)), quad(field, namedNode(sh("order")), literal(index + 1)));
      const override = isOverride ? quads.filter((q) => q.subject.value === item && q.predicate.value !== sh("path") && q.predicate.value !== sh("order")) : [];
      const overridePredicates = new Set(override.map((q) => q.predicate.value));
      const property = propertyFor(path);
      if (property) {
        const inherited = quads.filter((q) => q.subject.value === property);
        const inheritsInput = !INPUT_TERMS.some((term) => overridePredicates.has(term));
        for (const q of inherited) {
          if (INPUT_TERMS.includes(q.predicate.value) ? inheritsInput : SINGLE_TERMS.includes(q.predicate.value) && !overridePredicates.has(q.predicate.value)) added.push(quad(field, q.predicate, q.object));
        }
      }
      for (const q of override) added.push(quad(field, q.predicate, q.object));
    });
  }
  return added;
}
