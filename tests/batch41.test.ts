/**
 * G-029 leftovers: a filter's options limit, a hidden field's source, a copy-from-parent button,
 * an info panel (on a field and on a wysiwyg panel element), a masked secret, and a list element's
 * display condition.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("field, filter and element extras", () => {
  it("renders them", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "field-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toContain("limitConfig: { optionsLimit: 30 }");
    expect(out).toMatch(/limitConfig \{\n\s+optionsLimit\n\s+\}/);
    expect(out).toMatch(/_key: metaData \{[^]*?masked\(input: true\)\n\s+revealQuery\(input: "GetTokenSecret"\)\n\s+infoPanel\(title: "info.token-secret-title", content: "info.token-secret-content"\) \{\n\s+title\n\s+content\n\s+\}/);
    expect(out).toMatch(/reading: wysiwygElement \{\n\s+label\(input: "metadata.labels.reading"\)\n\s+metadataKey\(input: "reading"\)\n\s+infoPanel\(title: "metadata.labels.editorial-conventions", content: """[^]*?<li>Line one<\/li>[^]*?"""\) \{\n\s+title\n\s+content\n\s+\}\n\s+extensions\(input: \[starterKit\]\)\n\s+wysiwygElementConfiguration \{\n\s+showLineNumbers\(input: false\)/);
    expect(out).toMatch(/OmnibusParts: entityListElement \{\n\s+label\(input: "element-labels.parts-omnibus"\)\n\s+displayCondition \{\n\s+key\(input: "is_omnibus"\)\n\s+value\(input: "true"\)\n\s+\}/);
    expect(out).toMatch(/plain: panels \{[^]*?reading: metaData \{\n\s+label\(input: "metadata.labels.reading"\)\n\s+key\(input: "reading"\)/);
    expect(out).toContain('copyValueFromParent(input: { label: "bulk-operations.copy-title-from-work", key: "original_headtitle", fromRelationType: "refWork" }) {');
    expect(out).toContain('hiddenField(input: { hidden: true, inherited: true, entityType: script, relationToExtractKey: "refScript", keyToExtractValue: "relationValues.refLanguage.key" }) {');
  });

  it("extracts them", () => {
    const files = [
      {
        path: "queries/entities/token.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const token = gql\`
  fragment minimalToken on Token {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullToken on Token {
    intialValues { title: keyValue(key: "title", source: metadata) _key: keyValue(key: "_key", source: root) }
    entityView { column { size(size: seventy) elements {
      windowElement { label(input: "Secret") secret: panels { label(input: "panel-labels.secret") panelType(input: metadata) isCollapsed(input: false) isEditable(input: false)
        _key: metaData { label(input: "metadata.labels.token-key") key(input: "_key") masked(input: true) revealQuery(input: "GetTokenSecret") copyToClipboard(input: true) infoPanel(title: "info.token-secret-title" content: "info.token-secret-content") { title content } }
        reading_field: wysiwygElement { label(input: "metadata.labels.reading") metadataKey(input: "reading") infoPanel(title: "metadata.labels.editorial-conventions" content: """<ul>
  <li>Line one</li>
</ul>""") { title content } extensions(input: [starterKit]) wysiwygElementConfiguration { showLineNumbers(input: false) } } } }
      OmnibusParts: entityListElement { displayCondition { key(input: "is_omnibus") value(input: "true") } label(input: "element-labels.parts-omnibus") isCollapsed(input: false) entityTypes(input: [expression]) relationType: label(input: "hasExpression") searchInputType(input: "AdvancedInputType") }
    } } }
  }
  fragment filtersForToken on Token {
    advancedFilters { ref_script: advancedFilter(type: selection matchersType: selectionForRelation key: ["aicap:1|properties.ref_script.value"] label: "metadata.labels.script" selectionOption: checkboxlist isDisplayedByDefault: true filterOptionsMapping: { label: "intialValues.name" } limitConfig: { optionsLimit: 30 }) { type matchersType key label selectionOption isDisplayedByDefault filterOptionsMapping { label value } limitConfig { optionsLimit } } }
  }
  query GetTokenCreateForm { GetDynamicForm { token: formTab { formFields {
    title: metaData { label(input: "metadata.labels.title") key(input: "title") inputField(type: baseTextField) { ...inputfield } copyValueFromParent(input: { label: "bulk-operations.copy-title-from-work" key: "original_headtitle" fromRelationType: "refWork" }) { ...copyValueFromParent } }
    refLanguage: metaData { label(input: "metadata.labels.language") key(input: "refLanguage") hiddenField(input: { hidden: true inherited: true entityType: script relationToExtractKey: "refScript" keyToExtractValue: "relationValues.refLanguage.key" }) { ...hiddenField } inputField(type: refLanguage) { ...inputfield } }
  } } } }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term/.test(n))).toEqual([]);
    expect(ttl).toContain("    elody:optionsLimit 30 ;");
    expect(ttl).toContain('    elody:masked true ;\n    elody:revealQuery "GetTokenSecret" ;');
    expect(ttl).toContain('    elody:infoPanel [ elody:infoTitle "metadata.labels.editorial-conventions" ; elody:infoContent "<ul>\\n  <li>Line one</li>\\n</ul>" ] ;\n    shui:viewer shui:HTMLViewer ;');
    expect(ttl).toMatch(/elody:displayConditionKey "is_omnibus" ;\n\s+elody:displayConditionValue "true" ;/);
    expect(ttl).toContain('    elody:panelAlias "reading_field" ;');
    expect(ttl).toContain('    shui:viewer shui:HTMLViewer ;\n    elody:extensions ( elody:StarterKitExtension ) ;\n    elody:showLineNumbers false ;');
    expect(ttl).toContain('      elody:hiddenValueFrom [ elody:entityType "script" ; elody:relationType "refScript" ; elody:key "relationValues.refLanguage.key" ; elody:inherited true ] ;');
    expect(ttl).toContain('      elody:copyValueFromParent [ elody:labelKey "bulk-operations.copy-title-from-work" ; elody:key "original_headtitle" ; elody:relationType "refWork" ] ;');
  });
});
