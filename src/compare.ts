/**
 * `compare`: is the GraphQL generated from a declaration the GraphQL the
 * client uses today? Both sides are read the way the graphql-service's codegen
 * reads them: every `*.queries.ts` below the source directory, the `gql`
 * template literals extracted, parsed with graphql-js. The comparison is per
 * definition (fragment or operation, by name). Whitespace, comments,
 * `__typename` and the quoting of a string literal do not count; the order of
 * fields and arguments does, because it drives the order in the UI.
 *
 * A definition is `equal`, `differs` (with the path to the first difference),
 * `missing` (the client has it, the generator does not), `extra` (generated,
 * but the client has no such definition) or `out-of-scope` (excluded by the
 * scope file, which names the gap that explains why).
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, join, relative } from "path";
import { Kind, parse, print, visit } from "graphql";
import type { ASTNode, DocumentNode, FragmentDefinitionNode, OperationDefinitionNode, SelectionNode, SelectionSetNode } from "graphql";
import { generate } from "./generate.js";
import type { Ontology } from "./ontology.js";
import { readUiDeclaration } from "./parse.js";
import { fileTargetFor } from "./generate.js";

export type DefinitionKind = "fragment" | "query" | "mutation" | "subscription";
export type ExecutableDefinition = FragmentDefinitionNode | OperationDefinitionNode;

export type Definition = {
  name: string;
  kind: DefinitionKind;
  file: string;
  node: ExecutableDefinition;
  normalized: string;
};

export type QueryFile = { path: string; source: string };

export type ReadResult = {
  definitions: Definition[];
  duplicates: { name: string; files: string[] }[];
  errors: { file: string; message: string }[];
};

export type Status = "equal" | "differs" | "missing" | "extra" | "out-of-scope";

export type DefinitionResult = {
  name: string;
  kind: DefinitionKind;
  status: Status;
  clientFile?: string;
  generatedFile?: string;
  /** differs: where the first difference is */
  path?: string;
  /** out-of-scope: the gap that explains the exclusion */
  gap?: string;
  /** equal once the fields the generated side asks back beyond the client's are left out */
  asksMore?: boolean;
};

export type FileResult = {
  file: string;
  status: Status;
  definitions: number;
  equal: number;
  differs: number;
  missing: number;
  extra: number;
  outOfScope: number;
};

export type Summary = {
  total: number;
  equal: number;
  differs: number;
  missing: number;
  extra: number;
  outOfScope: number;
  /** equal as a percentage of the definitions in scope (total minus out-of-scope) */
  percentEqual: number;
};

/** What a client leaves out of the comparison, each with the gap id that explains it. */
export type Scope = {
  outOfScope?: Record<string, string>;
  outOfScopeFiles?: Record<string, string>;
  /** generated definitions the client has no counterpart for, each with the gap that explains it */
  outOfScopeGenerated?: Record<string, string>;
};

export type Comparison = {
  definitions: DefinitionResult[];
  files: FileResult[];
  summary: Summary;
  duplicates: { side: "client" | "generated"; name: string; files: string[] }[];
  errors: { side: "client" | "generated"; file: string; message: string }[];
};

export type CompareReport = Comparison & {
  client: string;
  declaration: string;
};

const simpleEscapes: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };

/** A template literal's text as the tag function receives it: the escape sequences cooked. */
export function cookTemplateLiteral(raw: string): string {
  return raw.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|\r?\n|.)/gs, (_, sequence: string, brace?: string, unicode?: string, hex?: string) => {
    if (brace) return String.fromCodePoint(parseInt(brace, 16));
    if (unicode) return String.fromCharCode(parseInt(unicode, 16));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    if (sequence === "\n" || sequence === "\r\n") return "";
    return simpleEscapes[sequence] ?? sequence;
  });
}

/** The `gql` template literals of a TypeScript module, in order, as the tag receives them. */
export function extractGqlDocuments(source: string): string[] {
  const documents: string[] = [];
  const open = /\bgql\s*`/g;
  let match: RegExpExecArray | null;
  while ((match = open.exec(source))) {
    let index = match.index + match[0].length;
    let raw = "";
    while (index < source.length && source[index] !== "`") {
      if (source[index] === "\\" && index + 1 < source.length) {
        raw += source[index] + source[index + 1];
        index += 2;
        continue;
      }
      raw += source[index];
      index += 1;
    }
    documents.push(cookTemplateLiteral(raw));
    open.lastIndex = index + 1;
  }
  return documents;
}

/** Every `*.queries.ts` below `dir`, as paths relative to it, sorted. */
export function queryFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current).sort()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(".queries.ts")) found.push(relative(dir, path));
    }
  };
  walk(dir);
  return found.sort();
}

