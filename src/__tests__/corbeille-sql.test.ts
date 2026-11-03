import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { PGlite } from '@electric-sql/pglite';
import {
  appliquerMigration,
  baseModele,
  baseSansCorbeille,
  clientDeService,
  cloner,
  commeRole,
  erreurDe,
  MIGRATION,
  REPLIQUE,
  uuid,
  type Base,
  type Role,
} from './helpers/base-corbeille';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAuditEvent: vi.fn(async () => undefined), SYSTEM_AUDIT_ID: '00000000-0000-0000-0000-000000000000' }));
vi.mock('@/lib/supabase', () => ({ createServiceClient: vi.fn(() => null) }));

import * as Sentry from '@sentry/nextjs';
import { revalidateTag } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { ARTICLE_CACHE_TAG } from '@/lib/articles';
import {
  mettreALaCorbeille,
  purgerLaCorbeille,
  restaurerDepuisCorbeille,
  retirerLecteurDeLaCorbeille,
  supprimerDefinitivement,
} from '@/lib/corbeille';
import { dernierJourRecuperable, jourANiamey } from '@/lib/corbeille/libelles';
import { autoSlug } from '@/lib/newsletter/issues';
import { typographieFr } from '@/lib/typographie-fr';

/**
 * La corbeille sur un vrai PostgreSQL (PGlite), avec la réplique du schéma de
 * production et la vraie migration 00032. Chaque scénario des deux revues de
 * la première version y est rejoué ; chaque test part d'un clone neuf de la
 * même base peuplée.
 */

const ADMIN = uuid(1);
const LECTRICE = uuid(2);
const LECTEUR = uuid(3);
const CATEGORIE = uuid(100);
const AUTRE_CATEGORIE = uuid(101);
const LECON = uuid(110);
const LECON_2 = uuid(111);
const LECON_AUTRE = uuid(112);
const PARCOURS = uuid(120);
const AUTRE_PARCOURS = uuid(122);
const ARTICLE = uuid(200);
const ARTICLE_2 = uuid(201);
const COMMENTAIRE = uuid(210);
const REPONSE = uuid(211);
const COMMENTAIRE_2 = uuid(212);
const ENTREPRISE = uuid(300);
const ENTREPRISE_2 = uuid(301);
const SECTION = uuid(400);
const NUMERO = uuid(500);
const ABONNE = uuid(510);

const PEUPLEMENT = `
insert into auth.users (id, email) values
  ('${ADMIN}', 'admin@exemple.test'), ('${LECTRICE}', 'lectrice@exemple.test'), ('${LECTEUR}', 'lecteur@exemple.test');
insert into public.education_categories (id, slug, title, sort_order) values
  ('${CATEGORIE}', 'bourse', 'Bourse', 1), ('${AUTRE_CATEGORIE}', 'impots', 'Impôts', 2);
insert into public.education_lessons (id, category_id, title, content, sort_order, created_at, updated_at) values
  ('${LECON}', '${CATEGORIE}', 'Le PER', '<p>Le prix sur bénéfice</p>', 1, '2026-09-01 08:00:00.123456+00', '2026-10-02 09:30:00.654321+00'),
  ('${LECON_2}', '${CATEGORIE}', 'Le rendement', '<p>Dividende</p>', 2, '2026-09-02 08:00:00+00', '2026-09-02 08:00:00+00'),
  ('${LECON_AUTRE}', '${AUTRE_CATEGORIE}', 'La TVA', '<p>19 %</p>', 1, '2026-09-03 08:00:00+00', '2026-09-03 08:00:00+00');
insert into public.learning_paths (id, slug, title) values
  ('${PARCOURS}', 'debuter', 'Débuter'), ('${AUTRE_PARCOURS}', 'fiscalite', 'Fiscalité');
insert into public.learning_path_steps (id, path_id, lesson_id, sort_order) values
  ('${uuid(130)}', '${PARCOURS}', '${LECON}', 1),
  ('${uuid(131)}', '${PARCOURS}', '${LECON_2}', 2),
  ('${uuid(132)}', '${AUTRE_PARCOURS}', '${LECON}', 1),
  ('${uuid(133)}', '${AUTRE_PARCOURS}', '${LECON_AUTRE}', 2);
insert into public.user_lesson_progress (user_id, lesson_id, completed_at, last_viewed_at, quiz_score) values
  ('${LECTRICE}', '${LECON}', '2026-10-01 10:00:00.123456+00', '2026-10-01 10:05:00+00', 80),
  ('${LECTEUR}', '${LECON}', null, '2026-10-03 18:00:00+00', null),
  ('${LECTRICE}', '${LECON_2}', null, '2026-10-04 07:00:00+00', null),
  ('${LECTRICE}', '${LECON_AUTRE}', '2026-10-05 12:00:00+00', '2026-10-05 12:00:00+00', 100);
insert into public.articles (id, title, slug, category, content_type, body, tags, sections, is_featured, featured_order, status, published_at, created_at, updated_at) values
  ('${ARTICLE}', 'Le franc CFA', 'franc-cfa', 'economie', 'premium', '<p>Texte premium</p>', '{monnaie,uemoa}', '{economie,finance}', false, 0, 'published', '2026-10-30 08:00:00+00', '2026-10-29 08:00:00.5+00', '2026-10-30 08:00:00.25+00'),
  ('${ARTICLE_2}', 'La BRVM en octobre', 'brvm-octobre', 'finance', 'free', '<p>Marché</p>', '{}', '{finance}', true, 0, 'published', '2026-10-31 08:00:00+00', '2026-10-31 08:00:00+00', '2026-10-31 08:00:00+00');
insert into public.comments (id, article_id, user_id, user_name, content, parent_comment_id) values
  ('${COMMENTAIRE}', '${ARTICLE}', '${LECTRICE}', 'Lectrice', 'Très clair', null),
  ('${REPONSE}', '${ARTICLE}', '${LECTEUR}', 'Lecteur', 'Merci', '${COMMENTAIRE}'),
  ('${COMMENTAIRE_2}', '${ARTICLE}', '${LECTEUR}', 'Lecteur', 'Un propos à modérer', null);
insert into public.article_likes (id, article_id, user_id) values ('${uuid(220)}', '${ARTICLE}', '${LECTEUR}');
insert into public.strategic_enterprises (id, name, sector, slug, is_featured, key_facts) values
  ('${ENTREPRISE}', 'SONIDEP', 'Énergie', 'sonidep', true, '[{"label": "Création", "valeur": "1977"}]'),
  ('${ENTREPRISE_2}', 'ORANO Mining', 'Mines', 'orano', false, '[]');
insert into public.legal_sections (id, page_slug, heading, text, display_order) values
  ('${SECTION}', 'cgu', 'Article 3', 'Le site est édité par NFI Report.', 3);
insert into public.newsletter_subscribers (id, email) values ('${ABONNE}', 'abonne@exemple.test');
insert into public.newsletter_issues (id, number, slug, subject, content, status) values
  ('${NUMERO}', 9, '009-or-brvm', 'L’or et la BRVM', '{"number": 9, "slug": "009-or-brvm", "intro": {"heading": "Or"}}', 'draft');
`;

let modele: PGlite;
let db: Base;

beforeAll(async () => {
  modele = await baseModele();
  await modele.exec(PEUPLEMENT);
}, 120_000);

beforeEach(async () => {
  db = await cloner(modele);
});

afterEach(async () => {
  await db.close();
});

type Json = Record<string, unknown>;

async function un<T = Json>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await db.query<T>(sql, params)).rows[0];
}

async function nombre(sql: string, params: unknown[] = []): Promise<number> {
  const ligne = await un<{ n: number | string }>(sql, params);
  return Number(ligne?.n ?? 0);
}

/** La ligne telle que to_jsonb la voit : la comparaison est exacte, au millionième de seconde. */
async function ligne(table: string, id: string): Promise<Json | null> {
  const r = await un<{ j: Json }>(`select to_jsonb(t) as j from public.${table} as t where t.id = $1`, [id]);
  return r?.j ?? null;
}

async function lignes(sql: string, params: unknown[] = []): Promise<Json[]> {
  return (await db.query<{ j: Json }>(sql, params)).rows.map((r) => r.j);
}

async function appeler(fonction: string, args: unknown[], role: Role = 'service_role'): Promise<Json> {
  const marques = args.map((_, i) => `$${i + 1}`).join(', ');
  const r = await commeRole(db, role, () => db.query<{ r: Json }>(`select public.${fonction}(${marques}) as r`, args));
  return r.rows[0]?.r as Json;
}

const mettre = (table: string, id: string, par: string | null = ADMIN) => appeler('corbeille_mettre', [table, id, par]);
const restaurer = (entree: string) => appeler('corbeille_restaurer', [entree]);

async function refus(promesse: Promise<unknown>): Promise<{ code: string; detail: Json }> {
  const erreur = await erreurDe(promesse);
  expect(erreur.code).toBe('P0001');
  expect(erreur.message.startsWith('corbeille:')).toBe(true);
  let detail: Json = {};
  if (erreur.detail?.startsWith('{')) detail = JSON.parse(erreur.detail) as Json;
  return { code: erreur.message.slice('corbeille:'.length), detail };
}

/** Les lignes d'une section du pied de la migration (vérifications, retour arrière), sans leur « -- ». */
function sectionDuPied(debut: string, fin: string | null): string[] {
  const partie = MIGRATION.split(debut)[1] ?? '';
  return (fin ? (partie.split(fin)[0] ?? '') : partie)
    .split('\n')
    .filter((ligne) => ligne.startsWith('--'))
    .map((ligne) => ligne.replace(/^-- ?/, ''));
}

/** Les requêtes de vérification, telles que le pied de la migration les donne. */
function requetesDeVerification(): string[] {
  const requetes: string[] = [];
  let courante: string[] | null = null;
  for (const ligne of sectionDuPied('VÉRIFICATIONS', 'RETOUR ARRIÈRE')) {
    if (!courante && /^select\b/i.test(ligne)) courante = [];
    if (!courante) continue;
    courante.push(ligne);
    if (/;\s*(--.*)?$/.test(ligne)) {
      requetes.push(courante.join('\n'));
      courante = null;
    }
  }
  return requetes;
}

/** Les transactions du retour arrière, telles que le pied de la migration les donne. */
function transactionsDeRetourArriere(): string[] {
  const instructions = sectionDuPied('RETOUR ARRIÈRE', null).filter((ligne) => /^(BEGIN|SET LOCAL|ALTER TABLE|DROP|COMMIT)\b/.test(ligne));
  const transactions: string[] = [];
  let courante: string[] = [];
  for (const instruction of instructions) {
    courante.push(instruction);
    if (instruction === 'COMMIT;') {
      transactions.push(courante.join('\n'));
      courante = [];
    }
  }
  return transactions;
}

async function entreeDe(table: string, id: string): Promise<Json | undefined> {
  return un<Json>('select * from public.contenus_supprimes where table_origine = $1 and id_origine = $2', [table, id]);
}

