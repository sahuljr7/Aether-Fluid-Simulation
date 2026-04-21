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
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Deep, soothing frequency
    const freq = 60 + Math.random() * 40;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.8);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.6);
  }

  public playSlide(velocity: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Only play if there is significant movement
    if (velocity < 0.01) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    const baseFreq = 200 + Math.random() * 100;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq + velocity * 500, this.ctx.currentTime + 0.1);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05 * Math.min(velocity * 10, 1), this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

export const sound = new SoundEngine();
