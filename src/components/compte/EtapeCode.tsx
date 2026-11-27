'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { phraseErreurAuth } from '@/lib/auth/messages';
import { Turnstile, turnstileActif } from '@/components/securite/Turnstile';

/**
 * L'étape du code à 6 chiffres (décision de Raouf, 26/11/2026) : la personne
 * tape le code reçu par e-mail sans quitter la page, ce qui la garde sur son
 * article ou sur son paiement, même si elle lit le mail sur un autre appareil.
 * Le lien du même mail marche aussi.
 */

export const LONGUEUR_CODE = 6;
const ATTENTE_RENVOI_S = 60;

export function EtapeCode({ email, suite, onConfirme, onModifierAdresse, titre = true }: {
  email: string;
  suite?: string | null;
  /** Appelé une fois l'adresse confirmée et la session ouverte. */
  onConfirme: () => void;
  /** Retour au formulaire pour corriger une adresse mal tapée. */
  onModifierAdresse?: () => void;
  /** Le titre « Vérifiez votre e-mail », absent dans la page de paiement. */
  titre?: boolean;
}) {
  const { verifierCode, renvoyerCode } = useAuth();
  const idCode = useId();
  const idAide = useId();
  const champ = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [attente, setAttente] = useState(ATTENTE_RENVOI_S);
  const [jeton, setJeton] = useState<string | null>(null);
  const [tour, setTour] = useState(0);

  useEffect(() => {
    champ.current?.focus();
  }, []);

  useEffect(() => {
    if (attente <= 0) return;
    const minuteur = setTimeout(() => setAttente((s) => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [attente]);

  async function valider(valeur: string) {
    if (enCours) return;
    if (valeur.length !== LONGUEUR_CODE) {
      setErreur(`Le code contient ${LONGUEUR_CODE} chiffres.`);
      return;
    }
    setEnCours(true);
    setErreur('');
    setInfo('');
    const { error } = await verifierCode(email, valeur);
    if (error) {
      setEnCours(false);
      setErreur(error.code === 'otp_expired' || /expired|invalid/i.test(error.message)
        ? 'Ce code est incorrect ou n’est plus valable. Vérifiez-le, ou demandez-en un nouveau.'
        : phraseErreurAuth(error));
      return;
    }
    onConfirme();
  }

  function changer(saisie: string) {
    const chiffres = saisie.replace(/\D/g, '').slice(0, LONGUEUR_CODE);
    setCode(chiffres);
    if (erreur) setErreur('');
    if (chiffres.length === LONGUEUR_CODE) void valider(chiffres);
  }

  async function renvoyer() {
    if (attente > 0 || enCours) return;
    if (turnstileActif && !jeton) {
      setErreur('La vérification anti-robots n’est pas encore prête. Patientez une seconde.');
      return;
    }
    setErreur('');
    setInfo('');
    const { error } = await renvoyerCode(email, suite, jeton ?? undefined);
    setTour((t) => t + 1);
    if (error) {
      setErreur(phraseErreurAuth(error, 'Le mail n’a pas pu partir. Réessayez dans un instant.'));
      return;
    }
    setAttente(ATTENTE_RENVOI_S);
    setCode('');
    setInfo('Un nouveau code est parti. Seul le dernier reçu est valable.');
    champ.current?.focus();
  }

  return (
    <div>
      {titre && (
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-emerald-500" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Vérifiez votre e-mail</h1>
        </div>
      )}
      {/* L'adresse sur sa propre ligne : une longue adresse ne coupe plus la phrase en deux. */}
      <div className="text-gray-600 text-sm text-center mb-6">
        <p>Un code à {LONGUEUR_CODE}{' '}chiffres est parti à</p>
        <p className="font-semibold text-[#111] [overflow-wrap:anywhere] my-1">
          {email.includes('@') ? <>{email.slice(0, email.indexOf('@'))}<wbr />{email.slice(email.indexOf('@'))}</> : email}
        </p>
        <p className="text-balance">Tapez{'\u2011'}le ici <span className="whitespace-nowrap">pour activer votre compte.</span></p>
      </div>

      {erreur && (
        <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-5 text-pretty">
          {erreur}
        </div>
      )}
      {info && !erreur && (
        <div role="status" className="bg-gray-50 border border-black/8 text-[#111] text-sm px-4 py-3 rounded-lg mb-5 text-pretty">
          {info}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void valider(code); }} className="space-y-5" noValidate>
        <div>
          <label htmlFor={idCode} className="block text-sm font-medium mb-2">Code reçu par e-mail</label>
          <input
            ref={champ}
            id={idCode}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={LONGUEUR_CODE}
            value={code}
            onChange={(e) => changer(e.target.value)}
            aria-describedby={idAide}
            aria-invalid={erreur ? 'true' : undefined}
            disabled={enCours}
            className="w-full border border-black/8 rounded-xl px-4 py-3.5 bg-background text-center text-[26px] font-semibold tracking-[0.45em] tabular-nums focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all disabled:opacity-60"
          />
          <p id={idAide} className="text-[12px] text-gray-500 mt-2">
            <span className="block">Le lien du même mail marche aussi.</span>
            <span className="block">Rien reçu{'\u00a0'}? Regardez les indésirables.</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={enCours || code.length !== LONGUEUR_CODE}
          className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium active:scale-[0.98]"
        >
          {enCours ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Vérification…
            </span>
          ) : 'Activer mon compte'}
        </button>
      </form>

      <Turnstile onJeton={setJeton} tour={tour} action="renvoi-code" />

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={renvoyer}
          disabled={attente > 0}
          className="font-semibold text-[#111] hover:text-gold disabled:text-gray-500 disabled:cursor-default transition-colors min-h-[36px]"
        >
          {attente > 0 ? `Nouveau code possible dans ${attente} s` : 'Recevoir un nouveau code'}
        </button>
        {onModifierAdresse && (
          <button type="button" onClick={onModifierAdresse} className="text-gray-500 hover:text-[#111] transition-colors min-h-[36px]">
            Modifier l’adresse e-mail
          </button>
        )}
      </div>
    </div>
  );
}
