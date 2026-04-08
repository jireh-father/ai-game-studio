// Number Baseball Pro - Menu, GameOver, Help, PowerupSelect scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    Effects.initAudio();
    GameState.loadBest();
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);

    const grid = this.add.graphics().setAlpha(0.1);
    grid.lineStyle(1, PALETTE.border);
    for (let i = 0; i < GAME_WIDTH; i += 40) grid.lineBetween(i, 0, i, GAME_HEIGHT);
    for (let j = 0; j < GAME_HEIGHT; j += 40) grid.lineBetween(0, j, GAME_WIDTH, j);

    this.add.text(GAME_WIDTH/2, 120, '\u26be', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 210, 'NUMBER', {
      fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 258, 'BASEBALL', {
      fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 300, 'PRO', {
      fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.gold
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 334, 'Powerups \u2022 Special Stages \u2022 Combos', {
      fontSize: '13px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5);

    if (GameState.bestScore > 0) {
      this.add.text(GAME_WIDTH/2, 372, 'BEST: ' + GameState.bestScore + '  \u2022  STAGE ' + GameState.bestStage, {
        fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.gold
      }).setOrigin(0.5);
    }

    const playBg = this.add.rectangle(GAME_WIDTH/2, 455, 220, 64, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 455, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    playBg.on('pointerdown', () => {
      Effects.tap();
      GameState.reset();
      this.scene.start('GameScene');
    });

    const helpBg = this.add.rectangle(GAME_WIDTH/2, 540, 220, 48, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 540, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.text
    }).setOrigin(0.5);
    helpBg.on('pointerdown', () => { Effects.tap(); this.scene.start('HelpScene', { from: 'MenuScene' }); });

    // Special stage legend
    const legY = 610;
    this.add.text(GAME_WIDTH/2, legY, 'SPECIAL STAGES', { fontSize: '11px', fontFamily: 'Arial', color: COLORS_HEX.dim }).setOrigin(0.5);
    const legend = [
      { t: 'SPEED', c: COLORS_HEX.speed },
      { t: 'FORBIDDEN', c: COLORS_HEX.forbidden },
      { t: 'AMNESIA', c: COLORS_HEX.amnesia },
      { t: 'LIAR', c: COLORS_HEX.liar },
      { t: 'BOSS', c: COLORS_HEX.boss },
    ];
    let lx = 30;
    legend.forEach(l => {
      const tt = this.add.text(lx, legY + 20, l.t, { fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: l.c });
      lx += tt.width + 10;
    });
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
    this.add.text(GAME_WIDTH/2, 130, title, {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: titleColor
    }).setOrigin(0.5);

    if (this.data.reason && this.data.reason !== 'win') {
      const reasonText = this.data.reason === 'timeout' ? 'Time ran out' :
                         this.data.reason === 'attempts' ? 'Out of attempts' :
                         this.data.reason === 'idle' ? 'Inactivity' : '';
      this.add.text(GAME_WIDTH/2, 175, reasonText, {
        fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.dim
      }).setOrigin(0.5);
      if (this.data.secret) {
        this.add.text(GAME_WIDTH/2, 210, 'Answer: ' + this.data.secret.join(' '), {
          fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.gold
        }).setOrigin(0.5);
      }
    }

    if (isNewBest) {
      this.add.text(GAME_WIDTH/2, 248, '\ud83c\udfc6 NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.gold
      }).setOrigin(0.5);
    }

    const py = 300;
    this.add.rectangle(GAME_WIDTH/2, py + 70, 320, 160, PALETTE.panel).setStrokeStyle(2, PALETTE.border);
    this.add.text(GAME_WIDTH/2, py + 10, 'SCORE', { fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, py + 38, String(GameState.score), { fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 - 70, py + 90, 'STAGE', { fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 - 70, py + 112, String(GameState.stage), { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 + 70, py + 90, 'GUESSES', { fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.dim }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2 + 70, py + 112, String(GameState.totalGuesses), { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent }).setOrigin(0.5);

    const bw = 220;
    const playAgainBg = this.add.rectangle(GAME_WIDTH/2, 530, bw, 56, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 530, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    playAgainBg.on('pointerdown', () => { Effects.tap(); GameState.reset(); this.scene.start('GameScene'); });

    const menuBg = this.add.rectangle(GAME_WIDTH/2, 605, bw, 48, PALETTE.panel)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, 605, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.text
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => { Effects.tap(); GameState.reset(); this.scene.start('MenuScene'); });
  }
}

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.from = (data && data.from) || 'MenuScene'; }
  create() {
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);
    this.add.text(GAME_WIDTH/2, 50, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.accent
    }).setOrigin(0.5);

    const lines = [
      { t: 'Crack the secret N-digit code', c: COLORS_HEX.text, s: 14 },
      { t: '(no repeated digits)', c: COLORS_HEX.dim, s: 11 },
      { t: '', s: 6 },
      { t: 'STRIKE = right digit & position', c: COLORS_HEX.strike, s: 13 },
      { t: 'BALL = right digit, wrong spot', c: COLORS_HEX.ball, s: 13 },
      { t: 'MISS = digit not in secret', c: COLORS_HEX.miss, s: 13 },
      { t: '', s: 6 },
      { t: 'TEMPERATURE (digit-sum distance)', c: COLORS_HEX.gold, s: 12 },
      { t: 'BURNING / WARM / COOL / FREEZING', c: COLORS_HEX.text, s: 11 },
      { t: '', s: 6 },
      { t: 'POWER-UPS — pick 1 after each win', c: COLORS_HEX.gold, s: 12 },
      { t: 'X-RAY: see Strike/Ball position next guess', c: COLORS_HEX.accent, s: 10 },
      { t: 'REVEAL \u2022 TIME+ \u2022 GHOST \u2022 BOOST', c: COLORS_HEX.text, s: 10 },
      { t: '', s: 6 },
      { t: 'SPECIAL STAGES', c: COLORS_HEX.gold, s: 12 },
      { t: 'SPEED \u2022 FORBIDDEN \u2022 AMNESIA', c: COLORS_HEX.text, s: 11 },
      { t: 'LIAR \u2022 BOSS CIPHER', c: COLORS_HEX.text, s: 11 },
      { t: '', s: 6 },
      { t: 'Don\'t idle - you lose if 30s pass', c: COLORS_HEX.danger, s: 11 },
    ];
    let y = 95;
    lines.forEach(l => {
      if (l.t) this.add.text(GAME_WIDTH/2, y, l.t, { fontSize: l.s + 'px', fontFamily: 'Arial', color: l.c }).setOrigin(0.5);
      y += l.s + 8;
    });

    const okBg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT - 60, 200, 56, PALETTE.accent)
      .setStrokeStyle(3, PALETTE.text).setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 60, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.text
    }).setOrigin(0.5);
    okBg.on('pointerdown', () => { Effects.tap(); this.scene.start(this.from); });
  }
}

