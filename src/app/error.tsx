"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import ErrorScreen from "@/components/ErrorScreen";

/** Catches any unexpected error while rendering a page, so users never see a raw crash. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Re-fetch server data, then re-render — so "Try again" recovers once the problem clears.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <ErrorScreen
      title="Something went wrong"
      message="We couldn't load this page. Your saved documents are safe — please try again in a moment."
      action={{ label: "Try again", onClick: retry }}
      reference={error.digest}
    />
  );
}