export const readQueryFiles = (dir: string): QueryFile[] =>
  queryFiles(dir).map((path) => ({ path, source: readFileSync(join(dir, path), "utf-8") }));

const kindOf = (node: ExecutableDefinition): DefinitionKind =>
  node.kind === Kind.FRAGMENT_DEFINITION ? "fragment" : node.operation;

/** The fragments and operations of a set of query files, by name; the first definition wins a duplicate name. */
export function readDefinitions(files: QueryFile[]): ReadResult {
  const definitions: Definition[] = [];
  const seen = new Map<string, string[]>();
  const errors: ReadResult["errors"] = [];
  for (const file of files) {
    for (const source of extractGqlDocuments(file.source)) {
      let document: DocumentNode;
      try {
        document = parse(source, { noLocation: true });
      } catch (error) {
        errors.push({ file: file.path, message: error instanceof Error ? error.message : String(error) });
        continue;
      }
      for (const node of document.definitions) {
        if (node.kind !== Kind.FRAGMENT_DEFINITION && node.kind !== Kind.OPERATION_DEFINITION) continue;
        const name = node.name?.value ?? "(anonymous)";
        const files = seen.get(name);
        if (files) {
          files.push(file.path);
          continue;
        }
        seen.set(name, [file.path]);
        definitions.push({ name, kind: kindOf(node), file: file.path, node, normalized: normalizeDefinition(node) });
      }
    }
  }
  const duplicates = [...seen.entries()].filter(([, files]) => files.length > 1).map(([name, files]) => ({ name, files }));
  return { definitions, duplicates, errors };
}

/**
 * Where the order of fields decides what the user sees, it counts: the fields on the card
 * (teaserMetadata), in a panel, in a form, the filters, the elements of a column, the
 * columns, the context menu actions. Everywhere else the PWA reads an object by name
 * (the initial values, the settings of an element, a panel or a filter, the fields asked
 * back for a bulk option), so the order is the writer's and does not count.
 */
const ORDERED_PARENTS = new Set(["teaserMetadata", "elements", "formFields", "advancedFilters", "contextMenuActions", "entityView", "steps"]);
/** Parents whose children are settings (free) except these content children (ordered, kept in place after the settings). */
const CONTENT_CHILDREN: Record<string, (name: string) => boolean> = {
  panels: (name) => !["panelHeaderContent", "label", "panelType", "isCollapsed", "isEditable", "canBeMultipleColumns", "bulkData", "can", "info", "displayCondition", "repetitionConfig"].includes(name),
  windowElement: (name) => name === "panels",
  column: (name) => name === "elements",
  GetDynamicForm: (name) => name === "formTab",
  formTab: (name) => name === "formFields",
  GetRepetitiveForm: (name) => name === "steps",
  PreviewElement: (name) => name === "column",
};
const selectionName = (selection: SelectionNode): string =>
  selection.kind === Kind.FIELD ? (selection.alias?.value ?? selection.name.value) : selection.kind === Kind.INLINE_FRAGMENT ? `... on ${selection.typeCondition?.name.value ?? ""}` : `...${selection.name.value}`;
const byName = (a: { name: { value: string } }, b: { name: { value: string } }) => a.name.value.localeCompare(b.name.value);

/** The definition without `__typename`, comments or location, string literals unquoted the same way, named things in a fixed order. */
export function normalizeNode<T extends ASTNode>(node: T): T {
  return visit(node, {
    Field: {
      enter: (field) =>
        field.name.value === "__typename" ? null : field.alias && field.alias.value === field.name.value ? { ...field, alias: undefined } : undefined,
      // arguments are named: their order does not count
      leave: (field) => (field.arguments && field.arguments.length > 1 ? { ...field, arguments: [...field.arguments].sort(byName) } : undefined),
    },
    // an input object is a map: its field order does not count (the values of a list keep theirs)
    ObjectValue: { leave: (object) => (object.fields.length > 1 ? { ...object, fields: [...object.fields].sort(byName) } : undefined) },
    SelectionSet: {
      leave(set, _key, parent) {
        const parentNode = parent && !Array.isArray(parent) ? (parent as ASTNode) : undefined;
        const parentName = parentNode?.kind === Kind.FIELD ? parentNode.name.value : "";
        const spreads = set.selections.filter((selection) => selection.kind === Kind.FRAGMENT_SPREAD);
        const fields = set.selections.filter((selection) => selection.kind !== Kind.FRAGMENT_SPREAD);
        // spreads go last: where a fragment is spread does not change what the PWA receives
        if (ORDERED_PARENTS.has(parentName)) return { ...set, selections: [...fields, ...spreads] };
        const isContent = CONTENT_CHILDREN[parentName];
        const content = isContent ? fields.filter((selection) => selection.kind === Kind.FIELD && isContent(selection.name.value)) : [];
        const settings = fields.filter((selection) => !content.includes(selection)).sort((a, b) => selectionName(a).localeCompare(selectionName(b)));
        return { ...set, selections: [...settings, ...content, ...spreads] };
      },
    },
    StringValue: (value) => (value.block ? { ...value, block: false } : undefined),
    enter(current) {
      if ("loc" in current && current.loc) {
        const { loc: _loc, ...rest } = current as ASTNode & { loc?: unknown };
        return rest as ASTNode;
      }
      return undefined;
    },
  }) as T;
}

