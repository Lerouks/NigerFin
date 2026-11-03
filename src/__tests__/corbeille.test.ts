import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null), createServerSupabaseClient: vi.fn(async () => null) }));

import type { SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { revalidatePath, revalidateTag } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { ARTICLE_CACHE_TAG } from '@/lib/articles';
import {
  listerLaCorbeille,
  mettreALaCorbeille,
  purgerLaCorbeille,
  restaurerDepuisCorbeille,
  retirerLecteurDeLaCorbeille,
  supprimerDefinitivement,
  type TableCorbeille,
} from '@/lib/corbeille';
import { DUREE_CONSERVATION_JOURS, finDeConservation, resumerDependants } from '@/lib/corbeille/libelles';
import {
  echecMiseALaCorbeille,
  echecRestauration,
  lireErreur,
  remarqueEnFrancais,
  remarquesEnFrancais,
} from '@/lib/corbeille/messages';
import { enPhrases, nombreFr, sansMotSeul, typographieFr } from '@/lib/typographie-fr';

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ADMIN = uuid(1);
const NB = '\u00a0';
const FINE = '\u202f';

/** Le texte lu à l'écran, insécables ramenées à des espaces et traits d'union ordinaires : pour chercher une phrase dedans. */
const lisible = (texte: string | null | undefined): string =>
  (texte ?? '').replace(/[\u00a0\u202f]/g, ' ').replace(/\u2011/g, '-');

/** Une requête PostgREST figée : chaque méthode rend la chaîne, l'attente rend le résultat. */
function requeteFigee(resultat: unknown) {
  const chaine: Record<string, unknown> = {};
  for (const methode of ['select', 'order', 'limit', 'delete', 'eq']) chaine[methode] = vi.fn(() => chaine);
  chaine.then = (ok: (valeur: unknown) => unknown, ko?: (erreur: unknown) => unknown) => Promise.resolve(resultat).then(ok, ko);
  return chaine;
}

function client(options: { rpc?: { data?: unknown; error?: unknown }; from?: unknown } = {}) {
  const rpc = vi.fn(async () => ({ data: options.rpc?.data ?? null, error: options.rpc?.error ?? null }));
  const requete = requeteFigee(options.from ?? { data: [], error: null, count: 0 });
  const from = vi.fn(() => requete);
  return { service: { rpc, from } as unknown as SupabaseClient, rpc, from, requete };
}

const refus = (code: string, detail?: Record<string, unknown>) => ({
  code: 'P0001',
  message: `corbeille:${code}`,
  details: detail ? JSON.stringify(detail) : null,
  hint: null,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('lireErreur', () => {
  it('lit le code, le refus de la corbeille et son détail JSON', () => {
    expect(lireErreur(refus('slug_pris', { slug: 'x', autre: 'Y' }))).toEqual({
      code: 'P0001',
      refus: 'slug_pris',
      detail: { slug: 'x', autre: 'Y' },
      detailBrut: '{"slug":"x","autre":"Y"}',
    });
  });

  it('ne suppose rien de la forme : code vide, détail illisible, valeur quelconque', () => {
    expect(lireErreur({ code: '', message: 'TypeError: fetch failed' })).toMatchObject({ code: null, refus: null, detail: {} });
    expect(lireErreur({ code: '23505', message: 'duplicate', details: '{pas du json' })).toMatchObject({ code: '23505', detail: {} });
    expect(lireErreur('n’importe quoi')).toEqual({ code: null, refus: null, detail: {}, detailBrut: null });
    expect(lireErreur(null)).toMatchObject({ code: null });
  });
});

describe('messages de la mise à la corbeille', () => {
  const cas: [string, ReturnType<typeof lireErreur>, number, RegExp, boolean][] = [
    ['réponse perdue', lireErreur({ code: '', message: 'fetch failed' }), 503, /a peut-être eu lieu/, false],
    ['corbeille absente (PostgREST)', lireErreur({ code: 'PGRST202', message: 'Could not find the function' }), 503, /migration 00032/, false],
    ['corbeille absente (PostgreSQL)', lireErreur({ code: '42883', message: 'function does not exist' }), 503, /Rien n’a été supprimé/, false],
    ['verrou', lireErreur({ code: '55P03', message: 'lock' }), 409, /Réessayez dans un instant/, false],
    ['introuvable', lireErreur(refus('introuvable')), 404, /introuvable/, false],
    ['déjà dans la corbeille', lireErreur(refus('deja_dans_la_corbeille')), 409, /déjà dans la corbeille/, false],
    ['copie existante', lireErreur(refus('copie_existante', { supprime_le: '2026-11-03T10:00:00Z' })), 409, /depuis le 3 novembre 2026/, false],
    ['numéro envoyé', lireErreur(refus('numero_envoye')), 400, /déjà envoyé/, false],
    ['envoi en cours', lireErreur(refus('envoi_en_cours')), 409, /en cours d’envoi/, false],
    ['cascade inconnue', lireErreur(refus('cascade_inconnue')), 500, /ne sait pas encore garder/, true],
    ['clé étrangère', lireErreur({ code: '23503', message: 'fk' }), 409, /s’y rattachent encore/, false],
    ['inconnu', lireErreur({ code: 'XX000', message: 'boum' }), 500, /La suppression a échoué/, true],
  ];

  it.each(cas)('%s', (_nom, lue, statut, motif, inattendu) => {
    const echec = echecMiseALaCorbeille(lue);
    expect(echec.statut).toBe(statut);
    expect(lisible(echec.motif)).toMatch(motif);
    expect(echec.inattendu).toBe(inattendu);
    // Les insécables françaises sont posées.
    expect(echec.motif).toBe(typographieFr(echec.motif));
  });

  it('n’affirme jamais « rien n’a été supprimé » quand la réponse s’est perdue', () => {
    expect(lisible(echecMiseALaCorbeille(lireErreur({ message: 'fetch failed' })).motif)).not.toMatch(/Rien n’a été supprimé/);
  });
});

describe('messages de la restauration', () => {
  it('nomment le contenu et ce qui bloque, sans jamais conseiller une suppression définitive', () => {
    const cas = [
      echecRestauration(lireErreur(refus('id_pris', { titre: 'Le franc CFA', table: 'articles' }))),
      echecRestauration(lireErreur(refus('slug_pris', { titre: 'Bourse', table: 'education_categories', slug: 'bourse', autre: 'Bourse 2' }))),
      echecRestauration(lireErreur(refus('categorie_absente', { titre: 'Le PER', categorie_en_corbeille: true, categorie: 'Bourse' }))),
      echecRestauration(lireErreur(refus('categorie_absente', { titre: 'Le PER', categorie_en_corbeille: false }))),
      echecRestauration(lireErreur(refus('numero_pris', { titre: 'N° 9', numero: 9, autre: 'Nouveau' }))),
      echecRestauration(lireErreur(refus('entree_introuvable'))),
    ];
    expect(cas.map((e) => e.statut)).toEqual([409, 409, 409, 409, 409, 404]);
    expect(cas[0]?.motif).toContain(`«${FINE}Le${NB}franc CFA${FINE}»`);
    expect(cas[1]?.motif).toContain(`«${FINE}/education/bourse${FINE}»`);
    expect(lisible(cas[2]?.motif)).toMatch(/sa catégorie « Bourse » est dans la corbeille\. Remettez d’abord la catégorie en place, puis cette leçon\./);
    expect(lisible(cas[3]?.motif)).toMatch(/n’est plus dans la corbeille/);
    expect(lisible(cas[4]?.motif)).toMatch(/ne peut pas changer de numéro/);
    for (const echec of cas) {
      expect(echec.motif).toBe(typographieFr(echec.motif));
      expect(lisible(echec.motif)).not.toMatch(/supprimer définitivement|suppression définitive/i);
    }
  });

  it('une restauration qui perdrait une colonne ou une ligne est refusée, nomme la table, et part vers Sentry', () => {
    const une = echecRestauration(
      lireErreur(refus('colonnes_inconnues', { titre: 'Le franc CFA', table: 'articles', table_touchee: 'articles', colonnes: ['body'] })),
    );
    expect(une).toMatchObject({ statut: 409, inattendu: true });
    expect(lisible(une.motif)).toBe(
      'Impossible de remettre « Le franc CFA » en place : depuis sa suppression, la table des articles a perdu la colonne « body », que sa copie remplit encore. Rien n’a été remis en place. L’élément reste dans la corbeille, intact : la table doit d’abord être corrigée.',
    );
    const deux = echecRestauration(
      lireErreur(refus('colonnes_inconnues', { titre: 'Bourse', table_touchee: 'user_lesson_progress', colonnes: ['note', 'score'] })),
    );
    expect(lisible(deux.motif)).toMatch(/la table des progressions de lecteurs a perdu les colonnes « note » et « score »/);
    const ecartees = echecRestauration(
      lireErreur(refus('remise_incomplete', { titre: 'Bourse', table_touchee: 'user_lesson_progress', attendues: 3, remises: 1 })),
    );
    expect(ecartees).toMatchObject({ statut: 409, inattendu: true });
    expect(lisible(ecartees.motif)).toMatch(/la table des progressions de lecteurs a écarté sans erreur 2 lignes sur 3\. Rien n’a été remis en place\./);
    for (const echec of [une, deux, ecartees]) {
      expect(echec.motif).toBe(typographieFr(echec.motif));
      expect(lisible(echec.motif)).toMatch(/reste dans la corbeille, intact/);
    }
  });

  it('une réponse perdue invite à vérifier, une erreur inconnue part vers Sentry', () => {
    expect(echecRestauration(lireErreur({ message: 'fetch failed' }))).toMatchObject({ statut: 503, inattendu: false });
    expect(lisible(echecRestauration(lireErreur({ message: 'fetch failed' })).motif)).toMatch(/a peut-être eu lieu/);
    expect(echecRestauration(lireErreur({ code: '23505', message: 'x' })).statut).toBe(409);
    expect(echecRestauration(lireErreur({ code: 'XX000', message: 'x' })).inattendu).toBe(true);
  });
});

describe('remarques de la restauration', () => {
  it('chaque code connu devient une phrase, accordée au nombre', () => {
    const phrase = (remarque: Record<string, unknown>, table: TableCorbeille = 'education_lessons') =>
      lisible(remarqueEnFrancais(remarque, 'Le PER', table));
    expect(phrase({ code: 'progressions_ecartees', nombre: 1 })).toMatch(/^1 progression de lecteur ne revient pas : le lecteur concerné a supprimé son compte/);
    expect(phrase({ code: 'progressions_ecartees', nombre: 3 })).toMatch(/^3 progressions de lecteurs ne reviennent pas : les lecteurs concernés ont supprimé leur compte/);
    expect(phrase({ code: 'etapes_ecartees', nombre: 2 })).toMatch(/^2 étapes de parcours ne reviennent pas/);
    expect(phrase({ code: 'abonnes_vides', nombre: 1 })).toMatch(/revient sans son abonné/);
    expect(phrase({ code: 'a_la_une_retiree', autre: 'Autre' }, 'articles')).toMatch(/revient sans être à la une/);
    expect(phrase({ code: 'a_la_une_retiree', autre: 'Autre' }, 'strategic_enterprises')).toMatch(/l’entreprise à la une/);
    expect(phrase({ code: 'programme_en_brouillon' }, 'newsletter_issues')).toMatch(/revient en brouillon : il était programmé/);
    expect(phrase({ code: 'envoi_interrompu_en_brouillon' }, 'newsletter_issues')).toMatch(/l’a peut-être déjà reçu/);
    expect(phrase({ code: 'numero_change', ancien: 9, nouveau: 12, autre: 'Y' }, 'newsletter_issues')).toMatch(/revient sous le numéro 12 : le numéro 9/);
  });

  it('un code inconnu n’est jamais affiché tel quel', () => {
    expect(remarquesEnFrancais([{ code: 'nouveau_code' }, 'texte', null, { code: 'programme_en_brouillon' }], 'X', 'newsletter_issues')).toHaveLength(1);
    expect(remarquesEnFrancais('pas un tableau', 'X', 'articles')).toEqual([]);
  });
});

describe('libellés', () => {
  it('résume ce qui accompagne un contenu, dans un ordre fixe, à la française', () => {
    expect(resumerDependants({ user_lesson_progress: 1450, education_lessons: 3, learning_path_steps: 1 })).toBe(
      `3${NB}leçons, 1${NB}étape de parcours et 1${FINE}450${NB}progressions de lecteurs`,
    );
    expect(resumerDependants({})).toBeNull();
    expect(resumerDependants(null)).toBeNull();
    expect(resumerDependants({ inconnue: 2 })).toBe(`2${NB}lignes liées`);
  });

  it('une entrée part pour de bon trente jours après sa mise à la corbeille', () => {
    expect(DUREE_CONSERVATION_JOURS).toBe(30);
    expect(finDeConservation('2026-11-03T10:00:00.000Z')?.toISOString()).toBe('2026-12-03T10:00:00.000Z');
    expect(finDeConservation('pas une date')).toBeNull();
  });
});

describe('mettreALaCorbeille', () => {
  it('appelle corbeille_mettre avec la clé de service, puis rafraîchit et journalise', async () => {
    const { service, rpc } = client({
      rpc: { data: { id_corbeille: uuid(900), titre: 'Le franc CFA', slug: 'franc-cfa', resume: {} } },
    });

    const resultat = await mettreALaCorbeille(service, 'articles', uuid(100), ADMIN);

    expect(rpc).toHaveBeenCalledWith('corbeille_mettre', { p_table: 'articles', p_id: uuid(100), p_par: ADMIN });
    expect(resultat).toEqual({ ok: true, idCorbeille: uuid(900), titre: 'Le franc CFA', resume: {} });
    expect(revalidateTag).toHaveBeenCalledWith(ARTICLE_CACHE_TAG, { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith('/articles/franc-cfa');
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.mise', 'articles', uuid(100), {
      titre: 'Le franc CFA',
      idCorbeille: uuid(900),
      dependants: {},
    });
  });

  it('un refus ne rafraîchit rien et ne journalise rien', async () => {
    const { service } = client({ rpc: { error: refus('numero_envoye') } });
    const resultat = await mettreALaCorbeille(service, 'newsletter_issues', uuid(600), ADMIN);
    expect(resultat).toMatchObject({ ok: false, statut: 400 });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(logAuditEvent).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('une cascade inconnue est signalée à Sentry, avec le détail', async () => {
    const { service } = client({ rpc: { error: { ...refus('cascade_inconnue'), details: 'public.comments (comments_article_id_fkey)' } } });
    await mettreALaCorbeille(service, 'articles', uuid(100), ADMIN);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.objectContaining({ detail: 'public.comments (comments_article_id_fkey)' }) }),
    );
  });

  it('un cache ou un journal en panne ne fait pas croire à un échec : la base a changé', async () => {
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error('cache');
    });
    vi.mocked(logAuditEvent).mockRejectedValueOnce(new Error('journal'));
    const { service } = client({ rpc: { data: { id_corbeille: uuid(900), titre: 'A', slug: 'a', resume: {} } } });
    expect((await mettreALaCorbeille(service, 'articles', uuid(100), ADMIN)).ok).toBe(true);
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });

  it('une réponse illisible n’est pas présentée comme un succès', async () => {
    const { service } = client({ rpc: { data: 'oui' } });
    expect(await mettreALaCorbeille(service, 'articles', uuid(100), ADMIN)).toMatchObject({ ok: false, statut: 500 });
  });
});

