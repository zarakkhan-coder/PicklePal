// components/Shell.js
import { useEffect, useRef } from 'react';

export default function Shell({ children }) {
  const s1 = useRef(null);
  const s2 = useRef(null);
  const s3 = useRef(null);
  const s4 = useRef(null);

  // simple float animation
  useEffect(() => {
    const els = [s1.current, s2.current, s3.current, s4.current].filter(Boolean);
    const timers = els.map((el, i) => {
      let t = 0;
      return setInterval(() => {
        t += 0.02;
        el.style.transform = `translateY(${Math.sin(t + i) * 8}px)`;
      }, 16);
    });
    return () => timers.forEach(clearInterval);
  }, []);

  return (
    <div className="pp-shell">
      {/* floating sprites */}
      <div ref={s1} className="sprite" style={{ left: 18, top: 120 }}>🏓</div>
      <div ref={s2} className="sprite" style={{ right: 28, top: 90 }}>🏓</div>
      <div ref={s3} className="sprite" style={{ left: 40, bottom: 140 }}>🟡</div>
      <div ref={s4} className="sprite" style={{ right: 48, bottom: 160 }}>🟡</div>

      {children}

      <style jsx>{`
        .pp-shell {
          min-height: 100vh;
          background:
            radial-gradient(1200px 700px at 0% -10%, #1b496533 0 60%, transparent 60%),
            radial-gradient(1200px 900px at 120% 0%, #12678233 0 60%, transparent 60%),
            linear-gradient(180deg, #071621, #071621);
          position: relative;
          overflow: hidden;
          padding: 40px 16px;
        }
        .sprite {
          position: fixed;
          font-size: 32px;
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.45));
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
