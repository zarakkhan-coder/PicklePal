// components/GamePanel.jsx
import PickleGame from './PickleGame';
import Leaderboard from './Leaderboard';

export default function GamePanel() {
  return (
    <div className="gp-wrap">
      <PickleGame />
      <Leaderboard />
      <style jsx>{`
        .gp-wrap { margin-top: 16px; }
      `}</style>
    </div>
  );
}
