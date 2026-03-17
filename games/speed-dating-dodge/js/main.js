// Speed Dating Dodge — Main Entry Point (LOADED LAST)

// Global game state
const GameState = {
  highScore: parseInt(localStorage.getItem('speed-dating-dodge_high_score') || '0'),
  gamesPlayed: parseInt(localStorage.getItem('speed-dating-dodge_games') || '0')
};

// Boot scene to register textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      'avatar_menu': `data:image/svg+xml;base64,${btoa(SVG.avatar('#FF6B6B', 'happy'))}`,
      'heart_full': `data:image/svg+xml;base64,${btoa(SVG.heartFull)}`,
      'heart_broken': `data:image/svg+xml;base64,${btoa(SVG.heartBroken)}`,
      'icon_adventurer': `data:image/svg+xml;base64,${btoa(SVG.iconAdventurer)}`,
      'icon_homebody': `data:image/svg+xml;base64,${btoa(SVG.iconHomebody)}`,
      'icon_foodie': `data:image/svg+xml;base64,${btoa(SVG.iconFoodie)}`,
      'icon_workaholic': `data:image/svg+xml;base64,${btoa(SVG.iconWorkaholic)}`,
      'icon_free_spirit': `data:image/svg+xml;base64,${btoa(SVG.iconFreeSpirit)}`,
      'particle': `data:image/svg+xml;base64,${btoa(SVG.particle)}`,
      'particle_green': `data:image/svg+xml;base64,${btoa(SVG.particleGreen)}`,
      'particle_red': `data:image/svg+xml;base64,${btoa(SVG.particleRed)}`
    };

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

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

// Phaser config — must be after all class definitions to avoid TDZ errors
const phaserConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#FFF5E6',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

// Initialize game
const game = new Phaser.Game(phaserConfig);

// Orientation lock
try { screen.orientation.lock('portrait').catch(() => {}); } catch(e) {}

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
  if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });

// Resize handler
window.addEventListener('resize', () => {
  if (game && game.scale) game.scale.refresh();
});
