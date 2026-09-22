/** Pointer Events, multitouch i wspólna ścieżka wejścia bez prawdziwej przeglądarki. */
import { Input } from '../src/core/Input';
import { TouchControls, touchDirections } from '../src/ui/TouchControls';

class Element extends EventTarget {
  hidden = false; textContent = ''; style: Record<string, string> = {};
  dataset: Record<string, string> = {}; attributes = new Map<string, string>();
  captures = new Set<number>(); classes = new Set<string>();
  classList = {
    add: (s: string) => this.classes.add(s), remove: (s: string) => this.classes.delete(s),
    toggle: (s: string, on: boolean) => on ? this.classes.add(s) : this.classes.delete(s),
  };
  setAttribute(k: string, v: string) { this.attributes.set(k, v); }
  setPointerCapture(id: number) { this.captures.add(id); }
  hasPointerCapture(id: number) { return this.captures.has(id); }
  releasePointerCapture(id: number) { this.captures.delete(id); emit(this, 'lostpointercapture', { pointerId: id }); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 144, height: 144 }; }
  querySelectorAll() { return [els['touch-jump'], els['touch-fire']]; }
}
function emit(target: EventTarget, type: string, values = {}) {
  target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), values));
}
const els: Record<string, Element> = {};
for (const id of ['touch-controls', 'touch-toggle', 'touch-pad', 'touch-thumb', 'touch-restart', 'touch-mute', 'touch-jump', 'touch-fire']) els[id] = new Element();
els['touch-jump'].dataset.touchAction = 'jump'; els['touch-fire'].dataset.touchAction = 'fire';
const media = Object.assign(new EventTarget(), { matches: true });
const win = Object.assign(new EventTarget(), { matchMedia: () => media });
const doc = Object.assign(new EventTarget(), { hidden: false, body: new Element(), getElementById: (id: string) => els[id] });
Object.assign(globalThis, { window: win, document: doc });
const input = new Input(win as unknown as Window);
let resizes = 0;
new TouchControls(input, () => resizes++);
let failures = 0;
function check(ok: boolean, message: string) { if (!ok) { failures++; console.error('FAIL:', message); } else console.log('ok  :', message); }
function pointer(id: string, type: string, pointerId: number, clientX = 72, clientY = 72) {
  emit(els[id], type, { pointerId, clientX, clientY, button: 0 });
}
check(input.touchEnabled && !els['touch-controls'].hidden, 'przyciski włączają się automatycznie na ekranie dotykowym');
check(touchDirections(0, 0).length === 0 && touchDirections(.1, -.1).length === 0, 'martwa strefa pada zapobiega przypadkowemu ruchowi');
check(touchDirections(1, -1).join() === 'right,up', 'narożnik pada pozwala celować po skosie');
pointer('touch-pad', 'pointerdown', 1, 140, 10);
pointer('touch-fire', 'pointerdown', 2);
pointer('touch-jump', 'pointerdown', 3);
input.update();
check(input.held('right') && input.held('up') && input.held('fire') && input.justPressed('jump'), 'trzy palce jednocześnie: ruch, celowanie, ogień i skok');
input.update(); check(!input.justPressed('jump'), 'przytrzymanie skoku nie wywołuje drugiego odbicia');
pointer('touch-jump', 'pointerup', 3); input.update();
check(input.held('right') && input.held('fire') && !input.held('jump'), 'puszczenie skoku zachowuje pozostałe palce');
pointer('touch-jump', 'pointerdown', 4); pointer('touch-jump', 'pointerup', 4); input.update();
check(input.justPressed('jump'), 'krótkie drugie dotknięcie pomiędzy klatkami uruchamia podwójny skok');
input.update(); check(!input.held('jump'), 'krótkie dotknięcie nie pozostaje wciśnięte');
pointer('touch-pad', 'pointermove', 1, 0, 140); input.update();
check(input.held('left') && input.held('down') && !input.held('right') && !input.held('up'), 'przesunięcie palca zmienia kierunek bez podnoszenia');
pointer('touch-fire', 'pointerdown', 5); pointer('touch-fire', 'pointerup', 2); input.update();
check(input.held('fire'), 'puszczenie jednego z dwóch palców na ogniu zachowuje strzelanie');
pointer('touch-fire', 'pointercancel', 5); input.update();
check(!input.held('fire') && input.held('left'), 'anulowanie dotyku zwalnia tylko właściwy przycisk');
pointer('touch-jump', 'pointerdown', 6); pointer('touch-jump', 'pointercancel', 6); input.update();
check(!input.held('jump'), 'anulowany gest nie zostawia zbuforowanego skoku');
pointer('touch-pad', 'lostpointercapture', 1); input.update();
check(input.axisX === 0 && input.axisY === 0, 'utrata przechwycenia nie blokuje kierunku');
emit(win, 'keydown', { code: 'KeyD' }); pointer('touch-pad', 'pointerdown', 7, 140, 72); input.update();
pointer('touch-pad', 'pointerup', 7); input.update();
check(input.held('right'), 'zwolnienie dotyku nie wyłącza wciśniętej klawiatury');
emit(win, 'keyup', { code: 'KeyD' });
pointer('touch-fire', 'pointerdown', 8); emit(win, 'blur'); input.update();
check(!input.held('fire') && els['touch-fire'].captures.size === 0, 'utrata fokusu zwalnia ogień i pointer capture');
pointer('touch-jump', 'pointerdown', 9); doc.hidden = true; emit(doc, 'visibilitychange'); input.update();
check(!input.held('jump'), 'przejście do innej aplikacji czyści dotyk');
doc.hidden = false;
pointer('touch-pad', 'pointerdown', 10, 140, 72); emit(win, 'resize'); input.update();
check(input.axisX === 0, 'obrót telefonu zwalnia pad');
pointer('touch-fire', 'pointerdown', 11); emit(els['touch-toggle'], 'click'); input.update();
check(!input.touchEnabled && els['touch-controls'].hidden && !input.held('fire') && resizes === 2, 'ukrycie panelu zwalnia dotyk i przelicza planszę');
emit(els['touch-restart'], 'click'); input.update();
check(input.justPressed('restart'), 'przycisk ponownej gry wysyła restart');
console.log(failures ? `TOUCH TEST: ${failures} błędów` : 'TOUCH TEST OK');
process.exitCode = failures ? 1 : 0;
