// Pressure Cooker - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1A26, 0.95).setDepth(0);

    // Title
    this.add.text(w / 2, 40, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'monospace', color: COLORS.hudText, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Scrollable container
    let yPos = 80;

    // Diagram 1: Venting & Transfer
    this.add.text(w / 2, yPos, 'TAP to VENT a chamber', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.timerBar, fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 25;

    // Draw 3 chambers
    const chamberW = 55, chamberH = 90, gap = 20;
    const startX = w / 2 - (chamberW * 3 + gap * 2) / 2 + chamberW / 2;
    const fills = [0.7, 0.3, 0.2];
    const fillColors = [0xE8251A, 0xF5D76E, 0xF5D76E];

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * (chamberW + gap);
      this.add.rectangle(cx, yPos + chamberH / 2, chamberW, chamberH, 0x2A3A4A)
        .setStrokeStyle(2, 0x4A6A8A);
      const fillH = chamberH * fills[i];
      this.add.rectangle(cx, yPos + chamberH - fillH / 2, chamberW - 8, fillH, fillColors[i], 0.85);
    }

    // Tap arrow on first chamber
    const c1x = startX;
    this.add.text(c1x, yPos - 15, 'TAP', {
      fontSize: '11px', fontFamily: 'monospace', color: COLORS.timerBar, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Transfer arrows
    const arrowY = yPos + chamberH / 2;
    const c2x = startX + chamberW + gap;
    const c3x = startX + 2 * (chamberW + gap);

    // Arrow c1 -> c2
    const arrow1 = this.add.graphics();
    arrow1.lineStyle(2, 0xFF8C00);
    arrow1.beginPath();
    arrow1.moveTo(c1x + chamberW / 2 + 4, arrowY);
    arrow1.lineTo(c2x - chamberW / 2 - 4, arrowY);
    arrow1.strokePath();
    // Arrowhead
    arrow1.fillStyle(0xFF8C00);
    arrow1.fillTriangle(c2x - chamberW / 2 - 4, arrowY - 5, c2x - chamberW / 2 - 4, arrowY + 5, c2x - chamberW / 2 + 2, arrowY);

    yPos += chamberH + 20;

    this.add.text(w / 2, yPos, 'Pressure resets to 0,\nbut NEIGHBORS absorb it!', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.hudText, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);
    yPos += 45;

    // Divider
    this.add.rectangle(w / 2, yPos, w - 60, 1, 0x4A6A8A, 0.5);
    yPos += 20;

    // Diagram 2: Explosion
    this.add.text(w / 2, yPos, '100% = EXPLOSION!', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.dangerText, fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 25;

    const exCx = w / 2;
    this.add.rectangle(exCx, yPos + 35, chamberW, 70, 0x2A3A4A).setStrokeStyle(3, 0xE8251A);
    this.add.rectangle(exCx, yPos + 35, chamberW - 8, 62, 0xFFFFFF, 0.9);
    // Burst lines
    const burst = this.add.graphics();
    burst.lineStyle(2, 0xFF6B00);
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    angles.forEach(a => {
      const rad = a * Math.PI / 180;
      burst.beginPath();
      burst.moveTo(exCx + Math.cos(rad) * 30, yPos + 35 + Math.sin(rad) * 30);
      burst.lineTo(exCx + Math.cos(rad) * 48, yPos + 35 + Math.sin(rad) * 48);
      burst.strokePath();
    });
    this.add.text(exCx, yPos + 78, 'BOOM!', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.dangerText, fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 100;

    // Divider
    this.add.rectangle(w / 2, yPos, w - 60, 1, 0x4A6A8A, 0.5);
    yPos += 20;

    // Tips
    this.add.text(w / 2, yPos, 'TIPS', {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.clutchGold, fontStyle: 'bold'
    }).setOrigin(0.5);
    yPos += 25;

    const tips = [
      '> Vent the FULLEST chamber\n  first, not the fastest.',
      '> HOT chambers (orange glow)\n  fill 2x faster!',
      '> LOCKED chambers (lock icon)\n  can\'t be vented — route\n  pressure away from them.'
    ];
    tips.forEach(tip => {
      this.add.text(30, yPos, tip, {
        fontSize: '11px', fontFamily: 'monospace', color: COLORS.hudText, lineSpacing: 3
      });
      yPos += 48;
    });

    yPos = Math.max(yPos + 10, h - 70);

    // GOT IT button
    const btnW = 180, btnH = 50;
    const btnBg = this.add.rectangle(w / 2, yPos, btnW, btnH, 0x00CFFF, 1)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w / 2, yPos, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#0D1A26', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Full screen fallback tap zone
    const fullZone = this.add.rectangle(w / 2, h - 30, w, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(-1);

    const dismiss = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };

    btnBg.on('pointerdown', dismiss);
    fullZone.on('pointerdown', dismiss);
  }
}
