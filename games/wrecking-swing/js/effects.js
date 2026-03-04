// Wrecking Swing - Visual Effects & Rendering
class Effects {
  static drawBall(graphics, x, y) {
    graphics.clear();
    // Outer ring
    graphics.fillStyle(CONFIG.COLORS.BALL_STROKE, 1);
    graphics.fillCircle(x, y, CONFIG.BALL_RADIUS);
    // Inner fill
    graphics.fillStyle(CONFIG.COLORS.BALL, 1);
    graphics.fillCircle(x, y, CONFIG.BALL_RADIUS - 3);
    // Highlight
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillCircle(x - 6, y - 6, 6);
  }

  static drawCrane(graphics) {
    graphics.clear();
    graphics.fillStyle(CONFIG.COLORS.CRANE_DARK, 1);
    graphics.fillRect(CONFIG.GAME_WIDTH / 2 - 4, 0, 8, CONFIG.CRANE_Y + 10);
    graphics.fillStyle(CONFIG.COLORS.CRANE, 1);
    graphics.fillRect(40, CONFIG.CRANE_Y - 3, CONFIG.GAME_WIDTH - 80, 6);
  }

  static drawCable(graphics, fromX, fromY, toX, toY) {
    graphics.clear();
    graphics.lineStyle(3, CONFIG.COLORS.CRANE_DARK, 1);
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    graphics.lineTo(toX, toY);
    graphics.strokePath();
  }

  static drawIdleRing(graphics, x, y, progress) {
    graphics.clear();
    graphics.lineStyle(4, CONFIG.COLORS.DANGER, 0.8);
    graphics.beginPath();
    graphics.arc(x, y, CONFIG.BALL_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
    graphics.strokePath();
  }

  static spawnDestructionParticles(scene, pos, isChain) {
    const color = isChain ? CONFIG.COLORS.CHAIN_PARTICLE : CONFIG.COLORS.DESTRUCT_PARTICLE;
    const count = isChain ? 18 : 14;
    for (let i = 0; i < count; i++) {
      const r = Phaser.Math.Between(3, 6);
      const p = scene.add.circle(pos.x, pos.y, r, color).setDepth(15);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(100, 220);
      const tx = pos.x + Math.cos(angle) * speed * 0.5;
      const ty = pos.y + Math.sin(angle) * speed * 0.5;
      scene.tweens.add({
        targets: p, x: tx, y: ty + 40, alpha: 0, scale: 0,
        duration: 450, ease: 'Quad.easeOut', onComplete: () => p.destroy()
      });
    }

    if (isChain) {
      const ring = scene.add.circle(pos.x, pos.y, 10, CONFIG.COLORS.CHAIN_PARTICLE, 0.8).setDepth(14);
      ring.setStrokeStyle(2, CONFIG.COLORS.CHAIN_PARTICLE);
      scene.tweens.add({
        targets: ring, scaleX: 2.8, scaleY: 2.8, alpha: 0,
        duration: 250, onComplete: () => ring.destroy()
      });
    }
  }

  static showChainText(scene, count) {
    if (scene.chainText) scene.chainText.destroy();
    const size = Math.min(32, 22 + count * 2);
    scene.chainText = scene.add.text(CONFIG.GAME_WIDTH / 2, 80, `CHAIN x${count}!`, {
      fontSize: `${size}px`, fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.CHAIN, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({
      targets: scene.chainText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true,
      onComplete: () => {
        scene.time.delayedCall(600, () => {
          if (scene.chainText) {
            scene.tweens.add({
              targets: scene.chainText, alpha: 0, duration: 200,
              onComplete: () => { if (scene.chainText) { scene.chainText.destroy(); scene.chainText = null; } }
            });
          }
        });
      }
    });
  }

  static showFloatingScore(scene, pts, pos) {
    const color = pts < 0 ? CONFIG.HEX.PENALTY : CONFIG.HEX.REWARD;
    const prefix = pts > 0 ? '+' : '';
    const ft = scene.add.text(pos.x, pos.y, `${prefix}${pts}`, {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif', fill: color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({ targets: ft, y: pos.y - 55, alpha: 0, duration: 700, onComplete: () => ft.destroy() });
  }

  static addTrail(scene, x, y) {
    const t = scene.add.circle(x, y, CONFIG.BALL_RADIUS * 0.8, CONFIG.COLORS.BALL, 0.35).setDepth(1);
    scene.trailSprites.push(t);
    scene.tweens.add({
      targets: t, alpha: 0, scale: 0.3, duration: 180,
      onComplete: () => {
        t.destroy();
        const idx = scene.trailSprites.indexOf(t);
        if (idx !== -1) scene.trailSprites.splice(idx, 1);
      }
    });
  }
}
