"use strict";
(() => {
  // src/core/Config.ts
  var CONFIG = {
    view: {
      width: 320,
      height: 240,
      tile: 16,
      fixedStep: 1 / 60,
      maxStepsPerFrame: 5
    },
    physics: {
      gravity: 1300,
      maxFallSpeed: 460
    },
    camera: {
      /** Gracz utrzymywany w tej części ekranu (0..1) podczas biegu w prawo. */
      followFraction: 0.4,
      /** Współczynnik wygładzania (większy = szybciej dogania). */
      smoothing: 10
    },
    player: {
      width: 12,
      standHeight: 28,
      crouchHeight: 14,
      runSpeed: 105,
      /** Skok o stałej wysokości (bez zmiennej wysokości – jak w Contrze). */
      jumpVelocity: -430,
      /** Liczba pełnych obrotów koziołka w trakcie jednego skoku. */
      somersaultTurns: 1,
      somersaultDuration: 0.66,
      maxHp: 100,
      /** Okno nietykalności po trafieniu (s). */
      invulnTime: 1.2,
      /** Czas bez kontroli po trafieniu (s). */
      hurtTime: 0.28,
      hurtKnockbackX: 110,
      hurtKnockbackY: -200,
      pitDamage: 30,
      /** Czas ignorowania platform jednokierunkowych po zeskoku (s). */
      dropThroughTime: 0.22,
      /** Częstotliwość migania sprite'a w i-frames (Hz). */
      flashHz: 14
    },
    weapons: {
      makita: {
        name: "Makita DIY",
        fireInterval: 0.085,
        bulletSpeed: 400,
        damage: 10,
        bulletRadius: 2,
        lifetime: 1,
        /** Rozrzut w stopniach (0 = laserowo prosto). */
        spreadDeg: 1.5
      }
    },
    bullets: {
      playerPoolSize: 48,
      enemyPoolSize: 96,
      enemyRadius: 3
    },
    enemies: {
      runner: {
        width: 12,
        height: 24,
        speed: 72,
        jumpVelocity: -340,
        hp: 20,
        contactDamage: 15,
        score: 100,
        waveCount: 3,
        waveInterval: 0.8,
        /** Dystans (px) przed wrogiem, na jakim sprawdza przeszkodę do przeskoczenia. */
        obstacleLookahead: 10
      },
      sniper: {
        width: 14,
        height: 24,
        hp: 30,
        fireInterval: 2.4,
        aimTime: 0.7,
        bulletSpeed: 160,
        bulletDamage: 15,
        range: 300,
        contactDamage: 10,
        score: 200
      },
      drone: {
        width: 16,
        height: 10,
        hp: 20,
        patrolSpeed: 55,
        patrolRange: 72,
        waveAmplitude: 22,
        waveFrequency: 1.1,
        attackInterval: 2.2,
        bombSpeed: 150,
        bombDamage: 15,
        chargeSpeed: 230,
        chargeTime: 0.55,
        contactDamage: 10,
        score: 150,
        /** Gracz pod dronem w tym zakresie X → zrzut ładunku, inaczej szarża. */
        bombWindowX: 28
      }
    },
    boss: {
      name: "SKRZYD\u0141O TURBINY",
      width: 28,
      height: 96,
      hp: 900,
      contactDamage: 20,
      score: 5e3,
      bulletDamage: 12,
      /** Progi HP (ułamek) – przejście w fazę n następuje gdy HP <= próg. */
      phaseThresholds: [1, 0.66, 0.33],
      /** Pozycja hover względem lewej krawędzi areny. */
      hoverOffsetX: 320 - 56,
      hoverCenterY: 110,
      hoverAmplitude: 52,
      phase1: {
        hoverHz: 0.35,
        attackCooldown: 1.6,
        burstCount: 3,
        burstInterval: 0.16,
        bulletSpeed: 140
      },
      phase2: {
        hoverHz: 0.65,
        attackCooldown: 1.1,
        burstCount: 4,
        burstInterval: 0.14,
        bulletSpeed: 165,
        sweepTelegraph: 0.5,
        sweepSpeed: 230,
        sweepHeight: 18
      },
      phase3: {
        hoverHz: 1,
        attackCooldown: 0.75,
        fanCount: 5,
        fanSpreadDeg: 56,
        bulletSpeed: 180,
        chargeTelegraph: 0.45,
        chargeSpeed: 420,
        chargeRest: 0.35,
        smokeRate: 30
      }
    }
  };

  // src/core/Input.ts
  var KEY_BINDINGS = {
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    up: ["ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    jump: ["KeyZ", "KeyK", "Space"],
    fire: ["KeyX", "KeyJ"],
    restart: ["KeyR", "Enter"]
  };
  var GAMEPAD_BINDINGS = {
    left: [14],
    right: [15],
    up: [12],
    down: [13],
    jump: [0],
    fire: [1, 2, 7],
    restart: [9]
  };
  var GAMEPAD_DEADZONE = 0.45;
  var Input = class {
    constructor(target = window) {
      this.down = /* @__PURE__ */ new Set();
      this.pressedThisFrame = /* @__PURE__ */ new Set();
      this.prevActions = /* @__PURE__ */ new Set();
      this.curActions = /* @__PURE__ */ new Set();
      /** Czy w tym kroku którakolwiek akcja pochodzi z pada (do podpowiedzi w UI). */
      this.gamepadActive = false;
      this.gamepadConnected = false;
      target.addEventListener("keydown", (e) => {
        const ev = e;
        if (this.isBound(ev.code)) ev.preventDefault();
        if (!this.down.has(ev.code)) this.pressedThisFrame.add(ev.code);
        this.down.add(ev.code);
      });
      target.addEventListener("keyup", (e) => this.down.delete(e.code));
      window.addEventListener("blur", () => this.down.clear());
      window.addEventListener("gamepadconnected", () => {
        this.gamepadConnected = true;
      });
      window.addEventListener("gamepaddisconnected", () => {
        this.gamepadConnected = this.firstGamepad() !== null;
      });
    }
    isBound(code) {
      return Object.values(KEY_BINDINGS).some((codes) => codes.includes(code));
    }
    /** Pierwszy podłączony pad (Chrome wymaga wcześniejszego naciśnięcia przycisku). */
    firstGamepad() {
      if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return null;
      for (const gp of navigator.getGamepads()) if (gp && gp.connected) return gp;
      return null;
    }
    readGamepad(into) {
      const gp = this.firstGamepad();
      this.gamepadActive = false;
      if (!gp) return;
      this.gamepadConnected = true;
      for (const action of Object.keys(GAMEPAD_BINDINGS)) {
        if (GAMEPAD_BINDINGS[action].some((i) => gp.buttons[i]?.pressed)) into.add(action);
      }
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (ax < -GAMEPAD_DEADZONE) into.add("left");
      if (ax > GAMEPAD_DEADZONE) into.add("right");
      if (ay < -GAMEPAD_DEADZONE) into.add("up");
      if (ay > GAMEPAD_DEADZONE) into.add("down");
      this.gamepadActive = into.size > 0;
    }
    /** Wywoływać raz na krok symulacji – zamraża stan akcji na ten krok. */
    update() {
      this.prevActions = this.curActions;
      this.curActions = /* @__PURE__ */ new Set();
      for (const action of Object.keys(KEY_BINDINGS)) {
        if (KEY_BINDINGS[action].some((c) => this.down.has(c) || this.pressedThisFrame.has(c))) {
          this.curActions.add(action);
        }
      }
      this.pressedThisFrame.clear();
      this.readGamepad(this.curActions);
    }
    held(action) {
      return this.curActions.has(action);
    }
    justPressed(action) {
      return this.curActions.has(action) && !this.prevActions.has(action);
    }
    /** -1, 0, 1 */
    get axisX() {
      return (this.held("right") ? 1 : 0) - (this.held("left") ? 1 : 0);
    }
    get axisY() {
      return (this.held("down") ? 1 : 0) - (this.held("up") ? 1 : 0);
    }
  };

  // src/core/Camera.ts
  var Camera = class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.width = CONFIG.view.width;
      this.height = CONFIG.view.height;
      /** Maksymalne x (szerokość poziomu - szerokość ekranu). */
      this.maxX = Infinity;
      this.locked = false;
    }
    get right() {
      return this.x + this.width;
    }
    follow(targetX, dt) {
      if (this.locked) return;
      const desired = targetX - this.width * CONFIG.camera.followFraction;
      if (desired > this.x) {
        const t = 1 - Math.exp(-CONFIG.camera.smoothing * dt);
        this.x += (desired - this.x) * t;
        if (desired - this.x < 0.05) this.x = desired;
      }
      if (this.x > this.maxX) this.x = this.maxX;
    }
    lock(x) {
      this.x = x;
      this.locked = true;
    }
    /** Czy prostokąt jest widoczny (z marginesem). */
    isVisible(x, y, w, h, margin = 0) {
      return x + w > this.x - margin && x < this.right + margin && y + h > this.y - margin && y < this.y + this.height + margin;
    }
    applyTransform(ctx) {
      ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }
  };

  // src/core/EventBus.ts
  var EventBus = class {
    constructor() {
      this.handlers = {};
    }
    on(event, handler) {
      var _a;
      ((_a = this.handlers)[event] ?? (_a[event] = [])).push(handler);
      return () => this.off(event, handler);
    }
    off(event, handler) {
      const list = this.handlers[event];
      if (!list) return;
      const i = list.indexOf(handler);
      if (i >= 0) list.splice(i, 1);
    }
    emit(event, payload) {
      this.handlers[event]?.forEach((h) => h(payload));
    }
  };

  // src/core/MathUtil.ts
  var clamp = (v, min, max) => v < min ? min : v > max ? max : v;
  var degToRad = (d) => d * Math.PI / 180;
  var randRange = (min, max) => min + Math.random() * (max - min);
  function normalize(x, y) {
    const len = Math.hypot(x, y);
    return len === 0 ? { x: 0, y: 0 } : { x: x / len, y: y / len };
  }
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // src/render/Audio.ts
  var _Sfx = class _Sfx {
    static register(name, url) {
      const a = new Audio(url);
      a.preload = "auto";
      _Sfx.sources.set(name, a);
    }
    static play(name) {
      if (!_Sfx.enabled) return;
      const src = _Sfx.sources.get(name);
      if (!src) return;
      const inst = src.cloneNode();
      inst.volume = _Sfx.volume;
      void inst.play().catch(() => {
      });
    }
  };
  _Sfx.sources = /* @__PURE__ */ new Map();
  _Sfx.volume = 0.6;
  _Sfx.enabled = true;
  var Sfx = _Sfx;

  // src/core/Pool.ts
  var Pool = class {
    constructor(size, factory) {
      this.cursor = 0;
      this.items = Array.from({ length: size }, factory);
    }
    spawn() {
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
    forEachActive(fn) {
      for (const item of this.items) if (item.active) fn(item);
    }
    clear() {
      for (const item of this.items) item.active = false;
    }
  };

  // src/render/Particles.ts
  var Particle = class {
    constructor() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.life = 0;
      this.maxLife = 0;
      this.size = 2;
      this.color = "#fff";
      this.gravity = 0;
    }
  };
  var ParticleSystem = class {
    constructor() {
      this.pool = new Pool(256, () => new Particle());
    }
    emit(opts) {
      for (let i = 0; i < opts.count; i++) {
        const p = this.pool.spawn();
        if (!p) return;
        const [a0, a1] = opts.angle ?? [0, Math.PI * 2];
        const ang = randRange(a0, a1);
        const spd = randRange(...opts.speed ?? [20, 80]);
        p.x = opts.x + randRange(-(opts.spreadX ?? 0), opts.spreadX ?? 0);
        p.y = opts.y + randRange(-(opts.spreadY ?? 0), opts.spreadY ?? 0);
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd;
        p.maxLife = p.life = randRange(...opts.life ?? [0.2, 0.5]);
        p.size = randRange(...opts.size ?? [1, 3]);
        p.gravity = opts.gravity ?? 0;
        const c = opts.color ?? "#ffffff";
        p.color = Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c;
      }
    }
    update(dt) {
      this.pool.forEachActive((p) => {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          return;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
    }
    draw(ctx) {
      this.pool.forEachActive((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      });
      ctx.globalAlpha = 1;
    }
    clear() {
      this.pool.clear();
    }
  };

  // src/world/Level.ts
  var TILE_CHARS = { "#": 1 /* Solid */, "=": 2 /* OneWay */ };
  var MARKER_CHARS = {
    P: "player",
    S: "sniper",
    D: "drone",
    R: "runnerSpawner",
    B: "bossArena",
    X: "boss"
  };
  var Level = class {
    /**
     * @param screens tablica "ekranów" – każdy to 15 wierszy po 20 znaków; sklejane poziomo.
     */
    constructor(screens) {
      this.tileSize = CONFIG.view.tile;
      this.markers = [];
      const screenCols = CONFIG.view.width / this.tileSize;
      this.rows = CONFIG.view.height / this.tileSize;
      this.cols = screens.length * screenCols;
      this.widthPx = this.cols * this.tileSize;
      this.heightPx = this.rows * this.tileSize;
      this.tiles = new Uint8Array(this.cols * this.rows);
      screens.forEach((screen, si) => {
        if (screen.length !== this.rows) throw new Error(`Ekran ${si}: oczekiwano ${this.rows} wierszy, jest ${screen.length}`);
        screen.forEach((line, r) => {
          if (line.length !== screenCols) throw new Error(`Ekran ${si}, wiersz ${r}: oczekiwano ${screenCols} znak\xF3w, jest ${line.length}`);
          for (let c = 0; c < screenCols; c++) {
            const ch = line[c];
            const col = si * screenCols + c;
            const tile = TILE_CHARS[ch];
            if (tile !== void 0) this.tiles[r * this.cols + col] = tile;
            const marker = MARKER_CHARS[ch];
            if (marker) this.markers.push({ type: marker, col, row: r, x: col * this.tileSize, y: r * this.tileSize });
          }
        });
      });
    }
    tileAt(col, row) {
      if (col < 0 || col >= this.cols) return 1 /* Solid */;
      if (row < 0 || row >= this.rows) return 0 /* Empty */;
      return this.tiles[row * this.cols + col];
    }
    isSolidAtPx(px, py) {
      return this.tileAt(Math.floor(px / this.tileSize), Math.floor(py / this.tileSize)) === 1 /* Solid */;
    }
    findMarker(type) {
      return this.markers.find((m) => m.type === type);
    }
    draw(ctx, camX, camW) {
      const ts = this.tileSize;
      const c0 = Math.max(0, Math.floor(camX / ts));
      const c1 = Math.min(this.cols - 1, Math.ceil((camX + camW) / ts));
      for (let r = 0; r < this.rows; r++) {
        for (let c = c0; c <= c1; c++) {
          const t = this.tiles[r * this.cols + c];
          if (t === 1 /* Solid */) {
            ctx.fillStyle = "#4a4f5c";
            ctx.fillRect(c * ts, r * ts, ts, ts);
            ctx.fillStyle = "#5d6375";
            ctx.fillRect(c * ts + 1, r * ts + 1, ts - 2, ts - 2);
            ctx.fillStyle = "#2b2e37";
            ctx.fillRect(c * ts + 3, r * ts + 3, 2, 2);
          } else if (t === 2 /* OneWay */) {
            ctx.fillStyle = "#c9a227";
            ctx.fillRect(c * ts, r * ts, ts, 4);
            ctx.fillStyle = "#7a6118";
            ctx.fillRect(c * ts, r * ts + 4, ts, 2);
          }
        }
      }
    }
  };

  // src/world/TestLevel.ts
  var TEST_LEVEL = [
    // Ekran 0 – start, płasko
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "..P.................",
      "....................",
      "####################",
      "####################"
    ],
    // Ekran 1 – stopnie, platforma ze snajperem, pierwsza fala biegaczy
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "..........S.........",
      ".........====.......",
      "....................",
      "....................",
      "....##.............R",
      "....##.......###....",
      "####################",
      "####################"
    ],
    // Ekran 2 – szczelina z platformami jednokierunkowymi i dronem
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....D...............",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      ".....=====..=====...",
      "....................",
      "....................",
      "#####........#######",
      "#####........#######"
    ],
    // Ekran 3 – wieża ze snajperem, biegacze
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "..........S.........",
      ".........####.......",
      ".........####.......",
      "......===####.......",
      ".........####.......",
      ".........####......R",
      "####################",
      "####################"
    ],
    // Ekran 4 – wielopoziomowe platformy (test zeskoku), dron
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "..=====......=====..",
      "....................",
      "....................",
      "......======........",
      "....................",
      ".............D......",
      "..=====......=====..",
      "....................",
      "....................",
      "####################",
      "####################"
    ],
    // Ekran 5 – szczeliny i filary, biegacze
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...........#........",
      "......#....#......R.",
      "###...####.####..###",
      "###...####.####..###"
    ],
    // Ekran 6 – podejście do bossa: snajper wysoko, dron, biegacze
    [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "........S...........",
      ".......====.........",
      "....................",
      "...D................",
      "...====.......=====.",
      "....................",
      ".................R..",
      "####################",
      "####################"
    ],
    // Ekran 7 – arena bossa
    [
      "B...................",
      "....................",
      "....................",
      "....................",
      "..............X.....",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "####################",
      "####################"
    ]
  ];

  // src/entities/weapons/Bullet.ts
  var Bullet = class {
    constructor() {
      this.active = false;
      this.owner = "player";
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = 2;
      this.damage = 10;
      this.life = 0;
      this.gravity = 0;
      /** Czy pocisk znika po trafieniu w teren (pociski wrogów w Contrze przelatują przez teren). */
      this.hitsTerrain = true;
      this.color = "#fff";
    }
  };
  var BulletPool = class {
    constructor(size) {
      this.pool = new Pool(size, () => new Bullet());
    }
    spawn(s) {
      const b = this.pool.spawn();
      if (!b) return null;
      b.owner = s.owner;
      b.x = s.x;
      b.y = s.y;
      b.vx = s.vx;
      b.vy = s.vy;
      b.damage = s.damage;
      b.radius = s.radius ?? 2;
      b.life = s.life ?? 2;
      b.gravity = s.gravity ?? 0;
      b.hitsTerrain = s.hitsTerrain ?? s.owner === "player";
      b.color = s.color ?? (s.owner === "player" ? "#ffe36b" : "#ff6b6b");
      return b;
    }
    update(dt, world) {
      const cam = world.camera;
      this.pool.forEachActive((b) => {
        b.life -= dt;
        b.vy += b.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.life <= 0 || !cam.isVisible(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2, 24) || b.hitsTerrain && world.level.isSolidAtPx(b.x, b.y)) {
          if (b.hitsTerrain && b.life > 0) world.particles.emit({ x: b.x, y: b.y, count: 3, color: "#bbb", speed: [10, 40], life: [0.1, 0.25] });
          b.active = false;
        }
      });
    }
    forEachActive(fn) {
      this.pool.forEachActive(fn);
    }
    clear() {
      this.pool.clear();
    }
    draw(ctx) {
      this.pool.forEachActive((b) => {
        ctx.fillStyle = b.color;
        if (b.owner === "player") {
          const len = 5;
          const n = Math.hypot(b.vx, b.vy) || 1;
          const dx = b.vx / n * len, dy = b.vy / n * len;
          ctx.lineWidth = b.radius * 2;
          ctx.strokeStyle = b.color;
          ctx.beginPath();
          ctx.moveTo(b.x - dx, b.y - dy);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 1, 1);
        }
      });
    }
  };

  // src/render/Visual.ts
  var PlaceholderVisual = class {
    constructor(style) {
      this.style = style;
    }
    draw(ctx, p) {
      const s = this.style;
      const color = p.flash ? "#ffffff" : p.tint ?? s.color;
      const accent = p.flash ? "#ffffff" : s.accent ?? "#ffffff";
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      ctx.save();
      if (p.alpha !== void 0) ctx.globalAlpha = p.alpha;
      ctx.translate(Math.round(cx), Math.round(cy));
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillStyle = color;
      switch (s.shape ?? "rect") {
        case "circle":
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(p.w, p.h) / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "diamond":
          ctx.beginPath();
          ctx.moveTo(0, -p.h / 2);
          ctx.lineTo(p.w / 2, 0);
          ctx.lineTo(0, p.h / 2);
          ctx.lineTo(-p.w / 2, 0);
          ctx.closePath();
          ctx.fill();
          break;
        default:
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          if (s.outline) {
            ctx.strokeStyle = s.outline;
            ctx.lineWidth = 1;
            ctx.strokeRect(-p.w / 2 + 0.5, -p.h / 2 + 0.5, p.w - 1, p.h - 1);
          }
      }
      if (s.faceMarker !== false && !p.rotation) {
        ctx.fillStyle = accent;
        const mx = p.facing > 0 ? p.w / 2 - 4 : -p.w / 2 + 1;
        ctx.fillRect(mx, -p.h / 2 + 3, 3, 3);
      }
      if (s.barrel && p.aim && !p.rotation) {
        const len = s.barrelLength ?? 10;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -1);
        ctx.lineTo(p.aim.x * (p.w / 2 + len), -1 + p.aim.y * (p.h / 2 + len));
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // src/world/Physics.ts
  var EPS = 1e-3;
  function moveAndCollide(body, level, dx, dy, opts = {}) {
    const res = { onGround: false, onOneWay: false, hitWall: false, hitCeiling: false };
    const ts = level.tileSize;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (ts - 1)));
    const sx = dx / steps;
    const sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (sx !== 0) moveX(body, level, sx, res);
      if (sy !== 0) moveY(body, level, sy, res, opts);
    }
    if (dy >= 0 && !res.onGround) res.onGround = probeGround(body, level, opts);
    return res;
  }
  function moveX(b, level, dx, res) {
    const ts = level.tileSize;
    const newX = b.x + dx;
    const r0 = Math.floor(b.y / ts);
    const r1 = Math.floor((b.y + b.h - EPS) / ts);
    if (dx > 0) {
      const col = Math.floor((newX + b.w - EPS) / ts);
      for (let r = r0; r <= r1; r++) {
        if (level.tileAt(col, r) === 1 /* Solid */) {
          b.x = col * ts - b.w;
          b.vx = 0;
          res.hitWall = true;
          return;
        }
      }
    } else {
      const col = Math.floor(newX / ts);
      for (let r = r0; r <= r1; r++) {
        if (level.tileAt(col, r) === 1 /* Solid */) {
          b.x = (col + 1) * ts;
          b.vx = 0;
          res.hitWall = true;
          return;
        }
      }
    }
    b.x = newX;
  }
  function moveY(b, level, dy, res, opts) {
    const ts = level.tileSize;
    const newY = b.y + dy;
    const c0 = Math.floor(b.x / ts);
    const c1 = Math.floor((b.x + b.w - EPS) / ts);
    if (dy > 0) {
      const oldBottom = b.y + b.h;
      const newBottom = newY + b.h;
      const row = Math.floor((newBottom - EPS) / ts);
      for (let c = c0; c <= c1; c++) {
        const t = level.tileAt(c, row);
        if (t === 1 /* Solid */) {
          b.y = row * ts - b.h;
          b.vy = 0;
          res.onGround = true;
          return;
        }
        if (t === 2 /* OneWay */ && !opts.dropThrough) {
          const top = row * ts;
          if (oldBottom <= top + EPS && newBottom >= top) {
            b.y = top - b.h;
            b.vy = 0;
            res.onGround = true;
            res.onOneWay = true;
            return;
          }
        }
      }
    } else {
      const row = Math.floor(newY / ts);
      for (let c = c0; c <= c1; c++) {
        if (level.tileAt(c, row) === 1 /* Solid */) {
          b.y = (row + 1) * ts;
          b.vy = 0;
          res.hitCeiling = true;
          return;
        }
      }
    }
    b.y = newY;
  }
  function probeGround(b, level, opts = {}) {
    const ts = level.tileSize;
    const bottom = b.y + b.h;
    const row = Math.floor((bottom + 1) / ts);
    const c0 = Math.floor(b.x / ts);
    const c1 = Math.floor((b.x + b.w - EPS) / ts);
    for (let c = c0; c <= c1; c++) {
      const t = level.tileAt(c, row);
      if (t === 1 /* Solid */) return true;
      if (t === 2 /* OneWay */ && !opts.dropThrough && Math.abs(row * ts - bottom) < 1) return true;
    }
    return false;
  }
  function standsOnOneWayOnly(b, level) {
    const ts = level.tileSize;
    const bottom = b.y + b.h;
    const row = Math.floor((bottom + 1) / ts);
    const c0 = Math.floor(b.x / ts);
    const c1 = Math.floor((b.x + b.w - EPS) / ts);
    let any = false;
    for (let c = c0; c <= c1; c++) {
      const t = level.tileAt(c, row);
      if (t === 1 /* Solid */) return false;
      if (t === 2 /* OneWay */) any = true;
    }
    return any;
  }
  function fullySupported(b, level) {
    const ts = level.tileSize;
    const row = Math.floor((b.y + b.h + 1) / ts);
    const c0 = Math.floor(b.x / ts);
    const c1 = Math.floor((b.x + b.w - EPS) / ts);
    for (let c = c0; c <= c1; c++) {
      if (level.tileAt(c, row) === 0 /* Empty */) return false;
    }
    return true;
  }

  // src/entities/Entity.ts
  var Entity = class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.w = 16;
      this.h = 16;
      this.vx = 0;
      this.vy = 0;
      this.facing = 1;
      this.alive = true;
      this.onGround = false;
      /** Czas życia encji – wykorzystywany przez animacje. */
      this.age = 0;
    }
    get cx() {
      return this.x + this.w / 2;
    }
    get cy() {
      return this.y + this.h / 2;
    }
    get bottom() {
      return this.y + this.h;
    }
    overlaps(o) {
      return rectsOverlap(this.x, this.y, this.w, this.h, o.x, o.y, o.w, o.h);
    }
    /** Test kolizji z okrągłym pociskiem (przybliżenie: AABB vs AABB pocisku). */
    overlapsCircle(cx, cy, r) {
      return rectsOverlap(this.x, this.y, this.w, this.h, cx - r, cy - r, r * 2, r * 2);
    }
  };

  // src/entities/HealthComponent.ts
  var HealthComponent = class {
    constructor(max, invulnDuration = 0) {
      this.max = max;
      this.invulnDuration = invulnDuration;
      this.invulnTimer = 0;
      this.current = max;
    }
    get fraction() {
      return Math.max(0, this.current / this.max);
    }
    get isDead() {
      return this.current <= 0;
    }
    get isInvulnerable() {
      return this.invulnTimer > 0;
    }
    get invulnRemaining() {
      return this.invulnTimer;
    }
    update(dt) {
      if (this.invulnTimer > 0) this.invulnTimer -= dt;
    }
    /** @returns true, jeśli obrażenia zostały przyjęte. */
    takeDamage(amount) {
      if (this.isDead || this.isInvulnerable || amount <= 0) return false;
      this.current = Math.max(0, this.current - amount);
      this.invulnTimer = this.invulnDuration;
      this.onDamaged?.(amount, this);
      if (this.isDead) this.onDeath?.(this);
      return true;
    }
    heal(amount) {
      this.current = Math.min(this.max, this.current + amount);
    }
    reset() {
      this.current = this.max;
      this.invulnTimer = 0;
    }
  };

  // src/entities/weapons/WeaponBase.ts
  var WeaponBase = class {
    constructor(stats) {
      this.stats = stats;
      this.cooldown = 0;
    }
    update(dt) {
      if (this.cooldown > 0) this.cooldown -= dt;
    }
    /** Próba strzału. `dir` musi być znormalizowany. @returns true jeśli wystrzelono. */
    tryFire(pool, x, y, dirX, dirY) {
      if (this.cooldown > 0) return false;
      this.cooldown = this.stats.fireInterval;
      this.spawnProjectiles(pool, x, y, dirX, dirY);
      return true;
    }
    /** Pomocnik: obraca kierunek o losowy rozrzut. */
    withSpread(dirX, dirY) {
      const a = Math.atan2(dirY, dirX) + degToRad(randRange(-this.stats.spreadDeg, this.stats.spreadDeg));
      return { x: Math.cos(a), y: Math.sin(a) };
    }
  };

  // src/entities/weapons/MakitaGun.ts
  var MakitaGun = class extends WeaponBase {
    constructor() {
      super({ ...CONFIG.weapons.makita });
    }
    spawnProjectiles(pool, x, y, dirX, dirY) {
      const d = this.withSpread(dirX, dirY);
      pool.spawn({
        owner: "player",
        x,
        y,
        vx: d.x * this.stats.bulletSpeed,
        vy: d.y * this.stats.bulletSpeed,
        damage: this.stats.damage,
        radius: this.stats.bulletRadius,
        life: this.stats.lifetime
      });
    }
  };

  // src/entities/player/Aim.ts
  function resolveAim(input, state, facing) {
    const ax = input.axisX;
    const ay = input.axisY;
    switch (state) {
      case "idle":
        return ay < 0 ? { x: 0, y: -1 } : { x: facing, y: 0 };
      case "run":
        return ay !== 0 ? normalize(facing, ay) : { x: facing, y: 0 };
      case "crouch":
        return { x: facing, y: 0 };
      case "jump":
      case "fall":
        if (ax === 0 && ay === 0) return { x: facing, y: 0 };
        return normalize(ax, ay);
      case "hurt":
      case "dead":
        return null;
    }
  }

  // src/entities/player/PlayerStates.ts
  var P = CONFIG.player;
  function airControl(p) {
    const ax = p.input.axisX;
    p.vx = ax * P.runSpeed;
    if (ax !== 0) p.facing = ax;
  }
  function tryGroundTransitions(p, world) {
    if (!p.onGround) {
      p.setState(FALL, world);
      return true;
    }
    if (p.input.justPressed("jump")) {
      if (p.input.held("down") && standsOnOneWayOnly(p, world.level)) {
        p.startDropThrough();
        p.setState(FALL, world);
      } else {
        p.setState(JUMP, world);
      }
      return true;
    }
    return false;
  }
  var IDLE = {
    name: "idle",
    enter(p) {
      p.vx = 0;
      p.setStanding();
    },
    update(p, _dt, world) {
      p.vx = 0;
      if (tryGroundTransitions(p, world)) return;
      if (p.input.held("down")) {
        p.setState(CROUCH, world);
        return;
      }
      if (p.input.axisX !== 0) {
        p.setState(RUN, world);
        return;
      }
    },
    exit() {
    }
  };
  var RUN = {
    name: "run",
    enter(p) {
      p.setStanding();
    },
    update(p, _dt, world) {
      const ax = p.input.axisX;
      if (ax !== 0) p.facing = ax;
      p.vx = ax * P.runSpeed;
      if (tryGroundTransitions(p, world)) return;
      if (p.input.held("down")) {
        p.setState(CROUCH, world);
        return;
      }
      if (ax === 0) {
        p.setState(IDLE, world);
        return;
      }
    },
    exit() {
    }
  };
  var CROUCH = {
    name: "crouch",
    enter(p) {
      p.vx = 0;
      p.setCrouching();
    },
    update(p, _dt, world) {
      p.vx = 0;
      const ax = p.input.axisX;
      if (ax !== 0) p.facing = ax;
      if (tryGroundTransitions(p, world)) return;
      if (!p.input.held("down")) {
        p.setState(IDLE, world);
        return;
      }
    },
    exit(p) {
      p.setStanding();
    }
  };
  var JUMP = {
    name: "jump",
    enter(p) {
      p.setStanding();
      p.vy = P.jumpVelocity;
      p.onGround = false;
      p.somersaultTime = 0;
      Sfx.play("jump");
    },
    update(p, dt, world) {
      airControl(p);
      p.somersaultTime += dt;
      if (p.onGround && p.vy >= 0) {
        p.setState(p.input.axisX !== 0 ? RUN : IDLE, world);
      }
    },
    exit(p) {
      p.somersaultTime = -1;
    }
  };
  var FALL = {
    name: "fall",
    enter(p) {
      p.setStanding();
    },
    update(p, _dt, world) {
      airControl(p);
      if (p.onGround) p.setState(p.input.axisX !== 0 ? RUN : IDLE, world);
    },
    exit() {
    }
  };
  var HURT = {
    name: "hurt",
    enter(p) {
      p.setStanding();
      p.hurtTimer = P.hurtTime;
      p.vx = p.knockbackDir * P.hurtKnockbackX;
      p.vy = P.hurtKnockbackY;
      p.onGround = false;
    },
    update(p, dt, world) {
      p.hurtTimer -= dt;
      if (p.hurtTimer <= 0) p.setState(p.onGround ? IDLE : FALL, world);
    },
    exit() {
    }
  };
  var DEAD = {
    name: "dead",
    enter(p) {
      p.vx = 0;
      p.setCrouching();
    },
    update(p) {
      p.vx = 0;
    },
    exit() {
    }
  };

  // src/entities/player/PlayerController.ts
  var P2 = CONFIG.player;
  var PlayerController = class extends Entity {
    constructor(input, x, y) {
      super();
      this.input = input;
      this.visual = new PlaceholderVisual({ color: "#3d7bff", accent: "#ffb347", barrel: true, barrelLength: 8, outline: "#1b3a80" });
      this.health = new HealthComponent(P2.maxHp, P2.invulnTime);
      this.weapon = new MakitaGun();
      this.state = IDLE;
      this.aim = { x: 1, y: 0 };
      // dane stanów
      this.somersaultTime = -1;
      this.hurtTimer = 0;
      this.knockbackDir = -1;
      this.dropThroughTimer = 0;
      this.lastSafe = { x: 0, y: 0 };
      this.stateTime = 0;
      this.w = P2.width;
      this.h = P2.standHeight;
      this.x = x;
      this.y = y;
      this.lastSafe = { x, y };
      this.health.onDeath = () => {
        Sfx.play("game_over");
      };
    }
    get isDead() {
      return this.state === DEAD;
    }
    // ---- FSM ---------------------------------------------------------------
    setState(next, world) {
      if (next === this.state) return;
      this.state.exit(this, world);
      this.state = next;
      this.stateTime = 0;
      next.enter(this, world);
    }
    setStanding() {
      if (this.h === P2.standHeight) return;
      this.y -= P2.standHeight - this.h;
      this.h = P2.standHeight;
    }
    setCrouching() {
      if (this.h === P2.crouchHeight) return;
      this.y += this.h - P2.crouchHeight;
      this.h = P2.crouchHeight;
    }
    startDropThrough() {
      this.dropThroughTimer = P2.dropThroughTime;
      this.vy = 40;
      this.onGround = false;
    }
    // ---- Obrażenia ---------------------------------------------------------
    /** @param sourceX pozycja źródła obrażeń – decyduje o kierunku odrzutu. */
    takeDamage(amount, sourceX, world) {
      if (this.isDead) return false;
      if (!this.health.takeDamage(amount)) return false;
      this.knockbackDir = sourceX > this.cx ? -1 : 1;
      world.events.emit("player:damaged", { amount });
      world.particles.emit({ x: this.cx, y: this.cy, count: 8, color: ["#ff4d4d", "#ffffff"], speed: [30, 90], life: [0.2, 0.4] });
      if (this.health.isDead) {
        this.setState(DEAD, world);
        world.events.emit("player:died", void 0);
      } else {
        Sfx.play("hurt");
        this.setState(HURT, world);
      }
      return true;
    }
    // ---- Update ------------------------------------------------------------
    update(dt, world) {
      this.age += dt;
      this.stateTime += dt;
      this.health.update(dt);
      this.weapon.update(dt);
      if (this.dropThroughTimer > 0) this.dropThroughTimer -= dt;
      this.state.update(this, dt, world);
      this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);
      const res = moveAndCollide(this, world.level, this.vx * dt, this.vy * dt, { dropThrough: this.dropThroughTimer > 0 });
      this.onGround = res.onGround;
      if (res.onGround) {
        if (this.vy > 0) this.vy = 0;
        if (fullySupported(this, world.level)) {
          this.lastSafe.x = this.x;
          this.lastSafe.y = this.y;
        }
      }
      this.clampToCamera(world);
      this.checkPit(world);
      const aim = resolveAim(this.input, this.state.name, this.facing);
      if (aim) {
        this.aim = aim;
        if (this.input.held("fire")) this.fire(world);
      }
    }
    /** Lewa krawędź ekranu = ściana; w arenie bossa także prawa. */
    clampToCamera(world) {
      const cam = world.camera;
      if (this.x < cam.x) {
        this.x = cam.x;
        if (this.vx < 0) this.vx = 0;
      }
      if (cam.locked && this.x + this.w > cam.right) {
        this.x = cam.right - this.w;
        if (this.vx > 0) this.vx = 0;
      }
    }
    checkPit(world) {
      if (this.y <= world.level.heightPx + 24 || this.isDead) return;
      this.takeDamage(P2.pitDamage, this.cx, world);
      this.x = clamp(this.lastSafe.x, world.camera.x + 4, world.camera.right - this.w - 4);
      this.y = this.lastSafe.y - 8;
      this.vx = 0;
      this.vy = 0;
      if (!this.isDead) this.setState(FALL, world);
    }
    fire(world) {
      const bx = this.cx + this.aim.x * (this.w / 2 + 4);
      const by = this.cy - 1 + this.aim.y * (this.h / 2 + 2);
      if (this.weapon.tryFire(world.playerBullets, bx, by, this.aim.x, this.aim.y)) {
        Sfx.play("shoot");
        world.particles.emit({ x: bx, y: by, count: 2, color: "#ffe36b", speed: [10, 30], life: [0.05, 0.1], size: [1, 2] });
      }
    }
    // ---- Render ------------------------------------------------------------
    draw(ctx) {
      if (this.health.isInvulnerable && !this.isDead) {
        if (Math.floor(this.health.invulnRemaining * P2.flashHz) % 2 === 0) return;
      }
      const rotation = this.somersaultTime >= 0 ? this.somersaultTime / P2.somersaultDuration * Math.PI * 2 * P2.somersaultTurns * this.facing : 0;
      this.visual.draw(ctx, {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h,
        facing: this.facing,
        anim: this.state.name,
        time: this.stateTime,
        aim: this.aim,
        rotation,
        tint: this.isDead ? "#666" : this.state.name === "hurt" ? "#ff8080" : void 0
      });
    }
  };

  // src/entities/enemies/EnemyBase.ts
  var EnemyBase = class extends Entity {
    constructor(kind, hp, contactDamage, scoreValue) {
      super();
      this.kind = kind;
      this.contactDamage = contactDamage;
      this.scoreValue = scoreValue;
      this.hitFlash = 0;
      /** Czy pociski gracza mogą go trafić (np. boss podczas intro). */
      this.vulnerable = true;
      /** Czy despawnować, gdy zostanie za kamerą. */
      this.despawnOffscreen = true;
      this.health = new HealthComponent(hp);
    }
    /** Trafienie pociskiem gracza. */
    takeHit(damage, world) {
      if (!this.vulnerable || !this.alive) return;
      if (!this.health.takeDamage(damage)) return;
      this.hitFlash = 0.08;
      Sfx.play("enemy_hit");
      if (this.health.isDead) this.die(world);
    }
    die(world) {
      if (!this.alive) return;
      this.alive = false;
      world.addScore(this.scoreValue);
      world.events.emit("enemy:died", { enemy: this });
      Sfx.play("enemy_die");
      this.deathEffect(world);
    }
    deathEffect(world) {
      world.particles.emit({
        x: this.cx,
        y: this.cy,
        count: 14,
        color: ["#ff9f43", "#ffdd59", "#ffffff", "#666"],
        speed: [40, 140],
        life: [0.25, 0.6],
        size: [1, 4],
        gravity: 300
      });
    }
    /** Wspólna część update – wywołać na końcu `update` podklasy. */
    postUpdate(dt, world) {
      this.age += dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.despawnOffscreen && (this.x + this.w < world.camera.x - 48 || this.y > world.level.heightPx + 64)) {
        this.alive = false;
      }
    }
    /** Kontakt z graczem – domyślnie obrażenia kontaktowe. */
    onTouchPlayer(world) {
      world.player.takeDamage(this.contactDamage, this.cx, world);
    }
    drawVisual(ctx, anim, extra = {}) {
      this.visual.draw(ctx, {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h,
        facing: this.facing,
        anim,
        time: this.age,
        flash: this.hitFlash > 0,
        ...extra
      });
    }
  };

  // src/entities/enemies/Runner.ts
  var R = CONFIG.enemies.runner;
  var Runner = class extends EnemyBase {
    constructor(x, y) {
      super("runner", R.hp, R.contactDamage, R.score);
      this.visual = new PlaceholderVisual({ color: "#e0563c", accent: "#fff", outline: "#7a2a1a" });
      this.anim = "run";
      this.w = R.width;
      this.h = R.height;
      this.x = x;
      this.y = y;
      this.facing = -1;
    }
    update(dt, world) {
      const player = world.player;
      const dir = player.cx < this.cx ? -1 : 1;
      this.facing = dir;
      this.vx = dir * R.speed;
      if (this.onGround && this.shouldJump(world)) {
        this.vy = R.jumpVelocity;
        this.onGround = false;
      }
      this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);
      const res = moveAndCollide(this, world.level, this.vx * dt, this.vy * dt);
      this.onGround = res.onGround;
      if (res.onGround && this.vy > 0) this.vy = 0;
      this.anim = this.onGround ? "run" : "jump";
      this.postUpdate(dt, world);
    }
    /** Przeszkoda na wysokości stóp przed biegaczem → skok. */
    shouldJump(world) {
      const lvl = world.level;
      const ts = lvl.tileSize;
      const probeX = this.facing > 0 ? this.x + this.w + R.obstacleLookahead : this.x - R.obstacleLookahead;
      const col = Math.floor(probeX / ts);
      const footRow = Math.floor((this.bottom - 1) / ts);
      return lvl.tileAt(col, footRow) === 1 /* Solid */ || lvl.tileAt(col, footRow - 1) === 1 /* Solid */;
    }
    draw(ctx) {
      const bob = this.anim === "run" ? Math.round(Math.sin(this.age * 22) * 1) : 0;
      ctx.save();
      ctx.translate(0, bob);
      this.drawVisual(ctx, this.anim);
      ctx.restore();
    }
  };

  // src/entities/enemies/Sniper.ts
  var S = CONFIG.enemies.sniper;
  var Sniper = class extends EnemyBase {
    constructor(x, y) {
      super("sniper", S.hp, S.contactDamage, S.score);
      this.visual = new PlaceholderVisual({ color: "#8e44ad", accent: "#f1c40f", barrel: true, barrelLength: 12, outline: "#4a1f5c" });
      this.mode = "cooldown";
      this.timer = S.fireInterval * 0.5;
      this.aimDir = { x: -1, y: 0 };
      this.w = S.width;
      this.h = S.height;
      this.x = x + (CONFIG.view.tile - this.w) / 2;
      this.y = y + CONFIG.view.tile - this.h;
      this.facing = -1;
    }
    update(dt, world) {
      const player = world.player;
      const dx = player.cx - this.cx;
      const dy = player.cy - this.cy;
      this.facing = dx < 0 ? -1 : 1;
      const inRange = Math.hypot(dx, dy) <= S.range && world.camera.isVisible(this.x, this.y, this.w, this.h);
      this.timer -= dt;
      switch (this.mode) {
        case "cooldown":
          if (this.timer <= 0 && inRange) {
            this.mode = "aim";
            this.timer = S.aimTime;
            Sfx.play("sniper_aim");
          }
          break;
        case "aim":
          this.aimDir = normalize(dx, dy);
          if (this.timer <= 0) {
            if (!player.isDead) {
              world.fireEnemyBullet(this.cx + this.aimDir.x * 8, this.cy + this.aimDir.y * 8, this.aimDir.x, this.aimDir.y, S.bulletSpeed, S.bulletDamage);
            }
            this.mode = "cooldown";
            this.timer = S.fireInterval;
          }
          break;
        case "idle":
          break;
      }
      this.postUpdate(dt, world);
    }
    draw(ctx) {
      const aiming = this.mode === "aim";
      const tint = aiming && Math.floor(this.age * 16) % 2 === 0 ? "#c56cf0" : void 0;
      this.drawVisual(ctx, aiming ? "aim" : "idle", { aim: aiming ? this.aimDir : { x: this.facing, y: 0 }, tint });
    }
  };

  // src/entities/enemies/Drone.ts
  var D = CONFIG.enemies.drone;
  var Drone = class extends EnemyBase {
    constructor(x, y) {
      super("drone", D.hp, D.contactDamage, D.score);
      this.visual = new PlaceholderVisual({ color: "#1abc9c", accent: "#fff", shape: "diamond", faceMarker: false });
      this.mode = "patrol";
      this.patrolT = 0;
      this.attackTimer = D.attackInterval;
      this.chargeTimer = 0;
      this.chargeDir = { x: 0, y: 0 };
      this.w = D.width;
      this.h = D.height;
      this.originX = x;
      this.originY = y;
      this.x = x;
      this.y = y;
      this.facing = -1;
    }
    update(dt, world) {
      const player = world.player;
      switch (this.mode) {
        case "patrol": {
          this.patrolT += dt;
          const px = this.originX + Math.sin(this.patrolT * (D.patrolSpeed / D.patrolRange)) * D.patrolRange;
          const py = this.originY + Math.sin(this.patrolT * D.waveFrequency * Math.PI * 2) * D.waveAmplitude;
          this.facing = px < this.x ? -1 : 1;
          this.x = px;
          this.y = py;
          this.attackTimer -= dt;
          if (this.attackTimer <= 0 && world.camera.isVisible(this.x, this.y, this.w, this.h) && !player.isDead) {
            this.attackTimer = D.attackInterval;
            if (Math.abs(player.cx - this.cx) <= D.bombWindowX && player.cy > this.cy) {
              this.dropBomb(world);
            } else {
              this.startCharge(world);
            }
          }
          break;
        }
        case "charge": {
          this.chargeTimer -= dt;
          this.x += this.chargeDir.x * D.chargeSpeed * dt;
          this.y += this.chargeDir.y * D.chargeSpeed * dt;
          if (this.chargeTimer <= 0) this.mode = "return";
          break;
        }
        case "return": {
          const tx = this.originX, ty = this.originY;
          const d = normalize(tx - this.x, ty - this.y);
          const dist = Math.hypot(tx - this.x, ty - this.y);
          const step = D.chargeSpeed * 0.6 * dt;
          if (dist <= step) {
            this.x = tx;
            this.y = ty;
            this.mode = "patrol";
            this.patrolT = 0;
          } else {
            this.x += d.x * step;
            this.y += d.y * step;
          }
          this.facing = d.x < 0 ? -1 : 1;
          break;
        }
      }
      this.postUpdate(dt, world);
    }
    dropBomb(world) {
      Sfx.play("drone_bomb");
      world.fireEnemyBullet(this.cx, this.bottom + 2, 0, 1, D.bombSpeed * 0.4, D.bombDamage, { gravity: 500, radius: 4, color: "#f39c12" });
    }
    startCharge(world) {
      const p = world.player;
      this.chargeDir = normalize(p.cx - this.cx, p.cy - this.cy);
      this.chargeTimer = D.chargeTime;
      this.mode = "charge";
      this.facing = this.chargeDir.x < 0 ? -1 : 1;
    }
    draw(ctx) {
      const tint = this.mode === "charge" ? "#ff7675" : void 0;
      this.drawVisual(ctx, this.mode, { tint });
      ctx.fillStyle = Math.floor(this.age * 30) % 2 === 0 ? "#fff" : "#7f8c8d";
      ctx.fillRect(Math.round(this.x), Math.round(this.y) - 2, 3, 1);
      ctx.fillRect(Math.round(this.x + this.w) - 3, Math.round(this.y) - 2, 3, 1);
    }
  };

  // src/entities/boss/BossFSM.ts
  var BossFSM = class {
    constructor(phases, onPhaseChange) {
      this.phases = phases;
      this.onPhaseChange = onPhaseChange;
      this.phaseIndex = -1;
      if (phases.length === 0) throw new Error("BossFSM wymaga co najmniej jednej fazy");
    }
    get current() {
      return this.phaseIndex >= 0 ? this.phases[this.phaseIndex] : null;
    }
    /** Indeks najbardziej zaawansowanej fazy, której próg został osiągnięty. */
    targetIndex(hpFraction) {
      let idx = 0;
      for (let i = 0; i < this.phases.length; i++) {
        if (hpFraction <= this.phases[i].startsAt + 1e-6) idx = i;
      }
      return idx;
    }
    update(boss, hpFraction, dt, world) {
      const target = this.targetIndex(hpFraction);
      while (this.phaseIndex < target) this.advance(boss, world);
      this.current?.update(boss, dt, world);
    }
    advance(boss, world) {
      const from = this.phaseIndex;
      this.current?.exit(boss, world);
      this.phaseIndex++;
      const phase = this.phases[this.phaseIndex];
      phase.enter(boss, world);
      this.onPhaseChange?.(from, this.phaseIndex, phase);
    }
    /** Wymuszone przejście (debug / skrypty). */
    forcePhase(index, boss, world) {
      while (this.phaseIndex < index && this.phaseIndex < this.phases.length - 1) this.advance(boss, world);
    }
  };

  // src/entities/boss/BossPhases.ts
  var B = CONFIG.boss;
  var BurstShot = class {
    constructor(count, interval, speed) {
      this.count = count;
      this.interval = interval;
      this.speed = speed;
      this.name = "burst";
      this.fired = 0;
      this.timer = 0;
    }
    start() {
      this.fired = 0;
      this.timer = 0;
    }
    update(boss, dt, world) {
      this.timer -= dt;
      if (this.timer <= 0) {
        boss.shootAtPlayer(world, this.speed);
        this.fired++;
        this.timer = this.interval;
      }
      return this.fired >= this.count;
    }
  };
  var FanShot = class {
    constructor(count, spreadDeg, speed) {
      this.count = count;
      this.spreadDeg = spreadDeg;
      this.speed = speed;
      this.name = "fan";
    }
    start(boss, world) {
      const p = world.player;
      const base = Math.atan2(p.cy - boss.cy, p.cx - boss.cx);
      const spread = degToRad(this.spreadDeg);
      for (let i = 0; i < this.count; i++) {
        const t = this.count === 1 ? 0 : i / (this.count - 1) - 0.5;
        const a = base + t * spread;
        world.fireEnemyBullet(boss.cx, boss.cy, Math.cos(a), Math.sin(a), this.speed, B.bulletDamage);
      }
    }
    update() {
      return true;
    }
  };
  var SweepAttack = class {
    constructor(telegraph, speed, height) {
      this.telegraph = telegraph;
      this.speed = speed;
      this.height = height;
      this.name = "sweep";
      this.stage = "telegraph";
      this.timer = 0;
    }
    start(boss) {
      this.stage = "telegraph";
      this.timer = this.telegraph;
      boss.movementLocked = true;
      boss.telegraphing = true;
    }
    update(boss, dt, world) {
      const floorTopY = boss.floorY - this.height;
      switch (this.stage) {
        case "telegraph":
          this.timer -= dt;
          if (this.timer <= 0) {
            boss.telegraphing = false;
            boss.setHorizontal(this.height);
            this.stage = "descend";
          }
          return false;
        case "descend":
          if (boss.moveTowards(boss.x, floorTopY, this.speed * 1.2, dt)) this.stage = "sweepLeft";
          return false;
        case "sweepLeft":
          if (boss.moveTowards(boss.arenaX + 4, floorTopY, this.speed, dt)) this.stage = "sweepRight";
          return false;
        case "sweepRight":
          if (boss.moveTowards(boss.arenaRight - boss.w - 4, floorTopY, this.speed, dt)) {
            boss.setVertical();
            this.stage = "return";
          }
          return false;
        case "return": {
          const t = boss.hoverTarget();
          if (boss.moveTowards(t.x, t.y, this.speed, dt)) {
            boss.movementLocked = false;
            return true;
          }
          return false;
        }
      }
    }
  };
  var ChargeAttack = class {
    constructor(telegraph, speed, rest) {
      this.telegraph = telegraph;
      this.speed = speed;
      this.rest = rest;
      this.name = "charge";
      this.stage = "telegraph";
      this.timer = 0;
      this.target = { x: 0, y: 0 };
    }
    start(boss) {
      this.stage = "telegraph";
      this.timer = this.telegraph;
      boss.movementLocked = true;
      boss.telegraphing = true;
    }
    update(boss, dt, world) {
      switch (this.stage) {
        case "telegraph":
          this.timer -= dt;
          boss.shakeOffset = Math.sin(boss.age * 60) * 2;
          if (this.timer <= 0) {
            boss.shakeOffset = 0;
            boss.telegraphing = false;
            const p = world.player;
            this.target = {
              x: clamp(p.cx - boss.w / 2, boss.arenaX + 2, boss.arenaRight - boss.w - 2),
              y: clamp(p.cy - boss.h / 2, 8, boss.floorY - boss.h)
            };
            this.stage = "dash";
          }
          return false;
        case "dash":
          if (boss.moveTowards(this.target.x, this.target.y, this.speed, dt)) {
            this.stage = "rest";
            this.timer = this.rest;
            world.particles.emit({ x: boss.cx, y: boss.bottom, count: 10, color: ["#bdc3c7", "#7f8c8d"], speed: [20, 80], life: [0.2, 0.5] });
          }
          return false;
        case "rest":
          this.timer -= dt;
          if (this.timer <= 0) this.stage = "return";
          return false;
        case "return": {
          const t = boss.hoverTarget();
          if (boss.moveTowards(t.x, t.y, this.speed * 0.55, dt)) {
            boss.movementLocked = false;
            return true;
          }
          return false;
        }
      }
    }
  };
  function makePhase(name, startsAt, cfg, patterns, hooks = {}) {
    return {
      name,
      startsAt,
      enter(boss) {
        boss.hoverHz = cfg.hoverHz;
        boss.attackCooldown = cfg.attackCooldown;
        boss.tint = cfg.tint;
        boss.setPatterns(patterns());
        boss.resetAttackTimer(0.8);
      },
      update(boss, dt, world) {
        boss.runAttackCycle(dt, world);
        hooks.update?.(boss, dt, world);
      },
      exit(boss) {
        boss.cancelAttack();
      }
    };
  }
  function createTurbinePhases() {
    const p1 = B.phase1, p2 = B.phase2, p3 = B.phase3;
    return [
      // Faza 1 – powolny hover, podstawowe serie.
      makePhase(
        "Faza 1",
        B.phaseThresholds[0],
        { hoverHz: p1.hoverHz, attackCooldown: p1.attackCooldown, tint: "#95a5a6" },
        () => [new BurstShot(p1.burstCount, p1.burstInterval, p1.bulletSpeed)]
      ),
      // Faza 2 – szybciej + zamach po podłodze.
      makePhase(
        "Faza 2",
        B.phaseThresholds[1],
        { hoverHz: p2.hoverHz, attackCooldown: p2.attackCooldown, tint: "#e67e22" },
        () => [
          new BurstShot(p2.burstCount, p2.burstInterval, p2.bulletSpeed),
          new SweepAttack(p2.sweepTelegraph, p2.sweepSpeed, p2.sweepHeight)
        ]
      ),
      // Faza 3 – enrage: czerwony, dym, szarże i wachlarze.
      makePhase(
        "Faza 3 (ENRAGE)",
        B.phaseThresholds[2],
        { hoverHz: p3.hoverHz, attackCooldown: p3.attackCooldown, tint: "#e74c3c" },
        () => [
          new FanShot(p3.fanCount, p3.fanSpreadDeg, p3.bulletSpeed),
          new ChargeAttack(p3.chargeTelegraph, p3.chargeSpeed, p3.chargeRest),
          new FanShot(p3.fanCount, p3.fanSpreadDeg, p3.bulletSpeed),
          new SweepAttack(p2.sweepTelegraph * 0.7, p2.sweepSpeed * 1.3, p2.sweepHeight)
        ],
        {
          update(boss, dt, world) {
            boss.smokeAcc += dt * p3.smokeRate;
            while (boss.smokeAcc >= 1) {
              boss.smokeAcc -= 1;
              world.particles.emit({
                x: boss.cx,
                y: boss.y + 4,
                count: 1,
                color: ["#2d3436", "#636e72", "#b33939"],
                speed: [10, 30],
                life: [0.5, 1],
                size: [2, 5],
                angle: [-Math.PI * 0.75, -Math.PI * 0.25],
                spreadX: boss.w / 2
              });
            }
          }
        }
      )
    ];
  }
  function aimAtPlayer(boss, world) {
    const p = world.player;
    return normalize(p.cx - boss.cx, p.cy - boss.cy);
  }

  // src/entities/boss/TurbineBoss.ts
  var B2 = CONFIG.boss;
  var TurbineBoss = class extends EnemyBase {
    constructor(arenaX, floorY) {
      super("boss", B2.hp, B2.contactDamage, B2.score);
      this.arenaX = arenaX;
      this.floorY = floorY;
      this.visual = new PlaceholderVisual({ color: "#95a5a6", accent: "#ecf0f1", faceMarker: false, outline: "#2c3e50" });
      // parametry ustawiane przez fazy
      this.hoverHz = B2.phase1.hoverHz;
      this.attackCooldown = B2.phase1.attackCooldown;
      this.tint = "#95a5a6";
      this.movementLocked = false;
      this.telegraphing = false;
      this.shakeOffset = 0;
      this.smokeAcc = 0;
      this.hoverT = 0;
      this.attackTimer = 1.5;
      this.patterns = [];
      this.patternIndex = 0;
      this.currentAttack = null;
      this.introTimer = 1.4;
      this.prevX = 0;
      this.prevY = 0;
      /** Ostatnie przejście fazy – `update` odczytuje je i emituje event `boss:phase`. */
      this.lastPhaseChange = null;
      this.arenaRight = arenaX + CONFIG.view.width;
      this.w = B2.width;
      this.h = B2.height;
      const t = this.hoverTarget();
      this.x = t.x;
      this.y = -this.h - 8;
      this.prevX = this.x;
      this.prevY = this.y;
      this.despawnOffscreen = false;
      this.vulnerable = false;
      this.fsm = new BossFSM(createTurbinePhases(), (from, to) => this.onPhaseChanged(from, to));
    }
    get phaseIndex() {
      return this.fsm.phaseIndex;
    }
    get isIntro() {
      return this.introTimer > 0;
    }
    // ---- API dla wzorców ataków --------------------------------------------
    hoverTarget() {
      return {
        x: this.arenaX + B2.hoverOffsetX - B2.width / 2,
        y: B2.hoverCenterY + Math.sin(this.hoverT * Math.PI * 2 * this.hoverHz) * B2.hoverAmplitude - this.h / 2
      };
    }
    /** Ruch ze stałą prędkością w stronę punktu. @returns true, gdy osiągnięty. */
    moveTowards(tx, ty, speed, dt) {
      const dx = tx - this.x, dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      const step = speed * dt;
      if (dist <= step) {
        this.x = tx;
        this.y = ty;
        return true;
      }
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      return false;
    }
    /** Skrzydło ułożone poziomo (zamach przy podłodze) – zachowuje środek. */
    setHorizontal(height) {
      const cx = this.cx, cy = this.cy;
      this.w = B2.height;
      this.h = height;
      this.x = cx - this.w / 2;
      this.y = cy - this.h / 2;
      this.prevX = this.x;
      this.prevY = this.y;
    }
    setVertical() {
      const cx = this.cx, cy = this.cy;
      this.w = B2.width;
      this.h = B2.height;
      this.x = cx - this.w / 2;
      this.y = cy - this.h / 2;
      this.prevX = this.x;
      this.prevY = this.y;
    }
    shootAtPlayer(world, speed) {
      const d = aimAtPlayer(this, world);
      world.fireEnemyBullet(this.cx + d.x * 6, this.cy + d.y * 6, d.x, d.y, speed, B2.bulletDamage);
    }
    setPatterns(patterns) {
      this.patterns = patterns;
      this.patternIndex = 0;
    }
    resetAttackTimer(t) {
      this.attackTimer = t;
    }
    cancelAttack() {
      this.currentAttack = null;
      this.movementLocked = false;
      this.telegraphing = false;
      this.shakeOffset = 0;
      this.setVertical();
    }
    /** Cykl: cooldown → kolejny wzorzec z listy → aż do jego zakończenia. */
    runAttackCycle(dt, world) {
      if (world.player.isDead) return;
      if (this.currentAttack) {
        if (this.currentAttack.update(this, dt, world)) {
          this.currentAttack = null;
          this.attackTimer = this.attackCooldown;
        }
        return;
      }
      this.attackTimer -= dt;
      if (this.attackTimer <= 0 && this.patterns.length > 0) {
        this.currentAttack = this.patterns[this.patternIndex];
        this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
        this.currentAttack.start(this, world);
      }
    }
    // ---- Zdarzenia ---------------------------------------------------------
    onPhaseChanged(from, to) {
      this.vulnerable = true;
      if (from >= 0) {
        Sfx.play("boss_phase");
        this.hitFlash = 0.25;
      }
      this.lastPhaseChange = { from, to };
    }
    die(world) {
      if (!this.alive) return;
      super.die(world);
      Sfx.play("boss_die");
      world.events.emit("boss:died", void 0);
    }
    deathEffect(world) {
      for (let i = 0; i < 6; i++) {
        world.particles.emit({
          x: this.x + Math.random() * this.w,
          y: this.y + Math.random() * this.h,
          count: 20,
          color: ["#ff9f43", "#ffdd59", "#ffffff", "#e74c3c", "#2d3436"],
          speed: [30, 200],
          life: [0.4, 1.2],
          size: [2, 6],
          gravity: 200
        });
      }
    }
    // ---- Update / draw -----------------------------------------------------
    update(dt, world) {
      this.prevX = this.x;
      this.prevY = this.y;
      if (this.introTimer > 0) {
        this.introTimer -= dt;
        const t = this.hoverTarget();
        this.moveTowards(t.x, t.y, 120, dt);
        if (this.introTimer <= 0) this.fsm.forcePhase(0, this, world);
        this.postUpdate(dt, world);
        return;
      }
      this.hoverT += dt;
      if (!this.movementLocked) {
        const t = this.hoverTarget();
        this.x += (t.x - this.x) * Math.min(1, dt * 6);
        this.y += (t.y - this.y) * Math.min(1, dt * 6);
      }
      this.fsm.update(this, this.health.fraction, dt, world);
      if (this.lastPhaseChange) {
        world.events.emit("boss:phase", this.lastPhaseChange);
        this.lastPhaseChange = null;
      }
      this.facing = world.player.cx < this.cx ? -1 : 1;
      this.postUpdate(dt, world);
    }
    draw(ctx) {
      const flashTint = this.telegraphing && Math.floor(this.age * 20) % 2 === 0 ? "#ffffff" : void 0;
      ctx.save();
      ctx.translate(Math.round(this.shakeOffset), 0);
      this.drawVisual(ctx, `phase${this.phaseIndex + 1}`, { tint: flashTint ?? this.tint });
      const cx = Math.round(this.cx), cy = Math.round(this.cy);
      ctx.fillStyle = "#2c3e50";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flashTint ?? "#ecf0f1";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      if (this.w < this.h) {
        for (let y = this.y + 6; y < this.bottom - 6; y += 12) ctx.fillRect(Math.round(this.x + 3), Math.round(y), this.w - 6, 2);
      } else {
        for (let x = this.x + 6; x < this.x + this.w - 6; x += 12) ctx.fillRect(Math.round(x), Math.round(this.y + 3), 2, this.h - 6);
      }
      const speed = Math.hypot(this.x - this.prevX, this.y - this.prevY);
      if (speed > 3) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.tint;
        ctx.fillRect(Math.round(this.prevX), Math.round(this.prevY), this.w, this.h);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  };

  // src/ui/HUD.ts
  var HUD = class {
    constructor() {
      this.phaseBanner = "";
      this.phaseBannerTimer = 0;
    }
    showBanner(text, seconds = 1.6) {
      this.phaseBanner = text;
      this.phaseBannerTimer = seconds;
    }
    update(dt) {
      if (this.phaseBannerTimer > 0) this.phaseBannerTimer -= dt;
    }
    draw(ctx, player, score, boss, time) {
      const W = CONFIG.view.width;
      ctx.save();
      ctx.font = "8px monospace";
      ctx.textBaseline = "top";
      const hpW = 80, hpH = 6, hx = 8, hy = 8;
      ctx.fillStyle = "#000";
      ctx.fillRect(hx - 1, hy - 1, hpW + 2, hpH + 2);
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(hx, hy, hpW, hpH);
      const f = player.health.fraction;
      ctx.fillStyle = f > 0.5 ? "#2ecc71" : f > 0.25 ? "#f1c40f" : "#e74c3c";
      ctx.fillRect(hx, hy, Math.round(hpW * f), hpH);
      ctx.fillStyle = "#fff";
      ctx.fillText(`SEBA ${Math.ceil(player.health.current)}`, hx, hy + hpH + 2);
      ctx.textAlign = "right";
      ctx.fillText(`SCORE ${score.toString().padStart(6, "0")}`, W - 8, 8);
      ctx.textAlign = "left";
      if (boss && boss.alive) {
        const bw = 160, bh = 5, bx = (W - bw) / 2, by = 8;
        ctx.fillStyle = "#000";
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = boss.tint;
        ctx.fillRect(bx, by, Math.round(bw * boss.health.fraction), bh);
        ctx.fillStyle = "#fff";
        for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bx + bw * t), by - 1, 1, bh + 2);
        ctx.textAlign = "center";
        ctx.fillText(CONFIG.boss.name, W / 2, by + bh + 2);
        ctx.textAlign = "left";
      }
      if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
        ctx.textAlign = "center";
        ctx.font = "10px monospace";
        ctx.fillStyle = "#ffdd59";
        ctx.fillText(this.phaseBanner, W / 2, 40);
      }
      ctx.restore();
    }
    drawOverlay(ctx, title, subtitle, color) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "16px monospace";
      ctx.fillStyle = color;
      ctx.fillText(title, W / 2, H / 2 - 10);
      ctx.font = "8px monospace";
      ctx.fillStyle = "#ddd";
      ctx.fillText(subtitle, W / 2, H / 2 + 10);
      ctx.restore();
    }
    drawHint(ctx, alpha, gamepad = false) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "8px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText(
        gamepad ? "D-PAD/GA\u0141KA: ruch/celowanie   A: skok   B/X/RT: ogie\u0144   D\xD3\u0141+A: zeskok" : "STRZA\u0141KI: ruch/celowanie   Z: skok   X: ogie\u0144   D\xD3\u0141+Z: zeskok",
        W / 2,
        H - 18
      );
      ctx.restore();
    }
  };

  // src/scenes/GameScene.ts
  var GameScene = class {
    constructor(input) {
      this.input = input;
      this.level = new Level(TEST_LEVEL);
      this.camera = new Camera();
      this.playerBullets = new BulletPool(CONFIG.bullets.playerPoolSize);
      this.enemyBullets = new BulletPool(CONFIG.bullets.enemyPoolSize);
      this.particles = new ParticleSystem();
      this.events = new EventBus();
      this.hud = new HUD();
      this.time = 0;
      this.score = 0;
      this.state = "playing";
      this.enemies = [];
      this.boss = null;
      this.runnerWaves = [];
      this.bossTriggered = false;
      this.endTimer = 0;
      const start = this.level.findMarker("player") ?? { x: 32, y: 160 };
      this.player = new PlayerController(input, start.x, start.y + CONFIG.view.tile - CONFIG.player.standHeight);
      this.camera.maxX = this.level.widthPx - this.camera.width;
      this.arenaX = this.level.findMarker("bossArena")?.x ?? this.camera.maxX;
      this.pendingMarkers = this.level.markers.filter((m) => m.type === "sniper" || m.type === "drone" || m.type === "runnerSpawner");
      this.events.on("boss:phase", ({ from, to }) => {
        if (from >= 0) this.hud.showBanner(`FAZA ${to + 1}${to === 2 ? " \u2013 ENRAGE!" : ""}`);
      });
      this.events.on("boss:died", () => {
        this.state = "victory";
        this.endTimer = 0;
        Sfx.play("victory");
      });
      this.events.on("player:died", () => {
        this.state = "gameover";
        this.endTimer = 0;
      });
    }
    // ---- WorldContext ------------------------------------------------------
    addScore(points) {
      this.score += points;
      this.events.emit("score", { total: this.score, delta: points });
    }
    spawnEnemy(enemy) {
      this.enemies.push(enemy);
    }
    fireEnemyBullet(x, y, dirX, dirY, speed, damage, opts = {}) {
      const d = normalize(dirX, dirY);
      this.enemyBullets.spawn({
        owner: "enemy",
        x,
        y,
        vx: d.x * speed,
        vy: d.y * speed,
        damage,
        radius: opts.radius ?? CONFIG.bullets.enemyRadius,
        life: 4,
        gravity: opts.gravity,
        hitsTerrain: false,
        color: opts.color
      });
    }
    // ---- Update ------------------------------------------------------------
    update(dt) {
      this.time += dt;
      this.hud.update(dt);
      if (this.state !== "playing") {
        this.endTimer += dt;
        this.particles.update(dt);
        if (this.state === "gameover") this.enemyBullets.update(dt, this);
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
    updateBossArena() {
      if (this.bossTriggered) return;
      if (this.player.x >= this.arenaX + 24 && this.camera.x >= this.arenaX - 0.5) {
        this.bossTriggered = true;
        this.camera.lock(this.arenaX);
        const bm = this.level.findMarker("boss");
        const floorY = this.findFloorY(bm ? bm.col : Math.floor((this.arenaX + 200) / this.level.tileSize));
        this.boss = new TurbineBoss(this.arenaX, floorY);
        this.events.emit("boss:spawned", { name: CONFIG.boss.name });
        this.hud.showBanner(CONFIG.boss.name, 2.2);
        this.enemies = this.enemies.filter((e) => e.x > this.arenaX);
      }
    }
    findFloorY(col) {
      for (let r = 0; r < this.level.rows; r++) {
        if (this.level.tileAt(col, r) === 1 /* Solid */) return r * this.level.tileSize;
      }
      return this.level.heightPx;
    }
    /** Aktywacja markerów, gdy prawa krawędź kamery je mija; fale biegaczy. */
    processSpawns(dt) {
      const camRight = this.camera.right;
      const activate = this.pendingMarkers.filter((m) => m.x < camRight + 8);
      if (activate.length) {
        this.pendingMarkers = this.pendingMarkers.filter((m) => !activate.includes(m));
        for (const m of activate) {
          switch (m.type) {
            case "sniper":
              this.spawnEnemy(new Sniper(m.x, m.y));
              break;
            case "drone":
              this.spawnEnemy(new Drone(m.x, m.y));
              break;
            case "runnerSpawner":
              this.runnerWaves.push({ marker: m, remaining: CONFIG.enemies.runner.waveCount, timer: 0 });
              break;
          }
        }
      }
      if (this.camera.locked) {
        this.runnerWaves = [];
        return;
      }
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
    resolveCollisions() {
      const player = this.player;
      this.playerBullets.forEachActive((b) => {
        for (const e of this.enemies) {
          if (e.alive && e.overlapsCircle(b.x, b.y, b.radius)) {
            e.takeHit(b.damage, this);
            this.particles.emit({ x: b.x, y: b.y, count: 3, color: "#fff", speed: [20, 60], life: [0.08, 0.16] });
            b.active = false;
            return;
          }
        }
        if (this.boss && this.boss.alive && this.boss.overlapsCircle(b.x, b.y, b.radius)) {
          if (this.boss.vulnerable) {
            this.boss.takeHit(b.damage, this);
            this.particles.emit({ x: b.x, y: b.y, count: 3, color: "#fff", speed: [20, 60], life: [0.08, 0.16] });
          } else {
            this.particles.emit({ x: b.x, y: b.y, count: 2, color: "#7f8c8d", speed: [10, 30], life: [0.1, 0.2] });
          }
          b.active = false;
        }
      });
      if (player.isDead) return;
      this.enemyBullets.forEachActive((b) => {
        if (player.overlapsCircle(b.x, b.y, b.radius)) {
          if (player.takeDamage(b.damage, b.x, this)) b.active = false;
        }
      });
      for (const e of this.enemies) if (e.alive && e.overlaps(player)) e.onTouchPlayer(this);
      if (this.boss && this.boss.alive && !this.boss.isIntro && this.boss.overlaps(player)) this.boss.onTouchPlayer(this);
    }
    // ---- Render ------------------------------------------------------------
    draw(ctx) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.fillStyle = "#141826";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1e2438";
      const par = this.camera.x * 0.3 % 64;
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
      const again = this.input.gamepadConnected ? "START \u2013 jeszcze raz" : "R \u2013 jeszcze raz";
      if (this.state === "gameover") this.hud.drawOverlay(ctx, "GAME OVER", again, "#e74c3c");
      if (this.state === "victory") this.hud.drawOverlay(ctx, "ETAP UKO\u0143CZONY", `SCORE ${this.score}   \xB7   ${again}`, "#2ecc71");
    }
    get wantsRestart() {
      return this.state !== "playing" && this.endTimer > 0.6 && this.input.justPressed("restart");
    }
  };

  // src/core/Game.ts
  var Game = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.accumulator = 0;
      this.lastTime = 0;
      this.running = false;
      canvas.width = CONFIG.view.width;
      canvas.height = CONFIG.view.height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Brak kontekstu 2D");
      this.ctx = ctx;
      this.ctx.imageSmoothingEnabled = false;
      this.input = new Input(window);
      this.scene = new GameScene(this.input);
      window.addEventListener("resize", () => this.fitToWindow());
      this.fitToWindow();
      canvas.focus();
    }
    fitToWindow() {
      const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / CONFIG.view.width, window.innerHeight / CONFIG.view.height)));
      this.canvas.style.width = `${CONFIG.view.width * scale}px`;
      this.canvas.style.height = `${CONFIG.view.height * scale}px`;
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
    restart() {
      this.scene = new GameScene(this.input);
    }
    frame(now) {
      if (!this.running) return;
      let dt = (now - this.lastTime) / 1e3;
      this.lastTime = now;
      if (dt > 0.25) dt = 0.25;
      this.accumulator += dt;
      const step = CONFIG.view.fixedStep;
      let steps = 0;
      while (this.accumulator >= step && steps < CONFIG.view.maxStepsPerFrame) {
        this.input.update();
        this.scene.update(step);
        if (this.scene.wantsRestart) this.restart();
        this.accumulator -= step;
        steps++;
      }
      if (steps === CONFIG.view.maxStepsPerFrame) this.accumulator = 0;
      this.scene.draw(this.ctx);
      requestAnimationFrame((t) => this.frame(t));
    }
  };

  // src/main.ts
  function boot() {
    const canvas = document.getElementById("game");
    if (!canvas) throw new Error('Brak elementu <canvas id="game">');
    const game = new Game(canvas);
    game.start();
    window.game = game;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
//# sourceMappingURL=game.js.map
