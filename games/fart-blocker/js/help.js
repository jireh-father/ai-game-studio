// help.js — HelpScene: illustrated how-to-play, control diagrams, rules, tips

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark background
    this.add.rectangle(w / 2, h / 2, w, h, 0x1A1A2E, 0.95).setDepth(0);

    let y = 40;

    // Header
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5, 0).setDepth(1);
    y += 50;

    // Control diagram — phone with tap arrows
    const gfx = this.add.graphics().setDepth(1);
    const phoneX = w / 2 - 40, phoneY = y, phoneW = 80, phoneH = 100;
    gfx.fillStyle(0x333333, 1);
    gfx.fillRoundedRect(phoneX, phoneY, phoneW, phoneH, 10);
    gfx.fillStyle(0x1A1A2E, 1);
    gfx.fillRoundedRect(phoneX + 5, phoneY + 8, phoneW - 10, phoneH - 16, 6);

    // Tap hand icon in phone
    this.add.text(w / 2, phoneY + phoneH / 2, '👆', {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(2);

    // Arrows pointing at phone
    gfx.lineStyle(3, 0x2DC653, 1);
    // Left arrow
    gfx.beginPath(); gfx.moveTo(phoneX - 40, phoneY + phoneH / 2);
    gfx.lineTo(phoneX - 5, phoneY + phoneH / 2); gfx.strokePath();
    // Right arrow
    gfx.beginPath(); gfx.moveTo(phoneX + phoneW + 40, phoneY + phoneH / 2);
    gfx.lineTo(phoneX + phoneW + 5, phoneY + phoneH / 2); gfx.strokePath();

    this.add.text(w / 2, phoneY + phoneH + 10, 'TAP ANYWHERE TO CLENCH', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.safeGreen
    }).setOrigin(0.5, 0).setDepth(1);

    y += phoneH + 40;

    // Rules section
    this.add.text(w / 2, y, 'THE RULES:', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5, 0).setDepth(1);
    y += 30;

    const rules = [
      { icon: '💚', text: 'Tap to keep pressure down' },
      { icon: '⚠️', text: 'Tap too fast = CRAMP (3s freeze!)' },
      { icon: '💨', text: 'Pressure fills on its own' },
      { icon: '❤️', text: 'You have 3 lives' }
    ];
    rules.forEach(r => {
      this.add.text(40, y, r.icon + '  ' + r.text, {
        fontSize: '15px', fontFamily: 'Arial', color: COLORS.uiText
      }).setOrigin(0, 0).setDepth(1);
      y += 26;
    });

    y += 10;

    // Pressure meter mini diagram
    this.add.text(w / 2, y, 'PRESSURE METER (right side):', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5, 0).setDepth(1);
    y += 22;

    const meterX = w / 2 - 50;
    gfx.fillStyle(0x333333, 0.5);
    gfx.fillRoundedRect(meterX, y, 16, 50, 4);
    gfx.fillStyle(0x2DC653, 1);
    gfx.fillRoundedRect(meterX, y + 35, 16, 15, 4);
    gfx.fillStyle(0xFFD60A, 1);
    gfx.fillRect(meterX, y + 25, 16, 10);
    gfx.fillStyle(0xE63946, 1);
    gfx.fillRoundedRect(meterX, y, 16, 25, 4);

    this.add.text(meterX + 22, y + 5, 'RED = danger', {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS.criticalRed
    }).setDepth(1);
    this.add.text(meterX + 22, y + 38, 'GREEN = safe', {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS.safeGreen
    }).setDepth(1);
    y += 65;

    // Tips section
    this.add.text(w / 2, y, 'TIPS FOR BEGINNERS:', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.warningYellow
    }).setOrigin(0.5, 0).setDepth(1);
    y += 28;

    const tips = [
      '1. Tap steadily - don\'t panic mash.\n   Cramps are deadly!',
      '2. Watch the meter color. Yellow\n   means slow down.',
      '3. After Stage 31, RED FLASH means\n   STOP tapping for 1 second!'
    ];
    tips.forEach(t => {
      this.add.text(30, y, t, {
        fontSize: '13px', fontFamily: 'Arial', color: COLORS.uiText, lineSpacing: 3
      }).setDepth(1);
      y += 42;
    });

    // GOT IT button — fixed position near bottom
    const btnY = h - 60;
    const btnBg = this.add.rectangle(w / 2, btnY, 200, 50, 0x2DC653)
      .setInteractive({ useHandCursor: true }).setDepth(2);
    const btnText = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(3);

    btnBg.on('pointerdown', () => {
      AudioSystem.playUIClick();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });

    // Full-screen invisible fallback tap zone
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0)
      .setInteractive().setDepth(1);
    fallback.on('pointerdown', () => {
      btnBg.emit('pointerdown');
    });
  }
}
