import { CONFIG } from '../core/Config';

/**
 * Cienka warstwa nad Web Audio: kontekst (odblokowywany pierwszym gestem użytkownika – polityka autoplay),
 * tor master → sfx / music, wyciszenie. Bez AudioContext (Node, headless test) wszystko jest no-op.
 */
export class AudioEngine {
  private static _ctx: AudioContext | null = null;
  private static master: GainNode | null = null;
  static sfxBus: GainNode | null = null;
  static musicBus: GainNode | null = null;
  static muted = false;
  private static unlockHooked = false;

  static get available(): boolean {
    return typeof window !== 'undefined' && typeof (window as unknown as { AudioContext?: unknown }).AudioContext === 'function';
  }

  /** Kontekst tworzony leniwie; null gdy Web Audio niedostępne. */
  static get ctx(): AudioContext | null {
    if (this._ctx) return this._ctx;
    if (!this.available) return null;
    this._ctx = new AudioContext();
    this.master = this._ctx.createGain();
    this.master.gain.value = this.muted ? 0 : CONFIG.audio.master;
    this.master.connect(this._ctx.destination);
    this.sfxBus = this._ctx.createGain();
    this.sfxBus.gain.value = CONFIG.audio.sfx;
    this.sfxBus.connect(this.master);
    this.musicBus = this._ctx.createGain();
    this.musicBus.gain.value = CONFIG.audio.music;
    this.musicBus.connect(this.master);
    return this._ctx;
  }

  /** Czy przeglądarka pozwala już grać (po gestach użytkownika). */
  static get running(): boolean {
    return this._ctx?.state === 'running';
  }

  /** Podpina odblokowanie kontekstu na pierwszy klawisz / klik / dotyk. */
  static hookUnlock(): void {
    if (this.unlockHooked || typeof window === 'undefined') return;
    this.unlockHooked = true;
    const unlock = () => { void this.resume(); };
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) window.addEventListener(ev, unlock, { passive: true });
  }

  static async resume(): Promise<void> {
    const c = this.ctx;
    if (c && c.state !== 'running') { try { await c.resume(); } catch { /* ignoruj */ } }
  }

  static setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this._ctx) this.master.gain.setTargetAtTime(m ? 0 : CONFIG.audio.master, this._ctx.currentTime, 0.02);
  }

  static toggleMute(): boolean { this.setMuted(!this.muted); return this.muted; }
}
