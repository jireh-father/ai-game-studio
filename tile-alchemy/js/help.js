// help.js - HelpScene with illustrated alchemy instructions

class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HelpScene' });
  }

  init(data) {
    this.returnScene = data && data.returnScene ? data.returnScene : 'MenuScene';
  }

  create() {
    const w = CONFIG.WIDTH;
    this.add.rectangle(w / 2, CONFIG.HEIGHT / 2, w, CONFIG.HEIGHT, COLORS.BG);

    let y = 40;
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', color: '#FFB300', fontStyle: 'bold'
    }).setOrigin(0.5);

    y += 50;
    // Diagram 1: Valid merge
    this.drawMergeDiagram(w / 2, y);
    y += 80;
    this.addCaption(w / 2, y, 'Tap two adjacent elements to merge them');

    y += 40;
    // Diagram 2: Invalid merge
    this.drawInvalidDiagram(w / 2, y);
    y += 80;
    this.addCaption(w / 2, y, 'Wrong combos create toxic Void tiles!');

    y += 40;
    // Diagram 3: Void spread
    this.drawVoidDiagram(w / 2, y);
    y += 60;
    this.addCaption(w / 2, y, 'Void spreads every few seconds.\nDon\'t let it reach 75%!');

    y += 50;
    // Alchemy Table
    this.add.text(w / 2, y, '--- ALCHEMY TABLE ---', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFB300', fontStyle: 'bold'
    }).setOrigin(0.5);

    y += 28;
    const recipes = [
      'Fire + Earth = Magma',
      'Water + Air = Ice',
      'Fire + Air = Storm',
      'Earth + Water = Mud',
      'Fire + Water = Steam',
      'Lightning + Water = Storm',
      'Lightning + Earth = Magma',
      'Magma + Ice = Obsidian',
      'Storm + Mud = Tornado',
      'Ice + Storm = Blizzard',
      'Obsidian + Blizzard = Philosopher\'s Stone',
      'Obsidian + Tornado = Philosopher\'s Stone',
      'Pure Crystal + Void = Cleanse!',
    ];

    recipes.forEach((r, i) => {
      this.add.text(w / 2, y + i * 20, r, {
        fontSize: '12px', fontFamily: 'Arial', color: '#E8E0F0'
      }).setOrigin(0.5);
    });

    y += recipes.length * 20 + 20;
    // Tips
    this.add.text(w / 2, y, '--- TIPS ---', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFB300', fontStyle: 'bold'
    }).setOrigin(0.5);

    y += 25;
    const tips = [
      'Memorize the Alchemy Table!',
      'Plan merges near Void clusters',
      'Chain reactions multiply your score',
    ];
    tips.forEach((t, i) => {
      this.add.text(w / 2, y + i * 22, t, {
        fontSize: '13px', fontFamily: 'Arial', color: '#B388FF'
      }).setOrigin(0.5);
    });

    y += tips.length * 22 + 30;
    // Got it button
    const btnY = Math.min(y, CONFIG.HEIGHT - 50);
    const btn = this.add.rectangle(w / 2, btnY, 180, 50, COLORS.UI_ACCENT).setInteractive({ useHandCursor: true });
    const gotTxt = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial', color: '#0D0B1E', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const closeHelp = () => {
      this.scene.stop();
      if (this.returnScene === 'GameScene') {
        this.scene.resume('GameScene');
      } else {
        this.scene.start('MenuScene');
      }
    };
    btn.on('pointerdown', closeHelp);
    gotTxt.on('pointerdown', closeHelp);
  }

  drawMergeDiagram(cx, y) {
    // Fire tile + Earth tile -> arrow -> Magma tile
    this.drawMiniTile(cx - 80, y, COLORS.FIRE, '\u2666');
    this.add.text(cx - 45, y, '+', { fontSize: '20px', color: '#E8E0F0' }).setOrigin(0.5);
    this.drawMiniTile(cx - 10, y, COLORS.EARTH, '\u25B2');
    this.add.text(cx + 25, y, '\u2192', { fontSize: '22px', color: '#FFD700' }).setOrigin(0.5);
    this.drawMiniTile(cx + 60, y, COLORS.MAGMA, '\u2600');
  }

  drawInvalidDiagram(cx, y) {
    this.drawMiniTile(cx - 80, y, COLORS.FIRE, '\u2666');
    this.add.text(cx - 45, y, '+', { fontSize: '20px', color: '#E8E0F0' }).setOrigin(0.5);
    this.drawMiniTile(cx - 10, y, COLORS.FIRE, '\u2666');
    this.add.text(cx + 25, y, '\u2192', { fontSize: '22px', color: '#FF1744' }).setOrigin(0.5);
    this.drawMiniTile(cx + 60, y, COLORS.VOID, '\u2620');
    this.add.text(cx + 90, y, '\u2716', { fontSize: '22px', color: '#FF1744' }).setOrigin(0.5);
  }

  drawVoidDiagram(cx, y) {
    this.drawMiniTile(cx - 40, y, COLORS.VOID, '\u2620');
    this.add.text(cx, y, '\u2192', { fontSize: '18px', color: '#8B00FF' }).setOrigin(0.5);
    this.drawMiniTile(cx + 40, y, COLORS.VOID, '\u2620');
  }

  drawMiniTile(x, y, color, symbol) {
    this.add.rectangle(x, y, 32, 32, color).setStrokeStyle(1.5, COLORS.CELL_STROKE);
    this.add.text(x, y, symbol, { fontSize: '16px', color: '#FFFFFF' }).setOrigin(0.5);
  }

  addCaption(x, y, text) {
    this.add.text(x, y, text, {
      fontSize: '12px', fontFamily: 'Arial', color: '#8B7FBB', align: 'center'
    }).setOrigin(0.5);
  }
}
