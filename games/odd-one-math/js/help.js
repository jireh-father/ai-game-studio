class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = GAME_W, h = GAME_H;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0F172A).setDepth(0);
    let y = 40;

    this.add.text(w / 2, y, 'HOW TO PLAY', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    y += 40;

    this.add.text(w / 2, y, 'Odd One Math', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex }).setOrigin(0.5);
    y += 22;
    this.add.text(w / 2, y, 'Find the number that doesn\'t belong!', { fontSize: '13px', fontFamily: 'Arial', color: '#94A3B8' }).setOrigin(0.5);
    y += 36;

    // Card diagram
    const cx = w / 2, cardS = 52, gap = 6;
    const positions = [
      [cx - cardS/2 - gap, y], [cx + cardS/2 + gap, y],
      [cx - cardS/2 - gap, y + cardS + gap*2], [cx + cardS/2 + gap, y + cardS + gap*2]
    ];
    const labels = ['2', '7', '9', '11'];
    const colors = [0x22C55E, 0x22C55E, 0xEF4444, 0x22C55E];
    positions.forEach(([px, py], i) => {
      this.add.rectangle(px, py, cardS, cardS, colors[i], 0.15).setStrokeStyle(2, colors[i]);
      this.add.text(px, py, labels[i], { fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    });
    // Arrow to impostor
    this.add.text(positions[2][0] + cardS/2 + 14, positions[2][1], '\u2190 TAP THIS', { fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EF4444' }).setOrigin(0, 0.5);
    this.add.text(cx, positions[3][1] + cardS/2 + 14, 'Primes: 2, 7, 11 belong. 9 does NOT.', { fontSize: '11px', fontFamily: 'Arial', color: '#CBD5E1' }).setOrigin(0.5);
    y = positions[3][1] + cardS/2 + 40;

    // Divider
    this.add.rectangle(cx, y, w - 60, 1, 0x334155); y += 20;

    // Timer
    this.add.rectangle(cx, y, 200, 14, 0x22C55E, 0.3).setStrokeStyle(1, 0x22C55E);
    this.add.rectangle(cx - 30, y, 140, 10, 0x22C55E);
    this.add.text(cx + 120, y, '3.2s', { fontSize: '11px', fontFamily: 'monospace', color: '#22C55E' }).setOrigin(0.5);
    y += 12;
    this.add.text(cx, y + 10, 'You have 5 seconds per question.\nFaster answer = more points!', { fontSize: '12px', fontFamily: 'Arial', color: '#CBD5E1', align: 'center' }).setOrigin(0.5);
    y += 44;

    // Divider
    this.add.rectangle(cx, y, w - 60, 1, 0x334155); y += 20;

    // Strikes
    [-20, 0, 20].forEach((ox, i) => {
      const col = i < 2 ? 0xEF4444 : 0x475569;
      this.add.circle(cx + ox, y, 8, col);
    });
    y += 18;
    this.add.text(cx, y, '3 strikes and you\'re out.\nWrong answer OR timeout = 1 strike.', { fontSize: '12px', fontFamily: 'Arial', color: '#CBD5E1', align: 'center' }).setOrigin(0.5);
    y += 44;

    // Divider
    this.add.rectangle(cx, y, w - 60, 1, 0x334155); y += 18;

    // Scoring
    this.add.text(30, y, 'SCORING', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex });
    y += 20;
    const scoring = ['Correct answer:    100 pts', 'Time bonus:    +10 per 0.5s left', 'Streak bonus:    +50 x streak'];
    scoring.forEach(s => { this.add.text(30, y, s, { fontSize: '11px', fontFamily: 'monospace', color: '#CBD5E1' }); y += 16; });
    y += 12;

    // Tips
    this.add.text(30, y, 'TIPS', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex });
    y += 20;
    const tips = [
      'The rule is ALWAYS shown after each answer.',
      'Wrong answers teach you new categories!',
      'Impostor numbers are NEAR MISSES.',
      'Streak multipliers give massive bonus points.'
    ];
    tips.forEach(t => { this.add.text(36, y, '\u2022 ' + t, { fontSize: '11px', fontFamily: 'Arial', color: '#CBD5E1', wordWrap: { width: w - 72 } }); y += 28; });

    // GOT IT button
    const btnY = Math.max(y + 16, h - 70);
    const btn = this.add.rectangle(cx, btnY, 260, 50, COLOR.accent).setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'GOT IT!', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);

    // Full-screen fallback tap zone behind everything
    const bgTap = this.add.rectangle(cx, h - 35, w, 70, 0x000000, 0.001).setInteractive().setDepth(-1);

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
    btn.on('pointerdown', dismiss);
    bgTap.on('pointerdown', dismiss);
  }
}
