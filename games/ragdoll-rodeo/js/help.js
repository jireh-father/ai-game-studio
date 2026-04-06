// help.js — HelpScene with illustrated controls

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, COLORS.darkBrown, 0.92).setDepth(0);

    let y = 40;
    this.add.text(w/2, y, 'HOW TO PLAY', { fontSize: '28px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow }).setOrigin(0.5);
    y += 40;
    this.add.text(w/2, y, 'Ragdoll Rodeo', { fontSize: '16px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);
    y += 40;

    // Diagram 1: Grip control
    const g1 = this.add.graphics();
    g1.fillStyle(COLORS.deepBlue, 0.3);
    g1.fillRoundedRect(30, y - 10, 80, 70, 8);
    this.add.text(70, y + 12, '👆', { fontSize: '28px' }).setOrigin(0.5);
    this.add.text(70, y + 48, 'HOLD', { fontSize: '11px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);

    g1.lineStyle(3, COLORS.bullRed);
    g1.lineBetween(120, y + 25, 160, y + 25);
    // Arrow head
    g1.lineBetween(155, y + 20, 160, y + 25);
    g1.lineBetween(155, y + 30, 160, y + 25);

    // Rope diagram
    g1.lineStyle(4, COLORS.ropeTan);
    g1.beginPath();
    g1.moveTo(170, y + 45);
    g1.splineTo([190, y + 10, 210, y + 45]);
    g1.strokePath();
    this.add.text(190, y + 52, 'GRIP', { fontSize: '11px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);

    g1.lineStyle(3, COLORS.bullRed);
    g1.lineBetween(225, y + 25, 265, y + 25);
    g1.lineBetween(260, y + 20, 265, y + 25);
    g1.lineBetween(260, y + 30, 265, y + 25);

    // Rider icon
    g1.fillStyle(COLORS.denimBlue);
    g1.fillEllipse(310, y + 20, 24, 30);
    g1.fillStyle(0xF5D0A9);
    g1.fillEllipse(310, y + 2, 16, 16);
    this.add.text(310, y + 52, 'HOLD ON!', { fontSize: '11px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);

    y += 80;
    this.add.text(w/2, y, 'HOLD anywhere to grip the rope.\nRelease to float — re-grip at\nthe top of each buck!', {
      fontSize: '14px', fill: '#FFFFFF', align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);

    y += 70;
    // Diagram 2: Grip meter
    const g2 = this.add.graphics();
    // Full bar
    g2.fillStyle(COLORS.darkBrown); g2.fillRoundedRect(20, y, 100, 22, 10);
    g2.fillStyle(COLORS.brightGreen); g2.fillRoundedRect(22, y+2, 96, 18, 8);
    this.add.text(70, y + 30, 'FULL', { fontSize: '10px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);
    // Mid bar
    g2.fillStyle(COLORS.darkBrown); g2.fillRoundedRect(145, y, 100, 22, 10);
    g2.fillStyle(COLORS.goldYellow); g2.fillRoundedRect(147, y+2, 48, 18, 8);
    this.add.text(195, y + 30, 'RELEASE!', { fontSize: '10px', fill: COLORS_HEX.goldYellow }).setOrigin(0.5);
    // Critical
    g2.fillStyle(COLORS.darkBrown); g2.fillRoundedRect(270, y, 100, 22, 10);
    g2.fillStyle(COLORS.hotOrange); g2.fillRoundedRect(272, y+2, 12, 18, 8);
    this.add.text(320, y - 8, '!! DANGER !!', { fontSize: '11px', fill: COLORS_HEX.bullRed, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(320, y + 30, 'EJECTED', { fontSize: '10px', fill: COLORS_HEX.warmTan }).setOrigin(0.5);

    y += 48;
    this.add.text(w/2, y, 'WATCH THE GRIP METER\nHolding too long depletes it.\nRelease before it hits zero!', {
      fontSize: '14px', fill: '#FFFFFF', align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);

    y += 65;
    // Diagram 3: Arc timing
    const g3 = this.add.graphics();
    g3.lineStyle(3, COLORS.bullRed);
    const arcPts = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const ax = 40 + t * 320;
      const ay = y + 80 - Math.sin(t * Math.PI) * 70;
      arcPts.push(ax, ay);
    }
    for (let i = 0; i < arcPts.length - 2; i += 2) {
      g3.lineBetween(arcPts[i], arcPts[i+1], arcPts[i+2], arcPts[i+3]);
    }
    // Labels
    g3.fillStyle(COLORS.goldYellow); g3.fillCircle(120, y + 40, 8);
    this.add.text(120, y + 28, 'RELEASE', { fontSize: '10px', fill: COLORS_HEX.hotOrange, fontStyle: 'bold' }).setOrigin(0.5);
    g3.fillStyle(COLORS.brightGreen); g3.fillCircle(200, y + 12, 10);
    this.add.text(200, y - 2, 'RE-GRIP', { fontSize: '10px', fill: COLORS_HEX.brightGreen, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(200, y - 12, '(BEST!)', { fontSize: '9px', fill: COLORS_HEX.brightGreen }).setOrigin(0.5);
    this.add.text(310, y + 55, 'DANGER', { fontSize: '10px', fill: '#E74C3C' }).setOrigin(0.5);

    y += 100;
    this.add.text(w/2, y, 'Survive 8 seconds to advance!\nBull gets angrier each stage.', {
      fontSize: '14px', fill: '#FFFFFF', align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);

    y += 50;
    this.add.text(30, y, 'TIPS:', { fontSize: '15px', fill: COLORS_HEX.goldYellow, fontStyle: 'bold' });
    y += 24;
    const tips = [
      '- Release BEFORE the big buck',
      '- Re-grip at the TOP, not bottom',
      '- Low grip meter = more points!'
    ];
    tips.forEach(t => {
      this.add.text(30, y, t, { fontSize: '13px', fill: '#FFFFFF' });
      y += 22;
    });

    y += 15;
    // GOT IT button
    const btnY = Math.min(y, h - 60);
    const btnBg = this.add.rectangle(w/2, btnY, 260, 54, COLORS.bullRed).setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(3, COLORS.goldYellow);
    const btnText = this.add.text(w/2, btnY, "GOT IT! LET'S RIDE!", {
      fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Full screen fallback tap zone
    const fallback = this.add.rectangle(w/2, btnY, w, 100, 0x000000, 0).setInteractive();

    const handleClose = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    btnBg.on('pointerdown', handleClose);
    fallback.on('pointerdown', handleClose);
  }
}
