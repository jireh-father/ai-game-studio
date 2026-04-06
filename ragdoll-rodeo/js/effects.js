// effects.js — Juice effects: particles, screen shake, scale punch, floating text, sounds

const Effects = {
  // Web Audio context (lazy init)
  _audioCtx: null,
  getAudio() {
    if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this._audioCtx;
  },

  // Screen shake
  shake(scene, intensity, duration) {
    if (!scene.cameras || !scene.cameras.main) return;
    scene.cameras.main.shake(duration || 150, intensity || 0.004);
  },

  // Scale punch
  scalePunch(scene, target, scaleMax, dur) {
    if (!target || !target.active) return;
    scene.tweens.add({
      targets: target, scaleX: scaleMax || 1.3, scaleY: scaleMax || 1.3,
      duration: dur || 80, yoyo: true, ease: 'Back.easeOut'
    });
  },

  // Floating text
  floatingText(scene, x, y, text, color, size) {
    const txt = scene.add.text(x, y, text, {
      fontSize: (size || 20) + 'px', fontFamily: 'Arial Black',
      fill: color || '#F1C40F', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 700,
      ease: 'Power2', onComplete: () => txt.destroy()
    });
  },

  // Particle burst
  particleBurst(scene, x, y, count, textureKey, speed) {
    if (!scene.textures.exists(textureKey)) return;
    const emitter = scene.add.particles(x, y, textureKey, {
      speed: { min: speed || 80, max: (speed || 80) * 3 },
      angle: { min: 0, max: 360 }, lifespan: 500,
      quantity: count || 15, scale: { start: 1, end: 0 },
      emitting: false
    });
    emitter.explode(count || 15);
    scene.time.delayedCall(600, () => emitter.destroy());
  },

  // Dust puff
  dustPuff(scene, x, y) {
    this.particleBurst(scene, x, y, 8, 'dust', 60);
  },

  // Camera zoom pulse
  zoomPulse(scene, zoomTo, dur) {
    if (!scene.cameras || !scene.cameras.main) return;
    const cam = scene.cameras.main;
    scene.tweens.add({
      targets: cam, zoom: zoomTo || 1.06, duration: dur || 100,
      yoyo: true, ease: 'Sine.easeInOut'
    });
  },

  // Hit-stop (micro freeze using setTimeout, NOT delayedCall)
  hitStop(scene, ms) {
    if (!scene.matter || !scene.matter.world) return;
    scene.matter.world.pause();
    setTimeout(() => {
      if (scene && scene.matter && scene.matter.world) {
        scene.matter.world.resume();
      }
    }, ms || 60);
  },

  // Sound: short tone
  playTone(freq, dur, type, vol) {
    if (!GameState.soundOn) return;
    try {
      const ctx = this.getAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq || 440;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + (dur || 0.2));
    } catch(e) {}
  },

  // Sound: noise burst (leather creak / thwack)
  playNoise(dur, freq, vol) {
    if (!GameState.soundOn) return;
    try {
      const ctx = this.getAudio();
      const bufSize = ctx.sampleRate * (dur || 0.15);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = freq || 800; bpf.Q.value = 1;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.15));
      src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + (dur || 0.15));
    } catch(e) {}
  },

  // Sound library
  soundGrip()      { this.playNoise(0.15, 800, 0.08); },
  soundRelease()   { this.playNoise(0.1, 2000, 0.06); },
  soundReGrip()    { this.playTone(440, 0.15, 'square', 0.1); this.playNoise(0.1, 1200, 0.08); },
  soundPerfect()   { this.playTone(660, 0.2, 'sine', 0.12); this.playTone(880, 0.3, 'sine', 0.1); },
  soundBuck()      { this.playNoise(0.2, 200, 0.1); },
  soundEjection()  { this.playTone(300, 0.3, 'sawtooth', 0.08); },
  soundLand()      { this.playNoise(0.3, 150, 0.15); },
  soundStageClear(){ this.playTone(523, 0.15, 'sine', 0.1); this.playTone(659, 0.15, 'sine', 0.1); this.playTone(784, 0.3, 'sine', 0.12); },
  soundGameOver()  { this.playTone(300, 0.3, 'sine', 0.1); this.playTone(200, 0.5, 'sine', 0.1); },
  soundHighScore() { this.playTone(523, 0.1, 'sine', 0.12); this.playTone(659, 0.1, 'sine', 0.12); this.playTone(784, 0.1, 'sine', 0.12); this.playTone(1047, 0.4, 'sine', 0.15); },
  soundButton()    { this.playNoise(0.05, 1000, 0.05); },
  soundWarning()   { this.playTone(200, 0.1, 'square', 0.06); },

  // Star orbit around position
  starOrbit(scene, x, y) {
    const stars = [];
    for (let i = 0; i < 4; i++) {
      const s = scene.add.image(x, y, 'star').setScale(0.8).setDepth(90);
      stars.push(s);
    }
    let elapsed = 0;
    const timer = scene.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        elapsed += 16;
        stars.forEach((s, i) => {
          const angle = (elapsed / 500) * Math.PI * 2 + (i * Math.PI / 2);
          s.x = x + Math.cos(angle) * 20;
          s.y = y + Math.sin(angle) * 20;
        });
        if (elapsed > 1200) {
          stars.forEach(s => s.destroy());
          timer.destroy();
        }
      }
    });
  },

  // Desaturation flash
  desaturateFlash(scene) {
    const overlay = scene.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x888888, 0.4).setDepth(80);
    scene.tweens.add({
      targets: overlay, alpha: 0, duration: 300, delay: 200,
      onComplete: () => overlay.destroy()
    });
  },

  // Ejection trail ghosts
  ejectionTrail(scene, target) {
    if (!target || !target.active) return;
    let count = 0;
    const timer = scene.time.addEvent({
      delay: 80, repeat: 4,
      callback: () => {
        if (!target || !target.active) return;
        const ghost = scene.add.image(target.x, target.y, 'cowboy')
          .setAlpha(0.6).setScale(target.scaleX, target.scaleY)
          .setRotation(target.rotation).setDepth(50);
        scene.tweens.add({
          targets: ghost, alpha: 0, duration: 400,
          onComplete: () => ghost.destroy()
        });
      }
    });
  }
};
