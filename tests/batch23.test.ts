/**
 * G-041: what a guided flow and its steps may still say — a linear flow that starts on its first
 * step, returns a selection or routes somewhere when it finishes, and steps with a back button,
 * collapsed picker filters, a search skipped after a new prior entity, a terminal action, a search
 * scoped to a prior step's relation, relations to create, and the types the step may create.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("guided flow extras", () => {
  it("conforms and renders the flow-extras fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "flow-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const entity = entities.find((e) => e.graphqlType === "Muziekweb")!;
    const flow = entity.repetitiveForms[0];
    expect(flow.linear).toBe(true);
    expect(flow.startOnFirstStep).toBe(true);
    expect(flow.returnsSelection).toBe(false);
    expect(flow.routeToStep).toBe("manifestation");
    expect(flow.routeToRoute).toBe("WemOverview");
    expect(flow.steps[1].scope).toEqual({ step: "work", relationType: "refWork", filterKey: "vlacc:1|properties.ref_work.value" });
    expect(flow.steps[1].relations).toEqual([{ to: "work", relationType: "refWork", createWhen: "always", order: 1, metadataFields: [{ formMetadataKey: "function", relationMetadataKey: "function_indication", asArray: undefined, order: 1 }, { formMetadataKey: "on_label", relationMetadataKey: "on_label", asArray: true, order: 2 }] }]);
    expect(flow.steps[1].creatableTypes?.map((t) => t.createForm)).toEqual(["GetReadingFromMuziekwebCreateForm", "GetListeningFromMuziekwebCreateForm"]);
    const out = renderEntityFile(entity, "x");
    expect(out).toMatch(/refetchOnFinish|repeatable\(input: false\)\n\s+linear\(input: true\)\n\s+startOnFirstStep\(input: true\)\n\s+returnsSelection\(input: false\)\n\s+routeToStep\(input: "manifestation"\)\n\s+routeToRoute\(input: "WemOverview"\)/);
    expect(out).toMatch(/key\(input: "work"\)\n\s+label\(input: "repetitiveForm.step-work"\)[\s\S]*?pickerFiltersCollapsed\(input: false\)\n\s+acceptedTypes\(input: \["work"\]\)\n\s+maxSelection\(input: 1\)\n\s+terminalActionLabel\(input: "repetitiveForm.tag-this-work"\)/);
    expect(out).toMatch(/key\(input: "expression"\)\n\s+showBackButton\(input: false\)\n\s+label\(input: "repetitiveForm.step-expression"\)/);
    expect(out).toMatch(/acceptedTypes\(input: \["expression"\]\)\n\s+skipSearchIfPriorIsNew\(input: true\)\n\s+maxSelection\(input: 1\)/);
    expect(out).toMatch(/entityType\(input: "expression"\)\n\s+metadataOnly\(input: false\)/);
    expect(out).toMatch(/scopeToRelationOf \{\n\s+step\(input: "work"\)\n\s+relationType\(input: "refWork"\)\n\s+filterKey\(input: "vlacc:1\|properties.ref_work.value"\)\n\s+\}/);
    expect(out).toMatch(/relations \{\n\s+to\(input: "work"\)\n\s+relationType\(input: "refWork"\)\n\s+createWhen\(input: always\)\n\s+metadataFields\(\n\s+input: \[\n\s+\{ formMetadataKey: "function", relationMetadataKey: "function_indication" \}\n\s+\{ formMetadataKey: "on_label", relationMetadataKey: "on_label", asArray: true \}\n\s+\]\n\s+\) \{\n\s+formMetadataKey\n\s+relationMetadataKey\n\s+asArray\n\s+\}\n\s+\}/);
    expect(out).toMatch(/creatableTypes\(\n\s+input: \[\n\s+\{ label: "entity-translations.reading", entityType: "reading", createForm: "GetReadingFromMuziekwebCreateForm" \}\n\s+\{ label: "entity-translations.listening", entityType: "listening", createForm: "GetListeningFromMuziekwebCreateForm" \}\n\s+\]\n\s+\) \{\n\s+label\n\s+entityType\n\s+createForm\n\s+\}/);
  });

  it("extracts them back", () => {
    const files = [
      {
        path: "queries/entities/muziekweb.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const muziekweb = gql\`
  fragment minimalMuziekweb on Muziekweb {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  query GetRepetitiveFormForMuziekweb {
    GetRepetitiveForm {
      label(input: "repetitiveForm.linear-title")
      repeatable(input: false)
      linear(input: true)
      startOnFirstStep(input: true)
      returnsSelection(input: false)
      routeToStep(input: "manifestation")
      routeToRoute(input: "WemOverview")
      work: steps {
        key(input: "work")
        label(input: "repetitiveForm.step-work")
        entityType(input: "work")
        createForm(input: "GetWorkFromMuziekwebCreateForm")
        pickerFiltersCollapsed(input: false)
        acceptedTypes(input: ["work"])
        maxSelection(input: 1)
        terminalActionLabel(input: "repetitiveForm.tag-this-work")
      }
      expression: steps {
        key(input: "expression")
        showBackButton(input: false)
        label(input: "repetitiveForm.step-expression")
        entityType(input: "expression")
        metadataOnly(input: false)
        acceptedTypes(input: ["expression"])
        skipSearchIfPriorIsNew(input: true)
        maxSelection(input: 1)
        scopeToRelationOf { step(input: "work") relationType(input: "refWork") filterKey(input: "vlacc:1|properties.ref_work.value") }
        relations { to(input: "work") relationType(input: "refWork") createWhen(input: always) metadataFields(input: [{ formMetadataKey: "function", relationMetadataKey: "function_indication" }]) { formMetadataKey relationMetadataKey } }
        creatableTypes(input: [{ label: "entity-translations.reading", entityType: "reading", createForm: "GetReadingFromMuziekwebCreateForm" }]) { label entityType createForm }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("does not parse"))).toEqual([]);
    expect(ttl).toContain("elody:repeatable false ;\n  elody:linear true ;\n  elody:startOnFirstStep true ;\n  elody:returnsSelection false ;\n  elody:routeToStep \"manifestation\" ;\n  elody:routeToRoute \"WemOverview\" ;");
    expect(ttl).toContain('elody:maxSelection 1 ;\n    elody:pickerFiltersCollapsed false ;\n    elody:terminalActionLabel "repetitiveForm.tag-this-work" ] ,');
    expect(ttl).toContain("elody:maxSelection 1 ;\n    elody:showBackButton false ;\n    elody:skipSearchIfPriorIsNew true ;\n    elody:metadataOnly false ;");
    expect(ttl).toContain('elody:scopeToRelationOf [ elody:fromStep "work" ; elody:relationType "refWork" ; elody:filterKey "vlacc:1|properties.ref_work.value" ] ;');
    expect(ttl).toContain('elody:stepRelation [ sh:order 1 ; elody:to "work" ; elody:relationType "refWork" ; elody:createWhen "always" ;\n      elody:metadataField [ sh:order 1 ; elody:formMetadataKey "function" ; elody:relationMetadataKey "function_indication" ] ] ;');
    expect(ttl).toContain('elody:creatableType [ sh:order 1 ; elody:labelKey "entity-translations.reading" ; elody:entityType "reading" ; elody:form ui:GetReadingFromMuziekwebCreateForm ]');
  });
});
