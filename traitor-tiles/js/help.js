class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0A0E1A, 0.95);

    let y = 40;
    this.add.text(width / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5);

    y += 50;
    this.add.text(width / 2, y, 'Traitor Tiles', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0', fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 24;
    this.add.text(width / 2, y, 'Step on tiles that betray you.', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', fill: '#999'
    }).setOrigin(0.5);

    // Section 1: Tap to move
    y += 40;
    this.add.text(20, y, 'TAP TILES TO MOVE', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF', fontStyle: 'bold'
    });
    y += 28;
    const g = this.add.graphics();
    const ts = 44, gap = 3, ox = (width - 3 * (ts + gap)) / 2;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const tx = ox + c * (ts + gap), ty = y + r * (ts + gap);
        const isCenter = r === 1 && c === 1;
        const isAdj = (r === 1 || c === 1) && !(r === 1 && c === 1) && Math.abs(r - 1) + Math.abs(c - 1) === 1;
        g.fillStyle(isCenter ? CONFIG.COLORS.PLAYER : (isAdj ? 0x2E4A7A : CONFIG.COLORS.TILE_SAFE), 1);
        g.fillRoundedRect(tx, ty, ts, ts, 4);
        if (isAdj) {
          this.add.text(tx + ts / 2, ty + ts / 2, 'TAP', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0'
          }).setOrigin(0.5);
        }
      }
    }
    this.add.image(ox + 1 * (ts + gap) + ts / 2, y + 1 * (ts + gap) + ts / 2, 'player').setScale(0.6);

    y += 3 * (ts + gap) + 16;
    this.add.text(width / 2, y, 'Tap adjacent tiles to move your piece.', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#CCC'
    }).setOrigin(0.5);

    // Section 2: Reach the goal
    y += 36;
    this.add.text(20, y, 'REACH THE GOAL', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FFD700', fontStyle: 'bold'
    });
    y += 26;
    this.add.image(60, y + 14, 'goal').setScale(1.2);
    this.add.text(90, y, 'Gold star = destination.\nGoal moves toward you every 3s!', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#CCC', lineSpacing: 4
    });

    // Section 3: Avoid trail
    y += 54;
    this.add.text(20, y, 'AVOID YOUR OWN TRAIL', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FF2233', fontStyle: 'bold'
    });
    y += 26;
    g.fillStyle(CONFIG.COLORS.TILE_SAFE, 1);
    g.fillRoundedRect(40, y, 36, 36, 4);
    this.add.text(58, y + 18, 'Safe', { fontSize: '11px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0' }).setOrigin(0.5);
    g.fillStyle(CONFIG.COLORS.TILE_POISONED, 1);
    g.fillRoundedRect(90, y, 36, 36, 4);
    this.add.image(108, y + 18, 'skull').setScale(0.8);
    this.add.text(140, y + 8, 'Visited tiles turn red.\nStep on red = instant death!', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#CCC', lineSpacing: 4
    });

    // Section 4: Pre-poisoned
    y += 54;
    this.add.text(20, y, 'ORANGE TILES (STAGE 5+)', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#FF6600', fontStyle: 'bold'
    });
    y += 26;
    g.fillStyle(CONFIG.COLORS.TILE_PRE_POISON, 1);
    g.fillRoundedRect(40, y, 36, 36, 4);
    g.lineStyle(1.5, CONFIG.COLORS.TILE_PRE_POISON_BORDER);
    g.strokeRoundedRect(40, y, 36, 36, 4);
    this.add.text(90, y + 8, 'Already deadly before you move!', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#CCC'
    });

    // Tips
    y += 52;
    this.add.text(20, y, 'TIPS', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: '#00E5FF', fontStyle: 'bold'
    });
    y += 24;
    const tips = [
      'Always keep an escape route open',
      'Watch the goal timer (dots below grid)',
      'Bigger grids at later stages give more room'
    ];
    tips.forEach(tip => {
      this.add.text(30, y, '- ' + tip, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#AAA'
      });
      y += 22;
    });

    // Got it button
    const gotItY = Math.min(y + 30, height - 60);
    const gotItBg = this.add.rectangle(width / 2, gotItY, 200, 52, 0x000000, 0)
      .setStrokeStyle(2, 0x00CC44);
    this.add.text(width / 2, gotItY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fill: '#00CC44', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive().on('pointerup', () => this._dismiss());
    gotItBg.setInteractive({ useHandCursor: true }).on('pointerup', () => this._dismiss());

    // Full-screen fallback tap zone behind everything
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive().setDepth(-1).on('pointerup', () => {});
  }

  _dismiss() {
    this.scene.stop('HelpScene');
    this.scene.resume(this.returnTo);
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  init(data) { this.data_ = data; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0A0E1A, 0.8);

    this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
      fontSize: '32px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0', fontStyle: 'bold'
    }).setOrigin(0.5);

    const btns = [
      { text: 'Resume', y: -40, cb: () => { this.scene.stop('PauseScene'); this.scene.resume('GameScene'); this.scene.get('GameScene').isPaused = false; }},
      { text: 'Restart', y: 20, cb: () => { this.scene.stop('PauseScene'); this.scene.stop('GameScene'); this.scene.start('GameScene', { stage: 1, score: 0, streak: 0 }); }},
      { text: 'How to Play', y: 80, cb: () => { this.scene.stop('PauseScene'); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); }},
      { text: 'Menu', y: 140, cb: () => { this.scene.stop('PauseScene'); this.scene.stop('GameScene'); this.scene.start('MenuScene'); }}
    ];

    btns.forEach(b => {
      const bg = this.add.rectangle(width / 2, height / 2 + b.y, 220, 48, 0x000000, 0)
        .setStrokeStyle(1, 0x2E4A7A).setInteractive({ useHandCursor: true });
      this.add.text(width / 2, height / 2 + b.y, b.text, {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#E8EAF0'
      }).setOrigin(0.5).setInteractive().on('pointerup', b.cb);
      bg.on('pointerup', b.cb);
    });
  }
}
