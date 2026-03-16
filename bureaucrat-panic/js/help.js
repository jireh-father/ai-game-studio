// help.js — HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = DIMS.width, h = DIMS.height;

    // Semi-transparent background
    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E, 0.85).setDepth(0);

    // Scrollable content container
    let y = 20;

    // Header
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 40;

    // Section: Your Job
    this.add.text(20, y, 'YOUR JOB', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 22;
    this.add.text(20, y, 'Process permit forms before\ntime runs out. 3 mistakes = FIRED!', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#FFFFFF', lineSpacing: 2
    }).setDepth(1);
    y += 42;

    // Section: The Form
    this.add.text(20, y, 'THE FORM', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 22;

    // Mini form card illustration
    this.add.rectangle(w / 2, y + 40, 200, 75, 0xF5F0E8, 1).setStrokeStyle(2, 0xC8B99A).setDepth(1);
    this.add.rectangle(w / 2, y + 10, 200, 18, 0x2B4C8C, 1).setDepth(1);
    // Icon labels
    if (this.textures.exists('icon-ghost')) {
      this.add.image(w / 2 - 50, y + 35, 'icon-ghost').setScale(0.6).setDepth(2);
    }
    this.add.text(w / 2 - 20, y + 30, 'Applicant', { fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack }).setDepth(2);
    if (this.textures.exists('req-noise')) {
      this.add.image(w / 2 + 50, y + 35, 'req-noise').setScale(0.6).setDepth(2);
    }
    this.add.text(w / 2 + 20, y + 30, 'Request', { fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack }).setDepth(2);
    if (this.textures.exists('time-night')) {
      this.add.image(w / 2 - 50, y + 58, 'time-night').setScale(0.5).setDepth(2);
    }
    this.add.text(w / 2 - 20, y + 55, 'Time', { fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack }).setDepth(2);
    if (this.textures.exists('badge-urgent')) {
      this.add.image(w / 2 + 50, y + 58, 'badge-urgent').setScale(0.6).setDepth(2);
    }
    this.add.text(w / 2 + 20, y + 55, 'Badge', { fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack }).setDepth(2);
    y += 90;

    // Section: Rules
    this.add.text(20, y, 'THE RULES (top of screen)', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 20;
    this.add.text(20, y, 'Check form against pinned rules.\nRules change every few stages!', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#FFFFFF', lineSpacing: 2
    }).setDepth(1);
    y += 38;

    // Section: Swipe controls
    this.add.text(20, y, 'CONTROLS', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 24;

    // Swipe diagram using textures
    if (this.textures.exists('swipe-diagram')) {
      this.add.image(w / 2, y + 20, 'swipe-diagram').setScale(0.9).setDepth(1);
    } else {
      // Fallback: draw arrows with text
      this.add.text(50, y, '<-- DENY', {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.denyRed
      }).setDepth(1);
      this.add.text(220, y, 'APPROVE -->', {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.approveGreen
      }).setDepth(1);
    }
    y += 50;

    this.add.text(20, y, 'Swipe RIGHT to approve\nSwipe LEFT to deny\n(80px minimum swipe distance)', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#FFFFFF', lineSpacing: 2
    }).setDepth(1);
    y += 48;

    // Section: Scoring
    this.add.text(20, y, 'SCORING', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 20;
    this.add.text(20, y, 'Correct = 100 pts\nSpeed bonus (>8s left) = 150 pts\nClutch (<4s left) = 200 pts\nCombo x3=1.5x  x5=2x  x8+=3x', {
      fontSize: '10px', fontFamily: 'monospace', fill: '#FFFFFF', lineSpacing: 3
    }).setDepth(1);
    y += 56;

    // Tips
    this.add.text(20, y, 'TIPS', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setDepth(1);
    y += 20;
    this.add.text(20, y, '- Scan applicant icon FIRST\n- Watch for rule changes!\n- URGENT badge = always approve\n- 3 mistakes and you are FIRED', {
      fontSize: '10px', fontFamily: 'monospace', fill: '#FFFFFF', lineSpacing: 3
    }).setDepth(1);
    y += 60;

    // GOT IT button at fixed position near bottom
    const btnY = Math.min(y + 10, h - 50);
    const gotItBtn = this.add.rectangle(w / 2, btnY, 260, 44, 0x2B4C8C, 1)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    gotItBtn.setStrokeStyle(2, 0xFFFFFF);
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(9);

    // Full-screen fallback tap zone
    const fullTap = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(8);
    this.add.text(w / 2, h - 20, 'Tap to close', {
      fontSize: '10px', fontFamily: 'monospace', fill: '#FFFFFF', alpha: 0.4
    }).setOrigin(0.5).setDepth(9);

    const closeHelp = () => {
      synthClick();
      this.scene.stop('HelpScene');
      this.scene.resume(this.returnTo);
    };

    gotItBtn.on('pointerdown', closeHelp);
    fullTap.on('pointerdown', closeHelp);
  }
}
