import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { PreferencesForm, type NewsletterPrefs } from './PreferencesForm';

export const metadata: Metadata = {
  title: 'Mes préférences newsletter',
  description: 'Choisissez les contenus NFI Report que vous souhaitez recevoir par email.',
  robots: { index: false },
};

const DEFAULT_PREFS: NewsletterPrefs = {
  newsletter_monthly: true,
  newsletter_weekly: false,
  alerts_news: false,
  alerts_custom: false,
  reports_pdf: false,
};

export default async function PreferencesNewsletterPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect('/connexion?next=/compte/preferences-newsletter');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/compte/preferences-newsletter');

  const { data } = await supabase
    .from('newsletter_preferences')
    .select('newsletter_monthly, newsletter_weekly, alerts_news, alerts_custom, reports_pdf')
    .eq('user_id', user.id)
    .maybeSingle();

  const initialPrefs: NewsletterPrefs = data
    ? {
        newsletter_monthly: data.newsletter_monthly ?? true,
        newsletter_weekly: data.newsletter_weekly ?? false,
        alerts_news: data.alerts_news ?? false,
        alerts_custom: data.alerts_custom ?? false,
        reports_pdf: data.reports_pdf ?? false,
      }
    : DEFAULT_PREFS;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <Link href="/compte" className="text-sm text-foreground/60 transition-colors hover:text-foreground">
          ← Mon compte
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Mes préférences newsletter</h1>
        <p className="mt-3 text-base leading-relaxed text-foreground/70">
          Choisissez les contenus NFI Report que vous souhaitez recevoir par email. Vos préférences
          sont enregistrées immédiatement.
        </p>
      </header>

      <PreferencesForm initial={initialPrefs} />

      <p className="mt-10 border-t border-neutral-200 pt-6 text-xs text-foreground/55">
        Pour vous désabonner complètement de toutes nos communications, utilisez le lien{' '}
        <strong>« Se désabonner »</strong> en pied de chaque email reçu.
      </p>
    </main>
  );
}
