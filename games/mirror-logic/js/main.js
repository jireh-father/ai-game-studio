// Mirror Logic - Main (BootScene, Phaser config, GameState)

const GameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('mirror_logic_high_score') || '0'),
  highestStage: parseInt(localStorage.getItem('mirror_logic_highest_stage') || '0'),
  stage: 1,
  streak: 0,
  gamesPlayed: parseInt(localStorage.getItem('mirror_logic_games_played') || '0'),
  mirrorsRemoved: 0,
  settings: JSON.parse(localStorage.getItem('mirror_logic_settings') || '{"sound":true,"music":true,"vibration":true}')
};

function saveSettings() {
  localStorage.setItem('mirror_logic_high_score', GameState.highScore.toString());
  localStorage.setItem('mirror_logic_highest_stage', GameState.highestStage.toString());
  localStorage.setItem('mirror_logic_games_played', GameState.gamesPlayed.toString());
  localStorage.setItem('mirror_logic_settings', JSON.stringify(GameState.settings));
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    // Register all SVGs from config
    for (const [key, svgStr] of Object.entries(SVG)) {
      textures[key] = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    }

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game',
    width: '100%',
    height: '100%'
  },
  backgroundColor: '#0A0E1A',
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  render: { antialias: true, pixelArt: false }
};

const game = new Phaser.Game(config);

// Recover Phaser canvas after portrait restore from landscape CSS hide
const portraitQuery = window.matchMedia('(orientation: portrait)');
portraitQuery.addEventListener('change', (e) => {
  if (e.matches) {
    setTimeout(() => { game.scale.refresh(); }, 100);
  }
});
