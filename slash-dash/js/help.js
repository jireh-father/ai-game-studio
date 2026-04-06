// Slash Dash - Help / How to Play Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const W = GAME.CANVAS_W, H = GAME.CANVAS_H;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0A0A0F, 0.95).setDepth(0);

    let y = 36;
    this.add.text(W / 2, y, 'HOW TO PLAY', {
      fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5);

    y += 36;
    this.add.text(W / 2, y, 'Swipe RED, Hold for BLUE — at hyperspeed!', {
      fontSize: '13px', fontFamily: 'Arial', color: '#AAAAAA', wordWrap: { width: W - 40 }
    }).setOrigin(0.5);

    // Section 1: SLASH
    y += 40;
    this.add.image(60, y + 10, 'redOrb').setScale(0.7);
    this.add.text(100, y - 6, 'SLASH - Swipe through RED', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.RED_ORB
    });
    this.add.text(100, y + 16, 'Swipe any direction (min 80px)', {
      fontSize: '12px', fontFamily: 'Arial', color: '#CCCCCC'
    });
    // Swipe arrow illustration
    const g1 = this.add.graphics();
    g1.lineStyle(3, 0xFFAA33, 0.8);
    g1.beginPath(); g1.moveTo(40, y + 30); g1.lineTo(90, y + 10); g1.strokePath();
    g1.fillStyle(0xFFAA33, 0.8);
    g1.fillTriangle(90, y + 10, 82, y + 18, 80, y + 6);

    // Section 2: HOLD
    y += 60;
    this.add.image(60, y + 10, 'blueOrb').setScale(0.7);
    this.add.text(100, y - 6, 'HOLD - Stay still for BLUE', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BLUE_ORB
    });
    this.add.text(100, y + 16, 'Touch & hold — do not move', {
      fontSize: '12px', fontFamily: 'Arial', color: '#CCCCCC'
    });
    // Finger hold illustration
    const g2 = this.add.graphics();
    g2.lineStyle(2, 0x88DDFF, 0.6);
    g2.strokeCircle(55, y + 40, 12);
    g2.strokeCircle(55, y + 40, 18);

    // Section 3: POISON
    y += 70;
    this.add.image(60, y + 10, 'poisonOrb').setScale(0.7);
    this.add.text(100, y - 6, 'INVERSION - GREEN flips rules!', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.POISON_ORB
    });
    this.add.text(100, y + 16, 'Swipe blue, hold for red when active', {
      fontSize: '12px', fontFamily: 'Arial', color: '#CCCCCC'
    });

    // Section 4: SCORING
    y += 60;
    const rules = [
      '3 strikes = game over',
      'Combos build a multiplier (max x4)',
      '10 objects per stage to clear',
      'Speed increases every stage!'
    ];
    this.add.text(W / 2, y, 'RULES', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
    }).setOrigin(0.5);
    y += 22;
    rules.forEach(r => {
      this.add.text(30, y, '  ' + r, { fontSize: '13px', fontFamily: 'Arial', color: '#DDDDDD' });
      y += 20;
    });

    // Tips
    y += 10;
    this.add.text(W / 2, y, 'TIPS', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
    }).setOrigin(0.5);
    y += 22;
    const tips = [
      'Keep thumb in center — reach any object.',
      'Position for BLUE before it arrives.',
      'Combo loss at x4 is costly — stay focused!'
    ];
    tips.forEach(t => {
      this.add.text(30, y, '  ' + t, { fontSize: '12px', fontFamily: 'Arial', color: '#BBBBBB', wordWrap: { width: W - 60 } });
      y += 22;
    });

    // GOT IT button — fixed position from bottom
    const btnY = H - 60;
    const btn = this.add.rectangle(W / 2, btnY, 220, 52, Phaser.Display.Color.HexStringToColor(COLORS.BTN_PRIMARY).color)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BTN_TEXT
    }).setOrigin(0.5).setDepth(11);

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0.001)
      .setInteractive().setDepth(9);

    const dismiss = () => {
      Effects.playClickSound();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    btn.on('pointerdown', dismiss);
    fallback.on('pointerdown', dismiss);
  }
}
