import { AudioEngine } from './AudioEngine';

export type Wave = 'square' | 'triangle' | 'saw' | 'sine' | 'noise';

/** Parametry efektu w stylu jsfxr/NES – renderowane raz do AudioBuffer. */
export interface SfxDef {
  wave: Wave;
  /** Częstotliwość startowa i końcowa (Hz) – poślizg wykładniczy. */
  freq: number;
  freqEnd?: number;
  duration: number;
  /** Obwiednia: atak, czas zaniku po fazie sustain (s). */
  attack?: number;
  decay?: number;
  /** Wypełnienie fali prostokątnej (0..0.5). */
  duty?: number;
  /** Vibrato: głębokość (ułamek częstotliwości) i szybkość (Hz). */
  vibratoDepth?: number;
  vibratoRate?: number;
  /** Arpeggio: kolejne mnożniki częstotliwości zmieniane co `arpStep` s. */
  arp?: number[];
  arpStep?: number;
  /** Szum "NES": sample-and-hold z tą częstotliwością (Hz); 0 = biały. */
  noiseRate?: number;
  /** Prosty filtr dolnoprzepustowy (Hz) – start i koniec. */
  lowpass?: number;
  lowpassEnd?: number;
  gain?: number;
}

/** Renderuje definicję do bufora PCM (mono). */
export function renderSfx(def: SfxDef, sampleRate: number): Float32Array {
  const n = Math.max(1, Math.floor(def.duration * sampleRate));
  const out = new Float32Array(n);
  const attack = def.attack ?? 0.004;
  const decay = def.decay ?? def.duration * 0.6;
  const sustainEnd = Math.max(attack, def.duration - decay);
  const duty = def.duty ?? 0.5;
  const f0 = def.freq, f1 = def.freqEnd ?? def.freq;
  let phase = 0;
  let noiseHold = 0, noiseCounter = 0;
  let lp = 0;
  let seed = 0x1234567;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };

  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const u = t / def.duration;
    let f = f0 * Math.pow(f1 / f0, u);
    if (def.arp && def.arp.length) {
      const idx = Math.min(def.arp.length - 1, Math.floor(t / (def.arpStep ?? 0.05)));
      f *= def.arp[idx];
    }
    if (def.vibratoDepth) f *= 1 + Math.sin(t * Math.PI * 2 * (def.vibratoRate ?? 8)) * def.vibratoDepth;

    let s: number;
    if (def.wave === 'noise') {
      const rate = def.noiseRate ?? 0;
      if (rate > 0) {
        noiseCounter += rate / sampleRate;
        if (noiseCounter >= 1) { noiseCounter -= 1; noiseHold = rnd(); }
        s = noiseHold;
      } else s = rnd();
    } else {
      phase += f / sampleRate;
      phase -= Math.floor(phase);
      switch (def.wave) {
        case 'square': s = phase < duty ? 1 : -1; break;
        case 'triangle': s = 4 * Math.abs(phase - 0.5) - 1; break;
        case 'saw': s = 2 * phase - 1; break;
        default: s = Math.sin(phase * Math.PI * 2);
      }
    }
    if (def.lowpass) {
      const fc = def.lowpass * Math.pow((def.lowpassEnd ?? def.lowpass) / def.lowpass, u);
      const a = 1 - Math.exp(-2 * Math.PI * fc / sampleRate);
      lp += a * (s - lp);
      s = lp;
    }
    // obwiednia
    let env: number;
    if (t < attack) env = t / attack;
    else if (t < sustainEnd) env = 1;
    else env = Math.pow(1 - (t - sustainEnd) / Math.max(1e-4, def.duration - sustainEnd), 1.6);
    out[i] = s * env * (def.gain ?? 0.5);
  }
  return out;
}

/** Cache buforów per definicja. */
export class SfxBank {
  private buffers = new Map<string, AudioBuffer>();

  constructor(private defs: Record<string, SfxDef>) {}

  has(name: string): boolean { return name in this.defs; }

  buffer(name: string): AudioBuffer | null {
    const ctx = AudioEngine.ctx;
    if (!ctx) return null;
    let b = this.buffers.get(name);
    if (!b) {
      const def = this.defs[name];
      if (!def) return null;
      const pcm = renderSfx(def, ctx.sampleRate);
      b = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
      b.getChannelData(0).set(pcm);
      this.buffers.set(name, b);
    }
    return b;
  }

  /** @param rate losowa wariacja wysokości (np. 0.06 = ±6%) */
  play(name: string, volume = 1, rateJitter = 0): void {
    const ctx = AudioEngine.ctx;
    const buf = this.buffer(name);
    if (!ctx || !buf || !AudioEngine.sfxBus || !AudioEngine.running) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (rateJitter) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJitter;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(AudioEngine.sfxBus);
    src.start();
  }
}
