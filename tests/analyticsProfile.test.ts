/**
 * Analytics, step 3: the data profile. The overlay's paths are measured on a
 * sample per entity type (fill rate, arrays, value types, distinct values),
 * the creation dates counted per year and the candidates for the entry
 * library counted exactly; the overlay is then updated from it: a path that
 * is mostly a list becomes multi-valued, a path hardly filled is commented out.
 */
import { describe, expect, it } from "vitest";
import { readOverlay } from "../src/analytics/overlay.js";
import { applyProfile, profile, profileMarkdown, valuesAt, type ProfileSource } from "../src/analytics/profile.js";

const overlayTtl = `@prefix qb: <http://purl.org/linked-data/cube#> .
@prefix ea: <https://elody.eu/ns/analytics#> .
@prefix em: <https://elody.io/ns/metadata#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix t: <https://elody.eu/analytics/t#> .

t:EntityActivity a qb:DataStructureDefinition ;
  ea:sourceCollection "books" , "people" ;
  ea:entityTypes
    "book" , "ghost" , "person" ;

  # Type
  qb:component [ qb:dimension em:type ; ea:sourcePath "type" ; ea:role ea:EntityType ; ea:labelKey "metadata.labels.type" ] ;
  # Aangemaakt op
  qb:component [ qb:dimension em:created_at ; ea:sourcePath "audit.created.at" ; ea:role ea:Time ; ea:labelKey "metadata.labels.created-at" ] ;
  # Materiaaltype
  qb:component [ qb:dimension em:material_type ; ea:sourcePath "properties.material_type.value" ; ea:labelKey "metadata.labels.material-type" ] ;
  # Doelgroep
  qb:component [ qb:dimension em:target_audience ; ea:sourcePath "properties.target_audience.value" ; ea:labelKey "metadata.labels.target-audience" ] ;
  # Leefdata
  qb:component [ qb:dimension em:life_dates ; ea:sourcePath "properties.life_dates.value" ; ea:labelKey "metadata.labels.life-dates" ] ;

  qb:component [ qb:measure ea:entityCount ; qb:order 1 ] .
`;

const at = (year: number) => ({ created: { at: new Date(Date.UTC(year, 0, 1)), ...(year > 2020 ? { by: `u${year % 2}@lib${year % 2}.be` } : {}) } });

// 10 books: material type on all, target audience a list on 3, an agency on half; 20 people: life dates on 1
const books = Array.from({ length: 10 }, (_, index) => ({
  type: "book",
  audit: at(2019 + (index % 4)),
  properties: {
    material_type: { value: index < 7 ? "BOEK" : "STRIP" },
    ...(index < 3 ? { target_audience: { value: ["jeugd", "volwassenen"] } } : index < 6 ? { target_audience: { value: "jeugd" } } : {}),
    ...(index % 2 ? { cataloging_source_agency: { value: index < 5 ? "Open Vlacc" : "Brugge" } } : {}),
  },
}));
const people = Array.from({ length: 20 }, (_, index) => ({ type: "person", audit: at(2022), properties: index === 0 ? { life_dates: { value: "1900-1980" } } : {} }));
const collections: Record<string, typeof books | typeof people> = { books, people };

const pick = (doc: Record<string, unknown>, path: string) => valuesAt(doc, path).values;

