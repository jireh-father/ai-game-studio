const SoundFX = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  play(freq, duration, type, vol) {
    if (!GameState.soundEnabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch(e) {}
  },
  tap(pitchOffset) {
    this.play(440 + (pitchOffset || 0) * 50, 120, 'sine', 0.12);
    this.play(880 + (pitchOffset || 0) * 50, 80, 'sine', 0.06);
  },
  highValuePlace() {
    this.play(1047, 100, 'sine', 0.1);
    setTimeout(() => this.play(1319, 100, 'sine', 0.1), 80);
    setTimeout(() => this.play(1568, 100, 'sine', 0.1), 160);
  },
  poisonPlace() { this.play(180, 200, 'sawtooth', 0.1); },
  autoFill() { this.play(600, 150, 'square', 0.08); setTimeout(() => this.play(300, 150, 'square', 0.08), 150); },
  roundWin() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.play(f, 120, 'sine', 0.12), i * 80));
  },
  strike() { this.play(100, 350, 'sine', 0.2); },
  crystalShatter() {
    if (!GameState.soundEnabled) return;
    try {
      const ctx = this.getCtx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const gain = ctx.createGain(); gain.gain.value = 0.1;
      src.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch(e) {}
  },
  gameOver() {
    [196, 156, 131].forEach((f, i) => setTimeout(() => this.play(f, 300, 'sine', 0.15), i * 200));
  },
  streakUp() { this.play(880, 80, 'sine', 0.1); setTimeout(() => this.play(1100, 80, 'sine', 0.1), 60); },
  uiClick() { this.play(300, 80, 'sine', 0.08); },
  timerTick() { this.play(800, 60, 'square', 0.05); },
};

const Effects = {
  scalePunch(scene, target, scale, duration) {
    if (!target || !target.scene) return;
    scene.tweens.add({ targets: target, scaleX: scale, scaleY: scale, duration: duration / 2, yoyo: true, ease: 'Sine.InOut' });
  },

  floatingText(scene, x, y, text, color, size) {
    const txt = scene.add.text(x, y, text, { fontFamily: "'Courier New', monospace", fontSize: (size || 28) + 'px', fontStyle: 'bold', color: color || COLORS.SCORE, stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 800, delay: 200, onComplete: () => txt.destroy() });
    return txt;
  },

  screenShake(scene, intensity, duration) {
    scene.cameras.main.shake(duration || 150, intensity || 0.005);
  },

  hitStop(scene) {
    scene.time.timeScale = 0;
    setTimeout(() => { if (scene && scene.time) scene.time.timeScale = 1; }, TIMING.HIT_STOP_MS);
  },

  cameraZoom(scene, amount, duration) {
    scene.tweens.add({ targets: scene.cameras.main, zoom: amount || 1.04, duration: (duration || 250) / 2, yoyo: true, ease: 'Sine.InOut' });
  },

  particleBurst(scene, x, y, count, textureKey) {
    const key = textureKey || 'particle';
    if (!scene.textures.exists(key)) return;
    const particles = scene.add.particles(x, y, key, {
      speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
      lifespan: 350, quantity: count || 6, scale: { start: 0.8, end: 0 },
      gravityY: 200, emitting: false
    });
    particles.explode(count || 6);
    scene.time.delayedCall(500, () => { if (particles && particles.scene) particles.destroy(); });
  },

  flashRect(scene, x, y, w, h, color, duration) {
    const r = scene.add.rectangle(x, y, w, h, color, 0.6).setDepth(90);
    scene.tweens.add({ targets: r, alpha: 0, duration: duration || 200, onComplete: () => r.destroy() });
  }
};

