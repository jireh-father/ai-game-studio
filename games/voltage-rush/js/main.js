// Voltage Rush - Main Entry Point (LOADED LAST)
GameState.loadHighScore();

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        var g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFFFFF);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        g.destroy();
        this.scene.start('MenuScene');
    }
}

var config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0A0A14',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
    input: {
        activePointers: 3
    }
};

var game = new Phaser.Game(config);