const source: ProfileSource = {
  async typeCounts(collection) {
    const counts: Record<string, number> = {};
    for (const doc of collections[collection] ?? []) counts[doc.type] = (counts[doc.type] ?? 0) + 1;
    return counts;
  },
  async sample(collection, type, _paths, size) {
    return (collections[collection] ?? []).filter((doc) => doc.type === type).slice(0, size);
  },
  async distribution(names, types, path) {
    const counts = new Map<string, number>();
    let documents = 0;
    for (const name of names)
      for (const doc of collections[name] ?? []) {
        if (!types.includes(doc.type)) continue;
        documents += 1;
        for (const value of pick(doc, path)) counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
      }
    return { documents, values: [...counts].sort((a, b) => b[1] - a[1]) };
  },
  async yearly(names, types, path) {
    const counts = new Map<number | null, number>();
    for (const name of names)
      for (const doc of collections[name] ?? []) {
        if (!types.includes(doc.type)) continue;
        const [value] = pick(doc, path) as Date[];
        const year = value ? value.getUTCFullYear() : null;
        counts.set(year, (counts.get(year) ?? 0) + 1);
      }
    return [...counts].map(([year, count]) => ({ year, count }));
  },
  async lookup(_collection, values) {
    return values.filter((value) => value.startsWith("u1@"));
  },
};

