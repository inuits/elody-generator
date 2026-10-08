/**
 * G-014 / G-015: the documents a list element loads come from the declaration.
 * An elody:ListQuery names the entities document (results per type, rendered
 * like a picker's) and its filters document (the type, the relation to the
 * entity shown); the element reads customQuery and customQueryFilters from
 * it. Without results only the filters document is generated: the entities
 * document stays hand-written. A filter may go without an alias. A list query
 * two types share is emitted once.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const prefixes = `
@prefix elody: <https://elody.eu/ns/ui#> . @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix shui: <http://www.w3.org/ns/shacl-ui/> . @prefix dash: <http://datashapes.org/dash#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix em: <https://elody.io/ns/metadata#> . @prefix ui: <urn:ui:> .`;

const label = `[ sh:path em:name ; sh:order 1 ; shui:propertyRole shui:LabelRole ; elody:labelKey "metadata.labels.name" ]`;
const list = (query: string, extra = "") =>
  `elody:detail [ elody:column [ sh:order 1 ; elody:size elody:Width100 ; elody:element [ a elody:ListElement ; sh:order 1 ; rdfs:label "element-labels.users" ; elody:alias "Users" ; elody:collapsed false ; elody:entityTypes "user" ; elody:relationType "hasUser" ; elody:searchInput elody:AdvancedSearchInput ; ${extra} elody:listQuery ${query} ] ] ]`;
const typeFilter = `[ sh:order 1 ; elody:alias "type" ; dash:hidden true ; sh:defaultValue "user" ; elody:filterKind elody:TypeFilter ]`;
const relationFilter = `[ sh:order 2 ; elody:alias "relation" ; elody:key "elody:1|identifiers" ; dash:hidden true ; sh:defaultValue "$entity.relationValues.hasUser.key" ; elody:filterKind elody:SelectionFilter ]`;

const entity = (body: string, more = "") => `${prefixes}
ui:ThingUi a elody:EntityUi ; elody:graphqlType "Thing" ; elody:emit "file" ;
  ${body} .
${more}`;

async function render(ttl: string): Promise<string> {
  const { entities, warnings } = await readUiDeclaration(ttl);
  expect(warnings.map((warning) => warning.message)).toEqual([]);
  return renderEntityFile(entities[0], "src/ui/test.ui.ttl");
}
const query = (file: string, name: string): string => {
  const start = file.indexOf(`  query ${name}`);
  if (start === -1) return "";
  const end = file.indexOf("\n  }\n", start);
  return file.slice(start, end + 4);
};

describe("a list element with a declared list query", () => {
  const users = `ui:GetUsers a elody:ListQuery ; elody:queryName "GetUsers" ; elody:filtersQuery "GetUsersOfThingFilters" ;
    elody:result [ elody:graphqlType "User" ; sh:order 1 ; elody:fragment "minimalUser" ] ;
    elody:filter ${typeFilter} , ${relationFilter} .`;

  it("reads customQuery and customQueryFilters from it", async () => {
    const file = await render(entity(`sh:property ${label} ; ${list("ui:GetUsers")}`, users));
    expect(file).toContain('customQuery(input: "GetUsers")');
    expect(file).toContain('customQueryFilters(input: "GetUsersOfThingFilters")');
  });

  it("renders the entities document like a picker's and the filters document under its name", async () => {
    const file = await render(entity(`sh:property ${label} ; ${list("ui:GetUsers")}`, users));
    const entities = query(file, "GetUsers(");
    expect(entities).toContain("    Entities(\n      type: $type");
    expect(entities).toContain("        ... on User {\n          ...minimalUser\n        }");
    expect(entities).toContain("      __typename\n    }");
    expect(query(file, "GetUsersOfThingFilters")).toBe(
      [
        "  query GetUsersOfThingFilters($entityType: String!) {",
        "    EntityTypeFilters(type: $entityType) {",
        "      advancedFilters {",
        "        type: advancedFilter(type: type) {",
        "          type",
        '          defaultValue(value: "user")',
        "          hidden(value: true)",
        "        }",
        '        relation: advancedFilter(type: selection, key: ["elody:1|identifiers"]) {',
        "          type",
        "          key",
        '          defaultValue(value: "$entity.relationValues.hasUser.key")',
        "          hidden(value: true)",
        "        }",
        "      }",
        "    }",
        "  }",
      ].join("\n"),
    );
  });

  it("names the filters document after the query when none is given", async () => {
    const file = await render(
      entity(`sh:property ${label} ; ${list("ui:GetUsers")}`, `ui:GetUsers a elody:ListQuery ; elody:queryName "GetUsers" ; elody:result [ elody:graphqlType "User" ; elody:fragment "minimalUser" ] ; elody:filter ${typeFilter} .`),
    );
    expect(file).toContain('customQueryFilters(input: "GetUsersFilters")');
    expect(query(file, "GetUsersFilters")).toContain("EntityTypeFilters");
  });

  it("generates only the filters document when the list query has no results", async () => {
    const file = await render(
      entity(`sh:property ${label} ; ${list("ui:GetUsers")}`, `ui:GetUsers a elody:ListQuery ; elody:queryName "GetUsersInThing" ; elody:filtersQuery "GetUserInThingFilter" ; elody:filter ${typeFilter} .`),
    );
    expect(file).toContain('customQuery(input: "GetUsersInThing")');
    expect(query(file, "GetUsersInThing(")).toBe("");
    expect(query(file, "GetUserInThingFilter")).toContain('defaultValue(value: "user")');
  });

  it("renders a filter without an alias unaliased", async () => {
    const file = await render(
      entity(`sh:property ${label} ; ${list("ui:GetUsers")}`, `ui:GetUsers a elody:ListQuery ; elody:queryName "GetUsers" ; elody:filter [ sh:order 1 ; dash:hidden true ; sh:defaultValue "user" ; elody:filterKind elody:TypeFilter ] .`),
    );
    expect(query(file, "GetUsersFilters")).toContain("        advancedFilter(type: type) {\n          type");
  });

  it("emits a list query two types share once, with the first type", async () => {
    const ttl = `${prefixes}
ui:AUi a elody:EntityUi ; elody:graphqlType "A" ; elody:emit "file" ; sh:property ${label} ; ${list("ui:GetUsers")} .
ui:BUi a elody:EntityUi ; elody:graphqlType "B" ; elody:emit "file" ; sh:property ${label} ; ${list("ui:GetUsers")} .
${users}`;
    const { entities, warnings } = await readUiDeclaration(ttl);
    expect(warnings).toEqual([]);
    const a = renderEntityFile(entities.find((e) => e.graphqlType === "A")!, "x");
    const b = renderEntityFile(entities.find((e) => e.graphqlType === "B")!, "x");
    expect(a).toContain("query GetUsers(");
    expect(b).not.toContain("query GetUsers(");
    expect(b).toContain('customQuery(input: "GetUsers")');
  });
});

describe("the 0.3.0 fixture", () => {
  it("conforms with a list query and renders its documents", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "aliases-and-defaults.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities } = await readUiDeclaration(fixture);
    const user = renderEntityFile(entities.find((entity) => entity.graphqlType === "User")!, "x");
    expect(user).toContain("query GetTenantsOfUser(");
    expect(user).toContain("query GetTenantsOfUserFilters($entityType: String!)");
  });
});
