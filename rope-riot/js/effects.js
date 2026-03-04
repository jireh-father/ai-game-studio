// Visual effects, particles, and juice functions

function spawnHitParticles(scene, x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = scene.add.image(x, y, 'particle').setScale(0.5 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 200;
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * speed * 0.4,
      y: y + Math.sin(angle) * speed * 0.4,
      alpha: 0, scale: 0, duration: 300 + Math.random() * 100,
      onComplete: () => p.destroy()
    });
  }
}

function spawnDeathParticles(scene, px, py) {
  for (let i = 0; i < 20; i++) {
    const p = scene.add.image(px, py, 'particleCyan').setScale(0.8);
    const a = Math.random() * Math.PI * 2;
    const sp = 150 + Math.random() * 150;
    scene.tweens.add({
      targets: p,
      x: px + Math.cos(a) * sp * 0.6,
      y: py + Math.sin(a) * sp * 0.6,
      alpha: 0, scale: 0, duration: 500 + Math.random() * 100,
      onComplete: () => p.destroy()
    });
  }
}

function spawnStageClearParticles(scene) {
  const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT * 0.4;
  for (let i = 0; i < 30; i++) {
    const p = scene.add.image(cx, cy, 'particleGold').setScale(0.5 + Math.random() * 0.5);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const sp = 100 + Math.random() * 100;
    scene.tweens.add({
      targets: p,
      x: cx + Math.cos(a) * sp,
      y: cy + Math.sin(a) * sp,
      alpha: 0, scale: 0, duration: 600 + Math.random() * 100,
      onComplete: () => p.destroy()
    });
  }
}

function showFloatingText(scene, x, y, text, color, size, rise, dur) {
  const txt = scene.add.text(x, y, text, {
    fontSize: `${size}px`, fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: color
  }).setOrigin(0.5).setDepth(200);
  scene.tweens.add({
    targets: txt, y: y - rise, alpha: 0, duration: dur,
    onComplete: () => txt.destroy()
  });
}

function updateScoreDisplay(scene, points, ex, ey) {
  scene.scoreText.setText(`SCORE: ${window.GAME_STATE.score}`);
  scene.tweens.add({ targets: scene.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 90, yoyo: true });
  showFloatingText(scene, ex, ey - 20, `+${points}`, '#FFFFAA', 20, 60, 600);
}

function showWhipArc(scene, angle, dist) {
  const g = scene.whipArcGraphics;
  g.clear();
  g.lineStyle(4, CONFIG.COLORS.ROPE, 1);
  g.beginPath();
  const ox = scene.playerX, oy = scene.playerY - 12;
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = angle - 0.4 + t * 0.8;
    const r = dist * t;
    const px = ox + Math.cos(a) * r;
    const py = oy + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.strokePath();
  scene.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => { g.clear(); g.setAlpha(1); } });
}

function triggerDeathEffects(scene) {
  // Screen shake
  scene.cameras.main.shake(350, 0.012);

  // Red flash overlay
  const flash = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0xFF0000, 0.4).setDepth(250);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

  // Death particles
  spawnDeathParticles(scene, scene.playerX, scene.playerY - 16);

  // Player destruction
  scene.tweens.add({
    targets: scene.playerSprite, scaleX: 2, scaleY: 2, alpha: 0, angle: 360, duration: 350
  });
}

function showPauseOverlay(scene) {
  scene.scene.pause();
  const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
  const els = [];
  const mk = (o) => { els.push(o); return o; };

  mk(scene.add.rectangle(cx, cy, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.75).setDepth(300).setInteractive());
  mk(scene.add.text(cx, cy - 100, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(301));
  const resume = mk(scene.add.rectangle(cx, cy - 20, 180, 50, CONFIG.COLORS.PLAYER, 1).setDepth(301).setInteractive());
  mk(scene.add.text(cx, cy - 20, 'RESUME', { fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#000000' }).setOrigin(0.5).setDepth(302));
  const restart = mk(scene.add.rectangle(cx, cy + 50, 180, 50, CONFIG.COLORS.DANGER, 1).setDepth(301).setInteractive());
  mk(scene.add.text(cx, cy + 50, 'RESTART', { fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(302));
  const menu = mk(scene.add.rectangle(cx, cy + 120, 180, 50, 0x666666, 1).setDepth(301).setInteractive());
  mk(scene.add.text(cx, cy + 120, 'MENU', { fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(302));

  const clear = () => els.forEach(o => o.destroy());
  resume.on('pointerdown', () => { clear(); scene.scene.resume(); scene.resetInactivity(); });
  restart.on('pointerdown', () => { clear(); scene.scene.resume(); window.GAME_STATE = { score: 0, stage: 1, combo: 1.0, usedDodge: false }; scene.scene.restart(); });
  menu.on('pointerdown', () => { clear(); scene.scene.resume(); scene.scene.start('MenuScene'); });
}

function triggerStageClearEffects(scene, bonus, dodgeBonus) {
  // Platform flash
  scene.platformGraphics.forEach(g => {
    scene.tweens.add({
      targets: g, alpha: 0.5, duration: 100, yoyo: true, repeat: 1,
      onComplete: () => g.setAlpha(1)
    });
  });

  // Stage clear text
  let msg = `STAGE CLEAR! +${bonus}`;
  if (dodgeBonus > 0) msg += ` +${dodgeBonus} NO DODGE`;
  showFloatingText(scene, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.35, msg, '#FFD700', 24, 100, 800);

  // Particles
  spawnStageClearParticles(scene);

  // Camera zoom
  scene.cameras.main.zoomTo(1.06, 200, 'Power2', true, (cam, progress) => {
    if (progress >= 1) cam.zoomTo(1, 200);
  });
}
