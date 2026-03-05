// Shatter Chain - Main Entry Point

// Init meta progression
MetaProgress.load();
MetaProgress.checkStreak();

// Global state
window.GameState = {
  waveNumber: 1,
  score: 0,
  ballsLeft: 3,
  highScore: parseInt(localStorage.getItem('shatter-chain_high_score') || '0'),
  gamesPlayed: parseInt(localStorage.getItem('shatter-chain_games_played') || '0'),
  sessionSeed: Date.now(),
  settings: JSON.parse(localStorage.getItem('shatter-chain_settings') || '{"sound":true,"music":true,"vibration":true}'),
  is_daily_challenge: false,
  _dailyMod: null,
  _daily_balls_used: 0,
  _daily_start_time: 0,
};

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
