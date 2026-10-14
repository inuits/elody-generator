/**
 * G-001, the menu: the app's menu items with their settings, their route or modal link and their
 * sub-menus, rendered as GetMenu; compare merges a client's repeated sub-menu blocks and lets the
 * generated link ask more back than the client does.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareDefinitions, normalizeDefinition, readDefinitions } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the menu", () => {
  it("conforms and renders the menu of the app fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "app.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.app)!, "x", entities);
    expect(out).toMatch(/query GetMenu\(\$name: String!\) \{\n\s+Menu\(name: \$name\) \{\n\s+menu \{\n\s+name\n\s+pipelines: menuItem\(\n\s+label: "navigation.pipelines"\n\s+entityType: pipeline\n\s+icon: CloudDataConnection\n\s+requiresAuth: true\n\s+typeLink: \{ route: \{ destination: "pipelines" \} \}\n\s+\) \{\n\s+label\n\s+entityType\n\s+icon\n\s+isLoggedIn\n\s+requiresAuth\n\s+can\n\s+typeLink \{\n\s+route \{\n\s+destination\n\s+\}\n\s+\}\n\s+subMenu\(name: "sub-menu-create"\) \{\n\s+name\n\s+createPipeline: menuItem\(\n\s+label: "navigation.create-pipeline"\n\s+entityType: pipeline\n\s+typeLink: \{ modal: \{ typeModal: DynamicForm, formQuery: "GetPipelineCreateForm", askForCloseConfirmation: true, neededPermission: cancreate \} \}\n\s+\) \{\n\s+label\n\s+entityType\n\s+icon\n\s+isLoggedIn\n\s+requiresAuth\n\s+can\n\s+typeLink \{\n\s+modal \{\n\s+\.\.\.menuModalLink\n\s+typeModal/);
    expect(out).toMatch(/tenants: menuItem\(\n\s+label: "navigation.tenants"\n\s+entityType: tenant\n\s+icon: Building\n\s+isLoggedIn: true\n\s+can: \["read:tenant"\]\n\s+typeLink: \{ route: \{ destination: "tenants" \} \}/);
  });

  it("compares a client's repeated sub-menu blocks and explicit modal fields equal", () => {
    const client = `query GetMenu($name: String!) { Menu(name: $name) { menu { name
      upload: menuItem(label: "navigation.upload" icon: Upload isLoggedIn: true typeLink: { route: { destination: "Home" } }) {
        label icon isLoggedIn typeLink { route { destination } }
        subMenu(name: "sub-menu-upload") { name a: menuItem(label: "a" entityType: asset typeLink: { modal: { typeModal: DynamicForm formQuery: "GetA" neededPermission: cancreate } }) { label entityType typeLink { modal { typeModal formQuery neededPermission } } } }
        subMenu(name: "sub-menu-upload") { name b: menuItem(label: "b" entityType: asset typeLink: { modal: { typeModal: DynamicForm formQuery: "GetB" neededPermission: cancreate } }) { label entityType typeLink { modal { typeModal formQuery neededPermission } } } }
      } } } }`;
    const generated = `query GetMenu($name: String!) { Menu(name: $name) { menu { name
      upload: menuItem(label: "navigation.upload" icon: Upload isLoggedIn: true typeLink: { route: { destination: "Home" } }) {
        label icon isLoggedIn typeLink { route { destination } }
        subMenu(name: "sub-menu-upload") { name
          a: menuItem(label: "a" entityType: asset typeLink: { modal: { typeModal: DynamicForm formQuery: "GetA" neededPermission: cancreate } }) { label entityType typeLink { modal { ...menuModalLink typeModal formQuery askForCloseConfirmation neededPermission } } }
          b: menuItem(label: "b" entityType: asset typeLink: { modal: { typeModal: DynamicForm formQuery: "GetB" neededPermission: cancreate } }) { label entityType typeLink { modal { ...menuModalLink typeModal formQuery askForCloseConfirmation neededPermission } } }
        }
      } } } }`;
    const c = readDefinitions([{ path: "queries/x.queries.ts", source: `export const x = gql\`${client}\`;` }]);
    const g = readDefinitions([{ path: "queries/x.queries.ts", source: `export const x = gql\`${generated}\`;` }]);
    const result = compareDefinitions(c.definitions, g.definitions);
    expect(result.definitions.map((d) => d.status)).toEqual(["equal"]);
    expect(normalizeDefinition(c.definitions[0].node)).toContain("sub-menu-upload");
  });

  it("extracts a menu back", () => {
    const files = [
      {
        path: "queries/entities/pipeline.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const pipeline = gql\`
  fragment minimalPipeline on Pipeline { intialValues { name: keyValue(key: "name", source: metadata) } teaserMetadata { name: metaData { label(input: "metadata.labels.name") key(input: "name") } } ...minimalBaseEntity }
\`;\n`,
      },
      {
        path: "queries/fixture.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const fixtureQueries = gql\`
  query getEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on Pipeline { ...minimalPipeline } } }
  }
  query GetMenu($name: String!) {
    Menu(name: $name) {
      menu {
        name
        pipelines: menuItem(label: "navigation.pipelines" entityType: pipeline typeLink: { route: { destination: "pipelines" } } icon: CloudDataConnection requiresAuth: true can: ["read:pipeline"]) {
          label entityType typeLink { route { destination } } icon requiresAuth can
          subMenu(name: "sub-menu-create") { name create: menuItem(label: "navigation.create" entityType: pipeline typeLink: { modal: { typeModal: DynamicForm formQuery: "GetPipelineCreateForm" askForCloseConfirmation: true neededPermission: cancreate } }) { label entityType typeLink { modal { ...menuModalLink } } } }
        }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("nothing references the query GetMenu"))).toEqual([]);
    expect(ttl).toContain('  elody:menuItem\n    [ sh:order 1 ; elody:alias "pipelines" ; elody:labelKey "navigation.pipelines" ; elody:entityType "pipeline" ; elody:icon "CloudDataConnection" ; elody:requiresAuth true ; elody:can "read:pipeline" ; elody:route "pipelines" ;\n      elody:subMenu [ elody:menuName "sub-menu-create" ;\n        elody:menuItem\n          [ sh:order 1 ; elody:alias "create" ; elody:labelKey "navigation.create" ; elody:entityType "pipeline" ; elody:modal [ elody:modalKind elody:DynamicFormModal ; elody:form ui:GetPipelineCreateForm ; elody:closeConfirmation true ; elody:permission elody:CanCreate ] ] ] ]');
    expect(ttl).toContain('elody:platformDocument "getEntities" , "GetMenu"');
  });
});
