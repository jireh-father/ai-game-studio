// main.js - BootScene, Phaser config - LOADS LAST
// Initialize GameState from localStorage (GameState defined in config.js)
GameState.highScore = parseInt(localStorage.getItem('color_law_high_score')) || 0;
GameState.gamesPlayed = parseInt(localStorage.getItem('color_law_games_played')) || 0;

// Load sound setting
try { const s = JSON.parse(localStorage.getItem('color_law_settings')); if (s && s.sound === false) SoundFX.enabled = false; } catch (e) {}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {};
    // Generate all shape textures: type x color x pattern
    const types = ['Circle', 'Square', 'Triangle'];
    const colors = SHAPE_COLORS;
    const patterns = ['Solid', 'Striped'];
    for (const type of types) {
      for (const color of colors) {
        for (const pat of patterns) {
          const key = `${type.toLowerCase()}_${color.name}_${pat}`;
          textures[key] = `data:image/svg+xml;base64,${btoa(makeSVG(type, color.hex, pat === 'Striped'))}`;
        }
      }
    }
    // Gavel, particle, skull icons
    textures['gavel'] = `data:image/svg+xml;base64,${btoa(GAVEL_SVG)}`;
    textures['particle'] = `data:image/svg+xml;base64,${btoa(PARTICLE_SVG)}`;
    textures['skull'] = `data:image/svg+xml;base64,${btoa(SKULL_SVG)}`;
    textures['skull_active'] = `data:image/svg+xml;base64,${btoa(SKULL_ACTIVE_SVG)}`;

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
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, PauseScene]
};

const game = new Phaser.Game(config);
