"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function LoginPicker({ users }: { users: User[] }) {
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

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full text-white font-semibold ${color} ${dims}`}>
      {initials}
    </span>
  );
}
