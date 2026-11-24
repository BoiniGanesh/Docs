# Submission — Ajaia Docs

**Candidate:** Ganeshkumar Boini
**Live URL:** _LIVE_URL_
**Walkthrough video:** _VIDEO_URL_ (also in `VIDEO_URL.txt`)

## Test accounts (no password — pick on the sign-in screen)

| User | Email | Use it to |
|---|---|---|
| Alice Johnson | alice@ajaia.test | Owner of the seeded "Welcome to Ajaia Docs" document |
| Bob Smith | bob@ajaia.test | Sees the welcome doc under *Shared with me* (Editor) |
| Carol Lee | carol@ajaia.test | Starts empty — share something with her as Viewer to see read-only mode |

**Fast review path (≈3 min):**
1. Sign in as Alice and click **+ New document**. Rename it, then format it with headings, bold, italic, underline and both list types. Refresh to confirm it persisted.
2. Click **Share**, add `carol@ajaia.test` as **Viewer**, then **Switch user** and sign in as Carol. The document is under *Shared with me* and is read-only.
3. Back as Alice, change Carol to **Editor**. Carol can now edit.
4. On the dashboard, click **Import file** and pick `samples/sample.docx` or `samples/sample.md`. It becomes a new editable document.

## What's included

| Path | Contents |
|---|---|
| `src/` | Next.js app: `app/` routes & API, `components/` + `hooks/` UI, `lib/` shared, `server/` server-only logic |
| `tests/` | Vitest suites (24 tests) |
| `samples/` | Sample .md / .txt / .docx files for import |
| `scripts/make-sample-docx.mjs` | Generates the styled .docx fixture |
| `screenshots/` | UI screenshots of every main flow |
| `README.md` | Local setup, run, test, deploy instructions |
| `ARCHITECTURE.md` | Architecture note: priorities, decisions, tradeoffs |
| `AI_WORKFLOW.md` | AI tools used, what was changed/rejected, verification |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Walkthrough video link |
| `.env.example` | Environment variables |

## What's working (end to end, locally and deployed)

- Create, rename, edit, autosave (or save now with ⌘/Ctrl+S), reopen and delete documents. Live word count.
- Dashboard search by title. Owned documents show "Shared with N" or "Only you".
- Rich text: bold, italic, underline, strikethrough, H1–H3, bulleted and numbered lists, quotes, undo/redo.
- Import .txt, .md and .docx (max 2 MB) as new documents, with clear errors for unsupported, empty, oversized or corrupt files.
- Sharing by email with Viewer or Editor roles, role changes and revocation.
- Owned and shared documents listed separately, with role badges.
- Read-only mode for viewers. Non-collaborators get a 404.
- Persistence in SQLite locally and Turso in production. Formatting is preserved.
- Validation and error handling on both client and server.
- Markdown export (stretch).

## What's incomplete or intentionally cut

- **No real-time co-editing.** Concurrent edits are last-write-wins, and the UI says so.
- **Mocked auth.** You pick a seeded user and there's no sign-up. Only seeded users can be shared with.
- No comments, version history, attachments, images or PDF export.
- No end-to-end tests in CI. The browser walkthrough was run locally with Puppeteer.

## Next 2–4 hours

1. Stale-write detection (`updatedAt` check returning 409, with a reload/merge prompt).
2. Version history with restore.
3. A presence indicator ("Bob is viewing").
4. Playwright end-to-end tests in CI.
