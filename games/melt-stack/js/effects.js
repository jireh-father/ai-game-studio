// Melt Stack - Juice Effects (mixed into GameScene)
const GameEffects = {
  initAudio() {
    this.audioCtx = null;
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  },

  playSound(freq, duration, type, vol) {
    if (!GameState.soundEnabled || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration / 1000));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (duration / 1000));
    } catch (e) {}
  },

  playChord(freqs, duration) {
    freqs.forEach(f => this.playSound(f, duration, 'sine', 0.1));
  },

  playArpeggio(freqs, interval) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.playSound(f, 150, 'sine', 0.12), i * interval);
    });
  },

  soundDrop() { this.playSound(80, 120, 'square', 0.15); },
  soundPerfect() { this.playChord([880, 1320], 200); },
  soundSlice() { this.playSound(2000, 80, 'sawtooth', 0.08); },
  soundFreeze() { this.playArpeggio([523, 659, 784, 1047], 80); },
  soundDeath() {
    if (!GameState.soundEnabled || !this.audioCtx) return;
    try {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  },
  soundStreak(count) { this.playSound(440 + count * 80, 80, 'sine', 0.1); },
  soundStageMilestone() { this.playArpeggio([262, 330, 392, 523], 100); },

  shakeScreen(intensity, duration) {
    this.cameras.main.shake(duration, intensity / GAME_WIDTH);
  },

  flashScreen(color, maxAlpha, duration) {
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, 0);
    flash.setDepth(100).setScrollFactor(0);
    this.tweens.add({
      targets: flash, alpha: { from: 0, to: maxAlpha }, duration: duration / 2, yoyo: true,
      onComplete: () => flash.destroy()
    });
  },

  floatingText(x, y, text, color, size, riseDistance, duration) {
    const txt = this.add.text(x, y, text, {
      fontSize: size + 'px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: color, align: 'center'
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
    this.tweens.add({
      targets: txt, y: y - riseDistance, alpha: { from: 1, to: 0 }, duration: duration,
      ease: 'Power1', onComplete: () => txt.destroy()
    });
  },

  scalePunch(target, scale, duration) {
    if (!target || !target.scene) return;
    this.tweens.add({
      targets: target, scaleX: scale, scaleY: scale, duration: duration / 2,
      yoyo: true, ease: 'Sine.easeOut'
    });
  },

  spawnStarBurst(x, y, count) {
    if (!this.textures.exists('star')) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 80;
      const s = this.add.image(x, y, 'star').setScale(0.5).setDepth(80).setScrollFactor(0);
      this.tweens.add({
        targets: s,
        x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0, duration: 600,
        onComplete: () => s.destroy()
      });
    }
  },

  showFreezeTint() {
    if (this.freezeOverlay) this.freezeOverlay.destroy();
    this.freezeOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.freezeTint, 0.12);
    this.freezeOverlay.setDepth(95).setScrollFactor(0);
    this.tweens.add({
      targets: this.freezeOverlay, alpha: 0, delay: FREEZE_DURATION - 200, duration: 200,
      onComplete: () => { if (this.freezeOverlay) { this.freezeOverlay.destroy(); this.freezeOverlay = null; } }
    });
  },

  showStreakText(count) {
    if (this.streakText) this.streakText.destroy();
    this.streakText = this.add.text(GAME_WIDTH / 2, 180, count + 'x PERFECT', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#00CFFF'
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0).setScale(0.5);
    this.tweens.add({
      targets: this.streakText, scale: 1, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.streakText, alpha: 0, delay: 400, duration: 200,
          onComplete: () => { if (this.streakText) { this.streakText.destroy(); this.streakText = null; } }
        });
      }
    });
    if (count >= 3) {
      const fire = this.add.text(GAME_WIDTH / 2, 140, 'ON FIRE!', {
        fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF9500'
      }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
      this.scalePunch(fire, 1.4, 400);
      this.tweens.add({ targets: fire, alpha: 0, delay: 600, duration: 300, onComplete: () => fire.destroy() });
    }
  },

  playDeathSequence(lastX, lastY, callback) {
    this.shakeScreen(18, 600);
    this.soundDeath();
    // Drip burst
    if (this.textures.exists('drip')) {
      for (let i = 0; i < 20; i++) {
        const d = this.add.image(lastX + (Math.random() - 0.5) * 80, lastY, 'drip').setDepth(80).setScrollFactor(0);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const spd = 100 + Math.random() * 150;
        this.tweens.add({
          targets: d, x: d.x + Math.cos(angle) * spd, y: d.y + Math.sin(angle) * spd + 150,
          alpha: 0, duration: 800, ease: 'Power1', onComplete: () => d.destroy()
        });
      }
    }
    // Red flash
    this.time.delayedCall(150, () => this.flashScreen(0xFF3B00, 0.7, 400));
    // MELTED text
    this.time.delayedCall(600, () => {
      const mt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MELTED', {
        fontSize: '64px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF9500'
      }).setOrigin(0.5).setDepth(110).setScrollFactor(0).setScale(0);
      this.tweens.add({
        targets: mt, scale: { from: 0, to: 1.2 }, duration: 200, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: mt, scale: 1, duration: 100 });
        }
      });
    });
    this.time.delayedCall(DEATH_DELAY_MS, () => { if (callback) callback(); });
  }
};
