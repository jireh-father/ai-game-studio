// Valve Panic - Stage Generation & Difficulty Scaling

const Stages = {
    // Get current difficulty parameters based on elapsed time
    getDifficulty(elapsedSec) {
        const t = Math.min(elapsedSec, 70);
        const baseFill = Math.min(
            CONFIG.DIFFICULTY.BASE_FILL_RATE + t * CONFIG.DIFFICULTY.FILL_RATE_SCALE,
            CONFIG.DIFFICULTY.FILL_RATE_CAP
        );
        const drainRate = Math.max(
            CONFIG.DIFFICULTY.DRAIN_RATE_BASE - t * CONFIG.DIFFICULTY.DRAIN_RATE_DECAY,
            CONFIG.DIFFICULTY.DRAIN_RATE_MIN
        );
        const variance = 0.10 + Math.min(t / 200, 0.20);
        return { baseFill, drainRate, variance };
    },

    // Generate parameters for a new pipe
    generatePipeParams(elapsedSec, pipeIndex, existingRates) {
        const diff = this.getDifficulty(elapsedSec);
        let rate;
        let attempts = 0;
        // Ensure no two adjacent pipes have rates within 5% of each other
        do {
            const randFactor = 1 + (Math.random() * 2 - 1) * diff.variance;
            rate = diff.baseFill * randFactor;
            attempts++;
        } while (attempts < 10 && existingRates.length > 0 &&
            Math.abs(rate - existingRates[existingRates.length - 1]) < diff.baseFill * 0.05);

        return {
            fillRate: rate,
            drainRate: diff.drainRate,
            color: CONFIG.PIPE_COLORS[pipeIndex % CONFIG.PIPE_COLORS.length],
            colorHex: CONFIG.PIPE_COLOR_HEX[pipeIndex % CONFIG.PIPE_COLOR_HEX.length],
            fill: 0,
            graceTimer: CONFIG.TIMING.GRACE_PERIOD,
            linkedTo: -1,
            isBurst: false
        };
    },

    // Check if a new pipe should be added
    shouldAddPipe(elapsedMs, currentCount) {
        if (currentCount >= CONFIG.TIMING.MAX_PIPES) return false;
        const expectedPipes = CONFIG.TIMING.START_PIPES +
            Math.floor(elapsedMs / CONFIG.TIMING.NEW_PIPE_INTERVAL);
        return currentCount < expectedPipes;
    },

    // Get target pipe count for elapsed time
    getTargetPipeCount(elapsedMs) {
        return Math.min(
            CONFIG.TIMING.START_PIPES + Math.floor(elapsedMs / CONFIG.TIMING.NEW_PIPE_INTERVAL),
            CONFIG.TIMING.MAX_PIPES
        );
    },

    // Try to create linked pairs after 30s
    tryCreateLink(pipes, elapsedSec) {
        if (elapsedSec < CONFIG.DIFFICULTY.LINK_START_TIME) return;
        if (pipes.length < 4) return;

        // Count existing links
        let linkCount = 0;
        for (const p of pipes) {
            if (p.linkedTo >= 0) linkCount++;
        }
        linkCount = Math.floor(linkCount / 2);

        const maxLinks = elapsedSec >= 40 ? 2 : 1;
        if (linkCount >= maxLinks) return;

        // 20% chance per check
        if (Math.random() > 0.20) return;

        // Find two unlinked non-adjacent pipes
        const unlinked = [];
        for (let i = 0; i < pipes.length; i++) {
            if (pipes[i].linkedTo < 0 && !pipes[i].isBurst) unlinked.push(i);
        }
        if (unlinked.length < 2) return;

        // Pick two that are non-adjacent
        for (let a = 0; a < unlinked.length; a++) {
            for (let b = a + 1; b < unlinked.length; b++) {
                if (Math.abs(unlinked[a] - unlinked[b]) > 1) {
                    pipes[unlinked[a]].linkedTo = unlinked[b];
                    pipes[unlinked[b]].linkedTo = unlinked[a];
                    return { a: unlinked[a], b: unlinked[b] };
                }
            }
        }
        return null;
    },

    // Calculate pipe x positions based on count and screen width
    getPipePositions(pipeCount, gameWidth) {
        const pw = CONFIG.PIPE.WIDTH;
        const totalWidth = pipeCount * pw;
        const gap = (gameWidth - totalWidth) / (pipeCount + 1);
        const positions = [];
        for (let i = 0; i < pipeCount; i++) {
            positions.push(gap + pw / 2 + i * (pw + gap));
        }
        return positions;
    }
};