export const normalizeDefinition = (node: ExecutableDefinition): string => print(normalizeNode(node));

/** The fields whose selection set asks values back: a bulk or sort option, a filter, an option search, a lookup. */
const ASKED_BACK_PARENTS = new Set(["options", "advancedFilter", "advancedFilterInputForRetrievingOptions", "lookup", "filterOptionsMapping", "actionContext", "bulkOperationModal"]);

/**
 * What the generated document asks back beyond the client's does not count: a field without
 * arguments in an asked-back selection set (the fields asked back for a bulk option, for a filter,
 * for an option search) is dropped from the generated side when the client does not ask it. The
 * PWA reads what it needs by name; what it did not ask it would otherwise get as empty. Fields
 * with arguments configure something and always count, and so does every field elsewhere.
 */
export function pruneAskedBack<T extends ASTNode>(client: ASTNode, generated: T): T {
  const walk = (own: ASTNode | undefined, other: ASTNode, askedBack: boolean): ASTNode => {
    if (!own || own.kind !== other.kind) return other;
    if (other.kind === Kind.SELECTION_SET && own.kind === Kind.SELECTION_SET) {
      const byName = new Map(own.selections.map((selection) => [selectionName(selection), selection]));
      const kept = other.selections
        .filter((selection) => {
          if (!askedBack || selection.kind !== Kind.FIELD || (selection.arguments && selection.arguments.length > 0)) return true;
          return byName.has(selectionName(selection));
        })
        .map((selection) => walk(byName.get(selectionName(selection)), selection, askedBack) as SelectionNode);
      return { ...other, selections: kept };
    }
    if (other.kind === Kind.FIELD && own.kind === Kind.FIELD) {
      if (!other.selectionSet || !own.selectionSet) return other;
      const name = other.name.value;
      const inside = ORDERED_PARENTS.has(name) ? false : askedBack || ASKED_BACK_PARENTS.has(name);
      return { ...other, selectionSet: walk(own.selectionSet, other.selectionSet, inside) as SelectionSetNode };
    }
    if ((other.kind === Kind.FRAGMENT_DEFINITION || other.kind === Kind.OPERATION_DEFINITION || other.kind === Kind.INLINE_FRAGMENT) && other.selectionSet && "selectionSet" in own && own.selectionSet)
      return { ...other, selectionSet: walk(own.selectionSet, other.selectionSet, askedBack) as SelectionSetNode };
    return other;
  };
  return walk(client, generated, false) as T;
}

/** A short name for an AST node on a difference path. */
function label(node: unknown): string | undefined {
  if (!node || typeof node !== "object" || !("kind" in node)) return undefined;
  const n = node as Record<string, unknown>;
  const name = (n.name as { value?: string } | undefined)?.value;
  switch (n.kind) {
    case Kind.FIELD:
      // the alias is what the UI sees
      return (n.alias as { value?: string } | undefined)?.value ?? name;
    case Kind.ARGUMENT:
    case Kind.OBJECT_FIELD:
      return `@${name}`;
    case Kind.FRAGMENT_SPREAD:
      return `...${name}`;
    case Kind.INLINE_FRAGMENT:
      return `... on ${(n.typeCondition as { name?: { value?: string } } | undefined)?.name?.value ?? "?"}`;
    case Kind.VARIABLE_DEFINITION:
      return `$${(n.variable as { name?: { value?: string } } | undefined)?.name?.value}`;
    case Kind.DIRECTIVE:
      return `@${name}`;
    default:
      return undefined;
  }
}

const show = (value: unknown): string => (typeof value === "string" ? JSON.stringify(value) : String(value));

