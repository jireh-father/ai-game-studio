// Shatter Chain - UI Scenes (Menu, GameOver, Boot)

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Generate SVG textures
    const ballSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <defs><radialGradient id="bg" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#E8E8F0"/>
        <stop offset="60%" stop-color="#C0C0C8"/>
        <stop offset="100%" stop-color="#808090"/>
      </radialGradient></defs>
      <circle cx="14" cy="14" r="13" fill="url(#bg)" stroke="#888890" stroke-width="1.5"/>
      <ellipse cx="9" cy="8" rx="4" ry="2.5" fill="white" opacity="0.5"/>
    </svg>`;

    const glassSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30">
      <rect width="40" height="30" rx="2" fill="#A8D8EA" opacity="0.85" stroke="#D4EFFA" stroke-width="1.5"/>
      <line x1="2" y1="2" x2="38" y2="2" stroke="#FFF" stroke-width="1" opacity="0.5"/>
    </svg>`;

    const textures = {
      ball: `data:image/svg+xml;base64,${btoa(ballSVG)}`,
      glass: `data:image/svg+xml;base64,${btoa(glassSVG)}`,
    };

    let pending = 0;
    const total = Object.keys(textures).length;
    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    const gs = window.GameState;

    const g = this.add.graphics(); g.lineStyle(1, 0x1E1E35, 0.15);
    for (let r = 0; r < 30; r++) for (let c = 0; c < 15; c++) g.strokeCircle(c*52+(r%2?26:0), r*45, 15);
    for (let i = 0; i < 8; i++) {
      const px = 40+Math.random()*(CFG.WIDTH-80), py = 200+Math.random()*300;
      const panel = this.add.rectangle(px, py, 40, 30, CFG.COLOR.GLASS, 0.3).setDepth(1);
      this.tweens.add({ targets: panel, y: py-20+Math.random()*40, alpha: 0.1, duration: 2000+Math.random()*2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Title
    const title = this.add.text(CFG.WIDTH / 2, 180, 'SHATTER\nCHAIN', {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.WHITE_HEX, align: 'center',
      stroke: '#16213E', strokeThickness: 4, lineSpacing: 8,
    }).setOrigin(0.5).setDepth(10);

    // Tagline
    this.add.text(CFG.WIDTH / 2, 280, 'One flick. Total destruction.', {
      fontSize: '16px', fontFamily: 'Arial', color: '#8899AA',
    }).setOrigin(0.5).setDepth(10);

    // Play button
    const playBg = this.add.rectangle(CFG.WIDTH / 2, 400, 200, 60, CFG.COLOR.GLASS).setDepth(10).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(CFG.WIDTH / 2, 400, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.BG_HEX,
    }).setOrigin(0.5).setDepth(11);

    // Play button pulse
    this.tweens.add({
      targets: [playBg], scaleX: 1.03, scaleY: 1.03, duration: 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    playBg.on('pointerdown', () => {
      playClick();
      // Init audio context on user gesture
      getAudioCtx();
      gs.score = 0;
      gs.waveNumber = 1;
      gs.sessionSeed = Date.now();
      AdManager.reset();
      this.cameras.main.fade(200, 0, 0, 0);
      this.time.delayedCall(200, () => this.scene.start('GameScene'));
    });

    // Best score
    const bestScore = gs.highScore || 0;
    const bestWave = parseInt(localStorage.getItem('shatter-chain_highest_wave') || '0');
    if (bestScore > 0) {
      this.add.text(CFG.WIDTH / 2, 520, `BEST: ${bestScore.toLocaleString()}  |  WAVE ${bestWave}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#666',
      }).setOrigin(0.5).setDepth(10);
    }

    // Settings button
    const settingsBtn = this.add.text(CFG.WIDTH - 15, 15, '\u2699', {
      fontSize: '32px', color: '#667788',
    }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerdown', () => {
      playClick();
      this.showSettings();
    });

    // Trophy (achievements) button
    const trophyBtn = this.add.text(15, 15, '\uD83C\uDFC6', {
      fontSize: '28px',
    }).setDepth(10).setInteractive({ useHandCursor: true });
    trophyBtn.on('pointerdown', () => { playClick(); this.showAchievements(); });

    // Achievement multiplier display
    const achMult = AchievementManager.getScoreMultiplier();
    if (achMult > 0) {
      this.add.text(CFG.WIDTH / 2, 550, `Score Bonus: +${Math.round(achMult * 100)}%`, {
        fontSize: '12px', fontFamily: 'Arial', color: CFG.GOLDEN_HEX,
      }).setOrigin(0.5).setDepth(10);
    }

    // Decorative ball
    const ball = this.add.circle(80, 620, 20, CFG.COLOR.BALL).setDepth(5);
    ball.setStrokeStyle(2, 0x888890);
    this.tweens.add({
      targets: ball, x: CFG.WIDTH - 80, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  showAchievements() {
    AchievementManager.init();
    const elems = [];
    const overlay = this.add.rectangle(CFG.WIDTH/2, CFG.HEIGHT/2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.95).setDepth(200).setInteractive();
    elems.push(overlay);
    elems.push(this.add.text(CFG.WIDTH/2, 60, 'ACHIEVEMENTS', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.GOLDEN_HEX,
    }).setOrigin(0.5).setDepth(210));

    const mult = AchievementManager.getScoreMultiplier();
    elems.push(this.add.text(CFG.WIDTH/2, 95, `Score Bonus: +${Math.round(mult * 100)}%`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#AAA',
    }).setOrigin(0.5).setDepth(210));

    CFG.ACHIEVEMENTS.forEach((ach, i) => {
      const y = 130 + i * 52;
      const unlocked = AchievementManager.unlocked.includes(ach.id);
      const progress = AchievementManager.stats[ach.stat] || 0;
      const pct = Math.min(progress / ach.target, 1);
      const col = unlocked ? CFG.GOLDEN_HEX : '#666';

      elems.push(this.add.text(20, y, unlocked ? '\u2705' : '\u2B1C', { fontSize: '18px' }).setDepth(210));
      elems.push(this.add.text(50, y, ach.label, { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: col }).setDepth(210));
      elems.push(this.add.text(50, y + 18, ach.desc + ` (${Math.min(progress, ach.target)}/${ach.target})`, { fontSize: '11px', fontFamily: 'Arial', color: '#888' }).setDepth(210));
      // Progress bar
      const barBg = this.add.rectangle(250, y + 10, 80, 8, 0x333355).setOrigin(0, 0.5).setDepth(210);
      const barFill = this.add.rectangle(250, y + 10, 80 * pct, 8, unlocked ? CFG.GOLDEN_COLOR : CFG.COLOR.GLASS).setOrigin(0, 0.5).setDepth(211);
      elems.push(barBg, barFill);
    });

    const closeBtn = this.add.text(CFG.WIDTH/2, CFG.HEIGHT - 60, 'CLOSE', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.GLASS_HI,
      backgroundColor: '#16213E', padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setDepth(210).setInteractive({ useHandCursor: true });
    elems.push(closeBtn);
    closeBtn.on('pointerdown', () => { playClick(); elems.forEach(o => { if (o.active) o.destroy(); }); });
  }

  showSettings() {
    const gs = window.GameState, items = [];
    const overlay = this.add.rectangle(CFG.WIDTH/2, CFG.HEIGHT/2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.9).setDepth(100).setInteractive();
    const ttl = this.add.text(CFG.WIDTH/2, 120, 'SETTINGS', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX }).setOrigin(0.5).setDepth(110);
    const mkToggle = (label, key, y) => {
      const txt = this.add.text(60, y, label, { fontSize: '18px', fontFamily: 'Arial', color: '#AAA' }).setDepth(110);
      const val = gs.settings[key];
      const btn = this.add.text(CFG.WIDTH-60, y, val?'ON':'OFF', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: val?CFG.COLOR.CLEAR_HEX:CFG.COLOR.DANGER_HEX }).setOrigin(1,0).setDepth(110).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { gs.settings[key]=!gs.settings[key]; btn.setText(gs.settings[key]?'ON':'OFF'); btn.setColor(gs.settings[key]?CFG.COLOR.CLEAR_HEX:CFG.COLOR.DANGER_HEX); localStorage.setItem('shatter-chain_settings',JSON.stringify(gs.settings)); playClick(); });
      items.push(txt, btn);
    };
    mkToggle('Sound Effects','sound',220); mkToggle('Music','music',280); mkToggle('Vibration','vibration',340);
    const closeBtn = this.add.text(CFG.WIDTH/2, 460, 'CLOSE', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.GLASS_HI, backgroundColor: '#16213E', padding: { x: 30, y: 10 } }).setOrigin(0.5).setDepth(110).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { playClick(); [overlay, ttl, closeBtn, ...items].forEach(o => o.destroy()); });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    const gs = window.GameState;

    this.add.text(CFG.WIDTH/2, 100, 'GAME OVER', { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX, stroke: '#16213E', strokeThickness: 3 }).setOrigin(0.5);
    const finalScore = data.score || 0;
    const scoreText = this.add.text(CFG.WIDTH/2, 200, '0', { fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.SCORE_HEX }).setOrigin(0.5);
    this.tweens.addCounter({ from: 0, to: finalScore, duration: 800, ease: 'Power2', onUpdate: (tw) => { scoreText.setText(Math.floor(tw.getValue()).toLocaleString()); } });
    this.add.text(CFG.WIDTH/2, 270, `Wave ${data.wave||1}`, { fontSize: '20px', fontFamily: 'Arial', color: '#AAA' }).setOrigin(0.5);
    this.add.text(CFG.WIDTH/2, 305, `Best Chain: x${Math.pow(2, Math.min(data.chainDepth||0, 3))}`, { fontSize: '16px', fontFamily: 'Arial', color: '#888' }).setOrigin(0.5);
    if (data.isNewHigh && finalScore > 0) {
      const badge = this.add.text(CFG.WIDTH/2, 155, 'NEW HIGH SCORE!', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.SCORE_HEX, stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
      this.tweens.add({ targets: badge, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const nearest = AchievementManager.getNearestUnfinished();
    if (nearest) {
      const pct = Math.min(nearest.progress/nearest.target, 1);
      this.add.text(CFG.WIDTH/2, 340, `NEXT: ${nearest.label}`, { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.GOLDEN_HEX }).setOrigin(0.5);
      this.add.text(CFG.WIDTH/2, 358, `${nearest.desc} (${nearest.progress}/${nearest.target})`, { fontSize: '11px', fontFamily: 'Arial', color: '#888' }).setOrigin(0.5);
      this.add.rectangle(CFG.WIDTH/2-70, 375, 140, 6, 0x333355).setOrigin(0, 0.5);
      this.add.rectangle(CFG.WIDTH/2-70, 375, 140*pct, 6, CFG.GOLDEN_COLOR).setOrigin(0, 0.5);
    }

    // Double score button
    if (AdManager.canDoubleScore()) {
      const dblBtn = this.add.text(CFG.WIDTH / 2, 400, 'WATCH AD - 2x SCORE', {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#000', backgroundColor: CFG.COLOR.SCORE_HEX,
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      dblBtn.on('pointerdown', () => {
        AdManager.useDoubleScore();
        AdManager.showRewarded('double_score', () => {
          gs.score = finalScore * 2;
          if (gs.score > gs.highScore) {
            gs.highScore = gs.score;
            localStorage.setItem('shatter-chain_high_score', gs.highScore);
          }
          scoreText.setText(gs.score.toLocaleString());
          dblBtn.destroy();
        });
      });
    }

    // Play Again button
    const playBtn = this.add.text(CFG.WIDTH / 2, 480, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.BG_HEX, backgroundColor: '#A8D8EA',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerdown', () => {
      playClick();
      gs.score = 0;
      gs.waveNumber = 1;
      gs.sessionSeed = Date.now();
      AdManager.reset();
      if (AdManager.shouldShowInterstitial()) {
        AdManager.showInterstitial(() => this.scene.start('GameScene'));
      } else {
        this.scene.start('GameScene');
      }
    });

    // Menu button
    const menuBtn = this.add.text(CFG.WIDTH / 2, 545, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      playClick();
      gs.score = 0;
      gs.waveNumber = 1;
      this.scene.start('MenuScene');
    });
  }
}
