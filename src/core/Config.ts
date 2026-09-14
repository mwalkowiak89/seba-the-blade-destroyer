/**
 * Centralna konfiguracja balansu i parametrów.
 * Wszystkie wartości "tunable" żyją tutaj – jednostki: piksele, sekundy, px/s, px/s².
 * Wirtualna rozdzielczość 320x240 (NES-like), skalowana całkowicie do okna.
 */
export const CONFIG = {
  view: {
    width: 320,
    height: 240,
    tile: 16,
    fixedStep: 1 / 60,
    maxStepsPerFrame: 3,
  },

  physics: {
    gravity: 1300,
    maxFallSpeed: 460,
  },

  audio: {
    master: 0.8,
    sfx: 0.9,
    music: 0.5,
  },

  vfx: {
    /** Iskry z tarczy tnącej (cząstek/s). */
    sawSparkRate: 22,
    impactSparks: 6,
    landingDust: 6,
    /** Limity cząstek (wydajność): na emisję i maksymalny czas życia (s). */
    maxParticlesPerEmit: 15,
    maxParticleLife: 0.4,
    shake: { playerHit: 3, enemyDeath: 1.5, bossPhase: 4, bossDeath: 7, sweepLand: 2 },
  },

  camera: {
    /** Gracz utrzymywany w tej części ekranu (0..1) podczas biegu w prawo. */
    followFraction: 0.4,
    /** Współczynnik wygładzania (większy = szybciej dogania). */
    smoothing: 10,
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
    flashHz: 14,
  },

  weapons: {
    makita: {
      name: 'Makita DIY',
      fireInterval: 0.085,
      bulletSpeed: 400,
      damage: 10,
      bulletRadius: 2,
      lifetime: 1.0,
      /** Rozrzut w stopniach (0 = laserowo prosto). */
      spreadDeg: 1.5,
    },
  },

  bullets: {
    playerPoolSize: 48,
    enemyPoolSize: 96,
    enemyRadius: 3,
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
      obstacleLookahead: 10,
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
      score: 200,
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
      bombWindowX: 28,
    },
  },

  boss: {
    name: 'SKRZYDŁO TURBINY',
    width: 28,
    height: 96,
    hp: 900,
    contactDamage: 20,
    score: 5000,
    bulletDamage: 12,
    /** Progi HP (ułamek) – przejście w fazę n następuje gdy HP <= próg. */
    phaseThresholds: [1.0, 0.66, 0.33],
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
      sweep: { telegraph: 0.45, speed: 260, height: 18 },
    },
    phase2: {
      hoverHz: 0.6,
      attackCooldown: 1.1,
      slam: { telegraph: 0.55, fallSpeed: 620, rest: 0.6, shards: 7, shardSpeed: 170, shardDamage: 10 },
      serviceDrones: 2,
    },
    phase3: {
      hoverHz: 0.9,
      attackCooldown: 0.9,
      charge: { telegraph: 0.8, speed: 540, rest: 0.4, returnSpeed: 220 },
      quake: { interval: 2.8, telegraph: 0.5, damage: 10, knockUp: -220 },
      lightning: { count: 5, interval: 0.12, speed: 210, spreadDeg: 24 },
      smokeRate: 30,
    },
    finale: { hitStop: 1.5, explosionsDuration: 1.2, fallDuration: 1.3 },
  },
};

export type Config = typeof CONFIG;
