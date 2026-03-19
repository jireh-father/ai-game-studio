// Copycat Killer - UI Scenes

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, COLORS.background);

    // Title
    this.add.text(w/2, h * 0.22, 'COPYCAT\nKILLER', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#FFFFFF', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    this.add.text(w/2, h * 0.36, 'Can you outrun your past self?', {
      fontSize: '13px', fontFamily: 'monospace', color: '#9999BB'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(w/2, h * 0.52, 220, 60, 0xFF4422, 1).setInteractive();
    this.add.text(w/2, h * 0.52, 'PLAY', {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.startGame());
    playBtn.on('pointerdown', () => this.startGame());

    // High score
    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(w/2, h * 0.64, 'BEST: ' + hs, {
        fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
      }).setOrigin(0.5);
    }

    // Help button
    const helpBtn = this.add.rectangle(w - 44, h - 44, 50, 50, 0x333355, 1).setInteractive();
    this.add.text(w - 44, h - 44, '?', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.showHelp());
    helpBtn.on('pointerdown', () => this.showHelp());

    // Floating ghosts animation
    for (let i = 0; i < 4; i++) {
      const gx = 60 + Math.random() * (w - 120);
      const gy = h * 0.7 + Math.random() * (h * 0.2);
      const ghost = this.add.image(gx, gy, 'ghost').setAlpha(0.25).setScale(1.5);
      this.tweens.add({
        targets: ghost, y: gy - 30, alpha: 0.1, duration: 2000 + i * 500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
  }

  startGame() {
    GameState.reset();
    this.scene.stop('MenuScene');
    this.scene.start('GameScene');
  }

  showHelp() {
    this.scene.pause('MenuScene');
    this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x0A0A12, 0.95);

    let y = 40;
    this.add.text(w/2, y, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    y += 40;
    this.add.text(w/2, y, 'Dodge ghosts of your past self!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#9999BB'
    }).setOrigin(0.5);

    // Controls illustration
    y += 35;
    this.add.text(20, y, 'CONTROLS', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700'
    });
    y += 24;
    // Draw drag illustration
    const finger = this.add.circle(60, y + 20, 10, 0xFFD0A0);
    const playerDemo = this.add.image(240, y + 20, 'player').setScale(1.5);
    const line = this.add.graphics();
    line.lineStyle(2, 0x44AAFF, 0.6);
    line.beginPath();
    line.moveTo(80, y + 18);
    line.lineTo(120, y + 10);
    line.lineTo(160, y + 22);
    line.lineTo(200, y + 12);
    line.lineTo(228, y + 20);
    line.strokePath();
    this.add.text(w/2, y + 45, 'Drag anywhere to move', {
      fontSize: '12px', fontFamily: 'monospace', color: '#9999BB'
    }).setOrigin(0.5);

    // Ghost timeline
    y += 70;
    this.add.text(20, y, 'GHOST TIMELINE', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700'
    });
    y += 28;
    const tl = this.add.graphics();
    tl.lineStyle(1, 0x333366);
    tl.beginPath(); tl.moveTo(30, y + 40); tl.lineTo(w - 30, y + 40); tl.strokePath();
    this.add.text(30, y + 48, '0s', { fontSize: '11px', fontFamily: 'monospace', color: '#666688' });
    this.add.text(w/2 - 10, y + 48, '5s', { fontSize: '11px', fontFamily: 'monospace', color: '#666688' });
    this.add.text(w - 50, y + 48, '10s', { fontSize: '11px', fontFamily: 'monospace', color: '#666688' });
    this.add.image(50, y + 15, 'player').setScale(1.2);
    this.add.text(68, y + 10, 'YOU', { fontSize: '10px', fontFamily: 'monospace', color: '#FFFFFF' });
    this.add.image(w/2, y + 25, 'ghost').setAlpha(0.6).setScale(1.2);
    this.add.text(w/2 + 16, y + 20, 'GHOST', { fontSize: '10px', fontFamily: 'monospace', color: '#44AAFF' });

    // Rules
    y += 75;
    this.add.text(20, y, 'RULES', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700'
    });
    y += 22;
    const rules = [
      '- Ghosts copy your moves 5s later',
      '- Stay still = poison zone expands',
      '- Obstacles fall from the top',
      '- One hit = dead. Be quick!',
      '- Near-misses score bonus points'
    ];
    rules.forEach(r => {
      this.add.text(24, y, r, { fontSize: '12px', fontFamily: 'monospace', color: '#CCCCDD' });
      y += 20;
    });

    // Tips
    y += 8;
    this.add.text(20, y, 'TIPS', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700'
    });
    y += 22;
    const tips = [
      '1. Move in wide loops',
      '2. Watch where you WERE',
      '3. Near-misses = more points'
    ];
    tips.forEach(t => {
      this.add.text(24, y, t, { fontSize: '12px', fontFamily: 'monospace', color: '#88CCFF' });
      y += 20;
    });

    // Got it button - fixed to bottom
    const btnY = Math.min(y + 30, h - 50);
    const gotBtn = this.add.rectangle(w/2, btnY, 280, 52, 0xFF4422).setInteractive();
    this.add.text(w/2, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.dismiss());
    gotBtn.on('pointerdown', () => this.dismiss());

    // Fullscreen fallback tap
    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setInteractive().setDepth(-1)
      .on('pointerdown', () => {});
  }

  dismiss() {
    this.scene.stop('HelpScene');
    this.scene.resume(this.returnTo);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x660011, 0.6);

    const msg = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    this.add.text(w/2, h * 0.22, msg, {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#FFFFFF', align: 'center', wordWrap: { width: 320 }
    }).setOrigin(0.5);

    // Score
    this.add.text(w/2, h * 0.34, 'SCORE: ' + GameState.score, {
      fontSize: '34px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    // High score
    const isNewBest = GameState.score >= GameState.highScore && GameState.score > 0;
    const hsText = isNewBest ? 'NEW BEST!' : 'BEST: ' + GameState.highScore;
    const hsLabel = this.add.text(w/2, h * 0.42, hsText, {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5);
    if (isNewBest) {
      this.tweens.add({ targets: hsLabel, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    this.add.text(w/2, h * 0.48, 'STAGE REACHED: ' + GameState.stage, {
      fontSize: '14px', fontFamily: 'monospace', color: '#9999BB'
    }).setOrigin(0.5);

    let btnY = h * 0.58;

    // Continue (ad) button
    if (SessionAdTracker.canContinue()) {
      const contBtn = this.add.rectangle(w/2, btnY, 240, 56, 0x22AA44).setInteractive();
      this.add.text(w/2, btnY, 'CONTINUE (AD)', {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.continueGame());
      contBtn.on('pointerdown', () => this.continueGame());
      btnY += 66;
    }

    // Try again
    const retryBtn = this.add.rectangle(w/2, btnY, 240, 56, 0xFF4422).setInteractive();
    this.add.text(w/2, btnY, 'TRY AGAIN', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.retry());
    retryBtn.on('pointerdown', () => this.retry());
    btnY += 60;

    // Menu
    const menuBtn = this.add.rectangle(w/2, btnY, 140, 44, 0x333355).setInteractive();
    this.add.text(w/2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.goMenu());
    menuBtn.on('pointerdown', () => this.goMenu());

    SessionAdTracker.recordDeath();
  }

  continueGame() {
    SessionAdTracker.useContinue();
    AdsManager.triggerRewarded(() => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene', { continued: true });
    }, () => {});
  }

  retry() {
    if (SessionAdTracker.shouldShowInterstitial()) {
      AdsManager.triggerInterstitial(() => this.doRetry());
    } else {
      this.doRetry();
    }
  }

  doRetry() {
    GameState.reset();
    this.scene.stop('GameOverScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
  }

  goMenu() {
    GameState.reset();
    this.scene.stop('GameOverScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
