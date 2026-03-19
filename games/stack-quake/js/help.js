// Stack Quake - Help Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const W = GAME_WIDTH;
    const bg = this.add.rectangle(W / 2, GAME_HEIGHT / 2, W, GAME_HEIGHT, 0x1A1A2E);
    bg.setScrollFactor(0);

    let y = 40;

    // Title
    this.add.text(W / 2, y, 'HOW TO PLAY', { fontSize: '28px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5);
    y += 50;

    // Controls illustration
    const diagBg = this.add.rectangle(W / 2, y + 60, W - 40, 140, 0x0D0D0D, 0.6).setOrigin(0.5);

    // Sliding block illustration
    this.add.rectangle(100, y + 20, 60, 20, 0xE84855).setOrigin(0.5);
    const arrow = this.add.text(145, y + 12, '>>>', { fontSize: '16px', fill: COLORS.BLOCK });
    this.tweens.add({ targets: arrow, x: 165, duration: 800, yoyo: true, repeat: -1 });

    // Down arrow
    this.add.text(W / 2, y + 50, 'v', { fontSize: '24px', fill: COLORS.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5);

    // Tap text
    this.add.text(W / 2 + 60, y + 50, 'TAP!', { fontSize: '18px', fill: COLORS.PERFECT_FLASH, fontStyle: 'bold' }).setOrigin(0.5);

    // Platform with shake indicator
    this.add.rectangle(W / 2, y + 90, 120, 16, 0x3A86FF).setOrigin(0.5);
    this.add.text(W / 2, y + 115, '~ ~ SHAKING ~ ~', { fontSize: '12px', fill: COLORS.DANGER }).setOrigin(0.5);

    this.add.text(W / 2, y + 140, 'TAP ANYWHERE TO DROP THE BLOCK', { fontSize: '14px', fill: COLORS.UI_TEXT, fontStyle: 'bold' }).setOrigin(0.5);

    y += 175;

    // Scoring section
    this.add.text(W / 2, y, '-- SCORING --', { fontSize: '20px', fill: COLORS.PERFECT_FLASH, fontStyle: 'bold' }).setOrigin(0.5);
    y += 30;

    const scoreLines = [
      { text: 'Land on platform:  +100', color: COLORS.UI_TEXT },
      { text: 'Near center:  +250', color: COLORS.TOWER_HIGHLIGHT },
      { text: 'PERFECT center:  +500 + combo!', color: COLORS.PERFECT_FLASH }
    ];
    scoreLines.forEach(line => {
      this.add.text(W / 2, y, line.text, { fontSize: '15px', fill: line.color }).setOrigin(0.5);
      y += 26;
    });

    y += 10;

    // Rules section
    this.add.text(W / 2, y, '-- RULES --', { fontSize: '20px', fill: COLORS.DANGER, fontStyle: 'bold' }).setOrigin(0.5);
    y += 30;

    const rules = [
      'Platform SHRINKS when you miss edges',
      'Earthquake gets WORSE every floor',
      'Perfect centers restore some width',
      'Platform too narrow = GAME OVER',
      '5 seconds without tapping = AUTO-DROP'
    ];
    rules.forEach(rule => {
      this.add.text(W / 2, y, rule, { fontSize: '13px', fill: COLORS.UI_TEXT, align: 'center' }).setOrigin(0.5);
      y += 24;
    });

    y += 10;

    // Tips section
    this.add.text(W / 2, y, '-- TIPS --', { fontSize: '20px', fill: COLORS.WIDTH_RESTORE, fontStyle: 'bold' }).setOrigin(0.5);
    y += 30;

    const tips = [
      'Watch the PLATFORM, not the block',
      'Chain perfect centers to survive longer',
      'Pattern changes every 5 floors - adapt!'
    ];
    tips.forEach(tip => {
      this.add.text(W / 2, y, tip, { fontSize: '13px', fill: COLORS.UI_TEXT }).setOrigin(0.5);
      y += 24;
    });

    // GOT IT button - fixed near bottom
    const btnY = GAME_HEIGHT - 60;
    const btnBg = this.add.rectangle(W / 2, btnY, 200, 52, 0xE84855).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(W / 2, btnY, 'GOT IT!', { fontSize: '22px', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    btnTxt.disableInteractive();

    btnBg.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });

    // Full screen fallback tap zone
    const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0).setOrigin(0.5).setInteractive();
    fallback.setDepth(-1);
    fallback.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });
  }
}
