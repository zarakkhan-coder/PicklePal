import sgMail from '@sendgrid/mail';
import { createClient } from '@supabase/supabase-js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function nextDow(from, dow) {
  // 0=Sun,1=Mon,...,6=Sat
  const d = new Date(from);
  const add = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}

function getWeekendDates(now = new Date()) {
  const saturday = nextDow(now, 6);
  const sunday = nextDow(now, 0);
  return { saturday, sunday };
}

// ----- MESSAGE VARIANTS (1–5) -----
// Choose which one to use with REMINDER_VARIANT env var
function getTemplate(variant = '1') {
  const { saturday, sunday } = getWeekendDates();
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  const deadline = 'Thursday';
  const bookingRule = 'Court(s) will only be booked if we have 5+ total votes for the week.';
  const linkHtml = site ? `<p>Cast your vote here: <a href="${site}">${site}</a></p>` : '';

  const options = {
    '1': {
      subject: 'PicklePal 🗳️ Weekly vote is open!',
      html: `
        <p>Hi team! Time to pick our pickleball slot for <strong>${formatDate(saturday)}</strong> or <strong>${formatDate(sunday)}</strong>.</p>
        <ul>
          <li>Courts will be booked based on your votes.</li>
          <li>${bookingRule}</li>
          <li>To make sure you don’t miss out, please vote by <strong>${deadline}</strong>.</li>
        </ul>
        ${linkHtml}
        <p>Happy pickleballing! 🏓</p>
      `,
    },
    '2': {
      subject: '🔔 Monday reminder: cast your vote by Thursday',
      html: `
        <p>Quick reminder — voting for this weekend’s pickleball is open.</p>
        <p><strong>Book by votes:</strong> We’ll book court(s) based on the majority. ${bookingRule}</p>
        <p><strong>Deadline:</strong> Please vote by <strong>${deadline}</strong>.</p>
        <p>Target weekend: <strong>${formatDate(saturday)}</strong> and <strong>${formatDate(sunday)}</strong></p>
        ${linkHtml}
        <p>Let’s play! 🎾</p>
      `,
    },
    '3': {
      subject: 'Let’s rally! 🥒 Vote for this weekend',
      html: `
        <p>Pickle pals, assemble!</p>
        <p>Help us lock in court time for <strong>${formatDate(saturday)}</strong>/<strong>${formatDate(sunday)}</strong>.</p>
        <p>${bookingRule} Bookings are based on the votes we get.</p>
        <p><strong>Vote by ${deadline}</strong> so you don’t miss out.</p>
        ${linkHtml}
        <p>See you on court! 💪</p>
      `,
    },
    '4': {
      subject: 'Action needed: vote for this weekend (by Thursday)',
      html: `
        <p>Voting is open for this weekend’s pickleball.</p>
        <p>Courts are booked based on your votes. ${bookingRule}</p>
        <p>Please submit your vote by <strong>${deadline}</strong>.</p>
        <p>Weekend: <strong>${formatDate(saturday)}</strong> / <strong>${formatDate(sunday)}</strong></p>
        ${linkHtml}
      `,
    },
    '5': {
      subject: 'PicklePal: your weekly vote window is open',
      html: `
        <p>It’s Monday — time to vote for the upcoming weekend:</p>
        <ul>
          <li>We’ll book court(s) based on the majority.</li>
          <li>${bookingRule}</li>
          <li>Votes close on <strong>${deadline}</strong>.</li>
        </ul>
        <p>Target days: <strong>${formatDate(saturday)}</strong> & <strong>${formatDate(sunday)}</strong></p>
        ${linkHtml}
        <p>Happy pickle balling!</p>
      `,
    },
  };

  return options[String(variant)] || options['1'];
}

async function getActiveMemberEmails() {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('email')
    .eq('is_active', true);

  if (error) throw error;
  return (data || []).map(r => r.email).filter(Boolean);
}

export default async function handler(req, res) {
  // Secure this endpoint with a token
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!req.query.token || req.query.token !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const emails = await getActiveMemberEmails();
    if (!emails.length) return res.status(200).json({ ok: true, sent: 0 });

    const variant = process.env.REMINDER_VARIANT || '1';
    const { subject, html } = getTemplate(variant);

    await sgMail.sendMultiple({
      to: emails,
      from: process.env.NOTIFICATION_FROM_EMAIL, // your verified sender, e.g. xak_89@live.com
      subject,
      html,
    });

    return res.status(200).json({ ok: true, sent: emails.length, variant });
  } catch (e) {
    console.error('reminder error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