describe("analytics profile", () => {
  it("reads a path through lists, like Mongo does", () => {
    const doc = { properties: { group: { value: [{ source: "a" }, { source: "b" }] }, title: { value: "x" }, empty: { value: "" } } };
    expect(valuesAt(doc, "properties.group.value.source")).toEqual({ present: true, isArray: true, values: ["a", "b"] });
    expect(valuesAt(doc, "properties.title.value")).toEqual({ present: true, isArray: false, values: ["x"] });
    expect(valuesAt(doc, "properties.empty.value").present).toBe(false);
    expect(valuesAt(doc, "properties.missing.value")).toEqual({ present: false, isArray: false, values: [] });
  });

  it("measures every path per type and overall, weighted by the type's documents", async () => {
    const result = await profile(readOverlay(overlayTtl), source, { sample: 100, extras: ["properties.cataloging_source_agency.value"], library: [] });
    expect(result.types).toEqual([
      { collection: "books", type: "book", documents: 10, sampled: 10 },
      { collection: "people", type: "person", documents: 20, sampled: 20 },
    ]);
    expect(result.typesWithoutDocuments).toEqual(["ghost"]);
    const audience = result.paths.find((path) => path.path === "properties.target_audience.value")!;
    expect(audience.perType.book).toMatchObject({ filled: 0.6, arrays: 0.5, distinct: 2 });
    expect(audience.perType.book.bsonTypes).toEqual({ string: 9 });
    expect(audience.perType.book.top[0]).toEqual(["jeugd", 6]);
    expect(audience.filled).toBeCloseTo(0.2); // 6 of 30 documents
    expect(audience.maxFilled).toEqual({ type: "book", filled: 0.6 });
    expect(audience.arrays).toBeCloseTo(0.5);
    const lifeDates = result.paths.find((path) => path.path === "properties.life_dates.value")!;
    expect(lifeDates.maxFilled).toEqual({ type: "person", filled: 0.05 });
    expect(result.paths.find((path) => path.path === "properties.cataloging_source_agency.value")).toMatchObject({ extra: true });
  });

  it("proposes an action per path: multi-valued above 1% lists, dropped below 5% filled in every type", async () => {
    const result = await profile(readOverlay(overlayTtl), source, { sample: 100, extras: [], library: [] });
    const action = (path: string) => result.paths.find((entry) => entry.path === path)!.action;
    expect(action("properties.material_type.value")).toEqual({ kind: "keep" });
    expect(action("properties.target_audience.value")).toEqual({ kind: "multiValued", reason: "50% of the filled documents hold a list" });
    expect(action("properties.life_dates.value")).toEqual({ kind: "keep" }); // 5% of persons: at the threshold, kept
    const sparse = await profile(readOverlay(overlayTtl), source, { sample: 100, extras: [], library: [], dropBelow: 0.06 });
    expect(sparse.paths.find((entry) => entry.path === "properties.life_dates.value")!.action).toEqual({ kind: "drop", reason: "at most 5% filled (person)" });
    expect(sparse.paths.find((entry) => entry.path === "type")!.action.kind).toBe("keep");
    const withEmpty = overlayTtl.replace("  qb:component [ qb:measure", '  qb:component [ qb:dimension em:nothing ; ea:sourcePath "properties.nothing.value" ] ;\n  qb:component [ qb:measure');
    const empty = await profile(readOverlay(withEmpty), source, { sample: 100, extras: [], library: [] });
    expect(empty.paths.find((entry) => entry.path === "properties.nothing.value")).toMatchObject({ maxFilled: { type: "", filled: 0 }, action: { kind: "drop", reason: "filled in no type's sample" } });
  });

  it("counts the creation dates per year, and prepares the entry library from exact counts", async () => {
    const result = await profile(readOverlay(overlayTtl), source, {
      sample: 100,
      extras: [],
      library: ["properties.cataloging_source_agency.value", "audit.created.by"],
      usersCollection: "users",
    });
    expect(result.time).toEqual({ path: "audit.created.at", byYear: [{ year: 2019, count: 3 }, { year: 2020, count: 3 }, { year: 2021, count: 2 }, { year: 2022, count: 22 }] });
    const [agency, createdBy] = result.library;
    expect(agency).toMatchObject({ path: "properties.cataloging_source_agency.value", documents: 30, filled: 5, distinct: 2, top: [["Open Vlacc", 2], ["Brugge", 3]].sort((a, b) => Number(b[1]) - Number(a[1])) });
    expect(createdBy).toMatchObject({ path: "audit.created.by", filled: 24, distinct: 2, usersFound: 1, domains: [["lib0.be", 22], ["lib1.be", 2]] });
  });

  it("writes the overlay back: multi-valued marked, sparse paths commented with why, empty types dropped", async () => {
    const result = await profile(readOverlay(overlayTtl), source, { sample: 100, extras: [], library: [], dropBelow: 0.06 });
    const { ttl, changes } = applyProfile(overlayTtl, result);
    expect(ttl).toContain('ea:sourcePath "properties.target_audience.value" ; ea:labelKey "metadata.labels.target-audience" ; ea:multiValued true ]');
    expect(ttl).toContain('#   qb:component [ qb:dimension em:life_dates');
    expect(ttl).toContain("# dropped by the profile: at most 5% filled (person)");
    expect(ttl).not.toContain('"ghost"');
    const overlay = readOverlay(ttl);
    expect(overlay.entityTypes).toEqual(["book", "person"]);
    expect(overlay.dimensions.map((dimension) => dimension.sourcePath)).not.toContain("properties.life_dates.value");
    expect(overlay.dimensions.find((dimension) => dimension.sourcePath === "properties.target_audience.value")!.multiValued).toBe(true);
    expect(changes).toHaveLength(3);
    // applying twice changes nothing more
    expect(applyProfile(ttl, result).changes).toEqual([]);
  });

  it("writes a readable report", async () => {
    const result = await profile(readOverlay(overlayTtl), source, {
      sample: 100,
      extras: [],
      library: ["properties.cataloging_source_agency.value", "audit.created.by"],
      usersCollection: "users",
    });
    const markdown = profileMarkdown(result);
    expect(markdown).toContain("## Entry library");
    expect(markdown).toContain("| `properties.target_audience.value` |");
    expect(markdown).toContain("ghost");
  });
});

describe("analytics profile on Mongo", () => {
  it("reads a local Mongo only", async () => {
    const { assertLocal } = await import("../src/analytics/profileMongo.js");
    expect(() => assertLocal("mongodb://localhost:27017")).not.toThrow();
    expect(() => assertLocal("mongodb://user:pw@127.0.0.1:27017,mongo.localhost/x?authSource=admin")).not.toThrow();
    expect(() => assertLocal("mongodb://mongo.vlacc.prod.example:27017")).toThrow(/not a local host/);
    expect(() => assertLocal("mongodb://localhost,db1.example.org")).toThrow(/db1.example.org/);
    expect(() => assertLocal("mongodb+srv://cluster.example.net")).toThrow(/never local/);
  });
});
