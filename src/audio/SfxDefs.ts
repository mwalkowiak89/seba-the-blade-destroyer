import type { SfxDef } from './Synth';

/**
 * Definicje efektów (styl NES/jsfxr). Każdy można podmienić na plik: Sfx.register('shoot', 'assets/sfx/shoot.wav').
 */
export const SFX_DEFS = {
  shoot:      { wave: 'square', duty: 0.25, freq: 1400, freqEnd: 300, duration: 0.07, decay: 0.05, gain: 0.32 },
  jump:       { wave: 'square', duty: 0.5, freq: 260, freqEnd: 720, duration: 0.16, decay: 0.08, gain: 0.22 },
  land:       { wave: 'noise', noiseRate: 6000, freq: 1, duration: 0.09, lowpass: 900, lowpassEnd: 200, decay: 0.07, gain: 0.35 },
  hurt:       { wave: 'square', duty: 0.5, freq: 480, freqEnd: 70, duration: 0.3, decay: 0.2, vibratoDepth: 0.08, vibratoRate: 30, gain: 0.5 },
  enemy_hit:  { wave: 'noise', noiseRate: 12000, freq: 1, duration: 0.06, lowpass: 5000, lowpassEnd: 1500, decay: 0.05, gain: 0.4 },
  enemy_die:  { wave: 'noise', freq: 1, duration: 0.45, lowpass: 3500, lowpassEnd: 200, decay: 0.38, gain: 0.6 },
  explosion:  { wave: 'noise', freq: 1, duration: 0.7, lowpass: 2500, lowpassEnd: 120, decay: 0.6, gain: 0.7 },
  boss_phase: { wave: 'square', duty: 0.5, freq: 440, duration: 0.7, arp: [1, 1.5, 1, 1.5, 1, 1.5, 2], arpStep: 0.1, decay: 0.15, gain: 0.45 },
  boss_die:   { wave: 'noise', freq: 1, duration: 1.4, lowpass: 3000, lowpassEnd: 60, decay: 1.2, gain: 0.8 },
  boss_rumble:{ wave: 'triangle', freq: 220, freqEnd: 35, duration: 1.4, decay: 1.0, vibratoDepth: 0.2, vibratoRate: 12, gain: 0.5 },
  sniper_aim: { wave: 'triangle', freq: 500, freqEnd: 1300, duration: 0.35, decay: 0.1, gain: 0.35 },
  drone_bomb: { wave: 'square', duty: 0.35, freq: 1200, freqEnd: 250, duration: 0.45, decay: 0.15, vibratoDepth: 0.05, vibratoRate: 20, gain: 0.32 },
  saw_hit:    { wave: 'square', duty: 0.5, freq: 1800, freqEnd: 900, duration: 0.05, decay: 0.04, gain: 0.25 },
  game_over:  { wave: 'square', duty: 0.5, freq: 660, duration: 1.0, arp: [1, 0.75, 0.63, 0.5], arpStep: 0.25, decay: 0.2, gain: 0.45 },
  victory:    { wave: 'square', duty: 0.5, freq: 330, duration: 0.9, arp: [1, 1.25, 1.5, 2, 2, 2], arpStep: 0.15, decay: 0.2, gain: 0.45 },
  charge:     { wave: 'saw', freq: 90, freqEnd: 420, duration: 0.45, decay: 0.1, gain: 0.35 },
  ricochet:   { wave: 'square', duty: 0.5, freq: 2400, freqEnd: 900, duration: 0.09, decay: 0.07, vibratoDepth: 0.15, vibratoRate: 90, gain: 0.3 },
  zap:        { wave: 'noise', noiseRate: 9000, freq: 1, duration: 0.18, lowpass: 6000, lowpassEnd: 1200, decay: 0.12, gain: 0.35 },
  gust:       { wave: 'noise', freq: 1, duration: 1.2, lowpass: 400, lowpassEnd: 1800, attack: 0.3, decay: 0.5, gain: 0.35 },
  slam:       { wave: 'noise', freq: 1, duration: 0.5, lowpass: 900, lowpassEnd: 80, decay: 0.4, gain: 0.8 },
  quake:      { wave: 'triangle', freq: 60, freqEnd: 30, duration: 0.7, decay: 0.5, vibratoDepth: 0.3, vibratoRate: 18, gain: 0.5 },
  laser:      { wave: 'square', duty: 0.5, freq: 900, freqEnd: 1800, duration: 0.7, attack: 0.05, decay: 0.2, vibratoDepth: 0.02, vibratoRate: 40, gain: 0.25 },
  crack:      { wave: 'noise', noiseRate: 3000, freq: 1, duration: 0.35, lowpass: 2500, lowpassEnd: 300, decay: 0.3, gain: 0.6 },
  ui:         { wave: 'square', duty: 0.5, freq: 880, freqEnd: 1320, duration: 0.08, decay: 0.05, gain: 0.3 },
} satisfies Record<string, SfxDef>;

export type SfxName = keyof typeof SFX_DEFS;
