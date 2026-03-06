// game.js - GameScene: core gameplay, drag-drop, scoring, dish completion

var GameScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function GameScene() {
        Phaser.Scene.call(this, { key: 'GameScene' });
    },

    create: function() {
        this.state = {
            score: 0, lives: 3, stage: 1, combo: 0, bestCombo: 0,
            slotsFilled: 0, sabotageCount: 0, totalSabotages: 0,
            dishesCompleted: 0, gameOver: false, isDragging: false,
            recipeTimeLeft: 0, recipeTimeMax: 0, stageTransitioning: false,
            paused: false, restFreeTime: 0
        };
        this.slots = []; this.slotContents = [];
        this.beltIngredients = []; this.recentNormalCount = 0;
        this.judgeDir = 1; this.judgePaused = false; this.judgePauseTimer = 0;
        this.glanceActive = false; this.glanceTimer = 0;
        this.spawnTimer = 0; this.dragTarget = null;

        this.stageParams = generateStageParams(1);
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        this.createStation();
        this.createBelt();
        this.createJudge();
        this.createTimerBar();
        this.setupDrag();

        this.state.recipeTimeMax = this.stageParams.recipeTimer;
        this.state.recipeTimeLeft = this.stageParams.recipeTimer;
        this.scene.launch('UIScene');
        if (this.stageParams.isRest) { this.state.restFreeTime = 3.0; }
    },

    createStation: function() {
        var positions = getSlotPositions();
        this.stationBg = this.add.rectangle(DIMENSIONS.WIDTH / 2,
            DIMENSIONS.STATION_Y + DIMENSIONS.STATION_H / 2,
            DIMENSIONS.WIDTH - 20, DIMENSIONS.STATION_H, 0xFFF8E7).setStrokeStyle(2, 0xB0C4DE);
        for (var i = 0; i < 4; i++) {
            var slot = this.add.image(positions[i].x, positions[i].y, 'slot_empty').setDepth(1);
            slot.slotIndex = i; slot.filled = false;
            this.slots.push(slot); this.slotContents.push(null);
        }
    },

    createBelt: function() {
        this.beltBg = this.add.rectangle(DIMENSIONS.WIDTH / 2,
            DIMENSIONS.BELT_Y + DIMENSIONS.BELT_H / 2, DIMENSIONS.WIDTH, DIMENSIONS.BELT_H, 0x3A3A3A);
        this.beltLines = [];
        for (var i = 0; i < 3; i++) {
            var ly = DIMENSIONS.BELT_Y + 30 + i * 35;
            this.beltLines.push(this.add.rectangle(DIMENSIONS.WIDTH / 2, ly, DIMENSIONS.WIDTH, 1, 0x555555));
        }
        this.spawnInitialIngredients();
    },

    spawnInitialIngredients: function() {
        var spacing = this.stageParams.ingredientSpacing;
        for (var x = 50; x < DIMENSIONS.WIDTH + 50; x += spacing) {
            this.spawnIngredient(x);
        }
    },

    spawnIngredient: function(xPos) {
        var type = generateBeltIngredient(this.stageParams.sabotageRatio, this.recentNormalCount);
        if (!type.isSabotage) { this.recentNormalCount = 0; } else { this.recentNormalCount++; }
        var ing = this.add.image(xPos, DIMENSIONS.BELT_Y + DIMENSIONS.BELT_H / 2, type.svgKey)
            .setInteractive({ draggable: false, useHandCursor: true }).setDepth(5);
        ing.ingredientType = type; ing.onBelt = true;
        ing.setDisplaySize(DIMENSIONS.INGREDIENT_SIZE, DIMENSIONS.INGREDIENT_SIZE);
        this.beltIngredients.push(ing);
        this.input.setDraggable(ing);
        return ing;
    },

    createJudge: function() {
        this.judge = this.add.image(DIMENSIONS.WIDTH / 2, DIMENSIONS.JUDGE_Y, 'judge').setDepth(10);
        this.judge.setDisplaySize(DIMENSIONS.JUDGE_W, DIMENSIONS.JUDGE_H);
        this.judgeX = DIMENSIONS.WIDTH / 2;
        // Use a persistent Graphics object for vision cones (avoids GC pressure from destroy/recreate each frame)
        this.visionGfx = this.add.graphics().setDepth(9);
    },

    createTimerBar: function() {
        this.timerBg = this.add.rectangle(DIMENSIONS.WIDTH / 2,
            DIMENSIONS.TIMER_Y + DIMENSIONS.TIMER_H / 2,
            DIMENSIONS.WIDTH - 20, DIMENSIONS.TIMER_H, 0x333333).setDepth(1);
        this.timerBar = this.add.rectangle(10,
            DIMENSIONS.TIMER_Y + DIMENSIONS.TIMER_H / 2,
            DIMENSIONS.WIDTH - 20, DIMENSIONS.TIMER_H - 4, 0x00E676).setDepth(2);
        this.timerBar.setOrigin(0, 0.5);
    },

    setupDrag: function() {
        var self = this;
        this.input.on('dragstart', function(pointer, obj) {
            if (self.state.gameOver || self.state.paused || self.state.stageTransitioning) return;
            if (self.state.isDragging || !obj.onBelt) return;
            self.state.isDragging = true; self.dragTarget = obj;
            obj.onBelt = false; obj.setDepth(20);
            self.tweens.add({ targets: obj, scaleX: 1.2, scaleY: 1.2, duration: 80 });
        });
        this.input.on('drag', function(pointer, obj, dragX, dragY) {
            if (obj !== self.dragTarget) return;
            obj.x = dragX; obj.y = dragY;
            self.highlightNearSlot(dragX, dragY);
        });
        this.input.on('dragend', function(pointer, obj) {
            if (obj !== self.dragTarget) return;
            self.state.isDragging = false; self.dragTarget = null;
            self.clearSlotHighlights();
            obj.setDepth(5);
            self.tweens.add({ targets: obj, scaleX: 1, scaleY: 1, duration: 80 });
            var slotIdx = self.findNearestEmptySlot(obj.x, obj.y);
            if (slotIdx >= 0) { self.placeIngredient(obj, slotIdx); }
            else { self.returnToBelt(obj); }
        });
    },

    highlightNearSlot: function(x, y) {
        var positions = getSlotPositions();
        for (var i = 0; i < 4; i++) {
            if (this.slots[i].filled) continue;
            var dx = x - positions[i].x, dy = y - positions[i].y;
            if (Math.sqrt(dx*dx+dy*dy) < DIMENSIONS.SNAP_DIST) { this.slots[i].setTint(0x00E676); }
            else { this.slots[i].clearTint(); }
        }
    },

    clearSlotHighlights: function() {
        for (var i = 0; i < 4; i++) this.slots[i].clearTint();
    },

    findNearestEmptySlot: function(x, y) {
        var positions = getSlotPositions();
        var bestDist = DIMENSIONS.SNAP_DIST + 1, bestIdx = -1;
        for (var i = 0; i < 4; i++) {
            if (this.slots[i].filled) continue;
            var dx = x - positions[i].x, dy = y - positions[i].y;
            var dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        }
        return bestIdx;
    },

    placeIngredient: function(obj, slotIdx) {
        var pos = getSlotPositions()[slotIdx];
        var isSab = obj.ingredientType.isSabotage;
        var idx = this.beltIngredients.indexOf(obj);
        if (idx >= 0) this.beltIngredients.splice(idx, 1);
        obj.x = pos.x; obj.y = pos.y; obj.setDepth(3);
        this.slots[slotIdx].filled = true;
        this.slotContents[slotIdx] = obj;
        this.state.slotsFilled++;
        this.state.recipeTimeLeft = this.state.recipeTimeMax;

        if (isSab) {
            var caught = this.checkJudgeVision(pos.x, pos.y);
            if (caught && this.state.restFreeTime <= 0) { this.catchSabotage(slotIdx, obj); }
            else { this.awardSabotage(slotIdx, obj, pos); }
        } else { this.awardNormal(pos); }

        if (this.state.slotsFilled >= 4 && !this.state.gameOver) this.completeDish();
    },

    returnToBelt: function(obj) {
        obj.onBelt = true;
        this.tweens.add({ targets: obj, y: DIMENSIONS.BELT_Y + DIMENSIONS.BELT_H / 2, duration: 200 });
    },

    awardSabotage: function(slotIdx, obj, pos) {
        this.state.sabotageCount++; this.state.totalSabotages++; this.state.combo++;
        if (this.state.combo > this.state.bestCombo) this.state.bestCombo = this.state.combo;
        var ci = Math.min(this.state.combo - 1, SCORING.COMBO_MULTIPLIERS.length - 1);
        var pts = Math.floor(SCORING.SABOTAGE_PLACE * SCORING.COMBO_MULTIPLIERS[ci]);
        var jx = this.judgeX + this.judgeDir * 15;
        if (Math.abs(pos.x - jx) < this.stageParams.coneWidth / 2 + SCORING.CLOSE_CALL_DIST) {
            pts += SCORING.CLOSE_CALL_BONUS;
            this.showFloatingText(pos.x, pos.y - 30, 'CLOSE CALL!', COLORS.COMBO_GOLD, 18, 500);
        }
        this.state.score += pts;
        this.showFloatingText(pos.x, pos.y - 10, '+' + pts, COLORS.SUCCESS, 22, 700);
        this.showFloatingText(pos.x, pos.y + 20, 'SNEAK!', COLORS.SUCCESS, 24, 500);
        this.createBurst(pos.x, pos.y, Math.min(12 + (this.state.combo - 1) * 3, 30), 0x7FFF00);
        this.cameras.main.shake(100, 0.008 + Math.min(this.state.combo, 5) * 0.002);
        this.events.emit('scoreUpdate'); this.events.emit('comboUpdate');
    },

    awardNormal: function(pos) {
        this.state.score += SCORING.NORMAL_PLACE;
        this.showFloatingText(pos.x, pos.y - 10, '+' + SCORING.NORMAL_PLACE, COLORS.HUD_TEXT, 18, 600);
        this.events.emit('scoreUpdate');
    },

    catchSabotage: function(slotIdx, obj) {
        this.slots[slotIdx].filled = false; this.slotContents[slotIdx] = null; this.state.slotsFilled--;
        this.tweens.add({
            targets: obj, x: obj.x, y: DIMENSIONS.BELT_Y + DIMENSIONS.BELT_H / 2,
            angle: 720, duration: 300, onComplete: function() { obj.destroy(); }
        });
        this.showFloatingText(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2 - 40, 'CAUGHT!', COLORS.DANGER, 36, 800);
        if (this.state.combo > 0) {
            this.showFloatingText(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2, 'x' + this.state.combo + ' COMBO LOST!', COLORS.DANGER, 20, 600);
        }
        this.state.combo = 0;
        this.cameras.main.shake(300, 0.025);
        this.cameras.main.flash(200, 255, 45, 45, false);
        this.tweens.add({ targets: this.judge, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
        this.loseLife(); this.events.emit('comboUpdate');
    },

    loseLife: function() {
        this.state.lives--; this.events.emit('livesUpdate');
        if (this.state.lives <= 0) {
            this.state.gameOver = true;
            var self = this;
            this.cameras.main.shake(400, 0.03);
            this.time.delayedCall(600, function() {
                if (self.scene) {
                    self.scene.pause();
                    self.scene.launch('GameOverScene', self.getEndData());
                }
            });
        }
    },

    completeDish: function() {
        if (this.state.stageTransitioning) return;
        this.state.stageTransitioning = true; this.state.dishesCompleted++;
        var sc = this.state.sabotageCount;
        var bonusArr = [SCORING.DISH_0_SAB, SCORING.DISH_1_SAB, SCORING.DISH_2_SAB, SCORING.DISH_3_SAB, SCORING.DISH_4_SAB];
        var dishPts = Math.floor(bonusArr[Math.min(sc, 4)] * SCORING.DISH_MULTIPLIERS[Math.min(sc, 4)]);
        if (this.stageParams.isBoss) dishPts += SCORING.BOSS_BONUS;
        this.state.score += dishPts;
        if (sc >= 4) {
            this.showFloatingText(DIMENSIONS.WIDTH / 2, 180, 'FULL SABOTAGE!', COLORS.COMBO_GOLD, 40, 1200);
            this.createBurst(DIMENSIONS.WIDTH / 2, 150, 30, 0x7FFF00);
            this.cameras.main.flash(150, 127, 255, 0, false);
        } else {
            this.showFloatingText(DIMENSIONS.WIDTH / 2, 180, '+' + dishPts + ' DISH!', COLORS.COMBO_GOLD, 26, 900);
        }
        this.events.emit('scoreUpdate');
        var self = this;
        this.time.delayedCall(500, function() { self.transitionToNextStage(); });
    },

    getEndData: function() {
        return { score: this.state.score, dishes: this.state.dishesCompleted,
            bestCombo: this.state.bestCombo, totalSabotages: this.state.totalSabotages, stage: this.state.stage };
    },

    // Methods delegated to stages.js (loaded after game.js)
    update: function(time, delta) { _gsUpdate.call(this, time, delta); },
    checkJudgeVision: function(sx, sy) { return _gsCheckJudgeVision.call(this, sx, sy); },
    transitionToNextStage: function() { _gsTransitionToNextStage.call(this); },
    showFloatingText: function(x, y, t, c, s, d) { _gsShowFloatingText.call(this, x, y, t, c, s, d); },
    createBurst: function(x, y, n, c) { _gsCreateBurst.call(this, x, y, n, c); }
});
