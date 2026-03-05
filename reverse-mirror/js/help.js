// help.js - HelpScene with illustrated controls and rules

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const cx = GAME_WIDTH / 2;
    let y = 30;

    // Background
    this.add.rectangle(cx, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, PALETTE.bg, 0.95).setDepth(300);

    // Scrollable container via camera
    const content = this.add.container(0, 0).setDepth(301);

    // Title
    const title = this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.mirrorHex
    }).setOrigin(0.5);
    content.add(title);
    y += 35;

    const desc = this.add.text(cx, y, 'Your reflection controls YOU!\nSwipe to move — but everything is mirrored.', {
      fontSize: '14px', fontFamily: 'Arial', fill: PALETTE.uiText,
      align: 'center', wordWrap: { width: GAME_WIDTH - 40 }
    }).setOrigin(0.5, 0);
    content.add(desc);
    y += 55;

    // Control illustration
    const ctrlTitle = this.add.text(cx, y, '--- CONTROLS ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.white
    }).setOrigin(0.5);
    content.add(ctrlTitle);
    y += 30;

    // Draw mirror diagram
    // Top half: real character (warm)
    const diagTop = y;
    const diagH = 130;
    const diagBg = this.add.rectangle(cx, y + diagH/2, GAME_WIDTH - 40, diagH, 0x111828, 0.8);
    content.add(diagBg);

    // Mirror line
    const ml = this.add.rectangle(cx, y + diagH/2, GAME_WIDTH - 60, 2, PALETTE.mirror, 0.8);
    content.add(ml);

    // Real char in top
    if (this.textures.exists('realChar')) {
      const rc = this.add.image(cx - 40, y + diagH/2 - 25, 'realChar').setScale(1.2);
      content.add(rc);
    }
    const realLabel = this.add.text(cx + 20, y + diagH/2 - 30, 'REAL (moves opposite)', {
      fontSize: '11px', fontFamily: 'Arial', fill: PALETTE.realCharHex
    });
    content.add(realLabel);

    // Reflection in bottom
    if (this.textures.exists('reflChar')) {
      const rf = this.add.image(cx - 40, y + diagH/2 + 25, 'reflChar').setScale(1.2);
      content.add(rf);
    }
    const reflLabel = this.add.text(cx + 20, y + diagH/2 + 20, 'REFLECTION (you control)', {
      fontSize: '11px', fontFamily: 'Arial', fill: PALETTE.reflCharHex
    });
    content.add(reflLabel);

    // Arrow showing swipe right -> reflection goes right, real goes left
    const arrowRight = this.add.text(cx - 80, y + diagH/2 + 25, '→', {
      fontSize: '20px', fill: PALETTE.reflCharHex
    });
    content.add(arrowRight);
    const arrowLeft = this.add.text(cx - 80, y + diagH/2 - 30, '←', {
      fontSize: '20px', fill: PALETTE.realCharHex
    });
    content.add(arrowLeft);

    y += diagH + 15;

    // Swipe instructions
    const swipeText = this.add.text(cx, y, 'SWIPE anywhere to move\nReflection follows your swipe\nReal character moves OPPOSITE', {
      fontSize: '13px', fontFamily: 'Arial', fill: PALETTE.uiText,
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);
    content.add(swipeText);
    y += 60;

    // Rules
    const rulesTitle = this.add.text(cx, y, '--- RULES ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.white
    }).setOrigin(0.5);
    content.add(rulesTitle);
    y += 25;

    const rules = [
      '• Navigate BOTH bodies through gaps in walls',
      '• You have 3 lives (mirror shards)',
      '• Hit a wall = lose 1 life',
      '• 8 seconds idle = instant death',
      '• Combo builds for consecutive survivals',
      '• Perfect center = bonus 150 pts',
      '• Mirror axis rotates at higher stages!'
    ];
    rules.forEach(r => {
      const rt = this.add.text(30, y, r, {
        fontSize: '12px', fontFamily: 'Arial', fill: PALETTE.uiText
      });
      content.add(rt);
      y += 18;
    });
    y += 10;

    // Tips
    const tipsTitle = this.add.text(cx, y, '--- TIPS ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.white
    }).setOrigin(0.5);
    content.add(tipsTitle);
    y += 25;

    const tips = [
      '1. Focus on the REFLECTION — the real\n   character mirrors automatically',
      '2. Small swipes! Precise moves beat big ones',
      '3. When the mirror rotates, pause and think\n   before swiping'
    ];
    tips.forEach(t => {
      const tt = this.add.text(30, y, t, {
        fontSize: '12px', fontFamily: 'Arial', fill: PALETTE.mirrorHex, lineSpacing: 2
      });
      content.add(tt);
      y += 36;
    });
    y += 15;

    // Got it button
    const btnY = Math.max(y, GAME_HEIGHT - 70);
    const gotBtn = this.add.rectangle(cx, btnY, 200, 50, PALETTE.mirror, 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(302);
    const gotTxt = this.add.text(cx, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: PALETTE.bgHex
    }).setOrigin(0.5).setDepth(303);
    gotTxt.disableInteractive();

    gotBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Enable scroll if content overflows
    if (y > GAME_HEIGHT - 30) {
      this.input.on('pointermove', (ptr) => {
        if (ptr.isDown) {
          content.y += ptr.velocity.y * 0.3;
          content.y = Phaser.Math.Clamp(content.y, -(y - GAME_HEIGHT + 100), 0);
        }
      });
    }
  }
}
