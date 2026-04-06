// Echo Dodge - Juice Effects & Enemy AI (mixin for GameScene)
const GameEffects = {
  initEffects() {
    this.driftParticles = [];
    this.deathParticles = [];
    this.nearMissCombo = 0;
    this.lastNearMissTime = 0;
    this.isHitStopActive = false;
    this.storedVelocities = [];
    this.audioCtx = null;
    this.soundEnabled = true;
  },

  ensureAudio() {
    if (!this.audioCtx) {
      try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.soundEnabled = false; }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
  },

  playSound(freq, dur, type, vol) {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const o = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.15, this.audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur / 1000);
      o.connect(g); g.connect(this.audioCtx.destination);
      o.start(); o.stop(this.audioCtx.currentTime + dur / 1000);
    } catch (e) {}
  },

  playSweep(sf, ef, dur) {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const o = this.audioCtx.createOscillator(), g = this.audioCtx.createGain();
      o.frequency.setValueAtTime(sf, this.audioCtx.currentTime);
      o.frequency.linearRampToValueAtTime(ef, this.audioCtx.currentTime + dur / 1000);
      g.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur / 1000);
      o.connect(g); g.connect(this.audioCtx.destination);
      o.start(); o.stop(this.audioCtx.currentTime + dur / 1000);
    } catch (e) {}
  },

  playTrailTick() { this.playSound(2400 + (Math.random() - 0.5) * 480, 60, 'sine', 0.06); },
  playNearMiss() { this.playSweep(800, 200, 120); },
  playEnemySpawn() { this.playSound(120, 100, 'sine', 0.15); setTimeout(() => this.playSound(120, 100, 'sine', 0.12), 100); },
  playEnemyDeath() { this.playSound(3000 + Math.random() * 1000, 150, 'square', 0.1); },
  playPlayerDeath() { this.playSound(220, 400, 'sine', 0.25); this.playSound(1200, 400, 'square', 0.12); },
  playStageClear() { [262, 330, 392, 523].forEach((f, i) => setTimeout(() => this.playSound(f, 80, 'sine', 0.15), i * 80)); },
  playStreakChime() { [440, 523, 659].forEach((f, i) => setTimeout(() => this.playSound(f, 70, 'triangle', 0.12), i * 65)); },

  spawnDriftParticle(x, y, angle) {
    const a = angle + (Math.random() - 0.5) * 1.05;
    const p = this.add.circle(x, y, 3, COLORS.trail, 0.6);
    p.vx = Math.cos(a) * 40; p.vy = Math.sin(a) * 40;
    p.life = 200; p.maxLife = 200;
    this.driftParticles.push(p);
    if (this.driftParticles.length > 20) { this.driftParticles.shift().destroy(); }
  },

  triggerNearMiss(segX, segY) {
    const now = this.time.now;
    this.nearMissCombo = (now - this.lastNearMissTime < SCORE.STREAK_WINDOW_MS) ? this.nearMissCombo + 1 : 1;
    this.lastNearMissTime = now;
    const pts = this.nearMissCombo >= 2 ? SCORE.NEAR_MISS * SCORE.STREAK_MULT : SCORE.NEAR_MISS;
    this.addScore(pts);
    this.spawnFloatingText(segX, segY, this.nearMissCombo >= 2 ? `+${pts} STREAK!` : `+${pts} CLOSE!`);
    this.playNearMiss();

    const zoom = this.nearMissCombo >= 3 ? 1.10 : this.nearMissCombo >= 2 ? 1.08 : 1.05;
    this.cameras.main.zoomTo(zoom, 80);
    this.time.delayedCall(80, () => this.cameras.main.zoomTo(1.0, 120));
    this.burstParticles(segX, segY, this.nearMissCombo >= 3 ? 16 : this.nearMissCombo >= 2 ? 12 : 8, COLORS.trail, 120);
    if (this.nearMissCombo >= 3) this.cameras.main.shake(100, 0.005);

    // Hit-stop
    if (!this.isHitStopActive) {
      this.isHitStopActive = true;
      this.storedVelocities = this.enemies.map(e => ({ vx: e.vx || 0, vy: e.vy || 0 }));
      this.enemies.forEach(e => { e.vx = 0; e.vy = 0; });
      setTimeout(() => {
        if (this.enemies) this.enemies.forEach((e, i) => {
          if (this.storedVelocities[i]) { e.vx = this.storedVelocities[i].vx; e.vy = this.storedVelocities[i].vy; }
        });
        this.isHitStopActive = false;
      }, 60);
    }
    if (this.nearMissCombo >= 2) {
      this.playStreakChime();
      if (this.streakText) {
        this.streakText.setText(`x${this.nearMissCombo} STREAK!`).setAlpha(1).setVisible(true);
        if (this.streakTween) this.streakTween.stop();
        this.streakTween = this.tweens.add({ targets: this.streakText, alpha: 0, delay: 2500, duration: 500 });
      }
    }
  },

  triggerDeathEffects() {
    this.playPlayerDeath();
    this.activeTrail.forEach(s => s.setTint(0xFFFFFF));
    setTimeout(() => { if (this.activeTrail) this.activeTrail.forEach(s => s.clearTint()); }, 200);
    this.cameras.main.shake(320, 0.03);
    const c = document.querySelector('canvas');
    if (c) { c.style.transition = 'filter 300ms'; c.style.filter = 'grayscale(80%)'; }
    this.burstParticles(this.player.x, this.player.y, 30, COLORS.player, 200);
  },

  clearDeathEffects() {
    const c = document.querySelector('canvas');
    if (c) { c.style.filter = 'none'; c.style.transition = ''; }
  },

  enemyDeathBurst(x, y) { this.playEnemyDeath(); this.burstParticles(x, y, 8, COLORS.enemy, 120); },

  stageClearEffect() {
    this.playStageClear();
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const r = this.add.circle(w / 2, h / 2, 1, 0x000000, 0).setStrokeStyle(3, COLORS.accentHex);
    this.tweens.add({
      targets: r, radius: 600, alpha: 0, duration: 400,
      onUpdate: () => { r.setStrokeStyle(3, COLORS.accentHex, r.alpha); r.setRadius(r.radius); },
      onComplete: () => r.destroy()
    });
  },

  burstParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      const p = this.add.circle(x, y, 3, color, 1);
      p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed;
      p.life = 300; p.maxLife = 300;
      this.deathParticles.push(p);
    }
  },

  spawnFloatingText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', fill: COLORS.accent, fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  },

  playerScalePunch() { if (this.player) this.tweens.add({ targets: this.player, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true }); },

  scoreHudPunch() {
    if (!this.scoreText) return;
    if (this.scorePunchTween) this.scorePunchTween.stop();
    this.scoreText.setScale(1.25);
    this.scorePunchTween = this.tweens.add({ targets: this.scoreText, scaleX: 1, scaleY: 1, duration: 100 });
  },

  updateParticles(delta) {
    const dt = delta / 1000;
    const update = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= delta;
        p.setAlpha(Math.max(0, p.life / p.maxLife));
        if (p.life <= 0) { p.destroy(); arr.splice(i, 1); }
      }
    };
    update(this.driftParticles);
    update(this.deathParticles);
  },

  startPlayerGlow() {
    this.tweens.add({ targets: this.player, scaleX: 1.08, scaleY: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },

  // Enemy AI update (called from game.js update)
  updateEnemies(dt, w, h) {
    if (this.isHitStopActive) return false;
    let died = false;
    this.enemies.forEach(enemy => {
      if (enemy.isPulse) {
        enemy.pulseTimer = (enemy.pulseTimer || 0) + dt * 1000;
        if (enemy.pulseTimer > 2000 && !enemy.pulsePaused) {
          enemy.pulsePaused = true; enemy.pulseTimer = 0;
          const gx = this.ghostTargetX, gy = this.ghostTargetY;
          setTimeout(() => {
            if (!enemy || enemy.active === false) return;
            enemy.pulsePaused = false;
            const d = Math.sqrt((gx - enemy.x) ** 2 + (gy - enemy.y) ** 2) || 1;
            enemy.vx = ((gx - enemy.x) / d) * enemy.speed * 2;
            enemy.vy = ((gy - enemy.y) / d) * enemy.speed * 2;
          }, 500);
          enemy.vx = 0; enemy.vy = 0; return;
        }
        if (enemy.pulsePaused) return;
      }
      const dx = this.ghostTargetX - enemy.x, dy = this.ghostTargetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) { enemy.vx = (dx / dist) * enemy.speed; enemy.vy = (dy / dist) * enemy.speed; }
      enemy.x += enemy.vx * dt; enemy.y += enemy.vy * dt;
      enemy.x = Phaser.Math.Clamp(enemy.x, 14, w - 14);
      enemy.y = Phaser.Math.Clamp(enemy.y, 14, h - 14);

      // Enemy-player collision
      const epd = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
      if (epd < ENEMY.COLLISION_RADIUS) { died = true; return; }

      // Enemy-trail collision
      for (let i = this.activeTrail.length - 1; i >= 0; i--) {
        const s = this.activeTrail[i];
        if (Math.sqrt((enemy.x - s.x) ** 2 + (enemy.y - s.y) ** 2) < 10) {
          this.enemyDeathBurst(enemy.x, enemy.y);
          const pts = SCORE.ENEMY_KILL * this.stage;
          this.addScore(pts);
          this.spawnFloatingText(enemy.x, enemy.y, `+${pts}`);
          const pos = getEnemySpawnPositions(1, w, h, this.player.x, this.player.y)[0];
          enemy.setPosition(pos.x, pos.y);
          break;
        }
      }
    });
    return died;
  },

  shutdownEffects() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.driftParticles.forEach(p => p.destroy());
    this.deathParticles.forEach(p => p.destroy());
    this.driftParticles = []; this.deathParticles = [];
    this.clearDeathEffects();
  }
};
