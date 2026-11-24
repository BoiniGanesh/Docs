import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canShare, canView, resolveRole } from "../src/lib/access";

describe("resolveRole", () => {
  it("treats the owner as owner regardless of share rows", () => {
    expect(resolveRole("u1", "u1", null)).toBe("owner");
    expect(resolveRole("u1", "u1", "viewer")).toBe("owner");
  });

  it("uses the share role for collaborators and null for strangers", () => {
    expect(resolveRole("u1", "u2", "editor")).toBe("editor");
    expect(resolveRole("u1", "u2", "viewer")).toBe("viewer");
    expect(resolveRole("u1", "u3", null)).toBeNull();
  });
});

describe("permission matrix", () => {
  const cases = [
    { role: "owner", view: true, edit: true, share: true, del: true },
    { role: "editor", view: true, edit: true, share: false, del: false },
    { role: "viewer", view: true, edit: false, share: false, del: false },
    { role: null, view: false, edit: false, share: false, del: false },
  ] as const;

  it.each(cases)("$role", ({ role, view, edit, share, del }) => {
    expect(canView(role)).toBe(view);
    expect(canEdit(role)).toBe(edit);
    expect(canShare(role)).toBe(share);
    expect(canDelete(role)).toBe(del);
  });
});
