/* WYGENEROWANE przez tools/build-assets.mjs – nie edytuj ręcznie. */
export const MANIFEST = {
  "version": "mu16sewj",
  "sheets": {
    "seba": {
      "file": "assets/sprites/player/seba.png",
      "frameW": 72,
      "frameH": 51,
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
      "anchorX": 36,
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
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
          "y": 12
        },
        "diagonal": {
          "x": 22,
          "y": 5
        },
        "vertical": {
          "x": 12,
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
      "density": 1,
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
      "density": 1,
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
      "density": 1,
      "anchor": "center",
      "anchorX": 5,
      "anchorY": 5
    },
    "bossWing": {
      "file": "assets/sprites/boss/wing.png",
      "frameW": 28,
      "frameH": 96,
      "cols": 6,
      "clips": {
        "p1": {
          "frames": [
            0
          ],
          "fps": 1
        },
        "p1c": {
          "frames": [
            1
          ],
          "fps": 1
        },
        "p2": {
          "frames": [
            2
          ],
          "fps": 1
        },
        "p2c": {
          "frames": [
            3
          ],
          "fps": 1
        },
        "p3": {
          "frames": [
            4
          ],
          "fps": 1
        },
        "p3c": {
          "frames": [
            5
          ],
          "fps": 1
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 14,
      "anchorY": 48
    },
    "bossCore": {
      "file": "assets/sprites/boss/core.png",
      "frameW": 16,
      "frameH": 16,
      "cols": 2,
      "clips": {
        "pulse": {
          "frames": [
            0,
            1
          ],
          "fps": 6,
          "loop": true
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 8,
      "anchorY": 8
    },
    "bolt": {
      "file": "assets/sprites/fx/bolt.png",
      "frameW": 14,
      "frameH": 6,
      "cols": 2,
      "clips": {
        "fly": {
          "frames": [
            0,
            1
          ],
          "fps": 24,
          "loop": true
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 7,
      "anchorY": 3
    },
    "shard": {
      "file": "assets/sprites/fx/shard.png",
      "frameW": 8,
      "frameH": 8,
      "cols": 2,
      "clips": {
        "spin": {
          "frames": [
            0,
            1
          ],
          "fps": 12,
          "loop": true
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 4,
      "anchorY": 4
    },
    "mine": {
      "file": "assets/sprites/fx/mine.png",
      "frameW": 12,
      "frameH": 12,
      "cols": 2,
      "clips": {
        "pulse": {
          "frames": [
            0,
            1
          ],
          "fps": 8,
          "loop": true
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 6,
      "anchorY": 6
    },
    "hudSeg": {
      "file": "assets/sprites/ui/segments.png",
      "frameW": 5,
      "frameH": 8,
      "cols": 4,
      "clips": {
        "off": {
          "frames": [
            0
          ],
          "fps": 1
        },
        "green": {
          "frames": [
            1
          ],
          "fps": 1
        },
        "yellow": {
          "frames": [
            2
          ],
          "fps": 1
        },
        "red": {
          "frames": [
            3
          ],
          "fps": 1
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 0,
      "anchorY": 0
    },
    "hudSpeaker": {
      "file": "assets/sprites/ui/speaker.png",
      "frameW": 10,
      "frameH": 8,
      "cols": 2,
      "clips": {
        "on": {
          "frames": [
            0
          ],
          "fps": 1
        },
        "muted": {
          "frames": [
            1
          ],
          "fps": 1
        }
      },
      "density": 1,
      "anchor": "center",
      "anchorX": 0,
      "anchorY": 0
    },
    "skyBlades": {
      "file": "assets/backgrounds/sky-blades.png",
      "frameW": 384,
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
      "density": 1,
      "y": 106
    }
  },
  "images": {
    "tileset": {
      "file": "assets/tilesets/industrial.png",
      "tileSize": 16,
      "worldTile": 16,
      "cols": 8
    },
    "hudPlayer": {
      "file": "assets/sprites/ui/panel-player.png",
      "w": 98,
      "h": 28
    },
    "hudScore": {
      "file": "assets/sprites/ui/panel-score.png",
      "w": 60,
      "h": 28
    },
    "hudBoss": {
      "file": "assets/sprites/ui/panel-boss.png",
      "w": 128,
      "h": 20
    },
    "portrait": {
      "file": "assets/sprites/ui/portrait.png",
      "w": 20,
      "h": 20
    },
    "sky": {
      "file": "assets/backgrounds/sky.png",
      "w": 384,
      "h": 216
    },
    "siteMid": {
      "file": "assets/backgrounds/site-mid.png",
      "w": 576,
      "h": 150
    },
    "siteNear": {
      "file": "assets/backgrounds/site-near.png",
      "w": 768,
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
    "column": 6,
    "columnTop": 7,
    "pipe": 8,
    "pipeTop": 9,
    "bladeRoot": 10,
    "bladeMid": 11,
    "bladeTip": 12,
    "trestle": 13,
    "towerM": 14,
    "towerL": 15,
    "towerR": 16,
    "cradle": 17,
    "contL": 18,
    "contM": 19,
    "contR": 20,
    "contLR": 21,
    "contBL": 22,
    "contBM": 23,
    "contBR": 24,
    "contBLR": 25,
    "bigRootT": 26,
    "bigRootB": 27,
    "bigMidT": 28,
    "bigMidB": 29,
    "bigTipT": 30,
    "bigTipB": 31,
    "trestleBig": 32,
    "trestleBigFoot": 33
  },
  "sebaSource": "seba-ai"
} as const;
