// Rush Hour Dash - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    var w = this.cameras.main.width;
    var h = this.cameras.main.height;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.menuBg).setAlpha(0.95);

    // Title
    this.add.text(w / 2, 30, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: COLORS_STR.buttonPrimary
    }).setOrigin(0.5, 0);

    var yPos = 70;

    // Section 1: Tap to hop
    this.add.text(w / 2, yPos, 'TAP ANYWHERE TO HOP FORWARD', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setOrigin(0.5, 0);
    yPos += 28;

    // Diagram 1: finger + player hopping
    var diag1 = this.add.graphics();
    diag1.fillStyle(0x2C2C3E, 1);
    diag1.fillRoundedRect(40, yPos, w - 80, 80, 8);
    // Road lanes
    diag1.lineStyle(1, 0xFFFFFF, 0.3);
    diag1.lineBetween(40, yPos + 40, w - 40, yPos + 40);
    // Player
    diag1.fillStyle(COLORS.player, 1);
    diag1.fillCircle(w / 2, yPos + 60, 12);
    // Arrow up
    diag1.fillStyle(0xFFFFFF, 0.8);
    diag1.fillTriangle(w / 2, yPos + 15, w / 2 - 8, yPos + 30, w / 2 + 8, yPos + 30);
    // Finger icon
    diag1.fillStyle(0xFFFFFF, 0.5);
    diag1.fillCircle(w / 2 + 60, yPos + 50, 10);
    diag1.fillRect(w / 2 + 55, yPos + 50, 10, 20);
    // Cars
    diag1.fillStyle(COLORS.carA, 1);
    diag1.fillRoundedRect(60, yPos + 28, 40, 18, 4);
    diag1.fillRoundedRect(w - 120, yPos + 28, 40, 18, 4);
    yPos += 95;

    // Section 2: Scrolling death
    this.add.text(w / 2, yPos, 'THE SCREEN SCROLLS UP', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.white
    }).setOrigin(0.5, 0);
    yPos += 18;
    this.add.text(w / 2, yPos, 'Wait too long = CRUSHED!', {
      fontSize: '13px', fontFamily: 'Arial', color: '#FF3B30'
    }).setOrigin(0.5, 0);
    yPos += 24;

    // Diagram 2: death wall
    var diag2 = this.add.graphics();
    diag2.fillStyle(0x2C2C3E, 1);
    diag2.fillRoundedRect(40, yPos, w - 80, 70, 8);
    // Player
    diag2.fillStyle(COLORS.player, 1);
    diag2.fillCircle(w / 2, yPos + 25, 10);
    // Up arrow
    diag2.fillStyle(0xFFFFFF, 0.8);
    diag2.fillTriangle(w / 2, yPos + 8, w / 2 - 6, yPos + 16, w / 2 + 6, yPos + 16);
    // Death wall
    diag2.fillStyle(COLORS.deathWall, 1);
    diag2.fillRect(40, yPos + 55, w - 80, 15);
    // Upward arrows from death wall
    diag2.fillStyle(COLORS.deathWallGlow, 0.7);
    for (var i = 0; i < 5; i++) {
      var ax = 70 + i * 55;
      diag2.fillTriangle(ax, yPos + 45, ax - 5, yPos + 52, ax + 5, yPos + 52);
    }
    yPos += 85;

    // Scoring section
    this.add.text(w / 2, yPos, 'SCORING', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.gold
    }).setOrigin(0.5, 0);
    yPos += 22;

    var rules = [
      'Each hop: +10 pts',
      'Yellow coins: +50 pts',
      'Hop streak: score multiplier!',
      'Every 10 hops: +100 bonus'
    ];
    for (var i = 0; i < rules.length; i++) {
      this.add.text(w / 2, yPos, rules[i], {
        fontSize: '12px', fontFamily: 'Arial', color: COLORS_STR.white
      }).setOrigin(0.5, 0);
      yPos += 18;
    }
    yPos += 8;

    // Tips section
    this.add.text(w / 2, yPos, 'TIPS', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonPrimary
    }).setOrigin(0.5, 0);
    yPos += 22;

    var tips = [
      'Time your hops to land in gaps',
      'Grab coins in fast lanes for big points',
      'Keep tapping - hesitation kills!'
    ];
    for (var i = 0; i < tips.length; i++) {
      this.add.text(w / 2, yPos, '> ' + tips[i], {
        fontSize: '11px', fontFamily: 'Arial', color: '#AAAAAA'
      }).setOrigin(0.5, 0);
      yPos += 18;
    }
    yPos += 16;

    // GOT IT button
    var btnY = Math.min(yPos, h - 60);
    var btnBg = this.add.rectangle(w / 2, btnY, 180, 48, COLORS.buttonPrimary)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS_STR.buttonText
    }).setOrigin(0.5);

    var self = this;
    btnBg.on('pointerdown', function() {
      self.scene.stop();
      if (self.returnTo === 'GameScene') {
        var gs = self.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        self.scene.resume('GameScene');
        self.scene.resume('UIScene');
      } else {
        self.scene.resume('MenuScene');
      }
    });

    // Full-screen fallback tap zone
    var fallback = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0)
      .setInteractive();
    fallback.on('pointerdown', function() {
      btnBg.emit('pointerdown');
    });
  }
}
