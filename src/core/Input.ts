/** Mapowanie klawiszy na akcje – łatwe do zmiany w jednym miejscu. */
export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'fire' | 'restart' | 'mute' | 'debug';

export const KEY_BINDINGS: Record<Action, string[]> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'KeyK', 'Space'],
  fire: ['KeyX', 'KeyJ'],
  restart: ['KeyR', 'Enter'],
  mute: ['KeyM'],
  debug: ['F3'],
};

/**
 * Indeksy przycisków wg "standard gamepad mapping" (W3C):
 * 0 A/Cross, 1 B/Circle, 2 X/Square, 3 Y/Triangle, 4 LB, 5 RB, 6 LT, 7 RT,
 * 8 Select/Back, 9 Start, 12–15 D-pad (góra, dół, lewo, prawo).
 */
export const GAMEPAD_BINDINGS: Record<Action, number[]> = {
  left: [14],
  right: [15],
  up: [12],
  down: [13],
  jump: [0],
  fire: [1, 2, 7],
  restart: [9],
  mute: [8],
  debug: [],
};

/** Martwa strefa gałki (0..1). */
export const GAMEPAD_DEADZONE = 0.45;

export class Input {
  private down = new Set<string>();
  private pressedThisFrame = new Set<string>();
  private prevActions = new Set<Action>();
  private curActions = new Set<Action>();
  private touchSources = new Map<number, Set<Action>>();
  private touchPressed = new Map<number, Set<Action>>();
  touchEnabled = false;
  /** Czy w tym kroku którakolwiek akcja pochodzi z pada (do podpowiedzi w UI). */
  gamepadActive = false;
  gamepadConnected = false;

  constructor(target: HTMLElement | Window = window) {
    target.addEventListener('keydown', (e) => {
      const ev = e as KeyboardEvent;
      if (this.isBound(ev.code)) ev.preventDefault();
      if (!this.down.has(ev.code)) this.pressedThisFrame.add(ev.code);
      this.down.add(ev.code);
    });
    target.addEventListener('keyup', (e) => this.down.delete((e as KeyboardEvent).code));
    window.addEventListener('blur', () => this.releaseAll());
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
    window.addEventListener('gamepadconnected', () => { this.gamepadConnected = true; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadConnected = this.firstGamepad() !== null; });
  }

  /** Każdy palec jest osobnym źródłem; puszczenie jednego nie zwalnia pozostałych. */
  setTouchActions(pointerId: number, actions: Action[]): void {
    const previous = this.touchSources.get(pointerId);
    const pressed = this.touchPressed.get(pointerId) ?? new Set<Action>();
    for (const action of actions) if (!previous?.has(action)) pressed.add(action);
    if (pressed.size) this.touchPressed.set(pointerId, pressed);
    if (actions.length) this.touchSources.set(pointerId, new Set(actions));
    else this.touchSources.delete(pointerId);
  }

  clearTouch(): void { this.touchSources.clear(); this.touchPressed.clear(); }
  cancelTouch(pointerId: number): void { this.touchSources.delete(pointerId); this.touchPressed.delete(pointerId); }

  private releaseAll(): void {
    this.down.clear(); this.pressedThisFrame.clear(); this.clearTouch();
    this.prevActions.clear(); this.curActions.clear();
  }

  private isBound(code: string): boolean {
    return Object.values(KEY_BINDINGS).some((codes) => codes.includes(code));
  }

  /** Pierwszy podłączony pad (Chrome wymaga wcześniejszego naciśnięcia przycisku). */
  private firstGamepad(): Gamepad | null {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
    for (const gp of navigator.getGamepads()) if (gp && gp.connected) return gp;
    return null;
  }

  private readGamepad(into: Set<Action>): void {
    const gp = this.firstGamepad();
    this.gamepadActive = false;
    if (!gp) return;
    this.gamepadConnected = true;
    for (const action of Object.keys(GAMEPAD_BINDINGS) as Action[]) {
      if (GAMEPAD_BINDINGS[action].some((i) => gp.buttons[i]?.pressed)) into.add(action);
    }
    // lewa gałka → kierunki
    const ax = gp.axes[0] ?? 0;
    const ay = gp.axes[1] ?? 0;
    if (ax < -GAMEPAD_DEADZONE) into.add('left');
    if (ax > GAMEPAD_DEADZONE) into.add('right');
    if (ay < -GAMEPAD_DEADZONE) into.add('up');
    if (ay > GAMEPAD_DEADZONE) into.add('down');
    this.gamepadActive = into.size > 0;
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
    this.readGamepad(this.curActions);
    for (const actions of this.touchSources.values()) for (const action of actions) this.curActions.add(action);
    for (const actions of this.touchPressed.values()) for (const action of actions) this.curActions.add(action);
    this.touchPressed.clear();
  }

  held(action: Action): boolean { return this.curActions.has(action); }
  justPressed(action: Action): boolean { return this.curActions.has(action) && !this.prevActions.has(action); }

  /** -1, 0, 1 */
  get axisX(): number { return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0); }
  get axisY(): number { return (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0); }
}
