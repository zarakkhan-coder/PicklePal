// pages/api/weekly.js
import { getServerSupabase } from '../../lib/supabaseClient';

function thisWeekStartISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  const start = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + diff,
    0, 0, 0, 0
  );
  return start.toISOString();
}

export default async function handler(_req, res) {
  try {
    const supabase = getServerSupabase();

    // Pull just this week's votes (we also stored week_start when inserting)
    const { data, error } = await supabase
      .from('votes')
      .select('id, name, day, start_time, end_time, created_at, week_start')
      .gte('created_at', thisWeekStartISO());

    if (error) throw error;

    // Aggregate by (day, start, end)
    const map = new Map();
    for (const v of data || []) {
      const key = `${v.day}|${v.start_time}|${v.end_time}`;
      if (!map.has(key)) {
        map.set(key, {
          day: v.day,
          start_time: v.start_time,
          end_time: v.end_time,
          votes: 0,
          names: [],
        });
      }
      const slot = map.get(key);
      slot.votes += 1;
      if (v.name) slot.names.push(v.name);
    }

    const rows = Array.from(map.values()).sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time);
      return a.end_time.localeCompare(b.end_time);
    });

    return res.status(200).json({ ok: true, rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
}
