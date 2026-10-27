// Web Audio API synthesizer for Suprilo scratch card interactions.
// Fully self-contained: zero external audio assets, zero network latency, zero license issues.

class SoundManager {
  private ctx: AudioContext | null = null;
  private scratchGain: GainNode | null = null;
  private scratchFilter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private isScratching = false;
  private isMuted = false;

  constructor() {
    // Sound is enabled by default, user can toggle mute
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("suprilo_sound_muted");
      if (saved !== null) {
        this.isMuted = saved === "true";
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("suprilo_sound_muted", String(muted));
    }
    if (muted) {
      this.stopScratch();
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Generates a soft, rubbing/paper texture while scratching.
   */
  public startScratch(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.isScratching) return;
    this.isScratching = true;

    try {
      // 1-second looping pink/brownish noise buffer for smooth rubbing sound
      const bufferSize = ctx.sampleRate * 1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Soft low-frequency pink/brown filter for realistic paper texture
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      // Bandpass filter to isolate the paper/foil rubbing frequencies
      this.scratchFilter = ctx.createBiquadFilter();
      this.scratchFilter.type = "bandpass";
      this.scratchFilter.frequency.setValueAtTime(1400, ctx.currentTime);
      this.scratchFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      this.scratchGain = ctx.createGain();
      this.scratchGain.gain.setValueAtTime(0.001, ctx.currentTime);
      // Gentle fade in
      this.scratchGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.04);

      this.noiseNode.connect(this.scratchFilter);
      this.scratchFilter.connect(this.scratchGain);
      this.scratchGain.connect(ctx.destination);

      this.noiseNode.start();
    } catch {
      this.isScratching = false;
    }
  }

  /**
   * Modulate pitch/gain slightly during active stroke movement.
   */
  public pulseScratch(): void {
    if (this.isMuted || !this.isScratching || !this.ctx || !this.scratchGain) {
      this.startScratch();
      return;
    }

    try {
      const now = this.ctx.currentTime;
      // Slight variation in frequency for organic tactile feel
      if (this.scratchFilter) {
        const targetFreq = 1200 + Math.random() * 500;
        this.scratchFilter.frequency.cancelScheduledValues(now);
        this.scratchFilter.frequency.linearRampToValueAtTime(targetFreq, now + 0.05);
      }
      this.scratchGain.gain.cancelScheduledValues(now);
      this.scratchGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    } catch {}
  }

  /**
   * Immediately fade out and stop the scratch noise.
   */
  public stopScratch(): void {
    if (!this.isScratching) return;
    this.isScratching = false;

    if (this.ctx && this.scratchGain) {
      try {
        const now = this.ctx.currentTime;
        this.scratchGain.gain.cancelScheduledValues(now);
        this.scratchGain.gain.linearRampToValueAtTime(0.001, now + 0.05);

        const node = this.noiseNode;
        setTimeout(() => {
          try {
            node?.stop();
            node?.disconnect();
          } catch {}
        }, 60);
      } catch {}
    }

    this.noiseNode = null;
    this.scratchGain = null;
    this.scratchFilter = null;
  }

  /**
   * Celebratory sparkle chime when the card reaches the reveal threshold.
   */
  public playRevealChime(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.stopScratch();

    try {
      const now = ctx.currentTime;
      // Arpeggiated cheerful major pentatonic notes (E5, G#5, B5, E6, G#6)
      const freqs = [659.25, 830.61, 987.77, 1318.51, 1661.22];

      freqs.forEach((freq, idx) => {
        const noteTime = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        noteGain.gain.setValueAtTime(0.001, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.12, noteTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } catch {}
  }

  // Cached lightweight noise buffer for zero main-thread lag
  private cachedWindBuffer: AudioBuffer | null = null;

  /**
   * Soft, organic wind breeze sound for cloud parting (lightweight, zero main-thread lag).
   */
  public playWindBreeze(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 1.4;

      // Create or reuse a tiny 0.4s noise buffer (minimal memory & CPU)
      if (!this.cachedWindBuffer) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.4);
        this.cachedWindBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.cachedWindBuffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.05 * white) / 1.05;
          data[i] = last * 2.2;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = this.cachedWindBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(750, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(280, now + duration);
      filter.Q.setValueAtTime(1.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {}
  }

  /**
   * Cartoon vintage airplane propeller sound that glides in and softens (lightweight, zero lag).
   */
  public playAirplaneEngine(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 2.0;

      // Pure low-frequency warm oscillators (zero CPU impact)
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(85, now + duration);

      // Warm lowpass filter to produce cartoon motor purr
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  /**
   * Sparkly magical chime for the balloon options arriving.
   */
  public playBalloonArrival(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        noteGain.gain.setValueAtTime(0.001, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.5);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.55);
      });
    } catch {}
  }
}

export const soundManager = new SoundManager();
