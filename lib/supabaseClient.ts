import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Vite exposes environment variables on the `import.meta.env` object.
// Only variables prefixed with VITE_ are exposed to your client-side code.
// FIX: Cast import.meta to any to access Vite environment variables without TypeScript errors.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// We export the client, and the App will handle the case where it's not configured.
// Note: This will be null if the environment variables are not set.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;