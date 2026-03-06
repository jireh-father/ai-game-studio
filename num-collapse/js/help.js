// help.js - HelpScene: illustrated how-to-play

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    // Dark overlay background
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.92).setInteractive();

    // Scrollable container
    const container = this.add.container(0, 0);
    let y = 30;

    // Title
    container.add(this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Arial Black', fill: '#FFFFFF'
    }).setOrigin(0.5));
    y += 40;

    // Section 1: Controls
    container.add(this.add.text(w / 2, y, 'CONTROLS', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#4ECDC4', fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 25;

    // Draw tap illustration: two hex cells with arrow
    this._drawHexPair(container, w / 2 - 40, y + 25, w / 2 + 40, y + 25, '3', '3');
    container.add(this.add.text(w / 2, y + 60, 'Tap two adjacent cells with the\nsame number to merge them!', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center'
    }).setOrigin(0.5));
    y += 100;

    // Section 2: Collapse
    container.add(this.add.text(w / 2, y, 'COLLAPSE', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#4ECDC4', fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 22;
    container.add(this.add.text(w / 2, y, 'Neighbors slide into the gap.\nThis can create chain reactions!', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center'
    }).setOrigin(0.5));
    y += 45;

    // Arrow showing collapse direction
    const arrow = this.add.text(w / 2, y, '>>> COLLAPSE >>>',
      { fontSize: '14px', fill: '#FFD700', fontFamily: 'Arial' }).setOrigin(0.5);
    container.add(arrow);
    y += 35;

    // Section 3: Scoring
    container.add(this.add.text(w / 2, y, 'SCORING', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#4ECDC4', fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 22;
    container.add(this.add.text(w / 2, y, 'Merge score = 10 x sum value\nChains multiply: x1.5, x2.0, x2.5...\nHigh sums (8+) get 1.5x bonus!', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center'
    }).setOrigin(0.5));
    y += 55;

    // Chain color legend
    const chainColors = ['#FFFFFF', '#FFD700', '#FF8C00', '#FF4444'];
    const chainLabels = ['x1', 'x2', 'x3', 'x4+'];
    for (let i = 0; i < 4; i++) {
      const cx = w / 2 - 75 + i * 50;
      container.add(this.add.text(cx, y, chainLabels[i], {
        fontSize: '14px', fontFamily: 'Arial Black', fill: chainColors[i]
      }).setOrigin(0.5));
    }
    y += 30;

    // Section 4: Death
    container.add(this.add.text(w / 2, y, 'GAME OVER', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FF6B6B', fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 22;
    container.add(this.add.text(w / 2, y, 'Board full + no matches = Game Over!\nNew numbers spawn every few seconds.\nDon\'t fall behind!', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center'
    }).setOrigin(0.5));
    y += 55;

    // Section 5: Tips
    container.add(this.add.text(w / 2, y, 'TIPS', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#4ECDC4', fontStyle: 'bold'
    }).setOrigin(0.5));
    y += 22;
    const tips = [
      '1. Merge near edges for collapse chains',
      '2. Keep 3+ empty cells as buffer',
      '3. Let low numbers build up strategically'
    ];
    tips.forEach(t => {
      container.add(this.add.text(w / 2, y, t, {
        fontSize: '12px', fontFamily: 'Arial', fill: '#AAAAAA'
      }).setOrigin(0.5));
      y += 20;
    });
    y += 15;

    // Got it button
    const btnBg = this.add.rectangle(w / 2, y, 160, 48, 0x4ECDC4, 1).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w / 2, y, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial Black', fill: '#0F0F23'
    }).setOrigin(0.5);
    container.add(btnBg);
    container.add(btnTxt);

    btnBg.on('pointerdown', () => {
      SoundFX.play('click');
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Scroll support
    const maxScroll = Math.max(0, y + 40 - h);
    if (maxScroll > 0) {
      this.input.on('pointermove', (p) => {
        if (p.isDown) {
          container.y = Phaser.Math.Clamp(container.y + p.velocity.y * 0.02, -maxScroll, 0);
        }
      });
    }
  }

  _drawHexPair(container, x1, y1, x2, y2, n1, n2) {
    // Simple hex representations with numbers
    const col = Phaser.Display.Color.HexStringToColor(NUM_COLORS[parseInt(n1)]).color;
    const h1 = this.add.polygon(x1, y1, [8,0, 24,0, 32,14, 24,28, 8,28, 0,14], col, 1);
    const h2 = this.add.polygon(x2, y2, [8,0, 24,0, 32,14, 24,28, 8,28, 0,14], col, 1);
    const t1 = this.add.text(x1, y1, n1, { fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFF' }).setOrigin(0.5);
    const t2 = this.add.text(x2, y2, n2, { fontSize: '14px', fontFamily: 'Arial Black', fill: '#FFF' }).setOrigin(0.5);
    // Tap indicators
    const tap1 = this.add.circle(x1, y1 + 22, 5, 0x00E5FF, 0.8);
    const tap2 = this.add.circle(x2, y2 + 22, 5, 0x00E5FF, 0.8);
    container.add([h1, h2, t1, t2, tap1, tap2]);
  }
}
