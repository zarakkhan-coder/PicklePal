// pages/weekly.js
import { useEffect, useState } from "react";
import Head from "next/head";

const BOOK_URL = "https://walmart.clubautomation.com/event/reserve-court-new";

// Postgres date_trunc('week', ...) returns the ISO week start (MONDAY).
// Map ISO-week offset for each day:
const ISO_OFFSET = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

// Build a Date (in UTC) for the given row's day using the week_start date
function dateForRow(week_start, day) {
  // ensure UTC so local TZ doesn’t shift the calendar day
  const base = new Date(`${week_start}T00:00:00Z`);
  const offsetDays = ISO_OFFSET[day] ?? 0;
  return new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000);
}

// Short, locale-friendly date like "Aug 31"
function fmtDate(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/weekly?ts=${Date.now()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!alive) return;
        setRows(json.rows || []);
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // pick top suggestion (by votes, then earliest day/start)
  const top = rows[0];

  return (
    <>
      <Head>
        <title>PicklePal — Weekly Results</title>
      </Head>

      <div className="wrap">
        <div className="card">
          <div className="cardHead">
            <div className="brand">
              <span className="dot" />
              <h1>PicklePal</h1>
            </div>
            <div className="title">Weekly Results</div>
          </div>

          <div className="suggest">
            <p>
              <strong>Suggested slot (majority):</strong>{" "}
              {top ? (
                <>
                  {top.day} — {fmtDate(dateForRow(top.week_start, top.day))}{" "}
                  {top.start_time}–{top.end_time} ({top.votes}{" "}
                  {top.votes === 1 ? "vote" : "votes"})
                </>
              ) : (
                "No votes yet"
              )}
              {"  "}
              <a href={BOOK_URL} target="_blank" rel="noreferrer">
                Book court at Walmart ClubAutomation →
              </a>
            </p>
          </div>

          {loading ? (
            <div className="loading">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="empty">No votes yet for this week.</div>
          ) : (
            <div className="tableWrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Day / Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Votes</th>
                    <th>Players</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const playDate = dateForRow(r.week_start, r.day);
                    return (
                      <tr key={i}>
                        <td>
                          <strong>{r.day}</strong>{" "}
                          <span className="muted">— {fmtDate(playDate)}</span>
                        </td>
                        <td>{r.start_time}</td>
                        <td>{r.end_time}</td>
                        <td>{r.votes}</td>
                        <td>
                          {(r.players || []).join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="back">
            ← <a href="/">Back to vote</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #08131e;
          padding: 28px 16px;
        }
        .card {
          width: 100%;
          max-width: 980px;
          background: #0f2236;
          color: #eaf6ff;
          border: 1px solid #14314a;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.4);
        }
        .cardHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #ffeb70;
          box-shadow: 0 0 12px #ffeb70aa;
          display: inline-block;
        }
        h1 {
          margin: 0;
          font-size: 22px;
        }
        .title {
          opacity: 0.7;
        }
        .suggest {
          background: #0b1b2a;
          border: 1px solid #203e57;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }
        .suggest a {
          color: #7fd6ff;
          margin-left: 8px;
          text-decoration: none;
        }
        .tableWrap {
          overflow-x: auto;
        }
        .tbl {
          width: 100%;
          border-collapse: collapse;
        }
        .tbl th,
        .tbl td {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid #17344a;
          vertical-align: top;
        }
        .muted {
          opacity: 0.8;
        }
        .back {
          margin-top: 16px;
        }
        .back a {
          color: #7fd6ff;
          text-decoration: none;
        }
        .loading,
        .empty {
          padding: 16px 8px;
          opacity: 0.9;
        }
      `}</style>
    </>
  );
}
