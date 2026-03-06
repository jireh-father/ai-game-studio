// help.js - HelpScene: illustrated How to Play

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0xE0F7FA);

    let y = 30;
    const addTitle = (text, size, color) => {
      this.add.text(w / 2, y, text, {
        fontSize: size || '24px', fontFamily: 'Arial', fontStyle: 'bold',
        fill: color || COLORS.uiText, align: 'center'
      }).setOrigin(0.5, 0);
      y += parseInt(size || '24') + 10;
    };
    const addBody = (text) => {
      const t = this.add.text(w / 2, y, text, {
        fontSize: '14px', fontFamily: 'Arial', fill: COLORS.pipeOutline,
        align: 'center', wordWrap: { width: w - 40 }
      }).setOrigin(0.5, 0);
      y += t.height + 12;
    };

    addTitle('HOW TO PLAY', '26px');
    addTitle('Pipe Dream Plumber', '16px', COLORS.pipeOutline);

    // Section 1: Place Pipes (with illustration)
    addTitle('1. Place Pipes', '18px', COLORS.uiText);
    // Draw illustration: tray -> arrow -> grid
    const trayX = w * 0.25, gridX = w * 0.7;
    this.add.rectangle(trayX, y + 20, 44, 44, 0xCFD8DC).setStrokeStyle(2, 0x37474F);
    this.add.image(trayX, y + 20, 'straight').setScale(0.8);
    // Arrow
    this.add.text(w * 0.47, y + 14, '-->', { fontSize: '20px', fill: COLORS.accent, fontStyle: 'bold' }).setOrigin(0.5, 0);
    // Finger icon (circle)
    this.add.circle(w * 0.47, y + 36, 8, 0xFFB300, 0.5);
    this.add.rectangle(gridX, y + 20, 44, 44, 0xECEFF1).setStrokeStyle(2, 0xB0BEC5);
    this.add.image(gridX, y + 20, 'straight').setScale(0.8).setAlpha(0.4);
    y += 52;
    addBody('Tap a pipe in the tray, then tap an empty grid cell to place it.');

    // Section 2: Rotate
    addTitle('2. Rotate Pipes', '18px', COLORS.uiText);
    const rotX = w / 2;
    this.add.image(rotX - 30, y + 20, 'lbend').setScale(0.8);
    this.add.text(rotX, y + 14, '-->', { fontSize: '18px', fill: COLORS.accent, fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.add.image(rotX + 30, y + 20, 'lbend').setScale(0.8).setAngle(90);
    y += 52;
    addBody('Tap a placed pipe to rotate it 90 degrees.');

    // Section 3: Connect Water
    addTitle('3. Connect Water!', '18px', COLORS.uiText);
    // Source -> pipes -> drain illustration
    const startX = w * 0.15;
    this.add.image(startX, y + 20, 'source').setScale(0.7);
    for (let i = 1; i <= 3; i++) {
      this.add.image(startX + i * 42, y + 20, 'straight').setScale(0.7);
      // Water fill indicator
      this.add.rectangle(startX + i * 42, y + 20, 30, 6, 0x4FC3F7).setAlpha(0.6);
    }
    this.add.image(startX + 4 * 42, y + 20, 'drain').setScale(0.7);
    y += 52;
    addBody('Connect source to drain before water flows!');

    // Section 4: Special Pipes
    addTitle('4. Special Pipes', '18px', COLORS.uiText);
    const specials = [
      { key: 'coffee', desc: 'Coffee: Slows water' },
      { key: 'toilet', desc: 'Toilet: Reverses flow' },
      { key: 'sprinkler', desc: 'Sprinkler: Splits flow' }
    ];
    specials.forEach((sp, i) => {
      const sx = w * 0.15 + i * (w * 0.25);
      this.add.image(sx, y + 15, sp.key).setScale(0.65);
      this.add.text(sx, y + 38, sp.desc, { fontSize: '10px', fontFamily: 'Arial', fill: COLORS.pipeOutline, align: 'center' }).setOrigin(0.5, 0);
    });
    y += 60;

    // Rules
    addTitle('Rules', '18px', COLORS.danger);
    addBody('Water starts flowing when the timer hits zero.\nDead ends cause floods.\nRoom floods in 20 seconds = Game Over!');

    // Tips
    addTitle('Tips', '18px', COLORS.success);
    addBody('1. Build from the drain backward.\n2. Keep the tray empty for faster refills.\n3. Coffee pipes near the source buy extra time.');

    // Got it button
    const btnY = Math.min(y + 20, h - 50);
    const gotBtn = this.add.rectangle(w / 2, btnY, 180, 50, 0x66BB6A).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(w / 2, btnY, 'Got it!', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5).setDepth(11);
    gotBtn.on('pointerdown', () => {
      sfx.play('uiClick');
      if (this.returnTo === 'GameScene') {
        this.scene.stop();
        this.scene.resume('GameScene');
      } else {
        this.scene.start(this.returnTo);
      }
    });
  }
}
