import { Input, type Action } from '../core/Input';
import { AudioEngine } from '../audio/AudioEngine';

/** Stały pad z martwą strefą; narożniki umożliwiają ruch i celowanie po skosie. */
export function touchDirections(x: number, y: number): Action[] {
  const actions: Action[] = [];
  if (x < -.28) actions.push('left');
  if (x > .28) actions.push('right');
  if (y < -.28) actions.push('up');
  if (y > .28) actions.push('down');
  return actions;
}

export class TouchControls {
  private root = document.getElementById('touch-controls')!;
  private toggle = document.getElementById('touch-toggle')!;
  private pad = document.getElementById('touch-pad')!;
  private thumb = document.getElementById('touch-thumb')!;
  private restart = document.getElementById('touch-restart') as HTMLButtonElement;
  private mute = document.getElementById('touch-mute')!;
  private pointers = new Map<number, HTMLElement>();
  private padPointer: number | null = null;
  private manual = false;
  private lastEnded: boolean | null = null;
  private lastMuted: boolean | null = null;

  constructor(private input: Input, private resize: () => void) {
    const media = window.matchMedia('(any-pointer: coarse)');
    this.toggle.addEventListener('click', () => { this.manual = true; this.setEnabled(!input.touchEnabled); });
    media.addEventListener('change', () => { if (!this.manual) this.setEnabled(media.matches); });
    this.setEnabled(media.matches);
    this.bind(this.pad);
    for (const button of Array.from(this.root.querySelectorAll<HTMLElement>('[data-touch-action]'))) this.bind(button);
    // Przyciski pomocnicze obsługują także standardowe kliknięcie z klawiatury.
    this.mute.addEventListener('click', () => { AudioEngine.toggleMute(); });
    this.restart.addEventListener('click', () => {
      input.setTouchActions(-1, ['restart']); input.setTouchActions(-1, []);
    });
    window.addEventListener('blur', () => this.clear());
    window.addEventListener('resize', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
    this.root.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private setEnabled(enabled: boolean): void {
    this.clear(); this.input.touchEnabled = enabled;
    document.body.classList.toggle('touch-mode', enabled);
    this.root.hidden = !enabled;
    this.toggle.textContent = enabled ? 'Ukryj przyciski' : 'Sterowanie dotykowe';
    this.toggle.setAttribute('aria-expanded', String(enabled));
    this.resize();
  }

  private bind(element: HTMLElement): void {
    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || (element === this.pad && this.padPointer !== null)) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, element);
      if (element === this.pad) { this.padPointer = event.pointerId; this.movePad(event); }
      else this.input.setTouchActions(event.pointerId, [element.dataset.touchAction as Action]);
      element.classList.add('pressed');
    });
    element.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.padPointer) this.movePad(event);
    });
    const release = (event: PointerEvent, cancel: boolean): void => {
      if (!this.pointers.has(event.pointerId)) return;
      if (cancel) this.input.cancelTouch(event.pointerId);
      else this.input.setTouchActions(event.pointerId, []);
      this.pointers.delete(event.pointerId);
      if (event.pointerId === this.padPointer) { this.padPointer = null; this.resetThumb(); }
      if (![...this.pointers.values()].includes(element)) element.classList.remove('pressed');
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };
    element.addEventListener('pointerup', (event) => release(event, false));
    element.addEventListener('pointercancel', (event) => release(event, true));
    element.addEventListener('lostpointercapture', (event) => release(event, true));
  }

  private movePad(event: PointerEvent): void {
    const box = this.pad.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height / 2)));
    this.input.setTouchActions(event.pointerId, touchDirections(x, y));
    this.thumb.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
  }

  private resetThumb(): void { this.thumb.style.transform = ''; }
  private clear(): void {
    const held = [...this.pointers];
    this.pointers.clear(); this.padPointer = null; this.input.clearTouch(); this.resetThumb();
    for (const [id, element] of held) {
      element.classList.remove('pressed');
      if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    }
  }

  update(ended: boolean): void {
    if (ended !== this.lastEnded) { this.restart.hidden = !ended; this.lastEnded = ended; }
    if (AudioEngine.muted !== this.lastMuted) {
      this.lastMuted = AudioEngine.muted;
      this.mute.textContent = AudioEngine.muted ? 'Włącz dźwięk' : 'Wycisz';
      this.mute.setAttribute('aria-pressed', String(AudioEngine.muted));
    }
  }
}
