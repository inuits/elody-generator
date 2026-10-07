/**
 * Values found live in a linked-data source.
 *
 * A property whose candidates a SPARQL query names -- shui:searchQuery and
 * sh:in [ sh:select ], their pattern in one SERVICE block -- or a
 * shui:SubClassEditor whose class tree elody:classSource reads from an
 * endpoint, is a relation to resources of that source. Before a declaration is
 * read, each such property is spelled out in plain declaration terms:
 *
 *   <entity>-<key>-source a elody:EntityUi ;          # the source's Elody type
 *       elody:documentName "<Entity><Key>" ;
 *       elody:readsFrom [ a elody:SparqlSource ;
 *           elody:endpoint <...> ; elody:selectQuery "..." ; elody:searchQuery "..." ;
 *           elody:identifierEncoding "iri" ] ;
 *       sh:property <title (rdfs:label, LabelRole)>, <iri> ; elody:detail [...] .
 *   <property> elody:optionsFrom <entity>-<key>-source .
 *
 * The parser then renders the relation dropdown, the type's fragments and the
 * source description for collection-api (SPARQL_SOURCES) from those.
 */
import { DataFactory, type Quad, type Term } from "n3";
import { dash, elody, localName, rdf, rdfs, sh, shui, XSD } from "./vocab.js";

const { namedNode, blankNode, literal, quad } = DataFactory;

const RDFS_PREFIX = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n";

/**
 * A query whose whole pattern lies in one SERVICE block, as the endpoint and the
 * query to send there (its prologue kept, the SERVICE wrapper gone). None when
 * there is no SERVICE, or when patterns outside it would have to be joined.
 */
