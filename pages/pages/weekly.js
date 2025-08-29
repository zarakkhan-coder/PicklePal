// pages/weekly.js
import { useEffect, useState } from "react";
import Head from "next/head";

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function go() {
      try {
        const res = await fetch("/api/weekly");
        const json = await res.json();
        setRows(json.rows || []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    go();
  }, []);

  const top =
    rows.length > 0
      ? rows.reduce((a, b) => (a.votes >= b.votes ? a : b))
      : null;

  return (
    <>
      <Head>
        <title>Weekly Results — PicklePal</title>
      </Head>

      <div className="wrap">
        <div className="card">
          <h1>Weekly Results</h1>
          <p>We suggest the slot with the most votes.</p>

          {loading ? (
            <p>Loading…</p>
          ) : rows.length === 0 ? (
            <p>No votes yet for this week.</p>
          ) : (
            <>
              {top && (
                <div className="suggest">
                  <strong>Suggested slot (majority):</strong>{" "}
                  {top.day} {top.start_time}–{top.end_time} ({top.votes}{" "}
                  votes)
                  <div>
                    <a
                      href="https://walmart.clubautomation.com/event/reserve-court-new"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Book court at Walmart ClubAutomation →
                    </a>
                  </div>
                </div>
              )}

              <h3>Full tally</h3>
              <table>
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
                      <td>{Array.isArray(r.player_names) ? r.player_names.join(", ") : r.player_names}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          background: linear-gradient(180deg, #0b1b2a, #0b1b2a);
          padding: 32px 16px;
        }
        .card {
          width: 100%;
          max-width: 860px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          padding: 24px;
        }
        .suggest {
          background: #0b2a1a;
          border: 1px solid #174a2f;
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0 18px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          border: 1px solid #1d3a54;
          border-radius: 10px;
          overflow: hidden;
        }
        th,
        td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid #1d3a54;
        }
        thead th {
          background: #102b42;
        }
        .back {
          margin-top: 14px;
        }
        .back a {
          color: #7fd6ff;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
