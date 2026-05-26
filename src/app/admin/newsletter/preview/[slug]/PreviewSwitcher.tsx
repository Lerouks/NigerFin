'use client';

import { useState } from 'react';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; width: number; description: string }[] = [
  { id: 'desktop', label: 'Desktop', width: 700, description: 'Gmail, Outlook 365 web — cadre 700px' },
  { id: 'tablet', label: 'Tablette', width: 540, description: 'iPad Mail, Apple Mail compact' },
  { id: 'mobile', label: 'Mobile', width: 375, description: 'iPhone Mail, Gmail iOS, Android' },
];

export default function PreviewSwitcher({ slug }: { slug: string }) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const current = VIEWPORTS.find((v) => v.id === viewport)!;
  const previewUrl = `/api/newsletter/premium/preview?issue=${slug}`;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-foreground/10 bg-white p-1 shadow-xs">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewport(v.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                viewport === v.id
                  ? 'bg-primary text-white'
                  : 'text-foreground hover:bg-muted'
              }`}
              aria-pressed={viewport === v.id}
            >
              {v.label}
              <span className="ml-2 text-xs font-normal opacity-60">
                {v.width}px
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs italic text-foreground/60">{current.description}</p>
      </div>

      <div className="flex justify-center">
        <div
          className="rounded-2xl bg-white shadow-xl ring-1 ring-foreground/10"
          style={{ width: `${current.width + 32}px`, padding: '16px' }}
        >
          <iframe
            key={`${viewport}-${slug}`}
            title={`Newsletter preview ${viewport}`}
            src={previewUrl}
            style={{
              width: `${current.width}px`,
              height: '92vh',
              border: 'none',
              display: 'block',
              borderRadius: '8px',
              backgroundColor: '#fafaf9',
            }}
          />
        </div>
      </div>
    </section>
  );
}
