// pages/weekly.js
import { useEffect, useState } from "react";
import Head from "next/head";

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/weekly");
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load results.");
        setRows(json.rows || []);
      } catch (e) {
        setError(e.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const best = rows.reduce((a, b) => (b.votes > (a?.votes || 0) ? b : a), null);

  return (
    <>
      <Head>
        <title>Weekly Results — PicklePal</title>
      </Head>

      <div className="wrap">
        <div className="card">
          <h1>Weekly Results</h1>
          <p className="sub">We suggest the slot with the most votes.</p>

          {loading && <div className="muted">Loading…</div>}
          {error && <div className="err">{error}</div>}

          {!loading && !error && (
            <>
              {best ? (
                <div className="suggestion">
                  <strong>Suggested slot (majority):</strong>{" "}
                  {best.day} {best.start_time}–{best.end_time} ({best.votes} {best.votes === 1 ? "vote" : "votes"})
                  <div>
                    <a
                      className="book"
                      href="https://walmart.clubautomation.com/event/reserve-court-new"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Book court at Walmart ClubAutomation →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="muted">No votes yet this week.</div>
              )}

              {!!rows.length && (
                <>
                  <h2>Full tally</h2>
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
                          <td>{r.start_time}</td>
                          <td>{r.end_time}</td>
                          <td>{r.votes}</td>
                          <td>{(r.player_names || []).join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div className="back">
                <a href="/">← Back to vote</a>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px 16px;
          background: radial-gradient(1200px 600px at 20% -20%, #aefb6f33 30%, transparent 60%),
            radial-gradient(1200px 800px at 110% 0%, #6de3ff33 30%, transparent 60%),
            linear-gradient(180deg, #0b1b2a, #0b1b2a);
          color: #eaf6ff;
        }
        .card {
          width: 100%;
          max-width: 900px;
          background: #0f2236;
          border: 1px solid #14314a;
          border-radius: 16px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
          padding: 28px;
        }
        h1 {
          margin: 0 0 8px;
        }
        .sub {
          margin: 0 0 18px;
          opacity: 0.85;
        }
        .err {
          background: #441818;
          border: 1px solid #8b2e2e;
          color: #ffc1c1;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .muted {
          opacity: 0.85;
        }
        .suggestion {
          background: #0b1b2a;
          border: 1px solid #1b3852;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }
        .book {
          display: inline-block;
          margin-top: 6px;
          color: #7fd6ff;
          text-decoration: none;
        }
        h2 {
          margin: 18px 0 8px;
        }
        .tbl {
          width: 100%;
          border-collapse: collapse;
          background: #0b1b2a;
          border: 1px solid #1b3852;
          border-radius: 10px;
          overflow: hidden;
        }
        .tbl th,
        .tbl td {
          padding: 10px 12px;
          border-bottom: 1px solid #1b3852;
          text-align: left;
        }
        .tbl thead th {
          background: #0f2740;
        }
        .tbl tbody tr:last-child td {
          border-bottom: none;
        }
        .back {
          margin-top: 12px;
        }
        .back a {
          color: #7fd6ff;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
