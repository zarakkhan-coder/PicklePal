// pages/weekly.js
import { useEffect, useState } from 'react';

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch('/api/weekly');
      const out = await r.json();
      setRows(out.rows || []);
      setLoading(false);
    })();
  }, []);

  const top = rows[0];

  return (
    <div className="wrap">
      <h1>Weekly Results</h1>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <p>No votes this week yet — be the first!</p>
      ) : (
        <>
          <div className="suggest">
            <strong>Suggested slot (majority):</strong>{' '}
            {top.day} {top.start_time}–{top.end_time} ({top.votes} {top.votes === 1 ? 'vote' : 'votes'})
            <div className="links">
              <a
                href="https://walmart.clubautomation.com/event/reserve-court-new"
                target="_blank"
                rel="noreferrer"
              >
                Book court at Walmart ClubAutomation →
              </a>
              <button
                onClick={() => {
                  const text = `Pickleball: ${top.day} ${top.start_time}–${top.end_time} (${top.votes} votes)`;
                  navigator.clipboard.writeText(text);
                  alert('Booking details copied!');
                }}
              >
                Copy details
              </button>
            </div>
          </div>

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
                  <td className="players">
                    {Array.isArray(r.player_names) && r.player_names.length
                      ? r.player_names.join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="back">
            ← <a href="/">Back to vote</a>
          </p>
        </>
      )}

      <style jsx>{`
        .wrap {
          max-width: 880px;
          margin: 30px auto 50px;
          padding: 0 16px;
        }
        h1 {
          margin-bottom: 10px;
        }
        .suggest {
          background: #eefdf4;
          border: 1px solid #cdeedf;
          padding: 14px 14px 10px;
          border-radius: 10px;
          margin: 8px 0 16px;
        }
        .links {
          margin-top: 8px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .links a {
          color: #0b7c66;
          text-decoration: underline;
        }
        .links button {
          border: 1px solid #a7e0c6;
          background: #fff;
          color: #0b7c66;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        h2 {
          margin-top: 20px;
        }
        .tbl {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .tbl th,
        .tbl td {
          border: 1px solid #e6f0ea;
          padding: 10px 12px;
        }
        .tbl th {
          background: #f6fffb;
          text-align: left;
        }
        .players {
          color: #064e3b;
          font-size: 14.5px;
        }
        .back {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
