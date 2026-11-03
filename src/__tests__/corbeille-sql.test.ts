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
} from '@/lib/corbeille';
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

async function entreeDe(table: string, id: string): Promise<Json | undefined> {
  return un<Json>('select * from public.contenus_supprimes where table_origine = $1 and id_origine = $2', [table, id]);
}

describe('installation et droits', () => {
  it('rejouer la migration ne change rien et ne perd rien', async () => {
    await mettre('articles', ARTICLE);
    await appliquerMigration(db);
    await appliquerMigration(db);
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
    expect(await nombre("select count(*) as n from pg_proc where proname like 'corbeille%'")).toBe(5);
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
              has_function_privilege($1, 'public.corbeille_inserer(text, jsonb, jsonb)', 'execute') as inserer`,
      [role],
    );
    expect(droits).toEqual({ table: false, mettre: false, restaurer: false, retirer: false, purger: false, inserer: false });

    for (const sql of [
      'select count(*) from public.contenus_supprimes',
      `select public.corbeille_mettre('articles', '${ARTICLE_2}', null)`,
      `select public.corbeille_restaurer('${uuid(999)}')`,
      `select public.corbeille_retirer_lecteur('${LECTRICE}')`,
      'select public.corbeille_purger(30)',
      `select public.corbeille_inserer('articles', '[]', '{}')`,
    ]) {
      const erreur = await erreurDe(commeRole(db, role, () => db.query(sql)));
      expect(erreur.code).toBe('42501');
    }
    // Rien n'a bougé : l'article 2 est toujours là, l'entrée aussi.
    expect(await ligne('articles', ARTICLE_2)).not.toBeNull();
    expect(await nombre('select count(*) as n from public.contenus_supprimes')).toBe(1);
  });

  it('service_role lit et vide la corbeille, appelle les quatre fonctions, mais n’y écrit qu’à travers elles', async () => {
    const droits = await un<Json>(
      `select has_table_privilege('service_role', 'public.contenus_supprimes', 'select') as lit,
              has_table_privilege('service_role', 'public.contenus_supprimes', 'delete') as vide,
              has_table_privilege('service_role', 'public.contenus_supprimes', 'insert, update, truncate') as ecrit,
              has_function_privilege('service_role', 'public.corbeille_mettre(text, uuid, uuid)', 'execute') as mettre,
              has_function_privilege('service_role', 'public.corbeille_restaurer(uuid)', 'execute') as restaurer,
              has_function_privilege('service_role', 'public.corbeille_retirer_lecteur(uuid)', 'execute') as retirer,
              has_function_privilege('service_role', 'public.corbeille_purger(integer)', 'execute') as purger,
              has_function_privilege('service_role', 'public.corbeille_inserer(text, jsonb, jsonb)', 'execute') as inserer`,
    );
    expect(droits).toEqual({ lit: true, vide: true, ecrit: false, mettre: true, restaurer: true, retirer: true, purger: true, inserer: false });

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

    const vidage = await commeRole(db, 'service_role', () =>
      db.query('delete from public.contenus_supprimes where id = $1', [mise.id_corbeille]),
    );
    expect(vidage.affectedRows).toBe(1);
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
      { proname: 'corbeille_mettre', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_purger', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_restaurer', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
      { proname: 'corbeille_retirer_lecteur', prosecdef: true, proconfig: ['search_path=public, pg_temp', 'lock_timeout=5s'], proprietaire: 'proprietaire' },
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

  it('un déclencheur BEFORE INSERT qui écarte une progression sans erreur : refus, rien n’est remis, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('education_lessons', LECON);
    const entreeAvant = await entreeDe('education_lessons', LECON);
    await db.exec(`create function public.ecarter() returns trigger language plpgsql as $$
        begin if new.user_id = '${LECTEUR}' then return null; end if; return new; end $$;
      create trigger ecarter before insert on public.user_lesson_progress for each row execute function public.ecarter();`);

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('remise_incomplete');
    expect(detail).toEqual({ titre: 'Le PER', table: 'education_lessons', table_touchee: 'user_lesson_progress', attendues: 2, remises: 1 });
    expect(await ligne('education_lessons', LECON)).toBeNull();
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id = '${LECON}'`)).toBe(0);
    expect(await entreeDe('education_lessons', LECON)).toEqual(entreeAvant);
  });

  it('une règle DO INSTEAD NOTHING qui écarte le contenu lui-même : refus, l’entrée reste intacte', async () => {
    const { id_corbeille } = await mettre('legal_sections', SECTION);
    const entreeAvant = await entreeDe('legal_sections', SECTION);
    await db.exec('create rule ignorer as on insert to public.legal_sections do instead nothing');

    const { code, detail } = await refus(restaurer(String(id_corbeille)));

    expect(code).toBe('remise_incomplete');
    expect(detail).toEqual({ titre: 'CGU : Article 3', table: 'legal_sections', table_touchee: 'legal_sections', attendues: 1, remises: 0 });
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
    // lecteur) : celle de la seconde leçon est la dernière écrite.
    await db.exec(`create function public.panne() returns trigger language plpgsql as $$
        begin if new.lesson_id = '${LECON_2}' then raise exception 'panne simulée'; end if; return new; end $$;
      create trigger panne before insert on public.user_lesson_progress for each row execute function public.panne();`);

    const erreur = await erreurDe(restaurer(String(id_corbeille)));

    expect(erreur.message).toBe('panne simulée');
    expect(await ligne('education_categories', CATEGORIE)).toBeNull();
    expect(await nombre(`select count(*) as n from public.education_lessons where category_id = '${CATEGORIE}'`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.learning_path_steps where lesson_id in ('${LECON}', '${LECON_2}')`)).toBe(0);
    expect(await nombre(`select count(*) as n from public.user_lesson_progress where lesson_id in ('${LECON}', '${LECON_2}')`)).toBe(0);
    expect(await entreeDe('education_categories', CATEGORIE)).toEqual(entreeAvant);

    await db.exec('drop trigger panne on public.user_lesson_progress');
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

  it.each([null, 0, 7, 29, -1])('corbeille_purger(%s) est refusé : la corbeille ne se vide pas par erreur', async (jours) => {
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
