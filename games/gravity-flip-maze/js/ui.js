// ui.js - MenuScene, HUD, pause, game over, skins

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = GAME_CONFIG.GAME_WIDTH, H = GAME_CONFIG.GAME_HEIGHT;
        this.add.rectangle(W/2, H/2, W, H, COLORS.BG);

        // Animated grid lines
        const gfx = this.add.graphics();
        gfx.lineStyle(1, COLORS.GRID_LINE, 0.15);
        for (let y = 0; y < H; y += 40) gfx.lineBetween(0, y, W, y);
        for (let x = 0; x < W; x += 40) gfx.lineBetween(x, 0, x, H);

        // Title
        this.add.text(W/2, 140, 'GRAVITY FLIP\nMAZE', {
            fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.BALL_HEX, align: 'center',
            stroke: '#000000', strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: COLORS.BALL_HEX, blur: 20, fill: true }
        }).setOrigin(0.5);

        // Animated ball
        const ball = this.add.image(W/2, 230, 'ball').setDisplaySize(40, 40);
        this.tweens.add({ targets: ball, y: ball.y + 10, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        // Play button
        this.createButton(W/2, 320, 200, 56, 'PLAY', COLORS.BALL_HEX, () => {
            GameState.score = 0;
            GameState.currentMaze = 1;
            GameState.gamesPlayed++;
            saveGameState();
            this.scene.start('GameScene');
        });

        // How to Play
        this.createButton(W/2 - 55, 400, 100, 44, 'HOW TO\nPLAY', COLORS.BALL_HEX, () => {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
            this.scene.pause();
        });

        // Skins
        this.createButton(W/2 + 55, 400, 100, 44, 'SKINS', COLORS.BALL_HEX, () => {
            this.showSkins();
        });

        // Stats
        this.add.text(W/2, 480, `Best: Maze ${GameState.bestMaze}   Hi: ${GameState.highScore}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF', alpha: 0.5
        }).setOrigin(0.5);
        this.add.text(W/2, 500, `Stars: ${GameState.totalStars}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#FFD700', alpha: 0.6
        }).setOrigin(0.5);

        // Sound toggle
        const soundIcon = this.add.text(40, H - 40, GameState.settings.sound ? '🔊' : '🔇', {
            fontSize: '24px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        soundIcon.on('pointerdown', () => {
            GameState.settings.sound = !GameState.settings.sound;
            soundIcon.setText(GameState.settings.sound ? '🔊' : '🔇');
            saveGameState();
        });
    }

    createButton(x, y, w, h, label, borderColor, callback) {
        const bg = this.add.rectangle(x, y, w, h, COLORS.WALL, 0.8).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(borderColor).color);
        bg.setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, {
            fontSize: h > 50 ? '22px' : '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#FFFFFF', align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        let tapped = false;
        const onTap = () => {
            if (tapped) return;
            tapped = true;
            this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: () => callback() });
        };
        bg.on('pointerdown', onTap);
        txt.on('pointerdown', onTap);
        return { bg, txt };
    }

    showSkins() {
        this.skinOverlay = this.add.group();
        const W = GAME_CONFIG.GAME_WIDTH, H = GAME_CONFIG.GAME_HEIGHT;
        const bg = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85).setDepth(20).setInteractive();
        this.skinOverlay.add(bg);

        const title = this.add.text(W/2, 80, 'BALL SKINS', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BALL_HEX
        }).setOrigin(0.5).setDepth(21);
        this.skinOverlay.add(title);

        BALL_SKINS.forEach((skin, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const sx = 80 + col * 110, sy = 160 + row * 120;
            const unlocked = GameState.totalStars >= skin.stars;
            const isSelected = GameState.selectedSkin === i;

            const circle = this.add.circle(sx, sy, 30, Phaser.Display.Color.HexStringToColor(skin.color).color, unlocked ? 1 : 0.3).setDepth(21);
            if (isSelected) circle.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.BALL_HEX).color);

            const label = this.add.text(sx, sy + 45, unlocked ? skin.name : `${skin.stars} stars`, {
                fontSize: '12px', fontFamily: 'Arial', color: unlocked ? '#FFFFFF' : '#888888'
            }).setOrigin(0.5).setDepth(21);

            if (unlocked) {
                circle.setInteractive({ useHandCursor: true });
                circle.on('pointerdown', () => {
                    GameState.selectedSkin = i;
                    saveGameState();
                    this.hideSkins();
                    this.showSkins();
                });
            }
            this.skinOverlay.add(circle);
            this.skinOverlay.add(label);
        });

        // Back button
        const backBg = this.add.rectangle(W/2, H - 80, 120, 40, COLORS.WALL).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BALL_HEX).color).setDepth(21).setInteractive({ useHandCursor: true });
        const backTxt = this.add.text(W/2, H - 80, 'BACK', { fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF' }).setOrigin(0.5).setDepth(21);
        backBg.on('pointerdown', () => this.hideSkins());
        this.skinOverlay.add(backBg);
        this.skinOverlay.add(backTxt);
    }

    hideSkins() {
        if (this.skinOverlay) { this.skinOverlay.clear(true, true); this.skinOverlay = null; }
    }
}

