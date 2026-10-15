/**
 * Analytics: what the commands take from a client's client.json when the
 * command line does not say it: its name, Mongo database and collections,
 * document schema and translation bundles (paths from the elody-common root).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { findClientConfig } from "../src/analytics/client.js";

describe("analytics client config", () => {
  const root = mkdtempSync(join(tmpdir(), "elody-common-"));
  const client = join(root, "elody-declarations", "clients", "podiumnet");
  mkdirSync(join(client, "ui", "entities"), { recursive: true });
  writeFileSync(
    join(client, "client.json"),
    JSON.stringify({ name: "podiumnet", mongoDb: "podiumnet", mongoCollections: ["entities", "mediafiles", "users_actual"], schema: "v1", translations: ["clients/podiumnet/nl.json", "modules/baseGraphql/translations/nl.json"] }),
  );
  afterEach(() => delete process.env.ELODY_COMMON);

  it("finds client.json above a declaration, an overlay or a folder not made yet", () => {
    for (const from of [join(client, "ui"), join(client, "ui", "entities", "x.ui.ttl"), join(client, "analytics", "generated"), join(client, "analytics", "podiumnet.analytics.ttl")])
      expect(findClientConfig(from)?.name).toBe("podiumnet");
    expect(findClientConfig(tmpdir())).toBeUndefined();
  });

  it("gives the collections without the users, the schema, and the translations from the elody-common root", () => {
    expect(findClientConfig(join(client, "ui"))).toMatchObject({
      name: "podiumnet",
      mongoDb: "podiumnet",
      collections: ["entities", "mediafiles"],
      schema: "v1",
      translations: [join(root, "clients/podiumnet/nl.json"), join(root, "modules/baseGraphql/translations/nl.json")],
    });
    process.env.ELODY_COMMON = "/elsewhere";
    expect(findClientConfig(join(client, "ui"))!.translations[0]).toBe("/elsewhere/clients/podiumnet/nl.json");
  });
});
