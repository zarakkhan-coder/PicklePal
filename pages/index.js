// pages/index.js
import React from 'react';

const DAY_OPTIONS = ['Saturday', 'Sunday'];
const TIME_OPTIONS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'
];

export default function Home() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [day, setDay] = React.useState('Saturday');
  const [startTime, setStartTime] = React.useState('7:00 AM');
  const [endTime, setEndTime] = React.useState('8:00 AM');
  const [status, setStatus] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('Submitting…');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, day, start_time: startTime, end_time: endTime })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setStatus('Thanks! Your vote was recorded.');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>PicklePal — Vote to Play</h1>
      <p>You can vote more than once; we’ll use the majority each week.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          type="email"
          placeholder="Your email (required)"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={{ padding: 8 }}>
            {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ padding: 8 }}>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ padding: 8 }}>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <button type="submit" style={{ padding: 10, background: '#2c63ff', color: 'white', borderRadius: 6 }}>
          Submit Vote
        </button>
      </form>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}

      <div style={{ marginTop: 24 }}>
        <a href="/results">See weekly results →</a>
      </div>
    </div>
  );
}
