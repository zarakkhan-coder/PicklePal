// pages/api/notify.js
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

const {
  SENDGRID_API_KEY,
  NOTIFICATION_FROM_EMAIL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_PIN
} = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Admin gate
  if (req.headers['x-admin-pin'] !== ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'admin pin required' });
  }

  // Check required env vars
  const missing = [];
  if (!SENDGRID_API_KEY) missing.push('SENDGRID_API_KEY');
  if (!NOTIFICATION_FROM_EMAIL) missing.push('NOTIFICATION_FROM_EMAIL');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length) {
    return res.json({
      ok: true,
      skipped: true,
      reason: `Missing env: ${missing.join(', ')}`
    });
  }

  // Pull active members from Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('members')
    .select('email')
    .eq('is_active', true);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const recipients = (data || []).map(r => r.email).filter(Boolean);
  if (!recipients.length) {
    return res.status(400).json({ ok: false, error: 'no active members' });
  }

  // Send through SendGrid
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    await sgMail.sendMultiple({
      to: recipients,
      from: NOTIFICATION_FROM_EMAIL,
      subject: 'Pickle Pal test',
      text: 'Hello from Pickle Pal!'
    });

    return res.json({ ok: true, count: recipients.length, to: recipients });
  } catch (e) {
    console.error('SendGrid error', e?.response?.body || e);
    return res
      .status(500)
      .json({ ok: false, error: e?.response?.body || e.message || String(e) });
  }
}
