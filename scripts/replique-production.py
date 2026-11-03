"""Réplique minimale du schéma de production, pour tester la corbeille sur un vrai PostgreSQL.

Pourquoi : les migrations du dépôt ne décrivent pas la production. Exemple
qui a coûté cher : d'après 00001, les commentaires partent avec leur article
(clé étrangère ON DELETE CASCADE) ; en production, comments.article_id est du
texte sans clé étrangère, et ils lui survivent. Tester la corbeille sur le
schéma des migrations, c'était tester une autre base que la vraie.

La réplique est donc tirée de la production elle-même, par des requêtes en
LECTURE SEULE sur le catalogue (information_schema et pg_catalog), jamais sur
les données. Elle reprend, pour les tables que la corbeille touche : les
colonnes et leurs types, les clés primaires et uniques, les vérifications, les
clés étrangères avec leur règle ON DELETE, les index uniques, les déclencheurs
(dont celui qui numérote les newsletters), la RLS, les droits de chaque rôle,
et les droits par défaut du schéma public, qui donnent encore TOUT à anon et
authenticated sur chaque table neuve.

Usage :
  python3 scripts/replique-production.py --requetes
      affiche les requêtes à lancer en lecture seule, par exemple avec
      « supabase db query --linked -o json "<requête>" > qN.json » ;
  python3 scripts/replique-production.py <dossier des qN.json> <sortie.sql>
      écrit la réplique.
"""
import json
import sys

TABLES = [
    'education_categories', 'education_lessons', 'learning_paths', 'learning_path_steps',
    'user_lesson_progress', 'articles', 'comments', 'article_likes', 'strategic_enterprises',
    'legal_sections', 'newsletter_issues', 'newsletter_subscribers', 'newsletter_events',
]
LISTE = ', '.join(f"'{t}'" for t in TABLES)

REQUETES = {
    'q1-colonnes': f"""select c.table_schema, c.table_name, c.ordinal_position as pos, c.column_name, c.udt_name,
  c.is_nullable, c.column_default, c.is_generated, c.is_identity
from information_schema.columns c
where (c.table_schema = 'public' and c.table_name in ({LISTE}))
   or (c.table_schema = 'auth' and c.table_name = 'users' and c.column_name in ('id', 'email', 'deleted_at'))
order by c.table_schema, c.table_name, c.ordinal_position""",
    'q2-contraintes': f"""select c.relname as table_name, con.conname, con.contype, pg_get_constraintdef(con.oid) as def
from pg_constraint con join pg_class c on c.oid = con.conrelid join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ({LISTE})
order by c.relname, con.contype, con.conname""",
    'q3-index': f"""select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ({LISTE}) order by tablename, indexname""",
    'q5-declencheurs': f"""select c.relname as table_name, t.tgname, pg_get_triggerdef(t.oid) as def, p.proname as fonction,
  pg_get_functiondef(p.oid) as fonction_def
from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and n.nspname = 'public' and c.relname in ({LISTE})
order by c.relname, t.tgname""",
    'q6-roles': """select r.rolname, r.rolsuper, r.rolbypassrls, r.rolinherit, r.rolcanlogin
from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role', 'postgres', 'supabase_auth_admin')
order by r.rolname""",
    'q7-tables-proprio': f"""select n.nspname, c.relname, pg_get_userbyid(c.relowner) as owner, c.relrowsecurity,
  c.relforcerowsecurity, c.relacl::text as acl
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r' and ((n.nspname = 'public' and c.relname in ({LISTE})) or (n.nspname = 'auth' and c.relname = 'users'))
order by n.nspname, c.relname""",
    'q8-defacl': """select pg_get_userbyid(d.defaclrole) as role_createur, coalesce(n.nspname, '(toutes)') as schema,
  d.defaclobjtype as type_objet, d.defaclacl::text as acl
from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace order by 1, 2, 3""",
}

# Le rôle « postgres » de Supabase, propriétaire des tables et des fonctions,
# n'est PAS superutilisateur : il a BYPASSRLS. Dans PGlite, « postgres » est
# déjà le superutilisateur de la session ; son homologue prend donc un autre
# nom, avec les mêmes attributs.
PROPRIETAIRE = 'proprietaire'

