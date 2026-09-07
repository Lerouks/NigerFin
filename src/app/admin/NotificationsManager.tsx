'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bell, BellOff, BellRing, Loader2, RefreshCw, Send, WifiOff } from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';

/**
 * NotificationsManager. UI Cockpit pour gérer les notifications Web Push.
 *
 * États gérés :
 *   - unsupported : le navigateur n'a ni Notification ni PushManager
 *     (typiquement Safari iOS sans PWA installée sur l'écran d'accueil)
 *   - unconfigured : VAPID pas configuré côté serveur (clé publique 503)
 *   - erreur : l'appel n'a pas abouti (serveur en panne, session expirée,
 *     connexion coupée). Cet état était auparavant confondu avec
 *     « unconfigured » : la carte annonçait « Configuration en cours »
 *     alors que le serveur était simplement injoignable. Un écran qui ment
 *     est pire qu'un écran en panne, donc on affiche la vraie raison et un
 *     bouton pour réessayer.
 *   - denied : l'utilisateur a refusé les notifs au niveau OS / navigateur
 *   - ready : tout est OK, l'admin peut s'abonner
 *   - subscribed : l'admin reçoit déjà les pushs sur ce device
 *
 * Charte : card rounded-2xl, gradient or-cuivre sur les boutons primary,
 * mobile-first (390px), tous textes en français accents propres.
 */

type Status =
  | 'loading'
  | 'unsupported'
  | 'unconfigured'
  | 'erreur'
  | 'denied'
  | 'ready'
  | 'subscribed';

interface Feedback {
  tone: 'success' | 'error' | 'info';
  message: string;
}

/**
 * navigator.serviceWorker.ready ne se résout JAMAIS tant qu'aucun service
 * worker ne s'installe. Sans ce garde-fou, la carte restait bloquée sur
 * « Vérification de la configuration... » indéfiniment, sans rien dire.
 *
 * Le délai est large exprès : AdminShell n'enregistre le worker qu'à
 * l'évènement window.load, et son installation met quatre fichiers en cache
 * avant de rendre la main. Trop court, ce garde-fou afficherait une panne
 * pendant une installation parfaitement normale, ce qui est précisément le
 * mensonge qu'il est censé supprimer.
 */
const DELAI_SERVICE_WORKER_MS = 30000;

function serviceWorkerPret(): Promise<ServiceWorkerRegistration | null> {
  return Promise.race([
    navigator.serviceWorker.ready.catch(() => null),
    new Promise<null>((resoudre) => {
      setTimeout(() => resoudre(null), DELAI_SERVICE_WORKER_MS);
    }),
  ]);
}

const MESSAGE_SERVICE_WORKER =
  "Le service de notifications n'a pas démarré dans ce navigateur. Rechargez la page, puis réessayez.";

