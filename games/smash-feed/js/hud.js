// HUD mixin — attached to GameScene via Object.assign
var GameHUD = {
  createHUD: function() {
    var w = this.scale.width;
    this.add.rectangle(w / 2, 24, w, 48, 0x0D1B2A, 0.9).setDepth(90);
    this.scoreText = this.add.text(16, 14, '' + this.score, {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#F8F9FA'
    }).setDepth(91);
    this.stageText = this.add.text(w / 2, 14, 'STAGE ' + this.stage, {
      fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5, 0).setDepth(91);

    this.hearts = [];
    for (var i = 0; i < MAX_LIVES; i++) {
      var hx = w - 30 - i * 32;
      var heart = this.add.text(hx, 12, '\u2764', {
        fontSize: '22px', color: '#E63946'
      }).setOrigin(0.5, 0).setDepth(91);
      this.hearts.push(heart);
    }

    var pauseBtn = this.add.text(w - 8, 14, '\u23F8', {
      fontSize: '20px', color: '#F8F9FA'
    }).setOrigin(1, 0).setDepth(92).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', function(p) {
      p.event.stopPropagation();
      this.togglePause();
    }, this);
  },

  updateHUD: function() {
    if (this.scoreText) this.scoreText.setText('' + this.score);
    if (this.stageText) this.stageText.setText('STAGE ' + this.stage);
    if (this.scoreText) this.scalePunch(this.scoreText, 1.3, 100);
  },

  updateLifeDisplay: function() {
    for (var i = 0; i < this.hearts.length; i++) {
      var alive = i < this.lives;
      this.hearts[i].setColor(alive ? '#E63946' : '#3A3A3A');
      if (!alive && i === this.lives) {
        this.scalePunch(this.hearts[i], 1.5, 200);
      }
    }
  },

  togglePause: function() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.pause();
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
      this.scene.resume();
    }
  },

  showPauseOverlay: function() {
    var w = this.scale.width, h = this.scale.height;
    this.pauseGroup = this.add.group();
    var bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.85).setDepth(100).setInteractive();
    this.pauseGroup.add(bg);

    var title = this.add.text(w / 2, h * 0.25, 'PAUSED', {
      fontFamily: 'Arial', fontSize: '32px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5).setDepth(101);
    this.pauseGroup.add(title);

    var btns = [
      { label: 'RESUME', color: 0x52B788, action: 'resume' },
      { label: 'RESTART', color: 0xE9C46A, action: 'restart' },
      { label: 'HOW TO PLAY ?', color: 0x1B2838, action: 'help' },
      { label: 'MAIN MENU', color: 0x3A3A3A, action: 'menu' }
    ];

    var self = this;
    var by = h * 0.40;
    btns.forEach(function(b) {
      var btn = self.add.rectangle(w / 2, by, 200, 44, b.color).setDepth(101).setInteractive({ useHandCursor: true });
      var txt = self.add.text(w / 2, by, b.label, {
        fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold',
        color: b.action === 'restart' ? '#1A1A2E' : '#F8F9FA'
      }).setOrigin(0.5).setDepth(102).disableInteractive();
      self.pauseGroup.add(btn);
      self.pauseGroup.add(txt);

      btn.on('pointerdown', function() {
        if (b.action === 'resume') {
          self.paused = false;
          self.hidePauseOverlay();
          self.scene.resume();
        } else if (b.action === 'restart') {
          self.hidePauseOverlay();
          self.scene.stop('GameScene');
          self.scene.start('GameScene');
        } else if (b.action === 'help') {
          self.scene.launch('HelpScene', { returnTo: 'GameScene' });
        } else if (b.action === 'menu') {
          self.hidePauseOverlay();
          self.scene.stop('GameScene');
          self.scene.start('MenuScene');
        }
      });
      by += 56;
    });
  },

  hidePauseOverlay: function() {
    if (this.pauseGroup) {
      this.pauseGroup.clear(true, true);
      this.pauseGroup = null;
    }
  }
};
