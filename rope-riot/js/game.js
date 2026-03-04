// Core gameplay scene — rope physics, input, game loop
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);
    AudioManager.unlock();

    const st = window.GAME_STATE;
    this.stageConfig = getStageConfig(st.stage);
    this.enemies = [];
    this.enemiesKilledThisWhip = 0;
    this.allEnemiesSpawned = false;
    this.isAiming = false;
    this.isDead = false;
    this.inGrace = true;
    this.dodgeCooldown = 0;
    this.pointerDownTime = 0;
    this.pointerDownPos = { x: 0, y: 0 };

    this.buildPlatforms();
    this.createPlayer();
    this.initRope();
    this.createHUD();
    this.setupInput();
    this.spawnEnemyWave();
    this.setupInactivityTimer();

    this.time.delayedCall(CONFIG.TIMING.GRACE_PERIOD_MS, () => { this.inGrace = false; });

    this.visHandler = () => { if (document.hidden) this.scene.pause(); else this.scene.resume(); };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  buildPlatforms() {
    this.platformLayout = buildPlatformLayout(this.stageConfig, CONFIG.WIDTH, CONFIG.HEIGHT);
    this.platformGraphics = [];
    this.platformLayout.segments.forEach(seg => {
      const g = this.add.graphics();
      g.fillStyle(CONFIG.COLORS.PLATFORM, 1).fillRect(seg.x, seg.y, seg.width, seg.height);
      g.lineStyle(2, CONFIG.COLORS.PLATFORM_EDGE, 1).strokeRect(seg.x, seg.y, seg.width, seg.height);
      g.lineStyle(1, CONFIG.COLORS.PLATFORM_HIGHLIGHT, 0.6).lineBetween(seg.x, seg.y, seg.x + seg.width, seg.y);
      for (let gx = seg.x + 32; gx < seg.x + seg.width; gx += 32) {
        g.lineStyle(1, 0x2A3A5B, 0.4).lineBetween(gx, seg.y, gx, seg.y + seg.height);
      }
      this.platformGraphics.push(g);
    });
  }

  createPlayer() {
    const seg = this.platformLayout.segments[0];
    this.playerX = seg.x + seg.width * 0.3;
    this.playerY = this.platformLayout.platformY - 20;
    this.playerSprite = this.add.image(this.playerX, this.playerY, 'player').setOrigin(0.5, 1);
  }

  initRope() {
    const ax = this.playerX, ay = this.playerY - 12;
    this.ropePoints = Array.from({ length: CONFIG.PHYSICS.ROPE_SEGMENTS }, () => ({ x: ax, y: ay, px: ax, py: ay }));
    this.ropeGraphics = this.add.graphics();
    this.ropeGlowGraphics = this.add.graphics();
    this.whipArcGraphics = this.add.graphics();
  }

  createHUD() {
    const f = (s) => ({ fontSize: s, fontFamily: 'Arial, sans-serif', fontStyle: 'bold' });
    this.scoreText = this.add.text(12, 12, `SCORE: ${window.GAME_STATE.score}`, { ...f('20px'), color: '#FFFFFF' }).setScrollFactor(0).setDepth(100);
    this.stageText = this.add.text(CONFIG.WIDTH - 12, 12, `STAGE ${window.GAME_STATE.stage}`, { ...f('18px'), color: '#FFD700' }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.pauseBtn = this.add.text(CONFIG.WIDTH / 2, 14, '\u2261', { fontSize: '28px', color: '#FFFFFF' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setInteractive();
    this.pauseBtn.on('pointerdown', () => showPauseOverlay(this));
    this.comboText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 60, '', { ...f('28px'), color: '#FFE600' }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
    this.warningText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 30, 'MOVE!', { ...f('16px'), color: '#FF0000' }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      if (this.isDead) return;
      this.resetInactivity();
      this.pointerDownTime = this.time.now;
      this.pointerDownPos = { x: pointer.x, y: pointer.y };
      if (pointer.y > CONFIG.HEIGHT * 0.4) {
        this.isAiming = true;
        this.aimStartX = pointer.x;
        this.aimStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isDead || !this.isAiming) return;
      this.resetInactivity();
      const tip = this.ropePoints[this.ropePoints.length - 1];
      tip.x = pointer.x; tip.y = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isDead) return;
      this.resetInactivity();
      const dt = this.time.now - this.pointerDownTime;
      const dist = Phaser.Math.Distance.Between(this.pointerDownPos.x, this.pointerDownPos.y, pointer.x, pointer.y);

      if (dt < CONFIG.PHYSICS.TAP_THRESHOLD && dist < 20) {
        this.dodgePlayer(pointer.x < CONFIG.WIDTH / 2 ? -1 : 1);
      } else if (this.isAiming && dist >= CONFIG.PHYSICS.ROPE_MIN_DRAG) {
        this.releaseWhip(pointer);
      }
      this.isAiming = false;
    });
  }

  setupInactivityTimer() { this.lastInputTime = this.time.now; }
  resetInactivity() { this.lastInputTime = this.time.now; this.warningText.setAlpha(0); }

  dodgePlayer(dir) {
    if (this.time.now < this.dodgeCooldown) return;
    this.dodgeCooldown = this.time.now + CONFIG.PHYSICS.PLAYER_DODGE_COOLDOWN;
    window.GAME_STATE.usedDodge = true;
    const newX = Phaser.Math.Clamp(
      this.playerX + dir * CONFIG.PHYSICS.PLAYER_DODGE_DIST,
      this.platformLayout.startX + 12, this.platformLayout.startX + this.platformLayout.totalWidth - 12
    );
    this.tweens.add({
      targets: this, playerX: newX, duration: 100, ease: 'Power2',
      onUpdate: () => { this.playerSprite.x = this.playerX; }
    });
    AudioManager.play('click');
  }

  releaseWhip(pointer) {
    const dx = pointer.x - this.playerX;
    const dy = pointer.y - (this.playerY - 12);
    const angle = Math.atan2(dy, dx);
    const dragDist = Math.min(CONFIG.PHYSICS.ROPE_LENGTH, Phaser.Math.Distance.Between(this.playerX, this.playerY, pointer.x, pointer.y));
    const forceMult = (dragDist / CONFIG.PHYSICS.ROPE_LENGTH) * CONFIG.PHYSICS.ROPE_FORCE_BASE * this.stageConfig.ropeForceMultiplier;

    showWhipArc(this, angle, dragDist);
    this.cameras.main.shake(120, 0.004);
    this.tweens.add({ targets: this.playerSprite, scaleX: 1.25, scaleY: 1.25, duration: 75, yoyo: true });

    const hitEnemies = [];
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) continue;
      if (this.isEnemyInWhipRange(e, angle, dragDist)) hitEnemies.push(e);
    }

    if (hitEnemies.length > 0) {
      this.processHits(hitEnemies, angle, forceMult);
    } else {
      window.GAME_STATE.combo = 1.0;
      this.updateComboDisplay();
    }

    const comboPitch = 1 + (window.GAME_STATE.combo - 1) * 0.08;
    AudioManager.play('whip', comboPitch);
  }

  isEnemyInWhipRange(enemy, angle, dragDist) {
    const ex = enemy.sprite.x, ey = enemy.sprite.y;
    const dist = Phaser.Math.Distance.Between(this.playerX, this.playerY - 12, ex, ey);
    if (dist > dragDist + 30) return false;
    const enemyAngle = Math.atan2(ey - (this.playerY - 12), ex - this.playerX);
    let angleDiff = Math.abs(enemyAngle - angle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    return angleDiff < 0.6;
  }

  processHits(hitEnemies, angle, forceMult) {
    const isMulti = hitEnemies.length >= 2;
    hitEnemies.forEach(e => {
      if (e.type === CONFIG.ENEMY_TYPES.SHIELDED && !e.exposed) {
        e.exposed = true; e.sprite.setTexture('exposed');
        e.sprite.setTint(0xFFFFFF);
        this.time.delayedCall(80, () => e.sprite.clearTint());
        spawnHitParticles(this, e.sprite.x, e.sprite.y, 8);
        AudioManager.play('hit');
        return;
      }
      killEnemy(this, e, angle, forceMult);
    });

    window.GAME_STATE.combo = Math.min(CONFIG.SCORING.COMBO_MAX, window.GAME_STATE.combo + CONFIG.SCORING.COMBO_INCREMENT);
    if (isMulti) {
      this.cameras.main.shake(180, Math.min(0.008, 0.004 + hitEnemies.length * 0.001));
      this.cameras.main.zoomTo(1.04, 125, 'Power2', true, (c, p) => { if (p >= 1) c.zoomTo(1, 125); });
      showFloatingText(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.3, `+${hitEnemies.length} KILL!`, '#FFE600', 32, 80, 700);
      AudioManager.play('multikill');
      this.time.timeScale = 0.05;
      this.time.delayedCall(60, () => { this.time.timeScale = 1; });
    } else {
      this.time.timeScale = 0.1;
      this.time.delayedCall(40, () => { this.time.timeScale = 1; });
    }
    this.updateComboDisplay();
  }

  updateComboDisplay() {
    const combo = window.GAME_STATE.combo;
    if (combo > 1) {
      this.comboText.setText(`\u00D7${combo.toFixed(1)}`);
      this.comboText.setAlpha(1);
      this.comboText.setFontSize(Math.min(48, 24 + (combo - 1) * 12));
    }
    if (this.comboFadeTimer) this.comboFadeTimer.remove();
    this.comboFadeTimer = this.time.delayedCall(1500, () => {
      this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
    });
  }

  spawnEnemyWave() {
    const wave = generateEnemyWave(this.stageConfig);
    const spawnX = this.platformLayout.startX + this.platformLayout.totalWidth + 20;
    wave.forEach((def, i) => {
      this.time.delayedCall(def.spawnDelay, () => {
        const y = this.platformLayout.platformY - 16;
        const e = createEnemy(this, def.type, spawnX + i * 20, y, def.speed);
        this.enemies.push(e);
        if (i === wave.length - 1) this.allEnemiesSpawned = true;
      });
    });
  }

  triggerDeath() {
    if (this.isDead) return;
    this.isDead = true;
    AudioManager.play('death');
    triggerDeathEffects(this);
    this.time.timeScale = 0.3;
    this.time.delayedCall(250, () => {
      this.time.timeScale = 1;
      this.time.delayedCall(150, () => this.scene.start('GameOverScene'));
    });
  }

  stageClear() {
    AudioManager.play('stageClear');
    const bonus = CONFIG.SCORING.STAGE_CLEAR_MULT * window.GAME_STATE.stage;
    const dodgeBonus = window.GAME_STATE.usedDodge ? 0 : CONFIG.SCORING.WAVE_NODODGE;
    window.GAME_STATE.score += bonus + dodgeBonus;
    this.scoreText.setText(`SCORE: ${window.GAME_STATE.score}`);
    triggerStageClearEffects(this, bonus, dodgeBonus);
    this.time.delayedCall(CONFIG.TIMING.STAGE_TRANSITION_MS + 500, () => {
      window.GAME_STATE.stage++; window.GAME_STATE.usedDodge = false; this.scene.restart();
    });
  }

  update(time, delta) {
    if (this.isDead) return;
    updateEnemies(this, time, delta);
    this.updateRopeVisual();
    this.checkPlayerFall();
    this.checkInactivity(time);
  }

  updateRopeVisual() {
    this.ropePoints[0].x = this.playerX + 8;
    this.ropePoints[0].y = this.playerY - 14;
    this.ropeGraphics.clear();
    this.ropeGlowGraphics.clear();

    if (this.isAiming) {
      const base = this.ropePoints[0], tip = this.ropePoints[this.ropePoints.length - 1];
      this.ropeGlowGraphics.lineStyle(6, CONFIG.COLORS.ROPE_GLOW, 0.4);
      this.ropeGlowGraphics.beginPath();
      for (let i = 0; i < this.ropePoints.length; i++) {
        const t = i / (this.ropePoints.length - 1);
        const x = base.x + (tip.x - base.x) * t;
        const y = base.y + (tip.y - base.y) * t + Math.sin(t * Math.PI) * 10;
        this.ropePoints[i].x = x; this.ropePoints[i].y = y;
        if (i === 0) this.ropeGlowGraphics.moveTo(x, y); else this.ropeGlowGraphics.lineTo(x, y);
      }
      this.ropeGlowGraphics.strokePath();

      this.ropeGraphics.lineStyle(3, CONFIG.COLORS.ROPE, 1);
      this.ropeGraphics.beginPath();
      this.ropePoints.forEach((p, i) => {
        if (i === 0) this.ropeGraphics.moveTo(p.x, p.y); else this.ropeGraphics.lineTo(p.x, p.y);
      });
      this.ropeGraphics.strokePath();
    }
  }

  checkPlayerFall() {
    const onSeg = this.platformLayout.segments.some(s => this.playerX >= s.x - 5 && this.playerX <= s.x + s.width + 5);
    if (!onSeg && !this.isDead) this.triggerDeath();
  }

  checkInactivity(time) {
    const elapsed = time - this.lastInputTime;
    if (elapsed >= CONFIG.TIMING.INACTIVITY_WARN && elapsed < CONFIG.TIMING.INACTIVITY_DEATH) {
      this.warningText.setAlpha(Math.abs(Math.sin(time * 0.006)));
    }
    if (elapsed >= CONFIG.TIMING.INACTIVITY_DEATH) this.triggerDeath();
  }

  shutdown() { document.removeEventListener('visibilitychange', this.visHandler); }
}
