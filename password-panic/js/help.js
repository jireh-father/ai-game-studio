// help.js - HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    // Background overlay
    this.add.rectangle(w/2, h/2, w, h, 0xFFFFFF, 0.95).setInteractive();

    let y = 20;
    // Title - styled as FAQ page
    this.add.text(w/2, y, 'HOW TO LOG IN', {
      fontSize: '22px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY
    }).setOrigin(0.5);
    y += 32;

    this.add.text(w/2, y, 'Password Panic - FAQ', {
      fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);
    y += 28;

    // Section 1: Controls
    this.add.text(16, y, 'CONTROLS', {
      fontSize: '14px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY
    });
    y += 22;

    // Tile tap illustration
    const tileBg = this.add.image(60, y + 16, 'tile').setDisplaySize(80, 32);
    this.add.text(60, y + 16, 'SPAIN', {
      fontSize: '12px', fontFamily: 'Arial Bold', fill: COLORS.TILE_TEXT
    }).setOrigin(0.5);

    // Arrow pointing right
    this.add.text(110, y + 12, '>>>', {
      fontSize: '16px', fontFamily: 'Arial', fill: COLORS.SUCCESS
    });

    // Password box
    this.add.rectangle(200, y + 16, 120, 28, 0xECEFF1).setStrokeStyle(1, 0xB0BEC5);
    this.add.text(200, y + 16, '[SPAIN]', {
      fontSize: '12px', fontFamily: 'Courier New', fill: COLORS.PW_TEXT
    }).setOrigin(0.5);

    this.add.text(16, y + 38, 'Tap tiles to add them to your password', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#555'
    });
    y += 58;

    // Section 2: Rules
    this.add.text(16, y, 'RULES', {
      fontSize: '14px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY
    });
    y += 22;

    // Sticky note with checkmark
    const note1 = this.add.image(w/2 - 40, y + 14, 'stickyNote').setDisplaySize(160, 28);
    this.add.text(w/2 - 80, y + 8, 'Must contain a number', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#333'
    });
    const check1 = this.add.image(w/2 + 50, y + 14, 'checkIcon').setDisplaySize(18, 18);

    y += 32;
    // Sticky note with X
    const note2 = this.add.image(w/2 - 40, y + 14, 'stickyNote').setDisplaySize(160, 28);
    this.add.text(w/2 - 80, y + 8, '8+ characters', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#333'
    });
    const x1 = this.add.image(w/2 + 50, y + 14, 'xIcon').setDisplaySize(18, 18);

    y += 34;
    this.add.text(16, y, 'Your password must satisfy ALL rules!', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#555'
    });
    y += 20;
    this.add.text(16, y, 'Rules stack up - old rules never go away!', {
      fontSize: '11px', fontFamily: 'Arial', fill: COLORS.FAIL, fontStyle: 'bold'
    });
    y += 28;

    // Section 3: Timer
    this.add.text(16, y, 'TIMER', {
      fontSize: '14px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY
    });
    y += 22;

    // Timer bar illustration
    this.add.rectangle(w/2, y + 8, w - 60, 12, 0x00897B);
    this.add.text(w/2, y + 8, 'TIME', {
      fontSize: '8px', fontFamily: 'Arial Bold', fill: '#FFF'
    }).setOrigin(0.5);

    y += 24;
    this.add.text(16, y, 'Wrong submit = -5 seconds penalty!', {
      fontSize: '11px', fontFamily: 'Arial', fill: COLORS.FAIL
    });
    y += 16;
    this.add.text(16, y, 'Timer runs out = ACCOUNT LOCKED!', {
      fontSize: '11px', fontFamily: 'Arial', fill: COLORS.FAIL, fontStyle: 'bold'
    });
    y += 28;

    // Tips section
    this.add.text(16, y, 'TIPS', {
      fontSize: '14px', fontFamily: 'Arial Black', fill: COLORS.SUCCESS
    });
    y += 22;

    const tips = [
      'Read ALL rules before building!',
      'Number tiles help with digit-sum rules!',
      'Password Resets remove old rules every 5 stages!',
      'Clear first-try stages for streak bonuses!'
    ];
    tips.forEach(tip => {
      this.add.text(24, y, '> ' + tip, {
        fontSize: '11px', fontFamily: 'Arial', fill: '#444'
      });
      y += 18;
    });

    y += 12;
    // GOT IT button
    const gotIt = this.add.image(w/2, y + 10, 'submitBtn').setScale(0.6).setInteractive({ useHandCursor: true });
    this.add.text(w/2, y + 10, 'I AGREE TO TERMS', {
      fontSize: '13px', fontFamily: 'Arial Black', fill: '#FFFFFF'
    }).setOrigin(0.5);
    gotIt.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}
