// help.js - HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const { width, height } = this.scale;
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92).setDepth(0);

    let y = 30;
    const cx = width / 2;

    // Title
    this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '26px', fill: COLORS.UI_ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
    y += 40;

    this.add.text(cx, y, 'Guide electricity from Source to Bulb!', {
      fontSize: '13px', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(1);
    y += 35;

    // Diagram 1: Tap to rotate
    this._drawMiniGrid(cx, y, width);
    y += 85;

    this.add.text(cx, y, 'TAP tiles to ROTATE them 90 degrees', {
      fontSize: '14px', fill: COLORS.UI_ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
    y += 30;

    // Diagram 2: Electricity flow
    this._drawFlowDiagram(cx, y, width);
    y += 55;

    this.add.text(cx, y, 'Current flows in real-time from SOURCE', {
      fontSize: '13px', fill: COLORS.CURRENT_GLOW
    }).setOrigin(0.5).setDepth(1);
    y += 22;

    // Diagram 3: Dead end
    this._drawDeadEndDiagram(cx, y, width);
    y += 55;

    this.add.text(cx, y, 'Dead ends = SHORT CIRCUIT = lose a life!', {
      fontSize: '13px', fill: COLORS.DANGER, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
    y += 35;

    // Rules
    const rules = [
      'Complete stages to earn points + time bonus',
      'Clear stages in a row for streak x1.5 / x2.0 / x3.0',
      '3 lives per game. Dead end or timeout = lose life.'
    ];
    for (const rule of rules) {
      this.add.text(cx, y, '• ' + rule, {
        fontSize: '12px', fill: '#CCCCCC', wordWrap: { width: width - 40 }
      }).setOrigin(0.5, 0).setDepth(1);
      y += 28;
    }
    y += 10;

    // Tips
    this.add.text(cx, y, 'TIPS', {
      fontSize: '16px', fill: COLORS.BULB_LIT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
    y += 25;

    const tips = [
      'Start from the bulb and work backwards!',
      'Cross tiles connect all 4 sides (no rotation needed)',
      'Watch the timer - later stages get faster!'
    ];
    for (const tip of tips) {
      this.add.text(cx, y, '> ' + tip, {
        fontSize: '12px', fill: '#AAFFAA', wordWrap: { width: width - 40 }
      }).setOrigin(0.5, 0).setDepth(1);
      y += 26;
    }
    y += 20;

    // Got it button
    const btnBg = this.add.rectangle(cx, y, 160, 50,
      parseInt(COLORS.UI_ACCENT.replace('#', ''), 16), 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    this.add.text(cx, y, 'Got it!', {
      fontSize: '22px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    btnBg.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }

  _drawMiniGrid(cx, y, w) {
    const s = 28; // tile size
    const startX = cx - s * 1.5;
    // 3 tiles in a row with source and bulb hints
    // Source indicator
    this.add.circle(startX - 18, y + s / 2, 8, 0x00FF88).setDepth(1);
    this.add.text(startX - 18, y + s / 2, 'S', { fontSize: '10px', fill: '#003311', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1);

    for (let i = 0; i < 3; i++) {
      const tx = startX + i * s + s / 2;
      this.add.rectangle(tx, y + s / 2, s - 2, s - 2, 0x0D2B0D)
        .setStrokeStyle(1, 0x1A3A2A).setDepth(1);
      // Wire line
      this.add.rectangle(tx, y + s / 2, s - 4, 6, 0xB87333).setDepth(1);
    }
    // Rotation arrow on middle tile
    const arrowX = startX + s * 1.5;
    const arrowY = y + s + 10;
    this.add.text(arrowX, arrowY, '↻ TAP', { fontSize: '12px', fill: COLORS.UI_ACCENT }).setOrigin(0.5).setDepth(1);

    // Bulb indicator
    this.add.circle(startX + s * 3 + 18, y + s / 2, 8, 0x665522).setDepth(1);
    this.add.text(startX + s * 3 + 18, y + s / 2, 'B', { fontSize: '10px', fill: '#998833', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1);
  }

  _drawFlowDiagram(cx, y, w) {
    const s = 28;
    const startX = cx - s * 2;
    // Arrow showing flow direction
    for (let i = 0; i < 4; i++) {
      const tx = startX + i * s + s / 2;
      const color = i < 2 ? 0xFFE44D : 0xB87333; // electrified vs not
      this.add.rectangle(tx, y + 15, s - 2, s - 2, 0x0D2B0D)
        .setStrokeStyle(1, 0x1A3A2A).setDepth(1);
      this.add.rectangle(tx, y + 15, s - 4, 6, color).setDepth(1);
    }
    // Glow dot
    this.add.circle(startX + s * 2 + s / 2, y + 15, 5, 0xFFFFAA).setDepth(1);
    // Arrow
    this.add.text(startX + s * 2, y + 35, '→→→', { fontSize: '12px', fill: COLORS.CURRENT_GLOW }).setOrigin(0.5).setDepth(1);
  }

  _drawDeadEndDiagram(cx, y, w) {
    const s = 28;
    const startX = cx - s;
    for (let i = 0; i < 2; i++) {
      const tx = startX + i * s + s / 2;
      this.add.rectangle(tx, y + 15, s - 2, s - 2, 0x0D2B0D)
        .setStrokeStyle(1, 0x1A3A2A).setDepth(1);
      this.add.rectangle(tx, y + 15, s - 4, 6, 0xFFE44D).setDepth(1);
    }
    // Explosion stars
    this.add.text(startX + s * 2 + 10, y + 15, '💥', { fontSize: '16px' }).setOrigin(0.5).setDepth(1);
  }
}
