// main.js — Phaser config, MenuScene, game boot

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  init(data) {
    this.bestScore = data.best || parseInt(localStorage.getItem('magmaflow_best') || '0');
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(CONFIG.COL_BG, 1);
    bg.fillRect(0, 0, 360, 720);

    // Animated lava drips (decoration)
    this.dripGfx = this.add.graphics();
    this.drips = [];
    for (let i = 0; i < 8; i++) {
      this.drips.push({
        x: 40 + Math.random() * 280,
        y: -20 - Math.random() * 200,
        speed: 60 + Math.random() * 80,
        size: 4 + Math.random() * 6
      });
    }

    // Title
    this.add.text(180, 240, 'MAGMA\nFLOW', {
      fontSize: '52px', fontFamily: 'Arial Black, sans-serif', color: '#FF4500',
      fontStyle: 'bold', align: 'center', stroke: '#FFD700', strokeThickness: 3,
      lineSpacing: 8
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(180, 360, 'Draw walls. Guide lava.\nDon\'t wait.', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#FFD700',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Best score
    this.add.text(180, 420, `BEST: ${this.bestScore}`, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Tap to play
    const tap = this.add.text(180, 520, 'TAP TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    // Setup sound context on first tap
    this.input.once('pointerdown', () => {
      try { new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      this.scene.start('GameScene', { stage: 1, score: 0, combo: 0, best: this.bestScore, fails: 0 });
    });
  }

  update(time, delta) {
    if (!this.dripGfx) return;
    this.dripGfx.clear();
    this.drips.forEach(d => {
      d.y += d.speed * delta / 1000;
      if (d.y > 740) { d.y = -20; d.x = 40 + Math.random() * 280; }
      this.dripGfx.fillStyle(CONFIG.COL_LAVA_HOT, 0.6);
      this.dripGfx.fillCircle(d.x, d.y, d.size);
      this.dripGfx.fillStyle(CONFIG.COL_LAVA_WARM, 0.3);
      this.dripGfx.fillCircle(d.x, d.y, d.size + 3);
    });
  }
}

// Phaser Game Config
const phaserConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1A0A00',
  scene: [MenuScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 1
  },
  autoFocus: false,
  banner: false
};

const game = new Phaser.Game(phaserConfig);
