"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TurndownService from "turndown";
import { useEffect, useRef, useState } from "react";
import type { DocumentDetail } from "@/lib/types";
import { canEdit, canShare } from "@/lib/access";
import { TITLE_MAX_LENGTH } from "@/lib/limits";
import AppHeader from "./AppHeader";
import RoleBadge from "./RoleBadge";
import ShareDialog from "./ShareDialog";
import Toolbar from "./Toolbar";
import { useAutosave, type SaveStatus } from "@/hooks/useAutosave";

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes…",
  saving: "Saving…",
  error: "Couldn't save",
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

interface Props {
  doc: DocumentDetail;
  user: { name: string; email: string };
  /** Just created from the dashboard: focus the title so the user can name it. */
  isNew?: boolean;
}

export default function DocumentEditor({ doc, user, isNew = false }: Props) {
  const editable = canEdit(doc.role);
  const [title, setTitle] = useState(doc.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const { status, error, queue, flush } = useAutosave(doc.id);

  // New document: select the placeholder title, and drop ?new=1 so a refresh doesn't re-trigger.
  useEffect(() => {
    if (!isNew || !editable) return;
    titleInput.current?.select();
    window.history.replaceState(null, "", window.location.pathname);
  }, [isNew, editable]);

  // Cmd/Ctrl+S saves immediately instead of opening the browser's "Save page" dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (editable) void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editable, flush]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: editable ? "Start writing…" : "" }),
    ],
    content: doc.contentHtml,
    editable,
    immediatelyRender: false, // avoid SSR hydration mismatch
    onUpdate: ({ editor }) => queue({ contentHtml: editor.getHTML() }),
  });

  function onTitleChange(value: string) {
    setTitle(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setTitleError("Title can't be empty.");
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setTitleError(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
      return;
    }
    setTitleError(null);
    queue({ title: trimmed });
  }

  function exportMarkdown() {
    if (!editor) return;
    const md = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" }).turndown(editor.getHTML());
    const url = URL.createObjectURL(new Blob([`${md}\n`],{ type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${title.trim() || "document"}.md` });
    a.click();
    URL.revokeObjectURL(url);
  }

  const wordCount = editor ? countWords(editor.getText()) : 0; // editor re-renders on each change

  return (
    <>
      <AppHeader user={user}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0 flex-1 max-w-md">
            <input
              ref={titleInput}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => {
                if (!title.trim()) {
                  setTitle(doc.title);
                  setTitleError(null);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              readOnly={!editable}
              aria-label="Document title"
              aria-invalid={!!titleError}
              className={`w-full truncate rounded-md border px-2 py-1 text-base font-medium focus:outline-none ${
                titleError ? "border-red-400" : "border-transparent hover:border-gray-300 focus:border-blue-500"
              } ${editable ? "" : "cursor-default hover:border-transparent"}`}
            />
          </div>
          {editable && (
            <span className={`hidden sm:flex items-center gap-1 text-xs whitespace-nowrap ${status === "error" ? "text-red-600" : "text-gray-500"}`} aria-live="polite">
              {titleError ?? STATUS_TEXT[status]}
              {status === "error" && (
                <button onClick={() => void flush()} className="underline font-medium" title={error ?? undefined}>
                  Retry
                </button>
              )}
            </span>
          )}
        </div>
      </AppHeader>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="basis-full md:basis-auto md:flex-1 min-w-0">{editable && editor && <Toolbar editor={editor} />}</div>
          <div className="flex-1 md:hidden" />
          <RoleBadge role={doc.role} />
          <button onClick={exportMarkdown} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50" title="Download as Markdown">
            Export .md
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {canShare(doc.role) ? "Share" : "People"}
          </button>
        </div>

        {status === "error" && error && (
          <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error} Your changes are kept in this tab — <button className="underline font-medium" onClick={() => void flush()}>try again</button>.
          </div>
        )}
        {!editable && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            You have view-only access. Ask {doc.ownerName} ({doc.ownerEmail}) for edit access.
          </div>
        )}

        <article className="doc-content min-h-[70vh] rounded-lg border border-gray-200 bg-white px-8 py-10 shadow-sm sm:px-16">
          {editor ? <EditorContent editor={editor} /> : <div className="text-gray-400">Loading editor…</div>}
        </article>
        <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>
            Owned by {doc.ownerName}. Saving is automatic (or press ⌘/Ctrl+S); if two people edit at once, the last save wins.
          </span>
          {editor && (
            <span aria-live="polite" className="whitespace-nowrap">
              {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
            </span>
          )}
        </div>
      </div>

      {shareOpen && (
        <ShareDialog
          docId={doc.id}
          docTitle={title}
          owner={{ name: doc.ownerName, email: doc.ownerEmail }}
          canManage={canShare(doc.role)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
