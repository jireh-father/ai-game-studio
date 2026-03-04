// Audio manager using Web Audio API
const AudioManager = {
  ctx: null,
  enabled: true,
  musicEnabled: true,
  musicGain: null,

  init() {
    this.loadSettings();
  },

  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS));
      if (s) { this.enabled = s.sound !== false; this.musicEnabled = s.music !== false; }
    } catch(e) {}
  },

  saveSettings() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify({ sound: this.enabled, music: this.musicEnabled }));
  },

  play(type, pitch) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g); g.connect(this.ctx.destination);
    const p = pitch || 1;

    switch (type) {
      case 'whip':
        o.type = 'sawtooth'; o.frequency.setValueAtTime(4000 * p, t);
        o.frequency.exponentialRampToValueAtTime(200, t + 0.15);
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        o.start(t); o.stop(t + 0.15); break;
      case 'hit':
        o.type = 'sine'; o.frequency.setValueAtTime(400, t);
        o.frequency.exponentialRampToValueAtTime(100, t + 0.12);
        g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        o.start(t); o.stop(t + 0.12); break;
      case 'fall':
        o.type = 'sine'; o.frequency.setValueAtTime(800, t);
        o.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        o.start(t); o.stop(t + 0.3); break;
      case 'multikill':
        [200, 400, 600].forEach((f, i) => {
          const o2 = this.ctx.createOscillator(); const g2 = this.ctx.createGain();
          o2.connect(g2); g2.connect(this.ctx.destination);
          o2.type = 'triangle'; o2.frequency.setValueAtTime(f * p, t + i * 0.08);
          g2.gain.setValueAtTime(0.3, t + i * 0.08); g2.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.1);
          o2.start(t + i * 0.08); o2.stop(t + i * 0.08 + 0.1);
        });
        g.gain.setValueAtTime(0, t); o.start(t); o.stop(t + 0.01); break;
      case 'stageClear':
        [262, 330, 392, 523].forEach((f, i) => {
          const o2 = this.ctx.createOscillator(); const g2 = this.ctx.createGain();
          o2.connect(g2); g2.connect(this.ctx.destination);
          o2.type = 'square'; o2.frequency.setValueAtTime(f, t + i * 0.12);
          g2.gain.setValueAtTime(0.25, t + i * 0.12); g2.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.15);
          o2.start(t + i * 0.12); o2.stop(t + i * 0.12 + 0.15);
        });
        g.gain.setValueAtTime(0, t); o.start(t); o.stop(t + 0.01); break;
      case 'death':
        o.type = 'sine'; o.frequency.setValueAtTime(80, t);
        g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        o.start(t); o.stop(t + 0.5); break;
      case 'click':
        o.type = 'square'; o.frequency.setValueAtTime(1200, t);
        g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        o.start(t); o.stop(t + 0.05); break;
      default:
        g.gain.setValueAtTime(0, t); o.start(t); o.stop(t + 0.01);
    }
  }
};

// Splash scene
class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);

    const title = this.add.text(cx, cy - 30, 'ROPE RIOT', {
      fontSize: '48px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#FFFFFF', stroke: '#FFE600', strokeThickness: 4
    }).setOrigin(0.5);

    const sub = this.add.text(cx, cy + 40, 'Tap to start', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#AAAAAA'
    }).setOrigin(0.5);

    this.tweens.add({ targets: sub, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    // Animated rope line
    const ropeLine = this.add.graphics();
    let angle = 0;
    this.time.addEvent({
      delay: 16, loop: true, callback: () => {
        angle += 0.04;
        ropeLine.clear();
        ropeLine.lineStyle(3, CONFIG.COLORS.ROPE, 0.8);
        ropeLine.beginPath();
        for (let i = 0; i <= 20; i++) {
          const px = 40 + i * 14;
          const py = cy + 80 + Math.sin(angle + i * 0.5) * 20;
          if (i === 0) ropeLine.moveTo(px, py); else ropeLine.lineTo(px, py);
        }
        ropeLine.strokePath();
      }
    });

    this.input.once('pointerdown', () => {
      AudioManager.unlock();
      AudioManager.play('click');
      this.scene.start('MenuScene');
    });

    this.time.delayedCall(3000, () => {
      if (this.scene.isActive('SplashScene')) this.scene.start('MenuScene');
    });
  }
}

