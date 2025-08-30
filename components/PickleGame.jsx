// components/PickleGame.jsx
import { useEffect, useRef, useState } from 'react';

export default function PickleGame() {
  const canvasRef = useRef(null);
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pp_name') || '';
    return '';
  });
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Endless mode: keep the rally going!');

  // WebAudio for subtle click on paddle hits
  const audioCtxRef = useRef(null);
  const ensureAudio = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AC();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      /* ignore */
    }
  };
  const hitSound = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      /* ignore */
    }
  };

  // Persist player name so game picks it up next time
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('pp_name', name);
  }, [name]);

  // Prevent page scrolling while the game is running (arrow keys & touch)
  useEffect(() => {
    if (!running) return;

    const preventKeyScroll = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', preventKeyScroll, { passive: false });

    // Disable page scroll completely while playing
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', preventKeyScroll);
      document.body.style.overflow = prevOverflow;
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Dimensions
    const W = canvas.width;
    const H = canvas.height;

    // Paddle settings
    const paddleH = 70;
    const paddleW = 10;
    let playerY = H / 2 - paddleH / 2;
    let cpuY = H / 2 - paddleH / 2;

    // Ball
    let x = W / 2, y = H / 2;
    let vx = 4, vy = 2.2;
    let speedUpEvery = 4; // every 4 rallies, speed up a bit

    // Game state
    let rallies = 0;
    let raf = 0;
    let pointerY = playerY;

    // Mouse / touch control (no page scroll because canvas has touch-action: none)
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      pointerY = cy - paddleH / 2;
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });

    // Keyboard control (block default scrolling too)
    const onKey = (e) => {
      const step = 16;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        pointerY -= step;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        pointerY += step;
      } else if (e.key === 'w') {
        pointerY -= step;
      } else if (e.key === 's') {
        pointerY += step;
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });

    const drawCourt = () => {
      ctx.fillStyle = '#081725';
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.strokeStyle = '#1e3a52';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const step = () => {
      // update paddles
      playerY += (pointerY - playerY) * 0.2;
      playerY = Math.max(0, Math.min(H - paddleH, playerY));

      // CPU follows ball with slight delay
      const targetCpu = y - paddleH / 2;
      cpuY += (targetCpu - cpuY) * 0.12;
      cpuY = Math.max(0, Math.min(H - paddleH, cpuY));

      // update ball
      x += vx;
      y += vy;

      // walls
      if (y < 0) { y = 0; vy *= -1; }
      if (y > H) { y = H; vy *= -1; }

      // left paddle (player)
      if (x < 20 + paddleW && x > 20) {
        if (y > playerY && y < playerY + paddleH) {
          x = 20 + paddleW;
          vx *= -1;
          // add a little angle based on hit point
          const offset = (y - (playerY + paddleH / 2)) / (paddleH / 2);
          vy += offset * 2.0;
          rallies += 1;
          if (rallies % speedUpEvery === 0) {
            vx *= 1.08; vy *= 1.06;
          }
          setScore(rallies);
          hitSound(); // <- play subtle click on hit
        }
      }

      // right paddle (cpu)
      if (x > W - 20 - paddleW && x < W - 20) {
        if (y > cpuY && y < cpuY + paddleH) {
          x = W - 20 - paddleW;
          vx *= -1;
          const offset = (y - (cpuY + paddleH / 2)) / (paddleH / 2);
          vy += offset * 1.8;
          hitSound(); // <- click on CPU hit too
        }
      }

      // Missed (player loses on first miss)
      if (x < -30) {
        gameOver();
        return;
      }
      // Keep ball in play on CPU side
      if (x > W + 30) vx *= -1;

      // draw
      drawCourt();

      // paddles
      ctx.fillStyle = '#7fd6ff';
      ctx.fillRect(20, playerY, paddleW, paddleH);
      ctx.fillStyle = '#33cc66';
      ctx.fillRect(W - 20 - paddleW, cpuY, paddleW, paddleH);

      // ball
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      // score
      ctx.fillStyle = '#cfeaff';
      ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillText(`Rallies: ${rallies}`, 12, 18);

      raf = requestAnimationFrame(step);
    };

    const gameOver = async () => {
      cancelAnimationFrame(raf);
      setRunning(false);
      setMessage('Missed! Score submitted.');
      try {
        if (name) {
          await fetch('/api/game/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              score: rallies,
              rallies
            })
          });
        }
      } catch {
        /* ignore */
      }
    };

    // init
    setScore(0);
    setMessage('Good luck!');
    // Start/resume audio context on start (user gesture was Play button)
    ensureAudio();
    // Render first frame, then loop
    const ctx2 = ctx; // satisfy lints
    (function first() {
      // first paint so canvas isn't blank before RAF starts
      ctx2.fillStyle = '#081725';
      ctx2.fillRect(0, 0, W, H);
    })();
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [running, name]);

  return (
    <div className="pg-card">
      <div className="pg-row">
        <strong>Mini Game — Endless Rally</strong>
        <span className="pg-flex" />
        <label className="pg-name">
          Name:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
          />
        </label>
        <button
          className="pg-btn"
          onClick={() => {
            ensureAudio();
            setRunning(r => !r);
          }}
          disabled={!name.trim()}
          title={name.trim() ? '' : 'Enter your name to play'}
        >
          {running ? 'Stop' : 'Play'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={560}
        height={300}
        className="pg-canvas"
      />
      <div className="pg-footer">
        <span>Score (rallies): <b>{score}</b></span>
        <span className="pg-msg">{message}</span>
      </div>

      <style jsx>{`
        .pg-card { margin-top: 18px; padding: 14px; border: 1px solid #14314a; border-radius: 12px; background:#0f2236; color:#eaf6ff; }
        .pg-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .pg-flex { flex:1; }
        .pg-name { display:flex; align-items:center; gap:6px; font-size:14px; opacity:.95; }
        .pg-name input { height:30px; padding:6px 10px; border-radius:8px; border:1px solid #244b6b; background:#0b1b2a; color:#eaf6ff; width:160px; }
        .pg-btn { background:linear-gradient(135deg,#33cc66,#00b3ff); border:none; color:#03121d; font-weight:800; padding:8px 12px; border-radius:8px; cursor:pointer; }
        .pg-canvas { width:100%; max-width:560px; display:block; margin:8px auto 6px; border-radius:10px; background:#081725; touch-action: none; }
        .pg-footer { display:flex; justify-content:space-between; font-size:13px; opacity:.9; }
        .pg-msg { opacity:.85; }
      `}</style>
    </div>
  );
}
