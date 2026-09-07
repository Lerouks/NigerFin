'use client';

import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { useAdminApiPolling } from '@/app/admin/hooks/useAdminApi';

interface OverviewLite {
  totalArticles: number;
  articlesThisMonth: number;
  articlesPublishedToday: number;
}

/** Le hook rend une erreur deja redigee en francais. On la reprend telle quelle. */
function messageDeLErreur(erreur: unknown): string {
  if (erreur instanceof Error && erreur.message.trim()) return erreur.message;
  return "Les chiffres n'ont pas pu être chargés.";
}

/** Le hook nomme « HorsLigne » l'erreur d'une connexion coupée. */
function estHorsLigne(erreur: unknown): boolean {
  return erreur instanceof Error && erreur.name === 'HorsLigne';
}

export function ContenuStats() {
  const { data, error, isLoading, mutate } = useAdminApiPolling<OverviewLite>('overview', 60000);

  const enEchec = Boolean(error);
  const horsLigne = estHorsLigne(error);
  const reessayer = () => {
    void mutate();
  };

  // Echec sans aucun chiffre en memoire : on n'affiche surtout pas trois tirets
  // a la place des donnees, c'est exactement ce qui faisait mentir l'ecran.
  if (enEchec && !data) {
    return (
      <ErreurStats
        message={messageDeLErreur(error)}
        horsLigne={horsLigne}
        onReessayer={reessayer}
      />
    );
  }

  return (
    <>
      {enEchec && (
        <BandeauChiffresAnciens
          message={messageDeLErreur(error)}
          horsLigne={horsLigne}
          onReessayer={reessayer}
        />
      )}

      <section className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Articles publiés"
          value={data?.totalArticles}
          isLoading={isLoading}
        />
        <StatCard
          label="Ce mois"
          value={data?.articlesThisMonth}
          isLoading={isLoading}
          accent
        />
        <StatCard
          label="Aujourd'hui"
          value={data?.articlesPublishedToday}
          isLoading={isLoading}
        />
      </section>
    </>
  );
}

/** Remplace les trois cartes quand aucun chiffre n'a pu être chargé. */
function ErreurStats({
  message,
  horsLigne,
  onReessayer,
}: {
  message: string;
  horsLigne: boolean;
  onReessayer: () => void;
}) {
  const Icone = horsLigne ? WifiOff : AlertTriangle;

  return (
    <section
      role="alert"
      className={[
        'mb-8 rounded-2xl p-5 border',
        horsLigne ? 'bg-black/2.5 border-black/8' : 'bg-red-50 border-red-200',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <Icone
          className={`w-5 h-5 shrink-0 mt-0.5 ${horsLigne ? 'text-foreground/40' : 'text-red-500'}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-tight">
            {horsLigne ? 'Connexion perdue' : "Les chiffres n'ont pas pu être chargés"}
          </p>
          <p className="text-[13px] text-foreground/60 leading-relaxed mt-1">{message}</p>
          <button
            type="button"
            onClick={onReessayer}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] text-white text-[13px] font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Les chiffres affichés sont ceux du dernier chargement réussi. On garde les
 * cartes, mais on prévient que la mise à jour vient d'échouer.
 */
function BandeauChiffresAnciens({
  message,
  horsLigne,
  onReessayer,
}: {
  message: string;
  horsLigne: boolean;
  onReessayer: () => void;
}) {
  const Icone = horsLigne ? WifiOff : AlertTriangle;

  return (
    <div
      role="alert"
      className={[
        'mb-3 rounded-xl px-4 py-3 border flex flex-wrap items-center gap-x-3 gap-y-2',
        horsLigne ? 'bg-black/2.5 border-black/8' : 'bg-red-50 border-red-200',
      ].join(' ')}
    >
      <Icone
        className={`w-4 h-4 shrink-0 ${horsLigne ? 'text-foreground/40' : 'text-red-500'}`}
        aria-hidden="true"
      />
      <p className="text-[13px] text-foreground/70 leading-relaxed min-w-0 flex-1">
        Chiffres du dernier chargement réussi, la mise à jour vient d&apos;échouer. {message}
      </p>
      <button
        type="button"
        onClick={onReessayer}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] text-white text-[12px] font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  isLoading,
  accent = false,
}: {
  label: string;
  value?: number;
  isLoading: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-2xl p-4',
        accent
          ? 'bg-linear-to-br from-[#d4a843]/8 to-[#ff8c42]/4 border border-[#d4a843]/15'
          : 'bg-black/2.5',
      ].join(' ')}
    >
      <p
        className={[
          'text-[10px] tracking-widest uppercase font-semibold',
          accent ? 'text-[#d4a843]' : 'text-foreground/45',
        ].join(' ')}
      >
        {label}
      </p>
      <p className="font-extrabold text-[24px] leading-tight mt-2 tabular-nums">
        {isLoading || value === undefined ? (
          <span className="text-foreground/20">-</span>
        ) : (
          value.toLocaleString('fr-FR')
        )}
      </p>
    </div>
  );
}
