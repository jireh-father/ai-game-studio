// Liar's Tower — Juice effects (particles, shake, punch, audio)
// Mixed into GameScene via Object.assign at bottom of game.js

const Effects = {};

// ===== Web Audio =====
let _audioCtx = null;
function audioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return _audioCtx;
}

Effects.playTone = function(freq, duration, type, vol) {
  if (window.GameState && !window.GameState.soundEnabled) return;
  const ctx = audioCtx(); if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = vol || 0.15;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + duration);
  } catch (e) {}
};

Effects.playChime = function(f1, f2, type) {
  Effects.playTone(f1, 0.12, type || 'sine', 0.2);
  setTimeout(() => Effects.playTone(f2, 0.15, type || 'sine', 0.2), 80);
};

Effects.playThud = function() {
  Effects.playTone(80, 0.35, 'sawtooth', 0.25);
  Effects.playTone(110, 0.35, 'square', 0.12);
};

Effects.playCollapse = function() {
  const notes = [261, 220, 185, 155, 130, 98];
  notes.forEach((n, i) => setTimeout(() => Effects.playTone(n, 0.2, 'sawtooth', 0.2), i * 90));
};

Effects.playTick = function(pitch) {
  Effects.playTone(600 + pitch * 50, 0.05, 'square', 0.08);
};

// ===== Scene juice methods =====
Effects.burstParticles = function(scene, x, y, color, count) {
  count = count || 18;
  for (let i = 0; i < count; i++) {
    const p = scene.add.circle(x, y, Phaser.Math.Between(2, 5), color);
    p.setDepth(50);
    const ang = Math.random() * Math.PI * 2;
    const spd = Phaser.Math.Between(80, 260);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(ang) * spd,
      y: y + Math.sin(ang) * spd,
      alpha: 0,
      scale: 0,
      duration: 500,
      onComplete: () => p.destroy(),
    });
  }
};

Effects.scalePunch = function(scene, target, factor, dur) {
  factor = factor || 1.25; dur = dur || 100;
  const sx = target.scaleX, sy = target.scaleY;
  scene.tweens.add({
    targets: target, scaleX: sx * factor, scaleY: sy * factor,
    duration: dur, yoyo: true, ease: 'Quad.easeOut',
  });
};

Effects.floatText = function(scene, x, y, text, color, size) {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'Arial Black', fontSize: (size || 22) + 'px',
    color: color || '#FFE66D', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(60);
  scene.tweens.add({
    targets: t, y: y - 60, alpha: 0, duration: 700,
    onComplete: () => t.destroy(),
  });
};

Effects.redFlash = function(scene) {
  const r = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xCC2936, 0.35).setDepth(100);
  scene.tweens.add({ targets: r, alpha: 0, duration: 250, onComplete: () => r.destroy() });
};

Effects.goldFlash = function(scene) {
  const r = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xF5C518, 0.3).setDepth(100);
  scene.tweens.add({ targets: r, alpha: 0, duration: 200, onComplete: () => r.destroy() });
};

Effects.hitStop = function(scene, ms) {
  // Use setTimeout, NOT delayedCall (Phaser timers don't advance at timeScale=0)
  try { scene.physics && scene.physics.pause && scene.physics.pause(); } catch (e) {}
  scene.tweens.pauseAll();
  setTimeout(() => {
    try { scene.physics && scene.physics.resume && scene.physics.resume(); } catch (e) {}
    scene.tweens.resumeAll();
  }, ms || 50);
};
