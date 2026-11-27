'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chargementComplet } from '@/lib/chargement-complet';
import { phraseErreurAuth } from '@/lib/auth/messages';
import { erreurMotDePasse, MOT_DE_PASSE_MAX } from '@/lib/mot-de-passe';
import { CIVILITES, erreurNom, estCivilite, normaliserNom, NOM_MAX, type Civilite } from '@/lib/regles-du-compte';
import { isValidEmail } from '@/lib/validation';
import { Turnstile, turnstileActif } from '@/components/securite/Turnstile';
import { EtapeCode } from '@/components/compte/EtapeCode';

/**
 * Le seul formulaire d'inscription du site, partagé par /inscription et par
 * /paiement (décisions de Raouf, 26 et 27/11/2026) : civilité, prénom et nom
 * obligatoires, adresse e-mail, mot de passe de 8 caractères au moins, case
 * newsletter à cocher soi-même, puis le code à 6 chiffres reçu par e-mail.
 */

const CHAMP = 'w-full border rounded-xl px-4 py-3 bg-background focus:outline-hidden focus:ring-2 transition-all text-base';
const CHAMP_OK = 'border-black/8 focus:border-gold/30 focus:ring-gold/10';
const CHAMP_ERREUR = 'border-red-300 focus:border-red-400 focus:ring-red-100';

function ErreurChamp({ id, texte }: { id: string; texte: string | null }) {
  if (!texte) return null;
  return <p id={id} className="text-[12px] mt-1.5 text-red-600 text-balance">{texte}</p>;
}

