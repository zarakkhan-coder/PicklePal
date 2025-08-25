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

sgMail.setApiKey(SENDGRID_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const pin = req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'admin pin required' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const { subject = 'PicklePal Update', html = '<p>Hello from PicklePal!</p>', memberEmails } = req.body || {};

  let recipients = Array.isArray(memberEmails) ? memberEmails.filter(Boolean) : [];
  if (recipients.length === 0) {
    const { data, error } = await supabase.from('members').select('email').eq('is_active', true);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    recipients = (data || []).map(r => r.email);
  }
  if (recipients.length === 0) return res.status(400).json({ ok: false, error: 'no recipients' });

  try {
    const msg = {
      from: NOTIFICATION_FROM_EMAIL,     // <- xak_89@live.com
      to: recipients,
      subject,
      html,
    };
    await sgMail.sendMultiple(msg);
    return res.json({ ok: true, count: recipients.length });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.response?.body || err.message || 'sendgrid error'
    });
  }
}
