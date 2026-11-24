# Architecture Note

## Goal and framing

Ship a coherent, *reliable* document-collaboration slice in ~4 hours: the editing loop (create → format → autosave → reopen), file import, and owner-controlled sharing, all deployed and testable. I optimized for depth and correctness in those flows over breadth.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 15 (App Router) + TypeScript** | One codebase and one deploy for UI + API; server components read the DB directly for first paint. |
| Editor | **TipTap 2 (ProseMirror)** | Mature schema-based editor; gives correct list/heading behavior and keyboard shortcuts out of the box instead of fighting `contentEditable`. |
| Storage | **libSQL** — SQLite file locally, **Turso** in production | Same driver and SQL everywhere. Reviewers run locally with zero setup; production is persistent and free. |
| Validation | **zod** | Input schemas at the service boundary with user-facing messages. |
| Import | **mammoth** (.docx), **marked** (.md), custom (.txt) | Well-known converters; all output is sanitized. |
| Tests | **Vitest** | Fast, runs the real service layer against a temp SQLite DB. |

## Structure

```
Browser ──fetch──▶ /api/* route handlers (thin: auth + parse + map errors)
                         │
                         ▼
                 src/server/documents.ts  ◀── all business rules + access checks
                         │   uses src/lib/access.ts (pure role → permission rules)
                         ▼
                 libSQL client (src/server/db.ts) ──▶ SQLite file | Turso
```

Folders separate what runs where: `src/server/` is server-only (DB, sessions, business rules), `src/lib/` is safe for both sides (permission rules, shared types, fetch client), `src/components/` + `src/hooks/` are browser UI.

- **Authorization lives in one place.** Every service function takes the acting `userId`, loads the document *joined with that user's share row*, resolves a role (`owner | editor | viewer | null`) via `access.ts`, and enforces it. Routes can't forget a check, and the tests exercise the same code the API runs.
- **No access → 404, not 403.** Non-collaborators can't tell whether a document exists. 403 is reserved for collaborators doing something their role doesn't allow (e.g. a viewer saving).
- **Errors** are typed (`ValidationError`, `ForbiddenError`, …) and mapped to `{ error }` JSON + status in one wrapper (`http.ts`). Unexpected errors become a generic 500 message (details only in server logs), and unknown API paths return JSON 404s. The client surfaces these messages verbatim, with a readable fallback for non-JSON responses.
- **No raw crash screens.** `app/error.tsx` (with a "Try again" that re-fetches), `app/global-error.tsx`, and friendly not-found pages (generic, plus a document-specific one) cover page-level failures. Tested by running the app against an unreachable database.

## Where to change things

| Change | Edit |
|---|---|
| Title length, upload types or size limit | `src/lib/limits.ts` (browser and server both read it). A new file type also needs its converter in `src/server/importFile.ts`, and the compiler enforces this. |
| Permission rules or role labels | `src/lib/access.ts`. A new role also needs the `CHECK` constraint in `src/server/db.ts`. |
| Document or sharing behavior | `src/server/documents.ts` |
| User lookups | `src/server/users.ts` |
| Editor features | Extensions in `src/components/DocumentEditor.tsx`, the button in `Toolbar.tsx`, and the allowed tags in `src/server/sanitize.ts` |
| Autosave timing | `src/hooks/useAutosave.ts` |

## Data model

```
users(id, email UNIQUE, name)
documents(id, owner_id → users, title, content_html, created_at, updated_at)
document_shares(document_id → documents, user_id → users, role ∈ {viewer, editor}, PK(document_id, user_id))
```

Ownership is a column, not a share row, so a document always has exactly one owner and "shared with me" is simply a join. Re-sharing upserts (changes the role).

## Key decisions and tradeoffs

1. **Content stored as sanitized HTML** (not TipTap JSON). Import converters produce HTML, TipTap loads/serializes HTML losslessly for the features in scope, and HTML is portable for export. Every write passes through a `sanitize-html` allowlist matching the editor's schema, so stored content is always safe to render, even when it arrives via the API or a file rather than the editor.
2. **Autosave with last-write-wins.** Debounced (800 ms), single request in flight, edits made during a save are queued and sent next, failed saves keep the pending patch and offer Retry, `beforeunload` warns on unsaved changes. Real-time co-editing (Yjs/CRDT + websockets) was the biggest deliberate cut: it's a multi-day problem to do properly and doesn't fit serverless hosting without extra infrastructure. The UI states the last-write-wins behavior honestly.
3. **Mocked authentication.** Pick a seeded user; session = HMAC-signed httpOnly cookie (forged cookies are rejected). This keeps reviewer friction at zero while keeping the *authorization* model real.
4. **Import creates a new document** (rather than attachments). It's the most product-relevant behavior for a docs tool and exercises the full pipeline (upload → convert → sanitize → persist → edit). Limits enforced on both client (fast feedback) and server (source of truth): type allowlist, 2 MB, empty/corrupt file errors.
5. **Raw SQL over an ORM.** Three tables; an ORM would add codegen/migrations for little benefit. Schema creation and seeding are idempotent and run on first connection, so a fresh Turso DB needs no migration step.
6. **Role-based sharing (viewer/editor)** was taken as the stretch item because it's cheap on top of the sharing model and makes the access logic meaningfully testable. Markdown export was added because it's ~15 lines client-side.

## Deliberately out of scope

Real-time collaboration and presence · real auth/passwords/sign-up · comments/suggestions · version history · attachments and images · PDF export · dashboard pagination / full-text search (title search is client-side) · optimistic-concurrency conflict detection.

## What I'd build next (2–4 hours)

1. **Conflict safety:** send `updatedAt` with each save and reject stale writes (409) with a "this document changed — reload/merge" prompt. Cheap and removes silent overwrites.
2. **Version history:** snapshot `content_html` on save (throttled), list/restore in a side panel.
3. **Presence indicator:** lightweight polling ("Bob is viewing") as a step toward real-time.
4. **E2E tests** (Playwright) for the sharing flow in CI.
