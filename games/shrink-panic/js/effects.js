// Shrink Panic - Visual & Audio Effects
const SFX = {
  ctx: null,
  enabled: true,

  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { this.enabled = false; }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  play(type, freq, freq2, dur, waveform) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = waveform || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (freq2) osc.frequency.linearRampToValueAtTime(freq2, t + dur / 1000);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + dur / 1000);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur / 1000);
  },

  tapNormal(combo) { this.play('tap', 800 + combo * 100, 1200 + combo * 100, 80, 'sine'); },
  tapSmall(combo) { this.play('tap', 1000 + combo * 100, 1600 + combo * 100, 60, 'sine'); },
  tapFleeting() { this.play('chime', 1200, 2000, 120, 'triangle'); },
  tapDecoy() { this.play('buzz', 200, 200, 150, 'square'); },
  missPenalty() { this.play('rumble', 80, 40, 300, 'sawtooth'); },
  expandBurst() { this.play('whoosh', 200, 800, 250, 'sine'); },
  gameOver() { this.play('death', 400, 100, 500, 'sine'); },
  highScore() {
    if (!this.enabled || !this.ctx) return;
    const notes = [400, 600, 800, 1200];
    notes.forEach((f, i) => {
      setTimeout(() => this.play('hs', f, f + 100, 150, 'sine'), i * 150);
    });
  }
};

const Effects = {
  burstParticles(scene, x, y, color, count) {
    count = count || 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 120 + Math.random() * 180;
      const p = scene.add.circle(x, y, 3 + Math.random() * 3, color, 1);
      p.setDepth(100);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.4,
        y: y + Math.sin(angle) * speed * 0.4,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
  },

  scorePopup(scene, x, y, text, color) {
    const t = scene.add.text(x, y, text, {
      fontSize: '22px', fontFamily: 'Arial', color: color || '#FFFFFF',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: t, y: y - 60, alpha: 0, duration: 500,
      ease: 'Power2', onComplete: () => t.destroy()
    });
  },

  comboText(scene, x, y, combo) {
    const size = Math.min(48, 24 + combo * 4);
    const col = combo >= 5 ? '#FFD700' : '#39FF14';
    const t = scene.add.text(x, y - 30, 'x' + combo + '!', {
      fontSize: size + 'px', fontFamily: 'Arial', color: col,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: t, y: y - 70, alpha: 0, scale: 1.3, duration: 600,
      ease: 'Power2', onComplete: () => t.destroy()
    });
  },

  collapseShake(scene) {
    scene.cameras.main.shake(300, 0.015);
  },

  expandWave(scene, vp) {
    const cx = vp.x + vp.width / 2, cy = vp.y + vp.height / 2;
    const ring = scene.add.circle(cx, cy, 20, 0x00FFFF, 0.5).setDepth(150);
    scene.tweens.add({
      targets: ring, scale: 8, alpha: 0, duration: 300,
      ease: 'Power2', onComplete: () => ring.destroy()
    });
    // Star particles from corners
    const corners = [
      { x: vp.x, y: vp.y }, { x: vp.x + vp.width, y: vp.y },
      { x: vp.x, y: vp.y + vp.height }, { x: vp.x + vp.width, y: vp.y + vp.height }
    ];
    corners.forEach(c => {
      for (let i = 0; i < 2; i++) {
        const s = scene.add.star(c.x, c.y, 5, 3, 7, 0x00FFFF, 1).setDepth(150);
        const a = Math.random() * Math.PI * 2;
        scene.tweens.add({
          targets: s, x: c.x + Math.cos(a) * 60, y: c.y + Math.sin(a) * 60,
          alpha: 0, scale: 0, duration: 500, ease: 'Power2', onComplete: () => s.destroy()
        });
      }
    });
  },

  deathSpiral(scene, vp, onComplete) {
    scene.cameras.main.shake(400, 0.02);
    const cx = vp.x + vp.width / 2, cy = vp.y + vp.height / 2;
    const flash = scene.add.rectangle(cx, cy, scene.scale.width, scene.scale.height, 0xFFFFFF, 0)
      .setDepth(500);
    scene.tweens.add({
      targets: flash, alpha: 0.8, duration: 100, yoyo: true,
      onComplete: () => { flash.destroy(); if (onComplete) onComplete(); }
    });
  },

  haptic() {
    if (navigator.vibrate) navigator.vibrate(30);
  }
};
