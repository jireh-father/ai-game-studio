// Blade Spin - Effects & Juice
var SoundFX = {
  ctx: null,
  init: function() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  resume: function() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play: function(freq, dur, type, vol, freqEnd) {
    if (!this.ctx) return;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (freqEnd) o.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + dur / 1000);
    g.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur / 1000);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur / 1000);
  },
  throwSound: function() {
    this.play(800, 120, 'sine', 0.12, 300);
  },
  landSound: function() {
    this.play(180, 150, 'triangle', 0.2);
  },
  clangSound: function() {
    this.play(440, 200, 'square', 0.15);
    this.play(880, 200, 'square', 0.1);
  },
  shieldHitSound: function() {
    this.play(220, 250, 'sawtooth', 0.15);
  },
  appleSound: function() {
    var self = this;
    [523, 659, 784].forEach(function(f, i) {
      setTimeout(function() { self.play(f, 100, 'sine', 0.12); }, i * 80);
    });
  },
  comboTick: function(combo) {
    this.play(440 * Math.pow(1.1, combo), 80, 'sine', 0.1);
  },
  stageClear: function() {
    var self = this;
    [440, 523, 587, 659, 784].forEach(function(f, i) {
      setTimeout(function() { self.play(f, 80, 'triangle', 0.1); }, i * 60);
    });
  },
  bossStart: function() {
    this.play(60, 400, 'sine', 0.25);
  },
  autoThrowWarn: function() {
    this.play(800, 80, 'square', 0.1);
  },
  uiClick: function() {
    this.play(400, 50, 'sine', 0.08);
  },
  gameOver: function() {
    this.play(500, 600, 'sine', 0.15, 200);
  },
  highScore: function() {
    var self = this;
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach(function(f, i) {
      setTimeout(function() { self.play(f, 100, 'sine', 0.1); }, i * 90);
    });
  }
};

// Effects mixin for GameScene
var GameEffects = {
  spawnWoodChips: function(x, y, count) {
    count = count || 6;
    for (var i = 0; i < count; i++) {
      var chip = this.add.image(x, y, 'particle').setScale(1);
      var angle = Math.random() * Math.PI * 2;
      var speed = 80 + Math.random() * 60;
      this.tweens.add({
        targets: chip, x: x + Math.cos(angle) * speed * 0.4,
        y: y + Math.sin(angle) * speed * 0.4 + 40,
        alpha: 0, duration: 350, ease: 'Quad.Out',
        onComplete: function() { chip.destroy(); }
      });
    }
  },

  spawnAppleBurst: function(x, y) {
    for (var i = 0; i < 12; i++) {
      var star = this.add.image(x, y, 'gold-particle').setScale(1);
      var angle = (Math.PI * 2 / 12) * i;
      var dist = 60 + Math.random() * 40;
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, angle: 360, duration: 600, ease: 'Quad.Out',
        onComplete: function() { star.destroy(); }
      });
    }
  },

  scalePunch: function(target, scale, dur) {
    if (!target || !target.scene) return;
    this.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: dur || 200, yoyo: true, ease: 'Back.Out'
    });
  },

  floatingText: function(x, y, text, color, size, riseY, dur) {
    var txt = this.add.text(x, y, text, {
      fontSize: (size || 18) + 'px', fill: color || '#FFFFFF',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: txt, y: y - (riseY || 40), alpha: 0,
      duration: dur || 700, ease: 'Quad.Out',
      onComplete: function() { txt.destroy(); }
    });
  },

  flashOverlay: function(color, alpha, dur) {
    var rect = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H,
      parseInt(color.replace('#', ''), 16)).setAlpha(0).setDepth(200);
    this.tweens.add({
      targets: rect, alpha: alpha, duration: dur * 0.4, yoyo: true,
      hold: dur * 0.1, ease: 'Quad.Out',
      onComplete: function() { rect.destroy(); }
    });
  },

  comboFlash: function(combo) {
    if (combo < 5) return;
    var border = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H)
      .setStrokeStyle(combo >= 8 ? 20 : 10, 0xFF7A00).setFillStyle().setAlpha(0).setDepth(199);
    this.tweens.add({
      targets: border, alpha: combo >= 8 ? 0.5 : 0.3, duration: 150,
      yoyo: true, ease: 'Quad.Out',
      onComplete: function() { border.destroy(); }
    });
  },

  togglePause: function() {
    this.paused = !this.paused;
    if (this.paused) {
      this.createPauseUI();
    } else {
      if (this.pauseElements) { this.pauseElements.forEach(function(e) { if (e) e.destroy(); }); this.pauseElements = null; }
      this.lastInputTime = Date.now();
    }
  },

  createPauseUI: function() {
    var self = this;
    var bg = this.add.rectangle(GAME_W/2, GAME_H/2, GAME_W, GAME_H, 0x0D0D0D, 0.8).setDepth(500);
    var t = this.add.text(GAME_W/2, 200, 'PAUSED', {fontSize:'32px',fill:COL_SCORE,fontStyle:'bold'}).setOrigin(0.5).setDepth(501);
    var items = [[350,'RESUME'],[420,'HOW TO PLAY'],[490,'QUIT TO MENU']];
    var els = [bg, t];
    items.forEach(function(item) {
      var y = item[0], label = item[1];
      var btn = self.add.rectangle(GAME_W/2, y, 160, 50, 0, 0).setStrokeStyle(2, 0xE8E8E8).setInteractive().setDepth(501);
      var txt = self.add.text(GAME_W/2, y, label, {fontSize:'16px',fill:COL_SCORE}).setOrigin(0.5).setDepth(502).disableInteractive();
      els.push(btn, txt);
      if (label === 'RESUME') btn.on('pointerdown', function() { SoundFX.uiClick(); self.togglePause(); });
      else if (label === 'HOW TO PLAY') btn.on('pointerdown', function() { SoundFX.uiClick(); self.scene.launch('HelpScene', {returnTo:'GameScene'}); });
      else btn.on('pointerdown', function() { SoundFX.uiClick(); self.scene.stop('HUDScene'); self.scene.stop('GameScene'); self.scene.start('MenuScene'); });
    });
    this.pauseElements = els;
  }
};
