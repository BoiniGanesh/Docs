// Generates samples/sample.docx with real Word heading styles, lists and inline formatting.
// Usage: node scripts/make-sample-docx.mjs   (uses jszip, already installed via mammoth)
import JSZip from "jszip";
import { writeFileSync, mkdirSync } from "node:fs";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const run = (text, { b, i, u } = {}) =>
  `<w:r><w:rPr>${b ? "<w:b/>" : ""}${i ? "<w:i/>" : ""}${u ? '<w:u w:val="single"/>' : ""}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
const para = (runs, { style, numId } = {}) =>
  `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${
    numId ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>` : ""
  }</w:pPr>${runs.join("")}</w:p>`;

const body = [
  para([run("Quarterly Planning Brief")], { style: "Heading1" }),
  para([run("Imported from a Word document. It keeps "), run("bold", { b: true }), run(", "), run("italic", { i: true }), run(" and "), run("underline", { u: true }), run(".")]),
  para([run("Goals")], { style: "Heading2" }),
  para([run("Ship the document editor")], { numId: 1 }),
  para([run("Validate sharing with pilot teams")], { numId: 1 }),
  para([run("Timeline")], { style: "Heading2" }),
  para([run("Design review")], { numId: 2 }),
  para([run("Build")], { numId: 2 }),
  para([run("Launch")], { numId: 2 }),
].join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
  "word/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style></w:styles>`,
  "word/numbering.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`,
  "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}</w:body></w:document>`,
};

const zip = new JSZip();
for (const [path, content] of Object.entries(files)) zip.file(path, content);
mkdirSync("samples", { recursive: true });
writeFileSync("samples/sample.docx", await zip.generateAsync({ type: "nodebuffer" }));
console.log("wrote samples/sample.docx");
