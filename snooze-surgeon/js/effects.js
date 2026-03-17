// Effects and sound utilities for GameScene
// These are mixed into GameScene prototype

function spawnParticles(scene, x, y, key, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 140;
        const p = scene.add.image(x, y, key).setScale(0.8);
        scene.tweens.add({
            targets: p,
            x: x + Math.cos(angle) * speed * 0.4,
            y: y + Math.sin(angle) * speed * 0.4 + 20,
            alpha: 0, scale: 0,
            duration: 350 + Math.random() * 100,
            onComplete: () => p.destroy()
        });
    }
}

function playGameSound(scene, type) {
    if (!GameState.soundEnabled) return;
    try {
        const ctx = scene.sound.context;
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime;

        switch (type) {
            case 'honk':
                osc.type = 'sine'; osc.frequency.setValueAtTime(300, t);
                osc.frequency.exponentialRampToValueAtTime(150, t + 0.18);
                gain.gain.setValueAtTime(0.3, t); gain.gain.linearRampToValueAtTime(0, t + 0.18);
                osc.start(t); osc.stop(t + 0.18); break;
            case 'squelch':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200 + Math.random() * 30, t);
                osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
                gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t); osc.stop(t + 0.2); break;
            case 'sad':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t);
                osc.frequency.linearRampToValueAtTime(200, t + 0.25);
                gain.gain.setValueAtTime(0.15, t); gain.gain.linearRampToValueAtTime(0, t + 0.25);
                osc.start(t); osc.stop(t + 0.25); break;
            case 'snore':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, t);
                osc.frequency.linearRampToValueAtTime(40, t + 0.6);
                gain.gain.setValueAtTime(0.4, t); gain.gain.linearRampToValueAtTime(0, t + 0.6);
                osc.start(t); osc.stop(t + 0.6); break;
            case 'stageClear':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, t);
                osc.frequency.setValueAtTime(659, t + 0.15);
                osc.frequency.setValueAtTime(784, t + 0.3);
                osc.frequency.setValueAtTime(1047, t + 0.45);
                gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0, t + 0.7);
                osc.start(t); osc.stop(t + 0.7); break;
            case 'gameOver':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t);
                osc.frequency.linearRampToValueAtTime(50, t + 0.9);
                gain.gain.setValueAtTime(0.3, t); gain.gain.linearRampToValueAtTime(0, t + 0.9);
                osc.start(t); osc.stop(t + 0.9); break;
        }
    } catch (e) {}
}

function showSnoreEffects(scene) {
    // Strong screen shake on life loss
    scene.cameras.main.shake(300, 0.02);

    // Patient shake - more dramatic
    scene.tweens.add({
        targets: scene.patient, x: scene.patient.x + 12,
        duration: 40, yoyo: true, repeat: 7
    });

    // Red vignette
    const vignette = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0);
    scene.tweens.add({
        targets: vignette, alpha: 0.4, duration: 200, yoyo: true,
        onComplete: () => vignette.destroy()
    });

    // ZZZ cloud
    const cloud = scene.add.image(90, 230, 'zzz_cloud').setScale(0.5);
    scene.tweens.add({ targets: cloud, scaleX: 1.2, scaleY: 1.2, duration: 200 });
    scene.tweens.add({
        targets: cloud, y: 190, alpha: 0, duration: 800, delay: 400,
        onComplete: () => cloud.destroy()
    });

    // Tool fly-off
    scene.scalpel.setVisible(true).setPosition(GAME_WIDTH / 2, 400).setAlpha(1).setAngle(0);
    scene.tweens.add({
        targets: scene.scalpel, x: GAME_WIDTH + 40, y: -40, angle: 540, alpha: 0,
        duration: 600, onComplete: () => scene.scalpel.setVisible(false)
    });
}

function showNoseTapEffects(scene) {
    // Scale punch
    scene.tweens.add({ targets: scene.noseZone, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });

    // Particles
    spawnParticles(scene, 80, 292, 'particle_pink', 20);

    // Camera shake
    scene.cameras.main.shake(120, 0.003);

    // Hit-stop (use setTimeout, NOT delayedCall)
    scene.time.timeScale = 0;
    setTimeout(() => { if (scene.scene.isActive()) scene.time.timeScale = 1; }, 35);

    // Camera zoom
    scene.cameras.main.zoomTo(1.03, 80);
    scene.time.delayedCall(180, () => scene.cameras.main.zoomTo(1.0, 180));

    // Meter reset flash
    const flash = scene.add.rectangle(GAME_WIDTH / 2, 70, GAME_WIDTH - 28, 28, 0xFFFFFF, 0.8);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
}

