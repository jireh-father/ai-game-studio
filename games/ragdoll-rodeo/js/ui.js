// ui.js — MenuScene, GameOverScene, PauseOverlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, COLORS.warmTan);
    // Sky band
    this.add.rectangle(w/2, 80, w, 160, COLORS.deepBlue);
    // Crowd silhouettes
    const crowd = this.add.graphics();
    crowd.fillStyle(0x1a0a00, 1);
    for (let x = 0; x < w; x += 40) {
      crowd.fillEllipse(x + 20, 158, 36, 24);
    }
    // Fence
    this.add.rectangle(w/2, 172, w, 12, COLORS.saddleBrown).setStrokeStyle(2, 0x5D4037);

    // Title
    this.add.text(w/2, 230, 'RAGDOLL', {
      fontSize: '48px', fontFamily: 'Arial Black', fill: COLORS_HEX.bullRed,
      stroke: '#1a0a00', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(w/2, 280, 'RODEO', {
      fontSize: '42px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow,
      stroke: '#1a0a00', strokeThickness: 4
    }).setOrigin(0.5);

    // Bull logo (animated bob)
    const bull = this.add.image(w/2, 360, 'bull').setScale(1.5);
    this.tweens.add({ targets: bull, y: 368, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // High score
    GameState.highScore = getHighScore();
    this.add.text(w/2, 420, 'Best: ' + GameState.highScore, {
      fontSize: '18px', fill: COLORS_HEX.darkBrown
    }).setOrigin(0.5);

    // PLAY button
    const playBg = this.add.rectangle(w/2, 490, 200, 60, COLORS.bullRed)
      .setStrokeStyle(3, COLORS.goldYellow).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 490, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black', fill: '#FFFFFF'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => startGame.call(this));
    playBg.on('pointerdown', () => startGame.call(this));

    function startGame() {
      Effects.soundButton();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    }

    // Help button
    const helpBg = this.add.rectangle(w/2, 560, 180, 50, COLORS.deepBlue)
      .setStrokeStyle(2, COLORS.warmTan).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 560, 'HOW TO PLAY', {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => {
      Effects.soundButton();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundIcon = this.add.text(40, 650, GameState.soundOn ? '🔊' : '🔇', {
      fontSize: '28px'
    }).setInteractive().setOrigin(0.5);
    this.soundIcon.on('pointerdown', () => {
      GameState.soundOn = !GameState.soundOn;
      this.soundIcon.setText(GameState.soundOn ? '🔊' : '🔇');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w/2, h/2, w, h, COLORS.darkBrown, 0.9);

    const title = this.stageReached >= 5 ? 'YEEHAW!' : 'BUCKED OFF!';
    this.add.text(w/2, 120, title, {
      fontSize: '36px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow,
      stroke: '#1a0a00', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(w/2, 180, 'Stage ' + this.stageReached, {
      fontSize: '20px', fill: COLORS_HEX.warmTan
    }).setOrigin(0.5);

    // Score count-up
    const scoreText = this.add.text(w/2, 240, '0', {
      fontSize: '48px', fontFamily: 'Arial Black', fill: '#FFFFFF',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800, ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(Math.floor(tween.getValue()));
      }
    });

    if (this.isNewRecord) {
      const recordText = this.add.text(w/2, 300, 'NEW RECORD!', {
        fontSize: '24px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow,
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5);
      this.tweens.add({
        targets: recordText, scaleX: 1.15, scaleY: 1.15,
        duration: 400, yoyo: true, repeat: 2
      });
      Effects.soundHighScore();
      Effects.particleBurst(this, w/2, 300, 20, 'particle', 120);
    } else {
      Effects.soundGameOver();
    }

    this.add.text(w/2, 340, 'Best: ' + GameState.highScore, {
      fontSize: '16px', fill: COLORS_HEX.warmTan
    }).setOrigin(0.5);

    // Continue ad (if stage >= 3 and not used)
    let btnY = 420;
    if (this.stageReached >= 3 && !AdsManager.continueUsed) {
      const contBg = this.add.rectangle(w/2, btnY, 240, 50, COLORS.brightGreen)
        .setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
      this.add.text(w/2, btnY, '▶ Continue (Ad)', {
        fontSize: '18px', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      contBg.on('pointerdown', () => {
        AdsManager.continueUsed = true;
        AdsManager.showRewardedContinue(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continueStage: this.stageReached, continueScore: this.finalScore });
        });
      });
      btnY += 70;
    }

    // Try Again
    const retryBg = this.add.rectangle(w/2, btnY, 220, 56, COLORS.bullRed)
      .setStrokeStyle(3, COLORS.goldYellow).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'TRY AGAIN', {
      fontSize: '24px', fontFamily: 'Arial Black', fill: '#FFFFFF'
    }).setOrigin(0.5);
    retryBg.on('pointerdown', () => {
      Effects.soundButton();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 65;

    // Menu
    const menuBg = this.add.rectangle(w/2, btnY, 160, 44, COLORS.deepBlue)
      .setStrokeStyle(2, COLORS.warmTan).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'MENU', {
      fontSize: '18px', fill: '#FFFFFF'
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => {
      Effects.soundButton();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdsManager.trackGameOver();
  }
}
