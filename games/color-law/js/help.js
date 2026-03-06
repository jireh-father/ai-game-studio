// help.js - HelpScene: illustrated how-to-play
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E, 0.97).setDepth(0);

    const cam = this.cameras.main;
    const contentH = 900;
    cam.setBounds(0, 0, W, contentH);

    let y = 30;
    this.add.text(W / 2, y, 'HOW TO PLAY', { fontSize: '28px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 40;
    this.add.text(W / 2, y, 'Sort shapes by the rules\nbefore they change!', { fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF', align: 'center' }).setOrigin(0.5);

    // Controls section
    y += 50;
    this.add.text(W / 2, y, '-- CONTROLS --', { fontSize: '18px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 30;
    // Swipe diagram
    this.add.rectangle(W / 2, y + 40, 280, 80, 0x2D2D44).setStrokeStyle(2, 0xFFFFFF);
    if (this.textures.exists('circle_Red_Solid')) {
      this.add.image(80, y + 40, 'circle_Red_Solid').setScale(0.6);
    }
    // Arrow
    const arrow = this.add.graphics();
    arrow.lineStyle(3, 0xFFD700);
    arrow.beginPath(); arrow.moveTo(110, y + 40); arrow.lineTo(200, y + 20); arrow.strokePath();
    arrow.beginPath(); arrow.moveTo(195, y + 10); arrow.lineTo(200, y + 20); arrow.lineTo(190, y + 22); arrow.strokePath();
    this.add.text(220, y + 10, 'SWIPE', { fontSize: '14px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' });
    this.add.text(220, y + 28, 'to zone', { fontSize: '12px', fontFamily: 'Arial', fill: '#AAAAAA' });
    y += 90;
    this.add.text(W / 2, y, 'or TAP a zone to send\nthe front shape there', { fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center' }).setOrigin(0.5);

    // Law section
    y += 50;
    this.add.text(W / 2, y, '-- THE LAW --', { fontSize: '18px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 28;
    this.add.text(W / 2, y, 'The LAW tells you where\neach shape belongs', { fontSize: '13px', fontFamily: 'Arial', fill: '#FFFFFF', align: 'center' }).setOrigin(0.5);
    y += 40;
    this.add.rectangle(W / 2, y, 300, 30, 0x333355).setStrokeStyle(1, 0xFFD700);
    this.add.text(W / 2, y, 'Red->LEFT  Blue->RIGHT  Green->CENTER', { fontSize: '11px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT }).setOrigin(0.5);
    y += 30;
    this.add.text(W / 2, y, 'Laws CHANGE! Watch the NEXT LAW preview.', { fontSize: '12px', fontFamily: 'Arial', fill: COLORS.WARNING, align: 'center' }).setOrigin(0.5);
    y += 25;
    this.add.text(W / 2, y, 'Shapes violating the new law EXPLODE!', { fontSize: '12px', fontFamily: 'Arial', fill: COLORS.EXPLOSION, align: 'center' }).setOrigin(0.5);

    // Rules section
    y += 45;
    this.add.text(W / 2, y, '-- RULES --', { fontSize: '18px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 28;
    const rules = [
      '5 Explosions = Game Over',
      'Don\'t let shapes pile up in staging!',
      'Shapes surviving law changes = BONUS POINTS',
      'Combo: consecutive correct sorts multiply score'
    ];
    for (const rule of rules) {
      this.add.text(40, y, '> ' + rule, { fontSize: '12px', fontFamily: 'Arial', fill: '#FFFFFF', wordWrap: { width: 280 } });
      y += 28;
    }

    // Tips section
    y += 15;
    this.add.text(W / 2, y, '-- TIPS --', { fontSize: '18px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 28;
    const tips = [
      'Watch the NEXT LAW preview to plan ahead',
      'Place shapes matching BOTH current & next law first',
      'Sort fast - staging overflow causes explosions!'
    ];
    for (const tip of tips) {
      this.add.text(40, y, '* ' + tip, { fontSize: '12px', fontFamily: 'Arial', fill: '#AADDFF', wordWrap: { width: 280 } });
      y += 30;
    }

    // Got it button
    y += 20;
    const btnY = Math.max(y, contentH - 60);
    const btn = this.add.rectangle(W / 2, btnY, 180, 50, 0xFFD700).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, btnY, 'Got it!', { fontSize: '22px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
    btn.on('pointerdown', () => {
      SoundFX.play(this, 'click');
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Drag to scroll
    this.input.on('pointermove', (p) => {
      if (p.isDown) cam.scrollY -= (p.y - p.prevPosition.y);
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, contentH - H);
    });
  }
}
