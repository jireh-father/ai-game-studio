// Glass Walk - Help / How to Play Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // Overlay background
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.overlay, 0.92);

    // Title
    this.add.text(w / 2, 40, 'HOW TO PLAY', {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif', color: '#80D8FF'
    }).setOrigin(0.5);

    this.add.text(w / 2, 70, 'Pick the safe glass panel!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#B0BEC5'
    }).setOrigin(0.5);

    // Panel illustration
    const ilY = 120;
    // Safe panel
    const safeP = this.add.rectangle(w * 0.3, ilY, 70, 45, COLORS.safeGlass, 0.6)
      .setStrokeStyle(2, 0xB0BEC5);
    this.add.ellipse(w * 0.3, ilY, 30, 20, COLORS.safeGlow, 0.3);
    this.add.text(w * 0.3, ilY + 32, 'SAFE', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#66BB6A'
    }).setOrigin(0.5);
    this.add.text(w * 0.3, ilY - 32, 'Clean, glowing', {
      fontSize: '10px', fontFamily: 'Arial', color: '#B0BEC5'
    }).setOrigin(0.5);

    // Fake panel
    this.add.rectangle(w * 0.7, ilY, 70, 45, COLORS.fakeGlass, 0.4)
      .setStrokeStyle(2, 0xB0BEC5);
    // Crack lines on fake
    const fg = this.add.graphics();
    fg.lineStyle(1, COLORS.crackLine, 0.6);
    fg.lineBetween(w * 0.7 - 20, ilY - 15, w * 0.7 + 10, ilY + 10);
    fg.lineBetween(w * 0.7 + 10, ilY + 10, w * 0.7 - 5, ilY + 18);
    fg.lineBetween(w * 0.7 + 5, ilY - 10, w * 0.7 + 20, ilY + 15);
    this.add.text(w * 0.7, ilY + 32, 'FAKE', {
      fontSize: '12px', fontFamily: 'Arial Black', color: '#FF1744'
    }).setOrigin(0.5);
    this.add.text(w * 0.7, ilY - 32, 'Cracked, dull', {
      fontSize: '10px', fontFamily: 'Arial', color: '#B0BEC5'
    }).setOrigin(0.5);

    // Tap arrow
    this.add.text(w / 2, ilY, 'TAP', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Rules section
    let y = 190;
    const rules = [
      '[ Rules ]',
      '- Tap the safe panel in each row',
      '- A brief flash shows the answer at start',
      '- Wrong choice = shatter + lose 1 life',
      '- Timer expires = lose 1 life',
      '- 3 lives total, 0 = Game Over',
      '',
      '[ Scoring ]',
      '- Correct step: +100 points',
      '- Quick decision (<2s): +50 bonus',
      '- Streak x3/x6/x10 = multiplier!',
      '',
      '[ Tips ]',
      '- Watch for the flash at each row start',
      '- Safe glass is cleaner and slightly blue',
      '- Look for the inner glow on later stages',
      '- Fake panels have more cracks and dull color'
    ];
    rules.forEach(line => {
      const isHeader = line.startsWith('[');
      this.add.text(24, y, line, {
        fontSize: isHeader ? '14px' : '12px',
        fontFamily: isHeader ? 'Arial Black' : 'Arial',
        color: isHeader ? '#80D8FF' : '#ECEFF1'
      });
      y += isHeader ? 22 : 17;
    });

    // Timer illustration
    y += 5;
    this.add.rectangle(w / 2, y, w * 0.6, 10, COLORS.timerOrange, 0.8);
    this.add.text(w / 2, y + 14, "Don't stand too long!", {
      fontSize: '11px', fontFamily: 'Arial', color: '#FF6D00'
    }).setOrigin(0.5);

    // Lives illustration
    y += 36;
    for (let i = 0; i < 3; i++) {
      this.add.image(w / 2 - 30 + i * 28, y, 'heart').setScale(0.7);
    }
    this.add.text(w / 2, y + 18, '3 lives per game', {
      fontSize: '11px', fontFamily: 'Arial', color: '#B0BEC5'
    }).setOrigin(0.5);

    // Got it button
    const btnY = h - 50;
    const gotBg = this.add.rectangle(w / 2, btnY, 160, 44, 0x1A3A5C)
      .setStrokeStyle(2, 0x80D8FF).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Got it!', {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#80D8FF'
    }).setOrigin(0.5).disableInteractive();
    gotBg.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}
