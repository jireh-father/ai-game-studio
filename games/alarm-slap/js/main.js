// main.js — Phaser config, BootScene, GameState, StorageManager, SettingsManager

const StorageManager = {
  PREFIX: 'alarm-slap_',
  get(key) {
    try {
      const val = localStorage.getItem(this.PREFIX + key);
      return val ? JSON.parse(val) : null;
    } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(value)); } catch (e) {}
  },
};

const SettingsManager = {
  sound: true,
  music: true,
  vibration: true,

  load() {
    const s = StorageManager.get('settings');
    if (s) {
      this.sound = s.sound !== false;
      this.music = s.music !== false;
      this.vibration = s.vibration !== false;
    }
  },
  save() {
    StorageManager.set('settings', {
      sound: this.sound, music: this.music, vibration: this.vibration,
    });
  },
};

SettingsManager.load();
AdManager.init();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    this.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x0D0D1A);

    const loadText = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '24px', fontFamily: 'Arial', fill: '#FFFFFF',
    }).setOrigin(0.5);

    const textures = {
      alarm_stationary: `data:image/svg+xml;base64,${btoa(SVG.ALARM_STATIONARY)}`,
      alarm_moving: `data:image/svg+xml;base64,${btoa(SVG.ALARM_MOVING)}`,
      alarm_muffler: `data:image/svg+xml;base64,${btoa(SVG.ALARM_MUFFLER)}`,
      background: `data:image/svg+xml;base64,${btoa(SVG.BACKGROUND)}`,
    };

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

    const checkDone = () => {
      if (pending === 0) {
        loadText.destroy();
        this.scene.start('MenuScene');
      }
    };

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          pending--;
          checkDone();
        });
        this.textures.addBase64(key, src);
      }
    }

    checkDone();
  }
}

// Phaser game config
const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0D0D1A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

// Start game
const game = new Phaser.Game(phaserConfig);

// Visibility change: pause when backgrounded
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.getScenes(true).forEach(scene => {
      if (scene.scene.key === 'GameScene' && !scene.paused && !scene.gameOver) {
        scene.togglePause();
      }
    });
  }
});
