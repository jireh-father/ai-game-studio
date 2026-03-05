// input.js - Swipe/tap detection, steal logic, bomb hits, boss cracks
const InputHandler = {
    init(scene) {
        scene.pointerData = { down: false, startX: 0, startY: 0, startTime: 0 };
        scene.input.on('pointerdown', (p) => InputHandler.onDown(scene, p));
        scene.input.on('pointerup', (p) => InputHandler.onUp(scene, p));
    },

    onDown(scene, p) {
        if (scene.isDead || scene.isPaused) return;
        scene.pointerData = { down: true, startX: p.x, startY: p.y, startTime: scene.time.now };
    },

    onUp(scene, p) {
        if (scene.isDead || scene.isPaused || !scene.pointerData.down) return;
        scene.pointerData.down = false;
        scene.lastInputTime = scene.time.now;

        const dx = p.x - scene.pointerData.startX;
        const dy = p.y - scene.pointerData.startY;
        const dt = scene.time.now - scene.pointerData.startTime;

        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2 && dt < 500) {
            InputHandler.onSwipe(scene, p);
        } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
            InputHandler.onTap(scene, p);
        }
    },

    onSwipe(scene, p) {
        Effects.swipeTrail(scene, scene.player.x + 20, scene.player.y);
        Effects.scalePunch(scene, scene.player, 1.2, 100);
        if (navigator.vibrate) navigator.vibrate(10);

        const zoneLeft = scene.playRight * (0.5 - SCORING.stealZone / 2);
        const zoneRight = scene.playRight * (0.5 + SCORING.stealZone / 2);
        const perfectLeft = scene.playRight * (0.5 - SCORING.perfectZone / 2);
        const perfectRight = scene.playRight * (0.5 + SCORING.perfectZone / 2);

        let stolen = false;
        for (const obs of scene.obstacles) {
            if (!obs || obs.obstacleData.stolen || obs.obstacleData.passed) continue;
            if (obs.x >= zoneLeft && obs.x <= zoneRight) {
                if (obs.obstacleData.type === 'bomb') {
                    InputHandler.hitBomb(scene, obs); return;
                }
                const isPerfect = obs.x >= perfectLeft && obs.x <= perfectRight;
                if (obs.obstacleData.type === 'boss') {
                    InputHandler.hitBoss(scene, obs, isPerfect); stolen = true; break;
                }
                InputHandler.stealTime(scene, obs, isPerfect); stolen = true; break;
            }
        }
        if (!stolen) scene.chain = 0;
    },

    stealTime(scene, obs, perfect) {
        obs.obstacleData.stolen = true;
        const tv = obs.obstacleData.timeValue;
        scene.timer += tv;
        scene.totalStolen += tv;
        scene.chain++;
        scene.stealCount++;

        let mult = 1;
        for (let i = SCORING.chainThresholds.length - 1; i >= 0; i--) {
            if (scene.chain >= SCORING.chainThresholds[i]) {
                mult = SCORING.chainMultipliers[i]; break;
            }
        }
        const base = perfect ? SCORING.perfectBase : SCORING.stealBase;
        const pts = base * tv * mult;
        scene.score += pts;

        Effects.stealParticles(scene, obs.x, obs.y, scene.chain);
        Effects.cameraZoomPunch(scene);
        Effects.floatingText(scene, obs.x, obs.y - 20, `+${tv}s`, '#00E676');
        Effects.floatingText(scene, obs.x, obs.y + 20, `+${pts}`, '#FFFFFF');
        Effects.comboGlow(scene, scene.player, scene.chain);
        Effects.comboText(scene, scene.chain);
        if (perfect) Effects.screenShake(scene, 0.003, 100);

        const uiScene = scene.scene.get('UIScene');
        if (uiScene) { uiScene.punchScore(); uiScene.punchTimer(); }

        scene.hitStop(40);
        scene.destroyObstacle(obs);
        scene.obstacles = scene.obstacles.filter(o => o !== obs);

        if (scene.stealCount >= 10) scene.stageClear();
    },

    hitBoss(scene, obs, perfect) {
        obs.obstacleData.hp--;
        const hitNum = 3 - obs.obstacleData.hp;
        Effects.bosscrackEffect(scene, obs.x, obs.y, hitNum);
        Effects.screenShake(scene, 0.008, 200);
        scene.hitStop(50);
        obs.setScale(obs.scaleX * 0.85);

        if (obs.pips && obs.pips[hitNum - 1]) obs.pips[hitNum - 1].setFillStyle(0x333333);

        if (obs.obstacleData.hp <= 0) {
            obs.obstacleData.stolen = true;
            scene.timer += obs.obstacleData.timeValue;
            scene.totalStolen += obs.obstacleData.timeValue;
            scene.score += SCORING.bossCrack;
            scene.stealCount++;
            scene.chain++;
            Effects.floatingText(scene, obs.x, obs.y - 30, `+${obs.obstacleData.timeValue}s`, '#FFD700');
            Effects.floatingText(scene, obs.x, obs.y + 10, `+${SCORING.bossCrack}`, '#FFD700');
            scene.destroyObstacle(obs);
            scene.obstacles = scene.obstacles.filter(o => o !== obs);
            scene.afterBoss = 3;
            if (scene.stealCount >= 10) scene.stageClear();
        }
    },

    hitBomb(scene, obs) {
        scene.timer -= 2;
        scene.chain = 0;
        obs.obstacleData.stolen = true;
        Effects.damageFlash(scene);
        Effects.screenShake(scene, 0.006, 150);
        Effects.floatingText(scene, obs.x, obs.y, '-2s', '#FF1744', true);
        Effects.playerFlinch(scene, scene.player);
        Effects.comboGlow(scene, scene.player, 0);
        if (navigator.vibrate) navigator.vibrate(30);
        scene.destroyObstacle(obs);
        scene.obstacles = scene.obstacles.filter(o => o !== obs);
        if (scene.timer <= 0) { scene.timer = 0; scene.die(); }
    },

    onTap(scene, p) {
        if (scene.isDodging) return;
        scene.isDodging = true;
        if (navigator.vibrate) navigator.vibrate(5);
        Effects.bombDodgeParticles(scene, scene.player.x, scene.player.y);

        scene.tweens.add({
            targets: scene.player, y: scene.playerBaseY - 60, duration: 100,
            yoyo: true, ease: 'Power2',
            onComplete: () => { scene.isDodging = false; scene.player.y = scene.playerBaseY; }
        });
        scene.score += SCORING.bombDodge;
    }
};
