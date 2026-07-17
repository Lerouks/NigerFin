import type { Metadata } from 'next';
import Link from 'next/link';

// Perf M-3 : page de confirmation post-clic email = jamais cacheable.
// Explicite plutot que de laisser Next.js inferer (les searchParams forcent
// deja le dynamic en pratique, mais c'est plus clair pour le futur).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Désabonnement newsletter',
  description: 'Confirmation de votre désabonnement à la newsletter NFI Report.',
  robots: { index: false },
};

interface SearchParams {
  ok?: string;
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

  if (sp.demo) {
    title = 'Lien de démonstration';
    body = "Ce lien provient d'un email de test ou de prévisualisation. Aucun désabonnement réel n'a été effectué.";
    tone = 'info';
  } else if (sp.ok) {
    title = sp.already ? 'Vous étiez déjà désabonné' : 'Désabonnement confirmé';
    body = sp.already
      ? "Votre adresse était déjà retirée de notre liste. Vous ne recevrez plus aucun email de la newsletter NFI Report."
      : "C'est fait. Votre adresse a été retirée de notre liste, vous ne recevrez plus la newsletter. Désolé de vous voir partir.";
    tone = 'success';
  } else if (sp.error === 'missing' || sp.error === 'invalid') {
    title = 'Lien invalide';
    body = "Le lien de désabonnement est incomplet ou mal formé. Réessayez depuis le pied de votre dernier email.";
    tone = 'error';
  } else if (sp.error === 'notfound') {
    title = 'Lien expiré';
    body = "Ce lien de désabonnement n'est plus actif. Si vous recevez encore notre newsletter, écrivez-nous à contact@nfireport.com.";
    tone = 'error';
  } else if (sp.error === 'server') {
    title = 'Erreur serveur';
    body = "Une erreur est survenue. Réessayez dans quelques instants ou écrivez-nous à contact@nfireport.com.";
    tone = 'error';
  } else {
    title = 'Désabonnement';
    body = "Pour vous désabonner, utilisez le lien présent en pied de chacun de nos emails.";
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
          Newsletter NFI Report
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="text-base leading-relaxed text-foreground/75">{body}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-foreground px-5 py-2.5 font-medium text-background transition hover:opacity-90"
          >
            Retour à l&apos;accueil
          </Link>
          {tone === 'success' ? (
            <Link href="/" className="text-foreground/70 underline-offset-2 hover:underline">
              Vous changez d&apos;avis ? Réabonnez-vous
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
