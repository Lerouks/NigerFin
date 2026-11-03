'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Database,
  Clock,
  CreditCard,
  LineChart,
  MapPin,
  Building2,
  Eye,
  Scroll,
  FileText,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Settings,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdminApi, useAdminApiPolling } from '../hooks/useAdminApi';
import { envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';

// ─── Types ────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warn' | 'error';

interface SiteHealthCheck {
  online: boolean;
  status: HealthStatus;
  latencyMs: number | null;
  lastChecked: string;
  message: string;
}

interface SupabaseHealthCheck {
  online: boolean;
  status: HealthStatus;
  latencyMs: number | null;
  message: string;
}

interface CronHealthCheck {
  status: HealthStatus;
  message: string;
  lastEventAt: string | null;
  successCount: number;
  failureCount: number;
}

interface IpayHealthCheck {
  status: HealthStatus;
  message: string;
  avgDelayMs: number | null;
  verifiedCount: number;
  pendingOldCount: number;
}

interface SiteHealthData {
  site: SiteHealthCheck;
  supabase: SupabaseHealthCheck;
  cron: CronHealthCheck;
  ipaymoney: IpayHealthCheck;
  checkedAt: string;
}

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_profiles?: { email: string; full_name: string };
}

interface AuditResponse {
  data: AuditEntry[];
  total: number;
}

// ─── Lecture des échecs ───────────────────────────────────────────────────

/**
 * Les lectures de cet écran passent par useAdminApi, donc par appelAdmin :
 * l'erreur remontée porte déjà une phrase en français, prête à afficher, et
 * son nom dit si la connexion est tombée. Avant, l'écran remplaçait cette
 * phrase par un texte fixe qui n'apprenait rien, ou n'affichait rien du tout.
 */
function messageErreur(erreur: unknown): string | null {
  if (!erreur) return null;
  if (erreur instanceof Error && erreur.message) return erreur.message;
  return "Les données n'ont pas pu être chargées. Réessayez dans un instant.";
}

function erreurHorsLigne(erreur: unknown): boolean {
  return erreur instanceof Error && erreur.name === 'HorsLigne';
}

// ─── Main view ────────────────────────────────────────────────────────────

export function SiteView() {
  return (
    <div className="max-w-[640px] lg:max-w-[920px] mx-auto px-5 pt-8 pb-10">
      <SiteHeader />
      <HealthSection />
      <ActivitySection />
      <ReferenceDataSection />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="mb-8">
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-bold">
        Module
      </p>
      <h1 className="font-extrabold text-[32px] leading-tight tracking-tight mt-1">
        Site
      </h1>
      <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed max-w-[560px]">
        La santé technique et les données référentielles qui alimentent NFI
        Report.
      </p>
    </header>
  );
}

// ─── Health section ───────────────────────────────────────────────────────