describe('installation et droits', () => {
  it('rejouer la migration ne change rien et ne perd rien', async () => {
    await mettre('articles', ARTICLE);
    await appliquerMigration(db);
    await appliquerMigration(db);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
    expect(await nombre("select count(*) as n from pg_proc where proname like 'corbeille%'")).toBe(8);
  });

  it('s’applique en entier ou pas du tout (BEGIN … COMMIT)', async () => {
    const base = await baseSansCorbeille();
    try {
      // Un objet en travers du chemin, au milieu du fichier : la fonction
      // existe déjà avec un autre type de retour.
      await base.exec(`set role proprietaire;
        create function public.corbeille_purger(p_jours integer) returns text language sql as $$ select 'x' $$;
        reset role;`);
      const erreur = await erreurDe(appliquerMigration(base));
      expect(erreur.message).toMatch(/return type/i);
      const table = await base.query<{ t: string | null }>("select to_regclass('public.contenus_supprimes')::text as t");
      expect(table.rows[0]?.t).toBeNull();
    } finally {
      await base.close();
    }
  });

  it('le fichier est encadré par BEGIN et COMMIT, avec un délai de verrou de 5 secondes', () => {
    const instructions = MIGRATION.split('\n').filter((l) => !l.trim().startsWith('--') && l.trim() !== '');
    expect(instructions[0]?.trim()).toBe('BEGIN;');
    expect(instructions.at(-1)?.trim()).toBe('COMMIT;');
    expect(MIGRATION).toContain("SET LOCAL lock_timeout = '5s';");
  });

  it.each(['anon', 'authenticated'] as const)('%s ne lit ni n’écrit la corbeille, et n’exécute aucune de ses fonctions', async (role) => {
    await mettre('articles', ARTICLE);
    const droits = await un<Json>(
      `select has_table_privilege($1, 'public.contenus_supprimes', 'select, insert, update, delete, truncate, references, trigger') as table,
              has_function_privilege($1, 'public.corbeille_mettre(text, uuid, uuid)', 'execute') as mettre,
              has_function_privilege($1, 'public.corbeille_restaurer(uuid)', 'execute') as restaurer,
              has_function_privilege($1, 'public.corbeille_retirer_lecteur(uuid)', 'execute') as retirer,
              has_function_privilege($1, 'public.corbeille_purger(integer)', 'execute') as purger,
              has_function_privilege($1, 'public.corbeille_inserer(text, jsonb, jsonb)', 'execute') as inserer,
              has_function_privilege($1, 'public.corbeille_limite_purge(integer, timestamptz)', 'execute') as limite,
              has_function_privilege($1, 'public.corbeille_vider(uuid)', 'execute') as vider,
              has_function_privilege($1, 'public.corbeille_oublier_articles(uuid[])', 'execute') as oublier`,
      [role],
    );
    expect(droits).toEqual({
      table: false,
      mettre: false,
      restaurer: false,
      retirer: false,
      purger: false,
      inserer: false,
      limite: false,
      vider: false,
      oublier: false,
    });

    for (const sql of [
      'select count(*) from public.contenus_supprimes',
      `select public.corbeille_mettre('articles', '${ARTICLE_2}', null)`,
      `select public.corbeille_restaurer('${uuid(999)}')`,
      `select public.corbeille_retirer_lecteur('${LECTRICE}')`,
      'select public.corbeille_purger(30)',
      `select public.corbeille_inserer('articles', '[]', '{}')`,
      'select public.corbeille_limite_purge(30, now())',
      `select public.corbeille_vider('${uuid(999)}')`,
      `select public.corbeille_oublier_articles(array['${ARTICLE}']::uuid[])`,
    ]) {
      const erreur = await erreurDe(commeRole(db, role, () => db.query(sql)));
      expect(erreur.code).toBe('42501');
    }
    // Rien n'a bougé : l'article 2 est toujours là, l'entrée aussi.
    expect(await ligne('articles', ARTICLE_2)).not.toBeNull();
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('service_role lit la corbeille et appelle les cinq fonctions, mais n’y écrit ni ne la vide qu’à travers elles', async () => {
    const droits = await un<Json>(
      `select has_table_privilege('service_role', 'public.contenus_supprimes', 'select') as lit,
              has_table_privilege('service_role', 'public.contenus_supprimes', 'delete') as vide,
              has_table_privilege('service_role', 'public.contenus_supprimes', 'insert, update, truncate') as ecrit,
              has_function_privilege('service_role', 'public.corbeille_mettre(text, uuid, uuid)', 'execute') as mettre,
              has_function_privilege('service_role', 'public.corbeille_restaurer(uuid)', 'execute') as restaurer,
              has_function_privilege('service_role', 'public.corbeille_retirer_lecteur(uuid)', 'execute') as retirer,
              has_function_privilege('service_role', 'public.corbeille_purger(integer)', 'execute') as purger,
              has_function_privilege('service_role', 'public.corbeille_vider(uuid)', 'execute') as vider,
              has_function_privilege('service_role', 'public.corbeille_inserer(text, jsonb, jsonb)', 'execute') as inserer,
              has_function_privilege('service_role', 'public.corbeille_limite_purge(integer, timestamptz)', 'execute') as limite,
              has_function_privilege('service_role', 'public.corbeille_oublier_articles(uuid[])', 'execute') as oublier`,
    );
    expect(droits).toEqual({
      lit: true,
      vide: false,
      ecrit: false,
      mettre: true,
      restaurer: true,
      retirer: true,
      purger: true,
      vider: true,
      inserer: false,
      limite: false,
      oublier: false,
    });

    const mise = await mettre('articles', ARTICLE);
    const liste = await commeRole(db, 'service_role', () => db.query('select id from public.contenus_supprimes'));
    expect(liste.rows).toHaveLength(1);

    const insertion = await erreurDe(
      commeRole(db, 'service_role', () =>
        db.query(
          `insert into public.contenus_supprimes (table_origine, id_origine, titre, donnees) values ('articles', $1::uuid, 'x', jsonb_build_object('id', $1::uuid::text))`,
          [ARTICLE_2],
        ),
      ),
    );
    expect(insertion.code).toBe('42501');
    const modification = await erreurDe(
      commeRole(db, 'service_role', () => db.query(`update public.contenus_supprimes set titre = 'x'`)),
    );
    expect(modification.code).toBe('42501');
    // Un DELETE direct laisserait les commentaires de l'article derrière lui.
    const vidageDirect = await erreurDe(
      commeRole(db, 'service_role', () => db.query('delete from public.contenus_supprimes where id = $1', [mise.id_corbeille])),
    );
    expect(vidageDirect.code).toBe('42501');

    const vidage = await appeler('corbeille_vider', [mise.id_corbeille]);
    expect(vidage).toMatchObject({ table: 'articles', id_origine: ARTICLE, titre: 'Le franc CFA' });
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('RLS active sans politique, fonctions SECURITY DEFINER au chemin de recherche fixé et à l’attente de verrou bornée', async () => {
    const table = await un<Json>(
      `select relrowsecurity as rls, (select count(*)::int from pg_policies where tablename = 'contenus_supprimes') as politiques
         from pg_class where oid = 'public.contenus_supprimes'::regclass`,
    );
    expect(table).toEqual({ rls: true, politiques: 0 });
    const fonctions = await db.query<{ proname: string; prosecdef: boolean; proconfig: string[]; proprietaire: string }>(
      `select proname, prosecdef, proconfig, pg_get_userbyid(proowner) as proprietaire
         from pg_proc where pronamespace = 'public'::regnamespace and proname like 'corbeille%' order by proname`,
    );
    expect(fonctions.rows).toEqual([
      { proname: 'corbeille_inserer', prosecdef: false, proconfig: ['search_path=public, pg_temp'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_limite_purge', prosecdef: false, proconfig: ['search_path=public, pg_temp'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_mettre', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_oublier_articles', prosecdef: false, proconfig: ['search_path=public, pg_temp'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_purger', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_restaurer', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_retirer_lecteur', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_vider', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
    ]);
  });

  it('sur ce projet, le REVOKE est indispensable : sans lui, une table ou une fonction neuve est ouverte à anon', async () => {
    await db.exec(`set role proprietaire;
      create table public.temoin (id int);
      create function public.temoin_f() returns int language sql as $$ select 1 $$;
      reset role;`);
    const droits = await un<Json>(
      `select has_table_privilege('anon', 'public.temoin', 'select') as table_anon,
              has_table_privilege('authenticated', 'public.temoin', 'insert') as table_authentifie,
              has_function_privilege('anon', 'public.temoin_f()', 'execute') as fonction_anon`,
    );
    expect(droits).toEqual({ table_anon: true, table_authentifie: true, fonction_anon: true });
  });

  it('les trois requêtes de vérification de la migration rendent exactement les résultats annoncés', async () => {
    const requetes = requetesDeVerification();
    expect(requetes).toHaveLength(3);

    expect((await db.query(requetes[0] ?? '')).rows).toEqual([
      { anon: false, authenticated: false, service_lit: true, service_ecrit: false, rls: true, politiques: 0 },
    ]);
    const internes = ['corbeille_inserer', 'corbeille_limite_purge', 'corbeille_oublier_articles'];
    const droits = (await db.query<{ f: string; r: string; peut: boolean }>(requetes[1] ?? '')).rows;
    expect(droits).toHaveLength(8 * 3);
    for (const { f, r, peut } of droits) {
      const interne = internes.some((nom) => f.includes(nom));
      expect(peut, `${r} sur ${f}`).toBe(r === 'service_role' && !interne);
    }
    const fonctions = (await db.query<{ proname: string; prosecdef: boolean; proconfig: string[] }>(requetes[2] ?? '')).rows;
    expect(fonctions).toHaveLength(8);
    for (const { proname, prosecdef, proconfig } of fonctions) {
      const interne = internes.includes(proname);
      expect(prosecdef, proname).toBe(!interne);
      expect(proconfig, proname).toEqual(interne ? ['search_path=public, pg_temp'] : ['search_path=public, pg_temp', 'lock_timeout=5s']);
    }
  });

  it('le retour arrière, tel qu’écrit, tient en deux transactions courtes, retire tout, et la migration se rejoue ensuite', async () => {
    const [cle, reste] = transactionsDeRetourArriere();
    for (const transaction of [cle, reste]) {
      expect(transaction).toMatch(/^BEGIN;\nSET LOCAL lock_timeout = '3s';\n/);
      expect(transaction).toMatch(/\nCOMMIT;$/);
    }
    // Seule la première touche auth.users : elle ne fait que retirer la clé.
    expect(cle?.split('\n')).toHaveLength(4);
    expect(reste).not.toMatch(/auth\.users|CONSTRAINT/);
    await mettre('articles', ARTICLE);

    await db.exec('set role proprietaire');
    try {
      await db.exec(cle ?? '');
      expect(await nombre("select count(*) as n from pg_constraint where conname = 'contenus_supprimes_supprime_par_fkey'")).toBe(0);
      expect(await nombre("select count(*) as n from pg_proc where proname like 'corbeille%'")).toBe(8);
      await db.exec(reste ?? '');
    } finally {
      await db.exec('reset role');
    }

    expect(await nombre("select count(*) as n from pg_proc where proname like 'corbeille%'")).toBe(0);
    expect((await un<{ t: string | null }>("select to_regclass('public.contenus_supprimes')::text as t"))?.t).toBeNull();
    // Les contenus et les comptes n'ont rien perdu, et tout se réinstalle.
    expect(await nombre('select count(*) as n from auth.users')).toBe(3);
    await appliquerMigration(db);
    expect(await nombre("select count(*) as n from pg_proc where proname like 'corbeille%'")).toBe(8);
    expect(await nombre("select count(*) as n from pg_constraint where conname = 'contenus_supprimes_supprime_par_fkey'")).toBe(1);
  });

  it('chaque DELETE et chaque UPDATE de la migration a un WHERE : safeupdate, chargé en production pour PostgREST, refuserait les autres', () => {
    const code = MIGRATION.split('\n')
      .filter((ligne) => !ligne.trim().startsWith('--'))
      .join('\n');
    const morceaux = code.split(';').filter((morceau) => /\bDELETE\s+FROM\b|\bUPDATE\s+[\w.]+(\s+AS\s+\w+)?\s+SET\b/i.test(morceau));
    expect(morceaux.length).toBeGreaterThanOrEqual(10);
    for (const morceau of morceaux) expect(morceau, morceau.trim().slice(0, 120)).toMatch(/\bWHERE\b/i);
  });

  it('la réplique est fidèle à la production : aucune clé de comments ni d’article_likes vers articles, quatre cascades', async () => {
    const cles = await db.query<{ cle: string }>(
      `select format('%s(%s)>%s %s', c.conrelid::regclass, a.attname, c.confrelid::regclass, c.confdeltype) as cle
         from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
        where c.contype = 'f' and c.confrelid in ('public.articles'::regclass, 'public.education_categories'::regclass,
              'public.education_lessons'::regclass, 'public.newsletter_issues'::regclass)
        order by 1`,
    );
    expect(cles.rows.map((r) => r.cle)).toEqual([
      'education_lessons(category_id)>education_categories c',
      'learning_path_steps(lesson_id)>education_lessons c',
      'newsletter_events(issue_id)>newsletter_issues c',
      'user_lesson_progress(lesson_id)>education_lessons c',
    ]);
    const types = await db.query<{ colonne: string; type: string }>(
      `select table_name || '.' || column_name as colonne, data_type as type from information_schema.columns
        where table_schema = 'public' and table_name in ('comments', 'article_likes') and column_name in ('article_id', 'user_id')
        order by 1`,
    );
    expect(types.rows).toEqual([
      { colonne: 'article_likes.article_id', type: 'text' },
      { colonne: 'article_likes.user_id', type: 'text' },
      { colonne: 'comments.article_id', type: 'text' },
      { colonne: 'comments.user_id', type: 'text' },
    ]);
  });

  it('la réplique couvre toutes les colonnes des types générés, avec des types compatibles', async () => {
    const source = readFileSync(new URL('../types/supabase.generated.ts', import.meta.url), 'utf8');
    const tables = [
      'articles', 'comments', 'article_likes', 'education_categories', 'education_lessons', 'learning_paths',
      'learning_path_steps', 'user_lesson_progress', 'strategic_enterprises', 'legal_sections', 'newsletter_issues',
      'newsletter_events', 'newsletter_subscribers',
    ];
    const compatibles: Record<string, string[]> = {
      string: ['text', 'uuid', 'timestamp with time zone', 'character varying'],
      number: ['integer', 'bigint', 'numeric'],
      boolean: ['boolean'],
      Json: ['jsonb', 'json'],
      'string[]': ['ARRAY'],
    };
    const colonnes = await db.query<{ table_name: string; column_name: string; data_type: string }>(
      `select table_name, column_name, data_type from information_schema.columns where table_schema = 'public'`,
    );
    for (const table of tables) {
      const bloc = new RegExp(`\\n      ${table}: \\{\\n        Row: \\{\\n([\\s\\S]*?)\\n        \\}`).exec(source);
      expect(bloc, `types générés de ${table}`).not.toBeNull();
      for (const [, nom, type] of (bloc?.[1] ?? '').matchAll(/^\s+(\w+): ([^\n]+?)(?: \| null)?$/gm)) {
        const reelle = colonnes.rows.find((c) => c.table_name === table && c.column_name === nom);
        expect(reelle, `${table}.${nom} absente de la réplique`).toBeDefined();
        expect(compatibles[type ?? ''] ?? [], `${table}.${nom} : ${type} contre ${reelle?.data_type}`).toContain(reelle?.data_type);
      }
    }
  });
});

describe('mise à la corbeille', () => {
  it('un article : copie exacte, suppression, et ses commentaires et j’aime restent en place, non copiés', async () => {
    const avant = await ligne('articles', ARTICLE);
    const resultat = await mettre('articles', ARTICLE);

    expect(resultat).toMatchObject({ table: 'articles', id_origine: ARTICLE, titre: 'Le franc CFA', slug: 'franc-cfa', resume: {} });
    expect(await ligne('articles', ARTICLE)).toBeNull();
    const entree = await entreeDe('articles', ARTICLE);
    expect(entree).toMatchObject({ id: resultat.id_corbeille, titre: 'Le franc CFA', supprime_par: ADMIN, dependants: {}, lecteurs: [] });
    expect(entree?.donnees).toEqual(avant);
    // En production, comments et article_likes n'ont pas de clé vers articles :
    // ils survivent, la corbeille n'y touche pas.
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);
    expect(await nombre(`select count(*) as n from public.article_likes where article_id = '${ARTICLE}'`)).toBe(1);
  });

  it('une leçon : ses étapes de parcours et la progression de ses lecteurs, exactement ce qui part', async () => {
    const etapes = await lignes(`select to_jsonb(s) as j from public.learning_path_steps s where lesson_id = $1 order by id`, [LECON]);
    const progressions = await lignes(
      `select to_jsonb(p) as j from public.user_lesson_progress p where lesson_id = $1 order by lesson_id, user_id`,
      [LECON],
    );
    expect(etapes).toHaveLength(2);
    expect(progressions).toHaveLength(2);

    const resultat = await mettre('education_lessons', LECON);

    expect(resultat.resume).toEqual({ learning_path_steps: 2, user_lesson_progress: 2 });
    const entree = await entreeDe('education_lessons', LECON);
    expect(entree?.dependants).toEqual({ learning_path_steps: etapes, user_lesson_progress: progressions });
    expect([...(entree?.lecteurs as string[])].sort()).toEqual([LECTRICE, LECTEUR]);
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id = '${LECON}'`)).toBe(0);
    // Le reste ne bouge pas.
    expect(await nombre('select count(*) as n from public.learning_path_steps')).toBe(2);
    expect(await nombre('select count(*) as n from public.user_lesson_progress')).toBe(2);
  });

  it('une catégorie : ses leçons, et pour chacune ses étapes et progressions', async () => {
    const lecons = await lignes(`select to_jsonb(l) as j from public.education_lessons l where category_id = $1 order by id`, [CATEGORIE]);
    const resultat = await mettre('education_categories', CATEGORIE);

    expect(resultat.resume).toEqual({ education_lessons: 2, learning_path_steps: 3, user_lesson_progress: 3 });
    const entree = await entreeDe('education_categories', CATEGORIE);
    expect((entree?.dependants as Json).education_lessons).toEqual(lecons);
    expect(await nombre(`select count(*) as n from public.education_lessons where category_id = '${CATEGORIE}'`)).toBe(0);
    // L'autre catégorie et sa leçon, son étape et sa progression restent.
    expect(await ligne('education_lessons', LECON_AUTRE)).not.toBeNull();
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON_AUTRE}'`)).toBe(1);
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id = '${LECON_AUTRE}'`)).toBe(1);
  });

  it('un numéro de newsletter : ses événements d’envoi, sans meta.raw ni l’adresse qu’il recopie', async () => {
    await db.exec(`insert into public.newsletter_events (id, issue_id, subscriber_id, event_type, meta) values
      ('${uuid(520)}', '${NUMERO}', '${ABONNE}', 'delivered', '{"resend_id": "re_1", "optimistic": true}'),
      ('${uuid(521)}', '${NUMERO}', '${ABONNE}', 'opened', '{"resend_id": "re_1", "raw": {"to": ["abonne@exemple.test"], "subject": "x"}}'),
      ('${uuid(522)}', '${NUMERO}', null, 'bounced', null)`);
    await mettre('newsletter_issues', NUMERO);

    const entree = await entreeDe('newsletter_issues', NUMERO);
    const evenements = (entree?.dependants as Json).newsletter_events as Json[];
    expect(evenements.map((e) => e.meta)).toEqual([{ resend_id: 're_1', optimistic: true }, { resend_id: 're_1' }, null]);
    expect(JSON.stringify(entree)).not.toContain('abonne@exemple.test');
    expect(entree?.titre).toBe('N°\u00a09 · L’or et la BRVM');
  });

  it.each(['sent', 'sending'])('refuse un numéro « %s », sans rien toucher', async (statut) => {
    await db.exec(`update public.newsletter_issues set status = '${statut}' where id = '${NUMERO}'`);
    const { code } = await refus(mettre('newsletter_issues', NUMERO));
    expect(code).toBe(statut === 'sent' ? 'numero_envoye' : 'envoi_en_cours');
    expect(await ligne('newsletter_issues', NUMERO)).not.toBeNull();
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('une double suppression est refusée proprement : une seule entrée', async () => {
    await mettre('articles', ARTICLE);
    const { code } = await refus(mettre('articles', ARTICLE));
    expect(code).toBe('deja_dans_la_corbeille');
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('un contenu recréé sous le même identifiant ne remplace pas sa copie plus ancienne', async () => {
    const avant = await ligne('articles', ARTICLE);
    await mettre('articles', ARTICLE);
    await db.exec(`insert into public.articles (id, title, slug, category) values ('${ARTICLE}', 'Recréé', 'recree', 'economie')`);

    const { code, detail } = await refus(mettre('articles', ARTICLE));

    expect(code).toBe('copie_existante');
    expect(typeof detail.supprime_le).toBe('string');
    expect((await ligne('articles', ARTICLE))?.title).toBe('Recréé');
    expect((await entreeDe('articles', ARTICLE))?.donnees).toEqual(avant);
  });

  it('l’index unique interdit deux entrées pour le même contenu, même écrites à la main', async () => {
    await mettre('articles', ARTICLE);
    const erreur = await erreurDe(
      db.query(
        `insert into public.contenus_supprimes (table_origine, id_origine, titre, donnees) values ('articles', $1::uuid, 'x', jsonb_build_object('id', $1::uuid::text))`,
        [ARTICLE],
      ),
    );
    expect(erreur.code).toBe('23505');
  });

  it('refuse un contenu introuvable, une table hors liste et un auteur inconnu', async () => {
    expect((await refus(mettre('articles', uuid(9999)))).code).toBe('introuvable');
    expect((await refus(mettre('comments', COMMENTAIRE))).code).toBe('table_inconnue');
    expect((await refus(mettre('user_profiles', LECTRICE))).code).toBe('table_inconnue');
    expect((await refus(mettre('articles', ARTICLE, uuid(9998)))).code).toBe('auteur_inconnu');
    expect(await ligne('articles', ARTICLE)).not.toBeNull();
    expect(await ligne('comments', COMMENTAIRE)).not.toBeNull();
  });

  it('si une clé étrangère inconnue effacerait autre chose, la suppression est refusée : rien ne part en silence', async () => {
    // Le jour où quelqu'un « répare » comments.article_id en clé étrangère en cascade.
    await db.exec(`alter table public.comments alter column article_id type uuid using article_id::uuid;
      alter table public.comments add constraint comments_article_id_fkey foreign key (article_id) references public.articles (id) on delete cascade;`);

    const { code } = await refus(mettre('articles', ARTICLE));

    expect(code).toBe('cascade_inconnue');
    expect(await ligne('articles', ARTICLE)).not.toBeNull();
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('un déclencheur de suppression inconnu sur la table du contenu : refus, rien ne part en silence', async () => {
    // Le jour où quelqu'un efface les commentaires d'un article par un déclencheur.
    await db.exec(`create function public.effacer_commentaires() returns trigger language plpgsql as $$
        begin delete from public.comments where article_id = old.id::text; return old; end $$;
      create trigger effacer_commentaires after delete on public.articles for each row execute function public.effacer_commentaires();`);

    const erreur = await erreurDe(mettre('articles', ARTICLE));

    expect(erreur).toMatchObject({ code: 'P0001', message: 'corbeille:declencheur_inconnu', detail: 'déclencheur public.articles (effacer_commentaires)' });
    expect(await ligne('articles', ARTICLE)).not.toBeNull();
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);

    // Désactivé, il ne fait plus rien : la suppression passe, et les commentaires restent.
    await db.exec('alter table public.articles disable trigger effacer_commentaires');
    await mettre('articles', ARTICLE);
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);
  });

  it('une règle ON DELETE sur une table liée : refus pour la leçon, sans gêner un contenu qui ne la touche pas', async () => {
    await db.exec(`create rule journal as on delete to public.learning_path_steps
      do also delete from public.comments where article_id = old.id::text`);

    const erreur = await erreurDe(mettre('education_lessons', LECON));

    expect(erreur).toMatchObject({ code: 'P0001', message: 'corbeille:declencheur_inconnu', detail: 'règle public.learning_path_steps (journal)' });
    expect(await ligne('education_lessons', LECON)).not.toBeNull();
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(2);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
    // Un article ne touche pas les étapes de parcours : rien ne le bloque.
    expect((await mettre('articles', ARTICLE_2)).titre).toBe('La BRVM en octobre');
  });

  it('tout ou rien : si le contenu ne peut pas partir, ce qui en dépend reste aussi', async () => {
    // Une table inconnue retient la leçon (NO ACTION) : la progression, déjà
    // supprimée plus tôt dans la même transaction, doit revenir avec elle.
    await db.exec(`create table public.retenue (lesson_id uuid references public.education_lessons (id));
      insert into public.retenue values ('${LECON}');`);
    const erreur = await erreurDe(mettre('education_lessons', LECON));

    expect(erreur.code).toBe('23503');
    expect(await ligne('education_lessons', LECON)).not.toBeNull();
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id = '${LECON}'`)).toBe(2);
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(2);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('nomme une section de page légale avec sa page', async () => {
    const resultat = await mettre('legal_sections', SECTION);
    expect(resultat.titre).toBe('CGU : Article 3');
  });
});

describe('restauration', () => {
  it('un article revient à l’identique, et retrouve ses commentaires restés en place', async () => {
    const avant = await ligne('articles', ARTICLE);
    const { id_corbeille } = await mettre('articles', ARTICLE);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat).toMatchObject({ table: 'articles', id_origine: ARTICLE, titre: 'Le franc CFA', slug: 'franc-cfa', remis: {}, remarques: [] });
    expect(await ligne('articles', ARTICLE)).toEqual(avant);
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('un commentaire modéré pendant le séjour en corbeille ne revient pas', async () => {
    const { id_corbeille } = await mettre('articles', ARTICLE);
    // La modération supprime le commentaire (et sa réponse, en cascade) et le second.
    await db.exec(`delete from public.comments where id in ('${COMMENTAIRE}', '${COMMENTAIRE_2}')`);

    await restaurer(String(id_corbeille));

    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(0);
  });

  it('une leçon revient avec ses étapes et la progression de ses lecteurs, à l’identique', async () => {
    const lecon = await ligne('education_lessons', LECON);
    const etapes = await lignes('select to_jsonb(s) as j from public.learning_path_steps s order by id');
    const progressions = await lignes('select to_jsonb(p) as j from public.user_lesson_progress p order by lesson_id, user_id');
    const { id_corbeille } = await mettre('education_lessons', LECON);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remis).toEqual({ learning_path_steps: 2, user_lesson_progress: 2 });
    expect(await ligne('education_lessons', LECON)).toEqual(lecon);
    expect(await lignes('select to_jsonb(s) as j from public.learning_path_steps s order by id')).toEqual(etapes);
    expect(await lignes('select to_jsonb(p) as j from public.user_lesson_progress p order by lesson_id, user_id')).toEqual(progressions);
  });

  it('une catégorie revient avec toutes ses leçons, leurs étapes et leurs progressions, à l’identique', async () => {
    const instantane = async () => ({
      categories: await lignes('select to_jsonb(c) as j from public.education_categories c order by id'),
      lecons: await lignes('select to_jsonb(l) as j from public.education_lessons l order by id'),
      etapes: await lignes('select to_jsonb(s) as j from public.learning_path_steps s order by id'),
      progressions: await lignes('select to_jsonb(p) as j from public.user_lesson_progress p order by lesson_id, user_id'),
    });
    const avant = await instantane();
    const { id_corbeille } = await mettre('education_categories', CATEGORIE);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remis).toEqual({ education_lessons: 2, learning_path_steps: 3, user_lesson_progress: 3 });
    expect(await instantane()).toEqual(avant);
  });

  it('tout ou rien : un conflit sur une seule leçon laisse la catégorie dans la corbeille, intacte', async () => {
    const { id_corbeille } = await mettre('education_categories', CATEGORIE);
    const entreeAvant = await entreeDe('education_categories', CATEGORIE);
    // Une leçon d'une autre catégorie a pris, entre-temps, l'identifiant d'une des leçons gardées.
    await db.exec(`insert into public.education_lessons (id, category_id, title) values ('${LECON_2}', '${AUTRE_CATEGORIE}', 'Intruse')`);

    const erreur = await erreurDe(restaurer(String(id_corbeille)));

    expect(erreur.code).toBe('23505');
    expect(await ligne('education_categories', CATEGORIE)).toBeNull();
    expect(await ligne('education_lessons', LECON)).toBeNull();
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id = '${LECON}'`)).toBe(0);
    expect(await entreeDe('education_categories', CATEGORIE)).toEqual(entreeAvant);
  });

  it('une leçon dont la catégorie est à la corbeille : refusée, en nommant la catégorie', async () => {
    const lecon = await mettre('education_lessons', LECON);
    await mettre('education_categories', CATEGORIE);

    const { code, detail } = await refus(restaurer(String(lecon.id_corbeille)));

    expect(code).toBe('categorie_absente');
    expect(detail).toMatchObject({ titre: 'Le PER', table: 'education_lessons', categorie_en_corbeille: true, categorie: 'Bourse' });
    expect(await ligne('education_lessons', LECON)).toBeNull();
    expect(await entreeDe('education_lessons', LECON)).toBeDefined();
  });

  it('une leçon dont la catégorie a disparu pour de bon : refusée, sans rien écrire', async () => {
    const lecon = await mettre('education_lessons', LECON);
    const categorie = await mettre('education_categories', CATEGORIE);
    await db.exec(`delete from public.contenus_supprimes where id = '${String(categorie.id_corbeille)}'`);

    const { code, detail } = await refus(restaurer(String(lecon.id_corbeille)));

    expect(code).toBe('categorie_absente');
    expect(detail.categorie_en_corbeille).toBe(false);
  });

  it('refuse quand le même identifiant est déjà en place, sans rien écrire', async () => {
    const { id_corbeille } = await mettre('articles', ARTICLE);
    await db.exec(`insert into public.articles (id, title, slug, category) values ('${ARTICLE}', 'Recréé', 'recree', 'economie')`);

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('id_pris');
    expect(detail).toEqual({ titre: 'Le franc CFA', table: 'articles' });
    expect((await ligne('articles', ARTICLE))?.title).toBe('Recréé');
    expect(await entreeDe('articles', ARTICLE)).toBeDefined();
  });

  it('refuse un lien déjà pris, en nommant qui le tient', async () => {
    const { id_corbeille } = await mettre('articles', ARTICLE);
    await db.exec(`insert into public.articles (id, title, slug, category) values ('${uuid(202)}', 'Le nouveau franc', 'franc-cfa', 'economie')`);

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('slug_pris');
    expect(detail).toEqual({ titre: 'Le franc CFA', table: 'articles', slug: 'franc-cfa', autre: 'Le nouveau franc' });
    expect(await ligne('articles', ARTICLE)).toBeNull();
  });

  it('une seule entrée par contenu : supprimé, restauré, modifié, supprimé à nouveau, c’est la dernière version qui revient', async () => {
    const premiere = await mettre('articles', ARTICLE);
    await restaurer(String(premiere.id_corbeille));
    await db.exec(`update public.articles set title = 'Le franc CFA, version 2', body = '<p>v2</p>' where id = '${ARTICLE}'`);
    const v2 = await ligne('articles', ARTICLE);
    const seconde = await mettre('articles', ARTICLE);

    expect(await nombre(`select count(*) as n from public.contenus_supprimes where id_origine = '${ARTICLE}'`)).toBe(1);
    expect((await refus(restaurer(String(premiere.id_corbeille)))).code).toBe('entree_introuvable');
    await restaurer(String(seconde.id_corbeille));
    expect(await ligne('articles', ARTICLE)).toEqual(v2);
  });

  it('un double clic sur « Remettre en place » ne restaure qu’une fois', async () => {
    const { id_corbeille } = await mettre('articles', ARTICLE);
    await restaurer(String(id_corbeille));
    expect((await refus(restaurer(String(id_corbeille)))).code).toBe('entree_introuvable');
    expect(await nombre(`select count(*) as n from public.articles where id = '${ARTICLE}'`)).toBe(1);
  });

  it('la progression d’un lecteur dont le compte n’existe plus ne revient pas, ni celle d’un compte effacé en douceur', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    await db.exec(`delete from auth.users where id = '${LECTEUR}'`);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remis).toEqual({ learning_path_steps: 2, user_lesson_progress: 1 });
    expect(resultat.remarques).toEqual([{ code: 'progressions_ecartees', nombre: 1 }]);
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where user_id = '${LECTEUR}'`)).toBe(0);

    const encore = await mettre('education_lessons', LECON);
    await db.exec(`update auth.users set deleted_at = now() where id = '${LECTRICE}'`);
    const second = await restaurer(String(encore.id_corbeille));
    expect(second.remis).toEqual({ learning_path_steps: 2 });
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id = '${LECON}'`)).toBe(0);
  });

  it('une valeur qui n’est pas un identifiant ne fait pas échouer la restauration : la ligne est écartée', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    await db.exec(`update public.contenus_supprimes
      set dependants = jsonb_set(dependants, '{user_lesson_progress,0,user_id}', '"pas-un-uuid"')
      where id = '${String(id_corbeille)}'`);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remis).toEqual({ learning_path_steps: 2, user_lesson_progress: 1 });
  });

  it('les étapes d’un parcours supprimé entre-temps ne reviennent pas', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    await db.exec(`delete from public.learning_paths where id = '${AUTRE_PARCOURS}'`);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remis).toEqual({ learning_path_steps: 1, user_lesson_progress: 2 });
    expect(resultat.remarques).toEqual([{ code: 'etapes_ecartees', nombre: 1 }]);
  });

  it('un événement d’envoi revient sans son abonné quand celui-ci a été supprimé', async () => {
    await db.exec(`insert into public.newsletter_events (id, issue_id, subscriber_id, event_type, meta) values
      ('${uuid(520)}', '${NUMERO}', '${ABONNE}', 'delivered', '{"resend_id": "re_1"}')`);
    const { id_corbeille } = await mettre('newsletter_issues', NUMERO);
    await db.exec(`delete from public.newsletter_subscribers where id = '${ABONNE}'`);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remarques).toEqual([{ code: 'abonnes_vides', nombre: 1 }]);
    expect(await un(`select subscriber_id, meta from public.newsletter_events where id = '${uuid(520)}'`)).toEqual({
      subscriber_id: null,
      meta: { resend_id: 're_1' },
    });
  });

  it('un numéro programmé revient en brouillon : aucun envoi ne part tout seul', async () => {
    await db.exec(`update public.newsletter_issues set status = 'scheduled', scheduled_at = '2026-11-02 07:00:00+00' where id = '${NUMERO}'`);
    const { id_corbeille } = await mettre('newsletter_issues', NUMERO);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remarques).toEqual([{ code: 'programme_en_brouillon' }]);
    expect((await ligne('newsletter_issues', NUMERO))?.status).toBe('draft');
  });

  it('une entrée « sending » (écrite avant la règle) revient en brouillon, avec un avertissement', async () => {
    const { id_corbeille } = await mettre('newsletter_issues', NUMERO);
    await db.exec(`update public.contenus_supprimes set donnees = jsonb_set(donnees, '{status}', '"sending"') where id = '${String(id_corbeille)}'`);

    const resultat = await restaurer(String(id_corbeille));

    expect(resultat.remarques).toEqual([{ code: 'envoi_interrompu_en_brouillon' }]);
    expect((await ligne('newsletter_issues', NUMERO))?.status).toBe('draft');
  });

  it('un brouillon jamais envoyé dont le numéro a été repris reçoit un numéro neuf, du déclencheur, et un lien recalculé', async () => {
    await db.exec(`insert into public.newsletter_issues (id, number, slug, subject, content, status) values ('${uuid(502)}', 8, '008-precedent', 'Le numéro 8', '{}', 'sent')`);
    const { id_corbeille } = await mettre('newsletter_issues', NUMERO);
    // Le brouillon suivant reprend le numéro 9 : le plus grand (8), plus un.
    await db.exec(`insert into public.newsletter_issues (id, slug, subject, content) values ('${uuid(501)}', '009-nouveau', 'Nouveau numéro', '{}')`);
    expect((await ligne('newsletter_issues', uuid(501)))?.number).toBe(9);

    const resultat = await restaurer(String(id_corbeille));

    const restaure = await ligne('newsletter_issues', NUMERO);
    expect(restaure).toMatchObject({ number: 10, slug: autoSlug(10, 'L’or et la BRVM'), status: 'draft' });
    expect(restaure?.slug).toBe('010-l-or-et-la');
    expect(restaure?.content).toEqual({ number: 10, slug: '010-l-or-et-la', intro: { heading: 'Or' } });
    expect(resultat.remarques).toEqual([{ code: 'numero_change', ancien: 9, nouveau: 10, autre: 'Nouveau numéro' }]);
    expect(resultat.slug).toBe('010-l-or-et-la');
  });

  it('le lien recalculé est celui que donnerait autoSlug, accents, ponctuation et longueur compris', async () => {
    const sujets = [
      'Été 2026 : l’or flambe à Niamey !',
      'ÉCONOMIE / Les 5 chiffres clés de la semaine',
      '   ',
      'Œuvre, Ça & Là : déjà vu ?',
      'UEMOA',
    ];
    for (const [rang, sujet] of sujets.entries()) {
      const id = uuid(600 + rang);
      await db.exec(`insert into public.newsletter_issues (id, slug, subject, content) values ('${id}', 'brouillon-${rang}', $$${sujet}$$, '{}')`);
      const { id_corbeille } = await mettre('newsletter_issues', id);
      const numero = (await entreeDe('newsletter_issues', id))?.donnees as Json;
      await db.exec(`insert into public.newsletter_issues (id, number, slug, subject, content) values ('${uuid(700 + rang)}', ${Number(numero.number)}, 'occupe-${rang}', 'Occupant', '{}')`);
      await restaurer(String(id_corbeille));
      const restaure = await ligne('newsletter_issues', id);
      expect(restaure?.slug, sujet).toBe(autoSlug(Number(restaure?.number), sujet));
    }
  });

  it('un numéro déjà parti, même en partie, ne change pas de numéro : refus', async () => {
    await db.exec(`insert into public.newsletter_events (id, issue_id, subscriber_id, event_type, meta) values
      ('${uuid(520)}', '${NUMERO}', '${ABONNE}', 'delivered', '{"resend_id": "re_1"}');
      insert into public.newsletter_issues (id, number, slug, subject, content, status) values ('${uuid(502)}', 8, '008-precedent', 'Le numéro 8', '{}', 'sent')`);
    const { id_corbeille } = await mettre('newsletter_issues', NUMERO);
    await db.exec(`insert into public.newsletter_issues (id, slug, subject, content) values ('${uuid(501)}', '009-nouveau', 'Nouveau numéro', '{}')`);

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('numero_pris');
    expect(detail).toMatchObject({ numero: 9, autre: 'Nouveau numéro', titre: 'N°\u00a09 · L’or et la BRVM' });
    expect(await ligne('newsletter_issues', NUMERO)).toBeNull();
  });

  it('un article à la une revient sans la une quand un autre l’a prise ; une entreprise aussi, malgré l’index unique', async () => {
    await db.exec(`update public.articles set is_featured = true where id = '${ARTICLE}'`);
    const article = await mettre('articles', ARTICLE);
    const entreprise = await mettre('strategic_enterprises', ENTREPRISE);
    await db.exec(`update public.strategic_enterprises set is_featured = true where id = '${ENTREPRISE_2}'`);

    const a = await restaurer(String(article.id_corbeille));
    const e = await restaurer(String(entreprise.id_corbeille));

    expect(a.remarques).toEqual([{ code: 'a_la_une_retiree', autre: 'La BRVM en octobre' }]);
    expect(e.remarques).toEqual([{ code: 'a_la_une_retiree', autre: 'ORANO Mining' }]);
    expect((await ligne('articles', ARTICLE))?.is_featured).toBe(false);
    expect((await ligne('strategic_enterprises', ENTREPRISE))?.is_featured).toBe(false);
  });

  it('une colonne ajoutée à la table depuis la suppression prend sa valeur par défaut', async () => {
    const { id_corbeille } = await mettre('legal_sections', SECTION);
    await db.exec(`alter table public.legal_sections add column visible boolean not null default true`);

    await restaurer(String(id_corbeille));

    expect((await ligne('legal_sections', SECTION))?.visible).toBe(true);
  });

  it('une colonne renommée depuis la suppression : refus, rien n’est remis, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('articles', ARTICLE);
    const entreeAvant = await entreeDe('articles', ARTICLE);
    // Sans ce refus, l'article revenait avec un corps vide, et sa seule copie
    // quittait la corbeille.
    await db.exec('alter table public.articles rename column body to corps');

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('colonnes_inconnues');
    expect(detail).toEqual({ titre: 'Le franc CFA', table: 'articles', table_touchee: 'articles', colonnes: ['body'] });
    expect(await ligne('articles', ARTICLE)).toBeNull();
    expect(await entreeDe('articles', ARTICLE)).toEqual(entreeAvant);
  });

  it('une colonne supprimée d’une table liée : toute la restauration est refusée, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('education_categories', CATEGORIE);
    const entreeAvant = await entreeDe('education_categories', CATEGORIE);
    await db.exec('alter table public.user_lesson_progress drop column quiz_score');

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('colonnes_inconnues');
    expect(detail).toEqual({ titre: 'Bourse', table: 'education_categories', table_touchee: 'user_lesson_progress', colonnes: ['quiz_score'] });
    expect(await ligne('education_categories', CATEGORIE)).toBeNull();
    expect(await nombre(`select count(*) as n from public.education_lessons where category_id = '${CATEGORIE}'`)).toBe(0);
    expect(await entreeDe('education_categories', CATEGORIE)).toEqual(entreeAvant);
  });

  it('un déclencheur BEFORE INSERT qui écarte une progression sans erreur : refus avant toute écriture, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    const entreeAvant = await entreeDe('education_lessons', LECON);
    await db.exec(`create function public.ecarter() returns trigger language plpgsql as $$
        begin if new.user_id = '${LECTEUR}' then return null; end if; return new; end $$;
      create trigger ecarter before insert on public.user_lesson_progress for each row execute function public.ecarter();`);

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('declencheur_inconnu');
    expect(detail).toEqual({
      titre: 'Le PER',
      table: 'education_lessons',
      table_touchee: 'user_lesson_progress',
      declencheurs: ['déclencheur public.user_lesson_progress (ecarter)'],
    });
    expect(await ligne('education_lessons', LECON)).toBeNull();
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(0);
    expect(await entreeDe('education_lessons', LECON)).toEqual(entreeAvant);
  });

  it('une règle DO INSTEAD NOTHING qui écarte le contenu lui-même : refus, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('legal_sections', SECTION);
    const entreeAvant = await entreeDe('legal_sections', SECTION);
    await db.exec('create rule ignorer as on insert to public.legal_sections do instead nothing');

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('declencheur_inconnu');
    expect(detail).toEqual({
      titre: 'CGU : Article 3',
      table: 'legal_sections',
      table_touchee: 'legal_sections',
      declencheurs: ['règle public.legal_sections (ignorer)'],
    });
    expect(await entreeDe('legal_sections', SECTION)).toEqual(entreeAvant);
  });

  it('une colonne générée n’est pas une colonne inconnue : la base la recalcule, rien n’est perdu', async () => {
    await db.exec('alter table public.legal_sections add column longueur integer generated always as (length(text)) stored');
    const avant = await ligne('legal_sections', SECTION);
    const { id_corbeille } = await mettre('legal_sections', SECTION);
    expect((await entreeDe('legal_sections', SECTION))?.donnees).toHaveProperty('longueur');

    await restaurer(String(id_corbeille));

    expect(await ligne('legal_sections', SECTION)).toEqual(avant);
  });
});

/**
 * Les déclencheurs non internes des tables de la réplique, tels que relevés
 * en production, en lecture seule (BEGIN READ ONLY), le 3 novembre 2026 :
 * table, nom, moment, niveau, événements, état, fonction et empreinte md5 du
 * corps de la fonction. Aucune règle (pg_rewrite) sur ces tables.
 */
const DECLENCHEURS_PRODUCTION = [
  ['articles', 'articles_updated_at', 'BEFORE', 'ROW', 'UPDATE', 'O', 'public.update_articles_updated_at', '301A884953D37769916294BB60562E05'],
  ['learning_paths', 'trg_learning_paths_updated_at', 'BEFORE', 'ROW', 'UPDATE', 'O', 'public.set_updated_at', '9B1889F56258BF9D6554213C05019C76'],
  ['newsletter_issues', 'newsletter_issues_assign_number', 'BEFORE', 'ROW', 'INSERT', 'O', 'public.newsletter_issues_assign_number', 'FDDE29B529589DA9137107DC786ACE08'],
  ['newsletter_issues', 'newsletter_issues_set_updated_at', 'BEFORE', 'ROW', 'UPDATE', 'O', 'public.newsletter_set_updated_at', '602FD0DB87282E9F18696BD3CAAE794D'],
  ['newsletter_subscribers', 'newsletter_subscribers_set_updated_at', 'BEFORE', 'ROW', 'UPDATE', 'O', 'public.newsletter_set_updated_at', '602FD0DB87282E9F18696BD3CAAE794D'],
  ['user_lesson_progress', 'trg_user_lesson_progress_updated_at', 'BEFORE', 'ROW', 'UPDATE', 'O', 'public.set_updated_at', '9B1889F56258BF9D6554213C05019C76'],
];

describe('restauration : ce qu’un déclencheur ou une règle ferait de la copie', () => {
  /** Empreinte exacte d'une entrée : la moindre modification la change. */
  async function empreinteDe(entree: string): Promise<string> {
    return (await un<{ h: string }>('select md5(c::text) as h from public.contenus_supprimes c where c.id = $1', [entree]))?.h ?? 'absente';
  }

  it('F2 a : un déclencheur BEFORE INSERT qui vide le corps de l’article : refus, entrée identique, rien d’écrit ; sans lui, l’article revient intact', async () => {
    const avant = await ligne('articles', ARTICLE);
    const entree = String((await mettre('articles', ARTICLE)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    await db.exec(`create function public.vider_corps() returns trigger language plpgsql as $$ begin new.body := ''; return new; end $$;
      create trigger vider_corps before insert on public.articles for each row execute function public.vider_corps();`);

    const { code, detail } = await refus(restaurer(entree));

    expect(code).toBe('declencheur_inconnu');
    expect(detail).toEqual({
      titre: 'Le franc CFA',
      table: 'articles',
      table_touchee: 'articles',
      declencheurs: ['déclencheur public.articles (vider_corps)'],
    });
    expect(await empreinteDe(entree)).toBe(empreinte);
    expect(await ligne('articles', ARTICLE)).toBeNull();
    expect(await nombre(`select count(*) as n from public.comments where article_id = '${ARTICLE}'`)).toBe(3);

    await db.exec('drop trigger vider_corps on public.articles');
    await restaurer(entree);
    expect(await ligne('articles', ARTICLE)).toEqual(avant);
    expect(await empreinteDe(entree)).toBe('absente');
  });

  it('F2 b : un déclencheur BEFORE INSERT qui efface la note d’une lectrice : toute la leçon est refusée, rien d’écrit ; sans lui, la note revient', async () => {
    const progressions = () => lignes(`select to_jsonb(p) as j from public.user_lesson_progress p where lesson_id = '${LECON}' order by user_id`);
    const avant = await progressions();
    expect(avant.map((p) => p.quiz_score)).toEqual([80, null]);
    const entree = String((await mettre('education_lessons', LECON)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    await db.exec(`create function public.oublier_note() returns trigger language plpgsql as $$ begin new.quiz_score := null; return new; end $$;
      create trigger oublier_note before insert on public.user_lesson_progress for each row execute function public.oublier_note();`);

    const { code, detail } = await refus(restaurer(entree));

    expect(code).toBe('declencheur_inconnu');
    expect(detail).toEqual({
      titre: 'Le PER',
      table: 'education_lessons',
      table_touchee: 'user_lesson_progress',
      declencheurs: ['déclencheur public.user_lesson_progress (oublier_note)'],
    });
    expect(await empreinteDe(entree)).toBe(empreinte);
    expect(await ligne('education_lessons', LECON)).toBeNull();
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(0);
    expect(await progressions()).toEqual([]);

    await db.exec('drop trigger oublier_note on public.user_lesson_progress');
    expect((await restaurer(entree)).remis).toEqual({ learning_path_steps: 2, user_lesson_progress: 2 });
    expect(await progressions()).toEqual(avant);
  });

  it('F2 c : une règle ON INSERT DO INSTEAD qui détourne la ligne vers une autre table : refus, rien n’y arrive ; sans elle, la section revient', async () => {
    const avant = await ligne('legal_sections', SECTION);
    const entree = String((await mettre('legal_sections', SECTION)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    await db.exec(`create table public.ailleurs (like public.legal_sections);
      create rule detour as on insert to public.legal_sections do instead insert into public.ailleurs values (new.*);`);

    const { code, detail } = await refus(restaurer(entree));

    expect(code).toBe('declencheur_inconnu');
    expect(detail).toEqual({
      titre: 'CGU : Article 3',
      table: 'legal_sections',
      table_touchee: 'legal_sections',
      declencheurs: ['règle public.legal_sections (detour)'],
    });
    expect(await empreinteDe(entree)).toBe(empreinte);
    expect(await nombre('select count(*) as n from public.ailleurs')).toBe(0);
    expect(await ligne('legal_sections', SECTION)).toBeNull();

    await db.exec('drop rule detour on public.legal_sections');
    await restaurer(entree);
    expect(await ligne('legal_sections', SECTION)).toEqual(avant);
    expect(await nombre('select count(*) as n from public.ailleurs')).toBe(0);
  });

  it('tout déclencheur d’insertion actif compte : après l’insertion, par instruction, ENABLE REPLICA ou ALWAYS ; désactivé, il ne fait rien', async () => {
    const entree = String((await mettre('strategic_enterprises', ENTREPRISE_2)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    // Il supprimerait la fiche juste après l'avoir laissée entrer : le compte de lignes serait juste.
    await db.exec(`create function public.retirer_fiche() returns trigger language plpgsql as $$
        begin delete from public.strategic_enterprises where slug = 'orano'; return null; end $$;
      create trigger retirer_fiche after insert on public.strategic_enterprises for each statement execute function public.retirer_fiche();`);

    for (const etat of [
      null,
      'alter table public.strategic_enterprises enable replica trigger retirer_fiche',
      'alter table public.strategic_enterprises enable always trigger retirer_fiche',
    ]) {
      if (etat) await db.exec(etat);
      const { code, detail } = await refus(restaurer(entree));
      expect(code, etat ?? 'activé').toBe('declencheur_inconnu');
      expect(detail.declencheurs).toEqual(['déclencheur public.strategic_enterprises (retirer_fiche)']);
      expect(await empreinteDe(entree)).toBe(empreinte);
    }

    await db.exec('alter table public.strategic_enterprises disable trigger retirer_fiche');
    await restaurer(entree);
    expect((await ligne('strategic_enterprises', ENTREPRISE_2))?.name).toBe('ORANO Mining');
  });

  it('un déclencheur admis n’est admis qu’avec sa fonction et le corps relu : réécrit ou remplacé, il est refusé', async () => {
    const entree = String((await mettre('newsletter_issues', NUMERO)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    const origine = /CREATE OR REPLACE FUNCTION public\.newsletter_issues_assign_number\(\)[\s\S]*?\$function\$;/.exec(REPLIQUE)?.[0] ?? '';
    expect(origine).toContain('if new.number is null then');

    // Même déclencheur, même fonction, corps réécrit : il renumérote toute copie.
    await db.exec(origine.replace('if new.number is null then', 'if true then'));
    const reecrit = await refus(restaurer(entree));
    expect(reecrit.code).toBe('declencheur_inconnu');
    expect(reecrit.detail.declencheurs).toEqual(['déclencheur public.newsletter_issues (newsletter_issues_assign_number)']);
    expect(await empreinteDe(entree)).toBe(empreinte);

    // Le corps relu, remis tel quel, sous une autre fonction : refusé aussi.
    await db.exec(`${origine}
      ${origine.replace('public.newsletter_issues_assign_number()', 'public.autre_numero()')}
      drop trigger newsletter_issues_assign_number on public.newsletter_issues;
      create trigger newsletter_issues_assign_number before insert on public.newsletter_issues for each row execute function public.autre_numero();`);
    expect((await refus(restaurer(entree))).code).toBe('declencheur_inconnu');
    expect(await empreinteDe(entree)).toBe(empreinte);

    // Le déclencheur de la production, rétabli : la restauration passe, numéro intact.
    await db.exec(`drop trigger newsletter_issues_assign_number on public.newsletter_issues;
      create trigger newsletter_issues_assign_number before insert on public.newsletter_issues for each row execute function public.newsletter_issues_assign_number();`);
    expect((await restaurer(entree)).remarques).toEqual([]);
    expect((await ligne('newsletter_issues', NUMERO))?.number).toBe(9);
  });

  it('la renumérotation, seule écriture par UPDATE, a le même filet ; sans renumérotation, rien n’est écrit par UPDATE', async () => {
    const entree = String((await mettre('newsletter_issues', NUMERO)).id_corbeille);
    const empreinte = await empreinteDe(entree);
    // Le numéro 9 est repris pendant le séjour en corbeille : la restauration renumérote.
    await db.exec(`insert into public.newsletter_issues (id, number, slug, subject, content) values ('${uuid(501)}', 9, '009-nouveau', 'Nouveau numéro', '{}');
      create function public.vider_sujet() returns trigger language plpgsql as $$ begin new.subject := ''; return new; end $$;
      create trigger vider_sujet before update on public.newsletter_issues for each row execute function public.vider_sujet();`);

    expect(await refus(restaurer(entree))).toEqual({
      code: 'declencheur_inconnu',
      detail: {
        titre: 'N° 9 · L’or et la BRVM',
        table: 'newsletter_issues',
        table_touchee: 'newsletter_issues',
        declencheurs: ['déclencheur public.newsletter_issues (vider_sujet)'],
      },
    });
    expect(await ligne('newsletter_issues', NUMERO)).toBeNull();
    expect(await empreinteDe(entree)).toBe(empreinte);

    // Une règle ON UPDATE qui écarterait la renumérotation : même refus.
    await db.exec(`drop trigger vider_sujet on public.newsletter_issues;
      create rule figer as on update to public.newsletter_issues do instead nothing;`);
    const regle = await refus(restaurer(entree));
    expect(regle.code).toBe('declencheur_inconnu');
    expect(regle.detail.declencheurs).toEqual(['règle public.newsletter_issues (figer)']);
    expect(await empreinteDe(entree)).toBe(empreinte);

    // Le numéro 9 libéré : plus de renumérotation, donc aucun UPDATE, et la règle ne gêne rien.
    await db.exec(`delete from public.newsletter_issues where id = '${uuid(501)}'`);
    expect((await restaurer(entree)).remarques).toEqual([]);
    expect(await ligne('newsletter_issues', NUMERO)).toMatchObject({ number: 9, slug: '009-or-brvm', subject: 'L’or et la BRVM' });
  });

  it('la restauration n’écrit par UPDATE que dans newsletter_issues, et n’insère que par corbeille_inserer', () => {
    const code = (fonction: string) => {
      const debut = MIGRATION.indexOf(`CREATE OR REPLACE FUNCTION public.${fonction}(`);
      expect(debut, fonction).toBeGreaterThan(0);
      return MIGRATION.slice(debut, MIGRATION.indexOf('$fonction$;', debut))
        .split('\n')
        .filter((ligne) => !ligne.trim().startsWith('--'))
        .join('\n');
    };
    const misesAJour = (texte: string) => [...texte.matchAll(/\bUPDATE\s+(public\.\w+)/gi)].map((m) => m[1]);
    expect(misesAJour(code('corbeille_restaurer'))).toEqual(['public.newsletter_issues']);
    expect(misesAJour(code('corbeille_inserer'))).toEqual([]);
    expect([...code('corbeille_restaurer').matchAll(/\bINSERT\s+INTO\b/gi)]).toHaveLength(0);
  });

  it('la réplique porte exactement les déclencheurs de la production, et aucun ne bloque la restauration des six types de contenu', async () => {
    const declencheurs = await db.query<Record<string, string>>(
      `select c.relname as table_name, t.tgname,
              case when t.tgtype & 2 <> 0 then 'BEFORE' when t.tgtype & 64 <> 0 then 'INSTEAD OF' else 'AFTER' end as moment,
              case when t.tgtype & 1 <> 0 then 'ROW' else 'STATEMENT' end as niveau,
              concat_ws(' OR ', case when t.tgtype & 4 <> 0 then 'INSERT' end, case when t.tgtype & 8 <> 0 then 'DELETE' end,
                case when t.tgtype & 16 <> 0 then 'UPDATE' end, case when t.tgtype & 32 <> 0 then 'TRUNCATE' end) as evenements,
              t.tgenabled::text as etat, nf.nspname || '.' || p.proname as fonction, upper(md5(p.prosrc)) as empreinte
         from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_proc p on p.oid = t.tgfoid
         join pg_namespace nf on nf.oid = p.pronamespace
        where not t.tgisinternal and c.relnamespace = 'public'::regnamespace
        order by c.relname, t.tgname`,
    );
    expect(declencheurs.rows.map((d) => Object.values(d))).toEqual(DECLENCHEURS_PRODUCTION);
    expect(await nombre(`select count(*) as n from pg_rewrite r join pg_class c on c.oid = r.ev_class where c.relnamespace = 'public'::regnamespace`)).toBe(0);

    // Un contenu de chaque type part à la corbeille et revient, à l'identique, avec tout ce qui en dépend.
    const tables = ['articles', 'education_categories', 'education_lessons', 'learning_path_steps', 'user_lesson_progress',
      'strategic_enterprises', 'legal_sections', 'newsletter_issues', 'newsletter_events'];
    const instantane = async () => {
      const etat: Record<string, Json[]> = {};
      for (const table of tables) etat[table] = await lignes(`select to_jsonb(x) as j from public.${table} x order by to_jsonb(x)::text`);
      return etat;
    };
    await db.exec(`insert into public.newsletter_events (id, issue_id, subscriber_id, event_type, meta) values
      ('${uuid(520)}', '${NUMERO}', '${ABONNE}', 'delivered', '{"resend_id": "re_1"}')`);
    const avant = await instantane();
    const entrees: string[] = [];
    for (const [table, id] of [
      ['articles', ARTICLE],
      ['education_categories', CATEGORIE],
      ['education_lessons', LECON_AUTRE],
      ['strategic_enterprises', ENTREPRISE],
      ['legal_sections', SECTION],
      ['newsletter_issues', NUMERO],
    ] as const) {
      entrees.push(String((await mettre(table, id)).id_corbeille));
    }
    for (const entree of entrees) expect((await restaurer(entree)).remarques).toEqual([]);
    expect(await instantane()).toEqual(avant);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
  });

  it('la renumérotation passe malgré les deux déclencheurs de la production : le numéro vient de l’un, updated_at de l’autre, rien d’autre ne change', async () => {
    const entree = String((await mettre('newsletter_issues', NUMERO)).id_corbeille);
    const copie = (await entreeDe('newsletter_issues', NUMERO))?.donnees as Json;
    await db.exec(`insert into public.newsletter_issues (id, number, slug, subject, content) values ('${uuid(501)}', 9, '009-nouveau', 'Nouveau numéro', '{}')`);

    const resultat = await restaurer(entree);

    expect(resultat.remarques).toEqual([{ code: 'numero_change', ancien: 9, nouveau: 10, autre: 'Nouveau numéro' }]);
    const remis = (await ligne('newsletter_issues', NUMERO)) as Json;
    expect(remis).toMatchObject({ number: 10, slug: '010-l-or-et-la', content: { number: 10, slug: '010-l-or-et-la', intro: { heading: 'Or' } } });
    expect(Date.parse(String(remis.updated_at))).toBeGreaterThan(Date.parse(String(copie.updated_at)));
    const sauf = (l: Json) => Object.fromEntries(Object.entries(l).filter(([cle]) => !['number', 'slug', 'content', 'updated_at'].includes(cle)));
    expect(sauf(remis)).toEqual(sauf(copie));
  });
});

describe('pannes forcées : tout ou rien', () => {
  const instantane = async () => ({
    categories: await lignes('select to_jsonb(c) as j from public.education_categories c order by id'),
    lecons: await lignes('select to_jsonb(l) as j from public.education_lessons l order by id'),
    etapes: await lignes('select to_jsonb(s) as j from public.learning_path_steps s order by id'),
    progressions: await lignes('select to_jsonb(p) as j from public.user_lesson_progress p order by lesson_id, user_id'),
  });

  it('une panne au moment d’écrire l’entrée : la catégorie et tout ce qui en dépend restent en place, et la relance aboutit', async () => {
    const avant = await instantane();
    await db.exec(`create function public.panne() returns trigger language plpgsql as $$ begin raise exception 'panne simulée'; end $$;
      create trigger panne before insert on public.contenus_supprimes for each row execute function public.panne();`);

    const erreur = await erreurDe(mettre('education_categories', CATEGORIE));

    expect(erreur.message).toBe('panne simulée');
    expect(await instantane()).toEqual(avant);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);

    await db.exec('drop trigger panne on public.contenus_supprimes');
    const resultat = await mettre('education_categories', CATEGORIE);
    expect(resultat.resume).toEqual({ education_lessons: 2, learning_path_steps: 3, user_lesson_progress: 3 });
  });

  it('une panne sur la dernière progression remise : rien n’est remis, l’entrée reste intacte, et la relance remet tout', async () => {
    const avant = await instantane();
    const { id_corbeille } = await mettre('education_categories', CATEGORIE);
    const entreeAvant = await entreeDe('education_categories', CATEGORIE);
    // Les progressions reviennent dans l'ordre de la copie (leçon, puis
    // lecteur) : celle de la seconde leçon est la dernière écrite. La panne
    // vient d'une contrainte CHECK, posée depuis la suppression : un
    // déclencheur serait refusé avant la moindre écriture, et la panne
    // n'aurait plus lieu au milieu de la restauration.
    await db.exec(`alter table public.user_lesson_progress add constraint panne check (lesson_id <> '${LECON_2}')`);

    const erreur = await erreurDe(restaurer(String(id_corbeille)));

    expect(erreur.code).toBe('23514');
    expect(erreur.message).toContain('"panne"');
    expect(await ligne('education_categories', CATEGORIE)).toBeNull();
    expect(await nombre(`select count(*) as n from public.education_lessons where category_id = '${CATEGORIE}'`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id in ('${LECON}', '${LECON_2}')`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id in ('${LECON}', '${LECON_2}')`)).toBe(0);
    expect(await entreeDe('education_categories', CATEGORIE)).toEqual(entreeAvant);

    await db.exec('alter table public.user_lesson_progress drop constraint panne');
    const resultat = await restaurer(String(id_corbeille));
    expect(resultat.remis).toEqual({ education_lessons: 2, learning_path_steps: 3, user_lesson_progress: 3 });
    expect(await instantane()).toEqual(avant);
  });
});

describe('lecteurs et conservation', () => {
  it('corbeille_retirer_lecteur retire d’un coup les lignes d’un lecteur de toutes les entrées, et elles seules', async () => {
    await mettre('education_lessons', LECON);
    await mettre('education_lessons', LECON_AUTRE);

    const resultat = await appeler('corbeille_retirer_lecteur', [LECTRICE]);

    expect(resultat).toEqual({ entrees: 2, lignes: 2 });
    const lecon = await entreeDe('education_lessons', LECON);
    expect(lecon?.lecteurs).toEqual([LECTEUR]);
    expect(lecon?.resume_dependants).toEqual({ learning_path_steps: 2, user_lesson_progress: 1 });
    expect(((lecon?.dependants as Json).user_lesson_progress as Json[]).map((p) => p.user_id)).toEqual([LECTEUR]);
    // Sa seule progression partie, l'autre entrée n'en garde plus aucune trace.
    const autre = await entreeDe('education_lessons', LECON_AUTRE);
    expect(autre?.lecteurs).toEqual([]);
    expect(autre?.dependants).not.toHaveProperty('user_lesson_progress');
    expect(autre?.resume_dependants).toEqual({ learning_path_steps: 1 });
    expect(JSON.stringify(await lignes('select to_jsonb(c) as j from public.contenus_supprimes c'))).not.toContain(LECTRICE);
  });

  it('corbeille_retirer_lecteur sans lecteur ne touche à rien', async () => {
    await mettre('education_lessons', LECON);
    expect(await appeler('corbeille_retirer_lecteur', [null])).toEqual({ entrees: 0, lignes: 0 });
    expect(await appeler('corbeille_retirer_lecteur', [uuid(9999)])).toEqual({ entrees: 0, lignes: 0 });
    expect((await entreeDe('education_lessons', LECON))?.resume_dependants).toEqual({ learning_path_steps: 2, user_lesson_progress: 2 });
  });

  it('corbeille_purger supprime ce qui a plus de trente jours, et rien d’autre', async () => {
    const vieux = await mettre('articles', ARTICLE);
    const recent = await mettre('legal_sections', SECTION);
    await db.exec(`update public.contenus_supprimes set supprime_le = now() - interval '31 days' where id = '${String(vieux.id_corbeille)}';
      update public.contenus_supprimes set supprime_le = now() - interval '29 days' where id = '${String(recent.id_corbeille)}';`);

    const resultat = await appeler('corbeille_purger', [30]);

    expect(resultat).toMatchObject({ duree_jours: 30, lecteurs_retires: 0 });
    expect(resultat.purgees).toEqual([
      expect.objectContaining({ table: 'articles', id_origine: ARTICLE, dependants: {} }),
    ]);
    // Le journal ne reçoit ni titre ni contenu.
    expect(JSON.stringify(resultat)).not.toContain('franc');
    expect(await entreeDe('articles', ARTICLE)).toBeUndefined();
    expect(await entreeDe('legal_sections', SECTION)).toBeDefined();
  });

  it.each([null, 0, 7, 29, -1, 3651, 2147483647])('corbeille_purger(%s) est refusé : la corbeille ne se vide pas par erreur', async (jours) => {
    await mettre('articles', ARTICLE);
    await db.exec(`update public.contenus_supprimes set supprime_le = now() - interval '400 days'`);
    expect((await refus(appeler('corbeille_purger', [jours]))).code).toBe('duree_invalide');
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('corbeille_purger retire aussi les lignes des lecteurs dont le compte a disparu', async () => {
    await mettre('education_lessons', LECON);
    // Le nettoyage à la suppression du compte a échoué : la purge de la nuit rattrape.
    await db.exec(`delete from auth.users where id = '${LECTEUR}'`);

    const resultat = await appeler('corbeille_purger', [30]);

    expect(resultat).toMatchObject({ purgees: [], lecteurs_retires: 1 });
    expect((await entreeDe('education_lessons', LECON))?.lecteurs).toEqual([LECTRICE]);
  });
});

describe('quand un article quitte la corbeille pour de bon, ses commentaires et ses j’aime partent avec lui', () => {
  const commentairesDe = (article: string) => nombre(`select count(*) as n from public.comments where article_id = '${article}'`);
  const jaimeDe = (article: string) => nombre(`select count(*) as n from public.article_likes where article_id = '${article}'`);

  it('une suppression définitive les efface, en une transaction, et seulement les siens', async () => {
    await db.exec(`insert into public.comments (id, article_id, user_id, user_name, content) values ('${uuid(213)}', '${ARTICLE_2}', '${LECTRICE}', 'Lectrice', 'Ailleurs');
      insert into public.article_likes (id, article_id, user_id) values ('${uuid(221)}', '${ARTICLE_2}', '${LECTRICE}');`);
    const { id_corbeille } = await mettre('articles', ARTICLE);
    // Pendant le séjour dans la corbeille : tout reste, pour le retour de l'article.
    expect(await commentairesDe(ARTICLE)).toBe(3);
    expect(await jaimeDe(ARTICLE)).toBe(1);

    const resultat = await appeler('corbeille_vider', [id_corbeille]);

    expect(resultat).toEqual({ table: 'articles', id_origine: ARTICLE, titre: 'Le franc CFA', commentaires: 3, jaime: 1 });
    expect(await commentairesDe(ARTICLE)).toBe(0);
    expect(await jaimeDe(ARTICLE)).toBe(0);
    expect(await commentairesDe(ARTICLE_2)).toBe(1);
    expect(await jaimeDe(ARTICLE_2)).toBe(1);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(0);
    // Une seconde fois : l'entrée n'y est plus.
    expect((await refus(appeler('corbeille_vider', [id_corbeille]))).code).toBe('entree_introuvable');
  });

  it('ceux enregistrés avec un identifiant en majuscules partent aussi, au vidage comme à la purge, et seulement ceux-là', async () => {
    // Des identifiants avec des lettres : ceux des autres tests n'ont que des chiffres.
    const A = 'abcdef00-0000-4000-8000-0000000000aa';
    const B = 'abcdef00-0000-4000-8000-0000000000bb';
    await db.exec(`insert into public.articles (id, title, slug, category) values
        ('${A}', 'Lettres A', 'lettres-a', 'economie'), ('${B}', 'Lettres B', 'lettres-b', 'finance');
      insert into public.comments (id, article_id, user_id, user_name, content) values
        ('${uuid(213)}', upper('${A}'), '${LECTRICE}', 'Lectrice', 'Majuscules'),
        ('${uuid(214)}', 'ABCdef00-0000-4000-8000-0000000000Aa', '${LECTEUR}', 'Lecteur', 'Casse mêlée'),
        ('${uuid(215)}', upper('${B}'), '${LECTEUR}', 'Lecteur', 'Autre article');
      insert into public.article_likes (id, article_id, user_id) values
        ('${uuid(222)}', upper('${A}'), '${LECTRICE}'), ('${uuid(223)}', upper('${B}'), '${LECTRICE}');`);

    const a = await mettre('articles', A);
    expect(await appeler('corbeille_vider', [a.id_corbeille])).toMatchObject({ commentaires: 2, jaime: 1 });
    expect(await nombre(`select count(*) as n from public.comments where id in ('${uuid(213)}', '${uuid(214)}')`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.article_likes where id = '${uuid(222)}'`)).toBe(0);
    // Ceux de l'article B, toujours en ligne, ne bougent pas.
    expect(await nombre(`select count(*) as n from public.comments where id = '${uuid(215)}'`)).toBe(1);

    await mettre('articles', B);
    await db.exec(`update public.contenus_supprimes set supprime_le = now() - interval '40 days' where id_origine = '${B}'`);
    expect(await appeler('corbeille_purger', [30])).toMatchObject({ commentaires_supprimes: 1, jaime_supprimes: 1 });
    expect(await nombre(`select count(*) as n from public.comments where id = '${uuid(215)}'`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.article_likes where id = '${uuid(223)}'`)).toBe(0);
    // Les commentaires et le j'aime des autres articles restent.
    expect(await commentairesDe(ARTICLE)).toBe(3);
    expect(await jaimeDe(ARTICLE)).toBe(1);
  });

  it('vider une leçon ne touche à aucun commentaire', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    expect(await appeler('corbeille_vider', [id_corbeille])).toMatchObject({ table: 'education_lessons', commentaires: 0, jaime: 0 });
    expect(await nombre('select count(*) as n from public.comments')).toBe(3);
  });

  it('la purge efface ceux d’un article expiré, mais pas ceux d’un article recréé depuis sous le même identifiant', async () => {
    await mettre('articles', ARTICLE);
    await mettre('articles', ARTICLE_2);
    await db.exec(`insert into public.comments (id, article_id, user_id, user_name, content) values ('${uuid(213)}', '${ARTICLE_2}', '${LECTRICE}', 'Lectrice', 'Sur le recréé');
      insert into public.articles (id, title, slug, category) values ('${ARTICLE_2}', 'Recréé', 'recree', 'finance');
      update public.contenus_supprimes set supprime_le = now() - interval '40 days';`);

    const resultat = await appeler('corbeille_purger', [30]);

    expect(resultat).toMatchObject({ commentaires_supprimes: 3, jaime_supprimes: 1 });
    expect((resultat.purgees as Json[]).map((p) => p.id_origine).sort()).toEqual([ARTICLE, ARTICLE_2]);
    expect(await commentairesDe(ARTICLE)).toBe(0);
    expect(await jaimeDe(ARTICLE)).toBe(0);
    // L'article vivant sous l'identifiant d'ARTICLE_2 garde son commentaire.
    expect(await commentairesDe(ARTICLE_2)).toBe(1);
  });

  it('une entrée encore dans son délai ne fait rien perdre à ses lecteurs', async () => {
    await mettre('articles', ARTICLE);
    const resultat = await appeler('corbeille_purger', [30]);
    expect(resultat).toMatchObject({ purgees: [], commentaires_supprimes: 0, jaime_supprimes: 0 });
    expect(await commentairesDe(ARTICLE)).toBe(3);
  });
});

describe('conservation : la date affichée est celle de la purge', () => {
  /** La purge, à l'instant donné, supprimerait-elle une entrée mise à la corbeille à supprimeLe ? */
  async function purgee(supprimeLe: string, instant: string): Promise<boolean> {
    const r = await un<{ p: boolean }>('select $1::timestamptz < public.corbeille_limite_purge(30, $2::timestamptz) as p', [supprimeLe, instant]);
    return r?.p ?? false;
  }

  it('une entrée mise à la corbeille le 3 novembre à 1 h 30 (Niamey) reste toute la journée du 3 décembre, tâche de 3 h comprise', async () => {
    const supprimeLe = '2026-11-03T00:30:00Z';
    expect(dernierJourRecuperable(supprimeLe)).toBe('2026-12-03');
    const pendantLeDernierJour = [
      '2026-12-02T23:00:00Z', // 3 décembre, 0 h à Niamey
      '2026-12-03T00:00:00Z', // 1 h
      '2026-12-03T00:30:00Z', // 1 h 30 : trente jours pile après la suppression
      '2026-12-03T01:59:59Z', // 2 h 59
      '2026-12-03T02:00:00Z', // 3 h : la tâche de nuit (vercel.json, 0 2 * * *)
      '2026-12-03T11:00:00Z', // midi
      '2026-12-03T22:59:59.999999Z', // 23 h 59 59,999999
    ];
    for (const instant of pendantLeDernierJour) expect(await purgee(supprimeLe, instant), instant).toBe(false);
    expect(await purgee(supprimeLe, '2026-12-03T23:00:00Z'), '4 décembre, 0 h à Niamey').toBe(true);
    expect(await purgee(supprimeLe, '2026-12-04T02:00:00Z'), 'tâche de nuit du 4').toBe(true);
  });

  it('l’écran et la purge comptent les jours de la même façon, à toute heure', async () => {
    const suppressions = [
      '2026-11-02T22:59:59.999Z', // 2 novembre, 23 h 59 à Niamey
      '2026-11-02T23:00:00Z', // 3 novembre, 0 h
      '2026-11-03T00:30:00Z', // 1 h 30
      '2026-11-03T22:59:59Z', // 23 h 59 59
      '2026-02-28T23:30:00Z', // 1er mars, 0 h 30
      '2026-12-31T23:30:00Z', // 1er janvier 2027, 0 h 30
    ];
    let comparaisons = 0;
    for (const supprimeLe of suppressions) {
      const depart = new Date(supprimeLe).getTime();
      // De 29 à 32 jours après, toutes les heures et demie : chaque heure du jour est rejouée.
      for (let minutes = 29 * 24 * 60; minutes <= 32 * 24 * 60; minutes += 90) {
        const instant = new Date(depart + minutes * 60_000).toISOString();
        const selonEcran = (jourANiamey(instant) ?? '') > (dernierJourRecuperable(supprimeLe) ?? '');
        expect(await purgee(supprimeLe, instant), `${supprimeLe} à ${instant}`).toBe(selonEcran);
        comparaisons += 1;
      }
    }
    // Six suppressions, 49 instants chacune : aucune ne diffère.
    expect(comparaisons).toBe(6 * 49);
  });

  it('à l’heure de la base : une entrée dont c’est le dernier jour reste listée, du premier au dernier instant, et celle de la veille part', async () => {
    await mettre('articles', ARTICLE);
    await mettre('legal_sections', SECTION);
    await mettre('strategic_enterprises', ENTREPRISE);
    // Dans une seule transaction : now() est le même pour les dates posées et pour la purge.
    await db.exec('begin');
    try {
      await db.exec(`
        update public.contenus_supprimes
           set supprime_le = ((now() at time zone 'Africa/Niamey')::date - 30)::timestamp at time zone 'Africa/Niamey'
         where id_origine = '${ARTICLE}';
        update public.contenus_supprimes
           set supprime_le = ((now() at time zone 'Africa/Niamey')::date - 29)::timestamp at time zone 'Africa/Niamey' - interval '1 microsecond'
         where id_origine = '${SECTION}';
        update public.contenus_supprimes
           set supprime_le = ((now() at time zone 'Africa/Niamey')::date - 30)::timestamp at time zone 'Africa/Niamey' - interval '1 microsecond'
         where id_origine = '${ENTREPRISE}';`);
      const resultat = await appeler('corbeille_purger', [30]);
      expect(resultat.purgees).toEqual([expect.objectContaining({ table: 'strategic_enterprises', id_origine: ENTREPRISE })]);
    } finally {
      await db.exec('commit');
    }
    // Premier et dernier instant du dernier jour : toujours là, donc toujours listées.
    expect(await entreeDe('articles', ARTICLE)).toBeDefined();
    expect(await entreeDe('legal_sections', SECTION)).toBeDefined();
    expect(await entreeDe('strategic_enterprises', ENTREPRISE)).toBeUndefined();
  });

  it('un lecteur disparu est retiré des entrées qui restent, même quand d’autres expirent dans la même purge', async () => {
    await mettre('education_lessons', LECON);
    await mettre('education_lessons', LECON_AUTRE);
    await db.exec(`update public.contenus_supprimes set supprime_le = now() - interval '40 days' where id_origine = '${LECON_AUTRE}';
      delete from auth.users where id = '${LECTRICE}';`);

    const resultat = await appeler('corbeille_purger', [30]);

    expect(resultat).toMatchObject({ lecteurs_retires: 1 });
    expect(resultat.purgees).toEqual([expect.objectContaining({ table: 'education_lessons', id_origine: LECON_AUTRE })]);
    expect((await entreeDe('education_lessons', LECON))?.lecteurs).toEqual([LECTEUR]);
    expect(JSON.stringify(await lignes('select to_jsonb(c) as j from public.contenus_supprimes c'))).not.toContain(LECTRICE);
  });
});

describe('les enveloppes TypeScript, sur la vraie base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mettent à la corbeille puis remettent en place un article, rafraîchissent ses pages et tiennent le journal', async () => {
    const service = clientDeService(db);

    const mise = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    expect(mise).toMatchObject({ ok: true, titre: 'Le franc CFA', resume: {} });
    expect(revalidateTag).toHaveBeenCalledWith(ARTICLE_CACHE_TAG, { expire: 0 });
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.mise', 'articles', ARTICLE, expect.objectContaining({ titre: 'Le franc CFA' }));

    vi.clearAllMocks();
    const retour = await restaurerDepuisCorbeille(service, mise.ok ? mise.idCorbeille : '', ADMIN);
    expect(retour).toEqual({
      ok: true,
      table: 'articles',
      titre: 'Le franc CFA',
      message: typographieFr('« Le franc CFA » est de nouveau en place.'),
      remarques: [],
    });
    expect(revalidateTag).toHaveBeenCalledWith(ARTICLE_CACHE_TAG, { expire: 0 });
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.restauration', 'articles', ARTICLE, expect.any(Object));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('disent en français ce que la base refuse, sans rien signaler à Sentry', async () => {
    const service = clientDeService(db);
    await db.exec(`update public.newsletter_issues set status = 'sent' where id = '${NUMERO}'`);
    expect(await mettreALaCorbeille(service, 'newsletter_issues', NUMERO, ADMIN)).toEqual({
      ok: false,
      statut: 400,
      inattendu: false,
      motif: typographieFr('Impossible de supprimer un numéro déjà envoyé.'),
    });

    const mise = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    await db.exec(`insert into public.articles (id, title, slug, category) values ('${uuid(202)}', 'Le nouveau franc', 'franc-cfa', 'economie')`);
    const retour = await restaurerDepuisCorbeille(service, mise.ok ? mise.idCorbeille : '', ADMIN);
    expect(retour).toMatchObject({ ok: false, statut: 409 });
    expect(retour.ok ? '' : retour.motif).toBe(
      typographieFr(
        'Impossible de remettre « Le franc CFA » en place : le lien « /articles/franc-cfa » est déjà pris par « Le nouveau franc ». Libérez-le d’abord, en modifiant ou en supprimant « Le nouveau franc », puis recommencez.',
      ),
    );

    const lecon = await mettreALaCorbeille(service, 'education_lessons', LECON, ADMIN);
    await mettreALaCorbeille(service, 'education_categories', CATEGORIE, ADMIN);
    const refusee = await restaurerDepuisCorbeille(service, lecon.ok ? lecon.idCorbeille : '', ADMIN);
    expect(refusee.ok ? '' : refusee.motif).toBe(
      typographieFr(
        'Impossible de remettre « Le PER » en place : sa catégorie « Bourse » est dans la corbeille. Remettez d’abord la catégorie en place, puis cette leçon.',
      ),
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('refusent une restauration qui perdrait une colonne, le disent, et le signalent à Sentry', async () => {
    const service = clientDeService(db);
    const mise = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    await db.exec('alter table public.articles rename column body to corps');

    const retour = await restaurerDepuisCorbeille(service, mise.ok ? mise.idCorbeille : '', ADMIN);

    expect(retour).toMatchObject({ ok: false, statut: 409, inattendu: true });
    expect(retour.ok ? '' : retour.motif).toBe(
      typographieFr(
        'Impossible de remettre « Le franc CFA » en place : depuis sa suppression, la table des articles a perdu la colonne « body », que sa copie remplit encore. Rien n’a été remis en place. L’élément reste dans la corbeille, intact : la table doit d’abord être corrigée.',
      ),
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('refusent une restauration qu’un déclencheur réécrirait, le disent, et le signalent à Sentry sans le contenu', async () => {
    const service = clientDeService(db);
    const mise = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    await db.exec(`create function public.vider_corps() returns trigger language plpgsql as $$ begin new.body := ''; return new; end $$;
      create trigger vider_corps before insert on public.articles for each row execute function public.vider_corps();`);
    vi.clearAllMocks();

    const retour = await restaurerDepuisCorbeille(service, mise.ok ? mise.idCorbeille : '', ADMIN);

    expect(retour).toMatchObject({ ok: false, statut: 409, inattendu: true });
    expect(retour.ok ? '' : retour.motif).toBe(
      typographieFr(
        'Impossible de remettre « Le franc CFA » en place : un déclencheur ou une règle de la table des articles pourrait modifier, détourner ou écarter sans erreur ce qui serait remis en place. Rien n’a été remis en place. L’élément reste dans la corbeille, intact : la base doit d’abord être corrigée.',
      ),
    );
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const envoye = JSON.stringify(vi.mocked(Sentry.captureException).mock.calls);
    expect(envoye).toContain('vider_corps');
    expect(envoye).not.toContain('Texte premium');
    expect(logAuditEvent).not.toHaveBeenCalled();
    expect(await ligne('articles', ARTICLE)).toBeNull();
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('ne transmettent à Sentry ni le corps d’un article premium ni la progression d’un lecteur', async () => {
    const service = clientDeService(db);
    // Une contrainte resserrée depuis la suppression : PostgreSQL met la ligne
    // entière dans DETAIL (« Failing row contains (…) »).
    const article = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    await db.exec(`alter table public.articles drop constraint articles_category_check;
      alter table public.articles add constraint articles_category_check check (category = 'finance') not valid;`);
    const refusArticle = await restaurerDepuisCorbeille(service, article.ok ? article.idCorbeille : '', ADMIN);

    // Une colonne NOT NULL sans défaut, ajoutée depuis : la progression remise la viole.
    const lecon = await mettreALaCorbeille(service, 'education_lessons', LECON, ADMIN);
    await db.exec(`alter table public.user_lesson_progress add column note_exigee integer not null default 0;
      alter table public.user_lesson_progress alter column note_exigee drop default;`);
    const refusLecon = await restaurerDepuisCorbeille(service, lecon.ok ? lecon.idCorbeille : '', ADMIN);

    expect(refusArticle).toMatchObject({ ok: false, statut: 500, inattendu: true });
    expect(refusLecon).toMatchObject({ ok: false, statut: 500, inattendu: true });
    const appels = vi.mocked(Sentry.captureException).mock.calls;
    expect(appels).toHaveLength(2);
    expect(appels[0]?.[1]).toMatchObject({ extra: { code: '23514', contrainte: 'articles_category_check', detail: null } });
    expect(appels[1]?.[1]).toMatchObject({ extra: { code: '23502', detail: null } });
    const envoye = JSON.stringify(appels);
    expect(envoye).not.toContain('Texte premium');
    expect(envoye).not.toContain(LECTRICE);
    expect(envoye).not.toContain(LECTEUR);
    expect(envoye).not.toContain('Failing row');
    // Rien n'est perdu : les deux entrées sont toujours là.
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(2);
  });

  it('une panne venue de l’intérieur des fonctions n’est pas prise pour une corbeille absente : ok: false, et Sentry le sait', async () => {
    const service = clientDeService(db);
    await mettreALaCorbeille(service, 'education_lessons', LECON, ADMIN);
    vi.clearAllMocks();
    // Un changement de type : les opérateurs des fonctions n'existent plus (42883).
    await db.exec('alter table public.contenus_supprimes alter column lecteurs type text[] using lecteurs::text[]');

    expect(await retirerLecteurDeLaCorbeille(service, LECTEUR)).toEqual({ ok: false, entrees: 0 });
    expect(await purgerLaCorbeille(service, 'tache-planifiee')).toEqual({ ok: false, purgees: 0, lecteursRetires: 0 });
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).toContain('42883');
  });

  it('suppriment définitivement un article avec ses commentaires, le disent, et le notent au journal', async () => {
    const service = clientDeService(db);
    const mise = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
    vi.clearAllMocks();

    const resultat = await supprimerDefinitivement(service, mise.ok ? mise.idCorbeille : '', ADMIN);

    expect(resultat).toEqual({
      ok: true,
      message: typographieFr('Élément supprimé définitivement : « Le franc CFA », avec 3\u00a0commentaires et 1\u00a0j’aime.'),
    });
    expect(logAuditEvent).toHaveBeenCalledWith(ADMIN, 'corbeille.suppression_definitive', 'articles', ARTICLE, {
      titre: 'Le franc CFA',
      idCorbeille: mise.ok ? mise.idCorbeille : '',
      commentaires: 3,
      jaime: 1,
    });
    expect(await supprimerDefinitivement(service, mise.ok ? mise.idCorbeille : '', ADMIN)).toMatchObject({ ok: false, statut: 404 });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('annoncent le numéro neuf d’un brouillon dont le numéro a été repris', async () => {
    const service = clientDeService(db);
    await db.exec(`insert into public.newsletter_issues (id, number, slug, subject, content, status) values ('${uuid(502)}', 8, '008-precedent', 'Le numéro 8', '{}', 'sent')`);
    const mise = await mettreALaCorbeille(service, 'newsletter_issues', NUMERO, ADMIN);
    await db.exec(`insert into public.newsletter_issues (id, slug, subject, content) values ('${uuid(501)}', '009-nouveau', 'Nouveau numéro', '{}')`);

    const retour = await restaurerDepuisCorbeille(service, mise.ok ? mise.idCorbeille : '', ADMIN);

    expect(retour.ok && retour.remarques).toEqual([
      typographieFr('« N°\u00a09 · L’or et la BRVM » revient sous le numéro\u00a010 : le numéro\u00a09 a été repris entre-temps par « Nouveau numéro ». Son lien change avec lui.'),
    ]);
  });

  it('retirent un lecteur et purgent, sans titre ni contenu dans le journal du serveur', async () => {
    const service = clientDeService(db);
    const journal = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      await mettreALaCorbeille(service, 'education_lessons', LECON, ADMIN);
      expect(await retirerLecteurDeLaCorbeille(service, LECTEUR)).toEqual({ ok: true, entrees: 1 });
      expect(await retirerLecteurDeLaCorbeille(service, 'pas-un-uuid')).toEqual({ ok: true, entrees: 0 });

      await db.exec(`update public.contenus_supprimes set supprime_le = now() - interval '31 days'`);
      expect(await purgerLaCorbeille(service, 'tache-planifiee')).toEqual({ ok: true, purgees: 1, lecteursRetires: 0 });
      expect(journal).toHaveBeenCalledTimes(1);
      const ecrit = JSON.stringify(journal.mock.calls);
      expect(ecrit).toContain(LECON);
      expect(ecrit).not.toContain('Le PER');
      expect(ecrit).not.toContain(LECTRICE);
    } finally {
      journal.mockRestore();
    }
  });

  it('disent que la corbeille n’est pas installée tant que la migration n’est pas appliquée : rien n’est supprimé', async () => {
    const sansCorbeille = await baseSansCorbeille();
    try {
      await sansCorbeille.exec(PEUPLEMENT);
      const service = clientDeService(sansCorbeille);
      const resultat = await mettreALaCorbeille(service, 'articles', ARTICLE, ADMIN);
      expect(resultat).toMatchObject({ ok: false, statut: 503, inattendu: false });
      expect(resultat.ok ? '' : resultat.motif).toContain('migration 00032');
      const reste = await sansCorbeille.query(`select 1 from public.articles where id = '${ARTICLE}'`);
      expect(reste.rows).toHaveLength(1);
      expect(await retirerLecteurDeLaCorbeille(service, LECTRICE)).toEqual({ ok: true, entrees: 0 });
      expect(await purgerLaCorbeille(service, 'liste')).toEqual({ ok: true, purgees: 0, lecteursRetires: 0 });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    } finally {
      await sansCorbeille.close();
    }
  });
});
