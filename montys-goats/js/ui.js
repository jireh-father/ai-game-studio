// Monty's Goats - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Monty avatar dancing
    const monty = this.add.image(w / 2, 160, 'monty').setScale(2);
    this.tweens.add({ targets: monty, angle: -5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Title
    const title = this.add.text(w / 2, 280, "MONTY'S\nGOATS", {
      fontSize: '44px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold',
      align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 1000, yoyo: true, repeat: -1 });

    const subtitle = this.add.text(w / 2, 345, 'Can you outsmart the lying host?', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#AAAACC', fontStyle: 'italic'
    }).setOrigin(0.5);

    // PLAY button
    const playBg = this.add.rectangle(w / 2, 420, 200, 60, COLORS.reward).setInteractive().setDepth(5);
    const playLabel = this.add.text(w / 2, 420, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    playLabel.disableInteractive();
    playBg.on('pointerdown', () => {
      GameState.score = 0;
      GameState.round = 0;
      GameState.strikes = 0;
      GameState.combo = 0;
      GameState.gamesPlayed++;
      this.tweens.add({ targets: playBg, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true,
        onComplete: () => { this.scene.stop(); this.scene.start('GameScene'); }
      });
    });

    // HOW TO PLAY button
    const helpBg = this.add.rectangle(w / 2, 500, 200, 45, 0x333355).setStrokeStyle(2, 0xFFFFFF).setInteractive().setDepth(5);
    const helpLabel = this.add.text(w / 2, 500, 'HOW TO PLAY ?', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(6);
    helpLabel.disableInteractive();
    helpBg.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(w / 2, 560, `HIGH SCORE: ${hs}`, {
        fontSize: '14px', fontFamily: 'Arial', fill: '#FFD700'
      }).setOrigin(0.5);
    }

    // Sound toggle
    this.soundOn = true;
    this.soundBtn = this.add.text(30, 20, 'SND', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF', backgroundColor: '#333355',
      padding: { x: 8, y: 4 }
    }).setInteractive().setDepth(10);
    this.soundBtn.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      this.soundBtn.setAlpha(this.soundOn ? 1 : 0.4);
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Header
    this.add.text(w / 2, 100, 'GOAT MODE!', {
      fontSize: '36px', fontFamily: 'Arial', fill: '#FF2D55', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Dancing goat
    const goat = this.add.image(w / 2, 190, 'goatBig').setScale(1.2);
    this.tweens.add({ targets: goat, y: 180, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Score
    const scoreText = this.add.text(w / 2, 280, `${GameState.score}`, {
      fontSize: '48px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: scoreText, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.Out' });

    this.add.text(w / 2, 320, `Round ${GameState.round}`, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#AAAACC'
    }).setOrigin(0.5);

    // New record
    if (GameState.score >= GameState.highScore && GameState.score > 0) {
      const rec = this.add.text(w / 2, 350, 'NEW RECORD!', {
        fontSize: '20px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: rec, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    // Ad continue button (placeholder)
    const adBg = this.add.rectangle(w / 2, 410, 240, 50, 0x32CD32).setInteractive().setDepth(5);
    const adLabel = this.add.text(w / 2, 410, 'WATCH AD TO CONTINUE', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    adLabel.disableInteractive();
    adBg.on('pointerdown', () => {
      AdManager.showRewarded(() => {
        GameState.strikes = 0;
        this.scene.stop();
        this.scene.start('GameScene');
      }, () => {});
    });
    // Fade out ad button after 4s
    this.time.delayedCall(4000, () => {
      this.tweens.add({ targets: [adBg, adLabel], alpha: 0, duration: 300 });
    });

    // Play Again
    const playBg = this.add.rectangle(w / 2, 480, 200, 55, COLORS.reward).setInteractive().setDepth(5);
    const playLabel = this.add.text(w / 2, 480, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    playLabel.disableInteractive();
    playBg.on('pointerdown', () => {
      GameState.score = 0;
      GameState.round = 0;
      GameState.strikes = 0;
      GameState.combo = 0;
      GameState.gamesPlayed++;
      this.scene.stop();
      this.scene.start('GameScene');
    });

    // Menu
    const menuBg = this.add.rectangle(w / 2, 550, 140, 40, 0x333355).setStrokeStyle(2, 0xFFFFFF).setInteractive().setDepth(5);
    const menuLabel = this.add.text(w / 2, 550, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(6);
    menuLabel.disableInteractive();
    menuBg.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('MenuScene');
    });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    // Semi-transparent overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(50);

    this.add.text(w / 2, 150, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);

    const buttons = [
      { label: 'RESUME', y: 260, cb: () => this.resumeGame() },
      { label: 'RESTART', y: 330, cb: () => { GameState.score = 0; GameState.round = 0; GameState.strikes = 0; GameState.combo = 0; GameState.gamesPlayed++; this.scene.stop('GameScene'); this.scene.stop(); this.scene.start('GameScene'); } },
      { label: 'HOW TO PLAY ?', y: 400, cb: () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'PauseScene' }); } },
      { label: 'MENU', y: 470, cb: () => { this.scene.stop('GameScene'); this.scene.stop(); this.scene.start('MenuScene'); } }
    ];

    buttons.forEach(b => {
      const bg = this.add.rectangle(w / 2, b.y, 200, 50, 0x333355).setStrokeStyle(2, 0xFFFFFF).setInteractive().setDepth(51);
      const lbl = this.add.text(w / 2, b.y, b.label, {
        fontSize: '18px', fontFamily: 'Arial', fill: '#FFFFFF'
      }).setOrigin(0.5).setDepth(52);
      lbl.disableInteractive();
      bg.on('pointerdown', b.cb);
    });
  }

  resumeGame() {
    const gs = this.scene.get('GameScene');
    if (gs) {
      gs.paused = false;
      this.scene.resume('GameScene');
    }
    this.scene.stop();
  }
}
