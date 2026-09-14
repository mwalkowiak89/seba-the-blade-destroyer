import type { Song } from './Music';

const bars = (...b: string[]) => b.join(' ');

/** Motyw poziomu – E-moll, 168 BPM, 8 taktów, pętla. Riff basu + agresywny lead w stylu Contry. */
export const LEVEL_THEME: Song = {
  name: 'level',
  bpm: 168,
  loop: true,
  tracks: [
    { wave: 'square', duty: 0.5, gain: 0.26, steps: bars(
      'E4 . . . G4 . B4 . E5 . . . D5 . B4 .',
      'A4 . . . B4 . A4 . G4 . . . E4 . . .',
      'C5 . . . D5 . E5 . G5 . . . E5 . D5 .',
      'B4 . . . D5 . B4 . A4 . G4 . E4 . . .',
      'E5 . . . D5 . B4 . G4 . . . A4 . B4 .',
      'C5 . . . B4 . A4 . G4 . . . F#4 . . .',
      'E4 . G4 . A4 . B4 . D5 . . . E5 . D5 .',
      'B4 . . . . . . . F#4 . . . . . . .',
    ) },
    { wave: 'square', duty: 0.25, gain: 0.13, legato: 0.6, steps: bars(
      'E3 G3 B3 E4 E3 G3 B3 E4 A3 C4 E4 A4 A3 C4 E4 A4',
      'E3 G3 B3 E4 E3 G3 B3 E4 B3 D4 F#4 B4 G3 B3 D4 G4',
      'C3 E3 G3 C4 C3 E3 G3 C4 D3 F#3 A3 D4 E3 G3 B3 E4',
      'B2 D3 F#3 B3 B2 D3 F#3 B3 E3 G3 B3 E4 E3 G3 B3 E4',
      'E3 G3 B3 E4 E3 G3 B3 E4 A3 C4 E4 A4 A3 C4 E4 A4',
      'E3 G3 B3 E4 E3 G3 B3 E4 B3 D4 F#4 B4 G3 B3 D4 G4',
      'C3 E3 G3 C4 C3 E3 G3 C4 D3 F#3 A3 D4 E3 G3 B3 E4',
      'B2 D3 F#3 B3 B2 D3 F#3 B3 B2 D3 F#3 B3 B2 D3 F#3 B3',
    ) },
    { wave: 'triangle', gain: 0.5, legato: 0.8, steps: bars(
      'E2 . E2 . E2 . G2 . A2 . A2 . G2 . E2 .',
      'E2 . E2 . E2 . G2 . B2 . B2 . A2 . G2 .',
      'C2 . C2 . C2 . D2 . E2 . E2 . D2 . C2 .',
      'B1 . B1 . B1 . D2 . E2 . E2 . E2 . E2 .',
      'E2 . E2 . E2 . G2 . A2 . A2 . G2 . E2 .',
      'E2 . E2 . E2 . G2 . B2 . B2 . A2 . G2 .',
      'C2 . C2 . C2 . D2 . E2 . E2 . D2 . C2 .',
      'B1 . B1 . D2 . F#2 . B1 . B1 . D2 . F#2 .',
    ) },
    { wave: 'noise', gain: 0.32, steps: bars(
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H H K - H - S - H -',
      'K - H - S - H - K - S - S - S S',
    ) },
  ],
};

