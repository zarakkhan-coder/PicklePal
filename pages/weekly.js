// pages/weekly.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/weekly');
        const j = await r.json();
        if (alive) setRows(Array.isArray(j.rows) ? j.rows : []);
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const top = rows[0];

  return (
    <>
      <Head><title>PicklePal — Weekly Results</title></Head>
      <div className="wrap">
        <div className="card">
          <div className="header">
            <span className="dot" />
            <h1>PicklePal</h1>
            <span className="sub">Weekly Results</span>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              {top && (
                <div className="callout">
                  <strong>Suggested slot (majority):</strong>{' '}
                  {top.day} {fmt(top.start_time)}–{fmt(top.end_time)} ({top.votes} {top.votes === 1 ? 'vote' : 'votes'})
                  <div><a href="https://walmart.clubautomation.com/event/reserve-court-new" target="_blank" rel="noreferrer">Book court at Walmart ClubAutomation →</a></div>
                </div>
              )}

              <div className="table">
                <div className="thead">
                  <div>Day</div><div>Start</div><div>End</div><div>Votes</div><div>Players</div>
                </div>
                {rows.map((r, i) => (
                  <div className="row" key={i}>
                    <div>{r.day}</div>
                    <div>{fmt(r.start_time)}</div>
                    <div>{fmt(r.end_time)}</div>
                    <div>{r.votes}</div>
                    <div className="names">{(r.names || []).join(', ')}</div>
                  </div>
                ))}
              </div>

              <div className="links">
                <a href="/">← Back to vote</a>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .wrap{min-height:100vh;display:grid;place-items:center;background:#0b1b2a;padding:32px 16px}
        .card{width:100%;max-width:980px;background:#0f2236;color:#eaf6ff;border:1px solid #14314a;border-radius:16px;box-shadow:0 10px 50px rgba(0,0,0,.4);padding:28px}
        .header{display:flex;align-items:center;gap:10px}
        .dot{width:10px;height:10px;border-radius:50%;background:#ffe66d;box-shadow:0 0 8px #ffe66d}
        h1{margin:0;font-size:26px}
        .sub{margin-left:auto;opacity:.8}
        .callout{margin:14px 0 18px;padding:12px;border-radius:10px;background:#0b1b2a;border:1px solid #244b6b}
        .table{display:grid;gap:6px}
        .thead,.row{display:grid;grid-template-columns:100px 95px 95px 70px 1fr;gap:10px;align-items:center}
        .thead{opacity:.8}
        .names{opacity:.95}
        .links{margin-top:12px}
        a{color:#7fd6ff;text-decoration:none}
      `}</style>
    </>
  );
}

function fmt(hhmm) {
  // display in 12h for readability
  const [H, M] = hhmm.split(':').map(Number);
  const ampm = H >= 12 ? 'PM' : 'AM';
  const h = ((H + 11) % 12) + 1;
  return `${h}:${String(M).padStart(2, '0')} ${ampm}`;
}
