// effects.js — Visual effects, particles, screen flash, lasso rendering

const Effects = {
  burstParticles(scene, x, y, count, colorHex) {
    const c = Phaser.Display.Color.HexStringToColor(colorHex);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const p = scene.add.circle(x, y, 3 + Math.random() * 2, c.color).setDepth(100);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  },

  screenFlash(scene, colorHex, alpha, duration) {
    const c = Phaser.Display.Color.HexStringToColor(colorHex).color;
    scene.flashOverlay.setFillStyle(c, alpha);
    scene.tweens.add({
      targets: scene.flashOverlay, alpha: { from: 1, to: 0 },
      duration: duration
    });
  },

  showStageText(scene, text, color) {
    const txt = scene.add.text(GAME_WIDTH / 2, -50, text, {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: color
    }).setOrigin(0.5).setDepth(300);
    scene.tweens.add({
      targets: txt, y: GAME_HEIGHT / 2 - 60, duration: 300, ease: 'Bounce.easeOut'
    });
    scene.tweens.add({
      targets: txt, scaleX: 1.5, scaleY: 1.5, duration: 150, delay: 300, yoyo: true
    });
    scene.tweens.add({
      targets: txt, alpha: 0, y: GAME_HEIGHT / 2 - 100, duration: 400, delay: 700,
      onComplete: () => txt.destroy()
    });
  },

  showIdleWarning(scene) {
    AudioManager.play('warning');
    const warn = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'WAKE UP!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.dangerFlash
    }).setOrigin(0.5).setDepth(400);
    scene.tweens.add({
      targets: warn, scale: 1.3, duration: 200, yoyo: true, repeat: 1,
      onComplete: () => {
        scene.tweens.add({
          targets: warn, alpha: 0, duration: 300, onComplete: () => warn.destroy()
        });
      }
    });
  },

  floatingScore(scene, x, y, points) {
    const txt = scene.add.text(x, y, '+' + points, {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.secondary
    }).setOrigin(0.5).setDepth(200);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  catchEffects(scene, ingredient, combo) {
    const type = ingredient.ingredientType;

    // Sound
    if (type.id === 'goldstar') {
      AudioManager.play('goldCatch');
    } else {
      AudioManager.play('catch');
    }
    if (combo >= 2) AudioManager.play('combo');

    // Particles from catch point
    Effects.burstParticles(scene, ingredient.x, ingredient.y, 20, type.color);

    // Green flash
    Effects.screenFlash(scene, PALETTE.reward, 0.15, 80);

    // Camera zoom
    scene.cameras.main.zoomTo(1.03, 100, 'Sine.easeOut', true, (cam, prog) => {
      if (prog === 1) scene.cameras.main.zoomTo(1, 180);
    });

    // Hit-stop
    scene.tweens.pauseAll();
    scene.time.delayedCall(40, () => scene.tweens.resumeAll());

    // Combo burst at 3+
    if (combo >= 3) {
      Effects.burstParticles(scene, CHEF_POS.x, CHEF_POS.y - 20, 20, PALETTE.secondary);
    }

    // Catch pop animation then destroy
    scene.tweens.add({
      targets: ingredient, scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 200, onComplete: () => {
        scene.time.delayedCall(0, () => scene.removeIngredient(ingredient));
      }
    });

    // Screen shake proportional to combo
    const shakeIntensity = Math.min(0.003 + combo * 0.001, 0.008);
    scene.cameras.main.shake(100, shakeIntensity);
  },

  missEffects(scene, ingredient) {
    AudioManager.play('miss');

    // Red flash
    Effects.screenFlash(scene, PALETTE.dangerFlash, 0.25, 120);

    // Splat animation
    scene.tweens.add({
      targets: ingredient, scaleX: 1.5, scaleY: 0.3, alpha: 0,
      duration: 300, onComplete: () => {
        scene.time.delayedCall(0, () => scene.removeIngredient(ingredient));
      }
    });
  },

  deathEffects(scene) {
    AudioManager.play('gameOver');

    // Big screen shake
    scene.cameras.main.shake(300, 0.015);

    // Red overlay flash
    Effects.screenFlash(scene, PALETTE.dangerFlash, 0.35, 500);

    // Slow-mo effect
    scene.tweens.timeScale = 0.3;
    scene.time.delayedCall(300, () => { scene.tweens.timeScale = 1; });

    // Splat all remaining ingredients
    scene.ingredients.forEach(ing => {
      if (ing.active) {
        ing.active = false;
        scene.tweens.add({
          targets: ing, scaleX: 1.5, scaleY: 0.3, alpha: 0, duration: 300
        });
      }
    });
  }
};

