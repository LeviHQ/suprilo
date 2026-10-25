"use client";

import * as React from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: "circle" | "heart" | "star";
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  opacity: number;
}

const COLORS = [
  "#FF4D6D", // brand pink
  "#FF9F1C", // brand orange
  "#8B5CF6", // brand purple
  "#FFD166", // brand yellow
  "#F472B6", // pink-400
  "#60A5FA", // sky-400
];

export function CelebrationConfetti({ active }: { active: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!active) return;

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const count = 38;

    // Emit from center with outwards burst
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      particles.push({
        id: i,
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        size: 5 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.5 ? "heart" : Math.random() > 0.5 ? "star" : "circle",
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const drawHeart = (c: CanvasRenderingContext2D, size: number) => {
      c.beginPath();
      const topCurveHeight = size * 0.3;
      c.moveTo(0, topCurveHeight);
      c.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      c.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.5, 0, size);
      c.bezierCurveTo(0, (size + topCurveHeight) / 1.5, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      c.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      c.closePath();
      c.fill();
    };

    const drawStar = (c: CanvasRenderingContext2D, r: number) => {
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        c.lineTo(
          Math.cos(((18 + i * 72) * Math.PI) / 180) * r,
          -Math.sin(((18 + i * 72) * Math.PI) / 180) * r
        );
        c.lineTo(
          Math.cos(((54 + i * 72) * Math.PI) / 180) * (r * 0.45),
          -Math.sin(((54 + i * 72) * Math.PI) / 180) * (r * 0.45)
        );
      }
      c.closePath();
      c.fill();
    };

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, rect.width, rect.height);

      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09; // soft gravity
        p.vx *= 0.985; // air drag
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - elapsed / 1.8);

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === "heart") {
            drawHeart(ctx, p.size);
          } else if (p.shape === "star") {
            drawStar(ctx, p.size * 0.7);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      if (alive && elapsed < 2.2) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30 w-full h-full"
      aria-hidden="true"
    />
  );
}
