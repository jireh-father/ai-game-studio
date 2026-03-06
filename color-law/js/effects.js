// effects.js - Juice effects, law change execution, game over UI
function getComboMult(combo) {
  let mult = 1;
  for (const t of COMBO_TIERS) { if (combo >= t.at) mult = t.mult; }
  return mult;
}

function burstParticles(scene, x, y, colorHex, count) {
  const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const dist = Phaser.Math.Between(40, 120);
    const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), color).setDepth(50);
    scene.tweens.add({ targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist + 20, alpha: 0, scaleX: 0, scaleY: 0, duration: Phaser.Math.Between(300, 500), onComplete: () => p.destroy() });
  }
}

function juiceLand(scene, shape, zone, combo) {
  const pCount = Math.min(20, 8 + combo * 2);
  burstParticles(scene, shape.x, shape.y, shape.props.colorHex, pCount);
  scene.cameras.main.shake(80, Math.min(0.005, 0.002 + combo * 0.0005));
  const sc = Math.min(1.6, 1.3 + combo * 0.05);
  scene.tweens.add({ targets: shape, scaleX: shape.scaleX * sc, scaleY: shape.scaleY * sc, duration: 80, yoyo: true });
  scene.tweens.add({ targets: zone.rect, fillAlpha: 0.4, duration: 50, yoyo: true });
}

function juiceExplode(scene, shape) {
  burstParticles(scene, shape.x, shape.y, shape.props ? shape.props.colorHex : COLORS.EXPLOSION, 15);
  scene.cameras.main.shake(200, 0.006);
  scene.tweens.add({ targets: shape, scaleX: (shape.scaleX || 1) * 1.5, scaleY: (shape.scaleY || 1) * 1.5, alpha: 0, duration: 300, onComplete: () => shape.destroy() });
}

function updateSkullDisplay(scene) {
  for (let i = 0; i < MAX_EXPLOSIONS; i++) {
    if (i < GameState.explosions) {
      scene.skulls[i].setTexture('skull_active');
      scene.tweens.add({ targets: scene.skulls[i], scaleX: 1.6, scaleY: 1.6, duration: 100, yoyo: true, ease: 'Back.easeOut' });
    } else {
      scene.skulls[i].setTexture('skull');
    }
  }
}

function showBrokenCombo(scene) {
  const brk = scene.add.text(GAME_WIDTH / 2, 460, 'COMBO BROKEN', { fontSize: '16px', fontFamily: 'Arial', fill: COLORS.WARNING, fontStyle: 'bold' }).setOrigin(0.5).setDepth(100);
  scene.tweens.add({ targets: brk, alpha: 0, duration: 400, delay: 100, onComplete: () => brk.destroy() });
}

function executeLawChange(scene) {
  SoundFX.play(scene, 'gavel');
  const flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.25).setDepth(90);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 80, onComplete: () => flash.destroy() });
  scene.cameras.main.shake(150, 0.004);

  GameState.stage++;
  scene.diff = getDifficulty(GameState.stage);
  scene.maxStaging = getMaxStaging(GameState.stage);
  if (scene.diff.zoneCount !== scene.zonesData.length) scene.buildZones(scene.diff.zoneCount);

  scene.currentLaw = scene.nextLaw;
  const allShapes = scene.zonesData.flatMap(z => z.shapes.map(s => ({ props: s.props, zoneIdx: z.idx })));
  let candidateNext, attempts = 0;
  do { candidateNext = generateLaw(GameState.stage + 1, getDifficulty(GameState.stage + 1).zoneCount, scene.currentLaw); attempts++; }
  while (!validateLawFairness(candidateNext, allShapes, scene.diff.zoneCount) && attempts < 10);
  scene.nextLaw = candidateNext;

  // Evaluate violations
  const toExplode = [];
  for (const zone of scene.zonesData) {
    for (const shape of [...zone.shapes]) {
      if (evaluateShape(shape.props, scene.currentLaw) !== zone.idx) toExplode.push({ shape, zone });
    }
  }

  // Staggered explosions
  toExplode.forEach((item, i) => {
    scene.time.delayedCall(i * 100, () => {
      const idx = item.zone.shapes.indexOf(item.shape);
      if (idx !== -1) item.zone.shapes.splice(idx, 1);
      SoundFX.play(scene, 'explode');
      juiceExplode(scene, item.shape);
      scene.addExplosion();
    });
  });

  // Survival glow + bonus
  let survived = 0;
  for (const zone of scene.zonesData) {
    for (const shape of zone.shapes) {
      if (!toExplode.find(e => e.shape === shape)) {
        survived++;
        survivalGlow(scene, shape);
        const pts = Math.round(SCORE.SURVIVE * getComboMult(GameState.combo));
        GameState.score += pts;
        showFloatingScore(scene, shape.x, shape.y - 15, pts, COLORS.SUCCESS);
        SoundFX.play(scene, 'survive');
      }
    }
  }
  if (toExplode.length === 0 && scene.shapesPlacedThisLaw >= 3) {
    GameState.score += SCORE.PERFECT;
    showPerfectLaw(scene);
  }

  scene.updateLawDisplay(); scene.updateScoreDisplay();
  scene.stageText.setText(`Law #${GameState.stage}`);
  scene.shapesPlacedThisLaw = 0;
  if (scene.spawnTimer) scene.spawnTimer.remove();
  scene.spawnTimer = scene.time.addEvent({ delay: scene.diff.spawnInterval, callback: () => scene.spawnShape(), loop: true });
  scene.lawText.setFill(COLORS.LAW_TEXT);

  scene.time.delayedCall(300, () => {
    scene.lawChanging = false;
    if (scene.inputBuffer) {
      if (scene.inputBuffer.tapZone !== undefined) scene.onTapZone(scene.inputBuffer.tapZone);
      else if (scene.inputBuffer.dx !== undefined) scene.processSwipe(scene.inputBuffer.dx, scene.inputBuffer.dy);
      scene.inputBuffer = null;
    }
  });
}

