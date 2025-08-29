// pages/api/admin/clear.js
import { getServerSupabase } from '../../../lib/supabaseClient';

const ADMIN_PIN = process.env.ADMIN_PIN || '5724';

function thisWeekStartISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, 0, 0, 0, 0);
  return start.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const { pin } = req.body || {};
    if (String(pin) !== String(ADMIN_PIN)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const supabase = getServerSupabase();

    // Get this week's rows first (payload for undo)
    const { data: rows, error: selErr } = await supabase
      .from('votes')
      .select('*')
      .gte('created_at', thisWeekStartISO());

    if (selErr) throw selErr;

    const ids = rows.map(r => r.id);
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('votes').delete().in('id', ids);
      if (delErr) throw delErr;
    }

    // Return payload so client can undo
    return res.status(200).json({ ok: true, payload: rows || [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
