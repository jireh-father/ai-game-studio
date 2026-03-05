// game.js - GameScene: core loop, runner, obstacles, scoring, input

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.gameW = w; this.gameH = h;
    this.groundY = Math.floor(h * GROUND_HEIGHT_RATIO);
    this.runnerBaseX = Math.floor(w * RUNNER_X_RATIO);
    this.score = 0; this.stage = 1; this.lives = LIVES_MAX;
    this.combo = 0; this.bestCombo = 0; this.stageStumbles = 0;
    this.obstacles = []; this.worldX = 0;
    this.gameOver = false; this.paused = false;
    this.lastTapTime = Date.now(); this.inactivityTimer = 0;
    this.moveLocked = false; this.trailTimer = 0;
    this.trailCount = 0;

    // Background & ground
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG).setScrollFactor(0);
    this.add.rectangle(w / 2, this.groundY + 40, w, 80, COLORS.GROUND).setScrollFactor(0).setDepth(1);
    this.groundMarkers = [];
    for (let i = 0; i < 20; i++) {
      this.groundMarkers.push(this.add.rectangle(i * 40, this.groundY, 2, 6, 0x3A6A8A).setDepth(2).setOrigin(0, 0.5));
    }

    // Runner
    this.runner = this.add.image(this.runnerBaseX, this.groundY - 24, 'runner')
      .setScale(1.4).setDepth(50).setOrigin(0.5, 1);
    this.tweens.add({ targets: this.runner, y: this.groundY - 27, duration: 250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.spawnStage();
    this.input.on('pointerdown', (p) => {
      if (this.gameOver || this.paused || this.moveLocked) return;
      SFX.resume(); this.handleTap();
    });
    this.scene.launch('UIScene');
    this.scale.on('resize', (gs) => {
      this.gameW = gs.width; this.gameH = gs.height;
      this.groundY = Math.floor(gs.height * GROUND_HEIGHT_RATIO);
      this.runnerBaseX = Math.floor(gs.width * RUNNER_X_RATIO);
    });
  }

  spawnStage() {
    const data = generateStage(this.stage);
    const params = getDifficultyParams(this.stage);
    let xOff = this.worldX + this.gameW + 100;
    data.forEach((obs) => {
      xOff += obs.spacing * params.speed;
      const key = obs.type === 'wall' ? 'wall' : obs.type === 'bar' ? 'bar' : 'gap';
      const sp = this.add.image(xOff, this.groundY, key).setDepth(10).setOrigin(0.5, 1);
      if (obs.type === 'bar') { sp.setScale(1.2).setOrigin(0.5, 0.5); sp.y = this.groundY - 36; }
      if (obs.type === 'gap') { sp.setScale(1.5).setOrigin(0.5, 0.5); sp.y = this.groundY + 2; }
      const glow = this.add.circle(xOff, this.groundY - 24, 30, 0xFFFFFF, 0.15).setDepth(5);
      this.tweens.add({ targets: glow, alpha: 0.05, duration: 400, yoyo: true, repeat: -1 });
      this.obstacles.push({ sprite: sp, glow, type: obs.type, worldX: xOff, timingWindow: obs.timingWindow, cleared: false, missed: false });
    });
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = delta / 1000;
    const params = getDifficultyParams(this.stage);
    const speed = params.speed;
    this.worldX += speed * dt;

    // Scroll obstacles
    this.obstacles.forEach(o => { o.sprite.x = o.worldX - this.worldX + this.runnerBaseX; o.glow.x = o.sprite.x; });
    // Scroll ground markers
    this.groundMarkers.forEach(m => { m.x -= speed * dt; if (m.x < -40) m.x += 800; });

    // Ghost trails
    this.trailTimer += delta;
    if (this.trailTimer > 60) {
      this.trailTimer = 0;
      const maxT = Math.min(8, 3 + Math.floor(this.combo / 10));
      if (this.trailCount < maxT) {
        this.trailCount++;
        Effects.spawnGhostTrail(this, this.runner, this.combo);
        setTimeout(() => { this.trailCount = Math.max(0, this.trailCount - 1); }, 210);
      }
    }

    this.checkMissed();
    this.checkInactivity(dt);
    this.cleanup();
    this.checkStageComplete();
  }

  checkMissed() {
    const hitX = this.runnerBaseX + 20;
    this.obstacles.forEach(o => {
      if (!o.cleared && !o.missed && o.sprite.x < hitX - 30) {
        o.missed = true; this.doCrash(o);
      }
    });
  }

  checkInactivity(dt) {
    const hasNear = this.obstacles.some(o => !o.cleared && !o.missed && o.sprite.x > this.runnerBaseX - 20 && o.sprite.x < this.runnerBaseX + 200);
    if (hasNear) {
      this.inactivityTimer += dt * 1000;
      if (this.inactivityTimer >= INACTIVITY_TIMEOUT) {
        const n = this.getNearest();
        if (n && !n.cleared && !n.missed) { n.missed = true; this.doCrash(n); }
        this.inactivityTimer = 0;
      }
    } else {
      if (Date.now() - this.lastTapTime > 5000 && !this.gameOver) {
        const n = this.getNearest();
        if (n && !n.cleared && !n.missed) { n.missed = true; this.doCrash(n); this.lastTapTime = Date.now(); }
      }
    }
  }

  getNearest() {
    let best = null, dist = Infinity;
    this.obstacles.forEach(o => { if (o.cleared || o.missed) return; const d = Math.abs(o.sprite.x - this.runnerBaseX); if (d < dist) { dist = d; best = o; } });
    return best;
  }

  handleTap() {
    this.lastTapTime = Date.now(); this.inactivityTimer = 0;
    const n = this.getNearest();
    if (!n || Math.abs(n.sprite.x - this.runnerBaseX) > 220) { this.doStumble(); return; }
    const dist = n.sprite.x - this.runnerBaseX;
    const params = getDifficultyParams(this.stage);
    const pxWin = params.timingWindow * params.speed / 1000;
    if (Math.abs(dist) <= pxWin) {
      n.cleared = true;
      this.doMove(n, Math.abs(dist) <= pxWin * SCORING.PERFECT_THRESHOLD);
    } else { this.doStumble(); }
  }

  doMove(obs, perfect) {
    this.moveLocked = true;
    const pts = perfect ? SCORING.PERFECT_POINTS : SCORING.GOOD_POINTS;
    this.combo += perfect ? 2 : 1;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    const mult = Math.min(5, 1 + Math.floor(this.combo / 5) * 0.5);
    const earned = Math.floor(pts * mult);
    this.score += earned;
    this.events.emit('score-update', this.score);
    this.events.emit('combo-update', this.combo);
    const pm = 1 + this.combo * 0.03;
    SFX.play(perfect ? 'perfect' : 'good', pm);
    Effects.scalePunch(this.runner, 1.2, 100);
    Effects.screenShake(this, 2 + Math.min(4, this.combo * 0.5), 80);
    if (perfect) { Effects.cameraZoom(this, 1.03, 100); this.events.emit('show-perfect', obs.sprite.x, obs.sprite.y); }
    const ox = obs.sprite.x, oy = obs.sprite.y;
    Effects.floatingText(this, '+' + earned, ox, oy - 40, perfect ? COLORS_HEX.COMBO_GLOW : '#FFF', perfect ? 24 : 18);
    if (obs.type === 'wall') Effects.animateVault(this, this.runner, this.runner.y);
    else if (obs.type === 'bar') Effects.animateSlide(this, this.runner);
    else Effects.animateWallJump(this, this.runner, this.groundY);
    if (perfect) { this.scene.pause('GameScene'); setTimeout(() => { if (this.scene.isPaused('GameScene') && !this.paused) this.scene.resume('GameScene'); }, 40); }
    if (this.combo > 0 && this.combo % 5 === 0) { SFX.play('combo', pm); Effects.whiteFlash(this); }
    Effects.fadeObstacle(this, obs);
    setTimeout(() => { this.moveLocked = false; }, 150);
  }

  doStumble() {
    this.lives--; this.combo = 0; this.stageStumbles++;
    this.events.emit('life-change', this.lives);
    this.events.emit('combo-update', 0);
    SFX.play('stumble');
    Effects.screenShake(this, 4, 150);
    Effects.redFlash(this);
    Effects.wobbleRunner(this, this.runner, this.runnerBaseX);
    if (this.lives <= 0) this.endGame();
  }

  doCrash(obs) {
    this.lives--; this.combo = 0; this.stageStumbles++;
    this.events.emit('life-change', this.lives);
    this.events.emit('combo-update', 0);
    SFX.play('crash');
    Effects.screenShake(this, 10, 300);
    Effects.redFlash(this);
    Effects.squashRunner(this, this.runner);
    Effects.fadeObstacle(this, obs);
    if (this.lives <= 0) this.endGame();
  }

  endGame() {
    this.gameOver = true; SFX.play('gameOver');
    const gp = parseInt(localStorage.getItem('parkour-tap_games_played') || '0') + 1;
    localStorage.setItem('parkour-tap_games_played', gp);
    const hs = parseInt(localStorage.getItem('parkour-tap_highest_stage') || '0');
    if (this.stage > hs) localStorage.setItem('parkour-tap_highest_stage', this.stage);
    const bc = parseInt(localStorage.getItem('parkour-tap_best_combo') || '0');
    if (this.bestCombo > bc) localStorage.setItem('parkour-tap_best_combo', this.bestCombo);
    setTimeout(() => {
      this.scene.stop('UIScene');
      this.scene.launch('GameOverScene', { score: this.score, stage: this.stage, bestCombo: this.bestCombo, fromDeath: true });
    }, 600);
  }

  continueAfterAd() {
    this.lives = 1; this.gameOver = false;
    this.events.emit('life-change', this.lives);
    this.scene.launch('UIScene');
  }

  pauseGame() {
    if (this.gameOver) return;
    this.paused = true; this.scene.pause();
    this.showPause();
  }

  showPause() {
    const w = this.gameW, h = this.gameH;
    const ui = this.scene.get('UIScene'); if (!ui) return;
    const bg = ui.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(200);
    const title = ui.add.text(w / 2, h * 0.25, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(201);
    const els = [bg, title];
    const btn = (y, label, cb) => {
      const b = ui.add.rectangle(w / 2, y, 180, 44, COLORS.RUNNER).setInteractive({ useHandCursor: true }).setDepth(201);
      const t = ui.add.text(w / 2, y, label, { fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5).setDepth(201);
      t.disableInteractive(); b.on('pointerdown', () => { els.forEach(e => e.destroy()); cb(); }); els.push(b, t);
    };
    btn(h * 0.42, 'RESUME', () => { this.paused = false; this.scene.resume('GameScene'); });
    btn(h * 0.54, 'RESTART', () => { this.paused = false; this.scene.stop('UIScene'); this.scene.stop('GameScene'); this.scene.start('GameScene'); });
    btn(h * 0.66, 'HELP', () => { ui.scene.launch('HelpScene', { returnTo: 'UIScene' }); });
    btn(h * 0.78, 'MENU', () => { this.paused = false; this.scene.stop('UIScene'); this.scene.stop('GameScene'); this.scene.start('MenuScene'); });
  }

  cleanup() {
    this.obstacles = this.obstacles.filter(o => {
      if (o.sprite.x < -100) { o.sprite.destroy(); o.glow.destroy(); return false; } return true;
    });
  }

  checkStageComplete() {
    if (this.obstacles.length === 0) return;
    const done = this.obstacles.every(o => o.cleared || o.missed || o.sprite.x < -50);
    if (!done) return;
    const bonus = this.stageStumbles === 0 ? SCORING.STAGE_CLEAR * 2 : SCORING.STAGE_CLEAR;
    this.score += bonus;
    this.events.emit('score-update', this.score);
    SFX.play('stageClear'); Effects.whiteFlash(this);
    Effects.floatingText(this, 'STAGE ' + this.stage + ' CLEAR!', this.gameW / 2, this.gameH * 0.4, COLORS_HEX.RUNNER, 28);
    if (this.stageStumbles === 0) Effects.floatingText(this, 'PERFECT STAGE! x2', this.gameW / 2, this.gameH * 0.48, COLORS_HEX.COMBO_GLOW, 22);
    this.stage++; this.stageStumbles = 0;
    this.events.emit('stage-clear', this.stage);
    this.obstacles = []; this.spawnStage();
  }
}
