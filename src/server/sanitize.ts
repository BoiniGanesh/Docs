import sanitizeHtml from "sanitize-html";

/**
 * Allowlist mirrors what the editor can produce (extensions in components/DocumentEditor.tsx).
 * Adding an editor feature (links, images, tables…) means allowing its tags here too.
 * Applied on every write, so stored HTML is always safe to render.
 */
export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote", "code", "pre", "hr", "a",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    // h4-h6 from imported files degrade to h3 instead of being dropped
    transformTags: { h4: "h3", h5: "h3", h6: "h3" },
  });
}
