import { createServiceClient } from '@/lib/supabase';

export async function logAuditEvent(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const client = createServiceClient();
  if (!client) return;

  await client.from('audit_log').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });
}
