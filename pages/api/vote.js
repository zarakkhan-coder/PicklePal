// pages/api/vote.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, email, day, start_time, end_time } = req.body || {};

  // 1) Name required
  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required.' });
  }

  // 2) Day required
  if (!day) {
    return res.status(400).json({ ok: false, error: 'Day is required.' });
  }

  // 3) Validate times: 24-hour strings like '07:00', '18:00', '24:00'
  const is24h = (t) => /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(t);
  if (!is24h(start_time) || !is24h(end_time)) {
    return res.status(400).json({ ok: false, error: 'Times must be HH:MM 24h format.' });
  }

  // Disallow start >= end (except 24:00 is only sensible for end)
  const toMinutes = (t) => {
    if (t === '24:00') return 24 * 60;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  if (toMinutes(start_time) >= toMinutes(end_time)) {
    return res.status(400).json({ ok: false, error: 'End time must be after start time.' });
  }

  const { error } = await supabase.from('votes').insert({
    name: name.trim(),
    email: email?.trim() || null,
    day,
    start_time,
    end_time
  });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true });
}
