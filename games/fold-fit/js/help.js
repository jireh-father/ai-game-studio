// Fold Fit - Help Scene & Pause Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, COLORS_INT.menuBg, 0.96);

    let y = 40;
    this.add.text(width/2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 50;

    // Visual 1: Fold gesture
    const g1 = this.add.graphics();
    g1.fillStyle(COLORS_INT.paper, 1);
    g1.fillRect(width/2 - 60, y, 120, 60);
    g1.lineStyle(2, COLORS_INT.foldLine, 0.8);
    // Dashed line
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) { g1.beginPath(); g1.moveTo(width/2 - 50 + i*10, y+30); g1.lineTo(width/2 - 50 + (i+1)*10, y+30); g1.strokePath(); }
    }
    // Arrow showing swipe
    g1.lineStyle(2, COLORS_INT.success, 1);
    g1.beginPath(); g1.moveTo(width/2 - 20, y+50); g1.lineTo(width/2 + 20, y+10); g1.strokePath();
    // Arrowhead
    g1.fillStyle(COLORS_INT.success, 1);
    g1.fillTriangle(width/2+20, y+10, width/2+12, y+14, width/2+16, y+22);

    y += 72;
    this.add.text(width/2, y, 'Swipe across dotted lines\nto fold the paper', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary, align: 'center'
    }).setOrigin(0.5, 0);
    y += 48;

    // Visual 2: Match target
    const g2 = this.add.graphics();
    g2.fillStyle(COLORS_INT.paper, 1);
    g2.fillRect(width/2 - 80, y, 50, 40);
    g2.lineStyle(2, COLORS_INT.uiText, 0.5);
    g2.strokeRect(width/2 - 80, y, 50, 40);
    // Arrow
    g2.lineStyle(2, COLORS_INT.uiSecondary, 1);
    g2.beginPath(); g2.moveTo(width/2 - 20, y+20); g2.lineTo(width/2 + 10, y+20); g2.strokePath();
    g2.fillStyle(COLORS_INT.uiSecondary, 1);
    g2.fillTriangle(width/2+10, y+20, width/2+4, y+14, width/2+4, y+26);
    // Target silhouette
    g2.fillStyle(COLORS_INT.target, 0.3);
    g2.fillRect(width/2 + 20, y, 50, 40);
    g2.lineStyle(2, COLORS_INT.target, 0.8);
    g2.strokeRect(width/2 + 20, y, 50, 40);

    y += 52;
    this.add.text(width/2, y, 'Match the folded paper\nto the target shape', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary, align: 'center'
    }).setOrigin(0.5, 0);
    y += 48;

    // Visual 3: Wrong fold diamonds
    for (let i = 0; i < 3; i++) {
      const key = i < 1 ? 'diamondFilled' : 'diamondEmpty';
      this.add.image(width/2 - 30 + i * 30, y + 12, key).setScale(1);
    }
    y += 36;
    this.add.text(width/2, y, '3 wrong folds = paper tears!\nGame over.', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary, align: 'center'
    }).setOrigin(0.5, 0);
    y += 50;

    // Rules
    this.add.text(width/2, y, 'RULES', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 28;

    const rules = [
      'Fold the paper to match the target',
      'Each stage has a timer — fold fast!',
      'Wrong folds carry across entire run',
      'Later stages: distractors & order matters'
    ];
    rules.forEach(r => {
      this.add.text(width/2, y, `· ${r}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary, wordWrap: { width: width - 60 } }).setOrigin(0.5, 0);
      y += 22;
    });
    y += 10;

    // Tips
    this.add.text(width/2, y, 'TIPS', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 28;

    const tips = [
      'Mentally trace the fold before swiping',
      'Swipe direction decides which side folds',
      'Early stages: two-finger tap to undo'
    ];
    tips.forEach(t => {
      this.add.text(width/2, y, `💡 ${t}`, { fontSize: '13px', fontFamily: 'Georgia, serif', color: COLORS.success, wordWrap: { width: width - 60 } }).setOrigin(0.5, 0);
      y += 22;
    });
    y += 20;

    // Full-screen fallback tap zone — ensures player can always dismiss help
    const fallbackZone = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0).setInteractive({ useHandCursor: false }).setDepth(0);
    fallbackZone.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Got it button — fixed to canvas bottom so it never falls off-screen
    const btnY = height - 80;
    const gotBtn = this.add.rectangle(width/2, btnY, 160, 46, COLORS_INT.target).setInteractive({ useHandCursor: true }).setDepth(1);
    this.add.text(width/2, btnY, 'GOT IT!', { fontSize: '20px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold' }).setOrigin(0.5).setDepth(1);
    gotBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, COLORS_INT.menuBg, 0.85);

    this.add.text(width/2, height * 0.25, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnData = [
      { label: 'RESUME', y: 0.42, color: COLORS_INT.target, action: () => { this.scene.stop(); this.scene.resume('GameScene'); } },
      { label: '? HELP', y: 0.52, color: COLORS_INT.uiSecondary, action: () => { this.scene.stop(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); } },
      { label: 'RESTART', y: 0.62, color: COLORS_INT.uiSecondary, action: () => { GameState.reset(); AdManager.reset(); this.scene.stop(); this.scene.start('GameScene'); } },
      { label: 'MENU', y: 0.72, color: COLORS_INT.uiSecondary, action: () => { GameState.reset(); AdManager.reset(); this.scene.stop(); this.scene.start('MenuScene'); } }
    ];

    btnData.forEach(b => {
      const btn = this.add.rectangle(width/2, height * b.y, 180, 46, b.color).setInteractive({ useHandCursor: true });
      this.add.text(width/2, height * b.y, b.label, { fontSize: '18px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold' }).setOrigin(0.5);
      btn.on('pointerdown', b.action);
    });
  }
}
