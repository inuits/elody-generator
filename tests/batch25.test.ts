/**
 * G-016: the preview of a type — the previewFor<X> fragment (kind, coverage, title, open by default,
 * configuration) and the layouts it loads (PreviewElement: a column of elements like the detail's),
 * and a window element laying its panels out in a horizontal grid.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("previews", () => {
  it("conforms and renders the preview fixture", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "preview.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const asset = renderEntityFile(entities.find((e) => e.graphqlType === "Asset")!, "x");
    expect(asset).toMatch(/fragment previewForAsset on Asset \{\n\s+previewComponent \{\n\s+type\(input: ColumnList\)\n\s+listItemsCoverage\(input: OneListItem\)\n\s+title\(input: "preview-labels.asset"\)\n\s+previewQuery\(input: "GetPreviewInAsset"\)\n\s+previewConfiguration \{\n\s+keepLastActiveItemHighlighted\(input: true\)\n\s+displayOpenDetailPageButton\(input: true\)\n\s+\}\n\s+\}\n\s+\}/);
    expect(asset).toMatch(/query GetPreviewInAsset \{\n\s+PreviewElement \{\n\s+column \{\n\s+size\(size: hundred\)\n\s+elements \{\n\s+entityListElement \{\n\s+label\(input: "element-labels.mediafiles-element"\)/);
    expect(asset).toMatch(/baseLibraryMode\(input: previewBaseLibrary\)/);
    const mediafile = renderEntityFile(entities.find((e) => e.graphqlType === "MediaFileEntity")!, "x");
    expect(mediafile).toMatch(/fragment previewForMediaFile on MediaFileEntity \{\n\s+previewComponent \{\n\s+type\(input: MediaViewer\)\n\s+listItemsCoverage\(input: OneListItem\)\n\s+openByDefault\(input: true\)\n\s+metadataPreviewQuery\(input: "GetMetadataPreviewForMediafile"\)\n\s+\}\n\s+\}/);
    expect(mediafile).toMatch(/query GetMetadataPreviewForMediafile \{\n\s+PreviewElement \{\n\s+column \{\n\s+size\(size: hundred\)\n\s+elements \{\n\s+windowElement \{\n\s+label\(input: "panel-labels.other-metadata"\)\n\s+layout\(input: HorizontalGrid\)/);
    expect(mediafile).toMatch(/original_filename: panels \{\n\s+panelType\(input: metadata\)/);
    expect(mediafile).not.toContain("panelHeaderContent");
    expect(mediafile).toContain("fragment previewForMediaFile on MediaFileEntity {");
  });

  it("extracts them back", () => {
    const files = [
      {
        path: "queries/entities/asset.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const asset = gql\`
  fragment minimalAsset on Asset {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } }
    ...minimalBaseEntity
  }
  fragment previewForAsset on Asset {
    previewComponent {
      type(input: ColumnList)
      listItemsCoverage(input: OneListItem)
      title(input: "preview-labels.asset")
      previewQuery(input: "GetPreviewInAsset")
      previewConfiguration { keepLastActiveItemHighlighted(input: true) displayOpenDetailPageButton(input: true) }
    }
  }
  query GetPreviewInAsset {
    PreviewElement {
      column {
        size(size: hundred)
        elements {
          entityListElement {
            label(input: "element-labels.mediafiles-element")
            type(input: media)
            isCollapsed(input: false)
            entityTypes(input: [mediafile])
            baseLibraryMode(input: previewBaseLibrary)
            relationType: label(input: "hasMediafile")
            searchInputType(input: "AdvancedInputMediaFilesType")
            customQuery(input: "GetMediafilesAsPreview")
            customQueryFilters(input: "GetMediafilesInAssetFilters")
          }
        }
      }
    }
  }
\`;\n`,
      },
      {
        path: "queries/entities/mediafile.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const mediafile = gql\`
  fragment minimalMediafile on MediaFileEntity {
    intialValues { filename: keyValue(key: "filename", source: root) }
    teaserMetadata { filename: metaData { label(input: "metadata.labels.filename") key(input: "filename") } }
    ...minimalBaseEntity
  }
  fragment previewForMediafile on MediaFileEntity {
    previewComponent { type(input: MediaViewer) listItemsCoverage(input: OneListItem) openByDefault(input: true) metadataPreviewQuery(input: "GetMetadataPreviewForMediafile") }
  }
  query GetMetadataPreviewForMediafile {
    PreviewElement {
      column {
        size(size: hundred)
        elements {
          windowElement {
            label(input: "panel-labels.other-metadata")
            layout(input: HorizontalGrid)
            original_filename: panels {
              panelType(input: metadata)
              isEditable(input: false)
              isCollapsed(input: false)
              metaData { label(input: "metadata.labels.original-filename") key(input: "original_filename") }
            }
          }
        }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("does not parse") || n.includes("stays hand-written"))).toEqual([]);
    expect(ttl).toContain('elody:preview [ elody:previewKind elody:ColumnListPreview ; elody:coverage elody:OneListItem ; elody:labelKey "preview-labels.asset" ; elody:keepLastActiveItemHighlighted true ; elody:displayOpenDetailPageButton true ; elody:previewLayout ui:GetPreviewInAsset ]');
    expect(ttl).toMatch(/ui:GetPreviewInAsset\n  a elody:PreviewLayout ;\n  elody:queryName "GetPreviewInAsset" ;\n  elody:column\n    \[ sh:order 1 ;\n    elody:size elody:Width100 ;\n    elody:element\n\s+\[ a elody:ListElement ;/);
    expect(ttl).toContain('elody:preview [ elody:previewKind elody:MediaViewerPreview ; elody:coverage elody:OneListItem ; elody:openByDefault true ; elody:metadataPreviewLayout ui:GetMetadataPreviewForMediafile ]');
    expect(ttl).toMatch(/a elody:Panel ;\n  sh:order 1 ;\n  elody:alias "original_filename" ;\n  elody:panelHeader false ;/);
    expect(ttl).toMatch(/ui:GetMetadataPreviewForMediafile\n  a elody:PreviewLayout ;[\s\S]*?a elody:WindowElement ;[\s\S]*?elody:windowLayout elody:HorizontalGridLayout ;/);
  });
});
