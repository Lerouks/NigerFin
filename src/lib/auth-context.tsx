'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, UserProfile } from '@/types';
import type { Civilite } from '@/lib/regles-du-compte';
import type { ErreurAuth } from '@/lib/auth/messages';

/** Ce que demande le formulaire d'inscription (src/components/compte/FormulaireInscription.tsx). */
export interface EntreeInscription {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  civilite: Civilite;
  /** La case « Recevoir la newsletter », que la personne coche elle-même. L'abonnement attend la confirmation de l'adresse. */
  newsletter: boolean;
  /** Le chemin du site où revenir après l'inscription (article, paiement). */
  suite?: string | null;
  /** Le jeton anti-robots de Turnstile, quand il est en service. */
  captchaToken?: string;
}

/**
 * Le lien du mail de confirmation (en plus du code à 6 chiffres) passe par
 * /api/auth/callback, qui ouvre la session puis mène à l'écran de bienvenue,
 * et de là à la page de départ. Sans cette adresse, Supabase renvoyait sur
 * l'accueil, et la personne perdait son article ou son paiement.
 */
export function lienDeConfirmation(origine: string, suite?: string | null): string {
  const bienvenue = suite ? `/inscription/bienvenue?suite=${encodeURIComponent(suite)}` : '/inscription/bienvenue';
  return `${origine}/api/auth/callback?next=${encodeURIComponent(bienvenue)}`;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isSignedIn: boolean;
  userRole: UserRole | null;
  premiumArticlesUsed: number;
  error: string | null;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: ErreurAuth | null }>;
  signUp: (entree: EntreeInscription) => Promise<{ error: ErreurAuth | null; existingUser: boolean }>;
  /** Confirme l'adresse avec le code à 6 chiffres du mail, et ouvre la session. */
  verifierCode: (email: string, code: string) => Promise<{ error: ErreurAuth | null }>;
  /** Renvoie le mail de confirmation (nouveau code et nouveau lien). */
  renvoyerCode: (email: string, suite?: string | null, captchaToken?: string) => Promise<{ error: ErreurAuth | null }>;
  /** Ferme la session de cet appareil seulement. */
  signOut: () => Promise<void>;
  /** Ferme toutes les sessions du compte, sur tous les appareils (« Se déconnecter partout »). */
  signOutEverywhere: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isSignedIn: false,
  userRole: null,
  premiumArticlesUsed: 0,
  error: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, existingUser: false }),
  verifierCode: async () => ({ error: null }),
  renvoyerCode: async () => ({ error: null }),
  signOut: async () => {},
  signOutEverywhere: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [premiumArticlesUsed, setPremiumArticlesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(!isSupabaseConfigured ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState<SupabaseClient | null>(() =>
    isSupabaseConfigured ? createBrowserSupabaseClient() : null
  );

  const fetchProfile = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        setProfile(await res.json());
      } else if (res.status === 401 && retryCount < 3) {
        // Cookies may not be synced yet - retry with progressive delay
        const delay = retryCount === 0 ? 100 : retryCount === 1 ? 500 : 1500;
        setTimeout(() => fetchProfile(retryCount + 1), delay);
      } else if (res.status === 401) {
        setProfile(null);
      } else if (retryCount < 2) {
        // Server error - retry once after 2s
        setTimeout(() => fetchProfile(retryCount + 1), 2000);
      }
    } catch {
      if (retryCount < 2) {
        setTimeout(() => fetchProfile(retryCount + 1), 2000);
      }
    }
  }, []);

  const fetchPremiumCount = useCallback(async () => {
    try {
      const res = await fetch('/api/user/premium-count');
      if (res.ok) {
        const data = await res.json();
        setPremiumArticlesUsed(data.count || 0);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: 'auth-fetch-premium-count' } });
      setError('Impossible de charger le compteur premium');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchPremiumCount()]);
  }, [fetchProfile, fetchPremiumCount]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([fetchProfile(), fetchPremiumCount()]);
      }
      setIsLoading(false);
    }).catch((err) => {
      Sentry.captureException(err, { tags: { context: 'auth-get-session' } });
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        // Fetch immediately - retry logic handles cookie sync delays
        Promise.all([fetchProfile(0), fetchPremiumCount()]);
      } else {
        setProfile(null);
        setPremiumArticlesUsed(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchPremiumCount]);

  // Refresh profile when tab becomes visible (detects admin subscription changes)
  useEffect(() => {
    if (!supabase) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && session?.user) {
        fetchProfile();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [supabase, session, fetchProfile]);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    return { error: error ? { message: error.message, code: error.code, status: error.status } : null };
  };

  const signUp = async ({ email, motDePasse, prenom, nom, civilite, newsletter, suite, captchaToken }: EntreeInscription) => {
    if (!supabase) return { error: { message: 'Supabase not configured' }, existingUser: false };

    // Prénom et nom arrivent séparés et déjà vérifiés (src/lib/regles-du-compte.ts) :
    // plus de découpage d'un nom complet au premier espace, qui faussait les
    // prénoms composés et l'ordre « NOM Prénom ».
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: motDePasse,
      options: {
        emailRedirectTo: lienDeConfirmation(window.location.origin, suite),
        ...(captchaToken ? { captchaToken } : {}),
        data: {
          full_name: `${prenom} ${nom}`,
          civility: civilite,
          first_name: prenom,
          last_name: nom,
          newsletter,
        },
      },
    });

    // Supabase returns a fake user with empty identities when email already exists
    const existingUser = !!(
      !error && data?.user && (!data.user.identities || data.user.identities.length === 0)
    );

    if (existingUser) {
      // Log the duplicate signup attempt
      try {
        await fetch('/api/auth/log-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'duplicate_signup', email }),
        });
      } catch (err) {
        Sentry.captureException(err, { tags: { context: 'auth-log-duplicate-signup' } });
      }
    }

    return {
      error: existingUser
        ? { message: 'ACCOUNT_EXISTS' }
        : error ? { message: error.message, code: error.code, status: error.status } : null,
      existingUser,
    };
  };

  const verifierCode = async (email: string, code: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    return { error: error ? { message: error.message, code: error.code, status: error.status } : null };
  };

  const renvoyerCode = async (email: string, suite?: string | null, captchaToken?: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: lienDeConfirmation(window.location.origin, suite),
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    return { error: error ? { message: error.message, code: error.code, status: error.status } : null };
  };

  // Sans portée, supabase.auth.signOut() ferme TOUTES les sessions du compte
  // (téléphone, ordinateur, app Cockpit) : « Se déconnecter » ne ferme que
  // celle de cet appareil, « Se déconnecter partout » les ferme toutes.
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: 'local' });
    setProfile(null);
    setPremiumArticlesUsed(0);
  };

  const signOutEverywhere = async (): Promise<{ error: string | null }> => {
    if (!supabase) return { error: 'Service indisponible.' };
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) return { error: error.message };
    setProfile(null);
    setPremiumArticlesUsed(0);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isSignedIn: !!session,
        userRole: (profile?.role as UserRole) || null,
        premiumArticlesUsed,
        error,
        signIn,
        signUp,
        verifierCode,
        renvoyerCode,
        signOut,
        signOutEverywhere,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
