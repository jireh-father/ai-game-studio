// Main entry point: Phaser config, global state, localStorage

// Global state
const GameState = {
  currentStage: 1,
  highScore: 0,
  gamesPlayed: 0,
  settings: { vibration: true },
  recipesDiscovered: new Set(),
  elementMastery: {},
  sessionScore: 0,
  sessionStartTime: 0,
};

const STATE_KEY = 'pulse-weaver-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    GameState.currentStage = data.currentStage || 1;
    GameState.highScore = data.highScore || 0;
    GameState.gamesPlayed = data.gamesPlayed || 0;
    GameState.settings = { vibration: true, ...data.settings };
    GameState.recipesDiscovered = new Set(data.recipesDiscovered || []);
    GameState.elementMastery = data.elementMastery || {};
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
    const data = {
      currentStage: GameState.currentStage,
      highScore: GameState.highScore,
      gamesPlayed: GameState.gamesPlayed,
      settings: GameState.settings,
      recipesDiscovered: [...GameState.recipesDiscovered],
      elementMastery: GameState.elementMastery,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

// Initialize
loadState();
AdManager.init();

// Phaser config
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#F0F4FF',
  parent: 'game-container',
  scene: [SplashScene, MenuScene, GameScene, ResultsScene, StageSelectScene, RecipeBookScene, SettingsScene, PauseScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 1,
  },
};

const game = new Phaser.Game(config);

// Initialize audio on first interaction
document.addEventListener('pointerdown', () => {
  AudioEngine.init();
  AudioEngine.resume();
}, { once: true });

// Prevent default touch behavior on canvas
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
}, { passive: false });

// Handle visibility change - pause audio
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (AudioEngine.ctx) AudioEngine.ctx.suspend();
  } else {
    if (AudioEngine.ctx) AudioEngine.ctx.resume();
  }
});
