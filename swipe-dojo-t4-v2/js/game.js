// Swipe Dojo - Core Gameplay Scene
'use strict';

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.cameras.main.fadeIn(200);

    // Game state
    this.score = 0;
    this.stage = 1;
    this.lives = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.damageTaken = false;
    this.gameOver = false;
    this.paused = false;
    this.swipeStart = null;
    this.currentAttackIndex = 0;
    this.currentStage = null;
    this.currentEnemyHP = 0;
    this.arrowActive = false;
    this.arrowTimer = null;
    this.pauseOverlayParts = [];

    // v2: New state
    this.counterWindowOpen = false;
    this.counterTimer = null;
    this.activeShield = false;
    this.slowTimeActive = false;
    this.doublePointsActive = false;
    this.perfectStreak = 0;
    this.doubleOrNothingActive = false;
    this.scoreMult = 1;

    // HUD
    this.hud = new HUD(this);

    // Draw player
    this.playerSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'player').setDepth(10);

    // Enemy
    this.enemySprite = this.add.image(GAME_WIDTH / 2, 200, 'enemy_basic').setDepth(10);
    this.enemyNameText = this.add.text(GAME_WIDTH / 2, 110, '', {
      fontSize: '16px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(11);

    // HP bar
    const cx = GAME_WIDTH / 2;
    this.hpBarBg = this.add.rectangle(cx, 138, 180, 10, PALETTE.hpTrack).setDepth(11);
    this.hpBarFill = this.add.rectangle(cx - 90, 138, 180, 10, PALETTE.hpFull).setOrigin(0, 0.5).setDepth(12);
    this.add.rectangle(cx, 138, 180, 10).setStrokeStyle(1.5, PALETTE.hpBorder).setDepth(13);
    this.arrowGraphics = this.add.graphics().setDepth(20);
    this.arrowGlowTween = null;
    if (!this.textures.exists('particle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFFFFF); g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle', 6, 6); g.destroy();
    }

    // Swipe input
    this.input.on('pointerdown', (ptr) => {
      if (this.gameOver || this.paused) return;
      this.swipeStart = { x: ptr.x, y: ptr.y, time: this.time.now };
      this._resetInactivity();
    });
    this.input.on('pointerup', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart) return;
      const dx = ptr.x - this.swipeStart.x;
      const dy = ptr.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SWIPE_MIN_DIST) {
        // v2: Tap (not swipe) — check counter window
        if (this.counterWindowOpen) this._executeCounter();
        return;
      }
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : 'LEFT')
        : (dy > 0 ? 'DOWN' : 'UP');
      // v2: Counter-attack on swipe during counter window
      if (this.counterWindowOpen) { this._executeCounter(); this.swipeStart = null; return; }
      this.onSwipe(dir);
      this.swipeStart = null;
    });

    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => { this.lives = 0; this._triggerDeath(); });
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"sound":true,"music":true,"vibration":true}');
    audioSynth.sfxEnabled = settings.sound;
    audioSynth.musicEnabled = settings.music;
    audioSynth.init();
    audioSynth.startMusic(90);
    this._startStage();
  }

  _resetInactivity() {
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => { this.lives = 0; this._triggerDeath(); });
  }

  _startStage() {
    this.currentStage = generateStage(this.stage);
    this.currentEnemyHP = this.currentStage.enemyHP;
    this.currentAttackIndex = 0;
    this.damageTaken = false;
    const texKey = 'enemy_' + this.currentStage.variant;
    if (this.textures.exists(texKey)) this.enemySprite.setTexture(texKey);
    this.enemyNameText.setText(this.currentStage.name);
    this._updateHPBar();
    this.hud.updateStage(this.stage);
    if (this.doubleOrNothingActive) this.hud.showDoubleIndicator();
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
    const attack = this.currentStage.sequence[this.currentAttackIndex];
    if (attack.fakeout) {
      const fakeDir = DIRECTIONS.filter(d => d !== attack.direction)[Math.floor(Math.random() * 3)];
      this._drawArrow(fakeDir);
      this.time.delayedCall(120, () => this._drawArrow(attack.direction));
    } else { this._drawArrow(attack.direction); }
    this.arrowActive = true;
    this.expectedDirection = attack.direction;
    this.arrowSpawnTime = this.time.now;
    let win = attack.windowMs;
    if (this.slowTimeActive) win *= 2;
    if (this.doubleOrNothingActive) win *= DOUBLE_SPEED_MULT;
    this.arrowWindowMs = win;
    audioSynth.playArrowSpawn(attack.direction);
    this.arrowTimer = this.time.delayedCall(this.arrowWindowMs, () => {
      if (this.arrowActive) { this.arrowActive = false; this._clearArrow(); this._onMiss(); }
    });
    this.time.delayedCall(this.arrowWindowMs * 0.8, () => { if (this.arrowActive) this._startArrowUrgency(); });
  }

  onSwipe(dir) {
    if (!this.arrowActive || this.gameOver) return;
    this._resetInactivity();
    this.arrowActive = false;
    if (this.arrowTimer) { this.arrowTimer.remove(); this.arrowTimer = null; }
    this._clearArrow();
    if (dir !== this.expectedDirection) { this._onMiss(); return; }
    const ratio = (this.time.now - this.arrowSpawnTime) / this.arrowWindowMs;
    let quality, points;
    if (ratio <= 0.4) { quality = 'perfect'; points = SCORE.PERFECT_BLOCK; }
    else if (ratio <= 0.8) { quality = 'good'; points = SCORE.GOOD_BLOCK; }
    else { quality = 'late'; points = SCORE.LATE_BLOCK; }
    this._resolveBlock(quality, points);
  }

  _resolveBlock(quality, points) {
    if (quality !== 'late') { this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo; }
    else { this.combo = 0; }
    const multiplier = quality !== 'late' ? Math.min(4, 1 + this.combo * 0.1) : 1;
    const baseMult = this.scoreMult * (this.doublePointsActive ? 2 : 1);
    const gained = Math.floor(points * multiplier * baseMult);
    this.score += gained;
    this.hud.updateScore(this.score);
    this.hud.updateCombo(this.combo);
    audioSynth.playBlock(quality, this.combo);
    if (this.combo > 0 && this.combo % 5 === 0) { audioSynth.playComboMilestone(this.combo); this._comboMilestoneParticles(); }
    this._floatingScore(gained, quality);
    this._blockJuice(quality);
    this.currentEnemyHP--;
    this._updateHPBar();
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.2, scaleY: 1.2, duration: 60, yoyo: true });
    this._blockParticles(quality);
    // v2: Perfect streak tracking
    if (quality === 'perfect') {
      this.perfectStreak++;
      this.hud.updatePerfectStreak(this.perfectStreak);
      if (this.perfectStreak >= PERFECT_STREAK_HEAL && this.perfectStreak % PERFECT_STREAK_HEAL === 0 && this.lives < MAX_LIVES) {
        this.lives++;
        this.hud.updateLives(this.lives);
        this._healEffect();
      }
      // v2: Open counter window after perfect block
      this._openCounterWindow();
    } else {
      this.perfectStreak = 0;
      this.hud.updatePerfectStreak(0);
    }
    if (this.currentEnemyHP <= 0) { this._enemyDefeated(); }
    else { this.currentAttackIndex++; this.time.delayedCall(300, () => this._spawnArrow()); }
  }

  _onMiss() {
    this.combo = 0;
    this.perfectStreak = 0;
    this.hud.updateCombo(0);
    this.hud.updatePerfectStreak(0);
    this.cameras.main.setZoom(1);
    audioSynth.playMiss();
    this._takeDamage();
  }

  _takeDamage() {
    // v2: Shield absorbs damage
    if (this.activeShield) {
      this.activeShield = false;
      this.hud.hideShieldIcon();
      this._shieldBreakEffect();
      this.cameras.main.flash(100, 0, 255, 255, false, null, null, 0.4);
      this.currentAttackIndex++;
      this.time.delayedCall(500, () => this._spawnArrow());
      return;
    }
    this.lives--;
    this.damageTaken = true;
    this.hud.updateLives(this.lives);
    this.cameras.main.flash(150, 255, 0, 0, false, null, null, 0.5);
    this.cameras.main.shake(200, 0.006);
    this.playerSprite.setTint(0xFF0000);
    this.time.delayedCall(400, () => this.playerSprite.clearTint());
    audioSynth.playLifeLost();

    if (this.lives <= 0) {
      this._triggerDeath();
    } else {
      this.currentAttackIndex++;
      this.time.delayedCall(500, () => this._spawnArrow());
    }
  }

  _triggerDeath() {
    this.gameOver = true;
    this.arrowActive = false;
    this._clearArrow();
    if (this.arrowTimer) this.arrowTimer.remove();
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.cameras.main.shake(400, 0.015);
    this.cameras.main.flash(250, 255, 0, 0, false, null, null, 0.8);
    audioSynth.playDeath(); audioSynth.stopMusic();
    this.tweens.add({ targets: this.playerSprite, alpha: 0.2, scaleX: 0.7, scaleY: 0.7, duration: 400 });
    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.stage, maxCombo: this.maxCombo, perfectStage: !this.damageTaken });
    });
  }

  _enemyDefeated() {
    const bm = this.scoreMult * (this.doublePointsActive ? 2 : 1);
    const bonus = Math.floor((SCORE.ENEMY_DEFEAT + this.combo * 50) * bm);
    this.score += bonus;
    this._floatingScore(bonus, 'perfect');
    audioSynth.playEnemyDeath(); this._enemyDeathBurst();
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 300, onComplete: () => { this.enemySprite.setScale(1).setAlpha(1); } });
    if (Math.random() < POWERUP_DROP_CHANCE) this._spawnPowerup();
    this._stageClear();
  }

  _stageClear() {
    const bm = this.scoreMult * (this.doublePointsActive ? 2 : 1);
    let cb = Math.floor((SCORE.STAGE_CLEAR + this.combo * 100) * bm);
    if (!this.damageTaken) cb += Math.floor(SCORE.PERFECT_STAGE * bm);
    this.score += cb;
    this.hud.updateScore(this.score);
    audioSynth.playStageClear(); this._stageClearCelebration();
    audioSynth.setBPM(Math.min(150, 90 + Math.floor(this.stage / 5) * 2));
    this.doubleOrNothingActive = false; this.scoreMult = 1; this.stage++;
    this.hud.showStageChoice(this, (choice) => {
      if (choice === 'double') { this.doubleOrNothingActive = true; this.scoreMult = DOUBLE_SCORE_MULT; }
      this._startStage();
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this._showPauseOverlay();
      audioSynth.duckMusic();
    } else {
      this._hidePauseOverlay();
      audioSynth.unduckMusic();
      this._resetInactivity();
    }
  }

  update() {}
}

// Apply effects mixin
Object.assign(GameScene.prototype, GameEffects);
