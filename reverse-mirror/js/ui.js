// ui.js - MenuScene, GameOverScene, HUD, Pause/Settings overlays

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);

    // Mirror line decoration
    const mirrorY = GAME_HEIGHT * 0.38;
    const ml = this.add.rectangle(cx, mirrorY, GAME_WIDTH - 40, 3, PALETTE.mirror, 0.7);
    this.tweens.add({ targets: ml, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1 });

    // Title
    this.add.text(cx, mirrorY - 50, 'REVERSE', {
      fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.realCharHex
    }).setOrigin(0.5);
    this.add.text(cx, mirrorY + 50, 'MIRROR', {
      fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.reflCharHex
    }).setOrigin(0.5);

    // Characters preview
    if (this.textures.exists('realChar')) {
      this.add.image(cx - 50, mirrorY - 85, 'realChar').setScale(1.5);
      this.add.image(cx + 50, mirrorY + 85, 'reflChar').setScale(1.5).setFlipY(true);
    }

    // High score
    loadGameState();
    if (GameState.highScore > 0) {
      this.add.text(cx, GAME_HEIGHT * 0.58, `BEST: ${GameState.highScore.toLocaleString()} | STAGE ${GameState.highStage}`, {
        fontSize: '16px', fontFamily: 'Arial', fill: PALETTE.mirrorHex
      }).setOrigin(0.5);
    }

    // Play button
    const btnY = GAME_HEIGHT * 0.7;
    const btn = this.add.rectangle(cx, btnY, 240, 56, PALETTE.mirror, 0.9).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(cx, btnY, 'TAP TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.bgHex
    }).setOrigin(0.5);
    btnTxt.disableInteractive();
    this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });
    btn.on('pointerdown', () => {
      audioSynth.init();
      resetGameState();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.text(GAME_WIDTH - 44, 12, '?', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.mirrorHex,
      backgroundColor: '#1a2030', padding: { x: 10, y: 4 }
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Subtitle
    this.add.text(cx, GAME_HEIGHT * 0.82, 'Your reflection controls YOU', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#667788'
    }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg, 0.92).setDepth(0);

    // Title
    const title = this.add.text(cx, 140, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.white
    }).setOrigin(0.5).setScale(0.1).setDepth(1);
    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.Out' });

    // Stage
    this.add.text(cx, 200, `STAGE ${GameState.stage}`, {
      fontSize: '22px', fontFamily: 'Arial', fill: PALETTE.mirrorHex
    }).setOrigin(0.5).setDepth(1);

    // Score (animated tally)
    const scoreText = this.add.text(cx, 260, '0', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.uiText
    }).setOrigin(0.5).setDepth(1);
    this.tweens.addCounter({
      from: 0, to: GameState.score, duration: 800, ease: 'Quad.Out',
      onUpdate: (t) => { scoreText.setText(Math.floor(t.getValue()).toLocaleString()); }
    });

    // New record check
    const isNewRecord = GameState.score > GameState.highScore;
    if (isNewRecord) {
      GameState.highScore = GameState.score;
      GameState.highStage = Math.max(GameState.highStage, GameState.stage);
    }
    GameState.gamesPlayed++;
    saveGameState();

    if (isNewRecord && GameState.score > 0) {
      const nr = this.add.text(cx, 310, 'NEW RECORD!', {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.mirrorHex
      }).setOrigin(0.5).setDepth(1);
      this.tweens.add({ targets: nr, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    }

    // Buttons
    const playY = 400;
    const playBtn = this.add.rectangle(cx, playY, 240, 56, PALETTE.mirror, 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    const playTxt = this.add.text(cx, playY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.bgHex
    }).setOrigin(0.5).setDepth(1);
    playTxt.disableInteractive();
    playBtn.on('pointerdown', () => {
      resetGameState();
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.rectangle(cx, playY + 70, 200, 44, PALETTE.obstacle, 0.8)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    const menuTxt = this.add.text(cx, playY + 70, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', fill: PALETTE.uiText
    }).setOrigin(0.5).setDepth(1);
    menuTxt.disableInteractive();
    menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });
  }
}

class HUD {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
  }

  create() {
    const s = this.scene;
    // Top bar background
    s.add.rectangle(GAME_WIDTH/2, HUD_HEIGHT/2, GAME_WIDTH, HUD_HEIGHT, PALETTE.bg, 0.85).setDepth(50);

    // Lives
    this.lifeIcons = [];
    for (let i = 0; i < 3; i++) {
      const icon = s.add.image(20 + i * 22, HUD_HEIGHT/2, 'lifeFull').setDepth(51).setScale(0.9);
      this.lifeIcons.push(icon);
    }

    // Stage text
    this.stageText = s.add.text(GAME_WIDTH/2, HUD_HEIGHT/2, 'STAGE 1', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.uiText
    }).setOrigin(0.5).setDepth(51);

    // Score text
    this.scoreText = s.add.text(GAME_WIDTH - 50, HUD_HEIGHT/2, '0', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.uiText
    }).setOrigin(1, 0.5).setDepth(51);

    // Combo text (bottom center)
    this.comboText = s.add.text(GAME_WIDTH/2, GAME_HEIGHT - 60, '', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.comboGlow
    }).setOrigin(0.5).setDepth(51).setAlpha(0);

    // Pause button
    const pauseBtn = s.add.text(GAME_WIDTH - 40, 8, '||', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.uiText,
      padding: { x: 8, y: 4 }
    }).setDepth(52).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => { s.pauseGame(); });
  }

  updateScore(score) {
    this.scoreText.setText(score.toLocaleString());
    this.scene.tweens.add({
      targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 120, yoyo: true
    });
  }

  updateStage(stage) {
    this.stageText.setText(`STAGE ${stage}`);
  }

  updateLives(lives) {
    for (let i = 0; i < 3; i++) {
      this.lifeIcons[i].setTexture(i < lives ? 'lifeFull' : 'lifeEmpty');
    }
  }

  updateCombo(combo) {
    if (combo >= 2) {
      const size = Math.min(42, 24 + Math.floor(combo / 5) * 3);
      this.comboText.setFontSize(size + 'px');
      this.comboText.setText(`x${combo}`);
      this.comboText.setAlpha(1);
      this.scene.tweens.add({
        targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true
      });
    } else {
      this.scene.tweens.add({
        targets: this.comboText, alpha: 0, duration: 200
      });
    }
  }
}
