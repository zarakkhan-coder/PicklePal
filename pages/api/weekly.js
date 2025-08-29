// pages/api/weekly.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for reading the view safely
);

export default async function handler(_req, res) {
  const { data, error } = await supabase
    .from('weekly_tally')
    .select('*')
    .order('votes', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, rows: data || [] });
}
