import { useState } from 'react';
import Shell from '../components/Shell';

export default function Admin() {
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('Loading…');
    const res = await fetch('/api/members', { headers: { 'x-admin-pin': pin } });
    const j = await res.json();
    if (j.ok) { setMembers(j.data); setAuthed(true); setMsg(''); }
    else setMsg(j.error || 'Wrong PIN');
  }

  async function addMember(e) {
    e.preventDefault();
    if (!email) return;
    setMsg('Saving…');
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ email, name })
    });
    const j = await res.json();
    if (j.ok) { setEmail(''); setName(''); setMsg('Added!'); load(); }
    else setMsg(j.error || 'Failed');
  }

  async function sendTest() {
    setMsg('Sending…');
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({
        subject: 'Pickle Pal test',
        text: 'This is a test from Pickle Pal.'
      })
    });
    const j = await res.json();
    setMsg(j.ok ? `Sent to ${j.count ?? 0} member(s)` : (j.error || 'Failed'));
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold mb-4">Admin</h1>

      {!authed ? (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <input
            className="border rounded p-2 w-full"
            placeholder="Enter admin PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
          />
          <button onClick={load} className="bg-blue-600 text-white rounded p-2">
            Enter
          </button>
          <div className="text-sm text-rose-600">{msg}</div>
        </div>
      ) : (
        <>
          <form onSubmit={addMember} className="bg-white rounded-xl shadow p-4 space-y-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border rounded p-2"
                placeholder="Name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className="border rounded p-2"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="bg-blue-600 text-white rounded p-2">Add member</button>
            <button type="button" onClick={sendTest}
                    className="ml-3 bg-slate-600 text-white rounded p-2">
              Send test email
            </button>
            <div className="text-sm text-emerald-700">{msg}</div>
          </form>

          <div className="bg-white rounded-xl shadow">
            {members.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No members yet.</div>
            ) : members.map(m => (
              <div key={m.id} className="p-3 border-b text-sm">
                {m.email}{m.name ? ` — ${m.name}` : ''}
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