function survivalGlow(scene, shape) {
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 200, () => {
      if (shape && shape.active) scene.tweens.add({ targets: shape, scaleX: shape.scaleX * 1.1, scaleY: shape.scaleY * 1.1, duration: 100, yoyo: true });
    });
  }
}

function showGameOverUI(scene) {
  const W = GAME_WIDTH, cx = W / 2;
  scene.add.rectangle(cx, GAME_HEIGHT / 2, W, GAME_HEIGHT, 0x000000, 0.7).setDepth(90);
  scene.add.text(cx, 180, 'GAME OVER', { fontSize: '38px', fontFamily: 'Arial', fill: COLORS.PENALTY, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(91);
  if (scene.textures.exists('gavel')) {
    const gavel = scene.add.image(cx, -40, 'gavel').setScale(2).setDepth(92);
    scene.tweens.add({ targets: gavel, y: 130, scaleX: 1.2, scaleY: 1.2, duration: 300, ease: 'Bounce.easeOut', onComplete: () => scene.cameras.main.shake(150, 0.01) });
  }
  const scoreTxt = scene.add.text(cx, 260, `${GameState.score}`, { fontSize: '48px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5).setDepth(91).setScale(0);
  scene.tweens.add({ targets: scoreTxt, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut', onComplete: () => scene.tweens.add({ targets: scoreTxt, scaleX: 1, scaleY: 1, duration: 150 }) });
  if (GameState.score >= GameState.highScore && GameState.score > 0) {
    const nb = scene.add.text(cx, 310, 'NEW BEST!', { fontSize: '22px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold' }).setOrigin(0.5).setDepth(91);
    scene.tweens.add({ targets: nb, alpha: 0.3, duration: 300, yoyo: true, repeat: 5 });
  }
  scene.add.text(cx, 340, `Laws Survived: ${GameState.stage - 1}`, { fontSize: '16px', fontFamily: 'Arial', fill: '#FFFFFF' }).setOrigin(0.5).setDepth(91);
  scene.add.text(cx, 365, `Best Combo: ${GameState.bestCombo}`, { fontSize: '14px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(0.5).setDepth(91);
  if (!scene.usedContinue) {
    const contBtn = scene.add.rectangle(cx, 420, 220, 48, 0x5FAD56).setInteractive({ useHandCursor: true }).setDepth(91);
    scene.add.text(cx, 420, 'Continue (-2 strikes)', { fontSize: '15px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(92);
    contBtn.on('pointerdown', () => { SoundFX.play(scene, 'click'); scene.usedContinue = true; GameState.explosions = Math.max(0, GameState.explosions - 2); scene.gameOver = false; scene.scene.restart(); });
  }
  const playBtn = scene.add.rectangle(cx, 485, 200, 50, 0xFFD700).setInteractive({ useHandCursor: true }).setDepth(91);
  scene.add.text(cx, 485, 'Play Again', { fontSize: '20px', fontFamily: 'Arial', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(92);
  playBtn.on('pointerdown', () => { SoundFX.play(scene, 'click'); scene.scene.restart(); });
  const menuBtn = scene.add.rectangle(cx, 545, 140, 40, 0x555555).setInteractive({ useHandCursor: true }).setDepth(91);
  scene.add.text(cx, 545, 'Menu', { fontSize: '16px', fontFamily: 'Arial', fill: '#FFF' }).setOrigin(0.5).setDepth(92);
  menuBtn.on('pointerdown', () => { SoundFX.play(scene, 'click'); scene.scene.start('MenuScene'); });
}
