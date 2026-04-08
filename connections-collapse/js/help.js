class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = (data && data.returnTo) || 'MenuScene'; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x0a0e1a, 0.96).setDepth(0);

    this.add.text(w/2, 30, 'HOW TO PLAY', {
      fontFamily: 'Arial Black', fontSize: '26px', color: '#f4c20d'
    }).setOrigin(0.5);

    this.add.text(w/2, 62, 'Connections Collapse', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaa'
    }).setOrigin(0.5);

    let y = 100;
    const line = (txt, color = '#fff', size = 14) => {
      this.add.text(20, y, txt, {
        fontFamily: 'Arial', fontSize: size + 'px', color,
        wordWrap: { width: w - 40 }
      });
      y += size + 10;
    };

    // Controls illustration
    this.add.text(w/2, y, 'CONTROLS', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd700' }).setOrigin(0.5);
    y += 28;

    // Draw mini cards with connection line
    const cx = w/2, cy = y + 30;
    const colors = [0xf4c20d, 0x4cd964, 0x5ac8fa, 0xb56dff];
    const boxes = [];
    for (let i = 0; i < 4; i++) {
      const bx = cx - 90 + i * 60, by = cy;
      const r = this.add.rectangle(bx, by, 50, 32, colors[0]).setStrokeStyle(2, 0xffffff);
      boxes.push({x: bx, y: by});
    }
    // Line connecting
    const g = this.add.graphics();
    g.lineStyle(4, 0xffe066, 1);
    g.beginPath();
    g.moveTo(boxes[0].x, boxes[0].y);
    for (let i = 1; i < 4; i++) g.lineTo(boxes[i].x, boxes[i].y);
    g.strokePath();
    y += 70;

    line('DRAG across 4 cards of the same category.', '#fff');
    line('Release to submit your guess.', '#fff');
    line('', '#fff', 4);

    this.add.text(w/2, y, 'RULES', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd700' }).setOrigin(0.5);
    y += 24;
    line('- Cards fall from the top. Clear groups of 4.', '#ddd');
    line('- Wrong guess: -1 HP and fall speed up.', '#ff8866');
    line('- Cards past the DANGER LINE trigger alarm.', '#ff5577');
    line('- Stack hits ceiling = GAME OVER.', '#ff5577');
    line('- Combos within 4s give bonus points.', '#f4c20d');
    line('', '', 4);

    this.add.text(w/2, y, 'TIPS', { fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd700' }).setOrigin(0.5);
    y += 24;
    line('- Scan for obvious groups first.', '#ddd');
    line('- Stage 7+: watch for TRAP cards (red).', '#ddd');
    line('- Speed bonuses reward fast clears.', '#ddd');

    // GOT IT button (fixed to bottom)
    const btnY = h - 60;
    const btn = this.add.rectangle(w/2, btnY, 200, 54, 0xf4c20d).setStrokeStyle(3, 0xffffff).setInteractive();
    this.add.text(w/2, btnY, 'GOT IT!', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#1a1208'
    }).setOrigin(0.5);

    const dismiss = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    };
    btn.on('pointerdown', dismiss);
    // full-screen fallback tap zone at top
    const fallback = this.add.rectangle(w - 30, 30, 44, 44, 0x000000, 0.3).setInteractive();
    this.add.text(w - 30, 30, 'X', { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    fallback.on('pointerdown', dismiss);
  }
}
