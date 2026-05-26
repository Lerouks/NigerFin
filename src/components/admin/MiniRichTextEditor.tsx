'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Link as LinkIcon, Eraser } from 'lucide-react';

export interface MiniRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Minimal rich-text editor for newsletter paragraphs.
 * Supports : <strong>, <em>, <a href>. No headings, lists, images, tables.
 * Output is HTML string compatible with PremiumBriefing rendering.
 */
export function MiniRichTextEditor({ value, onChange, placeholder, rows = 4 }: MiniRichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
        strike: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener', target: '_blank' },
      }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none min-h-[${rows * 1.6}em] p-3 focus:outline-hidden`,
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // tiptap returns "<p></p>" for empty; normalize to ""
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g., reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && (value || editor.getHTML() !== '<p></p>')) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = (editor.getAttributes('link').href as string) ?? '';
    setLinkValue(previous);
    setLinkOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkValue.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }, [editor, linkValue]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-foreground/15 bg-white">
      <div className="flex items-center gap-1 border-b border-foreground/10 px-2 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Gras">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italique">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} label="Lien">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="ml-auto" />
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false} label="Effacer le formatage">
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-foreground/10 bg-muted/40 px-2 py-1.5">
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://nfireport.com/articles/..."
            className="flex-1 rounded-sm border border-foreground/20 bg-white px-2 py-1 text-xs"
            autoFocus
          />
          <button type="button" onClick={applyLink} className="rounded-sm bg-primary px-2 py-1 text-xs font-semibold text-white">OK</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="rounded-sm px-2 py-1 text-xs text-foreground/60">Annuler</button>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition ${
        active ? 'bg-foreground text-white' : 'text-foreground/60 hover:bg-foreground/10'
      }`}
    >
      {children}
    </button>
  );
}
