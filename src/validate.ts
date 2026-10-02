/**
 * Meta-shape validation of a declaration: the ontology (for sh:class checks on
 * enumeration instances) plus the declaration form the data graph, the
 * meta-shapes the shapes graph. SHACL Core only, so the same shapes run under
 * pySHACL in CI.
 */
import { readFileSync } from "fs";
import rdf from "@zazuko/env";
import SHACLValidator from "rdf-validate-shacl";
import type { Quad } from "n3";
import { Reading } from "./reading.js";
import { META_SHAPES_PATH, ONTOLOGY_PATH } from "./ontology.js";
import { compact } from "./vocab.js";

export type ValidationIssue = {
  focusNode: string;
  path?: string;
  message: string;
  severity: string;
  shape?: string;
};

export type ValidationReport = { conforms: boolean; issues: ValidationIssue[] };

let shapesCache: Quad[] | undefined;
let ontologyCache: Quad[] | undefined;

const load = (path: string): Quad[] => Reading.parse(readFileSync(path, "utf-8")).quads();

export async function validateDeclaration(ttl: string): Promise<ValidationReport> {
  shapesCache ??= load(META_SHAPES_PATH);
  ontologyCache ??= load(ONTOLOGY_PATH);
  const reading = Reading.parse(ttl);
  const declaration = reading.quads();

  const shapes = rdf.dataset(shapesCache as never[]);
  const data = rdf.dataset([...ontologyCache, ...declaration] as never[]);
  const validator = new SHACLValidator(shapes, {
    factory: rdf as never,
    importGraph: async () => rdf.dataset(),
  } as never);
  const report = await validator.validate(data);

  const issues: ValidationIssue[] = report.results.map((result) => ({
    focusNode: result.focusNode?.value ?? "",
    path: (result.path as { value?: string } | null)?.value,
    message: result.message.map((term) => term.value).join(" "),
    severity: result.severity?.value.split("#").pop() ?? "Violation",
    shape: (result.sourceShape as { value?: string } | null)?.value,
  }));
  if (reading.usedLegacyNamespace)
    issues.unshift({
      focusNode: "",
      message: reading.warnings[0]?.message ?? "legacy namespace",
      severity: "Violation",
    });
  return { conforms: report.conforms && !reading.usedLegacyNamespace, issues };
}

export function formatIssue(issue: ValidationIssue): string {
  if (!issue.focusNode) return `${issue.severity}: ${issue.message}`;
  const focus = issue.focusNode.startsWith("_:") || /^n3-/.test(issue.focusNode) ? "(blank node)" : compact(issue.focusNode);
  const path = issue.path ? ` ${compact(issue.path)}` : "";
  return `${issue.severity}: ${focus}${path}: ${issue.message}`;
}
