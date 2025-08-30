// pages/api/vote.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isHHMM(s) {
  return /^\d{2}:\d{2}$/.test(s);
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, email, day, start_time, end_time } = req.body || {};

  if (!name || !name.trim())
    return res.status(400).json({ ok: false, error: 'Name is required.' });

  if (!day) return res.status(400).json({ ok: false, error: 'Day is required.' });
  if (!isHHMM(start_time) || !isHHMM(end_time))
    return res.status(400).json({ ok: false, error: 'Times must be HH:MM (24h).' });

  // must be after
  const s = start_time.split(':').map(Number);
  const e = end_time.split(':').map(Number);
  const startMins = s[0] * 60 + s[1];
  const endMins = e[0] * 60 + e[1];
  if (endMins <= startMins)
    return res.status(400).json({ ok: false, error: 'End time must be after start time.' });

  try {
    const { error } = await supabase.from('votes').insert({
      name: name.trim(),
      email: email?.trim() || null,
      day,
      start_time,
      end_time
    });
    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
