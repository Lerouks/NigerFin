'use client';

import { useState, useEffect, useCallback } from 'react';
import { appelAdmin } from '@/app/admin/lib/appel-admin';
import { EtatListe } from '@/app/admin/lib/EtatListe';
import { auteurDeLaLigne, type AuteurDuJournal } from '@/app/admin/lib/auteur-du-journal';
import { actionDuJournal, ajouterLaSuite, typeDuJournal } from '@/app/admin/lib/libelles-du-journal';

export interface AuditEntry extends AuteurDuJournal {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

/** Ce que la route /api/admin/audit renvoie. */
interface AuditResponse {
  data: AuditEntry[];
  total: number;
}

const SUITE_ABSENTE = "Le serveur n'a pas renvoyé la suite du journal. Réessayez dans un instant.";

export function AuditTab() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const [erreurSuite, setErreurSuite] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    setHorsLigne(false);
    setErreurSuite(null);

    const resultat = await appelAdmin<AuditResponse>('/api/admin/audit');

    if (!resultat.ok) {
      // Sans cette branche, l'echec etait avale par un catch vide et l'ecran
      // affichait « Aucune action enregistrée » comme si le journal etait vide.
      setErreur(resultat.message);
      setHorsLigne(resultat.horsLigne);
      setChargement(false);
      return;
    }

    const donnees = resultat.donnees;
    if (!donnees || !Array.isArray(donnees.data)) {
      setErreur("Le serveur n'a pas renvoyé le journal des actions. Réessayez dans un instant.");
      setChargement(false);
      return;
    }

    setAuditLog(donnees.data);
    setTotal(donnees.total);
    setPage(1);
    setChargement(false);
  }, []);

  useEffect(() => { fetchAuditLog(); }, [fetchAuditLog]);

  /**
   * Les actions plus anciennes, 50 à la fois comme la route les donne. Avant le
   * 25/11/2026, seules les 50 dernières s'affichaient, sans moyen de voir les autres.
   */
  const chargerLaSuite = async () => {
    setSuiteEnCours(true);
    setErreurSuite(null);
    const resultat = await appelAdmin<AuditResponse>(`/api/admin/audit?page=${page + 1}`);
    if (!resultat.ok) {
      setErreurSuite(resultat.message);
      setSuiteEnCours(false);
      return;
    }
    const suite = resultat.donnees;
    if (!suite || !Array.isArray(suite.data)) {
      setErreurSuite(SUITE_ABSENTE);
      setSuiteEnCours(false);
      return;
    }
    const lignes = ajouterLaSuite(auditLog, suite.data);
    setAuditLog(lignes);
    // Une page vide arrête la suite, même si le total annoncé dit le contraire.
    setTotal(suite.data.length === 0 ? lignes.length : Math.max(suite.total, lignes.length));
    setPage(page + 1);
    setSuiteEnCours(false);
  };

  return (
    <div className="space-y-4">
      {/* Chargement, échec de chargement, ou journal vraiment vide */}
      <EtatListe
        chargement={chargement}
        erreur={erreur}
        horsLigne={horsLigne}
        vide={auditLog.length === 0}
        texteVide="Aucune action enregistrée"
        onReessayer={fetchAuditLog}
      />

      {!chargement && !erreur && auditLog.length > 0 && (
        <>
          <ListeDuJournal lignes={auditLog} />
          {auditLog.length < total && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                onClick={chargerLaSuite}
                disabled={suiteEnCours}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                {suiteEnCours ? 'Chargement…' : 'Voir les actions plus anciennes'}
              </button>
              <p className="text-[12px] text-gray-500">Vous voyez {auditLog.length} actions sur {total}.</p>
              {erreurSuite && (
                <p role="alert" className="text-[12px] text-red-600 text-center text-balance">{erreurSuite}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Les lignes du journal. Sous 1280 px, une action par bloc empilé : le tableau
 * de cinq colonnes mesure 900 px, et avec le menu latéral du cockpit (256 px)
 * il sortait de l'écran, coupé sans défilement possible (contrôle du
 * 25/11/2026). Le détail passe à la ligne n'importe où : un texte insécable
 * élargirait toute la page.
 */
export function ListeDuJournal({ lignes }: { lignes: AuditEntry[] }) {
  return (
    <div className="bg-white rounded-xl border border-black/6 overflow-hidden">
      <ul className="xl:hidden">
        {lignes.map((entry) => (
          <li key={entry.id} className="border-b border-black/3 last:border-0 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <AuditActionBadge action={entry.action} />
              <span className="text-[12px] text-gray-500 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <p className="mt-2 text-[12px] [overflow-wrap:anywhere]">{auteurDeLaLigne(entry)}</p>
            <p className="mt-0.5 line-clamp-2 text-[12px] text-gray-500 [overflow-wrap:anywhere]">
              <span className="text-gray-600">{typeDuJournal(entry.entity_type)}</span>{' '}
              <span className="font-mono">{JSON.stringify(entry.details)}</span>
            </p>
          </li>
        ))}
      </ul>
      <table className="hidden xl:table w-full">
        <thead>
          <tr className="border-b border-black/4">
            <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Date</th>
            <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Auteur</th>
            <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Action</th>
            <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Type</th>
            <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 px-4 py-3">Détails</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((entry) => (
            <tr key={entry.id} className="border-b border-black/3 last:border-0">
              <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </td>
              <td className="px-4 py-3 text-[12px]">
                {auteurDeLaLigne(entry)}
              </td>
              <td className="px-4 py-3">
                <AuditActionBadge action={entry.action} />
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 whitespace-nowrap">{typeDuJournal(entry.entity_type)}</td>
              {/* Largeur nulle et pleine largeur : la colonne prend la place qui reste, sans jamais pousser le tableau hors de sa carte. */}
                  <td className="px-4 py-3 text-[12px] text-gray-500 font-mono w-full max-w-0 truncate">
                {JSON.stringify(entry.details)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditActionBadge({ action }: { action: string }) {
  const { libelle, couleur } = actionDuJournal(action);
  return <span className={`whitespace-nowrap text-[11px] px-2 py-1 rounded-sm ${couleur}`}>{libelle}</span>;
}
