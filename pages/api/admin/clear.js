// pages/api/admin/clear.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Very simple admin gate: expect header x-admin-pin to match ADMIN_PIN
  const pin = req.headers['x-admin-pin'];
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Current week window
  const { data: toBackup, error: selectErr } = await supabase
    .from('votes')
    .select('*')
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0) - ((new Date().getDay() + 1) % 7) * 24 * 3600 * 1000)) // start of week (Saturday)
    .lte('created_at', new Date()); // now

  if (selectErr) return res.status(500).json({ ok: false, error: selectErr.message });

  if (!toBackup || toBackup.length === 0) {
    return res.status(200).json({ ok: true, backedUp: 0, deleted: 0, message: 'No votes to clear this week.' });
  }

  const clearedAt = new Date().toISOString();

  // Insert into backup
  const rowsForBackup = toBackup.map(v => ({
    name: v.name,
    email: v.email,
    day: v.day,
    start_time: v.start_time,
    end_time: v.end_time,
    created_at: v.created_at,
    cleared_at: clearedAt
  }));

  const { error: backupErr } = await supabase.from('votes_backup').insert(rowsForBackup);
  if (backupErr) return res.status(500).json({ ok: false, error: backupErr.message });

  // Delete original
  const ids = toBackup.map(v => v.id);
  const { error: delErr } = await supabase.from('votes').delete().in('id', ids);
  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });

  return res.status(200).json({ ok: true, backedUp: rowsForBackup.length, deleted: ids.length, clearedAt });
}
