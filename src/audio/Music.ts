import { AudioEngine } from './AudioEngine';

/**
 * Sekwencer chiptune (4 kanały jak NES: 2× pulse, triangle, noise).
 * Notacja kroków (16-tki): 'E4' nuta, '.' przedłużenie, '-' pauza; perkusja: 'K' stopa, 'S' werbel, 'H' hi-hat.
 * Planowanie z wyprzedzeniem (lookahead) na zegarze AudioContext – stabilne tempo niezależnie od klatek.
 */
export interface Track {
  wave: 'square' | 'triangle' | 'noise';
  gain: number;
  steps: string;
  /** Wypełnienie fali prostokątnej (0.5 / 0.25 / 0.125). */
  duty?: number;
  /** Ile długości kroku trwa nuta (staccato < 1). */
  legato?: number;
  /** Transpozycja w półtonach. */
  transpose?: number;
}

export interface Song {
  name: string;
  bpm: number;
  tracks: Track[];
  loop: boolean;
}

const NOTE_INDEX: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

export function noteToFreq(note: string, transpose = 0): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!m) return 0;
  const midi = 12 * (parseInt(m[2], 10) + 1) + NOTE_INDEX[m[1]] + transpose;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Fala prostokątna o zadanym wypełnieniu jako PeriodicWave (cache per duty). */
const waveCache = new Map<string, PeriodicWave>();
function pulseWave(ctx: AudioContext, duty: number): PeriodicWave {
  const key = duty.toFixed(3);
  let w = waveCache.get(key);
  if (!w) {
    const N = 32;
    const real = new Float32Array(N), imag = new Float32Array(N);
    for (let k = 1; k < N; k++) {
      real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    }
    w = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    waveCache.set(key, w);
  }
  return w;
}

let noiseBuffer: AudioBuffer | null = null;
function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export class MusicPlayer {
  private song: Song | null = null;
  private tokens: string[][] = [];
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private bus: GainNode | null = null;
  private onEnd: (() => void) | null = null;
  private stepDur = 0.1;

  get current(): string | null { return this.song?.name ?? null; }

  play(song: Song, onEnd?: () => void): void {
    const ctx = AudioEngine.ctx;
    this.stop();
    this.song = song;
    this.onEnd = onEnd ?? null;
    if (!ctx || !AudioEngine.musicBus) return;
    this.tokens = song.tracks.map((t) => t.steps.trim().split(/\s+/));
    this.stepDur = 60 / song.bpm / 4;
    this.step = 0;
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(AudioEngine.musicBus);
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop(fade = 0.05): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    const ctx = AudioEngine.ctx;
    if (this.bus && ctx) {
      const b = this.bus;
      b.gain.setTargetAtTime(0, ctx.currentTime, fade);
      setTimeout(() => b.disconnect(), (fade * 6 + 0.1) * 1000);
    }
    this.bus = null;
    this.song = null;
  }

  private schedule(): void {
    const ctx = AudioEngine.ctx;
    if (!ctx || !this.song || !this.bus) return;
    if (!AudioEngine.running) { this.nextTime = ctx.currentTime + 0.05; return; } // czekaj na odblokowanie
    const length = Math.max(...this.tokens.map((t) => t.length));
    while (this.nextTime < ctx.currentTime + 0.15) {
      if (this.step >= length) {
        if (this.song.loop) this.step = 0;
        else { const cb = this.onEnd; this.stop(0.3); cb?.(); return; }
      }
      this.song.tracks.forEach((track, ti) => this.scheduleStep(ctx, track, this.tokens[ti], this.step, this.nextTime));
      this.step++;
      this.nextTime += this.stepDur;
    }
  }

  private scheduleStep(ctx: AudioContext, track: Track, tokens: string[], step: number, t: number): void {
    const tok = tokens[step % tokens.length];
    if (!tok || tok === '-' || tok === '.') return;
    // długość nuty = 1 + liczba kolejnych '.'
    let len = 1;
    while (tokens[(step + len) % tokens.length] === '.' && step + len < tokens.length) len++;
    const dur = len * this.stepDur * (track.legato ?? 0.9);
    const bus = this.bus!;

    if (track.wave === 'noise') {
      this.drum(ctx, tok, t, track.gain, bus);
      return;
    }
    const f = noteToFreq(tok, track.transpose ?? 0);
    if (!f) return;
    const osc = ctx.createOscillator();
    if (track.wave === 'square') osc.setPeriodicWave(pulseWave(ctx, track.duty ?? 0.5));
    else osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(track.gain, t + 0.004);
    g.gain.setTargetAtTime(track.gain * 0.7, t + 0.03, 0.08);
    g.gain.setTargetAtTime(0, t + dur, 0.012);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  private drum(ctx: AudioContext, kind: string, t: number, gain: number, bus: GainNode): void {
    if (kind === 'K') {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      const g = ctx.createGain(); g.gain.setValueAtTime(gain * 1.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.16);
      return;
    }
    const src = ctx.createBufferSource(); src.buffer = getNoise(ctx);
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    if (kind === 'S') { filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 0.7; g.gain.setValueAtTime(gain * 1.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); src.start(t); src.stop(t + 0.13); }
    else { filt.type = 'highpass'; filt.frequency.value = 6000; g.gain.setValueAtTime(gain * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); src.start(t); src.stop(t + 0.05); }
    src.connect(filt).connect(g).connect(bus);
  }
}
