/**
 * The profile's source on a local Mongo. Only a local host is accepted: the
 * profile reads a restored dump, never a production database.
 */
import type { ProfileSource } from "./profile.js";

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[?::1\]?|[\w.-]+\.localhost)$/i;

/** The hosts of a mongodb:// URI. */
export function mongoHosts(uri: string): string[] {
  const match = /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/.exec(uri);
  if (!match) throw new Error(`not a mongodb:// URI: ${uri}`);
  return match[1].split(",").map((host) => host.replace(/:\d+$/, ""));
}

export function assertLocal(uri: string): void {
  if (uri.startsWith("mongodb+srv:")) throw new Error("a mongodb+srv URI is never local: the profile reads a local Mongo only");
  const remote = mongoHosts(uri).filter((host) => !LOCAL_HOSTS.test(host));
  if (remote.length) throw new Error(`${remote.join(", ")} is not a local host: the profile reads a local Mongo only (a restored dump), never production`);
}

/** Drops a path whose ancestor is projected too: Mongo refuses both in one projection. */
const projection = (paths: string[]) =>
  Object.fromEntries(["type", ...paths].filter((path, _, all) => !all.some((other) => other !== path && path.startsWith(`${other}.`))).map((path) => [path, 1]));

export async function mongoSource(uri: string, db: string): Promise<{ source: ProfileSource; close(): Promise<void> }> {
  assertLocal(uri);
  let driver: typeof import("mongodb");
  try {
    driver = await import("mongodb");
  } catch {
    throw new Error("the profile needs the mongodb driver: pnpm add mongodb");
  }
  const client = await new driver.MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  const database = client.db(db);
  const options = { allowDiskUse: true };
  const source: ProfileSource = {
    async typeCounts(collection) {
      const rows = await database.collection(collection).aggregate<{ _id: string; n: number }>([{ $group: { _id: "$type", n: { $sum: 1 } } }], options).toArray();
      return Object.fromEntries(rows.filter((row) => typeof row._id === "string").map((row) => [row._id, row.n]));
    },
    async sample(collection, type, paths, size) {
      return database
        .collection(collection)
        .aggregate([{ $match: { type } }, { $project: projection(paths) }, { $sample: { size } }], options)
        .toArray();
    },
    async distribution(collections, types, path) {
      const counts = new Map<string, number>();
      let documents = 0;
      for (const name of collections) {
        const collection = database.collection(name);
        documents += await collection.countDocuments({ type: { $in: types } });
        const rows = await collection
          .aggregate<{ _id: unknown; n: number }>(
            [
              { $match: { type: { $in: types } } },
              { $project: { _id: 0, v: `$${path}` } },
              { $unwind: "$v" },
              { $match: { v: { $nin: [null, ""] } } },
              { $group: { _id: "$v", n: { $sum: 1 } } },
            ],
            options,
          )
          .toArray();
        for (const row of rows) counts.set(String(row._id), (counts.get(String(row._id)) ?? 0) + row.n);
      }
      return { documents, values: [...counts] };
    },
    async yearly(collections, types, path) {
      const counts = new Map<number | null, number>();
      for (const name of collections) {
        const rows = await database
          .collection(name)
          .aggregate<{ _id: number | null; n: number }>(
            [
              { $match: { type: { $in: types } } },
              { $group: { _id: { $cond: [{ $eq: [{ $type: `$${path}` }, "date"] }, { $year: `$${path}` }, null] }, n: { $sum: 1 } } },
            ],
            options,
          )
          .toArray();
        for (const row of rows) counts.set(row._id, (counts.get(row._id) ?? 0) + row.n);
      }
      return [...counts].map(([year, count]) => ({ year, count }));
    },
    async lookup(collection, values) {
      const found = new Set<string>();
      const wanted = new Set(values);
      for (const doc of await database.collection(collection).find({ identifiers: { $in: values } }, { projection: { identifiers: 1 } }).toArray())
        for (const identifier of (doc.identifiers as string[]) ?? []) if (wanted.has(identifier)) found.add(identifier);
      return [...found];
    },
  };
  return { source, close: () => client.close() };
}
