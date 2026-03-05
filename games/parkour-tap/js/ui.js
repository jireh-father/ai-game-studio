// ui.js - MenuScene, GameOverScene, UIScene (HUD overlay), PauseOverlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);

    this.add.text(w / 2, h * 0.18, 'PARKOUR TAP', {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS_HEX.RUNNER
    }).setOrigin(0.5);

    // Animated runner
    const runner = this.add.image(w / 2, h * 0.38, 'runner').setScale(2);
    this.tweens.add({
      targets: runner, y: h * 0.38 - 8, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Play button
    const btnBg = this.add.rectangle(w / 2, h * 0.56, 180, 54, COLORS.RUNNER, 1)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w / 2, h * 0.56, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    btnTxt.disableInteractive();
    btnBg.on('pointerdown', () => {
      SFX.resume(); SFX.play('click');
      this.scene.start('GameScene');
    });
    this.tweens.add({
      targets: [btnBg, btnTxt], scaleX: 1.05, scaleY: 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // High score
    const hs = localStorage.getItem('parkour-tap_high_score') || 0;
    this.add.text(w / 2, h * 0.68, 'Best: ' + hs, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.TEXT
    }).setOrigin(0.5);

    // Help button
    const helpBg = this.add.rectangle(40, h - 40, 40, 40, COLORS.GROUND, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(40, h - 40, '?', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).disableInteractive();
    helpBg.on('pointerdown', () => {
      SFX.play('click');
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }
  create() {
    this.scoreText = null; this.stageText = null;
    this.comboText = null; this.lifeIcons = [];
    this.setupHUD();
    this.scene.get('GameScene').events.on('score-update', this.updateScore, this);
    this.scene.get('GameScene').events.on('stage-clear', this.updateStage, this);
    this.scene.get('GameScene').events.on('combo-update', this.updateCombo, this);
    this.scene.get('GameScene').events.on('life-change', this.updateLives, this);
    this.scene.get('GameScene').events.on('show-perfect', this.showPerfect, this);
    this.events.on('shutdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.events.off('score-update').off('stage-clear')
        .off('combo-update').off('life-change').off('show-perfect');
    });
  }
  setupHUD() {
    const w = this.cameras.main.width;
    this.scoreText = this.add.text(16, 12, '0', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.TEXT
    }).setDepth(10);
    this.stageText = this.add.text(w / 2, 12, 'Stage 1', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.TEXT
    }).setOrigin(0.5, 0).setDepth(10);
    this.comboText = this.add.text(w / 2, 50, '', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.COMBO_GLOW
    }).setOrigin(0.5, 0).setDepth(10).setAlpha(0);
    this.lifeIcons = [];
    for (let i = 0; i < LIVES_MAX; i++) {
      const icon = this.add.image(w - 30 - i * 24, 22, 'life').setScale(1.2).setDepth(10);
      this.lifeIcons.push(icon);
    }
    // Pause button
    const pauseBtn = this.add.rectangle(w - 20, 60, 30, 30, COLORS.GROUND, 0.5)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(w - 20, 60, '||', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(10).disableInteractive();
    pauseBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.scene.get('GameScene').pauseGame();
    });
  }
  updateScore(score) {
    if (!this.scoreText) return;
    this.scoreText.setText(score);
    Effects.scalePunch(this.scoreText, 1.4, 120);
  }
  updateStage(stage) {
    if (!this.stageText) return;
    this.stageText.setText('Stage ' + stage);
  }
  updateCombo(combo) {
    if (!this.comboText) return;
    if (combo >= 2) {
      const mult = 1 + Math.floor(combo / 5) * 0.5;
      const sz = Math.min(40, 20 + combo * 0.5);
      this.comboText.setText('x' + mult.toFixed(1) + ' COMBO!');
      this.comboText.setFontSize(sz + 'px');
      this.comboText.setAlpha(1);
      if (this.comboFade) this.comboFade.remove();
      this.comboFade = this.time.delayedCall(800, () => {
        if (this.comboText) this.tweens.add({
          targets: this.comboText, alpha: 0, duration: 300
        });
      });
    } else {
      this.comboText.setAlpha(0);
    }
  }
  updateLives(lives) {
    if (!this.lifeIcons) return;
    for (let i = 0; i < LIVES_MAX; i++) {
      this.lifeIcons[i].setTexture(i < lives ? 'life' : 'lifeEmpty');
    }
  }
  showPerfect(x, y) {
    Effects.floatingText(this, 'PERFECT!', x, y - 30, COLORS_HEX.COMBO_GLOW, 28);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalData = data || {}; }
  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const d = this.finalData;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);
    this.add.text(w / 2, h * 0.14, 'GAME OVER', {
      fontSize: '34px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.WALL
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.26, 'Score: ' + (d.score || 0), {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.34, 'Stage: ' + (d.stage || 1), {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#CCC'
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.40, 'Best Combo: x' + (d.bestCombo || 0), {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.COMBO_GLOW
    }).setOrigin(0.5);
    // High score check
    const prev = parseInt(localStorage.getItem('parkour-tap_high_score') || '0');
    if ((d.score || 0) > prev) {
      localStorage.setItem('parkour-tap_high_score', d.score);
      this.add.text(w / 2, h * 0.48, 'NEW BEST!', {
        fontSize: '26px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.COMBO_GLOW
      }).setOrigin(0.5);
      SFX.play('highScore');
    }
    // Continue button (ad)
    let yOff = h * 0.58;
    if (AdManager.canContinue() && d.fromDeath) {
      const contBg = this.add.rectangle(w / 2, yOff, 220, 44, COLORS.GAP)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, yOff, 'Continue (+1 Life)', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
      }).setOrigin(0.5).disableInteractive();
      contBg.on('pointerdown', () => {
        AdManager.showRewarded('continue', () => {
          this.scene.stop(); this.scene.get('GameScene').continueAfterAd();
        });
      });
      yOff += 56;
    }
    // Play Again
    const playBg = this.add.rectangle(w / 2, yOff, 220, 48, COLORS.RUNNER)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, yOff, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).disableInteractive();
    playBg.on('pointerdown', () => {
      SFX.play('click'); this.scene.stop('UIScene');
      this.scene.stop(); this.scene.start('GameScene');
    });
    yOff += 56;
    // Menu
    const menuBg = this.add.rectangle(w / 2, yOff, 220, 44, COLORS.GROUND)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, yOff, 'MENU', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).disableInteractive();
    menuBg.on('pointerdown', () => {
      SFX.play('click'); this.scene.stop('UIScene');
      this.scene.stop(); this.scene.start('MenuScene');
    });
    AdManager.onGameOver();
  }
}