describe('rafraîchissement du cache', () => {
  const CAS: { table: TableCorbeille; slug: string | null; attendu: unknown[][] }[] = [
    { table: 'articles', slug: 'or-du-sahel', attendu: [[ARTICLE_CACHE_TAG, { expire: 0 }], ['/articles/or-du-sahel'], ['/']] },
    { table: 'education_lessons', slug: null, attendu: [['/education'], ['/education/[id]', 'page'], ['/education/parcours/[slug]', 'page']] },
    { table: 'education_categories', slug: 'bourse', attendu: [['/education'], ['/education/[id]', 'page']] },
    { table: 'strategic_enterprises', slug: 'sonidep', attendu: [['strategic-enterprises', 'max'], ['/entreprises'], ['/entreprises/sonidep']] },
    { table: 'legal_sections', slug: null, attendu: [['/cgu'], ['/mentions-legales'], ['/confidentialite']] },
    { table: 'newsletter_issues', slug: '009-brouillon', attendu: [] },
  ];

  function appelsDuCache(): unknown[][] {
    return [...vi.mocked(revalidateTag).mock.calls, ...vi.mocked(revalidatePath).mock.calls];
  }

  it.each(CAS)('$table : la restauration rafraîchit exactement ce que la suppression rafraîchit', async (cas) => {
    const mise = client({ rpc: { data: { id_corbeille: uuid(900), titre: 'X', slug: cas.slug, resume: {} } } });
    await mettreALaCorbeille(mise.service, cas.table, uuid(100), ADMIN);
    const aLaSuppression = appelsDuCache();
    vi.clearAllMocks();

    const retour = client({ rpc: { data: { table: cas.table, titre: 'X', id_origine: uuid(100), slug: cas.slug, remis: {}, remarques: [] } } });
    await restaurerDepuisCorbeille(retour.service, uuid(900), ADMIN);
    const aLaRestauration = appelsDuCache();

    expect(aLaRestauration).toEqual(aLaSuppression);
    for (const appel of cas.attendu) expect(aLaRestauration).toContainEqual(appel);
    if (cas.attendu.length === 0) expect(aLaRestauration).toEqual([]);
  });
});

