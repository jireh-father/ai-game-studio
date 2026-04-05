// Wrong Map - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    const W = CONFIG.GAME_WIDTH;
    let y = 30;

    // Title
    this.add.text(W / 2, y, 'HOW TO PLAY', {
      fontSize: '30px', fontStyle: 'bold', color: CONFIG.HEX.PLAYER
    }).setOrigin(0.5);
    y += 50;

    // Section 1: The Lie
    this.add.text(W / 2, y, 'THE LIE', {
      fontSize: '18px', fontStyle: 'bold', color: CONFIG.HEX.DANGER
    }).setOrigin(0.5);
    y += 25;
    this.add.text(W / 2, y, 'Every room has ONE lie.\nThe minimap shows one tile wrong.', {
      fontSize: '13px', color: CONFIG.HEX.HUD_TEXT, align: 'center', wordWrap: { width: 300 }
    }).setOrigin(0.5, 0);
    y += 45;

    // Diagram: minimap vs reality
    this.drawLieDiagram(W / 2, y);
    y += 80;

    this.add.text(W / 2, y, 'Trust reality, not the map!', {
      fontSize: '12px', fontStyle: 'italic', color: CONFIG.HEX.GOLD
    }).setOrigin(0.5);
    y += 30;

    // Section 2: The Ghost
    this.add.text(W / 2, y, 'THE GHOST', {
      fontSize: '18px', fontStyle: 'bold', color: CONFIG.HEX.GHOST
    }).setOrigin(0.5);
    y += 25;
    this.add.text(W / 2, y, 'A ghost spawns after a few seconds\nand chases you. It knows the REAL map.\nMove fast!', {
      fontSize: '13px', color: CONFIG.HEX.HUD_TEXT, align: 'center', wordWrap: { width: 300 }
    }).setOrigin(0.5, 0);
    y += 55;

    // Ghost diagram
    this.drawGhostDiagram(W / 2, y);
    y += 50;

    // Section 3: Controls
    this.add.text(W / 2, y, 'CONTROLS', {
      fontSize: '18px', fontStyle: 'bold', color: CONFIG.HEX.PLAYER
    }).setOrigin(0.5);
    y += 25;
    this.drawDPadDiagram(W / 2, y);
    y += 70;

    this.add.text(W / 2, y, 'Tap once = move one tile', {
      fontSize: '12px', color: CONFIG.HEX.HUD_TEXT
    }).setOrigin(0.5);
    y += 30;

    // Section 4: Tips
    this.add.text(W / 2, y, 'TIPS', {
      fontSize: '16px', fontStyle: 'bold', color: CONFIG.HEX.GOLD
    }).setOrigin(0.5);
    y += 22;

    const tips = [
      '1. Count the gaps. Compare to minimap.',
      '2. Use corners to dodge the ghost.',
      '3. If the ghost is close, run for the exit!'
    ];
    tips.forEach(tip => {
      this.add.text(W / 2, y, tip, {
        fontSize: '12px', color: CONFIG.HEX.HUD_TEXT
      }).setOrigin(0.5, 0);
      y += 20;
    });
    y += 15;

    // Got it! button — fixed at bottom
    const btnY = Math.max(y, CONFIG.GAME_HEIGHT - 60);
    const gotBtn = this.add.rectangle(W / 2, btnY, 200, 50, CONFIG.COLORS.EXIT).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, btnY, 'GOT IT!', {
      fontSize: '20px', fontStyle: 'bold', color: CONFIG.HEX.BG
    }).setOrigin(0.5).setDepth(11);

    gotBtn.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });

    // Full-screen fallback tap zone behind everything
    const fallback = this.add.rectangle(W / 2, CONFIG.GAME_HEIGHT - 30, W, 60, 0x000000, 0).setInteractive();
    fallback.on('pointerdown', () => gotBtn.emit('pointerdown'));
  }

  drawLieDiagram(cx, y) {
    const gfx = this.add.graphics();
    const ts = 20, gap = 3, cols = 3;
    const labelW = 80;

    // MINIMAP side
    const mx = cx - labelW - 10;
    this.add.text(mx, y - 15, 'MINIMAP', { fontSize: '10px', color: CONFIG.HEX.PLAYER }).setOrigin(0.5);
    const mapGrid = [[1, 0, 1], [0, 0, 0], [1, 1, 0]];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const px = mx - (cols * (ts + gap)) / 2 + c * (ts + gap);
        const py = y + r * (ts + gap);
        gfx.fillStyle(mapGrid[r][c] === 1 ? CONFIG.COLORS.MINIMAP_WALL : CONFIG.COLORS.MINIMAP_FLOOR);
        gfx.fillRect(px, py, ts, ts);
      }
    }

    // REALITY side
    const rx = cx + labelW + 10;
    this.add.text(rx, y - 15, 'REALITY', { fontSize: '10px', color: CONFIG.HEX.EXIT }).setOrigin(0.5);
    const realGrid = [[1, 0, 1], [0, 0, 0], [1, 1, 1]]; // bottom-right is actually wall
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const px = rx - (cols * (ts + gap)) / 2 + c * (ts + gap);
        const py = y + r * (ts + gap);
        gfx.fillStyle(realGrid[r][c] === 1 ? CONFIG.COLORS.MINIMAP_WALL : CONFIG.COLORS.MINIMAP_FLOOR);
        gfx.fillRect(px, py, ts, ts);
        // Highlight lie tile
        if (r === 2 && c === 2) {
          gfx.lineStyle(2, CONFIG.COLORS.DANGER);
          gfx.strokeRect(px, py, ts, ts);
        }
      }
    }

    // Arrow between
    this.add.text(cx, y + 25, 'vs', { fontSize: '14px', color: CONFIG.HEX.DANGER }).setOrigin(0.5);
  }

  drawGhostDiagram(cx, y) {
    // Ghost icon → arrow → player icon
    if (this.textures.exists('ghost')) {
      this.add.image(cx - 50, y, 'ghost').setScale(0.8);
    }
    this.add.text(cx, y, '\u2192 5s \u2192', {
      fontSize: '16px', fontStyle: 'bold', color: CONFIG.HEX.DANGER
    }).setOrigin(0.5);
    if (this.textures.exists('player')) {
      this.add.image(cx + 50, y, 'player').setScale(0.8);
    }
  }

  drawDPadDiagram(cx, y) {
    const sz = 30, gap = 4;
    const gfx = this.add.graphics();
    const dirs = [
      { label: '\u25B2', ox: 0, oy: -(sz + gap) },
      { label: '\u25C0', ox: -(sz + gap), oy: 0 },
      { label: '\u25BC', ox: 0, oy: (sz + gap) },
      { label: '\u25B6', ox: (sz + gap), oy: 0 }
    ];
    dirs.forEach(d => {
      gfx.fillStyle(0x1E3A5F);
      gfx.fillRoundedRect(cx + d.ox - sz / 2, y + d.oy - sz / 2, sz, sz, 4);
      this.add.text(cx + d.ox, y + d.oy, d.label, {
        fontSize: '16px', color: CONFIG.HEX.PLAYER
      }).setOrigin(0.5);
    });
  }
}
