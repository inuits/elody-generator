/**
 * Value-preservation round trip, step 3 (PWA, copied into a PWA checkout by
 * roundtrip.sh): the detail page in edit mode, with the PWA's own form code.
 * The form starts from the initial values baseGraphql returned (read.json),
 * the editable keys come from the entity view as the window element computes
 * them, multilingual fields hold their translations as MultilingualWrapper
 * stores them, the edits are applied (a metadata value; a relation dropdown's
 * new selection, as ViewModesAutocompleteRelations does in edit mode), and
 * parseFormValuesToFormInput builds the form input the save mutation sends
 * (payload.json).
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useFormHelper } from "@/composables/useFormHelper";
import { findPanelMetadata } from "@/helpers";

vi.mock("@/main", () => ({ apolloClient: { query: vi.fn() } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: {} }), useRouter: () => ({}) }));
// the PWA's vitest setup injects a config with multilingual editing off; this
// round trip is a client that has it on, as a multilingual SHACL UI form needs
vi.mock("vue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vue")>();
  return {
    ...actual,
    inject: (key: string, ...rest: unknown[]) =>
      key === "config"
        ? { features: { supportsMultilingualMetadataEditing: true } }
        : (actual.inject as any)(key, ...rest),
  };
});

const out = process.env.ROUNDTRIP_DIR as string;
const read = JSON.parse(readFileSync(join(out, "read.json"), "utf-8"));
const { relations: relationEdits = {}, ...edits } = JSON.parse(readFileSync(join(out, "..", "edits.json"), "utf-8"));
const ids: Record<string, string> = JSON.parse(readFileSync(join(out, "ids.json"), "utf-8"));

describe("detail page write-back", () => {
  it("builds the save input from the read values and one edit", () => {
    let formInput: any;
    const Edit = defineComponent({
        setup() {
          const helper = useFormHelper();
          const id = "roundtrip";
          const intialValues = { ...read.intialValues };
          delete intialValues.__typename;
          const form = helper.createForm(id, {
            intialValues: structuredClone(intialValues),
            relationValues: structuredClone(read.relationValues ?? {}),
          } as any);
          helper.getEditableMetadataKeys(read.entityView, id);
          const fields: Record<string, any> = {};
          for (const field of findPanelMetadata(read.entityView)) {
            fields[field.key] = field;
            const value = (intialValues as any)[field.key];
            if (field.isMultilingual && Array.isArray(value)) helper.setMultilingualTranslations(id, field.key, value);
          }
          for (const [key, value] of Object.entries(edits)) form.setFieldValue(`intialValues.${key}`, value);
          // a relation dropdown in edit mode: the new selection replaces the relations of its type
          for (const [type, names] of Object.entries(relationEdits as Record<string, string[]>))
            helper.replaceRelationsFromSameType(names.map((name) => ({ id: ids[name] }) as any), type, id);
          formInput = helper.parseFormValuesToFormInput(id, form.values as any, false, "en", fields);
          return () => h("div");
        },
      });
    mount(Edit);
    writeFileSync(join(out, "payload.json"), JSON.stringify({ formInput }, null, 2));
    expect(formInput.metadata.length).toBeGreaterThan(0);
  });
});
