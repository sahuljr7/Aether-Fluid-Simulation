/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { FluidCanvas, FluidCanvasHandle } from './components/FluidCanvas';
import { Controls } from './components/Controls';
import { DEFAULT_CONFIG, FluidConfig } from './gl/fluid';

export default function App() {
  const [config, setConfig] = useState<FluidConfig>(DEFAULT_CONFIG);
  const [interacted, setInteracted] = useState(false);
  const [activePoints, setActivePoints] = useState(0);
  const canvasRef = useRef<FluidCanvasHandle>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) {
        setActivePoints(canvasRef.current.getActiveCount());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#000] select-none flex">
      {/* Immersive GL Canvas */}
      <FluidCanvas 
        ref={canvasRef}
        config={config} 
        onInteraction={() => setInteracted(true)}
      />

      {/* Atmospheric Experience UI */}
      <Controls 
        config={config} 
        setConfig={setConfig} 
        interacted={interacted}
        onScreenshot={() => canvasRef.current?.screenshot()}
        onReset={() => canvasRef.current?.reset()}
        activePoints={activePoints}
        onFeedbackSplat={() => canvasRef.current?.triggerFeedbackSplat()}
      />
    </main>
  );
}
