const Effects = {
  screenShake(scene, intensity, duration) {
    scene.cameras.main.shake(duration, intensity / 1000);
  },

  boulderExplosion(scene, x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 100;
      const p = scene.add.image(x, y, 'particle');
      const colors = [0xFCD34D, 0xF97316, 0xFBBF24];
      p.setTint(colors[Math.floor(Math.random() * 3)]);
      p.setScale(0.4 + Math.random() * 0.6);
      p.setDepth(50);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.4,
        y: y + Math.sin(angle) * speed * 0.4,
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  },

  letterFlashCorrect(tile) {
    if (!tile || !tile.scene) return;
    if (tile.setFillStyle) tile.setFillStyle(0x22C55E);
    tile.scene.tweens.add({
      targets: tile, scaleX: 1.25, scaleY: 1.25, duration: 60, yoyo: true,
    });
  },

  letterFlashWrong(tile) {
    if (!tile || !tile.scene) return;
    const scene = tile.scene;
    if (tile.setFillStyle) tile.setFillStyle(0xEF4444);
    scene.time.delayedCall(200, () => {
      if (tile && tile.scene && tile.setFillStyle) tile.setFillStyle(0x374151);
    });
  },

  floatingScore(scene, x, y, value, color = '#F59E0B') {
    const txt = scene.add.text(x, y, '+' + value, {
      fontFamily: 'Arial Black', fontSize: '22px', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 700,
      onComplete: () => txt.destroy(),
    });
  },

  wallFlash(scene, wall) {
    if (!wall) return;
    const orig = wall.fillColor || 0x1E293B;
    wall.setFillStyle(0xDC2626);
    scene.time.delayedCall(300, () => { if (wall.setFillStyle) wall.setFillStyle(orig); });
  },

  redFlash(scene) {
    const r = scene.add.rectangle(
      GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
      GAME_CONFIG.width, GAME_CONFIG.height, 0xDC2626, 0.45
    ).setDepth(200);
    scene.tweens.add({ targets: r, alpha: 0, duration: 300, onComplete: () => r.destroy() });
  },

  hitStop(scene, duration = 80) {
    if (!scene) return;
    scene.hitStopped = true;
    setTimeout(() => { if (scene) scene.hitStopped = false; }, duration);
  },

  cameraZoom(scene, to = 1.03, duration = 250) {
    const cam = scene.cameras.main;
    scene.tweens.add({
      targets: cam, zoom: to, duration: duration / 2, yoyo: true, ease: 'Sine.easeInOut',
    });
  },

  scalePunch(scene, target, to = 1.3, duration = 150) {
    if (!target) return;
    scene.tweens.add({
      targets: target, scaleX: to, scaleY: to, duration: duration / 2, yoyo: true,
    });
  },
};
