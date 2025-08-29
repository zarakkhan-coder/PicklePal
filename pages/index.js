// pages/index.js
import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";

const DAYS = ["Saturday", "Sunday"];

// 24h times every 1 hour (00:00 ... 24:00)
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const LAT = parseFloat(process.env.NEXT_PUBLIC_WEATHER_LAT || process.env.WEATHER_LAT || "36.3729");
const LON = parseFloat(process.env.NEXT_PUBLIC_WEATHER_LON || process.env.WEATHER_LON || "-94.208");

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("Saturday");
  const [from, setFrom] = useState("07:00");
  const [to, setTo] = useState("08:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [adminBusy, setAdminBusy] = useState(false);

  // Weather
  const [wx, setWx] = useState([]); // [{label, tmin, tmax, pop, icon}]
  const [wxErr, setWxErr] = useState("");

  // subtle click sound (tiny WebAudio "tick")
  const clickRef = useRef(null);
  function playClick() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // only allow "to" > "from"
  const toOptions = useMemo(() => {
    const fromIdx = HOURS.indexOf(from);
    return HOURS.slice(fromIdx + 1);
  }, [from]);

  useEffect(() => {
    // ensure "to" is after "from"
    if (HOURS.indexOf(to) <= HOURS.indexOf(from)) {
      const next = HOURS[HOURS.indexOf(from) + 1] || "24:00";
      setTo(next);
    }
  }, [from]); // eslint-disable-line

  // --- Weather (Open-Meteo) ---
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (!json?.daily?.time) return setWxErr("No forecast");
        const days = json.daily.time.map((d, i) => ({
          date: d,
          tmin: Math.round(json.daily.temperature_2m_min[i]),
          tmax: Math.round(json.daily.temperature_2m_max[i]),
          pop: json.daily.precipitation_probability_max[i],
          code: json.daily.weathercode[i]
        }));

        // find upcoming Sat & Sun
        const target = [];
        for (const d of days) {
          const dt = new Date(d.date + "T00:00:00");
          const dow = dt.getDay(); // Sun=0 ... Sat=6
          if (dow === 6) target.push({ label: "Saturday", ...d });
          if (dow === 0) target.push({ label: "Sunday", ...d });
          if (target.length === 2) break;
        }
        setWx(target);
      })
      .catch(() => setWxErr("Weather unavailable"));
  }, []);

  function wxIcon(code) {
    // basic WMO code → emoji
    if (code === 0) return "☀️";
    if ([1, 2].includes(code)) return "⛅️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65].includes(code)) return "🌧️";
    if ([66, 67, 80, 81, 82].includes(code)) return "🌦️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    return "🌤️";
  }

  async function submitVote(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (HOURS.indexOf(to) <= HOURS.indexOf(from)) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null, // optional
          day,
          start_time: from,
          end_time: to,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save vote");
      }

      playClick(); // subtle click
      window.location.href = "/weekly";
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function adminAction(kind) {
    const pin = window.prompt(kind === 'clear' ? "Enter admin PIN to CLEAR this week's votes:" : "Enter admin PIN to UNDO last clear:");
    if (!pin) return;
    setAdminBusy(true);
    try {
      const url = kind === 'clear' ? '/api/admin/clear' : '/api/admin/undo';
      const r = await fetch(url, { method: 'POST', headers: { 'x-admin-pin': pin } });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      alert(kind === 'clear'
        ? `Cleared ${j.deleted} vote(s). Backup saved.`
        : `Restored ${j.restored} vote(s).`);
    } catch (e) {
      alert(e.message || 'Action failed');
    } finally {
      setAdminBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>PicklePal — Vote to Play</title>
      </Head>

      <div className="court"> {/* background court + floats live here */}
        {/* Bright floating paddles/balls */}
        <div className="float float--paddle" style={{ top: 120, left: 40 }}>🏓</div>
        <div className="float float--ball" style={{ top: 480, left: 70 }}>🟡</div>
        <div className="float float--paddle" style={{ top: 80, right: 40 }}>🏓</div>
        <div className="float float--ball" style={{ top: 360, right: 70 }}>🟡</div>

        <div className="pp-wrap">
          <div className="pp-card">
            <div className="pp-header">
              <span className="pp-ball">🟡</span>
              <h1>PicklePal</h1>
              <span className="pp-sub">Vote to Play</span>
            </div>

            {/* Weather chips */}
            <div className="wx-row">
              {wxErr ? (
                <div className="wx-chip wx-muted">Weather: {wxErr}</div>
              ) : (
                wx.map((d) => (
                  <div className="wx-chip" key={d.label} title={d.date}>
                    <span className="wx-emoji">{wxIcon(d.code)}</span>
                    <span className="wx-label">{d.label}</span>
                    <span className="wx-temp">{d.tmax}° / {d.tmin}°</span>
                    <span className="wx-pop">{d.pop}%</span>
                  </div>
                ))
              )}
            </div>

            <p className="pp-copy">
              You can vote more than once; we’ll use the majority each week. Players who enter an email will receive reminders.
            </p>

            <form onSubmit={submitVote} className="pp-form">
              <label>
                Name <span className="req">*</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email (optional)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <div className="pp-row">
                <label>
                  Day
                  <select value={day} onChange={(e) => setDay(e.target.value)}>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  From
                  <select value={from} onChange={(e) => setFrom(e.target.value)}>
                    {HOURS.slice(0, -1).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>

                <label>
                  To
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    {toOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <div className="pp-error">{error}</div>}

              <button className="pp-btn" disabled={submitting}>
                {submitting ? "Saving..." : "Submit Vote"}
              </button>

              <div className="pp-link">
                <a href="/weekly">See weekly results →</a>
              </div>
            </form>

            {/* Admin bar: Clear + Undo */}
            <div className="admin-bar">
              <button className="admin-btn danger" disabled={adminBusy} onClick={() => adminAction('clear')}>
                Clear this week’s votes
              </button>
              <button className="admin-btn" disabled={adminBusy} onClick={() => adminAction('undo')}>
                Undo last clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* --------- Full-screen court backdrop with pickleball layout --------- */
        .court {
          min-height: 100vh;
          position: relative;
          background:
            radial-gradient(1200px 600px at 25% -20%, #bafc6f22 30%, transparent 60%),
            radial-gradient(1200px 800px at 110% 0%, #6de3ff22 30%, transparent 60%),
            linear-gradient(180deg, #0b1826, #0b1826);
        }
        /* Court lines drawn with layered gradients */
        .court::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            /* top/bottom baselines */
            linear-gradient(#1ea3ff, #1ea3ff) 50% 12%/ 80% 2px,
            linear-gradient(#1ea3ff, #1ea3ff) 50% 88%/ 80% 2px,
            /* left/right sidelines */
            linear-gradient(#1ea3ff, #1ea3ff) 10% 50%/ 2px 64%,
            linear-gradient(#1ea3ff, #1ea3ff) 90% 50%/ 2px 64%,
            /* net line in the middle */
            linear-gradient(#1ea3ff, #1ea3ff) 50% 50%/ 80% 2px,
            /* kitchen lines 7ft each side of net (approx at 35% & 65%) */
            linear-gradient(#1ea3ff, #1ea3ff) 50% 35%/ 80% 2px,
            linear-gradient(#1ea3ff, #1ea3ff) 50% 65%/ 80% 2px,
            /* centerlines per side */
            linear-gradient(#1ea3ff, #1ea3ff) 50% 31%/ 2px 38%,
            linear-gradient(#1ea3ff, #1ea3ff) 50% 69%/ 2px 38%;
          background-repeat: no-repeat;
          opacity: .55;
        }

        /* brighter floating bits */
        .float {
          position: fixed;
          font-size: 36px;
          z-index: 0;
          filter: drop-shadow(0 6px 8px rgba(0,0,0,.35));
          animation: bob 5s ease-in-out infinite;
          opacity: .9;
        }
        .float--ball { color: #ffd600; }
        .float--paddle { transform: rotate(-15deg); }
        @keyframes bob {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }

        /* layout wrapper */
        .pp-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 40px 16px;
          position: relative;
          z-index: 1;
        }
        .pp-card {
          width: 100%;
          max-width: 820px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0,0,0,.45);
          padding: 28px;
        }
        .pp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .pp-header h1 { font-size: 28px; margin: 0; }
        .pp-sub { margin-left: auto; opacity: .75; }
        .pp-ball { font-size: 20px; }

        .pp-copy { margin: 8px 0 18px; opacity: .9; }

        .pp-form label {
          display: block;
          margin-bottom: 14px;
          font-weight: 600;
        }
        .pp-row {
          display: grid;
          gap: 12px;
          grid-template-columns: 2fr 1fr 1fr;
        }
        input, select {
          width: 100%;
          margin-top: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #244b6b;
          background: #0b1b2a;
          color: #eaf6ff;
          outline: none;
        }
        input::placeholder { color: #7aa0bc; }

        .pp-btn {
          margin-top: 6px;
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #33cc66, #00b3ff);
          border: none;
          border-radius: 10px;
          color: #03121d;
          font-weight: 800;
          letter-spacing: .3px;
          cursor: pointer;
        }
        .pp-error {
          background: #441818; border: 1px solid #8b2e2e; color: #ffc1c1;
          border-radius: 10px; padding: 10px 12px; margin: 8px 0 12px;
        }
        .pp-link { margin-top: 10px; text-align: center; }
        .pp-link a { color: #7fd6ff; text-decoration: none; }
        .req { color: #ff8b8b; }

        /* Weather chips */
        .wx-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .wx-chip {
          display: inline-flex; align-items: center; gap: 8px;
          background: #0b1b2a; border: 1px solid #25445e; color: #eaf6ff;
          border-radius: 999px; padding: 6px 10px; font-size: 14px;
        }
        .wx-emoji { font-size: 18px; }
        .wx-label { font-weight: 700; }
        .wx-temp { opacity: .9; }
        .wx-pop { opacity: .7; margin-left: 2px; }

        .wx-muted { opacity: .6; }

        /* admin buttons */
        .admin-bar { margin-top: 14px; display: flex; gap: 10px; justify-content: flex-end; }
        .admin-btn {
          background: #15324a; color: #eaf6ff; border: 1px solid #244b6b;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
        }
        .admin-btn.danger { background: #3b1620; border-color: #5c2433; }
      `}</style>
    </>
  );
}
