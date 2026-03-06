// ui.js - MenuScene, HUD helpers, Game Over, Pause overlay
// Simple Web Audio sound effects
const SoundFX = {
  ctx: null, enabled: true,
  getCtx() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },
  play(scene, type, extra) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx(); if (ctx.state === 'suspended') ctx.resume();
      const g = ctx.createGain(); g.connect(ctx.destination);
      const o = ctx.createOscillator(); o.connect(g);
      const t = ctx.currentTime;
      switch (type) {
        case 'swoosh': o.type = 'sawtooth'; o.frequency.setValueAtTime(2000, t); o.frequency.linearRampToValueAtTime(200, t + 0.15); g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0, t + 0.15); o.start(t); o.stop(t + 0.15); break;
        case 'land': o.type = 'sine'; o.frequency.setValueAtTime(440 + (extra || 0) * 20, t); g.gain.setValueAtTime(0.2, t); g.gain.linearRampToValueAtTime(0, t + 0.1); o.start(t); o.stop(t + 0.1); break;
        case 'wrong': o.type = 'square'; o.frequency.setValueAtTime(150, t); g.gain.setValueAtTime(0.2, t); g.gain.linearRampToValueAtTime(0, t + 0.2); o.start(t); o.stop(t + 0.2); break;
        case 'explode': o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t); o.frequency.linearRampToValueAtTime(50, t + 0.25); g.gain.setValueAtTime(0.25, t); g.gain.linearRampToValueAtTime(0, t + 0.25); o.start(t); o.stop(t + 0.25); break;
        case 'siren': o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(800, t + 0.5); g.gain.setValueAtTime(0.12, t); g.gain.linearRampToValueAtTime(0, t + 0.5); o.start(t); o.stop(t + 0.5); break;
        case 'gavel': o.type = 'sine'; o.frequency.setValueAtTime(80, t); g.gain.setValueAtTime(0.3, t); g.gain.linearRampToValueAtTime(0, t + 0.3); o.start(t); o.stop(t + 0.3); break;
        case 'survive': o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.linearRampToValueAtTime(1320, t + 0.2); g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0, t + 0.2); o.start(t); o.stop(t + 0.2); break;
        case 'perfect': o.type = 'sine'; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.2); o.frequency.setValueAtTime(880, t + 0.4); g.gain.setValueAtTime(0.2, t); g.gain.linearRampToValueAtTime(0, t + 0.6); o.start(t); o.stop(t + 0.6); break;
        case 'gameover': o.type = 'sine'; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(330, t + 0.25); o.frequency.setValueAtTime(220, t + 0.5); g.gain.setValueAtTime(0.25, t); g.gain.linearRampToValueAtTime(0, t + 0.8); o.start(t); o.stop(t + 0.8); break;
        case 'click': o.type = 'sine'; o.frequency.setValueAtTime(600, t); g.gain.setValueAtTime(0.12, t); g.gain.linearRampToValueAtTime(0, t + 0.08); o.start(t); o.stop(t + 0.08); break;
        case 'combo': o.type = 'sine'; o.frequency.setValueAtTime(440 + (extra || 0) * 40, t); g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0, t + 0.1); o.start(t); o.stop(t + 0.1); break;
        case 'overflow': o.type = 'sine'; o.frequency.setValueAtTime(100, t); g.gain.setValueAtTime(0.2, t); g.gain.linearRampToValueAtTime(0, t + 0.3); o.start(t); o.stop(t + 0.3); break;
      }
    } catch (e) { /* silent */ }
  }
};

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);
    // Floating shape silhouettes
    for (let i = 0; i < 8; i++) {
      const sx = Phaser.Math.Between(30, W - 30), sy = Phaser.Math.Between(100, H - 100);
      const keys = Object.keys(this.textures.list).filter(k => k.startsWith('circle_') || k.startsWith('square_') || k.startsWith('triangle_'));
      if (keys.length > 0) {
        const img = this.add.image(sx, sy, pickRandom(keys)).setAlpha(0.08).setScale(Phaser.Math.FloatBetween(0.5, 1.2));
        this.tweens.add({ targets: img, y: sy + Phaser.Math.Between(-20, 20), duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    // Gavel
    if (this.textures.exists('gavel')) this.add.image(W / 2 + 80, 160, 'gavel').setScale(1.2).setAlpha(0.7);
    // Title
    this.add.text(W / 2, 180, 'COLOR LAW', { fontSize: '46px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(W / 2, 230, 'Sort by the rules... before they change!', { fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF' }).setOrigin(0.5);
    // Play button
    const playBtn = this.add.rectangle(W / 2, 340, 200, 60, 0xFFD700).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(W / 2, 340, 'PLAY', { fontSize: '26px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => { SoundFX.play(this, 'click'); this.scene.start('GameScene'); });
    playBtn.on('pointerover', () => playBtn.setFillStyle(0xFFE44D));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0xFFD700));
    // Help button
    const helpBtn = this.add.circle(W - 40, 40, 22, 0xFFFFFF).setInteractive({ useHandCursor: true });
    this.add.text(W - 40, 40, '?', { fontSize: '24px', fontFamily: 'Arial', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => { SoundFX.play(this, 'click'); this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'MenuScene' }); });
    // Sound toggle
    const sndTxt = this.add.text(40, H - 40, SoundFX.enabled ? 'Sound: ON' : 'Sound: OFF', { fontSize: '14px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sndTxt.on('pointerdown', () => { SoundFX.enabled = !SoundFX.enabled; sndTxt.setText(SoundFX.enabled ? 'Sound: ON' : 'Sound: OFF'); try { localStorage.setItem('color_law_settings', JSON.stringify({ sound: SoundFX.enabled })); } catch (e) {} });
    // High score
    this.add.text(W / 2, H - 80, `BEST: ${GameState.highScore}`, { fontSize: '18px', fontFamily: 'Arial', fill: '#AAAAAA' }).setOrigin(0.5);
  }
}

// HUD helper functions
function showFloatingScore(scene, x, y, points, color) {
  const c = color || COLORS.LAW_TEXT;
  const prefix = points > 0 ? '+' : '';
  const txt = scene.add.text(x, y, `${prefix}${points}`, { fontSize: '18px', fontFamily: 'Arial', fill: c, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(100);
  scene.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
}

function showComboText(scene, combo) {
  if (combo < 5) return;
  const sz = Math.min(36, 20 + combo * 2);
  const txt = scene.add.text(GAME_WIDTH / 2, 500, `x${combo}!`, { fontSize: `${sz}px`, fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(100);
  scene.tweens.add({ targets: txt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  scene.tweens.add({ targets: txt, alpha: 0, y: 480, duration: 800, delay: 200, onComplete: () => txt.destroy() });
  SoundFX.play(scene, 'combo', combo);
}

function showPerfectLaw(scene) {
  const txt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'PERFECT LAW!', { fontSize: '32px', fontFamily: 'Arial', fill: COLORS.LAW_TEXT, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(120).setScale(0);
  scene.tweens.add({ targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut', onComplete: () => {
    scene.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 200, onComplete: () => {
      scene.tweens.add({ targets: txt, alpha: 0, duration: 600, delay: 200, onComplete: () => txt.destroy() });
    }});
  }});
  // Rainbow flash on zones
  if (scene.zoneRects) {
    scene.zoneRects.forEach(z => {
      scene.tweens.add({ targets: z, fillAlpha: 0.6, duration: 150, yoyo: true, repeat: 1 });
    });
  }
  SoundFX.play(scene, 'perfect');
}
