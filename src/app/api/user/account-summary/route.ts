import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { etatNewsletterDuCompte, type EtatNewsletterCompte } from '@/lib/newsletter/compte';
import { connexionDuCompte, type ResumeDuCompte } from '@/lib/compte';

/** Ce que « Mon compte » affiche en plus du profil (voir ResumeDuCompte). */

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const [abonnement, factures] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('tier, status, billing_cycle, current_period_start, current_period_end, price_amount')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select('id, invoice_number, amount_xof, status, paid_at, created_at, billing_cycle, pdf_path')
      .eq('user_id', user.id)
      .order('paid_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  if (factures.error) {
    Sentry.captureException(new Error('compte: factures illisibles'), {
      tags: { context: 'compte-factures' },
      extra: { userId: user.id, code: factures.error.code },
    });
  }

  let newsletter: EtatNewsletterCompte | null = null;
  if (user.email && user.email_confirmed_at) {
    try {
      newsletter = await etatNewsletterDuCompte(user.email);
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'compte-newsletter-etat' }, extra: { userId: user.id } });
    }
  }

  const resume: ResumeDuCompte = {
    subscription: abonnement.data ?? null,
    invoices: factures.error
      ? null
      : (factures.data ?? []).map(({ pdf_path, ...f }) => ({ ...f, pdf: Boolean(pdf_path) })),
    connexion: connexionDuCompte(user),
    newsletter,
  };
  return NextResponse.json(resume);
}
