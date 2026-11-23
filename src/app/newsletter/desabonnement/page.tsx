import type { Metadata } from 'next';
import Link from 'next/link';

// Perf M-3 : page de confirmation post-clic email = jamais cacheable.
// Explicite plutot que de laisser Next.js inferer (les searchParams forcent
// deja le dynamic en pratique, mais c'est plus clair pour le futur).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Désinscription',
  description: 'Confirmation de votre désinscription des messages de NFI REPORT.',
  robots: { index: false },
};

interface SearchParams {
  ok?: string;
  /** « attente » : l'adresse venait seulement de la page d'attente. */
  liste?: string;
  already?: string;
  demo?: string;
  error?: string;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let title = 'Désabonnement';
  let body: string | React.ReactNode = '';
  let tone: 'success' | 'info' | 'error' = 'info';

  // Le lien peut venir d'un mail de la newsletter comme d'un mail de la liste
  // d'attente : /api/newsletter/unsubscribe ajoute `liste=attente` quand
  // l'adresse vient seulement de la page d'attente. Sans cette précision, les
  // textes restent neutres (ni « newsletter » ni « liste d'attente »).
  const attente = sp.liste === 'attente';

  if (sp.demo) {
    title = 'Lien de démonstration';
    body = 'Ce lien vient d’un message de test ou d’aperçu\u00a0: aucune désinscription n’a été faite.';
    tone = 'info';
  } else if (sp.ok && attente) {
    title = sp.already ? 'Désinscription déjà effectuée' : 'Désinscription confirmée';
    body = sp.already
      ? 'Votre adresse n’est plus sur la liste d’attente, et nous ne vous écrirons pas à\u00a0l’ouverture du\u00a0site.'
      : 'C’est fait\u00a0: votre adresse a été retirée de la liste d’attente, et nous ne vous écrirons pas à\u00a0l’ouverture du\u00a0site.';
    tone = 'success';
  } else if (sp.ok) {
    title = sp.already ? 'Désabonnement déjà effectué' : 'Désabonnement confirmé';
    body = sp.already
      ? 'Votre adresse était déjà retirée de la liste\u00a0: vous ne recevez plus la newsletter de NFI\u00a0REPORT.'
      : 'C’est fait\u00a0: votre adresse a été retirée de la liste, et vous ne recevrez plus la newsletter de NFI\u00a0REPORT.';
    tone = 'success';
  } else if (sp.error === 'missing' || sp.error === 'invalid') {
    title = 'Lien invalide';
    body = 'Ce lien est incomplet ou mal formé. Réessayez depuis le pied de notre dernier message.';
    tone = 'error';
  } else if (sp.error === 'notfound') {
    title = 'Lien inactif';
    body = 'Ce lien n’est plus actif. Si vous recevez encore nos messages, écrivez-nous à\u00a0contact@nfireport.com.';
    tone = 'error';
  } else if (sp.error === 'server') {
    title = 'Erreur serveur';
    body = 'Une erreur est survenue. Réessayez dans quelques instants, ou écrivez-nous à\u00a0contact@nfireport.com.';
    tone = 'error';
  } else {
    title = 'Se désinscrire';
    body = 'Pour vous désinscrire, utilisez le lien présent au pied de chacun de nos messages.';
    tone = 'info';
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-4 py-12 sm:px-6">
      <div
        className={`rounded-2xl border p-8 sm:p-10 ${
          tone === 'success'
            ? 'border-green-200 bg-green-50/60'
            : tone === 'error'
              ? 'border-red-200 bg-red-50/60'
              : 'border-neutral-200 bg-white'
        }`}
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">
          {attente ? 'Liste d’attente' : sp.ok ? 'Newsletter' : 'NFI REPORT'}
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="text-base leading-relaxed text-foreground/75">{body}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-foreground px-5 py-2.5 font-medium text-background transition hover:opacity-90"
          >
            Retour à l’accueil
          </Link>
          {tone === 'success' ? (
            <Link href={attente ? '/' : '/newsletter'} className="text-foreground/70 underline-offset-2 hover:underline">
              Vous changez d’avis{'\u00a0'}? <span className="whitespace-nowrap">{attente ? 'Réinscrivez-vous' : 'Réabonnez-vous'}</span>
            </Link>
          ) : (
            <a href="mailto:contact@nfireport.com" className="text-foreground/70 underline-offset-2 hover:underline">
              contact@nfireport.com
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
