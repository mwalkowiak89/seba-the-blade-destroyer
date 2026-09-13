/**
 * Generyczny object pool o stałym rozmiarze.
 * Obiekty muszą mieć flagę `active`. `spawn()` zwraca pierwszy nieaktywny obiekt (lub null).
 */
export interface Poolable { active: boolean }

export class Pool<T extends Poolable> {
  readonly items: T[];
  private cursor = 0;

  constructor(size: number, factory: () => T) {
    this.items = Array.from({ length: size }, factory);
  }

  spawn(): T | null {
    const n = this.items.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.cursor + i) % n;
      const item = this.items[idx];
      if (!item.active) {
        this.cursor = (idx + 1) % n;
        item.active = true;
        return item;
      }
    }
    return null;
  }

  forEachActive(fn: (item: T) => void): void {
    for (const item of this.items) if (item.active) fn(item);
  }

  clear(): void {
    for (const item of this.items) item.active = false;
  }
}
