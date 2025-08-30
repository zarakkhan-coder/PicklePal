// pages/api/clear.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getUtcWeekBounds() {
  const now = new Date();
  // Monday-week in UTC, to match Postgres date_trunc('week', now())
  const day = now.getUTCDay(); // 0=Sun .. 6=Sat
  const diffSinceMon = (day + 6) % 7; // 0 if Mon, 6 if Sun
  const weekStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diffSinceMon, 0, 0, 0, 0
  ));
  const nextWeekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, nextWeekStart };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { pin } = req.body || {};
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { weekStart, nextWeekStart } = getUtcWeekBounds();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('votes')
    .update({ cleared_at: nowIso })
    .is('cleared_at', null)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', nextWeekStart.toISOString())
    .select('id');

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, cleared: (data || []).length });
}
