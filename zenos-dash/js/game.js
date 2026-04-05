// Zeno's Dash - Core Game Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.isDead = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.tapCount = 0;
    this.stageStartTime = Date.now();
    this.lastInputTime = Date.now();
    this._alertActive = false;
    this.pursuerPaused = false;

    const w = GAME_WIDTH;

    // Background
    this.bgRect = this.add.rectangle(w / 2, GAME_HEIGHT / 2, w, GAME_HEIGHT,
      Phaser.Display.Color.HexStringToColor(getBgColor(GameState.stage)).color);

    // Track
    this.add.rectangle(w / 2, TRACK_Y, w - 40, TRACK_HEIGHT,
      Phaser.Display.Color.HexStringToColor(COLORS.track).color);

    // Load stage params
    this.stageParams = loadStageParams(GameState.stage);

    // Finish line
    this.finishLineX = FINISH_LINE_X;
    this.add.image(this.finishLineX, TRACK_Y, 'finish').setDepth(2);

    // Close-enough zone
    this.closeZoneWidth = this.stageParams.closeEnough;
    this.closeZone = this.add.rectangle(
      this.finishLineX - this.closeZoneWidth / 2, TRACK_Y,
      this.closeZoneWidth, 60, 0xFFD700, 0.3
    ).setDepth(1);

    this.add.text(this.finishLineX - this.closeZoneWidth / 2, TRACK_Y - 45, 'GOAL', {
      fontSize: '12px', fontFamily: 'monospace', color: COLORS.closeZone
    }).setOrigin(0.5).setDepth(3);

    // Player
    this.playerX = this.finishLineX - this.stageParams.startGap;
    this.player = this.add.image(this.playerX, TRACK_Y - 16, 'player').setDepth(5);

    // Pursuer
    this.pursuerX = this.playerX - PURSUER_START_OFFSET;
    this.pursuer = this.add.image(this.pursuerX, TRACK_Y - 18, 'pursuer').setDepth(5);

    this._pursuerPulseDur = 600;
    this._startPursuerPulse();

    // HUD (from mixin) - BEFORE anything that reads HUD text
    this.createHUD();

    // Tap hint
    this.tapHint = this.add.text(w / 2, TRACK_Y + 80, 'TAP ANYWHERE', {
      fontSize: '18px', fontFamily: 'monospace', color: COLORS.hud, alpha: 0.4
    }).setOrigin(0.5).setDepth(10);

    this.input.on('pointerdown', this.onTap, this);

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.isDead) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    // Milestone flash
    if (this.stageParams.milestone) {
      this.cameras.main.flash(500, 26, 10, 46);
      this.showFloatingText(w / 2, TRACK_Y - 80,
        'STAGE ' + GameState.stage + '!', COLORS.closeZone, '24px', 50, 600);
    }
  }

  onTap() {
    if (this.isDead || this.paused || this.stageTransitioning) return;
    this.lastInputTime = Date.now();

    if (this.tapHint && this.tapHint.alpha > 0) {
      this.tweens.add({ targets: this.tapHint, alpha: 0, duration: 300 });
    }

    const gap = this.finishLineX - this.playerX;
    if (gap <= 0) return;

    const isPhantom = Math.random() < this.stageParams.phantomChance;
    const moveDist = isPhantom ? gap * 0.75 : gap * 0.5;
    this.playerX += moveDist;
    this.tapCount++;

    this.tweens.add({
      targets: this.player, x: this.playerX, duration: 80, ease: 'Quad.easeOut'
    });
    this.scalePunch(this.player, isPhantom ? 1.5 : 1.3, isPhantom ? 160 : 120);
    this.tapEffect(this.playerX, TRACK_Y - 16, isPhantom);

    const label = isPhantom
      ? 'PHANTOM! -' + Math.round(moveDist) + 'px'
      : '-' + Math.round(moveDist) + 'px';
    this.showFloatingText(this.playerX, TRACK_Y - 60, label,
      isPhantom ? COLORS.particleGold : COLORS.gapText,
      isPhantom ? '13px' : '11px',
      isPhantom ? 40 : 30, isPhantom ? 500 : 400);

    if (isPhantom) {
      this.pursuerPaused = true;
      setTimeout(() => { this.pursuerPaused = false; }, 40);
    }

    if (this.playerX >= this.finishLineX - this.stageParams.closeEnough) {
      this.stageClear();
    }
  }

  stageClear() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;

    const pursuerToPlayer = this.playerX - this.pursuerX;
    const timeMargin = pursuerToPlayer / this.stageParams.pursuerSpeed;
    const stageScore = calculateStageScore(
      GameState.stage, this.tapCount, this.stageParams.parTaps, Math.max(0, timeMargin)
    );

    const isPerfect = this.tapCount <= this.stageParams.parTaps;
    GameState.consecutivePerfect = isPerfect ? (GameState.consecutivePerfect || 0) + 1 : 0;

    let finalScore = stageScore;
    if (GameState.consecutivePerfect >= SCORE.comboRequirement) {
      finalScore = Math.floor(stageScore * SCORE.comboMultiplier);
      this.showFloatingText(GAME_WIDTH / 2, TRACK_Y - 100,
        'COMBO x1.5!', COLORS.closeZone, '22px', 50, 700);
    }
    GameState.score += finalScore;

    this.stageClearEffect(this.playerX, TRACK_Y - 16);
    this.showFloatingText(GAME_WIDTH / 2, 150, '+' + finalScore, COLORS.closeZone, '24px', 50, 400);
    this.scalePunch(this.stageText, 1.5, 200);
    this.scalePunch(this.scoreText, 1.3, 150);

    GameState.stage++;
    this.time.delayedCall(600, () => {
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }

  update(time, delta) {
    if (this.isDead || this.paused || this.stageTransitioning) return;

    if (Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.die();
      return;
    }

    if (!this.pursuerPaused) {
      this.pursuerX += this.stageParams.pursuerSpeed * (delta / 1000);
      this.pursuer.x = this.pursuerX;
    }

    if (this.pursuerX >= this.playerX) { this.die(); return; }

    const gap = Math.max(0, Math.round(this.finishLineX - this.playerX));
    this.gapText.setText(gap + 'px');
    this.gapText.x = this.player.x;
    this.scoreText.setText('SCORE: ' + GameState.score);

    const pd = Math.max(0, Math.round(this.playerX - this.pursuerX));
    this.pursuerDistText.setText('PURSUER: ' + pd + 'px away');
    this.proximityCheck(pd);

    this.closeZone.setFillStyle(pd < 100
      ? Phaser.Display.Color.HexStringToColor(COLORS.closeZoneAlert).color : 0xFFD700,
      pd < 100 ? 0.5 : 0.3);

    if (pd < 100 && this._pursuerPulseDur !== 150) {
      this._pursuerPulseDur = 150; this._startPursuerPulse();
    } else if (pd >= 100 && pd < 200 && this._pursuerPulseDur !== 300) {
      this._pursuerPulseDur = 300; this._startPursuerPulse();
    }

    if (pd < 50) this.cameras.main.flash(50, 255, 0, 0, true);
  }

  _startPursuerPulse() {
    if (this._pursuerTween) this._pursuerTween.stop();
    this._pursuerTween = this.tweens.add({
      targets: this.pursuer, scaleX: 1.1, scaleY: 1.1,
      duration: this._pursuerPulseDur / 2, yoyo: true, repeat: -1
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deathEffect();
    this.scalePunch(this.pursuer, 1.8, 300);
    this.tweens.add({
      targets: this.player, scaleX: 0, scaleY: 0, angle: 180,
      duration: 300, ease: 'Quad.easeIn'
    });
    this.time.delayedCall(1100, () => {
      this.cleanupEffects();
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage });
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    this.cleanupEffects();
  }
}

// Apply mixins
Object.assign(GameScene.prototype, EffectsMixin);
Object.assign(GameScene.prototype, HUDMixin);
