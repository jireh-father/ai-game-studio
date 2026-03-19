// ui.js — MenuScene, GameOverScene, HelpScene, HUD

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // Brain icon
    this.add.image(WIDTH / 2, 120, 'brain').setScale(1.2);

    // Title
    this.add.text(WIDTH / 2, 200, 'WRONG\nANSWER', {
      fontSize: '52px', fontFamily: 'Arial Black, sans-serif', fontStyle: 'bold',
      color: COLORS.DEATH_RED, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(WIDTH / 2, 280, 'The correct answer kills you.', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    // High score
    const hs = GameState.highScore || 0;
    this.add.text(WIDTH / 2, 310, 'BEST: ' + hs, {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(WIDTH / 2, 380, 280, 60, 0x00F5D4, 1).setInteractive();
    this.add.text(WIDTH / 2, 380, 'PLAY', {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif', fontStyle: 'bold', color: COLORS.BG
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      GameState.reset();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // How to play button
    const helpBtn = this.add.circle(60, HEIGHT - 60, 28, 0x2E4057, 1).setInteractive();
    this.add.text(60, HEIGHT - 60, '?', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const soundIcon = this.add.text(WIDTH - 40, 30, GameState.soundEnabled ? 'ON' : 'OFF', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
    }).setOrigin(0.5).setInteractive();

    soundIcon.on('pointerdown', () => {
      GameState.soundEnabled = !GameState.soundEnabled;
      soundIcon.setText(GameState.soundEnabled ? 'ON' : 'OFF');
      LocalStorage.save();
    });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    // Dark overlay
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0D1B2A, 0.95);

    let y = 40;
    this.add.text(WIDTH / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', fontStyle: 'bold', color: COLORS.ACCENT_TEAL
    }).setOrigin(0.5);

    y += 50;
    // Example question
    this.add.rectangle(WIDTH / 2, y, 280, 50, 0xF5F0E8, 1).setStrokeStyle(2, 0xC8C0B0);
    this.add.text(WIDTH / 2, y, 'What is 2 + 2?', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#0D1B2A'
    }).setOrigin(0.5);

    y += 50;
    // Example buttons
    const bw = 80, bh = 45, gap = 10;
    const startX = WIDTH / 2 - bw - gap;

    // Safe answer
    this.add.rectangle(startX, y, bw, bh, 0x2DC653, 1);
    this.add.text(startX, y - 5, '5', { fontSize: '20px', fontFamily: 'Arial Black', color: '#FFF' }).setOrigin(0.5);
    this.add.text(startX, y + 18, 'SAFE', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);

    // Death answer
    this.add.rectangle(WIDTH / 2, y, bw, bh, 0xE63946, 1);
    this.add.text(WIDTH / 2, y - 5, '4', { fontSize: '20px', fontFamily: 'Arial Black', color: '#FFF' }).setOrigin(0.5);
    this.add.text(WIDTH / 2, y + 18, 'DEATH', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);

    // Safe answer
    this.add.rectangle(startX + 2 * (bw + gap), y, bw, bh, 0x2DC653, 1);
    this.add.text(startX + 2 * (bw + gap), y - 5, '7', { fontSize: '20px', fontFamily: 'Arial Black', color: '#FFF' }).setOrigin(0.5);
    this.add.text(startX + 2 * (bw + gap), y + 18, 'SAFE', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF' }).setOrigin(0.5);

    y += 50;
    this.add.text(WIDTH / 2, y, 'WRONG = RIGHT', {
      fontSize: '24px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.STREAK_GOLD
    }).setOrigin(0.5);

    y += 35;
    this.add.text(WIDTH / 2, y, 'Choose the WRONG answer to survive!\nThe correct answer = instant death.', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT,
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    y += 50;
    const rules = [
      '  Timer runs out = death',
      '  Survive more = bigger streak bonus',
      '  Faster tap = more points'
    ];
    rules.forEach(r => {
      this.add.text(30, y, r, {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
      });
      y += 24;
    });

    y += 10;
    this.add.text(30, y, 'TIPS:', {
      fontSize: '16px', fontFamily: 'Arial Black', color: COLORS.ACCENT_TEAL
    });
    y += 24;
    const tips = [
      '1. Trust your confusion — instinct\n   will betray you at high speed!',
      '2. Look at ALL answers before tapping.',
      '3. Speed bonus: tap in first half of\n   timer for +75 to +150 bonus points.'
    ];
    tips.forEach(t => {
      this.add.text(30, y, t, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT, lineSpacing: 2
      });
      y += t.includes('\n') ? 38 : 22;
    });

    // Got it button — fixed position from bottom
    const gotItY = HEIGHT - 60;
    const gotItBtn = this.add.rectangle(WIDTH / 2, gotItY, 200, 50, 0x00F5D4, 1).setInteractive();
    this.add.text(WIDTH / 2, gotItY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.BG
    }).setOrigin(0.5);

    // Fullscreen fallback tap zone
    const fullZone = this.add.rectangle(WIDTH / 2, gotItY, WIDTH, 80, 0x000000, 0).setInteractive();
    fullZone.setDepth(-1);

    const closeHelp = () => {
      this.scene.stop('HelpScene');
      this.scene.resume(this.returnTo);
    };

    gotItBtn.on('pointerdown', closeHelp);
    fullZone.on('pointerdown', closeHelp);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.deathReason = data.reason || 'correct';
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.bestStreak = data.bestStreak || 0;
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    ADS.trackGameOver();

    // Death reason
    const msg = this.deathReason === 'timeout'
      ? TIMEOUT_MESSAGES[Math.floor(Math.random() * TIMEOUT_MESSAGES.length)]
      : DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];

    this.add.text(WIDTH / 2, 70, msg, {
      fontSize: '22px', fontFamily: 'Arial Black', fontStyle: 'bold',
      color: COLORS.DEATH_RED, align: 'center', wordWrap: { width: 300 }
    }).setOrigin(0.5);

    // Animated score count-up
    const scoreText = this.add.text(WIDTH / 2, 140, '0', {
      fontSize: '52px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.STREAK_GOLD
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 1000, ease: 'Cubic.easeOut',
      onUpdate: (tween) => { scoreText.setText(Math.floor(tween.getValue())); }
    });

    // New record check
    const isNewRecord = this.finalScore > GameState.highScore;
    if (isNewRecord) {
      GameState.highScore = this.finalScore;
    }
    if (this.stageReached > GameState.bestStage) {
      GameState.bestStage = this.stageReached;
    }
    LocalStorage.save();

    if (isNewRecord) {
      const nr = this.add.text(WIDTH / 2, 195, 'NEW RECORD!', {
        fontSize: '22px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.STREAK_GOLD
      }).setOrigin(0.5).setScale(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.1, scaleY: 1.1, duration: 300, ease: 'Back.easeOut', yoyo: true, repeat: -1, hold: 600 });
    }

    let y = 230;
    this.add.text(WIDTH / 2, y, 'Stage Reached: ' + this.stageReached, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
    }).setOrigin(0.5);
    y += 28;
    this.add.text(WIDTH / 2, y, 'Best Streak: ' + this.bestStreak, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    y += 50;

    // Continue button (if available)
    if (ADS.canContinue()) {
      const contBtn = this.add.rectangle(WIDTH / 2, y, 280, 50, 0xFF6B35, 1).setInteractive();
      this.add.text(WIDTH / 2, y, 'WATCH AD TO CONTINUE', {
        fontSize: '16px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        ADS.showRewarded('continue', () => {
          this.scene.stop('GameOverScene');
          this.scene.start('GameScene', { continuing: true });
        });
      });
      y += 65;
    }

    // Play again
    const playBtn = this.add.rectangle(WIDTH / 2, y, 280, 50, 0x00F5D4, 1).setInteractive();
    this.add.text(WIDTH / 2, y, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.BG
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      GameState.reset();
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    y += 65;

    // Menu
    const menuBtn = this.add.rectangle(WIDTH / 2, y, 280, 45, 0x2E4057, 1).setInteractive();
    this.add.text(WIDTH / 2, y, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Interstitial check
    if (ADS.shouldShowInterstitial()) {
      ADS.showInterstitial();
    }
  }
}
