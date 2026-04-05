class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0D1B2A, 0.95).setDepth(0);

    let y = 30;
    const cx = width / 2;
    const left = 24;

    this.add.text(cx, y, 'HOW TO PLAY', { fontFamily: "'Courier New', monospace", fontSize: '22px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5);
    y += 40;

    this.add.text(cx, y, 'Build a number BIGGER\nthan the TARGET', { fontFamily: "'Courier New', monospace", fontSize: '15px', color: '#E8F4FD', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    y += 50;

    // Target illustration
    this.add.text(cx, y, 'TARGET', { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#8BAFC8' }).setOrigin(0.5);
    y += 18;
    this.add.text(cx, y, '7  4  2  3', { fontFamily: "'Courier New', monospace", fontSize: '20px', fontStyle: 'bold', color: '#8BAFC8' }).setOrigin(0.5);
    y += 35;

    // Controls
    this.add.text(cx, y, 'Digits fall one at a time.\nTAP a slot to place it.', { fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#E8F4FD', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    y += 45;

    // Falling digit illustration
    const digitX = cx;
    this.add.rectangle(digitX, y, 44, 44, 0x1C2D40).setStrokeStyle(2, 0x2E5C8A);
    this.add.text(digitX, y, '9', { fontFamily: "'Courier New', monospace", fontSize: '26px', fontStyle: 'bold', color: '#FFD700' }).setOrigin(0.5);

    // Arrow
    const arrowY = y + 30;
    const g = this.add.graphics();
    g.lineStyle(2, 0x00D4FF);
    g.beginPath(); g.moveTo(digitX, arrowY); g.lineTo(digitX, arrowY + 20); g.strokePath();
    g.fillStyle(0x00D4FF);
    g.fillTriangle(digitX - 6, arrowY + 18, digitX + 6, arrowY + 18, digitX, arrowY + 28);
    y += 68;

    // Slot row illustration
    const slotW = 40, gap = 6;
    const totalW = 4 * slotW + 3 * gap;
    let sx = cx - totalW / 2 + slotW / 2;
    for (let i = 0; i < 4; i++) {
      this.add.rectangle(sx + i * (slotW + gap), y, slotW, 50, 0x1C2D40).setStrokeStyle(2, 0x2E5C8A);
    }
    this.add.text(cx, y + 35, 'tap any empty slot', { fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#00D4FF' }).setOrigin(0.5);
    y += 55;

    // Strategy tip
    this.add.text(cx, y, 'HIGH digits go LEFT\nLOW digits go RIGHT', { fontFamily: "'Courier New', monospace", fontSize: '13px', fontStyle: 'bold', color: '#FFD700', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    y += 42;

    // Scoring
    this.add.text(cx, y, '-- SCORING --', { fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#39FF14' }).setOrigin(0.5);
    y += 20;
    const scoreLines = ['Beat by 50%+  = 800pts', 'Beat by 25%+  = 400pts', 'No auto-fills = +200'];
    scoreLines.forEach(line => {
      this.add.text(cx, y, line, { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#E8F4FD' }).setOrigin(0.5);
      y += 16;
    });
    y += 10;

    // Poison
    this.add.text(left, y, 'RED digits are POISON!', { fontFamily: "'Courier New', monospace", fontSize: '13px', fontStyle: 'bold', color: '#FF3B3B' });
    y += 18;
    this.add.text(left, y, 'They count 2 LESS when placed.', { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#E8F4FD' });
    y += 24;

    // Timer warning
    this.add.text(left, y, 'ACT FAST! Digits auto-fill if', { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#E8F4FD' });
    y += 15;
    this.add.text(left, y, 'you wait too long.', { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#E8F4FD' });
    y += 24;

    // Tips
    this.add.text(left, y, 'TIPS:', { fontFamily: "'Courier New', monospace", fontSize: '12px', fontStyle: 'bold', color: '#00D4FF' });
    y += 18;
    const tips = ['1. Put 8s and 9s leftmost', '2. A 5 in slot 1 beats', '   a 9 in slot 4', '3. Let poison auto-fill'];
    tips.forEach(t => {
      this.add.text(left, y, t, { fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#E8F4FD' });
      y += 15;
    });

    // Got it button
    const btnY = height - 50;
    const btn = this.add.rectangle(cx, btnY, 200, 48, 0x1C2D40).setStrokeStyle(2, 0x00D4FF).setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'GOT IT!', { fontFamily: "'Courier New', monospace", fontSize: '18px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      SoundFX.uiClick();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    });

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(cx, btnY, width, 80, 0x000000, 0).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => btn.emit('pointerdown'));
  }
}
