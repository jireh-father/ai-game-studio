class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    var w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

    // Floating food decorations
    for (var i = 0; i < 6; i++) {
      var fx = 40 + Math.random() * (w - 80);
      var fy = 100 + Math.random() * (h - 300);
      var keys = ['tomato', 'burger', 'watermelon'];
      var img = this.add.image(fx, fy, keys[i % 3]).setScale(0.6).setAlpha(0.2);
      this.tweens.add({ targets: img, y: fy - 20, duration: 2000 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Title
    this.add.text(w / 2, h * 0.2, 'SMASH\nFEED', {
      fontFamily: 'Arial', fontSize: '52px', fontStyle: 'bold',
      color: '#E63946', align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.33, 'Smash food before it hits your face!', {
      fontFamily: 'Arial', fontSize: '13px', color: '#F8F9FA'
    }).setOrigin(0.5);

    // Play button
    var playBtn = this.add.rectangle(w / 2, h * 0.48, 200, 56, 0xE63946).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.48, 'PLAY!', {
      fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).disableInteractive();

    playBtn.on('pointerdown', function() {
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    }, this);

    // How to Play button
    var helpBtn = this.add.rectangle(w / 2, h * 0.58, 200, 44, 0x1B2838).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.58, 'HOW TO PLAY ?', {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5).disableInteractive();

    helpBtn.on('pointerdown', function() {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    }, this);

    // High score
    var hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(w / 2, h * 0.68, 'BEST: ' + hs, {
        fontFamily: 'Arial', fontSize: '16px', color: '#FFD166'
      }).setOrigin(0.5);
    }

    // Sound toggle
    var soundTxt = this.add.text(30, h - 40, GameState.soundOn ? '🔊' : '🔇', {
      fontSize: '28px'
    }).setInteractive({ useHandCursor: true });
    soundTxt.on('pointerdown', function() {
      GameState.soundOn = !GameState.soundOn;
      soundTxt.setText(GameState.soundOn ? '🔊' : '🔇');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    var w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.92);

    // Splat decorations
    var g = this.add.graphics();
    for (var s = 0; s < 8; s++) {
      g.fillStyle([0xE63946, 0x8B4513, 0xD62828, 0xE76F51][s % 4], 0.3);
      g.fillCircle(Math.random() * w, Math.random() * h, 20 + Math.random() * 40);
    }

    var y = h * 0.18;
    this.add.text(w / 2, y, 'GAME OVER', {
      fontFamily: 'Arial', fontSize: '38px', fontStyle: 'bold',
      color: '#E63946', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    if (this.isNewRecord) {
      var nr = this.add.text(w / 2, y + 40, 'NEW RECORD!', {
        fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#FFD166'
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    y = h * 0.38;
    this.add.text(w / 2, y, 'SCORE: ' + this.finalScore, {
      fontFamily: 'Arial', fontSize: '28px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5);
    this.add.text(w / 2, y + 35, 'BEST: ' + GameState.highScore, {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFD166'
    }).setOrigin(0.5);
    this.add.text(w / 2, y + 60, 'STAGE: ' + this.finalStage, {
      fontFamily: 'Arial', fontSize: '16px', color: '#F8F9FA'
    }).setOrigin(0.5);

    // Continue button (once per session)
    var btnY = h * 0.58;
    if (!AdState.sessionContinueUsed) {
      var contBtn = this.add.rectangle(w / 2, btnY, 200, 48, 0x7209B7).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'CONTINUE (AD)', {
        fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5).disableInteractive();
      var self = this;
      contBtn.on('pointerdown', function() {
        AdState.sessionContinueUsed = true;
        showRewarded(function() {
          self.scene.stop('GameOverScene');
          var gs = self.scene.get('GameScene');
          if (gs) gs.continueFromDeath();
        });
      });
      btnY += 60;
    }

    // Play Again
    var playBtn = this.add.rectangle(w / 2, btnY, 200, 48, 0xE63946).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', function() {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }, this);

    // Main Menu
    btnY += 56;
    var menuBtn = this.add.rectangle(w / 2, btnY, 200, 48, 0x3A3A3A).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'MAIN MENU', {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', function() {
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }, this);

    AdState.gamesPlayed++;
    if (shouldShowInterstitial()) {
      showInterstitial();
    }
  }
}
