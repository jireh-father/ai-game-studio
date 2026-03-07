// ui.js - MenuScene, HUD, overlays, effects, GameScene prototype extensions

class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);
    const syms = ['\u2666', '\u25CF', '\u25B2', '\u223F', '\u26A1'];
    for (let i = 0; i < 8; i++) {
      const s = this.add.text(50 + Math.random() * (w - 100), 80 + Math.random() * 200, syms[i % 5], {
        fontSize: '28px', color: '#3D2E6B'
      }).setOrigin(0.5).setAlpha(0.3);
      this.tweens.add({ targets: s, y: s.y - 20, duration: 2000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.text(w / 2, h * 0.22, 'TILE ALCHEMY', {
      fontSize: '40px', fontFamily: 'Arial', color: '#FFB300', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.30, 'Merge elements. Master the table.\nChain reactions.', {
      fontSize: '13px', fontFamily: 'Arial', color: '#8B7FBB', align: 'center'
    }).setOrigin(0.5);
    const playBtn = this.add.rectangle(w / 2, h * 0.50, 200, 56, COLORS.UI_ACCENT).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(w / 2, h * 0.50, 'PLAY', {
      fontSize: '26px', fontFamily: 'Arial', color: '#0D0B1E', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const startGame = () => {
      this.tweens.add({ targets: [playBtn, playTxt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true,
        onComplete: () => { this.scene.start('GameScene'); }
      });
    };
    playBtn.on('pointerdown', startGame);
    playTxt.on('pointerdown', startGame);
    const helpBtn = this.add.circle(w - 36, 36, 22, COLORS.CELL_STROKE).setInteractive({ useHandCursor: true });
    const helpTxt = this.add.text(w - 36, 36, '?', { fontSize: '22px', color: '#FFB300', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const openHelp = () => { this.scene.start('HelpScene', { returnScene: 'MenuScene' }); };
    helpBtn.on('pointerdown', openHelp);
    helpTxt.on('pointerdown', openHelp);
    this.add.text(w / 2, h * 0.65, 'Best: ' + GameState.highScore, {
      fontSize: '22px', fontFamily: 'Arial', color: '#FFD700'
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.72, 'Games: ' + GameState.gamesPlayed, {
      fontSize: '16px', fontFamily: 'Arial', color: '#8B7FBB'
    }).setOrigin(0.5);
    const soundTxt = GameState.settings.sound ? '\u{1F50A}' : '\u{1F507}';
    const soundBtn = this.add.text(w - 36, h - 36, soundTxt, { fontSize: '28px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      soundBtn.setText(GameState.settings.sound ? '\u{1F50A}' : '\u{1F507}');
      saveState();
    });
  }
}

// HUD class
class HUD {
  constructor(scene) {
    this.scene = scene;
    const w = CONFIG.WIDTH;
    scene.add.rectangle(w / 2, 24, w, 48, COLORS.BG, 0.85).setDepth(10);
    this.scoreText = scene.add.text(16, 14, '' + GameState.score, {
      fontSize: '24px', fontFamily: 'Arial', color: '#E8E0F0', fontStyle: 'bold'
    }).setDepth(11);
    this.stageText = scene.add.text(w / 2, 14, 'Stage ' + GameState.stage, {
      fontSize: '18px', fontFamily: 'Arial', color: '#E8E0F0'
    }).setOrigin(0.5, 0).setDepth(11);
    const helpBg = scene.add.circle(w - 56, 24, 22, COLORS.CELL_STROKE).setDepth(11).setInteractive({ useHandCursor: true });
    const helpTxt2 = scene.add.text(w - 56, 24, '?', { fontSize: '18px', color: '#FFB300', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    const openHelp2 = () => { if (scene.gameOver || scene.paused) return; scene.pauseGame(); scene.scene.launch('HelpScene', { returnScene: 'GameScene' }); };
    helpBg.on('pointerdown', openHelp2);
    helpTxt2.on('pointerdown', openHelp2);
    const pauseBg = scene.add.circle(w - 18, 24, 22, COLORS.CELL_STROKE).setDepth(11).setInteractive({ useHandCursor: true });
    const pauseTxt2 = scene.add.text(w - 18, 24, '||', { fontSize: '14px', color: '#E8E0F0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    const doPause = () => { if (scene.gameOver || scene.paused) return; scene.pauseGame(); scene.showPauseOverlay(); };
    pauseBg.on('pointerdown', doPause);
    pauseTxt2.on('pointerdown', doPause);
    const barY = 555;
    scene.add.rectangle(w / 2, barY, 286, 24, 0x111111).setDepth(10);
    this.voidBarBg = scene.add.rectangle(w / 2 - 138, barY, 0, 20, COLORS.SUCCESS).setOrigin(0, 0.5).setDepth(10);
    this.voidText = scene.add.text(16, barY - 1, 'Void: 0', { fontSize: '13px', fontFamily: 'Arial', color: '#E8E0F0' }).setOrigin(0, 0.5).setDepth(11);
    this.voidPctText = scene.add.text(w - 16, barY - 1, '0%', { fontSize: '13px', fontFamily: 'Arial', color: '#E8E0F0' }).setOrigin(1, 0.5).setDepth(11);
    this.pureText = scene.add.text(16, 580, 'Pure in: ' + (CONFIG.PURE_CRYSTAL_FREQUENCY - GameState.mergesSincePure) + ' merges', {
      fontSize: '13px', fontFamily: 'Arial', color: '#B388FF'
    }).setDepth(10);
    this.hiText = scene.add.text(w - 16, 580, 'Hi: ' + GameState.highScore, {
      fontSize: '13px', fontFamily: 'Arial', color: '#FFB300'
    }).setOrigin(1, 0).setDepth(10);
    this.mergeProgressText = scene.add.text(w / 2, 580, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#8B7FBB'
    }).setOrigin(0.5, 0).setDepth(10);
  }
  updateScore() { this.scoreText.setText('' + GameState.score); this.scene.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 75, yoyo: true }); }
  updateStage() { this.stageText.setText('Stage ' + GameState.stage); }
  updateVoid(count) {
    const pct = Math.round((count / 25) * 100);
    this.voidText.setText('Void: ' + count); this.voidPctText.setText(pct + '%');
    const fillW = Math.min(276, (count / 25) * 276);
    let fillColor = COLORS.SUCCESS;
    if (pct >= 60) fillColor = COLORS.DANGER; else if (pct >= 30) fillColor = 0xFFEB3B;
    this.voidBarBg.setFillStyle(fillColor);
    this.scene.tweens.add({ targets: this.voidBarBg, displayWidth: fillW, duration: 200 });
  }
  updatePure() { this.pureText.setText('Pure in: ' + Math.max(0, CONFIG.PURE_CRYSTAL_FREQUENCY - GameState.mergesSincePure) + ' merges'); }
  updateMergeProgress(cur, target) { this.mergeProgressText.setText('Merges: ' + cur + '/' + target); }
  updateHi() { this.hiText.setText('Hi: ' + GameState.highScore); }
}

// Standalone effects
function showFloatingText(scene, x, y, text, color, size) {
  const ft = scene.add.text(x, y, text, { fontSize: size + 'px', fontFamily: 'Arial', color: color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
  scene.tweens.add({ targets: ft, y: y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy() });
}

function spawnParticles(scene, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const speed = 120 + Math.random() * 130;
    const p = scene.add.circle(x, y, 3, color).setDepth(20);
    scene.tweens.add({ targets: p, x: x + Math.cos(angle) * speed * 0.4, y: y + Math.sin(angle) * speed * 0.4, alpha: 0, duration: 400, onComplete: () => p.destroy() });
  }
}

function philosopherEffect(scene, x, y) {
  const flash = scene.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, COLORS.PHILOSOPHER, 0.3).setDepth(25);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  spawnParticles(scene, x, y, COLORS.PHILOSOPHER, 40);
  scene.cameras.main.zoomTo(1.08, 250);
  scene.time.delayedCall(500, () => scene.cameras.main.zoomTo(1, 250));
}

// GameScene prototype extensions - overlays
function gameTriggerGameOver(deadlock) {
  if (this.gameOver) return;
  this.gameOver = true; this.deselectTile();
  if (this.voidTimerEvent) this.voidTimerEvent.remove();
  this.cameras.main.shake(400, 0.012);
  GameState.gamesPlayed++;
  GameState.newBest = GameState.score > GameState.highScore;
  if (GameState.newBest) GameState.highScore = GameState.score;
  if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage;
  saveState(); AdManager.onGameOver();
  this.time.delayedCall(700, () => gameShowGameOverOverlay.call(this, deadlock));
}

function gameShowGameOverOverlay(deadlock) {
  const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
  this.gameOverGroup = [];
  const bg = this.add.rectangle(w/2, h/2, w, h, COLORS.BG, 0.9).setDepth(30).setInteractive();
  this.gameOverGroup.push(bg);
  const title = this.add.text(w/2, h*0.18, deadlock ? 'DEADLOCK!' : 'TRANSMUTATION\nFAILED', {
    fontSize: '28px', fontFamily: 'Arial', color: '#FF1744', fontStyle: 'bold', align: 'center'
  }).setOrigin(0.5).setDepth(31);
  this.gameOverGroup.push(title);
  const scoreT = this.add.text(w/2, h*0.32, ''+GameState.score, {
    fontSize: '48px', fontFamily: 'Arial', color: '#E8E0F0', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(31);
  this.tweens.add({ targets: scoreT, scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true });
  this.gameOverGroup.push(scoreT);
  if (GameState.newBest) {
    const nb = this.add.text(w/2, h*0.40, 'NEW BEST!', { fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: nb, y: nb.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.gameOverGroup.push(nb);
  }
  this.gameOverGroup.push(this.add.text(w/2, h*0.48, 'Stage '+GameState.stage+'  |  Void: '+GameState.voidCount, {
    fontSize: '16px', fontFamily: 'Arial', color: '#8B7FBB'
  }).setOrigin(0.5).setDepth(31));
  const playBtn = this.add.rectangle(w/2, h*0.62, 200, 50, COLORS.UI_ACCENT).setDepth(31).setInteractive({ useHandCursor: true });
  const playTxt3 = this.add.text(w/2, h*0.62, 'PLAY AGAIN', { fontSize: '22px', fontFamily: 'Arial', color: '#0D0B1E', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
  const restartFn = () => this.scene.restart();
  playBtn.on('pointerdown', restartFn);
  playTxt3.on('pointerdown', restartFn);
  this.gameOverGroup.push(playBtn, playTxt3);
  const menuBtn = this.add.rectangle(w/2, h*0.72, 140, 44, COLORS.CELL_STROKE).setDepth(31).setInteractive({ useHandCursor: true });
  const menuTxt3 = this.add.text(w/2, h*0.72, 'MENU', { fontSize: '18px', fontFamily: 'Arial', color: '#E8E0F0' }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
  const goMenu = () => this.scene.start('MenuScene');
  menuBtn.on('pointerdown', goMenu);
  menuTxt3.on('pointerdown', goMenu);
  this.gameOverGroup.push(menuBtn, menuTxt3);
}

function gameShowPauseOverlay() {
  const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
  this.pauseOverlayGroup = [];
  const bg = this.add.rectangle(w/2, h/2, w, h, COLORS.BG, 0.88).setDepth(30).setInteractive();
  this.pauseOverlayGroup.push(bg);
  this.pauseOverlayGroup.push(this.add.text(w/2, h*0.25, 'PAUSED', {
    fontSize: '36px', fontFamily: 'Arial', color: '#E8E0F0', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(31));
  const makeBtn = (y, label, color, cb) => {
    const btn = this.add.rectangle(w/2, y, 180, 50, color).setDepth(31).setInteractive({ useHandCursor: true });
    const txt = this.add.text(w/2, y, label, { fontSize: '20px', fontFamily: 'Arial', color: '#E8E0F0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', cb);
    txt.on('pointerdown', cb);
    this.pauseOverlayGroup.push(btn, txt);
  };
  makeBtn(h*0.40, 'Resume', COLORS.UI_ACCENT, () => gameClosePauseOverlay.call(this));
  makeBtn(h*0.50, 'How to Play', COLORS.CELL_STROKE, () => { gameClosePauseOverlay.call(this); this.scene.launch('HelpScene', { returnScene: 'GameScene' }); });
  makeBtn(h*0.60, 'Restart', COLORS.CELL_STROKE, () => { gameClosePauseOverlay.call(this); this.scene.restart(); });
  makeBtn(h*0.70, 'Quit to Menu', COLORS.CELL_STROKE, () => { gameClosePauseOverlay.call(this); this.scene.start('MenuScene'); });
}

function gameClosePauseOverlay() {
  if (this.pauseOverlayGroup) { this.pauseOverlayGroup.forEach(obj => obj.destroy()); this.pauseOverlayGroup = null; }
  this.resumeGame();
}

// Attach prototype methods to GameScene (stages.js + ui.js functions)
GameScene.prototype.spreadVoid = gameSpreadVoid;
GameScene.prototype.spawnVoidTile = gameSpawnVoidTile;
GameScene.prototype.executeCleanse = gameExecuteCleanse;
GameScene.prototype.checkStageAdvance = gameCheckStageAdvance;
GameScene.prototype.checkBoardState = gameCheckBoardState;
GameScene.prototype.triggerGameOver = gameTriggerGameOver;
GameScene.prototype.showGameOverOverlay = function(d) { gameShowGameOverOverlay.call(this, d); };
GameScene.prototype.showPauseOverlay = gameShowPauseOverlay;
GameScene.prototype.closePauseOverlay = function() { gameClosePauseOverlay.call(this); };
