/**
 * Komponent zdrowia z i-frames. Używany przez gracza, wrogów i bossa.
 * Callbacki zamiast dziedziczenia – łatwo podpiąć UI/efekty.
 */
export class HealthComponent {
  current: number;
  private invulnTimer = 0;
  onDamaged?: (amount: number, hp: HealthComponent) => void;
  onDeath?: (hp: HealthComponent) => void;

  constructor(public max: number, public invulnDuration = 0) {
    this.current = max;
  }

  get fraction(): number { return Math.max(0, this.current / this.max); }
  get isDead(): boolean { return this.current <= 0; }
  get isInvulnerable(): boolean { return this.invulnTimer > 0; }
  get invulnRemaining(): number { return this.invulnTimer; }

  update(dt: number): void {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
  }

  /** @returns true, jeśli obrażenia zostały przyjęte. */
  takeDamage(amount: number): boolean {
    if (this.isDead || this.isInvulnerable || amount <= 0) return false;
    this.current = Math.max(0, this.current - amount);
    this.invulnTimer = this.invulnDuration;
    this.onDamaged?.(amount, this);
    if (this.isDead) this.onDeath?.(this);
    return true;
  }

  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }

  reset(): void {
    this.current = this.max;
    this.invulnTimer = 0;
  }
}
