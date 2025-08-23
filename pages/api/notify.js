import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.NOTIFICATION_FROM_EMAIL || 'notify@example.com';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

export default async function handler(req, res) {
  // Deploy-first: if not configured, just return ok
  if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ ok: true, info: 'Email/Supabase not configured yet' });
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { memberEmails = [], subject = 'Pickle Pal Update', text = '' } = req.body || {};

    if (!Array.isArray(memberEmails) || memberEmails.length === 0) {
      return res.status(400).json({ ok: false, error: 'memberEmails required' });
    }

    await sgMail.sendMultiple({ to: memberEmails, from: FROM, subject, text });
    await admin.from('notifications').insert([{ subject, text }]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
