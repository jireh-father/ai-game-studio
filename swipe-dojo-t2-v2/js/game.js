// Swipe Dojo - Core Gameplay Scene
'use strict';

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.cameras.main.fadeIn(200);
    // Core state
    this.score = 0; this.stage = 1; this.lives = 3;
    this.combo = 0; this.maxCombo = 0; this.damageTaken = false;
    this.gameOver = false; this.paused = false; this.swipeStart = null;
    this.currentAttackIndex = 0; this.currentStage = null; this.currentEnemyHP = 0;
    this.arrowActive = false; this.arrowTimer = null; this.pauseOverlayParts = [];
    // New systems
    this.currentBeltIndex = 0; this.rageMeter = 0;
    this.rageOnCooldown = false; this.lastRageDecayTime = 0;
    this.trailGraphics = this.add.graphics().setDepth(15);
    this.trailPoints = []; this.trailColor = 0xFFFFFF; this.trailFading = false;
    this.currentEnvIndex = 0; this.ambientParticles = [];
    // HUD + sprites
    this.hud = new HUD(this);
    this.playerSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'player').setDepth(10);
    this.enemySprite = this.add.image(GAME_WIDTH / 2, 200, 'enemy_basic').setDepth(10);
    this.enemyNameText = this.add.text(GAME_WIDTH / 2, 110, '', {
      fontSize: '16px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(11);
    // HP bar
    this.hpBarBg = this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10, PALETTE.hpTrack).setDepth(11);
    this.hpBarFill = this.add.rectangle(GAME_WIDTH / 2 - 90, 138, 180, 10, PALETTE.hpFull).setOrigin(0, 0.5).setDepth(12);
    this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10).setStrokeStyle(1.5, PALETTE.hpBorder).setDepth(13);
    // Arrow graphics
    this.arrowGraphics = this.add.graphics().setDepth(20);
    this.arrowGlowTween = null;
    // Particle texture
    if (!this.textures.exists('particle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFFFFF); g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle', 6, 6); g.destroy();
    }
    // Swipe input
    this.input.on('pointerdown', (ptr) => {
      if (this.gameOver || this.paused) return;
      this.swipeStart = { x: ptr.x, y: ptr.y, time: this.time.now };
      this.trailPoints = [{ x: ptr.x, y: ptr.y }]; this.trailFading = false;
      this._resetInactivity();
    });
    this.input.on('pointermove', (ptr) => {
      if (!this.swipeStart || this.gameOver || this.paused) return;
      this.trailPoints.push({ x: ptr.x, y: ptr.y });
      if (this.trailPoints.length > TRAIL.MAX_POINTS) this.trailPoints.shift();
    });
    this.input.on('pointerup', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart) return;
      const dx = ptr.x - this.swipeStart.x, dy = ptr.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SWIPE_MIN_DIST) { this._fadeTrail(); return; }
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
      this.trailColor = DIRECTION_COLORS[dir]; this._drawTrail(); this._fadeTrail();
      this.onSwipe(dir); this.swipeStart = null;
    });
    // Inactivity
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => { this.lives = 0; this._triggerDeath(); });
    // Settings
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"sound":true,"music":true,"vibration":true}');
    audioSynth.sfxEnabled = s.sound; audioSynth.musicEnabled = s.music;
    // Environment + music
    this._applyEnvironment(0); this._spawnAmbientParticles();
    audioSynth.init(); audioSynth.startMusic(90); this._startStage();
  }

  _resetInactivity() {
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => { this.lives = 0; this._triggerDeath(); });
  }

  _startStage() {
    this.currentStage = generateStage(this.stage);
    this.currentEnemyHP = this.currentStage.enemyHP;
    this.currentAttackIndex = 0; this.damageTaken = false;
    const texKey = 'enemy_' + this.currentStage.variant;
    if (this.textures.exists(texKey)) this.enemySprite.setTexture(texKey);
    this.enemyNameText.setText(this.currentStage.name);
    this._updateHPBar(); this.hud.updateStage(this.stage);
    if (this.stage > 1) this.cameras.main.flash(150, 255, 255, 255, false, null, null, 0.15);
    this.time.delayedCall(400, () => this._spawnArrow());
  }

  _updateHPBar() {
    const r = this.currentEnemyHP / this.currentStage.enemyHP;
    this.hpBarFill.width = 180 * Math.max(0, r);
    this.hpBarFill.fillColor = r > 0.3 ? PALETTE.hpFull : PALETTE.hpLow;
  }

  _spawnArrow() {
    if (this.gameOver || this.paused) return;
    if (this.currentAttackIndex >= this.currentStage.sequence.length) {
      this.currentAttackIndex = 0;
      this.currentStage.sequence = buildSequence(getSequenceLength(this.stage), getAttackWindow(this.stage), getFakeoutChance(this.stage));
    }
    const atk = this.currentStage.sequence[this.currentAttackIndex];
    if (atk.fakeout) {
      const fakeDir = DIRECTIONS.filter(d => d !== atk.direction)[Math.floor(Math.random() * 3)];
      this._drawArrow(fakeDir);
      this.time.delayedCall(120, () => this._drawArrow(atk.direction));
    } else { this._drawArrow(atk.direction); }
    this.arrowActive = true; this.expectedDirection = atk.direction;
    this.arrowSpawnTime = this.time.now; this.arrowWindowMs = atk.windowMs;
    audioSynth.playArrowSpawn(atk.direction);
    this.arrowTimer = this.time.delayedCall(atk.windowMs, () => {
      if (this.arrowActive) { this.arrowActive = false; this._clearArrow(); this._onMiss(); }
    });
    this.time.delayedCall(atk.windowMs * 0.8, () => { if (this.arrowActive) this._startArrowUrgency(); });
  }

  onSwipe(dir) {
    if (this.gameOver) return;
    if (!this.arrowActive && this.rageMeter >= RAGE.MAX && !this.rageOnCooldown) {
      this._unleashRageSpecial(); this._resetInactivity(); return;
    }
    if (!this.arrowActive) return;
    this._resetInactivity(); this.arrowActive = false;
    if (this.arrowTimer) { this.arrowTimer.remove(); this.arrowTimer = null; }
    this._clearArrow();
    if (dir === this.expectedDirection) {
      const ratio = (this.time.now - this.arrowSpawnTime) / this.arrowWindowMs;
      let q, p;
      if (ratio <= 0.4) { q = 'perfect'; p = SCORE.PERFECT_BLOCK; }
      else if (ratio <= 0.8) { q = 'good'; p = SCORE.GOOD_BLOCK; }
      else { q = 'late'; p = SCORE.LATE_BLOCK; }
      this._resolveBlock(q, p);
    } else { this._onMiss(); }
  }

  _resolveBlock(quality, points) {
    if (quality !== 'late') { this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo; }
    else { this.combo = 0; }
    const mult = quality !== 'late' ? Math.min(4, 1 + this.combo * 0.1) : 1;
    const gained = Math.floor(points * mult);
    this.score += gained; this.hud.updateScore(this.score); this.hud.updateCombo(this.combo);
    audioSynth.playBlock(quality, this.combo);
    const rg = quality === 'perfect' ? RAGE.GAIN_PERFECT : quality === 'good' ? RAGE.GAIN_GOOD : RAGE.GAIN_LATE;
    this.rageMeter = Math.min(RAGE.MAX, this.rageMeter + rg); this.hud.updateRage(this.rageMeter);
    if (this.combo > 0 && this.combo % 5 === 0) { audioSynth.playComboMilestone(this.combo); this._comboMilestoneParticles(); }
    this._floatingScore(gained, quality); this._blockJuice(quality);
    this.currentEnemyHP--; this._updateHPBar();
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.2, scaleY: 1.2, duration: 60, yoyo: true });
    this._blockParticles(quality);
    if (this.currentEnemyHP <= 0) { this._enemyDefeated(); }
    else { this.currentAttackIndex++; this.time.delayedCall(300, () => this._spawnArrow()); }
  }

  _onMiss() {
    this.combo = 0; this.hud.updateCombo(0); this.cameras.main.setZoom(1);
    audioSynth.playMiss(); this._takeDamage();
  }

  _takeDamage() {
    this.lives--; this.damageTaken = true; this.hud.updateLives(this.lives);
    this.cameras.main.flash(150, 255, 0, 0, false, null, null, 0.5);
    this.cameras.main.shake(200, 0.006);
    this.playerSprite.setTint(0xFF0000);
    this.time.delayedCall(400, () => this.playerSprite.clearTint());
    audioSynth.playLifeLost();
    if (this.lives <= 0) { this._triggerDeath(); }
    else { this.currentAttackIndex++; this.time.delayedCall(500, () => this._spawnArrow()); }
  }

  _triggerDeath() {
    this.gameOver = true; this.arrowActive = false; this._clearArrow();
    if (this.arrowTimer) this.arrowTimer.remove();
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.cameras.main.shake(400, 0.015);
    this.cameras.main.flash(250, 255, 0, 0, false, null, null, 0.8);
    audioSynth.playDeath(); audioSynth.stopMusic();
    this.tweens.add({ targets: this.playerSprite, alpha: 0.2, scaleX: 0.7, scaleY: 0.7, duration: 400 });
    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage, maxCombo: this.maxCombo,
        perfectStage: !this.damageTaken, beltIndex: this.currentBeltIndex
      });
    });
  }

  _enemyDefeated() {
    const bonus = SCORE.ENEMY_DEFEAT + this.combo * 50;
    this.score += bonus; this._floatingScore(bonus, 'perfect');
    audioSynth.playEnemyDeath(); this._enemyDeathBurst();
    this.tweens.add({
      targets: this.enemySprite, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 300,
      onComplete: () => { this.enemySprite.setScale(1).setAlpha(1); }
    });
    this._stageClear();
  }

  _stageClear() {
    let cb = SCORE.STAGE_CLEAR + this.combo * 100;
    if (!this.damageTaken) cb += SCORE.PERFECT_STAGE;
    this.score += cb; this.hud.updateScore(this.score);
    audioSynth.playStageClear(); this._stageClearCelebration();
    audioSynth.setBPM(Math.min(150, 90 + Math.floor(this.stage / 5) * 2));
    this.stage++;
    this._checkBeltPromotion(); this._checkEnvironmentChange();
    this.time.delayedCall(800, () => this._startStage());
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) { this._showPauseOverlay(); audioSynth.duckMusic(); }
    else { this._hidePauseOverlay(); audioSynth.unduckMusic(); this._resetInactivity(); }
  }

  update(time) {
    if (!this.paused && !this.gameOver && this.rageMeter > 0) {
      const dt = (time - (this.lastRageDecayTime || time)) / 1000;
      this.lastRageDecayTime = time;
      this.rageMeter = Math.max(0, this.rageMeter - RAGE.DECAY_PER_SEC * dt);
      this.hud.updateRage(this.rageMeter);
    } else { this.lastRageDecayTime = time; }
  }
}

// Apply effects mixin
Object.assign(GameScene.prototype, GameEffects);