export function FormulaireInscription({ suite, variante = 'page', emailInitial = '', onCompteExistant, onConnecte, entete, pied }: {
  /** Le chemin du site où revenir une fois inscrit (déjà vérifié par safeNextPath). */
  suite?: string | null;
  /** page : /inscription, avec titre et écran de bienvenue ; paiement : dans la page de paiement. */
  variante?: 'page' | 'paiement';
  emailInitial?: string;
  /** Paiement : l'adresse a déjà un compte, on passe à la connexion. */
  onCompteExistant?: (email: string) => void;
  /** Paiement : l'adresse est confirmée et la session ouverte. */
  onConnecte?: () => void;
  /** Le titre de la page, montré avec le formulaire seulement (pas pendant le code). */
  entete?: React.ReactNode;
  /** Ce qui suit le formulaire (Google, « Déjà un compte »), montré avec lui seulement. */
  pied?: React.ReactNode;
}) {
  const { signUp } = useAuth();
  const ids = { civilite: useId(), prenom: useId(), nom: useId(), email: useId(), mdp: useId(), confirmation: useId() };
  const [etape, setEtape] = useState<'formulaire' | 'code' | 'existant'>('formulaire');
  const [civilite, setCivilite] = useState<Civilite | ''>('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState(emailInitial);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [vus, setVus] = useState<Record<string, boolean>>({});
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [tour, setTour] = useState(0);

  const erreurs = {
    civilite: estCivilite(civilite) ? null : 'Choisissez votre civilité.',
    prenom: erreurNom(prenom, 'Le prénom'),
    nom: erreurNom(nom, 'Le nom'),
    email: isValidEmail(email.trim()) ? null : 'Entrez une adresse e-mail valide.',
    motDePasse: erreurMotDePasse(motDePasse, { email, prenom, nom }),
    confirmation: confirmation === motDePasse ? null : 'Les deux mots de passe ne correspondent pas.',
  };
  const montre = (cle: keyof typeof erreurs) => (envoye || vus[cle] ? erreurs[cle] : null);
  const vu = (cle: string) => () => setVus((v) => ({ ...v, [cle]: true }));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoye(true);
    setErreur('');
    const premiere = Object.values(erreurs).find(Boolean);
    if (premiere) {
      setErreur(premiere);
      return;
    }
    if (turnstileActif && !jeton) {
      setErreur('La vérification anti-robots n’est pas encore prête. Patientez une seconde, puis réessayez.');
      return;
    }
    setEnCours(true);
    const { error, existingUser } = await signUp({
      email: email.trim(),
      motDePasse,
      prenom: normaliserNom(prenom),
      nom: normaliserNom(nom),
      civilite: civilite as Civilite,
      newsletter,
      suite,
      captchaToken: jeton ?? undefined,
    });
    setEnCours(false);
    setTour((t) => t + 1);
    if (existingUser) {
      if (onCompteExistant) onCompteExistant(email.trim());
      else setEtape('existant');
      return;
    }
    if (error) {
      setErreur(phraseErreurAuth(error));
      return;
    }
    setEtape('code');
  }

  function apresConfirmation() {
    if (variante === 'paiement') {
      // Mail de bienvenue et newsletter choisie, sans quitter le paiement.
      fetch('/api/auth/bienvenue', { method: 'POST' }).catch(() => {});
      onConnecte?.();
      return;
    }
    chargementComplet(suite ? `/inscription/bienvenue?suite=${encodeURIComponent(suite)}` : '/inscription/bienvenue');
  }

  if (etape === 'code') {
    return (
      <EtapeCode
        email={email.trim()}
        suite={suite}
        titre={variante === 'page'}
        onConfirme={apresConfirmation}
        onModifierAdresse={() => { setEtape('formulaire'); setMotDePasse(''); setConfirmation(''); }}
      />
    );
  }

  if (etape === 'existant') {
    const adresse = encodeURIComponent(email.trim());
    const apres = suite ? `&next=${encodeURIComponent(suite)}` : '';
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <User className="w-7 h-7 text-gold" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Compte existant</h1>
        <p className="text-gray-600 text-sm mb-6 text-pretty">
          Un compte est déjà associé à cette adresse e-mail. Connectez-vous pour retrouver votre espace.
        </p>
        <Link
          href={`/connexion?email=${adresse}${apres}`}
          className="inline-block bg-[#111] text-white px-6 py-3 rounded-xl hover:bg-[#222] transition-colors text-[14px]"
        >
          Se connecter
        </Link>
        <p className="text-[13px] mt-4">
          <Link href={`/connexion?oubli=1&email=${adresse}${apres}`} className="text-gray-600 hover:text-[#111] underline underline-offset-2">
            Mot de passe oublié{' '}?
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
    {entete}
    <form onSubmit={envoyer} className="space-y-5" noValidate>
      {erreur && (
        <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg text-pretty">
          {erreur}
        </div>
      )}

      <fieldset aria-describedby={montre('civilite') ? `${ids.civilite}-e` : undefined}>
        <legend className="block text-sm font-medium mb-2">Civilité</legend>
        <div className="grid grid-cols-2 gap-3">
          {CIVILITES.map((option) => {
            const choisie = civilite === option;
            return (
              <label
                key={option}
                className={`flex items-center justify-center gap-2 cursor-pointer border rounded-xl px-4 py-3 text-sm transition-all ${
                  choisie ? 'border-[#111] bg-background text-[#111]' : montre('civilite') ? 'border-red-300 bg-white text-gray-600' : 'border-black/8 bg-white text-gray-600 hover:border-black/16'
                }`}
              >
                <input
                  type="radio"
                  name="civilite"
                  value={option}
                  checked={choisie}
                  onChange={() => setCivilite(option)}
                  className="sr-only"
                />
                <span className="font-medium" aria-label={option === 'M.' ? 'Monsieur' : 'Madame'}>{option}</span>
              </label>
            );
          })}
        </div>
        <ErreurChamp id={`${ids.civilite}-e`} texte={montre('civilite')} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.prenom} className="block text-sm font-medium mb-2">Prénom</label>
          <input
            id={ids.prenom}
            type="text"
            autoComplete="given-name"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={NOM_MAX + 10}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            onBlur={vu('prenom')}
            aria-invalid={montre('prenom') ? 'true' : undefined}
            aria-describedby={montre('prenom') ? `${ids.prenom}-e` : undefined}
            className={`${CHAMP} ${montre('prenom') ? CHAMP_ERREUR : CHAMP_OK}`}
          />
          <ErreurChamp id={`${ids.prenom}-e`} texte={montre('prenom')} />
        </div>
        <div>
          <label htmlFor={ids.nom} className="block text-sm font-medium mb-2">Nom</label>
          <input
            id={ids.nom}
            type="text"
            autoComplete="family-name"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={NOM_MAX + 10}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onBlur={vu('nom')}
            aria-invalid={montre('nom') ? 'true' : undefined}
            aria-describedby={montre('nom') ? `${ids.nom}-e` : undefined}
            className={`${CHAMP} ${montre('nom') ? CHAMP_ERREUR : CHAMP_OK}`}
          />
          <ErreurChamp id={`${ids.nom}-e`} texte={montre('nom')} />
        </div>
      </div>

      <div>
        <label htmlFor={ids.email} className="block text-sm font-medium mb-2">Adresse e-mail</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" aria-hidden="true" />
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={vu('email')}
            aria-invalid={montre('email') ? 'true' : undefined}
            aria-describedby={montre('email') ? `${ids.email}-e` : undefined}
            className={`${CHAMP} pl-11 ${montre('email') ? CHAMP_ERREUR : CHAMP_OK}`}
            placeholder="votre@email.com"
          />
        </div>
        <ErreurChamp id={`${ids.email}-e`} texte={montre('email')} />
      </div>

      <div>
        <label htmlFor={ids.mdp} className="block text-sm font-medium mb-2">Mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" aria-hidden="true" />
          <input
            id={ids.mdp}
            type={voirMdp ? 'text' : 'password'}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value.slice(0, MOT_DE_PASSE_MAX))}
            onBlur={vu('motDePasse')}
            aria-invalid={montre('motDePasse') ? 'true' : undefined}
            aria-describedby={`${ids.mdp}-aide`}
            className={`${CHAMP} pl-11 pr-11 ${montre('motDePasse') ? CHAMP_ERREUR : CHAMP_OK}`}
          />
          <button
            type="button"
            onClick={() => setVoirMdp((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            aria-label={voirMdp ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
          >
            {voirMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p id={`${ids.mdp}-aide`} className={`text-[12px] mt-1.5 text-pretty ${montre('motDePasse') ? 'text-red-600' : 'text-gray-500'}`}>
          {montre('motDePasse') ?? '8 caractères au moins, rien d’autre.'}
        </p>
      </div>

      <div>
        <label htmlFor={ids.confirmation} className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" aria-hidden="true" />
          <input
            id={ids.confirmation}
            type={voirMdp ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value.slice(0, MOT_DE_PASSE_MAX))}
            onBlur={vu('confirmation')}
            aria-invalid={montre('confirmation') ? 'true' : undefined}
            aria-describedby={montre('confirmation') ? `${ids.confirmation}-e` : undefined}
            className={`${CHAMP} pl-11 ${montre('confirmation') ? CHAMP_ERREUR : CHAMP_OK}`}
          />
        </div>
        <ErreurChamp id={`${ids.confirmation}-e`} texte={montre('confirmation')} />
      </div>

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

      <Turnstile onJeton={setJeton} tour={tour} action="inscription" />

      <button
        type="submit"
        disabled={enCours}
        className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium active:scale-[0.98]"
      >
        {enCours ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Création…
          </span>
        ) : 'Créer mon compte'}
      </button>
    </form>
    {pied}
    </>
  );
}
