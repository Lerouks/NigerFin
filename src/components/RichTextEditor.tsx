'use client';

import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  Heading2, Heading3, List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Table as TableIcon, Type, Upload, Loader2, X,
} from 'lucide-react';

// ─── Custom Extensions ───────────────────────────────────────────────────────

// Key Figure block: <div data-type="key-figure" data-value="..." data-label="...">
const KeyFigure = Node.create({
  name: 'keyFigure',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      value: { default: '' },
      label: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="key-figure"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'key-figure' }),
      ['span', { class: 'key-figure-value' }, HTMLAttributes.value || ''],
      ['span', { class: 'key-figure-label' }, HTMLAttributes.label || ''],
    ];
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('key-figure-node');
      dom.contentEditable = 'false';

      const valueEl = document.createElement('div');
      valueEl.classList.add('kf-value');
      valueEl.textContent = node.attrs.value || 'Chiffre';
      valueEl.contentEditable = 'true';
      valueEl.addEventListener('blur', () => {
        if (typeof getPos === 'function') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(getPos()!, undefined, { ...node.attrs, value: valueEl.textContent || '' });
            return true;
          }).run();
        }
      });

      const labelEl = document.createElement('div');
      labelEl.classList.add('kf-label');
      labelEl.textContent = node.attrs.label || 'Label';
      labelEl.contentEditable = 'true';
      labelEl.addEventListener('blur', () => {
        if (typeof getPos === 'function') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(getPos()!, undefined, { ...node.attrs, label: labelEl.textContent || '' });
            return true;
          }).run();
        }
      });

      dom.appendChild(valueEl);
      dom.appendChild(labelEl);

      return { dom };
    };
  },
});

// "À retenir" callout block
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },
});

// Image with caption
const FigureImage = Node.create({
  name: 'figureImage',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-type="image"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes({ 'data-type': 'image' }),
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt || '' }],
      ['figcaption', {}, HTMLAttributes.caption || ''],
    ];
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('figure');
      dom.classList.add('figure-image-node');
      dom.contentEditable = 'false';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';

      const caption = document.createElement('figcaption');
      caption.textContent = node.attrs.caption || 'Légende...';
      caption.contentEditable = 'true';
      caption.addEventListener('blur', () => {
        if (typeof getPos === 'function') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(getPos()!, undefined, { ...node.attrs, caption: caption.textContent || '' });
            return true;
          }).run();
        }
      });

      dom.appendChild(img);
      dom.appendChild(caption);
      return { dom };
    };
  },
});

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function ToolbarButton({
  onClick, active, disabled, title, children
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-[#111] text-white' : 'text-gray-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

// ─── Main Editor Component ──────────────────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({ content, onChange, onImageUpload }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      FigureImage,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      KeyFigure,
      Callout,
      Placeholder.configure({
        placeholder: 'Commencez à rédiger votre article...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  });

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload || !editor) return;
    setUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().insertContent({
        type: 'figureImage',
        attrs: { src: url, alt: '', caption: '' },
      }).run();
    } catch {
      // handled externally
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [editor, onImageUpload]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertKeyFigure = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'keyFigure',
      attrs: { value: '4,2 Mds FCFA', label: 'Chiffre clé' },
    }).run();
  }, [editor]);

  const insertCallout = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'callout',
      content: [
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'À retenir' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point clé 1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point clé 2' }] }] },
        ]},
      ],
    }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-black/[0.08] rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-black/[0.06] bg-gray-50/80">
        {/* Structure */}
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraphe">
          <Type className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre H2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre H3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Mise en exergue">
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Media & enrichment */}
        <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setLinkUrl(editor.getAttributes('link').href || ''); }} active={editor.isActive('link')} title="Lien">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Image avec légende">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="Tableau">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Financial data blocks */}
        <ToolbarButton onClick={insertKeyFigure} title="Chiffre clé">
          <span className="text-[11px] font-bold px-0.5">#</span>
        </ToolbarButton>
        <ToolbarButton onClick={insertCallout} title="Encadré À retenir">
          <span className="text-[11px] font-bold px-0.5">!</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Link input popup */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.06] bg-blue-50/50">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSetLink(); } }}
            placeholder="https://..."
            className="flex-1 px-3 py-1.5 border border-black/[0.08] rounded text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            autoFocus
          />
          <button onClick={handleSetLink} className="px-3 py-1.5 bg-[#111] text-white rounded text-[12px]">
            Appliquer
          </button>
          {editor.isActive('link') && (
            <button onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-[12px]">
              Retirer
            </button>
          )}
          <button onClick={() => setShowLinkInput(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* Editor content */}
      <EditorContent editor={editor} className="rich-editor-wrapper" />

    </div>
  );
}
