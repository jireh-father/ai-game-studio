// Zeno's Dash - Juice Effects & Audio (mixin for GameScene)

// Web Audio context (initialized on first user touch)
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq1, freq2, duration, volume, waveType) {
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveType || 'sine';
  osc.frequency.setValueAtTime(freq1, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + duration / 1000);
  gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration / 1000);
}

function playTapSound() {
  playTone(440, 660, 80, 0.3, 'sine');
}

function playPhantomSound() {
  playTone(440, 880, 120, 0.4, 'sine');
}

function playStageClearSound() {
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  [440, 554, 660].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.1);
  });
}

function playDeathSound() {
  playTone(660, 110, 500, 0.4, 'sawtooth');
}

function playClickSound() {
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  const bufferSize = ctx.sampleRate * 0.03;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
}

// Alert pulse for pursuer proximity
let alertOsc = null;
let alertGain = null;

function startAlertPulse() {
  if (alertOsc) return;
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  alertOsc = ctx.createOscillator();
  alertGain = ctx.createGain();
  alertOsc.type = 'square';
  alertOsc.frequency.value = 110;
  alertGain.gain.value = 0.08;
  alertOsc.connect(alertGain).connect(ctx.destination);
  alertOsc.start();
}

function stopAlertPulse() {
  if (alertOsc) {
    try { alertOsc.stop(); } catch (e) {}
    alertOsc = null;
    alertGain = null;
  }
}

// Effects mixin for GameScene prototype
const EffectsMixin = {
  emitParticles(x, y, count, color, minSpeed, maxSpeed, lifetime, radius) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const r = radius || 2;
      const circle = this.add.circle(x, y, r, Phaser.Display.Color.HexStringToColor(color).color);
      circle.setDepth(10);
      this.tweens.add({
        targets: circle,
        x: x + Math.cos(angle) * speed * (lifetime / 1000),
        y: y + Math.sin(angle) * speed * (lifetime / 1000),
        alpha: 0,
        duration: lifetime,
        onComplete: () => circle.destroy()
      });
    }
  },

  showFloatingText(x, y, text, color, fontSize, riseAmount, duration) {
    const txt = this.add.text(x, y, text, {
      fontSize: fontSize || '12px',
      fontFamily: 'monospace',
      color: color || COLORS.gapText,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: txt,
      y: y - (riseAmount || 30),
      alpha: 0,
      duration: duration || 400,
      onComplete: () => txt.destroy()
    });
  },

  scalePunch(target, peakScale, duration) {
    if (!target || !target.active) return;
    this.tweens.add({
      targets: target,
      scaleX: peakScale,
      scaleY: peakScale,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  doScreenShake(duration, intensity) {
    this.cameras.main.shake(duration, intensity);
  },

  doFlash(duration, r, g, b) {
    this.cameras.main.flash(duration, r, g, b);
  },

  tapEffect(x, y, isPhantom) {
    if (isPhantom) {
      this.emitParticles(x, y, 12, COLORS.particleGold, 150, 250, 500, 4);
      playPhantomSound();
    } else {
      this.emitParticles(x, y, 6, COLORS.particleCyan, 60, 120, 300, 2);
      playTapSound();
    }
  },

  stageClearEffect(x, y) {
    this.emitParticles(x, y, 20, COLORS.particleGold, 100, 200, 600, 3);
    playStageClearSound();
  },

  deathEffect() {
    this.doScreenShake(400, 0.015);
    this.doFlash(100, 255, 0, 102);
    playDeathSound();
    stopAlertPulse();
  },

  proximityCheck(distance) {
    if (distance < 100) {
      if (!this._alertActive) {
        startAlertPulse();
        this._alertActive = true;
      }
    } else {
      if (this._alertActive) {
        stopAlertPulse();
        this._alertActive = false;
      }
    }
  },

  cleanupEffects() {
    stopAlertPulse();
    this._alertActive = false;
  }
};
