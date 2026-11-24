# AI Workflow Note

## Tools used

- **Claude Code (Claude Opus, in VS Code)** — the primary tool for planning, implementation, tests, verification scripts, and first drafts of these docs. Commits list Claude as co-author.
- **Headless Chrome via Puppeteer** — scripted by Claude and run locally to drive the real UI as different users and capture `docs/screenshots/`.

## How I worked with it

Claude wrote most of the code under my direction; I made the decisions and verified every change. The loop was: ask for a plan or an audit → decide → let it implement → have it prove the result (tests, build, real-browser run) → review the evidence before moving on.

- **Plan before code.** Claude drafted a plan with explicit scope cuts. I chose the stack and hosting from the options it laid out: Next.js + TipTap on Vercel, with Turso, because it's free for reviewers and needs zero local setup. I approved the plan only once I could defend the scope.
- **Small, verified steps.** Each change was followed by the test suite, a type check, a production build, and a scripted browser walkthrough before it was committed.

## Where AI materially sped things up

- **Breadth of surface area:** route handlers, validation schemas, the editor toolbar, share dialog, and styling. Work that would take hours by hand took minutes.
- **Tests:** the sharing-permission matrix (owner / editor / viewer / stranger × read / edit / share / delete) was written alongside the service layer.
- **Verification tooling:** a curl API smoke test, and Puppeteer scripts that sign in as several users at once to check persistence, sharing, role changes, revoked access, read-only mode, and mobile layout. Re-running these after every change replaced most manual clicking.
- **Fixtures:** a generated `.docx` with real Word heading and list styles (`scripts/make-sample-docx.mjs`), so import is tested against meaningful input.

## Where I directed or pushed back

The AI's first complete version worked, but it had gaps that only surfaced because I questioned it. Each row is a question I asked and what it led to.

| What I asked or decided | What it surfaced and changed |
|---|---|
| "Check every requirement in the brief, one by one" | The AI note claimed a live-deployment test that hadn't happened yet, and SUBMISSION.md didn't list every file included. Both fixed. |
| "Are the folders clean and easy to understand?" | Server-only code and browser code were mixed in one folder. Split into `src/server/` (server-only), `src/lib/` (shared), and `src/hooks/`; moved the notes into `docs/`; removed an unused route. |
| "If I change something later, will I have to edit multiple places?" | Upload types and size limit, title length, role names, and user queries were copy-pasted across 3–4 files. Each now lives in one place (`lib/limits.ts`, `lib/access.ts`, `server/users.ts`), and adding an upload type without a converter now fails to compile. |
| "Will it ever crash, and does the user see a friendly message?" | A database failure showed Next.js's raw "Application error" screen, any wrong URL said "Document not found", and unknown API paths returned HTML. Added error boundaries with a working "Try again", correct not-found pages, and JSON errors everywhere, tested by running the app against an unreachable database. |
| Which UI improvements to build | From a list of options, I chose word count, title focus with ⌘/Ctrl+S, a "Shared with N" badge, and dashboard search. I declined the rest to protect time for deployment. |
| "As a reviewer, what would you test?" | Added multi-user checks: an editor's edits reaching the owner, changing a role in the dialog, losing access mid-edit, pasted malicious HTML, and double-click creation. All passed. |
| Real-time co-editing | Kept out of scope even though it's the "obvious" Google Docs feature: done properly it needs CRDTs and non-serverless infrastructure. Last-write-wins is stated in the UI and docs. |
| Order of work and attribution | Deployed before manual testing, so I test what reviewers will use. Kept Claude as commit co-author for transparency. |

## Issues the AI's own checks caught, which I reviewed

- **.docx fidelity:** the first test file lost headings and lists, and the converter dropped underline. Fixed with an underline mapping and a properly styled fixture, plus a test that asserts headings, both list types, and underline survive.
- **Mobile toolbar:** a screenshot at phone width showed the toolbar wrapping badly. The layout was reworked and the tiny undo/redo glyphs were replaced with icons.
- **Stale dashboard:** pressing the browser's Back button after editing showed old titles. The dashboard now refreshes, and the walkthrough checks it.
- **Markdown export** duplicated the title as an extra heading, so that was removed.
- **Dependency conflict:** npm resolved a Vitest version incompatible with the scaffold, so it was pinned rather than forcing peer dependencies.

Design decisions in the original plan that I reviewed and kept:
- **Raw SQL over an ORM**, for three tables.
- **Sanitized HTML storage**, cleaned server-side on every write.
- **404 rather than 403 for non-collaborators**, so the existence of a document isn't leaked.

The reasoning is in `ARCHITECTURE.md`.

## How I verified correctness, UX, and reliability

1. **Automated tests:** 24 tests (Vitest).
   - Permission rules.
   - The document and sharing service against a real temporary SQLite database: lifecycle, share counts, sanitization, viewer/editor/stranger behavior, role changes, revocation, cascade delete, and validation errors.
   - File import: .md, .txt, .docx, unsupported/empty/oversized/corrupt files, and XSS stripping.
2. **Static checks:** type check, lint, and production build, all clean after every change.
3. **API smoke test against the production build.** Each case returned the expected status:
   - 401 with no session or a forged cookie
   - 400 for invalid input
   - 403 when a viewer saves
   - 404 for non-collaborators and unknown routes
   - 415 for unsupported files
4. **Real-browser walkthroughs** as multiple simultaneous users, re-run after each change, covering:
   - editing, persistence, sharing and role changes, read-only mode, and revoked access
   - import, error states, Back navigation, search, word count, and mobile width

   I reviewed the screenshots myself rather than relying only on "tests passed".
5. **Failure testing:** ran the app against an unreachable database to confirm users see a friendly error screen, never a raw crash.
6. **Live deployment:** _LIVE_CHECK_
