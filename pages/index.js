// pages/index.js
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const DAYS = ['Saturday', 'Sunday'];

export default function Home() {
  const router = useRouter();

  // 24h slots: 00:00 → 24:00
  const times = useMemo(
    () => Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, '0')}:00`),
    []
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [day, setDay] = useState(DAYS[0]);
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('08:00');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const r = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || null, // optional
          day,
          start_time: start,
          end_time: end
        })
      });
      const out = await r.json();
      if (!out.ok) throw new Error(out.error || 'Failed');

      // Redirect to results after success
      router.push('/weekly');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      {/* Hero / Header */}
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="ball">🎾</span> <span>PicklePal</span>
          </div>
          <h1>Vote to Play</h1>
          <p>
            Cast your vote for this weekend’s pickleball. <strong>Name is required</strong> —{' '}
            <em>Email is optional</em> (you’ll get reminders if you add it).
          </p>
        </div>
      </header>

      {/* Card */}
      <main className="card">
        <form onSubmit={submit} className="form">
          <div className="row">
            <label>Name (required)</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="row">
            <label>Email (optional)</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="row">
            <label>Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="row times">
            <div className="col">
              <label>From</label>
              <select value={start} onChange={(e) => setStart(e.target.value)}>
                {times.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label>To</label>
              <select value={end} onChange={(e) => setEnd(e.target.value)}>
                {times.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <div className="error">Error: {error}</div> : null}

          <button className="cta" type="submit">
            Submit Vote
          </button>
        </form>
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f2fdf6 0%, #ffffff 60%);
        }
        .hero {
          background: radial-gradient(1200px 400px at 10% -10%, #e7ffe9 20%, transparent 55%),
            radial-gradient(1000px 400px at 90% -30%, #e0fff9 10%, transparent 55%),
            linear-gradient(90deg, #d8ffdb, #dff9ff);
          color: #073b3a;
          padding: 48px 24px 36px;
          text-align: center;
          border-bottom: 1px solid #e8f5e9;
        }
        .hero-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .brand {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: 1px;
          color: #064e3b;
        }
        .ball {
          font-size: 28px;
        }
        h1 {
          margin: 12px 0 6px;
          font-size: 40px;
          letter-spacing: 0.2px;
        }
        p {
          margin: 0 auto;
          max-width: 640px;
          color: #0f766e;
          font-size: 16px;
        }
        .card {
          max-width: 680px;
          margin: -24px auto 40px;
          background: #fff;
          border: 1px solid #e5efe9;
          box-shadow: 0 12px 30px rgba(7, 59, 58, 0.06);
          border-radius: 16px;
          padding: 24px;
        }
        .form .row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        label {
          font-weight: 600;
          color: #065f46;
          margin-bottom: 6px;
        }
        input,
        select {
          border: 1px solid #cfe9dc;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 15px;
          outline: none;
        }
        input:focus,
        select:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.25);
        }
        .times {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .error {
          background: #fff7ed;
          border: 1px solid #fbbf24;
          color: #92400e;
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .cta {
          background: linear-gradient(90deg, #34d399, #22c55e);
          color: #06321a;
          font-weight: 800;
          border: none;
          border-radius: 12px;
          padding: 14px 16px;
          width: 100%;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(34, 197, 94, 0.25);
          transition: transform 0.05s ease, box-shadow 0.12s ease;
        }
        .cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(34, 197, 94, 0.28);
        }
      `}</style>
    </div>
  );
}
