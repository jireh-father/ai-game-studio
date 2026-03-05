// Glass Walk - Visual Effects & Juice
const Effects = {
  shatterPanel(scene, x, y, panelW, panelH) {
    for (let i = 0; i < 20; i++) {
      const shard = scene.add.image(
        x + Phaser.Math.Between(-panelW / 2, panelW / 2),
        y + Phaser.Math.Between(-panelH / 2, panelH / 2),
        'shard'
      ).setScale(Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(50);
      scene.tweens.add({
        targets: shard,
        x: shard.x + Phaser.Math.Between(-120, 120),
        y: shard.y + Phaser.Math.Between(40, 200),
        angle: Phaser.Math.Between(180, 720),
        alpha: 0, scale: 0,
        duration: Phaser.Math.Between(400, 700),
        ease: 'Power2', onComplete: () => shard.destroy()
      });
    }
  },

  screenShake(scene, intensity, duration) {
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.shake(duration || 300, intensity || 0.008);
    }
  },

  redFlash(scene) {
    const flash = scene.add.rectangle(
      scene.cameras.main.centerX, scene.cameras.main.centerY,
      scene.scale.width * 2, scene.scale.height * 2,
      COLORS.danger, 0
    ).setDepth(100).setScrollFactor(0);
    scene.tweens.add({
      targets: flash, alpha: 0.4, duration: 75, yoyo: true,
      onComplete: () => flash.destroy()
    });
  },

  scorePopup(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif',
      color: color || '#FFD600', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 600,
      ease: 'Power2', onComplete: () => txt.destroy()
    });
  },

  playerFall(scene, player) {
    if (!player) return;
    scene.tweens.add({
      targets: player, y: player.y + 200,
      angle: 90, alpha: 0, duration: 400, ease: 'Power2'
    });
  },

  playerStep(scene, player, targetY, cb) {
    if (!player) return;
    scene.tweens.add({
      targets: player, y: targetY - 20, duration: 100, ease: 'Power1',
      onComplete: () => {
        scene.tweens.add({
          targets: player, y: targetY, scaleY: 0.8, duration: 80,
          yoyo: true, onComplete: () => { player.setScale(1); if (cb) cb(); }
        });
      }
    });
  },

  panelGlow(scene, panel, color) {
    const glow = scene.add.rectangle(
      panel.x, panel.y, panel.width + 10, panel.height + 10,
      color || COLORS.safeGlow, 0.6
    ).setDepth(panel.depth - 1);
    scene.tweens.add({
      targets: glow, alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 300, onComplete: () => glow.destroy()
    });
  },

  milestoneText(scene, stage) {
    const cx = scene.cameras.main.centerX;
    const cy = scene.cameras.main.centerY;
    const txt = scene.add.text(cx, cy, `STAGE ${stage}!`, {
      fontSize: '48px', fontFamily: 'Arial Black, sans-serif',
      color: '#FFD600', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(80).setScale(2).setScrollFactor(0);
    scene.tweens.add({
      targets: txt, scale: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: txt, alpha: 0, y: cy - 40, duration: 500, delay: 400,
          onComplete: () => txt.destroy()
        });
      }
    });
    for (let i = 0; i < 15; i++) {
      const p = scene.add.image(cx, cy, 'goldParticle')
        .setScale(0.5).setDepth(79).setScrollFactor(0);
      scene.tweens.add({
        targets: p,
        x: cx + Phaser.Math.Between(-100, 100),
        y: cy + Phaser.Math.Between(-80, 80),
        alpha: 0, scale: 0, duration: 600,
        delay: Phaser.Math.Between(0, 100),
        onComplete: () => p.destroy()
      });
    }
  },

  streakText(scene, streak) {
    const cx = scene.cameras.main.centerX;
    const cy = scene.cameras.main.centerY - 60;
    const txt = scene.add.text(cx, cy, `x${streak}!`, {
      fontSize: '32px', fontFamily: 'Arial Black, sans-serif',
      color: '#80D8FF', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(70).setScale(1.5).setScrollFactor(0);
    scene.tweens.add({
      targets: txt, scale: 1, alpha: 0, duration: 400,
      ease: 'Power2', onComplete: () => txt.destroy()
    });
  },

  heartLose(scene, spr) {
    if (!spr) return;
    scene.tweens.add({
      targets: spr, scale: 1.5, duration: 100, yoyo: true,
      onComplete: () => spr.setTexture('heartEmpty')
    });
  },

  flashPanel(scene, panel, dur) {
    const flash = scene.add.rectangle(
      panel.x, panel.y, panel.width, panel.height, 0xFFFFFF, 0.8
    ).setDepth(panel.depth + 1);
    scene.tweens.add({
      targets: flash, alpha: 0, duration: dur * 1000,
      onComplete: () => flash.destroy()
    });
  },

  hapticTap() {
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
  },
  hapticDeath() {
    try { if (navigator.vibrate) navigator.vibrate([50, 30, 100]); } catch (e) {}
  }
};
