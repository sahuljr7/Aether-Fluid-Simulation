import React from 'react';
import { FluidConfig } from '../gl/fluid';

interface ControlsProps {
  config: FluidConfig;
  setConfig: (config: FluidConfig) => void;
  interacted: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ config, setConfig, interacted }) => {
  const updateConfig = (key: keyof FluidConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between p-6 md:p-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] overflow-hidden">
      {/* Top Label */}
      <div className="pt-[env(safe-area-inset-top,0px)] flex flex-col items-center">
        <span 
          className={`font-mono font-semibold text-[10px] md:text-[11px] leading-none tracking-[5px] md:tracking-[7px] uppercase text-white/20 transition-opacity duration-[2000ms] ${interacted ? 'opacity-0' : 'opacity-100'}`}
        >
          fluid &nbsp;/&nbsp; webgl2
        </span>
      </div>

      {/* Middle Hint */}
      <div className="flex flex-col items-center text-center px-6">
        <span 
          className={`font-mono font-light text-[9px] md:text-[10px] leading-none tracking-[3px] md:tracking-[5px] uppercase text-white/25 transition-opacity duration-[2000ms] ${interacted ? 'opacity-0' : 'opacity-100'}`}
        >
          drag &middot; touch &middot; paint
        </span>
      </div>

      {/* Bottom HUD */}
      <div className="w-full flex flex-col-reverse md:flex-row items-center md:items-end justify-between gap-5 md:gap-6 pointer-events-none">
        {/* Footer Credit */}
        <div className="flex flex-col items-center md:items-start py-2">
          <span className="font-mono text-[10px] md:text-[11px] tracking-[3px] uppercase text-white/25">
            build with ♡ by Sahul
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-3 pointer-events-auto">
          <button 
            className="btn-minimal px-6"
            onClick={() => window.location.reload()}
            aria-label="Reset simulation"
          >
            reset
          </button>
          <button 
            className="btn-minimal px-6 min-w-[100px]"
            onClick={() => updateConfig('PAUSED', !config.PAUSED)}
            aria-label={config.PAUSED ? 'Play simulation' : 'Pause simulation'}
          >
            {config.PAUSED ? 'play' : 'pause'}
          </button>
        </div>
      </div>
    </div>
  );
};
