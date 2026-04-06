class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0xfff8e7);

    // Title
    this.add.text(W / 2, 100, "GRANDMA'S\nREVENGE", {
      fontSize: '38px', fill: COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold',
      stroke: COL.TEXT, strokeThickness: 3, align: 'center'
    }).setOrigin(0.5);

    // Animated grandma
    if (this.textures.exists('grandma_t1')) {
      this.grandma = this.add.image(W / 2, 280, 'grandma_t1').setScale(1.2);
      this.tweens.add({ targets: this.grandma, y: 274, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Bouncing slipper
    if (this.textures.exists('slipper')) {
      const sl = this.add.image(60, H - 100, 'slipper').setScale(1.2);
      this.tweens.add({ targets: sl, x: W - 60, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: sl, angle: 360, duration: 2500, repeat: -1, ease: 'Linear' });
    }

    // High score
    const hs = window.GS.highScore || 0;
    this.add.text(W / 2, 370, 'Best: ' + hs, { fontSize: '18px', fill: COL.TEXT, fontFamily: 'Arial' }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(W / 2, 450, 200, 60, 0xe74c3c).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0xc0392b);
    this.add.text(W / 2, 450, 'PLAY', { fontSize: '26px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1);
    playBtn.on('pointerdown', () => {
      Effects.playSound('click');
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });
    playBtn.on('pointerover', () => playBtn.setFillStyle(0xc0392b));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0xe74c3c));

    // Help button
    const helpBtn = this.add.rectangle(350, 60, 44, 44, 0xf39c12).setInteractive({ useHandCursor: true });
    helpBtn.setStrokeStyle(2, 0xe67e22);
    this.add.text(350, 60, '?', { fontSize: '24px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      Effects.playSound('click');
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Subtitle
    this.add.text(W / 2, H - 40, 'Dodge grandma\'s slippers!', { fontSize: '14px', fill: '#7F8C8D', fontFamily: 'Arial' }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const gs = window.GS;

    // Delay UI appearance
    this.cameras.main.setAlpha(0);
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 200 });
    });

    this.add.rectangle(W / 2, H / 2, W, H, 0x2c3e50, 0.85);

    // Title
    const title = gs.hp <= 0 ? 'GRANDMA WINS!' : 'YOU SURVIVED!';
    this.add.text(W / 2, 150, title, { fontSize: '28px', fill: COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold', stroke: '#FFF', strokeThickness: 2 }).setOrigin(0.5);

    // Score
    this.add.text(W / 2, 230, '' + gs.score, { fontSize: '42px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 270, 'SCORE', { fontSize: '14px', fill: '#BDC3C7', fontFamily: 'Arial' }).setOrigin(0.5);

    // New record
    if (gs.score > gs.highScore) {
      gs.highScore = gs.score;
      try { localStorage.setItem('grandmas-revenge_high_score', gs.highScore); } catch (e) {}
      const rec = this.add.text(W / 2, 300, 'NEW RECORD!', { fontSize: '22px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      this.tweens.add({ targets: rec, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: -1 });
    }

    // Stage reached
    this.add.text(W / 2, 335, 'Stage ' + gs.stage, { fontSize: '18px', fill: '#BDC3C7', fontFamily: 'Arial' }).setOrigin(0.5);

    // Ad continue (once per run)
    let nextBtnY = 400;
    if (!gs.adUsed && gs.hp <= 0) {
      const adBtn = this.add.rectangle(W / 2, nextBtnY, 240, 50, 0xf39c12).setInteractive({ useHandCursor: true });
      adBtn.setStrokeStyle(2, 0xe67e22);
      this.add.text(W / 2, nextBtnY, 'Watch Ad -> +2 HP', { fontSize: '18px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      adBtn.on('pointerdown', () => {
        Effects.playSound('click');
        gs.adUsed = true;
        gs.hp = 2;
        AdsManager.showRewarded(() => {
          this.scene.stop('GameOverScene');
          this.scene.stop('GameScene');
          this.scene.start('GameScene', { continueRun: true });
        });
      });
      nextBtnY += 70;
    }

    // Play again
    const playBtn = this.add.rectangle(W / 2, nextBtnY, 180, 50, 0xe74c3c).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(2, 0xc0392b);
    this.add.text(W / 2, nextBtnY, 'PLAY AGAIN', { fontSize: '20px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Effects.playSound('click');
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    nextBtnY += 70;

    // Menu
    const menuBtn = this.add.rectangle(W / 2, nextBtnY, 180, 50, 0x7f8c8d).setInteractive({ useHandCursor: true });
    menuBtn.setStrokeStyle(2, 0x5d6d7e);
    this.add.text(W / 2, nextBtnY, 'MENU', { fontSize: '20px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      Effects.playSound('click');
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdsManager.incrementGameOver();
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    const gs = window.GS;
    this.scoreTxt = this.add.text(10, 12, 'Score: ' + gs.score, { fontSize: '18px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 });
    this.stageTxt = this.add.text(this.scale.width / 2, 12, 'Stage ' + gs.stage, { fontSize: '16px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0);
    this.hearts = [];
    this.updateHearts();
    this.comboTxt = this.add.text(this.scale.width / 2, 50, '', { fontSize: '18px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0).setAlpha(0);
  }

  updateHearts() {
    this.hearts.forEach(h => h.destroy());
    this.hearts = [];
    const gs = window.GS;
    const startX = this.scale.width - 20;
    for (let i = 0; i < MAX_HP; i++) {
      const key = i < gs.hp ? 'heart_full' : 'heart_empty';
      const h = this.add.image(startX - i * 22, 20, key).setScale(1.2);
      this.hearts.push(h);
    }
  }

  updateScore() {
    const gs = window.GS;
    this.scoreTxt.setText('Score: ' + gs.score);
    // Punch
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  updateStage() {
    this.stageTxt.setText('Stage ' + window.GS.stage);
    this.tweens.add({ targets: this.stageTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  showCombo(streak) {
    this.comboTxt.setText('x' + streak + ' STREAK!').setAlpha(1);
    this.tweens.add({ targets: this.comboTxt, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
  }

  hideCombo() {
    this.comboTxt.setAlpha(0);
  }

  showPauseOverlay(gameScene) {
    const W = this.scale.width, H = this.scale.height;
    this.pauseBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(500);
    this.pauseTitle = this.add.text(W / 2, 200, 'PAUSED', { fontSize: '32px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(501);
    const makeBtn = (y, label, cb) => {
      const b = this.add.rectangle(W / 2, y, 180, 50, 0xe74c3c).setInteractive({ useHandCursor: true }).setDepth(501);
      b.setStrokeStyle(2, 0xc0392b);
      const t = this.add.text(W / 2, y, label, { fontSize: '20px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(502);
      b.on('pointerdown', () => { Effects.playSound('click'); cb(); });
      return [b, t];
    };
    this._pauseEls = [this.pauseBg, this.pauseTitle];
    this._pauseEls.push(...makeBtn(290, 'RESUME', () => gameScene.togglePause()));
    this._pauseEls.push(...makeBtn(360, 'RESTART', () => {
      this.hidePauseOverlay();
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }));
    this._pauseEls.push(...makeBtn(430, 'MENU', () => {
      this.hidePauseOverlay();
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }));
    const hb = this.add.rectangle(W - 40, H - 40, 44, 44, 0xf39c12).setInteractive({ useHandCursor: true }).setDepth(501);
    hb.setStrokeStyle(2, 0xe67e22);
    const ht = this.add.text(W - 40, H - 40, '?', { fontSize: '24px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(502);
    hb.on('pointerdown', () => {
      Effects.playSound('click');
      gameScene.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    this._pauseEls.push(hb, ht);
  }

  hidePauseOverlay() {
    if (this._pauseEls) {
      this._pauseEls.forEach(el => el.destroy());
      this._pauseEls = null;
    }
  }
}
