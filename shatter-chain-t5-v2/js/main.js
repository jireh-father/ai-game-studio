// Shatter Chain - Main Entry Point

// Global state
window.GameState = {
  waveNumber: 1,
  score: 0,
  ballsLeft: 3,
  highScore: parseInt(localStorage.getItem('shatter-chain_high_score') || '0'),
  gamesPlayed: parseInt(localStorage.getItem('shatter-chain_games_played') || '0'),
  sessionSeed: Date.now(),
  settings: JSON.parse(localStorage.getItem('shatter-chain_settings') || '{"sound":true,"music":true,"vibration":true}'),
};

// Initialize achievements
AchievementManager.init();

// Prevent pull-to-refresh and overscroll
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());

// Phaser game config
const gameConfig = {
  type: Phaser.AUTO,
  width: CFG.WIDTH,
  height: CFG.HEIGHT,
  parent: 'game-container',
  backgroundColor: CFG.COLOR.BG_HEX,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: MATTER_CFG.gravity,
      enableSleeping: MATTER_CFG.enableSleeping,
      debug: false,
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 1,
  },
  render: {
    pixelArt: false,
    antialias: true,
  }
};

window.game = new Phaser.Game(gameConfig);
