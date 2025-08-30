// pages/api/game/submit.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Prefer service key if available. Falls back to anon key (RLS allows insert).
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, score, rallies, ip } = req.body || {};

    const cleanName   = String(name || '').trim().slice(0, 40);
    const cleanScore  = Math.max(0, Math.min(parseInt(score ?? 0, 10), 100000));
    const cleanRally  = Math.max(0, Math.min(parseInt(rallies ?? cleanScore, 10), 100000));
    const ipHash      = ip ? String(ip).slice(0, 64) : null; // optional

    if (!cleanName) return res.status(400).json({ ok: false, error: 'Name required' });
    if (cleanScore === 0) return res.status(400).json({ ok: false, error: 'Score required' });

    const { error } = await supabase
      .from('game_scores')
      .insert([{ name: cleanName, score: cleanScore, rallies: cleanRally, ip_hash: ipHash, mode: 'endless' }]);

    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
