// Number Baseball - Phaser init (loads LAST)
Object.assign(GameScene.prototype, SceneEffects);

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0e1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, GameScene, GameOverScene, HelpScene]
};

new Phaser.Game(config);
