"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import {
  IMPORT_EXTENSIONS,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_LABEL,
  IMPORT_TYPES_LABEL,
  IMPORT_TYPES_PROSE,
  isImportable,
} from "@/lib/limits";

/** Imports a supported file (see lib/limits.ts) as a new editable document, then opens it. */
export default function UploadButton({ onError }: { onError: (msg: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onFile(file: File) {
    onError(null);
    // Client-side pre-checks for fast feedback; the server re-validates everything.
    if (!isImportable(file.name)) {
      onError(`"${file.name}" isn't supported. Upload a ${IMPORT_TYPES_PROSE} file.`);
      return;
    }
    if (file.size > IMPORT_MAX_BYTES) {
      onError(`"${file.name}" is larger than ${IMPORT_MAX_LABEL}.`);
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
        accept={IMPORT_EXTENSIONS.join(",")}
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
        title={`Supported: ${IMPORT_TYPES_LABEL} (max ${IMPORT_MAX_LABEL})`}
      >
        {busy ? "Importing…" : "Import file"}
      </button>
    </>
  );
}
