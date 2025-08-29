// pages/weekly.js
import { useEffect, useState } from "react";
import Head from "next/head";

function fmt12h(hhmm) {
  if (!hhmm) return "";
  // '07:00' => '7:00 AM'
  const [h, m] = hhmm.split(":").map(Number);
  let ampm = h >= 12 ? "PM" : "AM";
  let hour = h % 12; if (hour === 0) hour = 12;
  return `${hour}:${String(m).padStart(2,"0")} ${ampm}`;
}

export default function Weekly() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/weekly");
      const j = await r.json();
      if (j.ok) setRows(j.rows || []);
    })();
  }, []);

  const best = rows[0];

  return (
    <>
      <Head><title>Weekly Results — PicklePal</title></Head>

      <div className="pp-wrap">
        {/* floating bits */}
        <i className="pp-float paddle" style={{ left: 24, top: 120 }} />
        <i className="pp-float ball" style={{ right: 40, bottom: 120 }} />
        <i className="pp-float paddle" style={{ right: 18, top: 88 }} />

        <div className="card">
          <div className="hdr">
            <span className="dot" />
            <span className="pp-paddle">🏓</span>
            <h2>PicklePal</h2>
            <span className="sub">Weekly Results</span>
          </div>

          {best && (
            <div className="banner">
              <strong>Suggested slot (majority): </strong>
              {best.day} {fmt12h(best.start_time)}–{fmt12h(best.end_time)} ({best.votes} votes)
              <div>
                <a href="https://walmart.clubautomation.com/event/reserve-court-new" target="_blank" rel="noreferrer">
                  Book court at Walmart ClubAutomation →
                </a>
              </div>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>Day</th><th>Start</th><th>End</th><th>Votes</th><th>Players</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.day}</td>
                  <td>{fmt12h(r.start_time)}</td>
                  <td>{fmt12h(r.end_time)}</td>
                  <td>{r.votes}</td>
                  <td>{Array.isArray(r.names) && r.names.length ? r.names.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="back">
            <a href="/">← Back to vote</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pp-wrap{
          min-height:100vh; display:grid; place-items:center;
          background:
            radial-gradient(900px 500px at 10% -10%, #aefb6f22 30%, transparent 70%),
            radial-gradient(900px 700px at 120% -10%, #6de3ff22 30%, transparent 70%),
            linear-gradient(180deg,#0b1b2a,#0b1b2a);
          padding:32px 16px; position:relative; overflow:hidden;
        }
        .pp-float{ position:absolute; opacity:.95; animation: float 6s ease-in-out infinite; }
        .pp-float.paddle{ width:46px; height:46px; background: radial-gradient(circle at 30% 30%, #ff5ea8, #cc2a78); border-radius:12px; transform: rotate(-20deg); }
        .pp-float.ball{ width:22px; height:22px; background: radial-gradient(circle at 30% 30%, #ffd95e, #ffc12e); border-radius:50%; }
        @keyframes float { 0%{ transform: translateY(0) } 50%{ transform: translateY(-10px) } 100%{ transform: translateY(0) } }

        .card{ width:100%; max-width:930px; background:#0f2236; color:#eaf6ff; border:1px solid #14314a; border-radius:16px; box-shadow:0 10px 50px rgba(0,0,0,.4); padding:18px 20px; }
        .hdr{ display:flex; align-items:center; gap:12px; margin-bottom:6px; }
        .dot{ width:8px; height:8px; border-radius:50%; background:#ffe66d; box-shadow:0 0 8px #ffe66d; }
        .pp-paddle{ font-size:20px; }
        .hdr h2{ font-size:22px; margin:0; }
        .sub{ margin-left:auto; opacity:.8; font-size:12px; }

        .banner{ margin:10px 0 14px; padding:12px; border-radius:10px; background:#0b1b2a; border:1px solid #1e3d57; }
        .banner a{ color:#7fd6ff; text-decoration:none; }

        table{ width:100%; border-collapse:collapse; }
        th,td{ text-align:left; padding:10px 8px; border-bottom:1px solid #1b3b56; }
        th{ opacity:.9; font-weight:700; }
        .back{ margin-top:14px; }
        .back a{ color:#7fd6ff; text-decoration:none; }
      `}</style>
    </>
  );
}
