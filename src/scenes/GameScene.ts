import { Camera } from '../core/Camera';
import { CONFIG } from '../core/Config';
import { EventBus } from '../core/EventBus';
import type { Input } from '../core/Input';
import { normalize } from '../core/MathUtil';
import { Sfx } from '../render/Audio';
import { Jukebox } from '../audio/Jukebox';
import { AudioEngine } from '../audio/AudioEngine';
import { ParticleSystem } from '../render/Particles';
import { FxSystem } from '../render/Fx';
import { Parallax } from '../render/Parallax';
import { TileRenderer } from '../render/TileRenderer';
import { Images, Sheets } from '../assets/AssetLoader';
import { impactSparks } from '../entities/weapons/Bullet';
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
  readonly fx = new FxSystem();
  readonly events = new EventBus<GameEvents>();
  private parallax: Parallax | null = null;
  private tiles: TileRenderer | null = null;
  readonly hud = new HUD();
  time = 0;
  score = 0;
  state: GameState = 'playing';

  private enemies: EnemyBase[] = [];
  /** Pool martwych instancji per rodzaj – respawn bez alokacji. */
  private enemyPool = new Map<string, EnemyBase[]>();
  private boss: TurbineBoss | null = null;
  private pendingMarkers: Marker[];
  private runnerWaves: RunnerWave[] = [];
  private arenaX: number;
  private bossTriggered = false;
  private endTimer = 0;
  private debug = false;

  constructor(private input: Input) {
    const start = this.level.findMarker('player') ?? { x: 32, y: 160 };
    this.player = new PlayerController(input, start.x, start.y + CONFIG.view.tile - CONFIG.player.standHeight);
    this.camera.maxX = this.level.widthPx - this.camera.width;
    this.arenaX = this.level.findMarker('bossArena')?.x ?? this.camera.maxX;
    this.pendingMarkers = this.level.markers.filter((m) => m.type === 'sniper' || m.type === 'drone' || m.type === 'runnerSpawner');
    this.setupRendering();

    this.events.on('boss:phase', ({ from, to }) => {
      if (from >= 0) this.hud.showBanner(`FAZA ${to + 1}${to === 2 ? ' – ENRAGE!' : ''}`);
    });
    this.events.on('boss:spawned', () => Jukebox.play('boss'));
    this.events.on('boss:died', () => { this.state = 'victory'; this.endTimer = 0; Sfx.stopAllLoops(); Jukebox.play('victory'); });
    this.events.on('player:died', () => { this.state = 'gameover'; this.endTimer = 0; Sfx.stopAllLoops(); Jukebox.play('gameover'); });
    Jukebox.play('level');
  }

  /** Warstwy tła i tileset – tylko gdy zasoby są załadowane (headless test rysuje placeholdery). */
  private setupRendering(): void {
    const sky = Images.tryGet('sky'), mid = Images.tryGet('siteMid'), near = Images.tryGet('siteNear');
    if (sky && mid && near) {
      const H = CONFIG.view.height;
      const blades = Sheets.tryGet('skyBlades');
      this.parallax = new Parallax([
        { image: sky, scroll: 0.05, y: 0 },                                        // zachód słońca, pola, wieże turbin
        ...(blades ? [{ image: blades.image, sheet: blades, clip: 'spin', scroll: 0.05, y: 126 }] : []), // obracające się łopaty
        { image: mid, scroll: 0.3, y: H - 40 - mid.height },                        // żuraw gąsienicowy, sekcje masztów
        { image: near, scroll: 0.7, y: H - 30 - near.height },                      // kontenery, płoty, barierki
      ]);
    }
    if (Images.tryGet('tileset')) this.tiles = new TileRenderer(this.level);
  }

  // ---- WorldContext ------------------------------------------------------
  addScore(points: number): void {
    this.score += points;
    this.events.emit('score', { total: this.score, delta: points });
  }

  spawnEnemy(enemy: EnemyBase): void { this.enemies.push(enemy); }

  /** Pobiera instancję z poola (lub tworzy) i ustawia na pozycji. */
  private acquire(kind: 'runner' | 'sniper' | 'drone', x: number, y: number): EnemyBase {
    const pool = this.enemyPool.get(kind);
    const reused = pool?.pop();
    if (reused) { reused.reset(x, y); this.spawnEnemy(reused); return reused; }
    const e = kind === 'runner' ? new Runner(x, y) : kind === 'sniper' ? new Sniper(x, y) : new Drone(x, y);
    this.spawnEnemy(e);
    return e;
  }

  private recycleDead(): void {
    const alive: EnemyBase[] = [];
    for (const e of this.enemies) {
      if (e.alive) { alive.push(e); continue; }
      if (e.kind === 'runner' || e.kind === 'sniper' || e.kind === 'drone') {
        const pool = this.enemyPool.get(e.kind) ?? [];
        if (pool.length < 16) pool.push(e);
        this.enemyPool.set(e.kind, pool);
      }
    }
    this.enemies = alive;
  }

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

    this.camera.update(dt);
    if (this.input.justPressed('mute')) { AudioEngine.toggleMute(); Sfx.play('ui'); }
    if (this.input.justPressed('debug')) this.debug = !this.debug;
    if (this.state !== 'playing') {
      this.endTimer += dt;
      this.particles.update(dt);
      this.fx.update(dt);
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
    this.fx.update(dt);

    this.resolveCollisions();
    this.recycleDead();
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
      // wrogowie z poprzedniej sekcji nie wchodzą do areny (biegacze spawnują się za prawą krawędzią,
      // czyli już w arenie – usuwamy ich wszystkich)
      this.enemies = this.enemies.filter((e) => e.kind !== 'runner' && e.x > this.arenaX);
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
          case 'sniper': this.acquire('sniper', m.x, m.y); break;
          case 'drone': this.acquire('drone', m.x, m.y); break;
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
        this.acquire('runner', x, wave.marker.y);
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
          impactSparks(this, b.x, b.y, b.vx, b.vy);
          b.active = false;
          return;
        }
      }
      if (this.boss && this.boss.alive && this.boss.overlapsCircle(b.x, b.y, b.radius)) {
        if (this.boss.vulnerable) this.boss.takeHit(b.damage, this);
        impactSparks(this, b.x, b.y, b.vx, b.vy);
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
  draw(ctx: CanvasRenderingContext2D, fps = 0): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    if (this.parallax) {
      this.parallax.draw(ctx, this.camera.x, this.time);
      // delikatna mgiełka poranna – lekko odsuwa tło od planu gry
      ctx.fillStyle = 'rgba(230,236,245,0.12)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#141826';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    this.camera.applyTransform(ctx);
    if (this.tiles) {
      this.tiles.draw(ctx, this.camera.x, this.camera.width);
    } else {
      this.level.draw(ctx, this.camera.x, this.camera.width);
    }
    for (const e of this.enemies) e.draw(ctx);
    this.boss?.draw(ctx);
    this.player.draw(ctx);
    this.playerBullets.draw(ctx);
    this.enemyBullets.draw(ctx);
    this.fx.draw(ctx);
    this.particles.draw(ctx);
    ctx.restore();

    this.hud.draw(ctx, this.player, this.score, this.boss, this.time);
    this.hud.drawAudioState(ctx, AudioEngine.muted, AudioEngine.running || !AudioEngine.available);
    if (this.time < 6) this.hud.drawHint(ctx, Math.min(1, 6 - this.time), this.input.gamepadConnected);

    if (this.debug) {
      let pb = 0, eb = 0; this.playerBullets.forEachActive(() => pb++); this.enemyBullets.forEachActive(() => eb++);
      ctx.save(); ctx.font = '8px monospace'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(4, 40, 120, 30);
      ctx.fillStyle = '#7fff7f';
      ctx.fillText(`FPS ${fps.toFixed(0)}  cam ${this.camera.x.toFixed(0)}`, 6, 42);
      ctx.fillText(`enemies ${this.enemies.length} pool ${[...this.enemyPool.values()].reduce((a, p) => a + p.length, 0)}`, 6, 51);
      ctx.fillText(`bullets ${pb}/${eb}  x ${this.player.x.toFixed(0)}`, 6, 60);
      ctx.restore();
    }

    const again = this.input.gamepadConnected ? 'START – jeszcze raz' : 'R – jeszcze raz';
    if (this.state === 'gameover') this.hud.drawOverlay(ctx, 'GAME OVER', again, '#e74c3c');
    if (this.state === 'victory') this.hud.drawOverlay(ctx, 'ETAP UKOŃCZONY', `SCORE ${this.score}   ·   ${again}`, '#2ecc71');
  }

  get wantsRestart(): boolean {
    return this.state !== 'playing' && this.endTimer > 0.6 && this.input.justPressed('restart');
  }
}
