// pages/api/undo.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { pin } = req.body || {};
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Find the most recent cleared_at timestamp
  const { data: last, error: findErr } = await supabase
    .from('votes')
    .select('cleared_at')
    .not('cleared_at', 'is', null)
    .order('cleared_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findErr) {
    return res.status(500).json({ ok: false, error: findErr.message });
  }
  if (!last || !last.cleared_at) {
    return res.status(200).json({ ok: true, undone: 0 });
  }

  const { data, error } = await supabase
    .from('votes')
    .update({ cleared_at: null })
    .eq('cleared_at', last.cleared_at)
    .select('id');

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, undone: (data || []).length });
}
