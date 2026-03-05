// Toilet Unclogger - UI Scenes (Title, Menu, GameOver, HUD, Pause)
class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.TILE_BG);
    // Title
    this.add.text(w / 2, h * 0.2, 'TOILET\nUNCLOGGER', {
      fontSize: '48px', fontFamily: 'Arial Black, Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE,
      fontStyle: 'bold', align: 'center', stroke: '#FFFFFF', strokeThickness: 4,
    }).setOrigin(0.5);
    // Animated toilet
    const tg = this.add.graphics();
    this._drawToilet(tg, w / 2, h * 0.5);
    // Bouncing plunger
    this.plunger = this.add.image(w / 2 + 30, h * 0.5 - 20, 'plunger').setScale(0.8);
    this.tweens.add({
      targets: this.plunger, y: h * 0.5 - 35, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    // Tap to start
    const tapText = this.add.text(w / 2, h * 0.75, 'TAP TO START', {
      fontSize: '24px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: tapText, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => {
      GameState.initAudio();
      SFX.play('tap');
      this.scene.start('MenuScene');
    });
  }

  _drawToilet(g, x, y) {
    g.fillStyle(CONFIG.COLORS.PORCELAIN);
    g.fillRoundedRect(x - 50, y - 60, 100, 120, 16);
    g.lineStyle(3, CONFIG.COLORS.STROKE_GRAY);
    g.strokeRoundedRect(x - 50, y - 60, 100, 120, 16);
    g.fillStyle(CONFIG.COLORS.WATER_CLEAN);
    g.fillEllipse(x, y + 10, 70, 40);
    // Lid arc
    g.fillStyle(CONFIG.COLORS.PORCELAIN);
    g.fillEllipse(x, y - 52, 80, 20);
    g.lineStyle(2, CONFIG.COLORS.STROKE_GRAY);
    g.strokeEllipse(x, y - 52, 80, 20);
    // Handle
    g.fillStyle(0xBDBDBD);
    g.fillRect(x + 48, y - 30, 16, 8);
    g.fillCircle(x + 64, y - 26, 6);
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.TILE_BG);

    this.add.text(w / 2, h * 0.15, 'TOILET\nUNCLOGGER', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE,
      fontStyle: 'bold', align: 'center', stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5);

    // Play button
    const playBg = this.add.graphics();
    playBg.fillStyle(CONFIG.COLORS.PLUNGER_RED); playBg.fillRoundedRect(w / 2 - 80, h * 0.4, 160, 60, 16);
    playBg.setInteractive(new Phaser.Geom.Rectangle(w / 2 - 80, h * 0.4, 160, 60), Phaser.Geom.Rectangle.Contains);
    const playText = this.add.text(w / 2, h * 0.4 + 30, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);
    playText.setInteractive();

    const startGame = () => {
      SFX.play('tap');
      AdManager.resetRun();
      this.scene.start('GameScene');
    };
    playBg.on('pointerdown', startGame);
    playText.on('pointerdown', startGame);

    // High score
    this.add.text(w / 2, h * 0.55, `HIGH SCORE: ${GameState.highScore}`, {
      fontSize: '18px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.62, `HIGHEST STAGE: ${GameState.highestStage}`, {
      fontSize: '14px', fontFamily: 'Arial', fill: '#757575',
    }).setOrigin(0.5);

    // Sound toggle
    this.soundIcon = this.add.text(30, 30, GameState.settings.sound ? '🔊' : '🔇', {
      fontSize: '28px',
    }).setInteractive();
    this.soundIcon.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      GameState.settings.music = GameState.settings.sound;
      this.soundIcon.setText(GameState.settings.sound ? '🔊' : '🔇');
      GameState.save();
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const data = this.scene.settings.data || {};
    const score = data.score || 0;
    const stage = data.stage || 1;
    const clogName = data.clogName || 'Unknown';
    const canContinue = data.canContinue || false;

    this.cameras.main.setBackgroundColor(0x263238);

    // Overflow title
    const title = this.add.text(w / 2, h * 0.08, 'OVERFLOW!', {
      fontSize: '42px', fontFamily: 'Arial Black, Arial', fill: CONFIG.CSS_COLORS.DANGER_RED,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });

    // Splash particles
    const particles = this.add.particles(w / 2, h * 0.15, 'particle', {
      speed: { min: 80, max: 250 }, angle: { min: 200, max: 340 },
      lifespan: 800, quantity: 30, tint: [CONFIG.COLORS.WATER_DIRTY, CONFIG.COLORS.WATER_CLEAN],
      scale: { start: 1.5, end: 0 }, gravityY: 300, emitting: false,
    });
    particles.explode(30);

    // Killed by
    this.add.text(w / 2, h * 0.22, `Clogged by: ${clogName}`, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#B0BEC5',
    }).setOrigin(0.5);

    // Score with count-up
    const scoreText = this.add.text(w / 2, h * 0.33, '0', {
      fontSize: '48px', fontFamily: 'Arial Black, Arial', fill: CONFIG.CSS_COLORS.GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let displayScore = 0;
    const scoreStep = Math.max(1, Math.floor(score / 40));
    const scoreTimer = this.time.addEvent({
      delay: 25, repeat: Math.min(40, score),
      callback: () => {
        displayScore = Math.min(displayScore + scoreStep, score);
        scoreText.setText(displayScore.toString());
      }
    });
    this.time.delayedCall(1100, () => scoreText.setText(score.toString()));

    // New record check
    const isNewRecord = score > GameState.highScore;
    if (isNewRecord) {
      GameState.highScore = score;
      this.time.delayedCall(1200, () => {
        this.add.text(w / 2, h * 0.42, 'NEW RECORD!', {
          fontSize: '22px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.GOLD, fontStyle: 'bold',
        }).setOrigin(0.5);
        const confetti = this.add.particles(w / 2, h * 0.42, 'particle', {
          speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 }, lifespan: 1200,
          quantity: 40, tint: [0xFF5252, 0x76FF03, 0xFFD600, 0x4FC3F7, 0xAB47BC],
          scale: { start: 1.2, end: 0 }, gravityY: 200, emitting: false,
        });
        confetti.explode(40);
      });
    }

    // Stage info
    this.add.text(w / 2, h * 0.48, `Stage: ${stage}`, {
      fontSize: '18px', fontFamily: 'Arial', fill: '#B0BEC5',
    }).setOrigin(0.5);
    if (stage > GameState.highestStage) GameState.highestStage = stage;
    GameState.gamesPlayed++;
    GameState.totalScore += score;
    GameState.save();

    // Continue button (rewarded ad)
    let btnY = h * 0.58;
    if (canContinue) {
      const contBg = this.add.graphics();
      contBg.fillStyle(0x4CAF50); contBg.fillRoundedRect(w / 2 - 100, btnY, 200, 50, 12);
      contBg.setInteractive(new Phaser.Geom.Rectangle(w / 2 - 100, btnY, 200, 50), Phaser.Geom.Rectangle.Contains);
      const contText = this.add.text(w / 2, btnY + 25, 'WATCH AD TO CONTINUE', {
        fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5);
      contText.setInteractive();
      const doContinue = () => {
        AdManager.showRewarded('continue', (ok) => {
          if (ok) this.scene.start('GameScene', { continued: true, stage, score });
        });
      };
      contBg.on('pointerdown', doContinue);
      contText.on('pointerdown', doContinue);
      btnY += 65;
    }

    // Play Again
    const retryBg = this.add.graphics();
    retryBg.fillStyle(CONFIG.COLORS.PLUNGER_RED); retryBg.fillRoundedRect(w / 2 - 100, btnY, 200, 50, 12);
    retryBg.setInteractive(new Phaser.Geom.Rectangle(w / 2 - 100, btnY, 200, 50), Phaser.Geom.Rectangle.Contains);
    const retryText = this.add.text(w / 2, btnY + 25, 'PLAY AGAIN', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);
    retryText.setInteractive();
    const doRetry = () => {
      SFX.play('tap');
      AdManager.resetRun();
      AdManager.showInterstitial(() => this.scene.start('GameScene'));
    };
    retryBg.on('pointerdown', doRetry);
    retryText.on('pointerdown', doRetry);

    // Menu
    const menuText = this.add.text(w / 2, btnY + 75, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#78909C',
    }).setOrigin(0.5).setInteractive();
    menuText.on('pointerdown', () => { SFX.play('tap'); this.scene.start('MenuScene'); });
  }
}

