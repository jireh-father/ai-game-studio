// Number Baseball - Menu, GameOver, Help scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    Effects.initAudio();
    GameState.loadBest();
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);

    // Decorative grid
    const grid = this.add.graphics().setAlpha(0.1);
    grid.lineStyle(1, PALETTE.border);
    for (let i = 0; i < GAME_WIDTH; i += 40) grid.lineBetween(i, 0, i, GAME_HEIGHT);
    for (let j = 0; j < GAME_HEIGHT; j += 40) grid.lineBetween(0, j, GAME_WIDTH, j);

    // Title
    this.add.text(GAME_WIDTH/2, 130, '⚾', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 220, 'NUMBER', {
      fontSize: '44px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 270, 'BASEBALL', {
      fontSize: '44px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.accent
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 320, 'Crack the secret code', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.dim
    }).setOrigin(0.5);

    // Best
    if (GameState.bestScore > 0) {
      this.add.text(GAME_WIDTH/2, 370, 'BEST: ' + GameState.bestScore + '  •  STAGE ' + GameState.bestStage, {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.gold
      }).setOrigin(0.5);
    }

    // Play button
    const playBg = this.add.rectangle(GAME_WIDTH/2, 460, 220, 64, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 460, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => { Effects.tap(); this.scene.start('GameScene'); });

    // Help button
    const helpBg = this.add.rectangle(GAME_WIDTH/2, 545, 220, 48, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 545, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.text
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => { Effects.tap(); this.scene.start('HelpScene', { from: 'MenuScene' }); });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.data = data || {}; }
  create() {
    GameState.saveBest();
    const isNewBest = this.data.isNewBest;
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg, 0.97);

    const title = this.data.reason === 'win' ? 'STAGE CLEAR!' : 'GAME OVER';
    const titleColor = this.data.reason === 'win' ? COLORS_HEX.success : COLORS_HEX.danger;
    this.add.text(GAME_WIDTH/2, 140, title, {
      fontSize: '36px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: titleColor
    }).setOrigin(0.5);

    if (this.data.reason && this.data.reason !== 'win') {
      const reasonText = this.data.reason === 'timeout' ? 'Time ran out' :
                         this.data.reason === 'attempts' ? 'Out of attempts' :
                         this.data.reason === 'idle' ? 'Inactivity' : '';
      this.add.text(GAME_WIDTH/2, 185, reasonText, {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.dim
      }).setOrigin(0.5);
      // Show secret answer
      if (this.data.secret) {
        this.add.text(GAME_WIDTH/2, 215, 'Answer: ' + this.data.secret.join(' '), {
          fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.gold
        }).setOrigin(0.5);
      }
    }

    if (isNewBest) {
      this.add.text(GAME_WIDTH/2, 250, '🏆 NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.gold
      }).setOrigin(0.5);
    }

    // Stats panel
    const py = 300;
    this.add.rectangle(GAME_WIDTH/2, py + 70, 320, 160, PALETTE.panel).setStrokeStyle(2, PALETTE.border);
    this.add.text(GAME_WIDTH/2, py + 10, 'SCORE', { fontSize: '14px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, py + 38, String(GameState.score), { fontSize: '40px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.text }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 - 70, py + 90, 'STAGE', { fontSize: '12px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 - 70, py + 112, String(GameState.stage), { fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.accent }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 + 70, py + 90, 'GUESSES', { fontSize: '12px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 + 70, py + 112, String(GameState.totalGuesses), { fontSize: '24px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.accent }).setOrigin(0.5);

    // Buttons
    const bw = 220;
    const playAgainBg = this.add.rectangle(GAME_WIDTH/2, 530, bw, 56, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 530, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    playAgainBg.on('pointerdown', () => { Effects.tap(); GameState.reset(); this.scene.start('GameScene'); });

    const menuBg = this.add.rectangle(GAME_WIDTH/2, 605, bw, 48, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 605, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.text
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => { Effects.tap(); GameState.reset(); this.scene.start('MenuScene'); });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.from = (data && data.from) || 'MenuScene'; }
  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);
    this.add.text(GAME_WIDTH/2, 60, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.accent
    }).setOrigin(0.5);

    const lines = [
      { t: 'GOAL', c: COLORS_HEX.gold, s: 18 },
      { t: 'Crack the secret N-digit code', c: COLORS_HEX.text, s: 14 },
      { t: '(no repeated digits)', c: COLORS_HEX.dim, s: 12 },
      { t: '', c: '', s: 10 },
      { t: 'STRIKE = right digit, right spot', c: COLORS_HEX.strike, s: 14 },
      { t: 'BALL = right digit, wrong spot', c: COLORS_HEX.ball, s: 14 },
      { t: 'OUT = no digits match', c: COLORS_HEX.dim, s: 14 },
      { t: '', c: '', s: 10 },
      { t: 'Example: secret = 1 2 3', c: COLORS_HEX.text, s: 13 },
      { t: 'Guess 4 1 2 → 0S 2B', c: COLORS_HEX.text, s: 13 },
      { t: 'Guess 1 3 2 → 1S 2B', c: COLORS_HEX.text, s: 13 },
      { t: 'Guess 1 2 3 → WIN!', c: COLORS_HEX.success, s: 13 },
      { t: '', c: '', s: 10 },
      { t: 'INFINITE STAGES', c: COLORS_HEX.gold, s: 16 },
      { t: 'Higher stage = more digits,', c: COLORS_HEX.text, s: 13 },
      { t: 'fewer attempts, less time.', c: COLORS_HEX.text, s: 13 },
      { t: 'Faster + fewer guesses = bonus.', c: COLORS_HEX.dim, s: 12 },
    ];
    let y = 110;
    lines.forEach(l => {
      if (l.t) this.add.text(GAME_WIDTH/2, y, l.t, { fontSize: l.s + 'px', fontFamily: 'Arial, sans-serif', color: l.c }).setOrigin(0.5);
      y += l.s + 8;
    });

    const okBg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT - 60, 200, 56, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 60, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    okBg.on('pointerdown', () => { Effects.tap(); this.scene.start(this.from); });
  }
}
