// Echo Dodge - UI Scenes (Menu, GameOver, Pause)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Animated background: orb tracing infinity loop
    this.bgOrb = this.add.image(w / 2, h / 2, 'player').setAlpha(0.3).setScale(0.8);
    this.bgTrailSegs = [];
    this.bgAngle = 0;

    // Title
    this.add.text(w / 2, h * 0.22, 'ECHO DODGE', {
      fontSize: '32px', fill: COLORS.playerHex, fontStyle: 'bold',
      stroke: '#006666', strokeThickness: 3
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w / 2, h * 0.29, 'Outrun your own ghost', {
      fontSize: '14px', fill: '#8888AA'
    }).setOrigin(0.5);

    // High score
    const hs = window.GameState.highScore;
    if (hs > 0) {
      this.add.text(w / 2, h * 0.35, `BEST: ${hs}`, {
        fontSize: '16px', fill: COLORS.accent, fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // Play button
    const btnY = h * 0.52;
    const playBg = this.add.rectangle(w / 2, btnY, 220, 56, 0x00CCCC, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY', {
      fontSize: '24px', fill: '#080810', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this._startGame());

    playBg.on('pointerdown', () => this._startGame());
    playBg.on('pointerover', () => playBg.setFillStyle(0x00FFFF, 1));
    playBg.on('pointerout', () => playBg.setFillStyle(0x00CCCC, 0.9));

    // Help button
    const helpBg = this.add.rectangle(w - 35, 35, 40, 40, 0x222244, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(w - 35, 35, '?', {
      fontSize: '22px', fill: COLORS.playerHex, fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }

  _startGame() {
    window.GameState.score = 0;
    window.GameState.stage = 1;
    this.scene.stop();
    this.scene.start('GameScene');
  }

  update(time) {
    // Infinity loop animation
    this.bgAngle += 0.008;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const cx = w / 2, cy = h * 0.7;
    const rx = 80, ry = 40;
    const x = cx + rx * Math.sin(this.bgAngle);
    const y = cy + ry * Math.sin(this.bgAngle * 2);
    this.bgOrb.setPosition(x, y);

    // Drop faint trail segments
    if (this.bgTrailSegs.length < 30) {
      const seg = this.add.image(x, y, 'trail').setAlpha(0.2).setScale(0.7);
      this.bgTrailSegs.push({ obj: seg, birth: time });
    }
    for (let i = this.bgTrailSegs.length - 1; i >= 0; i--) {
      const s = this.bgTrailSegs[i];
      const age = time - s.birth;
      if (age > 1500) {
        s.obj.destroy();
        this.bgTrailSegs.splice(i, 1);
      } else {
        s.obj.setAlpha(0.2 * (1 - age / 1500));
      }
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.isHighScore = data.isHighScore || false;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x080810, 0.92);

    // Death title
    this.add.text(w / 2, h * 0.2, 'ECHO DIED', {
      fontSize: '28px', fill: COLORS.deathTitle, fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.children.last, alpha: 1, duration: 300 });

    // Score count-up
    const scoreDisplay = this.add.text(w / 2, h * 0.34, '0', {
      fontSize: '36px', fill: COLORS.playerHex, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800, ease: 'Power2',
      onUpdate: (tw) => scoreDisplay.setText(Math.floor(tw.getValue()).toLocaleString())
    });

    // NEW BEST
    if (this.isHighScore) {
      const best = this.add.text(w / 2, h * 0.42, 'NEW BEST!', {
        fontSize: '20px', fill: COLORS.accent, fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: best, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: 2 });
    }

    // Stage reached
    this.add.text(w / 2, h * 0.49, `Reached Stage ${this.finalStage}`, {
      fontSize: '14px', fill: '#8888AA'
    }).setOrigin(0.5);

    // Play Again button
    const replayY = h * 0.62;
    const replayBg = this.add.rectangle(w / 2, replayY, 220, 56, 0x00CCCC, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, replayY, 'PLAY AGAIN', {
      fontSize: '20px', fill: '#080810', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this._replay());
    replayBg.on('pointerdown', () => this._replay());

    // Menu button
    const menuY = h * 0.74;
    const menuBg = this.add.rectangle(w / 2, menuY, 160, 46, 0x333355, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, menuY, 'MENU', {
      fontSize: '16px', fill: '#C0C0E0'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this._menu());
    menuBg.on('pointerdown', () => this._menu());

    AdsManager.trackDeath();
  }

  _replay() {
    window.GameState.score = 0;
    window.GameState.stage = 1;
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('GameScene');
  }

  _menu() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
