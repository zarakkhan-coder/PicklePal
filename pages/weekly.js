// pages/weekly.js
import Head from "next/head";
import { useEffect, useState } from "react";

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const hasData = rows && rows.length > 0;
  const top = hasData ? rows[0] : null;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/weekly");
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    })();
  }, []);

  return (
    <>
      <Head>
        <title>PicklePal — Weekly Results</title>
      </Head>

      {/* side fills */}
      <div className="edge edge-left" aria-hidden />
      <div className="edge edge-right" aria-hidden />

      {/* court & art */}
      <div className="court" aria-hidden />
      <div className="pp-art" aria-hidden>
        <span className="ball b1">🟡</span>
        <span className="ball b2">🟡</span>
        <span className="paddle pd1">🏓</span>
      </div>

      <div className="pp-wrap">
        <div className="pp-card">
          <div className="pp-header">
            <div className="logo">
              <span className="logo-ball" />
              <span className="logo-paddle">🏓</span>
              <strong>PicklePal</strong>
            </div>
            <span className="tag">Weekly Results</span>
          </div>

          {hasData ? (
            <>
              <p className="callout">
                <strong>Suggested slot (majority):</strong>{" "}
                {top.day} {format24to12(top.start_time)}–{format24to12(top.end_time)}{" "}
                ({top.votes} votes)
                <br />
                <a
                  className="book"
                  href="https://walmart.clubautomation.com/event/reserve-court-new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Book court at Walmart ClubAutomation →
                </a>
              </p>

              <table className="tbl">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Votes</th>
                    <th>Players</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.day}</td>
                      <td>{format24to12(r.start_time)}</td>
                      <td>{format24to12(r.end_time)}</td>
                      <td>{r.votes}</td>
                      <td>{(r.player_names || []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>No votes yet this week.</p>
          )}

          <div className="pp-link">
            <a href="/">← Back to vote</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pp-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #0b1b2a, #0b1b2a);
          padding: 32px 16px;
          position: relative;
          overflow: hidden;
        }

        .edge {
          position: fixed;
          top: -10%;
          bottom: -10%;
          width: 40vw;
          filter: blur(40px);
          opacity: 0.25;
          z-index: 0;
          pointer-events: none;
        }
        .edge-left {
          left: -10vw;
          background: radial-gradient(closest-side, #6de3ff, transparent 70%);
        }
        .edge-right {
          right: -10vw;
          background: radial-gradient(closest-side, #aefb6f, transparent 70%);
        }

        .court {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background:
            repeating-linear-gradient(
              to right,
              #224861 0 2px,
              transparent 2px 90px
            ),
            repeating-linear-gradient(
              to bottom,
              #224861 0 2px,
              transparent 2px 90px
            );
          z-index: 0;
        }

        .pp-art {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .ball, .paddle {
          position: absolute;
          opacity: 0.35;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,.35));
        }
        .ball { font-size: 34px; animation: float 16s linear infinite; }
        .b1 { left: 10%; bottom: -60px; animation-duration: 18s; }
        .b2 { right: 12%; bottom: -60px; animation-duration: 20s; }
        .paddle { font-size: 44px; animation: slow-sway 9s ease-in-out infinite; }
        .pd1 { left: 6%; top: 20%; transform: rotate(14deg); }

        @keyframes float {
          0%   { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-120vh) rotate(360deg); }
        }
        @keyframes slow-sway {
          0%,100% { transform: translateY(0) rotate(-18deg); }
          50%     { transform: translateY(6px) rotate(-10deg); }
        }

        .pp-card {
          width: 100%;
          max-width: 900px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
          padding: 28px;
          position: relative;
          z-index: 2;
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffe45e, #ffd400 60%, #cc9c00);
          box-shadow: 0 0 12px #ffd40088, 0 0 24px #ffd40044;
          animation: pulse 2.4s ease-in-out infinite;
        }
        .logo-paddle { font-size: 22px; transform: translateY(1px); }
        .tag { font-size: 14px; opacity: .8; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }

        .callout {
          background: #0b1b2a;
          border: 1px solid #1e3f5a;
          border-radius: 12px;
          padding: 12px 14px;
          margin: 8px 0 18px;
        }
        .book { color: #7fd6ff; text-decoration: none; }

        .tbl {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .tbl th, .tbl td {
          border-bottom: 1px solid #1e3f5a;
          padding: 10px 8px;
          text-align: left;
        }
        .tbl th { color: #a6c9e4; font-weight: 700; }

        .pp-link { margin-top: 14px; text-align: center; }
        .pp-link a { color: #7fd6ff; text-decoration: none; }
      `}</style>
    </>
  );
}

function format24to12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}
