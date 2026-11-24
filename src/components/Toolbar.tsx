"use client";

import type { Editor } from "@tiptap/react";

interface Btn {
  label: React.ReactNode;
  title: string;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
  disabled?: (e: Editor) => boolean;
}

const Icon = ({ d, flip }: { d: string; flip?: boolean }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
    <path d={d} />
  </svg>
);
const UNDO_PATH = "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4";

const GROUPS: Btn[][] = [
  [
    { label: <Icon d={UNDO_PATH} />, title: "Undo (⌘Z)", run: (e) => e.chain().focus().undo().run(), disabled: (e) => !e.can().undo() },
    { label: <Icon d={UNDO_PATH} flip />, title: "Redo (⌘⇧Z)", run: (e) => e.chain().focus().redo().run(), disabled: (e) => !e.can().redo() },
  ],
  [
    { label: <b>B</b>, title: "Bold (⌘B)", run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
    { label: <i>I</i>, title: "Italic (⌘I)", run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
    { label: <u>U</u>, title: "Underline (⌘U)", run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive("underline") },
    { label: <s>S</s>, title: "Strikethrough", run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive("strike") },
  ],
  [
    { label: "• List", title: "Bulleted list", run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
    { label: "1. List", title: "Numbered list", run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
    { label: "❝", title: "Quote", run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  ],
];

function currentBlock(e: Editor): string {
  for (const level of [1, 2, 3] as const) if (e.isActive("heading", { level })) return `h${level}`;
  return "p";
}

function setBlock(e: Editor, value: string) {
  const chain = e.chain().focus();
  if (value === "p") chain.setParagraph().run();
  else chain.setHeading({ level: Number(value[1]) as 1 | 2 | 3 }).run();
}

export default function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-y-1 rounded-xl border border-gray-200 bg-white px-2 py-1 shadow-sm" role="toolbar" aria-label="Formatting">
      <select
        aria-label="Text style"
        value={currentBlock(editor)}
        onChange={(ev) => setBlock(editor, ev.target.value)}
        className="rounded-md border-none bg-transparent px-2 py-1 text-sm hover:bg-gray-100 focus:outline-none"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5 border-l border-gray-200 pl-1 ml-1">
          {group.map((b) => {
            const active = b.active?.(editor) ?? false;
            return (
              <button
                key={b.title}
                type="button"
                title={b.title}
                aria-label={b.title}
                aria-pressed={b.active ? active : undefined}
                disabled={b.disabled?.(editor)}
                onMouseDown={(ev) => ev.preventDefault()} // keep editor selection
                onClick={() => b.run(editor)}
                className={`inline-flex min-w-8 h-8 items-center justify-center whitespace-nowrap rounded-md px-2 text-sm transition disabled:opacity-30 ${
                  active ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
