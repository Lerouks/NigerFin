import { notFound } from 'next/navigation';
import { getDemoIssue } from '@/data/newsletter-issues';
import PreviewSwitcher from './PreviewSwitcher';

export const dynamic = 'force-dynamic';

export default async function NewsletterPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = getDemoIssue(slug);
  if (!issue) notFound();

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-10 border-b border-foreground/10 bg-primary text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Premium Briefing
            </span>
            <span className="text-sm font-semibold">
              N°{String(issue.number).padStart(2, '0')} — {issue.subject}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/newsletter/premium/preview?issue=${slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-primary"
            >
              HTML brut ↗
            </a>
            <a
              href={`/api/newsletter/premium/preview?issue=${slug}&format=text`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-primary"
            >
              Plain text ↗
            </a>
            <a
              href={`/api/newsletter/premium/preview?issue=${slug}&format=json`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-primary"
            >
              JSON ↗
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <PreviewSwitcher slug={slug} />
      </main>
    </div>
  );
}
