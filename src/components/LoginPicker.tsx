"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import type { UserInfo } from "@/lib/types";
import Avatar from "./Avatar";

/** Mocked sign-in: one button per seeded account. */
export default function LoginPicker({ users }: { users: UserInfo[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(userId: string) {
    setPending(userId);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: { userId } });
      window.location.href = "/";
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => signIn(u.id)}
          disabled={pending !== null}
          className="w-full flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60 transition"
        >
          <Avatar name={u.name} />
          <span className="flex-1">
            <span className="block font-medium">{u.name}</span>
            <span className="block text-sm text-gray-500">{u.email}</span>
          </span>
          {pending === u.id && <span className="text-sm text-gray-500">Signing in…</span>}
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
