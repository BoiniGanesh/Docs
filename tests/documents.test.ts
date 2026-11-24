import { createClient, type Client } from "@libsql/client";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initSchema } from "../src/server/db";
import {
  addShare,
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  listShares,
  removeShare,
  updateDocument,
} from "../src/server/documents";
import { ForbiddenError, NotFoundError, ValidationError } from "../src/server/errors";

const ALICE = "u_alice";
const BOB = "u_bob";
const CAROL = "u_carol";

let db: Client;
let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "ajaia-test-"));
  db = createClient({ url: `file:${join(dir, "test.db")}` });
  await initSchema(db); // seeds alice, bob, carol (+ the sample welcome doc)
});

afterAll(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("document lifecycle and sharing", () => {
  let docId: string;

  it("creates, renames and saves formatted content for the owner", async () => {
    const doc = await createDocument(db, ALICE, { title: "  Q3 plan  " });
    docId = doc.id;
    expect(doc.title).toBe("Q3 plan");
    expect(doc.role).toBe("owner");

    const updated = await updateDocument(db, ALICE, docId, {
      title: "Q3 roadmap",
      contentHtml: "<h1>Goals</h1><ul><li><strong>Ship</strong> <u>it</u></li></ul>",
    });
    expect(updated.title).toBe("Q3 roadmap");

    const reopened = await getDocument(db, ALICE, docId);
    expect(reopened.contentHtml).toBe("<h1>Goals</h1><ul><li><strong>Ship</strong> <u>it</u></li></ul>");
  });

  it("sanitizes stored HTML", async () => {
    const doc = await updateDocument(db, ALICE, docId, {
      contentHtml: '<p onclick="steal()">Hi</p><script>alert(1)</script>',
    });
    expect(doc.contentHtml).toBe("<p>Hi</p>");
  });

  it("hides the document from users it is not shared with", async () => {
    await expect(getDocument(db, CAROL, docId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateDocument(db, CAROL, docId, { title: "x" })).rejects.toBeInstanceOf(NotFoundError);
    const carolDocs = await listDocuments(db, CAROL);
    expect(carolDocs.owned.map((d) => d.id)).not.toContain(docId);
    expect(carolDocs.shared.map((d) => d.id)).not.toContain(docId);
  });

  it("lets a viewer read but not edit, share or delete", async () => {
    await addShare(db, ALICE, docId, { email: "BOB@ajaia.test", role: "viewer" });

    const bobView = await getDocument(db, BOB, docId);
    expect(bobView.role).toBe("viewer");
    expect(bobView.ownerEmail).toBe("alice@ajaia.test");

    await expect(updateDocument(db, BOB, docId, { title: "hijack" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(addShare(db, BOB, docId, { email: "carol@ajaia.test", role: "editor" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(deleteDocument(db, BOB, docId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("separates owned and shared documents in listings", async () => {
    const alice = await listDocuments(db, ALICE);
    const bob = await listDocuments(db, BOB);
    expect(alice.owned.map((d) => d.id)).toContain(docId);
    expect(alice.shared.map((d) => d.id)).not.toContain(docId);
    expect(bob.shared.find((d) => d.id === docId)?.role).toBe("viewer");
    expect(bob.owned.map((d) => d.id)).not.toContain(docId);
  });

  it("upgrades a viewer to editor when re-shared, allowing edits", async () => {
    const shares = await addShare(db, ALICE, docId, { email: "bob@ajaia.test", role: "editor" });
    expect(shares).toEqual([{ userId: BOB, email: "bob@ajaia.test", name: "Bob Smith", role: "editor" }]);

    const edited = await updateDocument(db, BOB, docId, { contentHtml: "<p>Bob was here</p>" });
    expect(edited.contentHtml).toBe("<p>Bob was here</p>");
    expect(edited.role).toBe("editor");
  });

  it("rejects invalid share requests", async () => {
    await expect(addShare(db, ALICE, docId, { email: "nobody@ajaia.test", role: "viewer" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(addShare(db, ALICE, docId, { email: "alice@ajaia.test", role: "viewer" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(addShare(db, ALICE, docId, { email: "not-an-email", role: "viewer" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(addShare(db, ALICE, docId, { email: "bob@ajaia.test", role: "admin" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects invalid updates", async () => {
    await expect(updateDocument(db, ALICE, docId, { title: "   " })).rejects.toBeInstanceOf(ValidationError);
    await expect(updateDocument(db, ALICE, docId, {})).rejects.toBeInstanceOf(ValidationError);
  });

  it("revokes access when a share is removed", async () => {
    expect(await removeShare(db, ALICE, docId, BOB)).toEqual([]);
    await expect(getDocument(db, BOB, docId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("only lets the owner delete, and deletion cascades shares", async () => {
    await addShare(db, ALICE, docId, { email: "carol@ajaia.test", role: "editor" });
    await expect(deleteDocument(db, CAROL, docId)).rejects.toBeInstanceOf(ForbiddenError);
    await deleteDocument(db, ALICE, docId);
    await expect(getDocument(db, ALICE, docId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listShares(db, ALICE, docId)).rejects.toBeInstanceOf(NotFoundError);
    const orphaned = await db.execute({ sql: "SELECT COUNT(*) AS n FROM document_shares WHERE document_id = ?", args: [docId] });
    expect(Number(orphaned.rows[0].n)).toBe(0);
  });
});
