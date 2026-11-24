"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the whole
 * document, so it renders its own <html>/<body> and uses inline styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6f7f9", color: "#1f2328", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#57606a", marginBottom: 24 }}>
              Ajaia Docs hit an unexpected problem. Your saved documents are safe.
            </p>
            <button
              onClick={reset}
              style={{ background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
