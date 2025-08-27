// pages/results.js
import React from 'react';

const BOOKING_URL = 'https://walmart.clubautomation.com/event/reserve-court-new';

export default function Results() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/tally');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load tally');
        if (alive) setRows(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 15000); // refresh every 15 seconds
    return () => { alive = false; clearInterval(id); };
  }, []);

  const suggestion = rows[0]; // highest votes

  return (
    <div style={{ maxWidth: 860, margin: '40px auto', padding: 16 }}>
      <h1>Weekly Results</h1>
      <p>We suggest the slot with the most votes.</p>

      {loading && <p>Loading…</p>}
      {!loading && rows.length === 0 && <p>No votes yet this week.</p>}

      {!loading && rows.length > 0 && (
        <>
          <div style={{ background: '#eef6ff', padding: 12, borderRadius: 8, margin: '12px 0' }}>
            <strong>Suggested slot (majority):</strong>{' '}
            {suggestion.day} {suggestion.start_time}–{suggestion.end_time} ({suggestion.votes} votes)
            <div style={{ marginTop: 8 }}>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2c63ff', textDecoration: 'underline' }}
              >
                Book court at Walmart ClubAutomation →
              </a>
            </div>
          </div>

          <h3>Full tally</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Day</th>
                <th style={{ padding: '8px' }}>Start</th>
                <th style={{ padding: '8px' }}>End</th>
                <th style={{ padding: '8px' }}>Votes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{r.day}</td>
                  <td style={{ padding: '8px' }}>{r.start_time}</td>
                  <td style={{ padding: '8px' }}>{r.end_time}</td>
                  <td style={{ padding: '8px' }}>{r.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <a href="/">← Back to vote</a>
      </div>
    </div>
  );
}
