// pages/api/undo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function weekRangeUTC(d = new Date()) {
  const now = new Date(d);
  const dow = now.getUTCDay();
  const daysSinceMon = (dow + 6) % 7;
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceMon, 0, 0, 0, 0
  ));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export default async function handler(req, res) {
  const pin = (req.query.pin || req.body?.pin || '').toString().trim();
  if (!pin || pin !== (process.env.ADMIN_PIN || '').toString().trim()) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const { start, end } = weekRangeUTC();

  // Restore any votes cleared this week
  const { data, error } = await supabase
    .from('votes')
    .update({ cleared_at: null })
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .not('cleared_at', 'is', null)
    .select('id');

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, restored: data?.length || 0 });
}
