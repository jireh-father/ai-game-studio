// Effects mixin — attached to GameScene via Object.assign
var GameEffects = {
  spawnParticles: function(x, y, color, count, lifespan) {
    count = count || 14;
    lifespan = lifespan || 350;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 80 + Math.random() * 140;
      var size = 4 + Math.random() * 8;
      var p = this.add.circle(x, y, size / 2, color).setDepth(50);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: lifespan,
        ease: 'Power2',
        onComplete: function() { p.destroy(); }
      });
    }
  },

  shakeCamera: function(intensity, duration) {
    this.cameras.main.shake(duration || 150, intensity || 0.004);
  },

  scalePunch: function(obj, scale, dur) {
    if (!obj || !obj.active) return;
    scale = scale || 1.4;
    dur = dur || 80;
    this.tweens.add({
      targets: obj,
      scaleX: obj.scaleX * scale,
      scaleY: obj.scaleY * scale,
      duration: dur,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  cameraPunch: function(zoom, dur) {
    zoom = zoom || 1.04;
    dur = dur || 40;
    var cam = this.cameras.main;
    cam.zoomTo(zoom, dur, 'Linear', false, function(_c, p) {
      if (p === 1) cam.zoomTo(1.0, dur);
    });
  },

  floatingText: function(x, y, text, color, fontSize) {
    color = color || COLORS.white;
    fontSize = fontSize || '22px';
    var txt = this.add.text(x, y, text, {
      fontFamily: 'Arial', fontSize: fontSize, fontStyle: 'bold',
      color: color, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0,
      scaleX: 1.3, scaleY: 1.3,
      duration: 700, ease: 'Power2',
      onComplete: function() { txt.destroy(); }
    });
  },

  flashEdge: function(color, duration) {
    color = color || 0xE63946;
    duration = duration || 300;
    var w = this.scale.width, h = this.scale.height;
    var overlay = this.add.rectangle(w / 2, h / 2, w, h, color, 0.3).setDepth(80);
    this.tweens.add({
      targets: overlay, alpha: 0, duration: duration,
      onComplete: function() { overlay.destroy(); }
    });
  },

  hitStop: function(durationMs) {
    durationMs = durationMs || 40;
    var self = this;
    if (self.activeItems) {
      self.activeItems.forEach(function(item) {
        if (item.approachTween) item.approachTween.pause();
      });
    }
    self.hitStopped = true;
    setTimeout(function() {
      self.hitStopped = false;
      if (self.activeItems) {
        self.activeItems.forEach(function(item) {
          if (item.approachTween) item.approachTween.resume();
        });
      }
    }, durationMs);
  },

  addSplatDecal: function(x, y, color) {
    var g = this.add.graphics().setDepth(5);
    g.fillStyle(color, 0.55);
    g.fillCircle(x, y, 30 + Math.random() * 20);
    for (var i = 0; i < 5; i++) {
      var ox = (Math.random() - 0.5) * 60;
      var oy = (Math.random() - 0.5) * 60;
      g.fillCircle(x + ox, y + oy, 8 + Math.random() * 12);
    }
    this.splatDecals.push(g);
  },

  stageClearEffect: function() {
    var w = this.scale.width, h = this.scale.height;
    var glow = this.add.rectangle(w / 2, h / 2, w, h, 0xFFD166, 0.25).setDepth(80);
    this.tweens.add({
      targets: glow, alpha: 0, duration: 600,
      onComplete: function() { glow.destroy(); }
    });
    this.floatingText(w / 2, h / 2 - 40,
      'STAGE ' + this.stage + ' CLEAR!', COLORS.perfect, '28px');
  }
};
