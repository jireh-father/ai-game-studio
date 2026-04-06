// Juice effects — mixed into GameScene prototype
const Effects = {
  // Dust puff at player's feet
  spawnDust(x, y, count) {
    for (let i = 0; i < count; i++) {
      const d = this.add.image(x + (Math.random() - 0.5) * 20, y, 'dust').setAlpha(0.7).setScale(0.5);
      this.tweens.add({
        targets: d, y: y + 20 + Math.random() * 10,
        x: d.x + (Math.random() - 0.5) * 30,
        alpha: 0, scale: 0, duration: 300, onComplete: () => d.destroy()
      });
    }
  },

  // Floating score text
  floatText(x, y, text, color, size) {
    const t = this.add.text(x, y, text, { fontSize: (size || 16) + 'px', fill: color || '#F39C12', fontFamily: 'Arial', fontStyle: 'bold', stroke: '#2C3E50', strokeThickness: 2 }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  },

  // Scale punch on object
  scalePunch(target, mag, dur) {
    this.tweens.add({ targets: target, scaleX: mag || 1.3, scaleY: mag || 1.3, duration: (dur || 100) / 2, yoyo: true, ease: 'Back.easeOut' });
  },

  // Screen shake
  doShake(intensity, duration) {
    this.cameras.main.shake(duration || 150, (intensity || 4) / 1000);
  },

  // Hit-stop using setTimeout (NOT delayedCall — known Phaser bug)
  hitStop(ms) {
    if (this.scene && this.scene.isPaused && this.scene.isPaused()) return;
    this.physics && this.physics.pause && this.physics.pause();
    this.tweens.pauseAll();
    setTimeout(() => {
      if (this.scene && this.scene.isActive && this.scene.isActive()) {
        this.physics && this.physics.resume && this.physics.resume();
        this.tweens.resumeAll();
      }
    }, ms);
  },

  // Player ragdoll
  ragdoll(player) {
    this.tweens.add({ targets: player, angle: 25, duration: 150, yoyo: true, ease: 'Power2',
      onComplete: () => {
        this.tweens.add({ targets: player, angle: -15, duration: 100, yoyo: true });
      }
    });
  },

  // Player flash (white tint flicker)
  playerFlash(player) {
    let count = 0;
    const iv = setInterval(() => {
      if (count >= 3) { clearInterval(iv); player.clearTint(); return; }
      player.setTintFill(0xffffff);
      setTimeout(() => { if (player.active) player.clearTint(); }, 40);
      count++;
    }, 80);
  },

  // Invincibility flicker
  startInvFlicker(player) {
    if (this._invFlicker) clearInterval(this._invFlicker);
    let on = true;
    this._invFlicker = setInterval(() => {
      if (player.active) player.setAlpha(on ? 0.3 : 1.0);
      on = !on;
    }, 100);
    setTimeout(() => {
      clearInterval(this._invFlicker);
      this._invFlicker = null;
      if (player.active) player.setAlpha(1.0);
    }, INVINCIBILITY_MS);
  },

  // Hit text pop (BONK, CRACK, CLANG, SPLAT)
  hitTextPop(x, y, text, color) {
    const t = this.add.text(x, y - 40, text, { fontSize: '28px', fill: color || COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold', stroke: '#FFF', strokeThickness: 3 }).setOrigin(0.5).setScale(0.5).setDepth(200);
    this.tweens.add({ targets: t, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true, ease: 'Back.easeOut',
      onComplete: () => { this.tweens.add({ targets: t, y: t.y - 80, alpha: 0, duration: 500, onComplete: () => t.destroy() }); }
    });
  },

  // Camera zoom punch
  camZoom(mag, dur) {
    this.tweens.add({ targets: this.cameras.main, zoom: mag || 1.05, duration: (dur || 200) / 2, yoyo: true, ease: 'Sine.easeInOut' });
  },

  // Shockwave ring (for pot)
  shockwave(x, y) {
    const g = this.add.graphics().setDepth(90);
    let r = 20, alpha = 0.7;
    const ev = this.time.addEvent({ delay: 16, repeat: 24, callback: () => {
      g.clear(); r += 4; alpha -= 0.028;
      g.lineStyle(3, 0xe74c3c, Math.max(0, alpha));
      g.strokeCircle(x, y, r);
      if (alpha <= 0) { g.destroy(); ev.remove(); }
    }});
  },

  // Screen color flash overlay
  screenFlash(color, alpha, dur) {
    const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, color, 0).setDepth(150);
    this.tweens.add({ targets: overlay, alpha: alpha || 0.5, duration: (dur || 300) / 2, yoyo: true, onComplete: () => overlay.destroy() });
  },

  // Stage clear particle burst
  stageClearBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.66;
      const speed = 200 + Math.random() * 200;
      const s = this.add.image(x, y, 'star').setScale(0.8 + Math.random() * 0.4).setDepth(100);
      this.tweens.add({
        targets: s, x: x + Math.cos(angle) * speed * 0.8, y: y + Math.sin(angle) * speed * 0.8,
        alpha: 0, scale: 0, duration: 800, ease: 'Power2', onComplete: () => s.destroy()
      });
    }
  },

  // Grandma shudder on tier up
  grandmaShudder(grandma) {
    this.tweens.add({ targets: grandma, x: grandma.x + 8, duration: 50, yoyo: true, repeat: 9 });
  },

  // Death slow-mo
  deathSlowMo() {
    this.time.timeScale = 0.3;
    setTimeout(() => { if (this.scene.isActive()) this.time.timeScale = 1.0; }, 500);
  },

  // Sound effects via Web Audio API
  playSound(type) {
    try {
      const ctx = Effects._audioCtx || (Effects._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'swish') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.08); osc.start(now); osc.stop(now + 0.08);
      } else if (type === 'bonk') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.5, now); gain.gain.linearRampToValueAtTime(0, now + 0.08); osc.start(now); osc.stop(now + 0.08);
      } else if (type === 'crack') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(100, now + 0.06);
        gain.gain.setValueAtTime(0.4, now); gain.gain.linearRampToValueAtTime(0, now + 0.06); osc.start(now); osc.stop(now + 0.06);
      } else if (type === 'clang') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(250, now);
        gain.gain.setValueAtTime(0.5, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'splat') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.5, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'whoosh') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'stage_clear') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.08);
          g.gain.setValueAtTime(0.3, now + i * 0.08); g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.15);
          o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.15);
        });
      } else if (type === 'game_over') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(80, now + 0.8);
        gain.gain.setValueAtTime(0.4, now); gain.gain.linearRampToValueAtTime(0, now + 0.8); osc.start(now); osc.stop(now + 0.8);
      } else if (type === 'chime') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.15); osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.03); osc.start(now); osc.stop(now + 0.03);
      } else if (type === 'tier_up') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0.4, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5);
      }
    } catch (e) { /* audio not available */ }
  }
};
