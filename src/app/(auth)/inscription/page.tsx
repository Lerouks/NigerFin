'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

function InscriptionContent() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
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
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-10 pr-10 py-2.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111] text-white py-3 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 text-[14px]"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
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
