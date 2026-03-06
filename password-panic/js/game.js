// game.js - GameScene: tile keyboard, password building, rule checking, timer

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.w = w; this.h = h;
    this.add.rectangle(w/2, h/2, w, h, 0xFAFAFA);
    this.inactivityActive = false;
    GameState.lastTapTime = this.time.now;
    GameState.paused = false;
    GameState.rules = generateRulesForStage(GameState.stage, GameState.rules);
    const isReset = GameState.stage > 1 && GameState.stage % 5 === 0;
    GameState.maxTimer = getTimerForStage(GameState.stage) + (isReset ? 3 : 0);
    GameState.timer = GameState.maxTimer;
    GameState.password = [];
    GameState.wrongThisStage = 0;
    const tileData = generateTilesForStage(GameState.rules);
    // Website name with typewriter
    this.websiteName = getWebsiteName(GameState.stage);
    this.siteText = this.add.text(12, 8, '', { fontSize: '13px', fontFamily: 'Courier New', fill: COLORS.PRIMARY, fontStyle: 'bold' });
    let sIdx = 0;
    this.time.addEvent({ delay: 30, repeat: this.websiteName.length - 1, callback: () => { sIdx++; this.siteText.setText(this.websiteName.substring(0, sIdx)); }});
    // Pause button
    this.add.text(w - 36, 8, '||', { fontSize: '18px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY, backgroundColor: '#E3F2FD', padding: { x: 6, y: 2 } })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showPause());
    // Timer bar
    this.timerBarBg = this.add.rectangle(w/2, 32, w - 24, 12, 0xE0E0E0).setOrigin(0.5);
    this.timerBar = this.add.rectangle(12, 26, w - 24, 12, 0x00897B).setOrigin(0, 0);
    this.timerText = this.add.text(w - 12, 32, '', { fontSize: '10px', fontFamily: 'Arial', fill: '#FFF' }).setOrigin(1, 0.5);
    // Rules
    this.ruleDisplays = [];
    this.createRuleDisplay();
    // Password display
    this.pwY = this.rulesEndY + 8;
    this.add.text(12, this.pwY, 'Password:', { fontSize: '11px', fontFamily: 'Arial', fill: COLORS.UI_TEXT });
    this.pwText = this.add.text(12, this.pwY + 16, '|', { fontSize: '16px', fontFamily: 'Courier New', fill: COLORS.PW_TEXT, fontStyle: 'bold' });
    const btnY = this.pwY + 14;
    // Keyboard (created before backspace/CLR so buttons get higher input priority)
    this.tileButtons = [];
    this.keyboardY = this.pwY + 44;
    this.createKeyboard(tileData);
    // Backspace and Clear buttons (added after keyboard tiles for input priority)
    const bsBtn = this.add.text(w - 80, btnY, '<-', { fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFF', backgroundColor: COLORS.UI_TEXT, padding: { x: 8, y: 4 } })
      .setDepth(10).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.backspace());
    const clrBtn = this.add.text(w - 42, btnY, 'CLR', { fontSize: '12px', fontFamily: 'Arial Black', fill: '#FFF', backgroundColor: COLORS.FAIL, padding: { x: 4, y: 4 } })
      .setDepth(10).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.clearPassword());
    // Submit
    const subY = this.keyboardY + 150;
    this.add.image(w/2, subY, 'submitBtn').setScale(0.7).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.submitPassword());
    this.add.text(w/2, subY, 'SUBMIT', { fontSize: '16px', fontFamily: 'Arial Black', fill: '#FFF' }).setOrigin(0.5);
    // Bottom HUD - init from GameState
    const hudY = subY + 32;
    this.scoreText = this.add.text(12, hudY, 'Score: ' + GameState.score, { fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT });
    this.stageText = this.add.text(w/2, hudY, 'Stage ' + GameState.stage, { fontSize: '12px', fontFamily: 'Arial Bold', fill: COLORS.UI_TEXT }).setOrigin(0.5);
    this.streakText = this.add.text(w - 12, hudY, GameState.streak > 0 ? 'x' + GameState.streak : '', { fontSize: '14px', fontFamily: 'Arial Black', fill: COLORS.TIMER_WARNING }).setOrigin(1, 0);
    this.pauseOverlay = null;
    this.visHandler = () => { if (document.hidden) GameState.paused = true; };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  createRuleDisplay() {
    const startY = 48, ruleH = 30;
    this.rulesEndY = startY;
    this.ruleDisplays.forEach(r => { r.bg.destroy(); r.txt.destroy(); r.icon.destroy(); });
    this.ruleDisplays = [];
    const maxV = Math.min(GameState.rules.length, 5);
    for (let i = 0; i < maxV; i++) {
      const rule = GameState.rules[i], y = startY + i * (ruleH + 4);
      const bg = this.add.image(this.w/2, y + ruleH/2, 'stickyNote').setDisplaySize(this.w - 24, ruleH);
      const txt = this.add.text(20, y + 6, rule.text, { fontSize: '11px', fontFamily: 'Arial', fill: '#333', wordWrap: { width: this.w - 70 } });
      const icon = this.add.text(this.w - 28, y + 6, '?', { fontSize: '13px', fontFamily: 'Arial Bold', fill: COLORS.UI_TEXT });
      this.ruleDisplays.push({ bg, txt, icon, ruleId: rule.id });
      this.rulesEndY = y + ruleH + 4;
    }
    if (GameState.rules.length > 5) {
      this.add.text(this.w/2, this.rulesEndY, '+' + (GameState.rules.length - 5) + ' more...', { fontSize: '10px', fontFamily: 'Arial', fill: COLORS.UI_TEXT }).setOrigin(0.5);
      this.rulesEndY += 16;
    }
  }

  createKeyboard(data) {
    this.tileButtons.forEach(t => { t.bg.destroy(); t.label.destroy(); });
    this.tileButtons = [];
    const rows = [data.words.slice(0,3), data.words.slice(3,6), data.numbers, data.symbols];
    let y = this.keyboardY;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r], tileW = r < 2 ? 100 : 60, gap = 6;
      const totalW = row.length * tileW + (row.length - 1) * gap;
      const startX = (this.w - totalW) / 2;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c]), tx = startX + c * (tileW + gap) + tileW / 2;
        const bg = this.add.image(tx, y, 'tile').setDisplaySize(tileW, 32).setInteractive({ useHandCursor: true });
        const label = this.add.text(tx, y, val, { fontSize: r < 2 ? '12px' : '13px', fontFamily: 'Arial Bold', fill: COLORS.TILE_TEXT }).setOrigin(0.5);
        const obj = { bg, label, value: val, used: false, row: r };
        bg.on('pointerdown', () => this.tapTile(obj));
        this.tileButtons.push(obj);
      }
      y += 36;
    }
  }

  tapTile(tile) {
    if (tile.used || GameState.paused) return;
    GameState.lastTapTime = this.time.now;
    this.inactivityActive = false;
    tile.used = true;
    tile.bg.setTexture('tilePressed');
    tile.label.setAlpha(0.5);
    Effects.tileDepress(this, tile.bg, tile.label);
    GameState.password.push({ text: tile.value, type: tile.row < 2 ? 'word' : tile.row === 2 ? 'number' : 'symbol' });
    this.updatePwDisplay();
  }

  backspace() {
    if (!GameState.password.length || GameState.paused) return;
    GameState.lastTapTime = this.time.now;
    const rem = GameState.password.pop();
    const t = this.tileButtons.find(b => b.value === rem.text && b.used);
    if (t) { t.used = false; t.bg.setTexture('tile'); t.label.setAlpha(1); }
    this.updatePwDisplay();
  }

  clearPassword() {
    if (GameState.paused) return;
    GameState.lastTapTime = this.time.now;
    GameState.password = [];
    this.tileButtons.forEach(t => { t.used = false; t.bg.setTexture('tile'); t.label.setAlpha(1); });
    this.updatePwDisplay();
  }

  updatePwDisplay() {
    const pw = GameState.password.map(p => p.text).join('');
    this.pwText.setText(pw || '|');
    if (GameState.password.length > 0) Effects.passwordSlideIn(this, this.pwText, this.pwY + 16);
  }

  submitPassword() {
    if (GameState.paused || !GameState.password.length) return;
    GameState.lastTapTime = this.time.now;
    const pw = GameState.password.map(p => p.text).join('');
    const res = validatePassword(pw, GameState.rules, GameState.password);
    res.valid ? this.onSuccess() : this.onFail(res.results);
  }

  onSuccess() {
    GameState.paused = true;
    Effects.greenFlash(this);
    Effects.checkmarkCascade(this, this.ruleDisplays);
    const first = GameState.wrongThisStage === 0;
    let pts = (first ? SCORING.stageClearFirst : SCORING.stageClearRetry) * GameState.stage;
    pts += SCORING.perRule * GameState.rules.length;
    const spd = Math.floor((GameState.timer / GameState.maxTimer) * SCORING.speedBonusMax);
    pts += spd;
    if (first) GameState.streak++; else GameState.streak = 0;
    const si = SCORING.streakThresholds.filter(t => GameState.streak >= t).length - 1;
    pts = Math.floor(pts * SCORING.streakMultipliers[Math.max(0, si)]);
    GameState.score += pts;
    Effects.floatingText(this, this.w/2, this.h*0.45, '+' + pts, COLORS.SUCCESS);
    this.scoreText.setText('Score: ' + GameState.score);
    Effects.scorePunch(this, this.scoreText);
    this.streakText.setText(GameState.streak > 0 ? 'x' + GameState.streak : '');
    if (spd > 0) Effects.speedBonus(this, this.w, spd);
    this.time.delayedCall(600, () => { GameState.stage++; this.scene.restart(); });
  }

  onFail(results) {
    GameState.wrongThisStage++;
    GameState.streak = 0;
    GameState.timer = Math.max(0, GameState.timer - TIMER_CONFIG.penalty);
    Effects.redFlash(this);
    Effects.penaltyText(this, this.w);
    Effects.violationShake(this, this.ruleDisplays, results);
    GameState.password.forEach((p, i) => {
      const t = this.tileButtons.find(b => b.value === p.text && b.used);
      if (t) this.time.delayedCall(i * 30, () => { t.used = false; t.bg.setTexture('tile'); t.label.setAlpha(1); });
    });
    GameState.password = [];
    this.time.delayedCall(200, () => this.updatePwDisplay());
    this.streakText.setText('');
    if (GameState.timer <= 0) this.accountLocked();
  }

  accountLocked() {
    GameState.paused = true;
    Effects.deathShake(this);
    this.time.delayedCall(700, () => {
      document.removeEventListener('visibilitychange', this.visHandler);
      this.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage, rulesCleared: GameState.stage - 1 });
    });
  }

  showPause() {
    GameState.paused = true;
    if (this.pauseOverlay) return;
    const els = [];
    els.push(this.add.rectangle(this.w/2, this.h/2, this.w, this.h, 0xFFFFFF, 0.85).setInteractive());
    els.push(this.add.text(this.w/2, this.h*0.3, 'PAUSED', { fontSize: '24px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY }).setOrigin(0.5));
    const mkBtn = (y, txt, col, fn) => {
      const b = this.add.text(this.w/2, y, txt, { fontSize: '14px', fontFamily: 'Arial Bold', fill: col, backgroundColor: '#E3F2FD', padding: { x: 14, y: 7 } }).setOrigin(0.5);
      b.setInteractive(new Phaser.Geom.Rectangle(0, 0, b.width, b.height), Phaser.Geom.Rectangle.Contains);
      b.input.cursor = 'pointer';
      b.on('pointerdown', fn);
      els.push(b);
    };
    mkBtn(this.h*0.45, 'Continue Logging In', COLORS.PRIMARY, () => { this.pauseOverlay.forEach(o=>o.destroy()); this.pauseOverlay=null; GameState.paused=false; GameState.lastTapTime=this.time.now; });
    mkBtn(this.h*0.55, 'How to Play', COLORS.UI_TEXT, () => { this.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
    mkBtn(this.h*0.63, 'Try Different Browser', COLORS.TIMER_WARNING, () => { this.pauseOverlay.forEach(o=>o.destroy()); this.pauseOverlay=null; resetGameState(); this.scene.start('GameScene'); });
    mkBtn(this.h*0.71, 'Give Up', COLORS.FAIL, () => { this.pauseOverlay.forEach(o=>o.destroy()); this.pauseOverlay=null; resetGameState(); this.scene.start('MenuScene'); });
    this.pauseOverlay = els;
  }

  update(time, delta) {
    if (GameState.paused) return;
    const idle = (time - GameState.lastTapTime) / 1000;
    this.inactivityActive = idle >= TIMER_CONFIG.inactivityThreshold;
    const drain = this.inactivityActive ? TIMER_CONFIG.inactivityDrain : TIMER_CONFIG.drain;
    GameState.timer -= (delta / 1000) * drain;
    if (GameState.timer <= 0) { GameState.timer = 0; this.accountLocked(); return; }
    const pct = GameState.timer / GameState.maxTimer, barW = (this.w - 24) * pct;
    this.timerBar.setDisplaySize(Math.max(0, barW), 12);
    this.timerBar.setFillStyle(pct > 0.5 ? 0x00897B : pct > 0.25 ? 0xFF9800 : 0xD32F2F);
    this.timerText.setText(Math.ceil(GameState.timer) + 's');
    this.timerBar.setScale(1, pct < 0.25 ? 1 + 0.05 * Math.sin(time * 0.02) : 1);
    if (idle >= 5 && idle < TIMER_CONFIG.inactivityThreshold) {
      this.timerBarBg.setFillStyle(Math.sin(time * 0.01) > 0 ? 0xFF9800 : 0xE0E0E0);
    } else { this.timerBarBg.setFillStyle(0xE0E0E0); }
  }

  shutdown() { document.removeEventListener('visibilitychange', this.visHandler); }
}
