// Rush Hour Dash - Effects (juice)
// Mixed into GameScene prototype via Object.assign

var GameEffects = {
  // Hop landing squish
  hopSquish: function() {
    if (!this.player) return;
    var scale = GameState.combo >= 5 ? 1.6 : 1.4;
    var scaleY = GameState.combo >= 5 ? 0.5 : 0.6;
    this.tweens.add({
      targets: this.player, scaleX: scale, scaleY: scaleY,
      duration: 80, yoyo: true, ease: 'Power2',
      onComplete: function() { if (this.player) { this.player.setScale(1); } }.bind(this)
    });
  },

  // Ghost trail on hop
  hopTrail: function(fromY) {
    if (!this.player) return;
    var x = this.player.x;
    var alpha1 = GameState.combo >= 10 ? 0.5 : 0.3;
    var alpha2 = GameState.combo >= 10 ? 0.35 : 0.15;
    var g1 = this.add.image(x, fromY, 'player').setAlpha(alpha1).setDepth(3);
    var g2 = this.add.image(x, fromY + 20, 'player').setAlpha(alpha2).setDepth(3);
    this.tweens.add({ targets: [g1, g2], alpha: 0, duration: 120, onComplete: function() {
      g1.destroy(); g2.destroy();
    }});
  },

  // Camera micro-nudge on hop
  hopNudge: function() {
    var amount = GameState.combo >= 10 ? 6 : 3;
    this.cameras.main.y -= amount;
    var self = this;
    setTimeout(function() { if (self.cameras && self.cameras.main) self.cameras.main.y = 0; }, 40);
  },

  // Coin collect particles
  coinParticles: function(x, y) {
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var speed = 80 + Math.random() * 60;
      var p = this.add.circle(x, y, 4, COLORS.coin).setDepth(8);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.3,
        y: y + Math.sin(angle) * speed * 0.3,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300, ease: 'Power2',
        onComplete: function() { p.destroy(); }
      });
    }
  },

  // Floating score text
  floatingText: function(x, y, text, color, size) {
    var txt = this.add.text(x, y, text, {
      fontSize: (size || 14) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: color || '#FFFFFF'
    }).setOrigin(0.5).setDepth(10).setAlpha(0.8);
    this.tweens.add({
      targets: txt, y: y - 30, alpha: 0, duration: 500,
      onComplete: function() { txt.destroy(); }
    });
  },

  // Milestone effect
  milestoneFlash: function() {
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;
    var flash = this.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF).setAlpha(0.4).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, duration: 60, onComplete: function() { flash.destroy(); } });
  },

  // Death effects - vehicle hit
  deathVehicleHit: function() {
    if (!this.player) return;
    var x = this.player.x;
    var y = this.player.y;

    // Hit-stop using setTimeout (NOT delayedCall with timeScale=0)
    this.physics && this.physics.pause && this.physics.pause();
    var self = this;
    setTimeout(function() {
      if (self.physics && self.physics.resume) self.physics.resume();
    }, 80);

    // Screen shake
    this.cameras.main.shake(400, 0.03);

    // Player death animation
    this.player.setTint(COLORS.carA);
    this.tweens.add({
      targets: this.player, angle: 180, scaleX: 0, scaleY: 0,
      duration: 300, ease: 'Power2'
    });

    // Red flash
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;
    var flash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.danger).setAlpha(0).setDepth(15);
    this.tweens.add({
      targets: flash, alpha: 0.6, duration: 80, yoyo: true, hold: 50,
      onComplete: function() { flash.destroy(); }
    });

    // Death particles
    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var speed = 200 + Math.random() * 150;
      var p = this.add.circle(x, y, 3 + Math.random() * 4, COLORS.carA).setDepth(8);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.5,
        y: y + Math.sin(angle) * speed * 0.5,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 500, ease: 'Power2',
        onComplete: function() { p.destroy(); }
      });
    }

    // Sound: crunch
    this.playSound('death_hit');
  },

  // Death effects - crush
  deathCrush: function() {
    if (!this.player) return;

    // Hit-stop
    var self = this;
    setTimeout(function() {}, 80);

    // Screen shake (stronger)
    this.cameras.main.shake(500, 0.045);

    // Player squish
    this.tweens.add({
      targets: this.player, scaleY: 0.05, scaleX: 2.5,
      duration: 250, ease: 'Power3'
    });

    // Orange-red flash
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;
    var flash = this.add.rectangle(w / 2, h / 2, w, h, COLORS.deathWallGlow).setAlpha(0).setDepth(15);
    this.tweens.add({
      targets: flash, alpha: 0.7, duration: 100, yoyo: true, hold: 50,
      onComplete: function() { flash.destroy(); }
    });

    // Death wall flash
    if (this.deathWall) {
      this.deathWall.setFillStyle(0xFFFFFF);
      setTimeout(function() { if (self.deathWall) self.deathWall.setFillStyle(COLORS.deathWall); }, 100);
    }

    this.playSound('death_crush');
  },

  // Near miss effect
  nearMissEffect: function() {
    if (!this.player) return;
    // Camera bump
    var dir = Math.random() < 0.5 ? 4 : -4;
    this.cameras.main.x += dir;
    var self = this;
    setTimeout(function() { if (self.cameras && self.cameras.main) self.cameras.main.x = 0; }, 80);

    this.playSound('near_miss');
  },

  // Sound synthesis using WebAudio
  playSound: function(type) {
    try {
      var ctx = this.sound.context;
      if (!ctx || ctx.state === 'closed') return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      var now = ctx.currentTime;

      switch (type) {
        case 'hop':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(440, now + 0.08);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.08);
          osc.start(now); osc.stop(now + 0.08);
          break;
        case 'coin':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(784, now + 0.1);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
          break;
        case 'death_hit':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.4);
          osc.start(now); osc.stop(now + 0.4);
          break;
        case 'death_crush':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.3);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.3);
          osc.start(now); osc.stop(now + 0.3);
          break;
        case 'near_miss':
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.06);
          osc.start(now); osc.stop(now + 0.06);
          break;
        case 'milestone':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554, now + 0.08);
          osc.frequency.setValueAtTime(659, now + 0.16);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        case 'click':
          osc.type = 'square';
          osc.frequency.setValueAtTime(1000, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.03);
          osc.start(now); osc.stop(now + 0.03);
          break;
      }
    } catch (e) {}
  }
};
