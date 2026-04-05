// Prime Butcher — help.js

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0D0D1A, 0.95).setDepth(0);

    let y = 40;

    this.add.text(GAME_WIDTH / 2, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    y += 50;
    // Diagram 1: Swipe gesture
    this.add.text(GAME_WIDTH / 2, y, 'SWIPE across blocks to cut them!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#FF6B35'
    }).setOrigin(0.5);

    y += 30;
    // Draw visual: composite block with swipe line
    const d1 = this.add.graphics();
    d1.fillStyle(0xF5F0E8, 1);
    d1.fillRoundedRect(100, y, 80, 50, 6);
    this.add.text(140, y + 25, '12', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.blockText
    }).setOrigin(0.5);

    d1.lineStyle(3, COLORS.sliceTrail, 1);
    d1.beginPath(); d1.moveTo(90, y - 5); d1.lineTo(195, y + 55); d1.strokePath();

    // Arrow and result
    this.add.text(210, y + 22, '->', {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);

    const d1b = this.add.graphics();
    d1b.fillStyle(0xF5F0E8, 1);
    d1b.fillRoundedRect(230, y + 2, 40, 30, 4);
    d1b.fillRoundedRect(280, y + 2, 40, 30, 4);
    this.add.text(250, y + 17, '4', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.blockText }).setOrigin(0.5);
    this.add.text(300, y + 17, '3', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.blockText }).setOrigin(0.5);

    y += 80;
    // Diagram 2: Prime vs Composite
    this.add.text(GAME_WIDTH / 2, y, 'BLUE = Prime (safe)  |  WHITE = Cut it!', {
      fontSize: '13px', fontFamily: 'Arial', color: '#AAAAAA'
    }).setOrigin(0.5);

    y += 25;
    const d2 = this.add.graphics();
    d2.fillStyle(0xA8D8EA, 1);
    d2.fillRoundedRect(60, y, 60, 40, 5);
    this.add.text(90, y + 20, '7', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.blockText }).setOrigin(0.5);
    this.add.text(90, y + 46, 'PRIME', { fontSize: '10px', fontFamily: 'Arial', color: '#5BA4CF' }).setOrigin(0.5);

    d2.fillStyle(0xF5F0E8, 1);
    d2.fillRoundedRect(160, y, 60, 40, 5);
    this.add.text(190, y + 20, '15', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.blockText }).setOrigin(0.5);
    this.add.text(190, y + 46, 'CUT ME', { fontSize: '10px', fontFamily: 'Arial', color: '#E84393' }).setOrigin(0.5);

    d2.fillStyle(0x8B2635, 1);
    d2.fillRoundedRect(260, y, 60, 40, 5);
    this.add.text(290, y + 20, '30', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    this.add.text(290, y + 46, 'BOSS', { fontSize: '10px', fontFamily: 'Arial', color: '#FF6B35' }).setOrigin(0.5);

    y += 75;
    // Diagram 3: Stack danger
    this.add.text(GAME_WIDTH / 2, y, 'Uncut blocks STACK UP', {
      fontSize: '14px', fontFamily: 'Arial', color: '#E84393'
    }).setOrigin(0.5);

    y += 20;
    const d3 = this.add.graphics();
    d3.lineStyle(2, 0x444444);
    d3.strokeRect(130, y, 100, 80);
    d3.fillStyle(0xFF0000, 1);
    d3.fillRect(130, y, 100, 3);
    d3.fillStyle(0xF5F0E8, 0.8);
    d3.fillRoundedRect(140, y + 20, 80, 18, 3);
    d3.fillRoundedRect(140, y + 40, 80, 18, 3);
    d3.fillStyle(0xE84393, 0.8);
    d3.fillRoundedRect(140, y + 60, 80, 18, 3);
    this.add.text(GAME_WIDTH / 2, y + 88, 'Stack hits ceiling = GAME OVER!', {
      fontSize: '11px', fontFamily: 'Arial', color: '#FF2D6B'
    }).setOrigin(0.5);

    y += 115;
    // Tips
    this.add.text(GAME_WIDTH / 2, y, 'TIPS', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#F9C74F'
    }).setOrigin(0.5);

    const tips = [
      'Cut fast while falling for speed bonus!',
      'Chain cuts within 2s for combo multiplier',
      'Primes dissolve on their own — ignore them'
    ];
    tips.forEach((tip, i) => {
      this.add.text(GAME_WIDTH / 2, y + 28 + i * 22, '- ' + tip, {
        fontSize: '12px', fontFamily: 'Arial', color: '#CCCCCC'
      }).setOrigin(0.5);
    });

    // GOT IT button — fixed position near bottom
    const btnY = GAME_HEIGHT - 60;
    const gotItBtn = this.add.rectangle(GAME_WIDTH / 2, btnY, 200, 50, 0xFF6B35).setInteractive().setDepth(5);
    this.add.text(GAME_WIDTH / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(6);

    // Full-screen fallback tap zone
    const fallbackZone = this.add.rectangle(GAME_WIDTH / 2, btnY, GAME_WIDTH, 80, 0x000000, 0).setInteractive().setDepth(4);

    const dismiss = () => {
      this.scene.stop('HelpScene');
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    };

    gotItBtn.on('pointerdown', dismiss);
    fallbackZone.on('pointerdown', dismiss);
  }
}
