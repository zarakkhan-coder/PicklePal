// pages/index.js
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const DAYS = ["Saturday", "Sunday"];

// 24h times every 1 hour (00:00 ... 24:00)
const HOURS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

// crisp, satisfying “click”
function playClickSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const t = ctx.currentTime;

    // a short square blip with a tiny envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(2000, t);                     // initial freq
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.02); // little drop = nicer click

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch {
    // ignore if AudioContext not available / blocked
  }
}

export default function Home() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("Saturday");
  const [from, setFrom] = useState("07:00");
  const [to, setTo] = useState("08:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function submitVote(e) {
    e.preventDefault();
    setError("");

    // play the click right away on user gesture
    playClickSound();

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

      // go to results page
      router.push("/weekly");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>PicklePal — Vote to Play</title>
      </Head>

      {/* Decorative court lines & floating pickleballs/paddles */}
      <div className="court" aria-hidden />
      <div className="pp-art" aria-hidden>
        <span className="ball b1">🟡</span>
        <span className="ball b2">🟡</span>
        <span className="ball b3">🟡</span>
        <span className="paddle pd1">🏓</span>
        <span className="paddle pd2">🏓</span>
      </div>

      <div className="pp-wrap">
        <div className="pp-card">
          <div className="pp-header">
            <div className="logo">
              <span className="logo-ball" />
              <strong>PicklePal</strong>
            </div>
            <span className="tag">Vote to Play</span>
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
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                To
                <select value={to} onChange={(e) => setTo(e.target.value)}>
                  {toOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
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
        </div>
      </div>

      <style jsx>{`
        .pp-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: radial-gradient(1200px 600px at 20% -20%, #aefb6f33 30%, transparent 60%),
            radial-gradient(1200px 800px at 110% 0%, #6de3ff33 30%, transparent 60%),
            linear-gradient(180deg, #0b1b2a, #0b1b2a);
          padding: 32px 16px;
          position: relative;
          overflow: hidden;
        }

        /* translucent “court lines” overlay */
        .court {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.15;
          background:
            repeating-linear-gradient(
              to right,
              #224861 0 1px,
              transparent 1px 80px
            ),
            repeating-linear-gradient(
              to bottom,
              #224861 0 1px,
              transparent 1px 80px
            );
          mix-blend-mode: screen;
          z-index: 0;
        }

        .pp-card {
          width: 100%;
          max-width: 760px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
          padding: 28px;
          position: relative;
          z-index: 1;
        }

        .pp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
        }
        .logo-ball {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffe45e, #ffd400 60%, #cc9c00);
          box-shadow: 0 0 12px #ffd40088, 0 0 24px #ffd40044;
          transform: translateZ(0);
          animation: pulse 2.4s ease-in-out infinite;
        }
        .tag {
          font-size: 14px;
          opacity: 0.8;
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.08); }
        }

        .pp-copy {
          margin: 10px 0 20px;
          opacity: 0.9;
        }

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

        input,
        select {
          width: 100%;
          margin-top: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #244b6b;
          background: #0b1b2a;
          color: #eaf6ff;
          outline: none;
        }
        input::placeholder {
          color: #7aa0bc;
        }

        .pp-btn {
          margin-top: 6px;
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #33cc66, #00b3ff);
          border: none;
          border-radius: 10px;
          color: #03121d;
          font-weight: 800;
          letter-spacing: 0.3px;
          cursor: pointer;
          transform: translateY(0);
          transition: transform 160ms ease, box-shadow 160ms ease;
          box-shadow: 0 6px 14px rgba(0,0,0,.25);
        }
        .pp-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 18px rgba(0,0,0,.32);
        }
        .pp-btn:active {
          transform: translateY(0);
        }

        .pp-error {
          background: #441818;
          border: 1px solid #8b2e2e;
          color: #ffc1c1;
          border-radius: 10px;
          padding: 10px 12px;
          margin: 8px 0 12px;
        }
        .pp-link {
          margin-top: 10px;
          text-align: center;
        }
        .pp-link a {
          color: #7fd6ff;
          text-decoration: none;
        }
        .req { color: #ff8b8b; }

        /* Floating pickleballs/paddles */
        .pp-art {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .ball, .paddle {
          position: absolute;
          opacity: 0.28;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,.35));
        }
        .ball {
          font-size: 30px;
          text-shadow: 0 0 10px rgba(255,212,0,.2), 0 0 20px rgba(255,212,0,.12);
          animation: float 16s linear infinite;
        }
        .b1 { left: 6%;  bottom: -50px; animation-duration: 18s; }
        .b2 { left: 48%; bottom: -60px; animation-duration: 20s; }
        .b3 { right: 8%; bottom: -55px; animation-duration: 17s; }

        .paddle {
          font-size: 42px;
          transform: rotate(-18deg);
          animation: slow-sway 9s ease-in-out infinite;
        }
        .pd1 { right: 5%; top: 12%; }
        .pd2 { left: 4%; top: 20%; transform: rotate(14deg); }

        @keyframes float {
          0%   { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-120vh) rotate(360deg); }
        }
        @keyframes slow-sway {
          0%,100% { transform: rotate(-18deg) translateY(0); }
          50%     { transform: rotate(-10deg) translateY(6px); }
        }
      `}</style>
    </>
  );
}
