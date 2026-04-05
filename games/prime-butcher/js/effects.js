// Prime Butcher — effects.js (juice effects via prototype mixin)

Object.assign(GameScene.prototype, {
  drawSliceTrail(x1, y1, x2, y2) {
    const gfx = this.trailGfx;
    gfx.lineStyle(3, COLORS.sliceTrail, 1);
    gfx.beginPath();
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.strokePath();
    this.tweens.add({
      targets: gfx, alpha: 0, duration: 200,
      onComplete: () => { gfx.clear(); gfx.setAlpha(1); }
    });
  },

  cutEffects(x, y, combo) {
    // Particle burst — 12+ yellow particles
    const count = Math.min(12 + combo * 3, 30);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const spd = 120 + Math.random() * 80;
      const p = this.add.image(x, y, 'particle').setDepth(7).setScale(0.6 + Math.random() * 0.4);
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * spd * 0.5, y: y + Math.sin(angle) * spd * 0.5 + 75,
        alpha: 0, scale: 0, duration: 500,
        onComplete: () => p.destroy()
      });
    }

    // Screen shake
    const intensity = Math.min(0.003 + combo * 0.001, 0.008);
    this.cameras.main.shake(120, intensity);

    // Hit-stop: freeze blocks briefly using setTimeout (NOT timeScale)
    const frozenBlocks = this.fallingBlocks.filter(b => !b.frozen);
    frozenBlocks.forEach(b => b.frozen = true);
    setTimeout(() => { frozenBlocks.forEach(b => b.frozen = false); }, 50);

    // Combo effects
    if (combo >= 2) {
      this.events.emit('comboUpdate', combo);
    }
    if (combo >= 3) {
      this.flashScreen(0xFF6B35, 0.08, 100);
    }
    if (combo >= 4) {
      this.tweens.add({
        targets: this.cameras.main, zoom: 1.05, duration: 100, yoyo: true, ease: 'Sine.easeOut'
      });
    }
    if (combo >= 5) {
      this.flashScreen(0xF9C74F, 0.12, 100);
    }

    this.playSound('cut');
  },

  wrongCutFlash(block) {
    block.img.setTint(0xFF0000);
    this.time.delayedCall(200, () => {
      if (block.img && block.img.active) block.img.clearTint();
    });
    this.score += SCORE_VALUES.wrongCutPenalty;
    if (this.score < 0) this.score = 0;
    window.GameState.score = this.score;
    this.events.emit('scoreUpdate', this.score);
    this.playSound('wrong');
  },

  floatScoreText(pts, x, y, isPrime) {
    const color = isPrime ? COLORS.primeBlock : COLORS.comboText;
    const size = isPrime ? '16px' : '22px';
    const txt = this.add.text(x, y, '+' + pts, {
      fontSize: size, fontFamily: 'Arial', fontStyle: 'bold', color: color
    }).setOrigin(0.5).setDepth(9);
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  primeSparkle(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const p = this.add.image(x, y, 'particleBlue').setDepth(7).setScale(0.5);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0, scale: 0, duration: 400,
        onComplete: () => p.destroy()
      });
    }
  },

  flashScreen(color, alpha, duration) {
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, alpha).setDepth(15);
    this.tweens.add({
      targets: flash, alpha: 0, duration: duration,
      onComplete: () => flash.destroy()
    });
  },

  stageFlash() {
    this.flashScreen(0xFFFFFF, 0.6, 100);
    this.cameras.main.shake(80, 0.002);
    this.playSound('stageClear');
  },

  deathEffects() {
    this.cameras.main.shake(400, 0.015);
    this.flashScreen(0xFF0000, 0.4, 300);

    // Fade out all stacked blocks
    for (const b of this.stackedBlocks) {
      this.tweens.add({ targets: b.container, alpha: 0, duration: 300 });
    }

    this.playSound('gameOver');
  },

  playSound(type) {
    if (window.GameState.settings.soundOff) return;
    try {
      const ctx = window._audioCtx || (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      switch (type) {
        case 'cut':
          osc.type = 'sawtooth'; osc.frequency.value = 220;
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now); osc.stop(now + 0.18);
          break;
        case 'wrong':
          osc.type = 'square'; osc.frequency.value = 150;
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
          break;
        case 'dissolve':
          osc.type = 'sine'; osc.frequency.value = 600;
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        case 'land':
          osc.type = 'sine'; osc.frequency.value = 100;
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
          break;
        case 'danger':
          osc.type = 'sawtooth'; osc.frequency.value = 80;
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now); osc.stop(now + 0.5);
          break;
        case 'stageClear':
          osc.type = 'sine'; osc.frequency.value = 523;
          gain.gain.setValueAtTime(0.12, now);
          osc.frequency.setValueAtTime(659, now + 0.15);
          osc.frequency.setValueAtTime(784, now + 0.3);
          osc.frequency.setValueAtTime(1047, now + 0.45);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.start(now); osc.stop(now + 0.6);
          break;
        case 'gameOver':
          osc.type = 'sawtooth'; osc.frequency.value = 400;
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.start(now); osc.stop(now + 0.8);
          break;
        default:
          osc.type = 'sine'; osc.frequency.value = 440;
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now); osc.stop(now + 0.08);
      }
    } catch (e) { /* silent fail */ }
  }
});
