// help.js — HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;

    // White background
    this.add.rectangle(w/2, h/2, w, h, 0xFFFFFF, 1);

    let y = 40;

    // Title
    this.add.text(w/2, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT
    }).setOrigin(0.5);
    y += 40;

    // Subtitle
    this.add.text(w/2, y, 'Pop bubble wrap before the deadline!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);
    y += 35;

    // Phone/control diagram using Phaser graphics
    const gfx = this.add.graphics();

    // Phone outline
    const px = w/2 - 55, py = y, pw = 110, ph = 160;
    gfx.lineStyle(2, 0x212121);
    gfx.strokeRoundedRect(px, py, pw, ph, 10);

    // Deadline bar inside phone
    gfx.fillStyle(0xE53935, 1);
    gfx.fillRect(px + 8, py + 25, pw - 16, 4);

    // Bubble rows inside phone
    const colors = [0xEF5350, 0x1E88E5, 0xFDD835, 0xEF5350, 0x1E88E5, 0x90A4AE, 0xFDD835];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const bx = px + 14 + c * 20;
        const by = py + 50 + r * 28;
        gfx.fillStyle(colors[(r * 5 + c) % colors.length], 1);
        gfx.fillRoundedRect(bx, by, 14, 14, 4);
      }
    }

    // Upward arrows
    this.add.text(px + pw/2, py + 135, '\u2191 \u2191 \u2191', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.SUBTITLE
    }).setOrigin(0.5);

    // Finger tap indicator
    gfx.fillStyle(0x212121, 0.3);
    gfx.fillCircle(px + 34, py + 65, 10);
    this.add.text(px + 55, py + 62, 'TAP!', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.DEADLINE
    });

    y += ph + 20;

    // Label
    this.add.text(w/2, y, 'TAP bubbles before they hit the red line!', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT
    }).setOrigin(0.5);
    y += 30;

    // Color priority diagram
    const circleColors = [
      { hex: 0xEF5350, label: 'RED' },
      { hex: 0x1E88E5, label: 'BLUE' },
      { hex: 0xFDD835, label: 'YELLOW' }
    ];
    const startX = w/2 - 100;
    for (let i = 0; i < 3; i++) {
      const cx = startX + i * 80;
      gfx.fillStyle(circleColors[i].hex, 1);
      gfx.fillCircle(cx, y, 14);
      this.add.text(cx, y + 22, circleColors[i].label, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
        color: COLORS.HUD_TEXT
      }).setOrigin(0.5);
      if (i < 2) {
        this.add.text(cx + 36, y, '>', {
          fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
          color: COLORS.COMBO
        }).setOrigin(0.5);
      }
    }
    y += 48;

    this.add.text(w/2, y, 'Tap all reds first, then blues, then yellows.', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif',
      color: COLORS.HUD_TEXT
    }).setOrigin(0.5);
    y += 28;

    // Rules
    const rules = [
      'Wrong color tap = MISS!',
      'Miss 3 bubbles = Game Over.',
      'Each correct pop: +10 points',
      'Full row cleared: +100 bonus',
      'Combo (5+): score up to 3x!'
    ];
    for (const r of rules) {
      this.add.text(30, y, '\u2022 ' + r, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif',
        color: COLORS.HUD_TEXT
      });
      y += 22;
    }
    y += 8;

    // Tips
    this.add.text(30, y, 'Tips:', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.COMBO
    });
    y += 22;
    const tips = [
      'Focus on the color closest to the deadline.',
      'Check the priority order below the red bar.',
      'Silver $ bubbles are always safe to tap!'
    ];
    for (const t of tips) {
      this.add.text(40, y, '\u2022 ' + t, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', fontStyle: 'italic',
        color: COLORS.SUBTITLE
      });
      y += 20;
    }

    // Got It button — fixed near bottom
    const btnY = h - 60;
    const gotItBtn = this.add.rectangle(w/2, btnY, 200, 52, 0x1E88E5, 1).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.UI_BUTTON_TEXT
    }).setOrigin(0.5);

    // Full-screen fallback tap zone behind everything
    const fallback = this.add.rectangle(w/2, btnY, w, 100, 0x000000, 0).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => this.goBack());

    gotItBtn.on('pointerdown', () => this.goBack());
  }

  goBack() {
    this.scene.stop('HelpScene');
    this.scene.resume(this.returnTo);
  }
}
