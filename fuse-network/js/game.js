// game.js - GameScene: network rendering, input, fire simulation, cut logic
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        this.gw = this.scale.width; this.gh = this.scale.height;
        this.stageTransitioning = false; this.paused = false; this.gameOver = false;
        this.fires = []; this.cutMarks = []; this.nodeSprites = [];
        this.lastTapTime = Date.now(); this.fireIdCounter = 0;
        this.kitActive = false; this.kitTimer = 0;
        this.floatingTexts = [];

        this.fuseGfx = this.add.graphics().setDepth(1);
        this.fireGfx = this.add.graphics().setDepth(3);

        this._buildStage();
        this._setupInput();
        GameHUD.setup(this);
        this._igniteBombs();

        this._visHandler = () => { if (document.hidden) this._doPause(); };
        document.addEventListener('visibilitychange', this._visHandler);
    }

    _buildStage() {
        const graph = StageGenerator.generate(GameState.stage, this.gw, this.gh);
        this.graph = graph; this.nodes = graph.nodes; this.edges = graph.edges;
        this.nodeSprites.forEach(s => s.destroy());
        this.nodeSprites = []; this.cutMarks.forEach(s => s.destroy()); this.cutMarks = [];
        for (const node of this.nodes) {
            let key = 'node';
            if (node.type === 'bomb') key = 'bomb';
            else if (node.type === 'base') key = 'base';
            else if (node.type === 'safe') key = 'safe_zone';
            const s = this.add.image(node.x, node.y, key).setDepth(2);
            if (node.type === 'bomb') s.setScale(node.isMega ? 1.4 : 0.8);
            else if (node.type === 'base') s.setScale(0.9);
            else if (node.type === 'safe') s.setScale(0.7);
            else s.setScale(0.5);
            this.nodeSprites.push(s);
        }
        this._drawFuses();
    }

    _drawFuses() {
        this.fuseGfx.clear();
        for (const edge of this.edges) {
            const a = this.nodes[edge.from]; const b = this.nodes[edge.to];
            const vis = FUSE_VISUAL[edge.fuseType];
            if (edge.cut) {
                const dx = b.x - a.x; const dy = b.y - a.y;
                const gapFrac = 12 / Math.max(1, edge.length);
                const p1 = Math.max(0, edge.cutProgress - gapFrac / 2);
                const p2 = Math.min(1, edge.cutProgress + gapFrac / 2);
                this.fuseGfx.lineStyle(vis.width, COLORS.FUSE_UNLIT, 0.5);
                this.fuseGfx.beginPath();
                this.fuseGfx.moveTo(a.x, a.y); this.fuseGfx.lineTo(a.x + dx * p1, a.y + dy * p1);
                this.fuseGfx.strokePath();
                this.fuseGfx.beginPath();
                this.fuseGfx.moveTo(a.x + dx * p2, a.y + dy * p2); this.fuseGfx.lineTo(b.x, b.y);
                this.fuseGfx.strokePath();
            } else {
                this.fuseGfx.lineStyle(vis.width, vis.color, 0.7);
                this.fuseGfx.beginPath(); this.fuseGfx.moveTo(a.x, a.y);
                this.fuseGfx.lineTo(b.x, b.y); this.fuseGfx.strokePath();
                this.fuseGfx.lineStyle(vis.width + 4, vis.color, 0.12);
                this.fuseGfx.beginPath(); this.fuseGfx.moveTo(a.x, a.y);
                this.fuseGfx.lineTo(b.x, b.y); this.fuseGfx.strokePath();
            }
        }
    }

    _setupInput() {
        this.input.on('pointerdown', (pointer) => {
            if (this.paused || this.gameOver || this.stageTransitioning) return;
            this.lastTapTime = Date.now();
            const px = pointer.x; const py = pointer.y;
            if (py < LAYOUT.HUD_HEIGHT) return;
            let bestEdge = null; let bestDist = Infinity; let bestProj = 0;
            for (const edge of this.edges) {
                if (edge.cut) continue;
                const a = this.nodes[edge.from]; const b = this.nodes[edge.to];
                const r = this._ptSeg(px, py, a.x, a.y, b.x, b.y);
                if (r.dist < bestDist) { bestDist = r.dist; bestEdge = edge; bestProj = r.t; }
            }
            if (bestEdge && bestDist < GAME_CONFIG.TAP_RADIUS) this._cutFuse(bestEdge, bestProj);
        });
    }

    _ptSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax; const dy = by - ay; const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { dist: Math.sqrt((px-ax)**2 + (py-ay)**2), t: 0 };
        let t = ((px-ax)*dx + (py-ay)*dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const cx = ax + t*dx; const cy = ay + t*dy;
        return { dist: Math.sqrt((px-cx)**2 + (py-cy)**2), t };
    }

    _cutFuse(edge, t) {
        edge.cut = true; edge.cutProgress = t;
        const a = this.nodes[edge.from]; const b = this.nodes[edge.to];
        const cx = a.x + (b.x - a.x)*t; const cy = a.y + (b.y - a.y)*t;
        let nearDist = Infinity;
        for (const f of this.fires) {
            if (!f.active || f.currentEdge !== edge.id) continue;
            const ea = this.nodes[this.edges[f.currentEdge].from];
            const eb = this.nodes[this.edges[f.currentEdge].to];
            const fx = ea.x + (eb.x - ea.x)*f.progress; const fy = ea.y + (eb.y - ea.y)*f.progress;
            const d = Math.sqrt((fx-cx)**2 + (fy-cy)**2);
            if (d < nearDist) nearDist = d;
        }
        let points = SCORE_VALUES.CUT_BASE; let mult = 1;
        if (nearDist <= GAME_CONFIG.LAST_SECOND_PX) {
            mult = 3; points = 150; GameState.combo++;
            if (GameState.combo > GameState.bestComboThisGame) GameState.bestComboThisGame = GameState.combo;
            points += Math.max(0, GameState.combo - 1) * SCORE_VALUES.COMBO_INCREMENT;
            GameFX.lastSecond(this, cx, cy, GameState.combo);
        } else if (nearDist <= GAME_CONFIG.CLOSE_CALL_PX) {
            mult = 2; points = 100; GameState.combo = 0;
            GameFX.closeCall(this, cx, cy);
        } else { GameState.combo = 0; GameFX.normalCut(this, cx, cy); }
        GameState.score += points;
        GameFX.floatText(this, cx + 20, cy, '+' + points, mult >= 3 ? '#FFD700' : '#FFFFFF');
        if (mult >= 2) GameFX.floatText(this, cx - 10, cy - 15, mult + 'x!',
            mult >= 3 ? '#FFD700' : '#FFFFFF', mult >= 3 ? 28 : 24);
        const mark = this.add.image(cx, cy, 'cut_mark').setScale(0).setDepth(4);
        this.tweens.add({ targets: mark, scale: 0.5, duration: 60, ease: 'Back.easeOut' });
        this.cutMarks.push(mark);
        this._drawFuses(); GameHUD.update(this);
    }

    _igniteBombs() {
        this.fires = [];
        for (let i = 0; i < this.graph.bombs.length; i++) {
            const bId = this.graph.bombs[i];
            const outE = this.edges.filter(e => e.from === bId || e.to === bId);
            for (const edge of outE) {
                const fromB = edge.from === bId;
                setTimeout(() => { if (!this.gameOver) this._spawnFire(edge.id, fromB ? 0 : 1, fromB ? 1 : -1); }, i * 150);
            }
        }
        this.stageTimer = this.graph.params.timer; this.stageTimerActive = true;
    }

    _spawnFire(edgeId, startP, dir) {
        const edge = this.edges[edgeId]; if (!edge || edge.cut) return;
        const sm = edge.fuseType === FUSE_TYPES.FAST ? 2 : 1;
        this.fires.push({ id: this.fireIdCounter++, currentEdge: edgeId, progress: startP,
            direction: dir, speed: this.graph.params.burnSpeed * sm, fuseType: edge.fuseType,
            frozen: false, delayedPaused: false, delayedTimer: 0, active: true, hasSplit: false });
    }

    update(time, delta) {
        if (this.paused || this.gameOver || this.stageTransitioning) return;
        const dt = delta / 1000;
        if (this.kitActive) { this.kitTimer -= delta; if (this.kitTimer <= 0) { this.kitActive = false; this.fires.forEach(f => f.frozen = false); } }
        if (this.stageTimerActive) { this.stageTimer -= dt; if (this.stageTimer <= 0) { this.stageTimer = 0; this.stageTimerActive = false; this.fires.forEach(f => { if (f.active) f.speed = this.graph.params.burnSpeed * 5; }); } }
        let anyActive = false;
        for (const fire of this.fires) {
            if (!fire.active) continue;
            if (fire.frozen) { anyActive = true; continue; }
            if (fire.delayedPaused) { fire.delayedTimer -= delta; if (fire.delayedTimer <= 0) { fire.delayedPaused = false; fire.speed = this.graph.params.burnSpeed * 3; } anyActive = true; continue; }
            const edge = this.edges[fire.currentEdge]; if (!edge) { fire.active = false; continue; }
            fire.progress += (fire.speed * dt / Math.max(1, edge.length)) * fire.direction;
            if (edge.cut && ((fire.direction > 0 && fire.progress >= edge.cutProgress) || (fire.direction < 0 && fire.progress <= edge.cutProgress))) { fire.progress = edge.cutProgress; fire.active = false; continue; }
            if (fire.progress >= 1 || fire.progress <= 0) { this._onReach(fire, fire.direction > 0 ? edge.to : edge.from); }
            if (fire.active) anyActive = true;
        }
        if (!anyActive && this.fires.length > 0 && !this.stageTransitioning) this._onStageClear();
        // Inactivity death: if player idles too long, speed up all fires dramatically
        const idleTime = Date.now() - this.lastTapTime;
        if (idleTime > GAME_CONFIG.INACTIVITY_TIMEOUT) {
            this.fires.forEach(f => {
                if (f.active) f.speed = this.graph.params.burnSpeed * 5;
            });
            this.lastTapTime = Date.now();
        }

        this._drawFires(); GameHUD.update(this);
        GameFX.updateFloats(this, dt);
    }

    _onReach(fire, nodeId) {
        const node = this.nodes[nodeId]; if (!node) { fire.active = false; return; }
        if (node.type === 'base') { fire.active = false; this._baseHit(); return; }
        if (node.type === 'safe') { fire.active = false; GameState.score += SCORE_VALUES.SAFE_REDIRECT; GameFX.floatText(this, node.x, node.y - 20, '+' + SCORE_VALUES.SAFE_REDIRECT, '#2ECC71'); return; }
        if (fire.fuseType === FUSE_TYPES.DELAYED && !fire.delayedPaused && node.type === 'intermediate') { fire.delayedPaused = true; fire.delayedTimer = 1500; return; }
        const nextE = this.edges.filter(e => !e.cut && (e.from === nodeId || e.to === nodeId))
            .filter(e => e.id !== fire.currentEdge);
        const baseN = this.nodes[this.graph.base];
        nextE.sort((a, b) => { const ao = this.nodes[a.from === nodeId ? a.to : a.from]; const bo = this.nodes[b.from === nodeId ? b.to : b.from]; return Math.abs(ao.y - baseN.y) - Math.abs(bo.y - baseN.y); });
        if (fire.fuseType === FUSE_TYPES.SPLIT && !fire.hasSplit && nextE.length >= 2) {
            fire.hasSplit = true; fire.active = false;
            for (let i = 0; i < Math.min(2, nextE.length); i++) { const ne = nextE[i]; this._spawnFire(ne.id, ne.from === nodeId ? 0 : 1, ne.from === nodeId ? 1 : -1); }
            this.cameras.main.flash(100, 255, 0, 255, false, null, null, 0.1); return;
        }
        if (nextE.length > 0) {
            const ne = nextE[0]; fire.currentEdge = ne.id; fire.direction = ne.from === nodeId ? 1 : -1;
            fire.progress = ne.from === nodeId ? 0 : 1;
            fire.speed = this.graph.params.burnSpeed * (ne.fuseType === FUSE_TYPES.FAST ? 2 : 1);
            fire.fuseType = ne.fuseType;
        } else { fire.active = false; }
    }

    _baseHit() {
        GameState.hp--; this.cameras.main.shake(300, 0.025);
        this.cameras.main.flash(200, 255, 50, 50, false, null, null, 0.3);
        const bs = this.nodeSprites[this.graph.base];
        if (bs && GameState.hp > 0) { bs.setTexture('base_damaged'); this.tweens.add({ targets: bs, alpha: { from: 0.3, to: 1 }, duration: 133, repeat: 2 }); }
        GameHUD.update(this);
        if (GameState.hp <= 0) { this.gameOver = true; this.cameras.main.shake(500, 0.04); setTimeout(() => { if (this.scene.isActive('GameScene')) this.scene.start('GameOverScene'); }, 800); }
    }

    _onStageClear() {
        if (this.stageTransitioning) return; this.stageTransitioning = true;
        const bonus = SCORE_VALUES.STAGE_CLEAR_BASE + GameState.stage * SCORE_VALUES.STAGE_CLEAR_PER_STAGE;
        const tBonus = Math.floor(Math.max(0, this.stageTimer)) * SCORE_VALUES.TIME_BONUS_PER_SEC;
        GameState.score += bonus + tBonus;
        GameFX.floatText(this, this.gw / 2, this.gh / 2 - 40, 'STAGE CLEAR! +' + (bonus + tBonus), '#FFD700', 26);
        this.cameras.main.flash(200, 255, 215, 0, false, null, null, 0.15);
        setTimeout(() => { GameState.stage++; this.fires = []; this._buildStage(); this._igniteBombs(); this.stageTransitioning = false; this.lastTapTime = Date.now(); }, 900);
    }

    _drawFires() {
        this.fireGfx.clear();
        for (const fire of this.fires) {
            if (!fire.active) continue;
            const edge = this.edges[fire.currentEdge]; if (!edge) continue;
            const a = this.nodes[edge.from]; const b = this.nodes[edge.to];
            const fx = a.x + (b.x-a.x)*fire.progress; const fy = a.y + (b.y-a.y)*fire.progress;
            const color = fire.frozen ? 0x44DDFF : (fire.fuseType === FUSE_TYPES.FAST ? COLORS.FIRE_FAST : fire.fuseType === FUSE_TYPES.DELAYED ? (fire.delayedPaused ? COLORS.FIRE_DELAYED : COLORS.FIRE_NORMAL) : fire.fuseType === FUSE_TYPES.SPLIT ? COLORS.FIRE_SPLIT : COLORS.FIRE_NORMAL);
            this.fireGfx.fillStyle(color, 0.2); this.fireGfx.fillCircle(fx, fy, 12);
            this.fireGfx.fillStyle(color, 1); this.fireGfx.fillCircle(fx, fy, 5);
            for (let i = 1; i <= 4; i++) {
                const tp = fire.progress - fire.direction * i * 0.04;
                if (tp < 0 || tp > 1) continue;
                const tx = a.x + (b.x-a.x)*tp; const ty = a.y + (b.y-a.y)*tp;
                this.fireGfx.fillStyle(color, 0.7 - i * 0.15);
                this.fireGfx.fillCircle(tx + (Math.random()-0.5)*4, ty + (Math.random()-0.5)*4, 3 - i*0.5);
            }
        }
    }

    _doPause() { if (!this.paused) { this.paused = true; GameHUD.showPause(this); } }
    togglePause() { this.paused = !this.paused; if (this.paused) GameHUD.showPause(this); else GameHUD.hidePause(this); }
    activateKit() { if (!GameState.hasKit || this.kitActive || this.gameOver) return; GameState.hasKit = false; this.kitActive = true; this.kitTimer = GAME_CONFIG.KIT_DURATION; this.fires.forEach(f => f.frozen = true); this.cameras.main.flash(200, 68, 221, 255, false, null, null, 0.2); }
    shutdown() { document.removeEventListener('visibilitychange', this._visHandler); }
}
