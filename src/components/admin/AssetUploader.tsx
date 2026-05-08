'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

export interface AssetUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}

/**
 * Drag-and-drop or click-to-upload for newsletter images.
 * Posts to /api/admin/newsletter/upload-asset, returns public URL.
 */
export function AssetUploader({ value, onChange, label }: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/newsletter/upload-asset', {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? `Échec upload (HTTP ${res.status})`);
        return;
      }
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) upload(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }

  return (
    <div>
      {label ? <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5">{label}</label> : null}
      {value ? (
        <div className="relative inline-block max-w-xs rounded-md border border-foreground/10 overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="aperçu" className="block max-h-48 w-auto" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-white transition hover:bg-foreground"
            aria-label="Supprimer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed bg-white px-4 py-3 transition ${
            dragActive ? 'border-gold bg-gold/5' : 'border-foreground/15 hover:border-foreground/30'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
          ) : (
            <Upload className="h-5 w-5 text-foreground/50" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              {uploading ? 'Envoi en cours…' : 'Cliquer ou glisser une image'}
            </p>
            <p className="text-xs text-foreground/55">PNG, JPEG, WebP, GIF, SVG · 5 MB max</p>
          </div>
          <ImageIcon className="h-4 w-4 text-foreground/30 group-hover:text-foreground/50" />
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
