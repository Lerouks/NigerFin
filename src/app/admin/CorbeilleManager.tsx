'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { appelAdmin, envoiAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';
import {
  DUREE_CONSERVATION_JOURS,
  LIBELLE_CONTENU,
  estTableCorbeille,
  finDeConservation,
  resumerDependants,
} from '@/lib/corbeille/libelles';
import { enPhrases, guillemets, nombreFr, sansMotSeul, typographieFr } from '@/lib/typographie-fr';

/**
 * Ce qui a été supprimé, et le moyen de le remettre en place.
 *
 * Remettre en place se fait en une seule transaction dans la base : tout
 * revient, ou rien. Il n'existe donc plus d'état « restauré en partie », ni de
 * bouton pour l'achever ou l'abandonner.
 *
 * Les morceaux d'affichage sont exportés à part et ne font aucun appel
 * réseau : leur rendu se vérifie à chaque largeur d'écran sans base.
 */

export interface EntreeCorbeille {
  id: string;
  table_origine: string;
  id_origine: string;
  titre: string | null;
  supprime_le: string;
  resume_dependants: Record<string, number> | null;
}

export interface Annonce {
  ton: 'succes' | 'echec';
  texte: string;
  remarques?: string[];
}

interface ReponseListe {
  entrees: EntreeCorbeille[];
  total: number;
}

interface ReponseRestauration {
  message: string;
  remarques: string[];
}

/**
 * Une phrase par bloc : aucune ne commence dans les derniers mots d'une ligne,
 * et aucune ne finit sur un mot seul (ses deux derniers mots sont soudés).
 * text-pretty équilibre le reste sans déplacer les coupures naturelles, comme
 * celle qui suit un deux-points.
 */
export function Phrases({ texte }: { texte: string }) {
  return (
    <>
      {enPhrases(typographieFr(texte)).map((phrase, rang) => (
        <span key={`${rang}-${phrase}`} className="block text-pretty">
          {sansMotSeul(phrase)}
        </span>
      ))}
    </>
  );
}

export function EnTeteCorbeille() {
  return (
    <header className="mb-6">
      <h2 className="font-extrabold text-[26px] leading-tight tracking-tight">Corbeille</h2>
      <div className="mt-2 max-w-2xl space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          <Phrases
            texte={`Les articles, les leçons et leurs catégories, les fiches\u00a0entreprises, les sections des pages légales et les numéros de newsletter pas encore envoyés que vous supprimez arrivent ici, avec ce que la base efface avec eux : les leçons d'une catégorie, les étapes de parcours et la progression des lecteurs d'une leçon, les événements d'envoi d'un numéro. Ils y restent ${DUREE_CONSERVATION_JOURS}\u00a0jours, puis sont supprimés définitivement. Remettre un élément en place le remet en entier, ou pas\u00a0du tout : jamais à moitié.`}
          />
        </p>
        <p>
          <Phrases texte={'Les commentaires et les j\u2019aime d\u2019un article ne partent pas avec lui : ils restent en modération, sous « Article\u00a0supprimé », et le retrouvent s\u2019il revient. Quand un lecteur supprime son compte, sa progression est retirée d\u2019ici aussi.'} />
        </p>
      </div>
      <p className="text-[12px] text-gray-500 mt-2 leading-relaxed max-w-2xl">
        <Phrases texte="Ne passent pas par la corbeille, et sont supprimés définitivement : les commentaires modérés, les messages reçus, les abonnés, les comptes et les données de marché." />
      </p>
    </header>
  );
}

const STYLE_ANNONCE: Record<Annonce['ton'], string> = {
  succes: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  echec: 'bg-red-50 border-red-100 text-red-700',
};

