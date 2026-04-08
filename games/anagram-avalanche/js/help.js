class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = (data && data.returnTo) || 'MenuScene'; }
  create() {
    const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
    this.add.rectangle(W/2, H/2, W, H, 0x0D1117, 0.97);

    this.add.text(W/2, 60, 'HOW TO PLAY', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#06B6D4',
    }).setOrigin(0.5);

    // Diagram 1: boulder
    const b = this.add.image(W/2, 150, 'boulder').setScale(1.0);
    this.add.text(W/2 - 30, 150, 'S T A C', {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#F3F4F6',
    }).setOrigin(0.5);
    this.add.text(W/2 + 90, 150, '←', {
      fontFamily: 'Arial', fontSize: '28px', color: '#06B6D4',
    }).setOrigin(0.5);

    this.add.text(W/2, 210, 'Boulders roll from the right', {
      fontFamily: 'Arial', fontSize: '15px', color: '#F3F4F6',
    }).setOrigin(0.5);

    // Diagram 2: tap order
    this.add.text(W/2, 260, 'Tap letters to SPELL the word:', {
      fontFamily: 'Arial', fontSize: '15px', color: '#F3F4F6',
    }).setOrigin(0.5);
    const order = ['C', 'A', 'T', 'S'];
    order.forEach((l, i) => {
      const x = W/2 - 75 + i * 50;
      this.add.rectangle(x, 300, 42, 42, i < 3 ? 0x22C55E : 0x374151).setStrokeStyle(2, 0xFFFFFF);
      this.add.text(x, 300, l, {
        fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
      }).setOrigin(0.5);
      this.add.text(x, 275, (i+1).toString(), {
        fontFamily: 'Arial', fontSize: '12px', color: '#06B6D4',
      }).setOrigin(0.5);
    });
    this.add.text(W/2, 340, 'CATS → BOOM!', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#FCD34D',
    }).setOrigin(0.5);

    // Rules
    this.add.text(W/2, 395, 'RULES', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#06B6D4',
    }).setOrigin(0.5);
    const rules = [
      '♥♥♥  3 lives — boulder hits wall = -1 HP',
      'Wrong tap = boulder SPEEDS UP (+15%)',
      'Explode early = bonus points',
    ];
    rules.forEach((r, i) => {
      this.add.text(W/2, 425 + i * 24, r, {
        fontFamily: 'Arial', fontSize: '13px', color: '#F3F4F6',
      }).setOrigin(0.5);
    });

    // Tips
    this.add.text(W/2, 520, 'TIPS', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#F59E0B',
    }).setOrigin(0.5);
    const tips = [
      '• Read the whole word before tapping',
      '• Stay calm — panic taps = death',
      '• Use power-ups wisely every 3 stages',
    ];
    tips.forEach((t, i) => {
      this.add.text(W/2, 548 + i * 22, t, {
        fontFamily: 'Arial', fontSize: '13px', color: '#F3F4F6',
      }).setOrigin(0.5);
    });

    // GOT IT button (fixed near bottom)
    const btnY = H - 60;
    const bg = this.add.rectangle(W/2, btnY, 200, 56, 0x22C55E).setStrokeStyle(3, 0xFFFFFF);
    bg.setInteractive({ useHandCursor: true });
    this.add.text(W/2, btnY, 'GOT IT!', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
    }).setOrigin(0.5);
    const dismiss = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    bg.on('pointerdown', dismiss);
  }
}
