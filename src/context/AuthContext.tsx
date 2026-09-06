import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export interface SignUpResult {
  error: Error | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function normalizeAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const msg = (err.message || err.error_description || err.msg || String(err)).toLowerCase();

  if (
    msg.includes('unsupported provider') ||
    msg.includes('provider is not enabled') ||
    msg.includes('provider_not_enabled')
  ) {
    return 'Google Sign-In is not enabled yet in your Supabase project. Please enable Google in your Supabase Dashboard under Authentication > Providers.';
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your details and try again.';
  }

  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('email already in use')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (msg.includes('email not confirmed') || msg.includes('unconfirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification email.';
  }

  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute before trying again.';
  }

  if (msg.includes('invalid email') || msg.includes('valid email')) {
    return 'Please enter a valid email address.';
  }

  return err.message || 'Authentication error. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAILS = ['tanikshnimje@gmail.com'];

  // Fetch or sync profile in Supabase profiles table
  const fetchProfile = async (currentUser: User) => {
    try {
      const isDesignatedAdmin =
        currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

      // 1. Direct query
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        if (isDesignatedAdmin && data.role !== 'admin') {
          // Sync admin role in database
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', currentUser.id);
          data.role = 'admin';
        }
        setProfile(data as Profile);
        return;
      }

      // 2. If profile is missing, attempt client-side insert
      const fallbackName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Customer';

      const newProfile: Partial<Profile> = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: fallbackName,
        phone: currentUser.user_metadata?.phone || null,
        avatar_url: currentUser.user_metadata?.avatar_url || null,
        role: isDesignatedAdmin ? 'admin' : 'customer',
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (inserted) {
        setProfile(inserted as Profile);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen to Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(normalizeAuthError(err)) };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<SignUpResult> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone?.trim() || null,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Supabase email enumeration defense
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }

      if (data.user && data.session) {
        await fetchProfile(data.user);
        return { error: null, needsEmailConfirmation: false };
      }

      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      return { error: null, needsEmailConfirmation: false };
    } catch (err: any) {
      return { error: new Error(normalizeAuthError(err)), needsEmailConfirmation: false };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: new Error(normalizeAuthError(err)) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: new Error(normalizeAuthError(err)) };
    }
  };

  const isAdmin =
    profile?.role === 'admin' ||
    (!!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
