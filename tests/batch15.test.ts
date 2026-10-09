/**
 * G-032: the remaining bulk option settings — a merge modal's survivor suggestion, the
 * relation types a bulk delete skips, a metadata match in the action context, image crop
 * settings, replaceExistingRelations / selectionLimit, and a modal offering several forms.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("bulk option settings", () => {
  it("conforms and renders every setting of the listing-core fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "listing-core.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities[0], "x");
    expect(work).toContain(
      [
        "            bulkOperationModal: {",
        "              typeModal: BulkOperationsMerge",
        "              askForCloseConfirmation: true",
        "              neededPermission: canupdate",
        "              survivorSuggestion: {",
        "                strategy: identifierIntegrity",
        "                autoSelect: true",
        "                requireRecommendedSurvivor: true",
        "                hiddenVerdicts: [invalid]",
        "              }",
        "            }",
      ].join("\n"),
    );
    expect(work).toContain('              formQueries: ["GetBasicWorkCreateForm"]\n              askForCloseConfirmation: false\n              skipItemsWithRelationDuringBulkDelete: ["isAssetFor"]\n');
    expect(work).toContain(
      [
        "            actionContext: {",
        "              activeViewMode: readMode",
        "              entitiesSelectionType: noneSelected",
        '              matchMetadataValue: [{ matchKey: "ocr_locked", matchValue: "false" }]',
        '              labelForTooltip: "tooltip.bulkOperationsActionBar.ocr-locked"',
        "            }",
      ].join("\n"),
    );
    expect(work).toContain(
      [
        "              typeModal: BulkOperationsEdit",
        '              formQueries: ["GetFullWorkCreateForm", "GetBasicWorkCreateForm"]',
        "              askForCloseConfirmation: true",
        "              neededPermission: canupdate",
        "              enableImageCrop: true",
        '              keyToSaveCropCoordinates: "coordinates"',
        "              replaceExistingRelations: true",
        "              selectionLimit: 1",
        "            }",
      ].join("\n"),
    );
  });
});
