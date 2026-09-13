/** Mapowanie klawiszy na akcje – łatwe do zmiany w jednym miejscu. */
export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'fire' | 'restart';

export const KEY_BINDINGS: Record<Action, string[]> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'KeyK', 'Space'],
  fire: ['KeyX', 'KeyJ'],
  restart: ['KeyR', 'Enter'],
};

export class Input {
  private down = new Set<string>();
  private pressedThisFrame = new Set<string>();
  private prevActions = new Set<Action>();
  private curActions = new Set<Action>();

  constructor(target: HTMLElement | Window = window) {
    target.addEventListener('keydown', (e) => {
      const ev = e as KeyboardEvent;
      if (this.isBound(ev.code)) ev.preventDefault();
      if (!this.down.has(ev.code)) this.pressedThisFrame.add(ev.code);
      this.down.add(ev.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete((e as KeyboardEvent).code));
    window.addEventListener('blur', () => this.down.clear());
  }

  private isBound(code: string): boolean {
    return Object.values(KEY_BINDINGS).some((codes) => codes.includes(code));
  }

  /** Wywoływać raz na krok symulacji – zamraża stan akcji na ten krok. */
  update(): void {
    this.prevActions = this.curActions;
    this.curActions = new Set();
    for (const action of Object.keys(KEY_BINDINGS) as Action[]) {
      if (KEY_BINDINGS[action].some((c) => this.down.has(c) || this.pressedThisFrame.has(c))) {
        this.curActions.add(action);
      }
    }
    this.pressedThisFrame.clear();
  }

  held(action: Action): boolean { return this.curActions.has(action); }
  justPressed(action: Action): boolean { return this.curActions.has(action) && !this.prevActions.has(action); }

  /** -1, 0, 1 */
  get axisX(): number { return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0); }
  get axisY(): number { return (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0); }
}
