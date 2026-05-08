import Link from 'next/link';
import { listIssues, type NewsletterIssueRow } from '@/lib/newsletter/issues';
import { CreateDraftButton } from './CreateDraftButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewsletterAdminPage() {
  const issues = await listIssues();
  const drafts = issues.filter((i) => i.status === 'draft');
  const scheduled = issues.filter((i) => i.status === 'scheduled' || i.status === 'sending');
  const sent = issues.filter((i) => i.status === 'sent');

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-foreground/10 bg-primary text-white">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Premium Briefing</p>
            <h1 className="mt-1 text-2xl font-bold">Newsletter NFI Report</h1>
            <p className="mt-1 text-sm text-white/70">
              Composez, prévisualisez et envoyez les éditions exclusives à vos abonnés Premium.
            </p>
          </div>
          <CreateDraftButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-12">
        <IssueSection title="Brouillons" empty="Aucun brouillon. Créez un nouveau numéro." issues={drafts} />
        <IssueSection title="Programmés" empty="Aucun envoi programmé." issues={scheduled} />
        <IssueSection title="Envoyés" empty="Aucun envoi historique." issues={sent} />
      </main>
    </div>
  );
}

function IssueSection({
  title,
  empty,
  issues,
}: {
  title: string;
  empty: string;
  issues: NewsletterIssueRow[];
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground/60">
        {title} <span className="font-normal text-foreground/40">({issues.length})</span>
      </h2>
      {issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 bg-white/50 px-5 py-10 text-center text-sm text-foreground/55">
          {empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((iss) => (
            <Link
              key={iss.id}
              href={`/admin/newsletter/${iss.id}/edit`}
              className="group block rounded-2xl border border-foreground/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                N°{String(iss.number).padStart(2, '0')} · {iss.audience} · {iss.status}
              </p>
              <h3 className="mb-2 text-base font-bold leading-tight text-foreground line-clamp-2">
                {iss.subject || 'Sans sujet'}
              </h3>
              <p className="line-clamp-2 text-sm text-foreground/70">{iss.preheader || '—'}</p>
              <p className="mt-4 text-xs text-foreground/55">
                {iss.sent_at
                  ? `Envoyé le ${new Date(iss.sent_at).toLocaleDateString('fr-FR')}`
                  : iss.scheduled_at
                    ? `Programmé pour le ${new Date(iss.scheduled_at).toLocaleDateString('fr-FR')}`
                    : `Mis à jour le ${new Date(iss.updated_at).toLocaleDateString('fr-FR')}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
