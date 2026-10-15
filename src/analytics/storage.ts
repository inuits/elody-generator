/**
 * Where a logical path is stored. The declaration names a value by its
 * logical path (a filter key without its `<client>:<version>|` prefix:
 * `audit.created.at`, `metadata.status.value`, `properties.material_type.value`);
 * the client's document schema decides where it lives:
 *
 * - v2 stores it at the path.
 * - v1 keeps the audit at the top of the document (collection-api writes
 *   date_created, created_by, date_updated and last_editor), metadata as a
 *   list of { key, value } and relations as a list of { type, key }.
 *
 * The profile, the dlt projection and the pipeline all go through here (the
 * pipeline through the accessors the projection carries), so a schema is
 * described once.
 */

export type Schema = "v1" | "v2";

/** A dotted path, or the elements of a list matched on a field, then a dotted path within each. */
export type Accessor = { path: string } | { list: string; match: { field: string; value: string }; path: string };

const V1_AUDIT: Record<string, string> = {
  "audit.created.at": "date_created",
  "audit.created.by": "created_by",
  "audit.updated.at": "date_updated",
  "audit.updated.by": "last_editor",
};

export function accessorOf(path: string, schema: Schema = "v2"): Accessor {
  if (schema !== "v1") return { path };
  if (V1_AUDIT[path]) return { path: V1_AUDIT[path] };
  const metadata = /^metadata\.([^.]+)(?:\.(.+))?$/.exec(path);
  if (metadata) return { list: "metadata", match: { field: "key", value: metadata[1] }, path: metadata[2] ?? "value" };
  const relation = /^relations\.([^.]+)\.(.+)$/.exec(path);
  if (relation) return { list: "relations", match: { field: "type", value: relation[1] }, path: relation[2] };
  return { path };
}

const isKeyed = (accessor: Accessor): accessor is Extract<Accessor, { list: string }> => "list" in accessor;

/** The values at a dotted path, through lists the way a Mongo query reads them; empty strings and nulls are no value. */
function atPath(nodes: unknown[], path: string): { values: unknown[]; isArray: boolean } {
  let current = nodes;
  let isArray = false;
  for (const segment of path.split(".")) {
    const next: unknown[] = [];
    for (const node of current) {
      if (node === null || node === undefined || typeof node !== "object" || node instanceof Date) continue;
      const value = (node as Record<string, unknown>)[segment];
      if (Array.isArray(value)) {
        isArray = true;
        next.push(...value);
      } else if (value !== undefined) next.push(value);
    }
    current = next.flatMap((value) => (Array.isArray(value) ? ((isArray = true), value) : [value]));
  }
  return { values: current, isArray };
}

export function readValues(doc: unknown, accessor: Accessor): { present: boolean; isArray: boolean; values: unknown[] } {
  let found: { values: unknown[]; isArray: boolean };
  if (isKeyed(accessor)) {
    const list = doc && typeof doc === "object" ? (doc as Record<string, unknown>)[accessor.list] : undefined;
    const elements = (Array.isArray(list) ? list : []).filter(
      (element) => element && typeof element === "object" && (element as Record<string, unknown>)[accessor.match.field] === accessor.match.value,
    );
    found = atPath(elements, accessor.path);
    // the same key given twice is a list too
    found.isArray ||= elements.length > 1;
  } else found = atPath([doc], accessor.path);
  const values = found.values.filter((value) => value !== null && value !== undefined && value !== "");
  return { present: values.length > 0, isArray: values.length > 0 && found.isArray, values };
}

/** The top field a find() projects to read the value. */
export const mongoRoot = (accessor: Accessor): string => (isKeyed(accessor) ? accessor.list : accessor.path);

/** An aggregation expression for the value: a field path, or for a list the matched elements' values (an array). */
export function mongoExpression(accessor: Accessor): string | Record<string, unknown> {
  if (!isKeyed(accessor)) return `$${accessor.path}`;
  return {
    $map: {
      input: { $filter: { input: { $ifNull: [`$${accessor.list}`, []] }, as: "item", cond: { $eq: [`$$item.${accessor.match.field}`, accessor.match.value] } } },
      as: "item",
      in: `$$item.${accessor.path}`,
    },
  };
}
