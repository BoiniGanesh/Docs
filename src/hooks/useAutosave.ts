"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";
type Patch = { title?: string; contentHtml?: string };

const DEBOUNCE_MS = 800;

/**
 * Debounced autosave. Changes are merged into one pending patch; only one request
 * is in flight at a time, and edits made during a save are sent right after it.
 */
export function useAutosave(docId: string) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current || Object.keys(pending.current).length === 0) return;

    const patch = pending.current;
    pending.current = {};
    inFlight.current = true;
    setStatus("saving");
    try {
      await api(`/api/documents/${docId}`, { method: "PATCH", json: patch });
      inFlight.current = false;
      if (Object.keys(pending.current).length > 0) {
        void flush(); // edits arrived mid-save
      } else {
        setStatus("saved");
        setError(null);
      }
    } catch (e) {
      inFlight.current = false;
      pending.current = { ...patch, ...pending.current }; // keep for retry; newer edits win
      setStatus("error");
      setError((e as Error).message);
    }
  }, [docId]);

  const queue = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  return { status, error, queue, flush };
}