TYPES = {
    'uuid': 'uuid', 'text': 'text', 'bool': 'boolean', 'int4': 'integer', 'int8': 'bigint',
    'timestamptz': 'timestamp with time zone', 'jsonb': 'jsonb', 'varchar': 'character varying',
    '_text': 'text[]',
}
LETTRES = {'a': 'INSERT', 'r': 'SELECT', 'w': 'UPDATE', 'd': 'DELETE', 'D': 'TRUNCATE',
           'x': 'REFERENCES', 't': 'TRIGGER', 'm': 'MAINTAIN', 'X': 'EXECUTE', 'U': 'USAGE'}
ROLES_API = ('anon', 'authenticated', 'service_role')


def charger(dossier, nom):
    with open(f'{dossier}/{nom}.json', encoding='utf-8') as f:
        contenu = json.load(f)
    return contenu['rows'] if isinstance(contenu, dict) else contenu


def type_sql(colonne):
    udt = colonne['udt_name']
    if udt not in TYPES:
        raise SystemExit(f"type inconnu : {udt} ({colonne['table_name']}.{colonne['column_name']})")
    return TYPES[udt]


def droits(acl):
    """« {anon=arwd/postgres,...} » -> [(rôle, [privilèges])], le propriétaire mis à part."""
    for entree in acl.strip('{}').split(','):
        role, reste = entree.split('=', 1)
        lettres = reste.split('/', 1)[0].replace('*', '')
        yield role, [LETTRES[lettre] for lettre in lettres]


def generer(dossier):
    colonnes = charger(dossier, 'q1-colonnes')
    contraintes = charger(dossier, 'q2-contraintes')
    index = charger(dossier, 'q3-index')
    declencheurs = charger(dossier, 'q5-declencheurs')
    roles = {r['rolname']: r for r in charger(dossier, 'q6-roles')}
    tables = charger(dossier, 'q7-tables-proprio')
    defacl = charger(dossier, 'q8-defacl')

    sortie = []
    ecrire = sortie.append

    # Les rôles, avec les attributs relevés en production.
    postgres = roles['postgres']
    if postgres['rolsuper'] or not postgres['rolbypassrls']:
        raise SystemExit('postgres a changé d’attributs en production : revoir la réplique')
    for nom in ROLES_API:
        r = roles[nom]
        ecrire(f"CREATE ROLE {nom} NOLOGIN {'BYPASSRLS' if r['rolbypassrls'] else 'NOBYPASSRLS'};")
    ecrire(f'CREATE ROLE {PROPRIETAIRE} NOLOGIN NOSUPERUSER BYPASSRLS;')
    ecrire(f'GRANT anon, authenticated, service_role TO {PROPRIETAIRE};')
    ecrire('CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT;')
    ecrire(f'GRANT USAGE ON SCHEMA public TO {PROPRIETAIRE}, anon, authenticated, service_role;')
    ecrire(f'GRANT CREATE ON SCHEMA public TO {PROPRIETAIRE};')
    ecrire('')

    # Les droits par défaut du schéma public : c'est eux qui rendent le REVOKE
    # de chaque table neuve indispensable.
    objets = {'r': 'TABLES', 'f': 'FUNCTIONS', 'S': 'SEQUENCES'}
    for d in defacl:
        if d['role_createur'] != 'postgres' or d['schema'] != 'public' or d['type_objet'] not in objets:
            continue
        for role, privileges in droits(d['acl']):
            if role in ROLES_API:
                ecrire(f"ALTER DEFAULT PRIVILEGES FOR ROLE {PROPRIETAIRE} IN SCHEMA public "
                       f"GRANT ALL ON {objets[d['type_objet']]} TO {role};")
    ecrire('')

    # auth.users : seules les colonnes que la corbeille lit.
    auth = [c for c in colonnes if c['table_schema'] == 'auth']
    ecrire('CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;')
    ecrire(f'GRANT USAGE ON SCHEMA auth TO {PROPRIETAIRE};')
    defs = []
    for c in sorted(auth, key=lambda c: c['pos']):
        d = f"  {c['column_name']} {type_sql(c)}"
        if c['is_nullable'] == 'NO':
            d += ' NOT NULL'
        defs.append(d)
    defs.append('  CONSTRAINT users_pkey PRIMARY KEY (id)')
    ecrire('CREATE TABLE auth.users (\n' + ',\n'.join(defs) + '\n);')
    ecrire('ALTER TABLE auth.users OWNER TO supabase_auth_admin;')
    ecrire('ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;')
    for t in tables:
        if t['nspname'] == 'auth' and t['relname'] == 'users':
            for role, privileges in droits(t['acl']):
                if role == 'postgres':
                    ecrire(f"GRANT {', '.join(privileges)} ON auth.users TO {PROPRIETAIRE};")
    ecrire('')

    # Les tables publiques, créées par le propriétaire, comme en production.
    ecrire(f'SET ROLE {PROPRIETAIRE};')
    ecrire('')
    for table in TABLES:
        cols = [c for c in colonnes if c['table_schema'] == 'public' and c['table_name'] == table]
        if not cols:
            raise SystemExit(f'table absente des colonnes : {table}')
        defs = []
        for c in sorted(cols, key=lambda c: c['pos']):
            if c['is_generated'] != 'NEVER' or c['is_identity'] != 'NO':
                raise SystemExit(f"colonne générée ou identity non prévue : {table}.{c['column_name']}")
            d = f"  {c['column_name']} {type_sql(c)}"
            if c['column_default'] is not None:
                d += f" DEFAULT {c['column_default']}"
            if c['is_nullable'] == 'NO':
                d += ' NOT NULL'
            defs.append(d)
        ecrire(f'CREATE TABLE public.{table} (\n' + ',\n'.join(defs) + '\n);')
        ecrire('')

    noms = set()
    # Clés primaires, unicités et vérifications d'abord, clés étrangères ensuite.
    for genre in ('p', 'u', 'c', 'f'):
        for k in contraintes:
            if k['table_name'] in TABLES and k['contype'] == genre:
                noms.add(k['conname'])
                ecrire(f"ALTER TABLE public.{k['table_name']} ADD CONSTRAINT {k['conname']} {k['def']};")
        ecrire('')

    for i in index:
        if i['tablename'] in TABLES and i['indexname'] not in noms:
            ecrire(f"{i['indexdef']};")
    ecrire('')

    vues = set()
    for t in declencheurs:
        if t['table_name'] in TABLES and t['fonction'] not in vues:
            vues.add(t['fonction'])
            ecrire(t['fonction_def'].rstrip() + ';')
            ecrire('')
    for t in declencheurs:
        if t['table_name'] in TABLES:
            ecrire(f"{t['def']};")
    ecrire('')

    # RLS et droits de chaque table, tels qu'en production.
    for t in tables:
        if t['nspname'] != 'public' or t['relname'] not in TABLES:
            continue
        table = t['relname']
        if t['relrowsecurity']:
            ecrire(f'ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;')
        if t['relforcerowsecurity']:
            ecrire(f'ALTER TABLE public.{table} FORCE ROW LEVEL SECURITY;')
        ecrire(f"REVOKE ALL ON public.{table} FROM PUBLIC, {', '.join(ROLES_API)};")
        for role, privileges in droits(t['acl']):
            if role in ROLES_API:
                ecrire(f"GRANT {', '.join(privileges)} ON public.{table} TO {role};")
        ecrire('')

    ecrire('RESET ROLE;')
    return '\n'.join(sortie).rstrip() + '\n'


