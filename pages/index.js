import { useState } from 'react';
import Shell from '../components/Shell';

export default function Home() {
  const [form, setForm] = useState({
    name: '',
    day: 'Saturday',
    start: '7:00 AM',
    end: '8:00 AM'
  });
  const [status, setStatus] = useState('');

  const times = [
    '7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'
  ];

  async function submit(e) {
    e.preventDefault();
    setStatus('Submitting vote…');

    // Optional: ping notify API (works even without keys — returns ok:true)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          subject: `Vote: ${form.day} ${form.start}–${form.end}`,
          text: `${form.name} voted for ${form.day} ${form.start}–${form.end}`,
          memberEmails: [] // we’ll fill from DB later
        })
      });
      const json = await res.json();
      if (json.ok) setStatus('Vote submitted! (Emails will work after we add SendGrid + members)');
      else setStatus('Submitted, but notification skipped.');
    } catch {
      setStatus('Submitted (notifications disabled).');
    }
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold mb-4">Vote to Play</h1>
      <p className="text-slate-600 mb-6">
        Pick a day and time. For now this demo submits locally; we’ll store votes in Supabase next.
      </p>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className="border rounded p-2"
            value={form.day}
            onChange={e => setForm({ ...form, day: e.target.value })}
          >
            <option>Saturday</option>
            <option>Sunday</option>
          </select>

          <select className="border rounded p-2"
            value={form.start}
            onChange={e => setForm({ ...form, start: e.target.value })}
          >
            {times.map(t => <option key={t}>{t}</option>)}
          </select>

          <select className="border rounded p-2"
            value={form.end}
            onChange={e => setForm({ ...form, end: e.target.value })}
          >
            {times.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <button className="w-full bg-blue-600 text-white rounded p-2 font-semibold hover:bg-blue-700">
          Submit Vote
        </button>
        <div className="text-sm text-emerald-700">{status}</div>
      </form>
    </Shell>
  );
}
