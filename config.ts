// config.ts

// This file sources configuration from environment variables.
// Your build tool or deployment environment is responsible for making
// these variables available to the client-side application.
//
// For local development, you can create a `.env` file and use a tool
// like Vite or Create React App that supports them.
//
// Example .env file:
// NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;