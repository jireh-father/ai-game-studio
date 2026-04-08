const phaserConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 720,
  backgroundColor: '#1A0F00',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, GameScene, GameOverScene, HelpScene],
  input: { activePointer: 3 }
};

window.addEventListener('load', () => {
  new Phaser.Game(phaserConfig);
});
