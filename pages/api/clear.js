// pages/api/clear.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function weekStartUTC(date = new Date()) {
  const d = new Date(date);
  // Monday week (like Postgres date_trunc('week'))
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // days since Monday
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  return start; // 00:00:00Z Monday
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const { pin } = req.body || {};
  if (!pin || String(pin) !== String(process.env.ADMIN_PIN)) {
    return res.status(401).json({ ok: false, error: 'Invalid PIN' });
  }

  const start = weekStartUTC();
  const startIso = start.toISOString();

  // Snapshot the week's votes first
  const { data: rows, error: selErr } = await supabase
    .from('votes')
    .select('*')
    .gte('created_at', startIso);

  if (selErr) return res.status(500).json({ ok: false, error: selErr.message });

  if (rows?.length) {
    // Create backups table if you haven't already:
    // create table weekly_backups (id uuid default gen_random_uuid() primary key, week_start date not null, rows jsonb not null, created_at timestamptz default now());
    await supabase.from('weekly_backups').insert({
      week_start: startIso.slice(0, 10),
      rows: rows
    });
  }

  const { error: delErr, count } = await supabase
    .from('votes')
    .delete({ count: 'exact' })
    .gte('created_at', startIso);

  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });

  return res.status(200).json({ ok: true, cleared: count || 0 });
}
