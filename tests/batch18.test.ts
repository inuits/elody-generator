/**
 * G-029: card, panel, form, menu and sort-option extras — lineClamp, permitted, linkText,
 * copyToClipboard, nonEditableField, tooltip, a unit on the card only, valueTranslationKey, a card
 * alias of its own, a card widget without validation, a widget in a read-only panel, sort option
 * pages, a panel's repetition and display condition, a panel leaving panelType / isEditable unsaid,
 * the id read at the top of the listing and among its values, form field tooltip / defaultValue /
 * no widget / virtual keyboard / picker search, a submit action of its own, menu action can and
 * showAsButton; and a field asked back twice counts once in compare.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { compareDefinitions, readDefinitions } from "../src/compare.js";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

const gqlFile = (path: string, body: string) => ({ path, source: `import { gql } from "graphql-modules";\nexport const x = gql\`\n${body}\n\`;\n` });

describe("card, panel, form, menu and sort-option extras", () => {
  it("conforms and renders the card-panel-extras fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "card-panel-extras.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const note = renderEntityFile(entities[0], "x");
    // the listing: id on top and among the values; the card under its own alias, clamped, translated, its widget without validation
    expect(note).toContain("  fragment minimalNote on Note {\n    id\n    intialValues {\n      id\n");
    expect(note).toMatch(/heading: metaData \{\n\s+label\(input: "metadata.labels.title"\)\n\s+key\(input: "title"\)\n\s+lineClamp\(input: "3"\)\n\s+highlightIfPrimaryThumbnail\(input: true\)\n\s+\}/);
    expect(note).toContain('aggregation: "size"');
    expect(note).toContain("        primary\n        availableInPages {\n          routeName\n          entityType\n        }");
    expect(note).toMatch(/access: metaData \{\n\s+label\(input: "metadata.labels.access"\)\n\s+key\(input: "access"\)\n\s+valueTranslationKey\(input: "access-levels.\$value"\)\n\s+inputField\(type: baseTextField\) \{\n\s+\.\.\.inputfield\n\s+\}\n\s+\}/);
    expect(note).toContain('availableInPages: [{ routeName: SingleEntity, entityType: note }]');
    // the menu action
    expect(note).toMatch(/showAsButton\(input: true\)\n\s+can\(input: \["update:note"\]\)/);
    expect(note).toMatch(/primaryThumbnail: doGeneralAction \{\n\s+action\(input: SetPrimaryThumbnail\)\n\s+label\(input: "contextMenu.setPrimaryThumbnail"\)\n\s+icon\(input: "ImageCheck"\)/);
    expect(note).toMatch(/refreshData: doCustomAction \{\n\s+action\(input: EndpointCall\)\n\s+label\(input: "contextMenu.refresh-data"\)\n\s+icon\(input: "Bolt"\)\n\s+endpointUrl\(input: "api\/entities\/\$id\/sync-origins"\)\n\s+endpointMethod\(input: "POST"\)\n\s+can\(input: \["create:note"\]\)/);
    expect(note).toContain("        key\n        aggregation\n        label");
    // the panels: the read-only one with its repetition, condition, extras and the widget on access; the bare one unsaid
    const panels = note.slice(note.indexOf("info: panels {"));
    expect(panels).toMatch(/repetitionConfig\(repetitionKey: "options"\) \{\n\s+repetitionKey\n\s+\}\n\s+displayCondition \{\n\s+key\(input: "refOmnibus"\)\n\s+\}/);
    expect(panels).toMatch(/heading_in_panel: metaData \{\n\s+label\(input: "metadata.labels.title"\)\n\s+key\(input: "title"\)\n\s+tooltip\(input: "tooltip.metadata.title"\)\n\s+lineClamp\(input: "2"\)/);
    expect(panels).toContain('validation(input: { value: customValue, fastValidationMessage: "validation.title-error", customValue: "between:1,80" })');
    expect(panels).toMatch(/virtualKeyboardConfig\(input: \{ layouts: \["Arabic"\] \}\) \{\n\s+layouts\n\s+\}/);
    // a read-only panel: the widget on the property that asks for one
    const ro = panels.slice(panels.indexOf("ro: panels {"));
    expect(ro).toMatch(/note: metaData \{\n\s+label\(input: "metadata.labels.note"\)\n\s+key\(input: "note"\)\n\s+inputField\(type: baseTextField\) \{\n\s+\.\.\.inputfield\n\s+\}\n\s+\}/);
    expect(panels).toMatch(/linkText\(input: "metadata.labels.download-link"\)\n\s+copyToClipboard\(input: true\)\n\s+nonEditableField\(input: true\)\n[\s\S]*?permitted\(input: \["read:url:field"\]\)\n\s+\}/);
    expect(panels).toMatch(/access: metaData \{\n\s+label\(input: "metadata.labels.access"\)\n\s+key\(input: "access"\)\n\s+valueTranslationKey\(input: "access-levels.\$value"\)\n\s+inputField\(type: baseTextField\) \{\n\s+\.\.\.inputfield\n\s+validation\(input: \{ value: required \}\)/);
    expect(panels).toContain('permitted(input: ["read:url:field"])');
    expect(panels).not.toContain("unit(input: DATETIME_DEFAULT)");
    expect(note.slice(0, note.indexOf("info: panels {"))).toContain("unit(input: DATETIME_DEFAULT)");
    const bare = panels.slice(panels.indexOf("bare: panels {"), panels.indexOf("bare: panels {") + 400);
    expect(bare).not.toContain("panelType(");
    expect(bare).not.toContain("isEditable(");
    // the form
    expect(note).toMatch(/tooltip\(input: "tooltip.metadata.title"\)\n\s+inputField\(type: noteTitleField\) \{/);
    expect(note).toMatch(/virtualKeyboardConfig\(input: \{ layouts: \["Arabic", "Cyrillic"\] \}\) \{\n\s+layouts\n\s+\}/);
    expect(note).toContain('defaultValue(input: "active")');
    expect(note).toMatch(/field: metaData \{\n\s+label\(input: "bulk-operations.delete-labels.mediafiles"\)\n\s+key\(input: "field"\)\n\s+\}/);
    expect(note).toMatch(/entityPickerSearchConfig\(input: \{ mode: Search, metadataKeys: \["vlacc:1\|properties.name.value"\], acceptedTypes: \["group"\] \}\) \{\n\s+mode\n\s+metadataKeys\n\s+acceptedTypes\n\s+staticFilters\n\s+\}/);
    expect(note).toMatch(/submit: action \{\n\s+label\(input: "actions.labels.start-ocr"\)\n\s+icon\(input: Process\)\n\s+actionType\(input: ocr\)/);
  });

  it("extracts the extras back", () => {
    const files = [
      {
        path: "queries/entities/note.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const note = gql\`
  fragment minimalNote on Note {
    id
    intialValues { id title: keyValue(key: "title", source: metadata) subdomain: keyValue(key: "subdomain", source: metadata) access: keyValue(key: "access", source: metadata) start: keyValue(key: "start", source: metadata) url: keyValue(key: "url", source: metadata) }
    teaserMetadata {
      title: metaData { label(input: "metadata.labels.subdomain") key(input: "subdomain") lineClamp(input: "3") highlightIfPrimaryThumbnail(input: true) }
      access: metaData { label(input: "metadata.labels.access") key(input: "access") valueTranslationKey(input: "access-levels.$value") inputField(type: baseTextField) { ...inputfield } }
      start: metaData { label(input: "metadata.labels.start") key(input: "start") unit(input: DATETIME_DEFAULT) }
      buttons { contextMenu { editOrder: doElodyAction { action(input: UpdateMetadata) showAsButton(input: true) label(input: "contextMenu.edit") icon(input: "Update") can(input: ["update:note"]) __typename }
        primaryThumbnail: doGeneralAction { label(input: "contextMenu.setPrimaryThumbnail") action(input: SetPrimaryThumbnail) icon(input: "ImageCheck") __typename }
        refreshData: doCustomAction { label(input: "contextMenu.refresh-data") icon(input: "Bolt") action(input: EndpointCall) endpointUrl(input: "api/entities/$id/sync-origins") endpointMethod(input: "POST") can(input: ["create:note"]) __typename } } }
    }
    ...minimalBaseEntity
  }
  fragment fullNote on Note {
    intialValues { title: keyValue(key: "title", source: metadata) subdomain: keyValue(key: "subdomain", source: metadata) access: keyValue(key: "access", source: metadata) start: keyValue(key: "start", source: metadata) url: keyValue(key: "url", source: metadata) }
    entityView { column { elements { windowElement { label(input: "w")
      info: panels { panelHeaderContent(panelHeaderContentInput: { label: "p" }) { label } panelType(input: metadata) isCollapsed(input: false) isEditable(input: false)
        repetitionConfig(repetitionKey: "options") { repetitionKey } displayCondition { key(input: "refOmnibus") }
        heading: metaData { label(input: "metadata.labels.title") key(input: "title") tooltip(input: "tooltip.metadata.title") lineClamp(input: "2") inputField(type: baseTextField) { validation(input: { value: customValue, fastValidationMessage: "validation.title-error", customValue: "between:1,80" }) { ...validation } virtualKeyboardConfig(input: { layouts: ["Arabic"] }) { layouts } ...inputfield } }
        url: metaData { label(input: "metadata.labels.url") key(input: "url") linkText(input: "metadata.labels.download-link") copyToClipboard(input: true) nonEditableField(input: true) permitted(input: ["read:url:field"]) }
        access: metaData { label(input: "metadata.labels.access") key(input: "access") inputField(type: baseTextField) { ...inputfield } }
        start: metaData { label(input: "metadata.labels.start") key(input: "start") } }
      bare: panels { panelHeaderContent(panelHeaderContentInput: { label: "b" }) { label } isCollapsed(input: true) title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    } } } }
  }
  fragment filtersForNote on Note {
    advancedFilters { number_of_notes: advancedFilter(type: number key: "lookup.virtual_relations.hasNote" aggregation: "size" label: "metadata.labels.number-of-notes" isDisplayedByDefault: true) { type key label isDisplayedByDefault } }
  }
  fragment noteSortOptions on Note {
    sortOptions { options(input: [{ icon: NoIcon, label: "metadata.labels.title", value: "title", primary: true, availableInPages: [{ routeName: SingleEntity, entityType: note }] }]) { icon label value } isAsc(input: asc) }
  }
  query GetNoteCreateForm {
    GetDynamicForm { label(input: "navigation.create-note") note: formTab { formFields {
      title: metaData { label(input: "metadata.labels.title") key(input: "title") tooltip(input: "tooltip.metadata.title") inputField(type: baseTextField) { validation(input: { value: required }) { ...validation } virtualKeyboardConfig(input: { layouts: ["Arabic", "Cyrillic"] }) { layouts } ...inputfield } }
      status: metaData { label(input: "metadata.labels.status") key(input: "status") defaultValue(input: "active") inputField(type: baseTextField) { ...inputfield } }
      field: metaData { label(input: "bulk-operations.delete-labels.mediafiles") key(input: "field") }
      entityPicker: metaData { label(input: "metadata.labels.entity-picker") key(input: "entityPicker") inputField(type: baseEntityPickerField) { entityPickerSearchConfig(input: { mode: Search metadataKeys: ["vlacc:1|properties.name.value"] acceptedTypes: ["group"] }) { mode metadataKeys acceptedTypes staticFilters } ...inputfield } }
      submit: action { label(input: "actions.labels.start-ocr") icon(input: Process) actionType(input: ocr) actionQuery(input: "GenerateOcr") showsFormErrors(input: true) }
    } } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("declared as a plain submit") || n.includes("not a keyValue") || n.includes("does not parse"))).toEqual([]);
    expect(ttl).toContain("elody:idField true ;");
    expect(ttl).toContain("elody:idValue true ;");
    expect(ttl).toContain('elody:cardAlias "title"');
    expect(ttl).toContain('elody:cardLineClamp "3" ;');
    expect(ttl).toContain('elody:panelLineClamp "2" ;\n    elody:panelAlias "heading" ;\n    elody:validationMessage "validation.title-error" ;\n    elody:virtualKeyboardLayouts ( "Arabic" ) ;');
    expect(ttl).toContain("elody:highlightIfPrimaryThumbnail true ;");
    expect(ttl).toContain('elody:filterAggregation "size" ;');
    expect(ttl).toContain('elody:valueTranslationKey "access-levels.$value" ;');
    expect(ttl).toContain("elody:cardValidates false");
    expect(ttl).toContain("elody:panelWidget true ;");
    expect(ttl).toContain("elody:panelShowsUnit false ;");
    expect(ttl).toContain('elody:permitted "read:url:field" ;\n    elody:linkText "metadata.labels.download-link" ;\n    elody:copyToClipboard true ;\n    elody:nonEditable true ;');
    expect(ttl).toContain('elody:tooltipKey "tooltip.metadata.title" ;');
    expect(ttl).toContain('elody:sortPage [ elody:routeName "SingleEntity" ; elody:routeEntityType "note" ] ;');
    expect(ttl).toContain('elody:showAsButton true ;\n      elody:can "update:note" ]');
    expect(ttl).toContain('elody:actionForm "doGeneralAction" ;\n      rdfs:label "contextMenu.setPrimaryThumbnail" ;\n      elody:actionKind elody:SetPrimaryThumbnailAction ;');
    expect(ttl).toContain('elody:actionForm "doCustomAction" ;\n      rdfs:label "contextMenu.refresh-data" ;\n      elody:actionKind elody:EndpointCallAction ;\n      elody:icon "Bolt" ;\n      elody:endpointUrl "api/entities/$id/sync-origins" ;\n      elody:endpointMethod "POST" ;\n      elody:can "create:note" ]');
    expect(ttl).toContain('elody:repetitionKey "options" ;\n  elody:displayConditionKey "refOmnibus" ;');
    expect(ttl).toMatch(/ui:NoteUi-bare\n(?:.*\n)*?  elody:editableDefault true ;/);
    expect(ttl).not.toMatch(/ui:NoteUi-bare\n(?:.*\n)*?  elody:panelKind/);
    expect(ttl).toMatch(/sh:defaultValue "active" [;\]]/);
    expect(ttl).toContain("elody:noWidget true ;");
    expect(ttl).toMatch(/elody:virtualKeyboardLayouts \( "Arabic" "Cyrillic" \) [;\]]/);
    expect(ttl).toContain('elody:pickerSearch [ elody:pickerSearchMode "Search" ; elody:keys ( "vlacc:1|properties.name.value" ) ; elody:acceptedTypes "group" ] ;');
    expect(ttl).toContain('elody:submitAction "ocr" ;');
  });

  it("counts a field asked back twice once", () => {
    const twice = readDefinitions([gqlFile("entities/a.queries.ts", "fragment filtersForA on A { advancedFilters { k: advancedFilter(type: selection key: [\"k\"]) { type key advancedFilterInputForRetrievingOptions { type key value key match_exact } } } }")]).definitions;
    const once = readDefinitions([gqlFile("entities/a.queries.ts", "fragment filtersForA on A { advancedFilters { k: advancedFilter(type: selection key: [\"k\"]) { type key advancedFilterInputForRetrievingOptions { type key value match_exact } } } }")]).definitions;
    expect(compareDefinitions(twice, once).definitions[0].status).toBe("equal");
  });
});
