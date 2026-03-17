// HUD overlay, pause menu, floating text, and particle effects for GameScene

const HUD = {
    create(scene) {
        const w = CONFIG.WIDTH;
        const style = { fontSize: '18px', fontFamily: 'Arial', fill: '#F0EDE8' };
        scene.scoreText = scene.add.text(12, 14, `Score: ${scene.score}`, style).setDepth(10);
        scene.stageText = scene.add.text(w / 2, 14, `Stage ${scene.stage}`, { ...style, fill: '#FFE234' }).setOrigin(0.5, 0).setDepth(10);
        scene.idleText = scene.add.text(w - 12, 14, '', { fontSize: '14px', fontFamily: 'Arial', fill: '#888' }).setOrigin(1, 0).setDepth(10);

        scene.meterBg = scene.add.rectangle(12, 46, 320, 10, COLORS.METER_BG).setOrigin(0, 0).setDepth(10);
        scene.meterFill = scene.add.rectangle(12, 46, 0, 10, COLORS.METER_FILL).setOrigin(0, 0).setDepth(11);
        scene.add.text(12, 58, 'NOISE', { fontSize: '10px', fill: '#888' }).setDepth(10);

        scene.comboText = scene.add.text(w / 2, 78, '', { fontSize: '26px', fontFamily: 'Arial', fill: '#FFE234', fontStyle: 'bold' }).setOrigin(0.5).setDepth(10);

        const pauseBg = scene.add.rectangle(w - 30, 80, 40, 40, 0x333333, 0.6).setInteractive({ useHandCursor: true }).setDepth(15);
        scene.add.text(w - 30, 80, '||', { fontSize: '18px', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).setDepth(15).disableInteractive();
        pauseBg.on('pointerdown', () => scene.togglePause());

        scene.quotaText = scene.add.text(w / 2, CONFIG.SHELF_Y + CONFIG.ITEM_HEIGHT + 28, '', { fontSize: '13px', fill: '#AAA' }).setOrigin(0.5).setDepth(10);
    },

    updateMeter(scene) {
        const pct = Phaser.Math.Clamp(scene.wakeMeter / CONFIG.METER_MAX, 0, 1);
        scene.meterFill.width = 320 * pct;
        scene.meterFill.setFillStyle(pct > 0.7 ? COLORS.METER_DANGER : COLORS.METER_FILL);
        if (pct > 0.7) {
            if (!scene.meterPulse) {
                scene.meterPulse = scene.tweens.add({ targets: scene.meterFill, scaleY: 1.3, duration: 300, yoyo: true, repeat: -1 });
            }
        } else if (scene.meterPulse) {
            scene.meterPulse.stop(); scene.meterFill.setScale(1); scene.meterPulse = null;
        }
    },

    updateQuota(scene) {
        const q = scene.currentStageData ? scene.currentStageData.quota : 0;
        scene.quotaText.setText(`${scene.itemsKnockedThisStage}/${q} items`);
    },

    updateIdle(scene, idleSeconds) {
        const remaining = CONFIG.IDLE_DEATH_SECONDS - idleSeconds;
        if (idleSeconds >= CONFIG.IDLE_WARN_RED) {
            scene.idleText.setText(`Zzz ${remaining}s`).setColor('#FF3333');
        } else if (idleSeconds >= CONFIG.IDLE_WARN_YELLOW) {
            scene.idleText.setText(`Zzz ${remaining}s`).setColor('#FFE234');
        } else {
            scene.idleText.setText(`Zzz ${remaining}s`).setColor('#888');
        }
    },

    showFloating(scene, x, y, text, color, size) {
        const txt = scene.add.text(x, y, text, { fontSize: `${size}px`, fontFamily: 'Arial', fill: color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(25);
        scene.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
    },

    spawnParticles(scene, x, y, tier, dir) {
        const color = TIER_COLORS_INT[tier] || 0xFFFFFF;
        const count = scene.comboCount >= 2 ? 12 + scene.comboCount * 4 : 8;
        for (let i = 0; i < count; i++) {
            const angle = dir === 'right' ? Phaser.Math.Between(-30, 30) : Phaser.Math.Between(150, 210);
            const speed = Phaser.Math.Between(80, 180);
            const rad = Phaser.Math.DegToRad(angle);
            const p = scene.add.rectangle(x, y, 6, 6, color).setDepth(15);
            scene.tweens.add({
                targets: p, x: x + Math.cos(rad) * speed, y: y + Math.sin(rad) * speed,
                alpha: 0, scaleX: 0, scaleY: 0, duration: 350, onComplete: () => p.destroy()
            });
        }
    },

    showPause(scene) {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        scene.pauseGroup = scene.add.container(0, 0).setDepth(50);
        scene.pauseGroup.add(scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75));
        scene.pauseGroup.add(scene.add.text(w / 2, 200, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5));

        const makeBtn = (y, label, color, cb) => {
            const bg = scene.add.rectangle(w / 2, y, 200, 48, color).setInteractive({ useHandCursor: true });
            scene.add.text(w / 2, y, label, { fontSize: '18px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
            bg.on('pointerdown', cb);
            scene.pauseGroup.add([bg, scene.pauseGroup.last]);
        };

        const addPauseBtn = (y, label, color, cb) => {
            const bg = scene.add.rectangle(w / 2, y, 200, 48, color).setInteractive({ useHandCursor: true });
            const txt = scene.add.text(w / 2, y, label, { fontSize: '18px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
            txt.disableInteractive();
            bg.on('pointerdown', cb);
            scene.pauseGroup.add([bg, txt]);
        };

        addPauseBtn(280, 'RESUME', 0x27AE60, () => scene.togglePause());
        addPauseBtn(345, '? Help', 0x2980B9, () => { scene.scene.launch('HelpScene', { returnTo: 'GameScene' }); });
        addPauseBtn(410, 'RESTART', 0xE67E22, () => { HUD.hidePause(scene); scene.scene.stop('GameScene'); scene.scene.start('GameScene'); });
        addPauseBtn(475, 'QUIT', 0xC0392B, () => { HUD.hidePause(scene); scene.scene.stop('GameScene'); scene.scene.start('MenuScene'); });
    },

    hidePause(scene) {
        if (scene.pauseGroup) { scene.pauseGroup.destroy(true); scene.pauseGroup = null; }
        scene.isPaused = false;
        scene.lastSwipeTime = Date.now();
    },

    stageClearEffects(scene) {
        HUD.showFloating(scene, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'STAGE CLEAR!', '#FFD700', 28);
        scene.cameras.main.flash(200, 255, 215, 0, true);
        for (let i = 0; i < 20; i++) {
            const sx = CONFIG.WIDTH / 2 + Phaser.Math.Between(-120, 120);
            const sy = CONFIG.HEIGHT / 2 + Phaser.Math.Between(-60, 60);
            const star = scene.add.circle(sx, sy, 4, 0xFFD700).setDepth(30);
            scene.tweens.add({
                targets: star, y: sy + Phaser.Math.Between(40, 120), alpha: 0,
                scaleX: 0, scaleY: 0, duration: 800, delay: i * 30,
                onComplete: () => star.destroy()
            });
        }
    }
};
