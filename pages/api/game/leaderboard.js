// pages/api/game/leaderboard.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(_req, res) {
  try {
    const { data, error } = await supabase
      .from('weekly_game_leaderboard')
      .select('*')
      .limit(10);

    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true, rows: data || [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
