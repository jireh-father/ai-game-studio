// effects.js - Visual effects: success cascade, fail shake, lock slam, floating text

const Effects = {
  greenFlash(scene) {
    const w = scene.cameras.main.width, h = scene.cameras.main.height;
    const flash = scene.add.rectangle(w/2, h/2, w, h, 0x4CAF50, 0.2);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
    scene.cameras.main.shake(100, 0.002);
  },

  redFlash(scene) {
    const w = scene.cameras.main.width, h = scene.cameras.main.height;
    const flash = scene.add.rectangle(w/2, h/2, w, h, 0xF44336, 0.25);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
    scene.cameras.main.shake(200, 0.004);
  },

  checkmarkCascade(scene, ruleDisplays) {
    ruleDisplays.forEach((rd, i) => {
      scene.time.delayedCall(i * 80, () => {
        rd.icon.setText('V'); rd.icon.setColor(COLORS.SUCCESS);
        scene.tweens.add({ targets: rd.bg, scaleX: 1.08, scaleY: 1.08, duration: 100, yoyo: true });
      });
    });
  },

  violationShake(scene, ruleDisplays, results) {
    results.forEach(r => {
      const rd = ruleDisplays.find(d => d.ruleId === r.ruleId);
      if (!rd) return;
      if (r.satisfied) {
        rd.icon.setText('V'); rd.icon.setColor(COLORS.SUCCESS);
      } else {
        rd.icon.setText('X'); rd.icon.setColor(COLORS.FAIL);
        scene.tweens.add({ targets: [rd.bg, rd.txt, rd.icon], x: '+=4', duration: 50, yoyo: true, repeat: 3 });
      }
    });
  },

  floatingText(scene, x, y, text, color, size) {
    const ft = scene.add.text(x, y, text, {
      fontSize: (size || '22') + 'px', fontFamily: 'Arial Black', fill: color
    }).setOrigin(0.5);
    scene.tweens.add({ targets: ft, y: y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy() });
  },

  penaltyText(scene, w) {
    const pt = scene.add.text(w/2, 32, '-5s', {
      fontSize: '16px', fontFamily: 'Arial Black', fill: COLORS.FAIL
    }).setOrigin(0.5);
    scene.tweens.add({ targets: pt, y: 16, alpha: 0, duration: 500, onComplete: () => pt.destroy() });
  },

  scorePunch(scene, scoreText) {
    scene.tweens.add({ targets: scoreText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });
  },

  speedBonus(scene, w, bonus) {
    const sb = scene.add.text(w/2, 36, 'SPEED +' + bonus, {
      fontSize: '12px', fontFamily: 'Arial Bold', fill: COLORS.TIMER_HEALTHY
    }).setOrigin(0.5);
    scene.tweens.add({ targets: sb, y: 20, alpha: 0, duration: 500, onComplete: () => sb.destroy() });
  },

  deathShake(scene) {
    scene.cameras.main.shake(400, 0.01);
    const w = scene.cameras.main.width, h = scene.cameras.main.height;
    const flash = scene.add.rectangle(w/2, h/2, w, h, 0xF44336, 0.3);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 300 });
  },

  tileDepress(scene, tileBg, tileLabel) {
    scene.tweens.add({ targets: [tileBg, tileLabel], scaleX: 0.92, scaleY: 0.92, duration: 80, yoyo: true });
  },

  passwordSlideIn(scene, pwText, targetY) {
    pwText.setY(targetY + 4);
    scene.tweens.add({ targets: pwText, y: targetY, duration: 100, ease: 'Back.easeOut' });
  }
};
