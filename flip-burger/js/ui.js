// ui.js — Menu scenes, HUD overlay, transitions, popups

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
    this.cameras.main.setBackgroundColor(CONFIG.BG);
    // Bouncing burger
    const burger = this.add.image(cx, cy - 80, 'burgerLife').setScale(5);
    this.tweens.add({ targets: burger, y: cy - 88, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Title
    this.add.text(cx, cy + 30, 'FLIP BURGER', { fontSize: '36px', fontFamily: 'Arial Black, sans-serif', color: CONFIG.SCORE_BROWN, fontStyle: 'bold' }).setOrigin(0.5);
    // Best score
    const best = localStorage.getItem('flipBurgerBest') || 0;
    this.add.text(cx, cy + 70, `BEST: ${best}`, { fontSize: '18px', fontFamily: 'Arial', color: '#888' }).setOrigin(0.5);
    // Tap to start
    const tap = this.add.text(cx, cy + 130, 'TAP TO START', { fontSize: '22px', fontFamily: 'Arial', color: CONFIG.SCORE_BROWN }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.input.once('pointerdown', () => {
      SFX.play('stageClear');
      this.cameras.main.fade(200, 0, 0, 0, false, (_cam, p) => {
        if (p >= 1) { this.scene.start('GameScene'); this.scene.start('UIScene'); }
      });
    });
  }
}

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    this.livesIcons = [];
    this.scoreText = this.add.text(CONFIG.WIDTH - 10, 10, 'SCORE: 0', { fontSize: '16px', fontFamily: 'Arial', color: CONFIG.SCORE_BROWN, fontStyle: 'bold' }).setOrigin(1, 0).setDepth(100);
    this.stageText = this.add.text(CONFIG.WIDTH / 2, 10, 'STAGE 1', { fontSize: '15px', fontFamily: 'Arial', color: '#666' }).setOrigin(0.5, 0).setDepth(100);
    this.comboText = this.add.text(10, CONFIG.HEIGHT - 34, '', { fontSize: '18px', fontFamily: 'Arial Black', color: CONFIG.COMBO_GOLD, fontStyle: 'bold' }).setDepth(100);
    this.ordersText = this.add.text(CONFIG.WIDTH - 10, CONFIG.HEIGHT - 34, '', { fontSize: '14px', fontFamily: 'Arial', color: '#666' }).setOrigin(1, 0).setDepth(100);
    this.updateLives(CONFIG.LIVES_START);

    const game = this.scene.get('GameScene');
    game.events.on('scoreChange', s => this.onScore(s));
    game.events.on('livesChange', l => this.updateLives(l));
    game.events.on('comboChange', c => this.onCombo(c));
    game.events.on('stageChange', s => { if (this.stageText) this.stageText.setText(`STAGE ${s}`); });
    game.events.on('ordersChange', (cur, max) => this.ordersText.setText(`${cur}/${max}`));
    game.events.on('gradePopup', d => this.showGrade(d));
    game.events.on('floatScore', d => this.floatScore(d));
    game.events.on('lifeLost', () => this.flashRed());
    game.events.on('lifeGained', () => this.flashGreen());
    game.events.on('stageClear', n => this.showStageClear(n));
    game.events.on('gameOver', d => this.showGameOver(d));
    game.events.on('comboBreak', () => this.comboBreak());
  }

  updateLives(count) {
    this.livesIcons.forEach(i => i.destroy());
    this.livesIcons = [];
    for (let i = 0; i < CONFIG.LIVES_MAX; i++) {
      const key = i < count ? 'burgerLife' : 'burgerLifeEmpty';
      const icon = this.add.image(14 + i * 26, 20, key).setScale(1).setDepth(100);
      this.livesIcons.push(icon);
    }
  }

  onScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  }

  onCombo(combo) {
    if (combo > 1) {
      this.comboText.setText(`x${combo} COMBO`);
      this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
    } else {
      this.comboText.setText('');
    }
  }

  comboBreak() {
    if (this.comboText.text) {
      this.comboText.setColor('#DD2222');
      this.tweens.add({ targets: this.comboText, x: this.comboText.x - 4, duration: 40, yoyo: true, repeat: 3,
        onComplete: () => { this.comboText.setColor(CONFIG.COMBO_GOLD); this.comboText.setText(''); this.comboText.x = 10; }
      });
    }
  }

  showGrade(d) {
    const g = GRADE[d.grade];
    const txt = this.add.text(d.x, d.y - 20, g.label, { fontSize: `${g.size}px`, fontFamily: 'Arial Black', color: g.color, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: txt, y: d.y - 60, scaleX: d.grade === 'PERFECT' ? 1.4 : 1.2, scaleY: d.grade === 'PERFECT' ? 1.4 : 1.2, alpha: 0, duration: d.grade === 'PERFECT' ? 500 : 350, ease: 'Power2', onComplete: () => txt.destroy() });
  }

  floatScore(d) {
    const txt = this.add.text(d.x, d.y, `+${d.pts}`, { fontSize: '20px', fontFamily: 'Arial Black', color: CONFIG.COMBO_GOLD, stroke: '#000', strokeThickness: 1 }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: txt, y: d.y - 40, alpha: 0, duration: 500, onComplete: () => txt.destroy() });
  }

  flashRed() {
    const r = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0xDD2222, 0.4).setDepth(300);
    this.tweens.add({ targets: r, alpha: 0, duration: 120, onComplete: () => r.destroy() });
  }

  flashGreen() {
    const r = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x44CC44, 0.3).setDepth(300);
    this.tweens.add({ targets: r, alpha: 0, duration: 300, onComplete: () => r.destroy() });
  }

  showStageClear(stageNum) {
    const bg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.4).setDepth(400);
    const txt = this.add.text(CONFIG.WIDTH / 2, -40, `STAGE ${stageNum} CLEAR!`, { fontSize: '30px', fontFamily: 'Arial Black', color: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(401);
    this.tweens.add({ targets: txt, y: CONFIG.HEIGHT / 2, duration: 300, ease: 'Back.easeOut' });
    this.confettiBurst();
    this.time.delayedCall(CONFIG.STAGE_CLEAR_DELAY, () => { bg.destroy(); txt.destroy(); });
  }

  confettiBurst() {
    for (let i = 0; i < 14; i++) {
      const colors = [0xFFD700, 0xFF6B6B, 0x44CC44, 0x4488FF, 0xFF44FF];
      const sq = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 8, 8, Phaser.Utils.Array.GetRandom(colors)).setDepth(402);
      const angle = (i / 14) * Math.PI * 2;
      this.tweens.add({ targets: sq, x: sq.x + Math.cos(angle) * 100, y: sq.y + Math.sin(angle) * 80, alpha: 0, rotation: Math.random() * 4, duration: 700, onComplete: () => sq.destroy() });
    }
  }

  showGameOver(d) {
    this.scene.pause('GameScene');
    const bg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0xDD2222, 0.15).setDepth(500);
    this.tweens.add({ targets: bg, fillAlpha: 0.5, duration: 200 });
    const best = Math.max(d.score, parseInt(localStorage.getItem('flipBurgerBest') || '0'));
    localStorage.setItem('flipBurgerBest', best);
    this.time.delayedCall(500, () => {
      const panel = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 280, 220, 0xFFFBF0).setStrokeStyle(3, 0x3A1A00).setDepth(501);
      this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 70, 'GAME OVER', { fontSize: '34px', fontFamily: 'Arial Black', color: '#DD2222', fontStyle: 'bold' }).setOrigin(0.5).setDepth(502);
      this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 25, `Score: ${d.score}`, { fontSize: '22px', fontFamily: 'Arial', color: CONFIG.SCORE_BROWN }).setOrigin(0.5).setDepth(502);
      this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 5, `Best: ${best}`, { fontSize: '16px', fontFamily: 'Arial', color: '#888' }).setOrigin(0.5).setDepth(502);
      const btn = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 60, 200, 55, 0x44CC44, 1).setStrokeStyle(2, 0x228822).setDepth(502);
      const btnText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 60, 'RETRY', { fontSize: '24px', fontFamily: 'Arial Black', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(503).setInteractive();
      const onRetry = () => {
        Ads.onDeath();
        this.scene.stop('UIScene');
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      };
      btn.setInteractive().on('pointerdown', onRetry);
      btnText.on('pointerdown', onRetry);
    });
  }
}

