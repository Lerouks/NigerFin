'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

function ConnexionContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : 'Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    } else {
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/');
      router.refresh();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Veuillez entrer votre email.'); return; }
    setError('');
    setResetLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent('/compte?reset=true')}`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch {
      setError("Erreur lors de l'envoi. Vérifiez votre email.");
    }
    setResetLoading(false);
  };

  if (resetSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#fafaf9] px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12 text-center">
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
        </div>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#fafaf9] px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12">
            <button onClick={() => { setForgotMode(false); setError(''); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-3">Mot de passe oublié</h1>
              <p className="text-gray-500 text-sm">Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium mb-2.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-black/[0.08] rounded-lg pl-12 pr-4 py-3.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                    placeholder="votre@email.com" />
                </div>
              </div>
              <button type="submit" disabled={resetLoading}
                className="w-full bg-[#111] text-white py-3.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 text-[15px] font-medium">
                {resetLoading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fafaf9] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-10 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Connexion</h1>
            <p className="text-gray-500 text-base">
              Accédez à votre compte NFI Report
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-12 pr-4 py-3.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(''); }} className="text-[13px] text-gray-500 hover:text-black transition-colors">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/[0.08] rounded-lg pl-12 pr-12 py-3.5 bg-[#fafaf9] focus:outline-none focus:border-black/15 focus:ring-1 focus:ring-black/5 transition-all text-base"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111] text-white py-3.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 text-[15px] font-medium"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="text-black hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  );
}