ENTETE = """-- Réplique minimale du schéma de PRODUCTION des tables que la corbeille touche.
--
-- Générée par scripts/replique-production.py à partir de requêtes en lecture
-- seule sur le catalogue de la production (aucune donnée lue), le 3 novembre
-- 2026. À régénérer si le schéma de production change : le test
-- corbeille-sql vérifie aussi qu'elle couvre toutes les colonnes des types
-- générés (src/types/supabase.generated.ts).
--
-- Ce qu'elle reproduit : colonnes et types, clés primaires et uniques,
-- vérifications, clés étrangères et leur règle ON DELETE (en particulier :
-- comments et article_likes n'ont AUCUNE clé vers articles), index uniques,
-- déclencheurs, RLS, droits par table, et droits par défaut du schéma public.
-- Ce qu'elle ne reproduit pas : les politiques RLS (les fonctions de la
-- corbeille s'exécutent avec les droits de leur propriétaire, qui contourne
-- la RLS comme « postgres » en production), les autres colonnes d'auth.users,
-- les tables que la corbeille ne touche pas.
--
-- « proprietaire » joue le rôle de « postgres » en production : propriétaire
-- des tables et des fonctions, NON superutilisateur, avec BYPASSRLS.

"""


def main():
    if len(sys.argv) == 2 and sys.argv[1] == '--requetes':
        for nom, sql in REQUETES.items():
            print(f'-- {nom}\n{sql};\n')
        return
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    with open(sys.argv[2], 'w', encoding='utf-8') as f:
        f.write(ENTETE + generer(sys.argv[1]))


if __name__ == '__main__':
    main()
