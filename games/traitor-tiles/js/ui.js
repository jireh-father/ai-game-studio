class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, CONFIG.COLORS.BG);

    // Decorative background grid
    const g = this.add.graphics();
    const tileS = 50, gap = 4;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = (width - 8 * (tileS + gap)) / 2 + c * (tileS + gap);
        const y = 120 + r * (tileS + gap);
        const isPoisoned = Math.random() < 0.3;
        g.fillStyle(isPoisoned ? CONFIG.COLORS.TILE_POISONED : CONFIG.COLORS.TILE_SAFE, isPoisoned ? 0.3 : 0.15);
        g.fillRoundedRect(x, y, tileS, tileS, 4);
      }
    }

    // Title
    const title = this.add.text(width / 2, 80, 'TRAITOR\nTILES', {
      fontSize: '42px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF',
      align: 'center', fontStyle: 'bold', lineSpacing: 4
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.7, duration: 1500, yoyo: true, repeat: -1 });

    // Play button
    const btnY = height / 2 + 80;
    const btnBg = this.add.rectangle(width / 2, btnY, 220, 64, 0x000000, 0)
      .setStrokeStyle(2, CONFIG.COLORS.PLAYER);
    this.add.text(width / 2, btnY, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerup', () => {
      this.scene.stop('MenuScene');
      this.scene.start('GameScene', { stage: 1, score: 0, streak: 0 });
    });

    // Best score
    const best = getHighScore();
    if (best > 0) {
      this.add.text(width / 2, btnY + 52, `Best: ${best.toLocaleString()}`, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: CONFIG.COLORS.HUD_TEXT
      }).setOrigin(0.5);
    }

    // Help button
    const helpBtn = this.add.circle(width - 48, height - 48, 28, 0x000000, 0)
      .setStrokeStyle(2, CONFIG.COLORS.PLAYER);
    helpBtn.setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(width - 48, height - 48, '?', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    const openHelp = () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    };
    helpBtn.on('pointerup', openHelp);
    helpTxt.setInteractive().on('pointerup', openHelp);

    // Sound toggle
    this.soundOn = !this.game.registry.get('muted');
    const soundTxt = this.add.text(width - 40, 30, this.soundOn ? '\u266A' : '\u266A', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif',
      fill: this.soundOn ? '#E8EAF0' : '#555'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundTxt.on('pointerup', () => {
      this.soundOn = !this.soundOn;
      this.game.registry.set('muted', !this.soundOn);
      soundTxt.setColor(this.soundOn ? '#E8EAF0' : '#555');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.deathReason = data.reason || 'poison';
    this.canContinue = data.canContinue || false;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0A0E1A, 0.92);

    const isNewRecord = this.finalScore > getHighScore();
    if (isNewRecord && this.finalScore > 0) saveHighScore(this.finalScore);

    const flashColor = this.deathReason === 'goal' ? '#FFD700' : '#FF2233';
    this.add.text(width / 2, 160, 'GAME OVER', {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', fill: flashColor, fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreTxt = this.add.text(width / 2, 220, '0', {
      fontSize: '40px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800, ease: 'Cubic.Out',
      onUpdate: (t) => { scoreTxt.setText(Math.floor(t.getValue()).toLocaleString()); }
    });

    if (isNewRecord && this.finalScore > 0) {
      const rec = this.add.text(width / 2, 268, 'NEW RECORD!', {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: rec, alpha: 1, scale: 1.2, duration: 400, delay: 800, yoyo: true, hold: 600 });
    }

    this.add.text(width / 2, 300, `Stage ${this.stageReached}`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#999'
    }).setOrigin(0.5);

    let btnY = 370;

    if (this.canContinue && ADS.canContinue()) {
      this.add.rectangle(width / 2, btnY, 260, 50, 0x000000, 0)
        .setStrokeStyle(2, CONFIG.COLORS.GOAL).setInteractive({ useHandCursor: true })
        .on('pointerup', () => this._continue());
      this.add.text(width / 2, btnY, 'Watch Ad to Continue', {
        fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#FFD700'
      }).setOrigin(0.5).setInteractive().on('pointerup', () => this._continue());
      btnY += 65;
    }

    this.add.rectangle(width / 2, btnY, 260, 54, 0x000000, 0)
      .setStrokeStyle(2, CONFIG.COLORS.PLAYER).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this._playAgain());
    this.add.text(width / 2, btnY, 'Play Again', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerup', () => this._playAgain());
    btnY += 65;

    this.add.rectangle(width / 2, btnY, 200, 44, 0x000000, 0)
      .setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true })
      .on('pointerup', () => this._goMenu());
    this.add.text(width / 2, btnY, 'Menu', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#999'
    }).setOrigin(0.5).setInteractive().on('pointerup', () => this._goMenu());

    if (ADS.trackGameOver()) ADS.showInterstitial();

    if (ADS.canDouble() && this.finalScore > 0) {
      btnY += 60;
      this.add.rectangle(width / 2, btnY, 260, 44, 0x000000, 0)
        .setStrokeStyle(1, 0xFFA500).setInteractive({ useHandCursor: true })
        .on('pointerup', () => this._doubleScore(scoreTxt));
      this.add.text(width / 2, btnY, 'Watch Ad to Double Score', {
        fontSize: '15px', fontFamily: 'Arial, sans-serif', fill: '#FFA500'
      }).setOrigin(0.5).setInteractive().on('pointerup', () => this._doubleScore(scoreTxt));
    }
  }

  _continue() {
    ADS.showRewarded('continue', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene', {
        stage: this.stageReached, score: this.finalScore, streak: 0, isContinue: true
      });
    });
  }

  _playAgain() {
    this.scene.stop('GameOverScene');
    this.scene.start('GameScene', { stage: 1, score: 0, streak: 0 });
  }

  _goMenu() {
    this.scene.stop('GameOverScene');
    this.scene.start('MenuScene');
  }

  _doubleScore(scoreTxt) {
    ADS.showRewarded('double', () => {
      const doubled = this.finalScore * 2;
      if (doubled > getHighScore()) saveHighScore(doubled);
      scoreTxt.setText(doubled.toLocaleString());
    });
  }
}
