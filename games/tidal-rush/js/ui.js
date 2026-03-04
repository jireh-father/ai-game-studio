// UI Scenes: Title, Menu, GameOver, Pause, HUD

class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.SKY_TOP);

    // Water rectangles at bottom
    this.add.rectangle(cx, CONFIG.HEIGHT - 60, CONFIG.WIDTH, 120, 0x0077B6);
    this.add.rectangle(cx, CONFIG.HEIGHT - 20, CONFIG.WIDTH, 40, 0x023E8A);

    // Title
    this.add.text(cx, cy - 60, 'TIDAL RUSH', {
      fontSize: '48px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#FFFFFF', letterSpacing: 6
    }).setOrigin(0.5);

    // Tap to play
    const tapText = this.add.text(cx, cy + 30, 'TAP TO PLAY', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapText, alpha: 0.4, duration: 600, yoyo: true, repeat: -1
    });

    // Auto-advance or tap
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      SoundManager.init();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('MenuScene'));
    };

    this.input.on('pointerdown', advance);
    this.time.delayedCall(1500, advance);
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.SKY_TOP);
    this.cameras.main.fadeIn(300);

    // Water at bottom
    this.add.rectangle(cx, CONFIG.HEIGHT - 80, CONFIG.WIDTH, 160, 0x0077B6);
    this.add.rectangle(cx, CONFIG.HEIGHT - 30, CONFIG.WIDTH, 60, 0x023E8A);

    // Title
    this.add.text(cx, 120, 'TIDAL RUSH', {
      fontSize: '40px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Play button
    const btnBg = this.add.rectangle(cx, 300, 200, 56, 0xF4A261, 1).setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(0);
    this.add.text(cx, 300, 'PLAY', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      SoundManager.playUITap();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('GameScene'));
    });

    // Best score
    const best = getStorage(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
    this.add.text(cx, 380, 'BEST: ' + best, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Sound toggle
    const settings = getSettings();
    const soundBtn = this.add.text(CONFIG.WIDTH - 36, CONFIG.HEIGHT - 36, settings.sound ? '♪' : '♪̸', {
      fontSize: '28px', color: settings.sound ? '#FFFFFF' : '#666666'
    }).setOrigin(0.5).setInteractive();

    soundBtn.on('pointerdown', () => {
      settings.sound = !settings.sound;
      settings.music = settings.sound;
      setStorage(CONFIG.STORAGE_KEYS.SETTINGS, settings);
      soundBtn.setText(settings.sound ? '♪' : '♪̸');
      soundBtn.setColor(settings.sound ? '#FFFFFF' : '#666666');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const data = this.scene.settings.data || {};
    const score = data.score || 0;
    const stage = data.stage || 1;

    // Dark overlay
    const overlay = this.add.rectangle(cx, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000014, 0);
    this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 300 });

    // Game Over text
    const goText = this.add.text(cx, 200, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: goText, alpha: 1, duration: 300, delay: 200 });

    // Score counter
    const scoreText = this.add.text(cx, 260, 'SCORE: 0', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: CONFIG.COLORS.COMBO
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: scoreText, alpha: 1, duration: 200, delay: 300 });
    // Count-up animation
    this.tweens.addCounter({
      from: 0, to: score, duration: 800, delay: 400,
      onUpdate: (t) => { scoreText.setText('SCORE: ' + Math.floor(t.getValue())); }
    });

    // Stage
    const stageText = this.add.text(cx, 310, 'STAGE ' + stage, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: stageText, alpha: 1, duration: 200, delay: 500 });

    // High score check
    const prev = getStorage(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
    if (score > prev) {
      setStorage(CONFIG.STORAGE_KEYS.HIGH_SCORE, score);
      const newBest = this.add.text(cx, 350, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: CONFIG.COLORS.COMBO
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: newBest, alpha: 1, duration: 200, delay: 600 });
      this.tweens.add({ targets: newBest, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: -1 });
    }

    // Update stats
    const highStage = getStorage(CONFIG.STORAGE_KEYS.HIGHEST_STAGE, 0);
    if (stage > highStage) setStorage(CONFIG.STORAGE_KEYS.HIGHEST_STAGE, stage);
    const played = getStorage(CONFIG.STORAGE_KEYS.GAMES_PLAYED, 0);
    setStorage(CONFIG.STORAGE_KEYS.GAMES_PLAYED, played + 1);
    const total = getStorage(CONFIG.STORAGE_KEYS.TOTAL_SCORE, 0);
    setStorage(CONFIG.STORAGE_KEYS.TOTAL_SCORE, total + score);
    AdManager.onGameOver();

    // Play Again button
    const playBtn = this.add.rectangle(cx, 430, 200, 52, 0xF4A261, 1).setInteractive().setAlpha(0);
    const playTxt = this.add.text(cx, 430, 'PLAY AGAIN', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [playBtn, playTxt], alpha: 1, duration: 200, delay: 700 });

    playBtn.on('pointerdown', () => {
      SoundManager.playUITap();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.time.delayedCall(200, () => {
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      });
    });

    // Menu button
    const menuBtn = this.add.rectangle(cx, 500, 140, 44, 0xFFFFFF, 0.2).setInteractive().setAlpha(0);
    const menuTxt = this.add.text(cx, 500, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [menuBtn, menuTxt], alpha: 1, duration: 200, delay: 800 });

    menuBtn.on('pointerdown', () => {
      SoundManager.playUITap();
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });
  }
}

