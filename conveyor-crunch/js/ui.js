// Conveyor Crunch - UI Scenes (Menu, GameOver, HUD)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.BG_COLOR);
    // Animated belt bg
    const belt = this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2 + 20, CONFIG.WIDTH - 40, 60, 0x5C6370, 0.3);
    this.tweens.add({ targets: belt, x: belt.x + 10, duration: 800, yoyo: true, repeat: -1 });
    // Title
    this.add.text(CONFIG.WIDTH/2, 180, 'CONVEYOR\nCRUNCH', {
      fontSize: '52px', fontFamily: 'Arial Black, Arial', fill: '#FFFFFF',
      stroke: '#000', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5);
    // High score
    const hs = getStorage(STORAGE_KEYS.HIGH_SCORE, 0);
    this.add.text(CONFIG.WIDTH/2, 290, 'BEST: ' + hs, {
      fontSize: '22px', fontFamily: 'Arial', fill: COLORS.REWARD
    }).setOrigin(0.5);
    // Play button
    const playBtn = this.add.rectangle(CONFIG.WIDTH/2, 400, 200, 65, 0x27AE60).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(CONFIG.WIDTH/2, 400, 'PLAY', {
      fontSize: '32px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5);
    playTxt.disableInteractive();
    this.tweens.add({ targets: [playBtn], scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    playBtn.on('pointerdown', () => { this.scene.start('GameScene'); });
    // Help button
    const helpBtn = this.add.circle(50, 50, 22, 0x34495E).setInteractive({ useHandCursor: true });
    this.add.text(50, 50, '?', { fontSize: '24px', fontFamily: 'Arial Black', fill: '#FFF' }).setOrigin(0.5).disableInteractive();
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
    // Sound toggle
    this.soundOn = getStorage(STORAGE_KEYS.SOUND, true);
    const sndBtn = this.add.circle(CONFIG.WIDTH - 50, 50, 22, 0x34495E).setInteractive({ useHandCursor: true });
    const sndTxt = this.add.text(CONFIG.WIDTH - 50, 50, this.soundOn ? 'SND' : 'OFF', {
      fontSize: '13px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).disableInteractive();
    sndBtn.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      setStorage(STORAGE_KEYS.SOUND, this.soundOn);
      sndTxt.setText(this.soundOn ? 'SND' : 'OFF');
    });
    // Highest stage
    const hStage = getStorage(STORAGE_KEYS.HIGHEST_STAGE, 0);
    if (hStage > 0) {
      this.add.text(CONFIG.WIDTH/2, 460, 'Stage Record: ' + hStage, {
        fontSize: '18px', fontFamily: 'Arial', fill: '#AAA'
      }).setOrigin(0.5);
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalData = data || {}; }
  create() {
    const d = this.finalData;
    this.cameras.main.setBackgroundColor(0x1A1A2E);
    // Overlay
    this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
    this.add.text(CONFIG.WIDTH/2, 120, 'GAME OVER', {
      fontSize: '44px', fontFamily: 'Arial Black', fill: COLORS.DANGER, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    // Death cause
    const cause = d.cause || 'BELT OVERFLOW!';
    this.add.text(CONFIG.WIDTH/2, 175, cause, {
      fontSize: '20px', fontFamily: 'Arial', fill: '#E88E8E'
    }).setOrigin(0.5);
    // Score
    const score = d.score || 0;
    this.add.text(CONFIG.WIDTH/2, 240, score.toString(), {
      fontSize: '56px', fontFamily: 'Arial Black', fill: '#FFF', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    // High score check
    const prevHigh = getStorage(STORAGE_KEYS.HIGH_SCORE, 0);
    const isNew = score > prevHigh;
    if (isNew) {
      setStorage(STORAGE_KEYS.HIGH_SCORE, score);
      this.add.text(CONFIG.WIDTH/2, 295, 'NEW BEST!', {
        fontSize: '26px', fontFamily: 'Arial Black', fill: COLORS.REWARD
      }).setOrigin(0.5);
      Effects.particleBurst(this, CONFIG.WIDTH/2, 295, COLORS.REWARD, 20, 800);
    } else {
      this.add.text(CONFIG.WIDTH/2, 295, 'Best: ' + prevHigh, {
        fontSize: '18px', fontFamily: 'Arial', fill: '#AAA'
      }).setOrigin(0.5);
    }
    // Stage
    this.add.text(CONFIG.WIDTH/2, 330, 'Stage: ' + (d.stage || 1), {
      fontSize: '20px', fontFamily: 'Arial', fill: '#CCC'
    }).setOrigin(0.5);
    setStorage(STORAGE_KEYS.HIGHEST_STAGE,
      Math.max(getStorage(STORAGE_KEYS.HIGHEST_STAGE, 0), d.stage || 1));
    setStorage(STORAGE_KEYS.GAMES_PLAYED, getStorage(STORAGE_KEYS.GAMES_PLAYED, 0) + 1);
    AdManager.onGameOver();
    // Continue button (ad)
    let btnY = 400;
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(CONFIG.WIDTH/2, btnY, 220, 50, 0xF39C12).setInteractive({ useHandCursor: true });
      this.add.text(CONFIG.WIDTH/2, btnY, 'Continue (Ad)', {
        fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFF'
      }).setOrigin(0.5).disableInteractive();
      contBtn.on('pointerdown', () => {
        AdManager.showRewarded('continue', () => {
          this.scene.start('GameScene', { continueFrom: d });
        });
      });
      btnY += 65;
    }
    // Play Again
    const playBtn = this.add.rectangle(CONFIG.WIDTH/2, btnY, 220, 50, 0x27AE60).setInteractive({ useHandCursor: true });
    this.add.text(CONFIG.WIDTH/2, btnY, 'Play Again', {
      fontSize: '22px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', () => { this.scene.start('GameScene'); });
    btnY += 60;
    // Menu
    const menuBtn = this.add.rectangle(CONFIG.WIDTH/2, btnY, 220, 45, 0x34495E).setInteractive({ useHandCursor: true });
    this.add.text(CONFIG.WIDTH/2, btnY, 'Menu', {
      fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });
    // Show interstitial if needed
    if (AdManager.shouldShowInterstitial()) {
      AdManager.showInterstitial();
    }
  }
}

// HUD helper - called from GameScene
const HUD = {
  create(scene) {
    const s = scene;
    s.hudGroup = s.add.group();
    // Score
    s.scoreText = s.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT - 55, '0', {
      fontSize: '28px', fontFamily: 'Arial Black', fill: '#FFF', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(50);
    // Stage
    s.stageText = s.add.text(CONFIG.WIDTH - 20, CONFIG.HEIGHT - 55, 'S:1', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#CCC'
    }).setOrigin(1, 0.5).setDepth(50);
    // Strikes
    s.strikeIcons = [];
    for (let i = 0; i < GAME.MAX_STRIKES; i++) {
      const icon = s.add.text(20 + i * 28, CONFIG.HEIGHT - 60, '_', {
        fontSize: '22px', fontFamily: 'Arial Black', fill: '#555'
      }).setDepth(50);
      s.strikeIcons.push(icon);
    }
    // Pile meter
    s.pileBars = [];
    for (let i = 0; i < GAME.MAX_PILE; i++) {
      const bar = s.add.rectangle(20, CONFIG.HEIGHT - 100 - i * 18, 14, 14, 0x555555)
        .setDepth(50).setOrigin(0, 0.5);
      s.pileBars.push(bar);
    }
    // Combo text (hidden initially)
    s.comboHudText = s.add.text(CONFIG.WIDTH/2, CONFIG.HEIGHT - 30, '', {
      fontSize: '16px', fontFamily: 'Arial', fill: COLORS.REWARD
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
    // Pause button
    const pauseBtn = s.add.circle(CONFIG.WIDTH - 30, 30, 18, 0x34495E, 0.8)
      .setInteractive({ useHandCursor: true }).setDepth(50);
    s.add.text(CONFIG.WIDTH - 30, 30, '||', {
      fontSize: '16px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(51).disableInteractive();
    pauseBtn.on('pointerdown', () => { if (s.scene.isPaused()) return; s.pauseGame(); });
  },
  updateScore(scene, score) {
    scene.scoreText.setText(score.toString());
    Effects.scalePunch(scene, scene.scoreText, 1.3, 150);
  },
  updateStage(scene, stage) { scene.stageText.setText('S:' + stage); },
  updateStrikes(scene, strikes) {
    for (let i = 0; i < GAME.MAX_STRIKES; i++) {
      scene.strikeIcons[i].setText(i < strikes ? 'X' : '_');
      scene.strikeIcons[i].setColor(i < strikes ? COLORS.DANGER : '#555');
    }
  },
  updatePile(scene, pile) {
    for (let i = 0; i < GAME.MAX_PILE; i++) {
      const active = i < pile;
      const color = pile >= 4 ? 0xC0392B : pile >= 3 ? 0xF39C12 : 0x27AE60;
      scene.pileBars[i].setFillStyle(active ? color : 0x555555);
    }
  },
  updateCombo(scene, combo) {
    if (combo >= 2) {
      scene.comboHudText.setText('x' + combo).setAlpha(1);
      if (combo >= 5) scene.comboHudText.setColor(COLORS.REWARD);
      else scene.comboHudText.setColor('#FFF');
    } else {
      scene.comboHudText.setAlpha(0);
    }
  }
};

// PauseScene
class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }
  create() {
    this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
    this.add.text(CONFIG.WIDTH/2, 180, 'PAUSED', {
      fontSize: '40px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5);
    const makeBtn = (y, label, cb) => {
      const btn = this.add.rectangle(CONFIG.WIDTH/2, y, 200, 50, 0x34495E).setInteractive({ useHandCursor: true });
      this.add.text(CONFIG.WIDTH/2, y, label, { fontSize: '22px', fontFamily: 'Arial Black', fill: '#FFF' })
        .setOrigin(0.5).disableInteractive();
      btn.on('pointerdown', cb);
    };
    makeBtn(280, 'Resume', () => {
      this.scene.stop(); const gs = this.scene.get('GameScene');
      if (gs) gs.isPaused = false; this.scene.resume('GameScene');
    });
    makeBtn(345, 'Restart', () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('GameScene'); });
    makeBtn(410, 'Help', () => {
      this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'PauseScene' });
    });
    makeBtn(475, 'Menu', () => { this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('MenuScene'); });
  }
}
