import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase, ensureSupabaseClient, configureSupabase, isSupabaseConfigured, getAuthHeaders } from '../lib/supabase';
import { LocalDatabase } from '../utils/db';
import { Profile } from '../types/schema';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  configureCredentials: (url: string, anonKey: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  checkAdminStatus: (token?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Secure Server-side & Database Admin Role Verification
  const checkAdminStatus = async (token?: string, explicitUserId?: string): Promise<boolean> => {
    try {
      const activeToken = token || session?.access_token;
      const targetUserId = explicitUserId || user?.id;
      const client = getSupabase();
      
      // Step 1: Direct client-side verification against public.user_roles if client is available
      if (client && targetUserId) {
        try {
          const { data: roleRow, error: roleError } = await client
            .from('user_roles')
            .select('role')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (!roleError && roleRow && roleRow.role === 'admin') {
            setIsAdmin(true);
            return true;
          }
        } catch (clientCheckErr) {
          // Fall through to server-side check
        }
      }

      // Step 2: Cryptographic Server-side Verification via /api/admin/check-access
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      } else {
        const authHeaders = await getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      if (!headers['Authorization']) {
        setIsAdmin(false);
        return false;
      }

      const res = await fetch('/api/admin/check-access', { headers });
      if (res.ok) {
        const data = await res.json();
        const hasAdminAccess = !!(data.success && data.isAdmin);
        setIsAdmin(hasAdminAccess);
        return hasAdminAccess;
      } else {
        setIsAdmin(false);
        return false;
      }
    } catch (err) {
      setIsAdmin(false);
      return false;
    }
  };

  // Sync profile data with authenticated Supabase user
  const syncUserProfile = (authUser: User | null, verifiedAdmin = false) => {
    if (!authUser) {
      LocalDatabase.setCurrentUser(null);
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    const email = authUser.email || '';
    const metadata = authUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || email.split('@')[0] || 'Life4Billion User';
    const phone = metadata.phone || authUser.phone || '';

    // Set active user on isolated storage database
    LocalDatabase.setCurrentUser({
      id: authUser.id,
      email: email,
      full_name: fullName
    });
    LocalDatabase.init({
      id: authUser.id,
      email: email,
      full_name: fullName
    });

    const currentProfile = LocalDatabase.getProfile();
    const roleToAssign = verifiedAdmin ? 'admin' : (currentProfile.role && currentProfile.role !== 'admin' ? currentProfile.role : 'owner');
    
    const updated = LocalDatabase.updateProfile({
      id: authUser.id,
      username: email.split('@')[0] || currentProfile.username,
      full_name: fullName,
      phone: phone || currentProfile.phone,
      email: email,
      role: roleToAssign,
      updated_at: new Date().toISOString(),
    });

    setProfile(updated);
  };

  // Initialize and check real Supabase authentication session
  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      let client = getSupabase();
      if (!client) {
        client = await ensureSupabaseClient();
      }

      const configured = !!client && isSupabaseConfigured();
      setIsConfigured(configured);

      if (!client) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check current session from Supabase
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        console.error('[Supabase Auth Session Verification Error]:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      } else if (data.session && data.session.user) {
        setSession(data.session);
        setUser(data.session.user);
        syncUserProfile(data.session.user);
        
        // Await admin role check during initial boot
        const adminApproved = await checkAdminStatus(data.session.access_token, data.session.user.id);
        if (adminApproved) {
          syncUserProfile(data.session.user, true);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }

      // Subscribe to Supabase auth state changes (sign in, sign out, token refreshed)
      const { data: authListener } = client.auth.onAuthStateChange(async (event, newSession) => {
        if (newSession && newSession.user) {
          setSession(newSession);
          setUser(newSession.user);
          syncUserProfile(newSession.user);

          const adminApproved = await checkAdminStatus(newSession.access_token, newSession.user.id);
          if (adminApproved) {
            syncUserProfile(newSession.user, true);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (err) {
      console.error('[Supabase Auth Initialization Exception]:', err);
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const refreshSession = async () => {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data.session && data.session.user) {
        setSession(data.session);
        setUser(data.session.user);
        syncUserProfile(data.session.user);
        const adminApproved = await checkAdminStatus(data.session.access_token, data.session.user.id);
        if (adminApproved) {
          syncUserProfile(data.session.user, true);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('[Supabase Refresh Session Error]:', err);
    }
  };

  // REAL SUPABASE SIGN IN WITH PASSWORD
  const signInWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your SUPABASE_URL and SUPABASE_ANON_KEY to authenticate.',
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Invalid email or password.',
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: 'Authentication failed. No active session returned from Supabase.',
        };
      }

      setSession(data.session);
      setUser(data.user);
      syncUserProfile(data.user);
      const adminApproved = await checkAdminStatus(data.session.access_token, data.user.id);
      if (adminApproved) {
        syncUserProfile(data.user, true);
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected authentication error occurred.',
      };
    }
  };

  // REAL SUPABASE SIGN UP
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }> => {
    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your SUPABASE_URL and SUPABASE_ANON_KEY to register.',
      };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName || '',
            phone: phone || '',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create account.',
        };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        syncUserProfile(data.user);
        return { success: true, emailConfirmationRequired: false };
      }

      // If user was created but no session returned, email confirmation is required by Supabase project
      return {
        success: true,
        emailConfirmationRequired: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected registration error occurred.',
      };
    }
  };

  // REAL SUPABASE SIGN OUT
  const signOut = async (): Promise<void> => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('[Supabase SignOut Error]:', err);
      }
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    LocalDatabase.setCurrentUser(null);

    // Clean any legacy mock storage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omnisaas_logged_in');
      localStorage.removeItem('omnisaas_logged_in_email');
      localStorage.removeItem('life4billion_logged_in');
      sessionStorage.removeItem('life4billion_active_uid');
      sessionStorage.removeItem('life4billion_active_email');
      sessionStorage.removeItem('life4billion_active_name');
    }
  };

  // REAL SUPABASE PASSWORD RECOVERY
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        error: 'Supabase is not configured. Please configure your SUPABASE_URL and SUPABASE_ANON_KEY.',
      };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to initiate password reset.',
      };
    }
  };

  // REAL SUPABASE GOOGLE OAUTH
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return {
        success: false,
        error: 'Supabase is not configured.',
      };
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Google OAuth failed to start.',
      };
    }
  };

  // CONFIGURE CREDENTIALS DYNAMICALLY
  const configureCredentials = async (url: string, anonKey: string): Promise<{ success: boolean; error?: string }> => {
    const newClient = configureSupabase(url, anonKey);
    if (!newClient) {
      return {
        success: false,
        error: 'Invalid Supabase URL or Anon Key.',
      };
    }

    setIsConfigured(true);
    await initializeAuth();
    return { success: true };
  };

  const isAuthenticated = !!(session && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated,
        isAdmin,
        isLoading,
        isConfigured,
        signInWithPassword,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        configureCredentials,
        refreshSession,
        checkAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
