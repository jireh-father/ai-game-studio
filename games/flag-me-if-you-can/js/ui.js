// ui.js - Menu, GameOver, Pause
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, CONFIG.COLORS.BG);
    // Title
    const title = this.add.text(w/2, 90, 'FLAG ME\nIF YOU CAN', { fontSize: '38px', color: '#FF2222', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
    this.add.text(w/2, 180, 'You ARE the mine', { fontSize: '16px', color: '#F0F0F0' }).setOrigin(0.5);

    // storyboard demo - small grid with mine hopping
    this.createStoryboardDemo(w/2, 290);

    // High score
    const hs = (window.GameState && GameState.highScore) || 0;
    this.add.text(w/2, 420, `HIGH SCORE: ${hs}`, { fontSize: '18px', color: '#00FF88' }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(w/2, 490, 200, 60, 0xFF2222).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 490, 'PLAY', { fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Effects.playClick();
      GameState.score = 0;
      GameState.stage = 1;
      GameState.lives = CONFIG.LIVES;
      AdsManager.init();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.circle(w - 40, 40, 22, 0x4488FF).setInteractive({ useHandCursor: true });
    this.add.text(w - 40, 40, '?', { fontSize: '26px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
    helpBtn.on('pointerdown', () => {
      Effects.playClick();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const sfxOn = () => (GameState.settings.sfx ? 'SOUND: ON' : 'SOUND: OFF');
    const sndLabel = this.add.text(40, 40, sfxOn(), { fontSize: '14px', color: '#F0F0F0' }).setOrigin(0, 0.5);
    sndLabel.setInteractive({ useHandCursor: true });
    sndLabel.on('pointerdown', () => {
      GameState.settings.sfx = !GameState.settings.sfx;
      sndLabel.setText(sfxOn());
      try { localStorage.setItem('fmifyc_settings', JSON.stringify(GameState.settings)); } catch (e) {}
    });

    this.add.text(w/2, 580, 'TAP adjacent cells to hop\nCorrupt numbers to confuse AI', { fontSize: '14px', color: '#888888', align: 'center' }).setOrigin(0.5);
  }
  createStoryboardDemo(cx, cy) {
    // Small 4x3 grid demo
    const cellSize = 32, cols = 4, rows = 3;
    const ox = cx - (cols * cellSize) / 2, oy = cy - (rows * cellSize) / 2;
    const cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const r = this.add.rectangle(ox + x * cellSize + cellSize/2, oy + y * cellSize + cellSize/2, cellSize - 2, cellSize - 2, 0xE8E8E8);
        r.setStrokeStyle(1, 0x888888);
        cells.push(r);
      }
    }
    // Numbers
    const n1 = this.add.text(ox + 0.5 * cellSize, oy + 0.5 * cellSize, '2', { fontSize: '16px', color: '#007B00', fontStyle: 'bold' }).setOrigin(0.5);
    const n2 = this.add.text(ox + 1.5 * cellSize, oy + 0.5 * cellSize, '1', { fontSize: '16px', color: '#0000FF', fontStyle: 'bold' }).setOrigin(0.5);
    // Mine
    const mine = this.add.image(ox + 2.5 * cellSize, oy + 1.5 * cellSize, 'mine').setScale(0.55);
    // AI wave
    const wave = this.add.rectangle(ox + 0.5 * cellSize, oy + 1.5 * cellSize, cellSize - 2, cellSize - 2, 0x4488FF, 0.4);
    // Looping demo: mine hops, number corrupts
    const demoLoop = () => {
      mine.setPosition(ox + 2.5 * cellSize, oy + 1.5 * cellSize);
      n1.setText('2'); n1.setColor('#007B00');
      n2.setText('1'); n2.setColor('#0000FF');
      this.tweens.add({
        targets: mine,
        x: ox + 1.5 * cellSize,
        duration: 400,
        delay: 600,
        onComplete: () => {
          n2.setText('2'); n2.setColor('#FF6600');
        }
      });
      this.tweens.add({
        targets: mine,
        x: ox + 0.5 * cellSize,
        duration: 400,
        delay: 1400,
        onComplete: () => {
          n1.setText('3'); n1.setColor('#FF6600');
        }
      });
    };
    demoLoop();
    this.time.addEvent({ delay: 2600, loop: true, callback: demoLoop });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.stageReached = data.stage || 1; this.corrupted = data.corrupted || 0; this.caused = data.caused || 'flagged'; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, CONFIG.COLORS.BG, 0.95);
    const title = this.add.text(w/2, 150, this.caused === 'idle' ? 'TOO SLOW!' : 'FLAGGED!', { fontSize: '44px', color: '#FF2222', fontStyle: 'bold' }).setOrigin(0.5);
    Effects.scalePunch(title, 1.2, 400);

    const newHigh = this.finalScore > (GameState.highScore || 0);
    if (newHigh) {
      GameState.highScore = this.finalScore;
      try { localStorage.setItem('fmifyc_highscore', String(this.finalScore)); } catch (e) {}
      this.add.text(w/2, 210, 'NEW HIGH SCORE!', { fontSize: '20px', color: '#FFDD00', fontStyle: 'bold' }).setOrigin(0.5);
    }

    this.add.text(w/2, 270, `SCORE: ${this.finalScore}`, { fontSize: '28px', color: '#F0F0F0' }).setOrigin(0.5);
    this.add.text(w/2, 310, `STAGE: ${this.stageReached}`, { fontSize: '20px', color: '#F0F0F0' }).setOrigin(0.5);
    this.add.text(w/2, 340, `Confused the AI ${this.corrupted} times`, { fontSize: '14px', color: '#00FF88' }).setOrigin(0.5);

    // Ad life
    if (!AdsManager.lifeAdUsed && this.caused !== 'idle') {
      const adBtn = this.add.rectangle(w/2, 410, 240, 50, 0x00FF88).setInteractive({ useHandCursor: true });
      this.add.text(w/2, 410, 'WATCH AD: +1 LIFE', { fontSize: '18px', color: '#0D0D1F', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
      adBtn.on('pointerdown', () => {
        Effects.playClick();
        AdsManager.lifeAdUsed = true;
        AdsManager.showRewarded('life', () => {
          GameState.lives = 1;
          this.scene.start('GameScene');
        });
      });
    }

    const playBtn = this.add.rectangle(w/2, 480, 200, 60, 0xFF2222).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 480, 'PLAY AGAIN', { fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
    playBtn.on('pointerdown', () => {
      Effects.playClick();
      GameState.score = 0; GameState.stage = 1; GameState.lives = CONFIG.LIVES;
      AdsManager.init();
      this.scene.start('GameScene');
    });
    const menuBtn = this.add.rectangle(w/2, 560, 160, 40, 0x444466).setInteractive({ useHandCursor: true });
    this.add.text(w/2, 560, 'MENU', { fontSize: '16px', color: '#F0F0F0' }).setOrigin(0.5).disableInteractive();
    menuBtn.on('pointerdown', () => {
      Effects.playClick();
      this.scene.start('MenuScene');
    });
  }
}
