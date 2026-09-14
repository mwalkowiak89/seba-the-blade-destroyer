import { AudioEngine } from '../audio/AudioEngine';
import { SfxBank } from '../audio/Synth';
import { SFX_DEFS, type SfxName } from '../audio/SfxDefs';

export type { SfxName };

/**
 * Fasada efektów dźwiękowych. Domyślnie chiptune z syntezatora (SfxDefs);
 * `register(name, url)` podmienia dany efekt na plik audio bez zmian w kodzie gry.
 * Pętle (np. buczenie tarczy) sterowane przez `setLoop`.
 */
export class Sfx {
  private static files = new Map<SfxName, HTMLAudioElement>();
  private static bank = new SfxBank(SFX_DEFS);
  private static loops = new Map<string, { osc: OscillatorNode[]; gain: GainNode }>();
  static volume = 1;
  static enabled = true;
  /** Losowa wariacja wysokości dla szybko powtarzanych efektów. */
  private static jitter: Partial<Record<SfxName, number>> = { shoot: 0.08, enemy_hit: 0.15, saw_hit: 0.1, land: 0.1 };

  static register(name: SfxName, url: string): void {
    const a = new Audio(url);
    a.preload = 'auto';
    Sfx.files.set(name, a);
  }

  static play(name: SfxName, volume = 1): void {
    if (!Sfx.enabled) return;
    const file = Sfx.files.get(name);
    if (file) {
      const inst = file.cloneNode() as HTMLAudioElement;
      inst.volume = Math.min(1, Sfx.volume * volume);
      void inst.play().catch(() => { /* autoplay policy */ });
      return;
    }
    Sfx.bank.play(name, Sfx.volume * volume, Sfx.jitter[name] ?? 0);
  }

  /**
   * Ciągła pętla syntetyczna (buczenie tarczy tnącej). `on` włącza/wycisza z krótką rampą.
   */
  static setLoop(name: 'saw', on: boolean, level = 1): void {
    const ctx = AudioEngine.ctx;
    if (!ctx || !AudioEngine.sfxBus) return;
    let loop = Sfx.loops.get(name);
    if (!loop) {
      if (!on) return;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(AudioEngine.sfxBus);
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 72;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 145;
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 11;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 6;
      lfo.connect(lfoGain).connect(o1.frequency);
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900;
      o1.connect(filt); o2.connect(filt); filt.connect(gain);
      o1.start(); o2.start(); lfo.start();
      loop = { osc: [o1, o2, lfo], gain };
      Sfx.loops.set(name, loop);
    }
    const target = on && Sfx.enabled ? 0.05 * level : 0;
    loop.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.04);
  }

  static stopAllLoops(): void {
    const ctx = AudioEngine.ctx;
    if (!ctx) return;
    for (const l of Sfx.loops.values()) l.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  }
}
