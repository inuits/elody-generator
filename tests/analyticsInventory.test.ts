/**
 * Analytics, step 1: the filter inventory. Every filter is read from the
 * graph (those of a filters fragment too), its key reduced to a document
 * path, the filters folded per path, and each path given a proposed role.
 */
import { describe, expect, it } from "vitest";
import { candidatesMarkdown, inventory, normaliseKey, proposeRole } from "../src/analytics/inventory.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix dash: <http://datashapes.org/dash#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;

const material = (order: number) => `[ rdfs:label "metadata.labels.material-type" ; sh:order ${order} ; elody:alias "material_type" ;
    elody:key "vlacc:1|properties.material_type.value" ; elody:optionsKey "vlacc:1|properties.material_type.value" ;
    elody:optionsDistinctBy "properties.material_type.value" ;
    elody:optionsInput [ sh:order 1 ; elody:inputKind elody:SelectionFilter ; elody:key "type" ; elody:value ( "manifestation_word" "manifestation_music" ) ] ;
    elody:filterKind elody:SelectionFilter ]`;

const declaration = `${prefixes}
ui:ManifestationUi a elody:EntityUi ; elody:graphqlType "Manifestation" ;
  elody:listQuery [ a elody:ListQuery ; elody:filtersQuery "GetManifestationFilters" ;
    elody:filter
      [ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "manifestation_word" , "manifestation_music" ; elody:filterKind elody:TypeFilter ] ,
      ${material(2)} ,
      [ sh:order 3 ; elody:alias "relation" ; elody:key "vlacc:1|identifiers" ; dash:hidden true ; sh:defaultValue "$entity.relationValues.refX.key" ; elody:filterKind elody:SelectionFilter ] ,
      [ sh:order 4 ; elody:alias "title" ; elody:key "vlacc:1|properties.title.value" ; elody:filterKind elody:TextFilter ] ,
      [ sh:order 5 ; elody:alias "author" ; elody:key "vlacc:1|properties.ref_authors.value" ; elody:filterKind elody:SelectionFilter ] ,
      [ sh:order 6 ; elody:alias "created_from" ; elody:key "createdfrom" ; sh:defaultValue "date-$yesterdaystart" ; elody:filterKind elody:DateFilter ] ,
      [ sh:order 7 ; elody:alias "keyword" ; elody:key "vlacc:1|properties.keyword.value" ; elody:filterKind elody:TextFilter ] ] .

ui:WorkUi a elody:EntityUi ; elody:graphqlType "Work" ;
  elody:listQuery [ a elody:ListQuery ; elody:filtersQuery "GetWorkFilters" ; elody:filter ${material(1)} ] .

ui:FragmentsUi a elody:EntityUi ; elody:graphqlType "Fragments" ;
  elody:filtersFragment [ elody:fragmentName "entityAuditFilters" ;
    elody:filter
      [ rdfs:label "metadata.labels.created-at" ; sh:order 1 ; elody:alias "created_at" ; elody:key "vlacc:1|audit.created.at" ; elody:filterKind elody:DateFilter ] ,
      [ rdfs:label "metadata.labels.created-by" ; sh:order 2 ; elody:alias "created_by" ; elody:key "vlacc:1|audit.created.by" ; elody:filterKind elody:SelectionFilter ] ,
      [ rdfs:label "metadata.labels.updated-at" ; sh:order 3 ; elody:alias "updated_at" ; elody:key "vlacc:1|audit.updated.at" ; elody:filterKind elody:DateFilter ] ,
      [ rdfs:label "metadata.labels.updated-by" ; sh:order 4 ; elody:alias "updated_by" ; elody:key "vlacc:1|audit.updated.by" ; elody:filterKind elody:SelectionFilter ] ] .
`;

const client = { nl: { metadata: { labels: { "material-type": "Materiaaltype" } } } };
const base = { nl: { metadata: { labels: { "material-type": "Soort materiaal", "created-at": "Aangemaakt op", "created-by": "Aangemaakt door" } } } };

