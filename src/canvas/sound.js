const PIANO_CHAR_MAP = {
  A: 440.00,
  B: 493.88,
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.00,
  H: 329.63,
  I: 523.25,
  J: 587.33,
  K: 659.25,
  L: 783.99,
  M: 880.00,
  N: 493.88,
  O: 523.25,
  P: 587.33,
  Q: 349.23,
  R: 392.00,
  S: 440.00,
  T: 523.25,
  U: 659.25,
  V: 783.99,
  W: 880.00,
  X: 1046.50,
  Y: 1174.66,
  Z: 1318.51,
};

const CANVAS_PIANO_SCALE = [
  196.00,
  220.00,
  246.94,
  261.63,
  293.66,
  329.63,
  349.23,
  392.00,
  440.00,
  493.88,
  523.25,
  587.33,
  659.25,
  783.99,
  880.00,
  1046.50,
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.lastNoteTime = 0;
    this.masterGain = null;
    this.compressor = null;
    this.warmFilter = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayGain = null;
  }

  ensureContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMasterBus();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupMasterBus() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    this.warmFilter = ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.setValueAtTime(11000, ctx.currentTime);
    this.warmFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.8, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.18, ctx.currentTime);

    this.delayNode = ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.18, ctx.currentTime);

    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.22, ctx.currentTime);

    this.delayGain = ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.16, ctx.currentTime);

    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.setValueAtTime(3200, ctx.currentTime);

    this.masterGain.connect(this.warmFilter);
    this.warmFilter.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    this.masterGain.connect(this.delayNode);
    this.delayNode.connect(delayFilter);
    delayFilter.connect(this.delayGain);
    this.delayGain.connect(this.warmFilter);

    delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureContext();
      this.playPianoNote(523.25, 0.75, 1.4);
    }
    return this.enabled;
  }

  createPianoHammerTransient(time, velocity = 0.8) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.009);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, time);
      filter.Q.setValueAtTime(2.2, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.045 * velocity, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.009);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);

      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(140, time);
      thump.frequency.exponentialRampToValueAtTime(45, time + 0.022);

      thumpGain.gain.setValueAtTime(0.025 * velocity, time);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

      thump.connect(thumpGain);
      thumpGain.connect(this.masterGain);
      thump.start(time);
      thump.stop(time + 0.026);
    } catch {
}
  }

  playPianoNote(freq = 440, velocity = 0.8, duration = 1.8) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    if (this.lastNoteTime && now - this.lastNoteTime < 0.08) {
      return;
    }
    this.lastNoteTime = now;

    try {
      const ctx = this.ctx;

      let f0 = typeof freq === 'number' ? freq : 440;
      if (!f0 || isNaN(f0) || f0 < 50 || f0 > 4500) f0 = 440;

      const vel = Math.min(Math.max(velocity, 0.15), 1.25);

      this.createPianoHammerTransient(now, vel);

      const soundboardFilter = ctx.createBiquadFilter();
      soundboardFilter.type = 'lowpass';
      const initialCutoff = Math.min(Math.max(f0 * 6.5 * (0.85 + vel * 0.35), 1800), 8200);
      const sustainCutoff = Math.min(Math.max(f0 * 2.2, 750), 3200);
      soundboardFilter.frequency.setValueAtTime(initialCutoff, now);
      soundboardFilter.frequency.exponentialRampToValueAtTime(sustainCutoff, now + 0.28);
      soundboardFilter.Q.setValueAtTime(0.75, now);

      const noteGain = ctx.createGain();
      const peakVol = 0.088 * vel;
      const sustainVol = peakVol * 0.44;
      const decayTime = Math.max(duration * (0.8 + vel * 0.3), 0.8);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakVol, now + 0.003);
      noteGain.gain.exponentialRampToValueAtTime(sustainVol, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      soundboardFilter.connect(noteGain);
      noteGain.connect(this.masterGain);

      const B = 0.00032;
      const detuneCents = 2.4;

      const stringA = ctx.createOscillator();
      stringA.type = 'sine';
      stringA.frequency.setValueAtTime(f0, now);
      stringA.detune.setValueAtTime(-detuneCents, now);

      const stringB = ctx.createOscillator();
      stringB.type = 'sine';
      stringB.frequency.setValueAtTime(f0, now);
      stringB.detune.setValueAtTime(+detuneCents, now);

      const fundGain = ctx.createGain();
      fundGain.gain.setValueAtTime(0.68, now);

      stringA.connect(fundGain);
      stringB.connect(fundGain);
      fundGain.connect(soundboardFilter);

      stringA.start(now);
      stringB.start(now);
      stringA.stop(now + decayTime + 0.05);
      stringB.stop(now + decayTime + 0.05);

      const harmonics = [
        { k: 2, gain: 0.36, decayMult: 0.72, type: 'sine' },
        { k: 3, gain: 0.17, decayMult: 0.52, type: 'triangle' },
        { k: 4, gain: 0.08, decayMult: 0.38, type: 'sine' },
        { k: 5, gain: 0.035, decayMult: 0.25, type: 'sine' },
      ];

      harmonics.forEach((h) => {
        const inharmFreq = h.k * f0 * Math.sqrt(1 + B * h.k * h.k);
        if (inharmFreq > 13000) return;

        const hOsc = ctx.createOscillator();
        const hGain = ctx.createGain();

        hOsc.type = h.type;
        hOsc.frequency.setValueAtTime(inharmFreq, now);

        const hVol = h.gain * vel;
        const hDecay = decayTime * h.decayMult;

        hGain.gain.setValueAtTime(hVol, now);
        hGain.gain.exponentialRampToValueAtTime(0.0001, now + hDecay);

        hOsc.connect(hGain);
        hGain.connect(soundboardFilter);

        hOsc.start(now);
        hOsc.stop(now + hDecay + 0.02);
      });
    } catch {
}
  }

  playPianoKeyForChar(char, combo = 1) {
    if (!this.enabled) return;
    const cleanChar = (char || 'C').toString().toUpperCase().trim();
    const fundamental = PIANO_CHAR_MAP[cleanChar] || 261.63;

    const vel = Math.min(0.72 + Math.min(combo * 0.05, 0.3), 1.15);
    const duration = 1.6 + Math.min(combo * 0.1, 0.6);

    this.playPianoNote(fundamental, vel, duration);

    if (combo >= 3) {
      setTimeout(() => {
        const overtoneFreq = combo >= 5 ? fundamental * 2.0 : fundamental * 1.5;
        this.playPianoNote(overtoneFreq, vel * 0.45, duration * 0.75);
      }, 35);
    }
  }

  playPianoForX(normX = 0.5, velocity = 0.75) {
    if (!this.enabled) return;
    const clampedX = Math.min(Math.max(normX, 0.0), 1.0);
    const scaleIdx = Math.floor(clampedX * (CANVAS_PIANO_SCALE.length - 1));
    const freq = CANVAS_PIANO_SCALE[scaleIdx] || 261.63;
    this.playPianoNote(freq, velocity, 1.7);
  }

  playRipple(normX = 0.5) {
    if (!this.enabled) return;
    this.playPianoForX(normX, 0.68);
  }

  playRelease(velocity = 0.5) {
    if (!this.enabled) return;
    const v = Math.min(Math.max(velocity, 0.2), 1.2);
    this.playPianoNote(261.63, 0.55 * v, 1.8);
    setTimeout(() => {
      this.playPianoNote(392.00, 0.42 * v, 1.6);
    }, 40);
  }

  playSlingshotLaunch(power = 1.0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const p = Math.min(Math.max(power, 0.2), 1.5);

      this.createPianoHammerTransient(now, 0.9 * p);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      const subFilter = this.ctx.createBiquadFilter();

      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(140, now);

      subOsc.type = 'sine';
      const startPitch = 120 + p * 60;
      subOsc.frequency.setValueAtTime(startPitch, now);
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

      subGain.gain.setValueAtTime(0.08 * p, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(now);
      subOsc.stop(now + 0.32);

      const twangOsc = this.ctx.createOscillator();
      const twangGain = this.ctx.createGain();
      twangOsc.type = 'triangle';
      twangOsc.frequency.setValueAtTime(220 * p, now + 0.015);
      twangOsc.frequency.exponentialRampToValueAtTime(70, now + 0.24);

      twangGain.gain.setValueAtTime(0.035 * p, now + 0.015);
      twangGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      twangOsc.connect(twangGain);
      twangGain.connect(this.masterGain);

      twangOsc.start(now + 0.015);
      twangOsc.stop(now + 0.26);
    } catch {
}
  }

  playOrbBounce() {
}

  playTargetHit(targetOrCombo = 1, combo = 1) {
    if (!this.enabled) return;

    let char = null;
    let currentCombo = combo;

    if (typeof targetOrCombo === 'object' && targetOrCombo !== null) {
      char = targetOrCombo.char || null;
      currentCombo = combo;
    } else if (typeof targetOrCombo === 'number') {
      currentCombo = targetOrCombo;
    }

    if (char) {
      this.playPianoKeyForChar(char, currentCombo);
    } else {
      const noteIdx = (currentCombo - 1) % CANVAS_PIANO_SCALE.length;
      const freq = CANVAS_PIANO_SCALE[noteIdx] || 261.63;
      const vel = Math.min(0.7 + currentCombo * 0.05, 1.15);
      this.playPianoNote(freq, vel, 1.6);
    }
  }

  playShockwaveBurst() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.45);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
}
  }

  playMilestone(_milestone = 500) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      this.playPianoNote(130.81, 1.1, 2.5);

      const arpeggio = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99];
      arpeggio.forEach((freq, idx) => {
        setTimeout(() => {
          this.playPianoNote(freq, 0.82, 2.0);
        }, idx * 75);
      });
    } catch {
}
  }

  playWordComplete() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      this.playPianoNote(146.83, 1.0, 2.6);

      const notes = [293.66, 369.99, 440.00, 587.33, 659.25, 739.99, 880.00];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playPianoNote(freq, 0.85, 2.2);
        }, idx * 70);
      });
    } catch {
}
  }

  playChime(freq = 440, volume = 0.04) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch {
}
  }
}

export const soundEngine = new SoundEngine();