// Web Audio sound effects
const SFX = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  play(type, combo) {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, t);

    if (type === 'perfect') {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(880 + (combo || 0) * 20, t);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); o.start(t); o.stop(t + 0.12);
    } else if (type === 'good') {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(660 + (combo || 0) * 15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g); o.start(t); o.stop(t + 0.1);
    } else if (type === 'late') {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(220, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g); o.start(t); o.stop(t + 0.08);
    } else if (type === 'miss' || type === 'burnt') {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(110, t);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); o.start(t); o.stop(t + 0.2);
    } else if (type === 'sizzle') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const n = ctx.createBufferSource(); n.buffer = buf;
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      n.connect(g); n.start(t);
    } else if (type === 'comboMilestone') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const cg = ctx.createGain(); cg.connect(ctx.destination);
        cg.gain.setValueAtTime(0.12, t + i * 0.03); cg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.08);
        o.connect(cg); o.start(t + i * 0.03); o.stop(t + i * 0.03 + 0.08);
      });
    } else if (type === 'customerHappy') {
      [392, 494, 587].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const cg = ctx.createGain(); cg.connect(ctx.destination);
        cg.gain.setValueAtTime(0.1, t + i * 0.05); cg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.06);
        o.connect(cg); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.06);
      });
    } else if (type === 'customerAngry') {
      [392, 330, 262].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const cg = ctx.createGain(); cg.connect(ctx.destination);
        cg.gain.setValueAtTime(0.1, t + i * 0.05); cg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.06);
        o.connect(cg); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.06);
      });
    } else if (type === 'stageClear') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const cg = ctx.createGain(); cg.connect(ctx.destination);
        cg.gain.setValueAtTime(0.15, t + i * 0.06); cg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
        o.connect(cg); o.start(t + i * 0.06); o.stop(t + 0.3);
      });
    } else if (type === 'gameOver') {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(400, t); o.frequency.linearRampToValueAtTime(200, t + 0.6);
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); o.start(t); o.stop(t + 0.6);
    } else if (type === 'fire') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5 * (1 - i / d.length);
      const n = ctx.createBufferSource(); n.buffer = buf;
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      n.connect(g); n.start(t);
    }
  }
};