/** Keys that only hold structure: not worth a step on the path. */
const silent = new Set(["selectionSet", "selections", "arguments", "definitions", "variableDefinitions", "directives", "fields", "values"]);
/** `value` is a step only at a leaf (the text of a Name or a literal), not for the value node of an argument. */
const quiet = (key: string, child: unknown) => silent.has(key) || (key === "value" && typeof child === "object" && child !== null);

/** The path to the first difference between two normalized nodes, or undefined when equal. */
export function firstDifference(a: unknown, b: unknown, path: string[] = []): string | undefined {
  const at = (tail: string) => [...path, tail].join(" > ");
  if (a === b) return undefined;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object")
    return `${path.join(" > ")}: ${show(a)} vs ${show(b)}`;
  if (Array.isArray(a) !== Array.isArray(b)) return `${path.join(" > ")}: ${show(a)} vs ${show(b)}`;
  if (Array.isArray(a) && Array.isArray(b)) {
    const labelsA = a.map(label);
    const labelsB = b.map(label);
    // both sides fully labelled (selections, arguments): say what the generated side adds or lacks, or that the order differs
    if (labelsA.every(Boolean) && labelsB.every(Boolean) && (a.length || b.length)) {
      const setA = new Set(labelsA);
      const setB = new Set(labelsB);
      const adds = labelsB.filter((item) => !setA.has(item));
      const lacks = labelsA.filter((item) => !setB.has(item));
      if (adds.length || lacks.length)
        return at(
          [adds.length ? `generated adds [${adds.join(", ")}]` : "", lacks.length ? `generated lacks [${lacks.join(", ")}]` : ""]
            .filter(Boolean)
            .join(", "),
        );
      if (labelsA.join("\0") !== labelsB.join("\0")) return at(`order: [${labelsA.join(", ")}] vs [${labelsB.join(", ")}]`);
    }
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      if (index >= a.length) return at(`generated adds ${label(b[index]) ?? `[${index}]`}`);
      if (index >= b.length) return at(`generated lacks ${label(a[index]) ?? `[${index}]`}`);
      const step = label(a[index]) ?? `[${index}]`;
      const difference = firstDifference(a[index], b[index], [...path, step]);
      if (difference) return difference;
    }
    return undefined;
  }
  const objectA = a as Record<string, unknown>;
  const objectB = b as Record<string, unknown>;
  for (const key of new Set([...Object.keys(objectA), ...Object.keys(objectB)])) {
    if (key === "loc") continue;
    const child = objectA[key] ?? objectB[key];
    const difference = firstDifference(objectA[key], objectB[key], quiet(key, child) ? path : [...path, key]);
    if (difference) return difference;
  }
  return undefined;
}

const emptyCounts = () => ({ equal: 0, differs: 0, missing: 0, extra: 0, outOfScope: 0 });
const countKey = (status: Status): keyof ReturnType<typeof emptyCounts> =>
  status === "out-of-scope" ? "outOfScope" : status;

/** Compare the client's definitions with the generated ones. */
export function compareDefinitions(client: Definition[], generated: Definition[], scope: Scope = {}): Comparison {
  const generatedByName = new Map(generated.map((definition) => [definition.name, definition]));
  const results: DefinitionResult[] = [];
  const gapFor = (definition: Definition): string | undefined =>
    scope.outOfScope?.[definition.name] ?? scope.outOfScopeFiles?.[definition.file];

  for (const own of client) {
    const gap = gapFor(own);
    const other = generatedByName.get(own.name);
    const base = { name: own.name, kind: own.kind, clientFile: own.file, generatedFile: other?.file };
    if (gap) results.push({ ...base, status: "out-of-scope", gap });
    else if (!other) results.push({ ...base, status: "missing" });
    else if (own.normalized === other.normalized) results.push({ ...base, status: "equal" });
    else {
      // the generated side may ask more back than the client: pruned to the client's, it may be equal
      const pruned = pruneAskedBack(normalizeNode(own.node), normalizeNode(other.node));
      if (print(pruned) === own.normalized) results.push({ ...base, status: "equal", asksMore: true });
      else results.push({ ...base, status: "differs", path: firstDifference(normalizeNode(own.node), pruned) });
    }
  }
  const clientNames = new Set(client.map((definition) => definition.name));
  for (const own of generated) {
    if (clientNames.has(own.name)) continue;
    const gap = scope.outOfScopeGenerated?.[own.name];
    results.push({ name: own.name, kind: own.kind, status: gap ? "out-of-scope" : "extra", generatedFile: own.file, ...(gap ? { gap } : {}) });
  }

  const perFile = new Map<string, FileResult>();
  for (const result of results) {
    const file = result.clientFile ?? result.generatedFile!;
    const row = perFile.get(file) ?? { file, status: "equal", definitions: 0, ...emptyCounts() };
    row.definitions += 1;
    row[countKey(result.status)] += 1;
    perFile.set(file, row);
  }
  for (const row of perFile.values()) row.status = fileStatus(row);

  const counts = emptyCounts();
  for (const result of results) counts[countKey(result.status)] += 1;
  const inScope = results.length - counts.outOfScope;
  const summary: Summary = {
    total: results.length,
    ...counts,
    percentEqual: inScope ? Math.round((counts.equal / inScope) * 1000) / 10 : 100,
  };
  return { definitions: results, files: [...perFile.values()].sort((x, y) => x.file.localeCompare(y.file)), summary, duplicates: [], errors: [] };
}

