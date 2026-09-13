import { Camera } from '../core/Camera';
import { CONFIG } from '../core/Config';
import { EventBus } from '../core/EventBus';
import type { Input } from '../core/Input';
import { normalize } from '../core/MathUtil';
import { Sfx } from '../render/Audio';
import { ParticleSystem } from '../render/Particles';
import { Level, Tile, type Marker } from '../world/Level';
import { TEST_LEVEL } from '../world/TestLevel';
import { BulletPool } from '../entities/weapons/Bullet';
import { PlayerController } from '../entities/player/PlayerController';
import type { EnemyBase } from '../entities/enemies/EnemyBase';
import { Runner } from '../entities/enemies/Runner';
import { Sniper } from '../entities/enemies/Sniper';
import { Drone } from '../entities/enemies/Drone';
import { TurbineBoss } from '../entities/boss/TurbineBoss';
import { HUD } from '../ui/HUD';
import type { GameEvents, WorldContext } from './WorldContext';

type GameState = 'playing' | 'gameover' | 'victory';

interface RunnerWave { marker: Marker; remaining: number; timer: number }

/**
 * Główna scena: łączy poziom, kamerę, gracza, wrogów, pociski, bossa i HUD.
 * Implementuje WorldContext udostępniany encjom.
 */
export class GameScene implements WorldContext {
  readonly level = new Level(TEST_LEVEL);
  readonly camera = new Camera();
  readonly player: PlayerController;
  readonly playerBullets = new BulletPool(CONFIG.bullets.playerPoolSize);
  readonly enemyBullets = new BulletPool(CONFIG.bullets.enemyPoolSize);
  readonly particles = new ParticleSystem();
  readonly events = new EventBus<GameEvents>();
  readonly hud = new HUD();
  time = 0;
  score = 0;
  state: GameState = 'playing';

  private enemies: EnemyBase[] = [];
  private boss: TurbineBoss | null = null;
  private pendingMarkers: Marker[];
  private runnerWaves: RunnerWave[] = [];
  private arenaX: number;
  private bossTriggered = false;
  private endTimer = 0;

  constructor(private input: Input) {
    const start = this.level.findMarker('player') ?? { x: 32, y: 160 };
    this.player = new PlayerController(input, start.x, start.y + CONFIG.view.tile - CONFIG.player.standHeight);
    this.camera.maxX = this.level.widthPx - this.camera.width;
    this.arenaX = this.level.findMarker('bossArena')?.x ?? this.camera.maxX;
    this.pendingMarkers = this.level.markers.filter((m) => m.type === 'sniper' || m.type === 'drone' || m.type === 'runnerSpawner');

    this.events.on('boss:phase', ({ from, to }) => {
      if (from >= 0) this.hud.showBanner(`FAZA ${to + 1}${to === 2 ? ' – ENRAGE!' : ''}`);
    });
    this.events.on('boss:died', () => { this.state = 'victory'; this.endTimer = 0; Sfx.play('victory'); });
    this.events.on('player:died', () => { this.state = 'gameover'; this.endTimer = 0; });
  }

  // ---- WorldContext ------------------------------------------------------
  addScore(points: number): void {
    this.score += points;
    this.events.emit('score', { total: this.score, delta: points });
  }

  spawnEnemy(enemy: EnemyBase): void { this.enemies.push(enemy); }

  fireEnemyBullet(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number, opts: { gravity?: number; radius?: number; color?: string } = {}): void {
    const d = normalize(dirX, dirY);
    this.enemyBullets.spawn({
      owner: 'enemy', x, y, vx: d.x * speed, vy: d.y * speed, damage,
      radius: opts.radius ?? CONFIG.bullets.enemyRadius, life: 4, gravity: opts.gravity, hitsTerrain: false, color: opts.color,
    });
  }

  // ---- Update ------------------------------------------------------------
  update(dt: number): void {
    this.time += dt;
    this.hud.update(dt);

    if (this.state !== 'playing') {
      this.endTimer += dt;
      this.particles.update(dt);
      if (this.state === 'gameover') this.enemyBullets.update(dt, this);
      return;
    }

    this.player.update(dt, this);
    this.camera.follow(this.player.cx, dt);
    this.updateBossArena();
    this.processSpawns(dt);

    for (const e of this.enemies) e.update(dt, this);
    this.boss?.update(dt, this);

    this.playerBullets.update(dt, this);
    this.enemyBullets.update(dt, this);
    this.particles.update(dt);

    this.resolveCollisions();
    this.enemies = this.enemies.filter((e) => e.alive);
    if (this.boss && !this.boss.alive) this.boss = null;
  }

  /** Wejście do areny: blokada kamery, spawn bossa. */
  private updateBossArena(): void {
    if (this.bossTriggered) return;
    if (this.player.x >= this.arenaX + 24 && this.camera.x >= this.arenaX - 0.5) {
      this.bossTriggered = true;
      this.camera.lock(this.arenaX);
      const bm = this.level.findMarker('boss');
      const floorY = this.findFloorY(bm ? bm.col : Math.floor((this.arenaX + 200) / this.level.tileSize));
      this.boss = new TurbineBoss(this.arenaX, floorY);
      this.events.emit('boss:spawned', { name: CONFIG.boss.name });
      this.hud.showBanner(CONFIG.boss.name, 2.2);
      // wrogowie z poprzedniej sekcji nie wchodzą do areny
      this.enemies = this.enemies.filter((e) => e.x > this.arenaX);
    }
  }

