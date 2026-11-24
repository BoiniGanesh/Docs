/**
 * Product limits shared by the browser (fast feedback) and the server (enforcement).
 * Change a limit here and both sides pick it up.
 */

export const TITLE_MAX_LENGTH = 200;

/** File types that can be imported as a new document. Adding one also requires a converter in server/importFile.ts. */
export const IMPORT_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export type ImportExtension = (typeof IMPORT_EXTENSIONS)[number];

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_LABEL = "2 MB";

/** e.g. ".txt, .md, .docx" — for lists and error messages. */
export const IMPORT_TYPES_LABEL = IMPORT_EXTENSIONS.join(", ");

/** e.g. ".txt, .md or .docx" — for sentences. */
export const IMPORT_TYPES_PROSE =
  IMPORT_EXTENSIONS.length > 1
    ? `${IMPORT_EXTENSIONS.slice(0, -1).join(", ")} or ${IMPORT_EXTENSIONS[IMPORT_EXTENSIONS.length - 1]}`
    : IMPORT_EXTENSIONS[0];

/** Lower-cased extension including the dot, or "" if none. */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function isImportable(filename: string): boolean {
  return (IMPORT_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}
