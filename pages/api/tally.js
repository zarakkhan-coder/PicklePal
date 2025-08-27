// pages/api/tally.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('week_tally')  // this is the VIEW you created in Supabase
    .select('*')
    .order('votes', { ascending: false });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, data });
}
