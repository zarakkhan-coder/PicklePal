// pages/api/cron/weekly.js
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Server-side Supabase (service role) to read members
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Email template (Variant 1 – your chosen copy) ---
function getVariant(variant = '1') {
  // you can add more variants later if you like
  const subject = "PicklePal: Cast your vote for this weekend 🗳️";
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; font-size:16px; color:#222">
      <h2 style="margin:0 0 12px">Weekly PicklePal reminder</h2>
      <p>Hey team — quick heads up for the coming weekend:</p>
      <ul>
        <li><strong>Votes are open now</strong> (please vote by <strong>Thursday</strong>).</li>
        <li>We'll <strong>book courts if we have more than 4 votes</strong> this week.</li>
        <li>The day and time will be based on the vote majority.</li>
      </ul>
      <p style="margin:16px 0">
        👉 <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://'+process.env.VERCEL_URL}" target="_blank">
        Tap here to vote</a>
      </p>
      <p>Happy pickleballing! 🏓</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
      <p style="font-size:13px;color:#666">
        You’re receiving this because you’re on the PicklePal list. If this wasn’t meant for you,
        reply and we’ll remove you.
      </p>
    </div>
  `;
  return { subject, html };
}

export default async function handler(req, res) {
  try {
    // Accept secret from header OR from query string
    const provided =
      req.headers['x-cron-secret'] ||
      req.query.secret ||
      '';

    if (!process.env.CRON_SECRET) {
      return res.status(500).json({ ok: false, error: 'Missing CRON_SECRET on server' });
    }
    if (provided !== process.env.CRON_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const dry =
      req.query.dry === '1' ||
      req.query.dry === 'true';

    // fetch all active members
    const { data, error } = await supabase
      .from('members')
      .select('email')
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const emails = (data || [])
      .map(r => (r?.email || '').trim())
      .filter(Boolean);

    if (emails.length === 0) {
      return res.json({ ok: true, sent: 0, note: 'No active members' });
    }

    const { subject, html } = getVariant(process.env.REMINDER_VARIANT || '1');

    const msg = {
      to: emails,                                 // send to the whole list
      from: process.env.NOTIFICATION_FROM_EMAIL,  // your verified SendGrid sender
      subject,
      html,
    };

    if (dry) {
      // dry run: don’t actually send, just show what *would* be sent
      return res.json({ ok: true, dry: true, subject, to: emails, count: emails.length });
    }

    // Send multiple recipients in a single call
    await sgMail.sendMultiple(msg);

    return res.json({ ok: true, sent: emails.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  }
}
