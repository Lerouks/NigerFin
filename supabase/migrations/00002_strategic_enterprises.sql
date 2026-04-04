-- Strategic enterprises of Niger
-- Managed by admin, displayed on /entreprises page

create table if not exists strategic_enterprises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text not null,
  description text not null default '',
  logo_url text,
  image_url text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed initial data
insert into strategic_enterprises (name, sector, description, logo_url, display_order) values
  ('SOMAÏR', 'Mines & Uranium', 'Société des Mines de l''Aïr. Principal producteur d''uranium du Niger, exploitant le gisement d''Arlit depuis 1971. Filiale du groupe Orano (ex-Areva), SOMAÏR est un pilier historique de l''économie nigérienne et un acteur majeur du marché mondial de l''uranium.', null, 1),
  ('COMINAK', 'Mines & Uranium', 'Compagnie Minière d''Akouta. Deuxième grand exploitant d''uranium du Niger, opérant la mine souterraine d''Akouta. COMINAK a contribué pendant des décennies à faire du Niger l''un des premiers producteurs mondiaux d''uranium.', null, 2),
  ('SONIDEP', 'Pétrole & Énergie', 'Société Nigérienne des Produits Pétroliers. Entreprise publique stratégique chargée de la gestion des produits pétroliers au Niger, de l''importation à la distribution. SONIDEP joue un rôle central dans la sécurité énergétique du pays.', null, 3),
  ('NIGELEC', 'Électricité & Énergie', 'Société Nigérienne d''Électricité. Opérateur national de production, transport et distribution d''électricité. NIGELEC assure l''accès à l''énergie sur l''ensemble du territoire et pilote les projets d''électrification rurale.', null, 4),
  ('Niger Telecoms', 'Télécommunications', 'Opérateur historique des télécommunications au Niger (ex-SONITEL). Niger Telecoms assure les services de téléphonie fixe, mobile et d''accès internet, et participe au développement de l''infrastructure numérique du pays.', null, 5),
  ('SONIBANK', 'Banque & Finance', 'Société Nigérienne de Banque. L''une des principales banques commerciales du Niger, offrant une gamme complète de services bancaires aux particuliers et aux entreprises. SONIBANK est un acteur clé du financement de l''économie nigérienne.', null, 6),
  ('BAGRI', 'Agriculture & Agroalimentaire', 'Banque Agricole du Niger. Institution financière dédiée au financement du secteur agricole et rural. BAGRI soutient les exploitants agricoles, les coopératives et les projets de développement rural à travers des crédits adaptés.', null, 7),
  ('SOPAMIN', 'Mines & Ressources', 'Société du Patrimoine des Mines du Niger. Bras étatique de gestion des participations minières du Niger. SOPAMIN gère les intérêts de l''État dans les sociétés minières et veille à la valorisation des ressources du sous-sol nigérien.', null, 8);
