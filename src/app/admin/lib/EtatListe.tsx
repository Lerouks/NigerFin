'use client';

import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react';

/**
 * Etat d'une liste d'administration : en chargement, en echec, ou vraiment vide.
 *
 * Ces trois etats etaient confondus partout : quand un appel echouait, l'ecran
 * affichait l'etat vide, c'est-a-dire « Aucun article », et laissait croire que
 * la base etait vide. Les distinguer est la moitie du travail ; l'autre moitie
 * est de proposer un bouton pour reessayer sans recharger la page.
 */

interface Props {
  chargement: boolean;
  erreur: string | null;
  horsLigne?: boolean;
  vide: boolean;
  /** Ce qu'on montre quand il n'y a vraiment rien. Exemple : « Aucun article ». */
  texteVide: string;
  /** Facultatif : l'invitation a creer le premier element. */
  actionVide?: React.ReactNode;
  onReessayer?: () => void;
}

export function EtatListe({
  chargement, erreur, horsLigne, vide, texteVide, actionVide, onReessayer,
}: Props) {
  if (chargement) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (erreur) {
    const Icone = horsLigne ? WifiOff : AlertTriangle;
    return (
      <div role="alert" className="mx-auto max-w-lg text-center py-14 px-6">
        <Icone className={`w-8 h-8 mx-auto mb-4 ${horsLigne ? 'text-gray-400' : 'text-red-500'}`} />
        <p className="font-medium mb-2">
          {horsLigne ? 'Connexion perdue' : "La liste n'a pas pu être chargée"}
        </p>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{erreur}</p>
        {onReessayer && (
          <button
            onClick={onReessayer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] text-white text-sm font-medium hover:bg-[#222] transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (vide) {
    return (
      <div className="text-center py-16 px-6">
        <Inbox className="w-8 h-8 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm mb-5">{texteVide}</p>
        {actionVide}
      </div>
    );
  }

  return null;
}
