import { createClient } from '@supabase/supabase-js';

// These variables should be set in your Vercel project settings.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required. Please set them in your environment variables.');
}

// The generic type argument '<Database>' will be used for generated types
// For now, we can omit it or use 'any'.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
