// Slash Dash - Visual & Audio Effects
const Effects = {
  audioCtx: null,

  initAudio() {
    if (!this.audioCtx) {
      try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* silent fail */ }
    }
  },

  playTone(freq, duration, type, vol) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration / 1000);
    } catch (e) { /* silent */ }
  },

  playSlashSound() {
    const pitch = 880 * (0.9 + Math.random() * 0.2);
    this.playTone(pitch, 180, 'sawtooth', 0.12);
  },

  playDodgeSound() {
    this.playTone(220, 250, 'sine', 0.08);
  },

  playStrikeSound() {
    this.playTone(150, 200, 'square', 0.15);
  },

  playComboSound() {
    const t = this.audioCtx ? this.audioCtx.currentTime : 0;
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 120, 'sine', 0.1), i * 80);
    });
  },

  playStageClearSound() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 150, 'triangle', 0.12), i * 100);
    });
  },

  playGameOverSound() {
    [220, 175, 147].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 300, 'sawtooth', 0.12), i * 200);
    });
  },

  playInversionSound() {
    this.playTone(800, 300, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(400, 200, 'sawtooth', 0.1), 100);
  },

  playClickSound() {
    this.playTone(600, 50, 'sine', 0.08);
  },

  playHighScoreSound() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 200, 'triangle', 0.1), i * 120);
    });
  },

  slashTrail(scene, sx, sy, ex, ey, combo) {
    const dx = ex - sx, dy = ey - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const count = Math.min(Math.max(Math.floor(dist / 30), 4), 16);
    const extra = combo >= 9 ? 6 : combo >= 6 ? 4 : combo >= 3 ? 3 : 0;
    const total = count + extra;
    const useWhite = combo >= 9;
    const texKey = useWhite ? 'sparkWhite' : 'spark';

    for (let i = 0; i < total; i++) {
      const t = i / total;
      const px = sx + dx * t + (Math.random() - 0.5) * 16;
      const py = sy + dy * t + (Math.random() - 0.5) * 16;
      const p = scene.add.image(px, py, texKey).setScale(1.2).setDepth(50);
      scene.tweens.add({
        targets: p, scaleX: 0.2, scaleY: 0.2, alpha: 0, duration: 220,
        onComplete: () => p.destroy()
      });
    }
  },

  objectExplosion(scene, x, y, tint) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      const p = scene.add.image(x, y, 'spark').setScale(0.8 + Math.random() * 0.4).setDepth(50);
      if (tint) p.setTint(tint);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0, scaleY: 0, duration: 300,
        onComplete: () => p.destroy()
      });
    }
  },

  zenGlow(scene, x, y) {
    const ring = scene.add.image(x, y, 'fingerRing').setScale(0.8).setAlpha(0.7).setDepth(45);
    const tw = scene.tweens.add({
      targets: ring, scaleX: 1.6, scaleY: 1.6, alpha: 0.2,
      duration: 400, yoyo: true, repeat: -1
    });
    return { ring, tween: tw, destroy() { tw.stop(); ring.destroy(); } };
  },

  screenShake(scene, intensity, duration) {
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.shake(duration, intensity / 1000);
    }
  },

  strikeFlash(scene) {
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.flash(400, 255, 0, 0, false);
    }
  },

  floatingText(scene, x, y, text, color, size) {
    const txt = scene.add.text(x, y, text, {
      fontSize: (size || 20) + 'px', fontFamily: 'Arial', fontStyle: 'bold',
      color: color || COLORS.SCORE_TEXT, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 500,
      onComplete: () => txt.destroy()
    });
  },

  stageClearEffect(scene, stageNum) {
    const txt = scene.add.text(GAME.CANVAS_W / 2, GAME.CANVAS_H / 2, 'STAGE ' + stageNum + ' CLEAR', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      color: COLORS.STAGE_CLEAR, stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScale(0.5).setDepth(70);
    scene.tweens.add({
      targets: txt, scaleX: 1, scaleY: 1, duration: 200,
      onComplete: () => {
        scene.time.delayedCall(400, () => {
          scene.tweens.add({
            targets: txt, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 200,
            onComplete: () => txt.destroy()
          });
        });
      }
    });
    // Speed lines
    if (stageNum % 5 === 0) {
      for (let i = 0; i < 20; i++) {
        const ly = Math.random() * GAME.CANVAS_H;
        const line = scene.add.rectangle(GAME.CANVAS_W / 2, ly, GAME.CANVAS_W, 1, 0xFFFFFF, 0.6).setDepth(65);
        scene.tweens.add({ targets: line, alpha: 0, duration: 150, delay: i * 5, onComplete: () => line.destroy() });
      }
    }
  },

  inversionBanner(scene) {
    const txt = scene.add.text(GAME.CANVAS_W / 2, GAME.CANVAS_H / 2 - 60, 'INVERSION!', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold',
      color: COLORS.POISON_ORB, stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScale(0.8).setDepth(70);
    scene.tweens.add({
      targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 150,
      onComplete: () => {
        scene.time.delayedCall(300, () => {
          scene.tweens.add({
            targets: txt, alpha: 0, duration: 150,
            onComplete: () => txt.destroy()
          });
        });
      }
    });
  },

  scalePunch(scene, target, scale, dur) {
    scene.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: dur || 80, yoyo: true, ease: 'Quad.easeOut'
    });
  },

  cameraZoomPulse(scene) {
    if (!scene.cameras || !scene.cameras.main) return;
    scene.cameras.main.zoomTo(1.04, 60, 'Linear', true);
    setTimeout(() => {
      if (scene.cameras && scene.cameras.main) scene.cameras.main.zoomTo(1.0, 60, 'Linear', true);
    }, 70);
  }
};
