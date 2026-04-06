// Melt Stack - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.add.rectangle(w / 2, h / 2, w, h, PALETTE.bg, 0.97).setDepth(0);

    let y = 40;
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Control diagram SVG
    y += 40;
    const diagSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160">
      <rect x="60" y="5" width="80" height="110" rx="10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="70" y="22" width="60" height="12" rx="3" fill="#FF6B6B"/>
      <line x1="100" y1="34" x2="100" y2="65" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4"/>
      <polygon points="96,63 104,63 100,73" fill="#FFFFFF"/>
      <rect x="75" y="75" width="50" height="10" rx="2" fill="#4ECDC4"/>
      <rect x="78" y="85" width="44" height="10" rx="2" fill="#FFE66D"/>
      <rect x="75" y="95" width="44" height="6" rx="2" fill="#FF9500" opacity="0.7"/>
      <circle cx="100" cy="132" r="10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="100" cy="132" r="4" fill="#FFFFFF" opacity="0.5"/>
      <text x="100" y="155" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="sans-serif">TAP ANYWHERE TO DROP</text>
    </svg>`;
    const diagKey = 'help-diag';
    if (!this.textures.exists(diagKey)) {
      this.textures.addBase64(diagKey, 'data:image/svg+xml;base64,' + btoa(diagSvg));
      this.textures.once('addtexture-' + diagKey, () => {
        this.add.image(w / 2, y + 80, diagKey).setDepth(1);
      });
    } else {
      this.add.image(w / 2, y + 80, diagKey).setDepth(1);
    }

    // Melt diagram description
    y += 180;
    const meltDesc = this.add.text(w / 2, y, 'Bottom blocks MELT away!\nBuild faster than you melt.', {
      fontSize: '15px', fontFamily: 'Arial, sans-serif', color: '#FF9500', align: 'center'
    }).setOrigin(0.5);

    // Scoring
    y += 50;
    this.add.text(w / 2, y, 'SCORING', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    y += 28;
    const scoring = [
      'Normal drop: 10 pts',
      'Perfect drop (no overhang): 50 pts',
      '3+ perfect streak: 1.5x multiplier!'
    ];
    scoring.forEach(line => {
      this.add.text(30, y, '  ' + line, {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#CCCCCC'
      });
      y += 22;
    });

    // Death info
    y += 10;
    this.add.text(w / 2, y, 'YOU DIE WHEN...', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FF6B6B'
    }).setOrigin(0.5);
    y += 24;
    this.add.text(w / 2, y, 'The tower melts completely.\nStack fast - stack perfect!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#CCCCCC', align: 'center'
    }).setOrigin(0.5);

    // Tips
    y += 44;
    this.add.text(w / 2, y, 'TIPS', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#4ECDC4'
    }).setOrigin(0.5);
    y += 26;
    const tips = [
      '1. Perfect drops FREEZE the melt for 1s',
      '2. Every 5th stage gives a free wide block',
      '3. Tower low? Tap faster, tap straighter'
    ];
    tips.forEach(tip => {
      this.add.text(30, y, '  ' + tip, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#CCCCCC'
      });
      y += 22;
    });

    // GOT IT button - fixed near bottom
    const btnY = h - 60;
    const btnBg = this.add.rectangle(w / 2, btnY, 200, 52, PALETTE.buttonAlt).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0).setInteractive();
    fallback.setDepth(-1);

    const dismiss = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    btnBg.on('pointerdown', dismiss);
    fallback.on('pointerdown', dismiss);
  }
}
