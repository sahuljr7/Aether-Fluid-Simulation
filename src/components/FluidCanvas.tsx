import React, { useEffect, useRef } from 'react';
import { FluidSimulation, FluidConfig } from '../gl/fluid';
import { sound } from '../services/sound';

interface FluidCanvasProps {
  config: FluidConfig;
  onFpsUpdate?: (fps: number) => void;
  onInteraction?: () => void;
}

export const FluidCanvas: React.FC<FluidCanvasProps> = ({ config, onFpsUpdate, onInteraction }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FluidSimulation | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastAutoRef = useRef<number>(0);
  const hueRef = useRef<number>(Math.random());
  
  const ptrsRef = useRef<Map<number, { x: number; y: number; color: [number, number, number] }>>(new Map());

  const getNextColor = (scale = 0.38): [number, number, number] => {
    hueRef.current = (hueRef.current + 0.618033988749895) % 1.0;
    const h6 = hueRef.current * 6;
    const i = Math.floor(h6);
    const f = h6 - i;
    const q = 1 - f, t = f;
    let r, g, b;
    switch (i % 6) {
      case 0: r=1, g=t, b=0; break;
      case 1: r=q, g=1, b=0; break;
      case 2: r=0, g=1, b=t; break;
      case 3: r=0, g=q, b=1; break;
      case 4: r=t, g=0, b=1; break;
      default: r=1, g=0, b=q;
    }
    return [r * scale, g * scale, b * scale];
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const sim = new FluidSimulation(canvas, config);
    simRef.current = sim;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      sim.resize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const autoSplat = (scale = 0.3) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const x = Math.random() * w;
      const y = Math.random() * h;
      const a = Math.random() * Math.PI * 2;
      const f = config.SPLAT_FORCE * (0.4 + Math.random() * 0.6);
      sim.splat(x, y, Math.cos(a) * f, Math.sin(a) * f, getNextColor(scale));
    };

    const initialSplash = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.22;
      const ga = 137.508 * (Math.PI / 180);
      for (let i = 0; i < 10; i++) {
        const angle = i * ga;
        const radius = Math.sqrt(i + 1) * r * 0.35;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const speed = config.SPLAT_FORCE * 0.45;
        const vx = Math.cos(angle + Math.PI * 0.5) * speed;
        const vy = Math.sin(angle + Math.PI * 0.5) * speed;
        sim.splat(x, y, vx, vy, getNextColor(0.38));
      }
    };

    const splashTimeout = setTimeout(initialSplash, 200);

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.0167);
      lastTimeRef.current = time;

      if (onFpsUpdate && time % 500 < 20) {
        onFpsUpdate(Math.round(1 / dt));
      }

      const AUTO_MS = 3800;
      if (time - lastAutoRef.current > AUTO_MS) {
        autoSplat();
        lastAutoRef.current = time;
      }

      sim.step(dt);
      sim.render();

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      clearTimeout(splashTimeout);
    };
  }, []);

  useEffect(() => {
    if (simRef.current) {
      simRef.current.config = config;
    }
  }, [config]);

  const handlePointerDown = (e: React.PointerEvent) => {
    onInteraction?.();
    sound.playSplat();
    const color = getNextColor(0.35);
    ptrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY, color });
    simRef.current?.splat(e.clientX, e.clientY, 0, 0, color);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const p = ptrsRef.current.get(e.pointerId);
    if (!p || !simRef.current) return;
    const dx = (e.clientX - p.x) / canvasRef.current!.clientWidth * config.SPLAT_FORCE;
    const dy = (e.clientY - p.y) / canvasRef.current!.clientHeight * config.SPLAT_FORCE;
    
    // Play subtle movement sound
    const velocity = Math.sqrt(dx * dx + dy * dy) / config.SPLAT_FORCE;
    sound.playSlide(velocity);

    simRef.current.splat(e.clientX, e.clientY, dx, dy, p.color);
    p.x = e.clientX; p.y = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    ptrsRef.current.delete(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-black touch-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