describe('restaurerDepuisCorbeille', () => {
  it('traduit le résultat de corbeille_restaurer en message et en remarques', async () => {
    const { service, rpc } = client({
      rpc: {
        data: {
          table: 'education_categories',
          titre: 'Bourse',
          id_origine: uuid(400),
          slug: 'bourse',
          remis: { education_lessons: 3, user_lesson_progress: 12 },
          remarques: [{ code: 'progressions_ecartees', nombre: 2 }],
        },
      },
    });

    const resultat = await restaurerDepuisCorbeille(service, uuid(900), ADMIN);

    expect(rpc).toHaveBeenCalledWith('corbeille_restaurer', { p_entree: uuid(900) });
    expect(resultat).toEqual({
      ok: true,
      table: 'education_categories',
      titre: 'Bourse',
      message: typographieFr('« Bourse » est de nouveau en place, avec 3\u00a0leçons et 12\u00a0progressions de lecteurs.'),
      remarques: [typographieFr('2\u00a0progressions de lecteurs ne reviennent pas : les lecteurs concernés ont supprimé leur compte entre-temps.')],
    });
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.restauration', 'education_categories', uuid(400), {
      titre: 'Bourse',
      idCorbeille: uuid(900),
    });
  });

  it('un refus ne rafraîchit rien et ne journalise rien', async () => {
    const { service } = client({ rpc: { error: refus('id_pris', { titre: 'X', table: 'articles' }) } });
    expect(await restaurerDepuisCorbeille(service, uuid(900), ADMIN)).toMatchObject({ ok: false, statut: 409 });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });
});

