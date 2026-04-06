class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A14, 0.95).setDepth(0);

    let yPos = 30;
    this.add.text(w / 2, yPos, 'HOW TO PLAY', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setOrigin(0.5);
    yPos += 35;
    this.add.text(w / 2, yPos, 'Smash falling meteors with your hammer!', { fontSize: '13px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(0.5);

    // Diagram 1: Swing controls
    yPos += 35;
    this.add.text(w / 2, yPos, 'CONTROLS', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hammerAccent }).setOrigin(0.5);
    yPos += 25;
    // Draw simple swing diagram
    const g1 = this.add.graphics();
    const pivotX = w / 2, pivotDY = yPos + 10;
    g1.fillStyle(0x8C9BAF, 1); g1.fillCircle(pivotX, pivotDY, 6);
    g1.lineStyle(2, 0xA89070, 0.5); g1.lineBetween(pivotX, pivotDY, pivotX - 60, pivotDY + 70);
    g1.lineStyle(2, 0xA89070, 1); g1.lineBetween(pivotX, pivotDY, pivotX + 60, pivotDY + 70);
    g1.fillStyle(0x8C9BAF, 0.35); g1.fillCircle(pivotX - 60, pivotDY + 70, 16);
    g1.fillStyle(0x8C9BAF, 1); g1.fillCircle(pivotX + 60, pivotDY + 70, 16);
    // Arrow
    g1.lineStyle(2, 0x5B8FBF, 1);
    g1.beginPath(); g1.moveTo(pivotX + 50, pivotDY + 50);
    g1.arc(pivotX, pivotDY, 70, -0.5, -2.5, true); g1.strokePath();
    this.add.text(pivotX - 80, pivotDY + 60, 'Drag to\nwind up', { fontSize: '10px', fontFamily: 'Arial', color: '#A0A0C0', align: 'center' }).setOrigin(0.5);
    this.add.text(pivotX + 80, pivotDY + 60, 'Release\nto SMASH!', { fontSize: '10px', fontFamily: 'Arial', color: '#A0A0C0', align: 'center' }).setOrigin(0.5);
    yPos += 100;

    // Diagram 2: Combo
    yPos += 15;
    this.add.text(w / 2, yPos, 'COMBOS', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.comboText }).setOrigin(0.5);
    yPos += 20;
    this.add.text(w / 2, yPos, 'Hit multiple meteors in one swing', { fontSize: '12px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(0.5);
    yPos += 16;
    this.add.text(w / 2, yPos, '2 hits = x1.5 | 3+ hits = x2.0', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.comboText }).setOrigin(0.5);

    // Diagram 3: Meteor types
    yPos += 35;
    this.add.text(w / 2, yPos, 'METEOR TYPES', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setOrigin(0.5);
    yPos += 30;
    const types = [
      { key: 'meteor_normal', label: 'NORMAL', desc: '100 pts', color: COLORS.meteorNormal },
      { key: 'meteor_fire', label: 'FIRE', desc: 'Splits in 2!', color: '#FF4400' },
      { key: 'meteor_ice', label: 'ICE', desc: 'Slows hammer', color: COLORS.meteorIce },
      { key: 'meteor_gold', label: 'GOLD', desc: '+500 pts', color: COLORS.meteorGold }
    ];
    const spacing = w / (types.length + 1);
    types.forEach((t, i) => {
      const tx = spacing * (i + 1);
      if (this.textures.exists(t.key)) {
        this.add.image(tx, yPos, t.key).setScale(0.6);
      } else {
        this.add.circle(tx, yPos, 14, Phaser.Display.Color.HexStringToColor(t.color).color);
      }
      this.add.text(tx, yPos + 22, t.label, { fontSize: '9px', fontFamily: 'Arial', fontStyle: 'bold', color: t.color }).setOrigin(0.5);
      this.add.text(tx, yPos + 34, t.desc, { fontSize: '9px', fontFamily: 'Arial', color: '#A0A0C0' }).setOrigin(0.5);
    });

    // Tips
    yPos += 65;
    this.add.text(w / 2, yPos, 'TIPS', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud }).setOrigin(0.5);
    yPos += 22;
    const tips = [
      'Clean sweeps clear rubble from base',
      'Lead your target - release early!',
      'Chain consecutive hits for combo bonus',
      'Missed meteors stack as rubble'
    ];
    tips.forEach(tip => {
      this.add.text(w / 2, yPos, '  ' + tip, { fontSize: '12px', fontFamily: 'Arial', color: '#C0C0D0' }).setOrigin(0.5);
      yPos += 18;
    });

    // GOT IT button
    const btnY = h - 60;
    const btnBg = this.add.rectangle(w / 2, btnY, 180, 50, Phaser.Display.Color.HexStringToColor(COLORS.uiButton).color).setDepth(10).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w / 2, btnY, 'GOT IT!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(11);
    btnTxt.disableInteractive();

    btnBg.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
        this.scene.resume('UIScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });

    // Fullscreen fallback tap zone
    const fallback = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0).setDepth(9).setInteractive();
    fallback.on('pointerdown', () => btnBg.emit('pointerdown'));
  }
}
