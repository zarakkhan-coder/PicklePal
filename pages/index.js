// pages/index.js
import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';

const DAYS = ['Saturday', 'Sunday'];
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
const ADMIN_PIN = '5724'; // you asked for the code explicitly

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [day, setDay] = useState('Saturday');
  const [from, setFrom] = useState('07:00');
  const [to, setTo] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const clickRef = useRef(null);
  const lastClearRef = useRef(null);

  // load click sound only on the client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // small subtle click (data URI), safe for SSR
      clickRef.current = new Audio(
        'data:audio/wav;base64,UklGRkYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAAAP//AAAAAP//AAAAAP//AAAAAP//AAAA'
      );
    }
  }, []);

  const toOptions = useMemo(() => {
    const i = HOURS.indexOf(from);
    return HOURS.slice(i + 1);
  }, [from]);

  useEffect(() => {
    if (HOURS.indexOf(to) <= HOURS.indexOf(from)) {
      setTo(HOURS[HOURS.indexOf(from) + 1] || '24:00');
    }
  }, [from]); // eslint-disable-line

  async function submitVote(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    try {
      setSubmitting(true);
      const r = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          day,
          start_time: from,
          end_time: to,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      if (clickRef.current) clickRef.current.play().catch(() => {});
      window.location.href = '/weekly';
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function clearVotes() {
    const pin = prompt('Admin PIN to clear this week:');
    if (pin !== ADMIN_PIN) return alert('Wrong PIN.');
    const r = await fetch('/api/admin/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) return alert(j.error || 'Failed to clear.');
    lastClearRef.current = j.payload || [];
    try { localStorage.setItem('lastClearPayload', JSON.stringify(j.payload || [])); } catch {}
    alert('Cleared this week’s votes.');
  }

  async function undoClear() {
    const payload =
      lastClearRef.current ||
      (() => { try { return JSON.parse(localStorage.getItem('lastClearPayload') || '[]'); } catch { return []; } })();
    if (!payload || payload.length === 0) return alert('Nothing to undo.');
    const pin = prompt('Admin PIN to undo:');
    if (pin !== ADMIN_PIN) return alert('Wrong PIN.');
    const r = await fetch('/api/admin/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, payload }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) return alert(j.error || 'Failed to undo.');
    alert(`Restored ${j.count} votes.`);
  }

  return (
    <>
      <Head><title>PicklePal — Vote</title></Head>
      <div className="wrap">
        <div className="card">
          <div className="header">
            <span className="dot" />
            <h1>PicklePal</h1>
            <span className="sub">Vote to Play</span>
          </div>

          <p className="copy">
            You can vote more than once; we’ll use the majority each week. Players who enter an email will receive
            reminders.
          </p>

          <form onSubmit={submitVote}>
            <label>Name <span className="req">*</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </label>

            <label>Email (optional)
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>

            <div className="row">
              <label>Day
                <select value={day} onChange={e => setDay(e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>

              <label>From
                <select value={from} onChange={e => setFrom(e.target.value)}>
                  {HOURS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <label>To
                <select value={to} onChange={e => setTo(e.target.value)}>
                  {toOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            {error && <div className="err">{error}</div>}

            <button className="btn" disabled={submitting}>{submitting ? 'Saving…' : 'Submit Vote'}</button>

            <div className="links">
              <a href="/weekly">See weekly results →</a>
            </div>

            <div className="admin">
              <button type="button" className="mini danger" onClick={clearVotes}>Clear this week’s votes</button>
              <button type="button" className="mini" onClick={undoClear}>Undo last clear</button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid; place-items: center;
          background: linear-gradient(180deg, #0b1b2a, #0b1b2a);
          padding: 32px 16px;
        }
        .card {
          width: 100%; max-width: 780px;
          background: #0f2236; color: #eaf6ff;
          border: 1px solid #14314a; border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0,0,0,.4); padding: 28px;
        }
        .header{display:flex;align-items:center;gap:10px}
        .dot{width:10px;height:10px;border-radius:50%;background:#ffe66d;box-shadow:0 0 8px #ffe66d}
        h1{margin:0;font-size:26px}
        .sub{margin-left:auto;opacity:.8}
        .copy{opacity:.9;margin:12px 0 18px}
        label{display:block;margin-bottom:14px;font-weight:600}
        .row{display:grid;gap:12px;grid-template-columns:2fr 1fr 1fr}
        input,select{width:100%;margin-top:6px;padding:10px 12px;border-radius:10px;border:1px solid #244b6b;background:#0b1b2a;color:#eaf6ff;outline:none}
        input::placeholder{color:#7aa0bc}
        .btn{margin-top:6px;width:100%;padding:12px 16px;background:linear-gradient(135deg,#33cc66,#00b3ff);border:none;border-radius:10px;color:#03121d;font-weight:800;letter-spacing:.3px;cursor:pointer}
        .links{margin-top:10px;text-align:center}
        .links a{color:#7fd6ff;text-decoration:none}
        .req{color:#ff8b8b}
        .err{background:#441818;border:1px solid #8b2e2e;color:#ffc1c1;border-radius:10px;padding:10px 12px;margin:8px 0 12px}
        .admin{display:flex;gap:10px;justify-content:center;margin-top:8px}
        .mini{padding:8px 12px;border-radius:8px;border:1px solid #244b6b;background:#0b1b2a;color:#eaf6ff;cursor:pointer}
        .danger{border-color:#5c2a2a}
      `}</style>
    </>
  );
}
