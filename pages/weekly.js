// pages/weekly.js
import { useEffect, useState } from "react";
import Head from "next/head";

function to12h(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  // If it already looks like "7:00 AM" or "8:30 PM", keep it.
  if (/(am|pm)/i.test(s)) return s;

  // Otherwise, assume "HH:mm"
  const [hh, mm] = s.split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (Number.isNaN(h) || Number.isNaN(m)) return s; // fallback

  const ampm = h < 12 ? "AM" : "PM";
  const hour12 = (h % 12) || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/weekly");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load weekly results.");
        }
        if (alive) setRows(Array.isArray(json.rows) ? json.rows : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load weekly results.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const top = rows[0];

  return (
    <>
      <Head>
        <title>PicklePal — Weekly Results</title>
      </Head>

      <div className="wrap">
        <div className="card">
          <div className="head">
            <div className="brand">
              <span className="dot" />
              <h1>PicklePal</h1>
            </div>
            <div className="muted">Weekly Results</div>
          </div>

          {loading ? (
            <div className="muted" style={{ padding: "16px" }}>
              Loading weekly results…
            </div>
          ) : err ? (
            <div className="error">{err}</div>
          ) : (
            <>
              <div className="suggest">
                {top ? (
                  <>
                    <strong>Suggested slot (majority):</strong>{" "}
                    {top.day} {to12h(top.start_time)}–{to12h(top.end_time)}{" "}
                    ({top.votes} {top.votes === 1 ? "vote" : "votes"}){" "}
                    <a
                      href="https://walmart.clubautomation.com/event/reserve-court-new"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Book court at Walmart ClubAutomation →
                    </a>
                  </>
                ) : (
                  <>No votes this week yet.</>
                )}
              </div>

              <div className="table">
                <div className="row headrow">
                  <div>Day</div>
                  <div>Start</div>
                  <div>End</div>
                  <div>Votes</div>
                  <div>Players</div>
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="row">
                    <div>{r.day}</div>
                    <div>{to12h(r.start_time)}</div>
                    <div>{to12h(r.end_time)}</div>
                    <div>{r.votes}</div>
                    <div>
                      {Array.isArray(r.players)
                        ? r.players.join(", ")
                        : (Array.isArray(r.names) ? r.names.join(", ") : "")}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="back">
            <a href="/">← Back to vote</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: radial-gradient(1200px 600px at 20% -20%, #aefb6f22 30%, transparent 60%),
            radial-gradient(1200px 800px at 110% 0%, #6de3ff22 30%, transparent 60%),
            linear-gradient(180deg, #0b1b2a, #0b1b2a);
          padding: 32px 16px;
        }
        .card {
          width: 100%;
          max-width: 1100px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0,0,0,0.4);
          padding: 20px;
        }
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand h1 {
          margin: 0;
          font-size: 28px;
        }
        .dot {
          width: 10px;
          height: 10px;
          background: #f4f07a;
          border-radius: 50%;
          box-shadow: 0 0 10px #f4f07a;
          display: inline-block;
        }
        .muted {
          opacity: 0.8;
        }
        .error {
          background: #441818;
          border: 1px solid #8b2e2e;
          color: #ffc1c1;
          border-radius: 10px;
          padding: 12px;
          margin: 8px 0 12px;
        }
        .suggest {
          background: #0b1b2a;
          border: 1px solid #204261;
          border-radius: 10px;
          padding: 12px 14px;
          margin: 6px 0 16px;
        }
        .suggest a {
          margin-left: 10px;
          color: #7fd6ff;
          text-decoration: none;
        }
        .table {
          display: grid;
          gap: 6px;
          margin-top: 8px;
        }
        .row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 4fr;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid #173754;
        }
        .headrow {
          font-weight: 700;
          opacity: 0.85;
          border-bottom: 1px solid #204261;
          padding-bottom: 8px;
        }
        .back {
          margin-top: 16px;
        }
        .back a {
          color: #7fd6ff;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
