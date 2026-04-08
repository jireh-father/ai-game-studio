// game-helpers.js - GameScene prototype mixin for helpers (keeps game.js under 300 lines)
window.GameHelpers = {
  corruptNearestNumber(fromX, fromY) {
    let best = null, bestVal = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = fromX + dx, ny = fromY + dy;
        if (nx < 0 || ny < 0 || nx >= this.params.cols || ny >= this.params.rows) continue;
        const c = this.grid[ny][nx];
        if (c.revealed && !c.isWall && c.displayNumber < bestVal) {
          bestVal = c.displayNumber; best = c;
        }
      }
    }
    if (!best) return;
    best.displayNumber++;
    best.corrupted = true;
    this.corruptionCount++;
    const t = this.cellTexts[best.y][best.x];
    this.setNumberText(t, best);
    let flips = 0;
    this.time.addEvent({ delay: 80, repeat: 3, callback: () => {
      flips++;
      t.setColor(flips % 2 === 0 ? CONFIG.COLORS.CORRUPTED : '#FFFFFF');
    }});
    const cx = this.gridX + best.x * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + best.y * this.cellSize + this.cellSize / 2;
    Effects.floatingText(this, cx, cy, '+1', CONFIG.COLORS.CORRUPTED, 30, 400);
    Effects.playCorrupt();
    this.addScore(CONFIG.SCORE.CORRUPTION, cx, cy);
    this.corruptText.setText(`CORRUPT: ${this.corruptionCount}/${this.params.corruptionTarget}`);
    Effects.scalePunch(this.corruptText, 1.2, 200);
    if (this.corruptionCount >= this.params.corruptionTarget && !this.stageTransitioning) {
      this.stageClear();
    }
  },
  triggerDecoy() {
    if (!this.decoyReady) return;
    this.decoyReady = false;
    this.decoyText.setText('DECOY COOLDOWN');
    this.decoyText.setColor('#888888');
    const cx = this.gridX + this.playerX * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + this.playerY * this.cellSize + this.cellSize / 2;
    const boom = this.add.image(cx, cy, 'explosion').setScale(0).setDepth(80);
    this.tweens.add({ targets: boom, scale: (this.cellSize / 80), duration: 200, yoyo: true, onComplete: () => boom.destroy() });
    Effects.screenShake(this, 12, 250);
    Effects.flashScreen(this, 0xFFFFFF, 0.7, 150);
    Effects.spawnParticles(this, cx, cy, 16, 0xFFAA00, 100, 200, 500);
    Effects.playDecoy();
    this.aiPauseUntil = Date.now() + CONFIG.DECOY_PAUSE_MS;
    Effects.floatingText(this, this.scale.width/2, this.scale.height/2, 'AI PAUSED 3s', '#FF2222', 0, 1000);
    this.addScore(CONFIG.SCORE.DECOY, cx, cy);
    this.lastInputTime = Date.now();
    this.time.delayedCall(this.params.decoyCooldown, () => {
      this.decoyReady = true;
      this.decoyText.setText('DECOY READY');
      this.decoyText.setColor('#FFDD00');
    });
  },
  advanceAI() {
    const next = AIEngine.pickNextReveal(this.grid, this.params.aiTier, this.aiEdge);
    if (next) {
      next.revealed = true;
      const r = this.cellRects[next.y][next.x];
      r.setFillStyle(CONFIG.COLORS.CELL_REVEALED);
      const blueFlash = this.add.rectangle(r.x, r.y, r.width, r.height, 0x4488FF, 0.6);
      this.tweens.add({ targets: blueFlash, alpha: 0, duration: 300, onComplete: () => blueFlash.destroy() });
      if (next.displayNumber > 0) this.setNumberText(this.cellTexts[next.y][next.x], next);
      Effects.playAIAdvance();
    }
    const flag = AIEngine.pickFlag(this.grid, this.params.aiTier, this.playerX, this.playerY);
    if (flag) {
      const cell = this.grid[flag.y][flag.x];
      cell.flagged = true;
      if (flag.correct) {
        this.triggerDeath('flagged');
      } else {
        this.spawnWrongFlag(flag.x, flag.y);
        this.streak++;
        const fcx = this.gridX + flag.x * this.cellSize + this.cellSize/2;
        const fcy = this.gridY + flag.y * this.cellSize + this.cellSize/2;
        this.addScore(CONFIG.SCORE.WRONG_FLAG, fcx, fcy);
        Effects.playWrongFlag();
        Effects.floatingText(this, fcx, fcy - 20, 'DECEIVED! x' + this.streak, '#FFDD00', 40, 800);
      }
    }
  },
  spawnWrongFlag(x, y) {
    const cx = this.gridX + x * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + y * this.cellSize + this.cellSize / 2;
    const f = this.add.image(cx, cy, 'flag_wrong').setScale(0).setDepth(60);
    this.tweens.add({ targets: f, scale: this.cellSize / 30, duration: 200 });
    this.time.delayedCall(800, () => {
      this.tweens.add({ targets: f, alpha: 0, duration: 300, onComplete: () => {
        f.destroy();
        const cell = this.grid[y][x];
        if (cell) cell.flagged = false;
      }});
    });
  },
  triggerDeath(cause) {
    if (this.gameOver) return;
    this.gameOver = true;
    const cx = this.gridX + this.playerX * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + this.playerY * this.cellSize + this.cellSize / 2;
    Effects.flashScreen(this, 0xFF0000, 0.6, 200);
    Effects.screenShake(this, 20, 300);
    Effects.spawnParticles(this, cx, cy, 24, 0xFF2222, 80, 200, 600);
    this.tweens.add({ targets: this.mineSprite, scale: 0, duration: 400 });
    Effects.playDeath();
    AdsManager.incrementDeathCount();
    GameState.lives--;
    this.time.delayedCall(700, () => {
      if (GameState.lives > 0 && cause !== 'idle') {
        this.scene.restart();
      } else {
        AdsManager.tryShowInterstitial(() => {
          this.scene.stop();
          this.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage, corrupted: this.corruptionCount, caused: cause });
        });
      }
    });
  },
  stageClear() {
    this.stageTransitioning = true;
    const bonus = CONFIG.SCORE.STAGE_CLEAR * GameState.stage;
    this.addScore(bonus, this.scale.width/2, this.scale.height/2);
    Effects.spawnParticles(this, this.mineSprite.x, this.mineSprite.y, 20, 0x00FF88, 60, 150, 500);
    this.tweens.add({ targets: this.mineSprite, angle: 360, duration: 500 });
    Effects.floatingText(this, this.scale.width/2, this.scale.height/2, 'STAGE CLEAR!', '#FFDD00', 0, 1500);
    Effects.playStageClear();
    this.time.delayedCall(1200, () => {
      GameState.stage++;
      this.scene.restart();
    });
  },
  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      if (!this.pauseOverlay) this.createPauseOverlay();
      this.pauseOverlay.setVisible(true);
    } else if (this.pauseOverlay) {
      this.pauseOverlay.setVisible(false);
      this.lastInputTime = Date.now();
    }
  },
  createPauseOverlay() {
    const w = this.scale.width, h = this.scale.height;
    this.pauseOverlay = this.add.container(0, 0).setDepth(1000);
    const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.8);
    const title = this.add.text(w/2, 160, 'PAUSED', { fontSize: '40px', color: '#F0F0F0', fontStyle: 'bold' }).setOrigin(0.5);
    const makeBtn = (y, label, cb) => {
      const r = this.add.rectangle(w/2, y, 220, 50, 0x4488FF).setInteractive({ useHandCursor: true });
      const t = this.add.text(w/2, y, label, { fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
      r.on('pointerdown', cb);
      return [r, t];
    };
    const self = this;
    const [r1, t1] = makeBtn(260, 'RESUME', () => { Effects.playClick(); self.togglePause(); });
    const [r2, t2] = makeBtn(330, 'RESTART', () => { Effects.playClick(); self.scene.restart(); });
    const [r3, t3] = makeBtn(400, 'HELP', () => {
      Effects.playClick();
      self.scene.pause();
      self.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    const [r4, t4] = makeBtn(470, 'QUIT', () => { Effects.playClick(); self.scene.start('MenuScene'); });
    this.pauseOverlay.add([bg, title, r1, t1, r2, t2, r3, t3, r4, t4]);
  }
};
