import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { FluidSimulation, FluidConfig } from '../gl/fluid';
import { sound } from '../services/sound';

interface FluidCanvasProps {
  config: FluidConfig;
  onFpsUpdate?: (fps: number) => void;
  onInteraction?: () => void;
  onManualSplat?: (x: number, y: number) => void;
}

export interface FluidCanvasHandle {
  screenshot: () => void;
  getActiveCount: () => number;
  triggerFeedbackSplat: () => void;
  reset: () => void;
}

const PALETTES = [
  { name: 'Cycle', colors: null },
  { name: 'Azure', colors: [[0.0, 0.4, 0.8], [0.1, 0.6, 0.9], [0.0, 0.2, 0.6]] },
  { name: 'Magma', colors: [[0.8, 0.2, 0.0], [0.9, 0.4, 0.1], [0.6, 0.1, 0.0]] },
  { name: 'Forest', colors: [[0.1, 0.6, 0.2], [0.2, 0.8, 0.4], [0.0, 0.4, 0.1]] },
  { name: 'Cyber', colors: [[0.8, 0.0, 0.8], [0.4, 0.0, 0.9], [0.0, 0.8, 0.9]] },
];

export const FluidCanvas = forwardRef<FluidCanvasHandle, FluidCanvasProps>(({ config, onFpsUpdate, onInteraction, onManualSplat }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FluidSimulation | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastAutoRef = useRef<number>(0);
  const hueRef = useRef<number>(Math.random());
  const [activePaletteIdx, setActivePaletteIdx] = useState(0);
  
  const ptrsRef = useRef<Map<number, { x: number; y: number; color: [number, number, number] }>>(new Map());

  useImperativeHandle(ref, () => ({
    screenshot: () => simRef.current?.screenshot(),
    getActiveCount: () => simRef.current?.getActiveCount() || 0,
    triggerFeedbackSplat: () => {
      if (!simRef.current || !canvasRef.current) return;
      sound.playSplat();
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      simRef.current.splat(w / 2, h / 2, 0, 0, getNextColor(0.8));
    },
    reset: () => {
      if (!simRef.current) return;
      simRef.current.reset();
      triggerInitialSplash();
    }
  }));

  const triggerInitialSplash = () => {
    if (!simRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const sim = simRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.22;
    const ga = 137.508 * (Math.PI / 180);
    
    sound.playSplat();

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
    lastAutoRef.current = performance.now();
  };

  const getNextColor = (scale = 0.38): [number, number, number] => {
    const palette = PALETTES[activePaletteIdx];
    if (palette.colors) {
      const c = palette.colors[Math.floor(Math.random() * palette.colors.length)];
      return [c[0] * scale * 2.5, c[1] * scale * 2.5, c[2] * scale * 2.5];
    }

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

    const splashTimeout = setTimeout(triggerInitialSplash, 200);

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
    <div className="fixed inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      
      {/* Floating Color Palette */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        {PALETTES.map((p, idx) => (
          <button
            key={p.name}
            id={`palette-btn-${p.name.toLowerCase()}`}
            onClick={() => setActivePaletteIdx(idx)}
            className={`group relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-500 ${
              activePaletteIdx === idx 
                ? 'border-white bg-white/10 scale-110' 
                : 'border-white/10 bg-black/20 hover:border-white/30'
            }`}
            title={p.name}
          >
            <div 
              className={`w-3 h-3 rounded-full transition-transform duration-500 ${activePaletteIdx === idx ? 'scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'scale-100'}`}
              style={{ 
                background: p.colors 
                  ? `linear-gradient(45deg, rgb(${p.colors[0][0]*255},${p.colors[0][1]*255},${p.colors[0][2]*255}), rgb(${p.colors[1][0]*255},${p.colors[1][1]*255},${p.colors[1][2]*255}))` 
                  : 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)' 
              }}
            />
            {/* Label on hover */}
            <span className="absolute right-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono text-[9px] tracking-widest uppercase text-white/40 whitespace-nowrap">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
