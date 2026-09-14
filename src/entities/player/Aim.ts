import type { Input } from '../../core/Input';
import { normalize, type Vec2 } from '../../core/MathUtil';
import type { PlayerStateName } from './PlayerStates';

/**
 * Reguły celowania z Contry (8 kierunków):
 *  - stojąc: prosto lub pionowo w górę (góra),
 *  - w biegu: prosto, po skosie w górę (góra), po skosie w dół (dół),
 *  - leżąc (prone): prosto po ziemi,
 *  - w powietrzu: dowolny z 8 kierunków (brak inputu = prosto w kierunku zwrotu).
 * Zwraca znormalizowany wektor lub null, gdy w tym stanie nie wolno strzelać.
 */
export function resolveAim(input: Input, state: PlayerStateName, facing: 1 | -1): Vec2 | null {
  const ax = input.axisX;
  const ay = input.axisY;
  switch (state) {
    case 'idle':
      return ay < 0 ? { x: 0, y: -1 } : { x: facing, y: 0 };
    case 'run':
      return ay !== 0 ? normalize(facing, ay) : { x: facing, y: 0 };
    case 'prone':
      return { x: facing, y: 0 }; // leżąc: tylko prosto, tuż nad ziemią
    case 'jump':
    case 'fall':
      if (ax === 0 && ay === 0) return { x: facing, y: 0 };
      return normalize(ax, ay);
    case 'hurt':
    case 'dead':
      return null;
  }
}
