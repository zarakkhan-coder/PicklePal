import { useEffect, useState } from 'react';
import Shell from '../components/Shell';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [form, setForm] = useState({
    name: '',
    day: 'Saturday',
    start: '7:00 AM',
    end: '8:00 AM'
  });
  const [status, setStatus] = useState('');
  const [votes, setVotes] = useState([]);

  const times = [
    '7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'
  ];

  // Load existing votes + subscribe to realtime
  useEffect(() => {
    if (!supabase) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) setVotes(data);
    };
    load();

    const channel = supabase
      .channel('votes-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVotes(v => [payload.new, ...v]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus('Submitting vote…');

    try {
      // 1) Save in Supabase
      if (supabase) {
        const { error } = await supabase.from('votes').insert([{
          name: form.name,
          day: form.day,
          start_time: form.start,
          end_time: form.end
        }]);
        if (error) throw error;
      }

      // 2) Optional notify (works once SendGrid/members added)
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          subject: `Vote: ${form.day} ${form.start}–${form.end}`,
          text: `${form.name} voted for ${form.day} ${form.start}–${form.end}`,
          memberEmails: []
        })
      }).catch(() => {});

      setStatus('Vote submitted!');
    } catch (err) {
      setStatus('Saved locally (DB not configured?)');
    }
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold mb-4">Vote to Play</h1>
      <p className="text-slate-600 mb-6">
        Pick a day and time. <b>Results update live.</b>
      </p>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 space-y-4 mb-8">
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

      <h2 className="text-xl font-semibold mb-2">Latest votes</h2>
      <div className="bg-white rounded-xl shadow">
        {votes.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No votes yet.</div>
        ) : votes.map(v => (
          <div key={v.id} className="p-3 border-b text-sm">
            <b>{v.name}</b> → {v.day} {v.start_time}–{v.end_time}
          </div>
        ))}
      </div>
    </Shell>
  );
}
