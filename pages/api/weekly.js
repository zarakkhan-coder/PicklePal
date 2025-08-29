// pages/api/weekly.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(_req, res) {
  const { data, error } = await supabase
    .from('weekly_tally')
    .select('week_start, day, start_time, end_time, votes, players')
    .order('votes', { ascending: false })
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, rows: data || [] });
}