describe("analytics inventory", () => {
  const { filters, candidates } = inventory(declaration, [client, base]);
  const byPath = (path: string) => candidates.find((candidate) => candidate.path === path)!;

  it("strips the client and version prefix from a key, and leaves a key without one", () => {
    expect(normaliseKey("vlacc:1|properties.material_type.value")).toEqual({ path: "properties.material_type.value", prefixed: true });
    expect(normaliseKey("elody:1|identifiers")).toEqual({ path: "identifiers", prefixed: true });
    expect(normaliseKey("createdfrom")).toEqual({ path: "createdfrom", prefixed: false });
    expect(byPath("createdfrom").prefixed).toBe(false);
    expect(byPath("createdfrom")).toMatchObject({ role: "time", include: false });
  });

  it("reads every filter, those of a filters fragment with the fragment as owner", () => {
    expect(filters).toHaveLength(12);
    const createdAt = filters.find((filter) => filter.path === "audit.created.at")!;
    expect(createdAt.owners).toEqual(["fragment:entityAuditFilters"]);
    const material = filters.filter((filter) => filter.path === "properties.material_type.value");
    expect(material.map((filter) => filter.owners)).toEqual([["Manifestation"], ["Work"]]);
    expect(material[0].query).toBe("GetManifestationFilters");
    expect(material[0].optionTypes).toEqual(["manifestation_word", "manifestation_music"]);
    expect(material[0].optionsDistinctBy).toBe("properties.material_type.value");
  });

  it("folds the filters of one path into one candidate, counting them", () => {
    expect(candidates.filter((candidate) => candidate.path === "properties.material_type.value")).toHaveLength(1);
    expect(byPath("properties.material_type.value")).toMatchObject({
      occurrences: 2,
      entityTypes: ["Manifestation", "Work"],
      aliases: ["material_type"],
      typeValues: ["manifestation_music", "manifestation_word"],
    });
  });

  it("proposes a role per path, and says why", () => {
    expect(byPath("type")).toMatchObject({ role: "entity_type", include: true, typeValues: ["manifestation_music", "manifestation_word"] });
    expect(byPath("audit.created.at")).toMatchObject({ role: "time", include: true });
    expect(byPath("audit.updated.at")).toMatchObject({ role: "time", include: false });
    expect(byPath("audit.created.by")).toMatchObject({ role: "dimension", include: true });
    expect(byPath("audit.updated.by")).toMatchObject({ role: "audit", include: false });
    expect(byPath("properties.material_type.value")).toMatchObject({ role: "dimension", include: true, reason: "a SelectionFilter" });
    expect(byPath("identifiers")).toMatchObject({ role: "identifier", include: false });
    expect(byPath("properties.title.value")).toMatchObject({ role: "text", include: false });
    expect(byPath("properties.ref_authors.value")).toMatchObject({ role: "relation", include: false });
    expect(byPath("properties.keyword.value")).toMatchObject({ role: "identifier", include: false, reason: expect.stringContaining("TextFilter") });
    expect(proposeRole("properties.isbn.value", ["SelectionFilter"]).role).toBe("identifier");
    expect(proposeRole("lookup.virtual_relations.x", ["SelectionFilter"]).role).toBe("relation");
    expect(proposeRole("relations.isUserFor.key", ["SelectionFilter"]).role).toBe("relation");
    expect(proposeRole("relation1", ["SelectionFilter"]).role).toBe("relation");
    expect(proposeRole("properties.vlacc_number.value", ["SelectionFilter"]).role).toBe("identifier");
    expect(proposeRole("properties.issn_group.value.issn", ["SelectionFilter"]).role).toBe("identifier");
    expect(proposeRole("properties.avi_read_level_code.value", ["SelectionFilter"]).role).toBe("dimension");
  });

  it("labels a path from the first translation bundle that has its key, else the conventional key", () => {
    expect(byPath("properties.material_type.value")).toMatchObject({ labelKey: "metadata.labels.material-type", labelSource: "declared", labelNl: "Materiaaltype" });
    expect(byPath("audit.created.at").labelNl).toBe("Aangemaakt op");
    expect(byPath("properties.keyword.value")).toMatchObject({ labelKey: "metadata.labels.keyword", labelSource: "conventional", labelNl: undefined });
  });

  it("writes a review table with the included paths first", () => {
    const markdown = candidatesMarkdown(candidates);
    const lines = markdown.split("\n").filter((line) => line.startsWith("| ✓"));
    expect(lines).toHaveLength(4);
    expect(markdown).toContain("| ✓ | `properties.material_type.value` | dimension | a SelectionFilter | Materiaaltype | SelectionFilter | 2 | Manifestation, Work |");
  });
});
