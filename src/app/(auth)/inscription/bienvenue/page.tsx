'use client';

import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chargementComplet } from '@/lib/chargement-complet';
import { CIVILITES, estCivilite, PROFESSIONS, TRANCHES_AGE, type Civilite } from '@/lib/regles-du-compte';
import { safeNextPath } from '@/lib/validation';

/**
 * L'écran qui suit la confirmation de l'adresse (code, lien du mail ou Google),
 * à la place de l'ancienne page « Complétez votre profil » (décisions de Raouf,
 * 26 et 27/11/2026) :
 * - la civilité, obligatoire, seulement si le compte ne l'a pas encore (Google
 *   ne la donne pas) : elle sert à compter les femmes et les hommes ;
 * - la profession et la tranche d'âge, facultatives ;
 * - la newsletter, si la personne ne l'a pas déjà choisie en s'inscrivant.
 * Le téléphone, l'adresse et le pays restent dans « Mon compte », pour la facture.
 * Puis retour à la page de départ (« suite »), sinon l'accueil.
 */

const LISTE = 'w-full border border-black/8 rounded-xl px-4 py-3 text-base bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10';

function BienvenueContenu() {
  const searchParams = useSearchParams();
  const brut = searchParams.get('suite');
  const suite = brut ? safeNextPath(brut) : '/';
  const { isLoading, isSignedIn, user, profile } = useAuth();
  const ids = { profession: useId(), age: useId() };
  const [civilite, setCivilite] = useState<Civilite | ''>('');
  const [profession, setProfession] = useState('');
  const [age, setAge] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const bienvenueDemandee = useRef(false);

  const civiliteConnue = estCivilite(profile?.civility);
  const newsletterDejaChoisie = user?.user_metadata?.newsletter === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isSignedIn) {
      chargementComplet(`/connexion?next=${encodeURIComponent(`/inscription/bienvenue?suite=${encodeURIComponent(suite)}`)}`, { remplacer: true });
      return;
    }
    // Mail de bienvenue (une seule fois) et newsletter cochée à l'inscription.
    if (!bienvenueDemandee.current) {
      bienvenueDemandee.current = true;
      fetch('/api/auth/bienvenue', { method: 'POST' }).catch(() => {});
    }
  }, [isLoading, isSignedIn, suite]);

  useEffect(() => {
    if (profile?.profile_completed === true) chargementComplet(suite, { remplacer: true });
  }, [profile?.profile_completed, suite]);

  async function enregistrer(passer: boolean) {
    if (enCours) return;
    if (!civiliteConnue && !estCivilite(civilite)) {
      setErreur('Choisissez votre civilité pour continuer.');
      return;
    }
    setEnCours(true);
    setErreur('');
    const corps: Record<string, unknown> = { profile_completed: true };
    if (!civiliteConnue) corps.civility = civilite;
    if (!passer) {
      if (profession) corps.profession = profession;
      if (age) corps.age_range = age;
    }
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      });
      if (!res.ok) {
        const lu = (await res.json().catch(() => ({}))) as { error?: string };
        setErreur(lu.error || 'L’enregistrement a échoué. Réessayez.');
        setEnCours(false);
        return;
      }
      if (!passer && newsletter && !newsletterDejaChoisie) {
        await fetch('/api/user/newsletter', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recevoir: true }),
        }).catch(() => {});
      }
      chargementComplet(suite, { remplacer: true });
    } catch {
      setErreur('La connexion a échoué. Vérifiez votre réseau puis réessayez.');
      setEnCours(false);
    }
  }

  if (isLoading || !isSignedIn || !profile) {
    return (
      <div className="min-h-[70vh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" aria-label="Chargement" />
      </div>
    );
  }

  const prenom = profile.first_name?.trim();

  return (
    <div className="min-h-[85vh] bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 min-[360px]:p-8 sm:p-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-balance">
              {prenom ? <>Bienvenue, <span className="whitespace-nowrap">{prenom}</span></> : 'Bienvenue'}
            </h1>
            <p className="text-gray-500 text-[14px] text-balance">
              {civiliteConnue
                ? <>Votre compte est prêt. Deux questions facultatives nous aident <span className="whitespace-nowrap">à mieux vous connaître.</span></>
                : <>Votre compte est prêt. Indiquez votre civilité <span className="whitespace-nowrap">pour terminer.</span></>}
            </p>
          </div>

          {erreur && (
            <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 text-pretty">
              {erreur}
            </div>
          )}

          <div className="space-y-5">
            {!civiliteConnue && (
              <fieldset>
                <legend className="block text-sm font-medium mb-2">Civilité</legend>
                <div className="grid grid-cols-2 gap-3">
                  {CIVILITES.map((option) => {
                    const choisie = civilite === option;
                    return (
                      <label
                        key={option}
                        className={`flex items-center justify-center gap-2 cursor-pointer border rounded-xl px-4 py-3 text-sm transition-all ${
                          choisie ? 'border-[#111] bg-background text-[#111]' : 'border-black/8 bg-white text-gray-600 hover:border-black/16'
                        }`}
                      >
                        <input type="radio" name="civilite" value={option} checked={choisie} onChange={() => setCivilite(option)} className="sr-only" />
                        <span className="font-medium" aria-label={option === 'M.' ? 'Monsieur' : 'Madame'}>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor={ids.profession} className="block text-sm font-medium mb-2">
                Profession <span className="font-normal text-gray-500">(facultatif)</span>
              </label>
              <select id={ids.profession} value={profession} onChange={(e) => setProfession(e.target.value)} className={LISTE}>
                <option value="">Choisir</option>
                {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor={ids.age} className="block text-sm font-medium mb-2">
                Tranche d’âge <span className="font-normal text-gray-500">(facultatif)</span>
              </label>
              <select id={ids.age} value={age} onChange={(e) => setAge(e.target.value)} className={LISTE}>
                <option value="">Choisir</option>
                {TRANCHES_AGE.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
              </select>
            </div>

            {!newsletterDejaChoisie && (
              <label className="flex items-start gap-2.5 text-[13px] text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 text-[16px] rounded-sm border-black/20 text-[#111] focus:ring-2 focus:ring-gold/30 focus:ring-offset-0"
                />
                <span className="leading-relaxed text-balance">
                  Recevoir la newsletter de NFI{' '}Report sur l’économie du Niger <span className="whitespace-nowrap">(désinscription à tout moment).</span>
                </span>
              </label>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => enregistrer(false)}
              disabled={enCours}
              className="w-full flex items-center justify-center gap-2 bg-[#111] text-white py-3.5 rounded-xl text-[14px] font-medium hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              {enCours && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Continuer
            </button>
            {civiliteConnue && (
              <button
                type="button"
                onClick={() => enregistrer(true)}
                disabled={enCours}
                className="w-full text-center text-[13px] text-gray-500 hover:text-gray-700 transition-colors py-2"
              >
                Passer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BienvenuePage() {
  return (
    <Suspense>
      <BienvenueContenu />
    </Suspense>
  );
}
