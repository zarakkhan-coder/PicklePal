// pages/api/vote.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_DAYS = ['Saturday', 'Sunday']; // add more if you want
const VALID_TIMES = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name = '', email = '', day = '', start_time = '', end_time = '' } = req.body || {};

  if (!email || !day || !start_time || !end_time) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  if (!VALID_DAYS.includes(day)) {
    return res.status(400).json({ ok: false, error: 'Invalid day' });
  }
  if (!VALID_TIMES.includes(start_time) || !VALID_TIMES.includes(end_time)) {
    return res.status(400).json({ ok: false, error: 'Invalid time' });
  }

  const { error } = await supabase
    .from('votes')
    .insert([{ name, email, day, start_time, end_time }]);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, message: 'Vote recorded' });
}
