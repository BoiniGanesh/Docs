"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

const ACCEPT = ".txt,.md,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

/** Imports a .txt / .md / .docx file as a new editable document, then opens it. */
export default function UploadButton({ onError }: { onError: (msg: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onFile(file: File) {
    onError(null);
    // Client-side pre-checks for fast feedback; the server re-validates everything.
    if (!/\.(txt|md|docx)$/i.test(file.name)) {
      onError(`"${file.name}" isn't supported. Upload a .txt, .md or .docx file.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      onError(`"${file.name}" is larger than 2 MB.`);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { document } = await api<{ document: { id: string } }>("/api/documents/import", {
        method: "POST",
        body: form,
      });
      router.push(`/documents/${document.id}`);
    } catch (e) {
      onError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
        title="Supported: .txt, .md, .docx (max 2 MB)"
      >
        {busy ? "Importing…" : "Import file"}
      </button>
    </>
  );
}
