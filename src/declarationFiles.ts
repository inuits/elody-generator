/**
 * A declaration is one Turtle file, or a directory of them laid out like the
 * client's GraphQL: `queries/entities/work.queries.ts` is declared in
 * `entities/work.ui.ttl`, the platform file `queries/<client>.queries.ts` in
 * `<client>.ui.ttl`. A directory is read as one graph: IRIs are global, so a
 * node declared in one file is referenced from any other; what must not
 * happen is one node declared in two files, and loading refuses that.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";

export const isDeclarationDir = (path: string): boolean => existsSync(path) && statSync(path).isDirectory();

/** The declaration files of a directory, relative to it, root files first, then those of its subdirectories, each sorted. */
export function declarationFiles(dir: string): string[] {
  const walk = (at: string): string[] => {
    const names = readdirSync(at).sort();
    const files = names.filter((name) => name.endsWith(".ui.ttl")).map((name) => join(at, name));
    const dirs = names.filter((name) => statSync(join(at, name)).isDirectory()).map((name) => join(at, name));
    return [...files, ...dirs.flatMap(walk)];
  };
  return walk(dir).map((file) => relative(dir, file).split(sep).join("/"));
}

/** The declaration's Turtle: the file's text, or a directory's files joined, each under a comment naming it. */
export function loadDeclaration(path: string): string {
  if (!isDeclarationDir(path)) return readFileSync(path, "utf-8");
  const files = declarationFiles(path);
  if (!files.length) throw new Error(`${path}: no *.ui.ttl declaration file`);
  const declaredIn = new Map<string, string>();
  const parts: string[] = [];
  for (const file of files) {
    const text = readFileSync(join(path, file), "utf-8");
    for (const subject of declaredSubjects(text)) {
      const elsewhere = declaredIn.get(subject);
      if (elsewhere && elsewhere !== file) throw new Error(`${subject} is declared in both ${elsewhere} and ${file}: a node is declared in one file`);
      declaredIn.set(subject, file);
    }
    parts.push(`# ---- ${file}`, text);
  }
  return parts.join("\n");
}

/** The nodes a file declares: a prefixed name alone on a line, opening its description. */
export function declaredSubjects(text: string): string[] {
  const subjects: string[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^([A-Za-z_][\w-]*:[\w.-]+)\s*$/.exec(lines[index]);
    if (match && /^\s+\S/.test(lines[index + 1] ?? "")) subjects.push(match[1]);
  }
  return subjects;
}

/** The declaration file of a client's query file: `queries/entities/work.queries.ts` → `entities/work.ui.ttl`, `queries/x.queries.ts` → `x.ui.ttl`. */
export function declarationFileFor(clientFile: string): string {
  const normalised = clientFile.split(sep).join("/");
  const under = normalised.replace(/^.*?(^|\/)queries\//, "");
  const base = (under === normalised ? normalised.replace(/^.*\//, "") : under).replace(/\.queries\.ts$/, "").replace(/\.ts$/, "");
  return `${base}.ui.ttl`;
}
