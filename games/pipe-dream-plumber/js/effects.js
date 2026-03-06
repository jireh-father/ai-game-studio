// effects.js - Particle systems, screen shake, water fill tweens, juice effects

class Effects {
  static pipePlace(scene, x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const p = scene.add.image(x, y, 'particle').setScale(0.5).setAlpha(1).setDepth(20);
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * 30, y: y + Math.sin(angle) * 30,
        alpha: 0, scale: 0, duration: 300, onComplete: () => p.destroy()
      });
    }
  }

  static scalePunch(scene, obj, scale, dur) {
    if (!obj || !obj.scene) return;
    scene.tweens.add({
      targets: obj, scaleX: scale || 1.25, scaleY: scale || 1.25,
      duration: dur || 100, yoyo: true, ease: 'Bounce.easeOut'
    });
  }

  static pipeRotateAnim(scene, sprite) {
    const target = sprite.angle + 90;
    scene.tweens.add({
      targets: sprite, angle: target,
      duration: 150, ease: 'Back.easeOut'
    });
  }

  static waterEnterPipe(scene, x, y, color) {
    for (let i = 0; i < 4; i++) {
      const p = scene.add.image(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8), 'waterDrop')
        .setScale(0.6).setAlpha(0.8).setTint(Phaser.Display.Color.HexStringToColor(color || COLORS.water).color).setDepth(20);
      scene.tweens.add({
        targets: p, y: y - 20, alpha: 0, scale: 0, duration: 200, delay: i * 30,
        onComplete: () => p.destroy()
      });
    }
  }

  static drainConnect(scene, x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const p = scene.add.circle(x, y, 3, 0x66BB6A).setAlpha(1).setDepth(20);
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * 40, y: y + Math.sin(angle) * 40,
        alpha: 0, duration: 400, onComplete: () => p.destroy()
      });
    }
  }

  static deadEndSplash(scene, x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const p = scene.add.circle(x, y, 4, 0x4FC3F7).setAlpha(1).setDepth(20);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 35, y: y + Math.sin(angle) * 35 + 20,
        alpha: 0, duration: 400, onComplete: () => p.destroy()
      });
    }
    scene.cameras.main.shake(150, 0.008);
  }

  static stageClearFlash(scene) {
    const flash = scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2,
      scene.scale.width, scene.scale.height, 0xFFFFFF, 0.6
    ).setDepth(50);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    // Confetti
    for (let i = 0; i < 20; i++) {
      const colors = [0xFF6B6B, 0x4FC3F7, 0x66BB6A, 0xFFB300, 0xAB47BC];
      const c = scene.add.rectangle(
        Phaser.Math.Between(50, scene.scale.width - 50),
        -10, 4, 4, Phaser.Utils.Array.GetRandom(colors)
      ).setDepth(50);
      scene.tweens.add({
        targets: c, y: scene.scale.height + 20,
        x: c.x + Phaser.Math.Between(-40, 40),
        angle: Phaser.Math.Between(0, 360),
        duration: 800 + Phaser.Math.Between(0, 400),
        delay: Phaser.Math.Between(0, 200),
        onComplete: () => c.destroy()
      });
    }
  }

  static scoreFloat(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: color || COLORS.accent, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  }

  static deathShake(scene) {
    scene.cameras.main.shake(400, 0.015);
  }

  static redFlash(scene) {
    const overlay = scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2,
      scene.scale.width, scene.scale.height, 0xEF5350, 0.3
    ).setDepth(45);
    let count = 0;
    const timer = scene.time.addEvent({
      delay: 200, repeat: 2,
      callback: () => {
        overlay.setAlpha(count % 2 === 0 ? 0.3 : 0);
        count++;
        if (count >= 3) { overlay.destroy(); timer.destroy(); }
      }
    });
  }

  static streakText(scene, streak) {
    const txt = scene.add.text(scene.scale.width / 2, scene.scale.height / 2,
      `STREAK x${streak}!`, {
        fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold',
        fill: COLORS.accent, stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(50).setScale(0);
    scene.tweens.add({
      targets: txt, scale: 1.2, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: txt, scale: 1, duration: 200,
          onComplete: () => {
            scene.time.delayedCall(600, () => {
              scene.tweens.add({ targets: txt, alpha: 0, duration: 300, onComplete: () => txt.destroy() });
            });
          }
        });
      }
    });
  }

  static timerUrgency(scene, timerText) {
    if (!timerText || !timerText.scene) return;
    timerText.setColor(COLORS.danger);
    scene.tweens.add({
      targets: timerText, x: timerText.x + 2, duration: 125,
      yoyo: true, repeat: 3
    });
  }

  static sourcePulse(scene, sprite) {
    if (!sprite || !sprite.scene) return;
    scene.tweens.add({
      targets: sprite, scaleX: 1.15, scaleY: 1.15,
      duration: 250, yoyo: true, repeat: -1
    });
  }
}

// Simple Web Audio sound generator
class SFX {
  constructor() {
    this.enabled = true;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.enabled = false; }
  }
  play(type) {
    if (!this.enabled) return;
    try { this.ctx.resume(); this['_' + type](); } catch(e) {}
  }
  _pipePlace() { this._noise(200, 2000, 0.08, 0.15); }
  _pipeRotate() { this._tone(800, 'square', 0.06, 0.1); }
  _waterFlow() { this._tone(120, 'sine', 0.15, 0.08, 8); }
  _drainConnect() { this._sweep(300, 150, 0.3, 0.15); }
  _splash() { this._noise(100, 4000, 0.2, 0.2); }
  _stageClear() { this._arp([523, 659, 784], 0.15, 0.15); }
  _gameOver() { this._arp([400, 300, 200], 0.25, 0.15); }
  _tick() { this._tone(1000, 'sine', 0.03, 0.05); }
  _uiClick() { this._tone(600, 'sine', 0.05, 0.08); }
  _highScore() { this._arp([523, 587, 659, 784, 1047], 0.18, 0.12); }
  _noise(lo, hi, dur, vol) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(g); g.connect(this.ctx.destination); src.start();
  }
  _tone(freq, type, dur, vol, trem) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    if (trem) { const l = this.ctx.createOscillator(); l.frequency.value = trem; const lg = this.ctx.createGain(); lg.gain.value = vol * 0.3; l.connect(lg); lg.connect(g.gain); l.start(); l.stop(this.ctx.currentTime + dur); }
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  _sweep(f1, f2, dur, vol) {
    const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f1;
    o.frequency.linearRampToValueAtTime(f2, this.ctx.currentTime + dur);
    const g = this.ctx.createGain(); g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  _arp(freqs, noteLen, vol) {
    freqs.forEach((f, i) => {
      const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx.createGain(); g.gain.value = vol;
      const t = this.ctx.currentTime + i * noteLen;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.9);
      o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + noteLen);
    });
  }
}
const sfx = new SFX();
