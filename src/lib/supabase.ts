import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global cached client instance
let supabaseInstance: SupabaseClient | null = null;
let isConfigResolved = false;

/**
 * Resolves Supabase credentials from available sources:
 * 1. Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. User localStorage configurations
 */
export function getSavedCredentials(): { url: string; anonKey: string } {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    localUrl = localStorage.getItem('omnisaas_supabase_url') || localStorage.getItem('life4billion_supabase_url') || '';
    localKey = localStorage.getItem('omnisaas_supabase_anon_key') || localStorage.getItem('life4billion_supabase_anon_key') || '';
  }

  const url = localUrl.trim() || envUrl.trim();
  const anonKey = localKey.trim() || envKey.trim();

  return { url, anonKey };
}

/**
 * Initializes or returns the cached Supabase client.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSavedCredentials();
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('[Supabase Client Init Error]:', err);
      return null;
    }
  }

  return null;
}

/**
 * Dynamically configures and updates the Supabase client with new credentials.
 */
export function configureSupabase(url: string, anonKey: string): SupabaseClient | null {
  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();

  if (!trimmedUrl || !trimmedKey) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(trimmedUrl, trimmedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('omnisaas_supabase_url', trimmedUrl);
      localStorage.setItem('omnisaas_supabase_anon_key', trimmedKey);
      localStorage.setItem('life4billion_supabase_url', trimmedUrl);
      localStorage.setItem('life4billion_supabase_anon_key', trimmedKey);
    }

    return supabaseInstance;
  } catch (err) {
    console.error('[Supabase Configure Error]:', err);
    return null;
  }
}

/**
 * Asynchronously attempts to resolve Supabase credentials from the backend
 * if none are available on the client.
 */
export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  const existing = getSupabase();
  if (existing) return existing;

  if (isConfigResolved) return null;

  try {
    const res = await fetch('/api/auth/config').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data && data.configured && data.supabaseUrl && data.supabaseAnonKey) {
        isConfigResolved = true;
        return configureSupabase(data.supabaseUrl, data.supabaseAnonKey);
      }
    }
  } catch (err) {
    console.warn('[Supabase Config Auto-Discovery Notice]:', err);
  }

  isConfigResolved = true;
  return null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSavedCredentials();
  return !!(url && anonKey);
}

/**
 * Returns authentication and Supabase headers for API requests including Bearer token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { url, anonKey } = getSavedCredentials();
  const headers: Record<string, string> = {};
  if (url) headers['x-supabase-url'] = url;
  if (anonKey) headers['x-supabase-anon-key'] = anonKey;

  const client = getSupabase();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (e) {
      // ignore
    }
  }
  return headers;
}