// HUD Manager - used in GameScene
class HUDManager {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = scene.add.text(10, 10, 'SCORE: 0', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setScrollFactor(0).setDepth(100);

    this.stageText = scene.add.text(CONFIG.WIDTH / 2, 10, 'STAGE 1', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.idleText = scene.add.text(CONFIG.WIDTH - 10, 10, '', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFD700'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    this.hudBg = scene.add.rectangle(CONFIG.WIDTH / 2, 20, CONFIG.WIDTH, 40, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(99);

    this.comboText = scene.add.text(CONFIG.WIDTH / 2, 140, '', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: CONFIG.COLORS.COMBO
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.warningText = scene.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 60, 'WATER RISING!', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: CONFIG.COLORS.DANGER
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
  }

  updateScore(score) {
    this.scoreText.setText('SCORE: ' + score);
    this.scene.tweens.add({
      targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true
    });
  }

  updateStage(stage) {
    this.stageText.setText('STAGE ' + stage);
    this.scene.tweens.add({
      targets: this.stageText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true
    });
  }

  showInactivityWarning(secsLeft) {
    this.idleText.setVisible(true);
    this.idleText.setText(Math.ceil(secsLeft) + 's');
    if (secsLeft < 4) {
      this.idleText.setColor(CONFIG.COLORS.DANGER);
    } else {
      this.idleText.setColor('#FFD700');
    }
  }

  hideInactivityWarning() {
    this.idleText.setVisible(false);
  }

  showCombo(count) {
    this.comboText.setText('x' + count + ' COMBO!');
    this.comboText.setAlpha(1);
    const sz = Math.min(22 + count * 4, 34);
    this.comboText.setFontSize(sz + 'px');
    this.scene.tweens.add({
      targets: this.comboText, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true
    });
    this.scene.tweens.add({
      targets: this.comboText, alpha: 0, duration: 800, delay: 200
    });
  }

  showWaterWarning(show) {
    if (show && this.warningText.alpha < 0.5) {
      this.scene.tweens.add({
        targets: this.warningText, alpha: 1, duration: 200, yoyo: true, repeat: -1, hold: 300
      });
    } else if (!show) {
      this.scene.tweens.killTweensOf(this.warningText);
      this.warningText.setAlpha(0);
    }
  }

  destroy() {
    [this.scoreText, this.stageText, this.idleText, this.hudBg, this.comboText, this.warningText]
      .forEach(o => o.destroy());
  }
}
