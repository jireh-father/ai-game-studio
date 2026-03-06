// help.js — HelpScene: illustrated how-to-play

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
    // Dark overlay background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E, 0.95).setDepth(0);

    let y = 40;
    // Title
    this.add.text(W / 2, y, 'HOW TO PLAY', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    y += 55;

    // Diagram 1: Tap to place
    this._drawHexDiagram(W / 2 - 50, y, '#FFFFFF', '');
    this._drawHexDiagram(W / 2 + 50, y, '#FFFFFF', '4');
    this.add.text(W / 2, y - 2, '>', { fontSize: '28px', color: COLORS.accent }).setOrigin(0.5, 0.3);
    // Finger icon
    this.add.circle(W / 2 + 50, y + 20, 8, 0x00E5FF, 0.6);
    y += 40;
    this.add.text(W / 2, y, 'Tap an empty hex to place your tile', {
      fontSize: '14px', color: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
    y += 40;

    // Diagram 2: Sum to 10
    const cols = [COLORS.gold, COLORS.gold, COLORS.gold];
    const nums = ['4', '3', '3'];
    for (let i = 0; i < 3; i++) {
      this._drawHexDiagram(W / 2 - 50 + i * 50, y, cols[i], nums[i]);
    }
    this.add.text(W / 2 + 100, y, '= 10!', {
      fontSize: '18px', fontStyle: 'bold', color: COLORS.gold, fontFamily: 'Arial'
    }).setOrigin(0, 0.3);
    y += 40;
    this.add.text(W / 2, y, 'Adjacent hexes summing to 10 collapse!', {
      fontSize: '14px', color: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
    y += 40;

    // Diagram 3: Gravity arrows
    this._drawHexDiagram(W / 2, y, '#FFFFFF', '');
    for (let a = 0; a < 6; a++) {
      const angle = (a * 60 + 30) * Math.PI / 180;
      const sx = W / 2 + Math.cos(angle) * 40;
      const sy = y + Math.sin(angle) * 40;
      const ex = W / 2 + Math.cos(angle) * 20;
      const ey = y + Math.sin(angle) * 20;
      const line = this.add.graphics();
      line.lineStyle(2, 0x00E5FF, 0.7);
      line.beginPath(); line.moveTo(sx, sy); line.lineTo(ex, ey); line.strokePath();
    }
    y += 40;
    this.add.text(W / 2, y, 'Tiles slide inward — cascading new matches', {
      fontSize: '14px', color: '#AAAACC', fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
    y += 50;

    // Rules
    this.add.text(W / 2, y, 'RULES', {
      fontSize: '20px', fontStyle: 'bold', color: COLORS.accent, fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
    y += 30;
    const rules = [
      'Fill the board = Game Over',
      'Chain collapses for score multipliers (x2, x3...)',
      '30s idle = auto-fill starts'
    ];
    rules.forEach(rule => {
      this.add.text(W / 2, y, '- ' + rule, {
        fontSize: '13px', color: '#CCCCDD', fontFamily: 'Arial', wordWrap: { width: W - 60 }
      }).setOrigin(0.5, 0);
      y += 24;
    });
    y += 15;

    // Tips
    this.add.text(W / 2, y, 'TIPS', {
      fontSize: '20px', fontStyle: 'bold', color: COLORS.gold, fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
    y += 30;
    const tips = [
      'Place low numbers (1-2) next to high (5-6) for easy 10s',
      'Plan for cascades — leave gaps near the center',
      'Bomb hexes clear an entire ring — save for emergencies'
    ];
    tips.forEach(tip => {
      this.add.text(W / 2, y, '* ' + tip, {
        fontSize: '13px', color: '#CCCCDD', fontFamily: 'Arial', wordWrap: { width: W - 60 }
      }).setOrigin(0.5, 0);
      y += 28;
    });
    y += 25;

    // Got it button
    const btnY = Math.min(y, H - 50);
    const btn = this.add.rectangle(W / 2, btnY, 180, 50, 0x00E5FF).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontStyle: 'bold', color: '#1A1A2E', fontFamily: 'Arial'
    }).setOrigin(0.5);
    btn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }

  _drawHexDiagram(x, y, color, num) {
    const g = this.add.graphics();
    const r = 16;
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(CONFIG.HEX_STROKE).color);
    g.fillStyle(color === COLORS.gold ? 0xFFD700 : 0xFFFFFF, 0.9);
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (60 * i - 30) * Math.PI / 180;
      pts.push({ x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) });
    }
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 6; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.fillPath(); g.strokePath();
    if (num) {
      this.add.text(x, y, num, {
        fontSize: '14px', fontStyle: 'bold', color: NUMBER_COLORS[parseInt(num)] || '#000',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }
  }
}