describe('supprimerDefinitivement', () => {
  it('vide l’entrée et le note au journal', async () => {
    const { service, from, requete } = client({
      from: { data: [{ table_origine: 'articles', id_origine: uuid(100), titre: 'Le franc CFA' }], error: null },
    });
    expect(await supprimerDefinitivement(service, uuid(900), ADMIN)).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith('contenus_supprimes');
    expect(requete.eq).toHaveBeenCalledWith('id', uuid(900));
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.suppression_definitive', 'articles', uuid(100), {
      titre: 'Le franc CFA',
      idCorbeille: uuid(900),
    });
  });

  it('404 quand l’entrée n’y est plus, 503 quand la réponse s’est perdue, 500 signalé sinon', async () => {
    expect(await supprimerDefinitivement(client({ from: { data: [], error: null } }).service, uuid(900), ADMIN)).toMatchObject({ statut: 404 });
    expect(await supprimerDefinitivement(client({ from: { data: null, error: { message: 'fetch failed' } } }).service, uuid(900), ADMIN)).toMatchObject({ statut: 503 });
    expect(await supprimerDefinitivement(client({ from: { data: null, error: { code: 'XX000', message: 'boum' } } }).service, uuid(900), ADMIN)).toMatchObject({ statut: 500 });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).not.toHaveBeenCalled();
  });
});

