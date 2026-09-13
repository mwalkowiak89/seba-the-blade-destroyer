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
    vfx: {
      /** Iskry z tarczy tnącej (cząstek/s). */
      sawSparkRate: 22,
      impactSparks: 6,
      landingDust: 6,
      shake: { playerHit: 3, enemyDeath: 1.5, bossPhase: 4, bossDeath: 7, sweepLand: 2 }
    },
    camera: {
      /** Gracz utrzymywany w tej części ekranu (0..1) podczas biegu w prawo. */
      followFraction: 0.4,
      /** Współczynnik wygładzania (większy = szybciej dogania). */
      smoothing: 10
    },
    player: {
      width: 14,
      standHeight: 42,
      crouchHeight: 26,
      runSpeed: 105,
      /** Skok o stałej wysokości (bez zmiennej wysokości – jak w Contrze). */
      jumpVelocity: -470,
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
        width: 14,
        height: 40,
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
        width: 22,
        height: 22,
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
        width: 26,
        height: 28,
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
      this.shakeTime = 0;
      this.shakeDuration = 0;
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
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
    /** Krótkie drżenie ekranu (px, s). Kolejne wywołanie nadpisuje tylko, gdy mocniejsze. */
    shake(intensity, duration) {
      if (intensity < this.shakeIntensity && this.shakeTime > 0) return;
      this.shakeIntensity = intensity;
      this.shakeDuration = this.shakeTime = duration;
    }
    update(dt) {
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        const k = this.shakeIntensity * (this.shakeTime / this.shakeDuration);
        this.shakeX = Math.round((Math.random() * 2 - 1) * k);
        this.shakeY = Math.round((Math.random() * 2 - 1) * k);
      } else {
        this.shakeX = this.shakeY = 0;
      }
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
      ctx.translate(-Math.round(this.x) + this.shakeX, -Math.round(this.y) + this.shakeY);
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

  // src/assets/manifest.generated.ts
  var MANIFEST = {
    "sheets": {
      "seba": {
        "file": "assets/sprites/player/seba.png",
        "frameW": 57,
        "frameH": 53,
        "cols": 8,
        "clips": {
          "idle": {
            "frames": [
              0,
              1,
              2,
              3
            ],
            "fps": 6,
            "loop": true
          },
          "run": {
            "frames": [
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11
            ],
            "fps": 14,
            "loop": true
          },
          "run_shoot": {
            "frames": [
              12,
              13,
              14,
              15,
              16,
              17,
              18,
              19
            ],
            "fps": 14,
            "loop": true
          },
          "shoot": {
            "frames": [
              20
            ],
            "fps": 1,
            "loop": true
          },
          "crouch": {
            "frames": [
              21
            ],
            "fps": 1,
            "loop": true
          },
          "hurt": {
            "frames": [
              22
            ],
            "fps": 1,
            "loop": true
          },
          "jump": {
            "frames": [
              23,
              24,
              25,
              26
            ],
            "fps": 8,
            "loop": false
          },
          "spin": {
            "frames": [
              27,
              28,
              29,
              30,
              31,
              32,
              33
            ],
            "fps": 14,
            "loop": true
          }
        },
        "anchor": "bottom",
        "anchorX": 31,
        "pivots": {
          "stand": {
            "x": 10,
            "y": -40
          },
          "crouch": {
            "x": 6,
            "y": -23
          }
        }
      },
      "runner": {
        "file": "assets/sprites/enemies/runner.png",
        "frameW": 57,
        "frameH": 53,
        "cols": 9,
        "clips": {
          "run": {
            "frames": [
              0,
              1,
              2,
              3,
              4,
              5,
              6,
              7
            ],
            "fps": 16,
            "loop": true
          },
          "jump": {
            "frames": [
              3
            ],
            "fps": 1,
            "loop": true
          },
          "hurt": {
            "frames": [
              8
            ],
            "fps": 1,
            "loop": true
          }
        },
        "anchor": "bottom",
        "anchorX": 31
      },
      "drone": {
        "file": "assets/sprites/enemies/drone.png",
        "frameW": 36,
        "frameH": 49,
        "cols": 4,
        "clips": {
          "patrol": {
            "frames": [
              0,
              1,
              2,
              3
            ],
            "fps": 10,
            "loop": true
          },
          "charge": {
            "frames": [
              0,
              1,
              2,
              3
            ],
            "fps": 20,
            "loop": true
          },
          "return": {
            "frames": [
              0,
              1,
              2,
              3
            ],
            "fps": 10,
            "loop": true
          }
        },
        "anchor": "center",
        "anchorX": 18,
        "anchorY": 16
      },
      "turret": {
        "file": "assets/sprites/enemies/turret.png",
        "frameW": 25,
        "frameH": 23,
        "cols": 6,
        "clips": {
          "idle": {
            "frames": [
              0
            ],
            "fps": 1,
            "loop": true
          },
          "aim": {
            "frames": [
              1,
              2,
              3,
              4,
              5
            ],
            "fps": 10,
            "loop": false
          },
          "cooldown": {
            "frames": [
              0
            ],
            "fps": 1,
            "loop": true
          }
        },
        "anchor": "bottom",
        "anchorX": 13
      },
      "shot": {
        "file": "assets/sprites/fx/shot.png",
        "frameW": 15,
        "frameH": 11,
        "cols": 3,
        "clips": {
          "fly": {
            "frames": [
              0,
              1,
              2
            ],
            "fps": 18,
            "loop": true
          }
        },
        "anchor": "center",
        "anchorX": 8,
        "anchorY": 5
      },
      "shotHit": {
        "file": "assets/sprites/fx/shot-hit.png",
        "frameW": 15,
        "frameH": 11,
        "cols": 3,
        "clips": {
          "play": {
            "frames": [
              0,
              1,
              2
            ],
            "fps": 24,
            "loop": false
          }
        },
        "anchor": "center",
        "anchorX": 7,
        "anchorY": 5
      },
      "explosion": {
        "file": "assets/sprites/fx/explosion.png",
        "frameW": 55,
        "frameH": 52,
        "cols": 6,
        "clips": {
          "play": {
            "frames": [
              0,
              1,
              2,
              3,
              4,
              5
            ],
            "fps": 16,
            "loop": false
          }
        },
        "anchor": "center",
        "anchorX": 27,
        "anchorY": 26
      },
      "makita": {
        "file": "assets/sprites/player/makita.png",
        "frameW": 28,
        "frameH": 28,
        "cols": 6,
        "clips": {
          "horizontal": {
            "frames": [
              0,
              1
            ],
            "fps": 30,
            "loop": true
          },
          "diagonal": {
            "frames": [
              2,
              3
            ],
            "fps": 30,
            "loop": true
          },
          "vertical": {
            "frames": [
              4,
              5
            ],
            "fps": 30,
            "loop": true
          }
        },
        "anchor": "pivot",
        "pivots": {
          "horizontal": {
            "x": 6,
            "y": 13
          },
          "diagonal": {
            "x": 8,
            "y": 19
          },
          "vertical": {
            "x": 13,
            "y": 21
          }
        },
        "muzzle": {
          "horizontal": {
            "x": 27,
            "y": 13
          },
          "diagonal": {
            "x": 23,
            "y": 4
          },
          "vertical": {
            "x": 13,
            "y": 0
          }
        }
      },
      "muzzle": {
        "file": "assets/sprites/fx/muzzle.png",
        "frameW": 12,
        "frameH": 12,
        "cols": 2,
        "clips": {
          "flash": {
            "frames": [
              0,
              1
            ],
            "fps": 30,
            "loop": false
          }
        },
        "anchor": "center",
        "anchorX": 5,
        "anchorY": 5
      },
      "saw": {
        "file": "assets/sprites/fx/saw.png",
        "frameW": 12,
        "frameH": 12,
        "cols": 2,
        "clips": {
          "spin": {
            "frames": [
              0,
              1
            ],
            "fps": 24,
            "loop": true
          }
        },
        "anchor": "center",
        "anchorX": 5,
        "anchorY": 5
      }
    },
    "images": {
      "tileset": {
        "file": "assets/tilesets/industrial.png",
        "tileSize": 16,
        "cols": 8
      },
      "portrait": {
        "file": "assets/sprites/ui/portrait.png",
        "w": 20,
        "h": 20
      },
      "skyline": {
        "file": "assets/backgrounds/skyline.png",
        "w": 256,
        "h": 240
      },
      "buildingsFar": {
        "file": "assets/backgrounds/buildings-bg.png",
        "w": 144,
        "h": 124
      },
      "buildingsNear": {
        "file": "assets/backgrounds/near-buildings-bg.png",
        "w": 493,
        "h": 209
      },
      "scaffold": {
        "file": "assets/backgrounds/scaffold.png",
        "w": 320,
        "h": 240
      }
    },
    "tiles": {
      "plate": 0,
      "plateB": 1,
      "edgeTop": 2,
      "edgeBottom": 3,
      "edgeLeft": 4,
      "edgeRight": 5,
      "grate": 6,
      "grateL": 7,
      "grateR": 8,
      "grateLR": 9,
      "column": 10,
      "columnTop": 11,
      "pipe": 12,
      "pipeTop": 13
    }
  };

  // src/render/Assets.ts
  var _Assets = class _Assets {
    static loadImage(name, url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          _Assets.images.set(name, img);
          resolve(img);
        };
        img.onerror = () => reject(new Error(`Nie mo\u017Cna wczyta\u0107 obrazu: ${url}`));
        img.src = url;
      });
    }
    static image(name) {
      return _Assets.images.get(name);
    }
  };
  _Assets.images = /* @__PURE__ */ new Map();
  var Assets = _Assets;

  // src/assets/SpriteSheet.ts
  var SpriteSheet = class {
    constructor(image, def) {
      this.image = image;
      this.def = def;
      this.white = null;
    }
    /** Biała silhouetka sheetu (flash trafienia) – tworzona leniwie raz. */
    get flashImage() {
      if (!this.white) {
        const c = document.createElement("canvas");
        c.width = this.image.width;
        c.height = this.image.height;
        const g = c.getContext("2d");
        g.drawImage(this.image, 0, 0);
        g.globalCompositeOperation = "source-in";
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, c.width, c.height);
        this.white = c;
      }
      return this.white;
    }
    get frameW() {
      return this.def.frameW;
    }
    get frameH() {
      return this.def.frameH;
    }
    clip(name) {
      return this.def.clips[name];
    }
    /** Indeks klatki dla klipu w czasie t (s). */
    frameAt(clipName, t, fallback = "idle") {
      const clip = this.def.clips[clipName] ?? this.def.clips[fallback] ?? Object.values(this.def.clips)[0];
      const n = clip.frames.length;
      let i = Math.floor(Math.max(0, t) * clip.fps);
      i = clip.loop === false ? Math.min(i, n - 1) : i % n;
      return clip.frames[i];
    }
    clipDuration(clipName) {
      const clip = this.def.clips[clipName];
      return clip ? clip.frames.length / clip.fps : 0;
    }
    /**
     * Rysuje klatkę tak, aby punkt kotwicy (ax, ay w klatce) trafił w (x, y) świata.
     * flipX odbija względem kotwicy. Pozycje zaokrąglane do pełnych pikseli (pixel-perfect).
     */
    drawAnchored(ctx, frame, x, y, ax, ay, opts = {}) {
      const sx = frame % this.def.cols * this.frameW;
      const sy = Math.floor(frame / this.def.cols) * this.frameH;
      ctx.save();
      if (opts.alpha !== void 0) ctx.globalAlpha = opts.alpha;
      ctx.translate(Math.round(x), Math.round(y));
      if (opts.rotation) ctx.rotate(opts.rotation);
      ctx.scale(opts.flipX ? -1 : 1, opts.flipY ? -1 : 1);
      ctx.drawImage(opts.flash ? this.flashImage : this.image, sx, sy, this.frameW, this.frameH, -ax, -ay, this.frameW, this.frameH);
      ctx.restore();
    }
  };

  // src/assets/AssetLoader.ts
  var _Sheets = class _Sheets {
    static get(name) {
      const s = _Sheets.map.get(name);
      if (!s) throw new Error(`Sheet nie za\u0142adowany: ${name}`);
      return s;
    }
    static tryGet(name) {
      return _Sheets.map.get(name);
    }
    static set(name, sheet) {
      _Sheets.map.set(name, sheet);
    }
  };
  _Sheets.map = /* @__PURE__ */ new Map();
  var Sheets = _Sheets;
  var Images = class {
    static get(name) {
      const img = Assets.image(name);
      if (!img) throw new Error(`Obraz nie za\u0142adowany: ${name}`);
      return img;
    }
    static tryGet(name) {
      return Assets.image(name);
    }
  };
  var PIXEL_FONT = "KenneyPixel";
  async function loadAllAssets(onProgress) {
    const sheetEntries = Object.entries(MANIFEST.sheets);
    const imageEntries = Object.entries(MANIFEST.images);
    const total = sheetEntries.length + imageEntries.length + 1;
    let done = 0;
    const tick = () => onProgress?.(++done, total);
    await Promise.all([
      ...sheetEntries.map(async ([name, def]) => {
        const img = await Assets.loadImage(`sheet:${name}`, def.file);
        Sheets.set(name, new SpriteSheet(img, def));
        tick();
      }),
      ...imageEntries.map(async ([name, def]) => {
        await Assets.loadImage(name, def.file);
        tick();
      }),
      loadFont().then(tick)
    ]);
  }
  async function loadFont() {
    try {
      const face = new FontFace(PIXEL_FONT, "url(assets/fonts/KenneyPixel.ttf)");
      await face.load();
      document.fonts.add(face);
    } catch {
    }
  }

  // src/render/Fx.ts
  var FxSprite = class {
    constructor() {
      this.active = false;
      this.sheet = "shotHit";
      this.clip = "play";
      this.x = 0;
      this.y = 0;
      this.t = 0;
      this.duration = 0;
      this.rotation = 0;
      this.flipX = false;
      /** Opcjonalne śledzenie pozycji (np. muzzle flash przy lufie). */
      this.follow = null;
    }
  };
  var FxSystem = class {
    constructor() {
      this.pool = new Pool(64, () => new FxSprite());
    }
    spawn(sheet, x, y, opts = {}) {
      const s = Sheets.tryGet(sheet);
      if (!s) return;
      const f = this.pool.spawn();
      if (!f) return;
      f.sheet = sheet;
      f.clip = opts.clip ?? "play";
      f.x = x;
      f.y = y;
      f.t = 0;
      f.duration = s.clipDuration(f.clip);
      f.rotation = opts.rotation ?? 0;
      f.flipX = opts.flipX ?? false;
      f.follow = opts.follow ?? null;
    }
    update(dt) {
      this.pool.forEachActive((f) => {
        f.t += dt;
        if (f.follow) {
          const p = f.follow();
          f.x = p.x;
          f.y = p.y;
        }
        if (f.t >= f.duration) f.active = false;
      });
    }
    draw(ctx) {
      this.pool.forEachActive((f) => {
        const s = Sheets.get(f.sheet);
        s.drawAnchored(ctx, s.frameAt(f.clip, f.t, f.clip), f.x, f.y, s.def.anchorX ?? s.frameW / 2, s.def.anchorY ?? s.frameH / 2, { rotation: f.rotation, flipX: f.flipX });
      });
    }
    clear() {
      this.pool.clear();
    }
  };

  // src/render/Parallax.ts
  var Parallax = class {
    constructor(layers) {
      this.layers = layers;
    }
    draw(ctx, camX) {
      const W = CONFIG.view.width;
      for (const l of this.layers) {
        const w = l.image.width;
        const shift = Math.round(camX * l.scroll) - (l.offsetX ?? 0);
        ctx.globalAlpha = l.alpha ?? 1;
        if (l.repeat === false) {
          ctx.drawImage(l.image, -shift, l.y);
          continue;
        }
        let x = -((shift % w + w) % w);
        for (; x < W; x += w) ctx.drawImage(l.image, x, Math.round(l.y));
      }
      ctx.globalAlpha = 1;
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

  // src/render/TileRenderer.ts
  var TileRenderer = class {
    constructor(level) {
      this.level = level;
      this.decos = [];
      this.image = Images.get("tileset");
      this.ts = MANIFEST.images.tileset.tileSize;
      this.cols = MANIFEST.images.tileset.cols;
      this.buildDecorations();
    }
    blit(ctx, tile, col, row) {
      const idx = MANIFEST.tiles[tile];
      const sx = idx % this.cols * this.ts, sy = Math.floor(idx / this.cols) * this.ts;
      ctx.drawImage(this.image, sx, sy, this.ts, this.ts, col * this.ts, row * this.ts, this.ts, this.ts);
    }
    buildDecorations() {
      const L = this.level;
      for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
        if (L.tileAt(c, r) !== 2 /* OneWay */) continue;
        const isEnd = L.tileAt(c - 1, r) !== 2 /* OneWay */ || L.tileAt(c + 1, r) !== 2 /* OneWay */;
        if (!isEnd) continue;
        for (let k = 1; k <= 8 && r + k < L.rows; k++) {
          if (L.tileAt(c, r + k) !== 0 /* Empty */) break;
          this.decos.push({ col: c, row: r + k, tile: k === 1 ? "columnTop" : "column" });
        }
      }
      for (let c = 0; c < L.cols; c++) {
        if ((c * 7 + 3) % 11 !== 0) continue;
        for (let r = 1; r < L.rows; r++) {
          if (L.tileAt(c, r) === 1 /* Solid */ && L.tileAt(c, r - 1) === 0 /* Empty */) {
            const h = 2 + c % 3;
            let ok = true;
            for (let k = 1; k <= h; k++) if (L.tileAt(c, r - k) !== 0 /* Empty */) ok = false;
            if (!ok) break;
            for (let k = 1; k <= h; k++) this.decos.push({ col: c, row: r - k, tile: k === h ? "pipeTop" : "pipe" });
            break;
          }
        }
      }
    }
    /** Dekoracje – rysować przed encjami. */
    drawBackground(ctx, camX, camW) {
      const c0 = Math.floor(camX / this.ts) - 1, c1 = Math.ceil((camX + camW) / this.ts) + 1;
      for (const d of this.decos) if (d.col >= c0 && d.col <= c1) this.blit(ctx, d.tile, d.col, d.row);
    }
    drawTiles(ctx, camX, camW) {
      const L = this.level;
      const c0 = Math.max(0, Math.floor(camX / this.ts));
      const c1 = Math.min(L.cols - 1, Math.ceil((camX + camW) / this.ts));
      for (let r = 0; r < L.rows; r++) {
        for (let c = c0; c <= c1; c++) {
          const t = L.tileAt(c, r);
          if (t === 1 /* Solid */) {
            this.blit(ctx, (c * 31 + r * 17) % 5 === 0 ? "plateB" : "plate", c, r);
            if (L.tileAt(c, r - 1) !== 1 /* Solid */) this.blit(ctx, "edgeTop", c, r);
            if (L.tileAt(c, r + 1) !== 1 /* Solid */ && r + 1 < L.rows) this.blit(ctx, "edgeBottom", c, r);
            if (L.tileAt(c - 1, r) !== 1 /* Solid */) this.blit(ctx, "edgeLeft", c, r);
            if (L.tileAt(c + 1, r) !== 1 /* Solid */) this.blit(ctx, "edgeRight", c, r);
          } else if (t === 2 /* OneWay */) {
            const l = L.tileAt(c - 1, r) !== 2 /* OneWay */, rr = L.tileAt(c + 1, r) !== 2 /* OneWay */;
            this.blit(ctx, l && rr ? "grateLR" : l ? "grateL" : rr ? "grateR" : "grate", c, r);
          }
        }
      }
    }
  };

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
      this.age = 0;
    }
  };
  function impactSparks(world, x, y, vx, vy) {
    const back = Math.atan2(-vy, -vx);
    world.fx.spawn("shotHit", x, y, { rotation: Math.atan2(vy, vx) });
    world.particles.emit({
      x,
      y,
      count: CONFIG.vfx.impactSparks,
      color: ["#ffe36b", "#ffb300", "#ffffff"],
      speed: [40, 130],
      life: [0.12, 0.35],
      size: [1, 1.6],
      gravity: 380,
      angle: [back - 0.9, back + 0.9]
    });
  }
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
      b.age = 0;
      return b;
    }
    update(dt, world) {
      const cam = world.camera;
      this.pool.forEachActive((b) => {
        b.life -= dt;
        b.age += dt;
        b.vy += b.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.life <= 0 || !cam.isVisible(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2, 24) || b.hitsTerrain && world.level.isSolidAtPx(b.x, b.y)) {
          if (b.hitsTerrain && b.life > 0) impactSparks(world, b.x, b.y, b.vx, b.vy);
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
      const shot = Sheets.tryGet("shot"), saw = Sheets.tryGet("saw");
      this.pool.forEachActive((b) => {
        if (b.owner === "player" && shot) {
          shot.drawAnchored(ctx, shot.frameAt("fly", b.age), b.x, b.y, shot.def.anchorX ?? 8, shot.def.anchorY ?? 5, { rotation: Math.atan2(b.vy, b.vx) });
          return;
        }
        if (b.owner === "enemy" && saw) {
          saw.drawAnchored(ctx, saw.frameAt("spin", b.age), b.x, b.y, 5, 5, { rotation: b.age * 14 });
          return;
        }
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
  var SpriteSheetVisual = class {
    constructor(sheetName, opts = {}) {
      this.sheetName = sheetName;
      this.opts = opts;
    }
    draw(ctx, p) {
      const sheet = Sheets.tryGet(this.sheetName);
      if (!sheet) {
        this.opts.placeholder?.draw(ctx, p);
        return;
      }
      const def = sheet.def;
      const frame = sheet.frameAt(p.anim, p.time, this.opts.fallback ?? "idle");
      const ax = def.anchorX ?? sheet.frameW / 2;
      let x = p.x + p.w / 2 + (this.opts.offsetX ?? 0) * p.facing;
      let y, ay;
      if (def.anchor === "center") {
        y = p.y + p.h / 2;
        ay = def.anchorY ?? sheet.frameH / 2;
      } else {
        y = p.y + p.h;
        ay = sheet.frameH;
      }
      y += this.opts.offsetY ?? 0;
      if (p.rotation) {
        y = p.y + p.h / 2;
        ay = sheet.frameH - p.h / 2;
      }
      sheet.drawAnchored(ctx, frame, x, y, ax, ay, { flipX: p.facing < 0, rotation: p.rotation, alpha: p.alpha, flash: p.flash });
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
  var MAKITA = MANIFEST.sheets.makita;
  var PlayerController = class extends Entity {
    constructor(input, x, y) {
      super();
      this.input = input;
      this.visual = new SpriteSheetVisual("seba", {
        placeholder: new PlaceholderVisual({ color: "#3d7bff", accent: "#ffb347", barrel: true, barrelLength: 8, outline: "#1b3a80" })
      });
      this.health = new HealthComponent(P2.maxHp, P2.invulnTime);
      this.weapon = new MakitaGun();
      this.state = IDLE;
      this.aim = { x: 1, y: 0 };
      /** Punkt wylotu tarczy/lufy w świecie – źródło pocisków, błysku i iskier. */
      this.muzzle = { x: 0, y: 0 };
      // dane stanów
      this.somersaultTime = -1;
      this.hurtTimer = 0;
      this.knockbackDir = -1;
      this.dropThroughTimer = 0;
      this.lastSafe = { x: 0, y: 0 };
      this.stateTime = 0;
      this.firingTimer = 0;
      this.sparkAcc = 0;
      this.wasOnGround = false;
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
    get isFiring() {
      return this.firingTimer > 0;
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
      world.particles.emit({ x: this.cx, y: this.cy, count: 10, color: ["#ff4d4d", "#ffffff", "#ffb300"], speed: [40, 120], life: [0.2, 0.45], gravity: 300 });
      world.camera.shake(CONFIG.vfx.shake.playerHit, 0.22);
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
      if (this.firingTimer > 0) this.firingTimer -= dt;
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
      if (this.onGround && !this.wasOnGround && !this.isDead) this.landingDust(world);
      this.wasOnGround = this.onGround;
      this.clampToCamera(world);
      this.checkPit(world);
      const aim = resolveAim(this.input, this.state.name, this.facing);
      if (aim) this.aim = aim;
      this.updateWeaponPose();
      if (aim && this.input.held("fire")) this.fire(world);
      if (!this.isDead && this.weaponVisible) this.sawSparks(dt, world);
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
    // ---- Broń: pozycja, orientacja, wylot -----------------------------------
    /** Broń schowana podczas koziołka i po trafieniu (jak w Contrze). */
    get weaponVisible() {
      const n = this.state.name;
      return n !== "jump" && n !== "hurt" && n !== "dead";
    }
    get orientation() {
      if (Math.abs(this.aim.y) < 0.3) return "horizontal";
      if (Math.abs(this.aim.x) < 0.3) return "vertical";
      return "diagonal";
    }
    /** Punkt dłoni w świecie (kotwica nakładki broni). */
    handPoint() {
      const pv = this.state.name === "crouch" || this.isDead ? MANIFEST.sheets.seba.pivots.crouch : MANIFEST.sheets.seba.pivots.stand;
      return { x: this.cx + pv.x * this.facing, y: this.bottom + pv.y };
    }
    updateWeaponPose() {
      const hand = this.handPoint();
      const o = this.orientation;
      const pv = MAKITA.pivots[o], mz = MAKITA.muzzle[o];
      const flipY = this.aim.y > 0.3;
      this.muzzle.x = hand.x + (mz.x - pv.x) * this.facing;
      this.muzzle.y = hand.y + (mz.y - pv.y) * (flipY ? -1 : 1);
    }
    fire(world) {
      const origin = this.weaponVisible ? this.muzzle : { x: this.cx + this.aim.x * 10, y: this.cy + this.aim.y * 10 };
      if (this.weapon.tryFire(world.playerBullets, origin.x, origin.y, this.aim.x, this.aim.y)) {
        Sfx.play("shoot");
        this.firingTimer = 0.14;
        world.fx.spawn("muzzle", origin.x, origin.y, { clip: "flash", follow: this.weaponVisible ? () => this.muzzle : void 0 });
        world.particles.emit({ x: origin.x, y: origin.y, count: 2, color: ["#ffe36b", "#ffffff"], speed: [20, 60], life: [0.05, 0.12], size: [1, 2], angle: [Math.atan2(this.aim.y, this.aim.x) - 0.4, Math.atan2(this.aim.y, this.aim.x) + 0.4] });
      }
    }
    /** Ciągły strumień iskier z pracującej tarczy. */
    sawSparks(dt, world) {
      this.sparkAcc += dt * CONFIG.vfx.sawSparkRate * (this.isFiring ? 2 : 1);
      while (this.sparkAcc >= 1) {
        this.sparkAcc -= 1;
        const base = Math.atan2(this.aim.y, this.aim.x);
        world.particles.emit({
          x: this.muzzle.x,
          y: this.muzzle.y,
          count: 1,
          color: ["#ffb300", "#ffe36b", "#ffffff", "#ff7a1a"],
          speed: [30, 90],
          life: [0.15, 0.4],
          size: [1, 1.6],
          gravity: 420,
          angle: [base + 0.6, base + 2.2]
        });
      }
    }
    landingDust(world) {
      world.particles.emit({
        x: this.cx,
        y: this.bottom - 1,
        count: CONFIG.vfx.landingDust,
        color: ["#8a94a3", "#5b6577", "#c3c8d1"],
        speed: [15, 45],
        life: [0.25, 0.5],
        size: [1.5, 3],
        angle: [-Math.PI * 0.95, -Math.PI * 0.05],
        spreadX: 5
      });
    }
    // ---- Render ------------------------------------------------------------
    animName() {
      switch (this.state.name) {
        case "idle":
          return this.isFiring ? "shoot" : "idle";
        case "run":
          return this.isFiring ? "run_shoot" : "run";
        case "crouch":
          return "crouch";
        case "jump":
          return "spin";
        case "fall":
          return "jump";
        case "hurt":
        case "dead":
          return "hurt";
      }
    }
    draw(ctx) {
      const inv = this.health.isInvulnerable && !this.isDead;
      const alpha = this.isDead ? 0.7 : inv && Math.floor(this.health.invulnRemaining * P2.flashHz) % 2 === 0 ? 0.3 : 1;
      const flash = this.state.name === "hurt" && this.stateTime < 0.08;
      const spin = this.somersaultTime >= 0;
      const rotation = spin && !Sheets.tryGet("seba") ? this.somersaultTime / P2.somersaultDuration * Math.PI * 2 * P2.somersaultTurns * this.facing : 0;
      this.visual.draw(ctx, {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h,
        facing: this.facing,
        anim: this.animName(),
        time: this.stateTime,
        aim: this.aim,
        rotation,
        alpha,
        flash
      });
      if (this.weaponVisible) this.drawWeapon(ctx, alpha);
    }
    drawWeapon(ctx, alpha) {
      const sheet = Sheets.tryGet("makita");
      if (!sheet) return;
      const o = this.orientation;
      const hand = this.handPoint();
      const pv = MAKITA.pivots[o];
      const frame = sheet.frameAt(o, this.age, "horizontal");
      sheet.drawAnchored(ctx, frame, hand.x, hand.y, pv.x, pv.y, { flipX: this.facing < 0, flipY: this.aim.y > 0.3, alpha });
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
      world.fx.spawn("explosion", this.cx, this.cy);
      world.camera.shake(CONFIG.vfx.shake.enemyDeath, 0.15);
      world.particles.emit({
        x: this.cx,
        y: this.cy,
        count: 14,
        color: ["#ff9f43", "#ffdd59", "#ffffff", "#8a94a3"],
        speed: [40, 160],
        life: [0.25, 0.7],
        size: [1, 3],
        gravity: 320
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
      this.visual = new SpriteSheetVisual("runner", { fallback: "run", placeholder: new PlaceholderVisual({ color: "#e0563c", accent: "#fff", outline: "#7a2a1a" }) });
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
      this.drawVisual(ctx, this.anim);
    }
  };

  // src/entities/enemies/Sniper.ts
  var S = CONFIG.enemies.sniper;
  var Sniper = class extends EnemyBase {
    constructor(x, y) {
      super("sniper", S.hp, S.contactDamage, S.score);
      this.visual = new SpriteSheetVisual("turret", { placeholder: new PlaceholderVisual({ color: "#8e44ad", accent: "#f1c40f", barrel: true, barrelLength: 12, outline: "#4a1f5c" }) });
      this.modeTime = 0;
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
      this.modeTime += dt;
      switch (this.mode) {
        case "cooldown":
          if (this.timer <= 0 && inRange) {
            this.mode = "aim";
            this.modeTime = 0;
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
            this.modeTime = 0;
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
      if (aiming) {
        const len = 40 + (1 - this.timer / S.aimTime) * 80;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(this.age * 20));
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = "#ff3b3b";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(this.cx) + 0.5, Math.round(this.cy) + 0.5);
        ctx.lineTo(Math.round(this.cx + this.aimDir.x * len) + 0.5, Math.round(this.cy + this.aimDir.y * len) + 0.5);
        ctx.stroke();
        ctx.restore();
      }
      this.visual.draw(ctx, { x: this.x, y: this.y, w: this.w, h: this.h, facing: this.facing, anim: this.mode, time: this.modeTime, flash: this.hitFlash > 0, aim: aiming ? this.aimDir : { x: this.facing, y: 0 } });
    }
  };

  // src/entities/enemies/Drone.ts
  var D = CONFIG.enemies.drone;
  var Drone = class extends EnemyBase {
    constructor(x, y) {
      super("drone", D.hp, D.contactDamage, D.score);
      this.visual = new SpriteSheetVisual("drone", { fallback: "patrol", placeholder: new PlaceholderVisual({ color: "#1abc9c", accent: "#fff", shape: "diamond", faceMarker: false }) });
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
          this.y = py + Math.sin(this.age * 9) * 1.5;
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
      if (this.mode === "charge") {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#ff7a1a";
        ctx.fillRect(Math.round(this.cx) - 2, Math.round(this.bottom), 4, 3);
        ctx.restore();
      }
      this.drawVisual(ctx, this.mode, { tint: this.mode === "charge" ? "#ff7675" : void 0 });
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
          if (boss.moveTowards(boss.x, floorTopY, this.speed * 1.2, dt)) {
            this.stage = "sweepLeft";
            world.camera.shake(CONFIG.vfx.shake.sweepLand, 0.2);
            world.particles.emit({ x: boss.cx, y: boss.bottom, count: 12, color: ["#8a94a3", "#c3c8d1", "#ffb300"], speed: [30, 110], life: [0.2, 0.5], gravity: 300, angle: [-Math.PI, 0], spreadX: boss.w / 2 });
          }
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
      this.pendingShake = 0;
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
        this.pendingShake = CONFIG.vfx.shake.bossPhase;
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
      world.camera.shake(CONFIG.vfx.shake.bossDeath, 0.9);
      for (let i = 0; i < 6; i++) {
        world.fx.spawn("explosion", this.x + Math.random() * this.w, this.y + Math.random() * this.h);
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
      if (this.pendingShake > 0) {
        world.camera.shake(this.pendingShake, 0.4);
        this.pendingShake = 0;
      }
      this.facing = world.player.cx < this.cx ? -1 : 1;
      this.postUpdate(dt, world);
    }
    draw(ctx) {
      const flash = this.hitFlash > 0 || this.telegraphing && Math.floor(this.age * 20) % 2 === 0;
      const pal = BOSS_PALETTES[Math.max(0, Math.min(2, this.phaseIndex))];
      const K = "#050912";
      const x = Math.round(this.x) + Math.round(this.shakeOffset), y = Math.round(this.y), w = this.w, h = this.h;
      const vertical = w < h;
      ctx.save();
      const speed = Math.hypot(this.x - this.prevX, this.y - this.prevY);
      if (speed > 3) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = pal.m;
        ctx.fillRect(Math.round(this.prevX), Math.round(this.prevY), w, h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = K;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = flash ? "#ffffff" : pal.m;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      if (!flash) {
        ctx.fillStyle = pal.l;
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
        ctx.fillRect(x + 1, y + 1, 1, h - 2);
        ctx.fillStyle = pal.d;
        ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
        ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
        ctx.fillStyle = K;
        const len = vertical ? h : w;
        for (let k = 10; k < len - 6; k += 12) {
          if (vertical) {
            ctx.fillRect(x + 2, y + k, w - 4, 1);
            ctx.fillStyle = pal.l;
            ctx.fillRect(x + 4, y + k + 3, 1, 1);
            ctx.fillRect(x + w - 5, y + k + 3, 1, 1);
            ctx.fillStyle = K;
          } else {
            ctx.fillRect(x + k, y + 2, 1, h - 4);
            ctx.fillStyle = pal.l;
            ctx.fillRect(x + k + 3, y + 3, 1, 1);
            ctx.fillStyle = K;
          }
        }
        ctx.fillStyle = pal.l;
        for (let k = 4; k < len - 4; k += 6) {
          if (vertical) ctx.fillRect(this.facing < 0 ? x - 1 : x + w, y + k, 1, 2);
          else ctx.fillRect(x + k, y + h, 2, 1);
        }
      }
      const cx = Math.round(this.cx) + Math.round(this.shakeOffset), cy = Math.round(this.cy);
      ctx.fillStyle = K;
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = pal.d;
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillStyle = this.phaseIndex >= 2 ? Math.floor(this.age * 6) % 2 ? "#ff2a2a" : "#ff8a80" : pal.l;
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 1, cy - 1, 1, 1);
      if (this.phaseIndex >= 2 && !flash) {
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.age * 8);
        ctx.fillStyle = "#ff2a2a";
        ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      }
      ctx.restore();
    }
  };
  var BOSS_PALETTES = [
    { l: "#c3c8d1", m: "#7d8794", d: "#3f4753" },
    { l: "#f5c08a", m: "#d9782a", d: "#7a3b0f" },
    { l: "#ff9a90", m: "#c8302a", d: "#5e1310" }
  ];

  // src/ui/HUD.ts
  var FONT = (px) => `${px}px ${PIXEL_FONT}, monospace`;
  var PL = { \u0105: "a", \u0107: "c", \u0119: "e", \u0142: "l", \u0144: "n", \u00F3: "o", \u015B: "s", \u017A: "z", \u017C: "z", \u0104: "A", \u0106: "C", \u0118: "E", \u0141: "L", \u0143: "N", \u00D3: "O", \u015A: "S", \u0179: "Z", \u017B: "Z", "\u2013": "-" };
  var ascii = (t) => t.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–]/g, (c) => PL[c] ?? c);
  var C = { K: "#050912", P0: "#08202f", P1: "#0d3344", P2: "#13506a", P3: "#1d6c86", R: "#2fb9b0", Y: "#c9a227" };
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
    /** Metalowa obudowa: obrys, płyta, krawędź światła/cienia. */
    panel(ctx, x, y, w, h) {
      ctx.fillStyle = C.K;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.P1;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = C.P3;
      ctx.fillRect(x + 1, y + 1, w - 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, h - 2);
      ctx.fillStyle = C.P0;
      ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
      ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
      ctx.fillStyle = C.R;
      ctx.fillRect(x + 2, y + 2, 1, 1);
      ctx.fillRect(x + w - 3, y + 2, 1, 1);
      ctx.fillRect(x + 2, y + h - 3, 1, 1);
      ctx.fillRect(x + w - 3, y + h - 3, 1, 1);
    }
    draw(ctx, player, score, boss, time) {
      const W = CONFIG.view.width;
      ctx.save();
      ctx.textBaseline = "top";
      ctx.font = FONT(16);
      const px = 6, py = 6;
      this.panel(ctx, px, py, 28, 28);
      const portrait = Images.tryGet("portrait");
      if (portrait) ctx.drawImage(portrait, px + 4, py + 4);
      else {
        ctx.fillStyle = "#4f8fd6";
        ctx.fillRect(px + 6, py + 6, 16, 16);
      }
      const segs = 10, segW = 6, segH = 8, gap = 1;
      const bx = px + 32, by = py;
      const barW = segs * (segW + gap) + 5, barH = segH + 6;
      this.panel(ctx, bx, by, barW, barH);
      const f = player.health.fraction;
      const lit = Math.ceil(f * segs);
      const col = f > 0.5 ? "#3ddc84" : f > 0.25 ? "#ffb300" : "#ff3b3b";
      const colDark = f > 0.5 ? "#1c7a48" : f > 0.25 ? "#8a5f00" : "#7a1a1a";
      for (let i = 0; i < segs; i++) {
        const sx = bx + 3 + i * (segW + gap), sy = by + 3;
        const on = i < lit && !(f <= 0.25 && f > 0 && Math.floor(time * 6) % 2 === 0 && i === lit - 1);
        ctx.fillStyle = on ? col : C.P0;
        ctx.fillRect(sx, sy, segW, segH);
        if (on) {
          ctx.fillStyle = colDark;
          ctx.fillRect(sx, sy + segH - 2, segW, 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx + 1, sy + 1, 1, 1);
        }
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(ascii("SEBA"), bx, by + barH + 1);
      ctx.fillStyle = C.R;
      ctx.fillText(ascii(`${Math.ceil(player.health.current)}`), bx + 40, by + barH + 1);
      ctx.textAlign = "right";
      ctx.fillStyle = C.Y;
      ctx.fillText(ascii("SCORE"), W - 8, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(score.toString().padStart(6, "0"), W - 8, 18);
      ctx.textAlign = "left";
      if (boss && boss.alive) {
        const bw = 96, bh = 8, bxx = Math.round((W - bw) / 2) + 6, byy = 6;
        this.panel(ctx, bxx - 3, byy - 3, bw + 6, bh + 6);
        ctx.fillStyle = C.P0;
        ctx.fillRect(bxx, byy, bw, bh);
        ctx.fillStyle = boss.tint;
        ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), bh);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), 1);
        ctx.fillStyle = "#ffffff";
        for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bxx + bw * t), byy - 1, 1, bh + 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "#ff9a90";
        ctx.fillText(ascii(CONFIG.boss.name), W / 2, byy + bh + 4);
        ctx.textAlign = "left";
      }
      if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
        ctx.textAlign = "center";
        ctx.font = FONT(24);
        ctx.fillStyle = C.K;
        ctx.fillText(ascii(this.phaseBanner), W / 2 + 1, 41);
        ctx.fillStyle = "#ffdd59";
        ctx.fillText(ascii(this.phaseBanner), W / 2, 40);
      }
      ctx.restore();
    }
    drawOverlay(ctx, title, subtitle, color) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.save();
      ctx.fillStyle = "rgba(5,9,18,0.6)";
      ctx.fillRect(0, 0, W, H);
      this.panel(ctx, 40, H / 2 - 28, W - 80, 56);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = FONT(32);
      ctx.fillStyle = C.K;
      ctx.fillText(ascii(title), W / 2 + 1, H / 2 - 9);
      ctx.fillStyle = color;
      ctx.fillText(ascii(title), W / 2, H / 2 - 10);
      ctx.font = FONT(16);
      ctx.fillStyle = "#ddd";
      ctx.fillText(ascii(subtitle), W / 2, H / 2 + 12);
      ctx.restore();
    }
    drawHint(ctx, alpha, gamepad = false) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = FONT(16);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(ascii(
        gamepad ? "D-PAD/GA\u0141KA: RUCH   A: SKOK   B/X/RT: OGIE\u0143   D\xD3\u0141+A: ZESKOK" : "STRZA\u0141KI: RUCH   Z: SKOK   X: OGIE\u0143   D\xD3\u0141+Z: ZESKOK"
      ), W / 2, H - 14);
      ctx.restore();
    }
    static drawLoading(ctx, done, total) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      ctx.fillStyle = "#050912";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#0d3344";
      ctx.fillRect(W / 2 - 60, H / 2, 120, 6);
      ctx.fillStyle = "#2fb9b0";
      ctx.fillRect(W / 2 - 60, H / 2, Math.round(120 * (total ? done / total : 0)), 6);
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#c3c8d1";
      ctx.fillText(ascii("\u0141ADOWANIE..."), W / 2, H / 2 - 6);
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
      this.fx = new FxSystem();
      this.events = new EventBus();
      this.parallax = null;
      this.tiles = null;
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
      this.setupRendering();
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
    /** Warstwy tła i tileset – tylko gdy zasoby są załadowane (headless test rysuje placeholdery). */
    setupRendering() {
      const sky = Images.tryGet("skyline"), far = Images.tryGet("buildingsFar"), near = Images.tryGet("buildingsNear"), scaffold = Images.tryGet("scaffold");
      if (sky && far && near && scaffold) {
        const H = CONFIG.view.height;
        this.parallax = new Parallax([
          { image: sky, scroll: 0.1, y: 0 },
          // niebo + daleka sylwetka miasta
          { image: far, scroll: 0.25, y: H - 32 - far.height },
          // dalekie budynki
          { image: near, scroll: 0.4, y: H - 32 - near.height, alpha: 0.8 },
          // ciężka infrastruktura
          { image: scaffold, scroll: 0.7, y: 0, alpha: 0.6 }
          // rusztowania, siatka, kable
        ]);
      }
      if (Images.tryGet("tileset")) this.tiles = new TileRenderer(this.level);
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
      this.camera.update(dt);
      if (this.state !== "playing") {
        this.endTimer += dt;
        this.particles.update(dt);
        this.fx.update(dt);
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
      this.fx.update(dt);
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
        this.enemies = this.enemies.filter((e) => e.kind !== "runner" && e.x > this.arenaX);
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
      if (this.parallax) {
        this.parallax.draw(ctx, this.camera.x);
        ctx.fillStyle = "rgba(5,9,18,0.28)";
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#141826";
        ctx.fillRect(0, 0, W, H);
      }
      ctx.save();
      this.camera.applyTransform(ctx);
      if (this.tiles) {
        this.tiles.drawBackground(ctx, this.camera.x, this.camera.width);
        this.tiles.drawTiles(ctx, this.camera.x, this.camera.width);
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
      this.scene = null;
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
      window.addEventListener("resize", () => this.fitToWindow());
      this.fitToWindow();
      canvas.focus();
    }
    fitToWindow() {
      const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / CONFIG.view.width, window.innerHeight / CONFIG.view.height)));
      this.canvas.style.width = `${CONFIG.view.width * scale}px`;
      this.canvas.style.height = `${CONFIG.view.height * scale}px`;
    }
    /** Ładuje zasoby (ekran ładowania), tworzy scenę i startuje pętlę. */
    async start() {
      if (this.running) return;
      HUD.drawLoading(this.ctx, 0, 1);
      try {
        await loadAllAssets((d, t) => HUD.drawLoading(this.ctx, d, t));
      } catch (e) {
        console.warn("Nie uda\u0142o si\u0119 za\u0142adowa\u0107 cz\u0119\u015Bci zasob\xF3w \u2013 gra u\u017Cyje placeholder\xF3w.", e);
      }
      this.scene = new GameScene(this.input);
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
    restart() {
      this.scene = new GameScene(this.input);
    }
    frame(now) {
      if (!this.running || !this.scene) return;
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
        if (!this.scene) return;
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
    void game.start();
    window.game = game;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
//# sourceMappingURL=game.js.map
