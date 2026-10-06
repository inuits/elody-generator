/**
 * Value-preservation round trip, steps 2 and 4 (in an Elody GraphQL
 * container, where baseGraphql is installed), with baseGraphql's own resolvers:
 *   read  — the generated detail document on the stored entity → read.json
 *           (intialValues and the entity view, as the PWA receives them);
 *   write — mutateEntityValues on the PWA's form input → patch.json
 *           (the metadata body baseGraphql PATCHes to collection-api).
 *
 * usage: tsx graphql.cts <read|write> <outDir> <baseGraphql dir>
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const [phase, out, baseDir] = process.argv.slice(2);
const fromBase = (name: string) => require(require.resolve(name, { paths: [baseDir] }));
const { parse, visit, Kind } = fromBase("graphql");
const { createApplication, createModule } = fromBase("graphql-modules");
const { baseResolver } = require(path.join(baseDir, "baseModule", "baseResolver"));
Object.assign(baseResolver.BaseEntity, {
  id: (parent: any) => parent._id,
  uuid: (parent: any) => parent._id,
  allowedViewModes: (parent: any) => parent,
  relationValues: () => ({}),
  entityView: (parent: any) => parent,
  teaserMetadata: (parent: any) => parent,
});
const { baseModule } = require(path.join(baseDir, "baseModule", "baseModule"));
const { baseFields } = require(path.join(baseDir, "sources", "forms"));
const json = (name: string) => JSON.parse(fs.readFileSync(path.join(out, name), "utf-8"));

(async () => {
  if (phase === "write") {
    // the real mutation resolver; the collection-api data source records what it is sent
    const sent: Record<string, unknown> = {};
    const CollectionAPI = {
      patchMetadata: async (_id: string, metadata: unknown) => (sent.metadata = metadata),
      patchRelations: async (_id: string, relations: unknown) => (sent.relations = relations),
      putRelations: async (_id: string, relations: unknown) => (sent.relations = relations),
      getEntity: async () => ({}),
    };
    const { formInput } = json("payload.json");
    await baseResolver.Mutation.mutateEntityValues({}, { id: "roundtrip", formInput, collection: "entities" }, { dataSources: { CollectionAPI } });
    fs.writeFileSync(path.join(out, "patch.json"), JSON.stringify(sent, null, 2));
    console.log(`write: ${(sent.metadata as unknown[] | undefined)?.length ?? 0} metadata items to PATCH`);
    return;
  }

  for (const [name, definition] of Object.entries(json("inputFields.json"))) baseFields[name] = definition;
  const entity = json("stored.json");
  const roundTrip = createModule({
    id: "roundTrip",
    typeDefs: [
      parse(
        [
          "extend type Query { RoundTripEntity: BaseEntity }",
          Object.keys(json("inputFields.json")).length ? `extend enum BaseFieldType { ${Object.keys(json("inputFields.json")).join(" ")} }` : "",
        ].join("\n"),
      ),
    ],
    resolvers: { Query: { RoundTripEntity: () => entity } },
  });
  const app = createApplication({ modules: [baseModule, roundTrip] });
  const baseFragments = fs
    .readdirSync(path.join(baseDir, "baseModule", "queries"))
    .filter((name: string) => name.endsWith(".queries.ts"))
    .flatMap((name: string) => Object.values(require(path.join(baseDir, "baseModule", "queries", name))))
    .flatMap((doc: any) => (doc && doc.definitions ? doc.definitions : []))
    .filter((d: any) => d.kind === "FragmentDefinition");
  const own = parse(`${fs.readFileSync(path.join(out, "documents.graphql"), "utf-8")}\nquery RoundTripDetail { RoundTripEntity { ...minimalRoundTrip ...fullRoundTrip } }`);
  const names = new Set(own.definitions.filter((d: any) => d.kind === "FragmentDefinition").map((d: any) => d.name.value));
  const document = visit(
    { ...own, definitions: [...own.definitions, ...baseFragments.filter((d: any) => !names.has(d.name.value))] },
    {
      SelectionSet: {
        leave(node: any, _k: unknown, parent: any) {
          if (parent && parent.kind === Kind.OPERATION_DEFINITION) return undefined;
          if (node.selections.some((s: any) => s.kind === Kind.FIELD && s.name.value === "__typename")) return undefined;
          return { ...node, selections: [...node.selections, { kind: Kind.FIELD, name: { kind: Kind.NAME, value: "__typename" } }] };
        },
      },
    },
  );
  const CollectionAPI = { getEntity: async () => null, preferredLanguage: "en" };
  const result = await app.createExecution()({ schema: app.schema, document, operationName: "RoundTripDetail", contextValue: { dataSources: { CollectionAPI } } });
  if (result.errors) throw new Error(result.errors.map((e: any) => e.message).join("; "));
  fs.writeFileSync(path.join(out, "read.json"), JSON.stringify(result.data.RoundTripEntity, null, 2));
  console.log(`read: ${Object.keys(result.data.RoundTripEntity.intialValues).length - 1} initial values`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
