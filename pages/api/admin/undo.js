// pages/api/admin/undo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const pin = req.headers['x-admin-pin'];
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Find the most-recent cleared set
  const { data: latest, error: latestErr } = await supabase
    .from('votes_backup')
    .select('cleared_at')
    .order('cleared_at', { ascending: false })
    .limit(1);

  if (latestErr) return res.status(500).json({ ok: false, error: latestErr.message });
  if (!latest || latest.length === 0) {
    return res.status(200).json({ ok: true, restored: 0, message: 'Nothing to undo.' });
  }

  const clearedAt = latest[0].cleared_at;

  // Get rows from that batch
  const { data: batch, error: batchErr } = await supabase
    .from('votes_backup')
    .select('*')
    .eq('cleared_at', clearedAt);
  if (batchErr) return res.status(500).json({ ok: false, error: batchErr.message });

  if (!batch || batch.length === 0) {
    return res.status(200).json({ ok: true, restored: 0, message: 'Nothing to undo.' });
  }

  // Move back into votes
  const toRestore = batch.map(b => ({
    name: b.name,
    email: b.email,
    day: b.day,
    start_time: b.start_time,
    end_time: b.end_time,
    created_at: b.created_at
  }));

  const { error: insErr } = await supabase.from('votes').insert(toRestore);
  if (insErr) return res.status(500).json({ ok: false, error: insErr.message });

  // Delete from backup
  const ids = batch.map(b => b.id);
  const { error: delErr } = await supabase.from('votes_backup').delete().in('id', ids);
  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });

  return res.status(200).json({ ok: true, restored: ids.length, clearedAt });
}
