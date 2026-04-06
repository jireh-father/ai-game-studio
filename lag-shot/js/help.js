// Lag Shot - Help / How to Play Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    // Dark overlay background
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.95).setDepth(0);

    let y = 40;
    // Title
    this.add.text(w / 2, y, 'HOW TO PLAY', { fontSize: '24px', fontFamily: 'monospace', fill: '#FFFFFF' }).setOrigin(0.5);
    y += 40;
    this.add.text(w / 2, y, 'Shoot where you WERE', { fontSize: '13px', fontFamily: 'monospace', fill: COLORS.player, fontStyle: 'italic' }).setOrigin(0.5);

    // --- Diagram 1: Move ---
    y += 40;
    this.add.text(w / 2, y, '-- MOVE --', { fontSize: '14px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    y += 30;
    // Ghost (old pos)
    this._drawDiamond(80, y, 0x00FFFF, 0.3);
    this.add.text(80, y + 18, 'old', { fontSize: '9px', fontFamily: 'monospace', fill: '#00FFFF' }).setOrigin(0.5).setAlpha(0.5);
    // Arrow
    const arrow1 = this.add.graphics();
    arrow1.lineStyle(1.5, 0xFFFFFF, 0.6);
    arrow1.lineBetween(100, y, 160, y);
    arrow1.fillStyle(0xFFFFFF, 0.6);
    arrow1.fillTriangle(165, y, 158, y - 5, 158, y + 5);
    // Player (new pos)
    this._drawDiamond(190, y, 0x00FFFF, 1.0);
    // Tap ring
    this.add.circle(190, y, 14, 0x000000, 0).setStrokeStyle(1, 0xFFFFFF, 0.4);
    this.add.text(190, y + 20, 'TAP', { fontSize: '10px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    this.add.text(280, y, 'Tap to teleport', { fontSize: '11px', fontFamily: 'monospace', fill: '#FFFFFF' }).setOrigin(0.5);

    // --- Diagram 2: Lag Shot ---
    y += 55;
    this.add.text(w / 2, y, '-- SHOOT --', { fontSize: '14px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    y += 30;
    // Ghost position
    this._drawDiamond(60, y + 20, 0x00FFFF, 0.3);
    this.add.text(60, y + 38, '1s ago', { fontSize: '8px', fontFamily: 'monospace', fill: '#00FFFF' }).setOrigin(0.5).setAlpha(0.6);
    // Dashed line to enemy
    const dash = this.add.graphics();
    dash.lineStyle(1.5, 0xFFFFFF, 0.5);
    for (let dx = 80; dx < 200; dx += 12) {
      dash.lineBetween(dx, y + 20, dx + 6, y + 20);
    }
    // Bullet dot
    this.add.circle(205, y + 20, 3, 0xFFFFFF);
    // Enemy
    this.add.circle(230, y + 20, 10, 0xFF4444);
    // Player (current)
    this._drawDiamond(140, y - 10, 0x00FFFF, 1.0);
    this.add.text(140, y - 25, 'double tap', { fontSize: '8px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    this.add.text(w / 2, y + 55, 'Double-tap fires from ghost!', { fontSize: '11px', fontFamily: 'monospace', fill: COLORS.combo }).setOrigin(0.5);

    // --- Diagram 3: Ghost = aim ---
    y += 85;
    this.add.text(w / 2, y, '-- GHOST = AIM --', { fontSize: '14px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    y += 28;
    this._drawDiamond(80, y, 0x00FFFF, 0.4);
    this.add.text(80, y - 16, 'AIM', { fontSize: '9px', fontFamily: 'monospace', fill: '#00FFFF' }).setOrigin(0.5).setAlpha(0.6);
    const aimLine = this.add.graphics();
    aimLine.lineStyle(0.8, 0x00FFFF, 0.4);
    for (let dx = 98; dx < 200; dx += 8) {
      aimLine.lineBetween(dx, y, dx + 4, y);
    }
    aimLine.fillStyle(0x00FFFF, 0.4);
    aimLine.fillTriangle(205, y, 198, y - 4, 198, y + 4);
    this._drawDiamond(250, y - 10, 0x00FFFF, 0.9);
    this.add.text(250, y + 10, 'you', { fontSize: '9px', fontFamily: 'monospace', fill: '#AAAAAA' }).setOrigin(0.5);
    this.add.text(w / 2, y + 28, 'Move ghost onto enemy path, then fire!', { fontSize: '10px', fontFamily: 'monospace', fill: '#FFFFFF' }).setOrigin(0.5);

    // --- Tips ---
    y += 55;
    this.add.text(w / 2, y, 'TIPS', { fontSize: '14px', fontFamily: 'monospace', fill: COLORS.combo }).setOrigin(0.5);
    y += 22;
    const tips = [
      'Stay moving - standing still = death',
      'Position ghost on enemy path, THEN fire',
      'Watch the ghost: it is your real aim'
    ];
    tips.forEach((tip, i) => {
      this.add.text(30, y + i * 20, '> ' + tip, { fontSize: '11px', fontFamily: 'monospace', fill: '#CCCCCC', wordWrap: { width: 300 } });
    });

    // --- GOT IT button ---
    y += 80;
    const btnY = Math.min(y, h - 50);
    const btnBg = this.add.rectangle(w / 2, btnY, 180, 48, 0xFFFFFF, 1).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(w / 2, btnY, 'GOT IT!', { fontSize: '18px', fontFamily: 'monospace', fill: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
    btnText.disableInteractive();

    btnBg.on('pointerdown', () => {
      audioManager.playButton();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    });

    // Full-screen fallback tap zone behind everything
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => btnBg.emit('pointerdown'));
  }

  _drawDiamond(cx, cy, color, alpha) {
    const g = this.add.graphics();
    g.fillStyle(color, alpha);
    g.fillPoints([
      { x: cx, y: cy - 8 }, { x: cx + 8, y: cy },
      { x: cx, y: cy + 8 }, { x: cx - 8, y: cy }
    ], true);
  }
}
