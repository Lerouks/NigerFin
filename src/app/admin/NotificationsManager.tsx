'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2, Send } from 'lucide-react';

/**
 * NotificationsManager. UI Cockpit pour gérer les notifications Web Push.
 *
 * États gérés :
 *   - unsupported : le navigateur n'a ni Notification ni PushManager
 *     (typiquement Safari iOS sans PWA installée sur l'écran d'accueil)
 *   - unconfigured : VAPID pas configuré côté serveur (clé publique 503)
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
  | 'denied'
  | 'ready'
  | 'subscribed';

interface Feedback {
  tone: 'success' | 'error' | 'info';
  message: string;
}

export function NotificationsManager() {
  const [status, setStatus] = useState<Status>('loading');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<'subscribe' | 'unsubscribe' | 'test' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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

    try {
      const res = await fetch('/api/admin/push/vapid-public-key', {
        credentials: 'same-origin',
      });
      if (res.status === 503) {
        setStatus('unconfigured');
        return;
      }
      if (!res.ok) {
        setStatus('unconfigured');
        return;
      }
      const data = (await res.json()) as { publicKey?: string };
      if (!data.publicKey) {
        setStatus('unconfigured');
        return;
      }
      setPublicKey(data.publicKey);

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? 'subscribed' : 'ready');
    } catch {
      setStatus('unconfigured');
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
          message: 'Tu as refusé les notifications. Pour les activer, autorise-les dans les réglages du navigateur.',
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
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

      const res = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      if (!res.ok) {
        throw new Error(`Le serveur a renvoyé ${res.status}.`);
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
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await fetch('/api/admin/push/unsubscribe', {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
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
  }, []);

  const sendTest = useCallback(async () => {
    setBusy('test');
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/push/test', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => ({}))) as {
        sent?: number;
        failed?: number;
        removed?: number;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Le serveur a renvoyé ${res.status}.`);
      }
      if ((data.sent ?? 0) === 0) {
        setFeedback({
          tone: 'error',
          message: 'Aucune notification envoyée. Réessaie après avoir activé les notifs.',
        });
      } else {
        setFeedback({
          tone: 'success',
          message: `Test envoyé à ${data.sent} device${(data.sent ?? 0) > 1 ? 's' : ''}.`,
        });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'erreur inconnue';
      setFeedback({
        tone: 'error',
        message: `Échec du test : ${detail}`,
      });
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
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
          onTest={sendTest}
        />
        {feedback && <FeedbackBlock feedback={feedback} />}
      </div>
    </section>
  );
}

function NotificationsBody({
  status,
  busy,
  onSubscribe,
  onUnsubscribe,
  onTest,
}: {
  status: Status;
  busy: 'subscribe' | 'unsubscribe' | 'test' | null;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onTest: () => void;
}) {
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-foreground/55 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Vérification de la configuration...
      </div>
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
        description="Le service Web Push n'est pas encore branché côté serveur. Reviens plus tard, ce module sera actif dès que les clés VAPID seront en place."
      />
    );
  }

  if (status === 'denied') {
    return (
      <Empty
        icon={<BellOff className="w-5 h-5 text-red-500/80" aria-hidden="true" />}
        title="Notifications bloquées"
        description="Tu as déjà refusé les notifications pour ce site. Ouvre les réglages du navigateur (ou de l'app PWA installée), autorise les notifications pour NFI Cockpit, puis recharge cette page."
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
            Tu seras notifié quand un nouveau paiement Premium arrive, quand le site
            rencontre un problème, ou quand un commentaire attend ta modération.
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
