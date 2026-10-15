/**
 * The selection overlay: which document paths of a client's entities are
 * analysed, as a W3C Data Cube structure (qb:) with the analytics terms of
 * ea: (ontology/analytics.ttl). Generated once from the reviewed candidates,
 * then edited by hand: every left-out path is written as a commented
 * component, so switching one on is removing a `#`.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import rdfEnv from "@zazuko/env";
import { Parser, type Quad } from "n3";
import SHACLValidator from "rdf-validate-shacl";
import { Reading } from "../reading.js";
import type { ValidationIssue, ValidationReport } from "../validate.js";
import { rdfs } from "../vocab.js";
import { pathSegments, type Candidate, type Role } from "./inventory.js";
import type { Schema } from "./storage.js";

export const QB = "http://purl.org/linked-data/cube#";
export const EA = "https://elody.eu/ns/analytics#";
export const EM = "https://elody.io/ns/metadata#";
const qb = (local: string) => `${QB}${local}`;
const ea = (local: string) => `${EA}${local}`;

const moduleRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** The analytics terms (ea:) and the shapes an overlay conforms to (this module). */
export const ANALYTICS_VOCABULARY_PATH = join(moduleRoot, "ontology", "analytics.ttl");
export const ANALYTICS_SHAPES_PATH = join(moduleRoot, "ontology", "analytics.shapes.ttl");

export type OverlayDimension = {
  property: string;
  sourcePath: string;
  /** `EntityType` or `Time`; a plain dimension has none */
  role?: string;
  multiValued: boolean;
  labelKey?: string;
  label?: string;
};

export type Overlay = {
  cube: string;
  sourceCollections: string[];
  /** where the documents keep their values (storage.ts); v2 when the overlay does not say */
  schema: Schema;
  entityTypes: string[];
  dimensions: OverlayDimension[];
  measures: string[];
};

export type OverlayOptions = {
  client: string;
  collections: string[];
  /** the client's document schema (client.json `schema`) */
  schema?: Schema;
  /** where the candidates came from, named in the header */
  source?: string;
};

/** Segments that say nothing alone: `audit.created.at` is `created_at`, not `at`. */
const GENERIC = new Set(["at", "by", "key", "value", "id"]);

const snake = (segment: string) => segment.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9_]/g, "_").toLowerCase();

/**
 * The local name of each path's property: the last meaningful segment (the
 * one before `.value`), the one before it too when the last says nothing
 * alone; paths whose names clash take one segment more until they differ.
 */
export function propertyNames(paths: string[]): Map<string, string> {
  const meaningful = new Map(paths.map((path) => [path, pathSegments(path).filter((segment) => segment !== "value").map(snake)]));
  const width = new Map(paths.map((path) => {
    const segments = meaningful.get(path)!;
    return [path, segments.length > 1 && GENERIC.has(segments.at(-1)!) ? 2 : 1];
  }));
  const nameOf = (path: string) => meaningful.get(path)!.slice(-width.get(path)!).join("_");
  for (let round = 0; round < 10; round += 1) {
    const byName = new Map<string, string[]>();
    for (const path of paths) byName.set(nameOf(path), [...(byName.get(nameOf(path)) ?? []), path]);
    const clashes = [...byName.values()].filter((group) => group.length > 1);
    if (!clashes.length) break;
    for (const group of clashes) for (const path of group) width.set(path, Math.min(width.get(path)! + 1, meaningful.get(path)!.length));
  }
  return new Map(paths.map((path) => {
    const name = nameOf(path) || "path";
    return [path, /^[A-Za-z_]/.test(name) ? name : `_${name}`];
  }));
}

const ROLE_ORDER: Role[] = ["entity_type", "time", "dimension", "audit", "relation", "identifier", "text"];
const ROLE_TERM: Partial<Record<Role, string>> = { entity_type: "ea:EntityType", time: "ea:Time" };

const literal = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function component(entry: Candidate, name: string): string {
  const parts = [`qb:dimension em:${name}`, `ea:sourcePath ${literal(entry.path)}`];
  // the role only when it is the included one: a left-out date switched on is a plain dimension, not a second time
  if (entry.include && ROLE_TERM[entry.role]) parts.push(`ea:role ${ROLE_TERM[entry.role]}`);
  parts.push(`ea:labelKey ${literal(entry.labelKey)}`);
  if (entry.labelNl) parts.push(`rdfs:label ${literal(entry.labelNl)}@nl`);
  return `qb:component [ ${parts.join(" ; ")} ] ;`;
}

