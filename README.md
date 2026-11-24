# Ajaia Docs

A lightweight collaborative document editor: create, format, import, share, and reopen rich-text documents.

**Live demo:** _LIVE_URL_ — sign in as any seeded user (no password).

| Seeded user | Email | Starts with |
|---|---|---|
| Alice Johnson | `alice@ajaia.test` | Owns "Welcome to Ajaia Docs", shared with Bob |
| Bob Smith | `bob@ajaia.test` | "Welcome to Ajaia Docs" under *Shared with me* (can edit) |
| Carol Lee | `carol@ajaia.test` | Nothing — use her to test sharing from scratch |

## Features

- **Documents** — create, rename (click the title), edit, delete (owner only). Autosaves ~0.8 s after you stop typing, with *Saving… / All changes saved / Couldn't save — Retry* status.
- **Rich text** — bold, italic, underline, strikethrough, Heading 1–3, bulleted and numbered lists, quotes, undo/redo, standard keyboard shortcuts.
- **File import** — **Import file** on the dashboard turns a **.txt, .md or .docx** file (max 2 MB) into a new editable document. Other types are rejected with a clear message. Sample files are in [`samples/`](samples/).
- **Sharing** — the owner shares by email as **Editor** or **Viewer**, can change roles or revoke access. Dashboard separates **My documents** from **Shared with me** with role badges. Viewers get a read-only editor with a banner. Users without access get a 404 (existence isn't leaked).
- **Persistence** — SQLite locally / Turso (hosted libSQL) in production. Formatting is stored as sanitized HTML.
- **Export** — download any document as Markdown (stretch).

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:3000
```

No database setup needed: a `local.db` SQLite file is created and seeded on first request. Delete it to reset.

```bash
npm test             # Vitest: access rules, document/sharing service, file import (24 tests)
npm run typecheck    # tsc --noEmit
npm run lint
npm run build && npm start   # production build
```

### Environment variables (all optional locally)

| Variable | Purpose | Default |
|---|---|---|
| `TURSO_DATABASE_URL` | libSQL/Turso URL | `file:local.db` |
| `TURSO_AUTH_TOKEN` | Turso auth token | — |
| `SESSION_SECRET` | HMAC key for session cookies | dev-only default (set it in prod) |

See [`.env.example`](.env.example).

## Deploy (Vercel + Turso, both free, no card)

1. **Turso:** create a database at [app.turso.tech](https://app.turso.tech) → copy its URL (`libsql://…`) and create a token.
2. **Vercel:** import this repo → add env vars `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET` → Deploy.

Schema and seed data are created automatically on first request (idempotent `CREATE TABLE IF NOT EXISTS` / `INSERT OR IGNORE`).

## Project layout

```
src/lib/          server logic: db.ts (schema+seed), documents.ts (service + access enforcement),
                  access.ts (pure permission rules), importFile.ts, sanitize.ts, session.ts, http.ts
src/app/api/      thin route handlers → service layer
src/app/          pages: /login, / (dashboard), /documents/[id] (editor)
src/components/   Dashboard, DocumentEditor, Toolbar, ShareDialog, UploadButton, useAutosave
tests/            Vitest suites
samples/          sample .md / .txt / .docx for trying import
screenshots/      UI screenshots
```

More detail: [ARCHITECTURE.md](ARCHITECTURE.md) · [AI_WORKFLOW.md](AI_WORKFLOW.md) · [SUBMISSION.md](SUBMISSION.md)
