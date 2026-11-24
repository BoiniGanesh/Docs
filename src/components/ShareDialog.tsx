"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { ROLE_LABELS, SHARE_ROLES, type ShareRole } from "@/lib/access";
import type { ShareEntry } from "@/lib/types";
import Avatar from "./Avatar";

interface Props {
  docId: string;
  docTitle: string;
  owner: { name: string; email: string };
  canManage: boolean;
  onClose: () => void;
}

export default function ShareDialog({ docId, docTitle, owner, canManage, onClose }: Props) {
  const [shares, setShares] = useState<ShareEntry[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>(SHARE_ROLES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ email: string; name: string }[]>([]);

  useEffect(() => {
    api<{ shares: ShareEntry[] }>(`/api/documents/${docId}/shares`)
      .then((r) => setShares(r.shares))
      .catch((e) => setError(e.message));
    api<{ users: { email: string; name: string }[] }>("/api/users")
      .then((r) => setSuggestions(r.users))
      .catch(() => {});
  }, [docId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function mutate(init: RequestInit & { json: unknown }) {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ shares: ShareEntry[] }>(`/api/documents/${docId}/shares`, init);
      setShares(r.shares);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (await mutate({ method: "POST", json: { email, role } })) setEmail("");
  }

  const taken = new Set([owner.email, ...(shares ?? []).map((s) => s.email)]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-24" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="share-title" className="text-lg font-semibold mb-4 truncate">
          Share &ldquo;{docTitle}&rdquo;
        </h2>

        {canManage ? (
          <form onSubmit={invite} className="flex gap-2 mb-2">
            <input
              type="email"
              list="share-suggestions"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Add people by email"
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <datalist id="share-suggestions">
              {suggestions.filter((s) => !taken.has(s.email)).map((s) => (
                <option key={s.email} value={s.email}>{s.name}</option>
              ))}
            </datalist>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ShareRole)}
              className="rounded-lg border border-gray-300 px-2 text-sm"
              aria-label="Access level"
            >
              <RoleOptions />
            </select>
            <button disabled={busy || !email.trim()} className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              Share
            </button>
          </form>
        ) : (
          <p className="mb-2 text-sm text-gray-600">Only the owner can change who has access.</p>
        )}
        {error && <p role="alert" className="mb-2 text-sm text-red-600">{error}</p>}

        <h3 className="mt-4 mb-2 text-sm font-medium text-gray-700">People with access</h3>
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          <li className="flex items-center gap-3 py-1.5">
            <Avatar name={owner.name} size="sm" />
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-medium">{owner.name}</span>
              <span className="block truncate text-xs text-gray-500">{owner.email}</span>
            </span>
            <span className="text-sm text-gray-500">{ROLE_LABELS.owner.name}</span>
          </li>
          {shares === null && !error && <li className="text-sm text-gray-500 py-2">Loading…</li>}
          {shares?.map((s) => (
            <li key={s.userId} className="flex items-center gap-3 py-1.5">
              <Avatar name={s.name} size="sm" />
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium">{s.name}</span>
                <span className="block truncate text-xs text-gray-500">{s.email}</span>
              </span>
              {canManage ? (
                <>
                  <select
                    value={s.role}
                    disabled={busy}
                    onChange={(e) => mutate({ method: "POST", json: { email: s.email, role: e.target.value } })}
                    className="rounded-md border border-gray-200 px-1 py-0.5 text-sm"
                    aria-label={`Access level for ${s.name}`}
                  >
                    <RoleOptions />
                  </select>
                  <button
                    disabled={busy}
                    onClick={() => mutate({ method: "DELETE", json: { userId: s.userId } })}
                    className="rounded-md px-2 py-0.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove ${s.name}`}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">{ROLE_LABELS[s.role].name}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/** One <option> per grantable role, labelled from lib/access.ts. */
function RoleOptions() {
  return (
    <>
      {SHARE_ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r].name}
        </option>
      ))}
    </>
  );
}
