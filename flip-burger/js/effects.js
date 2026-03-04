// effects.js — Visual effects, juice, arc rendering, fire death

const Effects = {
  flipJuice(scene, patty, grade) {
    if (patty.pattySprite) {
      scene.tweens.add({ targets: patty.pattySprite, scaleX: 0.85, scaleY: 0.85, duration: 60, yoyo: true,
        onComplete: () => { scene.tweens.add({ targets: patty.pattySprite, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true }); }
      });
    }
    if (grade === 'PERFECT') {
      const flash = scene.add.circle(patty.x, patty.y, 5, 0xFFD700, 0.8).setDepth(20);
      scene.tweens.add({ targets: flash, radius: 40, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      for (let i = 0; i < 12; i++) {
        const dot = scene.add.circle(patty.x, patty.y, 3, 0xFFD700).setDepth(20);
        const a = (i / 12) * Math.PI * 2;
        scene.tweens.add({ targets: dot, x: patty.x + Math.cos(a) * 35, y: patty.y + Math.sin(a) * 35, alpha: 0, scaleX: 0, scaleY: 0, duration: 350, onComplete: () => dot.destroy() });
      }
      scene.cameras.main.shake(80, 0.003);
    } else {
      scene.cameras.main.shake(50, 0.002);
    }
  },

  steamEffect(scene, x, y) {
    for (let i = 0; i < 4; i++) {
      const dot = scene.add.circle(x + Phaser.Math.Between(-15, 15), y, 3, 0xFFFFFF, 0.6).setDepth(15);
      scene.tweens.add({ targets: dot, y: y - 25 - i * 5, alpha: 0, duration: 400 + i * 80, onComplete: () => dot.destroy() });
    }
  },

  fireDeath(scene) {
    SFX.play('fire');
    SFX.play('gameOver');
    scene.grills.forEach(g => {
      for (let i = 0; i < 8; i++) {
        const flame = scene.add.circle(
          g.pos.x + Phaser.Math.Between(-30, 30),
          g.pos.y + Phaser.Math.Between(-30, 20),
          Phaser.Math.Between(5, 12), Phaser.Math.Between(0, 1) ? 0xFF4400 : 0xFFAA00, 0.9
        ).setDepth(50);
        scene.tweens.add({ targets: flame, y: flame.y - 40, alpha: 0, duration: 600, delay: i * 30, onComplete: () => flame.destroy() });
      }
    });
    scene.cameras.main.shake(600, 0.01);
  },

  drawArc(p, flipZone) {
    const g = p.arcGraphics;
    g.clear();
    const r = 32;
    const range = Stages.getFlipZoneRange(flipZone);
    g.lineStyle(6, 0x888888, 0.3);
    g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.strokePath();
    const gStart = -Math.PI / 2 + range.start * Math.PI * 2;
    const gEnd = -Math.PI / 2 + range.end * Math.PI * 2;
    g.lineStyle(6, CONFIG.PERFECT_GREEN, 0.5);
    g.beginPath(); g.arc(p.x, p.y, r, gStart, gEnd); g.strokePath();
    const prog = p.cookProgress;
    let arcColor = CONFIG.PERFECT_GREEN;
    if (prog < range.start) arcColor = 0x888888;
    else if (prog > range.end && prog < 0.9) arcColor = CONFIG.LATE_AMBER;
    else if (prog >= 0.9) arcColor = CONFIG.BURNT_RED;
    g.lineStyle(7, arcColor, 1);
    const pEnd = -Math.PI / 2 + prog * Math.PI * 2;
    g.beginPath(); g.arc(p.x, p.y, r, -Math.PI / 2, pEnd); g.strokePath();
    if (p.isDouble && p.flipsDone < p.flipsNeeded) {
      g.lineStyle(3, 0xFFD700, 0.6);
      g.beginPath(); g.arc(p.x, p.y, r + 6, 0, Math.PI * 2); g.strokePath();
    }
  },

  showInactivityWarning(scene, color, alpha) {
    if (!scene.inactivityWarning) {
      scene.inactivityWarning = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, color, 0).setDepth(90);
    }
    const pulse = Math.sin(scene.time.now * 0.006) * 0.5 + 0.5;
    scene.inactivityWarning.setFillStyle(color, alpha * pulse);
  },

  grillShake(scene, grillIdx) {
    const grill = scene.grills[grillIdx];
    if (grill) {
      scene.tweens.add({ targets: [grill.bg, grill.bars], x: grill.pos.x - 6, duration: 50, yoyo: true, repeat: 3 });
    }
  }
};
