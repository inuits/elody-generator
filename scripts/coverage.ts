/**
 * Coverage of the elody: ontology against the platform: GraphQL schema enums
 * and building-block types (baseGraphql + modules), and the PWA components
 * that render them. Writes JSON for the report.
 *
 * usage: tsx scripts/coverage.ts <elody-common root> [out.json]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { Ontology } from "../src/ontology.js";
import { elody } from "../src/vocab.js";

const root = process.argv[2] ?? "../..";
const out = process.argv[3] ?? "coverage.json";
const o = Ontology.load();
const r = o.reading;

// -- schema sources: baseGraphql + every module's *.schema.ts -------------------
const walk = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", "generated-types", "__mock__", "types"].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else if (name.endsWith(".schema.ts")) acc.push(path);
  }
  return acc;
};
const schemaFiles = walk(join(root, "modules"));
const schemaText = schemaFiles.map((file) => readFileSync(file, "utf-8")).join("\n");

const enumValues = (name: string): string[] => {
  const values = new Set<string>();
  for (const match of schemaText.matchAll(new RegExp(`(?:extend\\s+)?enum\\s+${name}\\s*\\{([^}]*)\\}`, "g")))
    for (const line of match[1].split("\n")) {
      const value = line.replace(/#.*/, "").trim().match(/^([A-Za-z_][\w-]*)/)?.[1];
      if (value) values.add(value);
    }
  return [...values];
};

