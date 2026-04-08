'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isSignedIn: boolean;
  userRole: UserRole | null;
  premiumArticlesUsed: number;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: { message: string } | null; existingUser: boolean }>;
  signOut: () => Promise<void>;
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
  signOut: async () => {},
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
      console.error('[AUTH] Failed to fetch premium count:', err);
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
      console.error('[AUTH] Failed to get session:', err);
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

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' }, existingUser: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
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
        console.error('[AUTH] Failed to log duplicate signup attempt:', err);
      }
    }

    return {
      error: existingUser
        ? { message: 'ACCOUNT_EXISTS' }
        : error,
      existingUser,
    };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setPremiumArticlesUsed(0);
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
        signOut,
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
