// pages/api/undo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const { pin } = req.body || {};
  if (!pin || String(pin) !== String(process.env.ADMIN_PIN)) {
    return res.status(401).json({ ok: false, error: 'Invalid PIN' });
  }

  // Latest backup
  const { data: backups, error } = await supabase
    .from('weekly_backups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  if (!backups?.length) return res.status(200).json({ ok: false, error: 'No backup to restore' });

  const backup = backups[0];
  const rows = backup.rows || [];

  if (!rows.length) return res.status(200).json({ ok: false, error: 'Backup empty' });

  // Insert only relevant columns
  const payload = rows.map(r => ({
    name: r.name ?? null,
    email: r.email ?? null,
    day: r.day,
    start_time: r.start_time,
    end_time: r.end_time,
    created_at: r.created_at
  }));

  const { error: insErr, count } = await supabase
    .from('votes')
    .insert(payload, { count: 'exact' });

  if (insErr) return res.status(500).json({ ok: false, error: insErr.message });

  return res.status(200).json({ ok: true, restored: count || payload.length });
}
// Disable static pre-render for the home page.
// This avoids build-time crashes from browser-only features (Audio, window, etc.).
export async function getServerSideProps() {
  return { props: {} };
}
