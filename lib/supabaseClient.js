// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Works both locally and on Vercel. We prefer service key on the server,
// but we also fall back to anon if you haven't set service key.
const URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const SERVICE_OR_ANON_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export function getServerSupabase() {
  if (!URL || !SERVICE_OR_ANON_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
  return createClient(URL, SERVICE_OR_ANON_KEY);
}
