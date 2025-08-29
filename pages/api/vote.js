// pages/api/vote.js
import { getServerSupabase } from '../../lib/supabaseClient';

function isHHMM(s) {
  return typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
}
function toMinutes(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
function thisWeekStartISO() {
  const d = new Date();
  // start of week (Monday 00:00) in local time
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  const start = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + diff,
    0, 0, 0, 0
  );
  return start.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, day, start_time, end_time } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, error: 'Name is required.' });
    }
    if (!(day === 'Saturday' || day === 'Sunday')) {
      return res.status(400).json({ ok: false, error: 'Day must be Saturday or Sunday.' });
    }
    if (!isHHMM(start_time) || !isHHMM(end_time)) {
      return res.status(400).json({ ok: false, error: 'Times must be HH:MM (24-hour).' });
    }
    if (toMinutes(end_time) <= toMinutes(start_time)) {
      return res.status(400).json({ ok: false, error: 'End time must be after start time.' });
    }

    const supabase = getServerSupabase();

    const { error } = await supabase.from('votes').insert({
      name: String(name).trim(),
      email: email ? String(email).trim() : null,
      day,
      start_time,
      end_time,
      created_at: new Date().toISOString(),
      // handy week tag to filter quickly without DB view
      week_start: thisWeekStartISO(),
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