export function BandeauAnnonce({ annonce }: { annonce: Annonce }) {
  return (
    <div
      role={annonce.ton === 'echec' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm mb-5 leading-relaxed ${STYLE_ANNONCE[annonce.ton]}`}
    >
      <p>
        <Phrases texte={annonce.texte} />
      </p>
      {annonce.remarques && annonce.remarques.length > 0 && (
        <ul className="mt-2 space-y-1 list-disc pl-5 text-[13px]">
          {annonce.remarques.map((remarque, rang) => (
            <li key={`${rang}-${remarque}`}>
              <Phrases texte={remarque} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** La date d'un seul tenant : jamais « 2 » en fin de ligne et « novembre » au début de la suivante. */
function souder(texte: string): string {
  return texte.replace(/ /g, '\u00a0');
}

function dateEtHeure(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const jour = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return souder(`${jour} à ${heure}`);
}

function jourSeul(date: Date | null): string {
  if (!date) return '';
  return souder(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
}

interface PropsLigne {
  entree: EntreeCorbeille;
  enCours: boolean;
  confirmation: boolean;
  onRestaurer: () => void;
  onDemanderSuppression: () => void;
  onConfirmerSuppression: () => void;
  onAnnuler: () => void;
}

export function LigneCorbeille(props: PropsLigne) {
  const { entree, enCours, confirmation } = props;
  const idTitre = useId();
  const libelle = estTableCorbeille(entree.table_origine) ? LIBELLE_CONTENU[entree.table_origine] : 'Contenu';
  const dependants = resumerDependants(entree.resume_dependants);
  const fin = jourSeul(finDeConservation(entree.supprime_le));

  return (
    <li className="bg-white rounded-xl border border-black/6 px-4 py-3.5 flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:gap-4">
      <div className="min-w-0 @3xl:flex-1">
        <p id={idTitre} className="font-medium text-[15px] leading-snug break-words line-clamp-2">
          {typographieFr(entree.titre ?? 'Sans titre')}
        </p>
        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
          <span className="font-medium text-gray-600">{libelle}</span>
          <span aria-hidden="true">{' · '}</span>
          <span className="sr-only">, </span>
          {/* « le » est soudé à la date : il ne reste jamais seul en fin de ligne. */}
          <span>{typographieFr(`dans la corbeille depuis le ${dateEtHeure(entree.supprime_le)}`)}</span>
          {dependants && <span className="block">{typographieFr(`Avec ${dependants}`)}</span>}
          {/* Garanti jusqu'à cette date ; la purge passe ensuite, la nuit suivante au plus tard. */}
          {fin && <span className="block">{typographieFr(`Récupérable jusqu’au ${fin}`)}</span>}
        </p>
      </div>

      {confirmation ? (
        <Confirmation {...props} idTitre={idTitre} />
      ) : (
        <div className="flex flex-wrap items-center gap-2 @3xl:justify-end @3xl:shrink-0">
          <button
            type="button"
            onClick={props.onRestaurer}
            disabled={enCours}
            aria-describedby={idTitre}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#111] text-white text-[13px] font-medium hover:bg-[#222] disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {enCours ? 'Restauration…' : 'Remettre en place'}
          </button>
          <button
            type="button"
            onClick={props.onDemanderSuppression}
            disabled={enCours}
            aria-describedby={idTitre}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Supprimer définitivement
          </button>
        </div>
      )}
    </li>
  );
}

function Confirmation(props: PropsLigne & { idTitre: string }) {
  const dependants = resumerDependants(props.entree.resume_dependants);
  const nom = guillemets(props.entree.titre ?? 'Sans titre');
  const avertissement = dependants
    ? `Définitif : ${nom} disparaîtra avec ${dependants}, sans retour possible.`
    : `Définitif : ${nom} disparaîtra, sans retour possible.`;
  return (
    <div className="flex flex-col gap-2 @3xl:items-end @3xl:shrink-0 @3xl:max-w-xs">
      <p className="text-[12px] text-red-700 flex items-start gap-1.5 leading-relaxed">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <Phrases texte={avertissement} />
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={props.onConfirmerSuppression}
          disabled={props.enCours}
          aria-describedby={props.idTitre}
          className="w-full sm:w-auto px-3 py-2 rounded-lg bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {props.enCours ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
        <button
          type="button"
          onClick={props.onAnnuler}
          disabled={props.enCours}
          className="w-full sm:w-auto px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/** « Les 200 suppressions les plus récentes sur 250 » : la liste ne cache pas qu'elle est tronquée. */
export function NoteTotal({ affichees, total }: { affichees: number; total: number }) {
  if (total <= affichees) return null;
  return (
    <p className="text-[12px] text-gray-500 mb-3">
      {typographieFr(`Les ${nombreFr(affichees)} suppressions les plus récentes sur ${nombreFr(total)}.`)}
    </p>
  );
}

function BandeauRechargement({ erreur, onReessayer }: { erreur: string; onReessayer: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-5 flex flex-wrap items-center gap-3">
      <p className="flex-1 min-w-[12rem]">
        <Phrases texte={`La liste n'a pas pu être rechargée : ${erreur}`} />
      </p>
      <button
        type="button"
        onClick={onReessayer}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-red-200 text-[13px] font-medium hover:bg-red-100 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}

export function CorbeilleManager() {
  const [entrees, setEntrees] = useState<EntreeCorbeille[]>([]);
  const [total, setTotal] = useState(0);
  const [chargee, setChargee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState<Annonce | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    const resultat = await appelAdmin<ReponseListe>('/api/admin/corbeille');
    if (resultat.ok) {
      const liste = Array.isArray(resultat.donnees?.entrees) ? resultat.donnees.entrees : [];
      setEntrees(liste);
      setTotal(typeof resultat.donnees?.total === 'number' ? resultat.donnees.total : liste.length);
      setChargee(true);
      setErreur(null);
      setHorsLigne(false);
    } else {
      // Les lignes déjà affichées restent : sur une connexion qui coupe, un
      // rechargement raté ne doit pas faire disparaître la liste.
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function restaurer(entree: EntreeCorbeille) {
    setEnCours(entree.id);
    setAnnonce(null);
    const resultat = await envoiAdmin<ReponseRestauration>('/api/admin/corbeille', 'POST', { id: entree.id });
    if (resultat.ok) {
      setAnnonce({
        ton: 'succes',
        texte: resultat.donnees?.message ?? 'Le contenu a été remis en place.',
        remarques: resultat.donnees?.remarques ?? [],
      });
    } else {
      setAnnonce({ ton: 'echec', texte: resultat.message });
    }
    setEnCours(null);
    // Après une réponse perdue, seule la liste relue dit ce qui s'est passé.
    await charger();
  }

  async function supprimerDefinitivement(entree: EntreeCorbeille) {
    setEnCours(entree.id);
    setAnnonce(null);
    const resultat = await envoiAdmin(`/api/admin/corbeille?id=${encodeURIComponent(entree.id)}`, 'DELETE');
    if (resultat.ok) {
      setConfirmation(null);
      setAnnonce({ ton: 'succes', texte: 'Supprimé définitivement de la corbeille.' });
    } else {
      setAnnonce({ ton: 'echec', texte: resultat.message });
    }
    setEnCours(null);
    await charger();
  }

  return (
    <div>
      <EnTeteCorbeille />
      {annonce && <BandeauAnnonce annonce={annonce} />}
      {chargee && erreur && <BandeauRechargement erreur={erreur} onReessayer={charger} />}

      <EtatListe
        chargement={chargement && !chargee}
        erreur={chargee ? null : erreur}
        horsLigne={horsLigne}
        vide={chargee && entrees.length === 0}
        texteChargement="Lecture de la corbeille…"
        texteVide="La corbeille est vide."
        onReessayer={charger}
      />

      {chargee && entrees.length > 0 && (
        <>
          <NoteTotal affichees={entrees.length} total={total} />
          {/* Conteneur : chaque entrée se met en ligne d'après la largeur de la
              liste, pas celle de l'écran (la barre latérale en prend une part). */}
          <ul className="@container space-y-2">
            {entrees.map((entree) => (
              <LigneCorbeille
                key={entree.id}
                entree={entree}
                enCours={enCours === entree.id}
                confirmation={confirmation === entree.id}
                onRestaurer={() => restaurer(entree)}
                onDemanderSuppression={() => setConfirmation(entree.id)}
                onConfirmerSuppression={() => supprimerDefinitivement(entree)}
                onAnnuler={() => setConfirmation(null)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
