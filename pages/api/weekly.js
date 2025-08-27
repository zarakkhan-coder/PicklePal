// pages/weekly.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Weekly() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/weekly')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setRows(d.rows || []);
        else setErr(d.error || 'Error');
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const top = rows?.[0];

  return (
    <>
      <Head>
        <title>Weekly Results</title>
      </Head>
      <main style={{ maxWidth: 860, margin: '40px auto', padding: '0 16px' }}>
        <h1>Weekly Results</h1>

        {loading && <p>Loading…</p>}
        {err && <p style={{ color: 'red' }}>Error: {err}</p>}

        {top && (
          <div style={{
            background: '#eef6ff',
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            border: '1px solid #d6e7ff'
          }}>
            <strong>Suggested slot (majority): </strong>
            {top.day} {top.start_time}–{top.end_time} ({top.votes} votes)
            <div style={{ marginTop: 8 }}>
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

        <h2>Full tally</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Day</th>
              <th style={th}>From</th>
              <th style={th}>To</th>
              <th style={th}>Votes</th>
              <th style={th}>Names</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.day}</td>
                <td style={td}>{r.start_time}</td>
                <td style={td}>{r.end_time}</td>
                <td style={td}>{r.votes}</td>
                <td style={td}>{Array.isArray(r.names) ? r.names.join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 24 }}>
          <Link href="/">← Back to vote</Link>
        </p>
      </main>
    </>
  );
}

const th = {
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  padding: '8px 6px'
};

const td = {
  borderBottom: '1px solid #eee',
  padding: '8px 6px'
};
