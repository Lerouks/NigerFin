'use client';

import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { useAdminApiPolling } from '@/app/admin/hooks/useAdminApi';
import { part, somme, type ProfilLecteurs, type Repartition } from '@/lib/audience/profil-lecteurs';

/**
 * Noir et argent de la charte NFI pour le partage femmes et hommes. Les deux
 * teintes se distinguent aussi pour un œil daltonien (écart mesuré de 39) et
 * chaque part porte son nom et son chiffre : la couleur n'est jamais seule.
 */
const TEINTE_FEMMES = '#1a1a1a';
const TEINTE_HOMMES = '#80858c';

function nombreDe(n: number, singulier: string, pluriel: string): string {
  return `${n.toLocaleString('fr-FR')} ${n > 1 ? pluriel : singulier}`;
}

function phraseDeBase(donnees: ProfilLecteurs): string {
  const base = `Sur ${nombreDe(donnees.lecteurs, 'compte de lecteur', 'comptes de lecteurs')}.`;
  if (donnees.equipe === 0) return base;
  if (donnees.equipe === 1) return `${base} Le compte de l’équipe n’est pas compté.`;
  return `${base} Les ${donnees.equipe} comptes de l’équipe ne sont pas comptés.`;
}

export function QuiNousLitSection() {
  const { data, error, isLoading, mutate } = useAdminApiPolling<ProfilLecteurs>(
    'audience/profil',
    300000
  );
  const horsLigne = error instanceof Error && error.name === 'HorsLigne';
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : 'Les réponses n’ont pas pu être chargées. Réessayez dans un instant.';

  return (
    <section className="mb-10" aria-labelledby="qui-nous-lit-titre">
      <h2 id="qui-nous-lit-titre" className="font-bold text-[16px]">
        Qui nous lit
      </h2>
      <p className="text-[13px] text-foreground/55 leading-relaxed mt-1 mb-3 text-pretty">
        {data
          ? phraseDeBase(data)
          : 'Civilité, âge et profession déclarés par les inscrits.'}
      </p>

      {error && (
        <div
          role="alert"
          className={[
            'mb-3 rounded-xl px-4 py-3 border flex flex-wrap items-center gap-x-3 gap-y-2',
            horsLigne ? 'bg-black/2.5 border-black/8' : 'bg-red-50 border-red-200',
          ].join(' ')}
        >
          {horsLigne ? (
            <WifiOff className="w-4 h-4 shrink-0 text-foreground/40" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" aria-hidden="true" />
          )}
          <p className="text-[13px] text-foreground/70 leading-relaxed min-w-0 flex-1">
            {data ? 'Réponses du dernier chargement réussi, la mise à jour vient d’échouer. ' : ''}
            {message}
          </p>
          <button
            type="button"
            onClick={() => {
              void mutate();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] text-white text-[12px] font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      {data ? (
        <div className="space-y-3">
          <CarteFemmesHommes civilite={data.civilite} />
          <div className="grid gap-3 lg:grid-cols-2">
            <CarteRepartition titre="Âges" lignes={data.ages.tranches} sansReponse={data.ages.sansReponse} />
            <CarteRepartition
              titre="Professions"
              lignes={data.professions.liste}
              sansReponse={data.professions.sansReponse}
            />
          </div>
        </div>
      ) : isLoading ? (
        <Squelette />
      ) : null}
    </section>
  );
}

function TitreCarte({ children }: { children: string }) {
  return (
    <p className="text-[10px] tracking-widest uppercase text-foreground/45 font-semibold">
      {children}
    </p>
  );
}

function CarteFemmesHommes({ civilite }: { civilite: ProfilLecteurs['civilite'] }) {
  const parts = [
    { libelle: 'Femmes', nombre: civilite.femmes, teinte: TEINTE_FEMMES },
    { libelle: 'Hommes', nombre: civilite.hommes, teinte: TEINTE_HOMMES },
  ];
  const reponses = civilite.femmes + civilite.hommes;

  return (
    <div className="bg-black/2.5 rounded-2xl p-4">
      <TitreCarte>Femmes et hommes</TitreCarte>
      {reponses === 0 ? (
        <p className="mt-3 text-[13px] text-foreground/55">Aucune réponse pour l’instant.</p>
      ) : (
        <>
          {/* Barre partagée : un bloc par part, séparés par un filet de la couleur du fond. */}
          <div className="mt-3 flex gap-0.5 h-2.5" aria-hidden="true">
            {parts
              .filter((p) => p.nombre > 0)
              .map((p, i, visibles) => (
                <div
                  key={p.libelle}
                  className={[
                    'h-full',
                    i === 0 ? 'rounded-l-[4px]' : '',
                    i === visibles.length - 1 ? 'rounded-r-[4px]' : '',
                  ].join(' ')}
                  style={{ flexGrow: p.nombre, flexBasis: 0, backgroundColor: p.teinte }}
                />
              ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {parts.map((p) => (
              <li key={p.libelle} className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] text-foreground/70">
                  <span
                    className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                    style={{ backgroundColor: p.teinte }}
                    aria-hidden="true"
                  />
                  {p.libelle}
                </p>
                <p className="font-extrabold text-[24px] leading-tight tabular-nums mt-1">
                  {`${part(p.nombre, reponses) ?? 0} %`}
                </p>
                <p className="text-[12px] text-foreground/50 tabular-nums">
                  {nombreDe(p.nombre, 'compte', 'comptes')}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <PiedCarte reponses={reponses} sansReponse={civilite.sansReponse} />
    </div>
  );
}

function CarteRepartition({
  titre,
  lignes,
  sansReponse,
}: {
  titre: string;
  lignes: Repartition[];
  sansReponse: number;
}) {
  const reponses = somme(lignes);

  return (
    <div className="bg-black/2.5 rounded-2xl p-4">
      <TitreCarte>{titre}</TitreCarte>
      {reponses === 0 ? (
        <p className="mt-3 text-[13px] text-foreground/55">Aucune réponse pour l’instant.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {lignes.map((ligne) => (
            <li key={ligne.libelle}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 text-foreground/80">{ligne.libelle}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold text-foreground/80">
                    {`${part(ligne.nombre, reponses) ?? 0} %`}
                  </span>
                  <span className="text-foreground/45">{` (${ligne.nombre})`}</span>
                </span>
              </div>
              {/* Jauge sur 100 % des réponses ; bout arrondi, départ droit. */}
              <div className="mt-1 h-1.5 bg-black/6 rounded-r-[4px]" aria-hidden="true">
                {ligne.nombre > 0 && (
                  <div
                    className="h-full rounded-r-[4px] bg-[#1a1a1a]/80"
                    style={{ width: `${(ligne.nombre / reponses) * 100}%` }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PiedCarte reponses={reponses} sansReponse={sansReponse} />
    </div>
  );
}

function PiedCarte({ reponses, sansReponse }: { reponses: number; sansReponse: number }) {
  const phrases = [
    reponses > 0 ? `Parts calculées sur ${nombreDe(reponses, 'réponse', 'réponses')}.` : '',
    sansReponse > 0 ? `Sans réponse : ${sansReponse}.` : '',
  ].filter(Boolean);
  if (phrases.length === 0) return null;
  // Une phrase par ligne, sur tous les écrans : jamais une fin de ligne de trois mots.
  return (
    <div className="mt-3 pt-3 border-t border-black/6 text-[12px] text-foreground/50 leading-relaxed">
      {phrases.map((phrase) => (
        <p key={phrase}>{phrase}</p>
      ))}
    </div>
  );
}

function Squelette() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="bg-black/2.5 rounded-2xl p-4 animate-pulse">
          <div className="h-2.5 bg-black/6 rounded-sm w-1/4" />
          <div className="h-2.5 bg-black/6 rounded-sm mt-4" />
          <div className="h-2 bg-black/4 rounded-sm w-1/2 mt-3" />
        </div>
      ))}
    </div>
  );
}
