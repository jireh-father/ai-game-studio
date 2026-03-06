// ui.js - MenuScene, GameOverScene, HUD, PauseOverlay, Pipe Tray

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0xE0F7FA);
    // Title with drip effect
    const title = this.add.text(w / 2, h * 0.2, 'PIPE DREAM\nPLUMBER', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      fill: COLORS.uiText, align: 'center', stroke: '#fff', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: title.y + 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Drip particles
    this.time.addEvent({ delay: 800, loop: true, callback: () => {
      const drip = this.add.circle(w / 2 + Phaser.Math.Between(-60, 60), h * 0.28, 3, 0x4FC3F7).setDepth(5);
      this.tweens.add({ targets: drip, y: drip.y + 40, alpha: 0, duration: 600, onComplete: () => drip.destroy() });
    }});
    // Play button
    const playBtn = this.add.rectangle(w / 2, h * 0.55, 200, 60, 0x66BB6A, 1).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.55, 'PLAY', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => { sfx.play('uiClick'); this.scene.start('GameScene'); });
    // Help button
    const helpBtn = this.add.circle(w - 40, 40, 22, 0xFFB300).setInteractive({ useHandCursor: true });
    this.add.text(w - 40, 40, '?', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => { sfx.play('uiClick'); this.scene.start('HelpScene', { returnTo: 'MenuScene' }); });
    // High score
    const hs = GameState.highScore || 0;
    this.add.text(w / 2, h * 0.7, `High Score: ${hs}`, { fontSize: '20px', fontFamily: 'Arial', fill: COLORS.accent }).setOrigin(0.5);
    const bs = GameState.bestStage || 0;
    this.add.text(w / 2, h * 0.77, `Best Stage: ${bs}`, { fontSize: '16px', fontFamily: 'Arial', fill: COLORS.pipeOutline }).setOrigin(0.5);
    // Sound toggle
    const sndTxt = this.add.text(15, 15, GameState.sound ? 'Sound ON' : 'Sound OFF', {
      fontSize: '14px', fontFamily: 'Arial', fill: COLORS.pipeOutline
    }).setInteractive({ useHandCursor: true });
    sndTxt.on('pointerdown', () => {
      GameState.sound = !GameState.sound; sfx.enabled = GameState.sound;
      sndTxt.setText(GameState.sound ? 'Sound ON' : 'Sound OFF');
      saveState();
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.finalStage = data.stage || 1; this.isNewRecord = data.isNewRecord || false; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(0);
    // Flooded title
    const title = this.add.text(w / 2, h * 0.15, 'FLOODED!', {
      fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', fill: COLORS.danger,
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, x: title.x + 3, duration: 80, yoyo: true, repeat: 5 });
    // Score
    const scoreTxt = this.add.text(w / 2, h * 0.3, `${this.finalScore}`, {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', fill: COLORS.accent,
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: scoreTxt, scale: 1, duration: 300, ease: 'Back.easeOut' });
    if (this.isNewRecord) {
      const nr = this.add.text(w / 2, h * 0.4, 'NEW RECORD!', {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', fill: COLORS.accent
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, y: nr.y - 8, duration: 400, yoyo: true, repeat: -1 });
      sfx.play('highScore');
    }
    this.add.text(w / 2, h * 0.47, `Stage ${this.finalStage}`, { fontSize: '22px', fontFamily: 'Arial', fill: '#fff' }).setOrigin(0.5);
    // Continue button (ad)
    if (adsManager.canShowContinue()) {
      const contBtn = this.add.rectangle(w / 2, h * 0.58, 220, 48, 0x4FC3F7).setInteractive({ useHandCursor: true });
      this.add.text(w / 2, h * 0.58, 'Watch Ad: Drain 50%', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        sfx.play('uiClick');
        adsManager.showRewarded('continue', () => { this.scene.start('GameScene', { continueGame: true }); });
      });
    }
    // Play Again
    const playBtn = this.add.rectangle(w / 2, h * 0.7, 200, 50, 0x66BB6A).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.7, 'Play Again', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => { sfx.play('uiClick'); this.scene.start('GameScene'); });
    // Menu
    const menuBtn = this.add.rectangle(w / 2, h * 0.82, 140, 40, 0x78909C).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.82, 'Menu', { fontSize: '18px', fontFamily: 'Arial', fill: '#fff' }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => { sfx.play('uiClick'); this.scene.start('MenuScene'); });
    adsManager.onGameOver();
    if (adsManager.shouldShowInterstitial()) adsManager.showInterstitial();
  }
}

function createHUD(scene) {
  const w = scene.scale.width;
  const hud = {};
  const bar = scene.add.rectangle(w / 2, 20, w, 40, 0x000000, 0.5).setDepth(100);
  hud.scoreText = scene.add.text(10, 12, `Score: ${scene.score}`, {
    fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff'
  }).setDepth(101);
  hud.stageText = scene.add.text(w / 2, 12, `Stage ${scene.stageNum}`, {
    fontSize: '16px', fontFamily: 'Arial', fill: '#fff'
  }).setOrigin(0.5, 0).setDepth(101);
  // Pause button
  hud.pauseBtn = scene.add.text(w - 35, 12, '||', {
    fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff'
  }).setOrigin(0.5, 0).setDepth(101).setInteractive({ useHandCursor: true });
  hud.pauseBtn.on('pointerdown', () => scene.togglePause());
  // Streak
  hud.streakText = scene.add.text(w - 60, 42, '', {
    fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', fill: COLORS.accent
  }).setDepth(101);
  return hud;
}

function updateHUD(hud, scene) {
  if (!hud) return;
  hud.scoreText.setText(`Score: ${scene.score}`);
  hud.stageText.setText(`Stage ${scene.stageNum}`);
  if (scene.streak > 1) hud.streakText.setText(`Streak x${scene.streak}`);
  else hud.streakText.setText('');
}
