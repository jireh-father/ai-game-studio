// game.js - GameScene: drag-sort, bins, strikes, stages

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        resetGameState();
        this.gameOver = false;
        this.inspectorActive = false;
        this.stageTransitioning = false;
        this.lastInputTime = Date.now();
        this.lastItemId = null;
        this.stageMistakes = 0;
        this.stageTimeLeft = GAME_CONFIG.stageDuration;
        this.fallingItems = [];
        this.binSprites = [];
        this.binPositions = [];
        this.swapEvents = [];

        // Background
        this.bgRect = this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8E1);
        this.floorRect = this.add.rectangle(W / 2, H - 80, W, 160, 0x8D6E63);

        // Degradation overlays
        this.stain1 = this.add.circle(80, 200, 20, 0xBCAAA4, 0.4).setVisible(false);
        this.stain2 = this.add.circle(250, 300, 30, 0xA1887F, 0.3).setVisible(false);
        this.crack = this.add.graphics().setVisible(false);
        this.crack.lineStyle(2, 0x5D4037);
        this.crack.beginPath(); this.crack.moveTo(200, 100);
        this.crack.lineTo(220, 150); this.crack.lineTo(210, 200); this.crack.strokePath();

        this.setupBins();
        this.setupDrag();
        this.startStage();
        this.scene.launch('UIScene');

        // Red flash overlay
        this.redFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xFF0000, 0).setDepth(50);
        // Condemned stamp
        if (this.textures.exists('condemned')) {
            this.condemnedStamp = this.add.image(W / 2, H / 2 - 60, 'condemned')
                .setScale(3).setAlpha(0).setDepth(60).setAngle(-15);
        }
        // Inspector
        if (this.textures.exists('inspector')) {
            this.inspectorSprite = this.add.image(W + 40, H / 2, 'inspector')
                .setScale(2).setDepth(55).setVisible(false);
        }

        this._onVis = () => { if (document.hidden && !this.gameOver) this.scene.pause(); };
        document.addEventListener('visibilitychange', this._onVis);
    }

    setupBins() {
        this.binSprites.forEach(b => { b.sprite.destroy(); b.label.destroy(); });
        this.binSprites = [];
        getBinLayout(GameState.stage, GAME_CONFIG.width).forEach(pos => {
            const key = 'bin_' + pos.cat;
            const spr = this.textures.exists(key) ? this.add.image(pos.x, pos.y, key).setScale(2).setDepth(5)
                : this.add.rectangle(pos.x, pos.y, 80, 70, Phaser.Display.Color.HexStringToColor(COLORS[pos.cat]||'#888').color).setDepth(5);
            const lbl = this.add.text(pos.x, pos.y + 42, pos.cat.toUpperCase(), { fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(6);
            this.binSprites.push({ sprite: spr, label: lbl, cat: pos.cat, x: pos.x, y: pos.y });
        });
        this.swapEvents = generateBinSwapSequence(GameState.stage, GAME_CONFIG.stageDuration);
    }

    setupDrag() {
        this.input.on('dragstart', (p, o) => { this.lastInputTime = Date.now(); o.setDepth(20); this.tweens.add({ targets: o, scaleX: 1.3, scaleY: 1.3, duration: 60 }); if (GameState.settings.sound) playSound('grab'); try { navigator.vibrate(15); } catch(e) {} });
        this.input.on('drag', (p, o, dx, dy) => { this.lastInputTime = Date.now(); o.x = Phaser.Math.Clamp(dx, 20, GAME_CONFIG.width - 20); o.y = Phaser.Math.Clamp(dy, 50, GAME_CONFIG.height - 20); o.isFalling = false; });
        this.input.on('dragend', (p, o) => { this.lastInputTime = Date.now(); o.setDepth(10); this.tweens.add({ targets: o, scaleX: 1.1, scaleY: 1.1, duration: 40 }); const b = this.findClosestBin(o.x, o.y); if (b) this.sortItem(o, b); else o.isFalling = true; });
    }

    findClosestBin(x, y) {
        const tol = GAME_CONFIG.binOverlapTolerance;
        let closest = null, minD = Infinity;
        for (const bin of this.binSprites) {
            if (Math.abs(x - bin.x) < 44 + tol && Math.abs(y - bin.y) < 40 + tol) {
                const d = Phaser.Math.Distance.Between(x, y, bin.x, bin.y);
                if (d < minD) { minD = d; closest = bin; }
            }
        }
        return closest;
    }

    sortItem(spr, bin) {
        const data = spr.itemData;
        const correct = data.category === bin.cat;
        this.removeItem(spr);
        if (correct) this.correctSort(spr, bin, data);
        else this.wrongSort(spr, bin, data);
    }

    correctSort(spr, bin, data) {
        GameState.combo++;
        const m = Math.min(GameState.combo, SCORING.comboMultiplierCap);
        let pts = SCORING.correct * m;
        if (spr.spawnTime && Date.now() - spr.spawnTime < GAME_CONFIG.quickSortTime) pts = SCORING.quickSort * m;
        if (data.trick) pts = Math.max(pts, SCORING.trickBonus * m);
        if (data.ambiguous) pts = Math.max(pts, SCORING.ambiguousBonus * m);
        GameState.score += pts;
        this.events.emit('scoreUpdate', GameState.score);
        this.events.emit('comboUpdate', GameState.combo);
        this.tweens.add({ targets: bin.sprite, scaleX: 2.3, scaleY: 2.3, duration: 80, yoyo: true });
        this.cameras.main.shake(100, 0.003 + GameState.combo * 0.001);
        spawnParticles(this, bin.x, bin.y - 20, Math.min(30, 12 + GameState.combo * 3), Phaser.Display.Color.HexStringToColor(COLORS[bin.cat]||'#FFF').color);
        this.tweens.add({ targets: spr, scaleX: 0.3, scaleY: 0.3, alpha: 0, x: bin.x, y: bin.y, duration: 120, onComplete: () => spr.destroy() });
        this.events.emit('floatingScore', bin.x, bin.y - 50, pts, COLORS[bin.cat]||'#FFF');
        if (GameState.settings.sound) playSound('correct', GameState.combo);
    }

    wrongSort(spr, bin) {
        GameState.combo = 0; GameState.strikes++; this.stageMistakes++;
        this.events.emit('strikeUpdate');
        this.events.emit('comboUpdate', 0);
        this.updateDegradation();
        this.tweens.add({ targets: spr, y: spr.y - 80, angle: 360, duration: 200, onComplete: () => spr.destroy() });
        const ox = bin.sprite.x;
        this.tweens.add({ targets: [bin.sprite, bin.label], x: ox - 4, duration: 50, yoyo: true, repeat: 3,
            onComplete: () => { bin.sprite.x = ox; bin.label.x = ox; } });
        this.redFlash.setAlpha(0.3);
        this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 200 });
        this.cameras.main.shake(300, 0.006);
        if (GameState.settings.sound) playSound('wrong');
        try { navigator.vibrate(100); } catch(e) {}
        if (GameState.strikes >= GAME_CONFIG.strikeLimit) this.triggerCondemned('strikes');
    }

    startStage() {
        const diff = calculateDifficulty(GameState.stage);
        this.currentDifficulty = diff;
        this.stageMistakes = 0;
        this.stageTimeLeft = GAME_CONFIG.stageDuration;
        this.events.emit('stageUpdate', GameState.stage);
        this.setupBins();
        if (this.spawnEvent) this.spawnEvent.destroy();
        const interval = getSpawnInterval(GameState.stage, diff);
        this.spawnEvent = this.time.addEvent({ delay: interval, loop: true, callback: () => this.spawnItem() });
        this.spawnItem();
    }

    spawnItem() {
        if (this.gameOver) return;
        const diff = this.currentDifficulty;
        if (this.fallingItems.filter(i => i.active).length >= diff.maxSimultaneous) return;
        const pool = getItemPool(GameState.stage, diff);
        const itemData = selectItem(pool, this.lastItemId, diff);
        this.lastItemId = itemData.id;
        const x = 40 + Math.random() * (GAME_CONFIG.width - 80);
        const key = 'item_' + itemData.id;
        const spr = this.textures.exists(key)
            ? this.add.image(x, -20, key).setScale(1.1).setDepth(10)
            : this.add.rectangle(x, -20, 35, 40, 0xCCCCCC).setDepth(10);
        spr.setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(spr);
        spr.itemData = itemData; spr.isFalling = true;
        spr.fallSpeed = getFallSpeed(GameState.stage, diff); spr.spawnTime = Date.now();
        this.fallingItems.push(spr);
    }

    removeItem(spr) {
        spr.isFalling = false; spr.disableInteractive();
        const i = this.fallingItems.indexOf(spr);
        if (i >= 0) this.fallingItems.splice(i, 1);
    }

    floorHit(spr) {
        this.removeItem(spr);
        GameState.combo = 0; GameState.strikes++; this.stageMistakes++;
        this.events.emit('strikeUpdate'); this.events.emit('comboUpdate', 0);
        this.updateDegradation();
        this.tweens.add({ targets: spr, scaleX: 1.8, scaleY: 0.3, alpha: 0, duration: 150, onComplete: () => spr.destroy() });
        spawnParticles(this, spr.x, spr.y, 8, 0x8D6E63);
        this.cameras.main.shake(150, 0.004);
        if (GameState.settings.sound) playSound('splat');
        if (GameState.strikes >= GAME_CONFIG.strikeLimit) this.triggerCondemned('strikes');
    }

    updateDegradation() {
        if (GameState.strikes >= 1) { this.stain1.setVisible(true); this.bgRect.setFillStyle(0xE8D5A3); }
        if (GameState.strikes >= 2) { this.stain2.setVisible(true); this.crack.setVisible(true); }
    }

    triggerCondemned(reason) {
        if (this.gameOver) return;
        this.gameOver = true;
        if (this.spawnEvent) this.spawnEvent.destroy();
        this.fallingItems.forEach(i => { if (i.active) i.destroy(); });
        this.fallingItems = [];
        this.bgRect.setFillStyle(0x5D4037);
        this.cameras.main.shake(500, 0.012);
        this.redFlash.setAlpha(0.5);
        this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 400 });
        if (this.condemnedStamp) {
            this.condemnedStamp.setAlpha(1).setScale(3).setAngle(-15);
            this.tweens.add({ targets: this.condemnedStamp, scaleX: 1.5, scaleY: 1.5, angle: -8, duration: 400, ease: 'Bounce.easeOut' });
        }
        if (GameState.settings.sound) playSound('condemned');
        try { navigator.vibrate([100, 50, 200]); } catch(e) {}
        this.events.emit('gameOver', { reason });
    }

    triggerInspector() {
        if (this.gameOver || this.inspectorActive) return;
        this.inspectorActive = true;
        if (this.spawnEvent) this.spawnEvent.destroy();
        if (this.inspectorSprite) {
            this.inspectorSprite.setVisible(true);
            this.tweens.add({ targets: this.inspectorSprite, x: GAME_CONFIG.width / 2, duration: 500, ease: 'Power2',
                onComplete: () => this.triggerCondemned('inactivity') });
        } else { this.triggerCondemned('inactivity'); }
        if (GameState.settings.sound) playSound('inspector');
    }

    resumeFromContinue() {
        this.gameOver = false; this.inspectorActive = false; this.stageTransitioning = false; this.lastInputTime = Date.now();
        this.updateDegradation();
        if (this.condemnedStamp) this.condemnedStamp.setAlpha(0);
        this.bgRect.setFillStyle(GameState.strikes >= 1 ? 0xE8D5A3 : 0xFFF8E1);
        this.startStage();
    }

    advanceStage() {
        this.stageTransitioning = true;
        if (this.spawnEvent) this.spawnEvent.destroy();
        this.fallingItems.forEach(i => { if (i.active) i.destroy(); });
        this.fallingItems = [];
        const perfect = this.stageMistakes === 0;
        if (perfect) { GameState.score += SCORING.perfectStage; this.events.emit('scoreUpdate', GameState.score); }
        this.events.emit('stageClear', perfect);
        this.binSprites.forEach(b => this.tweens.add({ targets: b.sprite, y: b.y - 15, duration: 200, yoyo: true }));
        if (GameState.settings.sound) playSound('stageClear');
        GameState.stage++;
        this.time.delayedCall(1500, () => { this.stageTransitioning = false; if (!this.gameOver) this.startStage(); });
    }

    update(time, delta) {
        if (this.gameOver) return;
        for (let i = this.fallingItems.length - 1; i >= 0; i--) {
            const it = this.fallingItems[i];
            if (!it.active) { this.fallingItems.splice(i, 1); continue; }
            if (it.isFalling) {
                it.y += (it.fallSpeed * delta) / 1000;
                if (it.y > GAME_CONFIG.height - 160) this.floorHit(it);
            }
        }
        this.stageTimeLeft -= delta;
        this.events.emit('timerUpdate', Math.max(0, this.stageTimeLeft / GAME_CONFIG.stageDuration));
        if (this.stageTimeLeft <= 0 && !this.stageTransitioning) this.advanceStage();

        // Bin swaps
        const elapsed = GAME_CONFIG.stageDuration - this.stageTimeLeft;
        while (this.swapEvents.length > 0 && this.swapEvents[0].time <= elapsed) {
            const sw = this.swapEvents.shift();
            this.performBinSwap(sw.indexA, sw.indexB);
        }
        // Bin sliding
        if (this.currentDifficulty && this.currentDifficulty.binMovement === 'slide') {
            const t = time / 1000;
            this.binSprites.forEach((b, i) => {
                const off = Math.sin(t * 0.8 + i * 1.5) * 20;
                b.sprite.x = b.x + off; b.label.x = b.x + off;
            });
        }
        // Inactivity
        if (Date.now() - this.lastInputTime > GAME_CONFIG.inactivityTimeout) this.triggerInspector();
    }

    performBinSwap(a, b) {
        if (a >= this.binSprites.length || b >= this.binSprites.length) return;
        const ba = this.binSprites[a], bb = this.binSprites[b];
        const tx = ba.x, ty = ba.y; ba.x = bb.x; ba.y = bb.y; bb.x = tx; bb.y = ty;
        this.tweens.add({ targets: [ba.sprite, ba.label], x: ba.x, y: ba.y, duration: 300 });
        this.tweens.add({ targets: [bb.sprite, bb.label], x: bb.x, y: bb.y, duration: 300 });
        if (GameState.settings.sound) playSound('swap');
    }

    shutdown() { document.removeEventListener('visibilitychange', this._onVis); }
}

function spawnParticles(scene, x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 / count) * i, spd = 80 + Math.random() * 150;
        const p = scene.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(30);
        scene.tweens.add({
            targets: p, x: x + Math.cos(a) * spd, y: y + Math.sin(a) * spd,
            alpha: 0, scaleX: 0, scaleY: 0, duration: 350 + Math.random() * 100,
            onComplete: () => p.destroy()
        });
    }
}
