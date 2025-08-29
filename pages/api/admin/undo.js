// pages/api/admin/undo.js
import { getServerSupabase } from '../../../lib/supabaseClient';

const ADMIN_PIN = process.env.ADMIN_PIN || '5724';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const { pin, payload } = req.body || {};
    if (String(pin) !== String(ADMIN_PIN)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ ok: false, error: 'Nothing to undo.' });
    }

    const supabase = getServerSupabase();

    // sanitize columns when re-inserting
    const rows = payload.map(r => ({
      name: r.name || null,
      email: r.email || null,
      day: r.day,
      start_time: r.start_time,
      end_time: r.end_time,
      created_at: r.created_at || new Date().toISOString(),
      week_start: r.week_start || null,
    }));

    const { error } = await supabase.from('votes').insert(rows);
    if (error) throw error;

    return res.status(200).json({ ok: true, count: rows.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