describe('listerLaCorbeille', () => {
  it('rend les entrées sans leur contenu, et dit quand la table manque', async () => {
    const { service, requete } = client({
      from: {
        data: [{ id: uuid(900), table_origine: 'articles', id_origine: uuid(100), titre: 'A', supprime_le: '2026-11-03T10:00:00Z', resume_dependants: { x: 1 } }],
        error: null,
        count: 1,
      },
    });
    const liste = await listerLaCorbeille(service);
    expect(liste).toMatchObject({ ok: true, total: 1 });
    expect(requete.select).toHaveBeenCalledWith('id, table_origine, id_origine, titre, supprime_le, resume_dependants', { count: 'exact' });

    const absente = await listerLaCorbeille(client({ from: { data: null, error: { code: 'PGRST205', message: 'x' } } }).service);
    expect(absente).toMatchObject({ ok: false, statut: 503 });
  });
});

describe('retirerLecteurDeLaCorbeille et purgerLaCorbeille', () => {
  it('retirent en un appel, et ne lèvent jamais', async () => {
    const retrait = client({ rpc: { data: { entrees: 2, lignes: 3 } } });
    expect(await retirerLecteurDeLaCorbeille(retrait.service, uuid(2))).toEqual({ ok: true, entrees: 2 });
    expect(retrait.rpc).toHaveBeenCalledWith('corbeille_retirer_lecteur', { p_user: uuid(2) });
    expect(await retirerLecteurDeLaCorbeille(client({ rpc: { error: { code: 'XX000', message: 'x' } } }).service, uuid(2))).toEqual({ ok: false, entrees: 0 });
    expect(await retirerLecteurDeLaCorbeille(client({ rpc: { error: { code: 'PGRST202', message: 'x' } } }).service, uuid(2))).toEqual({ ok: true, entrees: 0 });

    const purge = client({ rpc: { data: { purgees: [], lecteurs_retires: 0 } } });
    expect(await purgerLaCorbeille(purge.service, 'liste')).toEqual({ ok: true, purgees: 0, lecteursRetires: 0 });
    expect(purge.rpc).toHaveBeenCalledWith('corbeille_purger', { p_jours: 30 });
    expect(await purgerLaCorbeille(client({ rpc: { error: { code: 'XX000', message: 'x' } } }).service, 'liste')).toEqual({
      ok: false,
      purgees: 0,
      lecteursRetires: 0,
    });
  });

  it('la purge note au journal du serveur ce qui est parti, sans titre', async () => {
    const journal = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const vide = client({ rpc: { data: { purgees: [], lecteurs_retires: 0 } } });
      await purgerLaCorbeille(vide.service, 'liste');
      expect(journal).not.toHaveBeenCalled();
      await purgerLaCorbeille(vide.service, 'tache-planifiee');
      expect(journal).toHaveBeenCalledTimes(1);

      const pleine = client({
        rpc: { data: { purgees: [{ table: 'articles', id_origine: uuid(100), supprime_le: '2026-10-01T00:00:00Z', dependants: {} }], lecteurs_retires: 0 } },
      });
      await purgerLaCorbeille(pleine.service, 'liste');
      expect(journal).toHaveBeenCalledTimes(2);
      expect(String(journal.mock.calls[1]?.[1])).toContain(uuid(100));
    } finally {
      journal.mockRestore();
    }
  });
});

