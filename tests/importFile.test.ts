import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PayloadTooLargeError, UnsupportedMediaError, ValidationError } from "../src/server/errors";
import { IMPORT_MAX_BYTES } from "../src/lib/limits";
import { fileToHtml, textToHtml, titleFromFilename } from "../src/server/importFile";

const buf = (s: string) => Buffer.from(s, "utf8");

describe("fileToHtml", () => {
  it("converts markdown headings, emphasis and lists", async () => {
    const html = await fileToHtml("notes.md", buf("# Title\n\nSome **bold** and *italic*.\n\n- one\n- two\n\n1. first\n"));
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toMatch(/<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
    expect(html).toMatch(/<ol>\s*<li>first<\/li>\s*<\/ol>/);
  });

  it("turns plain text into escaped paragraphs", async () => {
    expect(await fileToHtml("a.TXT", buf("Hello <b>world</b>\nline 2\n\nSecond para"))).toBe(
      "<p>Hello &lt;b&gt;world&lt;/b&gt;<br />line 2</p><p>Second para</p>",
    );
  });

  it("strips scripts and event handlers from imported markdown", async () => {
    const html = await fileToHtml("x.md", buf('<script>alert(1)</script>\n\n<p onclick="x()">safe</p>'));
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("safe");
  });

  it("rejects unsupported, empty and oversized files", async () => {
    await expect(fileToHtml("report.pdf", buf("%PDF"))).rejects.toBeInstanceOf(UnsupportedMediaError);
    await expect(fileToHtml("noext", buf("x"))).rejects.toBeInstanceOf(UnsupportedMediaError);
    await expect(fileToHtml("empty.txt", buf(""))).rejects.toBeInstanceOf(ValidationError);
    await expect(fileToHtml("big.txt", Buffer.alloc(IMPORT_MAX_BYTES + 1, 97))).rejects.toBeInstanceOf(
      PayloadTooLargeError,
    );
  });

  it("converts a Word document, preserving headings, lists and underline", async () => {
    const html = await fileToHtml("sample.docx", readFileSync(join(__dirname, "../samples/sample.docx")));
    expect(html).toContain("<h1>Quarterly Planning Brief</h1>");
    expect(html).toContain("<h2>Goals</h2>");
    expect(html).toContain("<u>underline</u>");
    expect(html).toContain("<ul><li>Ship the document editor</li>");
    expect(html).toContain("<ol><li>Design review</li>");
  });

  it("rejects a corrupt .docx with a clear error", async () => {
    await expect(fileToHtml("bad.docx", buf("not a zip"))).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("helpers", () => {
  it("derives a title from the filename", () => {
    expect(titleFromFilename("Meeting notes.final.md")).toBe("Meeting notes.final");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });

  it("normalizes CRLF line endings", () => {
    expect(textToHtml("a\r\n\r\nb")).toBe("<p>a</p><p>b</p>");
  });
});
