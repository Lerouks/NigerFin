import Link from 'next/link';
import { listDemoIssueSlugs, getDemoIssue } from '@/data/newsletter-issues';

export const dynamic = 'force-dynamic';

export default function NewsletterAdminPage() {
  const slugs = listDemoIssueSlugs();
  const issues = slugs.map((s) => ({ slug: s, issue: getDemoIssue(s)! }));

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-foreground/10 bg-primary text-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Premium Briefing
          </p>
          <h1 className="mt-1 text-2xl font-bold">Newsletter NFI Report</h1>
          <p className="mt-1 text-sm text-white/70">
            Composez, prévisualisez et envoyez les éditions exclusives à vos abonnés Premium.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground/60">
            Démonstration
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map(({ slug, issue }) => (
              <Link
                key={slug}
                href={`/admin/newsletter/preview/${slug}`}
                className="group block rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  N°{String(issue.number).padStart(2, '0')} · {issue.issueDateLabel}
                </p>
                <h3 className="mb-2 text-base font-bold leading-tight text-foreground">
                  {issue.subject}
                </h3>
                <p className="line-clamp-2 text-sm text-foreground/70">{issue.preheader}</p>
                <p className="mt-4 text-xs font-semibold text-gold group-hover:underline">
                  Prévisualiser →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-foreground/15 bg-white/50 p-6 text-sm text-foreground/70">
          <h2 className="mb-2 text-base font-bold text-foreground">Phases suivantes</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Phase 2</strong> · pipeline d&apos;envoi (migration{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">newsletter_issues</code>, batch
              Resend, cron Vercel prêt mais désactivé)
            </li>
            <li>
              <strong className="text-foreground">Phase 3</strong> · UI compose et envoi depuis cette
              page (formulaire structuré + boutons Test / Programmer / Envoyer)
            </li>
            <li>
              <strong className="text-foreground">Phase 4</strong> · tests Vitest + E2E Playwright,
              envoi test à <code className="rounded bg-muted px-1.5 py-0.5 text-xs">contact@nfireport.com</code>{' '}
              avant ouverture aux abonnés Premium.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
