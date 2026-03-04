// ui.js — MenuScene, GameOverScene, HUD overlay, pause overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x0D0D1A, 0.6);

    // Title
    this.add.text(W / 2, 160, 'ALARM', {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Shaking alarm icon
    const icon = this.add.image(W / 2, 230, 'alarm_stationary').setScale(1.2);
    this.tweens.add({
      targets: icon, angle: 10, duration: 100, yoyo: true,
      repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(W / 2, 300, 'SLAP', {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#F5C518', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(W / 2, 400, 200, 60, 0xF5C518, 1).setInteractive();
    playBtn.setStrokeStyle(3, 0x222222);
    const playText = this.add.text(W / 2, 400, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#1A1A2E',
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      AudioManager.playUIClick();
      this.tweens.add({
        targets: [playBtn, playText], scaleX: 0.9, scaleY: 0.9,
        duration: 60, yoyo: true, onComplete: () => {
          this.scene.start('GameScene');
        }
      });
    });

    // High score
    const hs = StorageManager.get('high_score') || 0;
    this.add.text(W / 2, 450, `BEST: ${hs}`, {
      fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF',
    }).setOrigin(0.5);

    // Sound toggle
    const soundOn = SettingsManager.sound;
    const soundBtn = this.add.text(16, 16, soundOn ? '🔊' : '🔇', {
      fontSize: '28px',
    }).setInteractive();
    soundBtn.on('pointerdown', () => {
      SettingsManager.sound = !SettingsManager.sound;
      SettingsManager.save();
      soundBtn.setText(SettingsManager.sound ? '🔊' : '🔇');
    });

    // Version
    this.add.text(W / 2, H - 20, 'v1.0', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#666666',
    }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    const { score, stage, isFirstDeath } = data;

    AdManager.onGameOver();

    // Slide-in panel background
    const panel = this.add.rectangle(W / 2, H / 2, W, H, 0x0D0D1A, 0.92);
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 400 });

    const elements = [];

    // GAME OVER title
    const title = this.add.text(W / 2, 120, 'GAME OVER', {
      fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: '#FF4444', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScale(0.3).setAlpha(0);
    elements.push(title);
    this.tweens.add({
      targets: title, scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400, ease: 'Back.easeOut',
    });

    // Score
    const scoreLabel = this.add.text(W / 2, 200, 'YOUR SCORE', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#AAAAAA',
    }).setOrigin(0.5).setAlpha(0);
    elements.push(scoreLabel);

    const hs = StorageManager.get('high_score') || 0;
    const isNewBest = score > hs;
    if (isNewBest) StorageManager.set('high_score', score);

    const scoreColor = isNewBest ? '#FFD700' : '#FFFFFF';
    const scoreText = this.add.text(W / 2, 240, `${score}`, {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: scoreColor,
    }).setOrigin(0.5).setAlpha(0);
    elements.push(scoreText);

    if (isNewBest) {
      const newBest = this.add.text(W / 2, 275, 'NEW BEST!', {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold',
        fill: '#FFD700',
      }).setOrigin(0.5).setAlpha(0);
      elements.push(newBest);
      this.tweens.add({
        targets: newBest, alpha: 1, scaleX: 1.1, scaleY: 1.1,
        duration: 300, delay: 500, yoyo: true, repeat: 2,
      });
    }

    // Best score
    const bestText = this.add.text(W / 2, 310, `BEST: ${Math.max(score, hs)}`, {
      fontSize: '20px', fontFamily: 'Arial', fill: '#FFD700',
    }).setOrigin(0.5).setAlpha(0);
    elements.push(bestText);

    // Stage
    const stageText = this.add.text(W / 2, 345, `STAGE REACHED: ${stage}`, {
      fontSize: '18px', fontFamily: 'Arial', fill: '#888888',
    }).setOrigin(0.5).setAlpha(0);
    elements.push(stageText);

    // Fade in all elements
    this.tweens.add({
      targets: elements, alpha: 1, duration: 300, delay: 300,
    });

    // Update stats
    const played = (StorageManager.get('games_played') || 0) + 1;
    StorageManager.set('games_played', played);
    const hs2 = StorageManager.get('highest_stage') || 0;
    if (stage > hs2) StorageManager.set('highest_stage', stage);

    let btnY = 400;

    // Continue button (rewarded ad)
    if (isFirstDeath && AdManager.canShowContinue()) {
      const contBtn = this.add.rectangle(W / 2, btnY, 220, 50, 0x2288FF, 1).setInteractive();
      contBtn.setStrokeStyle(2, 0x1166CC);
      const contText = this.add.text(W / 2, btnY, 'WATCH AD TO CONTINUE', {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF',
      }).setOrigin(0.5);
      contBtn.setAlpha(0); contText.setAlpha(0);
      this.tweens.add({ targets: [contBtn, contText], alpha: 1, duration: 300, delay: 500 });

      contBtn.on('pointerdown', () => {
        AudioManager.playUIClick();
        AdManager.showRewardedContinue(this, () => {
          this.scene.start('GameScene', { continueData: { score, stage, noiseDrain: 50 } });
        }, null);
      });
      btnY += 65;
    }

    // Play Again button
    const playBtn = this.add.rectangle(W / 2, btnY, 200, 50, 0xF5C518, 1).setInteractive();
    playBtn.setStrokeStyle(2, 0xC4A014);
    const playText = this.add.text(W / 2, btnY, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#1A1A2E',
    }).setOrigin(0.5);
    playBtn.setAlpha(0); playText.setAlpha(0);
    this.tweens.add({ targets: [playBtn, playText], alpha: 1, duration: 300, delay: 600 });

    playBtn.on('pointerdown', () => {
      AudioManager.playUIClick();
      if (AdManager.shouldShowInterstitial()) {
        AdManager.showInterstitial(this, () => this.scene.start('GameScene'));
      } else {
        this.scene.start('GameScene');
      }
    });
    btnY += 65;

    // Menu button
    const menuBtn = this.add.rectangle(W / 2, btnY, 140, 44, 0x444444, 1).setInteractive();
    const menuText = this.add.text(W / 2, btnY, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF',
    }).setOrigin(0.5);
    menuBtn.setAlpha(0); menuText.setAlpha(0);
    this.tweens.add({ targets: [menuBtn, menuText], alpha: 1, duration: 300, delay: 700 });

    menuBtn.on('pointerdown', () => {
      AudioManager.playUIClick();
      this.scene.start('MenuScene');
    });
  }
}
