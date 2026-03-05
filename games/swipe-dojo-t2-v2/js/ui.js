// Swipe Dojo - UI Scenes (Menu, GameOver, HUD)
'use strict';

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(Phaser.Math.Between(20, GAME_WIDTH-20), Phaser.Math.Between(20, GAME_HEIGHT-20), Phaser.Math.Between(1, 3), 0xFFFFFF, 0.15);
      this.tweens.add({ targets: p, y: p.y - 80, alpha: 0, duration: Phaser.Math.Between(3000, 6000), repeat: -1, yoyo: true });
    }
    this.add.text(cx, 160, 'SWIPE', { fontSize: '56px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', color: PALETTE.uiText, stroke: PALETTE.comboGlowHex, strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(cx, 225, 'DOJO', { fontSize: '72px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', color: PALETTE.comboGlowHex, stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5);
    this.add.image(cx, 340, 'player').setScale(1.2);
    const playBtn = this.add.rectangle(cx, 440, 260, 64, PALETTE.comboGlow, 1).setInteractive();
    this.add.text(cx, 440, 'TAP TO PLAY', { fontSize: '28px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', color: '#000000' }).setOrigin(0.5);
    this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    playBtn.on('pointerdown', () => { audioSynth.init(); this.cameras.main.fade(200, 0, 0, 0); this.time.delayedCall(200, () => this.scene.start('GameScene')); });
    const hs = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0');
    const hstage = parseInt(localStorage.getItem(STORAGE_KEYS.HIGHEST_STAGE) || '0');
    if (hs > 0) this.add.text(cx, 500, `BEST: ${hs.toLocaleString()}  |  STAGE ${hstage}`, { fontSize: '16px', fontFamily: 'Arial', color: '#888888' }).setOrigin(0.5);
    const gear = this.add.text(GAME_WIDTH - 30, 30, '\u2699', { fontSize: '32px', color: '#AAAAAA' }).setOrigin(0.5).setInteractive();
    gear.on('pointerdown', () => this._showSettings());
  }

  _showSettings() {
    if (this.settingsShown) return;
    this.settingsShown = true;
    const st = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"sound":true,"music":true,"vibration":true}');
    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88).setInteractive().setDepth(100);
    const title = this.add.text(GAME_WIDTH/2, 180, 'SETTINGS', { fontSize: '32px', fontFamily: 'Arial Black', color: PALETTE.uiText }).setOrigin(0.5).setDepth(101);
    const items = [{ label: 'Sound Effects', key: 'sound', y: 260 }, { label: 'Music', key: 'music', y: 320 }, { label: 'Vibration', key: 'vibration', y: 380 }];
    const ui = [overlay, title];
    items.forEach(item => {
      const lbl = this.add.text(60, item.y, item.label, { fontSize: '20px', fontFamily: 'Arial', color: PALETTE.uiText }).setDepth(101);
      const tog = this.add.text(GAME_WIDTH-60, item.y, st[item.key] ? 'ON' : 'OFF', { fontSize: '20px', fontFamily: 'Arial Black', color: st[item.key] ? '#00FF88' : '#FF3030' }).setOrigin(1, 0).setDepth(101).setInteractive();
      tog.on('pointerdown', () => { st[item.key] = !st[item.key]; tog.setText(st[item.key] ? 'ON' : 'OFF'); tog.setColor(st[item.key] ? '#00FF88' : '#FF3030'); localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(st)); audioSynth.sfxEnabled = st.sound; audioSynth.musicEnabled = st.music; });
      ui.push(lbl, tog);
    });
    const closeBtn = this.add.text(GAME_WIDTH/2, 460, 'CLOSE', { fontSize: '24px', fontFamily: 'Arial Black', color: PALETTE.comboGlowHex }).setOrigin(0.5).setDepth(101).setInteractive();
    closeBtn.on('pointerdown', () => { ui.forEach(p => p.destroy()); closeBtn.destroy(); this.settingsShown = false; });
    ui.push(closeBtn);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    const score = data.score || 0, stage = data.stage || 1, combo = data.maxCombo || 0;
    const beltIndex = data.beltIndex || 0, belt = BELT_RANKS[beltIndex];
    // Save stats
    const prevHS = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0');
    const isNew = score > prevHS;
    if (isNew) localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score);
    const prevStage = parseInt(localStorage.getItem(STORAGE_KEYS.HIGHEST_STAGE) || '0');
    if (stage > prevStage) localStorage.setItem(STORAGE_KEYS.HIGHEST_STAGE, stage);
    const prevBelt = parseInt(localStorage.getItem(STORAGE_KEYS.HIGHEST_BELT) || '0');
    if (beltIndex > prevBelt) localStorage.setItem(STORAGE_KEYS.HIGHEST_BELT, beltIndex);
    localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || '0') + 1);
    localStorage.setItem(STORAGE_KEYS.TOTAL_SCORE, parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SCORE) || '0') + score);
    // Game Over title
    const goText = this.add.text(cx, 110, 'GAME OVER', { fontSize: '44px', fontFamily: 'Arial Black', color: '#FF3030', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: goText, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
    this.cameras.main.shake(300, 0.008);
    // Belt rank
    this.add.text(cx, 165, belt.name.toUpperCase(), { fontSize: '20px', fontFamily: 'Arial Black', color: belt.color, stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
    // Stage + Score
    this.add.text(cx, 200, `STAGE ${stage}`, { fontSize: '22px', fontFamily: 'Arial', color: '#AAAAAA' }).setOrigin(0.5);
    const st = this.add.text(cx, 255, '0', { fontSize: '46px', fontFamily: 'Arial Black', color: PALETTE.comboGlowHex, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
    this.tweens.addCounter({ from: 0, to: score, duration: 800, ease: 'Cubic.easeOut', onUpdate: (t) => { st.setText(Math.floor(t.getValue()).toLocaleString()); } });
    this.add.text(cx, 305, `BEST COMBO: x${combo}`, { fontSize: '18px', fontFamily: 'Arial', color: '#AAAAAA' }).setOrigin(0.5);
    if (isNew) {
      const nr = this.add.text(cx, 350, 'NEW RECORD!', { fontSize: '28px', fontFamily: 'Arial Black', color: PALETTE.comboGlowHex, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
      this.tweens.add({ targets: nr, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    }
    const playBtn = this.add.rectangle(cx, 440, 240, 56, PALETTE.comboGlow).setInteractive();
    this.add.text(cx, 440, 'PLAY AGAIN', { fontSize: '24px', fontFamily: 'Arial Black', color: '#000000' }).setOrigin(0.5);
    playBtn.on('pointerdown', () => { this.cameras.main.fade(150, 0, 0, 0); this.time.delayedCall(150, () => this.scene.start('GameScene')); });
    const menuBtn = this.add.text(cx, 510, 'MENU', { fontSize: '20px', fontFamily: 'Arial', color: '#888888' }).setOrigin(0.5).setInteractive();
    menuBtn.on('pointerdown', () => { this.cameras.main.fade(150, 0, 0, 0); this.time.delayedCall(150, () => this.scene.start('MenuScene')); });
    audioSynth.playGameOver();
  }
}

// HUD managed inside GameScene
class HUD {
  constructor(scene) { this.scene = scene; this.livesIcons = []; this.build(); }

  build() {
    const s = this.scene;
    s.add.rectangle(GAME_WIDTH/2, 28, GAME_WIDTH, 56, 0x000000, 0.5).setDepth(50);
    for (let i = 0; i < 3; i++) {
      this.livesIcons.push(s.add.text(16 + i * 28, 16, '\u{1F6E1}', { fontSize: '20px' }).setDepth(51));
    }
    this.stageText = s.add.text(GAME_WIDTH/2, 28, 'STAGE 1', { fontSize: '18px', fontFamily: 'Arial Black', color: PALETTE.uiText }).setOrigin(0.5).setDepth(51);
    this.scoreText = s.add.text(GAME_WIDTH - 50, 28, '0', { fontSize: '20px', fontFamily: 'Arial Black', color: PALETTE.uiText }).setOrigin(0.5).setDepth(51);
    this.pauseBtn = s.add.text(GAME_WIDTH - 16, 28, '\u23F8', { fontSize: '24px', color: '#AAAAAA' }).setOrigin(0.5).setDepth(51).setInteractive();
    this.pauseBtn.on('pointerdown', () => s.togglePause());
    // Belt rank
    this.beltText = s.add.text(GAME_WIDTH/2, 56, BELT_RANKS[0].name, { fontSize: '12px', fontFamily: 'Arial Black', color: BELT_RANKS[0].color }).setOrigin(0.5).setDepth(51);
    // Rage meter
    const ry = GAME_HEIGHT - 60;
    s.add.rectangle(GAME_WIDTH/2, ry, 160, 8, 0x1A1A2E).setDepth(50);
    this.rageFill = s.add.rectangle(GAME_WIDTH/2 - 80, ry, 0, 8, 0xFF4400).setOrigin(0, 0.5).setDepth(51);
    s.add.rectangle(GAME_WIDTH/2, ry, 160, 8).setStrokeStyle(1, 0x444466).setDepth(52);
    this.rageLabel = s.add.text(GAME_WIDTH/2, ry - 10, 'RAGE', { fontSize: '9px', fontFamily: 'Arial Black', color: '#FF6600' }).setOrigin(0.5).setDepth(51).setAlpha(0.6);
    this.rageReady = s.add.text(GAME_WIDTH/2, ry - 10, 'SWIPE!', { fontSize: '11px', fontFamily: 'Arial Black', color: '#FFFF00' }).setOrigin(0.5).setDepth(51).setAlpha(0);
    // Combo
    this.comboText = s.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 40, '', { fontSize: '28px', fontFamily: 'Arial Black', color: PALETTE.comboGlowHex, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(30).setAlpha(0);
  }

  updateLives(lives) { this.livesIcons.forEach((ic, i) => { ic.setAlpha(i < lives ? 1 : 0.2); ic.setText(i < lives ? '\u{1F6E1}' : '\u2716'); }); }
  updateScore(score) { this.scoreText.setText(score.toLocaleString()); this.scene.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 80, yoyo: true }); }
  updateStage(stage) { this.stageText.setText(`STAGE ${stage}`); }

  updateCombo(combo) {
    if (combo > 0) {
      this.comboText.setText(`x${combo}`).setAlpha(1).setFontSize(Math.min(52, 28 + Math.floor(combo / 5) * 4));
      this.scene.tweens.add({ targets: this.comboText, scaleX: 1.15, scaleY: 1.15, duration: 60, yoyo: true });
    } else { this.scene.tweens.add({ targets: this.comboText, alpha: 0, duration: 200 }); }
  }

  updateBelt(idx) {
    const b = BELT_RANKS[idx]; this.beltText.setText(b.name).setColor(b.color);
    this.scene.tweens.add({ targets: this.beltText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  updateRage(val) {
    const r = val / RAGE.MAX; this.rageFill.width = 160 * r;
    if (r >= 1) { this.rageFill.fillColor = 0xFFFF00; this.rageReady.setAlpha(1); this.rageLabel.setAlpha(0); }
    else { this.rageFill.fillColor = r > 0.6 ? 0xFF2200 : 0xFF4400; this.rageReady.setAlpha(0); this.rageLabel.setAlpha(0.6); }
  }
}
