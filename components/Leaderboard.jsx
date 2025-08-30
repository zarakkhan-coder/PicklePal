// components/Leaderboard.jsx
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/game/leaderboard', { cache: 'no-store' });
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function resetAllScores() {
    const sure = confirm('Reset ALL mini-game scores? This cannot be undone.');
    if (!sure) return;
    const pin = prompt('Enter admin PIN to confirm:');
    if (!pin) return;

    try {
      const r = await fetch('/api/game/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const j = await r.json();
      if (!j.ok) {
        alert(j.error || 'Failed to reset');
        return;
      }
      alert(`Deleted ${j.deleted} score(s).`);
      load();
    } catch {
      alert('Failed to reset');
    }
  }

  return (
    <div className="lb-card">
      <div className="lb-top">
        <div className="lb-head">
          <strong>Weekly Game Leaderboard</strong>
          <small>(top scores this week)</small>
        </div>
        {/* Admin-only: visible to everyone, but requires PIN to execute */}
        <button className="lb-admin-btn" onClick={resetAllScores} title="Admin only">
          Reset all scores (admin)
        </button>
      </div>

      {loading ? (
        <div className="lb-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="lb-empty">No scores yet — be the first!</div>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Top Score</th>
              <th>Top Rallies</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.top_score}</td>
                <td>{r.top_rallies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .lb-card { margin-top: 12px; padding: 12px; border: 1px solid #14314a; border-radius: 12px; background:#0f2236; color:#eaf6ff; }
        .lb-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .lb-head { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
        .lb-table { width:100%; border-collapse:collapse; font-size:14px; }
        .lb-table th, .lb-table td { padding:8px 10px; border-bottom:1px solid #173754; }
        .lb-table th { text-align:left; color:#bfe4ff; }
        .lb-empty { padding:12px; opacity:.85; }
        .lb-admin-btn {
          background:#2a1a1a; border:1px solid #7a2a2a; color:#ffd6d6;
          padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px;
        }
        .lb-admin-btn:hover { filter:brightness(1.05); }
      `}</style>
    </div>
  );
}
