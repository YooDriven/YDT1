import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables are expected to be available via `process.env` in this execution context.
// The Vite-specific `import.meta.env` is not available.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// We export the client, and the App will handle the case where it's not configured.
// Note: This will be null if the environment variables are not set.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;