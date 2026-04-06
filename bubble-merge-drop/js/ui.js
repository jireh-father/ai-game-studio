// ui.js — MenuScene, GameOverScene, HelpScene
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);
    this.add.text(W / 2, H * 0.22, 'BUBBLE\nMERGE DROP', {
      fontSize: '36px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      align: 'center', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    // Decorative bubbles
    const deco = [[80, 140, 0xFF4757, 18], [280, 160, 0x1E90FF, 14], [160, 130, 0x2ED573, 10], [60, 300, 0xFFA502, 12], [300, 320, 0xA855F7, 16]];
    deco.forEach(([x, y, c, r]) => {
      const g = this.add.graphics(); g.fillStyle(c, 0.4); g.fillCircle(x, y, r);
    });
    const highScore = localStorage.getItem('bubble-merge-drop_high_score') || 0;
    this.add.text(W / 2, H * 0.42, 'BEST: ' + highScore, {
      fontSize: '18px', fill: '#FFD700', fontFamily: 'Arial'
    }).setOrigin(0.5);
    // Play button
    const playBtn = this.add.rectangle(W / 2, H * 0.55, 200, 60, 0x2ED573, 1).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * 0.55, 'PLAY', {
      fontSize: '28px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1).disableInteractive();
    playBtn.on('pointerdown', () => {
      Effects.playClick();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });
    // Help button
    const helpBtn = this.add.rectangle(W - 32, 32, 44, 44, 0x57606F, 0.8).setInteractive({ useHandCursor: true });
    this.add.text(W - 32, 32, '?', {
      fontSize: '24px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).disableInteractive();
    helpBtn.on('pointerdown', () => {
      Effects.playClick();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) {
    this.finalScore = data.score || 0;
    this.level = data.level || 1;
    this.isHighScore = data.isHighScore || false;
  }
  create() {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0);
    this.add.text(W / 2, H * 0.18, 'GAME OVER', {
      fontSize: '32px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#FF4757', strokeThickness: 2
    }).setOrigin(0.5);
    // Animated score count-up
    const scoreTxt = this.add.text(W / 2, H * 0.32, '0', {
      fontSize: '48px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.finalScore, duration: 800, ease: 'Power2',
      onUpdate: (t) => { scoreTxt.setText(Math.floor(t.getValue()).toLocaleString()); }
    });
    if (this.isHighScore) {
      const newBest = this.add.text(W / 2, H * 0.42, 'NEW BEST!', {
        fontSize: '22px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, scaleX: 1.1, scaleY: 1.1, duration: 600, yoyo: true, repeat: -1 });
      Effects.playHighScore();
    } else {
      const hs = localStorage.getItem('bubble-merge-drop_high_score') || 0;
      this.add.text(W / 2, H * 0.42, 'BEST: ' + hs, {
        fontSize: '18px', fill: '#AAAAAA', fontFamily: 'Arial'
      }).setOrigin(0.5);
    }
    this.add.text(W / 2, H * 0.50, 'Level ' + this.level, {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial'
    }).setOrigin(0.5);
    // Play Again button (appears after 800ms)
    this.time.delayedCall(800, () => {
      const playBtn = this.add.rectangle(W / 2, H * 0.65, 200, 60, 0x2ED573, 1).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, H * 0.65, 'PLAY AGAIN', {
        fontSize: '24px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).disableInteractive();
      playBtn.on('pointerdown', () => {
        Effects.playClick();
        this.scene.stop('GameOverScene');
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
      });
      const menuBtn = this.add.rectangle(W / 2, H * 0.76, 160, 44, 0x57606F, 1).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, H * 0.76, 'MENU', {
        fontSize: '20px', fill: '#FFF', fontFamily: 'Arial'
      }).setOrigin(0.5).disableInteractive();
      menuBtn.on('pointerdown', () => {
        Effects.playClick();
        this.scene.stop('GameOverScene');
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      });
    });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }
  create() {
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E, 0.95).setDepth(0);
    let y = 30;
    const addTitle = (text) => {
      this.add.text(W / 2, y, text, { fontSize: '22px', fill: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
      y += 30;
    };
    const addText = (text, size) => {
      this.add.text(W / 2, y, text, { fontSize: (size || 14) + 'px', fill: '#FFF', fontFamily: 'Arial', wordWrap: { width: W - 40 }, align: 'center' }).setOrigin(0.5, 0);
      y += (size || 14) * 2.2;
    };
    addTitle('HOW TO PLAY');
    // Control diagram
    const g = this.add.graphics();
    g.lineStyle(2, 0xFFFFFF, 0.6);
    g.lineBetween(60, y + 10, 300, y + 10); // drag line
    g.fillStyle(0xFF4757, 0.9); g.fillCircle(180, y + 10, 14); // bubble on rail
    g.lineStyle(2, 0xFFD700, 0.8);
    g.lineBetween(100, y + 10, 140, y + 10); // left arrow
    g.lineBetween(100, y + 10, 108, y + 4);
    g.lineBetween(220, y + 10, 260, y + 10); // right arrow
    g.lineBetween(260, y + 10, 252, y + 4);
    // Drop arrow
    g.lineStyle(2, 0xFFFFFF, 0.5);
    g.lineBetween(180, y + 24, 180, y + 55);
    g.lineBetween(180, y + 55, 174, y + 47);
    g.lineBetween(180, y + 55, 186, y + 47);
    y += 65;
    addText('Drag left/right to aim\nRelease to DROP', 14);
    y += 10;
    addTitle('MERGING');
    // Merge diagram
    const mg = this.add.graphics();
    mg.fillStyle(0x1E90FF, 0.9); mg.fillCircle(130, y + 8, 12); mg.fillCircle(170, y + 8, 12);
    this.add.text(195, y + 1, '=', { fontSize: '18px', fill: '#FFF', fontFamily: 'Arial' });
    mg.fillStyle(0x1E90FF, 0.9); mg.fillCircle(230, y + 8, 18);
    y += 30;
    addText('Same color + touching = MERGE!\nChain merges = BIG score!', 13);
    y += 10;
    addTitle('SPECIAL BUBBLES');
    addText('BOMB - merges and EXPLODES\n(clears nearby bubbles)', 13);
    addText('RAINBOW - matches ANY color', 13);
    y += 5;
    addTitle('DANGER');
    const dg = this.add.graphics();
    dg.lineStyle(2, 0xFF4757, 0.8);
    for (let dx = 30; dx < W - 30; dx += 20) {
      dg.lineBetween(dx, y + 5, dx + 10, y + 5);
    }
    y += 15;
    addText('Overflow above line = GAME OVER\nFloor rises over time!', 13);
    y += 10;
    addTitle('TIPS');
    addText('Chain merges multiply score\nUse bombs when container is full\nRainbow bubbles save bad spots', 13);
    // Got it button - fixed near bottom
    const btnY = H - 60;
    const gotIt = this.add.rectangle(W / 2, btnY, 200, 50, 0x2ED573, 1).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, btnY, 'Got it!', {
      fontSize: '22px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).disableInteractive();
    gotIt.on('pointerdown', () => {
      Effects.playClick();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });
    // Full-screen fallback tap zone behind everything
    const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0).setInteractive().setDepth(9);
    fallback.on('pointerdown', () => gotIt.emit('pointerdown'));
  }
}
