// hud.js - HUD overlay, pause overlay, score/combo display, landing juice

function setupHUD(scene) {
    const style = { fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#FFFFFF', stroke: '#000', strokeThickness: 2 };
    scene.scoreTxt = scene.add.text(12, 12, GameState.score.toLocaleString(), style).setDepth(40);
    scene.stageTxt = scene.add.text(GAME_WIDTH / 2, 12, `STAGE ${GameState.stage}`, {
        ...style, fontSize: '16px', color: '#00E5FF'
    }).setOrigin(0.5, 0).setDepth(40);

    scene.lifeIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
        const icon = scene.add.image(GAME_WIDTH - 20 - i * 22, 22, 'taxi').setDepth(40).setScale(0.7);
        if (i >= GameState.lives) icon.setTint(0x333333);
        scene.lifeIcons.push(icon);
    }

    scene.comboTxt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '', {
        fontSize: '32px', fontFamily: 'Arial Black', color: '#FFD700',
        stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    const pauseBtn = scene.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 30, '| |', {
        fontSize: '20px', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(40).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p) => { p.event.stopPropagation(); scene.togglePause(); });
}

function updateScoreDisplay(scene) {
    if (scene.scoreTxt) {
        scene.scoreTxt.setText(GameState.score.toLocaleString());
        punchScale(scene, scene.scoreTxt, 1.35, 150);
    }
}

function updateComboDisplay(scene) {
    if (!scene.comboTxt) return;
    if (GameState.combo > 1) {
        const size = Math.min(50, 32 + Math.floor(GameState.combo / 5) * 3);
        scene.comboTxt.setFontSize(size);
        scene.comboTxt.setText(`x${GameState.combo}`);
        scene.comboTxt.setAlpha(1);
        punchScale(scene, scene.comboTxt, 1.2, 100);
    } else {
        scene.comboTxt.setAlpha(0);
    }
}

function updateLives(scene) {
    if (!scene.lifeIcons) return;
    scene.lifeIcons.forEach((icon, i) => {
        icon.setTint(i < GameState.lives ? 0xFFD600 : 0x333333);
    });
}

function drawPowerArc(scene, progress) {
    scene.powerArc.clear();
    const ang = progress * 270;
    scene.powerArc.lineStyle(3, 0x00E5FF, 0.5 + Math.sin(scene.time.now / 150) * 0.3);
    scene.powerArc.beginPath();
    const cx = scene.taxi.x;
    const cy = scene.taxi.y;
    const r = 22;
    for (let i = 0; i <= ang; i += 5) {
        const a = Phaser.Math.DegToRad(i - 135);
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) scene.powerArc.moveTo(px, py);
        else scene.powerArc.lineTo(px, py);
    }
    scene.powerArc.strokePath();
}

function applyLandingJuice(scene, lx, ly, quality, points) {
    if (quality === 'bullseye') {
        spawnLandingBurst(scene, lx, ly, PALETTE.BULLSEYE_HEX, 30 + GameState.combo * 3);
        shakeCamera(scene, 4, 150);
        flashCamera(scene, 0xFFFFFF, 60, 0.4);
        scene.cameras.main.zoomTo(1.04, 100, 'Power2', true, (cam, p) => {
            if (p === 1) scene.cameras.main.zoomTo(1, 100);
        });
    } else if (quality === 'good') {
        spawnLandingBurst(scene, lx, ly, PALETTE.INNER_HEX, 20 + GameState.combo * 2);
        shakeCamera(scene, 3, 100);
    } else if (quality === 'ok') {
        spawnLandingBurst(scene, lx, ly, PALETTE.OUTER_HEX, 12);
    } else if (quality === 'miss') {
        flashCamera(scene, PALETTE.DANGER_HEX, 100, 0.4);
        shakeCamera(scene, 5, 150);
    }

    if (points > 0) {
        const color = quality === 'bullseye' ? '#FF2D7B' : quality === 'good' ? '#FF8C00' : '#4DB6AC';
        showFloatingScore(scene, lx, ly - 20, `+${points}`, color);
    }
}

// togglePause is defined in game.js as a class method

function showPauseOverlay(scene) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const c = scene.add.container(0, 0).setDepth(60);

    c.add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8));
    c.add(scene.add.text(cx, cy - 100, 'PAUSED', {
        fontSize: '36px', fontFamily: 'Arial Black', color: '#FFFFFF'
    }).setOrigin(0.5));

    const resumeBtn = scene.add.rectangle(cx, cy, 200, 48, 0x00E5FF, 0.2)
        .setStrokeStyle(2, 0x00E5FF).setInteractive();
    const resumeTxt = scene.add.text(cx, cy, 'RESUME', {
        fontSize: '22px', fontFamily: 'Arial Black', color: '#00E5FF'
    }).setOrigin(0.5);
    resumeTxt.disableInteractive();
    resumeBtn.on('pointerdown', () => scene.togglePause());
    c.add([resumeBtn, resumeTxt]);

    const restartBtn = scene.add.rectangle(cx, cy + 60, 200, 40, 0x333333, 0.5)
        .setStrokeStyle(1, 0x666666).setInteractive();
    const restartTxt = scene.add.text(cx, cy + 60, 'RESTART', {
        fontSize: '18px', color: '#FFFFFF'
    }).setOrigin(0.5);
    restartTxt.disableInteractive();
    restartBtn.on('pointerdown', () => { GameState.reset(); scene.scene.restart(); });
    c.add([restartBtn, restartTxt]);

    const menuBtn = scene.add.rectangle(cx, cy + 110, 160, 36, 0x333333, 0.3)
        .setStrokeStyle(1, 0x444444).setInteractive();
    const menuTxt = scene.add.text(cx, cy + 110, 'MENU', {
        fontSize: '16px', color: '#AAAAAA'
    }).setOrigin(0.5);
    menuTxt.disableInteractive();
    menuBtn.on('pointerdown', () => { audioSynth.stopMusic(); scene.scene.start('MenuScene'); });
    c.add([menuBtn, menuTxt]);

    const helpBtn = scene.add.text(cx, cy + 160, '? Help', {
        fontSize: '16px', color: '#FFD700'
    }).setOrigin(0.5).setInteractive();
    helpBtn.on('pointerdown', () => {
        scene.scene.pause();
        scene.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    c.add(helpBtn);

    scene.pauseOverlay = c;
}
