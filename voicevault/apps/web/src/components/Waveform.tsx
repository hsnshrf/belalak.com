"use client";

import { useEffect, useRef } from "react";

/** Scrolling live level meter fed by RecordingSession.onLevel. */
export function Waveform({ level, running }: { level: number; running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<number[]>([]);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let lastPush = 0;

    const draw = (ts: number) => {
      if (ts - lastPush > 50) {
        levelsRef.current.push(levelRef.current);
        if (levelsRef.current.length > 200) levelsRef.current.shift();
        lastPush = ts;
      }
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const bars = levelsRef.current;
      const barWidth = width / 200;
      ctx.fillStyle = "#e4574d";
      bars.forEach((lvl, i) => {
        const h = Math.max(2, lvl * height);
        ctx.fillRect(i * barWidth, (height - h) / 2, Math.max(1, barWidth - 1), h);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return <canvas ref={canvasRef} className="waveform" width={800} height={96} />;
}
