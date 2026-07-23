'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; label: string; color: string; bgColor: string; width: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', label: 'Faible', color: 'text-red-600', bgColor: 'bg-red-500', width: 'w-1/3' };
  if (score <= 3) return { level: 'medium', label: 'Moyen', color: 'text-amber-600', bgColor: 'bg-amber-500', width: 'w-2/3' };
  return { level: 'strong', label: 'Fort', color: 'text-emerald-600', bgColor: 'bg-emerald-500', width: 'w-full' };
}

type Civility = 'M.' | 'Mme';

function InscriptionContent() {
  const searchParams = useSearchParams();
  const [civility, setCivility] = useState<Civility | ''>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const { signUp } = useAuth();

  const strength = password ? getPasswordStrength(password) : null;
  const passwordsMatch = confirmPassword ? password === confirmPassword : true;

  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/).filter(p => p.length >= 2);
  const isNameValid = nameParts.length >= 2;
  const isCivilityValid = civility === 'M.' || civility === 'Mme';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isCivilityValid) {
      setError('Veuillez sélectionner votre civilité.');
      setLoading(false);
      return;
    }

    if (!isNameValid) {
      setError('Veuillez entrer votre nom et prénom (au moins 2 caractères chacun).');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    const { error, existingUser } = await signUp(email, password, trimmedName, civility as Civility);

    if (existingUser) {
      setAccountExists(true);
      setLoading(false);
    } else if (error) {
      setError(error.message || 'Une erreur est survenue.');
      setLoading(false);
    } else {
      // Opt-in newsletter best-effort, ne bloque pas la création du compte
      // si Resend/Supabase plante (l'user verra juste pas l'email de bienvenue,
      // l'inscription compte reste valide).
      if (newsletterOptIn) {
        fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'signup' }),
        }).catch(() => {});
      }
      setSuccess(true);
      setLoading(false);
    }
  };

  if (accountExists) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 text-center animate-fade-in-up">
          <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Compte existant</h1>
          <p className="text-gray-600 text-sm mb-6">
            Un compte est déjà associé à cette adresse email.
            Veuillez vous connecter pour accéder à votre espace.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-[#111] text-white px-6 py-3 rounded-xl hover:bg-[#222] transition-colors text-[14px]"
          >
            Se connecter
          </Link>
          <p className="text-gray-500 text-[12px] mt-4">
            Mot de passe oublié ? Contactez le support.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 text-center animate-fade-in-up">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Vérifiez votre email</h1>
          <p className="text-gray-600 text-sm mb-6">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-[#111] text-white px-6 py-3 rounded-xl hover:bg-[#222] transition-colors text-[14px]"
          >
            Aller à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-8 sm:p-10 animate-fade-in-up">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-6">
          <Link href="/" className="text-xl font-bold text-[#111]">NFI Report</Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
          <p className="text-gray-500 text-sm">
            Rejoignez NFI Report gratuitement
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Civilité</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['M.', 'Mme'] as const).map((opt) => {
                const selected = civility === opt;
                return (
                  <label
                    key={opt}
                    className={`flex items-center justify-center gap-2 cursor-pointer border rounded-xl px-4 py-3 text-sm transition-all ${
                      selected
                        ? 'border-[#111] bg-background text-[#111]'
                        : 'border-black/8 bg-white text-gray-600 hover:border-black/16'
                    }`}
                  >
                    <input
                      type="radio"
                      name="civility"
                      value={opt}
                      required
                      checked={selected}
                      onChange={() => setCivility(opt)}
                      className="sr-only"
                    />
                    <span className="font-medium" aria-label={opt === 'M.' ? 'Monsieur' : 'Madame'}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Nom complet</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={fullName && !isNameValid ? 'true' : undefined}
                className={`w-full border rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:ring-2 transition-all text-base ${
                  fullName && !isNameValid
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-black/8 focus:border-gold/30 focus:ring-gold/10'
                }`}
                placeholder="Prénom et nom"
              />
            </div>
            {fullName && !isNameValid && (
              <p className="text-[11px] mt-1 text-red-500">Veuillez entrer votre nom et prénom (au moins 2 caractères chacun).</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/8 rounded-xl pl-11 pr-4 py-3 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/8 rounded-xl pl-11 pr-11 py-3 bg-background focus:outline-hidden focus:border-gold/30 focus:ring-2 focus:ring-gold/10 transition-all text-base"
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && strength && (
              <div className="mt-2.5">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.bgColor} ${strength.width} rounded-full transition-all duration-300`} />
                </div>
                <p className={`text-[11px] mt-1 ${strength.color}`}>Force du mot de passe : {strength.label}</p>
              </div>
            )}
            {password && password.length < 8 && (
              <p className="text-[11px] mt-1 text-red-500">Le mot de passe doit contenir au moins 8 caractères.</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={confirmPassword && !passwordsMatch ? 'true' : undefined}
                className={`w-full border rounded-xl pl-11 pr-11 py-3 bg-background focus:outline-hidden focus:ring-2 transition-all text-base ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-black/8 focus:border-gold/30 focus:ring-gold/10'
                }`}
                placeholder="Confirmez votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] mt-1 text-red-500">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 text-[13px] text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-sm border-black/20 text-[#111] focus:ring-2 focus:ring-gold/30 focus:ring-offset-0"
            />
            <span className="leading-relaxed">
              Recevoir Le Brief du Lundi, notre newsletter (1 édito long chaque lundi sur l&apos;économie Niger et UEMOA, désabonnement en 1 clic).
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !isCivilityValid || !isNameValid || password.length < 8 || password !== confirmPassword}
            className="w-full bg-[#111] text-white py-3.5 rounded-xl hover:bg-[#222] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Création...
              </span>
            ) : 'Créer mon compte'}
          </button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/6" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500">ou</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-[#111] hover:text-gold font-semibold transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionContent />
    </Suspense>
  );
}
