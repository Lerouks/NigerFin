import * as Sentry from '@sentry/nextjs';
import { createServiceClient } from '@/lib/supabase';

// Sec M-6 : les actions automatiques (tâche de nuit, retour d'iPayMoney) ne
// sont pas faites par un admin humain, et ne doivent pas être attribuées au
// lecteur concerné. Elles s'écrivent sans auteur, avec par_le_systeme = true
// (migration 00034) ; l'écran du journal affiche « Système ».
//
// Avant le 24/11/2026, elles portaient l'auteur sentinelle ci-dessous, absent
// de auth.users et de user_profiles : la base refusait chaque ligne, sans que
// personne le voie. La constante reste pour reconnaître d'anciennes données.
export const SYSTEM_AUDIT_ID = '00000000-0000-0000-0000-000000000000';

/** Les colonnes d'une ligne écrite par le système. */
export const AUTEUR_SYSTEME = { admin_id: null, par_le_systeme: true } as const;

export async function logAuditEvent(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const client = createServiceClient();
  if (!client) return;

  // 'system' (et l'ancienne sentinelle) désignent une action automatique.
  const auteur =
    adminId === 'system' || adminId === SYSTEM_AUDIT_ID ? AUTEUR_SYSTEME : { admin_id: adminId };

  const resultat = await client.from('audit_log').insert({
    ...auteur,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });

  // Un journal en panne ne bloque jamais l'action, déjà faite : il se signale.
  if (resultat?.error) {
    Sentry.captureException(new Error(`journal: ligne « ${action} » refusée par la base`), {
      tags: { context: 'audit-log-insert' },
      extra: { action, entityType, code: resultat.error.code },
    });
  }
}
