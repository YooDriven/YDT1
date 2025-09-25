import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The Supabase client is now initialized and managed within the main App component
// and provided via React Context. This file is kept for any potential utility
// functions or direct type exports in the future.

// Re-export for convenience if needed elsewhere, although direct imports
// from the library are preferred.
export { createClient };
export type { SupabaseClient };