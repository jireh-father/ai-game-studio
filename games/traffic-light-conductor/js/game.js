// game.js - GameScene: intersection, cars, lights, collisions, input
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    create() {
        this.gameOver = false; this.crashAnimating = false; this.stageTransitioning = false;
        this.carsPassed = 0; this.stageCrashes = 0; this.lastInputTime = Date.now();
        this.lastEmergencyStopTime = 0; this.inputBuffer = null; this.lastTapTime = 0;
        this.carPool = []; this.activeCars = []; this.recentSpawns = []; this.allRedStartTime = 0;
        GameState.score = 0; GameState.combo = 0; GameState.bestCombo = 0;
        GameState.lives = 3; GameState.stage = 1; GameState.totalCarsSaved = 0;
        const W = this.scale.width, H = this.scale.height;
        this.cx = W / 2; this.cy = H / 2;
        const IS = CONFIG.LAYOUT.INTERSECTION_SIZE;
        this.lights = { N: false, S: false, E: false, W: false };
        this.lightTransitioning = { N: false, S: false, E: false, W: false };
        this.lastToggleTime = { N: 0, S: 0, E: 0, W: 0 };
        this.drawIntersection(W, H);
        this.createLightButtons(IS);
        this.createHUD(W);
        this.izLeft = this.cx - IS / 2; this.izRight = this.cx + IS / 2;
        this.izTop = this.cy - IS / 2; this.izBottom = this.cy + IS / 2;
        this.setupSpawnTimer();
        this.malfunctionBg = this.add.rectangle(this.cx, H - 12, 100, 8).setStrokeStyle(1, 0x555555).setFillStyle(0x333333).setDepth(19);
        this.malfunctionBar = this.add.rectangle(this.cx, H - 12, 0, 8, 0xFF1744).setDepth(20);
        this.malfunctionText = this.add.text(this.cx, H - 24, '', { fontSize: '12px', fill: CONFIG.COLORS.DANGER_RED, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
        this.add.rectangle(this.cx, this.cy, 80, 80, 0x000000, 0).setInteractive().setDepth(5).on('pointerdown', () => this.handleEmergencyDoubleTap());
        this.input.on('pointerdown', () => { this.lastInputTime = Date.now(); });
    }
    drawIntersection(W, H) {
        const RW = CONFIG.LAYOUT.ROAD_WIDTH, IS = CONFIG.LAYOUT.INTERSECTION_SIZE, SL = CONFIG.LAYOUT.STOP_LINE_OFFSET;
        this.add.rectangle(this.cx, this.cy, W, H, 0x4CAF50).setDepth(0);
        this.add.rectangle(this.cx, this.cy, IS + 20, H, 0xB8B8B8).setDepth(0);
        this.add.rectangle(this.cx, this.cy, W, IS + 20, 0xB8B8B8).setDepth(0);
        this.add.rectangle(this.cx, this.cy, RW * 2, H, 0x2D2D2D).setDepth(1);
        this.add.rectangle(this.cx, this.cy, W, RW * 2, 0x2D2D2D).setDepth(1);
        this.add.rectangle(this.cx, this.cy, IS, IS, 0x2D2D2D).setDepth(1);
        for (let y = 0; y < H; y += 30) { if (!(y > this.cy - IS/2 - 5 && y < this.cy + IS/2 + 5)) this.add.rectangle(this.cx, y, 3, 15, 0xFFD700).setDepth(2); }
        for (let x = 0; x < W; x += 30) { if (!(x > this.cx - IS/2 - 5 && x < this.cx + IS/2 + 5)) this.add.rectangle(x, this.cy, 15, 3, 0xFFD700).setDepth(2); }
        [[this.cx, this.cy-SL, RW*2, 4], [this.cx, this.cy+SL, RW*2, 4], [this.cx-SL, this.cy, 4, RW*2], [this.cx+SL, this.cy, 4, RW*2]].forEach(s => this.add.rectangle(s[0], s[1], s[2], s[3], 0xFFFFFF).setDepth(2));
    }
    createLightButtons(IS) {
        const S = CONFIG.LAYOUT.LIGHT_BTN_SIZE, off = IS / 2 + S / 2 + 16;
        const pos = { N: [this.cx, this.cy-off], S: [this.cx, this.cy+off], W: [this.cx-off, this.cy], E: [this.cx+off, this.cy] };
        this.lightBtns = {};
        ['N','S','E','W'].forEach(dir => {
            const b = this.add.image(pos[dir][0], pos[dir][1], 'light_red').setDisplaySize(S, S).setInteractive().setDepth(10);
            b.on('pointerdown', () => this.toggleLight(dir)); this.lightBtns[dir] = b;
        });
    }
    createHUD(W) {
        this.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.4).setDepth(15);
        this.scoreText = this.add.text(10, 8, 'Score: ' + GameState.score, { fontSize: '18px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(16);
        this.comboText = this.add.text(W / 2, 8, '', { fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(16);
        this.stageText = this.add.text(10, this.scale.height - 30, 'Stage 1', { fontSize: '14px', fill: '#FFF', fontFamily: 'Arial' }).setDepth(16);
        this.lifeIcons = [];
        for (let i = 0; i < 3; i++) this.lifeIcons.push(this.add.image(W - 30 - i * 26, 20, 'life_full').setDisplaySize(20, 20).setDepth(16));
    }
    toggleLight(dir) {
        if (this.gameOver || this.crashAnimating) { this.inputBuffer = dir; return; }
        const now = Date.now();
        if (now - this.lastToggleTime[dir] < CONFIG.TIMING.TAP_DEBOUNCE_MS || this.lightTransitioning[dir]) return;
        this.lastToggleTime[dir] = now; this.lightTransitioning[dir] = true;
        this.lightBtns[dir].setTexture('light_yellow');
        this.tweens.add({ targets: this.lightBtns[dir], scaleX: 1.3*(CONFIG.LAYOUT.LIGHT_BTN_SIZE/60), scaleY: 1.3*(CONFIG.LAYOUT.LIGHT_BTN_SIZE/60), duration: 80, yoyo: true });
        const self = this;
        setTimeout(function() {
            if (!self.scene || !self.scene.isActive()) return;
            self.lights[dir] = !self.lights[dir];
            self.lightBtns[dir].setTexture(self.lights[dir] ? 'light_green' : 'light_red');
            self.lightTransitioning[dir] = false;
            for (let i = 0; i < 6; i++) {
                const p = self.add.circle(self.lightBtns[dir].x, self.lightBtns[dir].y, 3, 0xFFD600).setDepth(15);
                const a = (i/6)*Math.PI*2, s = 40+Math.random()*40;
                self.tweens.add({ targets: p, x: p.x+Math.cos(a)*s, y: p.y+Math.sin(a)*s, alpha: 0, duration: 300, onComplete: () => p.destroy() });
            }
        }, CONFIG.TIMING.LIGHT_TRANSITION_MS);
        if (navigator.vibrate) navigator.vibrate(15);
    }
    handleEmergencyDoubleTap() {
        const now = Date.now();
        if (now - this.lastEmergencyStopTime < CONFIG.TIMING.EMERGENCY_COOLDOWN_MS) return;
        if (now - this.lastTapTime < 400) {
            this.lastEmergencyStopTime = now;
            ['N','S','E','W'].forEach(d => { this.lights[d] = false; this.lightBtns[d].setTexture('light_red'); });
            if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
            this.cameras.main.shake(100, 0.005);
        }
        this.lastTapTime = now;
    }
    setupSpawnTimer() {
        if (this.spawnEvent) this.spawnEvent.destroy();
        this.spawnEvent = this.time.addEvent({ delay: StageManager.getStageParams(GameState.stage).spawnIntervalMs, callback: () => this.spawnNextCar(), loop: true });
    }
    spawnNextCar() {
        if (this.gameOver || this.crashAnimating || this.stageTransitioning) return;
        const dir = StageManager.getSpawnDirection(this.recentSpawns);
        this.recentSpawns.push(dir); if (this.recentSpawns.length > 8) this.recentSpawns.shift();
        this.createCar(dir, StageManager.getVehicleType(GameState.stage), StageManager.getStageParams(GameState.stage).baseCarSpeed);
    }
    createCar(dir, type, baseSpeed) {
        const v = CONFIG.VEHICLES[type], spd = baseSpeed * v.speedMult;
        let x, y, vx = 0, vy = 0, angle;
        const lo = (Math.random() > 0.5 ? 1 : -1) * CONFIG.LAYOUT.ROAD_WIDTH * 0.3, m = 30, W = this.scale.width, H = this.scale.height;
        if (dir === 'N') { x = this.cx+lo; y = -m; vy = spd; angle = 180; }
        else if (dir === 'S') { x = this.cx-lo; y = H+m; vy = -spd; angle = 0; }
        else if (dir === 'E') { y = this.cy+lo; x = W+m; vx = -spd; angle = 270; }
        else { y = this.cy-lo; x = -m; vx = spd; angle = 90; }
        let car = this.carPool.pop();
        if (car) { car.setPosition(x, y).setAngle(angle).setTexture(v.key).setDisplaySize(v.w, v.h).setAlpha(1).setTint(0xffffff).setVisible(true).setActive(true).setScale(v.w/60, v.h/60); }
        else { car = this.add.image(x, y, v.key).setDisplaySize(v.w, v.h).setAngle(angle).setDepth(6); }
        Object.assign(car, { vx, vy, dir, type, speed: spd, stopped: false, passed: false, ignoresRed: v.ignoresRed||false, _nearMissed: false });
        this.activeCars.push(car);
    }
    update(time, delta) {
        if (this.gameOver || this.crashAnimating) return;
        const dt = delta / 16.67, SL = CONFIG.LAYOUT.STOP_LINE_OFFSET;
        for (let i = this.activeCars.length - 1; i >= 0; i--) {
            const c = this.activeCars[i];
            if (!c.ignoresRed && !this.lights[c.dir] && !c.passed) {
                const d = this.getDistToStop(c);
                if (d !== null && d < 5 && d > -10) { c.stopped = true; continue; }
                if (d !== null && d >= 5) c.stopped = false;
            } else c.stopped = false;
            if (c.stopped) continue;
            c.x += c.vx * dt; c.y += c.vy * dt;
            if (!c.passed && this.hasPassed(c)) { c.passed = true; this.onCarPassed(c); }
            if (c.x < -80 || c.x > this.scale.width+80 || c.y < -80 || c.y > this.scale.height+80) { c.setVisible(false).setActive(false); this.activeCars.splice(i, 1); this.carPool.push(c); }
        }
        this.checkCollisions(); this.checkInactivity(); this.checkAllRedComboReset();
        this.scoreText.setText('Score: ' + GameState.score); this.stageText.setText('Stage ' + GameState.stage);
        if (GameState.combo > 0) this.comboText.setText('x' + GameState.combo + ' (' + CONFIG.SCORING.getComboMultiplier(GameState.combo).toFixed(1) + 'x)').setVisible(true);
        else this.comboText.setVisible(false);
    }
    getDistToStop(c) {
        const SL = CONFIG.LAYOUT.STOP_LINE_OFFSET;
        if (c.dir==='N') return (this.cy-SL)-c.y; if (c.dir==='S') return c.y-(this.cy+SL);
        if (c.dir==='E') return c.x-(this.cx+SL); if (c.dir==='W') return (this.cx-SL)-c.x; return null;
    }
    hasPassed(c) {
        if (c.dir==='N') return c.y > this.izBottom+20; if (c.dir==='S') return c.y < this.izTop-20;
        if (c.dir==='E') return c.x < this.izLeft-20; if (c.dir==='W') return c.x > this.izRight+20; return false;
    }
    onCarPassed(car) {
        GameState.combo++; if (GameState.combo > GameState.bestCombo) GameState.bestCombo = GameState.combo;
        const earned = Math.floor(CONFIG.VEHICLES[car.type].points * CONFIG.SCORING.getComboMultiplier(GameState.combo));
        GameState.score += earned; GameState.totalCarsSaved++; this.carsPassed++;
        this.showFloatText(car.x, car.y - 20, '+' + earned, CONFIG.COLORS.LIGHT_GREEN);
        if (GameState.combo > 0 && GameState.combo % CONFIG.SCORING.COMBO_STEP === 0) this.tweens.add({ targets: this.comboText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
        if (!this.stageTransitioning && this.carsPassed >= StageManager.getStageParams(GameState.stage).carsToClear) StageManager.advanceStage(this);
    }
    showFloatText(x, y, text, color) {
        const t = this.add.text(x, y, text, { fontSize: '16px', fill: color, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    }
    checkCollisions() {
        const zone = this.activeCars.filter(c => c.x > this.izLeft && c.x < this.izRight && c.y > this.izTop && c.y < this.izBottom);
        const perp = [['N','E'],['N','W'],['S','E'],['S','W']];
        for (let a = 0; a < zone.length; a++) for (let b = a+1; b < zone.length; b++) {
            const ca = zone[a], cb = zone[b];
            if (!perp.some(p => (p[0]===ca.dir&&p[1]===cb.dir)||(p[1]===ca.dir&&p[0]===cb.dir))) continue;
            const aw = 20 - CONFIG.LAYOUT.COLLISION_SHRINK;
            if (Math.abs(ca.x-cb.x) < aw && Math.abs(ca.y-cb.y) < aw) { this.triggerCrash(ca, cb); return; }
            const dist = Phaser.Math.Distance.Between(ca.x,ca.y,cb.x,cb.y);
            if (dist < 50 && dist > 20 && !ca._nearMissed && !cb._nearMissed) {
                ca._nearMissed = cb._nearMissed = true; GameState.score += CONFIG.SCORING.NEAR_MISS_POINTS;
                this.showFloatText((ca.x+cb.x)/2, (ca.y+cb.y)/2, '+25 CLOSE!', CONFIG.COLORS.COMBO_GOLD);
                CrashEffects.nearMissSparks(this, (ca.x+cb.x)/2, (ca.y+cb.y)/2);
                this.cameras.main.shake(100, 0.002); if (navigator.vibrate) navigator.vibrate(25);
            }
        }
    }
    triggerCrash(ca, cb) {
        this.crashAnimating = true; GameState.combo = 0; GameState.lives--; this.stageCrashes++;
        const mx = (ca.x+cb.x)/2, my = (ca.y+cb.y)/2;
        this.activeCars.forEach(c => { c._sv = c.vx; c._svv = c.vy; c.vx = 0; c.vy = 0; });
        CrashEffects.screenFlash(this, 0xFFFFFF); CrashEffects.explosion(this, mx, my);
        CrashEffects.spawnDebris(this, mx, my, 10); CrashEffects.spawnSmoke(this, mx, my);
        CrashEffects.destroyCrashedCar(this, ca); CrashEffects.destroyCrashedCar(this, cb);
        this.cameras.main.shake(400, 0.015); if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
        for (let i = 0; i < 3; i++) this.lifeIcons[i].setTexture(i < GameState.lives ? 'life_full' : 'life_empty');
        const self = this;
        setTimeout(function() {
            if (!self.scene || !self.scene.isActive()) return;
            self.activeCars.forEach(c => { if (c._sv !== undefined) { c.vx = c._sv; c.vy = c._svv; } });
            self.activeCars = self.activeCars.filter(c => c !== ca && c !== cb); self.carPool.push(ca, cb);
            self.crashAnimating = false;
            if (GameState.lives <= 0) self.triggerGameOver('3 crashes!');
            else if (self.inputBuffer) { const b = self.inputBuffer; self.inputBuffer = null; self.toggleLight(b); }
        }, CONFIG.TIMING.CRASH_SEQUENCE_MS);
    }
    checkInactivity() {
        const el = Date.now() - this.lastInputTime;
        if (el > CONFIG.TIMING.MALFUNCTION_WARNING_MS) {
            const p = Math.min(1, (el - CONFIG.TIMING.MALFUNCTION_WARNING_MS) / (CONFIG.TIMING.INACTIVITY_DEATH_MS - CONFIG.TIMING.MALFUNCTION_WARNING_MS));
            this.malfunctionBar.width = 100 * p; this.malfunctionText.setText('MALFUNCTION!');
            if (p > 0.75) this.malfunctionText.setAlpha(Math.sin(Date.now()/100)*0.5+0.5);
        } else { this.malfunctionBar.width = 0; this.malfunctionText.setText(''); }
        if (el >= CONFIG.TIMING.INACTIVITY_DEATH_MS) this.triggerChainCrash();
    }
    checkAllRedComboReset() {
        const allRed = !this.lights.N && !this.lights.S && !this.lights.E && !this.lights.W;
        if (allRed) { if (!this.allRedStartTime) this.allRedStartTime = Date.now(); if (Date.now()-this.allRedStartTime > CONFIG.TIMING.COMBO_RESET_DELAY_MS) GameState.combo = 0; }
        else this.allRedStartTime = 0;
    }
    triggerChainCrash() {
        this.gameOver = true;
        ['N','S','E','W'].forEach(d => { this.lights[d] = true; this.lightBtns[d].setTexture('light_green'); });
        this.activeCars.forEach(c => { c.stopped = false; });
        this.cameras.main.shake(600, 0.02); CrashEffects.spawnDebris(this, this.cx, this.cy, 24); CrashEffects.screenFlash(this, 0xFFFFFF);
        const tint = this.add.rectangle(this.cx, this.cy, this.scale.width, this.scale.height, 0xFF1744, 0).setDepth(24);
        this.tweens.add({ targets: tint, alpha: 0.3, duration: 1000 });
        const self = this; setTimeout(function() { self.triggerGameOver('MALFUNCTION!'); }, 1500);
    }
    triggerGameOver(cause) {
        this.gameOver = true; if (this.spawnEvent) this.spawnEvent.destroy();
        const hs = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE)||'0'), isNew = GameState.score > hs;
        if (isNew) localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, GameState.score);
        const ps = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE)||'0');
        if (GameState.stage > ps) localStorage.setItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE, GameState.stage);
        const pc = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_COMBO)||'0');
        if (GameState.bestCombo > pc) localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_COMBO, GameState.bestCombo);
        localStorage.setItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED, parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED)||'0')+1);
        this.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage, combo: GameState.bestCombo, carsSaved: GameState.totalCarsSaved, cause, isNewHigh: isNew, highScore: Math.max(hs, GameState.score) });
    }
}
