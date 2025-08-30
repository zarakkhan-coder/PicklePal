import { useEffect, useRef, useState } from "react";

/**
 * MiniGame — Endless Rally (touch + sound + arrow-key scroll guard)
 * - Mobile: drag finger on the board to move your paddle
 * - Desktop: Arrow ↑ / ↓
 * - Sound on paddle hits
 * - Page will not scroll while playing
 */
export default function MiniGame() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const hitSound = useRef(null);

  // very short click so we don't need an external asset
  useEffect(() => {
    hitSound.current = new Audio(
      // tiny PCM click (base64 data URI)
      "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YSAAAAAAAP8A/wD/AP8A/wD/AP8A/wD/APw=="
    );
    hitSound.current.volume = 0.35;
  }, []);

  useEffect(() => {
    if (!running) return;

    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");

    // logical size
    const W = 600;
    const H = 300;
    // scale for crispness on high-DPR screens
    const DPR = window.devicePixelRatio || 1;
    cvs.width = W * DPR;
    cvs.height = H * DPR;
    cvs.style.width = "100%";
    cvs.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // game state
    const PADDLE_W = 8;
    const PADDLE_H = 60;
    const PADDING = 10;
    const BALL_R = 6;

    let playerY = H / 2 - PADDLE_H / 2;
    let playerDY = 0;

    let aiY = H / 2 - PADDLE_H / 2;

    let ballX = W / 2;
    let ballY = H / 2;
    let ballVX = 4; // horizontal velocity
    let ballVY = 3; // vertical velocity

    let raf;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    // ----- Controls: keyboard -----
    const onKey = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault(); // stop page from scrolling with arrows
      }
      if (e.type === "keydown") {
        if (e.key === "ArrowUp") playerDY = -7;
        if (e.key === "ArrowDown") playerDY = 7;
      } else {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") playerDY = 0;
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    window.addEventListener("keyup", onKey, { passive: false });

    // ----- Controls: touch (drag finger on the board) -----
    const onTouch = (ev) => {
      const t = ev.touches[0];
      const rect = cvs.getBoundingClientRect();
      const yTouch = t.clientY - rect.top;
      playerY = clamp(yTouch - PADDLE_H / 2, 0, H - PADDLE_H);
      ev.preventDefault(); // keep the page from moving
    };
    cvs.addEventListener("touchstart", onTouch, { passive: false });
    cvs.addEventListener("touchmove", onTouch, { passive: false });

    // ----- Game loop -----
    const step = () => {
      // move player
      playerY = clamp(playerY + playerDY, 0, H - PADDLE_H);

      // simple AI: follow the ball with easing
      aiY += (ballY - (aiY + PADDLE_H / 2)) * 0.07;
      aiY = clamp(aiY, 0, H - PADDLE_H);

      // move ball
      ballX += ballVX;
      ballY += ballVY;

      // top/bottom wall
      if (ballY < BALL_R || ballY > H - BALL_R) {
        ballVY *= -1;
      }

      // player paddle collision
      if (
        ballX - BALL_R < PADDING + PADDLE_W &&
        ballY > playerY &&
        ballY < playerY + PADDLE_H
      ) {
        ballX = PADDING + PADDLE_W + BALL_R;
        ballVX = Math.abs(ballVX);
        setScore((s) => s + 1);
        hitSound.current && hitSound.current.play().catch(() => {});
      }

      // AI paddle collision
      const aiX = W - PADDING - PADDLE_W;
      if (ballX + BALL_R > aiX && ballY > aiY && ballY < aiY + PADDLE_H) {
        ballX = aiX - BALL_R;
        ballVX = -Math.abs(ballVX);
        hitSound.current && hitSound.current.play().catch(() => {});
      }

      // lose if ball goes behind player
      if (ballX + BALL_R < 0) {
        cancelAnimationFrame(raf);
        return setRunning(false);
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0b2236";
      ctx.fillRect(0, 0, W, H);

      // center dashed line
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#14314a";
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // paddles
      ctx.fillStyle = "#7fd6ff";
      ctx.fillRect(PADDING, playerY, PADDLE_W, PADDLE_H);
      ctx.fillStyle = "#ffda6b";
      ctx.fillRect(W - PADDING - PADDLE_W, aiY, PADDLE_W, PADDLE_H);

      // ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#33cc66";
      ctx.fill();

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    // cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      cvs.removeEventListener("touchstart", onTouch);
      cvs.removeEventListener("touchmove", onTouch);
    };
  }, [running]);

  return (
    <div className="game">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <strong>Mini Game — Endless Rally</strong>
        <span>Score: {score}</span>
      </div>

      <canvas ref={canvasRef} className="board" />

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <button
          className="pp-btn"
          onClick={() => {
            setScore(0);
            setRunning(true);
          }}
          style={{ width: 140 }}
        >
          {running ? "Restart" : "Play"}
        </button>
        {!running && <span>Tap Play to try again</span>}
      </div>
    </div>
  );
}
