// Birthday Bomb - HUD, Pause, Layout (mixin for GameScene)

var GameHUD = {
  createLayout: function() {
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xFFF8F0);
    this.queueX = this.W * 0.175;
    this.queueW = this.W * 0.35;
    this.add.rectangle(this.queueX, this.H / 2 + 20, this.queueW - 8, this.H - 180, 0xFFF8F0)
      .setStrokeStyle(2, 0x1C1C3A, 0.3);
    this.roomX = this.W * 0.675;
    this.roomW = this.W * 0.65;
    this.roomZone = this.add.rectangle(this.roomX, this.H / 2 + 20, this.roomW - 8, this.H - 180, 0xF5E6D3)
      .setStrokeStyle(2, 0x1C1C3A, 0.3);

    if (this.stageConfig.isRestStage) {
      this.add.text(this.roomX, 110, 'CHILL ROUND', {
        fontSize: '16px', fill: COLORS.reward, fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0.6);
    }

    this.roomCountText = this.add.text(this.roomX, this.H - 115, 'PEOPLE: 0 / ' + this.stageConfig.roomTarget, {
      fontSize: '13px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
  },

  createHUD: function() {
    this.add.rectangle(this.W / 2, 30, this.W, 60, 0x1C1C3A, 0.9).setDepth(50);
    this.scoreText = this.add.text(12, 18, 'SCORE: ' + GameState.score, {
      fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setDepth(51);
    if (this.textures.exists('bomb')) {
      this.bombImg = this.add.image(this.W / 2, 28, 'bomb').setScale(0.6).setDepth(51);
    }
    this.timerText = this.add.text(this.W / 2, 50, this.timer.toFixed(1) + 's', {
      fontSize: '16px', fill: '#FFD93D', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);
    this.timerBarBg = this.add.rectangle(this.W / 2, 68, this.W - 20, 12, 0x333333).setDepth(50);
    this.timerBar = this.add.rectangle(10, 62, this.W - 20, 12, 0xFFD93D).setOrigin(0, 0).setDepth(51);
    this.streakText = this.add.text(this.W - 12, 18, '', {
      fontSize: '14px', fill: COLORS.streakFlame, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(51);
    this.add.text(this.W / 2, 8, 'STAGE ' + GameState.stage, {
      fontSize: '10px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setDepth(51).setAlpha(0.7);
    this.updateHUD();
  },

  updateHUD: function() {
    this.scoreText.setText('SCORE: ' + GameState.score);
    this.timerText.setText(this.timer.toFixed(1) + 's');
    var pct = Math.max(0, this.timer / this.stageConfig.baseTimer);
    this.timerBar.setDisplaySize((this.W - 20) * pct, 12);
    if (this.timer < 5) {
      this.timerBar.setFillStyle(0xFF3B30);
      this.timerText.setColor(COLORS.danger);
    } else {
      this.timerBar.setFillStyle(0xFFD93D);
      this.timerText.setColor('#FFD93D');
    }
    this.streakText.setText(GameState.streak >= 3 ? 'STREAK: ' + GameState.streak : '');
    this.roomCountText.setText('PEOPLE: ' + this.roomCards.length + ' / ' + this.stageConfig.roomTarget);
  },

  setupPause: function() {
    var pauseBtn = this.add.rectangle(this.W - 25, 28, 36, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(52);
    this.add.text(this.W - 25, 28, '||', {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(53);
    pauseBtn.on('pointerdown', function() { this.togglePause(); }, this);
  },

  togglePause: function() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay: function() {
    this.pauseGroup = this.add.container(0, 0).setDepth(100);
    this.pauseGroup.add(this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x1C1C3A, 0.7));
    this.pauseGroup.add(this.add.text(this.W / 2, this.H * 0.25, 'PAUSED', {
      fontSize: '32px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    var btns = [
      { label: 'RESUME', color: 0x34C759, y: 0.40, fn: function() { this.togglePause(); } },
      { label: 'RESTART', color: 0xFFD93D, y: 0.50, fn: function() {
        this.hidePauseOverlay(); GameState.score = 0; GameState.stage = 1; GameState.streak = 0;
        this.scene.restart();
      }},
      { label: 'HOW TO PLAY', color: 0xE8E0FF, y: 0.60, fn: function() {
        this.scene.pause('GameScene');
        this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      }},
      { label: 'MENU', color: 0xFF3B30, y: 0.70, fn: function() {
        this.hidePauseOverlay(); this.scene.stop('GameScene'); this.scene.start('MenuScene');
      }}
    ];
    var scene = this;
    btns.forEach(function(b) {
      var btn = scene.add.rectangle(scene.W / 2, scene.H * b.y, 180, 48, b.color)
        .setInteractive({ useHandCursor: true });
      var txtColor = (b.color === 0xFFD93D || b.color === 0xE8E0FF) ? COLORS.text : '#FFFFFF';
      var txt = scene.add.text(scene.W / 2, scene.H * b.y, b.label, {
        fontSize: '18px', fill: txtColor, fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      btn.on('pointerdown', b.fn, scene);
      scene.pauseGroup.add(btn);
      scene.pauseGroup.add(txt);
    });
  },

  hidePauseOverlay: function() {
    this.paused = false;
    if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
  },

  setupVisibility: function() {
    var scene = this;
    this.visHandler = function() {
      if (document.hidden && !scene.paused && !scene.gameOver) scene.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }
};