// Game HUD functions
function createGameHUD(scene) {
    const W = GAME_CONFIG.GAME_WIDTH;
    // HUD bar background
    scene.hudBar = scene.add.rectangle(W/2, GAME_CONFIG.HUD_HEIGHT/2, W, GAME_CONFIG.HUD_HEIGHT, COLORS.BG, 0.85).setDepth(20);

    scene.scoreText = scene.add.text(16, 24, GameState.score, {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT,
        shadow: { offsetX: 0, offsetY: 0, color: COLORS.UI_SHADOW, blur: 8, fill: true }
    }).setOrigin(0, 0.5).setDepth(21);

    scene.mazeText = scene.add.text(W/2, 24, `Maze ${GameState.currentMaze}`, {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
    }).setOrigin(0.5).setDepth(21);

    // Pause button
    scene.pauseBtn = scene.add.text(W - 28, 24, '| |', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
    }).setOrigin(0.5).setDepth(21).setInteractive(new Phaser.Geom.Rectangle(-22, -22, 44, 44), Phaser.Geom.Rectangle.Contains);
    scene.pauseBtn.on('pointerdown', () => scene.togglePause());

    // Move counter
    scene.moveText = scene.add.text(16, GAME_CONFIG.GAME_HEIGHT - 20, `Moves: 0 / Par: ${scene.level.par}`, {
        fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF', alpha: 0.5
    }).setOrigin(0, 0.5).setDepth(21);

    // Timer bar
    scene.timerBarBg = scene.add.rectangle(W/2, GAME_CONFIG.GAME_HEIGHT - GAME_CONFIG.TIMER_HEIGHT/2, W, GAME_CONFIG.TIMER_HEIGHT, 0x333333).setDepth(20);
    scene.timerBar = scene.add.rectangle(0, GAME_CONFIG.GAME_HEIGHT - GAME_CONFIG.TIMER_HEIGHT/2, W, GAME_CONFIG.TIMER_HEIGHT, COLORS.TIMER_FULL).setOrigin(0, 0.5).setDepth(21);

    // Gem counter icons
    scene.gemIcons = [];
    updateGemCounter(scene);
}

function updateGameHUD(scene) {
    if (scene.scoreText) scene.scoreText.setText(GameState.score);
    if (scene.mazeText) scene.mazeText.setText(`Maze ${GameState.currentMaze}`);
    if (scene.moveText) scene.moveText.setText(`Moves: ${scene.moveCount} / Par: ${scene.level.par}`);
    updateGemCounter(scene);
}

function updateGemCounter(scene) {
    if (!scene.gemIcons) scene.gemIcons = [];
    scene.gemIcons.forEach(i => i.destroy());
    scene.gemIcons = [];
    const total = scene.level.params.gemCount;
    const collected = scene.gemsCollected;
    for (let i = 0; i < total; i++) {
        const x = GAME_CONFIG.GAME_WIDTH - 80 + i * 20;
        const key = i < collected ? 'gem' : 'gem';
        const icon = scene.add.image(x, 24, key).setDisplaySize(16, 16).setDepth(21);
        if (i >= collected) icon.setAlpha(0.3);
        scene.gemIcons.push(icon);
    }
}

function updateTimerBar(scene) {
    const pct = Math.max(0, scene.timerLeft / scene.timerTotal);
    const W = GAME_CONFIG.GAME_WIDTH;
    scene.timerBar.width = W * pct;
    let color = COLORS.TIMER_FULL;
    if (pct < 0.3) color = COLORS.TIMER_LOW;
    else if (pct < 0.6) color = COLORS.TIMER_MID;
    scene.timerBar.fillColor = color;
}