describe('typographieFr', () => {
  it('pose les insécables françaises, sans toucher aux heures ni aux adresses', () => {
    expect(typographieFr('Statut : prêt')).toBe(`Statut${NB}: prêt`);
    expect(typographieFr('Vraiment ?')).toBe(`Vraiment${FINE}?`);
    expect(typographieFr('« Titre »')).toBe(`«${FINE}Titre${FINE}»`);
    expect(typographieFr("L'article")).toBe('L’article');
    const heureEtAdresse = typographieFr('voir 21:55 sur https://nfireport.com/articles/or-du-sahel');
    expect(heureEtAdresse).toContain('21:55');
    expect(heureEtAdresse).toContain('https://nfireport.com/articles/or-du-sahel');
  });

  it('écrit les nombres à la française et reste idempotente', () => {
    expect(nombreFr(1450)).toBe(`1${FINE}450`);
    const texte = "« L'or » : est-il revenu ? Oui ; tout, de la une à la fin... sur 1 450 lecteurs.";
    expect(typographieFr(typographieFr(texte))).toBe(typographieFr(texte));
  });

  it('ne laisse aucun mot-outil seul en fin de ligne, même après une apostrophe', () => {
    expect(typographieFr('la progression d’une leçon')).toBe(`la${NB}progression d’une${NB}leçon`);
    expect(typographieFr('récupérable jusqu’au 3 décembre')).toBe(`récupérable jusqu’au${NB}3 décembre`);
  });

  it('ne coupe pas un mot composé à son trait d’union, sauf dans un lien', () => {
    expect(typographieFr('repris entre-temps, peut-être')).toBe('repris entre\u2011temps, peut\u2011être');
    expect(typographieFr('le lien « /articles/franc-cfa »')).toContain('/articles/franc-cfa');
    expect(typographieFr('écrire à contact-presse@exemple.test')).toContain('contact-presse@exemple.test');
    expect(typographieFr(typographieFr('entre-temps'))).toBe(typographieFr('entre-temps'));
  });

  it('soude les deux derniers mots d’une phrase : jamais un mot seul en dernière ligne', () => {
    expect(sansMotSeul('leur compte entre-temps.')).toBe(`leur compte${NB}entre-temps.`);
    expect(sansMotSeul('Seul.')).toBe('Seul.');
    expect(sansMotSeul(`par${NB}«${FINE}Nouveau numéro${FINE}».`)).toBe(`par${NB}«${FINE}Nouveau${NB}numéro${FINE}».`);
    expect(sansMotSeul(sansMotSeul('a b c'))).toBe(sansMotSeul('a b c'));
  });

  it('découpe un message en phrases', () => {
    expect(enPhrases('« X » est de retour. Rien n’a été doublé.')).toEqual(['« X » est de retour.', 'Rien n’a été doublé.']);
  });
});
