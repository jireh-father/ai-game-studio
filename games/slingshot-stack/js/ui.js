// Slingshot Stack - Menu, Game Over, HUD, Pause

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(CONFIG.COLORS.SKY_TOP, CONFIG.COLORS.SKY_TOP, CONFIG.COLORS.SKY_BOTTOM, CONFIG.COLORS.SKY_BOTTOM, 1);
    bg.fillRect(0, 0, w, h);

    // Tower silhouette
    const tg = this.add.graphics();
    tg.fillStyle(0x2B2D42, 0.3);
    const bx = w * 0.55;
    for (let i = 0; i < 6; i++) {
      const bw = 50 - i * 4;
      tg.fillRoundedRect(bx - bw / 2, h * 0.65 - i * 28, bw, 25, 3);
    }

    // Title
    this.add.text(w / 2, h * 0.28, 'SLINGSHOT\nSTACK', {
      fontSize: '48px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      fill: CONFIG.COLORS.TEXT_DARK, align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    // Bounce animation on title
    const title = this.children.list[this.children.list.length - 1];
    this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // High score
    const hs = parseInt(localStorage.getItem(CONFIG.STORAGE_PREFIX + 'high_score') || '0');
    if (hs > 0) {
      this.add.text(w / 2, h * 0.48, 'BEST: ' + hs, {
        fontSize: '22px', fontFamily: 'Arial', fill: CONFIG.COLORS.TEXT_GOLD
      }).setOrigin(0.5);
    }

    // Play prompt
    const play = this.add.text(w / 2, h * 0.6, 'TAP TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', fill: CONFIG.COLORS.TEXT_DARK
    }).setOrigin(0.5);
    this.tweens.add({ targets: play, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    // Sound toggle
    this.soundOn = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'sound') !== 'false';
    const soundBtn = this.add.text(w - 30, 30, this.soundOn ? '🔊' : '🔇', {
      fontSize: '28px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', () => {
      this.soundOn = !this.soundOn;
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'sound', this.soundOn);
      soundBtn.setText(this.soundOn ? '🔊' : '🔇');
    });

    // Tap to start
    this.input.on('pointerdown', (p) => {
      if (Math.abs(p.x - soundBtn.x) < 30 && Math.abs(p.y - soundBtn.y) < 30) return;
      this.scene.start('GameScene');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const data = this.scene.settings.data || {};
    const score = data.score || 0;
    const blocks = data.blocksStacked || 0;

    // Overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.65);

    // Header
    this.add.text(w / 2, h * 0.18, 'TOWER\nCOLLAPSED!', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
      fill: CONFIG.COLORS.DANGER, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Score count-up
    const scoreText = this.add.text(w / 2, h * 0.34, '0', {
      fontSize: '48px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: score, duration: 800, ease: 'Cubic.easeOut',
      onUpdate: (tw) => { scoreText.setText(Math.floor(tw.getValue())); }
    });

    // Blocks stacked
    this.add.text(w / 2, h * 0.43, blocks + ' BLOCKS STACKED', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#AAAAAA'
    }).setOrigin(0.5);

    // High score check
    const hs = parseInt(localStorage.getItem(CONFIG.STORAGE_PREFIX + 'high_score') || '0');
    let isNewBest = false;
    if (score > hs) {
      isNewBest = true;
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'high_score', score);
    }
    // Update games played
    const gp = parseInt(localStorage.getItem(CONFIG.STORAGE_PREFIX + 'games_played') || '0');
    localStorage.setItem(CONFIG.STORAGE_PREFIX + 'games_played', gp + 1);

    if (isNewBest) {
      const nb = this.add.text(w / 2, h * 0.50, 'NEW BEST!', {
        fontSize: '28px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', fill: CONFIG.COLORS.TEXT_GOLD
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: nb, scaleX: 1.3, scaleY: 1.3, duration: 300, ease: 'Back.easeOut',
        onComplete: () => this.tweens.add({ targets: nb, scaleX: 1, scaleY: 1, duration: 200 })
      });
    }

    // Continue button (rewarded ad)
    let btnY = h * 0.62;
    if (adManager.canContinue() && blocks > 3) {
      const contBg = this.add.rectangle(w / 2, btnY, 220, 50, 0x4CAF50, 1).setInteractive({ useHandCursor: true });
      contBg.setStrokeStyle(2, 0x388E3C);
      const contTxt = this.add.text(w / 2, btnY, 'CONTINUE (AD)', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const onContinue = () => {
        adManager.showRewarded(() => {
          this.scene.start('GameScene', { continueData: data });
        });
      };
      contBg.on('pointerdown', onContinue);
      contTxt.on('pointerdown', onContinue);
      btnY += 65;
    }

    // Play Again
    const playBg = this.add.rectangle(w / 2, btnY, 220, 50, CONFIG.COLORS.BLOCK_ORANGE, 1).setInteractive({ useHandCursor: true });
    playBg.setStrokeStyle(2, 0xC44E1A);
    const playTxt = this.add.text(w / 2, btnY, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const onPlay = () => this.scene.start('GameScene');
    playBg.on('pointerdown', onPlay);
    playTxt.on('pointerdown', onPlay);

    // Menu
    const menuY = btnY + 55;
    const menuTxt = this.add.text(w / 2, menuY, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#AAAAAA'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuTxt.on('pointerdown', () => this.scene.start('MenuScene'));

    // Interstitial
    adManager.showInterstitial();
  }
}

// HUD helper (used by GameScene)
function createHUD(scene) {
  const w = scene.scale.width;
  const hud = {};

  hud.scoreTxt = scene.add.text(15, 15, 'Score: 0', {
    fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: CONFIG.COLORS.TEXT_DARK
  }).setScrollFactor(0).setDepth(100);

  hud.bestTxt = scene.add.text(w / 2, 15, 'Best: ' + (parseInt(localStorage.getItem(CONFIG.STORAGE_PREFIX + 'high_score') || '0')), {
    fontSize: '16px', fontFamily: 'Arial', fill: '#555555'
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

  // Pause button
  hud.pauseBtn = scene.add.text(w - 20, 18, '| |', {
    fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', fill: CONFIG.COLORS.TEXT_DARK
  }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
  hud.pauseBtn.hitArea = new Phaser.Geom.Rectangle(-22, -22, 44, 44);

  // Combo text (hidden)
  hud.comboTxt = scene.add.text(w / 2, 50, '', {
    fontSize: '28px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold', fill: CONFIG.COLORS.TEXT_GOLD
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setAlpha(0);

  // Miss indicators
  hud.missIndicators = [];
  for (let i = 0; i < CONFIG.GAMEPLAY.MAX_MISSES; i++) {
    const mi = scene.add.text(w - 25 - i * 25, scene.scale.height - 30, 'X', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#666666'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    hud.missIndicators.push(mi);
  }

  // Height counter
  hud.heightTxt = scene.add.text(w - 15, scene.scale.height / 2, '0', {
    fontSize: '14px', fontFamily: 'Arial', fill: '#888888'
  }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);

  return hud;
}

function updateMissIndicators(hud, misses) {
  for (let i = 0; i < hud.missIndicators.length; i++) {
    hud.missIndicators[i].setStyle({ fill: i < misses ? CONFIG.COLORS.DANGER : '#666666' });
  }
}
