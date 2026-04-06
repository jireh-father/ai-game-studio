// ui.js — MenuScene, GameOverScene, HUD

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    var w = SCREEN.WIDTH;
    var h = SCREEN.HEIGHT;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A14);

    // Title with colored letters
    var titleColors = ['#FF3355', '#3399FF', '#33FF88', '#FFDD00'];
    var title = 'COLOR GATE RUSH';
    var startX = 28;
    for (var i = 0; i < title.length; i++) {
      this.add.text(startX + i * 20, 120, title[i], {
        fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
        color: titleColors[i % titleColors.length]
      }).setOrigin(0, 0.5);
    }

    // High score
    var hi = GameState ? GameState.highScore : 0;
    this.add.text(w / 2, 180, 'BEST: ' + hi, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Color cycle demo animation
    var demoColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
    var demoBalls = [];
    for (var d = 0; d < 4; d++) {
      var db = this.add.circle(110 + d * 50, 220, 12, demoColors[d].hex);
      demoBalls.push(db);
    }
    // Animate demo balls pulsing
    var self = this;
    demoBalls.forEach(function(b, idx) {
      self.tweens.add({
        targets: b,
        scaleX: 1.3, scaleY: 1.3,
        duration: 400,
        yoyo: true,
        repeat: -1,
        delay: idx * 200
      });
    });

    // PLAY button
    var playBtn = this.add.rectangle(w / 2, 300, 200, 56, 0x00FFCC, 1)
      .setInteractive({ useHandCursor: true });
    var playText = this.add.text(w / 2, 300, 'PLAY', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5);
    playText.disableInteractive();

    playBtn.on('pointerdown', function() {
      AUDIO.playUIClick();
      Ads.resetRun();
      self.scene.stop('MenuScene');
      self.scene.start('GameScene');
    });

    // HOW TO PLAY button
    var helpBtn = this.add.rectangle(w / 2, 376, 200, 44, 0x1A1A2E, 1)
      .setStrokeStyle(1, 0x888899)
      .setInteractive({ useHandCursor: true });
    var helpText = this.add.text(w / 2, 376, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);
    helpText.disableInteractive();

    helpBtn.on('pointerdown', function() {
      AUDIO.playUIClick();
      self.scene.pause('MenuScene');
      self.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalStage = data.stage || 1;
    this.finalCombo = data.maxCombo || 0;
  }

  create() {
    var w = SCREEN.WIDTH;
    var h = SCREEN.HEIGHT;
    var self = this;

    // Dark overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A14, 0.92);

    // Check high score
    var isNewBest = false;
    if (GameState && this.finalScore > GameState.highScore) {
      GameState.highScore = this.finalScore;
      GameState.save();
      isNewBest = true;
    }

    // GAME OVER title
    this.add.text(w / 2, 200, 'GAME OVER', {
      fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF3355'
    }).setOrigin(0.5);

    // Score
    var scoreTxt = this.add.text(w / 2, 280, '' + this.finalScore, {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    if (isNewBest) {
      this.add.text(w / 2, 330, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
      }).setOrigin(0.5);
      AUDIO.playHighScore();
      // Gold pulse
      this.tweens.add({
        targets: scoreTxt, scaleX: 1.2, scaleY: 1.2,
        duration: 200, yoyo: true, repeat: 2
      });
    }

    // Stage reached
    this.add.text(w / 2, 360, 'Stage ' + this.finalStage, {
      fontSize: '18px', fontFamily: 'Arial', color: '#888899'
    }).setOrigin(0.5);

    var btnY = 420;

    // Continue button (if available)
    if (Ads.canContinue()) {
      var contBtn = this.add.rectangle(w / 2, btnY, 220, 52, 0xFFD700)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, btnY, 'CONTINUE (AD)', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000000'
      }).setOrigin(0.5).disableInteractive();
      contBtn.on('pointerdown', function() {
        AUDIO.playUIClick();
        Ads.markContinueUsed();
        Ads.showRewarded(function() {
          self.scene.stop('GameOverScene');
          self.scene.start('GameScene', {
            continueFrom: true,
            score: self.finalScore,
            stage: self.finalStage
          });
        });
      });
      btnY += 68;
    }

    // Play again
    var retryBtn = this.add.rectangle(w / 2, btnY, 200, 52, 0x00FFCC)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5).disableInteractive();
    retryBtn.on('pointerdown', function() {
      AUDIO.playUIClick();
      Ads.showInterstitial(function() {
        self.scene.stop('GameOverScene');
        self.scene.start('GameScene');
      });
    });
    btnY += 64;

    // Menu button
    var menuBtn = this.add.rectangle(w / 2, btnY, 160, 44, 0x1A1A2E)
      .setStrokeStyle(1, 0x888899)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888899'
    }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', function() {
      AUDIO.playUIClick();
      self.scene.stop('GameOverScene');
      self.scene.start('MenuScene');
    });
  }
}
