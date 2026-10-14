/**
 * G-026: values read on a relation of the host entity (relationKey, uuid: $userUuid,
 * relationDirection; the list document declares $userUuid), values of a parent entity found
 * by a key (parentRelations: [{ entityType, key }]), and a card field shown as relationRootData
 * and edited in place.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("values on a relation of the host entity", () => {
  it("conforms and renders relationKey, the host uuid, the direction, the parent key and an editable card field", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "inline-listing.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities.find((e) => e.graphqlType === "Work")!, "x");
    expect(work).toContain("    $searchInputType: SearchInputType\n    $userUuid: String!\n  ) {");
    expect(work).toContain('main_author: keyValue(key: "main_author", source: relationMetadata, uuid: $userUuid, relationKey: "refAuthors")');
    expect(work).toContain('volume: keyValue(key: "volume", source: relationMetadata, uuid: $userUuid, relationDirection: fromRelatedEntity, relationKey: "refSeries")');
    expect(work).toContain('domein: keyValue(key: "title", source: parentMetadata, parentRelations: [{ entityType: zizo, key: ["vlacc:1|properties.ref_sub_zizos.value"] }])');
    expect(work).toContain('roles: keyValue(key: "roles", source: relationRootdata, uuid: $userUuid, relationKey: "isUserFor")');
    expect(work).toContain('            function_indication: relationMetaData {\n              label(input: "metadata.labels.function-indication")\n              key(input: "function_indication")\n              inputField(type: workFunctionTypeField) {\n                ...inputfield\n                validation(input: { value: required }) {');
    expect(work).toContain('            roles: relationRootData {\n              label(input: "metadata.labels.roles")\n              key(input: "roles")\n              inputField(type: rolesTypeField) {\n                ...inputfield\n              }\n            }');
  });
});
