// Zeno's Dash - Help / How to Play Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark background
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F).setDepth(0);

    // Title
    this.add.text(w / 2, 30, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'monospace', color: COLORS.hud,
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 0);

    // SVG Diagram area - draw inline with graphics
    const diagY = 80;
    const g = this.add.graphics();

    // Track
    g.fillStyle(0x1A1A2E, 1);
    g.fillRect(30, diagY + 45, w - 60, 6);

    // Pursuer triangle
    g.fillStyle(0xFF0066, 1);
    g.fillTriangle(50, diagY + 44, 65, diagY + 20, 80, diagY + 44);

    // Player rect
    g.fillStyle(0x00D4FF, 1);
    g.fillRoundedRect(160, diagY + 30, 24, 18, 4);

    // Close-enough zone
    g.fillStyle(0xFFD700, 0.3);
    g.fillRect(w - 100, diagY + 18, 40, 36);

    // Finish line
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRect(w - 62, diagY + 16, 4, 40);

    // Dashed line (gap arrow)
    g.lineStyle(1, 0xCCCCFF, 0.6);
    for (let x = 188; x < w - 105; x += 8) {
      g.lineBetween(x, diagY + 39, x + 4, diagY + 39);
    }

    // Labels
    const labelStyle = { fontSize: '9px', fontFamily: 'monospace', color: COLORS.pursuer };
    this.add.text(65, diagY + 54, 'PURSUER', labelStyle).setOrigin(0.5, 0);

    const playerLbl = { fontSize: '9px', fontFamily: 'monospace', color: COLORS.player };
    this.add.text(172, diagY + 54, 'YOU', playerLbl).setOrigin(0.5, 0);

    const gapLbl = { fontSize: '9px', fontFamily: 'monospace', color: COLORS.gapText };
    this.add.text((188 + w - 105) / 2, diagY + 28, 'GAP -> HALF', gapLbl).setOrigin(0.5, 0);

    const goalLbl = { fontSize: '9px', fontFamily: 'monospace', color: COLORS.closeZone };
    this.add.text(w - 80, diagY + 62, 'GOAL', goalLbl).setOrigin(0.5, 0);

    // Instructions
    let y = diagY + 90;
    const bodyStyle = { fontSize: '14px', fontFamily: 'monospace', color: COLORS.hud, wordWrap: { width: w - 60 } };

    this.add.text(30, y, 'TAP anywhere to dash forward.', bodyStyle);
    y += 30;
    this.add.text(30, y, 'Each tap = HALF the remaining\ndistance to the goal.', bodyStyle);
    y += 50;
    this.add.text(30, y, 'Reach the GOLD ZONE before\nthe red pursuer catches you!', {
      fontSize: '14px', fontFamily: 'monospace', color: COLORS.closeZone, wordWrap: { width: w - 60 }
    });
    y += 55;

    // Tips section
    this.add.text(30, y, 'TIPS:', {
      fontSize: '15px', fontFamily: 'monospace', color: COLORS.player
    });
    y += 28;

    const tipStyle = { fontSize: '12px', fontFamily: 'monospace', color: COLORS.gapText, wordWrap: { width: w - 70 } };
    const tips = [
      '> Tap fast at the start - big\n  leaps cover ground quick.',
      '> Near the goal, each tap gains\n  less - commit early!',
      '> Watch the pursuer distance\n  below the track.'
    ];
    tips.forEach(tip => {
      this.add.text(35, y, tip, tipStyle);
      y += 42;
    });

    // GOT IT button - fixed at bottom
    const btnY = h - 70;
    const btnBg = this.add.rectangle(w / 2, btnY, 180, 50, 0x00D4FF)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'monospace', color: '#0A0A0F', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Full-screen fallback tap zone (invisible, behind button)
    const fallback = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setInteractive().setDepth(-1);
    btnBg.setDepth(20);
    btnText.setDepth(21);

    const dismiss = () => {
      playClickSound();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };

    btnBg.on('pointerdown', dismiss);
    fallback.on('pointerdown', dismiss);
  }
}
