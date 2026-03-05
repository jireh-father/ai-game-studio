// Glass Walk - UI Scenes (Menu, GameOver, HUD)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Title
    this.add.text(w / 2, h * 0.18, 'GLASS', {
      fontSize: '52px', fontFamily: 'Arial Black, sans-serif',
      color: '#80D8FF', stroke: '#0D1B2A', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.27, 'WALK', {
      fontSize: '52px', fontFamily: 'Arial Black, sans-serif',
      color: '#E8F0FE', stroke: '#0D1B2A', strokeThickness: 4
    }).setOrigin(0.5);

    // Decorative glass panels
    this.add.rectangle(w * 0.35, h * 0.42, 60, 40, COLORS.safeGlass, 0.4)
      .setStrokeStyle(2, 0xB0BEC5);
    this.add.rectangle(w * 0.65, h * 0.42, 60, 40, COLORS.fakeGlass, 0.3)
      .setStrokeStyle(2, 0xB0BEC5);

    // Play button
    const playBg = this.add.rectangle(w / 2, h * 0.58, 180, 56, 0x1A3A5C)
      .setStrokeStyle(2, 0x80D8FF).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(w / 2, h * 0.58, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', color: '#80D8FF'
    }).setOrigin(0.5);
    playTxt.disableInteractive();
    playBg.on('pointerdown', () => {
      Effects.hapticTap();
      this.tweens.add({
        targets: [playBg, playTxt], scale: 0.92, duration: 60, yoyo: true,
        onComplete: () => this.scene.start('GameScene')
      });
    });

    // High score
    const hs = lsGet(LS_KEYS.highScore, 0);
    const hr = lsGet(LS_KEYS.highRow, 0);
    if (hs > 0) {
      this.add.text(w / 2, h * 0.69, `Best: ${hs}  (Row ${hr})`, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: '#B0BEC5'
      }).setOrigin(0.5);
    }

    // Help button
    const helpBg = this.add.circle(40, 40, 18, 0x1A3A5C)
      .setStrokeStyle(2, 0x80D8FF).setInteractive({ useHandCursor: true });
    this.add.text(40, 40, '?', {
      fontSize: '20px', fontFamily: 'Arial Black', color: '#80D8FF'
    }).setOrigin(0.5).disableInteractive();
    helpBg.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundOn = lsGet(LS_KEYS.sound, true);
    const sndTxt = this.add.text(w - 40, 40, this.soundOn ? '🔊' : '🔇', {
      fontSize: '24px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sndTxt.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      lsSet(LS_KEYS.sound, this.soundOn);
      sndTxt.setText(this.soundOn ? '🔊' : '🔇');
      this.game.sound.mute = !this.soundOn;
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.rowReached = data.row || 0;
    this.streak = data.streak || 0;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.overlay, 0.85).setDepth(0);

    // Check high score
    const prevHigh = lsGet(LS_KEYS.highScore, 0);
    const isNewBest = this.finalScore > prevHigh;
    if (isNewBest) {
      lsSet(LS_KEYS.highScore, this.finalScore);
      lsSet(LS_KEYS.highRow, this.rowReached);
    }
    const gp = lsGet(LS_KEYS.gamesPlayed, 0) + 1;
    lsSet(LS_KEYS.gamesPlayed, gp);

    this.add.text(w / 2, h * 0.15, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif',
      color: '#FF1744', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Animated score
    const scoreText = this.add.text(w / 2, h * 0.3, '0', {
      fontSize: '42px', fontFamily: 'Arial Black, sans-serif',
      color: '#FFD600', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800,
      onUpdate: (t) => scoreText.setText(Math.floor(t.getValue()))
    });

    this.add.text(w / 2, h * 0.4, `Row ${this.rowReached} Reached`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#B0BEC5'
    }).setOrigin(0.5);

    const grade = getGrade(this.finalScore);
    this.add.text(w / 2, h * 0.48, grade.grade, {
      fontSize: '48px', fontFamily: 'Arial Black', color: grade.color,
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    if (isNewBest) {
      const nb = this.add.text(w / 2, h * 0.56, 'NEW BEST!', {
        fontSize: '22px', fontFamily: 'Arial Black', color: '#FFD600',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);
      this.tweens.add({ targets: nb, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    // Continue button (rewarded ad)
    let btnY = h * 0.68;
    if (Ads.canContinue()) {
      const contBg = this.add.rectangle(w / 2, btnY, 200, 44, 0x1A3A5C)
        .setStrokeStyle(2, 0x66BB6A).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'Continue (+1 Life)', {
        fontSize: '15px', fontFamily: 'Arial', color: '#66BB6A'
      }).setOrigin(0.5).disableInteractive();
      contBg.on('pointerdown', () => {
        Ads.showRewarded(() => {
          this.scene.start('GameScene', { continueData: {
            score: this.finalScore, row: this.rowReached, streak: this.streak
          }});
        });
      });
      btnY += 56;
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, btnY, 200, 44, 0x1A3A5C)
      .setStrokeStyle(2, 0x80D8FF).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'Play Again', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#80D8FF'
    }).setOrigin(0.5).disableInteractive();
    playBg.on('pointerdown', () => {
      Ads.showInterstitial(() => this.scene.start('GameScene'));
    });

    // Menu
    const menuBg = this.add.rectangle(w / 2, btnY + 52, 200, 44, 0x1A3A5C)
      .setStrokeStyle(2, 0xB0BEC5).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY + 52, 'Menu', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#B0BEC5'
    }).setOrigin(0.5).disableInteractive();
    menuBg.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    this.hearts = [];
    this.buildHUD();
    this.scene.bringToTop();
  }

  buildHUD() {
    const w = this.scale.width;
    this.scoreTxt = this.add.text(16, 12, 'Score: 0', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#FFFFFF'
    }).setDepth(100);
    this.rowTxt = this.add.text(w / 2, 12, 'Row 1', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(100);
    // Hearts
    for (let i = 0; i < 3; i++) {
      const hrt = this.add.image(w - 70 + i * 22, 22, 'heart')
        .setScale(0.8).setDepth(100);
      this.hearts.push(hrt);
    }
    this.streakTxt = this.add.text(w / 2, 38, '', {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#80D8FF'
    }).setOrigin(0.5, 0).setDepth(100);
  }

  updateScore(val) {
    if (this.scoreTxt) {
      this.scoreTxt.setText(`Score: ${val}`);
      this.tweens.add({
        targets: this.scoreTxt, scale: 1.3, duration: 80,
        yoyo: true, ease: 'Power1'
      });
    }
  }

  updateRow(val) {
    if (this.rowTxt) this.rowTxt.setText(`Row ${val}`);
  }

  updateLives(val) {
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < val) {
        this.hearts[i].setTexture('heart');
      } else {
        Effects.heartLose(this, this.hearts[i]);
      }
    }
  }

  updateStreak(val) {
    if (this.streakTxt) {
      this.streakTxt.setText(val >= 3 ? `Streak x${val}` : '');
    }
  }
}
