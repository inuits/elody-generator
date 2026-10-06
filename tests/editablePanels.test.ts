/**
 * Edit mode on the detail page. The PWA writes back only the panel fields
 * that carry an input field (getEditableMetadataKeys), so an editable panel
 * renders each writable property with the same widget as the create form.
 * fromShacl makes the panels editable; dash:readOnly on a property keeps that
 * one property read-only.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { fromShacl } from "../src/fromShacl.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";

const shapes = readFileSync(join(__dirname, "..", "scripts", "roundtrip", "shapes.ttl"), "utf-8");
const detailOf = async (source = shapes) => {
  const { ttl } = await fromShacl(source, { id: "rt", documentName: "RoundTrip" });
  const { entities } = await readUiDeclaration(ttl);
  const file = renderEntityFile(entities[0], "x.ui.ttl");
  return { entity: entities[0], detail: file.slice(file.indexOf("entityView")) };
};
// one panel field: from "key: metaData {" to the closing brace at the same indentation
const fieldBlock = (detail: string, key: string) => {
  const lines = detail.split("\n");
  const first = lines.findIndex((line) => line.trim() === `${key}: metaData {`);
  const indent = lines[first].length - lines[first].trimStart().length;
  const last = lines.findIndex((line, index) => index > first && line === `${" ".repeat(indent)}}`);
  return lines.slice(first, last + 1).join("\n");
};

describe("editable detail panels", () => {
  it("fromShacl makes the panels editable", async () => {
    const { entity, detail } = await detailOf();
    expect(entity.detail!.columns[0].elements[0].panels.every((panel) => panel.editable)).toBe(true);
    expect(detail).not.toContain("isEditable(input: false)");
  });

  it("gives every writable panel field the create form's widget", async () => {
    const { detail } = await detailOf();
    expect(fieldBlock(detail, "title")).toMatch(/inputField\(type: baseTextField\) \{[\s\S]*?\.\.\.inputfield[\s\S]*?validation\(input: \{ value: required \}\)/);
    expect(fieldBlock(detail, "pages")).toContain("inputField(type: baseNumberField)");
    expect(fieldBlock(detail, "available")).toContain("inputField(type: baseCheckbox)");
    expect(fieldBlock(detail, "published")).toContain("inputField(type: baseDateField)");
    expect(fieldBlock(detail, "label")).toMatch(/isMultilingual\(input: true\)[\s\S]*inputField\(type: baseTextField\)/);
  });

  it("keeps a dash:readOnly property read-only", async () => {
    const readOnly = shapes.replace(
      'sh:datatype xsd:integer ; sh:maxCount 1 ; sh:order 3 .',
      'sh:datatype xsd:integer ; sh:maxCount 1 ; sh:order 3 ; <http://datashapes.org/dash#readOnly> true .',
    );
    const { detail } = await detailOf(readOnly);
    expect(fieldBlock(detail, "pages")).not.toContain("inputField");
    expect(fieldBlock(detail, "title")).toContain("inputField");
  });
});

describe("relation-valued properties on the detail page", () => {
  it("stay read-only there: shown through the relation, edited in the create form", async () => {
    const shapes07 = readFileSync(join(__dirname, "..", "spec", "examples", "07-edit-predicate-paths.shapes.ttl"), "utf-8");
    const { detail } = await detailOf(shapes07);
    expect(fieldBlock(detail, "isMemberFor")).not.toContain("inputField");
    expect(fieldBlock(detail, "name")).toContain("inputField(type: baseTextField)");
  });
});
