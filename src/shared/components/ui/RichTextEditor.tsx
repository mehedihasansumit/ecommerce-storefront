"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Link2Off,
} from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { isHtml, plainTextToHtml } from "@/shared/lib/html";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  // Injected by <Field> via cloneElement
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

function toContent(value: string): string {
  return isHtml(value) ? value : plainTextToHtml(value);
}

interface ToolbarButtonProps {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ active, label, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "primary" : "ghost"}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const hasLink = editor.isActive("link");

  const toggleLink = () => {
    if (hasLink) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    setLinkUrl("");
    setLinkOpen((v) => !v);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  return (
    <div className="border-b border-gray-300 dark:border-gray-600">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <ToolbarButton label={hasLink ? "Remove link" : "Add link"} active={hasLink} onClick={toggleLink}>
          {hasLink ? <Link2Off size={16} /> : <Link2 size={16} />}
        </ToolbarButton>
      </div>
      {linkOpen && (
        <div className="flex items-center gap-2 border-t border-gray-200 px-1.5 py-2 dark:border-gray-700">
          <Input
            type="url"
            value={linkUrl}
            placeholder="https://example.com"
            autoFocus
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <Button type="button" size="sm" variant="primary" onClick={applyLink}>
            Add
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
    ],
    content: toContent(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        class:
          "rte-content min-h-[140px] px-3 py-2 focus:outline-none",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sync external value changes (e.g. switching language tabs) into the editor.
  useEffect(() => {
    if (!editor) return;
    const next = toContent(value);
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={[
        "w-full rounded-lg border bg-white dark:bg-gray-900",
        "focus-within:outline-2 focus-within:outline-offset-[-1px] focus-within:outline-[var(--color-primary)]",
        ariaInvalid
          ? "border-red-400 dark:border-red-600"
          : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
      ].join(" ")}
    >
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
