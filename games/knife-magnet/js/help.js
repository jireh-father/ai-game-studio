class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0F1320, 0.97).setDepth(0);

    const content = this.add.container(0, 0);
    let y = 30;

    const title = this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial', color: COLORS_HEX.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    content.add(title);
    y += 40;

    // Section 1: Hold to activate
    const g1 = this.add.graphics();
    g1.lineStyle(2, COLORS.primary, 0.7);
    g1.strokeRoundedRect(w / 2 - 90, y, 180, 100, 10);
    g1.fillStyle(COLORS.bg, 1);
    g1.fillRoundedRect(w / 2 - 89, y + 1, 178, 98, 10);
    content.add(g1);

    // Character inside
    const charCirc = this.add.circle(w / 2 - 40, y + 50, 10, 0xF5C89A);
    content.add(charCirc);
    const charBody = this.add.rectangle(w / 2 - 40, y + 65, 12, 18, 0x4A90D9).setOrigin(0.5, 0);
    content.add(charBody);

    // Magnet ring
    const ring = this.add.graphics();
    ring.lineStyle(2, COLORS.primary, 0.6);
    ring.strokeCircle(w / 2 - 40, y + 50, 35);
    content.add(ring);

    // Arrow showing knife curving
    const arrow = this.add.graphics();
    arrow.lineStyle(3, COLORS.secondary, 0.8);
    arrow.beginPath();
    arrow.moveTo(w / 2 + 60, y + 50);
    arrow.lineTo(w / 2 + 20, y + 48);
    arrow.lineTo(w / 2 - 10, y + 50);
    arrow.strokePath();
    const arrowHead = this.add.triangle(w / 2 - 10, y + 50, 0, -5, 0, 5, -8, 0, COLORS.secondary);
    content.add(arrow);
    content.add(arrowHead);

    // Finger
    const finger = this.add.ellipse(w / 2 + 70, y + 80, 20, 28, 0xF5C89A);
    content.add(finger);
    const holdLabel = this.add.text(w / 2 + 70, y + 98, 'HOLD', {
      fontSize: '10px', fontFamily: 'Arial', color: COLORS_HEX.uiText
    }).setOrigin(0.5);
    content.add(holdLabel);

    y += 110;
    const desc1 = this.add.text(w / 2, y, 'HOLD the screen to activate\nyour magnet. Knives nearby\nwill curve toward you.', {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);
    content.add(desc1);
    y += 60;

    // Section 2: Timing arc
    const arcBg = this.add.rectangle(w / 2, y + 15, 300, 8, 0x2A2F3E);
    content.add(arcBg);
    const tooEarly = this.add.rectangle(w / 2 - 70, y + 15, 80, 12, 0xFF2244, 0.6);
    content.add(tooEarly);
    const catchZone = this.add.rectangle(w / 2 + 10, y + 15, 80, 12, 0x44CC66, 0.8);
    content.add(catchZone);
    const tooLate = this.add.rectangle(w / 2 + 95, y + 15, 90, 12, 0xFF8800, 0.6);
    content.add(tooLate);

    const lbl1 = this.add.text(w / 2 - 70, y, 'TOO EARLY', {
      fontSize: '9px', fontFamily: 'Arial', color: '#FF2244'
    }).setOrigin(0.5);
    content.add(lbl1);
    const lbl2 = this.add.text(w / 2 + 10, y, 'CATCH!', {
      fontSize: '9px', fontFamily: 'Arial', color: '#44CC66'
    }).setOrigin(0.5);
    content.add(lbl2);
    const lbl3 = this.add.text(w / 2 + 95, y, 'TOO LONG', {
      fontSize: '9px', fontFamily: 'Arial', color: '#FF8800'
    }).setOrigin(0.5);
    content.add(lbl3);

    y += 35;
    const desc2 = this.add.text(w / 2, y, 'Release at the right moment.\nToo early = knife flies past\nToo late = knife drops on you', {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);
    content.add(desc2);
    y += 55;

    // Section 3: Cursed knives
    const normalKnife = this.add.image(w / 2 - 50, y + 10, 'knife_normal').setScale(1.2);
    content.add(normalKnife);
    const cursedKnife = this.add.image(w / 2 + 50, y + 10, 'knife_cursed').setScale(1.2);
    content.add(cursedKnife);
    const nlbl = this.add.text(w / 2 - 50, y + 22, 'Normal', {
      fontSize: '10px', fontFamily: 'Arial', color: COLORS_HEX.secondary
    }).setOrigin(0.5);
    content.add(nlbl);
    const clbl = this.add.text(w / 2 + 50, y + 22, 'CURSED!', {
      fontSize: '10px', fontFamily: 'Arial', color: COLORS_HEX.cursed,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    content.add(clbl);

    y += 40;
    const desc3 = this.add.text(w / 2, y, 'CURSED KNIVES (purple glow)\nwill EXPLODE if magnetized.\nRelease before they reach you!', {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);
    content.add(desc3);
    y += 55;

    // Scoring
    const scoreTitle = this.add.text(w / 2, y, 'SCORING', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.reward,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    content.add(scoreTitle);
    y += 20;
    const scoreText = this.add.text(w / 2, y, 'Catch 1 knife = 100 pts\nCatch 2+ in wave = BONUS\nDodge cursed knife = 150 pts\nStreak multiplier up to 4x', {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      align: 'center', lineSpacing: 3
    }).setOrigin(0.5, 0);
    content.add(scoreText);
    y += 65;

    // Tips
    const tipsTitle = this.add.text(w / 2, y, 'TIPS', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    content.add(tipsTitle);
    y += 20;
    const tipsText = this.add.text(w / 2, y,
      '- Watch the knife edge glow\n  for cursed identification\n- In multi-knife waves, the\n  cursed one launches last\n- Wave 5 is always a rest wave', {
      fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.uiText,
      align: 'center', lineSpacing: 3
    }).setOrigin(0.5, 0);
    content.add(tipsText);
    y += 75;

    // Got it button - fixed position near bottom
    const btnY = h - 60;
    const gotItBg = this.add.rectangle(w / 2, btnY, 180, 48, COLORS.primary)
      .setInteractive({ useHandCursor: true });
    const gotItTxt = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    gotItBg.on('pointerdown', () => {
      gotItBg.setScale(0.95);
    });
    gotItBg.on('pointerup', () => {
      gotItBg.setScale(1);
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0)
      .setInteractive();
    fallback.on('pointerup', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
    fallback.setDepth(-1);
  }
}
