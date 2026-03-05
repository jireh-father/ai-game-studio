// Shockwave Hop - Help Scene & Pause Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const cx = GAME.width / 2;
    const bg = this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, COLORS.bg, 0.95)
      .setDepth(0);

    let y = 50;

    // Title
    this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.primary, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);
    y += 50;

    this.add.text(cx, y, 'Tap to jump over shockwave rings!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: COLORS_HEX.uiText, wordWrap: { width: 300 }
    }).setOrigin(0.5);
    y += 40;

    // Illustration: player + ring + jump arrow
    const g = this.add.graphics();
    // Platform
    g.fillStyle(COLORS.platform, 1);
    g.fillRoundedRect(40, y + 60, GAME.width - 80, 6, 3);
    // Player
    if (this.textures.exists('player')) {
      this.add.image(cx, y + 36, 'player').setScale(0.9);
    }
    // Ring approaching
    g.lineStyle(2.5, COLORS.secondary, 0.7);
    g.strokeCircle(cx - 60, y + 10, 35);
    g.strokeCircle(cx - 60, y + 10, 50);
    // Jump arrow
    g.lineStyle(2, COLORS.primary, 0.8);
    g.beginPath();
    g.moveTo(cx, y + 30);
    g.lineTo(cx, y - 10);
    g.strokePath();
    // Arrowhead
    g.fillStyle(COLORS.primary, 0.8);
    g.fillTriangle(cx - 6, y - 5, cx + 6, y - 5, cx, y - 15);
    // TAP label
    this.add.text(cx + 50, y + 10, 'TAP!', {
      fontSize: '18px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.reward
    }).setOrigin(0.5);
    y += 90;

    // Counter-shockwave illustration
    this.add.text(cx, y, 'Your jump sends a counter-shockwave!', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif',
      color: COLORS_HEX.primary, wordWrap: { width: 300 }
    }).setOrigin(0.5);
    y += 30;

    g.lineStyle(2, COLORS.primary, 0.5);
    g.strokeCircle(cx, y + 15, 20);
    g.lineStyle(1.5, COLORS.primary, 0.3);
    g.strokeCircle(cx, y + 15, 40);
    // Orb being destroyed
    if (this.textures.exists('hazardOrb')) {
      this.add.image(cx + 45, y + 15, 'hazardOrb').setScale(0.8).setAlpha(0.6);
    }
    this.add.text(cx + 45, y - 5, 'BOOM', {
      fontSize: '11px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.danger
    }).setOrigin(0.5);
    y += 55;

    // Rules
    const rules = [
      'Jump over rings to clear them',
      'Counter-shockwave destroys nearby hazards',
      'Avoid ground spikes when landing',
      '3 lives - don\'t get hit!',
      'Stay active - 4s idle = instant death ring'
    ];
    this.add.text(cx, y, 'RULES', {
      fontSize: '16px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.reward
    }).setOrigin(0.5);
    y += 25;
    rules.forEach(r => {
      this.add.text(cx, y, '> ' + r, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif',
        color: COLORS_HEX.uiText, wordWrap: { width: 300 }
      }).setOrigin(0.5);
      y += 22;
    });
    y += 10;

    // Tips
    this.add.text(cx, y, 'TIPS', {
      fontSize: '16px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.reward
    }).setOrigin(0.5);
    y += 25;
    const tips = [
      'Time jumps carefully - 0.8s cooldown!',
      'Build combos for bigger counter-shockwaves',
      'Destroy all orbs for a PERFECT bonus'
    ];
    tips.forEach(t => {
      this.add.text(cx, y, t, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif',
        color: '#AAB8CC', wordWrap: { width: 300 }
      }).setOrigin(0.5);
      y += 22;
    });
    y += 20;

    // Got it button
    const btn = this.add.rectangle(cx, y, 160, 44, COLORS.primary, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, y, 'Got it!', {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif', color: '#0A0E27'
    }).setOrigin(0.5).disableInteractive();
    btn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'GameScene';
  }

  create() {
    const cx = GAME.width / 2;
    this.add.rectangle(cx, GAME.height / 2, GAME.width, GAME.height, COLORS.bg, 0.85);

    this.add.text(cx, 180, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif',
      color: COLORS_HEX.primary, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    const buttons = [
      { text: 'Resume', y: 280, color: COLORS.primary, action: () => {
        this.scene.stop(); this.scene.resume(this.returnTo);
      }},
      { text: 'Restart', y: 340, color: COLORS.reward, action: () => {
        this.scene.stop(); this.scene.start(this.returnTo);
      }},
      { text: 'How to Play', y: 400, color: COLORS.platform, action: () => {
        this.scene.pause();
        this.scene.launch('HelpScene', { returnTo: 'PauseScene' });
      }},
      { text: 'Menu', y: 460, color: COLORS.platform, action: () => {
        this.scene.stop(); this.scene.stop(this.returnTo); this.scene.start('MenuScene');
      }}
    ];

    buttons.forEach(b => {
      const btn = this.add.rectangle(cx, b.y, 180, 44, b.color, 0.8)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, b.y, b.text, {
        fontSize: '18px', fontFamily: 'Arial Black, sans-serif',
        color: b.color === COLORS.platform ? COLORS_HEX.uiText : '#0A0E27'
      }).setOrigin(0.5).disableInteractive();
      btn.on('pointerdown', b.action);
    });
  }
}
