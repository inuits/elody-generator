/**
 * G-043, the card the detail fragment carries as well (elody:detailCard): its fields and its menu,
 * rendered after the detail's initial values; the extractor declares it from teaserMetadata inside
 * full<X>.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("the detail card", () => {
  it("renders the card inside the detail fragment", async () => {
    const { VOCABULARY_PATH } = await import("../src/ontology.js");
    const fixture = readFileSync(join(VOCABULARY_PATH, "..", "..", "tests", "fixtures", "ui", "detail-card.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities[0], "x", entities);
    expect(out).toMatch(/fragment fullArchivalCollection on ArchivalCollection \{\n\s+intialValues \{[^]*?\}\n\s+teaserMetadata \{\n\s+title: metaData \{\n\s+label\(input: "metadata.labels.title"\)\n\s+key\(input: "title"\)\n\s+\}\n\s+buttons \{\n\s+contextMenu \{\n\s+doLinkAction \{[^]*?\}\n\s+\}\n\s+\}\n\s+\}\n\s+relationValues\n\s+entityView \{/);
    // the listing's card shows both fields, the detail's one
    expect(out).toMatch(/fragment minimalArchivalCollection on ArchivalCollection \{[^]*?externalLink: metaData/);
  });

  it("extracts the card inside the detail fragment", () => {
    const files = [
      {
        path: "queries/entities/archivalCollection.queries.ts",
        source: `import { gql } from "graphql-modules";\nexport const archivalCollection = gql\`
  fragment minimalArchivalCollection on ArchivalCollection {
    intialValues { title: keyValue(key: "title", source: metadata) externalLink: keyValue(key: "externalLink", source: metadata) }
    teaserMetadata { title: metaData { label(input: "metadata.labels.title") key(input: "title") } externalLink: metaData { label(input: "metadata.labels.external-link") key(input: "externalLink") } }
    ...minimalBaseEntity
  }
  fragment fullArchivalCollection on ArchivalCollection {
    intialValues { title: keyValue(key: "title", source: metadata) }
    teaserMetadata {
      title: metaData { label(input: "metadata.labels.title") key(input: "title") }
      buttons { contextMenu { doLinkAction { label(input: "contextMenu.contextMenuLinkAction.followLink") icon(input: "AngleRight") __typename } } }
    }
    entityView { column { size(size: seventy) elements { windowElement { label(input: "Info")
      info: panels { label(input: "panel-labels.info") panelType(input: metadata) isEditable(input: false) isCollapsed(input: false)
        title: metaData { label(input: "metadata.labels.title") key(input: "title") } } } } } }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => /detail card/.test(n))).toEqual([]);
    expect(ttl).toMatch(/  elody:detailCard\n    \[ elody:field em:title ;\n    elody:contextMenu\n      \[ elody:menuInButtons true ;\n      elody:action\n        \[ sh:order 1 ;[^]*?elody:alias "doLinkAction"[^]*? \] \] \] ;\n/);
  });
});
