// Voltage Rush - Core Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.continuing = data && data.continuing;
    }

    create() {
        this.gameOver = false;
        this.stageTransitioning = false;
        this.chargePaused = false;
        this.paused = false;
        this.nodes = [];
        this.nodeGraphics = [];
        this.wireGraphics = this.add.graphics();
        this.chargeGraphics = this.add.graphics();
        this.arcGraphics = this.add.graphics();
        this.activeArcs = [];

        if (!this.continuing) GameState.reset();
        this.stageData = null;
        this.stageTimer = 0;
        this.createHUD();
        this.loadStage(GameState.stage);
        this.createPauseOverlay();

        this.visHandler = this.onVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.visHandler);

        this.audioCtx = null;
        if (GameState.soundOn) {
            this.audioCtx = Effects.initAudio();
        }
    }

    loadStage(stageNum) {
        this.stageTransitioning = false;
        this.stageData = generateStage(stageNum);
        this.nodes = this.stageData.nodes;
        this.stageTimer = this.stageData.timer;

        if (this.continuing) {
            for (var i = 0; i < this.nodes.length; i++) this.nodes[i].fill = 0.3;
            this.continuing = false;
        }

        this.wireGraphics.clear();
        this.chargeGraphics.clear();
        for (var i = 0; i < this.nodeGraphics.length; i++) {
            this.nodeGraphics[i].destroy();
        }
        this.nodeGraphics = [];

        Renderer.drawWires(this);
        this.createNodeInteractives();
        this.updateHUD();

        if (GameState.stage > 1) {
            this.cameras.main.flash(150, 0, 170, 255, true, 0.25);
        }
    }

    createNodeInteractives() {
        for (var i = 0; i < this.nodes.length; i++) {
            var n = this.nodes[i];
            var zone = this.add.zone(n.x, n.y, NODE_TAP_RADIUS * 2, NODE_TAP_RADIUS * 2)
                .setInteractive(new Phaser.Geom.Circle(NODE_TAP_RADIUS, NODE_TAP_RADIUS, NODE_TAP_RADIUS), Phaser.Geom.Circle.Contains);
            zone.nodeIndex = i;
            zone.on('pointerdown', this.onNodeTap, this);
            this.nodeGraphics.push(zone);
        }
    }

    createHUD() {
        var w = GAME_WIDTH;
        this.hudBg = this.add.rectangle(w/2, HUD_HEIGHT/2, w, HUD_HEIGHT, COLORS.uiBg).setDepth(10);
        this.scoreText = this.add.text(12, HUD_HEIGHT/2, '\u26A1 ' + GameState.score, {
            fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(11);
        this.stageText = this.add.text(w/2, HUD_HEIGHT/2, 'Stage ' + GameState.stage, {
            fontSize: '18px', fontFamily: 'Arial', fill: '#00AAFF'
        }).setOrigin(0.5).setDepth(11);

        this.pauseBtn = this.add.text(w - 16, HUD_HEIGHT/2, '\u23F8', {
            fontSize: '28px', fontFamily: 'Arial', fill: '#888888'
        }).setOrigin(1, 0.5).setDepth(11).setInteractive({ useHandCursor: true });
        this.pauseBtn.on('pointerdown', this.togglePause, this);

        this.timerBarBg = this.add.rectangle(w/2, HUD_HEIGHT + 2, w - 20, 4, 0x1A2040).setDepth(10);
        this.timerBar = this.add.rectangle(10, HUD_HEIGHT + 2, w - 20, 4, COLORS.nodeIdle)
            .setOrigin(0, 0.5).setDepth(10);

        this.chainText = this.add.text(w/2, GAME_HEIGHT - 30, '', {
            fontSize: '16px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10).setAlpha(0);
    }

    updateHUD() {
        this.scoreText.setText('\u26A1 ' + GameState.score);
        this.stageText.setText('Stage ' + GameState.stage);
        if (GameState.safeChain >= 5) {
            this.chainText.setText('x' + GameState.multiplier.toFixed(1) + ' Chain: ' + GameState.safeChain);
            this.chainText.setAlpha(1);
        } else if (GameState.safeChain > 0) {
            this.chainText.setText('Chain: ' + GameState.safeChain);
            this.chainText.setAlpha(0.6);
        } else {
            this.chainText.setAlpha(0);
        }
    }

    onNodeTap(pointer, localX, localY, event) {
        if (this.gameOver || this.paused || this.stageTransitioning) return;
        var idx = event.gameObject ? event.gameObject.nodeIndex : -1;
        if (idx === undefined || idx === -1) return;
        var node = this.nodes[idx];
        if (!node || node.type === 'insulated') return;

        var now = this.time.now;
        if (now - node.tappedAt < TAP_COOLDOWN) return;
        node.tappedAt = now;

        var fill = node.fill;
        var points = 0, tier = 'safe';
        if (fill >= 0.8) { points = SCORE_VALUES.critical; tier = 'critical'; }
        else if (fill >= 0.5) { points = SCORE_VALUES.warning; tier = 'warning'; }
        else { points = SCORE_VALUES.safe; }

        if (fill < 0.3 && tier === 'safe') {
            GameState.safeChain = 0;
        } else {
            GameState.safeChain++;
        }
        this.updateMultiplier();

        points = Math.floor(points * GameState.multiplier);
        GameState.score += points;
        node.fill = 0;

        var targetIdx = node.arcTarget;
        if (targetIdx >= 0 && targetIdx < this.nodes.length) {
            var target = this.nodes[targetIdx];
            target.fill = Math.min(target.fill + ARC_TRANSFER, 0.99);
            this.activeArcs.push({ from: node, to: target, age: 0, maxAge: 250 });
            Effects.punchNode(this, targetIdx, 1.2, 100);
            Effects.playArcSound(this.audioCtx);
        }

        Effects.punchNode(this, idx, 1.45, 120);
        Effects.spawnParticles(this, node.x, node.y, tier);
        Effects.showFloatingScore(this, node.x, node.y - 30, points, tier);
        if (tier === 'critical') this.cameras.main.shake(120, 0.003);
        Effects.scorePunch(this);
        Effects.playTapSound(this.audioCtx, tier);

        this.chargePaused = true;
        var self = this;
        setTimeout(function() { self.chargePaused = false; }, HIT_STOP_MS);

        this.updateHUD();
    }

    updateMultiplier() {
        GameState.multiplier = 1.0;
        for (var i = CHAIN_THRESHOLDS.length - 1; i >= 0; i--) {
            if (GameState.safeChain >= CHAIN_THRESHOLDS[i].count) {
                GameState.multiplier = CHAIN_THRESHOLDS[i].multiplier;
                break;
            }
        }
        if (GameState.safeChain === 5) Effects.showChainMilestone(this, 'CHAIN x5!', false);
        if (GameState.safeChain === 10) Effects.showChainMilestone(this, 'MAX CHAIN!', true);
    }

    update(time, delta) {
        if (this.gameOver || this.paused) return;

        if (!this.chargePaused && !this.stageTransitioning) {
            var rate = this.stageData.chargeRate;
            var dt = delta / 1000;
            for (var i = 0; i < this.nodes.length; i++) {
                var n = this.nodes[i];
                if (n.type === 'insulated') continue;
                var nodeRate = n.type === 'rapid' ? rate * DIFFICULTY.rapidChargeMult : rate;
                n.fill += nodeRate * dt;
                if (n.fill >= 1.0) {
                    n.fill = 1.0;
                    this.triggerChainExplosion(i);
                    return;
                }
            }
        }

        if (!this.stageTransitioning) {
            this.stageTimer -= delta / 1000;
            if (this.stageTimer <= 0) {
                this.stageTransitioning = true;
                this.advanceStage();
                return;
            }
            var pct = Math.max(0, this.stageTimer / this.stageData.timer);
            this.timerBar.setDisplaySize((GAME_WIDTH - 20) * pct, 4);
        }

        Renderer.drawNodes(this);
        Renderer.drawArcs(this, delta);
    }

    advanceStage() {
        GameState.score += SCORE_VALUES.stageClearBase * GameState.stage;
        var noDanger = true;
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].type !== 'insulated' && this.nodes[i].fill >= 0.8) {
                noDanger = false; break;
            }
        }
        if (noDanger) GameState.score = Math.floor(GameState.score * 1.2);

        GameState.stage++;
        this.cameras.main.flash(150, 0, 170, 255, true, 0.25);
        this.updateHUD();

        var self = this;
        this.time.delayedCall(400, function() {
            self.loadStage(GameState.stage);
        });
    }

    triggerChainExplosion(startIdx) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.shake(450, 0.012);

        var self = this;
        var nodeOrder = [startIdx];
        var remaining = [];
        for (var i = 0; i < this.nodes.length; i++) {
            if (i !== startIdx && this.nodes[i].type !== 'insulated') remaining.push(i);
        }
        var last = startIdx;
        while (remaining.length > 0) {
            var bestDist = Infinity, bestIdx = 0;
            for (var r = 0; r < remaining.length; r++) {
                var dx = this.nodes[remaining[r]].x - this.nodes[last].x;
                var dy = this.nodes[remaining[r]].y - this.nodes[last].y;
                if (dx*dx + dy*dy < bestDist) { bestDist = dx*dx + dy*dy; bestIdx = r; }
            }
            last = remaining[bestIdx];
            nodeOrder.push(last);
            remaining.splice(bestIdx, 1);
        }

        for (var i = 0; i < nodeOrder.length; i++) {
            (function(idx, delay) {
                self.time.delayedCall(delay, function() {
                    Effects.explodeNode(self, idx);
                    Effects.playExplosionSound(self.audioCtx, idx);
                });
            })(nodeOrder[i], i * 80);
        }

        var totalDelay = nodeOrder.length * 80 + 700;
        this.time.delayedCall(nodeOrder.length * 80, function() {
            self.cameras.main.flash(200, 255, 255, 255, true, 0.7);
        });
        this.time.delayedCall(totalDelay, function() {
            self.scene.stop('GameScene');
            self.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage });
        });
    }

    createPauseOverlay() {
        this.pauseContainer = this.add.container(0, 0).setDepth(50).setVisible(false);
        this.pauseContainer.add(this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8));
        this.pauseContainer.add(this.add.text(GAME_WIDTH/2, 150, 'PAUSED', {
            fontSize: '36px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5));
        var self = this;
        var btns = [
            { y: 260, text: 'RESUME', c: 0x00AAFF, fn: function() { self.togglePause(); } },
            { y: 325, text: '?', c: 0x00AAFF, fn: function() { self.scene.launch('HelpScene', { returnTo: 'GameScene' }); }},
            { y: 390, text: 'RESTART', c: 0xFFAA00, fn: function() { self.paused = false; GameState.reset(); self.scene.stop('GameScene'); self.scene.start('GameScene'); }},
            { y: 455, text: 'MENU', c: 0x888888, fn: function() { self.paused = false; self.scene.stop('GameScene'); self.scene.start('MenuScene'); }}
        ];
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            var r = this.add.rectangle(GAME_WIDTH/2, b.y, 200, 50, b.c, 0.15).setStrokeStyle(2, b.c).setInteractive({ useHandCursor: true });
            var t = this.add.text(GAME_WIDTH/2, b.y, b.text, { fontSize: '22px', fontFamily: 'Arial', fill: '#' + b.c.toString(16).padStart(6, '0'), fontStyle: 'bold' }).setOrigin(0.5);
            r.on('pointerdown', b.fn);
            this.pauseContainer.add(r); this.pauseContainer.add(t);
        }
    }
    togglePause() { this.paused = !this.paused; this.pauseContainer.setVisible(this.paused); }
    onVisibilityChange() {
        if (document.hidden && !this.paused && !this.gameOver) { this.paused = true; this.pauseContainer.setVisible(true); }
    }
    shutdown() {
        this.tweens.killAll(); this.time.removeAllEvents();
        document.removeEventListener('visibilitychange', this.visHandler);
        if (this.audioCtx) { try { this.audioCtx.close(); } catch(e) {} this.audioCtx = null; }
    }
}
