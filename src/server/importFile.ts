import mammoth from "mammoth";
import { marked } from "marked";
import { PayloadTooLargeError, UnsupportedMediaError, ValidationError } from "./errors";
import { sanitizeDocumentHtml } from "./sanitize";

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

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
  return (base || "Imported document").slice(0, 200);
}

/**
 * Converts an uploaded file into sanitized editor HTML.
 * Supported: .txt, .md, .docx (max 2 MB). Everything else is rejected with 415.
 */
export async function fileToHtml(filename: string, data: Buffer): Promise<string> {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new UnsupportedMediaError(
      `Unsupported file type "${ext || filename}". Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}.`,
    );
  }
  if (data.byteLength === 0) throw new ValidationError("The uploaded file is empty.");
  if (data.byteLength > MAX_UPLOAD_BYTES) throw new PayloadTooLargeError("File is too large (max 2 MB).");

  let html: string;
  if (ext === ".docx") {
    try {
      // mammoth drops underline by default; map it so formatting survives import.
      html = (await mammoth.convertToHtml({ buffer: data }, { styleMap: ["u => u"] })).value;
    } catch {
      throw new ValidationError("Couldn't read that .docx file. Is it a valid Word document?");
    }
  } else {
    const text = data.toString("utf8");
    html = ext === ".md" ? await marked.parse(text, { gfm: true }) : textToHtml(text);
  }
  return sanitizeDocumentHtml(html);
}
