/**
 * Roles and permission rules — the single source of truth for who can do what.
 * Used by the server (enforcement) and the UI (labels, showing/hiding controls).
 *
 * Adding a role: add it to SHARE_ROLES + ROLE_LABELS, update the can* rules below,
 * and the CHECK constraint on document_shares.role in server/db.ts.
 */

/** Roles an owner can grant. The first one is the default in the share dialog. */
export const SHARE_ROLES = ["editor", "viewer"] as const;
export type ShareRole = (typeof SHARE_ROLES)[number];
export type Role = "owner" | ShareRole;

export const ROLE_LABELS: Record<Role, { name: string; description: string }> = {
  owner: { name: "Owner", description: "Owner" },
  editor: { name: "Editor", description: "Can edit" },
  viewer: { name: "Viewer", description: "View only" },
};

/** `shareRole` is the caller's row in document_shares (if any). */
export function resolveRole(
  ownerId: string,
  userId: string,
  shareRole: ShareRole | null | undefined,
): Role | null {
  if (ownerId === userId) return "owner";
  return shareRole ?? null;
}

export const canView = (role: Role | null) => role !== null;
export const canEdit = (role: Role | null) => role === "owner" || role === "editor";
export const canShare = (role: Role | null) => role === "owner";
export const canDelete = (role: Role | null) => role === "owner";
