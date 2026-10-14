/**
 * G-018: upload forms — the upload container of a tab (flow, file inputs with their size, kind, dry run,
 * templates), form actions with an endpoint or a progress indicator, further tabs, and the form's info
 * label and modal style.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractDeclaration } from "../src/extract.js";
import { readUiDeclaration } from "../src/parse.js";
import { renderEntityFile } from "../src/render.js";
import { formatIssue, validateDeclaration } from "../src/validate.js";

describe("upload forms", () => {
  it("conforms and renders the upload fixture", async () => {
    const { fixturesDir } = await import("../src/ontology.js");
    const fixture = readFileSync(join(fixturesDir(), "upload.ui.ttl"), "utf-8");
    expect((await validateDeclaration(fixture)).issues.map(formatIssue)).toEqual([]);
    const { entities, warnings } = await readUiDeclaration(fixture);
    expect(warnings.map((w) => w.message)).toEqual([]);
    const out = renderEntityFile(entities.find((e) => e.graphqlType === "Asset")!, "x");
    expect(out).toMatch(/query GetUploadEntitiesWithMediafiles \{\n\s+GetDynamicForm \{\n\s+upload: formTab \{\n\s+formFields \{\n\s+uploadContainer \{\n\s+uploadFlow\(input: mediafilesWithRequiredCsv\)\n\s+csvUpload: uploadField \{\n\s+label\(input: "upload-fields.labels.csv-upload"\)\n\s+uploadFieldSize\(input: small\)\n\s+dryRunUpload\(input: true\)\n\s+uploadFieldType\(input: batch\)\n\s+templateCsvs\(input: \["upload-csv-template-media.csv", "upload-csv-template-map.csv"\]\)\n\s+infoLabelUrl\(input: "https:\/\/example.org\/csv-import"\)\n\s+inputField\(type: baseCsvUploadField\) \{\n\s+validation\(input: \{ value: required \}\) \{\n\s+\.\.\.validation\n\s+\}\n\s+\.\.\.inputfield/);
    expect(out).toMatch(/uploadAction: action \{\n\s+label\(input: "actions.labels.upload"\)\n\s+icon\(input: Upload\)\n\s+actionType\(input: upload\)\n\s+showsFormErrors\(input: true\)\n\s+actionProgressIndicator \{\n\s+type\(input: progressSteps\)\n\s+validationStep: step \{\n\s+label\(input: "actions.progress-steps.validate"\)\n\s+stepType\(input: validate\)\n\s+status\n\s+\}/);
    // the endpoint action comes first, the upload container second, the submit last
    expect(out).toMatch(/query GetReorderMediafilesForm \{\n\s+GetDynamicForm \{\n\s+label\(input: "navigation.make-reorder"\)\n\s+formTab \{\n\s+formFields \{\n\s+downloadCsvAction: action \{[\s\S]*?endpointInformation\(input: \{ endpointName: "\/api\/download\/csv\?return_type=mediafile", method: "POST", variables: \["parentId"\], responseAction: downloadResponse \}\) \{\n\s+endpointName\n\s+method\n\s+variables\n\s+responseAction\n\s+\}[\s\S]*?uploadContainer \{\n\s+uploadFlow\(input: uploadCsvForReordening\)[\s\S]*?uploadCsvAction: action \{\n\s+label\(input: "actions.labels.upload-csv"\)\n\s+icon\(input: Upload\)\n\s+actionType\(input: uploadCsvForReordening\)\n\s+showsFormErrors\(input: true\)/);
    expect(out).toMatch(/query GetEntityPickerFormWithUpload \{\n\s+GetDynamicForm \{\n\s+modalStyle\(input: rightWide\)\n\s+import: formTab \{\n\s+formFields \{\n\s+entityPicker: metaData \{[\s\S]*?\}\n\s+\}\n\s+upload: formTab \{\n\s+formFields \{\n\s+uploadContainer \{\n\s+uploadFlow\(input: mediafilesOnly\)/);
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
  query GetAssetCreateForm {
    GetDynamicForm {
      label(input: "navigation.create-asset")
      infoLabel(input: "info.create-asset")
      modalStyle(input: rightWide)
      asset: formTab {
        formFields {
          title: metaData { label(input: "metadata.labels.title") key(input: "title") inputField(type: baseTextField) { ...inputfield } }
          uploadContainer {
            uploadFlow(input: optionalMediafiles)
            fileUpload: uploadField { label(input: "upload-fields.labels.file-upload") uploadFieldSize(input: normal) uploadFieldType(input: single) inputField(type: baseFileUploadField) { ...inputfield } }
          }
          createAction: action {
            label(input: "actions.labels.create") icon(input: Create) actionType(input: submitWithUpload) actionQuery(input: "CreateEntity") creationType(input: asset) showsFormErrors(input: true)
            actionProgressIndicator { type(input: progressSteps) prepareStep: step { label(input: "actions.progress-steps.prepare") stepType(input: prepare) status } }
          }
        }
      }
      upload: formTab {
        formFields {
          uploadContainer {
            uploadFlow(input: csvOnly)
            csvUpload: uploadField { label(input: "upload-fields.labels.csv-upload") uploadFieldSize(input: small) dryRunUpload(input: true) uploadFieldType(input: batch) templateCsvs(input: ["a.csv"]) inputField(type: baseCsvUploadField) { validation(input: { value: required }) { ...validation } ...inputfield } }
          }
          downloadCsvAction: action { label(input: "actions.labels.download-csv") icon(input: DownloadAlt) actionType(input: endpoint) endpointInformation(input: { endpointName: "/api/csv", method: "POST", variables: ["parentId"], responseAction: downloadResponse }) { endpointName method variables responseAction } showsFormErrors(input: false) }
        }
      }
    }
  }
\`;\n`,
      },
    ];
    const { ttl, notes } = extractDeclaration(files, { namespace: "urn:ui:" });
    expect(notes.filter((n) => n.includes("no term") || n.includes("stays hand-written"))).toEqual([]);
    expect(ttl).toContain('  elody:infoLabel "info.create-asset" ;\n  elody:modalStyle elody:RightWideModal ;');
    expect(ttl).toContain('  elody:upload [ sh:order 2 ; elody:uploadFlow elody:OptionalMediafilesFlow ;\n    elody:uploadField [ sh:order 1 ; elody:alias "fileUpload" ; rdfs:label "upload-fields.labels.file-upload" ; elody:uploadSize elody:NormalUpload ; elody:uploadKind elody:SingleUpload ; elody:uploadInputField "baseFileUploadField" ] ] ;');
    expect(ttl).toContain('  elody:formAction [ sh:order 3 ; elody:alias "createAction" ; rdfs:label "actions.labels.create" ; elody:icon "Create" ; elody:submitAction "submitWithUpload" ; elody:actionQuery "CreateEntity" ; elody:creationType "asset" ; elody:showsFormErrors true ; elody:progress [ elody:progressKind "progressSteps" ; elody:progressStep [ sh:order 1 ; elody:alias "prepareStep" ; rdfs:label "actions.progress-steps.prepare" ; elody:stepKind "prepare" ] ] ] ;');
    expect(ttl).toContain('  elody:tab [ sh:order 1 ; elody:alias "upload" ;\n    elody:upload [ sh:order 1 ; elody:uploadFlow elody:CsvOnlyFlow ;');
    expect(ttl).toContain('elody:uploadInputField "baseCsvUploadField" ; elody:uploadRequired true ; elody:dryRun true ; elody:templateCsvs ( "a.csv" ) ] ] ;');
    expect(ttl).toContain('    elody:formAction [ sh:order 2 ; elody:alias "downloadCsvAction" ; rdfs:label "actions.labels.download-csv" ; elody:icon "DownloadAlt" ; elody:submitAction "endpoint" ; elody:showsFormErrors false ; elody:callsEndpoint [ elody:endpointName "/api/csv" ; elody:endpointMethod "POST" ; elody:variables ( "parentId" ) ; elody:responseAction "downloadResponse" ] ]');
  });
});
