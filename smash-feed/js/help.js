class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    var w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.95).setDepth(0);

    var y = 40;
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#F8F9FA'
    }).setOrigin(0.5);

    y += 50;
    this.add.text(w / 2, y, 'Smash food flying at your face!', {
      fontFamily: 'Arial', fontSize: '14px', color: '#FFD166'
    }).setOrigin(0.5);

    // Food diagram
    y += 40;
    this.add.rectangle(w / 2, y + 50, w - 40, 100, 0x1B2838).setOrigin(0.5);
    // Growing circles showing approach
    this.add.circle(w / 2 - 80, y + 30, 8, 0xE63946);
    this.add.circle(w / 2 - 30, y + 40, 18, 0xE63946);
    this.add.circle(w / 2 + 40, y + 50, 34, 0xE63946);
    // Tap indicator
    this.add.text(w / 2 + 40, y + 50, 'TAP!', {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#52B788'
    }).setOrigin(0.5);
    // Arrow dots
    for (var i = 0; i < 5; i++) {
      this.add.circle(w / 2 - 80 + i * 30, y + 75, 2, 0xF8F9FA, 0.5);
    }
    this.add.text(w / 2, y + 95, 'Food grows as it flies at you', {
      fontFamily: 'Arial', fontSize: '12px', color: '#F8F9FA', fontStyle: 'italic'
    }).setOrigin(0.5);

    // Bomb diagram
    y += 130;
    this.add.rectangle(w / 2, y + 35, w - 40, 70, 0x1B2838).setOrigin(0.5);
    this.add.circle(w / 2 - 50, y + 35, 22, 0x1A1A2E);
    this.add.circle(w / 2 - 50, y + 15, 5, 0xFF6B35);
    this.add.text(w / 2 - 50, y + 38, '!', {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#FFD166'
    }).setOrigin(0.5);
    this.add.text(w / 2 + 30, y + 35, "DON'T TAP!", {
      fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#E63946'
    }).setOrigin(0.5);
    this.add.text(w / 2, y + 68, 'Let bombs pass safely', {
      fontFamily: 'Arial', fontSize: '12px', color: '#F8F9FA', fontStyle: 'italic'
    }).setOrigin(0.5);

    // Rules
    y += 100;
    this.add.text(w / 2, y, 'RULES', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#FFD166'
    }).setOrigin(0.5);
    var rules = [
      'Tap food to smash before it hits you',
      'NEVER tap the bomb (dark with fuse)',
      'Miss 3 items = GAME OVER',
      'Combos give x2, x3, x5 score boost',
      'Stages get faster and crazier!'
    ];
    y += 25;
    for (var r = 0; r < rules.length; r++) {
      y += 24;
      this.add.text(30, y, '  ' + rules[r], {
        fontFamily: 'Arial', fontSize: '13px', color: '#F8F9FA'
      });
    }

    // Tips
    y += 40;
    this.add.text(w / 2, y, 'TIPS', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#52B788'
    }).setOrigin(0.5);
    var tips = [
      'Bigger = ready to smash!',
      'Bombs are DARK with a glowing fuse',
      'Every 10 stages is a rest wave'
    ];
    for (var t = 0; t < tips.length; t++) {
      y += 24;
      this.add.text(30, y, '  ' + tips[t], {
        fontFamily: 'Arial', fontSize: '13px', color: '#F8F9FA'
      });
    }

    // GOT IT button - fixed at bottom
    var btnY = h - 60;
    var btn = this.add.rectangle(w / 2, btnY, 200, 50, 0xE63946, 1).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).disableInteractive();

    var self = this;
    btn.on('pointerdown', function() {
      self.scene.stop();
      if (self.returnTo === 'GameScene') {
        var gs = self.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        self.scene.resume('GameScene');
      } else {
        self.scene.resume('MenuScene');
      }
    });
  }
}
