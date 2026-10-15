/**
 * A client's client.json (elody-declarations, clients/<c>/client.json), as the
 * analytics commands read it when the command line does not say otherwise:
 * the Mongo database and collections (users left out: they are not counted),
 * the document schema, and the translation bundles, first wins, as paths from
 * the elody-common root (ELODY_COMMON, else three folders above client.json).
 */
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import type { Schema } from "./storage.js";

export type ClientConfig = {
  file: string;
  name: string;
  mongoDb?: string;
  collections: string[];
  schema: Schema;
  /** absolute paths */
  translations: string[];
};

/** The client.json in the folder of `from` or above it, five folders up at most; `from` need not exist yet. */
export function findClientConfig(from: string): ClientConfig | undefined {
  let dir = resolve(from);
  for (let depth = 0; depth < 6; depth += 1) {
    const file = join(dir, "client.json");
    if (existsSync(file)) {
      const json = JSON.parse(readFileSync(file, "utf-8"));
      const root = process.env.ELODY_COMMON ?? resolve(dirname(file), "..", "..", "..");
      return {
        file,
        name: json.name ?? dirname(file).split("/").pop(),
        mongoDb: json.mongoDb,
        collections: (json.mongoCollections ?? []).filter((name: string) => !/^users?(_|$)/.test(name)),
        schema: json.schema === "v1" ? "v1" : "v2",
        translations: (json.translations ?? []).map((path: string) => join(root, path)),
      };
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}
