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
    this.tankSwipesLeft = 0;
    this.inRage = false;
    this.rageArrowsLeft = 0;
    this.rageArrowsBlocked = 0;
    this.trailPoints = [];
    this.trailGraphics = null;
    this.trailFadeTimer = null;

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
    this.hpBarBg = this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10, PALETTE.hpTrack).setDepth(11);
    this.hpBarFill = this.add.rectangle(GAME_WIDTH / 2 - 90, 138, 180, 10, PALETTE.hpFull).setOrigin(0, 0.5).setDepth(12);
    this.add.rectangle(GAME_WIDTH / 2, 138, 180, 10).setStrokeStyle(1.5, PALETTE.hpBorder).setDepth(13);

    // Arrow graphics
    this.arrowGraphics = this.add.graphics().setDepth(20);
    this.arrowGlowTween = null;

    // Swipe trail graphics
    this.trailGraphics = this.add.graphics().setDepth(15);

    // Rage border graphics
    this.rageBorderGfx = this.add.graphics().setDepth(90).setAlpha(0);

    // Particle texture
    if (!this.textures.exists('particle')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xFFFFFF);
      g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle', 6, 6);
      g.destroy();
    }

    // Swipe input with trail tracking
    this.input.on('pointerdown', (ptr) => {
      if (this.gameOver || this.paused) return;
      this.swipeStart = { x: ptr.x, y: ptr.y, time: this.time.now };
      this.trailPoints = [{ x: ptr.x, y: ptr.y }];
      this._resetInactivity();
    });
    this.input.on('pointermove', (ptr) => {
      if (!this.swipeStart || this.gameOver || this.paused) return;
      this.trailPoints.push({ x: ptr.x, y: ptr.y });
    });
    this.input.on('pointerup', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart) return;
      const dx = ptr.x - this.swipeStart.x;
      const dy = ptr.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SWIPE_MIN_DIST) { this.trailPoints = []; return; }
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : 'LEFT')
        : (dy > 0 ? 'DOWN' : 'UP');
      this._drawSwipeTrail(dir);
      this.onSwipe(dir);
      this.swipeStart = null;
    });

    // Inactivity timer
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => this._inactivityDeath());

    // Settings
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"sound":true,"music":true,"vibration":true}');
    audioSynth.sfxEnabled = settings.sound;
    audioSynth.musicEnabled = settings.music;

    // Start music and first stage
    audioSynth.init();
    audioSynth.startMusic(90);
    this._startStage();
  }

  _resetInactivity() {
    if (this.inactivityTimer) this.inactivityTimer.remove();
    this.inactivityTimer = this.time.delayedCall(INACTIVITY_DEATH_MS, () => this._inactivityDeath());
  }

  _inactivityDeath() {
    this.lives = 0;
    this._triggerDeath();
  }

  _startStage() {
    this.currentStage = generateStage(this.stage);
    this.currentEnemyHP = this.currentStage.enemyHP;
    this.currentAttackIndex = 0;
    this.damageTaken = false;
    this.inRage = false;
    this.rageArrowsLeft = 0;
    this.rageArrowsBlocked = 0;
    this.tankSwipesLeft = 0;

    const texKey = 'enemy_' + this.currentStage.variant;
    if (this.textures.exists(texKey)) this.enemySprite.setTexture(texKey);
    this.enemyNameText.setText(this.currentStage.name);
    this._updateHPBar();
    this.hud.updateStage(this.stage);
    this._hideRageBorder();

    // Show variant hint text
    if (this.currentStage.variant !== 'basic') {
      this.hud.showVariantHint(this.currentStage.variant);
    }

    if (this.stage > 1) {
      this.cameras.main.flash(150, 255, 255, 255, false, null, null, 0.15);
    }
    this.time.delayedCall(400, () => this._spawnArrow());
  }

  _updateHPBar() {
    const ratio = this.currentEnemyHP / this.currentStage.enemyHP;
    this.hpBarFill.width = 180 * Math.max(0, ratio);
    this.hpBarFill.fillColor = ratio > 0.3 ? PALETTE.hpFull : PALETTE.hpLow;
  }

  _spawnArrow() {
    if (this.gameOver || this.paused) return;

    // Check if rage barrage should trigger
    if (this.currentStage.isRage && !this.inRage && this.currentEnemyHP <= Math.ceil(this.currentStage.enemyHP / 2)) {
      this._startRageBarrage();
      return;
    }

    if (this.currentAttackIndex >= this.currentStage.sequence.length) {
      this.currentAttackIndex = 0;
      this.currentStage.sequence = buildSequence(
        getSequenceLength(this.stage), getAttackWindow(this.stage), getFakeoutChance(this.stage)
      );
    }

    const attack = this.currentStage.sequence[this.currentAttackIndex];
    const behavior = this.currentStage.behavior;

    // Fast variant: flash telegraph early
    if (behavior.telegraphEarlyMs > 0) {
      this._flashTelegraph(attack.direction, behavior.telegraphEarlyMs);
    }

    // Tricky variant: show fake direction first, switch after delay
    if (behavior.trickyDelayMs > 0) {
      const fakeDir = DIRECTIONS.filter(d => d !== attack.direction)[Math.floor(Math.random() * 3)];
      this._drawArrow(fakeDir);
      this.time.delayedCall(behavior.trickyDelayMs, () => {
        if (!this.arrowActive) return;
        this._drawArrow(attack.direction);
        this.expectedDirection = attack.direction;
        audioSynth.playArrowSpawn(attack.direction);
      });
      this.arrowActive = true;
      this.expectedDirection = fakeDir; // starts as fake, switches after delay
    } else if (attack.fakeout) {
      const fakeDir = DIRECTIONS.filter(d => d !== attack.direction)[Math.floor(Math.random() * 3)];
      this._drawArrow(fakeDir);
      this.time.delayedCall(120, () => this._drawArrow(attack.direction));
      this.arrowActive = true;
      this.expectedDirection = attack.direction;
    } else {
      this._drawArrow(attack.direction);
      this.arrowActive = true;
      this.expectedDirection = attack.direction;
    }

    // Tank variant: require multiple swipes
    this.tankSwipesLeft = behavior.swipesRequired;

    this.arrowSpawnTime = this.time.now;
    this.arrowWindowMs = attack.windowMs;
    audioSynth.playArrowSpawn(attack.direction);

    this.arrowTimer = this.time.delayedCall(attack.windowMs, () => {
      if (this.arrowActive) {
        this.arrowActive = false;
        this._clearArrow();
        this._onMiss();
      }
    });

    this.time.delayedCall(attack.windowMs * 0.8, () => {
      if (this.arrowActive) this._startArrowUrgency();
    });
  }

  onSwipe(dir) {
    if (!this.arrowActive || this.gameOver) return;
    this._resetInactivity();

    if (dir === this.expectedDirection) {
      // Tank: require multiple swipes
      if (this.tankSwipesLeft > 1) {
        this.tankSwipesLeft--;
        this._tankSwipeJuice();
        return; // arrow stays active, wait for next swipe
      }
      this.arrowActive = false;
      if (this.arrowTimer) { this.arrowTimer.remove(); this.arrowTimer = null; }
      this._clearArrow();

      const elapsed = this.time.now - this.arrowSpawnTime;
      const ratio = elapsed / this.arrowWindowMs;
      let quality, points;
      if (ratio <= 0.4) { quality = 'perfect'; points = SCORE.PERFECT_BLOCK; }
      else if (ratio <= 0.8) { quality = 'good'; points = SCORE.GOOD_BLOCK; }
      else { quality = 'late'; points = SCORE.LATE_BLOCK; }

      if (this.inRage) {
        this.rageArrowsBlocked++;
        this._resolveBlock(quality, points);
        this.time.delayedCall(RAGE.ARROW_GAP_MS, () => this._spawnRageArrow());
      } else {
        this._resolveBlock(quality, points);
      }
    } else {
      this.arrowActive = false;
      if (this.arrowTimer) { this.arrowTimer.remove(); this.arrowTimer = null; }
      this._clearArrow();
      if (this.inRage) {
        this._onMiss();
        this.time.delayedCall(RAGE.ARROW_GAP_MS, () => this._spawnRageArrow());
      } else {
        this._onMiss();
      }
    }
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
