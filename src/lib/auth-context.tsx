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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
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
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [premiumArticlesUsed, setPremiumArticlesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(!isSupabaseConfigured ? false : true);
  const [supabase] = useState<SupabaseClient | null>(() =>
    isSupabaseConfigured ? createBrowserSupabaseClient() : null
  );

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {}
  }, []);

  const fetchPremiumCount = useCallback(async () => {
    try {
      const res = await fetch('/api/user/premium-count');
      if (res.ok) {
        const data = await res.json();
        setPremiumArticlesUsed(data.count || 0);
      }
    } catch {}
  }, []);

  const refreshProfile = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchPremiumCount()]);
  }, [fetchProfile, fetchPremiumCount]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        fetchProfile();
        fetchPremiumCount();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        fetchProfile();
        fetchPremiumCount();
      } else {
        setProfile(null);
        setPremiumArticlesUsed(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchPremiumCount]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error };
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
