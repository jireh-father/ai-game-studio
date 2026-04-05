// Birthday Bomb - Juice Effects (mixin for GameScene)

var GameEffects = {
  initEffects: function() {
    this.flashRect = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x34C759, 0)
      .setDepth(90).setScrollFactor(0);
  },

  screenFlash: function(color, alpha, duration) {
    this.flashRect.setFillStyle(color, alpha);
    this.flashRect.setAlpha(alpha);
    this.tweens.add({ targets: this.flashRect, alpha: 0, duration: duration || 300 });
  },

  scalePunch: function(target, scale, dur) {
    if (!target || !target.scene) return;
    this.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: dur || 100, yoyo: true, ease: 'Power2'
    });
  },

  floatingText: function(x, y, text, color, size) {
    var txt = this.add.text(x, y, text, {
      fontSize: (size || 24) + 'px', fill: color, fontFamily: 'Arial',
      fontStyle: 'bold', stroke: '#fff', strokeThickness: 2
    }).setOrigin(0.5).setDepth(95);
    this.tweens.add({
      targets: txt, y: y - 70, alpha: 0, duration: 700,
      delay: 100, onComplete: function() { txt.destroy(); }
    });
  },

  confettiBurst: function(x, y, count, colors) {
    var cols = colors || [0xFF6B9D, 0x5AC8FA, 0x34C759, 0xFF9500, 0xAF52DE, 0xFFD93D];
    for (var i = 0; i < count; i++) {
      var c = cols[i % cols.length];
      var p = this.add.circle(x, y, 4 + Math.random() * 4, c).setDepth(85).setAlpha(0.9);
      var vx = (Math.random() - 0.5) * 400;
      var vy = -150 - Math.random() * 250;
      this.tweens.add({
        targets: p, x: x + vx * 0.6, y: y + vy * 0.3 + 200,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: function() { p.destroy(); }
      });
    }
  },

  goldRingPulse: function(x, y, count) {
    for (var i = 0; i < (count || 3); i++) {
      var ring = this.add.circle(x, y, 10, 0xFFD93D, 0).setStrokeStyle(2, 0xFFD93D).setDepth(80);
      this.tweens.add({
        targets: ring, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 400, delay: i * 100,
        onComplete: function() { ring.destroy(); }
      });
    }
  },

  hitStop: function(durationMs) {
    // CRITICAL: use setTimeout, NOT delayedCall (Phaser timers freeze at timeScale 0)
    var scene = this;
    scene.time.timeScale = 0.05;
    setTimeout(function() {
      if (scene && scene.time) scene.time.timeScale = 1.0;
    }, durationMs || 80);
  },

  cameraZoomPulse: function(zoom, dur) {
    var cam = this.cameras.main;
    this.tweens.add({
      targets: cam, zoom: zoom || 1.05,
      duration: dur || 100, yoyo: true, ease: 'Power2'
    });
  },

  bombExplodeEffect: function(bombImg, onComplete) {
    var scene = this;
    // Camera shake
    scene.cameras.main.shake(600, 0.02);
    // Bomb scale up and fade
    if (bombImg) {
      scene.tweens.add({
        targets: bombImg, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 400
      });
    }
    // White flash
    scene.screenFlash(0xFFFFFF, 0.8, 300);
    // Dark overlay (desaturation fallback)
    var dark = scene.add.rectangle(scene.W / 2, scene.H / 2, scene.W, scene.H, 0x000000, 0)
      .setDepth(91).setScrollFactor(0);
    scene.tweens.add({
      targets: dark, alpha: 0.5, duration: 300, delay: 200
    });
    // Callback after effects
    setTimeout(function() {
      if (onComplete) onComplete();
    }, 800);
  },

  stageClearEffect: function(onComplete) {
    this.confettiBurst(this.W / 2, 50, 25);
    this.screenFlash(0x34C759, 0.2, 400);
    var banner = this.add.text(this.W / 2, this.H / 2, 'STAGE CLEAR!', {
      fontSize: '36px', fill: '#FFD93D', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: COLORS.text, strokeThickness: 4
    }).setOrigin(0.5).setDepth(95);
    this.scalePunch(banner, 1.4, 150);
    var scene = this;
    setTimeout(function() {
      if (banner && banner.scene) banner.destroy();
      if (onComplete) onComplete();
    }, 1200);
  },

  streakFlameEffect: function(streakText, streak) {
    if (!streakText) return;
    var s = streak >= 7 ? 1.6 : streak >= 5 ? 1.3 : 1.0;
    this.scalePunch(streakText, s, 200);
  },

  wrongBetShake: function() {
    this.cameras.main.shake(300, 0.008);
  },

  matchHighlight: function(x, y, isWrong) {
    var color = isWrong ? 0xFF3B30 : 0xFFD93D;
    for (var i = 0; i < 2; i++) {
      var ring = this.add.circle(x, y, 12, color, 0).setStrokeStyle(3, color).setDepth(80);
      this.tweens.add({
        targets: ring, scaleX: 2.5, scaleY: 2.5, alpha: 0,
        duration: 300, delay: i * 150,
        onComplete: function() { ring.destroy(); }
      });
    }
  }
};
