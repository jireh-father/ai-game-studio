// Escalator Chaos - Title Screen Scene

class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.drawEscalators();

    this.add.text(cx, 180, 'ESCALATOR', {
      fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#EAEAEA', stroke: '#E94560', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(cx, 230, 'CHAOS', {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#E94560', stroke: '#1A1A2E', strokeThickness: 3
    }).setOrigin(0.5);

    const tap = this.add.text(cx, 420, 'TAP TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#EAEAEA'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: tap, alpha: 0.3, duration: 800,
      yoyo: true, repeat: -1
    });

    this.spawnDemoCommuters();

    this.input.once('pointerdown', () => {
      this.cameras.main.fade(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene');
      });
    });
  }

  drawEscalators() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.ESCALATOR_LEFT, 0.3);
    g.fillRect(0, 300, LAYOUT.ESCALATOR_W, LAYOUT.ESCALATOR_H + 100);
    g.fillStyle(COLORS.ESCALATOR_RIGHT, 0.3);
    g.fillRect(GAME_WIDTH - LAYOUT.ESCALATOR_W, 300, LAYOUT.ESCALATOR_W, LAYOUT.ESCALATOR_H + 100);
    g.lineStyle(1, COLORS.ESCALATOR_STEPS, 0.4);
    for (let y = 300; y < 600; y += 20) {
      g.lineBetween(0, y, LAYOUT.ESCALATOR_W, y);
      g.lineBetween(GAME_WIDTH - LAYOUT.ESCALATOR_W, y, GAME_WIDTH, y);
    }
  }

  spawnDemoCommuters() {
    const types = ['normal', 'tourist', 'vip', 'sprint'];
    this.time.addEvent({
      delay: 1200, repeat: -1,
      callback: () => {
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 100 + Math.random() * 160;
        const img = this.add.image(x, -20, 'commuter_' + type);
        img.setDisplaySize(36, 46).setAlpha(0.5);
        this.tweens.add({
          targets: img, y: 700, duration: 4000 + Math.random() * 2000,
          onComplete: () => img.destroy()
        });
      }
    });
  }
}
