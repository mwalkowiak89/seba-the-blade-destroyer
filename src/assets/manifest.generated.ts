/* WYGENEROWANE przez tools/build-assets.mjs – nie edytuj ręcznie. */
export const MANIFEST = {
  "version": "mu11eafb",
  "sheets": {
    "seba": {
      "file": "assets/sprites/player/seba.png",
      "frameW": 138,
      "frameH": 96,
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
      "anchorX": 69,
      "density": 2,
      "pivots": {
        "stand": {
          "x": 10,
          "y": -54
        },
        "up": {
          "x": 18,
          "y": -38
        },
        "crouch": {
          "x": 18,
          "y": -44
        },
        "prone": {
          "x": 48,
          "y": -14
        }
      }
    },
    "runner": {
      "file": "assets/sprites/enemies/runner.png",
      "frameW": 114,
      "frameH": 106,
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
      "density": 2,
      "anchor": "bottom",
      "anchorX": 62
    },
    "drone": {
      "file": "assets/sprites/enemies/drone.png",
      "frameW": 72,
      "frameH": 98,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 36,
      "anchorY": 32
    },
    "turret": {
      "file": "assets/sprites/enemies/turret.png",
      "frameW": 50,
      "frameH": 46,
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
      "density": 2,
      "anchor": "bottom",
      "anchorX": 26
    },
    "shot": {
      "file": "assets/sprites/fx/shot.png",
      "frameW": 30,
      "frameH": 22,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 16,
      "anchorY": 10
    },
    "shotHit": {
      "file": "assets/sprites/fx/shot-hit.png",
      "frameW": 30,
      "frameH": 22,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 14,
      "anchorY": 10
    },
    "explosion": {
      "file": "assets/sprites/fx/explosion.png",
      "frameW": 110,
      "frameH": 104,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 54,
      "anchorY": 52
    },
    "makita": {
      "file": "assets/sprites/player/makita.png",
      "frameW": 56,
      "frameH": 56,
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
      "density": 2,
      "anchor": "pivot",
      "pivots": {
        "horizontal": {
          "x": 12,
          "y": 26
        },
        "diagonal": {
          "x": 16,
          "y": 38
        },
        "vertical": {
          "x": 26,
          "y": 42
        }
      },
      "muzzle": {
        "horizontal": {
          "x": 54,
          "y": 26
        },
        "diagonal": {
          "x": 46,
          "y": 8
        },
        "vertical": {
          "x": 26,
          "y": 0
        }
      }
    },
    "muzzle": {
      "file": "assets/sprites/fx/muzzle.png",
      "frameW": 24,
      "frameH": 24,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 10,
      "anchorY": 10
    },
    "screw": {
      "file": "assets/sprites/fx/screw.png",
      "frameW": 28,
      "frameH": 12,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 20,
      "anchorY": 6
    },
    "saw": {
      "file": "assets/sprites/fx/saw.png",
      "frameW": 24,
      "frameH": 24,
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
      "density": 2,
      "anchor": "center",
      "anchorX": 10,
      "anchorY": 10
    },
    "skyBlades": {
      "file": "assets/backgrounds/sky-blades.png",
      "frameW": 640,
      "frameH": 160,
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
      "density": 2,
      "y": 222
    }
  },
  "images": {
    "tileset": {
      "file": "assets/tilesets/industrial.png",
      "tileSize": 32,
      "worldTile": 16,
      "cols": 8
    },
    "portrait": {
      "file": "assets/sprites/ui/portrait.png",
      "w": 40,
      "h": 40
    },
    "sky": {
      "file": "assets/backgrounds/sky.png",
      "w": 640,
      "h": 480
    },
    "siteMid": {
      "file": "assets/backgrounds/site-mid.png",
      "w": 960,
      "h": 400
    },
    "siteNear": {
      "file": "assets/backgrounds/site-near.png",
      "w": 1120,
      "h": 200
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