// Menu scene
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    AudioManager.unlock();
    const cx = CONFIG.WIDTH / 2;
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);

    this.add.text(cx, 100, 'ROPE RIOT', {
      fontSize: '40px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: '#FFFFFF', stroke: '#FFE600', strokeThickness: 3
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(cx, 300, 200, 60, CONFIG.COLORS.PLAYER, 1).setInteractive();
    this.add.text(cx, 300, 'PLAY', {
      fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      AudioManager.play('click');
      this.tweens.add({ targets: playBtn, scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true,
        onComplete: () => {
          window.GAME_STATE = { score: 0, stage: 1, combo: 1.0, usedDodge: false };
          this.scene.start('GameScene');
        }
      });
    });

    const hs = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE)) || 0;
    this.add.text(cx, 370, `BEST: ${hs}`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: '#FFD700'
    }).setOrigin(0.5);

    // Settings
    const settingsBtn = this.add.text(CONFIG.WIDTH - 20, 20, '\u2699', {
      fontSize: '32px', color: '#FFFFFF'
    }).setOrigin(1, 0).setInteractive();

    settingsBtn.on('pointerdown', () => {
      AudioManager.play('click');
      this.showSettings();
    });
  }

  showSettings() {
    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
    const overlay = this.add.rectangle(cx, cy, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.75).setInteractive();
    const panel = this.add.container(0, 0);

    this.add.text(cx, cy - 100, 'SETTINGS', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    const sfxLabel = this.add.text(cx - 60, cy - 30, `Sound FX: ${AudioManager.enabled ? 'ON' : 'OFF'}`, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0, 0.5).setInteractive();

    const musLabel = this.add.text(cx - 60, cy + 20, `Music: ${AudioManager.musicEnabled ? 'ON' : 'OFF'}`, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0, 0.5).setInteractive();

    sfxLabel.on('pointerdown', () => {
      AudioManager.enabled = !AudioManager.enabled;
      sfxLabel.setText(`Sound FX: ${AudioManager.enabled ? 'ON' : 'OFF'}`);
      AudioManager.saveSettings();
    });

    musLabel.on('pointerdown', () => {
      AudioManager.musicEnabled = !AudioManager.musicEnabled;
      musLabel.setText(`Music: ${AudioManager.musicEnabled ? 'ON' : 'OFF'}`);
      AudioManager.saveSettings();
    });

    const closeBtn = this.add.text(cx, cy + 90, 'CLOSE', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#00FFFF'
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerdown', () => {
      AudioManager.play('click');
      overlay.destroy(); panel.destroy(); sfxLabel.destroy(); musLabel.destroy(); closeBtn.destroy();
      this.scene.restart();
    });
  }
}

// Game Over scene
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const st = window.GAME_STATE || { score: 0, stage: 1 };
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);

    // Update stats
    const prevHigh = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE)) || 0;
    const isNewHigh = st.score > prevHigh;
    if (isNewHigh) localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, st.score);

    const prevStage = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE)) || 0;
    if (st.stage > prevStage) localStorage.setItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE, st.stage);

    const played = (parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED)) || 0) + 1;
    localStorage.setItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED, played);

    // Game Over title with shake
    const goText = this.add.text(cx, 140, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF4444'
    }).setOrigin(0.5);
    this.cameras.main.shake(300, 0.008);

    this.add.text(cx, 210, `STAGE ${st.stage} REACHED`, {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5);

    const scoreText = this.add.text(cx, 270, `SCORE: ${st.score}`, {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    const bestScore = Math.max(prevHigh, st.score);
    const bestText = this.add.text(cx, 320, `BEST: ${bestScore}`, {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', color: '#FFD700'
    }).setOrigin(0.5);

    if (isNewHigh) {
      this.tweens.add({ targets: bestText, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
    }

    // Play Again button
    const playBtn = this.add.rectangle(cx, 420, 200, 60, CONFIG.COLORS.PLAYER, 1).setInteractive();
    this.add.text(cx, 420, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      AudioManager.play('click');
      window.GAME_STATE = { score: 0, stage: 1, combo: 1.0, usedDodge: false };
      this.scene.start('GameScene');
    });

    // Menu button
    const menuBtn = this.add.rectangle(cx, 500, 140, 48, 0x666666, 1).setInteractive();
    this.add.text(cx, 500, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      AudioManager.play('click');
      this.scene.start('MenuScene');
    });
  }
}
