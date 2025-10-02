// config.ts

// The code uses process.env to read variables injected by Vercel in the live deployment.
// The fallback strings ('YOUR_SUPABASE_URL_PLACEHOLDER') are only used when running locally 
// without a proper .env file, or if the code is not running in a standard Node environment.

// ----------------------------------------------------
// PUBLIC/CLIENT-SIDE KEYS (Prefixed with NEXT_PUBLIC_)
// ----------------------------------------------------

export const SUPABASE_URL = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxictsdbsfsisbxbanbe.supabase.co';

export const SUPABASE_ANON_KEY = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aWN0c2Ric2ZzaXNieGJhbmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDI0NzksImV4cCI6MjA3NDI3ODQ3OX0.qzQDncXu_hXY8oWWld3tBqgAhltZyG_K85HOJUFBpXo';

// ----------------------------------------------------
// SERVER-SIDE KEYS (Not explicitly read in the frontend config, 
// but often needed for Vercel Serverless Functions)
// ----------------------------------------------------
// If your app has a separate file for server-side code (e.g., /api/...), 
// those files will access keys *without* the NEXT_PUBLIC_ prefix:

export const GEMINI_KEY = process.env.AIzaSyDJzTWqUfFIDzTditCBSntDQ44itJ7VHI8 ;