// Mixin methods for GameScene — keeps game.js under 300 lines
const GameSceneMixin = {
  evaluateRound() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    if (this.dropTimerEvent) this.dropTimerEvent.remove();
    this.timerBar.setSize(0, 6);
    const formed = getFormedNumber(this.slotValues);
    const won = this.isRest ? true : formed >= this.target;
    if (won) {
      const pts = this.isRest ? 500 : calculateRoundScore(formed, this.target, this.roundAutoFills, GameState.streak, this.slotValues);
      GameState.score += pts;
      GameState.streak++;
      this.scoreTxt.setText('Score: ' + GameState.score);
      Effects.scalePunch(this, this.scoreTxt, 1.4, 220);
      Effects.floatingText(this, this.gameWidth / 2, this.gameHeight / 2 - 20, '+' + pts, COLORS.SCORE, 28);
      this.updateStreakDisplay();
      SoundFX.roundWin();
      Effects.screenShake(this, 0.003, 100);
      if (!this.isRest && (formed - this.target) / this.target >= 0.5) {
        Effects.floatingText(this, this.gameWidth / 2, this.gameHeight / 2 - 50, 'PERFECT!', COLORS.DIGIT_HIGH, 20);
      }
      this.time.delayedCall(TIMING.ROUND_TRANSITION_MS, () => { GameState.stage++; this.loadRound(); });
    } else {
      GameState.strikes++;
      GameState.streak = 0;
      this.updateStreakDisplay();
      this.updateCrystals();
      SoundFX.strike();
      SoundFX.crystalShatter();
      Effects.screenShake(this, 0.01, 400);
      Effects.flashRect(this, this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, COLORS.STRIKE_FLASH, 300);
      if (GameState.strikes >= 3) this.triggerGameOver();
      else this.time.delayedCall(600, () => this.loadRound());
    }
  },

  triggerGameOver() {
    this.gameOver = true;
    SoundFX.gameOver();
    Effects.screenShake(this, 0.02, 700);
    saveHighScore();
    const isNewHigh = GameState.score >= GameState.highScore;
    this.time.delayedCall(TIMING.GAME_OVER_DELAY_MS, () => {
      this.scene.launch('GameOverScene', {
        score: GameState.score, formedNumber: getFormedNumber(this.slotValues),
        targetNumber: this.target, stage: GameState.stage, isNewHigh
      });
    });
  },

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) { this.time.paused = true; this.showPauseOverlay(); }
    else { this.time.paused = false; this.hidePauseOverlay(); }
  },

  showPauseOverlay() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    this.pauseGroup = this.add.group();
    const bg = this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.7).setDepth(50).setInteractive();
    this.pauseGroup.add(bg);
    const title = this.add.text(cx, height / 2 - 80, 'PAUSED', { fontFamily: "'Courier New', monospace", fontSize: '28px', fontStyle: 'bold', color: '#00D4FF' }).setOrigin(0.5).setDepth(51);
    this.pauseGroup.add(title);
    const makeBtn = (y, label, cb) => {
      const b = this.add.rectangle(cx, y, 180, 42, 0x1C2D40).setStrokeStyle(1, 0x2E5C8A).setInteractive({ useHandCursor: true }).setDepth(51);
      const t = this.add.text(cx, y, label, { fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#E8F4FD' }).setOrigin(0.5).setDepth(52);
      b.on('pointerdown', cb);
      t.setInteractive().on('pointerdown', cb);
      this.pauseGroup.addMultiple([b, t]);
    };
    makeBtn(height / 2 - 20, 'RESUME', () => this.togglePause());
    makeBtn(height / 2 + 30, 'HOW TO PLAY', () => { this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
    makeBtn(height / 2 + 80, 'RESTART', () => { this.hidePauseOverlay(); this.paused = false; this.time.paused = false; resetGameState(); this.scene.restart(); });
    makeBtn(height / 2 + 130, 'QUIT', () => { this.hidePauseOverlay(); this.paused = false; this.time.paused = false; this.scene.stop('GameScene'); this.scene.start('MenuScene'); });
  },

  hidePauseOverlay() {
    if (this.pauseGroup) { this.pauseGroup.clear(true, true); this.pauseGroup = null; }
  },

  updateCrystals() {
    for (let i = 0; i < 3; i++) this.crystals[i].setTexture(GameState.strikes > i ? 'crystal_broken' : 'crystal');
  },

  updateStreakDisplay() {
    if (GameState.streak >= 2) {
      const idx = Math.min(GameState.streak, SCORING.STREAK_LEVELS.length - 1);
      this.streakTxt.setText('x' + SCORING.STREAK_LEVELS[idx].toFixed(1));
    } else { this.streakTxt.setText(''); }
  },

  updatePreview() {
    const preview = this.slotValues.map(v => v === null ? '_' : String(v.value)).join(' ');
    this.previewTxt.setText(preview);
  },
};
