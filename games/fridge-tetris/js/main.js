// Global state and Phaser initialization

const GlobalState = {
  highScore: 0,
  gamesPlayed: 0,
  highestWave: 0,
  fridgePoints: 0,
  totalFridgePoints: 0,
  unlockedSkins: ['default'],
  unlockedThemes: ['classic'],
  activeSkin: 'default',
  activeTheme: 'classic',
  powerUpSlots: 1,
  dailyChallengeLastPlayed: null,
  dailyChallengeUnlocked: false,
  adFreeUntil: null,
  continueUsedToday: false,
  settings: { sound: true, music: true, vibration: true },
  // Session values
  lastScore: 0,
  lastWave: 0,
  lastFridgePoints: 0,
  isNewHighScore: false,
};

const STATE_KEY = 'fridge-tetris_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(GlobalState, saved);
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
    const toSave = { ...GlobalState };
    delete toSave.lastScore;
    delete toSave.lastWave;
    delete toSave.lastFridgePoints;
    delete toSave.isNewHighScore;
    localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

// Orientation check — skip on desktop (non-touch devices)
function checkOrientation() {
  const overlay = document.getElementById('rotate-overlay');
  if (!overlay) return;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) { overlay.style.display = 'none'; return; }
  overlay.style.display = window.innerWidth > window.innerHeight ? 'flex' : 'none';
}
window.addEventListener('resize', checkOrientation);
checkOrientation();

// Prevent pull-to-refresh and scroll during touch
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Visibility change: pause/resume
document.addEventListener('visibilitychange', () => {
  if (window.game) {
    if (document.hidden) {
      window.game.scene.getScenes(true).forEach(s => s.scene.pause());
    } else {
      window.game.scene.getScenes(true).forEach(s => s.scene.resume());
    }
  }
});

// Load state before init
loadState();
AdManager.init();

// Boot scene: pre-register ALL textures exactly once before any game scene runs.
// This prevents the async addBase64 / sync exists() race condition on scene restarts.
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Nothing to load from server — all assets are generated as inline SVG/base64.
  }

  create() {
    const textureEntries = [
      ['player_default', SVG_TEMPLATES.player('worried')],
      ['player_happy',   SVG_TEMPLATES.player('happy')],
      ['player_horrified', SVG_TEMPLATES.player('horrified')],
      ['item_milk',      SVG_TEMPLATES.milk()],
      ['item_yogurt',    SVG_TEMPLATES.yogurt()],
      ['item_juice',     SVG_TEMPLATES.juice()],
      ['item_condiment', SVG_TEMPLATES.condiment()],
      ['item_vegetable', SVG_TEMPLATES.vegetable()],
      ['item_frozen',    SVG_TEMPLATES.frozen()],
      ['item_hot',       SVG_TEMPLATES.hot()],
      ['item_watermelon',SVG_TEMPLATES.watermelon()],
      ['item_cheese',    SVG_TEMPLATES.cheese()],
    ];

    let pending = 0;
    const onTextureAdded = () => {
      pending--;
      if (pending === 0) {
        this.scene.start('MenuScene');
      }
    };

    for (const [key, svgStr] of textureEntries) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, onTextureAdded);
        this.textures.addBase64(key, getSvgDataUrl(svgStr));
      }
    }

    // If all textures already exist (shouldn't happen on first load but be safe)
    if (pending === 0) {
      this.scene.start('MenuScene');
    }
  }
}

// Phaser Game config
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    activePointers: 2,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

window.game = new Phaser.Game(phaserConfig);
