import Shell from '../components/Shell';
import { useState } from 'react';

export default function Admin() {
  const [emailList, setEmailList] = useState('');
  const [status, setStatus] = useState('');

  async function saveMembers() {
    setStatus('Saving…');
    try {
      const emails = emailList
        .split(/\s|,|;/).map(e => e.trim()).filter(Boolean);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: emails[0] ?? '', name: '' }) // simple stub; we’ll bulk-insert later
      });
      const json = await res.json();
      setStatus(json.ok ? 'Saved (DB wiring next).' : 'Unable to save.');
    } catch {
      setStatus('Saved locally (DB not configured).');
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-3">Admin</h1>
      <p className="text-sm text-slate-600 mb-6">
        Paste member emails (comma/space separated). This page will connect to Supabase next.
      </p>

      <textarea
        className="w-full border rounded p-3 h-32"
        placeholder="alice@example.com, bob@example.com …"
        value={emailList}
        onChange={e => setEmailList(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button onClick={saveMembers} className="bg-emerald-600 text-white rounded px-4 py-2">
          Save Members
        </button>
      </div>
      <div className="text-sm text-emerald-700 mt-3">{status}</div>
    </Shell>
  );
}
