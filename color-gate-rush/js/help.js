// help.js — HelpScene with illustrated how-to-play

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = (data && data.returnTo) || 'MenuScene';
  }

  create() {
    var w = SCREEN.WIDTH;
    var h = SCREEN.HEIGHT;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x10101E).setDepth(0);

    // Scrollable content via camera
    var y = 30;

    // Header
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    y += 40;

    // One-liner
    this.add.text(w / 2, y, 'Match your ball color to pass through gates!', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888899', wordWrap: { width: w - 40 }
    }).setOrigin(0.5, 0);
    y += 35;

    // Control diagram
    this.add.text(w / 2, y, '--- CONTROLS ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: UI_BUTTON
    }).setOrigin(0.5, 0);
    y += 28;

    // Tap icon
    this.add.circle(w / 2, y + 20, 20, 0xFFFFFF, 0.15);
    this.add.circle(w / 2, y + 20, 10, 0xFFFFFF, 0.3);
    this.add.text(w / 2, y + 50, 'TAP ANYWHERE', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    y += 70;

    // Color cycle illustration
    var colors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
    var labels = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
    var startX = 50;
    var spacing = 75;
    for (var i = 0; i < 4; i++) {
      this.add.circle(startX + i * spacing, y + 15, 14, colors[i].hex);
      this.add.text(startX + i * spacing, y + 35, labels[i], {
        fontSize: '10px', fontFamily: 'Arial', color: colors[i].css
      }).setOrigin(0.5, 0);
      if (i < 3) {
        this.add.text(startX + i * spacing + spacing / 2, y + 12, '>', {
          fontSize: '16px', fontFamily: 'Arial', color: '#888899'
        }).setOrigin(0.5, 0);
      }
    }
    y += 65;

    // Gate diagram
    this.add.text(w / 2, y, '--- GATES ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: UI_BUTTON
    }).setOrigin(0.5, 0);
    y += 28;

    // Pass example
    var passX = w / 4;
    this.add.circle(passX, y + 25, 10, COLORS.BLUE.hex);
    this.add.arc(passX, y + 25, 30, 0, Phaser.Math.DegToRad(90), false, COLORS.BLUE.hex, 0.4);
    this.add.text(passX, y + 60, 'MATCH = PASS', {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#33FF88'
    }).setOrigin(0.5, 0);

    // Death example
    var deathX = 3 * w / 4;
    this.add.circle(deathX, y + 25, 10, COLORS.BLUE.hex);
    this.add.arc(deathX, y + 25, 30, 0, Phaser.Math.DegToRad(90), false, COLORS.RED.hex, 0.4);
    this.add.text(deathX, y + 60, 'MISMATCH = DEATH', {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF3355'
    }).setOrigin(0.5, 0);
    y += 85;

    // Scoring
    this.add.text(w / 2, y, '--- SCORING ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: UI_BUTTON
    }).setOrigin(0.5, 0);
    y += 25;

    var rules = [
      '10 pts per gate cleared',
      'COMBO x2 at 5 streak, x3 at 10 streak',
      'Stars = 50 pts bonus'
    ];
    for (var r = 0; r < rules.length; r++) {
      this.add.text(w / 2, y, rules[r], {
        fontSize: '13px', fontFamily: 'Arial', color: '#CCCCCC'
      }).setOrigin(0.5, 0);
      y += 22;
    }
    y += 10;

    // Special zones
    this.add.text(w / 2, y, '--- SPECIAL ZONES ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: UI_BUTTON
    }).setOrigin(0.5, 0);
    y += 25;

    this.add.rectangle(30, y + 8, 20, 16, 0x6600AA, 0.6);
    this.add.text(50, y, 'GRAVITY FLIP — ball falls instead of rises!', {
      fontSize: '12px', fontFamily: 'Arial', color: '#BB88FF'
    }).setOrigin(0, 0);
    y += 24;

    this.add.rectangle(30, y + 8, 20, 16, 0xFF8800, 0.6);
    this.add.text(50, y, 'SPEED ZONE — ball moves faster!', {
      fontSize: '12px', fontFamily: 'Arial', color: '#FFAA44'
    }).setOrigin(0, 0);
    y += 24;

    this.add.text(20, y, 'CHAOS GATE — color changes mid-spin! (Stage 30+)', {
      fontSize: '12px', fontFamily: 'Arial', color: '#FF3355'
    }).setOrigin(0, 0);
    y += 35;

    // Tips
    this.add.text(w / 2, y, '--- TIPS ---', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: UI_BUTTON
    }).setOrigin(0.5, 0);
    y += 25;

    var tips = [
      'Count your taps to land on the right color.',
      'Rest stages (every 5th) are easy — breathe!',
      'In speed zones, tap early!'
    ];
    for (var t = 0; t < tips.length; t++) {
      this.add.text(w / 2, y, (t + 1) + '. ' + tips[t], {
        fontSize: '12px', fontFamily: 'Arial', color: '#AAAAAA',
        wordWrap: { width: w - 40 }
      }).setOrigin(0.5, 0);
      y += 28;
    }
    y += 15;

    // GOT IT button — fixed near bottom
    var btnY = Math.max(y, h - 70);
    var btn = this.add.rectangle(w / 2, btnY, 200, 52, 0x00FFCC).setInteractive({ useHandCursor: true }).setDepth(10);
    var btnText = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5).setDepth(11);
    btnText.disableInteractive();

    var self = this;
    var gotItY = btnY;
    btn.on('pointerdown', function() {
      AUDIO.playUIClick();
      self.scene.stop();
      if (self.returnTo === 'GameScene') {
        var gs = self.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        self.scene.resume('GameScene');
      } else {
        self.scene.resume(self.returnTo);
      }
    });

    // Full-screen fallback tap zone
    var fallback = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setInteractive().setDepth(0);
    fallback.on('pointerdown', function() {});
  }
}
