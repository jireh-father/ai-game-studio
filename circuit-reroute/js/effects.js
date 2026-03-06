// effects.js - Visual effects, particles, juice helpers

const Effects = {
  explosionAt(scene, x, y) {
    for (let i = 0; i < 20; i++) {
      const color = Math.random() > 0.5 ? 0xFF6622 : 0xFF3344;
      const p = scene.add.circle(x, y, 4 + Math.random() * 4, color);
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, duration: 400, onComplete: () => p.destroy()
      });
    }
    scene.cameras.main.shake(250, 0.008);
  },

  flashTileRed(scene, sprite) {
    if (!sprite) return;
    scene.tweens.add({
      targets: sprite, alpha: 0.3, duration: 100, yoyo: true, repeat: 2,
      onStart: () => sprite.setTint(0xFF3344),
      onComplete: () => sprite.clearTint()
    });
  },

  rotateParticles(scene, x, y) {
    for (let i = 0; i < 6; i++) {
      const p = scene.add.circle(x, y, 3, 0x00DDFF);
      const angle = Math.random() * Math.PI * 2;
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * 25, y: y + Math.sin(angle) * 25,
        alpha: 0, duration: 200, onComplete: () => p.destroy()
      });
    }
  },

  bulbBurst(scene, x, y) {
    for (let i = 0; i < 15; i++) {
      const p = scene.add.circle(x, y, 4, 0xFFD700);
      const angle = Math.random() * Math.PI * 2;
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * 60, y: y + Math.sin(angle) * 60,
        alpha: 0, duration: 500, onComplete: () => p.destroy()
      });
    }
  },

  floatingScore(scene, x, y, points) {
    const ft = scene.add.text(x, y, '+' + points, {
      fontSize: '24px', fill: COLORS.BULB_LIT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({ targets: ft, y: ft.y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy() });
  },

  streakText(scene, mult) {
    if (mult <= 1) return;
    const { width, height } = scene.scale;
    const st = scene.add.text(width / 2, height / 2 + 30, 'x' + mult.toFixed(1) + '!', {
      fontSize: '30px', fill: COLORS.BULB_LIT, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0).setDepth(20);
    scene.tweens.add({ targets: st, scaleX: 1.5, scaleY: 1.5, duration: 200 });
    scene.tweens.add({ targets: st, scaleX: 1, scaleY: 1, duration: 200, delay: 200 });
    scene.tweens.add({ targets: st, alpha: 0, duration: 400, delay: 600, onComplete: () => st.destroy() });
  },

  screenFlash(scene) {
    const { width, height } = scene.scale;
    const flash = scene.add.rectangle(width / 2, height / 2, width, height, 0xFFFFFF, 0.15).setDepth(15);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
  },

  scalePunch(scene, target, scale, duration) {
    scene.tweens.add({ targets: target, scaleX: scale, scaleY: scale, duration: duration || 50, yoyo: true });
  },

  lockShake(scene, sprite) {
    scene.tweens.add({ targets: sprite, x: sprite.x + 3, duration: 40, yoyo: true, repeat: 2 });
  }
};