/** The overlay's Turtle: the included candidates as components, the left-out ones commented, by role. */
export function renderOverlay(candidates: Candidate[], options: OverlayOptions): string {
  const names = propertyNames(candidates.map((entry) => entry.path));
  const sorted = [...candidates].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.path.localeCompare(b.path));
  const included = sorted.filter((entry) => entry.include);
  const excluded = sorted.filter((entry) => !entry.include);
  const entityTypes = [...new Set(candidates.filter((entry) => entry.role === "entity_type").flatMap((entry) => entry.typeValues))].sort();
  const collections = [...new Set(options.collections)].sort();

  const describe = (entry: Candidate) =>
    `# ${entry.labelNl ?? entry.labelKey} — ${entry.filterKinds.join(", ")}, ${entry.occurrences} filter(s) on ${entry.entityTypes.slice(0, 4).join(", ")}${entry.entityTypes.length > 4 ? ", …" : ""}`;
  const lines = [
    `@prefix qb:    <${QB}> .`,
    `@prefix ea:    <${EA}> .`,
    `@prefix em:    <${EM}> .`,
    `@prefix rdfs:  <${rdfs("")}> .`,
    `@prefix ${options.client}: <https://elody.eu/analytics/${options.client}#> .`,
    "",
    `# The analytics selection of ${options.client}: which document paths are analysed, as a W3C Data Cube structure.`,
    `# Generated by \`elody-ui analytics overlay\`${options.source ? ` from ${options.source}` : ""}; edit it by hand from here on.`,
    "# A dimension is switched off by commenting its qb:component line, switched on by uncommenting one under",
    "# \"left out\". Exactly one component has ea:role ea:Time and one ea:role ea:EntityType;",
    "# `elody-ui analytics validate <this file>` checks that.",
    "",
    `${options.client}:EntityActivity a qb:DataStructureDefinition ;`,
    `  rdfs:label "Aangemaakte entiteiten"@nl ;`,
    `  ea:sourceCollection ${collections.map(literal).join(" , ")} ;`,
    `  ea:documentSchema ${literal(options.schema ?? "v2")} ;`,
    `  ea:entityTypes`,
    ...chunk(entityTypes.map(literal), 6).map((row, index, rows) => `    ${row.join(" , ")}${index === rows.length - 1 ? " ;" : " ,"}`),
    "",
    ...included.flatMap((entry) => [`  ${describe(entry)}`, `  ${component(entry, names.get(entry.path)!)}`]),
    "",
  ];
  let role: Role | undefined;
  for (const entry of excluded) {
    if (entry.role !== role) {
      role = entry.role;
      lines.push(`  # left out — ${role}`);
    }
    lines.push(`  ${describe(entry)} — ${entry.reason}`, `#   ${component(entry, names.get(entry.path)!)}`);
  }
  lines.push("", "  qb:component [ qb:measure ea:entityCount ; qb:order 1 ] .", "");
  return lines.join("\n");
}

function chunk<T>(values: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < values.length; index += size) rows.push(values.slice(index, index + size));
  return rows.length ? rows : [[]];
}

/** The overlay as the later steps read it: the first qb:DataStructureDefinition, its components in document order. */
export function readOverlay(ttl: string): Overlay {
  const reading = new Reading(new Parser().parse(ttl));
  const [cube] = reading.subjectsOfType(qb("DataStructureDefinition"));
  if (!cube) throw new Error("no qb:DataStructureDefinition in the overlay");
  const components = reading.nodes(cube, qb("component"));
  return {
    cube,
    sourceCollections: reading.literals(cube, ea("sourceCollection")).sort(),
    schema: reading.value(cube, ea("documentSchema")) === "v1" ? "v1" : "v2",
    entityTypes: reading.literals(cube, ea("entityTypes")).sort(),
    dimensions: components
      .filter((node) => reading.has(node, qb("dimension")))
      .map((node) => ({
        property: reading.node(node, qb("dimension"))!,
        sourcePath: reading.value(node, ea("sourcePath")) ?? "",
        role: reading.node(node, ea("role"))?.replace(EA, ""),
        multiValued: reading.literal(node, ea("multiValued")) === true,
        labelKey: reading.value(node, ea("labelKey")),
        label: reading.value(node, rdfs("label")),
      })),
    measures: components.flatMap((node) => reading.nodes(node, qb("measure"))),
  };
}

let shapesCache: Quad[] | undefined;
let vocabularyCache: Quad[] | undefined;

/** The overlay against the analytics shapes, plus what SHACL Core cannot say: one dimension per source path. */
export async function validateOverlay(ttl: string): Promise<ValidationReport> {
  let quads: Quad[];
  try {
    quads = new Parser().parse(ttl);
  } catch (error) {
    return { conforms: false, issues: [{ focusNode: "", message: `does not parse: ${(error as Error).message}`, severity: "Violation" }] };
  }
  shapesCache ??= new Parser().parse(readFileSync(ANALYTICS_SHAPES_PATH, "utf-8"));
  vocabularyCache ??= new Parser().parse(readFileSync(ANALYTICS_VOCABULARY_PATH, "utf-8"));
  const validator = new SHACLValidator(rdfEnv.dataset(shapesCache as never[]), { factory: rdfEnv as never, importGraph: async () => rdfEnv.dataset() } as never);
  const report = await validator.validate(rdfEnv.dataset([...vocabularyCache, ...quads] as never[]));
  const issues: ValidationIssue[] = report.results.map((result) => ({
    focusNode: result.focusNode?.value ?? "",
    path: (result.path as { value?: string } | null)?.value,
    message: result.message.map((term) => term.value).join(" "),
    severity: result.severity?.value.split("#").pop() ?? "Violation",
    shape: (result.sourceShape as { value?: string } | null)?.value,
  }));
  const reading = new Reading(quads);
  for (const cube of reading.subjectsOfType(qb("DataStructureDefinition"))) {
    const paths = reading.nodes(cube, qb("component")).flatMap((node) => reading.values(node, ea("sourcePath")));
    for (const path of new Set(paths.filter((path, index) => paths.indexOf(path) !== index)))
      issues.push({ focusNode: cube, path: ea("sourcePath"), message: `two dimensions read "${path}": one dimension per source path`, severity: "Violation" });
  }
  return { conforms: issues.length === 0, issues };
}