const typeFields = (name: string): string[] => {
  const match = schemaText.match(new RegExp(`\\btype\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  if (!match) return [];
  return [...match[1].matchAll(/^\s{4}(\w+)\s*[(:]/gm)].map((m) => m[1]);
};

// -- ontology side --------------------------------------------------------------
const instanceValues = (classIri: string) =>
  r.subjectsOfType(classIri).map((iri) => ({ iri, value: r.value(iri, elody("enumValue"))! }));
const annotationValues = (predicate: string) =>
  [...new Set(r.subjects().flatMap((s) => r.literals(s, predicate)).filter(Boolean))];

type EnumRow = {
  schemaEnum: string;
  ontology: string;
  matched: string[];
  missingInOntology: string[];
  notInSchema: string[];
};

const enumPairs: [string, string, string[]][] = [
  ["ViewModes", "elody:ViewMode", instanceValues(elody("ViewMode")).map((x) => x.value)],
  ["AdvancedFilterTypes", "elody:FilterKind", instanceValues(elody("FilterKind")).map((x) => x.value)],
  ["PanelType", "elody:PanelKind", instanceValues(elody("PanelKind")).map((x) => x.value)],
  ["ColumnSizes", "elody:ColumnSize", instanceValues(elody("ColumnSize")).map((x) => x.value)],
  ["TypeModals", "elody:ModalKind", instanceValues(elody("ModalKind")).map((x) => x.value)],
  ["BulkOperationTypes", "elody:BulkOperationKind", instanceValues(elody("BulkOperationKind")).map((x) => x.value)],
  ["ContextMenuElodyActionEnum", "elody:ActionKind", instanceValues(elody("ActionKind")).map((x) => x.value)],
  ["ActionContextViewModeTypes", "elody:InteractionMode", instanceValues(elody("InteractionMode")).map((x) => x.value)],
  ["ActionContextEntitiesSelectionType", "elody:SelectionState", instanceValues(elody("SelectionState")).map((x) => x.value)],
  ["Permission", "elody:Permission", instanceValues(elody("Permission")).map((x) => x.value)],
  ["SearchInputType", "elody:SearchInputKind", instanceValues(elody("SearchInputKind")).map((x) => x.value)],
  ["SortingDirection", "elody:SortDirection", instanceValues(elody("SortDirection")).map((x) => x.value)],
  ["Unit", "elody:Unit", instanceValues(elody("Unit")).map((x) => x.value)],
  ["KeyValueSource", "elody:ValueSource", instanceValues(elody("ValueSource")).map((x) => x.value)],
  ["InputFieldTypes", "elody:inputFieldType (editors)", annotationValues(elody("inputFieldType"))],
  ["BaseFieldType", "elody:formFieldType (editors)", annotationValues(elody("formFieldType"))],
  ["CustomFormatterTypes", "elody:formatterValue (viewers)", annotationValues(elody("formatterValue"))],
  ["ContextMenuFormFlow", "elody:formFlow (open string)", []],
  ["EntityListViewMode", "— (no term)", []],
  ["BaseLibraryModes", "— (no term)", []],
  ["WindowElementLayout", "— (no term)", []],
  ["ElodyViewers", "— (no term)", []],
];

const enums: EnumRow[] = enumPairs.map(([schemaEnum, ontology, ontologyValues]) => {
  const schema = enumValues(schemaEnum);
  return {
    schemaEnum,
    ontology,
    matched: schema.filter((v) => ontologyValues.includes(v)),
    missingInOntology: schema.filter((v) => !ontologyValues.includes(v)),
    notInSchema: ontologyValues.filter((v) => !schema.includes(v)),
  };
});

// -- building blocks: which GraphQL fields a declaration can produce ------------------
// status: "rendered" = ontology term + generator emits it; "ontology" = term exists,
// generator ignores it; absent = no term.
type FieldMap = Record<string, { term: string; status: "rendered" | "ontology" }>;
const blocks: Record<string, FieldMap> = {
  EntityViewElements: {
    windowElement: { term: "elody:WindowElement", status: "rendered" },
    entityListElement: { term: "elody:ListElement", status: "rendered" },
    markdownViewerElement: { term: "elody:MarkdownElement", status: "rendered" },
    mediaFileElement: { term: "elody:MediaFileElement", status: "ontology" },
    singleMediaFileElement: { term: "elody:SingleMediaFileElement", status: "ontology" },
    mapElement: { term: "elody:MapElement", status: "ontology" },
    graphElement: { term: "elody:GraphElement", status: "ontology" },
    hierarchyListElement: { term: "elody:HierarchyListElement", status: "ontology" },
    manifestViewerElement: { term: "elody:ManifestViewerElement", status: "ontology" },
    entityViewerElement: { term: "elody:EntityViewerElement", status: "ontology" },
    actionElement: { term: "elody:ActionElement", status: "ontology" },
    wysiwygElement: { term: "elody:WysiwygElement", status: "ontology" },
    commentsElement: { term: "elody:CommentsElement", status: "ontology" },
  },
  Column: {
    size: { term: "elody:size", status: "rendered" },
    elements: { term: "elody:element", status: "rendered" },
  },
  WindowElement: {
    label: { term: "rdfs:label", status: "rendered" },
    panels: { term: "elody:panel", status: "rendered" },
    expandButtonOptions: { term: "elody:expandButton", status: "rendered" },
  },
  WindowElementPanel: {
    panelHeaderContent: { term: "rdfs:label", status: "rendered" },
    panelType: { term: "elody:panelKind", status: "rendered" },
    isEditable: { term: "dash:readOnly", status: "rendered" },
    isCollapsed: { term: "elody:collapsed", status: "rendered" },
    metaData: { term: "elody:field → property shape", status: "rendered" },
  },
  PanelMetaData: {
    label: { term: "rdfs:label", status: "rendered" },
    key: { term: "sh:name", status: "rendered" },
    unit: { term: "elody:unit", status: "rendered" },
    colSpan: { term: "elody:colSpan", status: "rendered" },
    inputField: { term: "shui:editor / inferred", status: "rendered" },
    hiddenField: { term: "dash:hidden", status: "ontology" },
    defaultValue: { term: "sh:defaultValue", status: "ontology" },
    disabled: { term: "dash:readOnly", status: "ontology" },
    tooltip: { term: "sh:description", status: "ontology" },
    isMultilingual: { term: "rdf:langString → *WithLangEditor", status: "ontology" },
  },
  InputField: {
    type: { term: "shui:editor / inferred", status: "rendered" },
    validation: { term: "sh:minCount (required only)", status: "rendered" },
    options: { term: "sh:in", status: "ontology" },
    relationType: { term: "elody:relationType", status: "ontology" },
    multiple: { term: "sh:maxCount", status: "ontology" },
  },
  EntityListElement: {
    label: { term: "rdfs:label", status: "rendered" },
    isCollapsed: { term: "elody:collapsed", status: "rendered" },
    entityTypes: { term: "elody:entityTypes", status: "rendered" },
    relationType: { term: "elody:relationType", status: "rendered" },
    customQuery: { term: "elody:customQuery", status: "rendered" },
    customQueryFilters: { term: "elody:customQueryFilters", status: "rendered" },
    searchInputType: { term: "elody:searchInput", status: "rendered" },
    customBulkOperations: { term: "elody:customBulkOperations", status: "rendered" },
    customQueryEntityPickerList: { term: "elody:picker", status: "rendered" },
    customQueryEntityPickerListFilters: { term: "elody:picker", status: "rendered" },
  },
  MarkdownViewerElement: {
    label: { term: "rdfs:label", status: "rendered" },
    isCollapsed: { term: "elody:collapsed", status: "rendered" },
    markdownContent: { term: "elody:metadataKey", status: "rendered" },
  },
};
const blockRows = Object.entries(blocks).map(([type, map]) => {
  const fields = typeFields(type);
  return {
    type,
    fields: fields.map((field) => ({ field, term: map[field]?.term, status: map[field]?.status ?? "missing" })),
    staleTerms: Object.keys(map).filter((field) => !fields.includes(field)),
  };
});

// -- PWA components ---------------------------------------------------------------
const pwa = join(root, "inuits-dams-pwa", "src", "components");
const listVue = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith(".vue")) : []);

const viewModeComponents = listVue(join(pwa, "library", "view-modes")).filter((n) => n.startsWith("ViewModes"));
const viewModes = enumValues("ViewModes").map((mode) => ({
  schema: mode,
  ontology: o.instanceFor(elody("ViewMode"), mode)?.replace(elody(""), "elody:"),
  component: viewModeComponents.find((c) => c === `${mode}.vue`) ?? (mode === "ViewModesGrid" ? "ViewModesList.vue (grid layout)" : undefined),
}));

const elementComponent: Record<string, string> = {
  entityViewerElement: "—", markdownViewerElement: "EntityElementMarkdownViewer.vue", manifestViewerElement: "EntityElementManifestViewer.vue",
  entityListElement: "EntityElementList.vue", mediaFileElement: "EntityElementMedia.vue", singleMediaFileElement: "EntityElementSingleMedia.vue",
  graphElement: "EntityElementGraph.vue", windowElement: "EntityElementWindow.vue", actionElement: "—", wysiwygElement: "WYSIWYG/EntityElementWYSIWYG.vue",
  mapElement: "EntityElementMapViewer.vue", hierarchyListElement: "EntityElementHierarchyListViewer.vue", commentsElement: "comments/EntityElementComments.vue",
  shaclShapeElement: "EntityElementShaclShape.vue",
};
// element class per schema field, read from the ontology (elody:schemaField)
const elementTerm: Record<string, string> = Object.fromEntries(
  r.subjects()
    .filter((subject) => r.value(subject, elody("schemaField")))
    .map((subject) => [r.value(subject, elody("schemaField"))!, subject.replace(elody(""), "elody:")]),
);
const RENDERED_ELEMENTS = ["windowElement", "entityListElement", "markdownViewerElement", "shaclShapeElement"];
const schemaElements = typeFields("EntityViewElements");
const elements = [...new Set([...schemaElements, ...Object.keys(elementTerm)])].map((field) => ({
  element: field,
  inSchema: schemaElements.includes(field),
  ontology: elementTerm[field],
  rendered: RENDERED_ELEMENTS.includes(field),
  component: elementComponent[field],
  componentExists: elementComponent[field] && elementComponent[field] !== "—"
    ? existsSync(join(pwa, "entityElements", elementComponent[field])) : false,
}));

const formatterComponents = listVue(join(pwa, "metadata")).filter((n) => /Formatter/.test(n));
const formatters = enumValues("CustomFormatterTypes").map((value) => ({
  schema: value,
  ontology: o.viewerFor(value)?.replace(elody(""), "elody:"),
  component: formatterComponents.find((c) => c.toLowerCase().includes(value.replace("Match", "").toLowerCase())),
}));

const usedInputTypes = new Set<string>();
const scanUsage = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { if (name !== "__tests__") scanUsage(path); continue; }
    if (!/\.(vue|ts)$/.test(name)) continue;
    for (const m of readFileSync(path, "utf-8").matchAll(/InputFieldTypes\.(\w+)/g)) usedInputTypes.add(m[1]);
  }
};
scanUsage(join(root, "inuits-dams-pwa", "src"));
const inputTypes = enumValues("InputFieldTypes").map((value) => {
  const editors = r.subjectsWith(elody("inputFieldType"), value).map((e) => e.replace("http://www.w3.org/ns/shacl-ui/", "shui:").replace(elody(""), "elody:"));
  const pascal = value.charAt(0).toUpperCase() + value.slice(1);
  return { schema: value, editors, pwaReferencesEnum: usedInputTypes.has(pascal) };
});

const report = {
  generatedOn: new Date().toISOString().slice(0, 10),
  schemaFiles: schemaFiles.map((f) => f.replace(root + "/", "")),
  ontologyTerms: o.terms().length,
  enums,
  blocks: blockRows,
  viewModes,
  elements,
  formatters,
  inputTypes,
};
writeFileSync(out, JSON.stringify(report, null, 2));

// console summary
for (const e of enums)
  console.log(`${e.schemaEnum.padEnd(36)} ${String(e.matched.length).padStart(3)} ok  ${String(e.missingInOntology.length).padStart(3)} missing  ${e.notInSchema.length ? "NOT IN SCHEMA: " + e.notInSchema.join(", ") : ""}`);
for (const b of blockRows) {
  const count = (s: string) => b.fields.filter((f) => f.status === s).length;
  console.log(`${b.type.padEnd(22)} ${b.fields.length} fields: ${count("rendered")} rendered, ${count("ontology")} ontology-only, ${count("missing")} missing ${b.staleTerms.length ? "STALE: " + b.staleTerms.join(",") : ""}`);
}
console.log("elements", elements.map((e) => `${e.element}${e.inSchema ? "" : "(not on master)"}:${e.ontology ?? "-"}`).join(" | "));
console.log("formatters", JSON.stringify(formatters));
console.log("viewModes", JSON.stringify(viewModes));
