// Fold Fit - Core Gameplay Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) { this.continuing = data && data.continuing; }

  create() {
    const { width, height } = this.scale;
    if (!this.continuing) { GameState.score = 0; GameState.stage = 1; GameState.wrongFolds = 0; GameState.combo = 0; }
    this.continuing = false;
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, COLORS_INT.background);
    this.paperGroup = this.add.container(0, 0);
    this.folding = false;
    this.lastInputTime = Date.now();
    this.stageData = null;
    this.completedFolds = 0;
    this.nextFoldOrder = 0;
    this.foldedLineIndices = [];
    this.paused = false;
    this.gameOver = false;
    this.wrongFoldsAtStart = GameState.wrongFolds;

    this.createHUD();
    this.loadStage(GameState.stage);
    this.setupInput();

    document.addEventListener('visibilitychange', this.onVisChange = () => {
      if (document.hidden && !this.gameOver) this.pauseGame();
    });
  }

  createHUD() {
    const { width } = this.scale;
    this.pauseBtn = this.add.image(30, 28, 'pause').setScale(0.9).setInteractive({ useHandCursor: true }).setDepth(10);
    this.pauseBtn.on('pointerdown', () => this.pauseGame());
    this.stageTxt = this.add.text(width / 2, 16, `Stage ${GameState.stage}`, { fontSize: '18px', fontFamily: 'Georgia, serif', color: COLORS.white }).setOrigin(0.5, 0).setDepth(10);
    this.scoreTxt = this.add.text(width - 16, 16, `${GameState.score}`, { fontSize: '20px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold' }).setOrigin(1, 0).setDepth(10);
    this.timerTxt = this.add.text(width / 2, 40, '', { fontSize: '24px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10);

    this.diamonds = [];
    for (let i = 0; i < 3; i++) {
      const key = i < GameState.wrongFolds ? 'diamondFilled' : 'diamondEmpty';
      this.diamonds.push(this.add.image(30 + i * 26, 60, key).setScale(0.9).setDepth(10));
    }
    this.comboTxt = this.add.text(width / 2, this.scale.height - 80, '', { fontSize: '28px', fontFamily: 'Georgia, serif', color: COLORS.combo, fontStyle: 'bold' }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.hintTxt = this.add.text(width / 2, this.scale.height - 40, GameState.stage <= 3 ? 'Swipe across lines to fold' : '', { fontSize: '14px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary }).setOrigin(0.5).setDepth(10);
  }

  updateDiamonds() {
    for (let i = 0; i < 3; i++) {
      this.diamonds[i].setTexture(i < GameState.wrongFolds ? 'diamondFilled' : 'diamondEmpty');
    }
  }

  loadStage(stageNum) {
    const { width, height } = this.scale;
    this.paperGroup.removeAll(true);
    this.stageData = generateStage(stageNum);
    this.completedFolds = 0;
    this.nextFoldOrder = 0;
    this.foldedLineIndices = [];
    this.folding = false;
    this.timerValue = this.stageData.timer;
    this.timerTxt.setText(`${this.timerValue}s`).setColor(COLORS.white);
    this.stageTxt.setText(`Stage ${stageNum}`);
    this.hintTxt.setText(stageNum <= 3 ? 'Swipe across lines to fold' : '');
    this.lastInputTime = Date.now();

    const shape = this.stageData.shape;
    this.paperOffX = width / 2 - shape.width / 2;
    this.paperOffY = height / 2 - shape.height / 2 + 30;

    FoldEffects.drawPaper(this);
    FoldEffects.drawTarget(this);
    this.startTimer();
    this.bg.setFillStyle(this.stageData.isRest ? 0xF0E6C8 : COLORS_INT.background);
  }

  startTimer() {
    if (this.timerEvent) this.timerEvent.remove();
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.paused || this.gameOver) return;
        this.timerValue--;
        this.timerTxt.setText(`${this.timerValue}s`);
        if (this.timerValue <= 5) {
          this.timerTxt.setColor(COLORS.danger);
          this.tweens.add({ targets: this.timerTxt, scaleX: 1.15, scaleY: 1.15, duration: 150, yoyo: true });
          SoundFX.play(this, 'tick');
        }
        if (this.timerValue <= 0) this.handleDeath('timer');
      }
    });
  }

  setupInput() {
    this.swipeStart = null;
    this.input.on('pointerdown', p => { this.swipeStart = { x: p.x, y: p.y }; this.lastInputTime = Date.now(); });
    this.input.on('pointerup', p => {
      if (!this.swipeStart || this.folding || this.paused || this.gameOver) return;
      const dx = p.x - this.swipeStart.x, dy = p.y - this.swipeStart.y;
      if (Math.sqrt(dx * dx + dy * dy) < SIZES.minSwipeLen) { this.swipeStart = null; return; }
      this.handleSwipe(this.swipeStart, { x: p.x, y: p.y }, dx, dy);
      this.swipeStart = null;
    });
  }

  handleSwipe(start, end, dx, dy) {
    const midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2;
    const swipeAngle = Math.atan2(dy, dx);
    let bestLine = null, bestDist = Infinity, bestIdx = -1;

    this.stageData.foldLines.forEach((line, idx) => {
      if (this.foldedLineIndices.includes(idx)) return;
      const lx1 = line.x1 + this.paperOffX, ly1 = line.y1 + this.paperOffY;
      const lx2 = line.x2 + this.paperOffX, ly2 = line.y2 + this.paperOffY;
      const lineAngle = Math.atan2(ly2 - ly1, lx2 - lx1);
      let angleDiff = Math.abs(swipeAngle - lineAngle) * 180 / Math.PI;
      angleDiff = Math.min(angleDiff, 180 - angleDiff);
      if (Math.abs(90 - angleDiff) > SIZES.swipeAngleTolerance) return;
      const dist = this.ptLineDist(midX, midY, lx1, ly1, lx2, ly2);
      if (dist < SIZES.foldDetectDist && dist < bestDist) { bestDist = dist; bestLine = line; bestIdx = idx; }
    });

    if (!bestLine) return;
    this.executeFold(bestLine, bestIdx);
  }

  ptLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    const t = Math.max(0, Math.min(1, dot / lenSq));
    return Math.sqrt((px - (x1 + t * C)) ** 2 + (py - (y1 + t * D)) ** 2);
  }

  executeFold(line, idx) {
    if (line.type === 'tear' || line.type === 'distractor') { this.onWrongFold(); return; }
    if (this.stageData.orderMatters && line.order !== this.nextFoldOrder) { this.onWrongFold(); return; }

    this.folding = true;
    this.foldedLineIndices.push(idx);
    this.completedFolds++;
    this.nextFoldOrder++;
    if (navigator.vibrate) navigator.vibrate(15);

    FoldEffects.animateFold(this, line, () => {
      SoundFX.play(this, 'fold');
      this.cameras.main.shake(100, 0.002);
      if (this.paperGfx) this.tweens.add({ targets: this.paperGfx, scaleX: 1.04, scaleY: 1.04, duration: 80, yoyo: true });
      FoldEffects.spawnFoldParticles(this, line, 8 + this.completedFolds * 3);
      FoldEffects.drawPaper(this);
      this.folding = false;
      if (this.completedFolds >= this.stageData.totalValidFolds) this.onStageComplete();
    });
  }

  onWrongFold() {
    GameState.wrongFolds++;
    GameState.combo = 0;
    this.updateDiamonds();
    SoundFX.play(this, 'wrong');
    FoldEffects.wrongFoldEffect(this);
    if (GameState.wrongFolds >= 3) this.handleDeath('torn');
  }

  onStageComplete() {
    const wasClean = GameState.wrongFolds === this.wrongFoldsAtStart;
    const foldPts = this.completedFolds * SCORING.correctFold;
    const elapsed = this.stageData.timer - this.timerValue;
    const speedBonus = Math.floor(Math.max(0, SCORING.speedBonusMax * Math.max(0, 1 - elapsed / SCORING.speedBonusSlow)));
    const perfectMul = wasClean ? SCORING.perfectMultiplier : 1;
    if (wasClean) GameState.combo++; else GameState.combo = 0;
    const comboMul = 1 + Math.min(GameState.combo * SCORING.comboStep, SCORING.comboMax - 1);
    const stagePts = Math.floor((SCORING.stageClear + foldPts + speedBonus) * perfectMul * comboMul);

    GameState.score += stagePts;
    this.scoreTxt.setText(`${GameState.score}`);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });

    SoundFX.play(this, wasClean ? 'perfect' : 'clear');
    FoldEffects.stageCompleteEffect(this, wasClean, stagePts);

    if (GameState.combo > 1) {
      this.comboTxt.setText(`x${GameState.combo} COMBO!`).setAlpha(1).setFontSize(28 + Math.min(GameState.combo, 4) * 4);
      this.tweens.add({ targets: this.comboTxt, alpha: 0, duration: 800, delay: 200 });
    }

    this.time.delayedCall(500, () => {
      if (this.gameOver) return;
      GameState.stage++;
      this.wrongFoldsAtStart = GameState.wrongFolds;
      this.loadStage(GameState.stage);
    });
  }

  handleDeath(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) this.timerEvent.remove();
    SoundFX.play(this, reason === 'timer' ? 'timerExpire' : 'tear');
    FoldEffects.deathEffect(this);

    const gp = parseInt(localStorage.getItem('fold_fit_games_played') || '0') + 1;
    localStorage.setItem('fold_fit_games_played', gp);
    const hs = parseInt(localStorage.getItem('fold_fit_highest_stage') || '0');
    if (GameState.stage > hs) localStorage.setItem('fold_fit_highest_stage', GameState.stage);

    this.time.delayedCall(700, () => {
      this.scene.start('GameOverScene', { reason, score: GameState.score, stage: GameState.stage });
    });
  }

  pauseGame() {
    if (this.gameOver || this.paused) return;
    this.paused = true;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  update() {
    if (this.paused || this.gameOver) return;
    if (Date.now() - this.lastInputTime > 20000) this.handleDeath('idle');
  }

  shutdown() {
    if (this.onVisChange) document.removeEventListener('visibilitychange', this.onVisChange);
  }
}
