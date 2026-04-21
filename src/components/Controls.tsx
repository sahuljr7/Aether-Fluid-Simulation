import React, { useState, useEffect } from 'react';
import { FluidConfig } from '../gl/fluid';
import { sound } from '../services/sound';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Camera, X, Waves, Volume2, Sparkles } from 'lucide-react';

interface ControlsProps {
  config: FluidConfig;
  setConfig: (config: FluidConfig) => void;
  interacted: boolean;
  onScreenshot: () => void;
  activePoints: number;
  onFeedbackSplat: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ config, setConfig, interacted, onScreenshot, activePoints, onFeedbackSplat }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeProfile, setActiveProfile] = useState(sound.getProfileName());

  const updateConfig = (key: keyof FluidConfig, value: any) => {
    setConfig({ ...config, [key]: value });
    if (key === 'SPLAT_FORCE') {
      onFeedbackSplat();
    }
  };

  const handleProfileChange = (profile: string) => {
    sound.setProfile(profile);
    setActiveProfile(profile);
    onFeedbackSplat();
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between p-6 md:p-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] overflow-hidden">
      {/* Top Label & Stats */}
      <div className="pt-[env(safe-area-inset-top,0px)] flex flex-col items-center gap-2">
        <span 
          className={`font-mono font-semibold text-[10px] md:text-[11px] leading-none tracking-[5px] md:tracking-[7px] uppercase text-white/20 transition-opacity duration-[2000ms] ${interacted ? 'opacity-0' : 'opacity-100'}`}
        >
          fluid &nbsp;/&nbsp; webgl2
        </span>
        <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest text-white/15 uppercase">
          <span>{activePoints.toLocaleString()} cells</span>
        </div>
      </div>

      {/* Middle Hint */}
      <div className="flex flex-col items-center text-center px-6">
        <span 
          className={`font-mono font-light text-[9px] md:text-[10px] leading-none tracking-[3px] md:tracking-[5px] uppercase text-white/25 transition-opacity duration-[2000ms] ${interacted ? 'opacity-0' : 'opacity-100'}`}
        >
          drag &middot; touch &middot; paint
        </span>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase text-white/40">Simulation</span>
              <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Sound Profiles */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9px] tracking-[2px] uppercase text-white/25">Sound Profiles</span>
              <div className="grid grid-cols-3 gap-2">
                {['Calm', 'Vibrant', 'Minimal'].map(p => (
                  <button
                    key={p}
                    onClick={() => handleProfileChange(p)}
                    className={`font-mono text-[10px] py-2 rounded-lg border transition-all ${
                      activeProfile === p 
                        ? 'border-white/40 bg-white/5 text-white' 
                        : 'border-white/5 text-white/30 hover:border-white/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 overflow-y-auto max-h-[35vh] pr-2 scrollbar-hide">
              {/* Trails Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-white/30" />
                  <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">Particle Trails</span>
                </div>
                <button 
                  onClick={() => updateConfig('TRAILS', !config.TRAILS)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${config.TRAILS ? 'bg-white/40' : 'bg-white/5'}`}
                >
                  <motion.div 
                    animate={{ x: config.TRAILS ? 16 : 2 }}
                    className="absolute top-1 w-2 h-2 bg-white rounded-full"
                  />
                </button>
              </div>

              {[
                { label: 'Viscosity', key: 'VELOCITY_DISSIPATION', min: 0.9, max: 1.0, step: 0.001 },
                { label: 'Dissipation', key: 'DENSITY_DISSIPATION', min: 0.9, max: 0.999, step: 0.001 },
                { label: 'Vorticity', key: 'CURL', min: 0, max: 50, step: 1 },
                { label: 'Bloom', key: 'BLOOM', min: 0, max: 10, step: 0.1 },
                { label: 'Force', key: 'SPLAT_FORCE', min: 1000, max: 12000, step: 100 },
                { label: 'Sim Res', key: 'SIM_RES', min: 32, max: 256, step: 32 },
                { label: 'Dye Res', key: 'DYE_RES', min: 256, max: 2048, step: 256 },
              ].map((item) => (
                <div key={item.key} className="flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-[10px] tracking-widest text-white/30 uppercase">
                    <span>{item.label}</span>
                    <span>{(config as any)[item.key]}</span>
                  </div>
                  <input 
                    type="range" 
                    min={item.min} 
                    max={item.max} 
                    step={item.step}
                    value={(config as any)[item.key]}
                    onChange={(e) => updateConfig(item.key as keyof FluidConfig, parseFloat(e.target.value))}
                    className="w-full bg-white/5 h-1 appearance-none rounded-full accent-white/40 hover:accent-white/60 transition-all"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom HUD */}
      <div className="w-full flex flex-col-reverse md:flex-row items-center md:items-end justify-between gap-5 md:gap-6 pointer-events-none">
        {/* Footer Credit */}
        <div className="flex flex-col items-center md:items-start py-2">
          <span className="font-mono text-[9px] md:text-[10px] tracking-[3px] uppercase text-white/40 hover:text-white/60 transition-colors duration-500 cursor-default">
            build with <span className="text-white/20">♡</span> by Sahul
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pointer-events-auto">
          <button 
            className="btn-minimal p-3"
            onClick={onScreenshot}
            aria-label="Capture screenshot"
          >
            <Camera size={18} className="opacity-60" />
          </button>
          
          <button 
            className="btn-minimal p-3"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Advanced settings"
          >
            <Settings size={18} className={`opacity-60 transition-transform duration-500 ${showSettings ? 'rotate-90' : ''}`} />
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
