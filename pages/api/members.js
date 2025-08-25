// pages/api/members.js
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PIN
} = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Simple admin gate
  if (req.headers['x-admin-pin'] !== ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'admin pin required' });
  }

  const { email, name } = req.body || {};
  const cleaned = (email || '').toLowerCase().trim();
  if (!cleaned) return res.status(400).json({ ok: false, error: 'email required' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Use UPSERT so duplicates don't crash
  const { data, error } = await supabase
    .from('members')
    .upsert(
      [{ email: cleaned, name: name || null, is_active: true }],
      { onConflict: 'email', ignoreDuplicates: true }
    )
    .select();

  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.json({ ok: true, data });
}
