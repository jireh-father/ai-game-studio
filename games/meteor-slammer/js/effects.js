const Effects = {
  init(scene) {
    this.scene = scene;
    this.floatTexts = [];
    for (let i = 0; i < 5; i++) {
      const t = scene.add.text(0, 0, '', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.comboText }).setOrigin(0.5).setAlpha(0).setDepth(20);
      this.floatTexts.push(t);
    }
    this.floatIdx = 0;
  },

  impactParticles(x, y, count, colors, speedMin, speedMax, life) {
    const s = this.scene;
    for (let i = 0; i < count; i++) {
      const c = colors[i % colors.length];
      const p = s.add.circle(x, y, 4 + Math.random() * 3, Phaser.Display.Color.HexStringToColor(c).color).setDepth(15);
      const angle = Math.random() * Math.PI * 2;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      s.tweens.add({
        targets: p, x: x + Math.cos(angle) * spd * 0.4, y: y + Math.sin(angle) * spd * 0.4,
        alpha: 0, duration: life || 400,
        onComplete: () => p.destroy()
      });
    }
  },

  screenShake(intensity, duration) {
    this.scene.cameras.main.shake(duration || 250, intensity / 500);
  },

  scalePunch(obj, scale, dur) {
    if (!obj || !obj.scene) return;
    this.scene.tweens.add({
      targets: obj, scaleX: scale || 1.25, scaleY: scale || 1.25,
      duration: dur || 60, yoyo: true, ease: 'Quad.easeOut'
    });
  },

  hitStop(duration) {
    const s = this.scene;
    if (s.physics && s.physics.world) s.physics.world.pause();
    s._hitStopped = true;
    setTimeout(() => {
      if (s.physics && s.physics.world) s.physics.world.resume();
      s._hitStopped = false;
    }, duration || 50);
  },

  floatText(x, y, text, color, size, floatDist, dur) {
    const t = this.floatTexts[this.floatIdx % this.floatTexts.length];
    this.floatIdx++;
    t.setText(text).setPosition(x, y).setAlpha(1).setFontSize(size || '18px').setColor(color || COLORS.comboText);
    this.scene.tweens.add({
      targets: t, y: y - (floatDist || 50), alpha: 0, duration: dur || 700
    });
  },

  impactFlash(x, y) {
    const f = this.scene.add.circle(x, y, 40, 0xFFFFFF, 0.9).setDepth(18);
    this.scene.tweens.add({
      targets: f, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 120,
      onComplete: () => f.destroy()
    });
  },

  normalImpact(x, y, comboHits) {
    const intensity = comboHits >= 3 ? 14 : comboHits >= 2 ? 9 : 6;
    this.hitStop(50);
    this.screenShake(intensity, 250);
    this.impactFlash(x, y);
    this.impactParticles(x, y, 12, [COLORS.meteorCore, COLORS.meteorNormal], 180, 380, 400);
  },

  fireImpact(x, y) {
    this.hitStop(50);
    this.screenShake(10, 300);
    this.impactFlash(x, y);
    this.impactParticles(x, y, 16, ['#FF4400', '#FF8800', COLORS.meteorFire], 200, 500, 600);
  },

  iceImpact(x, y) {
    this.hitStop(50);
    this.screenShake(6, 250);
    this.impactFlash(x, y);
    this.impactParticles(x, y, 10, ['#A0E8FF', '#E0F8FF', COLORS.meteorIce], 60, 130, 500);
  },

  goldImpact(x, y) {
    this.hitStop(50);
    this.screenShake(8, 300);
    this.impactFlash(x, y);
    this.impactParticles(x, y, 20, [COLORS.meteorGold, '#FFFAAA'], 100, 250, 600);
    const overlay = this.scene.add.rectangle(this.scene.scale.width / 2, this.scene.scale.height / 2, this.scene.scale.width, this.scene.scale.height, 0xFFD700, 0.15).setDepth(25);
    this.scene.tweens.add({ targets: overlay, alpha: 0, duration: 150, onComplete: () => overlay.destroy() });
  },

  bossImpact(x, y, isDestroyed) {
    this.hitStop(60);
    const shakeAmt = isDestroyed ? 16 : 8;
    this.screenShake(shakeAmt, isDestroyed ? 500 : 300);
    this.impactFlash(x, y);
    const count = isDestroyed ? 24 : 14;
    this.impactParticles(x, y, count, ['#880020', '#FF4040'], 180, 400, 400);
    if (isDestroyed) {
      this.floatText(x, y - 30, 'BOSS DESTROYED +1000', '#FF4040', '22px', 60, 1200);
    }
  },

  meteorLandEffect(x, baseY) {
    this.screenShake(4, 200);
    this.impactParticles(x, baseY, 6, [COLORS.rubble, '#4A4A55'], 40, 100, 300);
    if (navigator.vibrate) navigator.vibrate(20);
  },

  cleanSweepBanner() {
    const s = this.scene;
    const w = s.scale.width, h = s.scale.height;
    const overlay = s.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0.3).setDepth(30);
    s.tweens.add({ targets: overlay, alpha: 0, duration: 200, onComplete: () => overlay.destroy() });
    const bonus = CLEAN_SWEEP_BONUS(GameState.stage);
    const txt = s.add.text(w / 2, h * 0.4, 'CLEAN SWEEP!\n+' + bonus, {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF', align: 'center'
    }).setOrigin(0.5).setDepth(31).setAlpha(0);
    s.tweens.add({ targets: txt, alpha: 1, y: h * 0.35, duration: 300, yoyo: true, hold: 600, onComplete: () => txt.destroy() });
  },

  deathEffects(onComplete) {
    const s = this.scene;
    this.screenShake(12, 600);
    const w = s.scale.width, h = s.scale.height;
    [80, 160, 240].forEach(delay => {
      s.time.delayedCall(delay, () => {
        const flash = s.add.rectangle(w / 2, h / 2, w, h, 0xFF2020, 0.3).setDepth(30);
        s.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });
      });
    });
    s.time.delayedCall(800, () => {
      const black = s.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setDepth(35);
      s.tweens.add({ targets: black, alpha: 1, duration: 400, onComplete: () => { if (onComplete) onComplete(); } });
    });
  },

  comboText(x, y, multiplier) {
    this.floatText(x, y - 60, 'x' + multiplier.toFixed(1) + '!', COLORS.comboText, '24px', 40, 900);
    this.impactParticles(x, y, 8, [COLORS.meteorGold], 80, 160, 600);
  },

  stageAdvanceBanner(stageNum) {
    const s = this.scene;
    const w = s.scale.width;
    const txt = s.add.text(w / 2, -40, 'STAGE ' + stageNum, {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hud
    }).setOrigin(0.5).setDepth(31);
    s.tweens.add({ targets: txt, y: s.scale.height * 0.35, duration: 400, ease: 'Back.easeOut', hold: 400, yoyo: true, onComplete: () => txt.destroy() });
  }
};
