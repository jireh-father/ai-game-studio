// Set Surgeon - Juice Effects (mixed into GameScene prototype)
Object.assign(GameScene.prototype, {
  playPickupSound() {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch(e){}
  },

  playCorrectSound(streakPitch) {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const pitchMult = 1 + (streakPitch || 0) * 0.03;
      [523 * pitchMult, 659 * pitchMult].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } catch(e){}
  },

  playWrongSound() {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e){}
  },

  playTimeoutSound() {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [220, 165].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch(e){}
  },

  playFanfare() {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } catch(e){}
  },

  correctFeedback(x, y, regionId, score, firstTry, speedBonus) {
    this.playCorrectSound(GameState.streak);
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);

    // Green flash on region
    const overlay = this.regionOverlays[regionId];
    if (overlay) {
      overlay.fillColor = 0x2ECC71;
      overlay.setAlpha(0.6);
      this.tweens.add({ targets: overlay, alpha: 0, duration: 300 });
    }

    // Particles
    const particleCount = Math.min(20, 8 + GameState.streak);
    for (let i = 0; i < particleCount; i++) {
      const p = this.add.circle(x, y, 4, 0x2ECC71).setDepth(60);
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 80 + Math.random() * 40;
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, duration: 400, onComplete: () => p.destroy()
      });
    }

    // Floating score text
    const txt = this.add.text(x, y - 10, '+' + score,
      { fontSize: '18px', fontFamily: 'monospace', fill: CONFIG.COLORS.CORRECT, fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 600, onComplete: () => txt.destroy() });

    if (speedBonus) {
      const fast = this.add.text(x + 30, y - 10, 'FAST!',
        { fontSize: '12px', fontFamily: 'monospace', fill: CONFIG.COLORS.STREAK, fontStyle: 'bold' }
      ).setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: fast, y: y - 50, alpha: 0, duration: 600, onComplete: () => fast.destroy() });
    }

    // Camera zoom on first try
    if (firstTry) {
      this.cameras.main.zoomTo(1.03, 80, 'Sine.easeOut', true);
      this.time.delayedCall(80, () => this.cameras.main.zoomTo(1, 120));
    }
  },

  wrongFeedback(obj) {
    this.playWrongSound();
    if (navigator.vibrate) navigator.vibrate(30);

    // Element shake
    const startX = obj.x;
    const offsets = [10, -10, 8, -8, 6, -6, 4, -4, 0];
    offsets.forEach((off, i) => {
      this.time.delayedCall(i * 35, () => {
        if (obj && obj.active) obj.x = startX + off;
      });
    });

    // Red screen pulse
    this.redFlash.setAlpha(0.35);
    this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 200 });
  },

  timeoutFeedback() {
    this.playTimeoutSound();
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    this.cameras.main.shake(400, 0.012);

    // Life icon animation
    const idx = GameState.lives; // just lost this one
    if (this.lifeIcons[idx]) {
      this.tweens.add({
        targets: this.lifeIcons[idx], scaleX: 0, scaleY: 0, duration: 300,
        onComplete: () => {
          this.lifeIcons[idx].setTexture('lifeEmpty').setScale(1);
        }
      });
    }

    // Red flash
    this.redFlash.setAlpha(0.4);
    this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 400 });
  },

  scorePunch() {
    this.tweens.add({
      targets: this.scoreText, scaleX: 1.4, scaleY: 1.4, duration: 120, yoyo: true,
      onStart: () => this.scoreText.setColor(CONFIG.COLORS.CORRECT),
      onComplete: () => this.scoreText.setColor('#FFFFFF')
    });
  },

  streakMilestone() {
    this.tweens.add({
      targets: this.streakBadge, scaleX: 1.5, scaleY: 1.5, angle: 360,
      duration: 350, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: this.streakBadge, scaleX: 1, scaleY: 1, angle: 0, duration: 200 });
      }
    });
    // Streak sound
    if (GameState.soundOn) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [660, 880, 1100].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.2);
        });
      } catch(e){}
    }
  },

  onStreakBreak() {
    if (this.streakBadge.alpha > 0) {
      this.tweens.add({ targets: this.streakBadge, scaleX: 0, scaleY: 0, duration: 150,
        onComplete: () => { this.streakBadge.setAlpha(0).setScale(1); }
      });
    }
  },

  roundCompleteFeedback() {
    this.playFanfare();

    // Confetti burst
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;
    const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x2ECC71, 0xC3B1E1, 0xFDCB6E];
    for (let i = 0; i < 20; i++) {
      const rect = this.add.rectangle(cx, cy, 8, 8, colors[i % colors.length]).setDepth(95);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 120;
      this.tweens.add({
        targets: rect,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist + 60,
        angle: Math.random() * 360,
        alpha: 0, duration: 1000, ease: 'Cubic.easeOut',
        onComplete: () => rect.destroy()
      });
    }

    // Round clear text
    const clearTxt = this.add.text(cx, cy - 40, 'ROUND CLEAR!',
      { fontSize: '22px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold',
        backgroundColor: CONFIG.COLORS.BUTTON, padding: { x: 16, y: 8 } }
    ).setOrigin(0.5).setDepth(96).setScale(0);
    this.tweens.add({
      targets: clearTxt, scaleX: 1.1, scaleY: 1.1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: clearTxt, scaleX: 1, scaleY: 1, duration: 100 });
        this.time.delayedCall(1000, () => {
          this.tweens.add({ targets: clearTxt, alpha: 0, duration: 200, onComplete: () => clearTxt.destroy() });
        });
      }
    });
  }
});
