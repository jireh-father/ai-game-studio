// help.js - HelpScene: illustrated how-to-play page

class HelpScene extends Phaser.Scene {
  constructor() { super('Help'); }

  init(data) {
    this.returnTo = (data && data.returnTo) || 'Menu';
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    // Scrollable container via camera
    const contentH = 920;
    this.cameras.main.setBounds(0, 0, w, contentH);
    this.cameras.main.setBackgroundColor(COLORS.HUD_BG);

    let y = 30;

    // Title
    this.add.text(cx, y, 'HOW TO PLAY', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '22px',
      fill: '#FFFFFF', align: 'center'
    }).setOrigin(0.5);
    y += 30;

    this.add.text(cx, y, 'Suspect Sudoku', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px',
      fill: COLORS.ACCENT_PURPLE, align: 'center'
    }).setOrigin(0.5);
    y += 40;

    // Section: THE CRIME
    y = this.addSection(y, cx, w, 'THE CRIME',
      'A funny crime appears at the top.\nRead the case title and clue hints!');
    y += 10;

    // Crime example illustration
    const crimeBox = this.add.rectangle(cx, y + 20, w - 40, 44, 0xFFF0C0, 1);
    crimeBox.setStrokeStyle(1, 0xCCBBAA);
    this.add.text(cx, y + 20, 'The Case of the Eaten Cake', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px',
      fill: COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 60;

    // Section: THE SUSPECTS
    y = this.addSection(y, cx, w, 'THE SUSPECTS',
      'Suspects appear with clue badges.\nEach has 2-3 icon clues on their card.');
    y += 10;

    // Mini suspect illustration
    const cardW = 80;
    const cardH = 90;
    const startX = cx - cardW * 1.5 - 10;

    ['suspect-cat', 'suspect-dog', 'suspect-hamster'].forEach((key, i) => {
      const bx = startX + i * (cardW + 10) + cardW / 2;
      const by = y + cardH / 2;
      this.add.rectangle(bx, by, cardW, cardH, 0xFFFFFF, 1)
        .setStrokeStyle(2, 0xCCBBAA);
      if (this.textures.exists(key)) {
        this.add.image(bx, by - 12, key).setScale(0.45);
      }
      // Clue icons
      if (this.textures.exists('clue-footprint') && i !== 2) {
        this.add.image(bx - 12, by + 30, 'clue-footprint').setScale(0.7);
      }
      if (this.textures.exists('clue-clock') && i !== 1) {
        this.add.image(bx + 12, by + 30, 'clue-clock').setScale(0.7);
      }
    });
    y += cardH + 20;

    // Section: FIND THE GUILTY ONE
    y = this.addSection(y, cx, w, 'FIND THE GUILTY ONE',
      'Tap the suspect who matches\nALL the crime clues.\nOnly one is guilty!');
    y += 10;

    // Arrow illustration
    this.add.text(30, y, 'Clue: Near scene', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', fill: COLORS.ACCENT_PURPLE
    });
    this.add.text(30, y + 18, 'Clue: At crime time', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', fill: COLORS.ACCENT_PURPLE
    });
    this.add.text(w - 30, y + 9, 'GUILTY!', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '14px',
      fill: COLORS.CORRECT_GREEN
    }).setOrigin(1, 0.5);
    // Arrow lines
    const g = this.add.graphics();
    g.lineStyle(2, 0x4ECB71, 0.8);
    g.lineBetween(180, y + 6, w - 80, y + 9);
    g.lineBetween(180, y + 24, w - 80, y + 9);
    y += 50;

    // Section: TIMER
    y = this.addSection(y, cx, w, 'TIMER', '');
    // Timer bar illustration
    const barW = w - 60;
    this.add.rectangle(cx, y, barW, 14, 0x333333, 1);
    this.add.rectangle(cx - barW * 0.15, y, barW * 0.7, 10, 0x4ECB71, 1);
    this.add.text(cx, y + 16, '15 seconds. Runs out = lose a badge!', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px',
      fill: COLORS.HUD_TEXT, align: 'center'
    }).setOrigin(0.5);
    y += 45;

    // Section: BADGES (LIVES)
    y = this.addSection(y, cx, w, 'BADGES (LIVES)', '');
    // Badge illustration
    ['badge-active', 'badge-active', 'badge-active'].forEach((key, i) => {
      if (this.textures.exists(key)) {
        this.add.image(cx - 40 + i * 40, y, key).setScale(0.7);
      }
    });
    this.add.text(cx + 80, y, 'Lose 3 = Game Over', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px',
      fill: COLORS.GUILTY_RED
    }).setOrigin(0, 0.5);
    y += 36;

    // Section: SCORING
    y = this.addSection(y, cx, w, 'SCORING', '');
    const rules = [
      'Correct verdict: 100 pts',
      'Speed bonus: +10 per second left',
      'Streak x1.5 > x2 > x3',
      'Wrong tap = lose a badge'
    ];
    rules.forEach((r, i) => {
      this.add.text(40, y + i * 20, '* ' + r, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px',
        fill: COLORS.HUD_TEXT
      });
    });
    y += rules.length * 20 + 15;

    // Section: TIPS
    y = this.addSection(y, cx, w, 'TIPS', '');
    const tips = [
      'Red herrings match 1 clue but not ALL.',
      'Elimination: if 2 clues rule out 3,\nthe last one is guilty!',
      'Streak multiplier > speed bonus early on.'
    ];
    tips.forEach((t, i) => {
      this.add.text(40, y, t, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px',
        fill: COLORS.BADGE_GOLD, lineSpacing: 2,
        wordWrap: { width: w - 80 }
      });
      y += t.split('\n').length * 16 + 10;
    });
    y += 10;

    // GOT IT button - fixed near bottom of content
    const btnY = Math.max(y + 10, contentH - 50);
    const gotBg = this.add.rectangle(cx, btnY, 260, 48, 0x4ECB71, 1).setInteractive();
    gotBg.setStrokeStyle(2, 0x27AE60);
    this.add.text(cx, btnY, 'GOT IT!', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '20px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Full screen fallback tap zone behind everything
    const bg = this.add.rectangle(cx, contentH - 30, w, 60, 0x000000, 0).setInteractive();
    bg.on('pointerdown', () => this.closeHelp());

    gotBg.on('pointerdown', () => this.closeHelp());

    // Drag to scroll
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
        this.cameras.main.scrollY = Phaser.Math.Clamp(
          this.cameras.main.scrollY, 0, contentH - h
        );
      }
    });
  }

  addSection(y, cx, w, title, desc) {
    this.add.text(30, y, title, {
      fontFamily: 'Arial Black, sans-serif', fontSize: '14px',
      fill: COLORS.BADGE_GOLD
    });
    y += 22;
    if (desc) {
      this.add.text(30, y, desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px',
        fill: COLORS.HUD_TEXT, lineSpacing: 3,
        wordWrap: { width: w - 60 }
      });
      y += desc.split('\n').length * 17;
    }
    return y;
  }

  closeHelp() {
    SoundFX.play('buttonTap');
    this.scene.stop('Help');
    this.scene.resume(this.returnTo);
  }
}
