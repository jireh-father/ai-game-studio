// Birthday Bomb - UI Scenes (MenuScene, GameOverScene)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    var W = this.cameras.main.width;
    var H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0xE8E0FF);

    // Decorative confetti
    for (var i = 0; i < 20; i++) {
      var cx = Math.random() * W;
      var cy = Math.random() * H * 0.4;
      var color = [0xFF6B9D, 0xFFD93D, 0x5AC8FA, 0x34C759, 0xAF52DE][i % 5];
      this.add.circle(cx, cy, 3 + Math.random() * 4, color, 0.5);
    }

    // Title
    this.add.text(W / 2, H * 0.18, 'BIRTHDAY\nBOMB', {
      fontSize: '48px', fill: COLORS.text, fontFamily: 'Arial',
      fontStyle: 'bold', align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Bomb icon
    if (this.textures.exists('bomb')) {
      var bomb = this.add.image(W / 2, H * 0.38, 'bomb').setScale(1.5);
      this.tweens.add({ targets: bomb, alpha: 0.7, duration: 500, yoyo: true, repeat: -1 });
    }

    // Play button
    var playBtn = this.add.rectangle(W / 2, H * 0.55, 200, 64, 0xFF6B9D, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(3, 0xC44D6D);
    var playTxt = this.add.text(W / 2, H * 0.55, 'PLAY', {
      fontSize: '28px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', function() {
      GameState.score = 0;
      GameState.stage = 1;
      GameState.streak = 0;
      GameState.correctBets = 0;
      GameState.totalBets = 0;
      AdsManager.resetSession();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    }, this);

    // Help button
    var helpBtn = this.add.rectangle(W - 40, 40, 48, 48, 0xE8E0FF, 1)
      .setStrokeStyle(2, 0x1C1C3A).setInteractive({ useHandCursor: true });
    this.add.text(W - 40, 40, '?', {
      fontSize: '28px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBtn.on('pointerdown', function() {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    }, this);

    // High score
    var hs = loadHighScore();
    if (hs > 0) {
      this.add.text(W / 2, H * 0.65, 'HIGH SCORE: ' + hs, {
        fontSize: '18px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // Birthday paradox teaser
    this.add.text(W / 2, H * 0.82, 'Can YOU beat the Birthday Paradox?', {
      fontSize: '14px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'italic', alpha: 0.7
    }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.stageReached = data.stage || 1;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    var W = this.cameras.main.width;
    var H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1C1C3A, 0.85);

    // BOOM text
    this.add.text(W / 2, H * 0.18, 'BOOM!', {
      fontSize: '72px', fill: COLORS.danger, fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#fff', strokeThickness: 4
    }).setOrigin(0.5);

    // Score with count-up
    var scoreTxt = this.add.text(W / 2, H * 0.35, '0', {
      fontSize: '48px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    var finalScore = this.finalScore;
    this.tweens.addCounter({
      from: 0, to: finalScore, duration: 1000,
      onUpdate: function(t) { scoreTxt.setText(Math.floor(t.getValue())); }
    });

    // New high score
    if (this.isNewHigh) {
      var hsText = this.add.text(W / 2, H * 0.45, 'NEW HIGH SCORE!', {
        fontSize: '22px', fill: '#FFD93D', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: hsText, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: -1 });
      // Gold confetti
      for (var i = 0; i < 15; i++) {
        var cx = W * 0.2 + Math.random() * W * 0.6;
        this.add.circle(cx, H * 0.42, 3 + Math.random() * 3, 0xFFD93D, 0.7 + Math.random() * 0.3);
      }
    }

    // Stage reached
    this.add.text(W / 2, H * 0.53, 'STAGE ' + this.stageReached, {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Revive button (once per session)
    if (!AdsManager.reviveUsed) {
      var revBtn = this.add.rectangle(W / 2, H * 0.65, 220, 56, 0xFF9500, 1).setInteractive({ useHandCursor: true });
      revBtn.setStrokeStyle(2, 0xCC7700);
      this.add.text(W / 2, H * 0.65, '+10s REVIVE', {
        fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      revBtn.on('pointerdown', function() {
        AdsManager.reviveUsed = true;
        AdsManager.showRewarded(function() {
          this.scene.stop('GameOverScene');
          this.scene.get('GameScene').revivePlayer();
          this.scene.resume('GameScene');
        }.bind(this));
      }, this);
    }

    // Play again
    var playBtn = this.add.rectangle(W / 2, H * 0.76, 200, 64, 0xFF6B9D, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(3, 0xC44D6D);
    this.add.text(W / 2, H * 0.76, 'PLAY AGAIN', {
      fontSize: '22px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', function() {
      GameState.score = 0;
      GameState.stage = 1;
      GameState.streak = 0;
      GameState.correctBets = 0;
      GameState.totalBets = 0;
      AdsManager.resetSession();
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }, this);

    // Menu button
    var menuBtn = this.add.rectangle(W / 2, H * 0.86, 140, 48, 0x000000, 0)
      .setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.86, 'MENU', {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', function() {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }, this);

    AdsManager.onGameOver();
    if (AdsManager.shouldShowInterstitial()) {
      AdsManager.showInterstitial();
    }
  }
}
