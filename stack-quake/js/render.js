// Stack Quake - Visual Effects & Juice

function applyLandingJuice(scene, x, y, score, isPerfect, isNearPerfect, overhang) {
  // Camera shake - always
  scene.cameras.main.shake(80, 0.004);

  // Scale punch on topmost tower block
  const topBlock = scene.towerBlocks[scene.towerBlocks.length - 1];
  if (topBlock) {
    scene.tweens.add({ targets: topBlock, scaleX: 1.15, scaleY: 1.15, duration: 50, yoyo: true });
  }

  // Floating score text
  const scoreTxt = scene.add.text(x, y - 10, '+' + score, {
    fontSize: '20px', fontFamily: 'Arial', fill: isPerfect ? COLORS.PERFECT_FLASH : COLORS.UI_TEXT, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(80);
  scene.tweens.add({
    targets: scoreTxt, y: y - 50, alpha: 0, duration: 400,
    onComplete: () => scoreTxt.destroy()
  });

  // Score text punch
  scene.tweens.add({ targets: scene.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 75, yoyo: true });

  if (isPerfect) {
    // Gold flash over placed block
    const flash = scene.add.rectangle(scene.platformCenterX, y, scene.platformWidth, FLOOR_HEIGHT, 0xFFD60A, 1).setDepth(15);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    // Camera gold flash
    scene.cameras.main.flash(150, 255, 214, 10, false, null, null, 0.3);

    // Width restored text
    if (scene.lastSlicedWidth > 0) {
      const restoreTxt = scene.add.text(scene.platformCenterX, y - 20, '+WIDTH', {
        fontSize: '16px', fill: COLORS.WIDTH_RESTORE, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(80);
      scene.tweens.add({ targets: restoreTxt, y: y - 60, alpha: 0, duration: 400, onComplete: () => restoreTxt.destroy() });
    }

    // Combo text escalation
    if (scene.comboCount >= 2) {
      const comboSize = Math.min(28 + (scene.comboCount - 1) * 4, 40);
      const comboColors = [COLORS.PERFECT_FLASH, COLORS.DANGER, COLORS.SHAKE_RED, '#FFFFFF'];
      const cColor = comboColors[Math.min(scene.comboCount - 1, comboColors.length - 1)];
      const comboTxt = scene.add.text(GAME_WIDTH / 2, 200, 'PERFECT x' + scene.comboCount, {
        fontSize: comboSize + 'px', fill: cColor, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(90);
      scene.tweens.add({ targets: comboTxt, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });
      scene.tweens.add({ targets: comboTxt, alpha: 0, y: 170, duration: 600, delay: 200, onComplete: () => comboTxt.destroy() });
    }

    // Platform container scale punch
    scene.tweens.add({ targets: scene.towerContainer, scaleY: 1.02, duration: 75, yoyo: true });
  } else if (isNearPerfect) {
    scene.cameras.main.shake(80, 0.003);
  }

  // Large shake for big overhang
  if (overhang > BLOCK_WIDTH * 0.3) {
    scene.cameras.main.shake(120, 0.007);
  }

  // Danger state visual
  const pct = scene.platformWidth / PLATFORM_START_WIDTH;
  if (pct < 0.25) {
    scene.tweens.add({
      targets: scene.dangerOverlay, alpha: 0.15, duration: 300, yoyo: true, repeat: 2
    });
  }
}

function spawnTapRipple(scene, x, y) {
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.circle(x, y, 4, 0xF0EFF4, 0).setStrokeStyle(1.5, 0xF0EFF4, 0.6).setDepth(90);
    scene.tweens.add({
      targets: ring, radius: 40, alpha: 0, duration: 200, delay: i * 30,
      onUpdate: () => { ring.setRadius(ring.radius); },
      onComplete: () => ring.destroy()
    });
  }
}

function spawnFragment(scene, x, y, width, dir) {
  const frag = scene.add.rectangle(x, y, Math.max(4, width), FLOOR_HEIGHT, 0x2A6AEE).setDepth(5);
  const rotation = (15 + Math.random() * 15) * dir * Math.PI / 180;
  scene.tweens.add({
    targets: frag, y: y + 200, alpha: 0, rotation: rotation, duration: 400,
    onComplete: () => frag.destroy()
  });
}

function playQuakeEvent(scene) {
  scene.cameras.main.shake(300, 0.015);

  // Red vignette pulse
  scene.tweens.add({ targets: scene.dangerOverlay, alpha: 0.3, duration: 400, yoyo: true });

  // AFTERSHOCK text
  const txt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'AFTERSHOCK!', {
    fontSize: '32px', fill: COLORS.SHAKE_RED, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(90).setScale(1.5);
  scene.tweens.add({
    targets: txt, scaleX: 1, scaleY: 1, duration: 300, onComplete: () => {
      scene.tweens.add({ targets: txt, alpha: 0, duration: 200, onComplete: () => txt.destroy() });
    }
  });
}

function playTowerCollapse(scene) {
  scene.cameras.main.shake(600, 0.025);
  scene.cameras.main.flash(150, 255, 255, 255, false, null, null, 0.7);

  for (let i = scene.towerBlocks.length - 1; i >= 0; i--) {
    const block = scene.towerBlocks[i];
    const delay = (scene.towerBlocks.length - 1 - i) * 15;
    scene.tweens.add({
      targets: block, y: block.y + 800, alpha: 0, duration: 600, delay: delay
    });
  }
}

function showPatternChangeLabel(scene, label) {
  const txt = scene.add.text(GAME_WIDTH / 2, 140, label, {
    fontSize: '18px', fill: COLORS.DANGER, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(90);
  scene.tweens.add({ targets: txt, alpha: 0, y: 120, duration: 1000, onComplete: () => txt.destroy() });
}
