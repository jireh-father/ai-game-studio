// Echo Dodge - Help / How to Play Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Background overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x080810, 0.95).setDepth(0);

    let y = 40;
    const cx = w / 2;

    // Title
    this.add.text(cx, y, 'HOW TO PLAY', { fontSize: '24px', fill: COLORS.playerHex, fontStyle: 'bold' }).setOrigin(0.5);
    y += 45;

    // Control diagram using game objects
    const diagBg = this.add.rectangle(cx, y + 70, 260, 140, 0x0D0D1A, 0.8).setStrokeStyle(1, 0x333355);

    // Finger icon
    this.add.text(cx - 100, y + 15, 'DRAG', { fontSize: '14px', fill: '#E0E0FF', fontStyle: 'bold' }).setOrigin(0.5);
    // Arrow
    const arrow = this.add.graphics();
    arrow.lineStyle(2, 0xE0E0FF);
    arrow.lineBetween(cx - 100, y + 28, cx - 60, y + 50);
    arrow.fillStyle(0xE0E0FF);
    arrow.fillTriangle(cx - 60, y + 55, cx - 55, y + 45, cx - 65, y + 45);

    // Player orb
    this.add.image(cx - 30, y + 70, 'player').setScale(1.2);
    this.add.text(cx - 30, y + 95, 'YOU', { fontSize: '10px', fill: COLORS.playerHex }).setOrigin(0.5);

    // Trail dots
    for (let i = 0; i < 4; i++) {
      const tx = cx - 50 - i * 18;
      const ta = 0.9 - i * 0.2;
      this.add.image(tx, y + 70, 'trail').setAlpha(ta);
    }
    this.add.text(cx - 85, y + 95, 'ECHO', { fontSize: '10px', fill: '#CC44FF' }).setOrigin(0.5);

    // Enemy
    this.add.image(cx + 70, y + 70, 'enemy').setScale(1.1);
    this.add.text(cx + 70, y + 95, 'ENEMY', { fontSize: '10px', fill: '#FF3366' }).setOrigin(0.5);

    // Chase arrow (enemy -> trail)
    const chaseArrow = this.add.graphics();
    chaseArrow.lineStyle(1.5, 0xFF3366);
    chaseArrow.lineBetween(cx + 50, y + 70, cx + 5, y + 70);
    chaseArrow.fillStyle(0xFF3366);
    chaseArrow.fillTriangle(cx, y + 70, cx + 10, y + 65, cx + 10, y + 75);

    this.add.text(cx + 30, y + 55, 'chases ghost', { fontSize: '9px', fill: '#FF3366' }).setOrigin(0.5);

    y += 155;

    // Rules section
    this.add.text(cx, y, 'RULES', { fontSize: '16px', fill: COLORS.playerHex, fontStyle: 'bold' }).setOrigin(0.5);
    y += 25;
    const rules = [
      'Drag to move your orb',
      'Your trail is fatal - avoid your own echo!',
      'Enemies chase your ghost, not you',
      'Survive the timer to advance stages',
      'Lure enemies into your trail for bonus pts'
    ];
    rules.forEach(r => {
      this.add.text(30, y, '> ' + r, { fontSize: '13px', fill: '#C0C0E0', wordWrap: { width: w - 60 } });
      y += 22;
    });

    y += 10;

    // Tips section
    this.add.text(cx, y, 'TIPS', { fontSize: '16px', fill: COLORS.accent, fontStyle: 'bold' }).setOrigin(0.5);
    y += 25;
    const tips = [
      'Wide loops lure enemies away but leave more trail',
      'Trail fades after ~3s - wait it out if cornered',
      'Release finger to stop and let trail fade around you'
    ];
    tips.forEach(t => {
      this.add.text(30, y, '* ' + t, { fontSize: '12px', fill: '#A0A0C0', wordWrap: { width: w - 60 } });
      y += 28;
    });

    // GOT IT button - fixed near bottom
    const btnY = h - 60;
    const btnBg = this.add.rectangle(cx, btnY, 180, 48, 0x00CCCC, 0.9).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(cx, btnY, 'GOT IT!', { fontSize: '20px', fill: '#080810', fontStyle: 'bold' }).setOrigin(0.5);

    // Full-screen fallback tap zone behind button
    const fallback = this.add.rectangle(cx, h - 30, w, 80, 0x000000, 0.01).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => this._close());

    btnBg.on('pointerdown', () => this._close());

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x00FFFF, 1));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x00CCCC, 0.9));
  }

  _close() {
    this.scene.stop();
    if (this.returnTo === 'GameScene') {
      const gs = this.scene.get('GameScene');
      if (gs && gs.paused) gs.togglePause();
      this.scene.resume('GameScene');
    } else {
      this.scene.resume(this.returnTo);
    }
  }
}
