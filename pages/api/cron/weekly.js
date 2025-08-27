// pages/api/cron/weekly.js
import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { secret, dry, variant = 'mon' } = req.query;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Fetch active members
  const { data: members, error } = await supabase
    .from('members')
    .select('email')
    .eq('is_active', true);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  const to = (members || []).map(m => m.email).filter(Boolean);

  // Build vote URL from current host
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const scheme = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${scheme}://${host}`;
  const voteUrl = `${baseUrl}/`;

  // Choose copy based on variant
  let subject, html;

  if (variant === 'thu' || variant === 'thursday') {
    subject = 'PicklePal: Last call — cast your vote by tonight! 🕘';
    html = `
      <p>Hey team!</p>
      <p>Final reminder to vote for this weekend’s pickleball.</p>
      <p>Courts will be booked based on the results, and we’ll only book if we have <strong>4+ votes</strong>.</p>
      <p>Please vote by <strong>Thursday night</strong> so you don’t miss out.</p>
      <p><a href="${voteUrl}">Cast your vote</a></p>
      <p>Happy pickleballing! 🏓</p>
    `;
  } else {
    subject = 'PicklePal: Cast your vote for this weekend 🗳️';
    html = `
      <p>Hi everyone,</p>
      <p>Voting for this weekend’s pickleball is open.</p>
      <p>Courts will be booked based on the votes. We’ll only book if we have <strong>4+ votes</strong>.</p>
      <p>To ensure you don’t miss out, please cast your vote by <strong>Thursday</strong>.</p>
      <p><a href="${voteUrl}">Cast your vote</a></p>
      <p>Happy pickleballing! 🏓</p>
    `;
  }

  // Dry-run preview
  if (dry === '1') {
    return res.json({
      ok: true,
      dry: true,
      variant,
      subject,
      to,
      count: to.length
    });
  }

  if (!process.env.SENDGRID_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: 'Missing SENDGRID_API_KEY' });
  }

  const msg = {
    to,
    from: process.env.NOTIFICATION_FROM_EMAIL,
    subject,
    html
  };

  try {
    if (to.length > 0) {
      await sgMail.sendMultiple(msg);
    }
    return res.json({ ok: true, sent: to.length, variant });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
