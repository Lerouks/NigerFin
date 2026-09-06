import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';

/**
 * Ces tests gardent la regle qui manquait a quarante et un endroits de
 * l'administration : un appel qui rate doit le DIRE, en francais, et une
 * coupure reseau ne doit pas se confondre avec une panne du site.
 */

const fetchSimule = vi.fn();

function reponse(statut: number, corps?: unknown, type = 'application/json') {
  return {
    ok: statut >= 200 && statut < 300,
    status: statut,
    headers: { get: () => type },
    json: async () => corps,
  };
}

beforeEach(() => {
  fetchSimule.mockReset();
  vi.stubGlobal('fetch', fetchSimule);
  vi.stubGlobal('navigator', { onLine: true });
});

afterEach(() => { vi.unstubAllGlobals(); });

describe('appelAdmin', () => {
  it('rend les donnees quand tout va bien', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(200, [{ id: 1 }]));
    const r = await appelAdmin<{ id: number }[]>('/api/admin/articles');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.donnees).toEqual([{ id: 1 }]);
  });

  it('signale une session expiree en francais, pas un code', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(401, { error: 'Unauthorized' }));
    const r = await appelAdmin('/api/admin/articles');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('session');
      expect(r.message).not.toContain('Unauthorized');
      expect(r.statut).toBe(401);
    }
  });

  it('dit franchement qu\'une fonction est hors service quand une page HTML arrive a la place des donnees', async () => {
    // C'est exactement ce que renvoyait /api/admin/articles du 16 juin au
    // 6 septembre 2026 : une page d'erreur HTML, et l'ecran affichait « Aucun article ».
    fetchSimule.mockResolvedValue(reponse(500, null, 'text/html'));
    const r = await appelAdmin('/api/admin/articles');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('hors service');
  });

  it('rejoue une lecture qui echoue passagerement, puis reussit', async () => {
    fetchSimule
      .mockResolvedValueOnce(reponse(503, { error: 'indispo' }))
      .mockResolvedValueOnce(reponse(200, { ok: 1 }));
    const r = await appelAdmin('/api/admin/stats');
    expect(r.ok).toBe(true);
    expect(fetchSimule).toHaveBeenCalledTimes(2);
  });

  it('ne rejoue JAMAIS un envoi : une creation jouee deux fois serait un doublon', async () => {
    fetchSimule.mockResolvedValue(reponse(503, { error: 'indispo' }));
    const r = await envoiAdmin('/api/admin/articles', 'POST', { titre: 'x' });
    expect(r.ok).toBe(false);
    expect(fetchSimule).toHaveBeenCalledTimes(1);
  });

  it('distingue une coupure reseau d\'une panne du site', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const r = await appelAdmin('/api/admin/articles');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.horsLigne).toBe(true);
      expect(r.message).toContain('Internet');
      expect(r.message).toContain("Rien n'a été envoyé");
    }
  });

  it('garde le message du serveur quand il est deja ecrit en francais', async () => {
    fetchSimule.mockResolvedValueOnce(reponse(400, { error: 'Le titre est déjà utilisé.' }));
    const r = await appelAdmin('/api/admin/articles', { method: 'POST' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe('Le titre est déjà utilisé.');
  });

  it('ne leve jamais, meme quand le reseau casse', async () => {
    fetchSimule.mockRejectedValue(new Error('network down'));
    const r = await appelAdmin('/api/admin/articles');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('interrompue');
  });
});
