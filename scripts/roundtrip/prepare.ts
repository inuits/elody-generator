/**
 * Value-preservation round trip, step 1 (host): the test shapes → fromShacl
 * → declaration → generated GraphQL documents and custom input fields.
 *
 * usage: tsx scripts/roundtrip/prepare.ts <outDir>
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fromShacl } from "../../src/fromShacl.js";
import { readUiDeclaration } from "../../src/parse.js";
import { renderEntityFile } from "../../src/render.js";
import { validateDeclaration } from "../../src/validate.js";

const here = import.meta.dirname;
const out = process.argv[2] ?? join(here, "out");
mkdirSync(out, { recursive: true });

const { ttl } = await fromShacl(readFileSync(join(here, "shapes.ttl"), "utf-8"), { id: "roundtrip", documentName: "RoundTrip", title: "Round trip" });
const report = await validateDeclaration(ttl);
if (!report.conforms) throw new Error(`declaration does not conform: ${JSON.stringify(report.issues)}`);
const { entities, inputFields } = await readUiDeclaration(ttl);
const file = renderEntityFile(entities[0], "scripts/roundtrip/declaration.ui.ttl");
writeFileSync(join(out, "declaration.ui.ttl"), ttl);
writeFileSync(join(out, "documents.graphql"), file.slice(file.indexOf("gql`") + 4, file.lastIndexOf("`;")).trim() + "\n");
writeFileSync(join(out, "inputFields.json"), JSON.stringify(inputFields, null, 2));
console.log(`prepared ${entities[0].properties.length} properties in ${out}`);
