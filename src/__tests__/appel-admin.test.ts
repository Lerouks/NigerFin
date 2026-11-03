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

  // Une réponse positive dont le corps arrive coupé ne doit jamais passer pour
  // une réussite avec des données vides : l'écran qui les lit plantait.
  const corpsCoupe = () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => { throw new Error('corps coupé'); },
  });

  it('rejoue une lecture dont la réponse positive arrive incomplète, puis réussit', async () => {
    fetchSimule
      .mockResolvedValueOnce(corpsCoupe())
      .mockResolvedValueOnce(reponse(200, { summary: { ok: 1 } }));
    const r = await appelAdmin<{ summary: { ok: number } }>('/api/admin/stats');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.donnees.summary.ok).toBe(1);
    expect(fetchSimule).toHaveBeenCalledTimes(2);
  });

  it("ne rend jamais « réussi » avec des données vides quand la réponse reste incomplète", async () => {
    fetchSimule.mockResolvedValue(corpsCoupe());
    const r = await appelAdmin('/api/admin/stats');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('incomplète');
  });

  it("ne rejoue pas un envoi dont la réponse arrive incomplète, et dit de vérifier", async () => {
    fetchSimule.mockResolvedValue(corpsCoupe());
    const r = await appelAdmin('/api/admin/sync-market-data', { method: 'POST' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('si l\'opération a bien été faite');
    expect(fetchSimule).toHaveBeenCalledTimes(1);
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

  it('abandonne pour de bon quand l\'appelant abandonne, sans rejouer', async () => {
    // La recherche a la frappe remplace sa propre requete a chaque pause :
    // sans cet abandon, chaque frappe laissait une requete courir, rejeux
    // compris, jusqu'a une trentaine d'appels en vol.
    const controleur = new AbortController();
    fetchSimule.mockImplementation((_url: string, init: RequestInit) => {
      controleur.abort();
      return Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError', init }));
    });
    const r = await appelAdmin('/api/admin/users?search=ab', { signal: controleur.signal });
    expect(r.ok).toBe(false);
    expect(fetchSimule).toHaveBeenCalledTimes(1);
  });

  it('ne part meme pas quand l\'appelant a deja abandonne', async () => {
    const controleur = new AbortController();
    controleur.abort();
    const r = await appelAdmin('/api/admin/users?search=ab', { signal: controleur.signal });
    expect(r.ok).toBe(false);
    expect(fetchSimule).not.toHaveBeenCalled();
  });

  it('n\'affirme jamais qu\'une ecriture perdue n\'a rien enregistre', async () => {
    // Le serveur peut avoir enregistre avant que la reponse ne se perde. La
    // phrase d'avant, « tant que rien ne s'affiche, rien n'a ete enregistre »,
    // faisait recliquer et creait des doublons.
    fetchSimule.mockRejectedValue(new Error('connexion coupee'));
    const ecriture = await appelAdmin('/api/admin/newsletter', { method: 'POST', tentatives: 1 });
    expect(ecriture.ok).toBe(false);
    if (!ecriture.ok) {
      expect(ecriture.message).not.toContain("rien n'a été enregistré");
      expect(ecriture.message).toContain('peut-être arrivée');
      expect(ecriture.cause).toBe("La connexion s'est interrompue.");
    }

    // Une lecture n'ecrit rien : elle peut inviter a reessayer.
    const lecture = await appelAdmin('/api/admin/stats', { tentatives: 1 });
    expect(lecture.ok).toBe(false);
    if (!lecture.ok) expect(lecture.message).not.toContain('enregistré');
  });

  it('ne maquille pas un serveur trop lent en connexion perdue', async () => {
    // horsLigne choisit l'icone WifiOff et le titre « Connexion perdue » dans
    // EtatListe : l'afficher pour un delai depasse envoyait verifier le wifi
    // pendant qu'une route etait en panne.
    fetchSimule.mockRejectedValue(Object.assign(new Error('timeout'), { name: 'AbortError' }));
    const r = await appelAdmin('/api/admin/stats', { tentatives: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('trop de temps');
      expect(r.horsLigne).toBe(false);
    }
  });

  it('dit quand rien n\'est parti, et ne le dit que dans ce cas', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const horsLigne = await appelAdmin('/api/admin/newsletter', { method: 'POST', tentatives: 1 });
    expect(horsLigne.ok).toBe(false);
    if (!horsLigne.ok) expect(horsLigne.rienEnvoye).toBe(true);

    vi.stubGlobal('navigator', { onLine: true });
    fetchSimule.mockRejectedValue(new Error('connexion coupee'));
    const coupe = await appelAdmin('/api/admin/newsletter', { method: 'POST', tentatives: 1 });
    expect(coupe.ok).toBe(false);
    // Une coupure en cours de route ne prouve rien : le serveur a pu enregistrer.
    if (!coupe.ok) expect(coupe.rienEnvoye).toBeUndefined();
  });
});
