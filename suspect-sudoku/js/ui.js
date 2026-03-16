// ui.js - MenuScene, GameOverScene, sound synthesis

// --- Sound Manager (Web Audio API) ---
const SoundFX = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn('Web Audio not available');
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(type) {
    if (!this.enabled || !this.ctx) return;
    try { this[type](); } catch(e) {}
  },

  tone(freq, dur, type, vol) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + dur);
  },

  correct() {
    this.tone(80, 0.22, 'sine', 0.5);
  },

  wrong() {
    const t = this.ctx.currentTime;
    [440, 330, 220].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.25, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * 0.08);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + (i + 1) * 0.08 + 0.02);
    });
  },

  tick() { this.tone(1200, 0.02, 'triangle', 0.1); },
  dangerTick() { this.tone(1600, 0.025, 'triangle', 0.2); },

  timeout() { this.tone(200, 0.4, 'square', 0.3); },

  badgeLost() {
    if (!this.ctx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start();
    this.tone(120, 0.2, 'sine', 0.3);
  },

  gameOver() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    [440, 330, 247, 185].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.15, 'sine', 0.25), i * 120);
    });
    setTimeout(() => this.tone(120, 0.6, 'sine', 0.2), 630);
  },

  caseStart() {
    this.tone(784, 0.06, 'sine', 0.15);
    setTimeout(() => this.tone(1047, 0.06, 'sine', 0.15), 60);
  },

  streak() {
    this.tone(523, 0.08, 'sine', 0.2);
    setTimeout(() => this.tone(659, 0.08, 'sine', 0.2), 80);
  },

  streakHigh() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.08, 'sine', 0.2), i * 70);
    });
  },

  buttonTap() { this.tone(800, 0.03, 'sine', 0.15); },
  scoreFloat() {
    this.tone(1200, 0.08, 'sine', 0.1);
    this.tone(1600, 0.08, 'sine', 0.08);
  },

  milestone() {
    [600, 700, 800, 1000].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.06, 'sine', 0.15), i * 60);
    });
  }
};

// --- MenuScene ---
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    SoundFX.init();

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    // Title
    this.add.text(cx, h * 0.18, 'SUSPECT\nSUDOKU', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '36px',
      fill: COLORS.HUD_BG,
      align: 'center',
      fontStyle: 'bold',
      lineSpacing: 4
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.32, 'Crack the case. Before time\'s up.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fill: COLORS.INNOCENT_GREY,
      align: 'center'
    }).setOrigin(0.5);

    // High score
    const hs = GameState.highScore || 0;
    const hstreak = GameState.highestStreak || 0;
    this.add.text(cx, h * 0.40, `Best: ${hs}  |  Record Streak: ${hstreak}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fill: '#999',
      align: 'center'
    }).setOrigin(0.5);

    // Play button
    const playBg = this.add.rectangle(cx, h * 0.55, 260, 56, 0x4ECB71, 1).setInteractive();
    playBg.setStrokeStyle(2, 0x27AE60);
    const playTxt = this.add.text(cx, h * 0.55, 'PLAY', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    playBg.on('pointerdown', () => {
      SoundFX.resume();
      SoundFX.play('buttonTap');
      AdsManager.resetForNewRun();
      this.scene.stop('Menu');
      this.scene.start('Game');
    });

    // Help button
    const helpBg = this.add.circle(50, h - 50, 28, 0x7B5EA7, 1).setInteractive();
    const helpTxt = this.add.text(50, h - 50, '?', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '26px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    helpBg.on('pointerdown', () => {
      SoundFX.play('buttonTap');
      this.scene.pause('Menu');
      this.scene.launch('Help', { returnTo: 'Menu' });
    });

    // Suspect showcase (decorative)
    const animalKeys = ['suspect-cat', 'suspect-dog', 'suspect-hamster'];
    animalKeys.forEach((key, i) => {
      if (this.textures.exists(key)) {
        const img = this.add.image(cx - 80 + i * 80, h * 0.72, key)
          .setScale(0.6).setAlpha(0.7);
        this.tweens.add({
          targets: img, y: h * 0.72 - 6, duration: 1200 + i * 200,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }
    });

    // Footer
    this.add.text(cx, h * 0.92, 'Tap a suspect to solve the case!', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px',
      fill: '#BBB', align: 'center'
    }).setOrigin(0.5);
  }
}

// --- GameOverScene ---
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.caseReached = data.caseNumber || 1;
    this.bestStreak = data.bestStreak || 0;
    this.isNewRecord = data.isNewRecord || false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    this.cameras.main.setBackgroundColor(COLORS.HUD_BG);

    // Case Closed header
    this.add.text(cx, h * 0.12, 'CASE CLOSED', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '30px', fill: COLORS.GUILTY_RED, align: 'center'
    }).setOrigin(0.5);

    // Score count-up
    const scoreTxt = this.add.text(cx, h * 0.28, '0', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '42px', fill: COLORS.BADGE_GOLD, align: 'center'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 1200, ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        scoreTxt.setText(Math.floor(tween.getValue()).toLocaleString());
      }
    });

    this.add.text(cx, h * 0.37, `Case #${this.caseReached} reached`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px',
      fill: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.43, `Best Streak: ${this.bestStreak}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      fill: COLORS.STREAK_ORANGE
    }).setOrigin(0.5);

    // New record
    if (this.isNewRecord) {
      const rec = this.add.text(cx, h * 0.50, 'NEW RECORD!', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '20px',
        fill: COLORS.BADGE_GOLD
      }).setOrigin(0.5);
      this.tweens.add({
        targets: rec, scaleX: 1.15, scaleY: 1.15,
        duration: 500, yoyo: true, repeat: -1
      });
    }

    // Continue with ad
    let btnY = h * 0.60;
    if (AdsManager.canShowContinue()) {
      const adBg = this.add.rectangle(cx, btnY, 260, 48, 0xF5A623, 1).setInteractive();
      this.add.text(cx, btnY, 'Watch Ad to Continue', {
        fontFamily: 'Arial, sans-serif', fontSize: '16px',
        fill: '#FFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      adBg.on('pointerdown', () => {
        AdsManager.usedContinue = true;
        AdsManager.showRewarded(() => {
          this.scene.stop('GameOver');
          this.scene.start('Game', { continueRun: true, score: this.finalScore, caseNumber: this.caseReached, bestStreak: this.bestStreak });
        });
      });
      btnY += 62;
    }

    // Play Again
    const playBg = this.add.rectangle(cx, btnY, 260, 48, 0x4ECB71, 1).setInteractive();
    this.add.text(cx, btnY, 'Play Again', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '18px',
      fill: '#FFF'
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      SoundFX.play('buttonTap');
      AdsManager.trackGameOver();
      if (AdsManager.shouldShowInterstitial()) {
        AdsManager.showInterstitial(() => {
          this.scene.stop('GameOver');
          this.scene.start('Game');
        });
      } else {
        this.scene.stop('GameOver');
        this.scene.start('Game');
      }
    });

    // Menu
    const menuBg = this.add.rectangle(cx, btnY + 56, 160, 40, 0x555555, 1).setInteractive();
    this.add.text(cx, btnY + 56, 'Menu', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px',
      fill: '#CCC'
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => {
      SoundFX.play('buttonTap');
      AdsManager.trackGameOver();
      this.scene.stop('GameOver');
      this.scene.start('Menu');
    });
  }
}
