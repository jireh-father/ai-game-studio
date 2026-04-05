// Set Surgeon - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    const cx = CONFIG.GAME_WIDTH / 2;
    const W = CONFIG.GAME_WIDTH;
    this.scrollY = 0;
    this.contentHeight = 900;

    // Scrollable container
    this.container = this.add.container(0, 0);

    let y = 30;

    // Title
    this.container.add(this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 50;

    // Visual 1: Drag diagram
    this.container.add(this.drawDragDiagram(cx, y));
    y += 170;

    this.container.add(this.add.text(cx, y, 'Drag each element to the\nregion where it belongs.', {
      fontSize: '13px', fontFamily: 'monospace', fill: '#636E72', align: 'center'
    }).setOrigin(0.5));
    y += 50;

    // Visual 2: Feedback
    const feedbackBg = this.add.rectangle(cx, y + 25, W - 40, 60, 0xF8FAFC).setStrokeStyle(1, 0xDFE6E9);
    this.container.add(feedbackBg);
    this.container.add(this.add.circle(cx - 80, y + 15, 10, 0x2ECC71));
    this.container.add(this.add.text(cx - 60, y + 15, 'CORRECT!', {
      fontSize: '13px', fontFamily: 'monospace', fill: '#2ECC71', fontStyle: 'bold'
    }).setOrigin(0, 0.5));
    this.container.add(this.add.circle(cx - 80, y + 38, 10, 0xE74C3C));
    this.container.add(this.add.text(cx - 60, y + 38, 'Try again', {
      fontSize: '13px', fontFamily: 'monospace', fill: '#E74C3C', fontStyle: 'bold'
    }).setOrigin(0, 0.5));
    y += 80;

    // Visual 3: Timer
    this.container.add(this.add.rectangle(cx, y, W - 80, 10, 0xF39C12).setOrigin(0.5));
    this.container.add(this.add.text(cx + (W - 80) / 2 + 10, y, '6s', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0, 0.5));
    y += 15;
    this.container.add(this.add.rectangle(cx - 50, y, (W - 80) * 0.3, 10, 0xE74C3C).setOrigin(0.5));
    this.container.add(this.add.text(cx - 50 + (W - 80) * 0.15 + 10, y, '!', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#E74C3C', fontStyle: 'bold'
    }).setOrigin(0, 0.5));
    y += 25;
    this.container.add(this.add.text(cx, y, 'Place before the timer runs out!', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5));
    y += 40;

    // Scoring section
    this.container.add(this.add.text(20, y, 'SCORING', {
      fontSize: '15px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }));
    y += 25;
    const scoring = [
      'First-try correct = 100 pts',
      'Speed bonus = +30 if placed in <2s',
      'Streak x1.5 after 3 in a row'
    ];
    scoring.forEach(line => {
      this.container.add(this.add.text(30, y, '- ' + line, {
        fontSize: '12px', fontFamily: 'monospace', fill: '#636E72'
      }));
      y += 20;
    });
    y += 10;

    // Lives section
    this.container.add(this.add.text(20, y, 'LIVES', {
      fontSize: '15px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }));
    y += 25;
    const lives = [
      '3 lives (surgical cross icons)',
      'Lose a life only when timer expires',
      'Wrong guesses are FREE!'
    ];
    lives.forEach(line => {
      this.container.add(this.add.text(30, y, '- ' + line, {
        fontSize: '12px', fontFamily: 'monospace', fill: '#636E72'
      }));
      y += 20;
    });
    y += 10;

    // Deduction section
    this.container.add(this.add.text(20, y, 'DEDUCTION', {
      fontSize: '15px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }));
    y += 25;
    const deduction = [
      'Rules are HIDDEN at round start',
      'Use feedback to figure out the rules',
      'Rules revealed at round end'
    ];
    deduction.forEach(line => {
      this.container.add(this.add.text(30, y, '- ' + line, {
        fontSize: '12px', fontFamily: 'monospace', fill: '#636E72'
      }));
      y += 20;
    });
    y += 10;

    // Tips
    this.container.add(this.add.text(20, y, 'TIPS', {
      fontSize: '15px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }));
    y += 25;
    const tips = [
      '1. Study rules at round end',
      '2. Wrong guesses help narrow down',
      '3. Center region (A+B+C) is rare'
    ];
    tips.forEach(line => {
      this.container.add(this.add.text(30, y, line, {
        fontSize: '12px', fontFamily: 'monospace', fill: '#636E72'
      }));
      y += 20;
    });

    this.contentHeight = y + 80;

    // GOT IT button - fixed at bottom
    const btnY = CONFIG.GAME_HEIGHT - 60;
    const btnBg = this.add.rectangle(cx, btnY, W - 40, 50, 0x00B894).setInteractive({ useHandCursor: true }).setDepth(100);
    const btnTxt = this.add.text(cx, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);
    btnTxt.disableInteractive();

    // Full-screen fallback tap zone behind button
    const fallback = this.add.rectangle(cx, btnY, W, 80, 0x000000, 0).setInteractive().setDepth(99);

    const doReturn = () => {
      this.scene.stop('HelpScene');
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    };
    btnBg.on('pointerdown', doReturn);
    fallback.on('pointerdown', doReturn);

    // Scroll input
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const dy = pointer.y - pointer.prevPosition.y;
        this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -(this.contentHeight - CONFIG.GAME_HEIGHT + 80), 0);
        this.container.y = this.scrollY;
      }
    });
  }

  drawDragDiagram(cx, y) {
    const container = this.add.container(0, 0);
    const bg = this.add.rectangle(cx, y + 70, CONFIG.GAME_WIDTH - 40, 150, 0xF8FAFC).setStrokeStyle(1, 0xDFE6E9);
    container.add(bg);

    // Element at top
    const el = this.add.rectangle(cx, y + 15, 36, 36, 0xFFFFFF).setStrokeStyle(2, 0x2D3436);
    container.add(el);
    container.add(this.add.text(cx, y + 15, '42', {
      fontSize: '14px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5));

    // Arrow down
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0x636E72);
    gfx.moveTo(cx, y + 36);
    gfx.lineTo(cx, y + 55);
    gfx.moveTo(cx - 5, y + 50);
    gfx.lineTo(cx, y + 55);
    gfx.lineTo(cx + 5, y + 50);
    gfx.strokePath();
    container.add(gfx);

    // Mini Venn
    const vGfx = this.add.graphics();
    vGfx.fillStyle(0xFF6B6B, 0.15); vGfx.fillCircle(cx - 25, y + 85, 35);
    vGfx.fillStyle(0x4ECDC4, 0.15); vGfx.fillCircle(cx + 25, y + 85, 35);
    vGfx.fillStyle(0xFFE66D, 0.15); vGfx.fillCircle(cx, y + 115, 35);
    vGfx.lineStyle(2, 0xFF6B6B); vGfx.strokeCircle(cx - 25, y + 85, 35);
    vGfx.lineStyle(2, 0x4ECDC4); vGfx.strokeCircle(cx + 25, y + 85, 35);
    vGfx.lineStyle(2, 0xFFE66D); vGfx.strokeCircle(cx, y + 115, 35);
    container.add(vGfx);

    // Labels
    container.add(this.add.text(cx - 50, y + 65, 'A', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#FF6B6B', fontStyle: 'bold'
    }).setOrigin(0.5));
    container.add(this.add.text(cx + 50, y + 65, 'B', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#4ECDC4', fontStyle: 'bold'
    }).setOrigin(0.5));
    container.add(this.add.text(cx, y + 145, 'C', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#FFE66D', fontStyle: 'bold'
    }).setOrigin(0.5));

    // Drag arrow from element to region
    const dGfx = this.add.graphics();
    dGfx.lineStyle(2, 0x00B894, 0.8);
    dGfx.beginPath();
    dGfx.moveTo(cx + 20, y + 30);
    dGfx.lineTo(cx + 60, y + 80);
    dGfx.strokePath();
    dGfx.moveTo(cx + 55, y + 73);
    dGfx.lineTo(cx + 60, y + 80);
    dGfx.lineTo(cx + 53, y + 80);
    dGfx.strokePath();
    container.add(dGfx);

    return container;
  }
}