// Lasso renderer
const LassoRenderer = {
  draw(scene) {
    scene.lassoGfx.clear();
    if (scene.lassoState === 'IDLE') return;

    const isCombo = scene.combo >= 3;
    const color = isCombo ? 0xFFB703 : 0xF4A261;
    const width = isCombo ? LASSO_CONFIG.comboStrokeWidth : LASSO_CONFIG.strokeWidth;
    scene.lassoGfx.lineStyle(width, color);

    const startX = CHEF_POS.x;
    const startY = CHEF_POS.y - 20;
    const tipX = LassoRenderer.tipX(scene);
    const tipY = LassoRenderer.tipY(scene);
    const wobble = Math.sin(scene.lassoWobbleTime) * LASSO_CONFIG.wobbleAmount * scene.lassoProgress;

    const cp1x = startX + wobble;
    const cp1y = Phaser.Math.Linear(startY, tipY, 0.3);
    const cp2x = tipX - wobble * 0.7;
    const cp2y = Phaser.Math.Linear(startY, tipY, 0.7);

    scene.lassoGfx.beginPath();
    scene.lassoGfx.moveTo(startX, startY);
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const x = u*u*u*startX + 3*u*u*t*cp1x + 3*u*t*t*cp2x + t*t*t*tipX;
      const y = u*u*u*startY + 3*u*u*t*cp1y + 3*u*t*t*cp2y + t*t*t*tipY;
      scene.lassoGfx.lineTo(x, y);
    }
    scene.lassoGfx.strokePath();

    // Catch zone circle at tip
    const radius = isCombo ? LASSO_CONFIG.comboRadius : LASSO_CONFIG.baseRadius;
    if (scene.lassoState === 'EXTENDING') {
      scene.lassoGfx.lineStyle(2, color, 0.4);
      scene.lassoGfx.strokeCircle(tipX, tipY, radius);
    }
  },

  tipX(scene) {
    return Phaser.Math.Linear(CHEF_POS.x, scene.lassoTargetX, scene.lassoProgress);
  },

  tipY(scene) {
    return Phaser.Math.Linear(CHEF_POS.y - 20, scene.lassoTargetY, scene.lassoProgress);
  },

  update(scene, delta) {
    if (scene.lassoState === 'IDLE') return;

    const dt = delta / 1000;
    scene.lassoWobbleTime += dt * 12;

    if (scene.lassoState === 'EXTENDING') {
      scene.lassoProgress += dt * (1000 / LASSO_CONFIG.extendDuration);
      if (scene.lassoProgress >= 1) {
        scene.lassoProgress = 1;
        LassoRenderer.checkCatch(scene);
      }
    } else if (scene.lassoState === 'RETRACTING') {
      scene.lassoProgress -= dt * (1000 / LASSO_CONFIG.snapDuration);
      if (scene.lassoProgress <= 0) {
        scene.lassoProgress = 0;
        scene.lassoState = 'IDLE';
        scene.lassoGfx.clear();
      }
    } else if (scene.lassoState === 'CATCHING') {
      scene.lassoProgress -= dt * (1000 / (LASSO_CONFIG.snapDuration * 1.2));
      if (scene.lassoCaughtIngredient && scene.lassoCaughtIngredient.active) {
        scene.lassoCaughtIngredient.x = LassoRenderer.tipX(scene);
        scene.lassoCaughtIngredient.y = LassoRenderer.tipY(scene);
      }
      if (scene.lassoProgress <= 0) {
        scene.lassoProgress = 0;
        scene.lassoState = 'IDLE';
        scene.lassoGfx.clear();
        if (scene.lassoCaughtIngredient) {
          scene.onIngredientCatch(scene.lassoCaughtIngredient);
          scene.lassoCaughtIngredient = null;
        }
      }
    }
  },

  checkCatch(scene) {
    const tipX = LassoRenderer.tipX(scene);
    const tipY = LassoRenderer.tipY(scene);
    const radius = scene.combo >= 3 ? LASSO_CONFIG.comboRadius : LASSO_CONFIG.baseRadius;

    let caught = null;
    let bestDist = radius;
    scene.ingredients.forEach(ing => {
      if (!ing.active) return;
      const d = Phaser.Math.Distance.Between(tipX, tipY, ing.x, ing.y);
      if (d < bestDist) {
        bestDist = d;
        caught = ing;
      }
    });

    if (caught) {
      scene.lassoState = 'CATCHING';
      scene.lassoCaughtIngredient = caught;
      if (caught.fallTween) caught.fallTween.pause();
      if (caught.zigzagTween) caught.zigzagTween.pause();
    } else {
      scene.lassoState = 'RETRACTING';
      scene.combo = 0;
    }
  }
};
