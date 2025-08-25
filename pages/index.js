import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DAYS = ['Saturday', 'Sunday'];
const STARTS = ['7:00 AM', '8:00 AM', '9:00 AM'];
const ENDS = ['8:00 AM', '9:00 AM', '10:00 AM'];

export default function Home() {
  const [name, setName] = useState('');
  const [day, setDay] = useState('Saturday');
  const [startTime, setStartTime] = useState('7:00 AM');
  const [endTime, setEndTime] = useState('8:00 AM');
  const [message, setMessage] = useState('');
  const [votes, setVotes] = useState([]);

  // Load last 20 votes at first
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setVotes(data || []);
    };
    load();

    // Realtime subscription
    const sub = supabase
      .channel('public:votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        (payload) => {
          // prepend new record for live updates
          if (payload.eventType === 'INSERT') {
            setVotes((prev) => [payload.new, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting…');

    if (!name.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    try {
      const { error } = await supabase.from('votes').insert([
        {
          name: name.trim(),
          day,
          start_time: startTime,
          end_time: endTime,
        },
      ]);

      if (error) throw error;

      setMessage('Vote submitted!');
      // keep the form filled (or clear if you prefer)
      // setName('');
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b">
        <div className="mx-auto max-w-5xl py-4 px-4 flex items-center justify-between">
          <div className="text-lg font-bold">PicklePal</div>
          <a className="text-sm underline" href="/admin">VoteAdmin</a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <h1 className="text-3xl font-bold mt-6">Vote to Play</h1>
        <p className="text-gray-600 mt-2">
          Pick a day and time. <strong>Results update live.</strong>
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-white rounded-lg shadow p-4 border"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="border rounded px-3 py-2"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              className="border rounded px-3 py-2"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {STARTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {ENDS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded px-4 py-2"
          >
            Submit Vote
          </button>

          {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
        </form>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Latest votes</h2>
          <div className="mt-3 space-y-2">
            {votes.map((v) => (
              <div
                key={v.id}
                className="bg-white border rounded px-4 py-2 text-sm"
              >
                <strong>{v.name}</strong> → {v.day} {v.start_time}–{v.end_time}
              </div>
            ))}
            {!votes.length && (
              <div className="text-gray-500 text-sm">No votes yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
