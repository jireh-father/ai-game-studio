// Microwave Roulette - Juice & Effects
const Effects = {
  perfectJuice(scene) {
    const cam = scene.cameras.main;
    cam.flash(80, 255, 255, 255, true);
    const intensity = Math.min(0.003 + scene.combo * 0.0005, 0.008);
    cam.shake(120, intensity);
    cam.zoomTo(1.03, 100, 'Sine.easeOut', true);
    setTimeout(() => { if (cam) cam.zoomTo(1, 150); }, 120);

    const count = Math.min(20 + scene.combo * 3, 50);
    Effects.burstParticles(scene, scene.mcx, scene.mcy, count, [0x00E676, 0xFFD600, 0xFF6D00]);

    if (scene.microwaveGfx) {
      scene.tweens.add({
        targets: scene.microwaveGfx, scaleX: 1.05, scaleY: 1.05,
        duration: 80, yoyo: true,
      });
    }
    // Hit-stop
    scene.scene.pause();
    setTimeout(() => { scene.scene.resume(); }, 40);
  },

  tapJuice(scene, x, y, good) {
    scene.cameras.main.shake(100, 0.003);
    const count = good ? 15 : 8;
    Effects.burstParticles(scene, x, y, count, [0xFF6D00, 0xFFD600]);
    if (scene.microwaveGfx) {
      scene.tweens.add({
        targets: scene.microwaveGfx, scaleX: 1.03, scaleY: 1.03,
        duration: 60, yoyo: true,
      });
    }
  },

  explosionJuice(scene) {
    scene.cameras.main.shake(350, 0.015);
    scene.cameras.main.flash(150, 255, 23, 68, true);
    Effects.burstParticles(scene, scene.mcx, scene.mcy, 40, [0xFF1744, 0xFF6D00, 0xFFD600, 0x263238]);
    // Slow-mo via setTimeout (NOT delayedCall — Phaser bug with timeScale=0)
    scene.time.timeScale = 0.3;
    setTimeout(() => { if (scene.time) scene.time.timeScale = 1; }, 400);
  },

  burstParticles(scene, x, y, count, colors) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      const p = scene.add.circle(x, y, size, color, 1).setDepth(25);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + Math.random() * 40,
        alpha: 0, scale: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  },

  floatingScore(scene, pts, x, y) {
    const color = pts >= CONFIG.SCORE.PERFECT ? CONFIG.HEX.GREEN : CONFIG.HEX.GOLD;
    const ft = scene.add.text(x, y, `+${pts}`, {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color,
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({
      targets: ft, y: y - 50, alpha: 0, duration: 600,
      onComplete: () => ft.destroy(),
    });
  },

  scorePunch(scene) {
    scene.tweens.add({
      targets: scene.scoreText, scaleX: 1.3, scaleY: 1.3,
      duration: 80, yoyo: true, ease: 'Bounce',
    });
  },

  comboMilestone(scene) {
    scene.cameras.main.flash(150, 255, 214, 0, true);
    Effects.burstParticles(scene, scene.w / 2, scene.h / 2, 40, [0xFFD600, 0xFF6D00, 0x00E676]);
  },

  newItemPopup(scene, x, y) {
    const txt = scene.add.text(x, y, 'NEW ITEM!', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.GOLD,
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({
      targets: txt, y: txt.y - 40, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy(),
    });
  },

  freezeEffect(scene) {
    if (scene.itemGfx) {
      scene.itemGfx.setAlpha(0.5);
      setTimeout(() => { if (scene.itemGfx) scene.itemGfx.setAlpha(1); }, 300);
    }
    scene.cameras.main.shake(80, 0.002);
  },
};
