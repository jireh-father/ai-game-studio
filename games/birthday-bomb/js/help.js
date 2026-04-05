// Birthday Bomb - Help Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = (data && data.returnTo) || 'MenuScene';
  }

  create() {
    var W = this.cameras.main.width;
    var H = this.cameras.main.height;
    var yPos = 0;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0xE8E0FF);

    // Scrollable container
    var content = this.add.container(0, 0);

    // Title
    content.add(this.add.text(W / 2, 40, 'HOW TO PLAY', {
      fontSize: '28px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    yPos = 80;

    // Step 1: Drag illustration
    var dragSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
      <rect x="5" y="10" width="60" height="60" rx="8" fill="#FFF8F0" stroke="#1C1C3A" stroke-width="2"/>
      <rect x="15" y="20" width="40" height="40" rx="6" fill="#FF6B9D"/>
      <circle cx="35" cy="30" r="8" fill="#FFD93D"/>
      <line x1="75" y1="40" x2="125" y2="40" stroke="#1C1C3A" stroke-width="2"/>
      <polygon points="120,35 130,40 120,45" fill="#1C1C3A"/>
      <text x="100" y="35" text-anchor="middle" font-size="10" fill="#1C1C3A">DRAG</text>
      <rect x="130" y="10" width="65" height="60" rx="8" fill="#F5E6D3" stroke="#1C1C3A" stroke-width="2"/>
      <circle cx="158" cy="35" r="8" fill="#FFD93D"/>
      <rect x="150" y="47" width="16" height="14" rx="3" fill="#5AC8FA"/>
    </svg>`;
    if (this.textures.exists('help_drag')) this.textures.remove('help_drag');
    this.textures.addBase64('help_drag', 'data:image/svg+xml;base64,' + btoa(dragSvg));
    this.textures.once('addtexture-help_drag', function() {
      content.add(this.add.image(W / 2, yPos + 40, 'help_drag'));
    }, this);

    content.add(this.add.text(W / 2, yPos + 90, '1. DRAG strangers into the party!', {
      fontSize: '16px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    yPos += 130;

    // Step 2: Match illustration
    var matchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
      <circle cx="40" cy="30" r="14" fill="#FFD93D" stroke="#1C1C3A" stroke-width="1.5"/>
      <text x="40" y="55" text-anchor="middle" font-size="10" fill="#1C1C3A">Mar 14</text>
      <rect x="84" y="22" width="32" height="16" rx="3" fill="#FF6B9D"/>
      <rect x="90" y="14" width="4" height="8" rx="1" fill="#FFD93D"/>
      <ellipse cx="92" cy="13" rx="3" ry="3" fill="#FF9500"/>
      <text x="100" y="50" text-anchor="middle" font-size="10" fill="#34C759" font-weight="bold">MATCH!</text>
      <circle cx="160" cy="30" r="14" fill="#5AC8FA" stroke="#1C1C3A" stroke-width="1.5"/>
      <text x="160" y="55" text-anchor="middle" font-size="10" fill="#1C1C3A">Mar 14</text>
    </svg>`;
    if (this.textures.exists('help_match')) this.textures.remove('help_match');
    this.textures.addBase64('help_match', 'data:image/svg+xml;base64,' + btoa(matchSvg));
    this.textures.once('addtexture-help_match', function() {
      content.add(this.add.image(W / 2, yPos + 40, 'help_match'));
    }, this);

    content.add(this.add.text(W / 2, yPos + 90, '2. Do they share a BIRTHDAY?\nTap MATCH or NO MATCH!', {
      fontSize: '16px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5));

    yPos += 145;

    // Step 3: Timer
    content.add(this.add.text(W / 2, yPos, '3. Correct = +TIME. Wrong = -TIME.\nDon\'t let the BOMB go off!', {
      fontSize: '16px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5));

    // Timer illustration
    var timerBar = this.add.rectangle(W / 2, yPos + 35, 200, 16, 0xFFD93D).setOrigin(0.5);
    var timerBg = this.add.rectangle(W / 2, yPos + 35, 200, 16, 0x000000, 0).setStrokeStyle(2, 0x1C1C3A).setOrigin(0.5);
    content.add(timerBar);
    content.add(timerBg);
    content.add(this.add.text(W / 2 - 60, yPos + 32, '+3s', {
      fontSize: '12px', fill: COLORS.reward, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));
    content.add(this.add.text(W / 2 + 60, yPos + 32, '-4s', {
      fontSize: '12px', fill: COLORS.danger, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    yPos += 70;

    // Fun fact
    content.add(this.add.text(W / 2, yPos, 'FUN FACT: With just 23 people,\nthere\'s a 50% chance of a match!', {
      fontSize: '14px', fill: COLORS.streakFlame, fontFamily: 'Arial', fontStyle: 'italic', align: 'center'
    }).setOrigin(0.5));

    yPos += 50;

    // Tips
    content.add(this.add.text(W / 2, yPos, 'TIPS:', {
      fontSize: '16px', fill: COLORS.text, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));
    yPos += 25;
    var tips = [
      'Drag fast to save time',
      'Matches get MORE LIKELY as room fills',
      'Streak correct bets for bonus points'
    ];
    for (var i = 0; i < tips.length; i++) {
      content.add(this.add.text(W / 2, yPos + i * 22, '- ' + tips[i], {
        fontSize: '13px', fill: COLORS.text, fontFamily: 'Arial'
      }).setOrigin(0.5));
    }

    yPos += 85;

    // GOT IT button - fixed at bottom
    var btnY = Math.max(yPos, H - 70);
    var gotItBtn = this.add.rectangle(W / 2, btnY, 200, 56, 0xFF6B9D, 1)
      .setStrokeStyle(3, 0xC44D6D).setInteractive({ useHandCursor: true }).setDepth(100);
    this.add.text(W / 2, btnY, 'GOT IT!', {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    var returnTo = this.returnTo;
    var scene = this;
    gotItBtn.on('pointerdown', function() {
      scene.scene.stop();
      if (returnTo === 'GameScene') {
        var gs = scene.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        scene.scene.resume('GameScene');
      } else {
        scene.scene.resume('MenuScene');
      }
    });

    // Full-screen fallback tap zone behind content
    var fallback = this.add.rectangle(W / 2, H - 30, W, 60, 0x000000, 0)
      .setInteractive().setDepth(99);
    fallback.on('pointerdown', function() {
      gotItBtn.emit('pointerdown');
    });
  }
}
