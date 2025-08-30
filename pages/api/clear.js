// pages/api/clear.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Monday-start week range in UTC
function weekRangeUTC(d = new Date()) {
  const now = new Date(d);
  const dow = now.getUTCDay(); // 0=Sun..6=Sat
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
  // Admin PIN check
  const pin = (req.query.pin || req.body?.pin || '').toString().trim();
  if (!pin || pin !== (process.env.ADMIN_PIN || '').toString().trim()) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const { start, end } = weekRangeUTC();

  // Mark all of this week’s votes as cleared
  const { data, error } = await supabase
    .from('votes')
    .update({ cleared_at: new Date().toISOString() })
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .is('cleared_at', null)
    .select('id');

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, cleared: data?.length || 0 });
}
