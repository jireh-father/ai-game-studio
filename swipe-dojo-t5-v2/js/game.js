'use strict';
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.cameras.main.fadeIn(200);
    this.score = 0; this.stage = 1; this.lives = 3; this.combo = 0; this.maxCombo = 0;
    this.damageTaken = false; this.gameOver = false; this.paused = false; this.swipeStart = null;
    this.currentAttackIndex = 0; this.currentStage = null; this.currentEnemyHP = 0;
    this.arrowActive = false; this.arrowTimer = null; this.pauseOverlayParts = [];
    this.burstRemaining = 0; this.burstTotal = 0; this.inBurst = false;
    this.hud = new HUD(this);
    this.playerSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 140, 'player').setDepth(10);
    this.enemySprite = this.add.image(GAME_WIDTH / 2, 200, 'enemy_basic').setDepth(10);
    this.enemyNameText = this.add.text(GAME_WIDTH / 2, 110, '', {
      fontSize: '16px', fontFamily: 'Arial Black', color: PALETTE.uiText
    }).setOrigin(0.5).setDepth(11);
    this.hpBarBg = this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10, PALETTE.hpTrack).setDepth(11);
    this.hpBarFill = this.add.rectangle(GAME_WIDTH / 2 - 90, 138, 180, 10, PALETTE.hpFull).setOrigin(0, 0.5).setDepth(12);
    this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10).setStrokeStyle(1.5, PALETTE.hpBorder).setDepth(13);
    this.arrowGraphics = this.add.graphics().setDepth(20);
    this.arrowGlowTween = null;
    this._initTrail();
    if (!this.textures.exists('particle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFFFFF); g.fillRect(0, 0, 6, 6); g.generateTexture('particle', 6, 6); g.destroy();
    }
    this.input.on('pointerdown', (ptr) => {
      if (this.gameOver || this.paused) return;
      this.swipeStart = { x: ptr.x, y: ptr.y, time: this.time.now };
      this.trailPoints = []; this._addTrailPoint(ptr.x, ptr.y); this._resetInactivity();
    });
    this.input.on('pointermove', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart || !ptr.isDown) return;
      this._addTrailPoint(ptr.x, ptr.y);
    });
    this.input.on('pointerup', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart) return;
      const dx = ptr.x - this.swipeStart.x, dy = ptr.y - this.swipeStart.y;
      if (Math.sqrt(dx * dx + dy * dy) < SWIPE_MIN_DIST) { this._fadeTrail(false); return; }
      this.onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
      this.swipeStart = null;
    });
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => this._inactivityDeath());
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"sound":true,"music":true,"vibration":true}');
    audioSynth.sfxEnabled = settings.sound; audioSynth.musicEnabled = settings.music;
    audioSynth.init(); audioSynth.startMusic(90); this._startStage();
  }
  _resetInactivity() {
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => this._inactivityDeath());
  }
  _inactivityDeath() { this.lives = 0; this._triggerDeath(); }
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
    const ratio = this.currentEnemyHP / this.currentStage.enemyHP;
    this.hpBarFill.width = 180 * Math.max(0, ratio);
    this.hpBarFill.fillColor = ratio > 0.3 ? PALETTE.hpFull : PALETTE.hpLow;
  }
  _spawnArrow() {
    if (this.gameOver || this.paused) return;
    if (this.currentAttackIndex >= this.currentStage.sequence.length) {
      this.currentAttackIndex = 0;
      this.currentStage.sequence = buildSequence(
        getSequenceLength(this.stage), getAttackWindow(this.stage), getFakeoutChance(this.stage), this.stage);
    }
    const attack = this.currentStage.sequence[this.currentAttackIndex];
    if (!this.inBurst && attack.burstCount > 0) {
      this.inBurst = true; this.burstRemaining = attack.burstCount;
      this.burstTotal = attack.burstCount; this._showBurstText(attack.burstCount);
    }
    this.expectedDirection = attack.direction;
    audioSynth.playArrowSpawn(attack.direction);
    const activateArrow = () => {
      this.arrowActive = true; this.arrowSpawnTime = this.time.now; this.arrowWindowMs = attack.windowMs;
      this.arrowTimer = this.time.delayedCall(attack.windowMs, () => {
        if (this.arrowActive) { this.arrowActive = false; this._clearArrow(); this._onMiss(); }
      });
      this.time.delayedCall(attack.windowMs * 0.8, () => { if (this.arrowActive) this._startArrowUrgency(); });
    };
    if (attack.fakeout) {
      const fakeDir = DIRECTIONS.filter(d => d !== attack.direction)[Math.floor(Math.random() * 3)];
      this._drawArrowWithApproach(fakeDir, () => this._drawArrowWithApproach(attack.direction, activateArrow));
    } else { this._drawArrowWithApproach(attack.direction, activateArrow); }
  }

  onSwipe(dir) {
    if (!this.arrowActive || this.gameOver) return;
    this._resetInactivity(); this.arrowActive = false;
    if (this.arrowTimer) { this.arrowTimer.remove(); this.arrowTimer = null; }
    this._clearArrow(); this._fadeTrail(dir === this.expectedDirection);
    if (dir === this.expectedDirection) {
      const ratio = (this.time.now - this.arrowSpawnTime) / this.arrowWindowMs;
      let quality, points;
      if (ratio <= 0.4) { quality = 'perfect'; points = SCORE.PERFECT_BLOCK; }
      else if (ratio <= 0.8) { quality = 'good'; points = SCORE.GOOD_BLOCK; }
      else { quality = 'late'; points = SCORE.LATE_BLOCK; }
      if (this.inBurst) points += BURST.BONUS_PER_ARROW;
      this._resolveBlock(quality, points);
    } else {
      if (this.inBurst) { this.inBurst = false; this.burstRemaining = 0; }
      this._onMiss();
    }
  }
  _resolveBlock(quality, points) {
    if (quality !== 'late') { this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo; }
    else { this.combo = 0; }
    const gained = Math.floor(points * (quality !== 'late' ? Math.min(4, 1 + this.combo * 0.1) : 1));
    this.score += gained; this.hud.updateScore(this.score); this.hud.updateCombo(this.combo);
    audioSynth.playBlock(quality, this.combo);
    if (this.combo > 0 && this.combo % 5 === 0) { audioSynth.playComboMilestone(this.combo); this._comboMilestoneParticles(); }
    this._floatingScore(gained, quality); this._blockJuice(quality);
    this.currentEnemyHP--; this._updateHPBar();
    this.tweens.add({ targets: this.enemySprite, scaleX: 1.2, scaleY: 1.2, duration: 60, yoyo: true });
    this._blockParticles(quality); audioSynth.updateMusicLayers(this.combo);
    if (this.currentEnemyHP <= 0) { this._enemyDefeated(); }
    else if (this.inBurst && this.burstRemaining > 1) {
      this.burstRemaining--; this.currentAttackIndex++;
      this.time.delayedCall(BURST.GAP_MS, () => this._spawnArrow());
    } else {
      if (this.inBurst) { this.inBurst = false; this.burstRemaining = 0; }
      this.currentAttackIndex++; this.time.delayedCall(300, () => this._spawnArrow());
    }
  }
  _onMiss() {
    this.combo = 0; this.hud.updateCombo(0); this.cameras.main.setZoom(1);
    audioSynth.playMiss(); audioSynth.updateMusicLayers(0); this._fadeTrail(false); this._takeDamage();
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
    audioSynth.playDeath(); audioSynth.updateMusicLayers(0); audioSynth.stopMusic();
    this.tweens.add({ targets: this.playerSprite, alpha: 0.2, scaleX: 0.7, scaleY: 0.7, duration: 400 });
    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage, maxCombo: this.maxCombo, perfectStage: !this.damageTaken
      });
    });
  }
  _enemyDefeated() {
    const defeatBonus = SCORE.ENEMY_DEFEAT + this.combo * 50;
    this.score += defeatBonus; this._floatingScore(defeatBonus, 'perfect');
    audioSynth.playEnemyDeath(); this._enemyDeathBurst();
    this.tweens.add({
      targets: this.enemySprite, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 300,
      onComplete: () => { this.enemySprite.setScale(1).setAlpha(1); }
    });
    this._stageClear();
  }
  _stageClear() {
    let clearBonus = SCORE.STAGE_CLEAR + this.combo * 100;
    if (!this.damageTaken) clearBonus += SCORE.PERFECT_STAGE;
    this.score += clearBonus; this.hud.updateScore(this.score);
    audioSynth.bassDrop();
    this.time.delayedCall(BASS_DROP.SILENCE_MS, () => audioSynth.playStageClear());
    this._stageClearCelebration();
    audioSynth.setBPM(Math.min(150, 90 + Math.floor(this.stage / 5) * 2));
    this.stage++; this.time.delayedCall(800, () => this._startStage());
  }
  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) { this._showPauseOverlay(); audioSynth.duckMusic(); }
    else { this._hidePauseOverlay(); audioSynth.unduckMusic(); this._resetInactivity(); }
  }
  update() {}
}
Object.assign(GameScene.prototype, GameEffects);
