import mammoth from "mammoth";
import { marked } from "marked";
import {
  IMPORT_MAX_BYTES,
  IMPORT_MAX_LABEL,
  IMPORT_TYPES_LABEL,
  TITLE_MAX_LENGTH,
  extensionOf,
  isImportable,
  type ImportExtension,
} from "@/lib/limits";
import { PayloadTooLargeError, UnsupportedMediaError, ValidationError } from "./errors";
import { sanitizeDocumentHtml } from "./sanitize";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Blank lines separate paragraphs; single newlines become line breaks. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Title = filename without extension. */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, TITLE_MAX_LENGTH);
}

/**
 * One converter per supported extension. The Record type means adding an extension
 * to IMPORT_EXTENSIONS fails to compile until its converter exists here.
 */
const CONVERTERS: Record<ImportExtension, (data: Buffer) => Promise<string>> = {
  ".txt": async (data) => textToHtml(data.toString("utf8")),
  ".md": async (data) => marked.parse(data.toString("utf8"), { gfm: true }),
  ".docx": async (data) => {
    try {
      // mammoth drops underline by default; map it so formatting survives import.
      return (await mammoth.convertToHtml({ buffer: data }, { styleMap: ["u => u"] })).value;
    } catch {
      throw new ValidationError("Couldn't read that .docx file. Is it a valid Word document?");
    }
  },
};

/** Converts an uploaded file into sanitized editor HTML, enforcing the limits in lib/limits.ts. */
export async function fileToHtml(filename: string, data: Buffer): Promise<string> {
  if (!isImportable(filename)) {
    const ext = extensionOf(filename);
    throw new UnsupportedMediaError(`Unsupported file type "${ext || filename}". Supported types: ${IMPORT_TYPES_LABEL}.`);
  }
  if (data.byteLength === 0) throw new ValidationError("The uploaded file is empty.");
  if (data.byteLength > IMPORT_MAX_BYTES) throw new PayloadTooLargeError(`File is too large (max ${IMPORT_MAX_LABEL}).`);

  const html = await CONVERTERS[extensionOf(filename) as ImportExtension](data);
  return sanitizeDocumentHtml(html);
}
