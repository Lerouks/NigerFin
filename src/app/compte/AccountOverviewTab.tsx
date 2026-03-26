'use client';

import Link from 'next/link';
import {
  ArrowRight, Check, Heart, Clock, TrendingUp, Zap, Crown,
} from 'lucide-react';
import { PREMIUM_TIER, CURRENCY, getBillingCycleLabel } from '@/config/pricing';

interface AccountSummary {
  subscription: {
    tier: string;
    status: string;
    billing_cycle: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    price_amount: number;
    created_at: string;
  } | null;
  likedArticlesCount: number;
  recentPayments: {
    id: string;
    amount: number;
    tier: string;
    billing_cycle: string;
    status: string;
    created_at: string;
  }[];
}

interface AccountOverviewTabProps {
  isSubscribed: boolean;
  sub: AccountSummary['subscription'];
  periodEnd: string | null;
  summary: AccountSummary | null;
  likedArticles: { article_id: string; created_at: string }[];
}

export function AccountOverviewTab({ isSubscribed, sub, periodEnd, summary, likedArticles }: AccountOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Subscription status card (for subscribers) */}
      {isSubscribed && sub && (
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] text-white rounded-2xl p-8 border border-white/5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/40">Abonnement actif</span>
              </div>
              <h2 className="text-2xl font-bold">
                Premium - {getBillingCycleLabel(sub.billing_cycle || 'monthly')}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{(sub.price_amount || 0).toLocaleString('fr-FR')}</p>
              <p className="text-white/40 text-sm">{CURRENCY}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Statut</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">Actif</span>
              </div>
            </div>
            {periodEnd && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Prochain renouvellement</p>
                <p className="text-sm font-medium">{periodEnd}</p>
              </div>
            )}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">Accès</p>
              <p className="text-sm font-medium">Articles illimités</p>
            </div>
          </div>

          {sub.cancel_at_period_end && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-300 text-sm">
              Votre abonnement sera annulé le {periodEnd}. Vous conservez l&apos;accès jusque-là.
            </div>
          )}
        </div>
      )}

      {/* Upgrade CTA (for free users only) */}
      {!isSubscribed && (
        <div className="bg-gradient-to-br from-[#111] to-[#222] text-white rounded-2xl p-8 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/40">Passez Premium</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Débloquez un accès illimité</h2>
          <p className="text-white/50 text-sm mb-6 max-w-lg">
            Accédez à tous les articles, analyses, outils premium et newsletters exclusives.
            Rejoignez les professionnels qui font confiance à NFI Report.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-[14px] font-medium hover:bg-white/90 transition-colors">
              Voir les plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-[15px]">Articles sauvegardés</h3>
            </div>
            <span className="text-[12px] text-gray-400">{summary?.likedArticlesCount || 0} articles</span>
          </div>
          {likedArticles.length > 0 ? (
            <ul className="space-y-2">
              {likedArticles.slice(0, 5).map((like) => (
                <li key={like.article_id} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                  <span className="text-sm text-gray-600 truncate flex-1">{like.article_id}</span>
                  <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                    {new Date(like.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">
              Aucun article sauvegardé. Cliquez sur le coeur d&apos;un article pour le sauvegarder.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-[15px]">Historique des paiements</h3>
          </div>
          {summary?.recentPayments && summary.recentPayments.length > 0 ? (
            <ul className="space-y-2">
              {summary.recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-2 border-b border-black/[0.03] last:border-0">
                  <div>
                    <p className="text-sm font-medium capitalize">{payment.tier} - {getBillingCycleLabel(payment.billing_cycle || 'monthly')}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{payment.amount.toLocaleString('fr-FR')} F</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      payment.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                      payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {payment.status === 'verified' ? 'Vérifié' : payment.status === 'pending' ? 'En attente' : 'Rejeté'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun paiement enregistré.</p>
          )}
        </div>
      </div>

      {/* Premium features */}
      {isSubscribed && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-[15px]">Vos avantages Premium</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PREMIUM_TIER.features.map((feature) => (
              <div key={feature} className="flex items-start gap-2 p-3 bg-[#fafaf9] rounded-lg">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
