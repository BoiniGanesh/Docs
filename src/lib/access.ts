export type ShareRole = "viewer" | "editor";
export type Role = "owner" | ShareRole;

/**
 * Pure access rules — the single source of truth for who can do what.
 * `shareRole` is the caller's row in document_shares (if any).
 */
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
