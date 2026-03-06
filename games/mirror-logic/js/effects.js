// Mirror Logic - Visual Effects & Juice

const Effects = {
  showFloatingText(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, { fontSize: '24px', fontFamily: 'monospace', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(30);
    scene.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
  },

  spawnParticles(scene, x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 60 + Math.random() * 100;
      const p = scene.add.circle(x, y, 3, color).setDepth(25);
      scene.tweens.add({ targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed, alpha: 0, scaleX: 0, scaleY: 0, duration: 350 + Math.random() * 200, onComplete: () => p.destroy() });
    }
  },

  renderLaser(scene, path, glowGfx, coreGfx, gridToScreen) {
    glowGfx.clear();
    coreGfx.clear();
    if (path.length < 2) return;

    // Glow layer
    glowGfx.lineStyle(6, 0xFF2244, 0.25);
    glowGfx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = gridToScreen(path[i].col, path[i].row);
      if (i === 0) glowGfx.moveTo(p.x, p.y);
      else glowGfx.lineTo(p.x, p.y);
    }
    glowGfx.strokePath();

    // Core layer
    coreGfx.lineStyle(2, 0xFF2244, 1);
    coreGfx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = gridToScreen(path[i].col, path[i].row);
      if (i === 0) coreGfx.moveTo(p.x, p.y);
      else coreGfx.lineTo(p.x, p.y);
    }
    coreGfx.strokePath();
  },

  onTargetHit(scene, target, cell, hitCount, mirrorsRemoved) {
    const pos = scene.gridToScreen(target.col, target.row);
    if (cell.sprite) cell.sprite.setTexture('targetHit');

    const particleCount = 15 + (target.num - 1) * 5;
    Effects.spawnParticles(scene, pos.x, pos.y, 0x44FF88, particleCount);
    if (cell.sprite) {
      scene.tweens.add({ targets: cell.sprite, scaleX: cell.sprite.scaleX * 1.5, scaleY: cell.sprite.scaleY * 1.5, duration: 100, yoyo: true });
    }

    const pts = SCORING.TARGET_HIT + (target.num > 1 && mirrorsRemoved === 0 ? SCORING.CONSECUTIVE_BONUS : 0);
    GameState.score += pts;
    Effects.showFloatingText(scene, pos.x, pos.y - 10, `+${pts}`, COLORS.TARGET_HIT);
    scene.cameras.main.shake(100, 0.003);
    scene.cameras.main.zoomTo(1.04, 150, 'Quad.easeOut', false, (cam, progress) => { if (progress === 1) cam.zoomTo(1, 150); });
    return pts;
  },

  onStageClear(scene, stageScore, mult) {
    scene.cameras.main.flash(200, 255, 255, 255, false, null, scene);
    scene.cameras.main.shake(150, 0.003);
    Effects.showFloatingText(scene, scene.scale.width / 2, scene.scale.height / 2 - 40, `+${stageScore}`, COLORS.TARGET_HIT);
    if (mult > 1) {
      scene.time.delayedCall(200, () => {
        Effects.showFloatingText(scene, scene.scale.width / 2, scene.scale.height / 2, `x${mult} STREAK!`, COLORS.SUCCESS);
      });
    }
  },

  onExplosion(scene, cx, cy) {
    scene.cameras.main.shake(400, 0.015);
    scene.cameras.main.flash(100, 255, 34, 68);
    Effects.spawnParticles(scene, cx, cy, 0xFF4444, 25);
    const blast = scene.add.circle(cx, cy, 0, 0xFF4444, 0.8).setDepth(20);
    scene.tweens.add({ targets: blast, radius: 200, alpha: 0, duration: 400 });
  },

  onMirrorPlace(scene, sprite, x, y) {
    scene.tweens.add({ targets: sprite, scaleX: sprite.scaleX * 1.3, scaleY: sprite.scaleY * 1.3, duration: 60, yoyo: true, ease: 'Back.easeOut' });
    Effects.spawnParticles(scene, x, y, 0xC0C8D8, 6);
    scene.cameras.main.shake(80, 0.002);
  },

  onMirrorRotate(scene, sprite, x, y) {
    scene.tweens.add({ targets: sprite, scaleX: sprite.scaleX * 1.3, scaleY: sprite.scaleY * 1.3, duration: 60, yoyo: true });
    Effects.spawnParticles(scene, x, y, 0xC0C8D8, 4);
  },

  updateScoreText(scene, scoreText) {
    if (scoreText) {
      scoreText.setText(`Score: ${GameState.score}`);
      scene.tweens.add({ targets: scoreText, scaleX: 1.3, scaleY: 1.3, duration: 75, yoyo: true });
    }
  }
};
