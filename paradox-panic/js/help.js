// Paradox Panic - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    let y = 30;
    const lx = 20;
    const cw = w - 40;

    // Title
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'monospace', color: COLORS.paradoxHex, fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 40;

    this.add.text(w / 2, y, 'PARADOX PANIC', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    y += 20;
    this.add.text(w / 2, y, 'Judge statements as TRUE, FALSE, or PARADOX', {
      fontSize: '11px', fontFamily: 'monospace', color: '#AAAAAA', wordWrap: { width: cw }
    }).setOrigin(0.5, 0);
    y += 35;

    // --- SWIPE CARDS section ---
    this.add.text(w / 2, y, 'SWIPE CARDS', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 28;

    // Left card illustration
    const cardW = 100, cardH = 50;
    // FALSE card
    this.add.rectangle(w * 0.28, y + cardH/2, cardW, cardH, 0xFFFFFF, 1).setStrokeStyle(2, COLORS.falseHint);
    this.add.text(w * 0.28 - 55, y + cardH/2, '<<', {
      fontSize: '20px', fontFamily: 'monospace', color: COLORS.falseHex, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(w * 0.28, y + cardH + 8, 'FALSE', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.falseHex, fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // TRUE card
    this.add.rectangle(w * 0.72, y + cardH/2, cardW, cardH, 0xFFFFFF, 1).setStrokeStyle(2, COLORS.trueHint);
    this.add.text(w * 0.72 + 55, y + cardH/2, '>>', {
      fontSize: '20px', fontFamily: 'monospace', color: COLORS.trueHex, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(w * 0.72, y + cardH + 8, 'TRUE', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.trueHex, fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    y += cardH + 35;

    // --- PARADOX section ---
    this.add.text(w / 2, y, 'SPOT THE TRAP', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 25;

    // Mini paradox button
    this.add.rectangle(w / 2, y + 18, 120, 36, COLORS.paradox).setStrokeStyle(1, 0xA78BFA);
    this.add.text(w / 2, y + 18, 'PARADOX', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 50;

    this.add.text(w / 2, y, 'If neither TRUE nor FALSE fits,\ntap PARADOX!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#CCCCCC', align: 'center'
    }).setOrigin(0.5, 0);
    y += 32;
    this.add.text(w / 2, y, 'WARNING: Wrong PARADOX = 2 strikes!', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.strikeHex, fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 35;

    // --- STACK section ---
    this.add.text(w / 2, y, 'DON\'T LET CARDS PILE UP', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 24;

    // Stack illustration
    for (let i = 0; i < 5; i++) {
      const color = i === 4 ? COLORS.falseHint : 0x8892A4;
      const alpha = i === 4 ? 1 : 0.4;
      this.add.rectangle(w / 2, y + i * 14, 80, 12, 0xFFFFFF, alpha).setStrokeStyle(1, color);
    }
    this.add.text(w / 2 + 60, y + 28, '5 cards =\nGAME OVER', {
      fontSize: '10px', fontFamily: 'monospace', color: COLORS.falseHex
    });
    y += 85;

    // --- STRIKES section ---
    this.add.text(w / 2, y, '3 WRONG = GAME OVER', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 22;

    // Strike circles illustration
    for (let i = 0; i < 3; i++) {
      this.add.image(w / 2 - 24 + i * 24, y + 10, 'strikeFilled').setScale(1.5);
    }
    y += 40;

    // --- TIPS ---
    this.add.text(w / 2, y, 'TIPS', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.comboGoldHex, fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 22;
    const tips = [
      '- Answer fast for speed bonuses!',
      '- Combos multiply your score',
      '- Paradoxes are self-referential traps'
    ];
    tips.forEach(tip => {
      this.add.text(w / 2, y, tip, {
        fontSize: '11px', fontFamily: 'monospace', color: '#CCCCCC'
      }).setOrigin(0.5, 0);
      y += 18;
    });

    // --- GOT IT button ---
    const btnY = h - 50;
    const gotItBg = this.add.rectangle(w / 2, btnY, 200, 52, COLORS.trueHint)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    gotItBg.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });

    // Fullscreen fallback tap zone
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0)
      .setInteractive().setDepth(-1);
    fallback.on('pointerdown', () => gotItBg.emit('pointerdown'));
  }
}
