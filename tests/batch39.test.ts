/**
 * G-030: a regex in a GraphQL string ("\\d", "\\[") is not an escape GraphQL knows; the reader
 * takes it as the backslash the author wrote instead of dropping the whole file.
 */
import { describe, expect, it } from "vitest";
import { print } from "graphql";
import { escapeUnknownStringEscapes, readDefinitions } from "../src/compare.js";

describe("a regex in a string", () => {
  it("doubles the backslashes GraphQL does not know, outside block strings", () => {
    expect(escapeUnknownStringEscapes(String.raw`a(x: "^\d{4}-\s[\[x]$" y: "q\"\n\\z" z: """block \d""")`)).toBe(String.raw`a(x: "^\\d{4}-\\s[\\[x]$" y: "q\"\n\\z" z: """block \d""")`);
  });

  it("reads a document with such a string", () => {
    const body = String.raw`query { a(regex: "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\\d{4}$") { id } }`;
    const { definitions, errors } = readDefinitions([{ path: "q.ts", source: "export const x = gql`" + body + "`;" }]);
    expect(errors).toEqual([]);
    expect(print(definitions[0].node)).toContain(String.raw`regex: "^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\\d{4}$"`);
  });
});
