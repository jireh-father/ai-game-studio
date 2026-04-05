// Monty's Goats - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    // Dark overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D0D1A, 0.95).setDepth(60);

    // Scrollable container
    let yPos = 30;

    // Title
    this.add.text(w / 2, yPos, 'HOW TO PLAY', {
      fontSize: '26px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 45;

    // Section: The Setup
    this.add.text(w / 2, yPos, 'THE SETUP:', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#1E90FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 25;

    // Door illustrations
    const doorW = 50, doorH = 70;
    for (let i = 0; i < 3; i++) {
      const dx = w / 2 - 70 + i * 70;
      this.add.image(dx, yPos + 35, 'doorClosed').setDisplaySize(doorW, doorH).setDepth(61);
      this.add.text(dx, yPos + 35, `${i + 1}`, {
        fontSize: '18px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(62);
    }
    yPos += 80;

    this.add.text(w / 2, yPos, 'TAP any door to pick it.', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC'
    }).setOrigin(0.5).setDepth(61);
    yPos += 30;

    // Section: Monty Reveals
    this.add.text(w / 2, yPos, 'MONTY REVEALS A GOAT:', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#1E90FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 25;

    // Show: selected, unknown, goat
    const labels = [
      { tex: 'doorSelected', txt: 'YOU', x: w / 2 - 70 },
      { tex: 'doorClosed', txt: '?', x: w / 2 },
      { tex: 'doorGoat', txt: '', x: w / 2 + 70 }
    ];
    labels.forEach(l => {
      this.add.image(l.x, yPos + 30, l.tex).setDisplaySize(45, 65).setDepth(61);
      if (l.txt) this.add.text(l.x, yPos + 30, l.txt, {
        fontSize: '14px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(62);
    });
    yPos += 75;

    // Section: Decide
    this.add.text(w / 2, yPos, 'NOW DECIDE:', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#1E90FF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 25;

    this.add.rectangle(w / 2 - 55, yPos + 5, 90, 30, COLORS.switchBtn).setDepth(61);
    this.add.text(w / 2 - 55, yPos + 5, 'SWITCH', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);
    this.add.rectangle(w / 2 + 55, yPos + 5, 90, 30, COLORS.stayBtn).setDepth(61);
    this.add.text(w / 2 + 55, yPos + 5, 'STAY', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);
    yPos += 40;

    // The Math
    this.add.text(w / 2, yPos, 'THE MATH:', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 22;
    this.add.text(w / 2, yPos, 'Switching wins 2/3 of the time!\nBUT Monty LIES - learn his tells!', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center'
    }).setOrigin(0.5).setDepth(61);
    yPos += 40;

    // Scoring
    this.add.text(w / 2, yPos, 'SCORING:', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 20;
    const scores = [
      'Correct switch = 100 pts',
      'Correct stay (trap!) = 200 pts',
      '3 in a row = COMBO x2!'
    ];
    scores.forEach(s => {
      this.add.text(30, yPos, '  ' + s, {
        fontSize: '12px', fontFamily: 'Arial', fill: '#CCCCCC'
      }).setDepth(61);
      yPos += 18;
    });
    yPos += 10;

    // Danger
    this.add.text(w / 2, yPos, 'DANGER:', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FF2D55', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 22;
    this.add.text(w / 2, yPos, '3 WRONG IN A ROW =\nGOAT MODE = GAME OVER!', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FF8888', align: 'center'
    }).setOrigin(0.5).setDepth(61);
    yPos += 35;

    // Tips
    this.add.text(w / 2, yPos, 'TIPS:', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#32CD32', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    yPos += 20;
    const tips = [
      '1. Switching is usually right!',
      "2. Watch Monty's lies - they evolve!",
      '3. Timer turns RED when low!'
    ];
    tips.forEach(t => {
      this.add.text(30, yPos, '  ' + t, {
        fontSize: '12px', fontFamily: 'Arial', fill: '#AADDAA'
      }).setDepth(61);
      yPos += 18;
    });

    // GOT IT button - fixed at bottom
    const btnY = h - 50;
    const btnGotIt = this.add.rectangle(w / 2, btnY, 180, 50, COLORS.reward).setInteractive().setDepth(63);
    const btnLabel = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(64);
    btnLabel.disableInteractive();

    // Full-screen tap fallback
    const fullTap = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setInteractive().setDepth(59);
    fullTap.on('pointerdown', () => {}); // absorb taps below

    btnGotIt.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else if (this.returnTo === 'PauseScene') {
        this.scene.resume('PauseScene');
      } else {
        this.scene.resume('MenuScene');
      }
    });
  }
}
