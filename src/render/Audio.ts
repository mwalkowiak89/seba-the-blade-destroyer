/**
 * Stub audio. Logika gry wywołuje `Sfx.play('shoot')` itd. już teraz;
 * dopóki dźwięk nie jest zarejestrowany, wywołanie jest no-op.
 *
 *   Sfx.register('shoot', 'assets/sfx/makita.wav');
 */
export type SfxName =
  | 'shoot' | 'jump' | 'hurt' | 'enemy_hit' | 'enemy_die' | 'explosion'
  | 'boss_phase' | 'boss_die' | 'sniper_aim' | 'drone_bomb' | 'game_over' | 'victory';

export class Sfx {
  private static sources = new Map<SfxName, HTMLAudioElement>();
  static volume = 0.6;
  static enabled = true;

  static register(name: SfxName, url: string): void {
    const a = new Audio(url);
    a.preload = 'auto';
    Sfx.sources.set(name, a);
  }

  static play(name: SfxName): void {
    if (!Sfx.enabled) return;
    const src = Sfx.sources.get(name);
    if (!src) return;
    const inst = src.cloneNode() as HTMLAudioElement;
    inst.volume = Sfx.volume;
    void inst.play().catch(() => { /* autoplay policy – ignoruj */ });
  }
}
