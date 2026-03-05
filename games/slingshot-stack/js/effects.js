// Slingshot Stack - Visual Effects, Particles, Collision, Collapse

function initEffects(scene) {
  scene.matter.world.on('collisionstart', (event) => {
    for (const pair of event.pairs) {
      handleCollision(scene, pair);
    }
  });
}

function handleCollision(scene, pair) {
  if (scene.isCollapsing) return;
  const labels = [pair.bodyA.label, pair.bodyB.label];
  const blockLabel = labels.find(l => l && l.startsWith('block_'));
  const otherLabel = labels.find(l => l === 'ground' || l === 'foundation' || (l && l.startsWith('block_') && l !== blockLabel));

  if (blockLabel && otherLabel && scene.isFlinging) {
    if (scene.currentBlock && blockLabel === scene.currentBlock.label) {
      scene.isFlinging = false;
      if (scene.stuckTimer) { clearTimeout(scene.stuckTimer); scene.stuckTimer = null; }

      const cx = scene.currentBlock.position.x;
      const cy = scene.currentBlock.position.y;
      scene.time.delayedCall(0, () => {
        spawnParticles(scene, cx, cy, CONFIG.COLORS.DUST, 8, 400);
        scene.cameras.main.shake(150, 0.004);
        // Hit-stop using setTimeout
        scene.matter.world.engine.timing.timeScale = 0;
        setTimeout(() => {
          if (scene.matter && scene.matter.world) {
            scene.matter.world.engine.timing.timeScale = 1;
          }
        }, 40);
      });
    }
  }
}

function spawnParticles(scene, x, y, color, count, lifespan) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const size = 2 + Math.random() * 4;
    const p = scene.add.circle(x, y, size, color).setDepth(200);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0, scaleX: 0.2, scaleY: 0.2,
      duration: lifespan,
      onComplete: () => p.destroy()
    });
  }
}

function showLandingEffects(scene, block, bd, isPerfect, points) {
  // Score punch
  scene.tweens.add({ targets: scene.hud.scoreTxt, scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true });

  // Floating score text
  const ft = scene.add.text(block.position.x, block.position.y - 20, '+' + points, {
    fontSize: isPerfect ? '28px' : '22px', fontFamily: 'Arial', fontStyle: 'bold',
    fill: isPerfect ? CONFIG.COLORS.TEXT_GOLD : CONFIG.COLORS.TEXT_DARK
  }).setOrigin(0.5).setDepth(200).setScrollFactor(1);
  scene.tweens.add({ targets: ft, y: ft.y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy() });

  // Perfect effects
  if (isPerfect) {
    spawnParticles(scene, block.position.x, block.position.y, CONFIG.COLORS.GOLD, 20, 600);
    const ring = scene.add.circle(block.position.x, block.position.y, 15, CONFIG.COLORS.GOLD, 0.6).setDepth(150);
    scene.tweens.add({ targets: ring, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
  }
}

function showCombo(scene, combo) {
  if (combo >= 2) {
    scene.hud.comboTxt.setText('x' + (1 + combo * CONFIG.SCORE.COMBO_STEP).toFixed(1) + '!');
    scene.hud.comboTxt.setAlpha(1);
    scene.hud.comboTxt.setFontSize(Math.min(28 + combo * 6, 58));
    scene.tweens.add({ targets: scene.hud.comboTxt, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
  } else {
    scene.hud.comboTxt.setAlpha(0);
  }
}

function showHeightMilestone(scene) {
  for (const tb of scene.towerBodies) {
    if (tb.gfx) {
      scene.tweens.add({ targets: tb.gfx, alpha: 0.6, duration: 150, yoyo: true });
    }
  }
}

function triggerCollapse(scene) {
  if (scene.isCollapsing) return;
  scene.isCollapsing = true;
  scene.inputDisabled = true;

  scene.cameras.main.shake(600, 0.015);
  scene.cameras.main.zoomTo(0.85, 500);

  // Slow motion via setTimeout
  scene.matter.world.engine.timing.timeScale = 0.3;
  setTimeout(() => {
    if (scene.matter && scene.matter.world) {
      scene.matter.world.engine.timing.timeScale = 1;
    }
  }, 800);

  spawnParticles(scene, scene.w / 2, scene.groundY, CONFIG.COLORS.DUST, 25, 800);

  // Grayscale
  try { scene.cameras.main.postFX.addColorMatrix().grayscale(0.6); } catch(e) {}

  setTimeout(() => {
    scene.cameras.main.zoomTo(1, 1);
    scene.scene.start('GameOverScene', {
      score: scene.score,
      blocksStacked: scene.blocksStacked
    });
  }, CONFIG.GAMEPLAY.COLLAPSE_DELAY);
}
