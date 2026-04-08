class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    AudioFX.init();
    const W = 360, H = 720;
    this.W = W; this.H = H;
    this.score = 0;
    this.stage = 1;
    this.strikes = 3;
    this.combo = 0;
    this.gameOver = false;
    this.paused = false;
    this.activePeg = 1; // center default
    this.pegStacks = [[], [], []];
    this.discs = []; // active falling discs
    this.sequence = [];
    this.seqIndex = 0;
    this.stageDiscsPlaced = 0;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.adUsed = false;

    // background
    this.add.rectangle(W/2, H/2, W, H, 0x1A0F00);

    // Peg visuals (graphics)
    this.pegGfx = this.add.graphics().setDepth(5);
    this.activeRings = [];
    for (let i = 0; i < 3; i++) {
      const ring = this.add.ellipse(PEG_X[i], PEG_Y + 25, 60, 16, 0xFFD700, 0).setDepth(6);
      this.activeRings.push(ring);
    }
    this.drawPegs();

    // Priests
    this.priests = [];
    for (let i = 0; i < 3; i++) {
      const p = this.add.graphics().setDepth(4);
      this.drawPriest(p, PEG_X[i], 80);
      this.priests.push({ gfx: p, x: PEG_X[i], y: 80 });
    }

    // Ground
    this.groundY = 640;
    this.groundRect = this.add.rectangle(W/2, this.groundY + 15, W, 30, 0x2C1A0A).setDepth(3);

    // HUD
    this.createHUD();

    // Peg tap zones
    for (let i = 0; i < 3; i++) {
      const zone = this.add.zone(PEG_X[i], 400, 110, 520).setInteractive();
      zone.on('pointerdown', () => this.onPegTap(i));
    }

    this.setActivePeg(1);
    this.loadStage(1);

    // Pause button
    const pb = this.add.rectangle(330, 20, 40, 30, 0x2C1A0A).setStrokeStyle(1, 0xFFD700).setDepth(20).setInteractive({ useHandCursor: true });
    this.add.text(330, 20, 'II', { fontSize: '14px', color: '#FFD700', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(21);
    pb.on('pointerdown', () => this.togglePause());

    // Mix in effect methods
    Object.assign(GameScene.prototype, GameEffects);

    this.events.once('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
    });
  }

  drawPegs() {
    this.pegGfx.clear();
    for (let i = 0; i < 3; i++) {
      const x = PEG_X[i];
      this.pegGfx.fillStyle(0xC8A96E, 1);
      this.pegGfx.fillRect(x - 2, 400, 4, 210);
      this.pegGfx.fillStyle(0x5C2E0A, 1);
      this.pegGfx.fillRect(x - 30, 605, 60, 12);
      // Draw stacked discs
      const stack = this.pegStacks[i];
      for (let s = 0; s < stack.length; s++) {
        const size = stack[s];
        const w = DISC_WIDTHS[size];
        const y = 605 - (s + 1) * 14;
        this.pegGfx.fillStyle(0xC8A96E, 1);
        this.pegGfx.fillRoundedRect(x - w/2, y, w, 12, 5);
        this.pegGfx.lineStyle(1, 0x5C2E0A, 1);
        this.pegGfx.strokeRoundedRect(x - w/2, y, w, 12, 5);
      }
    }
  }

  drawPriest(g, x, y) {
    g.clear();
    g.fillStyle(0x8B0000, 1);
    g.fillTriangle(x, y - 15, x - 12, y + 20, x + 12, y + 20);
    g.fillStyle(0xD4A96A, 1);
    g.fillCircle(x, y - 18, 7);
    g.lineStyle(2, 0x5C2E0A, 1);
    g.lineBetween(x + 12, y - 10, x + 16, y + 20);
    g.fillStyle(0xFFD700, 1);
    g.fillCircle(x + 16, y - 12, 3);
  }

  createHUD() {
    this.strikeText = this.add.text(10, 10, 'LIVES: ' + this.strikes, {
      fontSize: '14px', color: '#FF2222', fontFamily: 'monospace', fontStyle: 'bold'
    }).setDepth(20);
    this.stageText = this.add.text(180, 10, 'STAGE ' + this.stage, {
      fontSize: '14px', color: '#F5E6C8', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(20);
    this.scoreText = this.add.text(350, 10, 'SCORE: ' + this.score, {
      fontSize: '14px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(20);
  }

  updateHUD() {
    this.strikeText.setText('LIVES: ' + this.strikes);
    this.stageText.setText('STAGE ' + this.stage);
    this.scoreText.setText('SCORE: ' + this.score);
    this.tweens.add({ targets: this.scoreText, scale: 1.25, duration: 100, yoyo: true });
  }

  loadStage(n) {
    this.stage = n;
    this.stageTransitioning = false;
    this.pegStacks = [[], [], []];
    this.drawPegs();
    this.sequence = generateDiscSequence(n);
    this.seqIndex = 0;
    this.stageDiscsPlaced = 0;
    this.params = getStageParams(n);
    this.updateHUD();
    // Spawn first disc soon
    this.time.delayedCall(500, () => this.spawnNextDisc());
  }

  spawnNextDisc() {
    if (this.gameOver || this.paused) return;
    if (this.seqIndex >= this.sequence.length) return;
    const size = this.sequence[this.seqIndex++];
    const w = DISC_WIDTHS[size];
    const startX = 180;
    const startY = 130;
    const disc = this.add.graphics().setDepth(10);
    disc.fillStyle(0xC8A96E, 1);
    disc.fillRoundedRect(-w/2, -7, w, 14, 5);
    disc.lineStyle(2, 0x5C2E0A, 1);
    disc.strokeRoundedRect(-w/2, -7, w, 14, 5);
    disc.x = startX; disc.y = startY;
    // size number label
    const label = this.add.text(startX, startY, '' + size, {
      fontSize: '12px', color: '#5C2E0A', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    const discObj = {
      gfx: disc, label: label, size: size, w: w,
      vx: 0, vy: 0, landed: false, redirectUsed: false,
      lastTap: 0, spawnTime: Date.now()
    };
    // Interactive zone on disc for double-tap redirect
    const zone = this.add.zone(startX, startY, Math.max(w, 60), 40).setInteractive();
    zone.on('pointerdown', () => this.onDiscTap(discObj));
    discObj.zone = zone;

    this.discs.push(discObj);

    // Warning pulse
    this.tweens.add({ targets: disc, scale: 1.15, duration: 150, yoyo: true, repeat: 1 });

    // After warning, start falling
    this.time.delayedCall(300, () => { discObj.falling = true; });

    // Schedule next disc if simultaneous allows
    if (this.seqIndex < this.sequence.length) {
      const delay = Math.max(1500 - (this.stage - 1) * 80, 600);
      this.time.delayedCall(delay, () => {
        if (this.discs.filter(d => !d.landed).length < this.params.simultaneous) {
          this.spawnNextDisc();
        } else {
          // try again shortly
          this.time.delayedCall(400, () => this.spawnNextDisc());
        }
      });
    }
  }

  onPegTap(i) {
    if (this.gameOver || this.paused) return;
    AudioFX.click();
    this.lastInputTime = Date.now();
    this.setActivePeg(i);
    this.spawnParticles(PEG_X[i], PEG_Y + 30, 6, 0xFFD700, 20, 50);
  }

  setActivePeg(i) {
    this.activePeg = i;
    for (let k = 0; k < 3; k++) {
      this.tweens.killTweensOf(this.activeRings[k]);
      if (k === i) {
        this.activeRings[k].setAlpha(1);
        this.tweens.add({ targets: this.activeRings[k], alpha: 0.5, duration: 300, yoyo: true, repeat: -1 });
      } else {
        this.activeRings[k].setAlpha(0);
      }
    }
  }

  onDiscTap(disc) {
    if (this.gameOver || this.paused || disc.landed) return;
    const now = Date.now();
    if (now - disc.lastTap < 350 && !disc.redirectUsed) {
      // double tap — redirect to next peg clockwise
      disc.redirectUsed = true;
      const next = (this.activePeg + 1) % 3;
      this.setActivePeg(next);
      AudioFX.whoosh();
      this.floatText(disc.gfx.x, disc.gfx.y, 'REDIRECT', '#FFD700', 16);
      this.score += SCORE.redirect;
      this.updateHUD();
    }
    disc.lastTap = now;
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;

    // Idle death
    if (Date.now() - this.lastInputTime > 30000) {
      this.triggerIdleDeath();
      return;
    }

    // Move discs
    for (let i = this.discs.length - 1; i >= 0; i--) {
      const d = this.discs[i];
      if (d.landed || !d.falling) continue;
      // Steer toward active peg
      const targetX = PEG_X[this.activePeg];
      const dx = targetX - d.gfx.x;
      d.vx += dx * 0.5 * dt;
      d.vx *= 0.92;
      d.vy = this.params.fallSpeed;
      d.gfx.x += d.vx;
      d.gfx.y += d.vy * dt;
      d.label.x = d.gfx.x;
      d.label.y = d.gfx.y;
      if (d.zone) { d.zone.x = d.gfx.x; d.zone.y = d.gfx.y; }

      // Check landing: if disc reaches top of active peg stack
      const pegIdx = this.closestPeg(d.gfx.x);
      const stackHeight = this.pegStacks[pegIdx].length;
      const landY = 605 - (stackHeight + 1) * 14 + 6;
      if (d.gfx.y >= landY && Math.abs(d.gfx.x - PEG_X[pegIdx]) < 40) {
        d.landed = true;
        this.resolveLanding(d, pegIdx);
      } else if (d.gfx.y >= this.groundY) {
        // Missed — counts as strike
        d.landed = true;
        this.onDiscMissed(d);
      }
    }
  }

  closestPeg(x) {
    let best = 0, bestD = 999;
    for (let i = 0; i < 3; i++) {
      const d = Math.abs(PEG_X[i] - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  resolveLanding(disc, pegIdx) {
    const legal = isLegalPlacement(disc.size, this.pegStacks[pegIdx]);
    if (legal) {
      this.pegStacks[pegIdx].push(disc.size);
      this.drawPegs();
      AudioFX.thunk();
      this.hitStop(60);
      this.cameras.main.shake(80, 0.003);
      this.spawnParticles(disc.gfx.x, disc.gfx.y, 8, 0xC8A96E, 30, 80);
      let gained = SCORE.catch;
      // combo
      if (!disc.redirectUsed) {
        this.combo++;
        if (this.combo >= 3) {
          gained += 50 * (this.combo - 2);
          this.floatText(180, 250, 'PERFECT x' + this.combo, '#4CAF50', 22);
          AudioFX.perfect();
        }
      } else {
        this.combo = 0;
      }
      this.score += gained;
      this.floatText(disc.gfx.x, disc.gfx.y - 20, '+' + gained, '#FFD700', 18);
      this.updateHUD();
      this.stageDiscsPlaced++;
      // cleanup
      this.time.delayedCall(50, () => {
        disc.gfx.destroy(); disc.label.destroy(); if (disc.zone) disc.zone.destroy();
        this.discs = this.discs.filter(x => x !== disc);
      });
      if (this.stageDiscsPlaced >= this.sequence.length && !this.stageTransitioning) {
        this.stageTransitioning = true;
        this.time.delayedCall(700, () => this.completeStage());
      }
    } else {
      this.triggerSmite(disc, pegIdx);
    }
  }

  triggerSmite(disc, pegIdx) {
    this.combo = 0;
    this.strikes--;
    AudioFX.smite();
    this.cameras.main.shake(400, 0.012);
    this.flashRed();
    // Bolt visual
    const bolt = this.add.rectangle(PEG_X[pegIdx], 80, 6, 100, 0xFFD700).setDepth(50);
    this.tweens.add({ targets: bolt, y: disc.gfx.y, alpha: 0, duration: 400, onComplete: () => bolt.destroy() });
    this.floatText(disc.gfx.x, disc.gfx.y, 'SMITE!', '#FF2222', 24);
    this.time.delayedCall(50, () => {
      disc.gfx.destroy(); disc.label.destroy(); if (disc.zone) disc.zone.destroy();
      this.discs = this.discs.filter(x => x !== disc);
    });
    this.updateHUD();
    if (this.strikes <= 0) {
      this.time.delayedCall(400, () => this.triggerGameOver('SMITED BY THE PRIEST'));
    }
  }

  onDiscMissed(disc) {
    this.combo = 0;
    this.strikes--;
    AudioFX.smite();
    this.cameras.main.shake(250, 0.008);
    this.floatText(disc.gfx.x, disc.gfx.y, 'MISS!', '#FF2222', 22);
    this.time.delayedCall(50, () => {
      disc.gfx.destroy(); disc.label.destroy(); if (disc.zone) disc.zone.destroy();
      this.discs = this.discs.filter(x => x !== disc);
    });
    this.updateHUD();
    if (this.strikes <= 0) {
      this.time.delayedCall(400, () => this.triggerGameOver('THE DISCS HIT THE FLOOR'));
    }
  }

  completeStage() {
    const bonus = SCORE.stageClear * this.stage;
    this.score += bonus;
    this.floatText(180, 360, 'STAGE CLEAR +' + bonus, '#4CAF50', 26);
    AudioFX.bell();
    this.spawnParticles(PEG_X[2], PEG_Y, 16, 0xFFD700, 50, 150);
    this.cameras.main.shake(200, 0.006);
    this.updateHUD();
    // Clear any remaining discs
    this.discs.forEach(d => {
      d.gfx.destroy(); d.label.destroy(); if (d.zone) d.zone.destroy();
    });
    this.discs = [];
    this.time.delayedCall(1200, () => this.loadStage(this.stage + 1));
  }

  triggerIdleDeath() {
    this.gameOver = true;
    AudioFX.gameOver();
    this.cameras.main.shake(700, 0.02);
    this.floatText(180, 360, 'TOWER FELL', '#FF2222', 36);
    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage,
        reason: 'THE PRIEST SAW EVERYTHING'
      });
    });
  }

  triggerGameOver(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    AudioFX.gameOver();
    this.cameras.main.shake(700, 0.02);
    this.floatText(180, 360, 'SMITED', '#FF2222', 40);
    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage, reason: reason
      });
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseOverlay = this.add.rectangle(180, 360, 360, 720, 0x000000, 0.7).setDepth(100);
      this.pauseText = this.add.text(180, 280, 'PAUSED', { fontSize: '40px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(101);
      const resume = this.add.rectangle(180, 360, 180, 50, 0xC8A96E).setStrokeStyle(2, 0xFFD700).setDepth(101).setInteractive({ useHandCursor: true });
      const resumeT = this.add.text(180, 360, 'RESUME', { fontSize: '20px', color: '#5C2E0A', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
      const help = this.add.rectangle(180, 425, 180, 50, 0x2C1A0A).setStrokeStyle(2, 0xFFD700).setDepth(101).setInteractive({ useHandCursor: true });
      const helpT = this.add.text(180, 425, 'HELP', { fontSize: '20px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
      const menu = this.add.rectangle(180, 490, 180, 50, 0x2C1A0A).setStrokeStyle(2, 0xC8A96E).setDepth(101).setInteractive({ useHandCursor: true });
      const menuT = this.add.text(180, 490, 'MENU', { fontSize: '20px', color: '#F5E6C8', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(102);
      this.pauseUI = [this.pauseOverlay, this.pauseText, resume, resumeT, help, helpT, menu, menuT];
      resume.on('pointerdown', () => this.togglePause());
      help.on('pointerdown', () => {
        this.clearPauseUI();
        this.scene.pause();
        this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      });
      menu.on('pointerdown', () => {
        this.scene.stop();
        this.scene.start('MenuScene');
      });
    } else {
      this.clearPauseUI();
    }
  }

  clearPauseUI() {
    if (this.pauseUI) { this.pauseUI.forEach(o => o && o.destroy()); this.pauseUI = null; }
  }
}
