// components/Leaderboard.jsx
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/game/leaderboard');
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    } catch (e) {
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

  return (
    <div className="lb-card">
      <div className="lb-head">
        <strong>Weekly Game Leaderboard</strong>
        <small>(top scores this week)</small>
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
        .lb-head { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
        .lb-table { width:100%; border-collapse:collapse; font-size:14px; }
        .lb-table th, .lb-table td { padding:8px 10px; border-bottom:1px solid #173754; }
        .lb-table th { text-align:left; color:#bfe4ff; }
        .lb-empty { padding:12px; opacity:.85; }
      `}</style>
    </div>
  );
}
