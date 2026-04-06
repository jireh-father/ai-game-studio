// Echo Dodge - Boot Scene & Phaser Config

// Global game state
window.GameState = {
  score: 0,
  stage: 1,
  highScore: parseInt(localStorage.getItem('echo-dodge_high_score') || '0', 10)
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(PLAYER_SVG)}`,
      trail: `data:image/svg+xml;base64,${btoa(TRAIL_SVG)}`,
      enemy: `data:image/svg+xml;base64,${btoa(ENEMY_SVG)}`,
      enemyPulse: `data:image/svg+xml;base64,${btoa(ENEMY_PULSE_SVG)}`,
      particle: `data:image/svg+xml;base64,${btoa(PARTICLE_SVG)}`,
      particleEnemy: `data:image/svg+xml;base64,${btoa(PARTICLE_ENEMY_SVG)}`
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x080810, 0.9);

    this.add.text(w / 2, h * 0.25, 'PAUSED', {
      fontSize: '28px', fill: COLORS.hud, fontStyle: 'bold'
    }).setOrigin(0.5);

    const makeBtn = (y, label, cb) => {
      const bg = this.add.rectangle(w / 2, y, 160, 46, 0x333355, 0.8)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, y, label, {
        fontSize: '16px', fill: '#C0C0E0', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive().on('pointerdown', cb);
      bg.on('pointerdown', cb);
      bg.on('pointerover', () => bg.setFillStyle(0x444477, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x333355, 0.8));
    };

    makeBtn(h * 0.42, 'RESUME', () => this._resume());
    makeBtn(h * 0.54, 'RESTART', () => this._restart());
    makeBtn(h * 0.66, 'MENU', () => this._menu());

    // Help button
    const helpBg = this.add.rectangle(w - 35, 35, 40, 40, 0x222244, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(w - 35, 35, '?', {
      fontSize: '22px', fill: COLORS.playerHex, fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => {
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      this.scene.stop();
    });
  }

  _resume() {
    const gs = this.scene.get('GameScene');
    if (gs) { gs.paused = false; }
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  _restart() {
    window.GameState.score = 0;
    window.GameState.stage = 1;
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('GameScene');
  }

  _menu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#080810',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene, PauseScene],
  render: {
    pixelArt: false,
    antialias: true
  },
  input: {
    touch: { capture: true }
  }
};

const game = new Phaser.Game(phaserConfig);
