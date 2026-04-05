const Effects = {
  screenShake(scene, intensity, duration) {
    scene.cameras.main.shake(duration, intensity / GAME_W);
  },

  cardPunch(scene, target, scale, duration) {
    scene.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration: duration / 2, yoyo: true,
      ease: 'Back.easeOut'
    });
  },

  floatingText(scene, x, y, text, color, size) {
    const txt = scene.add.text(x, y, text, {
      fontSize: (size || 24) + 'px', fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold', color: color || '#FFFFFF',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(800);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  },

  redFlash(scene) {
    const flash = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLOR.wrongFlash, 0.35).setDepth(700);
    scene.tweens.add({
      targets: flash, alpha: 0, duration: 150,
      onComplete: () => flash.destroy()
    });
  },

  bgFlash(scene, color, alpha, duration) {
    const flash = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, color, alpha).setDepth(700);
    scene.tweens.add({
      targets: flash, alpha: 0, duration: duration || 300,
      onComplete: () => flash.destroy()
    });
  },

  particleBurst(scene, x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 80;
      const p = scene.add.circle(x, y, 4, color || COLOR.correctFlash).setDepth(750);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, duration: 400,
        onComplete: () => p.destroy()
      });
    }
  },

  streakMilestone(scene, streak) {
    const ms = SCORE.milestones[streak];
    if (!ms) return;
    let color, alpha, size;
    if (streak === 5) { color = 0xA855F7; alpha = 0.3; size = 36; }
    else if (streak === 10) { color = 0xEAB308; alpha = 0.4; size = 48; }
    else { color = 0xA855F7; alpha = 0.5; size = 60; }
    Effects.bgFlash(scene, color, alpha, 300);
    Effects.floatingText(scene, GAME_W / 2, GAME_H / 2 - 40, `+${ms} BONUS!`, '#FFFFFF', size);
    Effects.playTone(scene, streak === 5 ? [523, 659, 784] : streak === 10 ? [523, 587, 659, 784, 880] : [523, 587, 659, 784, 880, 1047], 120);
  },

  playTone(scene, freqs, noteDur) {
    if (!scene.sound || !scene.game.sound) return;
    try {
      const ctx = scene.sound.context || (window.AudioContext && new AudioContext());
      if (!ctx || GameState.muted) return;
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * noteDur / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i + 1) * noteDur / 1000);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * noteDur / 1000);
        osc.stop(ctx.currentTime + (i + 1) * noteDur / 1000);
      });
    } catch (e) {}
  },

  correctSound(scene) { Effects.playTone(scene, [523, 659], 100); },
  wrongSound(scene) { Effects.playTone(scene, [330, 220], 150); },
  timeoutSound(scene) { Effects.playTone(scene, [440, 330, 220], 130); },
  deathSound(scene) { Effects.playTone(scene, [440, 392, 330, 262], 200); },
  buttonSound(scene) { Effects.playTone(scene, [880], 80); },

  deathSequence(scene, cards, onComplete) {
    Effects.screenShake(scene, 12, 400);
    Effects.deathSound(scene);
    cards.forEach(c => {
      Effects.particleBurst(scene, c.x, c.y, 6, COLOR.strikeLost);
    });
    const overlay = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLOR.deathOverlay, 0).setDepth(900);
    scene.tweens.add({
      targets: overlay, alpha: 0.6, duration: 500,
      onComplete: () => { setTimeout(() => { overlay.destroy(); if (onComplete) onComplete(); }, 100); }
    });
  }
};
