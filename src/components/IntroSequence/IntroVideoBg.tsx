import { useEffect, useRef } from "react";
import { INTRO_COLORS, INTRO_MEDIA } from "./intro.constants";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Fade the whole layer out during the Scene 5 handoff. */
  fadedOut: boolean;
  /** Show the particle canvas instead of the video (autoplay blocked / error). */
  fallback: boolean;
  onVideoFailure: () => void;
};

/** High-DPI aware ambient particle field used when the video cannot play. */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      r: 0.6 + Math.random() * 1.6,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      // neural connections
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(111, 195, 192, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(155, 231, 214, 0.7)";
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

export function IntroVideoBg({ videoRef, fadedOut, fallback, onVideoFailure }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-[1400ms] ease-out"
      style={{ backgroundColor: INTRO_COLORS.atmosphere, opacity: fadedOut ? 0 : 1 }}
    >
      {fallback ? (
        <ParticleCanvas />
      ) : (
        <video
          ref={videoRef}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          onError={onVideoFailure}
        >
          <source src={INTRO_MEDIA.videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Contrast overlay */}
      <div className="absolute inset-0 z-10 bg-[#050505]/30" />
      {/* Ambient centre glow */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(111,195,192,0.16) 0%, rgba(5,5,5,0) 70%)",
        }}
      />
    </div>
  );
}