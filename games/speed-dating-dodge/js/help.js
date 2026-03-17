// Speed Dating Dodge — Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
    this.wasGamePaused = data.wasGamePaused || false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.add.rectangle(w/2, h/2, w, h, 0xFFF5E6).setAlpha(0.97);
    const border = this.add.rectangle(w/2, h/2, w - 16, h - 16);
    border.setStrokeStyle(3, 0xFF6B6B);
    border.setFillStyle();

    // Scrollable container
    let yPos = 40;

    // Title
    this.add.text(w/2, yPos, 'How to Play', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CONFIG.COLOR_PRIMARY
    }).setOrigin(0.5);
    yPos += 40;

    // One-liner
    this.add.text(w/2, yPos, 'Dodge red-flag topics while\nspeed dating!', {
      fontSize: '14px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
      align: 'center'
    }).setOrigin(0.5);
    yPos += 45;

    // Swipe illustration
    this.add.text(w/2, yPos, '-- Controls --', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);
    yPos += 25;

    // Left swipe box
    const lx = w/2 - 70; const rx = w/2 + 70;
    this.add.rectangle(lx, yPos + 20, 110, 50, 0xF8F9FA).setStrokeStyle(2, 0x2C3A47);
    this.add.text(lx, yPos + 20, 'Answer A', { fontSize: '13px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT }).setOrigin(0.5);
    this.add.text(lx, yPos + 55, 'swipe left', { fontSize: '11px', fontFamily: 'Arial', color: CONFIG.COLOR_RED_FLAG, fontStyle: 'bold' }).setOrigin(0.5);

    // Right swipe box
    this.add.rectangle(rx, yPos + 20, 110, 50, 0xF8F9FA).setStrokeStyle(2, 0x2C3A47);
    this.add.text(rx, yPos + 20, 'Answer B', { fontSize: '13px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT }).setOrigin(0.5);
    this.add.text(rx, yPos + 55, 'swipe right', { fontSize: '11px', fontFamily: 'Arial', color: CONFIG.COLOR_CORRECT, fontStyle: 'bold' }).setOrigin(0.5);

    // Arrows
    this.add.text(lx - 35, yPos + 20, '<', { fontSize: '28px', color: CONFIG.COLOR_RED_FLAG, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(rx + 35, yPos + 20, '>', { fontSize: '28px', color: CONFIG.COLOR_CORRECT, fontStyle: 'bold' }).setOrigin(0.5);
    yPos += 78;

    // Personality icons
    this.add.text(w/2, yPos, '-- Read the Personality! --', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);
    yPos += 25;

    const types = CONFIG.PERSONALITY_TYPES;
    const colors = [0xFF9F43, 0x54A0FF, 0x1DD1A1, 0x8395A7, 0xA29BFE];
    const icons = ['compass','house','fork','case','star'];
    const spacing = (w - 40) / types.length;

    types.forEach((t, i) => {
      const ix = 20 + spacing * i + spacing/2;
      this.add.circle(ix, yPos + 12, 14, colors[i]).setStrokeStyle(2, 0x2C3A47);
      this.add.text(ix, yPos + 35, t.substring(0,4), {
        fontSize: '9px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT
      }).setOrigin(0.5);
    });

    this.add.text(w/2, yPos + 50, 'The icon hints at what they like!', {
      fontSize: '11px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT, fontStyle: 'italic'
    }).setOrigin(0.5);
    yPos += 72;

    // Rules
    this.add.text(w/2, yPos, '-- Rules --', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);
    yPos += 22;

    const rules = [
      'Answer before the timer runs out',
      'Wrong answer or timeout = date fail',
      '3 failed dates = game over',
      '3 correct in a row = SPARK BONUS!'
    ];
    rules.forEach(r => {
      this.add.text(w/2, yPos, '* ' + r, {
        fontSize: '12px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
        wordWrap: { width: w - 60 }
      }).setOrigin(0.5, 0);
      yPos += 20;
    });
    yPos += 8;

    // Tips
    this.add.text(w/2, yPos, '-- Tips --', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);
    yPos += 22;

    const tips = [
      'Homebodies love safe answers. Adventurers love bold ones.',
      'When timer turns red, just swipe — a guess beats no answer!',
      'Answer fast for +50 speed bonus points.'
    ];
    tips.forEach(t => {
      this.add.text(w/2, yPos, t, {
        fontSize: '11px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
        fontStyle: 'italic', wordWrap: { width: w - 60 }
      }).setOrigin(0.5, 0);
      yPos += 28;
    });

    // Got it! button - fixed at bottom
    const btnY = Math.min(yPos + 20, h - 50);
    const gotItBtn = this.add.rectangle(w/2, btnY, 200, 48, 0xFF6B6B, 1).setInteractive();
    gotItBtn.setStrokeStyle(2, 0xC44D4D);
    const gotItText = this.add.text(w/2, btnY, 'Got it!', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5);

    gotItBtn.on('pointerdown', () => {
      SFX.play('click');
      this.scene.stop('HelpScene');
      if (this.wasGamePaused) {
        this.scene.resume(this.returnTo);
      }
    });

    // Full screen fallback tap zone
    const fallback = this.add.rectangle(w/2, h - 20, w, 40, 0x000000, 0).setInteractive();
    fallback.on('pointerdown', () => {
      SFX.play('click');
      this.scene.stop('HelpScene');
      if (this.wasGamePaused) {
        this.scene.resume(this.returnTo);
      }
    });

    // Fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 200 });
  }
}
