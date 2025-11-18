import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types/user';
import { supabase } from '../lib/supabaseClient';
import type { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  authError: AuthError | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapDbUserToUser = (record: any): User => ({
  id: record.id,
  username: record.username,
  role: record.role,
  fullName: record.full_name,
  email: record.email,
  active: record.active,
  createdAt: record.created_at,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, full_name, email, active, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load user profile', error);
      return null;
    }

    if (!data || !data.active) {
      return null;
    }

    return mapDbUserToUser(data);
  }, []);

  useEffect(() => {
    const initialise = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    };

  const {
    data: authListener,
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      let profile = await fetchUserProfile(session.user.id);
      
      // If profile doesn't exist but user is confirmed, create it from metadata
      if (!profile && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.user.email_confirmed_at) {
        const metadata = session.user.user_metadata || {};
        
        // Try to create profile from auth metadata
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: session.user.id,
            username: metadata.username || session.user.email?.split('@')[0] || 'user',
            password: '', // Empty password since we use Supabase Auth
            role: metadata.role || 'agent',
            full_name: metadata.full_name || session.user.email || 'User',
            email: session.user.email || '',
            active: true,
          },
        ]).select().single();
        
        if (!insertError) {
          profile = await fetchUserProfile(session.user.id);
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to create user profile after confirmation', insertError);
        }
      }
      
      setUser(profile);
    } else {
      setUser(null);
    }
  });

    initialise();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const resolveEmail = async (identifier: string) => {
    if (identifier.includes('@')) {
      return identifier;
    }
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', identifier)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to resolve email for username', error);
      return null;
    }

    return data?.email ?? null;
  };

  const login = async (identifier: string, password: string): Promise<User | null> => {
    setAuthError(null);
    const email = await resolveEmail(identifier);
    if (!email) {
      return null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setAuthError(error ?? null);
      return null;
    }

    const profile = await fetchUserProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      setUser(null);
      return null;
    }

    setUser(profile);
    return profile;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

