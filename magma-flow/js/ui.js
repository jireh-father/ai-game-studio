// ui.js — UI Scene (HUD, title, game over, overlays)
class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) {
    this.stageNum = data.stage || 1;
    this.currentScore = data.score || 0;
    this.displayScore = data.score || 0;
    this.timeRatio = 1;
    this.comboStreak = data.combo || 0;
  }

  create() {
    // HUD background
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(CONFIG.COL_HUD_BG, 0.7);
    this.hudBg.fillRect(0, 0, 360, 50);

    // Stage label
    this.stageText = this.add.text(12, 15, `Stage ${this.stageNum}`, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: CONFIG.COL_SCORE
    });

    // Title
    this.titleLabel = this.add.text(180, 15, 'MAGMA FLOW', {
      fontSize: '18px', fontFamily: 'Arial Black, sans-serif', color: '#FF4500',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Score
    this.scoreText = this.add.text(348, 15, `${this.currentScore}`, {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif', color: CONFIG.COL_SCORE,
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Timer bar
    this.timerBar = this.add.graphics();
    this.drawTimerBar(1);

    // Countdown text
    this.countdownText = this.add.text(180, 360, '', {
      fontSize: '64px', fontFamily: 'Arial Black, sans-serif', color: '#FF4500',
      fontStyle: 'bold', stroke: '#FFD700', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.setupEvents();
  }

  setupEvents() {
    const game = this.scene.get('GameScene');
    if (!game) return;

    game.events.on('countdown', (num) => {
      if (num > 0) {
        this.countdownText.setText(num.toString()).setAlpha(1).setScale(1.5);
        this.tweens.add({ targets: this.countdownText, scale: 1, alpha: 0.3, duration: 800, ease: 'Power2' });
      } else {
        this.countdownText.setText('FLOW!').setAlpha(1).setScale(2);
        this.tweens.add({ targets: this.countdownText, scale: 0.5, alpha: 0, duration: 500, ease: 'Power2' });
      }
    });

    game.events.on('timerUpdate', (ratio) => {
      this.timeRatio = ratio;
      this.drawTimerBar(ratio);
    });

    game.events.on('stageClear', (data) => this.showStageClear(data));
    game.events.on('stageFail', (data) => this.showStageFail(data));
    game.events.on('gameOver', (data) => this.showGameOver(data));
    game.events.on('idleWarn', (ms) => this.showIdleWarn(ms));
  }

  drawTimerBar(ratio) {
    this.timerBar.clear();
    const warn = ratio < 0.25;
    this.timerBar.fillStyle(warn ? 0xFF0000 : CONFIG.COL_LAVA_HOT, 1);
    this.timerBar.fillRect(0, 50, 360 * Math.max(0, ratio), 8);
    if (warn && Math.floor(this.time.now / 300) % 2 === 0) {
      this.timerBar.fillStyle(0xFF3333, 0.5);
      this.timerBar.fillRect(0, 50, 360 * Math.max(0, ratio), 8);
    }
  }

  animateScore(target) {
    this.tweens.addCounter({
      from: this.displayScore, to: target, duration: 800, ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        this.displayScore = Math.floor(tw.getValue());
        this.scoreText.setText(this.displayScore.toString());
      }
    });
    // Scale punch
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  showFloatingText(x, y, text, color, size) {
    const ft = this.add.text(x, y, text, {
      fontSize: `${size || 22}px`, fontFamily: 'Arial Black, sans-serif',
      color: color || '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.tweens.add({ targets: ft, y: y - 50, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => ft.destroy() });
  }

  showStageClear(data) {
    this.animateScore(data.total);

    // Flash
    this.cameras.main.flash(200, 255, 140, 0);

    // Center text
    const clearText = this.add.text(180, 300, 'STAGE CLEAR!', {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif', color: '#FFD700',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: clearText, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });

    // Bonuses
    let dy = 0;
    if (data.speedBonus > 0) {
      this.time.delayedCall(400, () => this.showFloatingText(180, 370 + dy, `+SPEED BONUS +${data.speedBonus}`, '#FFFF00', 18));
      dy += 30;
    }
    if (data.effBonus > 0) {
      this.time.delayedCall(600, () => this.showFloatingText(180, 370 + dy, `+EFFICIENCY +${data.effBonus}`, '#00FF88', 18));
      dy += 30;
    }
    if (data.mult > 1) {
      const comboNames = { 1.2: 'NICE', 1.5: 'HOT', 2.0: 'INFERNO' };
      const name = comboNames[data.mult] || 'COMBO';
      const col = data.mult >= 2.0 ? '#FF4500' : data.mult >= 1.5 ? '#FF8C00' : '#FFFFFF';
      this.time.delayedCall(800, () => this.showFloatingText(180, 370 + dy, `${name} x${data.mult}`, col, 28));
    }
  }

  showStageFail(data) {
    // Desaturation overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, 360, 720);
    this.tweens.add({ targets: overlay, alpha: 0.5, duration: 700 });

    const failText = this.add.text(180, 340, 'FAILED', {
      fontSize: '40px', fontFamily: 'Arial Black, sans-serif', color: '#FF3333',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScale(2).setAlpha(0);
    this.tweens.add({ targets: failText, scale: 1, alpha: 1, duration: 300, ease: 'Power3' });

    if (data.fails >= 3) {
      this.time.delayedCall(600, () => {
        this.showFloatingText(180, 400, 'TAP TO SKIP OR RETRY', '#FFD700', 16);
      });
    }
  }

  showIdleWarn(ms) {
    if (!this.idleOverlay) {
      this.idleOverlay = this.add.graphics();
    }
    this.idleOverlay.clear();
    const a = Math.sin(this.time.now * 0.006) * 0.2 + 0.2;
    this.idleOverlay.fillStyle(0xFF0000, a);
    this.idleOverlay.fillRect(0, 0, 360, 720);
  }

  showGameOver(data) {
    // Darken
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 360, 720);
    bg.setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 400 });

    const panel = this.add.container(180, 800);

    const goText = this.add.text(0, -80, 'GAME OVER', {
      fontSize: '38px', fontFamily: 'Arial Black, sans-serif', color: '#FF4500',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(0, -20, `Score: ${data.score}`, {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    const stageLabel = this.add.text(0, 15, `Stage Reached: ${data.stage}`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFD700'
    }).setOrigin(0.5);

    const bestLabel = this.add.text(0, 50, `Best: ${data.best}`, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#AAAAAA'
    }).setOrigin(0.5);

    const tapText = this.add.text(0, 110, 'TAP TO RESTART', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);
    this.tweens.add({ targets: tapText, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

    panel.add([goText, scoreLabel, stageLabel, bestLabel, tapText]);
    this.tweens.add({ targets: panel, y: 360, duration: 400, ease: 'Back.easeOut' });

    // Tap to restart
    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene', { best: data.best });
      });
    });

    // Auto restart after 8s
    this.time.delayedCall(8000, () => {
      if (this.scene.isActive('UIScene')) {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene', { best: data.best });
      }
    });
  }

  update() {
    // Clean idle overlay if not warning
    if (this.idleOverlay) {
      const game = this.scene.get('GameScene');
      if (game && game.idleTimer < CONFIG.IDLE_WARN) {
        this.idleOverlay.clear();
      }
    }
  }
}