  private findFloorY(col: number): number {
    for (let r = 0; r < this.level.rows; r++) {
      if (this.level.tileAt(col, r) === Tile.Solid) return r * this.level.tileSize;
    }
    return this.level.heightPx;
  }

  /** Aktywacja markerów, gdy prawa krawędź kamery je mija; fale biegaczy. */
  private processSpawns(dt: number): void {
    const camRight = this.camera.right;
    const activate = this.pendingMarkers.filter((m) => m.x < camRight + 8);
    if (activate.length) {
      this.pendingMarkers = this.pendingMarkers.filter((m) => !activate.includes(m));
      for (const m of activate) {
        switch (m.type) {
          case 'sniper': this.spawnEnemy(new Sniper(m.x, m.y)); break;
          case 'drone': this.spawnEnemy(new Drone(m.x, m.y)); break;
          case 'runnerSpawner':
            this.runnerWaves.push({ marker: m, remaining: CONFIG.enemies.runner.waveCount, timer: 0 });
            break;
        }
      }
    }

    if (this.camera.locked) { this.runnerWaves = []; return; }
    for (const wave of this.runnerWaves) {
      wave.timer -= dt;
      if (wave.timer <= 0 && wave.remaining > 0) {
        wave.remaining--;
        wave.timer = CONFIG.enemies.runner.waveInterval;
        const x = Math.max(wave.marker.x, this.camera.right + 8);
        this.spawnEnemy(new Runner(x, wave.marker.y));
      }
    }
    this.runnerWaves = this.runnerWaves.filter((w) => w.remaining > 0);
  }

  private resolveCollisions(): void {
    const player = this.player;

    // pociski gracza → wrogowie / boss
    this.playerBullets.forEachActive((b) => {
      for (const e of this.enemies) {
        if (e.alive && e.overlapsCircle(b.x, b.y, b.radius)) {
          e.takeHit(b.damage, this);
          this.particles.emit({ x: b.x, y: b.y, count: 3, color: '#fff', speed: [20, 60], life: [0.08, 0.16] });
          b.active = false;
          return;
        }
      }
      if (this.boss && this.boss.alive && this.boss.overlapsCircle(b.x, b.y, b.radius)) {
        if (this.boss.vulnerable) {
          this.boss.takeHit(b.damage, this);
          this.particles.emit({ x: b.x, y: b.y, count: 3, color: '#fff', speed: [20, 60], life: [0.08, 0.16] });
        } else {
          this.particles.emit({ x: b.x, y: b.y, count: 2, color: '#7f8c8d', speed: [10, 30], life: [0.1, 0.2] });
        }
        b.active = false;
      }
    });

    if (player.isDead) return;

    // pociski wrogów → gracz
    this.enemyBullets.forEachActive((b) => {
      if (player.overlapsCircle(b.x, b.y, b.radius)) {
        if (player.takeDamage(b.damage, b.x, this)) b.active = false;
      }
    });

    // kontakt z wrogami / bossem
    for (const e of this.enemies) if (e.alive && e.overlaps(player)) e.onTouchPlayer(this);
    if (this.boss && this.boss.alive && !this.boss.isIntro && this.boss.overlaps(player)) this.boss.onTouchPlayer(this);
  }

  // ---- Render ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    // tło – gradient + "wieże" w oddali (parallax placeholder)
    ctx.fillStyle = '#141826';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1e2438';
    const par = (this.camera.x * 0.3) % 64;
    for (let x = -par; x < W + 64; x += 64) {
      ctx.fillRect(Math.round(x), 120, 20, 90);
      ctx.fillRect(Math.round(x) + 34, 150, 12, 60);
    }

    ctx.save();
    this.camera.applyTransform(ctx);
    this.level.draw(ctx, this.camera.x, this.camera.width);
    for (const e of this.enemies) e.draw(ctx);
    this.boss?.draw(ctx);
    this.player.draw(ctx);
    this.playerBullets.draw(ctx);
    this.enemyBullets.draw(ctx);
    this.particles.draw(ctx);
    ctx.restore();

    this.hud.draw(ctx, this.player, this.score, this.boss, this.time);
    if (this.time < 6) this.hud.drawHint(ctx, Math.min(1, 6 - this.time), this.input.gamepadConnected);

    const again = this.input.gamepadConnected ? 'START – jeszcze raz' : 'R – jeszcze raz';
    if (this.state === 'gameover') this.hud.drawOverlay(ctx, 'GAME OVER', again, '#e74c3c');
    if (this.state === 'victory') this.hud.drawOverlay(ctx, 'ETAP UKOŃCZONY', `SCORE ${this.score}   ·   ${again}`, '#2ecc71');
  }

  get wantsRestart(): boolean {
    return this.state !== 'playing' && this.endTimer > 0.6 && this.input.justPressed('restart');
  }
}
