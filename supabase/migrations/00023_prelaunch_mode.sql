-- Mode pré-lancement (« Prochainement »).
--
-- Quand prelaunch_enabled = true :
--   - le public voit une page « Prochainement » avec capture d'email (liste de lancement),
--   - les admins connectés voient le site complet (bypass),
--   - le site entier passe en noindex (Google ne référence pas la version en test).
-- Toggle depuis /admin/site/visibilite, sans redéploiement.
--
-- Défaut = false : déployer cette migration ne change RIEN pour les visiteurs
-- tant qu'un admin ne l'active pas volontairement.

alter table public.site_features
  add column if not exists prelaunch_enabled boolean not null default false;

comment on column public.site_features.prelaunch_enabled is
  'Mode pré-lancement : true = le public voit la page Prochainement (liste de lancement), les admins connectés voient le site complet.';
