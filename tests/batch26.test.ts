/**
 * G-042: the comments element rendered — a comment thread with its rich-text composer (extensions in
 * order, what it can tag inline or through a guided flow, editor styles) and the fields a comment is
 * created with.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("comments element", () => {
  it("conforms and renders the comments fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "comments.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "Comment")!, "x");
    expect(out).toMatch(/fragment vlaccCommentsElement on EntityViewElements \{\n\s+comments: commentsElement \{\n\s+label\(input: "element-labels.comments"\)\n\s+parentEntityFilterKey\(input: "vlacc:1\|properties.ref_parent_entity.value"\)\n\s+readOnly\n\s+createFields \{\n\s+category: metaData \{\n\s+label\(input: "element-labels.comment-category"\)\n\s+key\(input: "category"\)\n\s+inputField\(type: commentCategoryTypeField\) \{\n\s+\.\.\.inputfield\n\s+\}\n\s+\}\n\s+\}/);
    expect(out).toMatch(/composer \{\n\s+label\(input: "element-labels.comment-body"\)\n\s+metadataKey\(input: "body"\)\n\s+extensions\(input: \[doc, paragraph, text, bold, italic, hardBreak, elodyTaggingExtension\]\)/);
    expect(out).toContain('{ tag: "user", taggableEntityType: user, relationType: "refTaggedUsers", metadataFilterForTagContent: "vlacc:1|properties.name.value", inlineTrigger: { character: "@", minCharacters: 1 } }');
    expect(out).toContain('{ tag: "entity", taggableEntityType: BaseEntity, relationType: "refTaggedEntities", guidedFlowQuery: "GetTagWemFlow", guidedFlowButtonLabel: "tagging.tag-wem" }');
    expect(out).toMatch(/\) \{\n\s+\.\.\.taggableEntityConfiguration\n\s+\}/);
    expect(out).toMatch(/wysiwygElementConfiguration \{\n\s+customEditorStyles\(input: "min-h-\[80px\]"\)\n\s+\}/);
  });

  it("extracts it back", () => {
    const files = [
      {
        path: "queries/entities/comment.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const comment = gql\`
  fragment minimalComment on Comment {
    intialValues { body: keyValue(key: "body", source: metadata) }
    teaserMetadata { body: metaData { label(input: "metadata.labels.body") key(input: "body") } }
    ...minimalBaseEntity
  }
  fragment vlaccCommentsElement on EntityViewElements {
    comments: commentsElement {
      label(input: "element-labels.comments")
      parentEntityFilterKey(input: "vlacc:1|properties.ref_parent_entity.value")
      readOnly
      createFields { category: metaData { label(input: "element-labels.comment-category") key(input: "category") inputField(type: commentCategoryTypeField) { ...inputfield } } }
      composer {
        label(input: "element-labels.comment-body")
        metadataKey(input: "body")
        extensions(input: [doc, paragraph, elodyTaggingExtension])
        taggingConfiguration {
          taggableEntityConfiguration(configuration: [
            { tag: "user" taggableEntityType: user relationType: "refTaggedUsers" metadataFilterForTagContent: "vlacc:1|properties.name.value" inlineTrigger: { character: "@", minCharacters: 1 } }
            { tag: "entity" taggableEntityType: BaseEntity relationType: "refTaggedEntities" guidedFlowQuery: "GetTagWemFlow" guidedFlowButtonLabel: "tagging.tag-wem" }
          ]) { ...taggableEntityConfiguration }
        }
        wysiwygElementConfiguration { customEditorStyles(input: "min-h-[80px]") }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("not rendered") || n.includes("stays hand-written"))).toEqual([]);
    expect(ttl).toContain('[ a elody:CommentsElement ;\n      rdfs:label "element-labels.comments" ;\n      sh:order 1 ;\n      elody:alias "comments" ;\n      elody:parentFilterKey "vlacc:1|properties.ref_parent_entity.value" ;\n      dash:readOnly true ;\n      elody:createField [ sh:order 1 ; elody:key "category" ; elody:labelKey "element-labels.comment-category" ; elody:clientInputField "commentCategoryTypeField" ] ;');
    expect(ttl).toContain('elody:extensions ( elody:DocExtension elody:ParagraphExtension elody:TaggingExtension ) ;');
    expect(ttl).toContain('elody:taggable [ sh:order 1 ; elody:tag "user" ; elody:entityType "user" ; elody:relationType "refTaggedUsers" ; elody:tagFilterKey "vlacc:1|properties.name.value" ; elody:triggerCharacter "@" ; elody:triggerMinCharacters 1 ] ;');
    expect(ttl).toContain('elody:taggable [ sh:order 2 ; elody:tag "entity" ; elody:entityType "BaseEntity" ; elody:relationType "refTaggedEntities" ; elody:flow ui:GetTagWemFlow ; elody:flowButtonLabel "tagging.tag-wem" ] ] ]');
  });
});
