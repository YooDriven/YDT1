import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export let supabase: SupabaseClient | null = null;

/**
 * Initializes the Supabase client. Can only be called once.
 * @param url The Supabase project URL.
 * @param key The Supabase anon key.
 * @returns {boolean} True if initialization was successful, false otherwise.
 */
export const initializeSupabase = (url: string, key: string): boolean => {
    // Avoid re-initializing
    if (supabase) {
        return true;
    }
    if (!url || !key) {
        console.error("Supabase URL and Key are required for initialization.");
        return false;
    }
    try {
        // The createClient function can throw an error if the URL is invalid.
        supabase = createClient(url, key);
        return supabase !== null;
    } catch (e) {
        console.error("Failed to initialize Supabase client. Please check your URL and Key.", e);
        supabase = null;
        return false;
    }
};
