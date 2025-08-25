// pages/api/members.js
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PIN
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const adminPin = req.headers['x-admin-pin'];

  // Require admin pin for all methods
  if (adminPin !== ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'admin pin required' });
  }

  if (req.method === 'GET') {
    // Return the members list
    const { data, error } = await supabase
      .from('members')
      .select('id, email, name, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, members: data || [] });
  }

  if (req.method === 'POST') {
    const { email, name } = req.body || {};
    const cleaned = (email || '').toLowerCase().trim();
    if (!cleaned) {
      return res.status(400).json({ ok: false, error: 'email required' });
    }

    // Upsert so duplicates are ignored; avoids 500 on unique constraint
    const { data, error } = await supabase
      .from('members')
      .upsert(
        [{ email: cleaned, name: name || null, is_active: true }],
        { onConflict: 'email', ignoreDuplicates: true }
      )
      .select();

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, data: data || [] });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
