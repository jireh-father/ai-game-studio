// game.js - GameScene: swipe detection, mirror logic, collision, movement

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.fx = new EffectsManager(this);
    this.hud = new HUD(this);
    this.hud.create();
    this.gameOver = false;
    this.paused = false;
    this.swipeStart = null;
    this.obstacleGfx = [];
    this.currentAxis = 'vertical';
    this.scrollProgress = 0;
    this.stageData = null;
    this.inactivityTimer = 0;
    this.warningShown = false;
    this.cameraZoom = 1.0;
    this.transitioning = false;
    this.pauseGroup = null;

    const playTop = HUD_HEIGHT + 5, playBot = GAME_HEIGHT - 5;
    this.mirrorY = playTop + (playBot - playTop) / 2;
    this.realAreaTop = playTop;
    this.realAreaBot = this.mirrorY - 2;
    this.reflAreaTop = this.mirrorY + 2;
    this.reflAreaBot = playBot;

    this.mirrorLine = this.add.rectangle(GAME_WIDTH/2, this.mirrorY, GAME_WIDTH, 3, PALETTE.mirror, 0.7).setDepth(10);
    this.tweens.add({ targets: this.mirrorLine, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
    this.add.rectangle(GAME_WIDTH/2, this.mirrorY, GAME_WIDTH, 12, PALETTE.mirrorGlow, 0.15).setDepth(9);

    const realY = this.realAreaTop + (this.realAreaBot - this.realAreaTop) / 2;
    const reflY = this.reflAreaTop + (this.reflAreaBot - this.reflAreaTop) / 2;
    this.realChar = this.add.image(GAME_WIDTH/2, realY, 'realChar').setDepth(20);
    this.reflChar = this.add.image(GAME_WIDTH/2, reflY, 'reflChar').setDepth(20);

    this.input.on('pointerdown', (ptr) => {
      if (this.gameOver || this.paused) return;
      this.swipeStart = { x: ptr.x, y: ptr.y };
      this.inactivityTimer = 0;
      this.warningShown = false;
    });
    this.input.on('pointerup', (ptr) => {
      if (this.gameOver || this.paused || !this.swipeStart || this.transitioning) return;
      const dx = ptr.x - this.swipeStart.x, dy = ptr.y - this.swipeStart.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      this.swipeStart = null;
      if (dist < SWIPE_MIN_DIST) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
      this.onSwipe(dir);
    });
    this.startStage(GameState.stage);
  }

  startStage(stageNum) {
    this.stageData = generateStage(stageNum);
    this.currentAxis = this.stageData.axis;
    this.scrollProgress = 0;
    this.obstacleGfx.forEach(o => { o.realWall.destroy(); o.reflWall.destroy(); });
    this.obstacleGfx = [];
    this.hud.updateStage(stageNum);
    this.stageData.obstacles.forEach(() => {
      this.obstacleGfx.push({
        realWall: this.add.graphics().setDepth(15),
        reflWall: this.add.graphics().setDepth(15),
        active: true
      });
    });
  }

  drawObstacle(gfx, gapX, gapW, y, h) {
    gfx.clear();
    gfx.fillStyle(PALETTE.obstacle, 1);
    gfx.lineStyle(1.5, PALETTE.obstacleEdge, 1);
    if (gapX > 0) { gfx.fillRect(0, y, gapX, h); gfx.strokeRect(0, y, gapX, h); }
    const rx = gapX + gapW;
    if (rx < GAME_WIDTH) { gfx.fillRect(rx, y, GAME_WIDTH - rx, h); gfx.strokeRect(rx, y, GAME_WIDTH - rx, h); }
    gfx.fillStyle(PALETTE.gapGlow, 0.15);
    gfx.fillRect(gapX, y, gapW, h);
  }

  onSwipe(dir) {
    const realDir = getMirroredDirection(dir, this.currentAxis);
    audioSynth.playSwipe(dir);
    const rv = dirToVec(dir), ev = dirToVec(realDir);
    // Move reflection
    this.fx.addTrail(this.reflChar);
    this.tweens.add({ targets: this.reflChar,
      x: Phaser.Math.Clamp(this.reflChar.x + rv.x * MOVE_DIST, 20, GAME_WIDTH - 20),
      y: Phaser.Math.Clamp(this.reflChar.y + rv.y * MOVE_DIST, this.reflAreaTop + 15, this.reflAreaBot - 15),
      duration: 80, ease: 'Quad.Out' });
    this.fx.scalePunch(this.reflChar, 1.15, 80);
    // Move real
    this.fx.addTrail(this.realChar);
    this.tweens.add({ targets: this.realChar,
      x: Phaser.Math.Clamp(this.realChar.x + ev.x * MOVE_DIST, 20, GAME_WIDTH - 20),
      y: Phaser.Math.Clamp(this.realChar.y + ev.y * MOVE_DIST, this.realAreaTop + 15, this.realAreaBot - 15),
      duration: 80, ease: 'Quad.Out' });
    this.fx.scalePunch(this.realChar, 1.15, 80);
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.transitioning) return;
    const dt = delta / 16.667, sd = this.stageData;
    if (!sd) return;

    this.inactivityTimer += delta;
    if (this.inactivityTimer >= INACTIVITY_WARN_MS && !this.warningShown) {
      this.warningShown = true;
      audioSynth.playWarning();
      this.fx.cameraFlash(PALETTE.dangerFlash, 200, 0.2);
    }
    if (this.inactivityTimer >= INACTIVITY_DEATH_MS) { this.onDeath(); return; }

    this.scrollProgress += sd.speed * dt;
    const wallH = 18;
    let allPassed = true;

    for (let i = 0; i < sd.obstacles.length; i++) {
      const obs = sd.obstacles[i], gfx = this.obstacleGfx[i];
      if (!gfx || !gfx.active) continue;
      const progress = this.scrollProgress - obs.offset;
      if (progress < -50) { allPassed = false; continue; }

      const realY = this.realAreaTop + progress * 0.7;
      const reflY = this.reflAreaBot - progress * 0.7 - wallH;
      this.drawObstacle(gfx.realWall, obs.realGapX, obs.gapWidth, realY, wallH);
      this.drawObstacle(gfx.reflWall, obs.reflGapX, obs.gapWidth, reflY, wallH);

      if (!obs.passed && realY > this.realChar.y - 5 && realY < this.realChar.y + 15) {
        if (this.checkHit(this.realChar.x, obs.realGapX, obs.gapWidth) ||
            this.checkHit(this.reflChar.x, obs.reflGapX, obs.gapWidth)) {
          this.onHit(this.realChar.x, this.realChar.y);
          obs.passed = true; continue;
        }
        obs.passed = true;
        this.onObstacleSurvived(obs);
      }
      if (realY > this.realAreaBot + 30 || reflY < this.realAreaTop - 30) {
        gfx.realWall.clear(); gfx.reflWall.clear(); gfx.active = false;
      } else { allPassed = false; }
    }
    if (allPassed || sd.obstacles.every(o => o.passed)) this.onStageClear();
    this.cameras.main.zoom = this.cameraZoom;
  }

  checkHit(bodyX, gapX, gapW) {
    const h = BODY_SIZE / 2;
    return bodyX - h < gapX || bodyX + h > gapX + gapW;
  }

  onObstacleSurvived(obs) {
    GameState.combo++;
    const mult = Math.min(COMBO_MULTIPLIER_CAP, 1 + GameState.combo * COMBO_MULTIPLIER_STEP);
    const rc = obs.realGapX + obs.gapWidth / 2, fc = obs.reflGapX + obs.gapWidth / 2;
    const isPerfect = Math.abs(this.realChar.x - rc) < 10 && Math.abs(this.reflChar.x - fc) < 10;
    const pts = Math.floor((isPerfect ? SCORE.PERFECT_CENTER : SCORE.OBSTACLE_SURVIVED) * mult);
    GameState.score += pts;
    if (obs.rotateHere) {
      GameState.score += SCORE.ROTATION_SURVIVED;
      this.fx.floatingText(GAME_WIDTH/2, GAME_HEIGHT/2, '+200 ROTATION', PALETTE.mirrorHex, 22);
    }
    this.hud.updateScore(GameState.score);
    this.hud.updateCombo(GameState.combo);
    this.fx.floatingText(this.reflChar.x, this.reflChar.y - 20,
      isPerfect ? `+${pts} PERFECT!` : `+${pts}`, isPerfect ? PALETTE.mirrorHex : PALETTE.uiText, isPerfect ? 22 : 18);
    this.fx.surviveEffect(this.reflChar.x, this.reflChar.y, GameState.combo, isPerfect);
    this.cameraZoom = Math.min(1.04, 1.0 + GameState.combo * 0.003);
    if (obs.rotateHere && obs.axis !== this.currentAxis) this.doMirrorRotation(obs.axis);
  }

  doMirrorRotation(newAxis) {
    this.transitioning = true;
    this.currentAxis = newAxis;
    this.fx.mirrorRotateEffect();
    this.fx.scalePunch(this.realChar, 0.9, 200);
    this.fx.scalePunch(this.reflChar, 0.9, 200);
    setTimeout(() => { this.transitioning = false; }, 400);
  }

  onHit(x, y) {
    GameState.lives--; GameState.combo = 0; GameState.stageDamaged = true;
    this.cameraZoom = 1.0;
    this.hud.updateLives(GameState.lives); this.hud.updateCombo(0);
    if (GameState.lives <= 0) { this.onDeath(); return; }
    this.fx.hitEffect(x, y);
    this.realChar.x = GAME_WIDTH / 2;
    this.reflChar.x = GAME_WIDTH / 2;
  }

  onDeath() {
    if (this.gameOver) return;
    this.gameOver = true; GameState.lives = 0;
    this.hud.updateLives(0);
    this.fx.deathEffect(this.realChar.x, this.realChar.y);
    this.fx.deathEffect(this.reflChar.x, this.reflChar.y);
    setTimeout(() => { this.scene.start('GameOverScene'); }, 600);
  }

  onStageClear() {
    this.transitioning = true;
    let bonus = SCORE.STAGE_CLEAR + GameState.combo * 50;
    if (!GameState.stageDamaged) bonus += SCORE.NO_DAMAGE_CLEAR;
    GameState.score += bonus;
    this.hud.updateScore(GameState.score);
    this.fx.floatingText(GAME_WIDTH/2, GAME_HEIGHT/2 - 30,
      (GameState.stageDamaged ? 'STAGE CLEAR' : 'PERFECT CLEAR') + ` +${bonus}`, PALETTE.mirrorHex, 22);
    this.fx.stageClearEffect(this.mirrorLine);
    GameState.stage++; GameState.stageDamaged = false; this.cameraZoom = 1.0;
    setTimeout(() => { this.transitioning = false; this.startStage(GameState.stage); }, 800);
  }

  pauseGame() {
    if (this.gameOver) return;
    this.paused = true;
    const cx = GAME_WIDTH / 2;
    this.pauseGroup = this.add.group();
    const els = [];
    els.push(this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(200));
    els.push(this.add.text(cx, 200, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.uiText }).setOrigin(0.5).setDepth(201));
    const mkBtn = (y, w, h, col, a, label, sz, fc) => {
      const b = this.add.rectangle(cx, y, w, h, col, a).setInteractive().setDepth(201);
      const t = this.add.text(cx, y, label, { fontSize: sz, fontFamily: 'Arial', fontStyle: 'bold', fill: fc }).setOrigin(0.5).setDepth(202);
      t.disableInteractive(); els.push(b, t); return b;
    };
    mkBtn(300, 200, 50, PALETTE.mirror, 0.9, 'RESUME', '18px', PALETTE.bgHex).on('pointerdown', () => this.hidePause());
    mkBtn(370, 200, 50, PALETTE.obstacle, 0.8, 'RESTART', '18px', PALETTE.uiText).on('pointerdown', () => { this.hidePause(); resetGameState(); this.scene.restart(); });
    mkBtn(440, 200, 50, PALETTE.obstacle, 0.6, 'MENU', '18px', PALETTE.uiText).on('pointerdown', () => { this.hidePause(); this.scene.start('MenuScene'); });
    const hb = this.add.text(cx, 510, '? How to Play', { fontSize: '16px', fontFamily: 'Arial', fill: PALETTE.mirrorHex }).setOrigin(0.5).setDepth(201).setInteractive();
    hb.on('pointerdown', () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
    els.push(hb);
    els.forEach(e => this.pauseGroup.add(e));
  }

  hidePause() {
    this.paused = false;
    if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
  }
}
