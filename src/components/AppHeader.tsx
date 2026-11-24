"use client";

import Link from "next/link";
import { api } from "@/lib/apiClient";
import Avatar from "./Avatar";

export default function AppHeader({ user, children }: { user: { name: string; email: string }; children?: React.ReactNode }) {
  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-bold">A</span>
          <span className="font-semibold hidden sm:inline">Ajaia Docs</span>
        </Link>
        <div className="flex-1 min-w-0">{children}</div>
        <div className="flex items-center gap-2 shrink-0">
          <Avatar name={user.name} size="sm" />
          <span className="hidden md:block text-sm text-gray-700" title={user.email}>
            {user.name}
          </span>
          <button onClick={signOut} className="ml-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
            Switch user
          </button>
        </div>
      </div>
    </header>
  );
}
