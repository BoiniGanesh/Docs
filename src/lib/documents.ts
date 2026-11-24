import type { Client, Row } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { canDelete, canEdit, canShare, resolveRole, type Role, type ShareRole } from "./access";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { sanitizeDocumentHtml } from "./sanitize";

/**
 * Document service layer. Every function takes the acting user's id and enforces
 * access rules here, so API routes stay thin and tests exercise the real logic.
 */

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_BYTES = 1_000_000;

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  ownerEmail: string;
  role: Role;
}

export interface DocumentDetail extends DocumentSummary {
  contentHtml: string;
  createdAt: string;
}

export interface ShareEntry {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
}

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);

const contentSchema = z
  .string()
  .refine((s) => Buffer.byteLength(s, "utf8") <= MAX_CONTENT_BYTES, "Document is too large (max 1 MB).");

export const createInput = z.object({
  title: titleSchema.optional(),
  contentHtml: contentSchema.optional(),
});

export const updateInput = z
  .object({ title: titleSchema.optional(), contentHtml: contentSchema.optional() })
  .refine((v) => v.title !== undefined || v.contentHtml !== undefined, "Nothing to update.");

export const shareInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["viewer", "editor"]),
});

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? "Invalid input.");
  }
  return result.data;
}

const SELECT_WITH_ROLE = `
  SELECT d.id, d.title, d.content_html, d.created_at, d.updated_at, d.owner_id,
         u.name AS owner_name, u.email AS owner_email, s.role AS share_role
  FROM documents d
  JOIN users u ON u.id = d.owner_id
  LEFT JOIN document_shares s ON s.document_id = d.id AND s.user_id = ?`;

function toSummary(row: Row, role: Role): DocumentSummary {
  return {
    id: String(row.id),
    title: String(row.title),
    updatedAt: String(row.updated_at),
    ownerName: String(row.owner_name),
    ownerEmail: String(row.owner_email),
    role,
  };
}

/** Loads a document with the caller's role. Throws NotFound if they have no access. */
async function loadWithRole(db: Client, userId: string, docId: string) {
  const res = await db.execute({ sql: `${SELECT_WITH_ROLE} WHERE d.id = ?`, args: [userId, docId] });
  const row = res.rows[0];
  if (!row) throw new NotFoundError();
  const role = resolveRole(String(row.owner_id), userId, row.share_role as ShareRole | null);
  if (!role) throw new NotFoundError();
  return { row, role };
}

export async function listDocuments(db: Client, userId: string) {
  const res = await db.execute({
    sql: `${SELECT_WITH_ROLE} WHERE d.owner_id = ? OR s.user_id IS NOT NULL ORDER BY d.updated_at DESC`,
    args: [userId, userId],
  });
  const owned: DocumentSummary[] = [];
  const shared: DocumentSummary[] = [];
  for (const row of res.rows) {
    const role = resolveRole(String(row.owner_id), userId, row.share_role as ShareRole | null);
    if (role === "owner") owned.push(toSummary(row, role));
    else if (role) shared.push(toSummary(row, role));
  }
  return { owned, shared };
}

export async function getDocument(db: Client, userId: string, docId: string): Promise<DocumentDetail> {
  const { row, role } = await loadWithRole(db, userId, docId);
  return {
    ...toSummary(row, role),
    contentHtml: String(row.content_html),
    createdAt: String(row.created_at),
  };
}

export async function createDocument(db: Client, userId: string, input: unknown): Promise<DocumentDetail> {
  const { title, contentHtml } = parse(createInput, input ?? {});
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO documents (id, owner_id, title, content_html, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, title ?? "Untitled document", sanitizeDocumentHtml(contentHtml ?? ""), now, now],
  });
  return getDocument(db, userId, id);
}

export async function updateDocument(
  db: Client,
  userId: string,
  docId: string,
  input: unknown,
): Promise<DocumentDetail> {
  const patch = parse(updateInput, input);
  const { role } = await loadWithRole(db, userId, docId);
  if (!canEdit(role)) throw new ForbiddenError("You have view-only access to this document.");

  const sets: string[] = [];
  const args: (string | null)[] = [];
  if (patch.title !== undefined) {
    sets.push("title = ?");
    args.push(patch.title);
  }
  if (patch.contentHtml !== undefined) {
    sets.push("content_html = ?");
    args.push(sanitizeDocumentHtml(patch.contentHtml));
  }
  sets.push("updated_at = ?");
  args.push(new Date().toISOString(), docId);

  await db.execute({ sql: `UPDATE documents SET ${sets.join(", ")} WHERE id = ?`, args });
  return getDocument(db, userId, docId);
}

export async function deleteDocument(db: Client, userId: string, docId: string): Promise<void> {
  const { role } = await loadWithRole(db, userId, docId);
  if (!canDelete(role)) throw new ForbiddenError("Only the owner can delete this document.");
  await db.batch(
    [
      { sql: "DELETE FROM document_shares WHERE document_id = ?", args: [docId] },
      { sql: "DELETE FROM documents WHERE id = ?", args: [docId] },
    ],
    "write",
  );
}

export async function listShares(db: Client, userId: string, docId: string): Promise<ShareEntry[]> {
  await loadWithRole(db, userId, docId); // any collaborator may see who has access
  const res = await db.execute({
    sql: `SELECT u.id, u.email, u.name, s.role FROM document_shares s
          JOIN users u ON u.id = s.user_id WHERE s.document_id = ? ORDER BY u.name`,
    args: [docId],
  });
  return res.rows.map((r) => ({
    userId: String(r.id),
    email: String(r.email),
    name: String(r.name),
    role: r.role as ShareRole,
  }));
}

/** Grants (or updates) access. Re-sharing with an existing collaborator changes their role. */
export async function addShare(db: Client, userId: string, docId: string, input: unknown): Promise<ShareEntry[]> {
  const { email, role } = parse(shareInput, input);
  const { row, role: callerRole } = await loadWithRole(db, userId, docId);
  if (!canShare(callerRole)) throw new ForbiddenError("Only the owner can share this document.");

  const target = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
  const targetId = target.rows[0]?.id;
  if (!targetId) throw new ValidationError(`No user found with email ${email}.`);
  if (String(targetId) === String(row.owner_id)) throw new ValidationError("You already own this document.");

  await db.execute({
    sql: `INSERT INTO document_shares (document_id, user_id, role, created_at) VALUES (?, ?, ?, ?)
          ON CONFLICT (document_id, user_id) DO UPDATE SET role = excluded.role`,
    args: [docId, String(targetId), role, new Date().toISOString()],
  });
  return listShares(db, userId, docId);
}

export async function removeShare(
  db: Client,
  userId: string,
  docId: string,
  targetUserId: unknown,
): Promise<ShareEntry[]> {
  const target = parse(z.string().min(1, "userId is required."), targetUserId);
  const { role } = await loadWithRole(db, userId, docId);
  if (!canShare(role)) throw new ForbiddenError("Only the owner can change sharing.");
  await db.execute({
    sql: "DELETE FROM document_shares WHERE document_id = ? AND user_id = ?",
    args: [docId, target],
  });
  return listShares(db, userId, docId);
}
