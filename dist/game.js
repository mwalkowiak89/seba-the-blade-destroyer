"use strict";
(() => {
  // src/core/Config.ts
  var CONFIG = {
    view: {
      width: 320,
      height: 240,
      tile: 16,
      fixedStep: 1 / 60,
      maxStepsPerFrame: 3
    },
    physics: {
      gravity: 1300,
      maxFallSpeed: 460
    },
    audio: {
      master: 0.8,
      sfx: 0.9,
      music: 0.5
    },
    vfx: {
      /** Iskry z tarczy tnącej (cząstek/s). */
      sawSparkRate: 22,
      impactSparks: 6,
      landingDust: 6,
      /** Limity cząstek (wydajność): na emisję i maksymalny czas życia (s). */
      maxParticlesPerEmit: 15,
      maxParticleLife: 0.4,
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
      /** Leżenie/czołganie – hurtbox 50% wysokości. */
      proneHeight: 21,
      crawlSpeed: 38,
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
      /** Długość wrażliwej końcówki skrzydła (winglet) – px od czubka. */
      wingletLength: 28,
      /** Rdzeń odsłonięty w fazie 3 (px). */
      coreSize: 14,
      phase1: {
        hoverHz: 0.35,
        attackCooldown: 1.4,
        gust: { telegraph: 0.5, duration: 1.4, push: 150, pronePush: 60 },
        lightning: { count: 3, interval: 0.18, speed: 190, spreadDeg: 14 },
        sweep: { telegraph: 0.45, speed: 260, height: 18 }
      },
      phase2: {
        hoverHz: 0.6,
        attackCooldown: 1.1,
        slam: { telegraph: 0.55, fallSpeed: 620, rest: 0.6, shards: 7, shardSpeed: 170, shardDamage: 10 },
        serviceDrones: 2
      },
      phase3: {
        hoverHz: 0.9,
        attackCooldown: 0.9,
        charge: { telegraph: 0.8, speed: 540, rest: 0.4, returnSpeed: 220 },
        quake: { interval: 2.8, telegraph: 0.5, damage: 10, knockUp: -220 },
        lightning: { count: 5, interval: 0.12, speed: 210, spreadDeg: 24 },
        smokeRate: 30
      },
      finale: { hitStop: 1.5, explosionsDuration: 1.2, fallDuration: 1.3 }
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
    restart: ["KeyR", "Enter"],
    mute: ["KeyM"],
    debug: ["F3"]
  };
  var GAMEPAD_BINDINGS = {
    left: [14],
    right: [15],
    up: [12],
    down: [13],
    jump: [0],
    fire: [1, 2, 7],
    restart: [9],
    mute: [8],
    debug: []
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

  // src/audio/AudioEngine.ts
  var AudioEngine = class {
    static get available() {
      return typeof window !== "undefined" && typeof window.AudioContext === "function";
    }
    /** Kontekst tworzony leniwie; null gdy Web Audio niedostępne. */
    static get ctx() {
      if (this._ctx) return this._ctx;
      if (!this.available) return null;
      this._ctx = new AudioContext();
      this.master = this._ctx.createGain();
      this.master.gain.value = this.muted ? 0 : CONFIG.audio.master;
      this.master.connect(this._ctx.destination);
      this.sfxBus = this._ctx.createGain();
      this.sfxBus.gain.value = CONFIG.audio.sfx;
      this.sfxBus.connect(this.master);
      this.musicBus = this._ctx.createGain();
      this.musicBus.gain.value = CONFIG.audio.music;
      this.musicBus.connect(this.master);
      return this._ctx;
    }
    /** Czy przeglądarka pozwala już grać (po gestach użytkownika). */
    static get running() {
      return this._ctx?.state === "running";
    }
    /** Podpina odblokowanie kontekstu na pierwszy klawisz / klik / dotyk. */
    static hookUnlock() {
      if (this.unlockHooked || typeof window === "undefined") return;
      this.unlockHooked = true;
      const unlock = () => {
        void this.resume();
      };
      for (const ev of ["keydown", "pointerdown", "touchstart"]) window.addEventListener(ev, unlock, { passive: true });
    }
    static async resume() {
      const c = this.ctx;
      if (c && c.state !== "running") {
        try {
          await c.resume();
        } catch {
        }
      }
    }
    static setMuted(m) {
      this.muted = m;
      if (this.master && this._ctx) this.master.gain.setTargetAtTime(m ? 0 : CONFIG.audio.master, this._ctx.currentTime, 0.02);
    }
    static toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }
  };
  AudioEngine._ctx = null;
  AudioEngine.master = null;
  AudioEngine.sfxBus = null;
  AudioEngine.musicBus = null;
  AudioEngine.muted = false;
  AudioEngine.unlockHooked = false;

  // src/audio/Synth.ts
  function renderSfx(def, sampleRate) {
    const n = Math.max(1, Math.floor(def.duration * sampleRate));
    const out = new Float32Array(n);
    const attack = def.attack ?? 4e-3;
    const decay = def.decay ?? def.duration * 0.6;
    const sustainEnd = Math.max(attack, def.duration - decay);
    const duty = def.duty ?? 0.5;
    const f0 = def.freq, f1 = def.freqEnd ?? def.freq;
    let phase = 0;
    let noiseHold = 0, noiseCounter = 0;
    let lp = 0;
    let seed = 19088743;
    const rnd = () => {
      seed = seed * 1664525 + 1013904223 >>> 0;
      return seed / 4294967296 * 2 - 1;
    };
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const u = t / def.duration;
      let f = f0 * Math.pow(f1 / f0, u);
      if (def.arp && def.arp.length) {
        const idx = Math.min(def.arp.length - 1, Math.floor(t / (def.arpStep ?? 0.05)));
        f *= def.arp[idx];
      }
      if (def.vibratoDepth) f *= 1 + Math.sin(t * Math.PI * 2 * (def.vibratoRate ?? 8)) * def.vibratoDepth;
      let s;
      if (def.wave === "noise") {
        const rate = def.noiseRate ?? 0;
        if (rate > 0) {
          noiseCounter += rate / sampleRate;
          if (noiseCounter >= 1) {
            noiseCounter -= 1;
            noiseHold = rnd();
          }
          s = noiseHold;
        } else s = rnd();
      } else {
        phase += f / sampleRate;
        phase -= Math.floor(phase);
        switch (def.wave) {
          case "square":
            s = phase < duty ? 1 : -1;
            break;
          case "triangle":
            s = 4 * Math.abs(phase - 0.5) - 1;
            break;
          case "saw":
            s = 2 * phase - 1;
            break;
          default:
            s = Math.sin(phase * Math.PI * 2);
        }
      }
      if (def.lowpass) {
        const fc = def.lowpass * Math.pow((def.lowpassEnd ?? def.lowpass) / def.lowpass, u);
        const a = 1 - Math.exp(-2 * Math.PI * fc / sampleRate);
        lp += a * (s - lp);
        s = lp;
      }
      let env;
      if (t < attack) env = t / attack;
      else if (t < sustainEnd) env = 1;
      else env = Math.pow(1 - (t - sustainEnd) / Math.max(1e-4, def.duration - sustainEnd), 1.6);
      out[i] = s * env * (def.gain ?? 0.5);
    }
    return out;
  }
  var SfxBank = class {
    constructor(defs) {
      this.defs = defs;
      this.buffers = /* @__PURE__ */ new Map();
    }
    has(name) {
      return name in this.defs;
    }
    buffer(name) {
      const ctx = AudioEngine.ctx;
      if (!ctx) return null;
      let b = this.buffers.get(name);
      if (!b) {
        const def = this.defs[name];
        if (!def) return null;
        const pcm = renderSfx(def, ctx.sampleRate);
        b = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
        b.getChannelData(0).set(pcm);
        this.buffers.set(name, b);
      }
      return b;
    }
    /** @param rate losowa wariacja wysokości (np. 0.06 = ±6%) */
    play(name, volume = 1, rateJitter = 0) {
      const ctx = AudioEngine.ctx;
      const buf = this.buffer(name);
      if (!ctx || !buf || !AudioEngine.sfxBus || !AudioEngine.running) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      if (rateJitter) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJitter;
      const g = ctx.createGain();
      g.gain.value = volume;
      src.connect(g).connect(AudioEngine.sfxBus);
      src.start();
    }
  };

  // src/audio/SfxDefs.ts
  var SFX_DEFS = {
    shoot: { wave: "square", duty: 0.25, freq: 1400, freqEnd: 300, duration: 0.07, decay: 0.05, gain: 0.32 },
    jump: { wave: "square", duty: 0.5, freq: 260, freqEnd: 720, duration: 0.16, decay: 0.08, gain: 0.22 },
    land: { wave: "noise", noiseRate: 6e3, freq: 1, duration: 0.09, lowpass: 900, lowpassEnd: 200, decay: 0.07, gain: 0.35 },
    hurt: { wave: "square", duty: 0.5, freq: 480, freqEnd: 70, duration: 0.3, decay: 0.2, vibratoDepth: 0.08, vibratoRate: 30, gain: 0.5 },
    enemy_hit: { wave: "noise", noiseRate: 12e3, freq: 1, duration: 0.06, lowpass: 5e3, lowpassEnd: 1500, decay: 0.05, gain: 0.4 },
    enemy_die: { wave: "noise", freq: 1, duration: 0.45, lowpass: 3500, lowpassEnd: 200, decay: 0.38, gain: 0.6 },
    explosion: { wave: "noise", freq: 1, duration: 0.7, lowpass: 2500, lowpassEnd: 120, decay: 0.6, gain: 0.7 },
    boss_phase: { wave: "square", duty: 0.5, freq: 440, duration: 0.7, arp: [1, 1.5, 1, 1.5, 1, 1.5, 2], arpStep: 0.1, decay: 0.15, gain: 0.45 },
    boss_die: { wave: "noise", freq: 1, duration: 1.4, lowpass: 3e3, lowpassEnd: 60, decay: 1.2, gain: 0.8 },
    boss_rumble: { wave: "triangle", freq: 220, freqEnd: 35, duration: 1.4, decay: 1, vibratoDepth: 0.2, vibratoRate: 12, gain: 0.5 },
    sniper_aim: { wave: "triangle", freq: 500, freqEnd: 1300, duration: 0.35, decay: 0.1, gain: 0.35 },
    drone_bomb: { wave: "square", duty: 0.35, freq: 1200, freqEnd: 250, duration: 0.45, decay: 0.15, vibratoDepth: 0.05, vibratoRate: 20, gain: 0.32 },
    saw_hit: { wave: "square", duty: 0.5, freq: 1800, freqEnd: 900, duration: 0.05, decay: 0.04, gain: 0.25 },
    game_over: { wave: "square", duty: 0.5, freq: 660, duration: 1, arp: [1, 0.75, 0.63, 0.5], arpStep: 0.25, decay: 0.2, gain: 0.45 },
    victory: { wave: "square", duty: 0.5, freq: 330, duration: 0.9, arp: [1, 1.25, 1.5, 2, 2, 2], arpStep: 0.15, decay: 0.2, gain: 0.45 },
    charge: { wave: "saw", freq: 90, freqEnd: 420, duration: 0.45, decay: 0.1, gain: 0.35 },
    ricochet: { wave: "square", duty: 0.5, freq: 2400, freqEnd: 900, duration: 0.09, decay: 0.07, vibratoDepth: 0.15, vibratoRate: 90, gain: 0.3 },
    zap: { wave: "noise", noiseRate: 9e3, freq: 1, duration: 0.18, lowpass: 6e3, lowpassEnd: 1200, decay: 0.12, gain: 0.35 },
    gust: { wave: "noise", freq: 1, duration: 1.2, lowpass: 400, lowpassEnd: 1800, attack: 0.3, decay: 0.5, gain: 0.35 },
    slam: { wave: "noise", freq: 1, duration: 0.5, lowpass: 900, lowpassEnd: 80, decay: 0.4, gain: 0.8 },
    quake: { wave: "triangle", freq: 60, freqEnd: 30, duration: 0.7, decay: 0.5, vibratoDepth: 0.3, vibratoRate: 18, gain: 0.5 },
    laser: { wave: "square", duty: 0.5, freq: 900, freqEnd: 1800, duration: 0.7, attack: 0.05, decay: 0.2, vibratoDepth: 0.02, vibratoRate: 40, gain: 0.25 },
    crack: { wave: "noise", noiseRate: 3e3, freq: 1, duration: 0.35, lowpass: 2500, lowpassEnd: 300, decay: 0.3, gain: 0.6 },
    ui: { wave: "square", duty: 0.5, freq: 880, freqEnd: 1320, duration: 0.08, decay: 0.05, gain: 0.3 }
  };

  // src/render/Audio.ts
  var _Sfx = class _Sfx {
    static register(name, url) {
      const a = new Audio(url);
      a.preload = "auto";
      _Sfx.files.set(name, a);
    }
    static play(name, volume = 1) {
      if (!_Sfx.enabled) return;
      const file = _Sfx.files.get(name);
      if (file) {
        const inst = file.cloneNode();
        inst.volume = Math.min(1, _Sfx.volume * volume);
        void inst.play().catch(() => {
        });
        return;
      }
      _Sfx.bank.play(name, _Sfx.volume * volume, _Sfx.jitter[name] ?? 0);
    }
    /**
     * Ciągła pętla syntetyczna (buczenie tarczy tnącej). `on` włącza/wycisza z krótką rampą.
     */
    static setLoop(name, on, level = 1) {
      const ctx = AudioEngine.ctx;
      if (!ctx || !AudioEngine.sfxBus) return;
      let loop = _Sfx.loops.get(name);
      if (!loop) {
        if (!on) return;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(AudioEngine.sfxBus);
        const o1 = ctx.createOscillator();
        o1.type = "sawtooth";
        o1.frequency.value = 72;
        const o2 = ctx.createOscillator();
        o2.type = "square";
        o2.frequency.value = 145;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 11;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 6;
        lfo.connect(lfoGain).connect(o1.frequency);
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 900;
        o1.connect(filt);
        o2.connect(filt);
        filt.connect(gain);
        o1.start();
        o2.start();
        lfo.start();
        loop = { osc: [o1, o2, lfo], gain };
        _Sfx.loops.set(name, loop);
      }
      const target = on && _Sfx.enabled ? 0.05 * level : 0;
      loop.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.04);
    }
    static stopAllLoops() {
      const ctx = AudioEngine.ctx;
      if (!ctx) return;
      for (const l of _Sfx.loops.values()) l.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    }
  };
  _Sfx.files = /* @__PURE__ */ new Map();
  _Sfx.bank = new SfxBank(SFX_DEFS);
  _Sfx.loops = /* @__PURE__ */ new Map();
  _Sfx.volume = 1;
  _Sfx.enabled = true;
  /** Losowa wariacja wysokości dla szybko powtarzanych efektów. */
  _Sfx.jitter = { shoot: 0.08, enemy_hit: 0.15, saw_hit: 0.1, land: 0.1 };
  var Sfx = _Sfx;

  // src/audio/Music.ts
  var NOTE_INDEX = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  function noteToFreq(note, transpose = 0) {
    const m = /^([A-G]#?)(-?\d)$/.exec(note);
    if (!m) return 0;
    const midi = 12 * (parseInt(m[2], 10) + 1) + NOTE_INDEX[m[1]] + transpose;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  var waveCache = /* @__PURE__ */ new Map();
  function pulseWave(ctx, duty) {
    const key = duty.toFixed(3);
    let w = waveCache.get(key);
    if (!w) {
      const N = 32;
      const real = new Float32Array(N), imag = new Float32Array(N);
      for (let k = 1; k < N; k++) {
        real[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
      }
      w = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      waveCache.set(key, w);
    }
    return w;
  }
  var noiseBuffer = null;
  function getNoise(ctx) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }
  var MusicPlayer = class {
    constructor() {
      this.song = null;
      this.tokens = [];
      this.step = 0;
      this.nextTime = 0;
      this.timer = null;
      this.bus = null;
      this.onEnd = null;
      this.stepDur = 0.1;
    }
    get current() {
      return this.song?.name ?? null;
    }
    play(song, onEnd) {
      const ctx = AudioEngine.ctx;
      this.stop();
      this.song = song;
      this.onEnd = onEnd ?? null;
      if (!ctx || !AudioEngine.musicBus) return;
      this.tokens = song.tracks.map((t) => t.steps.trim().split(/\s+/));
      this.stepDur = 60 / song.bpm / 4;
      this.step = 0;
      this.bus = ctx.createGain();
      this.bus.gain.value = 1;
      this.bus.connect(AudioEngine.musicBus);
      this.nextTime = ctx.currentTime + 0.05;
      this.timer = setInterval(() => this.schedule(), 25);
    }
    stop(fade = 0.05) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      const ctx = AudioEngine.ctx;
      if (this.bus && ctx) {
        const b = this.bus;
        b.gain.setTargetAtTime(0, ctx.currentTime, fade);
        setTimeout(() => b.disconnect(), (fade * 6 + 0.1) * 1e3);
      }
      this.bus = null;
      this.song = null;
    }
    schedule() {
      const ctx = AudioEngine.ctx;
      if (!ctx || !this.song || !this.bus) return;
      if (!AudioEngine.running) {
        this.nextTime = ctx.currentTime + 0.05;
        return;
      }
      const length = Math.max(...this.tokens.map((t) => t.length));
      while (this.nextTime < ctx.currentTime + 0.15) {
        if (this.step >= length) {
          if (this.song.loop) this.step = 0;
          else {
            const cb = this.onEnd;
            this.stop(0.3);
            cb?.();
            return;
          }
        }
        this.song.tracks.forEach((track, ti) => this.scheduleStep(ctx, track, this.tokens[ti], this.step, this.nextTime));
        this.step++;
        this.nextTime += this.stepDur;
      }
    }
    scheduleStep(ctx, track, tokens, step, t) {
      const tok = tokens[step % tokens.length];
      if (!tok || tok === "-" || tok === ".") return;
      let len = 1;
      while (tokens[(step + len) % tokens.length] === "." && step + len < tokens.length) len++;
      const dur = len * this.stepDur * (track.legato ?? 0.9);
      const bus = this.bus;
      if (track.wave === "noise") {
        this.drum(ctx, tok, t, track.gain, bus);
        return;
      }
      const f = noteToFreq(tok, track.transpose ?? 0);
      if (!f) return;
      const osc = ctx.createOscillator();
      if (track.wave === "square") osc.setPeriodicWave(pulseWave(ctx, track.duty ?? 0.5));
      else osc.type = "triangle";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(track.gain, t + 4e-3);
      g.gain.setTargetAtTime(track.gain * 0.7, t + 0.03, 0.08);
      g.gain.setTargetAtTime(0, t + dur, 0.012);
      osc.connect(g).connect(bus);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }
    drum(ctx, kind, t, gain, bus) {
      if (kind === "K") {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(170, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(gain * 1.6, t);
        g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.14);
        o.connect(g2).connect(bus);
        o.start(t);
        o.stop(t + 0.16);
        return;
      }
      const src = ctx.createBufferSource();
      src.buffer = getNoise(ctx);
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      if (kind === "S") {
        filt.type = "bandpass";
        filt.frequency.value = 1800;
        filt.Q.value = 0.7;
        g.gain.setValueAtTime(gain * 1.1, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.12);
        src.start(t);
        src.stop(t + 0.13);
      } else {
        filt.type = "highpass";
        filt.frequency.value = 6e3;
        g.gain.setValueAtTime(gain * 0.5, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.04);
        src.start(t);
        src.stop(t + 0.05);
      }
      src.connect(filt).connect(g).connect(bus);
    }
  };

  // src/audio/Songs.ts
  var bars = (...b) => b.join(" ");
  var LEVEL_THEME = {
    name: "level",
    bpm: 168,
    loop: true,
    tracks: [
      { wave: "square", duty: 0.5, gain: 0.26, steps: bars(
        "E4 . . . G4 . B4 . E5 . . . D5 . B4 .",
        "A4 . . . B4 . A4 . G4 . . . E4 . . .",
        "C5 . . . D5 . E5 . G5 . . . E5 . D5 .",
        "B4 . . . D5 . B4 . A4 . G4 . E4 . . .",
        "E5 . . . D5 . B4 . G4 . . . A4 . B4 .",
        "C5 . . . B4 . A4 . G4 . . . F#4 . . .",
        "E4 . G4 . A4 . B4 . D5 . . . E5 . D5 .",
        "B4 . . . . . . . F#4 . . . . . . ."
      ) },
      { wave: "square", duty: 0.25, gain: 0.13, legato: 0.6, steps: bars(
        "E3 G3 B3 E4 E3 G3 B3 E4 A3 C4 E4 A4 A3 C4 E4 A4",
        "E3 G3 B3 E4 E3 G3 B3 E4 B3 D4 F#4 B4 G3 B3 D4 G4",
        "C3 E3 G3 C4 C3 E3 G3 C4 D3 F#3 A3 D4 E3 G3 B3 E4",
        "B2 D3 F#3 B3 B2 D3 F#3 B3 E3 G3 B3 E4 E3 G3 B3 E4",
        "E3 G3 B3 E4 E3 G3 B3 E4 A3 C4 E4 A4 A3 C4 E4 A4",
        "E3 G3 B3 E4 E3 G3 B3 E4 B3 D4 F#4 B4 G3 B3 D4 G4",
        "C3 E3 G3 C4 C3 E3 G3 C4 D3 F#3 A3 D4 E3 G3 B3 E4",
        "B2 D3 F#3 B3 B2 D3 F#3 B3 B2 D3 F#3 B3 B2 D3 F#3 B3"
      ) },
      { wave: "triangle", gain: 0.5, legato: 0.8, steps: bars(
        "E2 . E2 . E2 . G2 . A2 . A2 . G2 . E2 .",
        "E2 . E2 . E2 . G2 . B2 . B2 . A2 . G2 .",
        "C2 . C2 . C2 . D2 . E2 . E2 . D2 . C2 .",
        "B1 . B1 . B1 . D2 . E2 . E2 . E2 . E2 .",
        "E2 . E2 . E2 . G2 . A2 . A2 . G2 . E2 .",
        "E2 . E2 . E2 . G2 . B2 . B2 . A2 . G2 .",
        "C2 . C2 . C2 . D2 . E2 . E2 . D2 . C2 .",
        "B1 . B1 . D2 . F#2 . B1 . B1 . D2 . F#2 ."
      ) },
      { wave: "noise", gain: 0.32, steps: bars(
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H H K - H - S - H -",
        "K - H - S - H - K - S - S - S S"
      ) }
    ]
  };
  var BOSS_THEME = {
    name: "boss",
    bpm: 184,
    loop: true,
    tracks: [
      { wave: "square", duty: 0.5, gain: 0.28, steps: bars(
        "D5 . F5 . A5 . G#5 . A5 . . . F5 . D5 .",
        "D5 . F5 . A5 . A#5 . A5 . . . G5 . A5 .",
        "A#5 . . . A5 . G5 . F5 . . . E5 . F5 .",
        "E5 . . . F5 . E5 . C#5 . . . D5 . . .",
        "D5 . . . . . D5 . F5 . . . A5 . . .",
        "G#5 . . . A5 . G#5 . A5 . . . D6 . . .",
        "C6 . . . A#5 . A5 . G5 . . . F5 . E5 .",
        "F5 . E5 . D5 . C#5 . D5 . . . . . . ."
      ) },
      { wave: "square", duty: 0.125, gain: 0.15, legato: 0.6, steps: bars(
        "D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 C4",
        "D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 G#3 B3 D4 F4",
        "A#2 D3 F3 A#3 A#2 D3 F3 A#3 G2 A#2 D3 G3 G2 A#2 D3 G3",
        "A2 C#3 E3 A3 A2 C#3 E3 A3 G#2 B2 D3 G#3 A2 C#3 E3 A3",
        "D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 C4",
        "D3 F3 A3 D4 D3 F3 A3 D4 D3 F3 A3 D4 G#3 B3 D4 F4",
        "A#2 D3 F3 A#3 A#2 D3 F3 A#3 G2 A#2 D3 G3 G2 A#2 D3 G3",
        "A2 C#3 E3 A3 A2 C#3 E3 A3 A2 C#3 E3 A3 D3 F3 A3 D4"
      ) },
      { wave: "triangle", gain: 0.55, legato: 0.7, steps: bars(
        "D2 . D2 D2 . D2 . F2 D2 . D2 D2 . D2 . C2",
        "D2 . D2 D2 . D2 . F2 D2 . D2 D2 . G#2 . A2",
        "A#2 . A#2 A#2 . A#2 . A2 G2 . G2 G2 . G2 . F2",
        "A2 . A2 A2 . A2 . A2 G#2 . G#2 . A2 . . .",
        "D2 . D2 D2 . D2 . F2 D2 . D2 D2 . D2 . C2",
        "D2 . D2 D2 . D2 . F2 D2 . D2 D2 . G#2 . A2",
        "A#2 . A#2 A#2 . A#2 . A2 G2 . G2 G2 . G2 . F2",
        "A2 . A2 A2 . A2 . A2 A2 . A2 . D2 . . ."
      ) },
      { wave: "noise", gain: 0.34, steps: bars(
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - H H S - K - K - H H S - S -",
        "K - S - K - S - S S S S K K S S"
      ) }
    ]
  };
  var VICTORY_JINGLE = {
    name: "victory",
    bpm: 132,
    loop: false,
    tracks: [
      { wave: "square", duty: 0.5, gain: 0.3, steps: "E5 . G5 . B5 . E6 . . . D6 . E6 . . . . . . . - - - -" },
      { wave: "square", duty: 0.25, gain: 0.16, steps: "G4 . B4 . E5 . G5 . . . B5 . G5 . . . . . . . - - - -" },
      { wave: "triangle", gain: 0.5, steps: "E2 . . . G2 . . . B2 . . . E3 . . . . . . . - - - -" },
      { wave: "noise", gain: 0.3, steps: "K - - - S - - - K - - - S S - - - - - - - - - -" }
    ]
  };
  var GAMEOVER_JINGLE = {
    name: "gameover",
    bpm: 92,
    loop: false,
    tracks: [
      { wave: "square", duty: 0.5, gain: 0.28, steps: "E4 . . . D4 . . . C4 . . . B3 . . . E3 . . . . . . . - - - -" },
      { wave: "square", duty: 0.25, gain: 0.14, steps: "B3 . . . A3 . . . G3 . . . F#3 . . . B2 . . . . . . . - - - -" },
      { wave: "triangle", gain: 0.5, steps: "E2 . . . . . . . C2 . . . . . . . E1 . . . . . . . - - - -" },
      { wave: "noise", gain: 0.25, steps: "K - - - - - - - K - - - - - - - K - - - - - - - - - - -" }
    ]
  };

  // src/audio/Jukebox.ts
  var SONGS = { level: LEVEL_THEME, boss: BOSS_THEME, victory: VICTORY_JINGLE, gameover: GAMEOVER_JINGLE };
  var _Jukebox = class _Jukebox {
    static play(name) {
      if (_Jukebox.player.current === name) return;
      _Jukebox.player.play(SONGS[name]);
    }
    static stop() {
      _Jukebox.player.stop();
    }
    static get current() {
      return _Jukebox.player.current;
    }
  };
  _Jukebox.player = new MusicPlayer();
  var Jukebox = _Jukebox;

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
      const count = Math.min(opts.count, CONFIG.vfx.maxParticlesPerEmit);
      const maxLife = CONFIG.vfx.maxParticleLife;
      for (let i = 0; i < count; i++) {
        const p = this.pool.spawn();
        if (!p) return;
        const [a0, a1] = opts.angle ?? [0, Math.PI * 2];
        const ang = randRange(a0, a1);
        const spd = randRange(...opts.speed ?? [20, 80]);
        p.x = opts.x + randRange(-(opts.spreadX ?? 0), opts.spreadX ?? 0);
        p.y = opts.y + randRange(-(opts.spreadY ?? 0), opts.spreadY ?? 0);
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd;
        const [l0, l1] = opts.life ?? [0.2, 0.4];
        p.maxLife = p.life = randRange(Math.min(l0, maxLife), Math.min(l1, maxLife));
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
    "version": "mu112axz",
    "sheets": {
      "seba": {
        "file": "assets/sprites/player/seba.png",
        "frameW": 70,
        "frameH": 49,
        "cols": 8,
        "clips": {
          "idle": {
            "frames": [
              0,
              1,
              2,
              3,
              4,
              5
            ],
            "fps": 6,
            "loop": true
          },
          "run": {
            "frames": [
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14
            ],
            "fps": 14,
            "loop": true
          },
          "run_shoot": {
            "frames": [
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23
            ],
            "fps": 14,
            "loop": true
          },
          "shoot": {
            "frames": [
              24,
              25,
              26,
              27
            ],
            "fps": 10,
            "loop": true
          },
          "shoot_up": {
            "frames": [
              28,
              29
            ],
            "fps": 8,
            "loop": true
          },
          "prone": {
            "frames": [
              30,
              31,
              32
            ],
            "fps": 6,
            "loop": true
          },
          "jump": {
            "frames": [
              33
            ],
            "fps": 1,
            "loop": false
          },
          "spin": {
            "frames": [
              34,
              35,
              36,
              37
            ],
            "fps": 12,
            "loop": true
          },
          "hurt": {
            "frames": [
              38
            ],
            "fps": 1,
            "loop": true
          },
          "dead": {
            "frames": [
              39
            ],
            "fps": 1,
            "loop": true
          }
        },
        "anchor": "bottom",
        "anchorX": 35,
        "pivots": {
          "stand": {
            "x": 5,
            "y": -27
          },
          "up": {
            "x": 9,
            "y": -19
          },
          "crouch": {
            "x": 9,
            "y": -22
          },
          "prone": {
            "x": 24,
            "y": -7
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
      "screw": {
        "file": "assets/sprites/fx/screw.png",
        "frameW": 14,
        "frameH": 6,
        "cols": 2,
        "clips": {
          "spin": {
            "frames": [
              0,
              1
            ],
            "fps": 30,
            "loop": true
          }
        },
        "anchor": "center",
        "anchorX": 10,
        "anchorY": 3
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
      },
      "skyBlades": {
        "file": "assets/backgrounds/sky-blades.png",
        "frameW": 256,
        "frameH": 70,
        "cols": 6,
        "clips": {
          "spin": {
            "frames": [
              0,
              1,
              2,
              3,
              4,
              5
            ],
            "fps": 5,
            "loop": true
          }
        },
        "anchor": "center",
        "anchorX": 0,
        "anchorY": 0,
        "y": 126
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
      "sky": {
        "file": "assets/backgrounds/sky.png",
        "w": 256,
        "h": 240
      },
      "siteMid": {
        "file": "assets/backgrounds/site-mid.png",
        "w": 480,
        "h": 200
      },
      "siteNear": {
        "file": "assets/backgrounds/site-near.png",
        "w": 480,
        "h": 72
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
    },
    "sebaSource": "seba-ai"
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
    const url = (file) => `${file}?v=${MANIFEST.version}`;
    await Promise.all([
      ...sheetEntries.map(async ([name, def]) => {
        const img = await Assets.loadImage(`sheet:${name}`, url(def.file));
        Sheets.set(name, new SpriteSheet(img, def));
        tick();
      }),
      ...imageEntries.map(async ([name, def]) => {
        await Assets.loadImage(name, url(def.file));
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
    draw(ctx, camX, time = 0) {
      const W = CONFIG.view.width;
      for (const l of this.layers) {
        const w = l.sheet ? l.sheet.frameW : l.image.width;
        const shift = Math.round(camX * l.scroll) - (l.offsetX ?? 0);
        ctx.globalAlpha = l.alpha ?? 1;
        if (l.repeat === false) {
          ctx.drawImage(l.image, -shift, l.y);
          continue;
        }
        let x = -((shift % w + w) % w);
        for (; x < W; x += w) {
          if (l.sheet) {
            const f = l.sheet.frameAt(l.clip ?? "spin", time);
            const sx = f % l.sheet.def.cols * l.sheet.frameW, sy = Math.floor(f / l.sheet.def.cols) * l.sheet.frameH;
            ctx.drawImage(l.sheet.image, sx, sy, l.sheet.frameW, l.sheet.frameH, x, Math.round(l.y), l.sheet.frameW, l.sheet.frameH);
          } else ctx.drawImage(l.image, x, Math.round(l.y));
        }
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
      /** Cała statyczna plansza wyrenderowana raz do offscreen canvasu – 1 drawImage na klatkę. */
      this.cache = null;
      this.image = Images.get("tileset");
      this.ts = MANIFEST.images.tileset.tileSize;
      this.cols = MANIFEST.images.tileset.cols;
      this.buildDecorations();
      this.prerender();
    }
    prerender() {
      if (typeof document === "undefined") return;
      const c = document.createElement("canvas");
      c.width = this.level.widthPx;
      c.height = this.level.heightPx;
      const g = c.getContext("2d");
      if (!g) return;
      g.imageSmoothingEnabled = false;
      this.drawBackgroundDirect(g, 0, this.level.widthPx);
      this.drawTilesDirect(g, 0, this.level.widthPx);
      this.drawPlatformsDirect(g);
      this.cache = c;
    }
    /** Rysuje widoczny wycinek prerenderowanej planszy (tło + kafle). */
    draw(ctx, camX, camW) {
      if (!this.cache) {
        this.drawBackgroundDirect(ctx, camX, camW);
        this.drawTilesDirect(ctx, camX, camW);
        this.drawPlatformsDirect(ctx);
        return;
      }
      const x = Math.max(0, Math.floor(camX)), w = Math.min(this.cache.width - x, Math.ceil(camW) + 1);
      if (w > 0) ctx.drawImage(this.cache, x, 0, w, this.cache.height, x, 0, w, this.cache.height);
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
    /**
     * Platformy semi-solid jako elementy placu montażu: łopaty na stojakach, sekcje wieży leżące poziomo,
     * a pod snajperami – dachy kontenerów technicznych. Kolizja pozostaje na górnej krawędzi kafla.
     */
    drawPlatformsDirect(g) {
      const L = this.level, ts = this.ts;
      const sniperCols = new Set(L.markers.filter((m) => m.type === "sniper").map((m) => `${m.col},${m.row + 1}`));
      let runIndex = 0;
      for (let r = 0; r < L.rows; r++) {
        for (let c = 0; c < L.cols; c++) {
          if (L.tileAt(c, r) !== 2 /* OneWay */ || L.tileAt(c - 1, r) === 2 /* OneWay */) continue;
          let c1 = c;
          while (L.tileAt(c1 + 1, r) === 2 /* OneWay */) c1++;
          const x0 = c * ts, x1 = (c1 + 1) * ts, y = r * ts;
          let hasSniper = false;
          for (let k = c; k <= c1; k++) if (sniperCols.has(`${k},${r}`)) hasSniper = true;
          if (hasSniper) this.drawContainerRoof(g, x0, y, x1 - x0);
          else if (runIndex % 2 === 0) this.drawBladePlatform(g, x0, y, x1 - x0);
          else this.drawTowerPlatform(g, x0, y, x1 - x0);
          runIndex++;
          c = c1;
        }
      }
    }
    /** Łopata z włókna szklanego na żółtych stojakach montażowych (nasada po lewej, końcówka po prawej). */
    drawBladePlatform(g, x, y, w) {
      const K = "#2b2f36", W1 = "#f4f6f8", W2 = "#c9cfd6", W3 = "#9aa3ad";
      for (let i = 0; i < w; i++) {
        const t = i / w;
        const th = Math.max(3, Math.round(8 * (1 - t * 0.6)));
        const top = y + 1 + Math.round(2 * t);
        g.fillStyle = W1;
        g.fillRect(x + i, top, 1, th);
        g.fillStyle = W2;
        g.fillRect(x + i, top + th - 2, 1, 1);
        g.fillStyle = W3;
        g.fillRect(x + i, top + th - 1, 1, 1);
        g.fillStyle = K;
        g.fillRect(x + i, top - 1, 1, 1);
        g.fillRect(x + i, top + th, 1, 1);
      }
      g.fillStyle = W2;
      g.fillRect(x, y, 5, 11);
      g.fillStyle = K;
      g.fillRect(x, y, 1, 11);
      for (let sx = x + 6; sx < x + w - 6; sx += Math.max(32, w - 12)) {
        g.fillStyle = "#f2c230";
        g.fillRect(sx, y + 9, 6, 7);
        g.fillStyle = "#a88410";
        g.fillRect(sx, y + 14, 6, 2);
        g.fillStyle = K;
        g.fillRect(sx - 1, y + 15, 8, 1);
      }
    }
    /** Cylindryczna sekcja wieży leżąca poziomo, na kołyskach. */
    drawTowerPlatform(g, x, y, w) {
      const K = "#2b2f36";
      g.fillStyle = "#c9cfd6";
      g.fillRect(x, y + 1, w, 14);
      g.fillStyle = "#f4f6f8";
      g.fillRect(x, y + 2, w, 4);
      g.fillStyle = "#9aa3ad";
      g.fillRect(x, y + 11, w, 3);
      g.fillStyle = K;
      g.fillRect(x, y, w, 1);
      g.fillRect(x, y + 15, w, 1);
      g.fillStyle = "#8a94a3";
      g.fillRect(x, y, 3, 16);
      g.fillRect(x + w - 3, y, 3, 16);
      g.fillStyle = K;
      g.fillRect(x, y, 1, 16);
      g.fillRect(x + w - 1, y, 1, 16);
      for (let i = x + 10; i < x + w - 6; i += 14) {
        g.fillStyle = "#e5e9ef";
        g.fillRect(i, y + 3, 1, 1);
      }
      for (let sx = x + 4; sx < x + w - 8; sx += Math.max(28, w - 16)) {
        g.fillStyle = "#4a505c";
        g.fillRect(sx, y + 13, 8, 3);
        g.fillStyle = K;
        g.fillRect(sx, y + 15, 8, 1);
      }
    }
    /** Dach kontenera technicznego (stanowisko snajpera). */
    drawContainerRoof(g, x, y, w) {
      const K = "#2b2f36", base = "#2e86c1", dark = "#1f5f8a", light = "#5dade2";
      g.fillStyle = base;
      g.fillRect(x, y, w, 16);
      g.fillStyle = dark;
      for (let i = x + 2; i < x + w - 2; i += 3) g.fillRect(i, y + 2, 1, 13);
      g.fillStyle = light;
      g.fillRect(x, y, w, 1);
      g.fillRect(x + 3, y + 3, 8, 3);
      g.fillStyle = K;
      g.fillRect(x, y + 15, w, 1);
      g.fillRect(x, y, 1, 16);
      g.fillRect(x + w - 1, y, 1, 16);
      g.fillStyle = "#ffe36b";
      g.fillRect(x + w - 4, y + 8, 1, 1);
      g.fillStyle = "#f2c230";
      for (let i = x + 1; i < x + w - 1; i += 4) g.fillRect(i, y + 1, 2, 1);
    }
    /** Dekoracje – rysować przed encjami. */
    drawBackgroundDirect(ctx, camX, camW) {
      const c0 = Math.floor(camX / this.ts) - 1, c1 = Math.ceil((camX + camW) / this.ts) + 1;
      for (const d of this.decos) if (d.col >= c0 && d.col <= c1) this.blit(ctx, d.tile, d.col, d.row);
    }
    drawTilesDirect(ctx, camX, camW) {
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
      this.kind = "default";
      /** Po rykoszecie pocisk gracza nie zadaje obrażeń. */
      this.spent = false;
    }
  };
  function impactSparks(world, x, y, vx, vy) {
    const back = Math.atan2(-vy, -vx);
    Sfx.play("saw_hit", 0.5);
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
  function drawBolt(ctx, b) {
    const n = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / n, dy = b.vy / n;
    const seg = 4, segs = 4;
    ctx.strokeStyle = Math.floor(b.age * 40) % 2 ? "#dff6ff" : "#5ec8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let x = b.x - dx * seg * segs / 2, y = b.y - dy * seg * segs / 2;
    ctx.moveTo(Math.round(x), Math.round(y));
    for (let i = 1; i <= segs; i++) {
      const off = (i % 2 ? 1 : -1) * 2 * Math.sin(b.age * 60 + i);
      x += dx * seg;
      y += dy * seg;
      ctx.lineTo(Math.round(x - dy * off), Math.round(y + dx * off));
    }
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
  }
  function drawShard(ctx, b) {
    ctx.save();
    ctx.translate(Math.round(b.x), Math.round(b.y));
    ctx.rotate(b.age * 9);
    ctx.fillStyle = "#e5e9ef";
    ctx.fillRect(-4, -2, 8, 4);
    ctx.fillStyle = "#7d8794";
    ctx.fillRect(-4, 1, 8, 1);
    ctx.fillStyle = "#2b2f36";
    ctx.fillRect(2, -2, 2, 1);
    ctx.restore();
  }
  function drawMine(ctx, b) {
    const r = b.radius + Math.sin(b.age * 18) * 1;
    ctx.fillStyle = "rgba(94,200,255,0.35)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, r + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Math.floor(b.age * 12) % 2 ? "#5ec8ff" : "#dff6ff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2b2f36";
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
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
      b.kind = s.kind ?? (s.owner === "enemy" ? "saw" : "default");
      b.spent = false;
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
      const screw = Sheets.tryGet("screw"), saw = Sheets.tryGet("saw");
      this.pool.forEachActive((b) => {
        if (b.owner === "player" && screw) {
          screw.drawAnchored(ctx, screw.frameAt("spin", b.age), b.x, b.y, screw.def.anchorX ?? 10, screw.def.anchorY ?? 3, { rotation: Math.atan2(b.vy, b.vx) });
          return;
        }
        if (b.owner === "enemy") {
          if (b.kind === "bolt") {
            drawBolt(ctx, b);
            return;
          }
          if (b.kind === "shard") {
            drawShard(ctx, b);
            return;
          }
          if (b.kind === "mine") {
            drawMine(ctx, b);
            return;
          }
          if (saw) {
            saw.drawAnchored(ctx, saw.frameAt("spin", b.age), b.x, b.y, 5, 5, { rotation: b.age * 14 });
            return;
          }
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
    // Ekran 7 – arena bossa (górne kratownice = ucieczka przed drganiami podłoża w fazie 3)
    [
      "B...................",
      "....................",
      "....................",
      "....................",
      "..............X.....",
      "....................",
      ".....====...........",
      "....................",
      "....................",
      ".====.....====......",
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
      case "prone":
        return { x: facing, y: 0 };
      // leżąc: tylko prosto, tuż nad ziemią
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
        p.setState(PRONE, world);
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
        p.setState(PRONE, world);
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
  var PRONE = {
    name: "prone",
    enter(p) {
      p.vx = 0;
      p.setProne();
    },
    update(p, _dt, world) {
      const ax = p.input.axisX;
      if (ax !== 0) p.facing = ax;
      p.vx = ax * P.crawlSpeed;
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
      p.setProne();
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
      /** Zewnętrzna siła pozioma (np. podmuch bossa) – ustawiana co klatkę przez świat, zerowana po użyciu. */
      this.pushVx = 0;
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
      /** Mikro-odrzut broni (px wzdłuż kierunku celowania, zanika). */
      this.recoil = 0;
      this.wasOnGround = false;
      this.w = P2.width;
      this.h = P2.standHeight;
      this.x = x;
      this.y = y;
      this.lastSafe = { x, y };
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
    setProne() {
      if (this.h === P2.proneHeight) return;
      this.y += this.h - P2.proneHeight;
      this.h = P2.proneHeight;
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
      if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 40);
      this.state.update(this, dt, world);
      this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);
      const res = moveAndCollide(this, world.level, (this.vx + this.pushVx) * dt, this.vy * dt, { dropThrough: this.dropThroughTimer > 0 });
      this.pushVx = 0;
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
      Sfx.setLoop("saw", !this.isDead && this.weaponVisible, this.isFiring ? 1 : 0.35);
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
      const pivots = MANIFEST.sheets.seba.pivots;
      const pv = this.state.name === "prone" || this.isDead ? pivots.prone ?? pivots.crouch : this.animName() === "shoot_up" ? pivots.up ?? pivots.stand : pivots.stand;
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
        this.recoil = 2;
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
      Sfx.play("land");
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
          return this.isFiring ? this.aim.y < -0.5 ? "shoot_up" : "shoot" : "idle";
        case "run":
          return this.isFiring ? "run_shoot" : "run";
        case "prone":
          return "prone";
        case "jump":
          return "spin";
        case "fall":
          return "jump";
        case "hurt":
          return "hurt";
        case "dead":
          return "dead";
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
        time: this.state.name === "prone" && this.vx === 0 ? 0 : this.stateTime,
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
      const r = Math.round(this.recoil);
      sheet.drawAnchored(ctx, frame, hand.x - this.aim.x * r, hand.y - this.aim.y * r, pv.x, pv.y, { flipX: this.facing < 0, flipY: this.aim.y > 0.3, alpha });
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
    /** Ponowne użycie instancji z poola (Object Pooling – bez alokacji w locie). */
    reset(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.alive = true;
      this.onGround = false;
      this.age = 0;
      this.hitFlash = 0;
      this.vulnerable = true;
      this.health.reset();
      this.onReset();
    }
    /** Stan specyficzny podklasy po resecie. */
    onReset() {
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
    onReset() {
      this.facing = -1;
      this.anim = "run";
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
    reset(x, y) {
      super.reset(x + (CONFIG.view.tile - this.w) / 2, y + CONFIG.view.tile - this.h);
    }
    onReset() {
      this.mode = "cooldown";
      this.timer = S.fireInterval * 0.5;
      this.modeTime = 0;
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
      /** Dron serwisowy (wsparcie bossa): krąży w arenie i ostrzeliwuje gracza wyładowaniami. */
      this.service = false;
      this.serviceTimer = 1.2;
      this.w = D.width;
      this.h = D.height;
      this.originX = x;
      this.originY = y;
      this.x = x;
      this.y = y;
      this.facing = -1;
    }
    onReset() {
      this.originX = this.x;
      this.originY = this.y;
      this.mode = "patrol";
      this.patrolT = 0;
      this.attackTimer = D.attackInterval;
      this.facing = -1;
      this.service = false;
      this.serviceTimer = 1.2;
    }
    /** Włącza tryb serwisowy: brak despawnu, ostrzał zamiast min/szarż. */
    setService() {
      this.service = true;
      this.despawnOffscreen = false;
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
          if (this.service) {
            this.serviceTimer -= dt;
            if (this.serviceTimer <= 0 && !player.isDead) {
              this.serviceTimer = 2.2;
              const d = normalize(player.cx - this.cx, player.cy - this.cy);
              world.fireEnemyBullet(this.cx, this.bottom, d.x, d.y, 170, 10, { kind: "bolt", radius: 3 });
              Sfx.play("zap", 0.6);
            }
            break;
          }
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
      world.fireEnemyBullet(this.cx, this.bottom + 2, 0, 1, D.bombSpeed * 0.4, D.bombDamage, { gravity: 260, radius: 4, kind: "mine", hitsTerrain: true, life: 5 });
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
  var WindGust = class {
    constructor(cfg = B.phase1.gust) {
      this.cfg = cfg;
      this.name = "gust";
      this.t = 0;
      this.stage = "telegraph";
    }
    start(boss) {
      this.t = 0;
      this.stage = "telegraph";
      boss.telegraphing = true;
      boss.tilt = 0;
    }
    update(boss, dt, world) {
      this.t += dt;
      if (this.stage === "telegraph") {
        boss.tilt = -Math.sin(this.t / this.cfg.telegraph * Math.PI / 2) * 0.25;
        if (this.t >= this.cfg.telegraph) {
          this.stage = "blow";
          this.t = 0;
          boss.telegraphing = false;
          boss.tilt = 0.35;
          Sfx.play("gust");
        }
        return false;
      }
      const p = world.player;
      if (!p.isDead) p.pushVx = -(p.state.name === "prone" ? this.cfg.pronePush : this.cfg.push);
      world.particles.emit({
        x: boss.arenaRight - 4,
        y: 30 + Math.random() * (boss.floorY - 40),
        count: 2,
        color: ["#ffffff", "#dff6ff"],
        speed: [260, 340],
        life: [0.3, 0.4],
        size: [1, 2],
        angle: [Math.PI - 0.05, Math.PI + 0.05]
      });
      boss.tilt = 0.35 * (1 - this.t / this.cfg.duration);
      if (this.t >= this.cfg.duration) {
        boss.tilt = 0;
        return true;
      }
      return false;
    }
  };
  var Lightning = class {
    constructor(cfg = B.phase1.lightning) {
      this.cfg = cfg;
      this.name = "lightning";
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
        const p = world.player;
        const origin = boss.leadingEdgePoint(this.fired / Math.max(1, this.cfg.count - 1));
        const base = Math.atan2(p.cy - origin.y, p.cx - origin.x);
        const a = base + degToRad((Math.random() * 2 - 1) * this.cfg.spreadDeg);
        world.fireEnemyBullet(origin.x, origin.y, Math.cos(a), Math.sin(a), this.cfg.speed, B.bulletDamage, { kind: "bolt", radius: 3 });
        world.particles.emit({ x: origin.x, y: origin.y, count: 4, color: ["#dff6ff", "#5ec8ff"], speed: [30, 90], life: [0.1, 0.2] });
        Sfx.play("zap");
        this.fired++;
        this.timer = this.cfg.interval;
      }
      return this.fired >= this.cfg.count;
    }
  };
  var LowSweep = class {
    constructor(cfg = B.phase1.sweep) {
      this.cfg = cfg;
      this.name = "sweep";
      this.stage = "telegraph";
      this.timer = 0;
    }
    start(boss) {
      this.stage = "telegraph";
      this.timer = this.cfg.telegraph;
      boss.movementLocked = true;
      boss.telegraphing = true;
    }
    update(boss, dt, world) {
      const floorTopY = boss.floorY - this.cfg.height;
      switch (this.stage) {
        case "telegraph":
          this.timer -= dt;
          if (this.timer <= 0) {
            boss.telegraphing = false;
            boss.setHorizontal(this.cfg.height);
            this.stage = "descend";
          }
          return false;
        case "descend":
          if (boss.moveTowards(boss.x, floorTopY, this.cfg.speed * 1.3, dt)) {
            this.stage = "sweepLeft";
            Sfx.play("slam", 0.5);
            world.camera.shake(CONFIG.vfx.shake.sweepLand, 0.2);
            world.particles.emit({ x: boss.cx, y: boss.bottom, count: 10, color: ["#8a94a3", "#c3c8d1", "#ffb300"], speed: [30, 110], life: [0.2, 0.4], gravity: 300, angle: [-Math.PI, 0], spreadX: boss.w / 2 });
          }
          return false;
        case "sweepLeft":
          if (boss.moveTowards(boss.arenaX + 4, floorTopY, this.cfg.speed * 1.6, dt)) this.stage = "sweepRight";
          return false;
        case "sweepRight":
          if (boss.moveTowards(boss.arenaRight - boss.w - 4, floorTopY, this.cfg.speed, dt)) {
            boss.setVertical();
            this.stage = "return";
          }
          return false;
        case "return": {
          const t = boss.hoverTarget();
          if (boss.moveTowards(t.x, t.y, this.cfg.speed, dt)) {
            boss.movementLocked = false;
            return true;
          }
          return false;
        }
      }
    }
  };
  var PitchSlam = class {
    constructor(cfg = B.phase2.slam) {
      this.cfg = cfg;
      this.name = "slam";
      this.stage = "aim";
      this.timer = 0;
      this.targetX = 0;
    }
    start(boss, world) {
      this.stage = "aim";
      this.timer = this.cfg.telegraph;
      boss.movementLocked = true;
      boss.telegraphing = true;
      boss.setHorizontal(20);
      this.targetX = clamp(world.player.cx - boss.w / 2, boss.arenaX + 2, boss.arenaRight - boss.w - 2);
    }
    update(boss, dt, world) {
      switch (this.stage) {
        case "aim":
          this.timer -= dt;
          boss.moveTowards(this.targetX, 30, 320, dt);
          boss.shakeOffset = Math.sin(boss.age * 50) * 1.5;
          if (this.timer <= 0) {
            this.stage = "fall";
            boss.telegraphing = false;
            boss.shakeOffset = 0;
          }
          return false;
        case "fall":
          if (boss.moveTowards(boss.x, boss.floorY - boss.h, this.cfg.fallSpeed, dt)) {
            this.stage = "rest";
            this.timer = this.cfg.rest;
            Sfx.play("slam");
            world.camera.shake(6, 0.35);
            for (let i = 0; i < this.cfg.shards; i++) {
              const a = -Math.PI * (0.15 + 0.7 * (i / (this.cfg.shards - 1)));
              const sp = this.cfg.shardSpeed * (0.8 + Math.random() * 0.4);
              world.fireEnemyBullet(boss.x + Math.random() * boss.w, boss.y, Math.cos(a), Math.sin(a), sp, this.cfg.shardDamage, { kind: "shard", radius: 3, gravity: 520, hitsTerrain: true, life: 3 });
            }
            world.particles.emit({ x: boss.cx, y: boss.bottom, count: 15, color: ["#b9b19f", "#8f8a7d", "#e5e9ef"], speed: [40, 140], life: [0.25, 0.4], gravity: 300, angle: [-Math.PI, 0], spreadX: boss.w / 2 });
          }
          return false;
        case "rest":
          this.timer -= dt;
          if (this.timer <= 0) this.stage = "rise";
          return false;
        case "rise": {
          boss.setVertical();
          const t = boss.hoverTarget();
          if (boss.moveTowards(t.x, t.y, 260, dt)) {
            boss.movementLocked = false;
            return true;
          }
          return false;
        }
      }
    }
  };
  var HorizontalCharge = class {
    constructor(cfg = B.phase3.charge) {
      this.cfg = cfg;
      this.name = "charge";
      this.stage = "telegraph";
      this.timer = 0;
    }
    start(boss, world) {
      this.stage = "telegraph";
      this.timer = this.cfg.telegraph;
      boss.movementLocked = true;
      boss.setHorizontal(22);
      const y = clamp(world.player.cy - boss.h / 2, 12, boss.floorY - boss.h - 2);
      boss.y = y;
      boss.laserY = boss.cy;
      Sfx.play("laser");
    }
    update(boss, dt, world) {
      switch (this.stage) {
        case "telegraph":
          this.timer -= dt;
          boss.shakeOffset = Math.sin(boss.age * 70) * 1.5;
          if (this.timer <= 0) {
            this.stage = "dash";
            boss.laserY = null;
            boss.shakeOffset = 0;
            Sfx.play("charge");
          }
          return false;
        case "dash":
          world.particles.emit({ x: boss.x + boss.w, y: boss.cy, count: 2, color: ["#ff9a90", "#ffffff"], speed: [60, 120], life: [0.15, 0.3], angle: [-0.3, 0.3], spreadY: boss.h / 2 });
          if (boss.moveTowards(boss.arenaX + 2, boss.y, this.cfg.speed, dt)) {
            this.stage = "rest";
            this.timer = this.cfg.rest;
            world.camera.shake(4, 0.25);
            Sfx.play("slam", 0.6);
          }
          return false;
        case "rest":
          this.timer -= dt;
          if (this.timer <= 0) {
            this.stage = "return";
            boss.setVertical();
          }
          return false;
        case "return": {
          const t = boss.hoverTarget();
          if (boss.moveTowards(t.x, t.y, this.cfg.returnSpeed, dt)) {
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
      enter(boss, world) {
        boss.hoverHz = cfg.hoverHz;
        boss.attackCooldown = cfg.attackCooldown;
        boss.tint = cfg.tint;
        boss.setPatterns(patterns());
        boss.resetAttackTimer(0.9);
        hooks.enter?.(boss, world);
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
      // Faza 1 – podmuch, wyładowania, niski zamach; wrażliwy tylko winglet.
      makePhase(
        "Faza 1",
        B.phaseThresholds[0],
        { hoverHz: p1.hoverHz, attackCooldown: p1.attackCooldown, tint: "#95a5a6" },
        () => [new WindGust(), new Lightning(p1.lightning), new LowSweep(), new Lightning(p1.lightning)]
      ),
      // Faza 2 – Pitch Slam z odłamkami + 2 drony serwisowe.
      makePhase(
        "Faza 2",
        B.phaseThresholds[1],
        { hoverHz: p2.hoverHz, attackCooldown: p2.attackCooldown, tint: "#e67e22" },
        () => [new PitchSlam(), new Lightning(p1.lightning), new WindGust(), new PitchSlam()],
        {
          enter(boss, world) {
            for (let i = 0; i < p2.serviceDrones; i++) {
              const d = new Drone(boss.arenaX + 90 + i * 110, 50 + i * 20);
              d.setService();
              world.spawnEnemy(d);
            }
          }
        }
      ),
      // Faza 3 – rezonans: rdzeń odsłonięty, drgania podłoża, szarże z laserem, gęstsze wyładowania.
      makePhase(
        "Faza 3 (ENRAGE)",
        B.phaseThresholds[2],
        { hoverHz: p3.hoverHz, attackCooldown: p3.attackCooldown, tint: "#e74c3c" },
        () => [new HorizontalCharge(), new Lightning(p3.lightning), new HorizontalCharge(), new Lightning(p3.lightning)],
        {
          enter(boss, world) {
            boss.coreExposed = true;
            Sfx.play("crack");
            world.camera.shake(5, 0.4);
            world.particles.emit({ x: boss.cx, y: boss.cy, count: 15, color: ["#e5e9ef", "#7d8794", "#ff2a2a"], speed: [60, 160], life: [0.3, 0.4], gravity: 200 });
          },
          update(boss, dt, world) {
            boss.quakeTimer -= dt;
            if (boss.quakeTimer < p3.quake.telegraph && boss.quakeTimer > 0) {
              world.camera.shake(1, 0.1);
              if (Math.random() < 0.5) world.particles.emit({ x: boss.arenaX + Math.random() * 320, y: boss.floorY, count: 1, color: ["#b9b19f", "#8f8a7d"], speed: [20, 60], life: [0.2, 0.4], angle: [-Math.PI * 0.8, -Math.PI * 0.2] });
            }
            if (boss.quakeTimer <= 0) {
              boss.quakeTimer = p3.quake.interval;
              Sfx.play("quake");
              world.camera.shake(3, 0.3);
              const p = world.player;
              if (p.onGround && p.bottom >= boss.floorY - 1 && !p.isDead) {
                p.takeDamage(p3.quake.damage, p.cx - 1, world);
                p.vy = p3.quake.knockUp;
                p.onGround = false;
              }
              world.particles.emit({ x: boss.arenaX + 160, y: boss.floorY, count: 15, color: ["#b9b19f", "#8f8a7d", "#e5e9ef"], speed: [40, 120], life: [0.25, 0.4], gravity: 300, angle: [-Math.PI * 0.9, -Math.PI * 0.1], spreadX: 160 });
            }
            boss.smokeAcc += dt * p3.smokeRate;
            while (boss.smokeAcc >= 1) {
              boss.smokeAcc -= 1;
              world.particles.emit({ x: boss.cx, y: boss.y + 4, count: 1, color: ["#2d3436", "#636e72", "#b33939"], speed: [10, 30], life: [0.3, 0.4], size: [2, 4], angle: [-Math.PI * 0.75, -Math.PI * 0.25], spreadX: boss.w / 2 });
            }
          }
        }
      )
    ];
  }

  // src/entities/boss/TurbineBoss.ts
  var B2 = CONFIG.boss;
  var TurbineBoss = class extends EnemyBase {
    constructor(arenaX, floorY) {
      super("boss", B2.hp, B2.contactDamage, B2.score);
      this.arenaX = arenaX;
      this.floorY = floorY;
      this.visual = new PlaceholderVisual({ color: "#95a5a6", accent: "#ecf0f1", faceMarker: false, outline: "#2c3e50" });
      // parametry ustawiane przez fazy / ataki
      this.hoverHz = B2.phase1.hoverHz;
      this.attackCooldown = B2.phase1.attackCooldown;
      this.tint = "#95a5a6";
      this.movementLocked = false;
      this.telegraphing = false;
      this.shakeOffset = 0;
      this.smokeAcc = 0;
      /** Odchylenie skrzydła (rad) – Wind Gust. */
      this.tilt = 0;
      /** Y promienia celowniczego szarży (świat) lub null. */
      this.laserY = null;
      /** Faza 3: pęknięty korpus, odsłonięty rdzeń – jedyny wrażliwy punkt. */
      this.coreExposed = false;
      this.quakeTimer = B2.phase3.quake.interval;
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
      // finał
      this.dyingStage = "none";
      this.dyingTimer = 0;
      this.fallVy = 0;
      this.fallRot = 0;
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
    get isDying() {
      return this.dyingStage !== "none";
    }
    get vertical() {
      return this.w < this.h;
    }
    // ---- Geometria / strefy trafień ------------------------------------------
    /** Prostokąt końcówki skrzydła (winglet) – dół w pionie, lewy koniec w poziomie. */
    wingletRect() {
      const L = B2.wingletLength;
      return this.vertical ? { x: this.x, y: this.bottom - L, w: this.w, h: L } : { x: this.x, y: this.y, w: L, h: this.h };
    }
    coreRect() {
      const s = B2.coreSize;
      return { x: this.cx - s / 2, y: this.cy - s / 2, w: s, h: s };
    }
    /** Klasyfikuje trafienie pocisku (okrąg) w strefę. */
    hitZone(px, py, r) {
      if (!this.overlapsCircle(px, py, r)) return "none";
      if (this.coreExposed) {
        const c = this.coreRect();
        return rectsOverlap(px - r, py - r, r * 2, r * 2, c.x, c.y, c.w, c.h) ? "core" : "armor";
      }
      const wl = this.wingletRect();
      return rectsOverlap(px - r, py - r, r * 2, r * 2, wl.x, wl.y, wl.w, wl.h) ? "weak" : "armor";
    }
    /** Punkt na krawędzi natarcia (0..1 wzdłuż skrzydła) – receptory odgromowe. */
    leadingEdgePoint(t) {
      return this.vertical ? { x: this.facing < 0 ? this.x - 1 : this.x + this.w + 1, y: this.y + 8 + (this.h - 16) * t } : { x: this.x + 8 + (this.w - 16) * t, y: this.bottom + 1 };
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
    /** Skrzydło ułożone poziomo (zamach, slam, szarża) – zachowuje środek. */
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
      this.tilt = 0;
      this.laserY = null;
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
    /** Finał: hit-stop → kaskada eksplozji → skrzydło łamie się i odpada → boss:died. */
    die(world) {
      if (this.dyingStage !== "none") return;
      this.dyingStage = "hitstop";
      this.dyingTimer = B2.finale.hitStop;
      this.vulnerable = false;
      this.cancelAttack();
      this.laserY = null;
      this.hitFlash = 0.3;
      Sfx.play("boss_die");
      world.hitStop(B2.finale.hitStop);
      world.camera.shake(CONFIG.vfx.shake.bossDeath, 0.5);
    }
    finishDeath(world) {
      this.dyingStage = "done";
      this.alive = false;
      world.addScore(this.scoreValue);
      world.events.emit("enemy:died", { enemy: this });
      world.events.emit("boss:died", void 0);
    }
    updateDying(dt, world) {
      this.dyingTimer -= dt;
      switch (this.dyingStage) {
        case "hitstop":
          if (this.dyingTimer <= 0) {
            this.dyingStage = "explosions";
            this.dyingTimer = B2.finale.explosionsDuration;
            Sfx.play("boss_rumble");
          }
          break;
        case "explosions":
          if (Math.floor(this.dyingTimer * 8) !== Math.floor((this.dyingTimer + dt) * 8)) {
            world.fx.spawn("explosion", this.x + Math.random() * this.w, this.y + Math.random() * this.h);
            world.camera.shake(3, 0.15);
            Sfx.play("explosion", 0.5);
            world.particles.emit({ x: this.cx, y: this.cy, count: 8, color: ["#ff9f43", "#ffdd59", "#e5e9ef", "#2d3436"], speed: [40, 160], life: [0.25, 0.4], gravity: 200, spreadX: this.w / 2, spreadY: this.h / 2 });
          }
          if (this.dyingTimer <= 0) {
            this.dyingStage = "fall";
            this.dyingTimer = B2.finale.fallDuration;
            this.fallVy = -60;
            Sfx.play("crack");
            world.camera.shake(5, 0.3);
          }
          break;
        case "fall":
          this.fallVy += CONFIG.physics.gravity * 0.6 * dt;
          this.y += this.fallVy * dt;
          this.x -= 20 * dt;
          this.fallRot += 1.8 * dt;
          if (Math.random() < 0.3) world.particles.emit({ x: this.x + Math.random() * this.w, y: this.y + Math.random() * this.h, count: 2, color: ["#2d3436", "#636e72", "#ff9f43"], speed: [10, 40], life: [0.3, 0.4], size: [2, 3] });
          if (this.dyingTimer <= 0 || this.y > this.floorY + 40) {
            for (let i = 0; i < 4; i++) world.fx.spawn("explosion", this.arenaX + 120 + i * 50, this.floorY - 10 - Math.random() * 30);
            world.camera.shake(7, 0.6);
            Sfx.play("explosion");
            this.finishDeath(world);
          }
          break;
        default:
          break;
      }
    }
    deathEffect() {
    }
    // ---- Update / draw -----------------------------------------------------
    update(dt, world) {
      this.prevX = this.x;
      this.prevY = this.y;
      this.age += dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.dyingStage !== "none") {
        this.updateDying(dt, world);
        return;
      }
      if (this.introTimer > 0) {
        this.introTimer -= dt;
        const t = this.hoverTarget();
        this.moveTowards(t.x, t.y, 120, dt);
        if (this.introTimer <= 0) this.fsm.forcePhase(0, this, world);
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
    }
    draw(ctx) {
      const flash = this.hitFlash > 0 || this.telegraphing && Math.floor(this.age * 20) % 2 === 0;
      const pal = BOSS_PALETTES[Math.max(0, Math.min(2, this.phaseIndex))];
      const K = "#050912";
      const w = this.w, h = this.h;
      const vertical = w < h;
      ctx.save();
      if (this.laserY !== null) {
        ctx.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(this.age * 25));
        ctx.fillStyle = "#ff2a2a";
        ctx.fillRect(this.arenaX, Math.round(this.laserY) - 1, this.arenaRight - this.arenaX, 2);
        ctx.fillStyle = "#ffb3b3";
        ctx.fillRect(this.arenaX, Math.round(this.laserY), this.arenaRight - this.arenaX, 1);
        ctx.globalAlpha = 1;
      }
      const speed = Math.hypot(this.x - this.prevX, this.y - this.prevY);
      if (speed > 3) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = pal.m;
        ctx.fillRect(Math.round(this.prevX), Math.round(this.prevY), w, h);
        ctx.globalAlpha = 1;
      }
      ctx.translate(Math.round(this.cx) + Math.round(this.shakeOffset), Math.round(this.cy));
      if (this.tilt) ctx.rotate(this.tilt * this.facing);
      if (this.dyingStage === "fall") ctx.rotate(this.fallRot);
      const x = -Math.round(w / 2), y = -Math.round(h / 2);
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
        const len = vertical ? h : w;
        for (let k = 10; k < len - 6; k += 12) {
          ctx.fillStyle = K;
          if (vertical) {
            ctx.fillRect(x + 2, y + k, w - 4, 1);
            ctx.fillStyle = pal.l;
            ctx.fillRect(x + 4, y + k + 3, 1, 1);
            ctx.fillRect(x + w - 5, y + k + 3, 1, 1);
          } else {
            ctx.fillRect(x + k, y + 2, 1, h - 4);
            ctx.fillStyle = pal.l;
            ctx.fillRect(x + k + 3, y + 3, 1, 1);
          }
        }
        ctx.fillStyle = "#5ec8ff";
        for (let k = 8; k < len - 6; k += 16) {
          if (vertical) ctx.fillRect(this.facing < 0 ? x - 1 : x + w, y + k, 1, 2);
          else ctx.fillRect(x + k, y + h, 2, 1);
        }
        if (!this.coreExposed) {
          const L = B2.wingletLength;
          ctx.fillStyle = pal.l;
          if (vertical) ctx.fillRect(x + 2, y + h - L, w - 4, L - 2);
          else ctx.fillRect(x + 2, y + 2, L - 2, h - 4);
          ctx.fillStyle = Math.floor(this.age * 6) % 2 ? "#ffb300" : "#ffe36b";
          if (vertical) ctx.fillRect(x + w / 2 - 2, y + h - L / 2 - 2, 4, 4);
          else ctx.fillRect(x + L / 2 - 2, y + h / 2 - 2, 4, 4);
        }
      }
      ctx.fillStyle = K;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = pal.d;
      ctx.fillRect(-4, -4, 8, 8);
      if (this.coreExposed) {
        ctx.fillStyle = K;
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2;
          ctx.fillRect(Math.round(Math.cos(a) * 9), Math.round(Math.sin(a) * 9), 2, 2);
          ctx.fillRect(Math.round(Math.cos(a) * 14), Math.round(Math.sin(a) * 14), 1, 1);
        }
        const r = 5 + Math.sin(this.age * 10) * 1.5;
        ctx.fillStyle = "rgba(255,42,42,0.4)";
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Math.floor(this.age * 10) % 2 ? "#ff2a2a" : "#ff8a80";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -1, 2, 2);
      } else {
        ctx.fillStyle = pal.l;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -1, 1, 1);
      }
      if (this.dyingStage === "hitstop") {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, y, w, h);
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
    /** Tekst z 1-px cieniem – czytelny na jasnym niebie. */
    label(ctx, text, x, y, color) {
      const t = ascii(text);
      ctx.fillStyle = C.K;
      ctx.fillText(t, x + 1, y + 1);
      ctx.fillStyle = color;
      ctx.fillText(t, x, y);
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
      this.label(ctx, "SEBA", bx, by + barH + 1, "#ffffff");
      this.label(ctx, `${Math.ceil(player.health.current)}`, bx + 40, by + barH + 1, C.R);
      ctx.textAlign = "right";
      this.label(ctx, "SCORE", W - 8, 6, C.Y);
      this.label(ctx, score.toString().padStart(6, "0"), W - 8, 18, "#ffffff");
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
        this.label(ctx, CONFIG.boss.name, W / 2, byy + bh + 4, "#ff9a90");
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
      this.label(ctx, gamepad ? "D-PAD/GA\u0141KA: RUCH   A: SKOK   B/X/RT: OGIE\u0143   D\xD3\u0141+A: ZESKOK" : "STRZA\u0141KI: RUCH   Z: SKOK   X: OGIE\u0143   D\xD3\u0141+Z: ZESKOK", W / 2, H - 14, "#ffffff");
      ctx.restore();
    }
    /** Ikona głośnika (prawy dolny róg) + podpowiedź, gdy przeglądarka czeka na gest użytkownika. */
    drawAudioState(ctx, muted, unlocked) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      const x = W - 14, y = H - 12;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = muted || !unlocked ? "#7d8794" : C.R;
      ctx.fillRect(x, y + 2, 3, 4);
      ctx.fillRect(x + 3, y + 1, 2, 6);
      ctx.fillRect(x + 5, y, 1, 8);
      if (muted || !unlocked) {
        ctx.fillStyle = "#ff3b3b";
        ctx.fillRect(x + 7, y + 1, 1, 1);
        ctx.fillRect(x + 8, y + 2, 1, 1);
        ctx.fillRect(x + 9, y + 3, 1, 1);
        ctx.fillRect(x + 9, y + 1, 1, 1);
        ctx.fillRect(x + 7, y + 3, 1, 1);
      } else {
        ctx.fillRect(x + 7, y + 2, 1, 4);
        ctx.fillRect(x + 9, y + 1, 1, 6);
      }
      if (!unlocked) {
        ctx.font = FONT(16);
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        this.label(ctx, "DOWOLNY KLAWISZ: D\u0179WI\u0118K", x - 4, H - 2, "#ffffff");
      }
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
      /** Pool martwych instancji per rodzaj – respawn bez alokacji. */
      this.enemyPool = /* @__PURE__ */ new Map();
      this.boss = null;
      this.runnerWaves = [];
      this.bossTriggered = false;
      this.endTimer = 0;
      this.debug = false;
      this.hitStopTimer = 0;
      this.arenaFloorY = 0;
      const start = this.level.findMarker("player") ?? { x: 32, y: 160 };
      this.player = new PlayerController(input, start.x, start.y + CONFIG.view.tile - CONFIG.player.standHeight);
      this.camera.maxX = this.level.widthPx - this.camera.width;
      this.arenaX = this.level.findMarker("bossArena")?.x ?? this.camera.maxX;
      this.pendingMarkers = this.level.markers.filter((m) => m.type === "sniper" || m.type === "drone" || m.type === "runnerSpawner");
      this.setupRendering();
      this.events.on("boss:phase", ({ from, to }) => {
        if (from >= 0) this.hud.showBanner(`FAZA ${to + 1}${to === 2 ? " \u2013 ENRAGE!" : ""}`);
      });
      this.events.on("boss:spawned", () => Jukebox.play("boss"));
      this.events.on("boss:died", () => {
        this.state = "victory";
        this.endTimer = 0;
        Sfx.stopAllLoops();
        Jukebox.play("victory");
        for (const e of this.enemies) if (e.alive) e.die(this);
        this.enemyBullets.clear();
      });
      this.events.on("player:died", () => {
        this.state = "gameover";
        this.endTimer = 0;
        Sfx.stopAllLoops();
        Jukebox.play("gameover");
      });
      Jukebox.play("level");
    }
    /** Warstwy tła i tileset – tylko gdy zasoby są załadowane (headless test rysuje placeholdery). */
    setupRendering() {
      const sky = Images.tryGet("sky"), mid = Images.tryGet("siteMid"), near = Images.tryGet("siteNear");
      if (sky && mid && near) {
        const H = CONFIG.view.height;
        const blades = Sheets.tryGet("skyBlades");
        this.parallax = new Parallax([
          { image: sky, scroll: 0.05, y: 0 },
          // zachód słońca, pola, wieże turbin
          ...blades ? [{ image: blades.image, sheet: blades, clip: "spin", scroll: 0.05, y: 126 }] : [],
          // obracające się łopaty
          { image: mid, scroll: 0.3, y: H - 40 - mid.height },
          // żuraw gąsienicowy, sekcje masztów
          { image: near, scroll: 0.7, y: H - 30 - near.height }
          // kontenery, płoty, barierki
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
    /** Pobiera instancję z poola (lub tworzy) i ustawia na pozycji. */
    acquire(kind, x, y) {
      const pool = this.enemyPool.get(kind);
      const reused = pool?.pop();
      if (reused) {
        reused.reset(x, y);
        this.spawnEnemy(reused);
        return reused;
      }
      const e = kind === "runner" ? new Runner(x, y) : kind === "sniper" ? new Sniper(x, y) : new Drone(x, y);
      this.spawnEnemy(e);
      return e;
    }
    recycleDead() {
      const alive = [];
      for (const e of this.enemies) {
        if (e.alive) {
          alive.push(e);
          continue;
        }
        if (e.kind === "runner" || e.kind === "sniper" || e.kind === "drone") {
          const pool = this.enemyPool.get(e.kind) ?? [];
          if (pool.length < 16) pool.push(e);
          this.enemyPool.set(e.kind, pool);
        }
      }
      this.enemies = alive;
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
        life: opts.life ?? 4,
        gravity: opts.gravity,
        hitsTerrain: opts.hitsTerrain ?? false,
        color: opts.color,
        kind: opts.kind
      });
    }
    hitStop(seconds) {
      this.hitStopTimer = Math.max(this.hitStopTimer, seconds);
    }
    // ---- Update ------------------------------------------------------------
    update(dt) {
      this.time += dt;
      this.hud.update(dt);
      this.camera.update(dt);
      if (this.input.justPressed("mute")) {
        AudioEngine.toggleMute();
        Sfx.play("ui");
      }
      if (this.input.justPressed("debug")) this.debug = !this.debug;
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= dt;
        this.particles.update(dt);
        this.fx.update(dt);
        return;
      }
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
      this.recycleDead();
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
        this.arenaFloorY = floorY;
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
              this.acquire("sniper", m.x, m.y);
              break;
            case "drone":
              this.acquire("drone", m.x, m.y);
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
          this.acquire("runner", x, wave.marker.y);
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
        if (this.boss && this.boss.alive && !b.spent) {
          const zone = this.boss.hitZone(b.x, b.y, b.radius);
          if (zone === "none") return;
          if ((zone === "weak" || zone === "core") && this.boss.vulnerable) {
            this.boss.takeHit(b.damage * (zone === "core" ? 1.5 : 1), this);
            impactSparks(this, b.x, b.y, b.vx, b.vy);
            b.active = false;
          } else {
            b.spent = true;
            b.vx = -b.vx * 0.6 + (Math.random() - 0.5) * 80;
            b.vy = -Math.abs(b.vy) * 0.5 - 90 - Math.random() * 60;
            b.gravity = 500;
            b.life = Math.min(b.life, 0.6);
            Sfx.play("ricochet", 0.7);
            this.particles.emit({ x: b.x, y: b.y, count: 5, color: ["#ffe36b", "#ffffff"], speed: [40, 120], life: [0.1, 0.25], size: [1, 1.5] });
          }
        }
      });
      if (player.isDead) return;
      this.enemyBullets.forEachActive((b) => {
        if (player.overlapsCircle(b.x, b.y, b.radius)) {
          if (player.takeDamage(b.damage, b.x, this)) b.active = false;
        }
      });
      for (const e of this.enemies) if (e.alive && e.overlaps(player)) e.onTouchPlayer(this);
      if (this.boss && this.boss.alive && !this.boss.isIntro && !this.boss.isDying && this.boss.overlaps(player)) this.boss.onTouchPlayer(this);
    }
    // ---- Render ------------------------------------------------------------
    draw(ctx, fps = 0) {
      const W = CONFIG.view.width, H = CONFIG.view.height;
      if (this.parallax) {
        this.parallax.draw(ctx, this.camera.x, this.time);
        ctx.fillStyle = "rgba(230,236,245,0.12)";
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#141826";
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
      if (this.hitStopTimer > 0) {
        ctx.fillStyle = `rgba(255,255,255,${(0.5 * this.hitStopTimer / CONFIG.boss.finale.hitStop).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      this.hud.draw(ctx, this.player, this.score, this.boss, this.time);
      this.hud.drawAudioState(ctx, AudioEngine.muted, AudioEngine.running || !AudioEngine.available);
      if (this.time < 6) this.hud.drawHint(ctx, Math.min(1, 6 - this.time), this.input.gamepadConnected);
      if (this.debug) {
        let pb = 0, eb = 0;
        this.playerBullets.forEachActive(() => pb++);
        this.enemyBullets.forEachActive(() => eb++);
        ctx.save();
        ctx.font = "8px monospace";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(4, 40, 120, 30);
        ctx.fillStyle = "#7fff7f";
        ctx.fillText(`FPS ${fps.toFixed(0)}  cam ${this.camera.x.toFixed(0)}`, 6, 42);
        ctx.fillText(`enemies ${this.enemies.length} pool ${[...this.enemyPool.values()].reduce((a, p) => a + p.length, 0)}`, 6, 51);
        ctx.fillText(`bullets ${pb}/${eb}  x ${this.player.x.toFixed(0)}`, 6, 60);
        ctx.restore();
      }
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
      /** Wygładzone FPS (do nakładki debug F3). */
      this.fps = 60;
      canvas.width = CONFIG.view.width;
      canvas.height = CONFIG.view.height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Brak kontekstu 2D");
      this.ctx = ctx;
      this.ctx.imageSmoothingEnabled = false;
      this.input = new Input(window);
      AudioEngine.hookUnlock();
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
      if (dt > 0) this.fps += (1 / dt - this.fps) * 0.1;
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
      this.scene.draw(this.ctx, this.fps);
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
    window.audio = { engine: AudioEngine, jukebox: Jukebox, sfx: Sfx };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
//# sourceMappingURL=game.js.map
