'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

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

function InscriptionContent() {
  const searchParams = useSearchParams();
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
  const { signUp } = useAuth();
  const router = useRouter();

  const strength = password ? getPasswordStrength(password) : null;
  const passwordsMatch = confirmPassword ? password === confirmPassword : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    const { error, existingUser } = await signUp(email, password, fullName);

    if (existingUser) {
      setAccountExists(true);
      setLoading(false);
    } else if (error) {
      setError(error.message || 'Une erreur est survenue.');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (accountExists) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <User className="w-7 h-7 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Compte existant</h1>
            <p className="text-gray-600 text-sm mb-6">
              Un compte est déjà associé à cette adresse email.
              Veuillez vous connecter pour accéder à votre espace.
            </p>
            <Link
              href="/connexion"
              className="inline-block bg-[#111] text-white px-6 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]"
            >
              Se connecter
            </Link>
            <p className="text-gray-400 text-[12px] mt-4">
              Mot de passe oublié ? Contactez le support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-8 text-center">
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
              className="inline-block bg-[#111] text-white px-6 py-3 rounded-lg hover:bg-[#333] transition-colors text-[14px]"
            >
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-8">
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-10 pr-4 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-10 pr-4 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-10 pr-10 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && strength && (
                <div className="mt-2">
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={confirmPassword && !passwordsMatch ? 'true' : undefined}
                  className={`w-full border rounded-lg pl-10 pr-10 py-2.5 bg-[#fafaf9] focus:outline-none focus:ring-1 transition-all text-base ${
                    confirmPassword && !passwordsMatch
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-black/[0.08] focus:border-black/15 focus:ring-black/5'
                  }`}
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] mt-1 text-red-500">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full bg-[#111] text-white py-3 rounded-lg hover:bg-[#333] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création...
                </span>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="text-black hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionContent />
    </Suspense>
  );
}
