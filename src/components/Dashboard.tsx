"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import type { DocumentSummary } from "@/lib/types";
import UploadButton from "./UploadButton";
import RoleBadge from "./RoleBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard({
  owned: ownedFromServer,
  shared,
}: {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owned = ownedFromServer.filter((d) => !deletedIds.has(d.id));

  // Browser Back restores this page from Next's client cache; re-fetch so
  // titles and "edited" times reflect changes made in the editor.
  useEffect(() => router.refresh(), [router]);

  async function createDoc() {
    setCreating(true);
    setError(null);
    try {
      const { document } = await api<{ document: { id: string } }>("/api/documents", { method: "POST", json: {} });
      router.push(`/documents/${document.id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  }

  async function deleteDoc(doc: DocumentSummary) {
    if (!confirm(`Delete "${doc.title}"? This also removes access for everyone it's shared with.`)) return;
    setError(null);
    const hide = (on: boolean) =>
      setDeletedIds((ids) => {
        const next = new Set(ids);
        if (on) next.add(doc.id);
        else next.delete(doc.id);
        return next;
      });
    hide(true); // optimistic
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
    } catch (e) {
      hide(false);
      setError((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-2xl font-semibold flex-1">Documents</h1>
        <UploadButton onError={setError} />
        <button
          onClick={createDoc}
          disabled={creating}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {creating ? "Creating…" : "+ New document"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-6 text-right">Import supports .txt, .md and .docx files up to 2 MB.</p>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex justify-between gap-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-medium">Dismiss</button>
        </div>
      )}

      <Section title="My documents" count={owned.length} empty="No documents yet. Create one or import a file to get started.">
        {owned.map((d) => (
          <DocRow key={d.id} doc={d} subtitle={`Edited ${formatDate(d.updatedAt)}`}>
            <button
              onClick={() => deleteDoc(d)}
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete ${d.title}`}
            >
              Delete
            </button>
          </DocRow>
        ))}
      </Section>

      <Section title="Shared with me" count={shared.length} empty="Nothing has been shared with you yet.">
        {shared.map((d) => (
          <DocRow key={d.id} doc={d} subtitle={`Owned by ${d.ownerName} · Edited ${formatDate(d.updatedAt)}`}>
            <RoleBadge role={d.role} />
          </DocRow>
        ))}
      </Section>
    </main>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
        {title} <span className="text-gray-400">({count})</span>
      </h2>
      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">{empty}</div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">{children}</ul>
      )}
    </section>
  );
}

function DocRow({ doc, subtitle, children }: { doc: DocumentSummary; subtitle: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
      <span aria-hidden className="text-blue-600 text-lg">▤</span>
      <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
        <span className="block truncate font-medium">{doc.title}</span>
        <span className="block truncate text-xs text-gray-500">{subtitle}</span>
      </Link>
      {children}
    </li>
  );
}
