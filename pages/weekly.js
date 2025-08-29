// pages/weekly.js
import { useEffect, useState } from 'react';

const card = {
  maxWidth: 920,
  margin: '32px auto',
  padding: '24px',
  borderRadius: 16,
  background: '#0b1220',
  color: 'white',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const h1 = { fontSize: 34, margin: '24px 0' };
const small = { color: '#9bb0d3' };
const table = { width: '100%', borderCollapse: 'collapse' };
const thtd = { padding: '12px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' };

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/weekly')
      .then(r => r.json())
      .then(d => { setRows(d.rows || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={card}>
        <h1 style={h1}>Weekly Results</h1>
        <p style={small}>Loading…</p>
      </div>
    );
  }

  const top = rows[0];

  return (
    <div style={{ padding: '20px' }}>
      <div style={card}>
        <h1 style={h1}>Weekly Results</h1>
        <p style={small}>We suggest the slot with the most votes.</p>

        {top ? (
          <div
            style={{
              background: '#16223a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '16px',
              margin: '12px 0 20px',
            }}
          >
            <strong>Suggested slot (majority):</strong>{' '}
            {top.day} {top.start_time}–{top.end_time} ({top.votes} vote{top.votes === 1 ? '' : 's'})
            <div style={{ marginTop: 10 }}>
              <a
                href="https://walmart.clubautomation.com/event/reserve-court-new"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#6ecbff' }}
              >
                Book court at Walmart&nbsp;ClubAutomation →
              </a>
            </div>
          </div>
        ) : (
          <p style={small}>No votes yet this week.</p>
        )}

        <h3 style={{ margin: '20px 0 12px' }}>Full tally</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thtd}>Day</th>
                <th style={thtd}>From</th>
                <th style={thtd}>To</th>
                <th style={thtd}>Votes</th>
                <th style={thtd}>Players</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={thtd}>{r.day}</td>
                  <td style={thtd}>{r.start_time}</td>
                  <td style={thtd}>{r.end_time}</td>
                  <td style={thtd}>{r.votes}</td>
                  <td style={thtd}>
                    {(r.player_names || []).join(', ') || <span style={small}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 18 }}>
          <a href="/" style={{ color: '#9bb0d3' }}>← Back to vote</a>
        </div>
      </div>
    </div>
  );
}
