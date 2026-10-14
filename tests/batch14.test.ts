/**
 * G-036: a bulk operation offering operations under it (subOptions), and where a modal
 * navigates once its form created the entity (pageToNavigateToAfterCreation).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("sub-operations", () => {
  it("conforms and renders the dropdown's operations nested, asked back with ...subOptions", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "listing-core.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const work = renderEntityFile(entities[0], "x");
    expect(work).toContain(
      [
        '            value: "openDropdown"',
        "            primary: true",
        "            actionContext: {",
        "              entitiesSelectionType: noneSelected",
        '              labelForTooltip: "tooltip.bulkOperationsActionBar.readmode-noneselected"',
        "            }",
        "            subOptions: [",
        "              {",
        "                icon: PlusCircle",
        '                label: "bulk-operations.create-word"',
        '                value: "createEntity"',
        "                bulkOperationModal: {",
        "                  typeModal: DynamicForm",
        '                  formQueries: ["GetFullWorkCreateForm"]',
        "                  askForCloseConfirmation: true",
        "                  neededPermission: cancreate",
        "                  pageToNavigateToAfterCreation: detailPage",
        "                }",
        "              }",
      ].join("\n"),
    );
    expect(work).toContain("        bulkOperationModal {\n          ...bulkOperationModal\n        }\n        subOptions {\n          ...subOptions\n        }\n      }");
  });
});
