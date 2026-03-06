// stages.js - Stage generation, vehicle mix, difficulty scaling, collision & crash effects

const StageManager = {
    getStageParams: function(stage) {
        return {
            carsToClear: Math.min(40, Math.floor(10 + (stage - 1) * 2.5)),
            spawnIntervalMs: Math.max(600, 2000 - stage * 80),
            baseCarSpeed: Math.min(3.5, 1.0 + stage * 0.08),
            laneCount: stage >= 11 ? 2 : 1,
            malfunctionChance: stage <= 20 ? 0 : Math.min(0.10, (stage - 20) * 0.02),
            isRushHour: stage > 1 && stage % 10 === 0,
            isRestBeat: stage > 1 && stage % 5 === 0,
            stage: stage
        };
    },

    getVehicleMix: function(stage) {
        if (stage <= 3)  return { sedan: 1.0, truck: 0.0, sports: 0.0, ambulance: 0.0 };
        if (stage <= 6)  return { sedan: 0.7, truck: 0.3, sports: 0.0, ambulance: 0.0 };
        if (stage <= 10) return { sedan: 0.5, truck: 0.2, sports: 0.3, ambulance: 0.0 };
        if (stage <= 15) return { sedan: 0.4, truck: 0.2, sports: 0.2, ambulance: 0.2 };
        if (stage <= 20) return { sedan: 0.3, truck: 0.2, sports: 0.3, ambulance: 0.2 };
        return { sedan: 0.25, truck: 0.2, sports: 0.3, ambulance: 0.25 };
    },

    getVehicleType: function(stage) {
        const mix = this.getVehicleMix(stage);
        let r = Math.random(), cumulative = 0;
        for (const type of ['sedan', 'truck', 'sports', 'ambulance']) {
            cumulative += mix[type];
            if (r <= cumulative) return type;
        }
        return 'sedan';
    },

    getSpawnDirection: function(recentSpawns) {
        const dirs = ['N', 'S', 'E', 'W'];
        const pressure = { N: 4, S: 4, E: 4, W: 4 };
        for (let i = 0; i < recentSpawns.length; i++) {
            pressure[recentSpawns[recentSpawns.length - 1 - i]] -= (i < 2 ? 3 : 1);
        }
        if (recentSpawns.length >= 2 && recentSpawns[recentSpawns.length - 1] === recentSpawns[recentSpawns.length - 2]) {
            pressure[recentSpawns[recentSpawns.length - 1]] = 0;
        }
        let minDir = dirs[0], minP = pressure[dirs[0]];
        for (const d of dirs) { if (pressure[d] < minP) { minP = pressure[d]; minDir = d; } }
        const candidates = dirs.filter(d => d !== minDir && pressure[d] > 0);
        if (candidates.length === 0) return dirs[Math.floor(Math.random() * 4)];
        let total = 0;
        candidates.forEach(d => total += Math.max(0, pressure[d]));
        let rand = Math.random() * total;
        for (const d of candidates) { rand -= Math.max(0, pressure[d]); if (rand <= 0) return d; }
        return candidates[candidates.length - 1];
    },

    advanceStage: function(scene) {
        if (scene.stageTransitioning) return;
        scene.stageTransitioning = true;
        const wasPerfect = scene.stageCrashes === 0;
        GameState.score += CONFIG.SCORING.STAGE_CLEAR_MULT * GameState.stage;
        scene.showFloatText(scene.cx, scene.cy - 60, '+' + (CONFIG.SCORING.STAGE_CLEAR_MULT * GameState.stage) + ' CLEAR!', CONFIG.COLORS.COMBO_GOLD);
        if (wasPerfect) {
            GameState.score += CONFIG.SCORING.PERFECT_STAGE_MULT * GameState.stage;
            scene.showFloatText(scene.cx, scene.cy - 90, '+' + (CONFIG.SCORING.PERFECT_STAGE_MULT * GameState.stage) + ' PERFECT!', CONFIG.COLORS.COMBO_GOLD);
            CrashEffects.spawnParticleBurst(scene, scene.cx, scene.cy, 0xFFD700, 30);
        }
        GameState.stage++;
        scene.carsPassed = 0;
        scene.stageCrashes = 0;
        const prev = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE) || '0');
        if (GameState.stage > prev) localStorage.setItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE, GameState.stage);

        const stageLabel = scene.add.text(scene.cx, -40, 'STAGE ' + GameState.stage, {
            fontSize: '36px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(25);
        const flash = scene.add.rectangle(scene.cx, scene.cy, CONFIG.LAYOUT.INTERSECTION_SIZE, CONFIG.LAYOUT.INTERSECTION_SIZE, 0x4CAF50, 0.4).setDepth(3);
        scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

        scene.tweens.add({
            targets: stageLabel, y: scene.cy, duration: 400, ease: 'Bounce.easeOut',
            onComplete: function() {
                const params = StageManager.getStageParams(GameState.stage);
                const delay = params.isRestBeat ? CONFIG.TIMING.REST_BEAT_MS : CONFIG.TIMING.STAGE_ANNOUNCE_MS;
                if (params.isRushHour) {
                    stageLabel.setText('RUSH HOUR!').setColor(CONFIG.COLORS.DANGER_RED).setFontSize(40);
                    let sc = 0;
                    const si = setInterval(function() {
                        stageLabel.x = scene.cx + (Math.random() - 0.5) * 8;
                        stageLabel.y = scene.cy + (Math.random() - 0.5) * 8;
                        if (++sc > 16) clearInterval(si);
                    }, 50);
                    for (let f = 0; f < 3; f++) {
                        const b = scene.add.rectangle(scene.cx, scene.cy, scene.scale.width, scene.scale.height).setStrokeStyle(6, 0xFF6D00).setFillStyle(0, 0).setDepth(24);
                        scene.tweens.add({ targets: b, alpha: 0, duration: 150, delay: f * 300, onComplete: () => b.destroy() });
                    }
                }
                setTimeout(function() {
                    if (!scene.scene || !scene.scene.isActive()) return;
                    stageLabel.destroy();
                    scene.stageTransitioning = false;
                    scene.setupSpawnTimer();
                    if (params.isRushHour) {
                        const rs = scene.time.addEvent({ delay: params.spawnIntervalMs / 2, callback: () => scene.spawnNextCar(), loop: true });
                        setTimeout(function() {
                            if (!scene.scene || !scene.scene.isActive()) return;
                            rs.destroy();
                            GameState.score += CONFIG.SCORING.RUSH_HOUR_BONUS;
                            scene.showFloatText(scene.cx, scene.cy, '+' + CONFIG.SCORING.RUSH_HOUR_BONUS + ' RUSH BONUS!', CONFIG.COLORS.COMBO_GOLD);
                        }, 5000);
                    }
                }, delay);
            }
        });
    }
};

