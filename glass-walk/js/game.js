// Glass Walk - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) { this.continueData = data ? data.continueData : null; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gameW = w; this.gameH = h;
    if (this.continueData) {
      this.score = this.continueData.score; this.currentRow = this.continueData.row;
      this.streak = this.continueData.streak; this.lives = 1; this.continueData = null;
    } else {
      this.score = 0; this.currentRow = 1; this.lives = DIFFICULTY.baseLives;
      this.streak = 0; StageGen.reset(); Ads.reset();
    }
    this.inputLocked = false; this.rowStartTime = 0; this.timerRunning = false;
    this.panels = []; this.extras = []; this.inactTimer = null;
    this.weightEvt = null; this.shiftEvt = null;

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);
    this.add.rectangle(w * 0.12, h / 2, 4, h, COLORS.bridgeFrame, 0.3);
    this.add.rectangle(w * 0.88, h / 2, 4, h, COLORS.bridgeFrame, 0.3);
    this.player = this.add.image(w / 2, h * 0.28, 'player').setScale(1.2).setDepth(30);

    this.timerBarBg = this.add.rectangle(w / 2, h * 0.88, w * 0.7, 12, 0x263238).setDepth(40);
    this.timerBar = this.add.rectangle(
      w / 2 - (w * 0.7) / 2, h * 0.88, w * 0.7, 12, COLORS.timerGreen
    ).setOrigin(0, 0.5).setDepth(41);
    this.timerTxt = this.add.text(w * 0.88, h * 0.88, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#FFF'
    }).setOrigin(0, 0.5).setDepth(42);

    this.scene.launch('UIScene');
    this.uiScene = this.scene.get('UIScene');
    this.time.delayedCall(100, () => { this.syncUI(); this.createNewRow(); });
    this.lastInputTime = Date.now();
    this.resetInactivity();
    this.visHandler = () => {
      if (document.hidden) this.timerRunning = false;
      else if (this.timerRemaining > 0) this.timerRunning = true;
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  syncUI() {
    if (!this.uiScene) return;
    this.uiScene.updateScore(this.score); this.uiScene.updateRow(this.currentRow);
    this.uiScene.updateLives(this.lives); this.uiScene.updateStreak(this.streak);
  }

  createNewRow() {
    this.clearRow(); this.inputLocked = false;
    const rd = StageGen.generateRow(this.currentRow);
    this.rowData = rd; this.rowStartTime = Date.now();
    if (rd.isMilestone) Effects.milestoneText(this, this.currentRow);

    const w = this.gameW;
    const pw = rd.panelCount === 2 ? w * 0.35 : w * 0.27;
    const ph = 65;
    const totalW = rd.panelCount * pw + (rd.panelCount - 1) * 12;
    const sx = (w - totalW) / 2 + pw / 2;
    const py = this.gameH * 0.58;

    for (let i = 0; i < rd.panelCount; i++) {
      const px = sx + i * (pw + 12);
      const safe = i === rd.safeIndex;
      const panel = this.makePanel(px, py, pw, ph, safe, rd);
      panel.panelIndex = i; panel.isSafe = safe;
      this.panels.push(panel);
    }
    Effects.flashPanel(this, this.panels[rd.safeIndex], rd.flashDuration);
    this.startTimer(rd.standingTimer);
    if (rd.weightTimer) this.startWeight(rd.weightTimer);
    if (rd.shiftConfig) this.startShift(rd.shiftConfig);
  }

  makePanel(x, y, pw, ph, safe, rd) {
    const color = safe ? COLORS.safeGlass : COLORS.fakeGlass;
    const panel = this.add.rectangle(x, y, pw, ph, color, safe ? 0.6 : 0.45)
      .setStrokeStyle(2, 0xB0BEC5).setDepth(20).setInteractive();
    this.applyCues(panel, x, y, pw, ph, safe, rd);
    panel.on('pointerdown', () => this.onTap(panel));
    return panel;
  }

  applyCues(panel, x, y, pw, ph, safe, rd) {
    const g = this.add.graphics().setDepth(25);
    this.extras.push(g);
    if (rd.tier <= 2) {
      const cnt = safe ? (rd.tier === 1 ? 0 : 1) : Math.floor(3 + (1 - rd.cueStrength) * 4);
      const cracks = StageGen.generateCracks(cnt, pw, ph);
      const ox = x - pw / 2, oy = y - ph / 2;
      g.lineStyle(1, COLORS.crackLine, safe ? 0.3 : 0.6);
      cracks.forEach(c => g.lineBetween(ox + c.x1, oy + c.y1, ox + c.x2, oy + c.y2));
    }
    if (rd.tier >= 3 && safe) {
      const ga = 0.15 + rd.cueStrength * 0.2;
      const glow = this.add.ellipse(x, y, pw * 0.6, ph * 0.5, COLORS.safeGlow, ga).setDepth(21);
      this.extras.push(glow);
      if (rd.tier >= 5) {
        this.tweens.add({ targets: glow, alpha: ga * 0.7, duration: 800, yoyo: true, repeat: -1 });
      }
    }
    if (rd.tier >= 5 && !safe) {
      const fg = this.add.ellipse(x, y, pw * 0.5, ph * 0.4, COLORS.safeGlow, 0).setDepth(21);
      this.extras.push(fg);
      this.tweens.add({ targets: fg, alpha: 0.15, duration: 200, yoyo: true, repeat: -1, repeatDelay: 400 });
    }
  }

  onTap(panel) {
    if (this.inputLocked) return;
    this.inputLocked = true;
    this.lastInputTime = Date.now(); this.resetInactivity(); this.stopTimers();
    Effects.hapticTap();
    this.tweens.add({ targets: panel, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
    if (panel.isSafe) this.onCorrect(panel, Date.now() - this.rowStartTime);
    else this.onWrong(panel);
  }

  onCorrect(panel, elapsed) {
    let pts = SCORE.safeStep, bonus = '';
    if (elapsed < SCORE.perfectThreshold) { pts += SCORE.perfectBonus; bonus = ' PERFECT!'; }
    else if (elapsed < SCORE.quickThreshold) { pts += SCORE.quickBonus; bonus = ' QUICK!'; }
    this.streak++;
    let mult = 1;
    Object.entries(SCORE.streakMultipliers).forEach(([t, m]) => {
      if (this.streak >= parseInt(t)) mult = m;
    });
    pts = Math.floor(pts * mult);
    if (this.currentRow % DIFFICULTY.milestoneEvery === 0) pts += SCORE.milestoneBonus;
    this.score += pts;

    Effects.panelGlow(this, panel, COLORS.safeGlow);
    Effects.scorePopup(this, panel.x, panel.y - 40, `+${pts}${bonus}`);
    if (this.streak >= 3 && this.streak % 3 === 0) Effects.streakText(this, this.streak);

    Effects.playerStep(this, this.player, this.player.y, () => {
      this.currentRow++; this.syncUI(); this.createNewRow();
    });
  }

  onWrong(panel) {
    this.streak = 0; this.lives--;
    Effects.shatterPanel(this, panel.x, panel.y, panel.width, panel.height);
    Effects.screenShake(this, 0.012, 300);
    Effects.redFlash(this); Effects.hapticDeath();
    panel.setVisible(false);
    // Slow-mo via setTimeout
    const orig = this.time.timeScale;
    this.time.timeScale = 0.3;
    setTimeout(() => { if (this.scene.isActive()) this.time.timeScale = orig; }, 200);

    if (this.lives <= 0) {
      Effects.playerFall(this, this.player); this.syncUI();
      setTimeout(() => this.goGameOver(), 800);
    } else {
      this.syncUI();
      setTimeout(() => { if (this.scene.isActive()) this.createNewRow(); }, 800);
    }
  }

  goGameOver() {
    if (!this.scene.isActive()) return;
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene', {
      score: this.score, row: this.currentRow, streak: this.streak
    });
  }

  startTimer(dur) {
    this.timerTotal = dur; this.timerRemaining = dur; this.timerRunning = true;
  }

  update(time, delta) {
    if (!this.timerRunning) return;
    this.timerRemaining -= delta / 1000;
    if (this.timerRemaining <= 0) {
      this.timerRunning = false; this.timerRemaining = 0;
      this.onTimerExpired(); return;
    }
    const pct = Math.max(0, this.timerRemaining / this.timerTotal);
    this.timerBar.setSize(this.gameW * 0.7 * pct, 12);
    let col = COLORS.timerGreen;
    if (this.timerRemaining < 2) col = COLORS.timerRed;
    else if (this.timerRemaining < 3) col = COLORS.timerYellow;
    this.timerBar.setFillStyle(col);
    this.timerTxt.setText(`${this.timerRemaining.toFixed(1)}s`);
    if (this.timerRemaining < 2) {
      this.timerBar.setScale(1 + Math.sin(time * 0.01) * 0.03, 1);
      this.panels.forEach(p => { if (p.active) p.x += Phaser.Math.Between(-1, 1); });
    }
  }

  onTimerExpired() {
    if (this.inputLocked) return;
    this.inputLocked = true; this.streak = 0; this.lives--;
    Effects.screenShake(this, 0.01, 200); Effects.redFlash(this); Effects.hapticDeath();
    if (this.lives <= 0) {
      Effects.playerFall(this, this.player); this.syncUI();
      setTimeout(() => this.goGameOver(), 800);
    } else {
      this.syncUI();
      setTimeout(() => { if (this.scene.isActive()) this.createNewRow(); }, 800);
    }
  }

  startWeight(dur) {
    this.weightEvt = this.time.delayedCall(dur * 1000, () => {
      this.panels.forEach(p => {
        if (!p.active) return;
        const g = this.add.graphics().setDepth(26); this.extras.push(g);
        g.lineStyle(1, COLORS.danger, 0.5);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const off = p.isSafe ? 0 : Phaser.Math.FloatBetween(-0.3, 0.3);
          const len = p.isSafe ? 15 : Phaser.Math.Between(10, 25);
          g.lineBetween(p.x, p.y, p.x + Math.cos(a + off) * len, p.y + Math.sin(a + off) * len);
        }
      });
    });
  }

  startShift(cfg) {
    this.shiftEvt = this.time.addEvent({
      delay: cfg.interval * 1000, loop: true,
      callback: () => {
        this.panels.forEach(p => {
          if (p.isSafe || !p.active) return;
          this.tweens.add({ targets: p, fillAlpha: 0.7, duration: 200, yoyo: true });
        });
      }
    });
  }

  clearRow() {
    this.panels.forEach(p => { if (p && p.active) p.destroy(); }); this.panels = [];
    this.extras.forEach(g => { if (g && g.active) g.destroy(); }); this.extras = [];
  }

  stopTimers() {
    this.timerRunning = false;
    if (this.weightEvt) { this.weightEvt.remove(); this.weightEvt = null; }
    if (this.shiftEvt) { this.shiftEvt.remove(); this.shiftEvt = null; }
  }

  resetInactivity() {
    if (this.inactTimer) clearTimeout(this.inactTimer);
    this.inactTimer = setTimeout(() => {
      if (this.scene.isActive()) { this.lives = 0; this.syncUI(); this.goGameOver(); }
    }, DIFFICULTY.inactivityTimeout);
  }

  shutdown() {
    if (this.inactTimer) clearTimeout(this.inactTimer);
    document.removeEventListener('visibilitychange', this.visHandler);
    this.stopTimers();
  }
}
