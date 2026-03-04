// UI Scenes: Splash, Menu, Results, StageSelect, RecipeBook, Settings

class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }
  create() {
    this.cameras.main.setBackgroundColor(COLORS.uiBackground);
    const cx = GAME_WIDTH / 2;
    const title = this.add.text(cx, GAME_HEIGHT/2 - 40, 'PULSE\nWEAVER', {
      fontSize: '48px', fontFamily: 'sans-serif', color: '#7FFFD4', align: 'center', letterSpacing: 6,
    }).setOrigin(0.5);
    const sub = this.add.text(cx, GAME_HEIGHT/2 + 60, 'Draw. Transform. Cascade.', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#B0BEC5',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 400 });
    this.tweens.add({ targets: title, alpha: 0, duration: 400, delay: 1200, onComplete: () => this.scene.start('MenuScene') });
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor(COLORS.uiBackground);
    const cx = GAME_WIDTH / 2;
    // Ghost bg
    for (let i = 0; i < 3; i++) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0x7FFFD4, 0.06); gfx.fillCircle(60 + i * 130, 500 + (i%2)*60, 20 + i*8);
      this.tweens.add({ targets: gfx, x: gfx.x + 15, y: gfx.y - 10, duration: 6000 + i*3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.text(cx, 120, 'PULSE WEAVER', { fontSize: '32px', fontFamily: 'sans-serif', color: '#7FFFD4', letterSpacing: 4 }).setOrigin(0.5);
    this.add.text(cx, 162, 'Draw. Transform. Cascade.', { fontSize: '14px', fontFamily: 'sans-serif', color: '#B0BEC5' }).setOrigin(0.5);
    if (GameState.highScore > 0) this.add.text(cx, 205, `Best: ${GameState.highScore.toLocaleString()}`, { fontSize: '14px', fontFamily: 'sans-serif', color: '#90A4AE' }).setOrigin(0.5);

    this._btn(cx, 290, 240, 56, true,  'PLAY',         () => { AudioEngine.playButton(); AudioEngine.stopMusic(); this.scene.start('GameScene', { stage: GameState.currentStage }); });
    this._btn(cx, 368, 160, 44, false, 'Recipes',      () => { AudioEngine.playButton(); this.scene.start('RecipeBookScene'); });
    this._btn(cx, 422, 160, 44, false, 'Stage Select', () => { AudioEngine.playButton(); this.scene.start('StageSelectScene'); });

    const gear = this.add.text(GAME_WIDTH - 16, 16, '⚙', { fontSize: '28px', color: '#90A4AE' }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    gear.on('pointerdown', () => { AudioEngine.playButton(); this.scene.launch('SettingsScene'); });
    AudioEngine.startMusic('menu');
  }
  _btn(x, y, w, h, filled, label, cb) {
    const g = this.add.graphics();
    if (filled) { g.fillStyle(0x7FFFD4, 1); g.fillRoundedRect(x-w/2, y-h/2, w, h, h/2); }
    else { g.lineStyle(2, 0x7FFFD4, 1); g.strokeRoundedRect(x-w/2, y-h/2, w, h, h/2); }
    const fs = filled ? 20 : 16;
    const txt = this.add.text(x, y, label, { fontSize: `${fs}px`, fontFamily: 'sans-serif', color: filled ? '#1A237E' : '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', cb);
    zone.on('pointerover', () => txt.setScale(1.05));
    zone.on('pointerout',  () => txt.setScale(1.0));
    return zone;
  }
}

class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }
  init(d) {
    this.stageNum = d.stage || 1; this.score = d.score || 0; this.stars = d.stars || 0;
    this.combosFound = d.combosFound || 0; this.totalCombos = d.totalCombos || 0;
    this.newRecipes = d.newRecipes || [];
  }
  create() {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(0x00000088);
    const panelY = GAME_HEIGHT * 0.25;

    const panel = this.add.graphics();
    panel.fillStyle(0x1A237E, 1); panel.fillRoundedRect(20, panelY, GAME_WIDTH - 40, GAME_HEIGHT - panelY - 20, 16);

    this.add.text(cx, panelY + 30, 'STAGE COMPLETE', { fontSize: '22px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, panelY + 60, `Stage ${this.stageNum}`, { fontSize: '15px', fontFamily: 'sans-serif', color: '#B0BEC5' }).setOrigin(0.5);

    // Stars
    for (let i = 0; i < 3; i++) {
      this.add.text(cx - 60 + i * 60, panelY + 110, '★', { fontSize: '36px', color: i < this.stars ? '#FFD700' : '#37474F' }).setOrigin(0.5);
    }

    // Score count-up
    const scoreTxt = this.add.text(cx, panelY + 165, '0', { fontSize: '36px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);
    const start = this.time.now, dur = 1000, target = this.score;
    this.time.addEvent({ delay: 16, loop: true, callback: () => {
      const t = Math.min(1, (this.time.now - start) / dur);
      scoreTxt.setText(Math.floor(t * target).toLocaleString());
    }});

    this.add.text(cx, panelY + 210, `Combos: ${this.combosFound}/${this.totalCombos}`, { fontSize: '13px', fontFamily: 'sans-serif', color: '#90A4AE' }).setOrigin(0.5);

    if (this.newRecipes.length > 0) {
      this.add.text(cx, panelY + 240, `NEW: ${this.newRecipes[0]}!`, { fontSize: '13px', fontFamily: 'sans-serif', color: '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5);
    }

    this._btn(cx, panelY + 300, 240, 52, true,  'NEXT STAGE', () => {
      AudioEngine.playButton();
      GameState.currentStage = this.stageNum + 1; saveState();
      this.scene.start('GameScene', { stage: GameState.currentStage });
    });
    this._btn(cx, panelY + 368, 160, 40, false, 'MENU', () => {
      AudioEngine.playButton();
      AdManager.maybeShowInterstitial('quit', () => this.scene.start('MenuScene'));
    });

    this.tweens.add({ targets: panel, y: panel.y - 30, duration: 400, ease: 'Back.easeOut', from: panel.y + 50 });
    AudioEngine.playStageComplete();
  }
  _btn(x, y, w, h, filled, label, cb) {
    const g = this.add.graphics();
    if (filled) { g.fillStyle(0x7FFFD4, 1); g.fillRoundedRect(x-w/2, y-h/2, w, h, h/2); }
    else { g.lineStyle(2, 0x7FFFD4, 1); g.strokeRoundedRect(x-w/2, y-h/2, w, h, h/2); }
    this.add.text(x, y, label, { fontSize: '15px', fontFamily: 'sans-serif', color: filled ? '#1A237E' : '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', cb);
  }
}

class StageSelectScene extends Phaser.Scene {
  constructor() { super('StageSelectScene'); }
  create() {
    this.cameras.main.setBackgroundColor(COLORS.uiBackground);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 30, 'STAGE SELECT', { fontSize: '20px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);
    const cols = 5, sz = 52, gap = 8;
    const sx = (GAME_WIDTH - (cols*(sz+gap)-gap)) / 2 + sz/2;
    const max = Math.max(GameState.currentStage, 1);
    for (let i = 1; i <= Math.min(50, max + 1); i++) {
      const c = (i-1) % cols, r = Math.floor((i-1) / cols);
      const x = sx + c*(sz+gap), y = 80 + r*(sz+gap);
      const locked = i > max;
      const g = this.add.graphics(); g.fillStyle(locked ? 0x263238 : 0x1A237E, 1); g.fillRoundedRect(x-sz/2, y-sz/2, sz, sz, 8);
      if (!locked) { g.lineStyle(1, 0x7FFFD4, 0.5); g.strokeRoundedRect(x-sz/2, y-sz/2, sz, sz, 8); }
      this.add.text(x, y, `${i}`, { fontSize: '13px', fontFamily: 'sans-serif', color: locked ? '#546E7A' : '#ECEFF1' }).setOrigin(0.5);
      if (!locked) {
        const n = i;
        this.add.zone(x, y, sz, sz).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          AudioEngine.playButton(); GameState.currentStage = n; saveState();
          this.scene.start('GameScene', { stage: n });
        });
      }
    }
    this.add.text(cx, GAME_HEIGHT - 40, '← BACK', { fontSize: '16px', fontFamily: 'sans-serif', color: '#7FFFD4' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { AudioEngine.playButton(); this.scene.start('MenuScene'); });
  }
}

class RecipeBookScene extends Phaser.Scene {
  constructor() { super('RecipeBookScene'); }
  create() {
    this.cameras.main.setBackgroundColor(COLORS.uiBackground);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 28, 'RECIPE BOOK', { fontSize: '20px', fontFamily: 'sans-serif', color: '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5);
    const disc = GameState.recipesDiscovered;
    const all = [...COMBO_RECIPES, ...COMBO_3_RECIPES];
    const cols = 2, cw = 152, ch = 68, gap = 8;
    const sx = (GAME_WIDTH - (cols*(cw+gap)-gap))/2 + cw/2;
    all.forEach((r, i) => {
      const c = i%cols, row = Math.floor(i/cols);
      const x = sx + c*(cw+gap), y = 65 + row*(ch+gap);
      const found = disc.has(r.result);
      const g = this.add.graphics();
      g.fillStyle(found ? 0x1E3A5F : 0x162032, 1); g.fillRoundedRect(x-cw/2, y-ch/2, cw, ch, 8);
      if (found) { g.lineStyle(1, r.color || 0x7FFFD4, 0.6); g.strokeRoundedRect(x-cw/2, y-ch/2, cw, ch, 8); }
      if (found) {
        this.add.text(x, y - 16, r.name, { fontSize: '13px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(x, y + 6, r.elements.join(' + '), { fontSize: '11px', fontFamily: 'sans-serif', color: '#90A4AE' }).setOrigin(0.5);
      } else {
        this.add.text(x, y, '???', { fontSize: '18px', fontFamily: 'sans-serif', color: '#37474F' }).setOrigin(0.5);
      }
    });
    this.add.text(cx, GAME_HEIGHT - 38, '← BACK', { fontSize: '16px', fontFamily: 'sans-serif', color: '#7FFFD4' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { AudioEngine.playButton(); this.scene.start('MenuScene'); });
  }
}

class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }
  create() {
    const cx = GAME_WIDTH/2, cy = GAME_HEIGHT/2, pw = 280, ph = 240;
    this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add.graphics().fillStyle(0x1A237E, 1).fillRoundedRect(cx-pw/2, cy-ph/2, pw, ph, 16);
    this.add.text(cx, cy - ph/2 + 24, 'SETTINGS', { fontSize: '20px', fontFamily: 'sans-serif', color: '#ECEFF1', fontStyle: 'bold' }).setOrigin(0.5);
    this._toggle(cx, cy - 40, 'Sound FX',  AudioEngine, 'enabled');
    this._toggle(cx, cy,      'Music',      AudioEngine, 'musicEnabled');
    this._toggle(cx, cy + 40, 'Vibration',  GameState.settings, 'vibration');
    this.add.text(cx, cy + ph/2 - 20, 'DONE', { fontSize: '16px', fontFamily: 'sans-serif', color: '#7FFFD4', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => { saveState(); this.scene.stop(); });
  }
  _toggle(x, y, label, obj, prop) {
    this.add.text(x - 60, y, label, { fontSize: '14px', fontFamily: 'sans-serif', color: '#ECEFF1' }).setOrigin(0.5);
    const on = obj[prop] !== false;
    const ind = this.add.text(x + 70, y, on ? 'ON' : 'OFF', { fontSize: '13px', fontFamily: 'sans-serif', color: on ? '#7FFFD4' : '#546E7A', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    ind.on('pointerdown', () => { obj[prop] = !obj[prop]; ind.setText(obj[prop] ? 'ON' : 'OFF'); ind.setColor(obj[prop] ? '#7FFFD4' : '#546E7A'); AudioEngine.playButton(); });
  }
}
