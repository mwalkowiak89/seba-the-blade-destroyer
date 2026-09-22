import { Input, type Action } from '../src/core/Input';
import { GameScene } from '../src/scenes/GameScene';
import { PlayerController } from '../src/entities/player/PlayerController';
import { IDLE, RUN, PRONE } from '../src/entities/player/PlayerStates';

/** Kontrolowane pozy z rzeczywistym rysowaniem postaci i broni, bez walki. */
class PoseInput extends Input {
  actions = new Set<Action>();
  override held(action: Action): boolean { return this.actions.has(action); }
  override justPressed(): boolean { return false; }
}

export function weaponPreview(): (ctx: CanvasRenderingContext2D) => void {
  const input = new PoseInput(window);
  return (ctx) => {
    const scene = new GameScene(input);
    const poses = [
      { label: 'SPOCZYNEK', state: IDLE, facing: 1, actions: [] },
      { label: 'STRZAŁ W PRAWO', state: IDLE, facing: 1, actions: ['fire'] },
      { label: 'STRZAŁ W LEWO', state: IDLE, facing: -1, actions: ['fire'] },
      { label: 'W GÓRĘ', state: IDLE, facing: 1, actions: ['up', 'fire'] },
      { label: 'PO SKOSIE', state: RUN, facing: 1, actions: ['right', 'up', 'fire'] },
      { label: 'LEŻĄC', state: PRONE, facing: 1, actions: ['down', 'fire'] },
    ] as const;
    ctx.fillStyle = '#202d36'; ctx.fillRect(0, 0, 384, 216);
    poses.forEach((pose, i) => {
      input.actions = new Set<Action>(pose.actions);
      const player = new PlayerController(input, 72, 166);
      player.facing = pose.facing;
      player.onGround = true;
      player.setState(pose.state, scene);
      player.update(0, scene);
      const cx = 64 + i % 3 * 128, floor = i < 3 ? 94 : 200;
      ctx.fillStyle = '#52636a'; ctx.fillRect(cx - 47, floor, 94, 1);
      ctx.save();
      ctx.translate(cx - player.cx, floor - player.bottom);
      player.draw(ctx);
      ctx.restore();
      ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e0d9c6';
      ctx.fillText(pose.label, cx, i < 3 ? 18 : 122);
    });
  };
}