export function NotificationsManager() {
  const [status, setStatus] = useState<Status>('loading');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<'subscribe' | 'unsubscribe' | 'test' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  // Compte les refus du serveur sur la désactivation : au second, on laisse
  // couper localement, sinon l'admin n'a plus aucun moyen d'arrêter les pushs
  // sur ce navigateur tant que la route reste en panne.
  const [echecsDesabonnement, setEchecsDesabonnement] = useState(0);
  const [horsLigne, setHorsLigne] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    setStatus('loading');
    setErreurChargement(null);
    setHorsLigne(false);

    const resultat = await appelAdmin<{ publicKey?: string }>(
      '/api/admin/push/vapid-public-key',
      // Une seule tentative : cette route répond 503 en permanence tant que
      // les clés VAPID ne sont pas posées sur le serveur. Rejouer trois fois
      // ferait patienter une seconde et demie devant un état qui, lui, ne
      // changera pas. En cas de vraie panne, le bouton Réessayer est là.
      { credentials: 'same-origin', tentatives: 1 },
    );

    if (!resultat.ok) {
      // Seul un 503 signifie vraiment « pas encore configuré ». Tout le reste
      // est une panne, et une panne doit se voir.
      if (resultat.statut === 503) {
        setStatus('unconfigured');
        return;
      }
      setErreurChargement(resultat.message);
      setHorsLigne(resultat.horsLigne);
      setStatus('erreur');
      return;
    }

    const cle = resultat.donnees?.publicKey;
    if (!cle) {
      setErreurChargement(
        "Le serveur n'a pas renvoyé la clé de notification. Réessayez dans un instant.",
      );
      setHorsLigne(false);
      setStatus('erreur');
      return;
    }
    setPublicKey(cle);

    const registration = await serviceWorkerPret();
    if (!registration) {
      setErreurChargement(MESSAGE_SERVICE_WORKER);
      setHorsLigne(false);
      setStatus('erreur');
      return;
    }

    try {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? 'subscribed' : 'ready');
    } catch {
      setErreurChargement(
        "Ce navigateur n'a pas pu dire si les notifications sont déjà actives sur ce device. Rechargez la page, puis réessayez.",
      );
      setHorsLigne(false);
      setStatus('erreur');
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    if (!publicKey) return;
    setBusy('subscribe');
    setFeedback(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'ready');
        setFeedback({
          tone: 'error',
          message: 'Vous avez refusé les notifications. Pour les activer, autorisez-les dans les réglages du navigateur.',
        });
        return;
      }

      const registration = await serviceWorkerPret();
      if (!registration) {
        setFeedback({ tone: 'error', message: MESSAGE_SERVICE_WORKER });
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Subscription incomplète renvoyée par le navigateur.');
      }

      const resultat = await envoiAdmin('/api/admin/push/subscribe', 'POST', {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      if (!resultat.ok) {
        // Une réponse perdue en route ne prouve rien : l'upsert a pu aboutir.
        // Détruire l'abonnement du navigateur laisserait alors en base une
        // ligne morte pointant vers un endpoint qui n'existe plus.
        const incertain = resultat.statut === 0 && !resultat.rienEnvoye;
        if (incertain) {
          setFeedback({
            tone: 'error',
            message: `${resultat.cause ?? resultat.message} L'abonnement a peut-être été enregistré : rechargez la page pour voir l'état réel avant de recommencer.`,
          });
          return;
        }
        // Là, le serveur n'a rien enregistré : on annule aussi l'abonnement
        // pris par le navigateur, sinon la carte afficherait « Notifications
        // actives » au prochain chargement alors que rien n'arriverait.
        await subscription.unsubscribe().catch(() => undefined);
        setStatus('ready');
        setFeedback({
          tone: 'error',
          message: `L'activation a échoué. ${resultat.message}`,
        });
        return;
      }

      setStatus('subscribed');
      setFeedback({
        tone: 'success',
        message: 'Notifications activées sur ce device.',
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'erreur inconnue';
      setFeedback({
        tone: 'error',
        message: `Échec de l'activation : ${detail}`,
      });
    } finally {
      setBusy(null);
    }
  }, [publicKey]);

  const unsubscribe = useCallback(async () => {
    setBusy('unsubscribe');
    setFeedback(null);
    try {
      const registration = await serviceWorkerPret();
      if (!registration) {
        setFeedback({ tone: 'error', message: MESSAGE_SERVICE_WORKER });
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const resultat = await envoiAdmin('/api/admin/push/unsubscribe', 'DELETE', {
          endpoint: existing.endpoint,
        });
        if (!resultat.ok) {
          // Auparavant la réponse du serveur était ignorée : la carte annonçait
          // « Notifications désactivées » pendant que le serveur continuait
          // d'envoyer les pushs sur ce device.
          if (echecsDesabonnement === 0) {
            setEchecsDesabonnement(1);
            setFeedback({
              tone: 'error',
              message: `La désactivation a échoué, ce device reste abonné côté serveur. ${resultat.message} Réessayez : au second refus, les notifications seront coupées sur ce navigateur.`,
            });
            return;
          }
          // Porte de sortie : le navigateur ne recevra plus rien, mais on ne
          // prétend pas que le serveur est au courant.
          await existing.unsubscribe();
          setEchecsDesabonnement(0);
          setStatus('ready');
          setFeedback({
            tone: 'info',
            message: `Notifications coupées sur ce navigateur. Le serveur, lui, n'a pas pu être prévenu : son enregistrement devra être nettoyé. ${resultat.message}`,
          });
          return;
        }
        setEchecsDesabonnement(0);
        await existing.unsubscribe();
      }

      setStatus('ready');
      setFeedback({
        tone: 'info',
        message: 'Notifications désactivées sur ce device.',
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'erreur inconnue';
      setFeedback({
        tone: 'error',
        message: `Échec de la désactivation : ${detail}`,
      });
    } finally {
      setBusy(null);
    }
  }, [echecsDesabonnement]);

  const sendTest = useCallback(async () => {
    setBusy('test');
    setFeedback(null);

    // Le finally n'est pas décoratif : sans lui, le moindre imprévu laissait
    // le bouton Tester désactivé pour de bon, sans un mot à l'écran.
    try {
      const resultat = await envoiAdmin<{
        sent?: number;
        failed?: number;
        removed?: number;
      }>('/api/admin/push/test', 'POST');

      if (!resultat.ok) {
        setFeedback({
          tone: 'error',
          message: `Échec du test : ${resultat.message}`,
        });
        return;
      }

      const envoyes = resultat.donnees?.sent ?? 0;
      const echecs = resultat.donnees?.failed ?? 0;

      // L'ordre compte. Avec un seul device abonné, cas normal ici, un refus du
      // service push donne sent: 0 et failed: 1 : tester « envoyés === 0 »
      // d'abord affichait « activez les notifications » juste sous le titre
      // « Notifications actives », et cachait la vraie cause.
      if (envoyes === 0 && echecs === 0) {
        setFeedback({
          tone: 'error',
          message: 'Aucun device abonné. Activez les notifications sur ce navigateur, puis réessayez.',
        });
      } else if (envoyes === 0) {
        const detail = echecs > 1
          ? `les ${echecs} devices abonnés`
          : 'le device abonné';
        setFeedback({
          tone: 'error',
          message: `Le service de notifications a refusé la remise pour ${detail}. Les notifications sont bien enregistrées, mais rien n'est arrivé : réessayez dans un instant.`,
        });
      } else if (echecs > 0) {
        const detailEchecs = echecs > 1
          ? `${echecs} devices n'ont pas reçu la notification.`
          : "1 device n'a pas reçu la notification.";
        setFeedback({
          tone: 'error',
          message: `Test envoyé à ${envoyes} device${envoyes > 1 ? 's' : ''}, mais ${detailEchecs}`,
        });
      } else {
        setFeedback({
          tone: 'success',
          message: `Test envoyé à ${envoyes} device${envoyes > 1 ? 's' : ''}.`,
        });
      }
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <section className="mb-6">
      <h2 className="font-bold text-[16px] mb-3">Notifications push</h2>
      <div className="bg-white border border-black/6 rounded-2xl p-5">
        <NotificationsBody
          status={status}
          busy={busy}
          erreurChargement={erreurChargement}
          horsLigne={horsLigne}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
          onTest={sendTest}
          onReessayer={refreshStatus}
        />
        {feedback && <FeedbackBlock feedback={feedback} />}
      </div>
    </section>
  );
}

function NotificationsBody({
  status,
  busy,
  erreurChargement,
  horsLigne,
  onSubscribe,
  onUnsubscribe,
  onTest,
  onReessayer,
}: {
  status: Status;
  busy: 'subscribe' | 'unsubscribe' | 'test' | null;
  erreurChargement: string | null;
  horsLigne: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onTest: () => void;
  onReessayer: () => void;
}) {
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-foreground/55 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Vérification de la configuration...
      </div>
    );
  }

  if (status === 'erreur') {
    return (
      <EchecChargement
        message={erreurChargement ?? "L'état des notifications n'a pas pu être chargé."}
        horsLigne={horsLigne}
        onReessayer={onReessayer}
      />
    );
  }

  if (status === 'unsupported') {
    return (
      <Empty
        icon={<BellOff className="w-5 h-5 text-foreground/50" aria-hidden="true" />}
        title="Notifications indisponibles sur ce navigateur"
        description="Pour activer les notifications sur iPhone, ajoute le Cockpit à l'écran d'accueil via Safari : icône Partager puis Sur l'écran d'accueil. Rouvre ensuite l'app installée."
      />
    );
  }

  if (status === 'unconfigured') {
    return (
      <Empty
        icon={<BellOff className="w-5 h-5 text-foreground/50" aria-hidden="true" />}
        title="Configuration en cours"
        description="Le service Web Push n'est pas encore branché côté serveur. Revenez plus tard, ce module sera actif dès que les clés VAPID seront en place."
      />
    );
  }

  if (status === 'denied') {
    return (
      <Empty
        icon={<BellOff className="w-5 h-5 text-red-500/80" aria-hidden="true" />}
        title="Notifications bloquées"
        description="Vous avez déjà refusé les notifications pour ce site. Ouvrez les réglages du navigateur (ou de l'app PWA installée), autorisez les notifications pour NFI Cockpit, puis rechargez cette page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center shrink-0 shadow-xs">
          <BellRing className="w-[18px] h-[18px] text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-foreground leading-tight">
            {status === 'subscribed' ? 'Notifications actives' : 'Activer les notifications'}
          </p>
          <p className="text-[12px] text-foreground/55 mt-1 leading-relaxed">
            Vous serez notifié quand un nouveau paiement Premium arrive, quand le site
            rencontre un problème, ou quand un commentaire attend votre modération.
          </p>
        </div>
      </div>

      {status === 'ready' && (
        <button
          type="button"
          onClick={onSubscribe}
          disabled={busy === 'subscribe'}
          className="w-full rounded-xl px-4 py-3 text-[13px] font-semibold text-white bg-linear-to-br from-[#d4a843] to-[#ff8c42] shadow-xs hover:opacity-95 active:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {busy === 'subscribe' ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bell className="w-4 h-4" aria-hidden="true" />
          )}
          Activer sur ce device
        </button>
      )}

      {status === 'subscribed' && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onTest}
            disabled={busy === 'test'}
            className="rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white bg-linear-to-br from-[#d4a843] to-[#ff8c42] shadow-xs hover:opacity-95 active:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {busy === 'test' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            Tester
          </button>
          <button
            type="button"
            onClick={onUnsubscribe}
            disabled={busy === 'unsubscribe'}
            className="rounded-xl px-3 py-2.5 text-[13px] font-semibold text-foreground bg-black/5 hover:bg-black/8 active:bg-black/10 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {busy === 'unsubscribe' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <BellOff className="w-4 h-4" aria-hidden="true" />
            )}
            Désactiver
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * L'appel n'a pas abouti. On distingue la coupure de connexion (fréquente au
 * Niger) d'une panne du serveur, et on propose de réessayer sans recharger.
 */
function EchecChargement({
  message,
  horsLigne,
  onReessayer,
}: {
  message: string;
  horsLigne: boolean;
  onReessayer: () => void;
}) {
  return (
    <div className="flex flex-col gap-4" role="alert">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${horsLigne ? 'bg-black/4' : 'bg-red-50'}`}>
          {horsLigne ? (
            <WifiOff className="w-5 h-5 text-foreground/50" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500/80" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-foreground leading-tight">
            {horsLigne ? 'Connexion perdue' : "L'état des notifications n'a pas pu être chargé"}
          </p>
          <p className="text-[12px] text-foreground/55 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReessayer}
        className="w-full rounded-xl px-4 py-3 text-[13px] font-semibold text-foreground bg-black/5 hover:bg-black/8 active:bg-black/10 transition inline-flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}

function Empty({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-black/4 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-foreground leading-tight">{title}</p>
        <p className="text-[12px] text-foreground/55 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeedbackBlock({ feedback }: { feedback: Feedback }) {
  const palette =
    feedback.tone === 'success'
      ? 'bg-[#00c805]/10 text-[#007a04] border-[#00c805]/20'
      : feedback.tone === 'error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-black/4 text-foreground/70 border-black/6';
  return (
    <div
      className={`mt-4 rounded-xl border px-3 py-2.5 text-[12px] font-medium ${palette}`}
      role="status"
      aria-live="polite"
    >
      {feedback.message}
    </div>
  );
}

/**
 * Convertit une clé VAPID base64url en Uint8Array, format attendu par
 * PushManager.subscribe(). Standard W3C : remplacer '-' par '+', '_' par '/'
 * et ajouter le padding '=' pour atteindre une longueur multiple de 4.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