// HUD helper class (used by GameScene)
class HUD {
  constructor(scene) {
    this.scene = scene;
    const w = scene.scale.width;
    this.scoreText = scene.add.text(16, 12, 'Score: 0', {
      fontSize: '18px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE, fontStyle: 'bold',
    }).setDepth(100).setScrollFactor(0);
    this.stageText = scene.add.text(w / 2, 12, 'Stage 1', {
      fontSize: '16px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.DARK_SLATE,
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);
    this.comboText = scene.add.text(w - 16, 38, '', {
      fontSize: '20px', fontFamily: 'Arial', fill: CONFIG.CSS_COLORS.GOLD, fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);
  }

  updateScore(score) {
    this.scoreText.setText(`Score: ${score}`);
    this.scene.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  }

  updateStage(stage) { this.stageText.setText(`Stage ${stage}`); }

  updateCombo(combo) {
    if (combo >= 5) {
      this.comboText.setText(`x${combo}`);
      this.scene.tweens.add({ targets: this.comboText, scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true });
    } else {
      this.comboText.setText('');
    }
  }

  floatText(x, y, text, color) {
    const ft = this.scene.add.text(x, y, text, {
      fontSize: '22px', fontFamily: 'Arial', fill: color || CONFIG.CSS_COLORS.GOLD, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);
    this.scene.tweens.add({
      targets: ft, y: y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy()
    });
  }

  showStageAnnounce(stage, isBoss) {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const label = isBoss ? `MEGA CLOG!\nSTAGE ${stage}` : `STAGE ${stage}`;
    const color = isBoss ? CONFIG.CSS_COLORS.DANGER_RED : CONFIG.CSS_COLORS.DARK_SLATE;
    const txt = this.scene.add.text(w / 2, -50, label, {
      fontSize: isBoss ? '32px' : '28px', fontFamily: 'Arial Black, Arial',
      fill: color, fontStyle: 'bold', align: 'center', stroke: '#FFFFFF', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);
    this.scene.tweens.add({
      targets: txt, y: h * 0.35, duration: 400, ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(800, () => {
          this.scene.tweens.add({ targets: txt, alpha: 0, duration: 300, onComplete: () => txt.destroy() });
        });
      }
    });
  }
}
