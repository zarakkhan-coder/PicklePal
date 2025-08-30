// pages/index.js
import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Shell from '../components/Shell';

const DAYS = ['Saturday', 'Sunday'];
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

function hhmmToLabel(s) {
  const [H, M] = s.split(':').map(Number);
  const ampm = H >= 12 ? 'PM' : 'AM';
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}:${M.toString().padStart(2, '0')} ${ampm}`;
}

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [day, setDay] = useState('Saturday');
  const [from, setFrom] = useState('07:00');
  const [to, setTo] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [wx, setWx] = useState({ sat: null, sun: null });

  const audioRef = useRef(null);

  const toOptions = useMemo(() => {
    const fromIdx = HOURS.indexOf(from);
    return HOURS.slice(fromIdx + 1);
  }, [from]);

  useEffect(() => {
    // keep "to" > "from"
    if (HOURS.indexOf(to) <= HOURS.indexOf(from)) {
      const next = HOURS[HOURS.indexOf(from) + 1] || '24:00';
      setTo(next);
    }
  }, [from]); // eslint-disable-line

  // Weather (Open-Meteo, Bentonville AR ~ Walmart Home Office)
  useEffect(() => {
    (async () => {
      try {
        // Bentonville, AR
        const lat = 36.3729, lon = -94.2088;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        const r = await fetch(url);
        const j = await r.json();
        // find next Sat & Sun in returned daily time[] (ISO dates)
        const times = j?.daily?.time || [];
        const max = j?.daily?.temperature_2m_max || [];
        const min = j?.daily?.temperature_2m_min || [];
        const pop = j?.daily?.precipitation_probability_max || [];
        const toObj = (k) => ({
          date: times[k],
          tmax: max[k],
          tmin: min[k],
          pop: pop[k]
        });

        let sat = null, sun = null;
        for (let i = 0; i < times.length; i++) {
          const d = new Date(times[i]).getDay();
          if (d === 6 && !sat) sat = toObj(i); // Saturday
          if (d === 0 && !sun) sun = toObj(i); // Sunday
        }
        setWx({ sat, sun });
      } catch {}
    })();
  }, []);

  async function submitVote(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (HOURS.indexOf(to) <= HOURS.indexOf(from)) {
      setError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          day,
          start_time: from,
          end_time: to
        })
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || 'Failed to save vote');

      // subtle click
      audioRef.current?.play?.();

      window.location.href = '/weekly';
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function askPinThen(path) {
    const pin = prompt('Admin PIN to proceed:');
    if (!pin) return;
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) alert(j.error || 'Failed');
        else alert('Done!');
      })
      .catch(() => alert('Failed'));
  }

  return (
    <>
      <Head><title>PicklePal — Vote to Play</title></Head>
      <audio ref={audioRef} preload="auto">
        {/* short, light click */}
        <source src="data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAA" type="audio/mp3" />
      </audio>
      <Shell>
        <div className="wrap">
          <div className="card">
            <div className="hdr">
              <div><span className="dot" /> <span className="brand">PicklePal</span></div>
              <div className="muted">Vote to Play</div>
            </div>

            {/* Weather chips */}
            <div className="wx">
              {wx.sat && (
                <span className="chip">
                  <b>Saturday</b>&nbsp;
                  {Math.round(wx.sat.tmax)}° / {Math.round(wx.sat.tmin)}°&nbsp;
                  <span className="muted">{wx.sat.pop ?? 0}%</span>
                </span>
              )}
              {wx.sun && (
                <span className="chip">
                  <b>Sunday</b>&nbsp;
                  {Math.round(wx.sun.tmax)}° / {Math.round(wx.sun.tmin)}°&nbsp;
                  <span className="muted">{wx.sun.pop ?? 0}%</span>
                </span>
              )}
            </div>

            <p className="copy">
              You can vote more than once; we’ll use the majority each week. Players who enter an email will receive reminders.
            </p>

            <form onSubmit={submitVote} className="form">
              <label>
                Name <span className="req">*</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </label>

              <label>
                Email (optional)
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>

              <div className="row">
                <label>
                  Day
                  <select value={day} onChange={e => setDay(e.target.value)}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>

                <label>
                  From
                  <select value={from} onChange={e => setFrom(e.target.value)}>
                    {HOURS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>

                <label>
                  To
                  <select value={to} onChange={e => setTo(e.target.value)}>
                    {toOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              {error && <div className="err">{error}</div>}

              <button className="btn" disabled={submitting}>{submitting ? 'Saving…' : 'Submit Vote'}</button>

              <div className="link"><a href="/weekly">See weekly results →</a></div>

              <div className="admin">
                <button type="button" className="small danger" onClick={() => askPinThen('/api/clear')}>Clear this week’s votes</button>
                <button type="button" className="small" onClick={() => askPinThen('/api/undo')}>Undo last clear</button>
              </div>
            </form>
          </div>
        </div>
      </Shell>

      <style jsx>{`
        .wrap { display:grid; place-items:center; min-height: calc(100vh - 80px); }
        .card {
          width: 100%; max-width: 840px; background: #0e2233; color: #eaf6ff;
          border: 1px solid #16354a; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,.45);
          padding: 28px; position: relative; z-index: 2;
        }
        .hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .brand { font-weight:800; font-size:22px; margin-left:6px; }
        .dot { width:10px; height:10px; border-radius:50%; display:inline-block; background:#f0ff53; box-shadow:0 0 10px #f0ff53; }
        .muted { opacity:.75; font-size:14px; }
        .wx { display:flex; gap:8px; margin:8px 0 14px; flex-wrap:wrap; }
        .chip { background:#103046; border:1px solid #174a67; border-radius:999px; padding:6px 10px; font-size:13px; }
        .copy { margin:8px 0 16px; opacity:.9; }
        .form label { display:block; margin-bottom:14px; font-weight:600; }
        .row { display:grid; gap:12px; grid-template-columns: 2fr 1fr 1fr; }
        input, select {
          width:100%; margin-top:6px; padding:10px 12px; border-radius:10px;
          border:1px solid #244b6b; background:#071621; color:#eaf6ff; outline:none;
        }
        .btn {
          margin-top:6px; width:100%; padding:12px 16px;
          background: linear-gradient(135deg, #33cc66, #00b3ff);
          border:none; border-radius:10px; color:#03121d; font-weight:800; letter-spacing:.3px; cursor:pointer;
        }
        .err { background:#441818; border:1px solid #8b2e2e; color:#ffc1c1; border-radius:10px; padding:10px 12px; margin:8px 0 12px; }
        .link { margin-top:10px; text-align:center; }
        .link a { color:#7fd6ff; text-decoration:none; }
        .admin { margin-top:14px; display:flex; gap:10px; justify-content:center; }
        .small { padding:8px 10px; border-radius:8px; border:1px solid #2a5978; background:#0b1f2e; color:#d9f2ff; cursor:pointer; }
        .danger { border-color:#7a2a2a; background:#2b1212; }
        .req { color:#ff8b8b; }
      `}</style>
    </>
  );
}
