import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * logAuditEvent : qui signe une ligne du journal. Une action du système
 * s'écrit sans auteur et marquée (migration 00034) ; avant le 24/11/2026 elle
 * portait une sentinelle que la base refusait, sans que personne le voie.
 */

const insert = vi.fn();
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => ({ from: vi.fn(() => ({ insert })) })) }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

import * as Sentry from '@sentry/nextjs';
import { logAuditEvent, SYSTEM_AUDIT_ID } from '@/lib/audit';

const ADMIN = '11111111-1111-4111-8111-111111111111';

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
  });

  it('une action du système : aucun auteur, marquée « système »', async () => {
    await logAuditEvent('system', 'ipaymoney_payment_verified', 'payment', 'pr-1', { amount: 5000 });
    expect(insert).toHaveBeenCalledWith({
      admin_id: null,
      par_le_systeme: true,
      action: 'ipaymoney_payment_verified',
      entity_type: 'payment',
      entity_id: 'pr-1',
      details: { amount: 5000 },
    });
  });

  it('l’ancienne sentinelle est lue comme le système', async () => {
    await logAuditEvent(SYSTEM_AUDIT_ID, 'subscription_expired', 'user');
    expect(insert.mock.calls[0]?.[0]).toMatchObject({ admin_id: null, par_le_systeme: true });
  });

  it('une action d’admin garde son auteur, sans la marque du système', async () => {
    await logAuditEvent(ADMIN, 'verify_payment', 'payment', 'pr-2');
    const ligne = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(ligne).toMatchObject({ admin_id: ADMIN, action: 'verify_payment', entity_id: 'pr-2', details: {} });
    expect(ligne).not.toHaveProperty('par_le_systeme');
  });

  it('une ligne refusée par la base se signale au lieu de disparaître, sans bloquer l’action', async () => {
    insert.mockResolvedValue({ error: { code: '23503', message: 'violates foreign key constraint' } });
    await expect(logAuditEvent('system', 'subscription_expired', 'user')).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
