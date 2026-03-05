// Shrink Panic - UI Scenes (Menu, GameOver) + HUD Manager
const HUD = {
  scoreText: null, timerText: null, vpText: null,
  energyIcons: [], hearts: [],

  create(scene, gw) {
    const h = CONFIG.GAMEPLAY.HUD_HEIGHT;
    scene.add.rectangle(gw / 2, h / 2, gw, h, CONFIG.COLORS.HUD_BG, 0.9).setDepth(10);
    this.scoreText = scene.add.text(10, h / 2, 'SCORE: 0', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);
    this.timerText = scene.add.text(gw - 10, h / 2, '0s', {
      fontSize: '14px', fontFamily: 'Arial', color: '#AAAAAA'
    }).setOrigin(1, 0.5).setDepth(11);

    this.energyIcons = [];
    for (let i = 0; i < CONFIG.GAMEPLAY.EXPAND_COST; i++) {
      const icon = scene.add.star(gw / 2 - 40 + i * 20, h / 2, 5, 4, 9, 0x333333).setDepth(11);
      this.energyIcons.push(icon);
    }

    this.hearts = [];
    for (let i = 0; i < CONFIG.GAMEPLAY.MISS_MAX; i++) {
      const heart = scene.add.text(gw - 70 + i * 18, h / 2, '\u2665', {
        fontSize: '16px', color: '#FF0000'
      }).setOrigin(0.5).setDepth(11);
      this.hearts.push(heart);
    }

    this.vpText = scene.add.text(10, h + 4, '100%', {
      fontSize: '12px', fontFamily: 'Arial', color: '#00FFFF'
    }).setDepth(11);

    const pauseBtn = scene.add.text(gw / 2 + 50, h / 2, '\u275A\u275A', {
      fontSize: '16px', color: '#AAAAAA'
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      scene._togglePause();
    });
  },

  update(gs) {
    if (!this.scoreText) return;
    this.scoreText.setText('SCORE: ' + gs.score);
    this.timerText.setText(Math.floor(gs.elapsedTime) + 's');
    for (let i = 0; i < this.energyIcons.length; i++) {
      this.energyIcons[i].setFillStyle(i < gs.expandEnergy ? 0x00BFFF : 0x333333);
    }
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setAlpha(i < (CONFIG.GAMEPLAY.MISS_MAX - gs.missCount) ? 1 : 0.2);
    }
    const pct = Math.round(gs._vpPercent() * 100);
    this.vpText.setText(pct + '%');
    if (pct < 25) this.vpText.setColor('#FF0000');
    else if (pct < 50) this.vpText.setColor('#FFD700');
    else this.vpText.setColor('#00FFFF');

    if (gs.expandEnergy >= CONFIG.GAMEPLAY.EXPAND_COST && !gs.expandReady) {
      gs.expandReady = true;
      this.energyIcons.forEach(icon => {
        gs.tweens.add({ targets: icon, scale: 1.4, duration: 300, yoyo: true, repeat: 2 });
      });
      Effects.scorePopup(gs, gs.gw / 2, CONFIG.GAMEPLAY.HUD_HEIGHT + 20, 'EXPAND READY!', '#00FFFF');
    }
  },

  punchScore(scene) {
    if (this.scoreText) {
      scene.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    }
  }
};

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, CONFIG.COLORS.VOID);

    const border = this.add.rectangle(w / 2, h / 2, w * 0.7, h * 0.5, 0, 0)
      .setStrokeStyle(3, CONFIG.COLORS.VIEWPORT_BORDER);
    this.tweens.add({ targets: border, alpha: 0.6, duration: 800, yoyo: true, repeat: -1 });

    const title = this.add.text(w / 2, h * 0.28, 'SHRINK\nPANIC', {
      fontSize: '52px', fontFamily: 'Arial', color: CONFIG.COLORS_HEX.VIEWPORT_BORDER,
      fontStyle: 'bold', align: 'center', stroke: '#004444', strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.05, duration: 1200, yoyo: true, repeat: -1 });

    const hs = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0');
    if (hs > 0) {
      this.add.text(w / 2, h * 0.48, 'BEST: ' + hs, {
        fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    const playText = this.add.text(w / 2, h * 0.62, 'TAP TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: playText, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    const helpBtn = this.add.text(w - 40, h - 40, '?', {
      fontSize: '28px', fontFamily: 'Arial', color: '#00FFFF', fontStyle: 'bold',
      backgroundColor: '#1a1a3a', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    const soundOn = localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false';
    SFX.enabled = soundOn;
    const soundBtn = this.add.text(w - 40, 30, soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07', {
      fontSize: '24px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      SFX.enabled = !SFX.enabled;
      localStorage.setItem(STORAGE_KEYS.SOUND, SFX.enabled);
      soundBtn.setText(SFX.enabled ? '\uD83D\uDD0A' : '\uD83D\uDD07');
    });

    this.input.on('pointerdown', () => {
      SFX.resume();
      this.scene.start('GameScene');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.stats = data || {}; }

  create() {
    const w = this.scale.width, h = this.scale.height, s = this.stats;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(0);

    const hs = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0');
    const isNewBest = s.score > hs;
    if (isNewBest) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, s.score);
      SFX.highScore();
    }
    localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED,
      (parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || '0') + 1).toString());

    this.add.text(w / 2, h * 0.12, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial', color: '#FF0000', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    const scoreText = this.add.text(w / 2, h * 0.24, s.score || 0, {
      fontSize: '48px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.add({ targets: scoreText, scale: 1.15, duration: 300, yoyo: true });

    if (isNewBest) {
      this.add.text(w / 2, h * 0.33, 'NEW BEST!', {
        fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
      }).setOrigin(0.5);
      for (let i = 0; i < 20; i++) {
        const c = this.add.circle(
          w * 0.2 + Math.random() * w * 0.6, h * 0.1 + Math.random() * h * 0.3,
          3, [0xFFD700, 0x00FFFF, 0xFF1493, 0x39FF14][i % 4]);
        this.tweens.add({
          targets: c, y: c.y + 100 + Math.random() * 100, alpha: 0,
          duration: 1000 + Math.random() * 500, delay: Math.random() * 300
        });
      }
    }

    const sy = h * 0.42;
    ['Time: ' + Math.floor(s.time || 0) + 's',
     'Targets: ' + (s.targetsHit || 0),
     'Best Combo: x' + (s.bestCombo || 0)
    ].forEach((txt, i) => {
      this.add.text(w / 2, sy + i * 28, txt, {
        fontSize: '18px', fontFamily: 'Arial', color: '#AAAAAA'
      }).setOrigin(0.5);
    });

    if (AdManager.canShowRewarded()) {
      this._btn(w / 2, h * 0.62, 'Continue (Ad)', '#00BFFF', () => {
        AdManager.showRewarded(() => { this.scene.start('GameScene', { continueData: s }); });
      });
    }
    this._btn(w / 2, h * 0.73, 'PLAY AGAIN', '#39FF14', () => { this.scene.start('GameScene'); });
    this._btn(w / 2, h * 0.83, 'Menu', '#888888', () => { this.scene.start('MenuScene'); });

    AdManager.onGameOver();
    if (AdManager.shouldShowInterstitial()) AdManager.showInterstitial();
  }

  _btn(x, y, label, color, cb) {
    const bg = this.add.rectangle(x, y, 200, 42, 0x1a1a3a, 0.9)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '20px', fontFamily: 'Arial', color: color, fontStyle: 'bold'
    }).setOrigin(0.5);
    txt.disableInteractive();
    bg.on('pointerdown', cb);
  }
}
