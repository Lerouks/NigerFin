-- 00034 : le journal de l'administration accepte les actions du système.
--
-- Les actions automatiques (paiement iPayMoney validé ou refusé, abonnements
-- expirés par la tâche de nuit) s'écrivaient avec un auteur « sentinelle »
-- 00000000-0000-0000-0000-000000000000. Ce compte n'existe ni dans auth.users
-- ni dans user_profiles, et audit_log.admin_id pointe vers les deux : la base
-- refusait chaque ligne, et l'erreur n'était pas lue. Vérifié le 24/11/2026 :
-- les 49 lignes du journal viennent toutes de vrais comptes, aucune du système.
--
-- Après cette migration :
--   - une action du système s'écrit sans auteur (admin_id vide) et avec
--     par_le_systeme = true ; l'écran du journal affiche « Système » ;
--   - supprimer un compte qui a écrit dans le journal n'est plus bloqué : ses
--     lignes restent, sans auteur (l'écran affiche « Compte supprimé »).
--
-- Application (jamais db push sur ce projet) :
--   supabase db query --linked --file supabase/migrations/00034_journal_actions_du_systeme.sql
-- Retour arrière, tant qu'aucune ligne n'est sans auteur :
--   alter table public.audit_log drop constraint audit_log_admin_id_fkey;
--   alter table public.audit_log add constraint audit_log_admin_id_fkey
--     foreign key (admin_id) references auth.users(id);
--   alter table public.audit_log drop constraint audit_log_admin_profile_fkey;
--   alter table public.audit_log add constraint audit_log_admin_profile_fkey
--     foreign key (admin_id) references public.user_profiles(id);
--   alter table public.audit_log alter column admin_id set not null;
--   alter table public.audit_log drop column par_le_systeme;

begin;

alter table public.audit_log alter column admin_id drop not null;

alter table public.audit_log
  add column if not exists par_le_systeme boolean not null default false;

alter table public.audit_log drop constraint audit_log_admin_id_fkey;
alter table public.audit_log
  add constraint audit_log_admin_id_fkey
  foreign key (admin_id) references auth.users(id) on delete set null;

-- Le nom de cette clé est lu par /api/admin/audit pour joindre l'auteur : il ne change pas.
alter table public.audit_log drop constraint audit_log_admin_profile_fkey;
alter table public.audit_log
  add constraint audit_log_admin_profile_fkey
  foreign key (admin_id) references public.user_profiles(id) on delete set null;

commit;

-- La nouvelle colonne doit être connue de l'API tout de suite.
notify pgrst, 'reload schema';
