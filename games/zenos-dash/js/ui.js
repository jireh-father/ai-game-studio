// Zeno's Dash - UI Scenes (MenuScene, GameOverScene)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F);

    // Title with glow
    this.add.text(w / 2, 120, "ZENO'S DASH", {
      fontSize: '36px', fontFamily: 'monospace', color: COLORS.player,
      stroke: COLORS.playerOutline, strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, blur: 12, color: COLORS.player, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, 170, 'how many taps until infinity?', {
      fontSize: '13px', fontFamily: 'monospace', color: COLORS.gapText
    }).setOrigin(0.5);

    // High score
    const hs = GameState.highScore || 0;
    this.add.text(w / 2, 210, 'BEST: ' + hs, {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.closeZone
    }).setOrigin(0.5);

    // Stage record
    const sr = GameState.bestStage || 0;
    this.add.text(w / 2, 235, 'FURTHEST STAGE: ' + sr, {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5);

    // Decorative track preview
    const g = this.add.graphics();
    g.fillStyle(0x1A1A2E, 1);
    g.fillRect(30, 310, w - 60, 4);
    g.fillStyle(0x00D4FF, 0.4);
    g.fillCircle(120, 310, 8);
    g.fillStyle(0xFF0066, 0.3);
    g.fillTriangle(60, 310, 70, 295, 80, 310);
    g.fillStyle(0xFFD700, 0.2);
    g.fillRect(w - 100, 296, 30, 28);

    // PLAY button
    const playBg = this.add.rectangle(w / 2, 400, 200, 60, 0x00D4FF)
      .setInteractive({ useHandCursor: true });
    const playText = this.add.text(w / 2, 400, 'PLAY', {
      fontSize: '28px', fontFamily: 'monospace', color: '#0A0A0F', fontStyle: 'bold'
    }).setOrigin(0.5);
    playText.disableInteractive();

    playBg.on('pointerdown', () => {
      playClickSound();
      GameState.score = 0;
      GameState.stage = 1;
      GameState.consecutivePerfect = 0;
      GameState.adContinueUsed = false;
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    playBg.on('pointerover', () => playBg.setFillStyle(0x33DDFF));
    playBg.on('pointerout', () => playBg.setFillStyle(0x00D4FF));

    // Help button
    const helpBg = this.add.circle(50, h - 50, 22, 0x000000, 0)
      .setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
    this.add.text(50, h - 50, '?', {
      fontSize: '22px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5).disableInteractive();

    helpBg.on('pointerdown', () => {
      playClickSound();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Ambient drone
    this._startDrone();
  }

  _startDrone() {
    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') return;
      this._drone = ctx.createOscillator();
      this._droneGain = ctx.createGain();
      this._drone.type = 'sine';
      this._drone.frequency.value = 55;
      this._droneGain.gain.setValueAtTime(0, ctx.currentTime);
      this._droneGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);
      this._drone.connect(this._droneGain).connect(ctx.destination);
      this._drone.start();
    } catch (e) {}
  }

  shutdown() {
    if (this._drone) {
      try { this._drone.stop(); } catch (e) {}
      this._drone = null;
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this._finalScore = data.score || 0;
    this._finalStage = data.stage || 1;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F);

    // Title
    this.add.text(w / 2, 100, 'CAUGHT.', {
      fontSize: '32px', fontFamily: 'monospace', color: COLORS.death,
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Stage reached
    this.add.text(w / 2, 155, 'Stage Reached: ' + this._finalStage, {
      fontSize: '20px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5);

    // Animated score counter
    const scoreObj = { val: 0 };
    const scoreTxt = this.add.text(w / 2, 200, 'Score: 0', {
      fontSize: '24px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5);

    this.tweens.add({
      targets: scoreObj,
      val: this._finalScore,
      duration: Math.min(1000, this._finalScore * 2),
      onUpdate: () => {
        scoreTxt.setText('Score: ' + Math.floor(scoreObj.val));
      }
    });

    // New record check
    const isNewRecord = this._finalScore > (GameState.highScore || 0);
    if (isNewRecord) {
      GameState.highScore = this._finalScore;
      GameState.bestStage = Math.max(GameState.bestStage || 0, this._finalStage);
      saveGameState();

      const recordTxt = this.add.text(w / 2, 245, 'NEW RECORD!', {
        fontSize: '18px', fontFamily: 'monospace', color: COLORS.closeZone
      }).setOrigin(0.5);
      this.tweens.add({
        targets: recordTxt, scaleX: 1.4, scaleY: 1.4,
        duration: 200, yoyo: true, ease: 'Quad.easeOut'
      });
    } else {
      GameState.bestStage = Math.max(GameState.bestStage || 0, this._finalStage);
      saveGameState();
      this.add.text(w / 2, 245, 'BEST: ' + GameState.highScore, {
        fontSize: '16px', fontFamily: 'monospace', color: COLORS.closeZone
      }).setOrigin(0.5);
    }

    AdsManager.onGameOver();

    // Ad continue button (first death of session only)
    let btnY = 320;
    if (!GameState.adContinueUsed) {
      const adBg = this.add.rectangle(w / 2, btnY, 280, 48, 0xFFD700)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'WATCH AD - CONTINUE', {
        fontSize: '16px', fontFamily: 'monospace', color: '#0A0A0F', fontStyle: 'bold'
      }).setOrigin(0.5).disableInteractive();
      adBg.on('pointerdown', () => {
        playClickSound();
        GameState.adContinueUsed = true;
        GameState.stage = 1; // restart from stage 1 with score preserved
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      });
      btnY += 65;
    }

    // Play Again
    const retryBg = this.add.rectangle(w / 2, btnY, 200, 50, 0x00D4FF)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', color: '#0A0A0F', fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();
    retryBg.on('pointerdown', () => {
      playClickSound();
      GameState.score = 0;
      GameState.stage = 1;
      GameState.consecutivePerfect = 0;
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    // Menu
    const menuBg = this.add.rectangle(w / 2, btnY + 65, 140, 40, 0x333344)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY + 65, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', color: COLORS.hud
    }).setOrigin(0.5).disableInteractive();
    menuBg.on('pointerdown', () => {
      playClickSound();
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });
  }
}
