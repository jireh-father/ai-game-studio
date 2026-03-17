// Echo Strike - UI Scenes (Menu, GameOver, Pause)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // Title with echo pulse
    const title = this.add.text(w / 2, h * 0.25, 'ECHO\nSTRIKE', {
      fontSize: '52px', fontFamily: 'Arial', fill: '#00D4FF',
      fontStyle: 'bold', align: 'center', lineSpacing: 4
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title, alpha: { from: 0.7, to: 1 }, scaleX: { from: 0.98, to: 1.02 },
      scaleY: { from: 0.98, to: 1.02 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(w / 2, h * 0.40, 'Strike now. Echo later.', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#888888', fontStyle: 'italic'
    }).setOrigin(0.5);

    // Play button
    const playBg = this.add.rectangle(w / 2, h * 0.52, 200, 60, 0x000000, 0)
      .setStrokeStyle(2, 0x00D4FF);
    const playTxt = this.add.text(w / 2, h * 0.52, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fill: '#00D4FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: playBg, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true,
          onComplete: () => {
            this.cameras.main.fadeOut(300, 10, 10, 15);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.stop('MenuScene');
              this.scene.start('GameScene');
            });
          }
        });
      });
    playTxt.disableInteractive();

    // Help button
    const helpBg = this.add.rectangle(w / 2 + 120, h * 0.52, 44, 44, 0x000000, 0)
      .setStrokeStyle(1.5, 0x00D4FF);
    const helpTxt = this.add.text(w / 2 + 120, h * 0.52, '?', {
      fontSize: '24px', fontFamily: 'Arial', fill: '#00D4FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.pause('MenuScene');
        this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
      });
    helpTxt.disableInteractive();

    // High score
    const hs = window.GameState ? window.GameState.highScore : 0;
    this.add.text(w / 2, h * 0.63, `Best: ${hs}`, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FFD700'
    }).setOrigin(0.5);

    // Decorative echo rings
    const g = this.add.graphics();
    for (let i = 0; i < 3; i++) {
      const r = 80 + i * 40;
      g.lineStyle(1, 0x00D4FF, 0.08 - i * 0.02);
      g.strokeCircle(w / 2, h * 0.25, r);
    }

    this.cameras.main.fadeIn(300, 10, 10, 15);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    const gs = window.GameState;

    this.cameras.main.setBackgroundColor('rgba(10,10,15,0.92)');

    // Game Over title
    const goText = this.add.text(w / 2, h * 0.15, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial', fill: '#FF4422', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: goText, alpha: { from: 0.6, to: 1 }, duration: 600, yoyo: true, repeat: -1
    });

    // Animated score counter
    const scoreObj = { val: 0 };
    const scoreTxt = this.add.text(w / 2, h * 0.28, 'Score: 0', {
      fontSize: '28px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: scoreObj, val: gs.score, duration: 800, ease: 'Quad.easeOut',
      onUpdate: () => { scoreTxt.setText('Score: ' + Math.floor(scoreObj.val)); }
    });

    // High score
    const isNewBest = gs.score >= gs.highScore && gs.score > 0;
    if (isNewBest) {
      gs.highScore = gs.score;
      localStorage.setItem('echo-strike_high_score', gs.highScore);
    }
    const bestTxt = this.add.text(w / 2, h * 0.36, `Best: ${gs.highScore}`, {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700'
    }).setOrigin(0.5);
    if (isNewBest) {
      const badge = this.add.text(w / 2, h * 0.42, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: badge, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    // Stage reached
    this.add.text(w / 2, h * 0.48, `Stage Reached: ${gs.stage}`, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#AAAAAA'
    }).setOrigin(0.5);

    // Watch Ad button (if continue available)
    let nextBtnY = h * 0.58;
    if (AdsManager.canContinue()) {
      const adBg = this.add.rectangle(w / 2, nextBtnY, 240, 50, 0xFF4422, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          AdsManager.showRewarded('continue', (rewarded) => {
            if (rewarded) {
              this.scene.stop('GameOverScene');
              this.scene.start('GameScene', { continued: true });
            }
          });
        });
      this.add.text(w / 2, nextBtnY, 'WATCH AD TO CONTINUE', {
        fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5).disableInteractive();
      nextBtnY += 65;
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, nextBtnY, 200, 50, 0x000000, 0)
      .setStrokeStyle(2, 0x00D4FF)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      });
    this.add.text(w / 2, nextBtnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fill: '#00D4FF', fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();

    // Menu button
    const menuBg = this.add.rectangle(w / 2, nextBtnY + 60, 140, 44, 0x000000, 0)
      .setStrokeStyle(1, 0x666666)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('GameOverScene');
        this.scene.start('MenuScene');
      });
    this.add.text(w / 2, nextBtnY + 60, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#888888'
    }).setOrigin(0.5).disableInteractive();

    AdsManager.trackGameOver();
  }
}
