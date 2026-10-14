/**
 * G-037: a GraphQL interface the subtypes share (no listing or detail of its own, only the
 * filters, sort options and bulk operations named after it) and the fragments a type's file
 * holds for others to spread: on FormFields, on EntityViewElements, on IntialValues with a
 * card twin on teaserMetadata.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("an interface and its shared fragments", () => {
  it("conforms, renders no listing but the shared fragments", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "interface.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities[0], "x");
    expect(work).not.toContain("fragment minimalWork");
    expect(work).not.toContain("fragment fullWork");
    expect(work).toContain("fragment filtersForWork on Work {");
    expect(work).toContain("fragment workSortOptions on Work {");
    expect(work).toContain("fragment workBulkOperations on Work {");
    expect(work).toContain('  fragment basicCreateWorkFields on FormFields {\n    original_headtitle: metaData {\n      label(input: "metadata.labels.headtitle")\n      key(input: "original_headtitle")\n      inputField(type: baseTextField) {\n        ...inputfield\n        validation(input: { value: required }) {');
    expect(work).toContain('  fragment workTitleDataWindowElement on EntityViewElements {\n    titleData: windowElement {\n      label(input: "window-element-labels.title-data")\n      titleData: panels {');
    expect(work).toContain('  fragment workTitleDataIntialValues on IntialValues {\n    refUniformTitles: keyValue(key: "refUniformTitles", source: relations, metadataKeyAsLabel: "title")\n    parallel_title_group: keyValue(key: "parallel_title_group", source: metadata)\n  }');
    // a picker on a bulk operation's modal and a list query the type names for its delete flow
    expect(work).toContain('customQueryEntityPickerList: "GetEntityPickerListForSubjectsInWork"\n              customQueryEntityPickerListFilters: "GetEntityPickerFiltersForSubjectsInWork"');
    expect(work).toContain("query GetEntityPickerFiltersForSubjectsInWork($entityType: String!)");
    expect(work).toContain("query GetAuthorsInDetailFilters($entityType: String!)");
    expect(work).toContain('  fragment workTitleDataTeaserMetadata on teaserMetadata {\n    refUniformTitles: metaData {\n      label(input: "metadata.labels.uniform-title")\n      key(input: "refUniformTitles")\n    }');
  });
});
