// main.js — Phaser config, BootScene, scene management

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      chef: `data:image/svg+xml;base64,${btoa(SVG.chef)}`,
      tomato: `data:image/svg+xml;base64,${btoa(SVG.tomato)}`,
      mushroom: `data:image/svg+xml;base64,${btoa(SVG.mushroom)}`,
      fish: `data:image/svg+xml;base64,${btoa(SVG.fish)}`,
      pepper: `data:image/svg+xml;base64,${btoa(SVG.pepper)}`,
      egg: `data:image/svg+xml;base64,${btoa(SVG.egg)}`,
      goldstar: `data:image/svg+xml;base64,${btoa(SVG.goldstar)}`,
      heartFull: `data:image/svg+xml;base64,${btoa(SVG.heartFull)}`,
      heartEmpty: `data:image/svg+xml;base64,${btoa(SVG.heartEmpty)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.particle)}`,
      particleWhite: `data:image/svg+xml;base64,${btoa(SVG.particleWhite)}`
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.startGame();
        });
        this.textures.addBase64(key, src);
      }
    }

    if (pending === 0) this.startGame();
  }

  startGame() {
    // Load settings
    const settings = JSON.parse(
      localStorage.getItem('noodle-lasso_settings') ||
      '{"sound":true,"music":true,"vibration":true}'
    );
    AudioManager.enabled = settings.sound;
    AudioManager.musicEnabled = settings.music;

    // Show title splash briefly
    this.cameras.main.setBackgroundColor(PALETTE.background);
    const cx = GAME_WIDTH / 2;

    const title = this.add.text(cx, GAME_HEIGHT / 2 - 30, 'NOODLE LASSO', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.primary
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: title, scale: 1, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(400, () => {
          this.scene.start('MenuScene');
        });
      }
    });
  }
}

// Phaser config
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: PALETTE.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(config);
