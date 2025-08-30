// pages/api/game/reset.js
import { createClient } from '@supabase/supabase-js';

// Use the service role key so this route can delete rows regardless of RLS.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const pin = (req.body?.pin || '').toString().trim();
  const adminPin = (process.env.ADMIN_PIN || '').toString().trim();

  if (!pin || !adminPin || pin !== adminPin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Delete ALL game scores
  const { data, error } = await supabase
    .from('game_scores')
    .delete()
    // silly predicate so the client library doesn't require eq on primary key; this matches all rows
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id');

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, deleted: Array.isArray(data) ? data.length : 0 });
}
