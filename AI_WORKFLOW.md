# AI Workflow Note

## Tools used

- **Claude Code (Claude Opus, in VS Code)** — the primary tool: planning, scaffolding, implementation, tests, and the docs drafts.
- **Headless Chrome via Puppeteer** (scripted by the AI, run locally) — to drive the real UI and capture the screenshots in `screenshots/`.

## How I worked with it

I kept the decisions and used the AI for execution speed. Before any code was written I had it produce a plan with explicit scope cuts. I chose the stack and hosting path (Next.js + TipTap on Vercel + Turso, picked so the deploy is free and local setup needs nothing), and approved the plan only after the scope was something I could defend. Building then went in layers, each checked before the next: data and service layer → tests → API → UI → browser verification → docs.

## Where AI materially sped things up

- **Boilerplate-heavy surface area:** route handlers, zod schemas, the TipTap toolbar, the share dialog, and the Tailwind styling. Hours of typing became minutes.
- **Test authoring:** the sharing-matrix tests (owner/editor/viewer/stranger across read/edit/share/delete) were written alongside the service layer and passed first run, which let me refactor UI code with confidence.
- **Verification tooling:** it wrote a curl smoke-test script and a Puppeteer walkthrough that logs in as each seeded user, formats a document, reloads to prove persistence, shares, and checks viewer/no-access behavior. That replaced a lot of manual clicking.
- **Test fixtures:** it generated a real `.docx` with Word heading and list styles (`scripts/make-sample-docx.mjs`) so the import path is tested against meaningful input.

## What I changed or rejected

- **Rejected an ORM (Prisma/Drizzle)** in favor of raw SQL over libSQL. Three tables don't justify codegen and migrations, and one driver covers both local SQLite and hosted Turso.
- **Rejected storing TipTap JSON;** stored sanitized HTML instead, because the import converters emit HTML. Sanitization runs **server-side on every write**, not only on import: the API can be called directly, so the client is never trusted.
- **Changed access-denied behavior** from 403 to **404 for non-collaborators** so document existence isn't leaked. 403 is kept for "you can see it but your role can't do that."
- **Caught .docx fidelity gaps.** The first import test file (made with macOS `textutil`) lost headings and lists, and mammoth drops underline by default. I added an underline style mapping and a properly styled fixture, plus a test that asserts headings, both list types, and underline survive.
- **Fixed UI issues found in screenshot review:**
  - The toolbar wrapped badly at phone width (pill shape and split labels), so I redesigned the wrapping and swapped the tiny undo/redo glyphs for SVG icons.
  - Markdown export duplicated the title as an extra H1, so I removed it.
- **Dependency conflict:** npm resolved Vitest 5, which conflicts with the scaffold's `@types/node`, so I pinned Vitest 3 instead of forcing peer deps.
- **Scope pushback:** I kept real-time co-editing (Yjs) out despite it being the "obvious" Google-Docs feature. Done properly it would have consumed the whole timebox and needs non-serverless infrastructure.

## How I verified correctness, UX, and reliability

1. **Automated tests (24, Vitest):**
   - pure permission rules
   - the document/sharing service against a real temporary SQLite DB, covering lifecycle, sanitization, viewer/editor/stranger behavior, role upgrade, revocation, cascade delete, and validation errors
   - file import for .md, .txt, .docx, unsupported/empty/oversized/corrupt files, and XSS stripping
2. **Static checks:** `tsc --noEmit`, ESLint, and `next build` all clean.
3. **API smoke test against the production build:**
   - 401 without a session or with a forged cookie
   - 400 on bad JSON or an empty title
   - 404 for a non-collaborator
   - 403 for a viewer saving
   - 415 for a .pdf upload
   - 201 for .md and .docx imports
4. **Real-browser walkthrough (Puppeteer):** formatted text survives a reload, the share dialog works including its error state, the viewer's editor is non-editable with no toolbar, the no-access user gets a 404 page, and there's no horizontal overflow at 390 px width. I reviewed every screenshot myself rather than trusting "tests passed".
5. **Deployed build:** the same flows were smoke-tested on the live Vercel URL.
