// Wrong Map - UI Scenes (Menu, Death, HUD)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.add.text(W / 2, 120, 'WRONG MAP', { fontSize: '48px', fontStyle: 'bold', color: CONFIG.HEX.PLAYER }).setOrigin(0.5);
    this.add.text(W / 2, 170, 'The map is always wrong.\nFind the lie.', { fontSize: '16px', color: CONFIG.HEX.HUD_TEXT, align: 'center' }).setOrigin(0.5);
    const playBtn = this.add.rectangle(W / 2, 280, 200, 60, CONFIG.COLORS.PLAYER).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 280, 'PLAY', { fontSize: '24px', fontStyle: 'bold', color: CONFIG.HEX.BG }).setOrigin(0.5).setDepth(1);
    playBtn.on('pointerdown', () => { GameState.reset(); this.scene.stop('MenuScene'); this.scene.start('GameScene'); });
    const helpBtn = this.add.rectangle(W / 2, 360, 200, 50, 0x000000, 0).setStrokeStyle(2, CONFIG.COLORS.PLAYER).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 360, 'HOW TO PLAY', { fontSize: '18px', color: CONFIG.HEX.PLAYER }).setOrigin(0.5).setDepth(1);
    helpBtn.on('pointerdown', () => { this.scene.pause('MenuScene'); this.scene.launch('HelpScene', { returnTo: 'MenuScene' }); });
    const qBtn = this.add.rectangle(W - 30, 30, 44, 44, 0x1E3A5F).setInteractive({ useHandCursor: true });
    this.add.text(W - 30, 30, '?', { fontSize: '24px', color: CONFIG.HEX.PLAYER }).setOrigin(0.5).setDepth(1);
    qBtn.on('pointerdown', () => { this.scene.pause('MenuScene'); this.scene.launch('HelpScene', { returnTo: 'MenuScene' }); });
    this.add.text(W / 2, H - 60, 'BEST: ' + GameState.highScore, { fontSize: '18px', color: CONFIG.HEX.GOLD }).setOrigin(0.5);
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }
  create() {
    const W = CONFIG.GAME_WIDTH;
    this.scoreTxt = this.add.text(90, 12, 'Score: ' + GameState.score, { fontSize: '14px', color: CONFIG.HEX.HUD_TEXT });
    this.roomTxt = this.add.text(W / 2, 12, 'Room ' + GameState.room, { fontSize: '14px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5, 0);
    this.streakTxt = this.add.text(W / 2 + 60, 12, '', { fontSize: '14px', fontStyle: 'bold', color: CONFIG.HEX.GOLD });
    this.updateStreak();
    const pauseBtn = this.add.rectangle(25, 20, 40, 30, 0x1E3A5F, 0.8).setInteractive({ useHandCursor: true }).setDepth(5);
    this.add.text(25, 20, '||', { fontSize: '16px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5).setDepth(6);
    pauseBtn.on('pointerdown', () => { const gs = this.scene.get('GameScene'); if (gs && !gs.gameOver) gs.togglePause(); });
    this.minimapGfx = this.add.graphics();
    this.drawMinimap({ x: 0, y: CONFIG.GRID_SIZE - 1 }, { x: 0, y: CONFIG.GRID_SIZE - 1 });
    this.ghostBarBg = this.add.rectangle(W / 2, CONFIG.GAME_HEIGHT - 150, W - 40, 8, 0x333333, 0.5);
    this.ghostBar = this.add.rectangle(W / 2, CONFIG.GAME_HEIGHT - 150, W - 40, 8, CONFIG.COLORS.DANGER, 0).setDepth(1);
    this.pauseOverlay = null;
    this.events.on('refreshHUD', this.refreshHUD, this);
    this.events.on('updateMinimap', this.drawMinimap, this);
    this.events.on('updateGhostBar', this.updateGhostBar, this);
    this.events.on('streakPunch', this.punchStreak, this);
    this.events.on('scorePunch', this.punchScore, this);
    this.events.on('showPause', this.showPauseOverlay, this);
  }
  refreshHUD() {
    this.scoreTxt.setText('Score: ' + GameState.score);
    this.roomTxt.setText('Room ' + GameState.room);
    this.updateStreak();
    this.drawMinimap({ x: 0, y: CONFIG.GRID_SIZE - 1 }, { x: 0, y: CONFIG.GRID_SIZE - 1 });
    this.ghostBar.setFillStyle(CONFIG.COLORS.DANGER, 0);
  }
  updateStreak() {
    this.streakTxt.setText(GameState.streak > 1 ? 'x' + Math.min(GameState.streak, CONFIG.SCORE.STREAK_MAX) : '');
  }
  drawMinimap(playerTile, ghostTile) {
    this.minimapGfx.clear();
    const gs = this.scene.get('GameScene');
    if (!gs || !gs.roomData) return;
    // CRITICAL: render display_grid (with lie), NOT true_grid
    const grid = gs.roomData.display_grid;
    const G = CONFIG.GRID_SIZE, ts = CONFIG.MINIMAP_TILE(GameState.room), gap = 2;
    const mapW = G * (ts + gap), mx = CONFIG.GAME_WIDTH - mapW - 8, my = 38;
    this.minimapGfx.fillStyle(CONFIG.COLORS.MINIMAP_BG, 0.9);
    this.minimapGfx.fillRoundedRect(mx - 4, my - 4, mapW + 8, mapW + 8, 4);
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        this.minimapGfx.fillStyle(grid[y][x] === 1 ? CONFIG.COLORS.MINIMAP_WALL : CONFIG.COLORS.MINIMAP_FLOOR);
        this.minimapGfx.fillRect(mx + x * (ts + gap), my + y * (ts + gap), ts, ts);
      }
    }
    if (playerTile) {
      this.minimapGfx.fillStyle(CONFIG.COLORS.PLAYER);
      this.minimapGfx.fillCircle(mx + playerTile.x * (ts + gap) + ts / 2, my + playerTile.y * (ts + gap) + ts / 2, ts / 2 - 1);
    }
    const ex = gs.roomData.exit;
    this.minimapGfx.fillStyle(CONFIG.COLORS.EXIT);
    this.minimapGfx.fillRect(mx + ex.x * (ts + gap), my + ex.y * (ts + gap), ts, ts);
    if (ghostTile && gs.ghostSpawned) {
      this.minimapGfx.fillStyle(CONFIG.COLORS.GHOST, 0.7);
      this.minimapGfx.fillCircle(mx + ghostTile.x * (ts + gap) + ts / 2, my + ghostTile.y * (ts + gap) + ts / 2, ts / 2 - 1);
    }
  }
  updateGhostBar(dist) {
    const fill = Math.max(0, 1 - dist / 12);
    this.ghostBar.setFillStyle(CONFIG.COLORS.DANGER, fill);
    this.ghostBar.setScale(fill, 1);
  }
  punchStreak() {
    this.updateStreak();
    this.tweens.add({ targets: this.streakTxt, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });
  }
  punchScore() {
    this.scoreTxt.setText('Score: ' + GameState.score);
    this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }
  showPauseOverlay() {
    if (this.pauseOverlay) return;
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
    this.pauseOverlay.add(this.add.text(W / 2, 160, 'PAUSED', { fontSize: '32px', fontStyle: 'bold', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5));
    [{ l: 'RESUME', y: 250, a: 'resume' }, { l: 'HOW TO PLAY', y: 310, a: 'help' },
     { l: 'RESTART', y: 370, a: 'restart' }, { l: 'QUIT TO MENU', y: 430, a: 'quit' }].forEach(b => {
      const btn = this.add.rectangle(W / 2, b.y, 200, 45, 0x1E3A5F).setInteractive({ useHandCursor: true });
      const txt = this.add.text(W / 2, b.y, b.l, { fontSize: '16px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5);
      btn.on('pointerdown', () => this.hidePause(b.a));
      this.pauseOverlay.add([btn, txt]);
    });
    this.pauseOverlay.setDepth(100);
  }
  hidePause(action) {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    const gs = this.scene.get('GameScene');
    if (action === 'resume') { if (gs) gs.togglePause(); }
    else if (action === 'help') { this.scene.launch('HelpScene', { returnTo: 'GameScene' }); }
    else if (action === 'restart') { GameState.reset(); this.scene.stop('HUDScene'); this.scene.stop('GameScene'); this.scene.start('GameScene'); }
    else if (action === 'quit') { this.scene.stop('HUDScene'); this.scene.stop('GameScene'); this.scene.start('MenuScene'); }
  }
}

class DeathScene extends Phaser.Scene {
  constructor() { super('DeathScene'); }
  init(data) { this.cause = data.cause || 'wall'; this.isNewBest = data.isNewBest || false; }
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
    const title = this.add.text(W / 2, 60, 'BETRAYED.', { fontSize: '42px', fontStyle: 'bold', color: CONFIG.HEX.DANGER }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: 70, duration: 400 });
    const msg = this.cause === 'wall' ? 'You trusted the map.' : 'The ghost caught you.';
    this.add.text(W / 2, 115, msg, { fontSize: '14px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5);
    this.add.text(W / 2, 160, 'Rooms Cleared: ' + (GameState.room - 1), { fontSize: '18px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5);
    this.add.text(W / 2, 195, 'Score: ' + GameState.score, { fontSize: '28px', fontStyle: 'bold', color: CONFIG.HEX.GOLD }).setOrigin(0.5);
    if (this.isNewBest) {
      const nb = this.add.text(W / 2, 230, 'NEW BEST!', { fontSize: '20px', fontStyle: 'bold', color: CONFIG.HEX.EXIT }).setOrigin(0.5);
      this.tweens.add({ targets: nb, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: 2 });
    } else {
      this.add.text(W / 2, 230, 'Best: ' + GameState.highScore, { fontSize: '16px', color: CONFIG.HEX.GOLD }).setOrigin(0.5);
    }
    this.add.text(W / 2, 260, 'Best Streak: x' + Math.min(GameState.streak, CONFIG.SCORE.STREAK_MAX), { fontSize: '14px', color: CONFIG.HEX.HUD_TEXT }).setOrigin(0.5);
    this.drawLieReveal(W / 2, 350);
    const retryBtn = this.add.rectangle(W / 2, H - 120, 200, 55, CONFIG.COLORS.PLAYER).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 120, 'RETRY', { fontSize: '22px', fontStyle: 'bold', color: CONFIG.HEX.BG }).setOrigin(0.5).setDepth(1);
    retryBtn.on('pointerdown', () => { GameState.reset(); this.scene.stop('DeathScene'); this.scene.start('GameScene'); });
    const menuBtn = this.add.rectangle(W / 2, H - 55, 200, 45, 0x000000, 0).setStrokeStyle(2, CONFIG.COLORS.PLAYER).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 55, 'MENU', { fontSize: '18px', color: CONFIG.HEX.PLAYER }).setOrigin(0.5).setDepth(1);
    menuBtn.on('pointerdown', () => { this.scene.stop('DeathScene'); this.scene.start('MenuScene'); });
  }
  drawLieReveal(cx, cy) {
    const rd = GameState.lastRoom;
    if (!rd) return;
    const G = CONFIG.GRID_SIZE, ts = 14, gap = 2;
    const mapW = G * (ts + gap), mx = cx - mapW / 2, my = cy - mapW / 2;
    const gfx = this.add.graphics();
    gfx.fillStyle(CONFIG.COLORS.MINIMAP_BG, 0.9);
    gfx.fillRoundedRect(mx - 4, my - 4, mapW + 8, mapW + 8, 4);
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        gfx.fillStyle(rd.true_grid[y][x] === 1 ? CONFIG.COLORS.MINIMAP_WALL : CONFIG.COLORS.MINIMAP_FLOOR);
        gfx.fillRect(mx + x * (ts + gap), my + y * (ts + gap), ts, ts);
      }
    }
    const lx = mx + rd.lie_position.x * (ts + gap), ly = my + rd.lie_position.y * (ts + gap);
    const lieRect = this.add.rectangle(lx + ts / 2, ly + ts / 2, ts, ts, CONFIG.COLORS.DANGER, 0.8);
    this.tweens.add({ targets: lieRect, alpha: 0, duration: 150, yoyo: true, repeat: 5, delay: 500 });
    this.time.delayedCall(500, () => {
      this.add.text(lx + ts / 2, ly - 10, 'LIE', { fontSize: '10px', fontStyle: 'bold', color: CONFIG.HEX.DANGER }).setOrigin(0.5);
    });
  }
}
