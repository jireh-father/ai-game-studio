// effects.js — Visual effects mixed into GameScene prototype

Object.assign(GameScene.prototype, {
  effectScalePunch(target, scale, duration) {
    if (!target || !target.scene) return;
    this.tweens.add({
      targets: target,
      scaleX: scale, scaleY: scale,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  effectShake(intensity, duration) {
    this.cameras.main.shake(duration, intensity / 1000);
  },

  effectMicroZoom(zoom, duration) {
    this.tweens.add({
      targets: this.cameras.main,
      zoom: zoom,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  effectScreenFlash(color, duration, alpha) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const flash = this.add.rectangle(w / 2, h / 2, w, h, color, alpha || 0.5).setDepth(25);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    });
  },

  effectMeterFlash() {
    const flash = this.add.rectangle(this.meterX + 10, this.meterY + this.meterH / 2, 24, this.meterH + 4, 0xFFFFFF, 0.4).setDepth(5);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 40,
      onComplete: () => flash.destroy()
    });
  },

  effectSweatBurst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30;
      const drop = this.add.image(x, y, 'sweat').setScale(0.8).setDepth(5);
      this.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 400,
        onComplete: () => drop.destroy()
      });
    }
  },

  effectFloatingText(x, y, text, color) {
    const txt = this.add.text(x, y, text, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: color || '#FFF'
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      duration: 700,
      onComplete: () => txt.destroy()
    });
  },

  effectGasExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 80 + Math.random() * 70;
      const cloud = this.add.image(x, y, 'cloudPuff').setScale(0.8 + Math.random() * 0.5).setDepth(18);
      this.tweens.add({
        targets: cloud,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: cloud.scaleX * 1.5,
        scaleY: cloud.scaleY * 1.5,
        duration: 800,
        onComplete: () => cloud.destroy()
      });
    }
  },

  effectStageClearFanfare(x, y) {
    const angles = [-60, -30, 0, 30, 60];
    angles.forEach(deg => {
      const rad = deg * Math.PI / 180;
      const dist = 60;
      const txt = this.add.text(x, y, '+100', {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.warningYellow
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: txt,
        x: x + Math.cos(rad) * dist,
        y: y + Math.sin(rad) * dist,
        alpha: 0,
        duration: 700,
        onComplete: () => txt.destroy()
      });
    });
  }
});
