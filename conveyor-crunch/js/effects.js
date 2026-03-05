// Conveyor Crunch - Juice & Effects
const Effects = {
  // Particle burst at position with given color
  particleBurst(scene, x, y, color, count, lifespan) {
    count = count || 15;
    lifespan = lifespan || 400;
    const hex = typeof color === 'string' ? parseInt(color.replace('#',''), 16) : color;
    for (let i = 0; i < count; i++) {
      const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), hex);
      p.setDepth(100);
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 250);
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed * 0.4,
        y: y + Math.sin(angle) * speed * 0.4,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: lifespan, ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
  },

  // Screen shake
  shake(scene, intensity, duration) {
    scene.cameras.main.shake(duration || 100, intensity || 0.003);
  },

  // Scale punch on object
  scalePunch(scene, obj, scale, duration) {
    if (!obj || !obj.scene) return;
    scene.tweens.add({
      targets: obj, scaleX: scale || 1.3, scaleY: scale || 1.3,
      duration: duration || 80, yoyo: true, ease: 'Power2'
    });
  },

  // Floating score text
  floatingText(scene, x, y, text, color, size) {
    const txt = scene.add.text(x, y, text, {
      fontSize: (size || 24) + 'px', fontFamily: 'Arial Black, Arial',
      fill: color || '#FFFFFF', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0,
      duration: 600, ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  },

  // Item toss arc to bin
  tossItem(scene, item, targetX, targetY, onComplete) {
    const midY = Math.min(item.y, targetY) - 60;
    scene.tweens.add({
      targets: item, x: targetX, y: targetY,
      scaleX: 0.5, scaleY: 0.5, alpha: 0.3,
      duration: 250, ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const p = tween.progress;
        const arc = Math.sin(p * Math.PI) * -50;
        item.y = Phaser.Math.Linear(item.getData('startY') || item.y, targetY, p) + arc;
      },
      onComplete: () => { if (onComplete) onComplete(); item.destroy(); }
    });
    item.setData('startY', item.y);
  },

  // Wrong sort flash
  wrongFlash(scene, item) {
    if (!item || !item.scene) return;
    scene.tweens.add({
      targets: item, x: item.x - 5, duration: 40,
      yoyo: true, repeat: 3, onComplete: () => {
        scene.tweens.add({ targets: item, alpha: 0, duration: 200,
          onComplete: () => item.destroy() });
      }
    });
  },

  // Red vignette flash
  vignetteFlash(scene) {
    const vig = scene.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2,
      CONFIG.WIDTH, CONFIG.HEIGHT, 0xC0392B, 0.3).setDepth(150);
    scene.tweens.add({
      targets: vig, alpha: 0, duration: 300,
      onComplete: () => vig.destroy()
    });
  },

  // Stage clear celebration
  stageClear(scene, stageNum, isPerfect) {
    const label = isPerfect ? 'PERFECT!' : 'STAGE ' + stageNum;
    const color = isPerfect ? COLORS.REWARD : '#FFFFFF';
    const sz = isPerfect ? 42 : 34;
    const txt = scene.add.text(CONFIG.WIDTH + 100, CONFIG.HEIGHT/2 - 40, label, {
      fontSize: sz + 'px', fontFamily: 'Arial Black, Arial',
      fill: color, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: txt, x: CONFIG.WIDTH / 2, duration: 300, ease: 'Power2',
      onComplete: () => {
        scene.time.delayedCall(400, () => {
          scene.tweens.add({ targets: txt, x: -100, duration: 300, ease: 'Power2',
            onComplete: () => txt.destroy() });
        });
      }
    });
    if (isPerfect) {
      Effects.particleBurst(scene, CONFIG.WIDTH/2, CONFIG.HEIGHT/2 - 40, COLORS.REWARD, 30, 600);
    }
  },

  // Combo text display
  comboText(scene, combo) {
    if (combo < 2) return;
    const sz = Math.min(44, 24 + combo * 2);
    const color = combo >= 5 ? COLORS.REWARD : '#FFFFFF';
    const txt = scene.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2 + 30, 'x' + combo, {
      fontSize: sz + 'px', fontFamily: 'Arial Black, Arial',
      fill: color, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: txt, alpha: 0, scaleX: 1.3, scaleY: 1.3,
      duration: 800, onComplete: () => txt.destroy()
    });
    if (combo >= 10) {
      const flash = scene.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2,
        CONFIG.WIDTH, CONFIG.HEIGHT, 0xFFFFFF, 0.2).setDepth(149);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 100, onComplete: () => flash.destroy() });
    }
  },

  // Pile impact dust
  pileImpact(scene, x, y) {
    Effects.particleBurst(scene, x, y, '#95A5A6', 8, 300);
    Effects.shake(scene, 0.002, 80);
  },

  // Death effects
  deathSequence(scene, callback) {
    Effects.shake(scene, 0.012, 400);
    Effects.vignetteFlash(scene);
    scene.tweens.add({
      targets: scene.cameras.main, alpha: 0.7, duration: 500
    });
    setTimeout(() => { if (callback) callback(); }, 700);
  },

  // Bin bounce
  binBounce(scene, bin) {
    if (!bin || !bin.scene) return;
    scene.tweens.add({
      targets: bin, scaleX: 1.15, scaleY: 1.15,
      duration: 60, yoyo: true, ease: 'Bounce.easeOut'
    });
  },

  // Rush warning
  rushWarning(scene) {
    const txt = scene.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT/2 - 60, 'RUSH!', {
      fontSize: '48px', fontFamily: 'Arial Black', fill: '#E74C3C',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: txt, scaleX: 1.3, scaleY: 1.3, alpha: 0,
      duration: 800, ease: 'Power2', onComplete: () => txt.destroy()
    });
    Effects.shake(scene, 0.005, 200);
  }
};