// Crash and visual effects helper
const CrashEffects = {
    spawnDebris: function(scene, x, y, count) {
        for (let i = 0; i < count; i++) {
            const key = CONFIG.DEBRIS_ITEMS[Math.floor(Math.random() * CONFIG.DEBRIS_ITEMS.length)];
            const d = scene.add.image(x, y, key).setDisplaySize(16, 16).setDepth(18);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            scene.tweens.add({
                targets: d, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed + 100,
                angle: 180 + Math.random() * 540, alpha: 0, duration: 1200, ease: 'Quad.easeOut', onComplete: () => d.destroy()
            });
        }
    },

    spawnSmoke: function(scene, x, y) {
        for (let i = 0; i < 4; i++) {
            const s = scene.add.circle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 8, 0x9E9E9E, 0.6).setDepth(14);
            scene.tweens.add({ targets: s, scaleX: 3, scaleY: 3, y: s.y - 30, alpha: 0, duration: 600, onComplete: () => s.destroy() });
        }
    },

    screenFlash: function(scene, color, alpha) {
        const f = scene.add.rectangle(scene.cx, scene.cy, scene.scale.width, scene.scale.height, color, alpha || 0.8).setDepth(25);
        scene.tweens.add({ targets: f, alpha: 0, duration: 150, onComplete: () => f.destroy() });
    },

    explosion: function(scene, x, y) {
        const e = scene.add.circle(x, y, 10, 0xFF6D00).setDepth(15);
        scene.tweens.add({ targets: e, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 400, onComplete: () => e.destroy() });
    },

    spawnParticleBurst: function(scene, x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const p = scene.add.circle(x, y, 4, color).setDepth(20);
            const angle = (i / count) * Math.PI * 2;
            const dist = 60 + Math.random() * 80;
            scene.tweens.add({ targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, alpha: 0, duration: 1000, onComplete: () => p.destroy() });
        }
    },

    nearMissSparks: function(scene, x, y) {
        for (let i = 0; i < 8; i++) {
            const p = scene.add.circle(x, y, 4, 0xFFD600).setDepth(15);
            const angle = (i / 8) * Math.PI * 2;
            scene.tweens.add({ targets: p, x: x + Math.cos(angle) * 60, y: y + Math.sin(angle) * 60, alpha: 0, duration: 400, onComplete: () => p.destroy() });
        }
    },

    destroyCrashedCar: function(scene, car) {
        scene.tweens.add({ targets: car, scaleX: car.scaleX * 1.5, scaleY: car.scaleY * 1.5, duration: 100 });
        car.setTint(0xFF1744);
        scene.tweens.add({ targets: car, alpha: 0, duration: 400, delay: 100 });
    }
};
