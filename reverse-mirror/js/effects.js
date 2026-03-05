// effects.js - Particles, screen shake, trails, mirror effects

class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.trails = [];
  }

  screenShake(intensity, duration) {
    if (!this.scene || !this.scene.cameras) return;
    this.scene.cameras.main.shake(duration, intensity / GAME_WIDTH);
  }

  cameraFlash(color, duration, alpha) {
    if (!this.scene || !this.scene.cameras) return;
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    const flash = this.scene.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, color, alpha || 0.5);
    flash.setDepth(100);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: duration || 120,
      onComplete: () => flash.destroy()
    });
  }

  scalePunch(target, scale, duration) {
    if (!target || !this.scene) return;
    this.scene.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: duration || 80, yoyo: true, ease: 'Quad.Out'
    });
  }

  floatingText(x, y, text, color, size) {
    if (!this.scene) return;
    const txt = this.scene.add.text(x, y, text, {
      fontSize: (size || 20) + 'px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: color || PALETTE.uiText, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(90);
    this.scene.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 500,
      delay: 100, onComplete: () => txt.destroy()
    });
  }

  particleBurst(x, y, count, color, speed) {
    if (!this.scene) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const spd = (speed || 200) * (0.5 + Math.random() * 0.5);
      const size = 2 + Math.random() * 3;
      const p = this.scene.add.circle(x, y, size, color || PALETTE.whiteHex).setDepth(85);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * spd * 0.3,
        y: y + Math.sin(angle) * spd * 0.3,
        alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  }

  addTrail(char, color) {
    if (!this.scene || !char) return;
    const alphas = [0.4, 0.2, 0.1];
    for (let i = 0; i < 3; i++) {
      const ghost = this.scene.add.image(char.x, char.y, char.texture.key)
        .setAlpha(alphas[i]).setDepth(5).setScale(char.scaleX);
      this.scene.tweens.add({
        targets: ghost, alpha: 0, duration: 150,
        delay: i * 30, onComplete: () => ghost.destroy()
      });
    }
  }

  hitEffect(x, y) {
    this.screenShake(5, 150);
    this.cameraFlash(PALETTE.dangerFlash, 120, 0.5);
    this.particleBurst(x, y, 12, PALETTE.dangerFlash, 180);
    audioSynth.playHit();
  }

  deathEffect(x, y) {
    this.screenShake(12, 350);
    this.cameraFlash(PALETTE.dangerFlash, 250, 0.8);
    this.shatterEffect(x, y);
    audioSynth.playDeath();
  }

  shatterEffect(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const tri = this.scene.add.triangle(
        x, y, 0, -8, 7, 4, -7, 4, PALETTE.mirror
      ).setDepth(95);
      this.scene.tweens.add({
        targets: tri,
        x: x + Math.cos(angle) * 80, y: y + Math.sin(angle) * 80,
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0, duration: 400,
        onComplete: () => tri.destroy()
      });
    }
  }

  perfectEffect(x, y) {
    this.particleBurst(x, y, 10, PALETTE.whiteHex, 150);
    this.particleBurst(x, y, 8, PALETTE.mirror, 120);
    this.cameraFlash(PALETTE.perfectFlash, 80, 0.3);
    audioSynth.playPerfect();
  }

  stageClearEffect(mirrorLine) {
    if (mirrorLine) {
      this.scene.tweens.add({
        targets: mirrorLine, alpha: 1, duration: 150, yoyo: true, repeat: 1
      });
    }
    this.particleBurst(GAME_WIDTH/2, GAME_HEIGHT/2, 20, PALETTE.mirror, 200);
    this.particleBurst(GAME_WIDTH/2, GAME_HEIGHT/2, 15, PALETTE.comboGlowHex, 160);
    const cam = this.scene.cameras.main;
    this.scene.tweens.add({
      targets: cam, zoom: 1.04, duration: 200, yoyo: true, ease: 'Sine.InOut'
    });
    audioSynth.playStageClear();
  }

  mirrorRotateEffect() {
    this.cameraFlash(PALETTE.mirror, 200, 0.2);
    audioSynth.playRotation();
  }

  surviveEffect(x, y, combo, isPerfect) {
    if (isPerfect) {
      this.perfectEffect(x, y);
    } else {
      this.particleBurst(x, y, 6, PALETTE.gapGlow, 100);
    }
    audioSynth.playSurvive(combo);
    if (combo > 0 && combo % 5 === 0) {
      audioSynth.playComboMilestone(combo);
    }
  }
}