class PowerupSelectScene extends Phaser.Scene {
  constructor() { super('PowerupSelectScene'); }
  create() {
    this.picked = false;
    this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg);
    this.add.text(GAME_WIDTH/2, 120, 'STAGE CLEAR!', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.success
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, 170, 'Choose a power-up', {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.dim
    }).setOrigin(0.5);

    const picks = pickTwoPowerups();
    const cardY = [290, 470];
    picks.forEach((key, i) => {
      const p = POWERUPS[key];
      const y = cardY[i];
      const bg = this.add.rectangle(GAME_WIDTH/2, y, 300, 150, PALETTE.panel)
        .setStrokeStyle(3, PALETTE.accent).setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH/2, y - 45, p.icon, { fontSize: '40px' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH/2, y + 5, p.name, {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_HEX.gold
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH/2, y + 40, p.desc, {
        fontSize: '12px', fontFamily: 'Arial', color: COLORS_HEX.dim, wordWrap: { width: 280 }, align: 'center'
      }).setOrigin(0.5);
      // entry animation
      bg.setScale(0.8); bg.setAlpha(0);
      this.tweens.add({ targets: bg, scale: 1, alpha: 1, duration: 300, delay: 200 + i * 150, ease: 'Back.easeOut' });

      bg.on('pointerdown', () => {
        if (this.picked) return;
        this.picked = true;
        Effects.powerup();
        GameState.powerups.push(key);
        this.tweens.add({
          targets: bg, scale: 1.15, duration: 120, yoyo: true,
          onComplete: () => this.scene.start('GameScene')
        });
      });
    });
  }
}
