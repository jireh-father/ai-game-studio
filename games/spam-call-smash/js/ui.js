// ui.js — Title scene, HUD overlay, Game Over scene

class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    this.add.text(cx, 180, 'SPAM CALL\nSMASH', {
      fontSize: '42px', fontFamily: 'Arial Black, sans-serif',
      fill: '#FFFFFF', align: 'center', fontStyle: 'bold',
      stroke: '#FF3B3B', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(cx, 280, 'Hang up faster than\nyour patience runs out', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      fill: '#888899', align: 'center'
    }).setOrigin(0.5);

    const best = localStorage.getItem('scs_best') || 0;
    this.add.text(cx, 520, 'BEST: ' + best, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FFD60A'
    }).setOrigin(0.5);

    // Animated play button
    const btn = this.add.container(cx, 420);
    const bg = this.add.rectangle(0, 0, 200, 60, 0x34C85A, 1).setStrokeStyle(2, 0x2AA84A);
    bg.setInteractive({ useHandCursor: true });
    const txt = this.add.text(0, 0, 'TAP TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 600, yoyo: true, repeat: -1 });

    bg.on('pointerdown', () => {
      SoundFX.play(this, 'tap');
      this.cameras.main.flash(200, 255, 255, 255);
      this.time.delayedCall(250, () => this.scene.start('GameScene'));
    });

    // Floating cards animation in background
    this.spawnBgCards();
  }

  spawnBgCards() {
    const colors = [0xFF3B3B, 0x34C85A, 0xFF8C42];
    for (let i = 0; i < 3; i++) {
      const card = this.add.rectangle(
        Phaser.Math.Between(40, 320), 650 + i * 100,
        CONFIG.CARD_W * 0.6, CONFIG.CARD_H * 0.6, colors[i], 0.15
      ).setStrokeStyle(1, colors[i], 0.3);
      this.tweens.add({
        targets: card, y: -100, duration: 4000 + i * 1500,
        repeat: -1, delay: i * 1200
      });
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2;
    const data = this.scene.settings.data || {};
    const score = data.score || 0;
    const stage = data.stage || 1;
    const best = parseInt(localStorage.getItem('scs_best') || '0');
    const isNewBest = score > best;
    if (isNewBest) localStorage.setItem('scs_best', score);

    this.add.rectangle(cx, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x0A0A0F, 0.92);

    const title = this.add.text(cx, 160, 'OUT OF\nPATIENCE', {
      fontSize: '34px', fontFamily: 'Arial Black, sans-serif',
      fill: '#FF3B3B', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.3);
    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

    // Score count-up
    const scoreTxt = this.add.text(cx, 280, 'SCORE: 0', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: score, duration: 600,
      onUpdate: (t) => { scoreTxt.setText('SCORE: ' + Math.floor(t.getValue())); }
    });

    const bestLabel = isNewBest ? 'NEW BEST!' : ('BEST: ' + Math.max(best, score));
    const bestTxt = this.add.text(cx, 330, bestLabel, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#FFD60A'
    }).setOrigin(0.5);
    if (isNewBest) {
      this.tweens.add({ targets: bestTxt, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: 2 });
    }

    this.add.text(cx, 370, 'MADE IT TO STAGE ' + stage, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#888899'
    }).setOrigin(0.5);

    // Retry button — appears after 400ms
    const btn = this.add.container(cx, 460).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 200, 60, 0x34C85A, 1).setStrokeStyle(2, 0x2AA84A);
    bg.setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(0, 0, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5);
    btn.add([bg, btnTxt]);
    this.tweens.add({ targets: btn, alpha: 1, y: 450, duration: 300, delay: 400 });

    bg.on('pointerdown', () => {
      SoundFX.play(this, 'tap');
      this.scene.start('GameScene');
    });
  }
}

// Sound effects using Web Audio API
const SoundFX = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  play(scene, type, pitch) {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      const p = pitch || 0;
      switch (type) {
        case 'smash':
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(60 + p * 10, now);
          gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now); osc.stop(now + 0.3); break;
        case 'answer':
          osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
          gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now); osc.stop(now + 0.4); break;
        case 'wrong':
          osc.type = 'square'; osc.frequency.setValueAtTime(200, now);
          gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now); osc.stop(now + 0.4); break;
        case 'combo':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880 * Math.pow(2, p / 12), now);
          gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now); osc.stop(now + 0.25); break;
        case 'stageClear':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.15);
          osc.frequency.setValueAtTime(784, now + 0.3);
          gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          osc.start(now); osc.stop(now + 0.8); break;
        case 'gameOver':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(100, now + 1.2);
          gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
          osc.start(now); osc.stop(now + 1.5); break;
        default: // tap
          osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now); osc.stop(now + 0.1); break;
      }
    } catch (e) { /* audio not available */ }
  }
};
