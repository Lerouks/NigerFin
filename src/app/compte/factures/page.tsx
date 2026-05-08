import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { InvoicesList } from './InvoicesList';

export const metadata: Metadata = {
  title: 'Mes factures',
  description: 'Téléchargez et conservez les factures de votre abonnement Premium NFI Report.',
  robots: { index: false, follow: false },
};

export default async function FacturesPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect('/connexion?next=/compte/factures');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/connexion?next=/compte/factures');
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_xof, currency, status, paid_at, billing_cycle, period_start, period_end, pdf_path, created_at')
    .eq('user_id', user.id)
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/compte"
          className="text-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          ← Mon compte
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Mes factures</h1>
        <p className="mt-3 text-base leading-relaxed text-foreground/70">
          Toutes les factures émises pour vos abonnements Premium NFI Report. Conservation
          recommandée 10 ans (durée légale OHADA).
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Une erreur est survenue lors du chargement de vos factures. Réessayez dans un instant.
        </div>
      ) : (
        <InvoicesList invoices={invoices ?? []} />
      )}
    </main>
  );
}
