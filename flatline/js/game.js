// Flatline - Core GameScene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.gameWidth = w;
    this.gameHeight = h;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

    // Grid
    const grid = this.add.graphics().setDepth(0);
    grid.lineStyle(0.5, COLORS.gridLine, 0.3);
    for (let y = ECG_AREA_TOP; y < ECG_AREA_BOTTOM; y += 30) grid.lineBetween(0, y, w, y);
    for (let x = 0; x < w; x += 72) grid.lineBetween(x, ECG_AREA_TOP, x, ECG_AREA_BOTTOM);

    // Graphics layers
    this.ecgGraphics = this.add.graphics().setDepth(1);
    this.windowGraphics = this.add.graphics().setDepth(2);
    this.effectGraphics = this.add.graphics().setDepth(3);

    // State
    this.gameTime = 0;
    this.scrollOffset = 0;
    this.currentBeatIndex = 0;
    this.stageTransitioning = false;
    this.gameOver = false;
    this.flatlineTriggered = false;
    this.introActive = true;
    this.ecgColor = COLORS.ecgNormal;
    this.particleMgr = new ParticleManager();

    // Audio
    AudioSystem.init();

    // Load first stage
    this.loadStage(GameState.stage);

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.stageTransitioning) return;
      if (pointer.y < HUD_HEIGHT || pointer.y > GAME_HEIGHT - STRIKE_BAR_HEIGHT) return;
      this.onTap(pointer);
    });

    // Visibility handler
    this.visHandler = () => { if (document.hidden) this.scene.pause('GameScene'); };
    document.addEventListener('visibilitychange', this.visHandler);

    // Intro prompt
    this.introText = this.add.text(w / 2, ECG_Y - 60, 'TAP THE BEAT!', {
      fontSize: '20px', fontFamily: 'monospace', color: '#00FF7F', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5).setAlpha(0);
    this.tweens.add({ targets: this.introText, alpha: 1, duration: 500, delay: 300, yoyo: true, hold: 800 });
  }

  loadStage(stageNum) {
    const config = generateStage(stageNum);
    this.stageConfig = config;
    this.stageData = generateBeatSequence(config);
    this.currentBeatIndex = 0;
    this.gameTime = 0;
    this.scrollSpeed = getScrollSpeed(config.bpm);
    this.scrollOffset = 0;
    this.introActive = stageNum === 1;

    const msPerPx = 1000 / this.scrollSpeed;
    this.beatEvents = this.stageData.beats.map(b => ({ ...b, peakX: b.timeMs / msPerPx }));

    this.time.delayedCall(100, () => {
      const hud = this.scene.get('HUDScene');
      if (hud && hud.updateBPM) hud.updateBPM(config.bpm);
    });
  }

  onTap(pointer) {
    if (this.introActive || this.flatlineTriggered) return;
    const beat = this.stageData.beats[this.currentBeatIndex];
    if (!beat || beat.resolved) return;

    const inWindow = this.gameTime >= beat.windowStartMs && this.gameTime <= beat.windowEndMs;
    if (!inWindow) return;

    if (beat.type === 'false') {
      this.onFalseBeatTap(pointer);
      beat.resolved = true;
      this.currentBeatIndex++;
      return;
    }

    const center = (beat.windowStartMs + beat.windowEndMs) / 2;
    const halfW = (beat.windowEndMs - beat.windowStartMs) / 2;
    const deviation = Math.abs(this.gameTime - center);
    const quality = deviation < halfW * 0.4 ? 'perfect' : deviation < halfW * 0.8 ? 'good' : 'earlyLate';
    this.onHit(quality, pointer);
    beat.resolved = true;
    this.currentBeatIndex++;
  }

  onHit(quality, pointer) {
    const mult = getStreakMultiplier(GameState.streak);
    const earned = Math.round(SCORE[quality] * mult);
    GameState.score += earned;
    GameState.streak = (quality === 'perfect' || quality === 'good') ? GameState.streak + 1 : 0;

    AudioSystem.play(quality);
    this.particleMgr.spawn(pointer.x, pointer.y, quality === 'perfect' ? 24 : 12,
      quality === 'perfect' ? COLORS.perfectGold : COLORS.ecgNormal);
    this.cameras.main.shake(100, quality === 'perfect' ? 0.004 : 0.002);
    this.tweens.add({ targets: this.ecgGraphics, scaleY: 1.05, duration: 40, yoyo: true });

    if (quality === 'perfect') {
      this.flashOverlay(COLORS.perfectGold, 0.12, 120);
      this.cameras.main.zoomTo(1.03, 90, 'Sine.Out');
      this.time.delayedCall(90, () => this.cameras.main.zoomTo(1, 90));
    }

    const label = quality === 'perfect' ? 'PERFECT!' : quality === 'good' ? 'GOOD' : 'LATE';
    const color = quality === 'perfect' ? '#FFD700' : quality === 'good' ? '#00FF7F' : '#80FFBB';
    this.showFloatingText(pointer.x, pointer.y - 20, label, color, quality === 'perfect' ? 20 : 16);
    this.showFloatingText(pointer.x, pointer.y + 10, '+' + earned, color, quality === 'perfect' ? 18 : 14);

    const hud = this.scene.get('HUDScene');
    if (hud) {
      hud.updateHUD();
      hud.punchScore();
      if (GameState.streak >= 5 && GameState.streak % 5 === 0) {
        hud.showStreak(GameState.streak);
        GameState.score += SCORE.streakBonus;
      }
    }
  }

  onMiss() {
    GameState.strikes++;
    GameState.streak = 0;
    AudioSystem.play('miss');
    this.cameras.main.shake(220, 0.006);
    this.flashOverlay(COLORS.strikeRed, 0.25, 180);
    this.ecgColor = COLORS.ecgCritical;
    this.time.delayedCall(200, () => { if (!this.flatlineTriggered) this.ecgColor = COLORS.ecgNormal; });
    this.particleMgr.spawn(this.gameWidth / 2, ECG_Y, 8, COLORS.strikeRed);
    this.showFloatingText(this.gameWidth / 2, ECG_Y - 40, 'MISS', '#FF2222', 22);

    const hud = this.scene.get('HUDScene');
    if (hud) { hud.updateHUD(); hud.hideStreak(); hud.animateHeartBreak(MAX_LIVES - GameState.strikes); }
    if (GameState.strikes >= MAX_LIVES) this.triggerFlatline();
  }

  onFalseBeatTap(pointer) {
    GameState.strikes++;
    GameState.streak = 0;
    AudioSystem.play('falseBeat');
    this.cameras.main.shake(220, 0.006);
    this.flashOverlay(COLORS.strikeRed, 0.25, 180);
    this.ecgColor = COLORS.ecgCritical;
    this.time.delayedCall(200, () => { if (!this.flatlineTriggered) this.ecgColor = COLORS.ecgNormal; });
    this.particleMgr.spawn(pointer.x, pointer.y, 8, COLORS.strikeRed);
    this.showFloatingText(pointer.x, pointer.y - 20, 'FALSE!', '#FF2222', 22);

    const hud = this.scene.get('HUDScene');
    if (hud) { hud.updateHUD(); hud.hideStreak(); hud.animateHeartBreak(MAX_LIVES - GameState.strikes); }
    if (GameState.strikes >= MAX_LIVES) this.triggerFlatline();
  }

  triggerFlatline() {
    if (this.flatlineTriggered) return;
    this.flatlineTriggered = true;
    this.gameOver = true;
    this.ecgColor = COLORS.flatlineRed;
    AudioSystem.play('flatline');
    this.cameras.main.shake(300, 0.01);

    const flatGfx = this.add.graphics().setDepth(4);
    this.tweens.addCounter({
      from: 0, to: this.gameWidth, duration: FLATLINE_ANIM_MS, ease: 'Linear',
      onUpdate: (tween) => {
        flatGfx.clear();
        flatGfx.lineStyle(3, COLORS.flatlineRed, 0.9);
        flatGfx.lineBetween(0, ECG_Y, tween.getValue(), ECG_Y);
      }
    });

    this.time.delayedCall(DEATH_TO_GAMEOVER_MS, () => {
      if (GameState.score > GameState.highScore) {
        GameState.highScore = GameState.score;
        localStorage.setItem('flatline_high_score', GameState.highScore);
      }
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    });
  }

  advanceStage() {
    if (this.stageTransitioning || this.gameOver) return;
    this.stageTransitioning = true;
    GameState.stage++;
    GameState.score += SCORE.stageBonus * (GameState.stage - 1);
    AudioSystem.play('stageAdvance');
    this.showFloatingText(this.gameWidth / 2, ECG_Y - 80, 'STAGE ' + (GameState.stage - 1) + ' CLEAR', '#00FF7F', 22);

    const hud = this.scene.get('HUDScene');
    if (hud) hud.updateHUD();

    this.stageData.beats.filter(b => b.type === 'false' && !b.resolved)
      .forEach(() => { GameState.score += SCORE.ignoreFalse; });

    this.time.delayedCall(STAGE_TRANSITION_MS, () => {
      this.loadStage(GameState.stage);
      this.stageTransitioning = false;
    });
  }

  update(time, delta) {
    if (this.gameOver || this.stageTransitioning) return;
    this.gameTime += delta;
    this.scrollOffset += this.scrollSpeed * (delta / 1000);

    if (this.introActive && this.gameTime >= INTRO_DELAY_MS) this.introActive = false;
    if (this.introActive) {
      drawECG(this.ecgGraphics, this.gameWidth, this.scrollOffset, this.scrollSpeed, this.beatEvents, this.stageConfig, this.ecgColor);
      return;
    }

    // Beat processing
    const beat = this.stageData.beats[this.currentBeatIndex];
    if (beat && !beat.resolved && this.gameTime > beat.windowEndMs) {
      if (beat.type === 'real') this.onMiss();
      beat.resolved = true;
      this.currentBeatIndex++;
    }

    if (this.currentBeatIndex >= this.stageData.beats.length && !this.stageTransitioning) {
      this.advanceStage();
    }

    // Tachycardia visual
    const activeBeat = this.stageData.beats[this.currentBeatIndex];
    if (activeBeat && activeBeat.isTachy) this.ecgColor = COLORS.ecgTachy;
    else if (!this.flatlineTriggered && this.ecgColor === COLORS.ecgTachy) this.ecgColor = COLORS.ecgNormal;

    drawECG(this.ecgGraphics, this.gameWidth, this.scrollOffset, this.scrollSpeed, this.beatEvents, this.stageConfig, this.ecgColor);
    drawTimingWindows(this.windowGraphics, this.stageData.beats, this.currentBeatIndex, this.gameTime, this.scrollSpeed, this.stageConfig, this.scrollOffset, this.gameWidth, this.introActive, this.gameOver);
    this.particleMgr.update(this.effectGraphics, delta);
  }

  flashOverlay(color, alpha, duration) {
    const o = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, color, alpha).setDepth(8);
    this.tweens.add({ targets: o, alpha: 0, duration, onComplete: () => o.destroy() });
  }

  showFloatingText(x, y, text, color, size) {
    const t = this.add.text(x, y, text, { fontSize: size + 'px', fontFamily: 'monospace', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    AudioSystem.stopFlatline();
    this.particleMgr.clear();
  }
}
