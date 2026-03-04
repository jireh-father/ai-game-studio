// stages.js — Stage generation, difficulty scaling, enemy spawning

const Stages = {
    getStageConfig(stage) {
        const radius = Math.max(
            CONFIG.PLATFORM.MIN_RADIUS,
            CONFIG.PLATFORM.BASE_RADIUS - (stage - 1) * CONFIG.PLATFORM.SHRINK_PER_STAGE
        );
        const enemyCount = Math.min(6, Math.ceil(1 + stage * 0.4));
        const isRestStage = stage > 1 && stage % 5 === 0;

        let spinDrain;
        if (stage <= 5) spinDrain = 8;
        else if (stage <= 10) spinDrain = 10;
        else if (stage <= 20) spinDrain = 12;
        else spinDrain = 15;
        if (isRestStage) spinDrain = Math.max(5, spinDrain - 3);

        const speedMult = Math.min(2.0, 1.0 + (stage - 1) * 0.05);
        const enemies = this.getEnemyMix(stage, enemyCount);
        const positions = this.getSpawnPositions(enemies.length, radius);

        return {
            stage, platformRadius: radius, enemyCount: enemies.length,
            enemies: enemies.map((type, i) => ({ type, ...positions[i] })),
            spinDrain, speedMult, isRestStage,
        };
    },

    getEnemyMix(stage, count) {
        const types = [];
        let heavyCount = 0;
        if (stage >= 18) heavyCount = Math.min(2, count - 1);
        else if (stage >= 13) heavyCount = 1;

        for (let i = 0; i < heavyCount; i++) types.push('HEAVY');

        const remaining = count - heavyCount;
        for (let i = 0; i < remaining; i++) {
            const roll = Math.random();
            if (stage >= 8 && roll < 0.15) types.push('BOUNCER');
            else if (stage >= 4 && roll < this.getChaserRatio(stage)) types.push('CHASER');
            else types.push('DRIFTER');
        }
        return types;
    },

    getChaserRatio(stage) {
        if (stage < 4) return 0;
        if (stage <= 7) return 0.35;
        if (stage <= 12) return 0.55;
        return 0.75;
    },

    getSpawnPositions(count, platformRadius) {
        const positions = [];
        const spawnRadius = platformRadius * 0.7;
        const angleStep = (Math.PI * 2) / count;
        const offset = Math.random() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            const angle = offset + i * angleStep;
            positions.push({
                x: CONFIG.CENTER_X + Math.cos(angle) * spawnRadius,
                y: CONFIG.CENTER_Y + Math.sin(angle) * spawnRadius,
            });
        }
        return positions;
    },

    getEnemyBehavior(enemy, playerX, playerY, delta, speedMult) {
        const type = enemy.getData('type');
        const speed = CONFIG.ENEMY_TYPES[type].speed * speedMult;
        const dt = delta / 1000;

        if (type === 'CHASER') {
            const dx = playerX - enemy.x;
            const dy = playerY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            enemy.body.setVelocity(
                (dx / dist) * speed,
                (dy / dist) * speed
            );
        } else {
            // Drifter / Heavy / Bouncer: gentle brownian drift
            const vx = enemy.body.velocity.x + (Math.random() - 0.5) * speed * dt * 8;
            const vy = enemy.body.velocity.y + (Math.random() - 0.5) * speed * dt * 8;
            const mag = Math.sqrt(vx * vx + vy * vy) || 1;
            const cap = speed * 1.2;
            if (mag > cap) {
                enemy.body.setVelocity((vx / mag) * cap, (vy / mag) * cap);
            } else {
                enemy.body.setVelocity(vx, vy);
            }
        }

        // Keep enemies inside platform
        const dx = enemy.x - CONFIG.CENTER_X;
        const dy = enemy.y - CONFIG.CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = enemy.getData('platformRadius') * 0.85;
        if (dist > maxDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            enemy.body.setVelocity(
                enemy.body.velocity.x - nx * speed * 2,
                enemy.body.velocity.y - ny * speed * 2
            );
        }
    },
};