function showOrganTapEffects(scene, x, y, points, dangerBonus, comboStreak, mult) {
    // Score punch on HUD
    scene.tweens.add({ targets: scene.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });

    // Floating score text with stroke for visibility
    const color = dangerBonus > 0 ? COLORS.DANGER : '#FFFFFF';
    const label = dangerBonus > 0 ? '+' + points + ' DANGER!' : '+' + points;
    const fSize = dangerBonus > 0 ? '26px' : '22px';
    const floatTxt = scene.add.text(x, y - 10, label, {
        fontSize: fSize, fontFamily: 'monospace', fontStyle: 'bold', color: color,
        stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(50);
    scene.tweens.add({
        targets: floatTxt, y: y - 70, alpha: 0, duration: 650,
        ease: 'Quad.easeOut', onComplete: () => floatTxt.destroy()
    });

    // Particles
    const pKey = comboStreak >= 5 ? 'particle_gold' : 'particle_green';
    const pCount = 12 + (comboStreak >= 3 ? 8 : 0) + (comboStreak >= 8 ? 8 : 0);
    spawnParticles(scene, x, y, pKey, pCount);

    // Screen shake
    const shakeI = 0.003 + (comboStreak >= 8 ? 0.002 : 0);
    scene.cameras.main.shake(120, shakeI);

    // Combo text
    if (mult > 1) {
        scene.comboText.setText('x' + mult + '!');
        scene.comboText.setAlpha(1).setScale(0.5);
        scene.tweens.add({ targets: scene.comboText, scaleX: 1.2, scaleY: 1.2, duration: 150, yoyo: true });
        scene.tweens.add({ targets: scene.comboText, alpha: 0, duration: 1500, delay: 200 });
    }
}

function showStageBannerEffect(scene, stage, isRestStage) {
    const banner = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'STAGE ' + stage, {
        fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
    }).setOrigin(0.5).setAlpha(0);

    scene.tweens.add({
        targets: banner, alpha: 1, scaleX: 1.2, scaleY: 1.2,
        duration: 300, yoyo: true, hold: 400,
        onComplete: () => banner.destroy()
    });

    if (isRestStage) {
        const rest = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Breather!', {
            fontSize: '18px', fontFamily: 'monospace', color: COLORS.BTN_PRIMARY
        }).setOrigin(0.5).setAlpha(0);
        scene.tweens.add({
            targets: rest, alpha: 1, duration: 300, yoyo: true, hold: 600,
            onComplete: () => rest.destroy()
        });
    }
}

function showStageFlash(scene) {
    const flash = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0);
    scene.tweens.add({ targets: flash, alpha: 0.4, duration: 150, yoyo: true, onComplete: () => flash.destroy() });
}

function showPauseOverlay(scene) {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    scene.pauseGroup = scene.add.group();

    const bg = scene.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.85)
        .setInteractive().setDepth(100);
    scene.pauseGroup.add(bg);

    const title = scene.add.text(w / 2, 200, 'PAUSED', {
        fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
    }).setOrigin(0.5).setDepth(101);
    scene.pauseGroup.add(title);

    const btns = [
        { label: 'Resume', y: 300, color: 0x06D6A0, action: () => scene.togglePause() },
        { label: '? How to Play', y: 370, color: 0x495057, action: () => {
            hidePauseOverlay(scene);
            scene.paused = false;
            scene.scene.pause('GameScene');
            scene.scene.launch('HelpScene', { returnTo: 'GameScene' });
        }},
        { label: 'Restart', y: 440, color: 0x495057, action: () => {
            hidePauseOverlay(scene);
            GameState.reset();
            scene.scene.stop('GameScene');
            scene.scene.start('GameScene');
        }},
        { label: 'Menu', y: 510, color: 0x495057, action: () => {
            hidePauseOverlay(scene);
            scene.scene.stop('GameScene');
            scene.scene.start('MenuScene');
        }}
    ];

    for (const b of btns) {
        const rect = scene.add.rectangle(w / 2, b.y, 180, 48, b.color)
            .setInteractive({ useHandCursor: true }).setDepth(101);
        rect.on('pointerdown', b.action);
        scene.pauseGroup.add(rect);

        const txt = scene.add.text(w / 2, b.y, b.label, {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
            color: b.color === 0x06D6A0 ? '#0D1B2A' : COLORS.HUD_TEXT
        }).setOrigin(0.5).setDepth(102).disableInteractive();
        scene.pauseGroup.add(txt);
    }
}

function hidePauseOverlay(scene) {
    if (scene.pauseGroup) {
        scene.pauseGroup.clear(true, true);
        scene.pauseGroup = null;
    }
}
