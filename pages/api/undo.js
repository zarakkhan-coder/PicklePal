// pages/api/undo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { pin } = req.body || {};
  if (!pin || pin !== process.env.ADMIN_PIN)
    return res.status(401).json({ ok: false, error: 'Unauthorized' });

  try {
    const { error } = await supabase
      .from('votes')
      .update({ cleared_at: null })
      .not('cleared_at', 'is', null)
      .gte('created_at', new Date(new Date().toDateString()))
      .filter('created_at', 'gte', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) return res.status(400).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
