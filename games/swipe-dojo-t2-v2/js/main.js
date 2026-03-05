// Swipe Dojo - Main Entry Point
'use strict';

// SVG Definitions
function makePlayerSVG(bodyColor, outlineColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90">
  <rect x="18" y="30" width="24" height="36" rx="4" fill="${bodyColor}" stroke="${outlineColor}" stroke-width="3"/>
  <circle cx="30" cy="20" r="14" fill="${bodyColor}" stroke="${outlineColor}" stroke-width="3"/>
  <rect x="16" y="16" width="28" height="6" rx="2" fill="${outlineColor}"/>
  <line x1="18" y1="42" x2="4" y2="36" stroke="${bodyColor}" stroke-width="6" stroke-linecap="round"/>
  <line x1="42" y1="42" x2="54" y2="48" stroke="${bodyColor}" stroke-width="6" stroke-linecap="round"/>
  <line x1="24" y1="66" x2="18" y2="88" stroke="${bodyColor}" stroke-width="6" stroke-linecap="round"/>
  <line x1="36" y1="66" x2="42" y2="88" stroke="${bodyColor}" stroke-width="6" stroke-linecap="round"/>
</svg>`;
}
const PLAYER_SVG = makePlayerSVG('#F0EDE0', '#D4A017');

function makeEnemySVG(fill, stroke) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <polygon points="30,30 10,70 50,70" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
  <circle cx="30" cy="18" r="16" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
  <rect x="20" y="14" width="8" height="4" rx="1" fill="#FFFFFF"/>
  <rect x="32" y="14" width="8" height="4" rx="1" fill="#FFFFFF"/>
  <line x1="10" y1="50" x2="0" y2="38" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>
  <line x1="50" y1="50" x2="60" y2="38" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>
</svg>`;
}

const ENEMY_SVGS = {
  basic: makeEnemySVG('#C0392B', '#7B241C'),
  fast: makeEnemySVG('#2980B9', '#1A5276'),
  tank: makeEnemySVG('#7D3C98', '#4A235A'),
  tricky: makeEnemySVG('#F39C12', '#B7950B'),
  boss: makeEnemySVG('#E74C3C', '#922B21')
};

// BootScene: load all textures once
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(PLAYER_SVG)}`
    };
    // Belt-colored player textures
    BELT_RANKS.forEach((belt, i) => {
      textures['player_belt_' + i] = `data:image/svg+xml;base64,${btoa(makePlayerSVG(belt.color, belt.outline))}`;
    });
    ENEMY_VARIANTS.forEach(v => {
      textures['enemy_' + v] = `data:image/svg+xml;base64,${btoa(ENEMY_SVGS[v])}`;
    });

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

// Initialize Phaser
const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: PALETTE.bgHex,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(gameConfig);

// Visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const scene = game.scene.getScene('GameScene');
    if (scene && scene.scene.isActive() && !scene.paused && !scene.gameOver) {
      scene.togglePause();
    }
  }
});

// Prevent pull-to-refresh / overscroll
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
