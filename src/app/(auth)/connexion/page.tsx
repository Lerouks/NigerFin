'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { chargementComplet } from '@/lib/chargement-complet';
import { useAuth } from '@/lib/auth-context';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { safeNextPath } from '@/lib/validation';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { BoutonGoogle, useGoogleDisponible } from '@/components/auth/ConnexionGoogle';
import { EtapeCode } from '@/components/compte/EtapeCode';
import { Turnstile, turnstileActif } from '@/components/securite/Turnstile';
import { estNonConfirme, phraseErreurAuth } from '@/lib/auth/messages';

// Traits d'union insécables (\u2011) : « connectez-vous » et « e-mail » ne se coupent pas en fin de ligne.
const ERREUR_GOOGLE = 'La connexion avec Google n’a pas abouti. Réessayez, ou connectez\u2011vous avec votre\u00a0e\u2011mail.';
// Le lien d'un mail ouvert dans un autre navigateur ne peut pas ouvrir la session, mais l'adresse est confirmée.
const ERREUR_LIEN = 'Ce lien n’a pas pu vous connecter. Si vous venez de confirmer votre adresse, connectez\u2011vous ci\u2011dessous.';
const PAS_PRET = 'La vérification anti-robots n’est pas encore prête. Patientez une seconde, puis réessayez.';

function ConnexionContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    searchParams.get('erreur') === 'google' ? ERREUR_GOOGLE : searchParams.get('error') === 'auth' ? ERREUR_LIEN : '',
  );
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(searchParams.get('oubli') === '1');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [nonConfirme, setNonConfirme] = useState(false);
  const [etapeCode, setEtapeCode] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  const { signIn, renvoyerCode } = useAuth();
  const google = useGoogleDisponible();
  const suite = searchParams.get('redirect') ?? searchParams.get('next');
  const inscription = suite ? `/inscription?next=${encodeURIComponent(safeNextPath(suite))}` : '/inscription';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNonConfirme(false);
    if (turnstileActif && !jeton) { setError(PAS_PRET); return; }
    setLoading(true);

    const { error } = await signIn(email, password, jeton ?? undefined);
    setTour((t) => t + 1);

    if (error) {
      // Compte pas encore confirmé : on le dit, et on propose un nouveau code.
      if (estNonConfirme(error)) setNonConfirme(true);
      setError(phraseErreurAuth(error, 'Une erreur est survenue. Veuillez réessayer.'));
      setLoading(false);
    } else {
      // Redirect immediately - profile loads in background via auth-context.
      // Seul un chemin du site est suivi : un lien piégé vers /connexion ne doit
      // pas pouvoir envoyer le lecteur, tout juste connecté, sur un autre site.
      // Les pages du site renvoient ici avec « next » (factures, préférences,
      // édition d'une newsletter) ; l'ancienne forme « redirect » reste lue.
      // Chargement complet, pas une navigation interne : le layout racine doit
      // être réévalué avec la session (pendant le pré-lancement, un admin passe
      // de la page de connexion sans menu au site complet).
      chargementComplet(safeNextPath(searchParams.get('redirect') ?? searchParams.get('next')));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Veuillez entrer votre email.'); return; }
    if (turnstileActif && !jeton) { setError(PAS_PRET); return; }
    setError('');
    setResetLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/connexion/nouveau-mot-de-passe`,
        ...(jeton ? { captchaToken: jeton } : {}),
      });
      if (error) {
        setError(phraseErreurAuth(error, 'L’envoi a échoué. Vérifiez votre adresse e-mail.'));
      } else {
        setResetSent(true);
      }
    } catch {
      setError('L’envoi a échoué. Vérifiez votre connexion, puis réessayez.');
    }
    setTour((t) => t + 1);
    setResetLoading(false);
  };

  const demanderCode = async () => {
    if (turnstileActif && !jeton) { setError(PAS_PRET); return; }
    setLoading(true);
    const { error } = await renvoyerCode(email, suite ? safeNextPath(suite) : null, jeton ?? undefined);
    setTour((t) => t + 1);
    setLoading(false);
    if (error) { setError(phraseErreurAuth(error)); return; }
    setError('');
    setNonConfirme(false);
    setEtapeCode(true);
  };

  if (etapeCode) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 animate-fade-in-up">
          <EtapeCode
            email={email.trim()}
            suite={suite ? safeNextPath(suite) : null}
            onConfirme={() => chargementComplet(`/inscription/bienvenue?suite=${encodeURIComponent(safeNextPath(suite))}`)}
            onModifierAdresse={() => setEtapeCode(false)}
          />
        </div>
      </AuthLayout>
    );
  }

  if (resetSent) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 text-center animate-fade-in-up">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Email envoyé</h1>
          <p className="text-gray-600 text-sm mb-6">
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte mail et suivez les instructions.
          </p>
          <button onClick={() => { setForgotMode(false); setResetSent(false); }} className="text-sm text-black hover:underline font-medium">
            Retour à la connexion
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (forgotMode) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 animate-fade-in-up">
          <button onClick={() => { setForgotMode(false); setError(''); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-3">Mot de passe oublié</h1>
            <p className="text-gray-500 text-sm">Entrez votre email pour recevoir un lien de réinitialisation.</p>
          </div>
          {error && <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium mb-2.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/8 rounded-xl pl-12 pr-4 py-3.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                  placeholder="votre@email.com" />
              </div>
            </div>
            <Turnstile onJeton={setJeton} tour={tour} action="mot-de-passe-oublie" />
            <button type="submit" disabled={resetLoading}
              className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 text-[15px] font-medium active:scale-[0.98]">
              {resetLoading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Connexion</h1>
          <p className="text-gray-500 text-base">
            Accédez à votre compte NFI&nbsp;Report
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 text-balance">
            {error}
            {nonConfirme && (
              <button
                type="button"
                onClick={demanderCode}
                disabled={loading}
                className="mt-2 block font-semibold text-[#111] underline underline-offset-2 disabled:opacity-50"
              >
                Recevoir un code pour l’activer
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/8 rounded-xl pl-12 pr-4 py-3.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label htmlFor="password" className="block text-sm font-medium whitespace-nowrap">Mot de passe</label>
              <button type="button" onClick={() => { setForgotMode(true); setError(''); }} className="text-[13px] text-gray-500 hover:text-gold transition-colors">
                Mot de passe oublié&nbsp;?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/8 rounded-xl pl-12 pr-12 py-3.5 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Turnstile onJeton={setJeton} tour={tour} action="connexion" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 text-[15px] font-medium active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connexion…
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/6" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500">ou</span>
          </div>
        </div>

        {google && <BoutonGoogle suite={suite} />}

        <p className={`text-center text-sm text-gray-500${google ? ' mt-8' : ''}`}>
          Pas encore de compte&nbsp;?{' '}
          <Link href={inscription} className="text-[#111] hover:text-gold font-semibold transition-colors">
            Créer&nbsp;un&nbsp;compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  );
}
