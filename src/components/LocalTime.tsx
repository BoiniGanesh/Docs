"use client";

import { useEffect, useState } from "react";

/**
 * Shows a timestamp in the viewer's own timezone and locale.
 * Formatting waits until after hydration: the server (UTC on Vercel) and the
 * browser would otherwise render different text and trigger a hydration error.
 */
export default function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
  }, [iso]);

  return <time dateTime={iso}>{text ?? "…"}</time>;
}
