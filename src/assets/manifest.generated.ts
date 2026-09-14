/* WYGENEROWANE przez tools/build-assets.mjs – nie edytuj ręcznie. */
export const MANIFEST = {
  "version": "mu0z40il",
  "sheets": {
    "seba": {
      "file": "assets/sprites/player/seba.png",
      "frameW": 54,
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
        "crouch": {
          "frames": [
            30,
            31,
            32
          ],
          "fps": 8,
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
      "anchorX": 27,
      "pivots": {
        "stand": {
          "x": 5,
          "y": -27
        },
        "crouch": {
          "x": 9,
          "y": -22
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
} as const;
