// ui.js — MenuScene, GameOverScene, HowToPlayScene, HUD helpers

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1410);

    // Decorative tiles in background
    for (let i = 0; i < 6; i++) {
      const tx = 40 + Math.random() * 280;
      const ty = 120 + Math.random() * 300;
      this.add.image(tx, ty, 'tile-normal').setDisplaySize(48, 48).setAlpha(0.15).setAngle(Math.random() * 20 - 10);
    }

    // Title
    this.add.text(cx, 160, 'SHRINKING\nSTAGE', {
      fontSize: '42px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT,
      align: 'center', lineSpacing: 8, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, 240, 'Keep them on stage!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fill: '#B0A080',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Performer preview
    this.add.image(cx, 310, 'performer').setScale(1.5);

    // Play button
    const playBtn = this.add.rectangle(cx, 400, 280, 64, 0x3D0B10, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0xFAF5E8);
    const playTxt = this.add.text(cx, 400, 'PLAY', {
      fontSize: '28px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // How to play button
    const helpBtn = this.add.rectangle(50, GAME_HEIGHT - 50, 56, 56, 0x3D0B10, 1).setInteractive({ useHandCursor: true });
    helpBtn.setStrokeStyle(2, 0xFAF5E8);
    this.add.text(50, GAME_HEIGHT - 50, '?', {
      fontSize: '28px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      this.scene.start('HowToPlayScene', { returnTo: 'MenuScene' });
    });

    // High score display
    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(cx, 480, `Best: ${hs}`, {
        fontSize: '18px', fontFamily: 'Georgia, serif', fill: COLORS.NEAR_MISS_FLASH
      }).setOrigin(0.5);
      this.add.text(cx, 502, `Stage ${GameState.highestStage}`, {
        fontSize: '14px', fontFamily: 'Georgia, serif', fill: '#B0A080'
      }).setOrigin(0.5);
    }

    // Sound toggle
    const soundIcon = GameState.soundEnabled ? 'Sound ON' : 'Sound OFF';
    const soundBtn = this.add.text(GAME_WIDTH - 16, 16, soundIcon, {
      fontSize: '13px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', () => {
      GameState.soundEnabled = !GameState.soundEnabled;
      soundBtn.setText(GameState.soundEnabled ? 'Sound ON' : 'Sound OFF');
    });
  }
}

class HowToPlayScene extends Phaser.Scene {
  constructor() { super('HowToPlayScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1410);

    let y = 40;
    // Header
    this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    y += 50;
    this.add.text(cx, y, 'SWIPE to push your performer', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    // Swipe direction diagram
    y += 40;
    const g = this.add.graphics();
    g.lineStyle(3, 0xFFD700, 1);
    // Up arrow
    g.moveTo(cx, y + 10); g.lineTo(cx, y - 20);
    g.moveTo(cx - 8, y - 12); g.lineTo(cx, y - 20); g.lineTo(cx + 8, y - 12);
    // Down arrow
    g.moveTo(cx, y + 50); g.lineTo(cx, y + 80);
    g.moveTo(cx - 8, y + 72); g.lineTo(cx, y + 80); g.lineTo(cx + 8, y + 72);
    // Left arrow
    g.moveTo(cx - 20, y + 30); g.lineTo(cx - 50, y + 30);
    g.moveTo(cx - 42, y + 22); g.lineTo(cx - 50, y + 30); g.lineTo(cx - 42, y + 38);
    // Right arrow
    g.moveTo(cx + 20, y + 30); g.lineTo(cx + 50, y + 30);
    g.moveTo(cx + 42, y + 22); g.lineTo(cx + 50, y + 30); g.lineTo(cx + 42, y + 38);
    g.strokePath();

    this.add.image(cx, y + 30, 'performer').setScale(0.8);

    y += 110;
    this.add.text(cx, y, 'Longer swipe = more force', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fill: '#B0A080'
    }).setOrigin(0.5);

    // Force diagram
    y += 30;
    const g2 = this.add.graphics();
    g2.lineStyle(2, 0xFFD700, 0.7);
    g2.moveTo(cx - 80, y); g2.lineTo(cx - 40, y);
    g2.moveTo(cx - 48, y - 5); g2.lineTo(cx - 40, y); g2.lineTo(cx - 48, y + 5);
    g2.strokePath();
    this.add.text(cx - 20, y, 'nudge', { fontSize: '12px', fill: '#B0A080', fontFamily: 'Georgia, serif' }).setOrigin(0, 0.5);

    y += 24;
    g2.lineStyle(3, 0xFFD700, 1);
    g2.moveTo(cx - 80, y); g2.lineTo(cx + 20, y);
    g2.moveTo(cx + 12, y - 6); g2.lineTo(cx + 20, y); g2.lineTo(cx + 12, y + 6);
    g2.strokePath();
    this.add.text(cx + 30, y, 'PUSH!', { fontSize: '14px', fill: COLORS.NEAR_MISS_FLASH, fontFamily: 'Georgia, serif', fontStyle: 'bold' }).setOrigin(0, 0.5);

    y += 45;
    this.add.text(cx, y, 'SURVIVE the collapse!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mini grid diagram
    y += 35;
    const ts = 32;
    const gx = cx - ts * 1.5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 2 && c === 2) {
          // Gap
          this.add.rectangle(gx + c * (ts + 2) + ts / 2, y + r * (ts + 2) + ts / 2, ts, ts, 0x1A1410)
            .setStrokeStyle(1, 0x444444);
        } else if (r === 2 && c === 1) {
          this.add.image(gx + c * (ts + 2) + ts / 2, y + r * (ts + 2) + ts / 2, 'tile-warning').setDisplaySize(ts, ts);
        } else {
          this.add.image(gx + c * (ts + 2) + ts / 2, y + r * (ts + 2) + ts / 2, 'tile-normal').setDisplaySize(ts, ts);
        }
        if (r === 1 && c === 1) {
          this.add.image(gx + c * (ts + 2) + ts / 2, y + r * (ts + 2) + ts / 2, 'performer').setScale(0.5);
        }
      }
    }

    y += 120;
    this.add.text(cx, y, 'TIPS:', {
      fontSize: '15px', fontFamily: 'Georgia, serif', fill: COLORS.NEAR_MISS_FLASH, fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 22;
    const tips = [
      '- Short swipes for control',
      '- Orange tiles are about to go!',
      '- Stay near center, but keep moving!',
      '- Standing still = spotlight burn death!'
    ];
    tips.forEach(t => {
      this.add.text(cx, y, t, { fontSize: '13px', fontFamily: 'Georgia, serif', fill: '#B0A080' }).setOrigin(0.5);
      y += 20;
    });

    // Got it button — fixed at bottom
    y = GAME_HEIGHT - 60;
    const gotItBtn = this.add.rectangle(cx, y, 240, 52, 0x3D0B10, 1).setInteractive({ useHandCursor: true });
    gotItBtn.setStrokeStyle(2, 0xFAF5E8);
    this.add.text(cx, y, 'Got it!', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    gotItBtn.on('pointerdown', () => {
      if (this.returnTo === 'GameScene') {
        this.scene.stop();
        this.scene.resume('GameScene');
      } else {
        this.scene.start('MenuScene');
      }
    });

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(cx, y, GAME_WIDTH, 100, 0x000000, 0).setInteractive();
    fallback.on('pointerdown', () => gotItBtn.emit('pointerdown'));
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isHighScore = data.isHighScore || false;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1A1410, 0.85);

    this.add.text(cx, 100, 'CURTAIN CALL', {
      fontSize: '32px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animated score count-up
    const scoreText = this.add.text(cx, 180, '0', {
      fontSize: '48px', fontFamily: 'Georgia, serif', fill: COLORS.NEAR_MISS_FLASH, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 600,
      onUpdate: (tween) => { scoreText.setText(Math.floor(tween.getValue()).toString()); }
    });

    if (this.isHighScore) {
      this.add.text(cx, 225, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Georgia, serif', fill: COLORS.NEAR_MISS_FLASH, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.image(cx, 225 - 30, 'star').setScale(0.5).setAlpha(0.8);
    }

    this.add.text(cx, 260, `Stage Reached: ${this.stageReached}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', fill: '#B0A080'
    }).setOrigin(0.5);

    let btnY = 320;

    // Continue button (ad)
    if (AdsManager.canContinue()) {
      const contBtn = this.add.rectangle(cx, btnY, 280, 56, 0x2D6B2D, 1).setInteractive({ useHandCursor: true });
      contBtn.setStrokeStyle(2, 0xFAF5E8);
      this.add.text(cx, btnY, 'Continue (Watch Ad)', {
        fontSize: '18px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        AdsManager.showContinuePrompt(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continueFromStage: this.stageReached, continueScore: this.finalScore });
        }, null);
      });
      btnY += 70;
    }

    // Play Again
    const playBtn = this.add.rectangle(cx, btnY, 280, 56, 0x3D0B10, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0xFAF5E8);
    this.add.text(cx, btnY, 'Play Again', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 65;

    // Menu
    const menuBtn = this.add.rectangle(cx, btnY, 280, 52, 0x000000, 0).setInteractive({ useHandCursor: true });
    menuBtn.setStrokeStyle(2, 0x888888);
    this.add.text(cx, btnY, 'Menu', {
      fontSize: '18px', fontFamily: 'Georgia, serif', fill: '#888888'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdsManager.onGameOver(this.finalScore, this.stageReached);
  }
}

// HUD helper functions used by GameScene
function createFloatingText(scene, x, y, text, color, size, riseY, duration) {
  const t = scene.add.text(x, y, text, {
    fontSize: size + 'px', fontFamily: 'Georgia, serif', fill: color, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(100);
  scene.tweens.add({
    targets: t, y: y - riseY, alpha: 0, duration: duration,
    ease: 'Power1', onComplete: () => t.destroy()
  });
  return t;
}
