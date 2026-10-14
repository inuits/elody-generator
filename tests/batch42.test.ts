/**
 * G-042: a hierarchy list element with its single-entity query (per-type inline listings, a card
 * constant, a copy button on the card), and a rich text panel element that tags entities and
 * transliterates.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("hierarchy lists and tagging rich text", () => {
  it("renders the hierarchy list, its single-entity query, the tagging and the transliteration", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "hierarchy-tagging.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "Inscription")!, "x", entities);
    expect(out).toMatch(/hierarchyList: hierarchyListElement \{\n\s+label\(input: "navigation.hierarchy"\)\n\s+isCollapsed\(input: false\)\n\s+hierarchyRelationList\(input: \[\{ key: "refPoint", entityType: point \}, \{ key: "refSite", entityType: site \}\]\) \{\n\s+key\n\s+entityType\n\s+\}\n\s+customQuery\(input: "GetEntityForHierarchy"\)\n\s+can\(input: \["read:gps_coordinates:field"\]\)\n\s+entityTypeAsCenterPoint\(input: point\)\n\s+centerCoordinatesKey\(input: "gps_coordinates"\)/);
    expect(out).toMatch(/query GetEntityForHierarchy\(\$id: String!, \$type: String!\) \{\n\s+Entity\(id: \$id, type: \$type\) \{\n\s+id\n\s+uuid\n\s+type\n\s+\.\.\. on Point \{[^]*?type: metaData \{\n\s+label\(input: "metadata.labels.type"\)\n\s+customValue\(input: "Point"\)[^]*?gps_coordinates: metaData \{[^]*?copyToClipboard\(input: true\)/);
    expect(out).toMatch(/reading: wysiwygElement \{[^]*?transliterationConfig \{\n\s+enabledByProperty\(input: "enableTransliteration"\)\n\s+latin: transliterationConfigItem\(label: "Latin", mappingKey: "ArabicToLatin"\) \{[^]*?arabic: transliterationConfigItem\(label: "Arabic", mappingKey: "LatinToArabic", insertSpaces: true\)/);
    expect(out).toMatch(/taggingConfiguration \{\n\s+customQuery\(input: "GetTagEntities"\)\n\s+taggableEntityConfiguration\(\n\s+configuration: \[\n\s+\{ taggableEntityType: word, createNewEntityFormQuery: "GetWordCreateForm", relationType: "refWords", metadataFilterForTagContent: "aicap:1\|properties.original_word.value", replaceCharacterFromTagSettings: \[\{ replacementCharactersRegex: "\/<br>\/g", characterToReplaceWith: " " \}\], metadataKeysToSetAsAttribute: \["lemma"\], tagConfigurationByEntity: \{ configurationEntityType: epi_doc_tag, configurationEntityRelationType: "refEpiDocTag", tagMetadataKey: "tag", colorMetadataKey: "color", metadataKeysToSetAsAttribute: \["type"\], secondaryAttributeToDetermineTagConfig: "type" \} \}/);
    expect(out).toContain("query GetTagEntities(");
  });

  it("extracts them", () => {
    const files = [
      {
        path: "queries/entities/inscription.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const inscription = gql\`
  fragment minimalInscription on Inscription {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment fullInscription on Inscription {
    intialValues { title: keyValue(key: "title", source: metadata) reading: keyValue(key: "reading", source: metadata) }
    entityView { column { size(size: seventy) elements {
      windowElement { label(input: "Info") info: panels { label(input: "panel-labels.info") panelType(input: metadata) isEditable(input: true) isCollapsed(input: false)
        reading: wysiwygElement { label(input: "metadata.labels.reading") metadataKey(input: "reading") extensions(input: [doc, paragraph])
          wysiwygElementConfiguration { showLineNumbers(input: true) transliterationConfig { enabledByProperty(input: "enableTransliteration") latin: transliterationConfigItem(label: "Latin", mappingKey: "ArabicToLatin") { label mapping insertSpaces } } }
          taggingConfiguration { customQuery(input: "GetTagEntities") taggableEntityConfiguration(configuration: [{ taggableEntityType: word createNewEntityFormQuery: "GetWordCreateForm" relationType: "refWords" replaceCharacterFromTagSettings: [{ replacementCharactersRegex: "/<br>/g" characterToReplaceWith: " " }] metadataKeysToSetAsAttribute: ["lemma"] tagConfigurationByEntity: { configurationEntityType: epi_doc_tag configurationEntityRelationType: "refEpiDocTag" tagMetadataKey: "tag" colorMetadataKey: "color" } }]) { ...taggableEntityConfiguration } } } } }
      hierarchyList: hierarchyListElement { label(input: "navigation.hierarchy") isCollapsed(input: false) hierarchyRelationList(input: [{ key: "refPoint", entityType: point }]) { key entityType } customQuery(input: "GetEntityForHierarchy") can(input: ["read:gps_coordinates:field"]) entityTypeAsCenterPoint(input: point) centerCoordinatesKey(input: "gps_coordinates") }
    } } }
  }
  query GetTagEntities($type: Entitytyping! $limit: Int $skip: Int $searchValue: SearchFilter! $advancedSearchValue: [FilterInput] $advancedFilterInputs: [AdvancedFilterInput!]! $searchInputType: SearchInputType) {
    Entities(type: $type limit: $limit skip: $skip searchValue: $searchValue advancedSearchValue: $advancedSearchValue advancedFilterInputs: $advancedFilterInputs searchInputType: $searchInputType) { count limit results { id uuid type ... on Word { ...minimalWord } } }
  }
  query GetEntityForHierarchy($id: String!, $type: String!) {
    Entity(id: $id, type: $type) { id uuid type ... on Point {
      intialValues { gps_coordinates: keyValue(key: "gps_coordinates", source: metadata) id: keyValue(key: "id", source: root) title: keyValue(key: "id", source: root) }
      relationValues
      allowedViewModes { viewModes(input: [{ viewMode: ViewModesList }]) { ...viewModes } }
      teaserMetadata { type: metaData { label(input: "metadata.labels.type") customValue(input: "Point") } id: metaData { label(input: "metadata.labels.id") key(input: "id") } gps_coordinates: metaData { label(input: "metadata.labels.gps-coordinates") key(input: "gps_coordinates") copyToClipboard(input: true) } }
      ...minimalBaseEntity } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /no term|not rendered|left out/.test(n))).toEqual([]);
    expect(ttl).toContain("        [ a elody:HierarchyListElement ;");
    expect(ttl).toContain('        elody:hierarchyLevel [ sh:order 1 ; elody:key "refPoint" ; elody:entityType "point" ] ;\n        elody:listQuery ui:GetEntityForHierarchy ;');
    expect(ttl).toContain("  elody:queryRoot elody:SingleEntityRoot ;");
    expect(ttl).toContain('    elody:cardCustomValue "Point" ;');
    expect(ttl).toContain("    elody:cardCopyToClipboard true ;");
    expect(ttl).toContain("    elody:taggingQuery ui:GetTagEntities ;");
    expect(ttl).toContain('    elody:transliteration [ elody:enabledByProperty "enableTransliteration" ; elody:transliterationItem [ sh:order 1 ; elody:alias "latin" ; elody:labelKey "Latin" ; elody:mappingKey "ArabicToLatin" ] ] ;');
    expect(ttl).toMatch(/elody:taggable \[ sh:order 1 ; elody:entityType "word" ; elody:relationType "refWords" ; elody:form ui:GetWordCreateForm ; elody:replaceCharacters \[ sh:order 1 ; elody:regex "\/<br>\/g" ; elody:replacement " " \] ; elody:attributeKeys \( "lemma" \) ; elody:tagConfigurationByEntity \[ elody:entityType "epi_doc_tag" ; elody:relationType "refEpiDocTag" ; elody:tagKey "tag" ; elody:colorKey "color" \] \] ;/);
  });
});
