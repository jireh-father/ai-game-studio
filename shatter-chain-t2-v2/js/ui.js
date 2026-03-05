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

    // Background hex grid
    const g = this.add.graphics();
    g.lineStyle(1, 0x1E1E35, 0.15);
    for (let row = 0; row < 30; row++) {
      for (let col = 0; col < 15; col++) {
        const cx = col * 52 + (row % 2 ? 26 : 0);
        const cy = row * 45;
        g.strokeCircle(cx, cy, 15);
      }
    }

    // Animated glass panels in background
    for (let i = 0; i < 8; i++) {
      const px = 40 + Math.random() * (CFG.WIDTH - 80);
      const py = 200 + Math.random() * 300;
      const panel = this.add.rectangle(px, py, 40, 30, CFG.COLOR.GLASS, 0.3).setDepth(1);
      this.tweens.add({
        targets: panel, y: py - 20 + Math.random() * 40, alpha: 0.1,
        duration: 2000 + Math.random() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
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

    // Decorative ball
    const ball = this.add.circle(80, 600, 20, CFG.COLOR.BALL).setDepth(5);
    ball.setStrokeStyle(2, 0x888890);
    this.tweens.add({
      targets: ball, x: CFG.WIDTH - 80, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  showSettings() {
    const gs = window.GameState;
    const overlay = this.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, 0x0A0A1E, 0.9).setDepth(100).setInteractive();
    const title = this.add.text(CFG.WIDTH / 2, 120, 'SETTINGS', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX,
    }).setOrigin(0.5).setDepth(110);

    const items = [];
    const makeToggle = (label, key, y) => {
      const txt = this.add.text(60, y, label, {
        fontSize: '18px', fontFamily: 'Arial', color: '#AAA',
      }).setDepth(110);
      const val = gs.settings[key];
      const btn = this.add.text(CFG.WIDTH - 60, y, val ? 'ON' : 'OFF', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
        color: val ? CFG.COLOR.CLEAR_HEX : CFG.COLOR.DANGER_HEX,
      }).setOrigin(1, 0).setDepth(110).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        gs.settings[key] = !gs.settings[key];
        btn.setText(gs.settings[key] ? 'ON' : 'OFF');
        btn.setColor(gs.settings[key] ? CFG.COLOR.CLEAR_HEX : CFG.COLOR.DANGER_HEX);
        localStorage.setItem('shatter-chain_settings', JSON.stringify(gs.settings));
        playClick();
      });
      items.push(txt, btn);
    };

    makeToggle('Sound Effects', 'sound', 220);
    makeToggle('Music', 'music', 280);
    makeToggle('Vibration', 'vibration', 340);

    const closeBtn = this.add.text(CFG.WIDTH / 2, 460, 'CLOSE', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.GLASS_HI,
      backgroundColor: '#16213E', padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setDepth(110).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      playClick();
      [overlay, title, closeBtn, ...items].forEach(o => o.destroy());
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    this.cameras.main.setBackgroundColor(CFG.COLOR.BG);
    const gs = window.GameState;
    const finalScore = data.score || 0;

    // Title
    this.add.text(CFG.WIDTH / 2, 50, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.WHITE_HEX, stroke: '#16213E', strokeThickness: 3,
    }).setOrigin(0.5);

    // Contextual challenge text
    const highScore = gs.highScore || 0;
    let challengeText = 'TIP: Chain reactions multiply!';
    if (data.isNewHigh && finalScore > 0) challengeText = 'UNSTOPPABLE!';
    else if (highScore > 0 && finalScore >= highScore * 0.85) challengeText = 'SO CLOSE!';

    const challengeLabel = this.add.text(CFG.WIDTH / 2, 85, challengeText, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
      color: data.isNewHigh ? CFG.COLOR.GOLD_HEX : CFG.COLOR.CASCADE_HEX,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: challengeLabel, alpha: 1, duration: 300, delay: 200 });

    // Score count-up
    const scoreText = this.add.text(CFG.WIDTH / 2, 130, '0', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.SCORE_HEX,
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: finalScore, duration: 800, ease: 'Power2',
      onUpdate: (tween) => { scoreText.setText(Math.floor(tween.getValue()).toLocaleString()); }
    });

    // New high score badge
    if (data.isNewHigh && finalScore > 0) {
      const badge = this.add.text(CFG.WIDTH / 2, 105, 'NEW HIGH SCORE!', {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
        color: CFG.COLOR.SCORE_HEX, stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: badge, scaleX: 1.1, scaleY: 1.1, duration: 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // --- Stats Dashboard ---
    const statStyle = { fontSize: '14px', fontFamily: 'Arial', color: '#AAA' };
    const valStyle = { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.WHITE_HEX };
    const pbStyle = { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: CFG.COLOR.GOLD_HEX };
    let sy = 180;
    const lineH = 26;

    const statLines = [
      { label: 'Wave Reached', value: `${data.wave || 1}`, isPB: data.newWaveRecord },
      { label: 'Panels Destroyed', value: `${data.totalPanelsDestroyed || 0}` },
      { label: 'Best Chain', value: `x${Math.pow(2, Math.min(data.chainDepth || 0, 3))}`, isPB: data.newChainRecord },
      { label: 'Chains Triggered', value: `${data.totalChainsTriggered || 0}` },
      { label: 'Best Launch', value: `${data.bestSingleLaunchPanels || 0} panels`, isPB: data.newLaunchRecord },
    ];

    statLines.forEach((stat, i) => {
      const y = sy + i * lineH;
      const lbl = this.add.text(30, y, stat.label, statStyle).setAlpha(0);
      const val = this.add.text(CFG.WIDTH - 30, y, stat.value, valStyle).setOrigin(1, 0).setAlpha(0);
      this.tweens.add({ targets: [lbl, val], alpha: 1, duration: 200, delay: 400 + i * 200 });
      if (stat.isPB) {
        const newBadge = this.add.text(CFG.WIDTH - 100, y, 'NEW!', pbStyle).setOrigin(1, 0).setAlpha(0);
        this.tweens.add({ targets: newBadge, alpha: 1, duration: 200, delay: 600 + i * 200 });
        this.tweens.add({ targets: newBadge, scaleX: 1.15, scaleY: 1.15, duration: 300, yoyo: true, repeat: -1, delay: 800 + i * 200 });
      }
    });

    // Personal bests section
    const pbSectionY = sy + statLines.length * lineH + 15;
    const pbHeaderStyle = { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: '#777' };
    this.add.text(CFG.WIDTH / 2, pbSectionY, '— PERSONAL BESTS —', pbHeaderStyle).setOrigin(0.5);

    const pbLines = [
      { label: 'Highest Wave', value: `${data.pbWave || 0}` },
      { label: 'Best Chain Depth', value: `x${Math.pow(2, Math.min(data.pbChain || 0, 3))}` },
      { label: 'Most Panels (1 Launch)', value: `${data.pbLaunchPanels || 0}` },
    ];

    pbLines.forEach((pb, i) => {
      const y = pbSectionY + 20 + i * lineH;
      this.add.text(30, y, pb.label, { ...statStyle, fontSize: '13px', color: '#666' });
      this.add.text(CFG.WIDTH - 30, y, pb.value, { ...valStyle, fontSize: '13px', color: '#999' }).setOrigin(1, 0);
    });

    // --- Buttons ---
    const btnY = pbSectionY + 20 + pbLines.length * lineH + 30;

    // Double score button
    if (AdManager.canDoubleScore()) {
      const dblBtn = this.add.text(CFG.WIDTH / 2, btnY, 'WATCH AD - 2x SCORE', {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#000', backgroundColor: CFG.COLOR.SCORE_HEX,
        padding: { x: 16, y: 8 },
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
    const playBtn = this.add.text(CFG.WIDTH / 2, btnY + 50, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.BG_HEX, backgroundColor: '#A8D8EA',
      padding: { x: 28, y: 10 },
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
    const menuBtn = this.add.text(CFG.WIDTH / 2, btnY + 100, 'MENU', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      playClick();
      gs.score = 0;
      gs.waveNumber = 1;
      this.scene.start('MenuScene');
    });
  }
}
