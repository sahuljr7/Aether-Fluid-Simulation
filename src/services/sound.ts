/**
 * Soothing Procedural Audio Engine
 */
interface SoundProfile {
  name: string;
  splatVolume: number;
  slideVolume: number;
  decay: number;
  baseFreqScale: number;
  filterFreq: number;
}

const PROFILES: Record<string, SoundProfile> = {
  Calm: {
    name: 'Calm',
    splatVolume: 0.25,
    slideVolume: 0.05,
    decay: 1.8,
    baseFreqScale: 0.8,
    filterFreq: 400,
  },
  Vibrant: {
    name: 'Vibrant',
    splatVolume: 0.4,
    slideVolume: 0.12,
    decay: 1.2,
    baseFreqScale: 1.5,
    filterFreq: 1200,
  },
  Minimal: {
    name: 'Minimal',
    splatVolume: 0.15,
    slideVolume: 0.03,
    decay: 0.6,
    baseFreqScale: 0.5,
    filterFreq: 200,
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentProfile: SoundProfile = PROFILES.Calm;
  private noiseBuffer: AudioBuffer | null = null;
  private activeSlides = 0;
  private maxSlides = 12;

  constructor() {
    // Attempt to resume on any user interaction globally as a fallback
    const resume = () => {
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      window.removeEventListener('pointerdown', resume);
    };
    window.addEventListener('pointerdown', resume);
  }

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.15; // Global volume
      this.masterGain.connect(this.ctx.destination);
      
      // Pre-allocate noise buffer
      const bufferSize = this.ctx.sampleRate * 1.0;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {
      console.error('Audio initialization failed', e);
    }
  }

  public setProfile(name: string) {
    if (PROFILES[name]) {
      this.currentProfile = PROFILES[name];
    }
  }

  public getProfileName() {
    return this.currentProfile.name;
  }

  public playSplat() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const p = this.currentProfile;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const freq = (55 + Math.random() * 20) * p.baseFreqScale;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + p.decay * 0.8);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.2, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(freq * 0.1, this.ctx.currentTime + p.decay * 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(p.filterFreq * 3, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(p.filterFreq * 0.2, this.ctx.currentTime + p.decay * 0.6);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(p.splatVolume * 1.2, this.ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + p.decay);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + p.decay);
    osc2.stop(this.ctx.currentTime + p.decay);
  }

  public playSlide(velocity: number) {
    this.init();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Volume and velocity thresholds tuned for responsiveness
    if (velocity < 0.002) return;
    if (this.activeSlides >= this.maxSlides) return;

    this.activeSlides++;
    const p = this.currentProfile;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const noiseFilter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    noiseFilter.type = 'bandpass';
    const filterFreq = (p.filterFreq * 2.5) + velocity * 5000;
    noiseFilter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    noiseFilter.Q.value = 8;

    osc.type = 'sine';
    const baseFreq = 110 * Math.pow(1.059, Math.floor(Math.random() * 24)) * p.baseFreqScale; 
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + velocity * 800, this.ctx.currentTime + 0.3);

    // Dynamic gain based on velocity - boosted for clarity
    const slideVol = p.slideVolume * 2.2 * Math.min(velocity * 12, 1);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(slideVol, this.ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(g);
    noise.connect(noiseFilter);
    noiseFilter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    noise.start();
    
    osc.stop(this.ctx.currentTime + 0.6);
    noise.stop(this.ctx.currentTime + 0.6);
    
    setTimeout(() => {
      this.activeSlides = Math.max(0, this.activeSlides - 1);
    }, 150);
  }
}

export const sound = new SoundEngine();
