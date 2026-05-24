import { createServiceClient } from '@/lib/supabase';

// Sec M-6 : actions automatiques (cron, webhooks) ne sont pas executees par
// un admin humain. On utilise un UUID sentinelle reconnaissable pour ne pas
// fausser les pistes d'audit (= "qui a fait quoi"). Sans ce sentinel, le
// cron/expire-subscriptions inserait admin_id=user.id (le user qui expire),
// ce qui mentait sur l'auteur de l'action.
export const SYSTEM_AUDIT_ID = '00000000-0000-0000-0000-000000000000';

export async function logAuditEvent(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const client = createServiceClient();
  if (!client) return;

  // Coerce 'system' string => sentinel UUID (compat. ancien code).
  const id = adminId === 'system' ? SYSTEM_AUDIT_ID : adminId;

  await client.from('audit_log').insert({
    admin_id: id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });
}
