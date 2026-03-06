// help.js - HelpScene with illustrated controls and rules

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const W = CONFIG.GAME.width;
    const C = CONFIG.COLORS;
    let y = 10;

    // Background
    this.add.rectangle(W / 2, 300, W, 600, Phaser.Display.Color.HexStringToColor(C.BG).color).setAlpha(0.95);

    // Title
    this.add.text(W / 2, y += 30, 'HOW TO PLAY', { fontSize: '24px', fill: C.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, y += 28, 'Route flow. Survive the shifts.', { fontSize: '13px', fill: C.UI_ACCENT }).setOrigin(0.5);

    // --- Control Diagrams ---
    y += 30;
    this.add.text(W / 2, y, '--- CONTROLS ---', { fontSize: '16px', fill: C.UI_ACCENT, fontStyle: 'bold' }).setOrigin(0.5);

    // Diagram 1: Place pipe
    y += 30;
    this.drawCellDiagram(60, y, 'empty');
    this.add.text(100, y - 8, 'TAP', { fontSize: '18px', fill: C.STREAK, fontStyle: 'bold' });
    this.drawCellDiagram(150, y, 'straight');
    this.add.text(190, y - 2, 'Tap empty cell to place pipe', { fontSize: '12px', fill: C.UI_TEXT });

    // Diagram 2: Rotate pipe
    y += 50;
    this.drawCellDiagram(60, y, 'elbow');
    this.add.text(100, y - 8, 'TAP', { fontSize: '18px', fill: C.STREAK, fontStyle: 'bold' });
    this.drawRotateArrow(145, y);
    this.add.text(190, y - 2, 'Tap pipe to rotate 90deg', { fontSize: '12px', fill: C.UI_TEXT });

    // Diagram 3: Remove pipe
    y += 50;
    this.drawCellDiagram(60, y, 'tjunction');
    this.add.text(100, y - 8, 'HOLD', { fontSize: '18px', fill: C.DANGER, fontStyle: 'bold' });
    this.add.text(155, y - 8, 'X', { fontSize: '22px', fill: C.DANGER, fontStyle: 'bold' });
    this.add.text(190, y - 2, 'Hold 400ms to remove pipe', { fontSize: '12px', fill: C.UI_TEXT });

    // --- Rules ---
    y += 45;
    this.add.text(W / 2, y, '--- RULES ---', { fontSize: '16px', fill: C.UI_ACCENT, fontStyle: 'bold' }).setOrigin(0.5);
    const rules = [
      'Route flow from GREEN sources to YELLOW drains',
      'Every few seconds, a RULE SHIFT changes flow!',
      'Blocked flow builds PRESSURE (pipe turns red)',
      'Pressure at 100% = OVERFLOW (pipe explodes)',
      '3 overflows = GAME OVER'
    ];
    rules.forEach(r => {
      y += 22;
      this.add.text(30, y, r, { fontSize: '12px', fill: C.UI_TEXT, wordWrap: { width: 340 } });
    });

    // --- Tips ---
    y += 35;
    this.add.text(W / 2, y, '--- TIPS ---', { fontSize: '16px', fill: C.STREAK, fontStyle: 'bold' }).setOrigin(0.5);
    const tips = [
      'Build T-junctions & crosses - they survive more rule shifts',
      'Watch the rule preview card at the bottom to prepare',
      'Remove dangerous pipes before a rule shift hits'
    ];
    tips.forEach(t => {
      y += 22;
      this.add.text(30, y, t, { fontSize: '11px', fill: C.UI_ACCENT, wordWrap: { width: 340 } });
    });

    // Got it button
    y += 40;
    const btn = this.add.rectangle(W / 2, y, 160, 44, Phaser.Display.Color.HexStringToColor(C.UI_ACCENT).color)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(W / 2, y, 'Got it!', { fontSize: '20px', fill: '#0A1628', fontStyle: 'bold' }).setOrigin(0.5);
    btn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }

  drawCellDiagram(x, y, type) {
    const size = 36;
    this.add.rectangle(x, y, size, size, Phaser.Display.Color.HexStringToColor(CONFIG.COLORS.GRID).color).setStrokeStyle(1, 0x4FC3F7);
    if (type !== 'empty' && this.textures.exists(type)) {
      this.add.image(x, y, type).setDisplaySize(size - 4, size - 4);
    }
  }

  drawRotateArrow(x, y) {
    const g = this.add.graphics();
    g.lineStyle(2, 0xFFD700);
    g.beginPath();
    g.arc(x, y, 12, -1.2, 1.2, false);
    g.strokePath();
    // Arrowhead
    g.fillStyle(0xFFD700);
    g.fillTriangle(x + 10, y + 10, x + 16, y + 6, x + 8, y + 4);
  }
}
