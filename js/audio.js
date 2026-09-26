/* ==========================================================================
   MINEXA - Audio Sound Synthesizer (Web Audio API)
   ========================================================================== */

class MinexaAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.isSirenPlaying) {
      this.stopEmergencySiren();
    }
    return this.muted;
  }

  playBeep(freq = 880, duration = 0.15, type = 'sine') {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  playWarningBeep() {
    if (this.muted) return;
    this.playBeep(660, 0.12, 'triangle');
    setTimeout(() => this.playBeep(880, 0.2, 'triangle'), 150);
  }

  startEmergencySiren() {
    if (this.muted || this.isSirenPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isSirenPlaying = true;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      // Sweep frequency up and down for industrial siren effect
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);

      for (let i = 0; i < 20; i++) {
        osc.frequency.linearRampToValueAtTime(900, now + (i * 1.0) + 0.5);
        osc.frequency.linearRampToValueAtTime(440, now + (i * 1.0) + 1.0);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.sirenOsc1 = osc;
      this.sirenGain = gain;
    } catch (e) {
      console.warn("Siren start error", e);
    }
  }

  stopEmergencySiren() {
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
      } catch (e) {}
      this.sirenOsc1 = null;
    }
    this.isSirenPlaying = false;
  }
}

window.minexaAudio = new MinexaAudioEngine();
