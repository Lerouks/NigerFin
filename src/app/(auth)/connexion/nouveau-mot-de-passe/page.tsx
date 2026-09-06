'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';

/**
 * Page de definition d'un nouveau mot de passe apres un lien recu par courriel.
 *
 * Elle vit sous /connexion, et c'est le point important : le mode pre-lancement
 * ferme tout le site sauf /connexion, /auth, /admin et les pages legales. Le lien
 * de reinitialisation pointait auparavant vers /compte, une page fermee : le
 * proprietaire du site ne pouvait donc pas reprendre la main sur son propre
 * compte s'il oubliait son mot de passe, et cela restait vrai tant que le site
 * n'etait pas ouvert au public.
 */

const REGLES = [
  { cle: 'longueur', texte: 'au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { cle: 'majuscule', texte: 'une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { cle: 'chiffre', texte: 'un chiffre', test: (v: string) => /\d/.test(v) },
  { cle: 'special', texte: 'un caractère spécial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null);
  const [sessionPrete, setSessionPrete] = useState<boolean | null>(null);
  const minuteurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Le lien recu par courriel ouvre une session temporaire. Sans elle, le
  // changement de mot de passe echouerait sans que l'on comprenne pourquoi :
  // autant le dire tout de suite et proposer de redemander un lien.
  useEffect(() => {
    let annule = false;
    const client = createBrowserSupabaseClient();
    if (!client) { setSessionPrete(false); return; }

    const { data: ecoute } = client.auth.onAuthStateChange((_evenement, session) => {
      if (!annule && session) setSessionPrete(true);
    });

    client.auth.getSession().then(({ data }) => {
      if (annule) return;
      if (data.session) { setSessionPrete(true); return; }
      // Pas encore de session : le jeton du lien arrive dans l'adresse et met un
      // instant a etre traite. Conclure tout de suite ferait clignoter un
      // avertissement faux sur une connexion lente, et celle de Raouf coupe
      // regulierement. On laisse deux secondes avant de trancher.
      const minuteur = setTimeout(() => {
        if (annule) return;
        client.auth.getSession().then(({ data: seconde }) => {
          if (!annule) setSessionPrete(Boolean(seconde.session));
        });
      }, 2000);
      minuteurRef.current = minuteur;
    });

    return () => {
      annule = true;
      ecoute.subscription.unsubscribe();
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
    };
  }, []);

  const reglesTenues = REGLES.every((r) => r.test(motDePasse));
  const identiques = confirmation.length > 0 && motDePasse === confirmation;
  const envoyable = reglesTenues && identiques && motDePasse.length <= 128 && !enCours && sessionPrete !== false;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!envoyable) return;
    setEnCours(true);
    try {
      const client = createBrowserSupabaseClient();
      if (!client) throw new Error('indisponible');
      const { error } = await client.auth.updateUser({ password: motDePasse });
      if (error) {
        setMessage({ type: 'erreur', texte: traduire(error.message) });
      } else {
        setMessage({ type: 'succes', texte: 'Mot de passe enregistré. Redirection en cours.' });
        setTimeout(() => router.replace('/admin'), 1200);
      }
    } catch {
      setMessage({
        type: 'erreur',
        texte: "La connexion a echoue. Vérifiez votre réseau puis réessayez : rien n'a ete modifie.",
      });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-3">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm">Choisissez le mot de passe qui remplacera l&apos;ancien.</p>
        </div>

        {sessionPrete === false && (
          <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-6">
            Ce lien n&apos;est plus valable. Les liens de réinitialisation expirent au bout d&apos;une heure.{' '}
            <Link href="/connexion" className="underline font-medium">Demander un nouveau lien</Link>.
          </div>
        )}

        {message && (
          <div
            role="alert"
            className={`text-sm px-4 py-3 rounded-lg mb-6 flex items-start gap-2 ${
              message.type === 'succes'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-100 text-red-600'
            }`}
          >
            {message.type === 'succes' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {message.texte}
          </div>
        )}

        <form onSubmit={envoyer} className="space-y-6">
          <div>
            <label htmlFor="nouveau" className="block text-sm font-medium mb-2.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="nouveau"
                type={visible ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={motDePasse}
                disabled={sessionPrete === false}
                onChange={(e) => setMotDePasse(e.target.value.slice(0, 128))}
                className="w-full border border-black/8 rounded-xl pl-12 pr-12 py-3.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="Votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ul className="mt-3 space-y-1">
              {REGLES.map((regle) => {
                const tenue = regle.test(motDePasse);
                return (
                  <li key={regle.cle} className={`text-[12px] flex items-center gap-1.5 ${tenue ? 'text-emerald-700' : 'text-gray-500'}`}>
                    <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${tenue ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                    {regle.texte}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium mb-2.5">Confirmer</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="confirmation"
                type={visible ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmation}
                disabled={sessionPrete === false}
                onChange={(e) => setConfirmation(e.target.value.slice(0, 128))}
                className="w-full border border-black/8 rounded-xl pl-12 pr-4 py-3.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="Le même, une seconde fois"
              />
            </div>
            {confirmation.length > 0 && !identiques && (
              <p className="mt-2 text-[12px] text-red-600">Les deux saisies ne sont pas identiques.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!envoyable}
            className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 text-[15px] font-medium active:scale-[0.98]"
          >
            {enCours ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-500">
          <Link href="/connexion" className="hover:text-gold transition-colors">Revenir à la connexion</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

/** Les messages de Supabase arrivent en anglais : personne ici ne doit lire de l'anglais. */
function traduire(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('should be different')) return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes('at least')) return 'Le mot de passe est trop court.';
  if (m.includes('expired') || m.includes('invalid')) {
    return "Ce lien n'est plus valable. Demandez-en un nouveau depuis la page de connexion.";
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  return "Le mot de passe n'a pas pu être enregistré. Réessayez dans un instant.";
}
