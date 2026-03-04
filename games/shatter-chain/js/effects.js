// Shatter Chain - Visual Effects & Juice

class EffectsManager {
  constructor(scene) {
    this.scene = scene;
  }

  // Floating score text at impact point
  floatScore(x, y, points, chainDepth) {
    const color = CFG.CHAIN_COLORS[Math.min(chainDepth, 4)];
    const size = 20 + Math.min(chainDepth, 4) * 4;
    const label = chainDepth > 0 ? `+${points} x${Math.pow(2, Math.min(chainDepth, 3))}` : `+${points}`;
    const txt = this.scene.add.text(x, y, label, {
      fontSize: size + 'px', fontFamily: 'Arial', fontStyle: 'bold',
      color: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 700,
      ease: 'Power2', onComplete: () => txt.destroy()
    });
  }

  // Score HUD punch effect
  scoreHudPunch(scoreText) {
    if (!scoreText) return;
    this.scene.tweens.add({
      targets: scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80,
      yoyo: true, ease: 'Quad.easeOut'
    });
  }

  // Chain combo text in center of arena
  chainCombo(depth) {
    if (depth < 1) return;
    const txt = this.scene.add.text(CFG.WIDTH / 2, CFG.ARENA_TOP + CFG.ARENA_HEIGHT / 2,
      `CHAIN x${Math.pow(2, Math.min(depth, 3))}!`, {
        fontSize: depth >= 3 ? '56px' : '44px', fontFamily: 'Arial', fontStyle: 'bold',
        color: depth >= 3 ? CFG.COLOR.CASCADE_HEX : CFG.COLOR.SCORE_HEX,
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(110).setScale(0.5).setAlpha(1);

    this.scene.tweens.add({
      targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 100,
      ease: 'Back.easeOut', yoyo: true, hold: 600,
      onComplete: () => {
        this.scene.tweens.add({ targets: txt, alpha: 0, duration: 400, onComplete: () => txt.destroy() });
      }
    });
  }

  // Impact flash at point
  impactFlash(x, y) {
    const circle = this.scene.add.circle(x, y, 30, CFG.COLOR.WHITE, 0.8).setDepth(90);
    this.scene.tweens.add({
      targets: circle, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 120,
      onComplete: () => circle.destroy()
    });
  }

  // Spark particles at impact
  sparks(x, y, chainDepth, count) {
    const colors = [CFG.COLOR.SHARD, CFG.COLOR.SCORE, 0xFFA500, CFG.COLOR.CASCADE, CFG.COLOR.CASCADE];
    const color = colors[Math.min(chainDepth, 4)];
    const n = count || (8 + chainDepth * 4);
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      const r = 2 + Math.random() * 3;
      const spark = this.scene.add.circle(x, y, r, color, 0.9).setDepth(95);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed * 0.8,
        y: y + Math.sin(angle) * speed * 0.8,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300 + Math.random() * 300,
        onComplete: () => spark.destroy()
      });
    }
  }

  // Camera shake
  shake(intensity, duration) {
    this.scene.cameras.main.shake(duration || 150, intensity || 0.004);
  }

  // Camera zoom punch
  zoomPunch(scale, duration) {
    const cam = this.scene.cameras.main;
    this.scene.tweens.add({
      targets: cam, zoom: scale || 1.03, duration: 60,
      yoyo: true, hold: 40, ease: 'Quad.easeOut',
      onComplete: () => { cam.zoom = 1; }
    });
  }

  // Hit-stop (physics pause for N ms) - ONLY on first glass contact per ball launch
  hitStop(ms) {
    if (this.scene._hitStopActive) return;
    this.scene._hitStopActive = true;
    this.scene.matter.world.pause();
    this.scene.time.delayedCall(ms || 40, () => {
      this.scene.matter.world.resume();
      this.scene._hitStopActive = false;
    });
  }

  // Perfect cascade full-screen burst
  perfectCascade() {
    // Flash
    const flash = this.scene.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, CFG.COLOR.CASCADE, 0.4).setDepth(200);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Text
    const txt = this.scene.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 40, 'PERFECT CASCADE!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.CASCADE_HEX, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(210).setScale(0.3);

    this.scene.tweens.add({
      targets: txt, scaleX: 1.1, scaleY: 1.1, duration: 200,
      ease: 'Back.easeOut', hold: 800,
      onComplete: () => {
        this.scene.tweens.add({ targets: txt, alpha: 0, y: txt.y - 40, duration: 400, onComplete: () => txt.destroy() });
      }
    });

    // Radial particle burst
    this.sparks(CFG.WIDTH / 2, CFG.HEIGHT / 2, 4, 50);
    playPerfectCascade();
  }

  // Wave clear flash
  waveClearFlash() {
    const flash = this.scene.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, CFG.COLOR.CLEAR, 0.25).setDepth(200);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  }

  // Death effects
  deathEffects(callback) {
    // Red flash
    const flash = this.scene.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, CFG.COLOR.DANGER, 0.35).setDepth(200);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Screen shake
    this.shake(0.01, 300);
    playWaveFail();

    // Delay then callback
    this.scene.time.delayedCall(600, () => { if (callback) callback(); });
  }

  // Slow motion
  slowMotion(duration, scale) {
    this.scene.matter.world.engine.timing.timeScale = scale || 0.5;
    this.scene.time.delayedCall(duration || 800, () => {
      this.scene.matter.world.engine.timing.timeScale = 1;
    });
  }

  // Ball trail
  addTrail(ball) {
    if (!ball || !ball.body) return;
    const x = ball.x, y = ball.y;
    const ghost = this.scene.add.circle(x, y, 8, CFG.COLOR.BALL, 0.3).setDepth(5);
    this.scene.tweens.add({
      targets: ghost, alpha: 0, scaleX: 0.3, scaleY: 0.3,
      duration: 200, onComplete: () => ghost.destroy()
    });
  }

  // Ball launch stretch
  launchStretch(ball) {
    if (!ball) return;
    this.scene.tweens.add({
      targets: ball, scaleX: 1.3, scaleY: 0.7, duration: 60,
      yoyo: true, ease: 'Quad.easeOut'
    });
    // Glow
    const glow = this.scene.add.circle(ball.x, ball.y, CFG.BALL_RADIUS + 6, CFG.COLOR.WHITE, 0.5).setDepth(15);
    this.scene.tweens.add({ targets: glow, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 150, onComplete: () => glow.destroy() });
  }
}
