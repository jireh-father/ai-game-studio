// Torque Tower - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1F2E, 0.95).setScrollFactor(0);

    const titleStyle = { fontSize: '22px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold' };
    const headStyle = { fontSize: '14px', fontFamily: 'Courier New', fill: COLORS.accent, fontStyle: 'bold' };
    const textStyle = { fontSize: '12px', fontFamily: 'Courier New', fill: COLORS.hudText, wordWrap: { width: w - 40 } };
    const tipStyle = { fontSize: '11px', fontFamily: 'Courier New', fill: '#AABBCC', wordWrap: { width: w - 50 } };

    let y = 40;
    this.add.text(w / 2, y, 'HOW TO PLAY', titleStyle).setOrigin(0.5);
    y += 35;
    this.add.text(w / 2, y, 'Tap to spin falling blocks flat!', { fontSize: '11px', fontFamily: 'Courier New', fill: '#AABBCC' }).setOrigin(0.5);

    // Control diagram
    y += 35;
    this.add.text(w / 2, y, 'CONTROLS', headStyle).setOrigin(0.5);
    y += 25;

    // Draw tap zone diagram
    const boxW = 130, boxH = 90, gap = 10;
    const lx = w / 2 - boxW / 2 - gap / 2, rx = w / 2 + boxW / 2 + gap / 2;

    // Left zone
    this.add.rectangle(lx, y + boxH / 2, boxW, boxH, 0x4A90D9, 0.2).setStrokeStyle(2, 0x4A90D9);
    this.add.text(lx, y + 15, 'TAP LEFT', { fontSize: '12px', fontFamily: 'Courier New', fill: '#4A90D9', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(lx, y + 38, '<< CCW', { fontSize: '16px', fontFamily: 'Courier New', fill: '#4A90D9' }).setOrigin(0.5);
    this.add.text(lx, y + 60, 'Spin block\nleft', { fontSize: '10px', fontFamily: 'Courier New', fill: '#8899AA', align: 'center' }).setOrigin(0.5);

    // Right zone
    this.add.rectangle(rx, y + boxH / 2, boxW, boxH, 0x50E3C2, 0.2).setStrokeStyle(2, 0x50E3C2);
    this.add.text(rx, y + 15, 'TAP RIGHT', { fontSize: '12px', fontFamily: 'Courier New', fill: '#50E3C2', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(rx, y + 38, 'CW >>', { fontSize: '16px', fontFamily: 'Courier New', fill: '#50E3C2' }).setOrigin(0.5);
    this.add.text(rx, y + 60, 'Spin block\nright', { fontSize: '10px', fontFamily: 'Courier New', fill: '#8899AA', align: 'center' }).setOrigin(0.5);

    // Center divider
    this.add.line(w / 2, y + boxH / 2, 0, -boxH / 2, 0, boxH / 2, 0x555555, 0.5).setLineWidth(1);

    // Block illustration
    const blkY = y + boxH / 2;
    const blk = this.add.image(w / 2, blkY, 'standard');
    this.tweens.add({ targets: blk, angle: 15, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    y += boxH + 20;

    // Rules
    this.add.text(w / 2, y, 'SCORING', headStyle).setOrigin(0.5);
    y += 22;
    const rules = [
      '  FLAT (+-5deg)   = 100 pts, PERFECT!',
      '  ANGLED (+-15deg) = 50 pts, good',
      '  TILTED (>15deg)  = 10 pts or less',
      '',
      '  Consecutive perfects build COMBO x2!',
      '  Tower tilts too far = COLLAPSE!'
    ];
    this.add.text(20, y, rules.join('\n'), textStyle);
    y += 95;

    // Block types
    this.add.text(w / 2, y, 'BLOCK TYPES', headStyle).setOrigin(0.5);
    y += 22;
    const types = [
      { key: 'standard', label: 'Blue - Standard', desc: 'Normal weight & response' },
      { key: 'narrow', label: 'Amber - Narrow', desc: 'Small footprint, tricky!' },
      { key: 'heavy', label: 'Gray - Heavy', desc: 'Resists your taps' },
      { key: 'light', label: 'Green - Light', desc: 'Overcorrects easily' }
    ];
    types.forEach((t, i) => {
      const ty = y + i * 28;
      this.add.image(35, ty + 4, t.key).setScale(0.8);
      this.add.text(70, ty, t.label, { fontSize: '11px', fontFamily: 'Courier New', fill: BLOCK_TYPES[t.key].color, fontStyle: 'bold' });
      this.add.text(70, ty + 13, t.desc, { fontSize: '9px', fontFamily: 'Courier New', fill: '#8899AA' });
    });
    y += 120;

    // Tips
    this.add.text(w / 2, y, 'TIPS', headStyle).setOrigin(0.5);
    y += 20;
    const tips = [
      '* Watch the spin direction FIRST, then tap',
      '* Short taps for fine control',
      '* Hold for sustained correction on heavy blocks',
    ];
    this.add.text(25, y, tips.join('\n'), tipStyle);

    // Got it button at fixed bottom position
    const btnY = h - 55;
    const btn = this.add.rectangle(w / 2, btnY, 200, 44, 0x00D4FF).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'GOT IT!', { fontSize: '18px', fontFamily: 'Courier New', fill: '#0D1117', fontStyle: 'bold' }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
      }
    });

    // Fullscreen fallback tap zone
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
      }
    });
  }
}
