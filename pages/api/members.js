import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Let the app deploy even if DB not configured yet
    return res.status(200).json({ ok: true, info: 'Supabase not configured yet' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.from('members').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    }
    if (req.method === 'POST') {
      const { email, name } = req.body || {};
      const { data, error } = await admin.from('members').insert([{ email, name }]).select('*').single();
      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    }
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
