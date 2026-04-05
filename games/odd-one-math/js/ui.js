class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(cx, cy, GAME_W, GAME_H, COLOR.bg);

    this.add.text(cx, 140, 'ODD ONE', { fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex }).setOrigin(0.5);
    this.add.text(cx, 185, 'MATH', { fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.numberText }).setOrigin(0.5);
    this.add.text(cx, 225, 'Find the number that doesn\'t belong', { fontSize: '13px', fontFamily: 'Arial', color: '#64748B' }).setOrigin(0.5);

    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(cx, 265, `Best: ${hs}`, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EAB308' }).setOrigin(0.5);
    }

    // Play button
    const playBtn = this.add.rectangle(cx, 350, 260, 64, COLOR.accent).setInteractive({ useHandCursor: true });
    this.add.text(cx, 350, 'PLAY', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Effects.buttonSound(this);
      this.scene.stop();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.rectangle(cx, 430, 260, 50, 0x000000, 0).setStrokeStyle(2, COLOR.accent).setInteractive({ useHandCursor: true });
    this.add.text(cx, 430, 'HOW TO PLAY', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      Effects.buttonSound(this);
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const muteTxt = this.add.text(40, GAME_H - 40, GameState.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A', { fontSize: '28px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    muteTxt.on('pointerdown', () => {
      GameState.muted = !GameState.muted;
      muteTxt.setText(GameState.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A');
    });

    this.add.text(cx, GAME_H - 20, 'v1.0', { fontSize: '10px', fontFamily: 'Arial', color: '#94A3B8' }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.categoriesSeen = data.categoriesSeen || [];
    this.isNewHigh = data.isNewHigh || false;
    this.canContinue = data.canContinue || false;
    this.continueCallback = data.continueCallback || null;
  }

  create() {
    const cx = GAME_W / 2;
    this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x0F172A);

    this.add.text(cx, 80, 'GAME OVER', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EF4444' }).setOrigin(0.5);

    const scoreColor = this.isNewHigh ? '#EAB308' : '#FFFFFF';
    this.add.text(cx, 140, `${this.finalScore}`, { fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold', color: scoreColor }).setOrigin(0.5);
    if (this.isNewHigh) {
      this.add.text(cx, 175, 'NEW BEST!', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EAB308' }).setOrigin(0.5);
    } else {
      this.add.text(cx, 175, `Best: ${GameState.highScore}`, { fontSize: '14px', fontFamily: 'Arial', color: '#94A3B8' }).setOrigin(0.5);
    }

    this.add.text(cx, 210, `Stage ${this.stageReached}`, { fontSize: '18px', fontFamily: 'Arial', color: '#CBD5E1' }).setOrigin(0.5);

    if (this.categoriesSeen.length > 0) {
      const unique = [...new Set(this.categoriesSeen)];
      this.add.text(cx, 245, 'Categories learned:', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: COLOR.accentHex }).setOrigin(0.5);
      const catText = unique.slice(0, 6).join(', ');
      this.add.text(cx, 268, catText, { fontSize: '11px', fontFamily: 'Arial', color: '#94A3B8', wordWrap: { width: 300 }, align: 'center' }).setOrigin(0.5);
    }

    let btnY = 330;

    // Continue button
    if (this.canContinue) {
      const contBtn = this.add.rectangle(cx, btnY, 260, 50, 0x22C55E).setInteractive({ useHandCursor: true });
      this.add.text(cx, btnY, 'CONTINUE (AD)', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        Effects.buttonSound(this);
        if (this.continueCallback) this.continueCallback();
      });
      btnY += 65;
    }

    // Play again
    const playBtn = this.add.rectangle(cx, btnY, 260, 50, COLOR.accent).setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'PLAY AGAIN', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Effects.buttonSound(this);
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 65;

    // Menu
    const menuBtn = this.add.rectangle(cx, btnY, 260, 50, 0x000000, 0).setStrokeStyle(2, 0x475569).setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, 'MENU', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#94A3B8' }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      Effects.buttonSound(this);
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    AdsManager.trackGameOver();
  }
}