function HealthSection() {
  const { data, error, isLoading, mutate } = useAdminApiPolling<SiteHealthData>(
    'site-health',
    60000,
  );

  const erreur = messageErreur(error);
  const horsLigne = erreurHorsLigne(error);
  const IconeErreur = horsLigne ? WifiOff : AlertTriangle;
  const lastCheckedRelative = data?.checkedAt ? relativeTime(data.checkedAt) : '';

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Santé du site</h2>
        <span className="text-[11px] text-foreground/45">
          {lastCheckedRelative
            ? `Dernière vérif ${lastCheckedRelative}`
            : 'rafraichi chaque minute'}
        </span>
      </div>

      {erreur && (
        <div
          role="alert"
          className={`mb-4 p-4 rounded-2xl border text-[13px] ${
            horsLigne
              ? 'bg-black/3 border-black/10 text-foreground/70'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <IconeErreur className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-snug">
                {horsLigne
                  ? 'Connexion perdue'
                  : "Les contrôles de santé n'ont pas pu être relevés"}
              </p>
              <p className="mt-1 leading-relaxed">{erreur}</p>
              <p className="mt-1 leading-relaxed opacity-75">
                Les cartes ci-dessous datent du dernier relevé réussi, ou
                restent inconnues. Nouvel essai automatique dans 60 secondes.
              </p>
              <button
                type="button"
                onClick={() => {
                  void mutate();
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 font-semibold hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Réessayer maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          icon={Globe}
          label="Site web"
          okLabel="En ligne"
          warnLabel="Réponse lente"
          errorLabel="Hors ligne"
          status={data?.site.status ?? null}
          message={data?.site.message ?? null}
          lastChecked={data?.site.lastChecked ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={Database}
          label="API Supabase"
          okLabel="Connecté"
          warnLabel="Latence élevée"
          errorLabel="Indisponible"
          status={data?.supabase.status ?? null}
          message={data?.supabase.message ?? null}
          lastChecked={data?.checkedAt ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={Clock}
          label="Cron jobs"
          okLabel="OK"
          warnLabel="À surveiller"
          errorLabel="En échec"
          status={data?.cron.status ?? null}
          message={data?.cron.message ?? null}
          lastChecked={data?.cron.lastEventAt ?? data?.checkedAt ?? null}
          isLoading={isLoading}
        />
        <HealthCard
          icon={CreditCard}
          label="Webhook iPayMoney"
          okLabel="Sain"
          warnLabel="À surveiller"
          errorLabel="Bloqué"
          status={data?.ipaymoney.status ?? null}
          message={data?.ipaymoney.message ?? null}
          lastChecked={data?.checkedAt ?? null}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function HealthCard({
  icon: Icon,
  label,
  okLabel,
  warnLabel,
  errorLabel,
  status,
  message,
  lastChecked,
  isLoading,
}: {
  icon: LucideIcon;
  label: string;
  okLabel: string;
  warnLabel: string;
  errorLabel: string;
  status: HealthStatus | null;
  message: string | null;
  lastChecked: string | null;
  isLoading: boolean;
}) {
  if (isLoading && status === null) {
    return (
      <div className="bg-white border border-black/6 rounded-2xl p-4 animate-pulse min-h-[120px]">
        <div className="w-9 h-9 rounded-xl bg-black/6 mb-3" />
        <div className="h-3 bg-black/6 rounded-sm w-2/3 mb-2" />
        <div className="h-2 bg-black/4 rounded-sm w-1/2" />
      </div>
    );
  }

  const visual = getStatusVisual(status);
  const statusLabel =
    status === 'ok'
      ? okLabel
      : status === 'warn'
        ? warnLabel
        : status === 'error'
          ? errorLabel
          : 'Inconnu';

  return (
    <div className="bg-white border border-black/6 rounded-2xl p-4 flex flex-col gap-2 min-h-[120px]">
      <div className="flex items-center justify-between">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${visual.bg}`}
        >
          <Icon
            className={`w-[18px] h-[18px] ${visual.iconColor}`}
            aria-hidden="true"
          />
        </div>
        <visual.statusIcon
          className={`w-[18px] h-[18px] ${visual.statusColor}`}
          aria-hidden="true"
        />
      </div>
      <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold mt-1">
        {label}
      </p>
      <p className={`font-bold text-[14px] leading-tight ${visual.statusColor}`}>
        {statusLabel}
      </p>
      {message && (
        <p className="text-[11px] text-foreground/55 leading-snug line-clamp-2">
          {message}
        </p>
      )}
      {lastChecked && (
        <p className="text-[10px] text-foreground/35 mt-auto">
          Dernière vérif {relativeTime(lastChecked)}
        </p>
      )}
    </div>
  );
}

function getStatusVisual(status: HealthStatus | null): {
  bg: string;
  iconColor: string;
  statusIcon: LucideIcon;
  statusColor: string;
} {
  switch (status) {
    case 'ok':
      return {
        bg: 'bg-[#00c805]/12',
        iconColor: 'text-[#00a004]',
        statusIcon: CheckCircle2,
        statusColor: 'text-[#00a004]',
      };
    case 'warn':
      return {
        bg: 'bg-[#8a8e95]/15',
        iconColor: 'text-[#8a8e95]',
        statusIcon: AlertTriangle,
        statusColor: 'text-[#8a8e95]',
      };
    case 'error':
      return {
        bg: 'bg-red-500/12',
        iconColor: 'text-red-600',
        statusIcon: XCircle,
        statusColor: 'text-red-600',
      };
    default:
      return {
        bg: 'bg-black/6',
        iconColor: 'text-foreground/50',
        statusIcon: AlertTriangle,
        statusColor: 'text-foreground/50',
      };
  }
}

// ─── Activity timeline ────────────────────────────────────────────────────

function ActivitySection() {
  const { data, error, isLoading, mutate } = useAdminApiPolling<AuditResponse>(
    'audit?page=1',
    60000,
  );

  const erreur = messageErreur(error);
  const horsLigne = erreurHorsLigne(error);
  const events = (data?.data ?? []).slice(0, 10);
  // Premier chargement seulement : ensuite, l'écran garde ce qu'il affiche déjà.
  const chargementInitial = isLoading && !erreur && events.length === 0;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[16px]">Activité système</h2>
        <Link
          href="/admin/site/journal"
          className="text-[12px] text-[#8a8e95] font-semibold hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {/* Le squelette tient lieu d'état de chargement, EtatListe traite les
          deux autres cas : l'échec, et le journal vraiment vide. Un échec
          n'affiche plus « Aucune action », qui laissait croire à un journal
          vide alors que la route ne répondait pas. Quand des lignes ont déjà
          été chargées, elles restent affichées et l'échec passe en bandeau :
          sur cette connexion qui coupe toutes les 90 secondes, la liste
          disparaîtrait sinon en boucle alors que les données sont là. */}
      {chargementInitial ? (
        <ActivitySkeleton />
      ) : events.length === 0 ? (
        <EtatListe
          chargement={false}
          erreur={erreur}
          horsLigne={horsLigne}
          vide
          texteVide="Aucune action admin enregistrée pour le moment. Les futures modifications apparaîtront ici."
          onReessayer={() => {
            void mutate();
          }}
        />
      ) : (
        <>
          {erreur && (
            <div
              role="alert"
              className={`mb-3 px-4 py-3 rounded-2xl border text-[12px] leading-relaxed ${
                horsLigne
                  ? 'bg-black/3 border-black/10 text-foreground/70'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="font-semibold">
                {horsLigne ? 'Connexion perdue. ' : "Le journal n'a pas pu être rafraîchi. "}
              </span>
              {erreur} Les lignes ci-dessous datent du dernier relevé réussi.
              <button
                type="button"
                onClick={() => {
                  void mutate();
                }}
                className="ml-2 font-semibold hover:underline"
              >
                Réessayer maintenant
              </button>
            </div>
          )}
          <div className="space-y-2.5">
            {events.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const visual = getAuditVisual(entry.action);
  const adminLabel =
    entry.user_profiles?.full_name ||
    entry.user_profiles?.email ||
    `${entry.admin_id.slice(0, 8)}...`;
  const entityLabel = formatEntity(entry.entity_type);

  return (
    <div className="flex items-center gap-3 bg-white border border-black/6 rounded-2xl p-3.5">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${visual.bg}`}
      >
        <visual.icon
          className={`w-[18px] h-[18px] ${visual.iconColor}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight text-foreground truncate">
          {adminLabel}
          <span className="text-foreground/45 font-normal">
            {' '}
            {visual.verb} {entityLabel}
          </span>
        </p>
        <p className="text-[11px] text-foreground/45 mt-0.5">
          {relativeTime(entry.created_at)}
          {entry.entity_id ? (
            <>
              {' · '}
              <span className="font-mono text-[10px] text-foreground/40">
                {entry.entity_id.slice(0, 8)}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white border border-black/6 rounded-2xl p-3.5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-black/6 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-black/6 rounded-sm w-3/4" />
            <div className="h-2 bg-black/4 rounded-sm w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getAuditVisual(action: string): {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  verb: string;
} {
  const normalized = action.toLowerCase();
  if (normalized.includes('delete') || normalized.includes('remove')) {
    return {
      icon: Trash2,
      bg: 'bg-red-500/10',
      iconColor: 'text-red-600',
      verb: 'a supprimé',
    };
  }
  if (normalized.includes('create') || normalized.includes('add')) {
    return {
      icon: Plus,
      bg: 'bg-[#00c805]/12',
      iconColor: 'text-[#00a004]',
      verb: 'a créé',
    };
  }
  if (
    normalized.includes('update') ||
    normalized.includes('edit') ||
    normalized.includes('modify')
  ) {
    return {
      icon: Pencil,
      bg: 'bg-[#8a8e95]/15',
      iconColor: 'text-[#8a8e95]',
      verb: 'a modifié',
    };
  }
  if (normalized.includes('publish')) {
    return {
      icon: FileText,
      bg: 'bg-foreground',
      iconColor: 'text-[#8a8e95]',
      verb: 'a publié',
    };
  }
  return {
    icon: Settings,
    bg: 'bg-black/6',
    iconColor: 'text-foreground/70',
    verb: 'a agi sur',
  };
}

function formatEntity(entity: string): string {
  switch (entity) {
    case 'article':
      return 'un article';
    case 'comment':
      return 'un commentaire';
    case 'user':
      return 'un utilisateur';
    case 'payment':
    case 'payment_request':
      return 'un paiement';
    case 'newsletter':
      return 'une newsletter';
    case 'pricing':
      return 'un tarif';
    case 'market_data':
      return 'une donnée marché';
    case 'enterprise':
      return 'une fiche entreprise';
    case 'niger_presentation':
      return 'la présentation Niger';
    case 'site_features':
      return 'la visibilité du site';
    case 'education':
      return 'un contenu éducation';
    case 'legal':
    case 'legal_section':
      return 'une page légale';
    case 'flash_banner':
      return 'le flash info';
    case 'cron':
      return 'un cron job';
    default:
      return entity.replace(/_/g, ' ');
  }
}

// ─── Reference data section ───────────────────────────────────────────────

interface ReferenceCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

function ReferenceDataSection() {
  const cards: ReferenceCard[] = [
    {
      href: '/admin/site/marches',
      icon: LineChart,
      title: 'Marchés BRVM',
      description:
        'Indices, devises et matières premières affichés sur la home.',
    },
    {
      href: '/admin/site/niger',
      icon: MapPin,
      title: 'Niger en chiffres',
      description: 'Carte, faits clés et régions de la page présentation.',
    },
    {
      href: '/admin/site/entreprises',
      icon: Building2,
      title: 'Entreprises stratégiques',
      description: 'Fiches détaillées des champions économiques nigériens.',
    },
    {
      href: '/admin/site/visibilite',
      icon: Eye,
      title: 'Visibilité du site',
      description: 'Activer ou couper le bandeau Marchés et autres modules.',
    },
    {
      href: '/admin/site/journal',
      icon: Scroll,
      title: "Journal d'audit",
      description: 'Toutes les actions admin tracées, paginées et filtrables.',
    },
  ];

  return (
    <section className="mb-6">
      <h2 className="font-bold text-[16px] mb-3">Données référentielles</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            prefetch
            className="group relative bg-white border border-black/6 rounded-2xl p-5 hover:border-[#8a8e95]/40 hover:shadow-xs transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#8a8e95]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#8a8e95]">
                <card.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-foreground/30 group-hover:text-[#8a8e95] transition"
                aria-hidden="true"
              />
            </div>
            <p className="font-bold text-[16px] text-foreground leading-tight">
              {card.title}
            </p>
            <p className="text-[13px] text-foreground/55 leading-relaxed mt-1">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
      <MarketTickerInlineToggle />
    </section>
  );
}

// ─── Market ticker quick toggle ───────────────────────────────────────────

interface SiteFeaturesPayload {
  market_ticker_enabled: boolean;
  updated_at: string | null;
}

function MarketTickerInlineToggle() {
  const { data, error, mutate, isLoading, isValidating } =
    useAdminApi<SiteFeaturesPayload>('site-features');
  const [erreurBascule, setErreurBascule] = useState<string | null>(null);
  // Verrou d'envoi. Sans lui, l'interrupteur restait cliquable pendant les
  // vingt-cinq secondes d'attente d'un PUT : deux clics envoyaient deux ordres
  // contradictoires, et c'est l'ordre d'arrivée qui décidait de l'état du
  // bandeau sur le site public.
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  // Une bascule partie dont la réponse s'est perdue. Le serveur a peut-être
  // enregistré : l'écran refuse alors de donner une position, plutôt que d'en
  // inventer une.
  const [doute, setDoute] = useState(false);
  const attenteVerification = useRef(false);

  const erreurLecture = messageErreur(error);
  // null tant que rien n'a jamais été lu. Mettre « actif » par défaut faisait
  // afficher une pastille verte, curseur à droite, aria-pressed à true, pour un
  // état qui n'avait aucune source : c'est le seul signal qu'on lit d'un coup
  // d'oeil, et il affirmait quelque chose du site public.
  const valeurLue = data ? data.market_ticker_enabled : null;
  const etatConnu = valeurLue !== null && !doute;
  const afficheActif = etatConnu && valeurLue === true;
  const basculeBloquee =
    isLoading || envoiEnCours || !etatConnu || Boolean(erreurLecture);

  // Quand la connexion revient, SWR relit de lui-même (revalidateOnReconnect).
  // Le doute et le message d'échec s'effacent à ce moment-là : sinon ils
  // restaient affichés à côté d'un interrupteur redevenu juste, et les deux se
  // contredisaient jusqu'au rechargement de la page.
  useEffect(() => {
    if (!attenteVerification.current) return;
    if (isValidating || error || !data) return;
    attenteVerification.current = false;
    setDoute(false);
    setErreurBascule(null);
  }, [isValidating, error, data]);

  /** L'état réel du serveur, ou null si la relecture échoue elle aussi. */
  const relire = async (): Promise<SiteFeaturesPayload | null> => {
    try {
      const frais = await mutate();
      return frais && typeof frais.market_ticker_enabled === 'boolean'
        ? frais
        : null;
    } catch {
      return null;
    }
  };

  const handleToggle = async () => {
    if (!data || basculeBloquee) return;
    const avant = data.market_ticker_enabled;
    const suivant = !avant;
    setErreurBascule(null);
    setEnvoiEnCours(true);

    try {
      await mutate(
        { market_ticker_enabled: suivant, updated_at: data.updated_at },
        { revalidate: false },
      );

      const resultat = await envoiAdmin<SiteFeaturesPayload>(
        '/api/admin/site-features',
        'PUT',
        { market_ticker_enabled: suivant },
      );

      if (resultat.ok) {
        const confirme = resultat.donnees;
        if (confirme && typeof confirme.market_ticker_enabled === 'boolean') {
          await mutate(confirme, { revalidate: false });
          return;
        }
        // Le serveur n'a rien confirmé : on redemande l'état réel plutôt que de
        // laisser l'écran afficher ce qu'il espérait.
        setErreurBascule(
          "Le serveur n'a pas confirmé le réglage. L'état affiché vient d'être revérifié.",
        );
        await relire();
        return;
      }

      // Trois situations très différentes se cachent derrière un seul échec.
      // La première chose à faire est d'aller voir l'état réel : c'est la seule
      // façon de ne rien affirmer sur le site public sans le savoir.
      const relu = await relire();
      if (relu) {
        setDoute(false);
        setErreurBascule(
          `Le réglage n'a pas abouti. ${resultat.message} L'état vient d'être revérifié : le bandeau est ${
            relu.market_ticker_enabled ? 'visible' : 'désactivé'
          }.`,
        );
        return;
      }

      // Rien n'est parti, ou le serveur a explicitement refusé : là, on sait
      // que rien n'a changé, et l'interrupteur revient où il était.
      if (resultat.rienEnvoye === true || resultat.statut >= 400) {
        await mutate(
          { market_ticker_enabled: avant, updated_at: data.updated_at },
          { revalidate: false },
        );
        setDoute(false);
        setErreurBascule(
          `Le réglage n'a pas été enregistré, le bandeau reste ${
            avant ? 'visible' : 'désactivé'
          }. ${resultat.message}`,
        );
        return;
      }

      // La demande est partie et la réponse s'est perdue. Affirmer que rien n'a
      // été enregistré serait un mensonge dans un cas sur deux, et remettre
      // l'interrupteur en arrière ferait recliquer pour un geste déjà effectué.
      attenteVerification.current = true;
      setDoute(true);
      setErreurBascule(
        `${resultat.cause ?? resultat.message} Le bandeau a peut-être été ${
          suivant ? 'activé' : 'désactivé'
        } sur le site : l'état sera revérifié dès le retour de la connexion.`,
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const sousTitre = !data
    ? erreurLecture
      ? "État inconnu, il n'a pas pu être lu."
      : "Chargement de l'état..."
    : doute
      ? "État incertain, la dernière bascule n'a pas été confirmée."
      : envoiEnCours
        ? 'Enregistrement en cours...'
        : erreurLecture
          ? 'État non revérifié, réglage momentanément indisponible.'
          : valeurLue
            ? 'Visible en haut de toutes les pages.'
            : "Désactivé, le site ne l'affiche pas.";

  return (
    <div className="mt-4">
      <div className="bg-white border border-black/6 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#8a8e95]/12 to-[#ff8c42]/8 flex items-center justify-center text-[#8a8e95] shrink-0">
          <LineChart className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-foreground leading-tight">
            Bandeau Marchés BRVM
          </p>
          <p className="text-[11px] text-foreground/55 mt-0.5">{sousTitre}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={basculeBloquee}
          // Pas d'aria-pressed quand la position est inconnue : un lecteur
          // d'écran annoncerait « activé » sans que personne ne le sache.
          aria-pressed={etatConnu ? afficheActif : undefined}
          aria-label={
            !etatConnu
              ? 'Bandeau Marchés BRVM : état inconnu, réglage indisponible'
              : afficheActif
                ? 'Désactiver le bandeau Marchés BRVM'
                : 'Activer le bandeau Marchés BRVM'
          }
          className={[
            'relative inline-flex h-7 w-12 items-center rounded-full transition shrink-0',
            afficheActif
              ? 'bg-[#00c805]'
              : etatConnu
                ? 'bg-black/12'
                : 'bg-black/8 border border-dashed border-black/20',
            basculeBloquee ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {/* Position centrale quand l'état est inconnu : ni allumé, ni éteint. */}
          <span
            className={[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition',
              !etatConnu
                ? 'translate-x-3.5'
                : afficheActif
                  ? 'translate-x-6'
                  : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {(erreurBascule || erreurLecture) && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-[13px]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="leading-relaxed">{erreurBascule ?? erreurLecture}</p>
            {/* Le bouton est toujours là : sans lui, le message d'échec d'une
                bascule restait affiché jusqu'au rechargement de la page, même
                une fois la connexion revenue. */}
            <button
              type="button"
              onClick={() => {
                setErreurBascule(null);
                setDoute(false);
                attenteVerification.current = false;
                void relire();
              }}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {erreurBascule ? "Revérifier l'état" : 'Réessayer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Time helpers ─────────────────────────────────────────────────────────

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'à l\'instant';
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