// Pipe visual creation helper
const PipeRenderer = {
    createPipeGraphics(scene, pipes) {
        const positions = Stages.getPipePositions(pipes.length, CONFIG.GAME_WIDTH);
        const PH = CONFIG.PIPE.HEIGHT, PW = CONFIG.PIPE.WIDTH, topY = CONFIG.PIPE.TOP_Y;
        const result = [];
        for (let i = 0; i < pipes.length; i++) {
            const x = positions[i];
            const container = scene.add.container(x, topY + PH / 2).setDepth(10);
            const body = scene.add.rectangle(0, 0, PW, PH, CONFIG.COLORS.PIPE_BODY).setStrokeStyle(2, 0x2D3436);
            const inner = scene.add.rectangle(0, 0, PW - 8, PH - 10, CONFIG.COLORS.PIPE_INNER);
            const liq = scene.add.rectangle(0, PH / 2 - 5, PW - 8, 0, pipes[i].color).setOrigin(0.5, 1);
            const r1 = scene.add.circle(-PW / 2 + 4, -PH / 2 + 10, 3, 0x95A5A6);
            const r2 = scene.add.circle(PW / 2 - 4, -PH / 2 + 10, 3, 0x95A5A6);
            const r3 = scene.add.circle(-PW / 2 + 4, PH / 2 - 10, 3, 0x95A5A6);
            const r4 = scene.add.circle(PW / 2 - 4, PH / 2 - 10, 3, 0x95A5A6);
            const valve = scene.add.circle(0, PH / 2 + CONFIG.PIPE.VALVE_Y_OFFSET,
                CONFIG.PIPE.VALVE_RADIUS, CONFIG.COLORS.VALVE_IDLE).setStrokeStyle(2, 0x636E72);
            const vl1 = scene.add.rectangle(0, PH / 2 + CONFIG.PIPE.VALVE_Y_OFFSET, CONFIG.PIPE.VALVE_RADIUS * 1.6, 2, 0x636E72);
            const vl2 = scene.add.rectangle(0, PH / 2 + CONFIG.PIPE.VALVE_Y_OFFSET, 2, CONFIG.PIPE.VALVE_RADIUS * 1.6, 0x636E72);
            const pctText = scene.add.text(0, -PH / 2 - 12, '0%', {
                fontSize: '13px', fontFamily: 'Arial', fill: '#95A5A6'
            }).setOrigin(0.5);
            container.add([body, inner, liq, r1, r2, r3, r4, valve, vl1, vl2, pctText]);
            const zone = scene.add.rectangle(x, topY + PH / 2 + 10,
                Math.max(PW + 10, 50), PH + CONFIG.PIPE.VALVE_Y_OFFSET * 2 + 20, 0x000000, 0)
                .setDepth(20).setInteractive();
            zone.pipeIndex = i;
            result.push({ container, body, inner, liq, valve, vl1, vl2, pctText, zone, x, dangerFlash: false, dangerTimer: 0 });
        }
        return result;
    },

    updateVisuals(pg, pipe, delta, isActive, dt, scene) {
        const maxLiqH = CONFIG.PIPE.HEIGHT - 10;
        pg.liq.setSize(CONFIG.PIPE.WIDTH - 8, Math.max(1, pipe.fill * maxLiqH));
        pg.pctText.setText(Math.floor(pipe.fill * 100) + '%');
        if (pipe.fill > 0.8) {
            pg.dangerTimer += delta;
            if (pg.dangerTimer > 200) {
                pg.dangerTimer = 0;
                pg.dangerFlash = !pg.dangerFlash;
                pg.body.setStrokeStyle(3, pg.dangerFlash ? 0xFF4444 : 0x2D3436);
                pg.pctText.setFill(pg.dangerFlash ? '#FF4444' : '#95A5A6');
            }
        } else {
            pg.body.setStrokeStyle(2, 0x2D3436);
            pg.pctText.setFill('#95A5A6');
        }
        if (isActive) {
            pg.vl1.setAngle(pg.vl1.angle + 360 * dt);
            pg.vl2.setAngle(pg.vl2.angle + 360 * dt);
        }
        if (pipe.linkedTo >= 0 && !pg._linkLine) {
            const partnerIdx = pipe.linkedTo;
            if (scene.pipeGraphics[partnerIdx]) {
                const px = scene.pipeGraphics[partnerIdx].x;
                pg._linkLine = scene.add.rectangle(
                    (pg.x + px) / 2, CONFIG.PIPE.TOP_Y + CONFIG.PIPE.HEIGHT + 5,
                    Math.abs(pg.x - px), 3, 0xFFD700, 0.6
                ).setDepth(5);
            }
        }
    }
};