export function unwrapService(query: string): { endpoint: string; query: string } | undefined {
  const service = /SERVICE\s+(SILENT\s+)?<([^>]+)>\s*\{/i.exec(query);
  if (!service) return undefined;
  const where = /WHERE\s*\{/i.exec(query) ?? /\{/.exec(query);
  if (!where || where.index > service.index) return undefined;
  const open = service.index + service[0].length - 1;
  const close = matching(query, open);
  const whereOpen = where.index + where[0].length - 1;
  const whereClose = matching(query, whereOpen);
  if (close < 0 || whereClose < 0) return undefined;
  // nothing but the SERVICE block inside WHERE { }
  const before = query.slice(whereOpen + 1, service.index).trim();
  const after = query.slice(close + 1, whereClose).trim();
  if (before || after) return undefined;
  const inner = query.slice(open + 1, close);
  return {
    endpoint: service[2],
    query: `${query.slice(0, whereOpen + 1)}${inner}${query.slice(whereClose)}`,
  };
}

function matching(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      // skip a string literal
      const end = text.indexOf(c, i + 1);
      if (end < 0) return -1;
      i = end;
    } else if (c === "<") {
      const end = text.indexOf(">", i + 1);
      if (end > i && !/\s/.test(text.slice(i + 1, end))) i = end;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
}

export type ExternalSource = {
  endpoint: string;
  selectQuery: string;
  searchQuery?: string;
  kind: "search" | "subClass";
};

/** The live source a property shape reads its values from, if it has one. */
export function externalSourceOf(objects: (predicate: string) => Term[], bySubject: (subject: string) => Quad[]): ExternalSource | undefined {
  const value = (predicate: string) => objects(predicate)[0]?.value;
  const editor = value(shui("editor"));
  const classSource = value(elody("classSource"));
  const root = value(sh("rootClass"));
  if (editor === shui("SubClassEditor") && classSource && root) {
    const tree = `?value rdfs:subClassOf* <${root}>`;
    return {
      kind: "subClass",
      endpoint: classSource,
      selectQuery: `${RDFS_PREFIX}SELECT DISTINCT ?value WHERE { ${tree} }`,
      searchQuery:
        `${RDFS_PREFIX}SELECT DISTINCT ?value WHERE { ${tree} ; rdfs:label ?label .\n` +
        "  FILTER(CONTAINS(LCASE(STR(?label)), LCASE($searchTerm))) }",
    };
  }
  const search = value(shui("searchQuery"));
  const inList = objects(sh("in"))[0];
  const select =
    inList && inList.termType !== "Literal"
      ? bySubject(inList.value).find((q) => q.predicate.value === sh("select"))?.object.value
      : undefined;
  const queries = [select, search].filter((q): q is string => q !== undefined);
  if (!queries.some((q) => /\bSERVICE\b/i.test(q))) return undefined;
  const unwrapped = queries.map(unwrapService);
  if (unwrapped.some((u) => !u)) return undefined;
  const endpoints = new Set(unwrapped.map((u) => u!.endpoint));
  if (endpoints.size !== 1) return undefined;
  const [selectUnwrapped, searchUnwrapped] = select ? unwrapped : [undefined, unwrapped[0]];
  return {
    kind: "search",
    endpoint: [...endpoints][0],
    // without sh:in [ sh:select ] the search query lists everything for an empty term
    selectQuery: (selectUnwrapped ?? searchUnwrapped)!.query,
    searchQuery: searchUnwrapped?.query,
  };
}

const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** The triples that spell out every live-source property of a declaration. */
export function expandExternalSources(quads: Quad[]): Quad[] {
  const bySubject = new Map<string, Quad[]>();
  for (const q of quads) (bySubject.get(q.subject.value) ?? bySubject.set(q.subject.value, []).get(q.subject.value)!).push(q);
  const of = (subject: string) => bySubject.get(subject) ?? [];
  const objects = (subject: string) => (predicate: string) => of(subject).filter((q) => q.predicate.value === predicate).map((q) => q.object);
  const isEntity = (subject: string) => of(subject).some((q) => q.predicate.value === rdf("type") && q.object.value === elody("EntityUi"));

  const extra: Quad[] = [];
  const add = (s: Term, p: string, o: Term) => extra.push(quad(s as never, namedNode(p), o as never));
  const done = new Set<string>();
  for (const owner of quads) {
    if (owner.predicate.value !== sh("property") || !isEntity(owner.subject.value)) continue;
    const node = owner.object.value;
    if (done.has(node) || objects(node)(elody("optionsFrom")).length) continue;
    const source = externalSourceOf(objects(node), of);
    if (!source) continue;
    done.add(node);
    const entity = owner.subject.value;
    const key = objects(node)(elody("key"))[0]?.value ?? localName(objects(node)(sh("path"))[0]?.value ?? "value");
    const documentName = `${objects(entity)(elody("documentName"))[0]?.value ?? localName(entity)}${upperFirst(key)}`;
    const option = namedNode(`${entity}-${key}-source`);
    add(owner.object, elody("optionsFrom"), option);

    add(option, rdf("type"), namedNode(elody("EntityUi")));
    // a client with a GraphQL type per entity type gets one for the source's type too
    const parentType = objects(entity)(elody("graphqlType"))[0]?.value ?? "BaseEntity";
    add(option, elody("graphqlType"), literal(parentType === "BaseEntity" ? "BaseEntity" : documentName));
    add(option, elody("documentName"), literal(documentName));
    for (const emit of objects(entity)(elody("emit"))) add(option, elody("emit"), emit);
    const viewMode = blankNode();
    add(option, elody("viewMode"), viewMode);
    add(viewMode, elody("mode"), namedNode(elody("ListView")));

    const reads = blankNode();
    add(option, elody("readsFrom"), reads);
    add(reads, rdf("type"), namedNode(elody("SparqlSource")));
    add(reads, elody("endpoint"), namedNode(source.endpoint));
    add(reads, elody("selectQuery"), literal(source.selectQuery));
    if (source.searchQuery) add(reads, elody("searchQuery"), literal(source.searchQuery));
    add(reads, elody("identifierEncoding"), literal("iri"));

    // the resource's label is its title (Elody's dropdowns and pages show the title); its IRI links out
    const title = namedNode(`${option.value}-title`);
    add(option, sh("property"), title);
    add(title, sh("path"), namedNode(rdfs("label")));
    add(title, elody("key"), literal("title"));
    add(title, sh("name"), literal("Label", "en"));
    add(title, sh("name"), literal("Label", "nl"));
    add(title, sh("maxCount"), literal("1", namedNode(`${XSD}integer`)));
    add(title, sh("order"), literal("0", namedNode(`${XSD}integer`)));
    add(title, shui("propertyRole"), namedNode(shui("LabelRole")));
    add(title, dash("readOnly"), literal("true", namedNode(`${XSD}boolean`)));
    const iri = namedNode(`${option.value}-iri`);
    add(option, sh("property"), iri);
    add(iri, elody("key"), literal("iri"));
    add(iri, sh("name"), literal("IRI", "en"));
    add(iri, sh("name"), literal("IRI", "nl"));
    add(iri, sh("maxCount"), literal("1", namedNode(`${XSD}integer`)));
    add(iri, sh("order"), literal("1", namedNode(`${XSD}integer`)));
    add(iri, shui("viewer"), namedNode(shui("HyperlinkViewer")));
    add(iri, dash("readOnly"), literal("true", namedNode(`${XSD}boolean`)));

    // a read-only detail page: one panel with both
    const detail = blankNode(), column = blankNode(), element = blankNode();
    const group = namedNode(`${option.value}-details`);
    add(option, elody("detail"), detail);
    add(detail, elody("column"), column);
    add(column, elody("size"), namedNode(elody("Width100")));
    add(column, elody("element"), element);
    add(element, rdf("type"), namedNode(elody("WindowElement")));
    add(element, rdfs("label"), literal(documentName));
    add(element, elody("panel"), group);
    add(group, rdf("type"), namedNode(sh("PropertyGroup")));
    add(group, rdfs("label"), literal("Details", "en"));
    add(group, rdfs("label"), literal("Details", "nl"));
    add(group, elody("alias"), literal("details"));
    add(group, elody("showsUngrouped"), literal("true", namedNode(`${XSD}boolean`)));
    add(group, elody("panelKind"), namedNode(elody("MetadataPanel")));
    add(group, elody("collapsed"), literal("false", namedNode(`${XSD}boolean`)));
    add(group, sh("order"), literal("0", namedNode(`${XSD}integer`)));
  }
  return extra;
}

/** The source description collection-api reads (SPARQL_SOURCES), keyed by the Elody type. */
export type SparqlSourceJson = {
  endpoint: string;
  selectQuery: string;
  searchQuery?: string;
  identifierEncoding?: string;
  identifierPrefix?: string;
  language?: string;
  userAgent?: string;
  fields: Record<string, string>;
};
