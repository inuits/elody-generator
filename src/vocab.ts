/**
 * The namespaces a declaration may use, each in one constant. The SHACL-UI
 * spec is an Editor's Draft: the draft declares `http://www.w3.org/ns/shacl-ui/`,
 * older files use `…shacl-ui#`; both are read, the draft form is written.
 * The elody: namespace moved from elody.io to elody.eu in 0.1; the old form is
 * read for one release with a deprecation warning.
 */
export const SH = "http://www.w3.org/ns/shacl#";
export const SHUI = "http://www.w3.org/ns/shacl-ui/";
export const SHUI_LEGACY = "http://www.w3.org/ns/shacl-ui#";
export const DASH = "http://datashapes.org/dash#";
export const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
export const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
export const XSD = "http://www.w3.org/2001/XMLSchema#";
export const OWL = "http://www.w3.org/2002/07/owl#";
export const DCTERMS = "http://purl.org/dc/terms/";
export const ELODY = "https://elody.eu/ns/ui#";
export const ELODY_LEGACY = "https://elody.io/ns/ui#";

export const sh = (local: string) => `${SH}${local}`;
export const shui = (local: string) => `${SHUI}${local}`;
export const dash = (local: string) => `${DASH}${local}`;
export const rdf = (local: string) => `${RDF}${local}`;
export const rdfs = (local: string) => `${RDFS}${local}`;
export const xsd = (local: string) => `${XSD}${local}`;
export const elody = (local: string) => `${ELODY}${local}`;

/** Rewrites a legacy namespace to its current form; returns the IRI unchanged otherwise. */
export function normaliseIri(iri: string): string {
  if (iri.startsWith(ELODY_LEGACY)) return ELODY + iri.slice(ELODY_LEGACY.length);
  if (iri.startsWith(SHUI_LEGACY)) return SHUI + iri.slice(SHUI_LEGACY.length);
  return iri;
}

export const localName = (iri: string): string => {
  let cut = Math.max(iri.lastIndexOf("#"), iri.lastIndexOf("/"));
  if (cut === -1) cut = iri.lastIndexOf(":"); // URNs: urn:ex:title → title
  return cut === -1 ? iri : iri.slice(cut + 1);
};

/** Compact an IRI to a prefixed name for messages. */
export function compact(iri: string): string {
  const prefixes: [string, string][] = [
    [ELODY, "elody"], [SH, "sh"], [SHUI, "shui"], [DASH, "dash"], [RDF, "rdf"], [RDFS, "rdfs"], [XSD, "xsd"],
  ];
  for (const [ns, prefix] of prefixes)
    if (iri.startsWith(ns)) return `${prefix}:${iri.slice(ns.length)}`;
  return `<${iri}>`;
}