/** Motyw bossa – D-moll z chromatyką, 184 BPM, napędzająca perkusja. */
export const BOSS_THEME: Song = {
  name: 'boss',
  bpm: 184,
  loop: true,
  tracks: [
    { wave: 'square', duty: 0.5, gain: 0.28, steps: bars(
      'D5 . F5 . A5 . G#5 . A5 . . . F5 . D5 .',
      'D5 . F5 . A5 . A#5 . A5 . . . G5 . A5 .',
      'A#5 . . . A5 . G5 . F5 . . . E5 . F5 .',
      'E5 . . . F5 . E5 . C#5 . . . D5 . . .',
      'D5 . . . . . D5 . F5 . . . A5 . . .',
      'G#5 . . . A5 . G#5 . A5 . . . D6 . . .',
      'C6 . . . A#5 . A5 . G5 . . . F5 . E5 .',
      'F5 . E5 . D5 . C#5 . D5 . . . . . . .',
    ) },
    { wave: 'square', duty: 0.125, gain: 0.15, legato: 0.6, steps: bars(
      'D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 C4',
      'D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 G#3 B3 D4 F4',
      'A#2 D3 F3 A#3 A#2 D3 F3 A#3 G2 A#2 D3 G3 G2 A#2 D3 G3',
      'A2 C#3 E3 A3 A2 C#3 E3 A3 G#2 B2 D3 G#3 A2 C#3 E3 A3',
      'D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 C4',
      'D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 G#3 B3 D4 F4',
      'A#2 D3 F3 A#3 A#2 D3 F3 A#3 G2 A#2 D3 G3 G2 A#2 D3 G3',
      'A2 C#3 E3 A3 A2 C#3 E3 A3 A2 C#3 E3 A3 D3 F3 A3 D4',
    ) },
    { wave: 'triangle', gain: 0.55, legato: 0.7, steps: bars(
      'D2 . D2 D2 . D2 . F2 D2 . D2 D2 . D2 . C2',
      'D2 . D2 D2 . D2 . F2 D2 . D2 D2 . G#2 . A2',
      'A#2 . A#2 A#2 . A#2 . A2 G2 . G2 G2 . G2 . F2',
      'A2 . A2 A2 . A2 . A2 G#2 . G#2 . A2 . . .',
      'D2 . D2 D2 . D2 . F2 D2 . D2 D2 . D2 . C2',
      'D2 . D2 D2 . D2 . F2 D2 . D2 D2 . G#2 . A2',
      'A#2 . A#2 A#2 . A#2 . A2 G2 . G2 G2 . G2 . F2',
      'A2 . A2 A2 . A2 . A2 A2 . A2 . D2 . . .',
    ) },
    { wave: 'noise', gain: 0.34, steps: bars(
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - H H S - K - K - H H S - S -',
      'K - S - K - S - S S S S K K S S',
    ) },
  ],
};

/** Dżingiel zwycięstwa (bez pętli). */
export const VICTORY_JINGLE: Song = {
  name: 'victory',
  bpm: 132,
  loop: false,
  tracks: [
    { wave: 'square', duty: 0.5, gain: 0.3, steps: 'E5 . G5 . B5 . E6 . . . D6 . E6 . . . . . . . - - - -' },
    { wave: 'square', duty: 0.25, gain: 0.16, steps: 'G4 . B4 . E5 . G5 . . . B5 . G5 . . . . . . . - - - -' },
    { wave: 'triangle', gain: 0.5, steps: 'E2 . . . G2 . . . B2 . . . E3 . . . . . . . - - - -' },
    { wave: 'noise', gain: 0.3, steps: 'K - - - S - - - K - - - S S - - - - - - - - - -' },
  ],
};

/** Dżingiel game over (bez pętli). */
export const GAMEOVER_JINGLE: Song = {
  name: 'gameover',
  bpm: 92,
  loop: false,
  tracks: [
    { wave: 'square', duty: 0.5, gain: 0.28, steps: 'E4 . . . D4 . . . C4 . . . B3 . . . E3 . . . . . . . - - - -' },
    { wave: 'square', duty: 0.25, gain: 0.14, steps: 'B3 . . . A3 . . . G3 . . . F#3 . . . B2 . . . . . . . - - - -' },
    { wave: 'triangle', gain: 0.5, steps: 'E2 . . . . . . . C2 . . . . . . . E1 . . . . . . . - - - -' },
    { wave: 'noise', gain: 0.25, steps: 'K - - - - - - - K - - - - - - - K - - - - - - - - - - -' },
  ],
};
