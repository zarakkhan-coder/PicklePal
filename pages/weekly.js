// pages/weekly.js
import Head from 'next/head';
import Shell from '../components/Shell';
import useSWR from 'swr';

const fetcher = (u) => fetch(u).then(r => r.json());

function hhmmToLabel(s) {
  const [H, M] = s.split(':').map(Number);
  const ampm = H >= 12 ? 'PM' : 'AM';
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}:${M.toString().padStart(2, '0')} ${ampm}`;
}

export default function Weekly() {
  const { data } = useSWR('/api/weekly', fetcher, { refreshInterval: 15000 });
  const rows = data?.rows || [];

  const top = rows[0];

  return (
    <>
      <Head><title>PicklePal — Weekly Results</title></Head>
      <Shell>
        <div className="wrap">
          <div className="card">
            <div className="hdr">
              <div><span className="dot" /> <span className="brand">PicklePal</span></div>
              <div className="muted">Weekly Results</div>
            </div>

            <div className="banner">
              {top
                ? (
                  <>
                    <b>Suggested slot (majority):</b>&nbsp;
                    {top.day} {hhmmToLabel(top.start_time)}–{hhmmToLabel(top.end_time)} ({top.votes} {top.votes === 1 ? 'vote' : 'votes'})
                    <div><a href="https://walmart.clubautomation.com/event/reserve-court-new" target="_blank" rel="noreferrer">
                      Book court at Walmart ClubAutomation →
                    </a></div>
                  </>
                )
                : 'No votes yet.'}
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Day</th><th>Start</th><th>End</th><th>Votes</th><th>Players</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.day}</td>
                    <td>{hhmmToLabel(r.start_time)}</td>
                    <td>{hhmmToLabel(r.end_time)}</td>
                    <td>{r.votes}</td>
                    <td>{(r.players || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="back"><a href="/">← Back to vote</a></div>
          </div>
        </div>
      </Shell>

      <style jsx>{`
        .wrap { display:grid; place-items:center; min-height: calc(100vh - 80px); }
        .card {
          width: 100%; max-width: 980px; background: #0e2233; color: #eaf6ff;
          border: 1px solid #16354a; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,.45);
          padding: 24px; position: relative; z-index: 2;
        }
        .hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .brand { font-weight:800; font-size:22px; margin-left:6px; }
        .muted { opacity:.75; font-size:14px; }
        .dot { width:10px; height:10px; border-radius:50%; display:inline-block; background:#f0ff53; box-shadow:0 0 10px #f0ff53; }
        .banner { background:#0f2e45; border:1px solid #174a67; border-radius:12px; padding:12px 14px; margin:8px 0 16px; }
        .tbl { width:100%; border-collapse:collapse; }
        th, td { padding:10px 8px; border-bottom:1px solid #183a53; text-align:left; }
        .back { margin-top:10px; }
        a { color:#7fd6ff; text-decoration:none; }
      `}</style>
    </>
  );
}