/** A file is what its worst definition is: differs, then missing, then extra, then out-of-scope, else equal. */
function fileStatus(row: FileResult): Status {
  if (row.differs) return "differs";
  if (row.missing) return "missing";
  if (row.extra) return "extra";
  if (row.equal) return "equal";
  return "out-of-scope";
}

export type CompareOptions = {
  /** a name for the report */
  client: string;
  /** path of the declaration (absolute or relative to cwd) */
  declaration: string;
  /** the client's graphql-service `src` directory: every *.queries.ts below it is read */
  clientSrc: string;
  scope?: Scope;
  ontology?: Ontology;
};

/**
 * Generate the declaration into a scratch root and compare with the client's
 * query files. An entity that emits regions is generated into a copy of the
 * client's file, so its hand-written parts compare equal by construction.
 */
export async function compareClient(options: CompareOptions): Promise<CompareReport> {
  const root = mkdtempSync(join(tmpdir(), "elody-compare-"));
  const ttl = readFileSync(options.declaration, "utf-8");
  const declaration = join("src", "ui", basename(options.declaration));
  mkdirSync(join(root, dirname(declaration)), { recursive: true });
  cpSync(options.declaration, join(root, declaration));

  const { entities } = await readUiDeclaration(ttl, options.ontology);
  for (const entity of entities) {
    if (entity.emit === "file") continue;
    const target = fileTargetFor(entity.documentName ?? entity.graphqlType);
    const source = join(options.clientSrc, relative("src", target));
    if (!existsSync(source)) continue;
    mkdirSync(join(root, dirname(target)), { recursive: true });
    cpSync(source, join(root, target));
  }
  await generate({ root, declaration, ontology: options.ontology });

  const client = readDefinitions(readQueryFiles(options.clientSrc));
  // a file out of scope with a gap does not count, parse errors included
  client.errors = client.errors.filter((error) => !options.scope?.outOfScopeFiles?.[error.file]);
  const generated = readDefinitions(readQueryFiles(join(root, "src")));
  const comparison = compareDefinitions(client.definitions, generated.definitions, options.scope);
  return {
    client: options.client,
    declaration: options.declaration,
    ...comparison,
    duplicates: [
      ...client.duplicates.map((row) => ({ side: "client" as const, ...row })),
      ...generated.duplicates.map((row) => ({ side: "generated" as const, ...row })),
    ],
    errors: [
      ...client.errors.map((row) => ({ side: "client" as const, ...row })),
      ...generated.errors.map((row) => ({ side: "generated" as const, ...row })),
    ],
  };
}

/** A short text summary: one line per client, one per file, one per definition that is not equal. */
export function formatCompareReport(report: CompareReport): string {
  const { summary } = report;
  const inScope = summary.total - summary.outOfScope;
  const lines = [
    `${report.client}: ${summary.equal} of ${inScope} equal (${summary.percentEqual}%), ${summary.differs} differ, ${summary.missing} missing, ${summary.extra} extra, ${summary.outOfScope} out of scope`,
  ];
  for (const file of report.files)
    lines.push(`  ${file.file}: ${file.status} (${file.equal}/${file.definitions} equal)`);
  for (const result of report.definitions) {
    if (result.status === "equal") continue;
    if (result.status === "differs") lines.push(`    ${result.name}: differs at ${result.path}`);
    else if (result.status === "out-of-scope") lines.push(`    ${result.name}: out of scope (${result.gap})`);
    else lines.push(`    ${result.name}: ${result.status} (${result.clientFile ?? result.generatedFile})`);
  }
  for (const duplicate of report.duplicates) lines.push(`  duplicate ${duplicate.side} definition ${duplicate.name}: ${duplicate.files.join(", ")}`);
  for (const error of report.errors) lines.push(`  ${error.side} file ${error.file} does not parse: ${error.message}`);
  return lines.join("\n");
}
