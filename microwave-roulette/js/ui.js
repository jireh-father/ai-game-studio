// Microwave Roulette - UI Scenes (Menu, GameOver, Cookbook)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.CREAM);

    // Title
    this.add.text(w / 2, h * 0.12, 'MICROWAVE', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.TEAL,
      stroke: CONFIG.HEX.CHARCOAL, strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(w / 2, h * 0.18, 'ROULETTE', {
      fontSize: '42px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.ORANGE,
      stroke: CONFIG.HEX.CHARCOAL, strokeThickness: 3,
    }).setOrigin(0.5);

    // Mini microwave icon
    this.drawMicrowave(w / 2, h * 0.38, 0.7);

    // High score
    const hs = GameState.highScore;
    if (hs > 0) {
      this.add.text(w / 2, h * 0.56, `Best: ${hs}`, {
        fontSize: '18px', fontFamily: 'monospace', color: CONFIG.HEX.GOLD,
      }).setOrigin(0.5);
    }

    // Play button
    const btnY = h * 0.65;
    const btn = this.add.rectangle(w / 2, btnY, 180, 54, CONFIG.COLORS.GREEN, 1).setStrokeStyle(3, CONFIG.COLORS.CHARCOAL);
    btn.setInteractive({ useHandCursor: true });
    const btnText = this.add.text(w / 2, btnY, 'START', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.CHARCOAL,
    }).setOrigin(0.5);
    btnText.setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: [btn], scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    const startGame = () => {
      this.cameras.main.fade(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('GameScene'));
    };
    btn.on('pointerdown', startGame);
    btnText.on('pointerdown', startGame);

    // Cookbook button
    const cbY = h * 0.78;
    const cbBtn = this.add.rectangle(w / 2, cbY, 160, 40, CONFIG.COLORS.TEAL, 1).setStrokeStyle(2, CONFIG.COLORS.CHARCOAL);
    cbBtn.setInteractive({ useHandCursor: true });
    const cbText = this.add.text(w / 2, cbY, 'COOKBOOK', {
      fontSize: '18px', fontFamily: 'monospace', color: CONFIG.HEX.WHITE,
    }).setOrigin(0.5);
    cbText.setInteractive({ useHandCursor: true });
    const showCookbook = () => this.showCookbook();
    cbBtn.on('pointerdown', showCookbook);
    cbText.on('pointerdown', showCookbook);

    // Sound toggle
    const sndText = this.add.text(w - 16, 16, GameState.settings.sound ? '🔊' : '🔇', {
      fontSize: '24px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    sndText.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      GameState.save();
      sndText.setText(GameState.settings.sound ? '🔊' : '🔇');
    });

    this.cameras.main.fadeIn(300);
  }

  drawMicrowave(cx, cy, scale) {
    const g = this.add.graphics();
    const s = scale;
    // Body
    g.fillStyle(CONFIG.COLORS.TEAL, 1);
    g.fillRoundedRect(cx - 100 * s, cy - 70 * s, 200 * s, 140 * s, 12 * s);
    g.lineStyle(3, CONFIG.COLORS.CHARCOAL, 1);
    g.strokeRoundedRect(cx - 100 * s, cy - 70 * s, 200 * s, 140 * s, 12 * s);
    // Window
    g.fillStyle(CONFIG.COLORS.DARK_BLUE, 1);
    g.fillCircle(cx - 10 * s, cy, 50 * s);
    g.fillStyle(CONFIG.COLORS.MID_BLUE, 0.6);
    g.fillCircle(cx - 10 * s, cy, 42 * s);
    // Panel
    g.fillStyle(CONFIG.COLORS.PANEL, 1);
    g.fillRoundedRect(cx + 55 * s, cy - 60 * s, 35 * s, 120 * s, 3 * s);
    // Glowing dot on panel
    g.fillStyle(CONFIG.COLORS.GREEN, 1);
    g.fillCircle(cx + 72 * s, cy - 40 * s, 4 * s);
  }

  showCookbook() {
    if (this.cookbookOverlay) return;
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.container(0, 0);
    this.cookbookOverlay = overlay;

    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85);
    bg.setInteractive();
    overlay.add(bg);

    overlay.add(this.add.text(w / 2, 40, 'COOKBOOK', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.GOLD,
    }).setOrigin(0.5));

    const discovered = GameState.cookbook;
    const total = ITEM_DB.length;
    overlay.add(this.add.text(w / 2, 75, `${discovered.length}/${total} Discovered`, {
      fontSize: '14px', fontFamily: 'monospace', color: CONFIG.HEX.WHITE,
    }).setOrigin(0.5));

    let yy = 105;
    const cols = 3, cellW = (w - 40) / cols;
    ITEM_DB.forEach((item, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const ix = 30 + col * cellW, iy = yy + row * 50;
      if (iy > h - 60) return;
      const found = discovered.includes(item.name);
      const col2 = ITEM_COLORS[item.cat];
      const rect = this.add.rectangle(ix, iy, cellW - 8, 40, found ? col2.fill : 0x444444, found ? 0.8 : 0.3)
        .setOrigin(0, 0).setStrokeStyle(1, found ? col2.stroke : 0x666666);
      overlay.add(rect);
      overlay.add(this.add.text(ix + (cellW - 8) / 2, iy + 20, found ? item.name : '???', {
        fontSize: '9px', fontFamily: 'monospace', color: found ? '#FFFFFF' : '#888888',
        wordWrap: { width: cellW - 16 }, align: 'center',
      }).setOrigin(0.5));
    });

    // Close button
    const closeBtn = this.add.text(w / 2, h - 40, 'CLOSE', {
      fontSize: '20px', fontFamily: 'monospace', color: CONFIG.HEX.GREEN,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    overlay.add(closeBtn);
    closeBtn.on('pointerdown', () => { overlay.destroy(); this.cookbookOverlay = null; });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(0x1A1A2E);
    const { score, stage, combo, itemsCooked } = data;

    AdManager.onGameOver();

    const isHigh = score > GameState.highScore;
    if (isHigh) { GameState.highScore = score; }
    if (stage > GameState.highestStage) GameState.highestStage = stage;
    GameState.gamesPlayed++;
    GameState.save();

    const header = stage >= 20 ? 'MASTER CHEF!' : 'KITCHEN DISASTER!';
    this.add.text(w / 2, h * 0.08, header, {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold',
      color: stage >= 20 ? CONFIG.HEX.GOLD : CONFIG.HEX.RED,
    }).setOrigin(0.5);

    if (isHigh) {
      this.add.text(w / 2, h * 0.14, 'NEW HIGH SCORE!', {
        fontSize: '16px', fontFamily: 'monospace', color: CONFIG.HEX.GOLD,
      }).setOrigin(0.5);
    }

    const scoreTxt = this.add.text(w / 2, h * 0.25, '0', {
      fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.WHITE,
    }).setOrigin(0.5);

    // Count-up animation
    this.tweens.addCounter({
      from: 0, to: score, duration: 1200, ease: 'Cubic.easeOut',
      onUpdate: (t) => { scoreTxt.setText(Math.floor(t.getValue()).toString()); },
    });

    this.add.text(w / 2, h * 0.35, `Stage ${stage}  |  ${itemsCooked !== undefined ? itemsCooked : 0} items cooked`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#AAAAAA',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.40, `Best combo: x${combo || 0}`, {
      fontSize: '13px', fontFamily: 'monospace', color: CONFIG.HEX.ORANGE,
    }).setOrigin(0.5);

    // Play Again
    let btnY = h * 0.55;
    this.createButton(w / 2, btnY, 'PLAY AGAIN', CONFIG.COLORS.GREEN, () => {
      this.scene.start('GameScene');
    });

    // Menu
    this.createButton(w / 2, btnY + 60, 'MENU', CONFIG.COLORS.TEAL, () => {
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(300);
  }

  createButton(x, y, label, color, callback) {
    const btn = this.add.rectangle(x, y, 180, 46, color, 1).setStrokeStyle(2, CONFIG.COLORS.CHARCOAL);
    btn.setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: CONFIG.HEX.CHARCOAL,
    }).setOrigin(0.5);
    txt.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);
    txt.on('pointerdown', callback);
  }
}
