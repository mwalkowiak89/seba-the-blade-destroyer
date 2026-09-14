import { MusicPlayer } from './Music';
import { BOSS_THEME, GAMEOVER_JINGLE, LEVEL_THEME, VICTORY_JINGLE } from './Songs';

const SONGS = { level: LEVEL_THEME, boss: BOSS_THEME, victory: VICTORY_JINGLE, gameover: GAMEOVER_JINGLE };
export type SongName = keyof typeof SONGS;

/** Jeden odtwarzacz muzyki dla całej gry (scena jest odtwarzana od nowa po restarcie). */
export class Jukebox {
  private static player = new MusicPlayer();

  static play(name: SongName): void {
    if (Jukebox.player.current === name) return;
    Jukebox.player.play(SONGS[name]);
  }

  static stop(): void { Jukebox.player.stop(); }
  static get current(): string | null { return Jukebox.player.current; }
}
