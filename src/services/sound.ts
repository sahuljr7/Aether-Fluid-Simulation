/**
 * Soothing Procedural Audio Engine
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15; // Global volume
    this.masterGain.connect(this.ctx.destination);
  }

  public playSplat() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const freq = 55 + Math.random() * 20;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 1.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(freq * 0.1, this.ctx.currentTime + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 1.0);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 1.5);
    osc2.stop(this.ctx.currentTime + 1.5);
  }

  public playSlide(velocity: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (velocity < 0.005) return;

    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const noiseFilter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    
    // Create subtle noise for liquid texture
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;

    noiseFilter.type = 'bandpass';
    const filterFreq = 800 + velocity * 4000;
    noiseFilter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    noiseFilter.Q.value = 12;

    osc.type = 'sine';
    // Harmonic snapping for a more "musical" slide
    const baseFreq = 110 * Math.pow(1.059, Math.floor(Math.random() * 24)); 
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + velocity * 600, this.ctx.currentTime + 0.2);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08 * Math.min(velocity * 8, 1), this.ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(g);
    noise.connect(noiseFilter);
    noiseFilter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.45);
    noise.stop(this.ctx.currentTime + 0.45);
  }
}

export const sound = new SoundEngine();
