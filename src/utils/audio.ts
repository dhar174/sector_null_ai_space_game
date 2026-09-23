/**
 * Web Audio API synthesizer for sci-fi bridge sound effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a quick sci-fi tactical comm chirp
  public playCommsChirp(pitch: number = 800) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio playback failsafe
    }
  }

  // Quick crisp UI button click beep
  public playButtonBeep(pitch: number = 980) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.2, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Failsafe
    }
  }

  // Subtle ambient chime when crew member has a new idle topic available
  public playIdleChirp(officer: 'Jax' | 'Elara' = 'Elara') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Jax: warmer amber resonance (520Hz -> 650Hz); Elara: crystallised cyan chime (880Hz -> 1320Hz)
      const baseFreq = officer === 'Jax' ? 523.25 : 880;
      const secondFreq = officer === 'Jax' ? 659.25 : 1318.5;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(secondFreq, now + 0.1);

      // Gentle non-intrusive volume
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio playback failsafe
    }
  }

  // Incoming crew transmission sound (dual-tone)
  public playTransmissionIn(speaker: 'Jax' | 'Elara' | 'Ship AI' | 'Captain') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const f1 = speaker === 'Jax' ? 440 : speaker === 'Elara' ? 880 : 660;
      const f2 = speaker === 'Jax' ? 330 : speaker === 'Elara' ? 1100 : 550;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = speaker === 'Jax' ? 'sawtooth' : 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(f1, now);
      osc2.frequency.setValueAtTime(f2, now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.07);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.18);
    } catch {
      // Failsafe
    }
  }

  // Hull hit or asteroid collision impact sound
  public playImpact() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for explosion
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.3);

      // Low boom oscillator
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(90, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.25);
    } catch {
      // Failsafe
    }
  }

  // Science scan beam audio sweep
  public playScan() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.5);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Failsafe
    }
  }

  // Active radar sensor ping sound with acoustic decay and harmonic resonance
  public playRadarPing(isHighAlert: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = isHighAlert ? 1520 : 1180;

      // Primary tone
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.55);

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.58);

      // Sub-harmonic resonant chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 0.5, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, now + 0.7);

      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.72);
    } catch {
      // Failsafe
    }
  }

  // Thruster throttle change
  public playThrottle() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Failsafe
    }
  }

  // Visual nanite hull repair sequence audio with restoration pulse harmonics & micro-welding sizzle
  public playRepairSequence() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Initial rising harmonic restoration pulse wave (320Hz -> 680Hz)
      const pulseOsc = this.ctx.createOscillator();
      const pulseGain = this.ctx.createGain();
      pulseOsc.type = 'sine';
      pulseOsc.frequency.setValueAtTime(320, now);
      pulseOsc.frequency.exponentialRampToValueAtTime(740, now + 0.45);

      pulseGain.gain.setValueAtTime(0.12, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      pulseOsc.connect(pulseGain);
      pulseGain.connect(this.ctx.destination);
      pulseOsc.start(now);
      pulseOsc.stop(now + 0.62);

      // 2. Nanite welding micro-arcs (rapid staccato high-frequency discharge)
      for (let i = 0; i < 4; i++) {
        const t = now + 0.12 + i * 0.08;
        const sparkOsc = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        sparkOsc.type = 'triangle';
        sparkOsc.frequency.setValueAtTime(1400 + Math.random() * 400, t);
        sparkOsc.frequency.exponentialRampToValueAtTime(800, t + 0.04);

        sparkGain.gain.setValueAtTime(0.05, t);
        sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        sparkOsc.connect(sparkGain);
        sparkGain.connect(this.ctx.destination);
        sparkOsc.start(t);
        sparkOsc.stop(t + 0.05);
      }

      // 3. Resonant crystalline hull integrity restored chime (two-tone confirmation)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(880, now + 0.42);
      chimeOsc.frequency.setValueAtTime(1320, now + 0.54);

      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.setValueAtTime(0.09, now + 0.42);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(now + 0.42);
      chimeOsc.stop(now + 0.98);
    } catch {
      // Audio playback failsafe
    }
  }

  // Emergency klaxon alert
  public playKlaxon() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.setValueAtTime(500, now + 0.12);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Failsafe
    }
  }

  // Radio transmitter click when captain opens microphone
  public playMicOpen() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1800, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Failsafe
    }
  }

  // Radio transmitter release click when microphone closes
  public playMicClose() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(500, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Failsafe
    }
  }
}

export const sound = new SoundEngine();