// Pause Menu
function showPauseMenu(scene) {
    scene.pauseOverlay = scene.add.group();
    const W = GAME_CONFIG.GAME_WIDTH, H = GAME_CONFIG.GAME_HEIGHT;
    const bg = scene.add.rectangle(W/2, H/2, W, H, 0x0A0E1A, 0.85).setDepth(30).setInteractive();
    scene.pauseOverlay.add(bg);

    const pTitle = scene.add.text(W/2, 180, 'PAUSED', {
        fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BALL_HEX
    }).setOrigin(0.5).setDepth(31);
    scene.pauseOverlay.add(pTitle);

    const btns = [
        ['RESUME', 260, () => scene.togglePause()],
        ['HOW TO PLAY', 320, () => { scene.scene.launch('HelpScene', { returnTo: 'GameScene' }); }],
        ['RESTART MAZE', 380, () => { scene.paused = false; hidePauseMenu(scene); scene.loadMaze(GameState.currentMaze); scene.updateHUD(); }],
        ['QUIT TO MENU', 440, () => { scene.paused = false; scene.scene.start('MenuScene'); }]
    ];
    btns.forEach(([label, y, cb]) => {
        const btnBg = scene.add.rectangle(W/2, y, 200, 44, COLORS.WALL).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BALL_HEX).color).setDepth(31).setInteractive({ useHandCursor: true });
        const btnTxt = scene.add.text(W/2, y, label, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
        btnBg.on('pointerdown', cb);
        btnTxt.on('pointerdown', cb);
        scene.pauseOverlay.add(btnBg);
        scene.pauseOverlay.add(btnTxt);
    });
}

function hidePauseMenu(scene) {
    if (scene.pauseOverlay) { scene.pauseOverlay.clear(true, true); scene.pauseOverlay = null; }
}

// Game Over
function showGameOver(scene) {
    scene.gameOverGroup = scene.add.group();
    const W = GAME_CONFIG.GAME_WIDTH, H = GAME_CONFIG.GAME_HEIGHT;
    const bg = scene.add.rectangle(W/2, H/2, W, H, 0x0A0E1A, 0.88).setDepth(30).setInteractive();
    scene.gameOverGroup.add(bg);

    scene.cameras.main.shake(200, 0.008);

    const title = scene.add.text(W/2, 160, 'GAME OVER', {
        fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER_HEX,
        stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(31);
    scene.gameOverGroup.add(title);

    // Score with count-up
    const scoreLabel = scene.add.text(W/2, 230, '0', {
        fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GEM_HEX
    }).setOrigin(0.5).setDepth(31);
    scene.gameOverGroup.add(scoreLabel);

    let displayScore = 0;
    const targetScore = GameState.score;
    const countUp = scene.time.addEvent({
        delay: 16, repeat: 60,
        callback: () => {
            displayScore = Math.min(targetScore, displayScore + Math.ceil(targetScore / 60));
            scoreLabel.setText(displayScore);
        }
    });

    // High score
    if (GameState.score >= GameState.highScore) {
        const newBest = scene.add.text(W/2, 280, 'NEW BEST!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.EXIT_HEX
        }).setOrigin(0.5).setDepth(31);
        scene.tweens.add({ targets: newBest, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1 });
        scene.gameOverGroup.add(newBest);
    }

    const mazeReached = scene.add.text(W/2, 310, `Maze Reached: ${GameState.currentMaze}`, {
        fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(31);
    scene.gameOverGroup.add(mazeReached);

    // Buttons
    const adBtn = scene.add.rectangle(W/2, 400, 220, 48, 0x1E3A5F).setStrokeStyle(2, 0x9B30FF).setDepth(31).setInteractive({ useHandCursor: true });
    const adTxt = scene.add.text(W/2, 400, 'WATCH AD: 3 MORE TRIES', { fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    const adCb = () => {
        AdsManager.showRewarded(() => {
            scene.gameOver = false; scene.deaths = 0;
            if (scene.gameOverGroup) { scene.gameOverGroup.clear(true, true); scene.gameOverGroup = null; }
            scene.loadMaze(GameState.currentMaze); scene.updateHUD();
        });
    });
    adBtn.on('pointerdown', adCb);
    adTxt.on('pointerdown', adCb);
    scene.gameOverGroup.add(adBtn); scene.gameOverGroup.add(adTxt);

    const playBtn = scene.add.rectangle(W/2, 460, 200, 48, 0x1E3A5F).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BALL_HEX).color).setDepth(31).setInteractive({ useHandCursor: true });
    const playTxt = scene.add.text(W/2, 460, 'PLAY AGAIN', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    const playCb = () => { scene.scene.start('MenuScene'); };
    playBtn.on('pointerdown', playCb);
    playTxt.on('pointerdown', playCb);
    scene.gameOverGroup.add(playBtn); scene.gameOverGroup.add(playTxt);

    const menuBtn = scene.add.rectangle(W/2, 520, 120, 44, 0x1E3A5F).setStrokeStyle(1, 0x4A9EFF).setDepth(31).setInteractive({ useHandCursor: true });
    const menuTxt = scene.add.text(W/2, 520, 'MENU', { fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF' }).setOrigin(0.5).setDepth(32).setInteractive({ useHandCursor: true });
    const menuCb = () => { scene.scene.start('MenuScene'); };
    menuBtn.on('pointerdown', menuCb);
    menuTxt.on('pointerdown', menuCb);
    scene.gameOverGroup.add(menuBtn); scene.gameOverGroup.add(menuTxt);

    saveGameState();
}
