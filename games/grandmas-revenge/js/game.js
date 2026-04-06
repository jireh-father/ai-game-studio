class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.continueRun = data && data.continueRun; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.playerY = Math.round(H * PLAYER_Y_RATIO);
    this.floorY = Math.round(H * FLOOR_Y_RATIO);
    Object.assign(this, { gameOver: false, paused: false, stageTransitioning: false,
      projectiles: [], invincible: false, comboStreak: 0, lastInputTime: Date.now(),
      swipeStartX: 0, swipeStartTime: 0, lastSwipeTime: 0, lastSwipeDir: '',
      stageTimer: null, throwEvents: [], currentLane: 1 });

    if (!this.continueRun) {
      Object.assign(window.GS, { score: 0, stage: 1, hp: MAX_HP, adUsed: false });
    }

    this.add.rectangle(W / 2, H / 2, W, H, 0xfff8e7);
    this.add.rectangle(W / 2, this.floorY, W, 4, 0x8b6914);
    LANE_X.forEach(lx => this.add.circle(lx, this.floorY + 12, 4, 0xbdc3c7, 0.4));

    this.currentTier = getAngerTier(window.GS.stage);
    this.grandma = this.add.image(W / 2, GRANDMA_Y, 'grandma_t' + this.currentTier).setScale(1.1);
    this.tweens.add({ targets: this.grandma, y: GRANDMA_Y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.player = this.add.image(LANE_X[1], this.playerY, 'player');

    this.scene.launch('HUDScene');
    this.hud = this.scene.get('HUDScene');
    this.setupInput();

    this.visHandler = () => { if (document.hidden && !this.gameOver && !this.paused) this.togglePause(); };
    document.addEventListener('visibilitychange', this.visHandler);

    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (!this.gameOver && !this.paused) {
        window.GS.score += SCORE.SURVIVAL_PER_SEC * (window.GS.hp === MAX_HP ? 2 : 1);
        this._hudCall('updateScore');
      }
    }});
    this.beginStage(window.GS.stage);
  }

  _hudCall(fn) { if (this.hud && this.hud.scene.isActive()) this.hud[fn](); }

  setupInput() {
    this.input.on('pointerdown', (p) => {
      if (this.gameOver) return;
      if (p.y < 48 && !this.paused) { this.togglePause(); return; }
      if (this.paused) return;
      this.swipeStartX = p.x; this.swipeStartTime = Date.now();
    });
    this.input.on('pointerup', (p) => {
      if (this.gameOver || this.paused) return;
      const dx = p.x - this.swipeStartX, dt = Date.now() - this.swipeStartTime;
      if (Math.abs(dx) > SWIPE_THRESHOLD && dt < 400) {
        const dir = dx > 0 ? 'right' : 'left', now = Date.now();
        const dbl = (now - this.lastSwipeTime < DOUBLE_SWIPE_MS) && dir === this.lastSwipeDir;
        this.lastSwipeTime = now; this.lastSwipeDir = dir; this.lastInputTime = now;
        this.handleDodge(dir, dbl);
      }
    });
  }

  handleDodge(dir, dbl) {
    const lanes = dbl ? 2 : 1;
    const nl = dir === 'left' ? Math.max(0, this.currentLane - lanes) : Math.min(2, this.currentLane + lanes);
    if (nl === this.currentLane) {
      this.tweens.add({ targets: this.player, x: LANE_X[nl] + (dir === 'left' ? -10 : 10), duration: 60, yoyo: true });
      return;
    }
    this.currentLane = nl;
    for (let i = 0; i < (dbl ? 4 : 2); i++) {
      const g = this.add.image(this.player.x, this.player.y, 'player').setAlpha(0.4 - i * 0.1).setDepth(5);
      this.tweens.add({ targets: g, alpha: 0, duration: 100, delay: i * 30, onComplete: () => g.destroy() });
    }
    this.tweens.add({ targets: this.player, x: LANE_X[nl], duration: 120, ease: 'Back.easeOut' });
    Effects.scalePunch.call(this, this.player, dbl ? 1.4 : 1.2, 100);
    Effects.spawnDust.call(this, this.player.x, this.playerY + 25, dbl ? 6 : 4);
    Effects.playSound('swish');
  }

  beginStage(stageNum) {
    this.stageTransitioning = false;
    const params = Stages.getParams(stageNum);
    const seq = Stages.generateThrowSequence(params);
    const tier = getAngerTier(stageNum);
    if (tier !== this.currentTier) {
      this.currentTier = tier;
      Effects.screenFlash.call(this, 0xe74c3c, 0.6, 300);
      Effects.grandmaShudder.call(this, this.grandma);
      Effects.playSound('tier_up');
      this.grandma.setTexture('grandma_t' + tier);
      Effects.hitTextPop.call(this, this.scale.width / 2, 200, 'GRANDMA\nLEVEL UP!', '#9B59B6');
    }
    this.throwEvents.forEach(e => e.remove && e.remove());
    this.throwEvents = seq.map(t => this.time.delayedCall(t.delay, () => {
      if (!this.gameOver && !this.paused) this.throwProjectile(t);
    }));
    if (this.stageTimer) this.stageTimer.remove();
    this.stageTimer = this.time.delayedCall(params.duration, () => { if (!this.gameOver) this.onStageClear(); });
  }

  throwProjectile(td) {
    const type = PROJ_TYPES[td.type];
    if (!type) return;
    this.tweens.add({ targets: this.grandma, angle: -15, duration: td.telegraphMs / 2, yoyo: true, ease: 'Power2' });
    this.time.delayedCall(td.telegraphMs, () => {
      if (this.gameOver) return;
      const targetX = LANE_X[this.currentLane] + (td.aimNoise || 0);
      const endY = this.floorY + 20;
      Effects.playSound('whoosh');
      const proj = this.add.image(this.grandma.x, this.grandma.y + 40, type.key).setDepth(10);
      proj.ptype = td.type; proj.hit = false;
      this.projectiles.push(proj);
      const dur = Stages.getBaseDuration(td.speedMult);
      this.tweens.add({ targets: proj, x: targetX, y: endY, duration: dur, ease: type.ease,
        onComplete: () => { if (!proj.hit) this.onProjectileMiss(proj); }
      });
      this.tweens.add({ targets: proj, angle: 360, duration: dur, ease: 'Linear' });
    });
  }

  onProjectileMiss(proj) {
    const type = PROJ_TYPES[proj.ptype];
    const dist = Math.abs(proj.x - this.player.x);
    this.comboStreak++;
    const mult = Math.min(5, 1 + (this.comboStreak >= 3 ? (this.comboStreak - 2) * 0.5 : 0));
    const pts = Math.round((SCORE[type.scoreKey] || 50) * mult);
    window.GS.score += pts;
    Effects.floatText.call(this, proj.x, proj.y - 20, '+' + pts, COL.ACCENT);
    if (dist < SCORE.CLOSE_CALL_DIST) {
      window.GS.score += SCORE.CLOSE_CALL_BONUS;
      Effects.floatText.call(this, proj.x + 20, proj.y - 40, 'CLOSE!', '#F39C12', 20);
      Effects.playSound('chime');
    }
    if (this.comboStreak >= 3 && this.hud && this.hud.scene.isActive()) {
      this.hud.showCombo(this.comboStreak);
      if (this.comboStreak === 3) Effects.playSound('chime');
    }
    this._hudCall('updateScore');
    this.removeProjectile(proj);
  }

  removeProjectile(proj) {
    const idx = this.projectiles.indexOf(proj);
    if (idx > -1) this.projectiles.splice(idx, 1);
    proj.destroy();
  }

  onProjectileHit(proj) {
    if (this.invincible || this.gameOver || proj.hit) return;
    proj.hit = true;
    const type = PROJ_TYPES[proj.ptype];
    this.comboStreak = 0;
    if (this.hud && this.hud.scene.isActive()) this.hud.hideCombo();
    window.GS.hp--;
    if (this.hud && this.hud.scene.isActive()) this.hud.updateHearts();
    Effects.hitStop.call(this, type.hitStop);
    Effects.doShake.call(this, type.hitShake, 300);
    Effects.ragdoll.call(this, this.player);
    Effects.playerFlash.call(this, this.player);
    Effects.hitTextPop.call(this, this.player.x, this.player.y, type.hitText, COL.DANGER);
    Effects.camZoom.call(this, 1.05, 200);
    if (type.shockwave) Effects.shockwave.call(this, proj.x, proj.y);
    if (type.screenFlash) Effects.screenFlash.call(this, 0x9b59b6, 0.5, 400);
    const snd = { slipper: 'bonk', remote: 'crack', pot: 'clang', grandma_ball: 'splat' };
    Effects.playSound(snd[proj.ptype] || 'bonk');
    this.removeProjectile(proj);
    this.invincible = true;
    Effects.startInvFlicker.call(this, this.player);
    setTimeout(() => { this.invincible = false; }, INVINCIBILITY_MS);
    if (window.GS.hp <= 0) this.triggerDeath();
  }

  onStageClear() {
    if (this.gameOver || this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    const bonus = window.GS.stage * SCORE.STAGE_CLEAR_BASE * (window.GS.hp === MAX_HP ? 3 : 1);
    window.GS.score += bonus;
    Effects.floatText.call(this, this.scale.width / 2, 300, 'STAGE CLEAR! +' + bonus, COL.ACCENT, 24);
    Effects.stageClearBurst.call(this, this.player.x, this.player.y);
    Effects.playSound('stage_clear');
    this._hudCall('updateScore');
    window.GS.stage++;
    this.time.delayedCall(1500, () => {
      if (!this.gameOver) { this._hudCall('updateStage'); this.beginStage(window.GS.stage); }
    });
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    Effects.playSound('game_over');
    Effects.doShake.call(this, 12, 500);
    Effects.deathSlowMo.call(this);
    this.tweens.add({ targets: this.grandma, y: this.grandma.y - 30, duration: 200, yoyo: true, ease: 'Power2' });
    this.time.delayedCall(600, () => this.scene.launch('GameOverScene'));
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.pause('GameScene');
      if (this.hud && this.hud.scene.isActive()) this.hud.showPauseOverlay(this);
    } else {
      this.lastInputTime = Date.now();
      if (this.hud && this.hud.scene.isActive()) this.hud.hidePauseOverlay();
      this.scene.resume('GameScene');
    }
  }

  update() {
    if (this.gameOver || this.paused) return;
    if (Date.now() - this.lastInputTime > INACTIVITY_MS && !this.invincible) {
      this.lastInputTime = Date.now();
      this.throwProjectile({ type: Stages.pickProjectile(window.GS.stage), aimNoise: 0,
        telegraphMs: 80, speedMult: Stages.getParams(window.GS.stage).speedMult });
    }
    const px = this.player.x, py = this.player.y, pw = 15, ph = 25;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.hit || !p.active) continue;
      const t = PROJ_TYPES[p.ptype];
      if (t && Math.abs(px - p.x) < pw + t.w / 2 && Math.abs(py - p.y) < ph + t.h / 2) this.onProjectileHit(p);
    }
  }

  shutdown() {
    this.tweens.killAll(); this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    if (this._invFlicker) clearInterval(this._invFlicker);
    this.projectiles = [];
  }
}
