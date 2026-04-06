// Rush Hour Dash - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;
    GameState.highScore = parseInt(localStorage.getItem('rush-hour-dash_high_score') || '0', 10);

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.menuBg);

    this.add.text(w / 2, h * 0.22, 'RUSH HOUR\nDASH', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold',
      color: COLORS_STR.buttonPrimary, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.38, 'Tap to hop. Never stop.', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_STR.white
    }).setOrigin(0.5).setAlpha(0.7);

    this.add.text(w / 2, h * 0.44, 'BEST: ' + GameState.highScore, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.gold
    }).setOrigin(0.5);

    // Play button
    var playBg = this.add.rectangle(w / 2, h * 0.56, 200, 56, COLORS.buttonPrimary)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.56, 'PLAY', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonText
    }).setOrigin(0.5).setInteractive().on('pointerdown', function() { playBg.emit('pointerdown'); });

    var self = this;
    playBg.on('pointerdown', function() {
      self.cameras.main.fadeOut(200, 0, 0, 0);
      self.time.delayedCall(200, function() {
        self.scene.stop('MenuScene');
        self.scene.start('GameScene');
      });
    });

    // How to Play button
    var helpBg = this.add.rectangle(w / 2, h * 0.66, 200, 44, 0x000000, 0)
      .setStrokeStyle(2, COLORS.buttonPrimary).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.66, 'HOW TO PLAY', {
      fontSize: '15px', fontFamily: 'Arial', color: COLORS_STR.buttonPrimary
    }).setOrigin(0.5).setInteractive().on('pointerdown', function() { helpBg.emit('pointerdown'); });

    helpBg.on('pointerdown', function() {
      self.scene.pause('MenuScene');
      self.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    var w = this.cameras.main.width;
    this.isPaused = false;

    // HUD bar background
    this.add.rectangle(w / 2, HUD_HEIGHT / 2, w, HUD_HEIGHT, COLORS.hudBg).setDepth(10);

    this.scoreText = this.add.text(12, 14, 'SCORE: ' + GameState.score, {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setDepth(11);

    this.hopsText = this.add.text(150, 14, 'HOPS: ' + GameState.hops, {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_STR.white
    }).setDepth(11);

    this.stageText = this.add.text(245, 14, 'STAGE ' + GameState.stage, {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_STR.white
    }).setDepth(11);

    // Pause button
    var pauseBtn = this.add.text(w - 10, 14, '| |', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setOrigin(1, 0).setDepth(11).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', this.togglePause, this);

    // Help button
    var helpBtn = this.add.text(w - 42, 14, '?', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonPrimary
    }).setOrigin(1, 0).setDepth(11).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', this.showHelp, this);

    // Combo text
    this.comboText = this.add.text(w / 2, 120, '', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.comboText
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    // Danger overlay
    this.dangerOverlay = this.add.rectangle(w / 2, GAME_HEIGHT - 100, w, 200, COLORS.danger)
      .setAlpha(0).setDepth(9);

    // Pause overlay elements (hidden initially)
    this.pauseGroup = [];
    this.createPauseOverlay(w);

    // Listen for game events
    var gs = this.scene.get('GameScene');
    if (gs) {
      gs.events.on('scoreUpdate', this.updateScore, this);
      gs.events.on('hopUpdate', this.updateHops, this);
      gs.events.on('stageUpdate', this.updateStage, this);
      gs.events.on('comboUpdate', this.updateCombo, this);
      gs.events.on('dangerUpdate', this.updateDanger, this);
    }
  }

  createPauseOverlay(w) {
    var h = GAME_HEIGHT;
    var bg = this.add.rectangle(w / 2, h / 2, w, h, COLORS.menuBg).setAlpha(0).setDepth(20);
    var title = this.add.text(w / 2, h * 0.25, 'PAUSED', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setOrigin(0.5).setDepth(21).setVisible(false);

    var resumeBtn = this.add.rectangle(w / 2, h * 0.4, 180, 48, COLORS.buttonPrimary)
      .setDepth(21).setVisible(false).setInteractive({ useHandCursor: true });
    var resumeText = this.add.text(w / 2, h * 0.4, 'RESUME', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonText
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    resumeBtn.on('pointerdown', this.togglePause, this);

    var restartBtn = this.add.rectangle(w / 2, h * 0.5, 180, 44, 0x000000, 0)
      .setStrokeStyle(2, 0xFFFFFF).setDepth(21).setVisible(false).setInteractive({ useHandCursor: true });
    var restartText = this.add.text(w / 2, h * 0.5, 'RESTART', {
      fontSize: '15px', fontFamily: 'Arial', color: COLORS_STR.white
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    restartBtn.on('pointerdown', function() {
      this.hidePause();
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }, this);

    var helpBtn = this.add.rectangle(w / 2, h * 0.6, 180, 44, 0x000000, 0)
      .setStrokeStyle(2, COLORS.buttonPrimary).setDepth(21).setVisible(false).setInteractive({ useHandCursor: true });
    var helpText = this.add.text(w / 2, h * 0.6, 'HOW TO PLAY', {
      fontSize: '15px', fontFamily: 'Arial', color: COLORS_STR.buttonPrimary
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    helpBtn.on('pointerdown', this.showHelp, this);

    var menuBtn = this.add.rectangle(w / 2, h * 0.7, 180, 44, 0x000000, 0)
      .setStrokeStyle(2, COLORS.danger).setDepth(21).setVisible(false).setInteractive({ useHandCursor: true });
    var menuText = this.add.text(w / 2, h * 0.7, 'MENU', {
      fontSize: '15px', fontFamily: 'Arial', color: '#FF3B30'
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    menuBtn.on('pointerdown', function() {
      this.hidePause();
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }, this);

    this.pauseGroup = [bg, title, resumeBtn, resumeText, restartBtn, restartText,
                       helpBtn, helpText, menuBtn, menuText];
  }

  togglePause() {
    if (GameState.isDead) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.pause('GameScene');
      this.showPause();
    } else {
      this.scene.resume('GameScene');
      this.hidePause();
    }
  }

  showPause() {
    this.pauseGroup.forEach(function(obj, i) {
      obj.setVisible(true);
      if (i === 0) obj.setAlpha(0.85);
    });
  }

  hidePause() {
    this.isPaused = false;
    this.pauseGroup.forEach(function(obj) {
      obj.setVisible(false);
      if (obj.type === 'Rectangle' && obj.depth === 20) obj.setAlpha(0);
    });
  }

  showHelp() {
    this.scene.pause('GameScene');
    this.scene.pause('UIScene');
    this.scene.launch('HelpScene', { returnTo: 'GameScene' });
  }

  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText('SCORE: ' + score);
      this.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 100, yoyo: true });
    }
  }

  updateHops(hops) {
    if (this.hopsText) this.hopsText.setText('HOPS: ' + hops);
  }

  updateStage(stage) {
    if (this.stageText) {
      this.stageText.setText('STAGE ' + stage);
      this.tweens.add({ targets: this.stageText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
    }
  }

  updateCombo(combo) {
    if (!this.comboText) return;
    if (combo >= 2) {
      this.comboText.setText('x' + combo + ' DASH!');
      this.comboText.setAlpha(1);
    } else {
      if (this.comboText.alpha > 0) {
        this.tweens.add({ targets: this.comboText, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 200 });
      }
    }
  }

  updateDanger(alpha) {
    if (this.dangerOverlay) this.dangerOverlay.setAlpha(alpha);
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalHops = data.hops || 0;
    this.finalStage = data.stage || 1;
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.menuBg).setAlpha(0.92);

    var title = this.add.text(w / 2, h * 0.18, 'GAME OVER', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF3B30'
    }).setOrigin(0.5).setScale(2);
    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

    // Score count-up
    var scoreDisplay = this.add.text(w / 2, h * 0.32, 'SCORE: 0', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setOrigin(0.5);
    var counter = { val: 0 };
    var fs = this.finalScore;
    this.tweens.add({
      targets: counter, val: fs, duration: 600, ease: 'Power2',
      onUpdate: function() { scoreDisplay.setText('SCORE: ' + Math.floor(counter.val)); }
    });

    this.add.text(w / 2, h * 0.40, 'HOPS: ' + this.finalHops + '  STAGE: ' + this.finalStage, {
      fontSize: '14px', fontFamily: 'Arial', color: '#AAAAAA'
    }).setOrigin(0.5);

    if (this.isNewRecord) {
      var rec = this.add.text(w / 2, h * 0.47, 'NEW RECORD!', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.gold
      }).setOrigin(0.5);
      this.tweens.add({ targets: rec, scaleX: 1.3, scaleY: 1.3, yoyo: true, repeat: 2, duration: 300 });
    }

    var self = this;

    // Continue button (ad)
    if (!AdsManager.continueUsedThisSession) {
      var contBtn = this.add.rectangle(w / 2, h * 0.57, 240, 48, COLORS.carB)
        .setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.57, 'CONTINUE - Watch Ad', {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
      }).setOrigin(0.5);
      contBtn.on('pointerdown', function() {
        AdsManager.continueUsedThisSession = true;
        self.scene.stop('GameOverScene');
        // Resume game - re-pass continue data
        var gs = self.scene.get('GameScene');
        if (gs) gs.onContinue();
      });
    }

    // Play Again
    var btnY = this.isNewRecord || !AdsManager.continueUsedThisSession ? h * 0.67 : h * 0.57;
    var playBtn = this.add.rectangle(w / 2, btnY, 200, 52, COLORS.buttonPrimary)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonText
    }).setOrigin(0.5);
    playBtn.on('pointerdown', function() {
      self.scene.stop('GameOverScene');
      self.scene.stop('GameScene');
      self.scene.start('GameScene');
    });

    // Menu button
    var menuBtn = this.add.rectangle(w / 2, btnY + 60, 160, 44, 0x000000, 0)
      .setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY + 60, 'MENU', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_STR.white
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', function() {
      self.scene.stop('GameOverScene');
      self.scene.stop('GameScene');
      self.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
