// game.js - GameScene: core gameplay, input, law system, explosions
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.bg = this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);
    GameState.score = 0; GameState.explosions = 0; GameState.combo = 0;
    GameState.stage = 1; GameState.bestCombo = 0;
    this.shapesPlacedThisLaw = 0; this.staging = []; this.zonesData = [];
    this.paused = false; this.gameOver = false; this.lawChanging = false;
    this.inputBuffer = null; this.usedContinue = false;
    this.diff = getDifficulty(1); this.maxStaging = getMaxStaging(1);
    this.zoneTop = 80; this.zoneH = 400;
    this.buildZones(this.diff.zoneCount);
    this.stagingBg = this.add.rectangle(W / 2, 610, W, 180, 0x2D2D44).setDepth(1);
    this.stagingBorder = this.add.rectangle(W / 2, 610, W - 4, 176, 0x000000, 0).setStrokeStyle(2, 0x555555).setDepth(1);
    this.skulls = [];
    for (let i = 0; i < MAX_EXPLOSIONS; i++) this.skulls.push(this.add.image(50 + i * 55, 500, 'skull').setScale(0.9).setDepth(10));
    this.lawText = this.add.text(W / 2, 25, '', { fontSize: '15px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold', align: 'center', wordWrap: { width: W - 20 } }).setOrigin(0.5).setDepth(10);
    this.nextLawText = this.add.text(W / 2, 58, '', { fontSize: '12px', fontFamily: 'Arial', fill: COLORS.NEXT_LAW, align: 'center', wordWrap: { width: W - 20 } }).setOrigin(0.5).setDepth(10);
    this.scoreText = this.add.text(10, 710, `Score: ${GameState.score}`, { fontSize: '16px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setDepth(10);
    this.bestText = this.add.text(W - 10, 710, `Best: ${GameState.highScore}`, { fontSize: '14px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(1, 0).setDepth(10);
    this.stageText = this.add.text(W - 10, 745, `Law #${GameState.stage}`, { fontSize: '14px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(1, 0).setDepth(10);
    const pauseBtn = this.add.rectangle(35, 750, 44, 44, 0x333355).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(35, 750, '||', { fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11);
    pauseBtn.on('pointerdown', () => { if (!this.gameOver) { this.paused = true; this.scene.pause(); this.scene.launch('PauseScene'); }});
    this.currentLaw = generateLaw(GameState.stage, this.diff.zoneCount, null);
    this.nextLaw = generateLaw(GameState.stage + 1, getDifficulty(GameState.stage + 1).zoneCount, this.currentLaw);
    this.updateLawDisplay();
    this.swipeStart = null;
    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.on('pointerup', (p) => this.onPointerUp(p));
    this.lastInputTime = this.time.now; this.inactivityActive = false;
    this.spawnTimer = this.time.addEvent({ delay: this.diff.spawnInterval, callback: () => this.spawnShape(), loop: true });
    this.spawnShape();
    this.visHandler = () => { if (document.hidden && !this.paused && !this.gameOver) { this.paused = true; this.scene.pause(); this.scene.launch('PauseScene'); }};
    document.addEventListener('visibilitychange', this.visHandler);
  }

  buildZones(count) {
    if (this.zoneRects) this.zoneRects.forEach(r => r.destroy());
    if (this.zoneLabels) this.zoneLabels.forEach(l => l.destroy());
    this.zoneRects = []; this.zoneLabels = [];
    const layout = getZoneLayout(count, GAME_WIDTH, this.zoneTop, this.zoneH);
    const oldShapes = this.zonesData.flatMap(z => z.shapes || []);
    this.zonesData = [];
    for (let i = 0; i < layout.length; i++) {
      const z = layout[i], color = Phaser.Display.Color.HexStringToColor(ZONE_COLORS[i]).color;
      const rect = this.add.rectangle(z.x + z.w / 2, z.y + z.h / 2, z.w - 2, z.h - 2, color, 0.15).setStrokeStyle(2, 0xFFFFFF).setDepth(2).setInteractive();
      rect.on('pointerdown', () => this.onTapZone(i));
      this.zoneRects.push(rect);
      const label = this.add.text(z.x + z.w / 2, z.y + 14, getZoneName(i, count), { fontSize: '12px', fontFamily: 'Arial', fill: '#FFFFFF88' }).setOrigin(0.5).setDepth(3);
      this.zoneLabels.push(label);
      this.zonesData.push({ ...z, shapes: [], rect, idx: i });
    }
    oldShapes.forEach(s => { const zi = Math.min(s.zoneIdx || 0, this.zonesData.length - 1); this.zonesData[zi].shapes.push(s); s.zoneIdx = zi; });
  }

  updateLawDisplay() { this.lawText.setText(this.currentLaw.text); this.nextLawText.setText('NEXT: ' + this.nextLaw.text); }

  spawnShape() {
    if (this.paused || this.gameOver) return;
    if (this.staging.length >= this.maxStaging) { this.overflowShape(); return; }
    const props = generateShapeProps(GameState.stage);
    const texKey = `${props.type.toLowerCase()}_${props.color}_${props.pattern}`;
    const img = this.add.image(GAME_WIDTH / 2, 610, texKey).setScale(props.sizeScale * 0.85).setDepth(20);
    img.props = props; img.zoneIdx = -1;
    img.setAlpha(0).setScale(0);
    this.tweens.add({ targets: img, alpha: 1, scaleX: props.sizeScale * 0.85, scaleY: props.sizeScale * 0.85, duration: 200, ease: 'Back.easeOut' });
    this.staging.push(img);
    this.updateStagingPositions();
    this.stagingBorder.setStrokeStyle(2, this.staging.length >= this.maxStaging - 1 ? 0xFF0000 : 0x555555);
    if (this.staging.length >= this.maxStaging - 1) SoundFX.play(this, 'overflow');
  }

  updateStagingPositions() {
    const total = this.staging.length, startX = GAME_WIDTH / 2 - (total - 1) * 37;
    this.staging.forEach((s, i) => this.tweens.add({ targets: s, x: startX + i * 74, duration: 150 }));
  }

  overflowShape() {
    if (this.staging.length === 0) return;
    const shape = this.staging.shift();
    SoundFX.play(this, 'explode');
    this.tweens.add({ targets: shape, y: shape.y + 100, alpha: 0, duration: 500, onComplete: () => shape.destroy() });
    this.addExplosion(); this.updateStagingPositions();
  }

  onPointerDown(p) { if (this.paused || this.gameOver) return; this.lastInputTime = this.time.now; this.inactivityActive = false; this.swipeStart = { x: p.x, y: p.y }; }

  onPointerUp(p) {
    if (this.paused || this.gameOver || !this.swipeStart) return;
    this.lastInputTime = this.time.now;
    const dx = p.x - this.swipeStart.x, dy = p.y - this.swipeStart.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= SWIPE_THRESHOLD && this.staging.length > 0) {
      if (this.lawChanging) { this.inputBuffer = { dx, dy }; return; }
      this.processSwipe(dx, dy);
    }
    this.swipeStart = null;
  }

  onTapZone(zoneIdx) {
    if (this.paused || this.gameOver || this.staging.length === 0) return;
    if (this.lawChanging) { this.inputBuffer = { tapZone: zoneIdx }; return; }
    this.lastInputTime = this.time.now;
    this.sortShapeToZone(this.staging[0], zoneIdx);
  }

  processSwipe(dx, dy) {
    if (this.staging.length === 0) return;
    const shape = this.staging[0];
    let bestZone = 0, bestScore = -Infinity;
    for (let i = 0; i < this.zonesData.length; i++) {
      const z = this.zonesData[i], cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      const angle = Math.atan2(dy, dx), targetAngle = Math.atan2(cy - shape.y, cx - shape.x);
      let angleDiff = Math.abs(angle - targetAngle); if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      const score = Math.cos(angleDiff) * 100 - Math.sqrt((cx - shape.x) ** 2 + (cy - shape.y) ** 2) * 0.1;
      if (score > bestScore) { bestScore = score; bestZone = i; }
    }
    this.sortShapeToZone(shape, bestZone);
  }

  sortShapeToZone(shape, zoneIdx) {
    if (!shape || zoneIdx < 0 || zoneIdx >= this.zonesData.length) return;
    const idx = this.staging.indexOf(shape); if (idx === -1) return;
    this.staging.splice(idx, 1); this.updateStagingPositions();
    const zone = this.zonesData[zoneIdx], correctZone = evaluateShape(shape.props, this.currentLaw);
    const tx = zone.x + Phaser.Math.Between(15, zone.w - 15), ty = Math.min(zone.y + 30 + zone.shapes.length * 20, zone.y + zone.h - 20);
    SoundFX.play(this, 'swoosh');
    this.tweens.add({ targets: shape, x: tx, y: ty, duration: 200, ease: 'Quad.easeOut', onComplete: () => {
      if (correctZone === zoneIdx) this.onCorrectPlacement(shape, zone, zoneIdx);
      else this.onWrongPlacement(shape, zone);
    }});
    this.stagingBorder.setStrokeStyle(2, this.staging.length >= this.maxStaging - 1 ? 0xFF0000 : 0x555555);
  }

  onCorrectPlacement(shape, zone, zoneIdx) {
    shape.zoneIdx = zoneIdx; zone.shapes.push(shape);
    GameState.combo++; if (GameState.combo > GameState.bestCombo) GameState.bestCombo = GameState.combo;
    const mult = getComboMult(GameState.combo);
    const pts = Math.round((SCORE.CORRECT + Math.min(25, GameState.combo * SCORE.CORRECT_BONUS)) * mult);
    GameState.score += pts; this.updateScoreDisplay();
    SoundFX.play(this, 'land', GameState.combo);
    juiceLand(this, shape, zone, GameState.combo);
    showFloatingScore(this, shape.x, shape.y - 20, pts); showComboText(this, GameState.combo);
    this.scene.pause(); setTimeout(() => { if (!this.gameOver) this.scene.resume(); }, 30);
    this.shapesPlacedThisLaw++;
    if (this.shapesPlacedThisLaw >= this.diff.shapesPerLaw) this.triggerLawChange();
  }

  onWrongPlacement(shape) {
    SoundFX.play(this, 'wrong'); SoundFX.play(this, 'explode');
    juiceExplode(this, shape); this.addExplosion();
    GameState.score = Math.max(0, GameState.score + SCORE.WRONG); this.updateScoreDisplay();
    if (GameState.combo > 0) { showBrokenCombo(this); } GameState.combo = 0;
    this.shapesPlacedThisLaw++;
    if (this.shapesPlacedThisLaw >= this.diff.shapesPerLaw) this.triggerLawChange();
  }

  addExplosion() { GameState.explosions++; updateSkullDisplay(this); if (GameState.explosions >= MAX_EXPLOSIONS) this.triggerGameOver(); }

  updateScoreDisplay() {
    this.scoreText.setText(`Score: ${GameState.score}`);
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    if (GameState.score > GameState.highScore) { GameState.highScore = GameState.score; this.bestText.setText(`Best: ${GameState.highScore}`); try { localStorage.setItem('color_law_high_score', GameState.highScore); } catch (e) {} }
  }

  triggerLawChange() {
    this.lawChanging = true;
    let sirenCount = 0;
    this.time.addEvent({ delay: 500, callback: () => { SoundFX.play(this, 'siren'); if (this.lawText) this.lawText.setFill(sirenCount++ % 2 === 0 ? COLORS.WARNING : COLORS.LAW_TEXT); }, repeat: 3 });
    this.time.delayedCall(LAW_WARN_DURATION, () => executeLawChange(this));
  }

  triggerGameOver() {
    if (this.gameOver) return; this.gameOver = true;
    SoundFX.play(this, 'gameover'); this.cameras.main.shake(400, 0.012);
    const desat = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(80);
    this.tweens.add({ targets: desat, fillAlpha: 0.5, duration: 500 });
    if (this.spawnTimer) this.spawnTimer.remove();
    AdManager.gamesPlayed++;
    try { localStorage.setItem('color_law_games_played', AdManager.gamesPlayed); localStorage.setItem('color_law_highest_stage', Math.max(GameState.stage, parseInt(localStorage.getItem('color_law_highest_stage')) || 0)); localStorage.setItem('color_law_best_combo', Math.max(GameState.bestCombo, parseInt(localStorage.getItem('color_law_best_combo')) || 0)); } catch (e) {}
    this.time.delayedCall(800, () => showGameOverUI(this));
  }

  update(time) {
    if (this.paused || this.gameOver) return;
    if (time - this.lastInputTime > INACTIVITY_MS && !this.inactivityActive) {
      this.inactivityActive = true;
      if (this.spawnTimer) this.spawnTimer.remove();
      this.spawnTimer = this.time.addEvent({ delay: INACTIVITY_FAST_SPAWN, callback: () => this.spawnShape(), loop: true });
    }
  }

  shutdown() { if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler); }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }
  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT, cx = W / 2;
    this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.8).setDepth(0);
    this.add.text(cx, 200, 'PAUSED', { fontSize: '36px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    const btns = [
      { y: 300, text: 'Resume', color: 0xFFD700, action: () => { this.scene.stop(); this.scene.resume('GameScene'); const gs = this.scene.get('GameScene'); if (gs) gs.paused = false; }},
      { y: 360, text: 'How to Play', color: 0xFFFFFF, action: () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'PauseScene' }); }},
      { y: 420, text: 'Restart', color: 0x888888, action: () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('GameScene'); }},
      { y: 480, text: 'Quit to Menu', color: 0x555555, action: () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('MenuScene'); }}
    ];
    btns.forEach(b => {
      const btn = this.add.rectangle(cx, b.y, 200, 48, b.color).setInteractive({ useHandCursor: true });
      this.add.text(cx, b.y, b.text, { fontSize: '18px', fontFamily: 'Arial', fill: b.color === 0xFFD700 ? '#000' : (b.color === 0xFFFFFF ? '#000' : '#FFF'), fontStyle: 'bold' }).setOrigin(0.5);
      btn.on('pointerdown', () => { SoundFX.play(this, 'click'); b.action(); });
    });
  }
}
