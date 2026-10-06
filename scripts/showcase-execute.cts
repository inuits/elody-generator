/**
 * Step 2 of the showcase: run inside an Elody GraphQL container (where
 * baseGraphql and its dependencies are installed). Executes every generated
 * document against baseGraphql's own resolvers:
 *  - the create form (GetDynamicForm), with the generated custom input fields
 *    registered exactly as a client does (customInputFields + BaseFieldType);
 *  - the card and detail fragments on a BaseEntity built from the spec's data,
 *    with the resolvers every client entity type declares.
 *
 * usage (in the container): tsx scripts/showcase-execute.cts <showcase-out> <baseGraphql dir>
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const out: string = process.argv[2];
const baseDir: string = process.argv[3];
const fromBase = (name: string) => require(require.resolve(name, { paths: [baseDir] }));
const { parse, validate, visit, specifiedRules, NoUnusedFragmentsRule, Kind } = fromBase("graphql");

// what Apollo Client does to every query the PWA sends: ask __typename in each selection set
const addTypename = (document: any) =>
  visit(document, {
    SelectionSet: {
      leave(node: any, _key: unknown, parent: any) {
        if (parent && parent.kind === Kind.OPERATION_DEFINITION) return undefined;
        if (node.selections.some((s: any) => s.kind === Kind.FIELD && s.name.value === "__typename")) return undefined;
        return { ...node, selections: [...node.selections, { kind: Kind.FIELD, name: { kind: Kind.NAME, value: "__typename" } }] };
      },
    },
  });
const { createApplication, createModule } = fromBase("graphql-modules");
const { baseResolver } = require(path.join(baseDir, "baseModule", "baseResolver"));
// the resolvers every client entity type declares (cf. Job, User in baseResolver),
// added before baseModule is created so they belong to the module that defines BaseEntity
Object.assign(baseResolver.BaseEntity, {
  id: (parent: any) => parent.id,
  uuid: (parent: any) => parent.id,
  allowedViewModes: (parent: any) => parent,
  relationValues: () => ({}),
  entityView: (parent: any) => parent,
  teaserMetadata: (parent: any) => parent,
});
const { baseModule } = require(path.join(baseDir, "baseModule", "baseModule"));
const { baseFields } = require(path.join(baseDir, "sources", "forms"));

// the platform's shared fragments (...inputfield, ...viewModes, ...minimalBaseEntity, …),
// which every client document spreads: collected from baseGraphql's query documents
const queriesDir = path.join(baseDir, "baseModule", "queries");
const baseFragmentDefinitions = fs
  .readdirSync(queriesDir)
  .filter((name: string) => name.endsWith(".queries.ts"))
  .flatMap((name: string) => Object.values(require(path.join(queriesDir, name))))
  .flatMap((doc: any) => (doc && doc.definitions ? doc.definitions : []))
  .filter((definition: any) => definition.kind === "FragmentDefinition");
const rules = specifiedRules.filter((rule: unknown) => rule !== NoUnusedFragmentsRule);
const documentWithBase = (source: string) => {
  const own = parse(source);
  const ownNames = new Set(own.definitions.filter((d: any) => d.kind === "FragmentDefinition").map((d: any) => d.name.value));
  return { ...own, definitions: [...own.definitions, ...baseFragmentDefinitions.filter((d: any) => !ownNames.has(d.name.value))] };
};

const manifest = JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf-8"));
const examples = manifest.filter((row: any) => row.status === "generated");

// custom input fields, registered like ElodyInstance.addCustomFieldsToBaseFields does
const customNames: string[] = [];
for (const row of examples) {
  const fields = JSON.parse(fs.readFileSync(path.join(out, row.id, "inputFields.json"), "utf-8"));
  for (const [name, definition] of Object.entries(fields)) {
    baseFields[name] = definition;
    customNames.push(name);
  }
}

const entities: Record<string, any> = {};
// the related nodes of the spec's data graph, as the entities a relation points to
const related: Record<string, any> = {};
for (const row of examples) {
  const sample = JSON.parse(fs.readFileSync(path.join(out, row.id, "sample.json"), "utf-8"));
  const relationsFile = path.join(out, row.id, "relations.json");
  const relations = fs.existsSync(relationsFile) ? JSON.parse(fs.readFileSync(relationsFile, "utf-8")) : [];
  for (const relation of relations)
    related[relation.key] = { _id: relation.key, id: relation.key, type: "BaseEntity", metadata: [{ key: "title", value: relation.label }], relations: [] };
  entities[row.id] = {
    id: row.id,
    _id: row.id,
    type: "BaseEntity",
    metadata: Object.entries(sample).map(([key, value]) => ({ key, value })),
    relations: relations.map((relation: any) => ({ key: relation.key, type: relation.type })),
  };
}
// the one collection-api call the relation resolver makes: fetch the related entity for its label
const dataSources = { CollectionAPI: { getEntity: async (id: string) => related[id] ?? null } };

const showcase = createModule({
  id: "shaclUiShowcase",
  typeDefs: [
    parse(
      [
        "extend type Query { SpecExampleEntity(id: String!): BaseEntity }",
        customNames.length ? `extend enum BaseFieldType { ${customNames.join(" ")} }` : "",
      ].join("\n"),
    ),
  ],
  resolvers: {
    Query: { SpecExampleEntity: (_: unknown, { id }: { id: string }) => entities[id] },
  },
});

const app = createApplication({ modules: [baseModule, showcase] });
const execute = app.createExecution();

(async () => {
  for (const row of examples) {
    const documents = fs.readFileSync(path.join(out, row.id, "documents.graphql"), "utf-8");
    const detailQuery = `query ${row.documentName}Detail { SpecExampleEntity(id: "${row.id}") { ...minimal${row.documentName} ${row.hasDetail ? `...full${row.documentName}` : ""} } }`;
    const document = addTypename(documentWithBase(`${documents}\n${detailQuery}`));
    const results: Record<string, unknown> = {};
    // the generated documents must be valid against the real schema (all GraphQL rules)
    results.validation = validate(app.schema, document, rules).map((error: any) => error.message);
    if (row.formQuery)
      results.form = await execute({ schema: app.schema, document, operationName: row.formQuery, contextValue: { dataSources } });
    results.detail = await execute({ schema: app.schema, document, operationName: `${row.documentName}Detail`, contextValue: { dataSources } });
    fs.writeFileSync(path.join(out, row.id, "executed.json"), JSON.stringify(results, null, 2));
    const errors = [
      ...(results.validation as string[]).map((message) => `invalid: ${message}`),
      ...Object.entries(results).flatMap(([k, r]: any) => ((r && r.errors) ?? []).map((e: any) => `${k}: ${e.message}`)),
    ];
    console.log(`${row.id.padEnd(32)} ${errors.length ? "ERRORS " + errors.slice(0, 2).join(" | ") : "ok"}`);
  }
})();
